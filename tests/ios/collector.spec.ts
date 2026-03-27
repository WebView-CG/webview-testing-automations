/**
 * iOS WKWebView test against collector.openwebdocs.org
 * Uses ios-webkit-debug-proxy for remote debugging
 */

import { test, expect } from '@playwright/test';
import {
  getBootedSimulators,
  bootSimulator,
  launchIOSApp,
  getDeviceInfo,
  getIOSVersion,
  connectToWKWebView,
  isProxyRunning,
  startProxy
} from '../../src/ios/webview-helper';
import { createTestResult, sleep } from '../../src/common/utils';
import * as fs from 'fs/promises';
import * as path from 'path';

const BUNDLE_ID = 'com.caniwebview.wkwebview';
const TEST_URL = 'https://collector.openwebdocs.org/';
const PROXY_PORT = 9222;

test.describe('iOS WKWebView - collector.openwebdocs.org', () => {
  let udid: string;
  let testResult: ReturnType<typeof createTestResult> | null = null;
  let proxyHandle: { stop: () => void } | null = null;
  
  test.beforeAll(async () => {
    // Initialize test result early
    testResult = createTestResult('ios');
    
    // Get booted simulator
    const simulators = await getBootedSimulators();
    
    if (simulators.length === 0) {
      throw new Error(
        'No iOS simulator is booted. Start a simulator first:\n' +
        'open -a Simulator\n' +
        'Or use: xcrun simctl boot <UDID>'
      );
    }
    
    udid = simulators[0].udid;
    console.log(`Using simulator: ${udid} (${simulators[0].name})`);
    
    // Update test result with device info
    const deviceInfo = await getDeviceInfo(udid);
    testResult.osVersion = deviceInfo.ios_version || 'unknown';
    testResult.deviceModel = deviceInfo.name || 'unknown';
    testResult.webviewVersion = `iOS ${testResult.osVersion} WebKit`;
    testResult.testUrl = TEST_URL;
    
    console.log('Simulator Info:', {
      name: testResult.deviceModel,
      osVersion: testResult.osVersion,
      udid
    });
    
    // Check if proxy is running, if not try to start it
    if (!await isProxyRunning(PROXY_PORT)) {
      console.log('ios-webkit-debug-proxy not running, starting it...');
      try {
        proxyHandle = await startProxy(udid, PROXY_PORT);
      } catch (error) {
        console.error('Failed to start proxy:', (error as Error).message);
        console.log('\n⚠️  Please start ios-webkit-debug-proxy manually:');
        console.log(`   ios_webkit_debug_proxy -c ${udid}:${PROXY_PORT} -d\n`);
        throw error;
      }
    } else {
      console.log('✓ ios-webkit-debug-proxy is already running');
    }
    
    console.log('\n⚠️  Prerequisites:');
    console.log('✓ ios-webkit-debug-proxy is running');
    console.log('2. CanIWKWebView app must be installed and running');
    console.log('3. Web Inspector must be enabled in the app\n');
  });
  
  test.afterAll(async () => {
    // Stop proxy if we started it
    if (proxyHandle) {
      console.log('Stopping ios-webkit-debug-proxy...');
      proxyHandle.stop();
    }
    
    // Save results only if testResult was initialized
    if (!testResult) {
      console.log('No test results to save');
      return;
    }
    const resultsDir = path.join(process.cwd(), 'test-results');
    await fs.mkdir(resultsDir, { recursive: true });
    const resultsPath = path.join(resultsDir, 'ios-results.json');
    await fs.writeFile(resultsPath, JSON.stringify(testResult, null, 2));
    console.log(`Results saved to: ${resultsPath}`);
  });

  test('should load collector page in WKWebView', async () => {
    const startTime = Date.now();
    
    try {
      // Try to launch app (will fail gracefully if already running)
      console.log('Launching app...');
      try {
        await launchIOSApp(udid, BUNDLE_ID);
        // Wait for WebView to be ready after launch
        await sleep(5000);
      } catch (launchError) {
        console.log('App may already be running, continuing...');
        // Give it a moment anyway
        await sleep(2000);
      }
      
      // Connect to WKWebView (CDP client)
      const cdp = await connectToWKWebView(udid, BUNDLE_ID, PROXY_PORT);
      
      // Navigate to collector
      console.log(`Navigating to: ${TEST_URL}`);
      await cdp.send('Page.navigate', { url: TEST_URL });
      
      // Wait for navigation
      await sleep(5000);
      
      // Get page title
      const { result } = await cdp.send('Runtime.evaluate', {
        expression: 'document.title',
        returnByValue: true
      });
      const title = result.value;
      console.log('Page title:', title);
      
      // Get URL
      const { result: urlResult } = await cdp.send('Runtime.evaluate', {
        expression: 'window.location.href',
        returnByValue: true
      });
      const url = urlResult.value;
      console.log('Page URL:', url);
      
      expect(title).toBeTruthy();
      
      // Take screenshot
      const { data: screenshotData } = await cdp.send('Page.captureScreenshot', {
        format: 'png'
      });
      
      await fs.writeFile('test-results/ios-collector-page.png', Buffer.from(screenshotData, 'base64'));
      
      testResult.results['page-load'] = {
        status: 'passed',
        duration: Date.now() - startTime,
        data: { title, url }
      };
      
      await cdp.close();
    } catch (error) {
      testResult.results['page-load'] = {
        status: 'failed',
        duration: Date.now() - startTime,
        error: (error as Error).message
      };
      throw error;
    }
  });
  
  test('should collect browser features', async () => {
    const startTime = Date.now();
    
    try {
      const cdp = await connectToWKWebView(udid, BUNDLE_ID, PROXY_PORT);
      
      // Navigate to collector
      await cdp.send('Page.navigate', { url: TEST_URL });
      
      // Wait for collector to run
      await sleep(15000);
      
      // Get collector data
      const { result } = await cdp.send('Runtime.evaluate', {
        expression: `JSON.stringify({
          userAgent: navigator.userAgent,
          features: window.__collector_results || {}
        })`,
        returnByValue: true
      });
      
      const collectorData = JSON.parse(result.value);
      console.log('Collector data:', JSON.stringify(collectorData, null, 2));
      
      testResult.results['feature-collection'] = {
        status: 'passed',
        duration: Date.now() - startTime,
        data: collectorData
      };
      
      await cdp.close();
    } catch (error) {
      testResult.results['feature-collection'] = {
        status: 'failed',
        duration: Date.now() - startTime,
        error: (error as Error).message
      };
      throw error;
    }
  });
  
  test('should test JavaScript execution', async () => {
    const startTime = Date.now();
    
    try {
      const cdp = await connectToWKWebView(udid, BUNDLE_ID, PROXY_PORT);
      
      // Test basic JavaScript features
      const { result } = await cdp.send('Runtime.evaluate', {
        expression: `JSON.stringify({
          localStorage: typeof localStorage !== 'undefined',
          sessionStorage: typeof sessionStorage !== 'undefined',
          indexedDB: typeof indexedDB !== 'undefined',
          fetch: typeof fetch !== 'undefined',
          promise: typeof Promise !== 'undefined',
          asyncAwait: true,
          serviceWorker: 'serviceWorker' in navigator,
          webgl: (() => {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
          })()
        })`,
        returnByValue: true
      });
      
      const jsTests = JSON.parse(result.value);
      console.log('JavaScript features:', jsTests);
      
      testResult.results['javascript-features'] = {
        status: 'passed',
        duration: Date.now() - startTime,
        data: jsTests
      };
      
      await cdp.close();
    } catch (error) {
      testResult.results['javascript-features'] = {
        status: 'failed',
        duration: Date.now() - startTime,
        error: (error as Error).message
      };
      throw error;
    }
  });
});
