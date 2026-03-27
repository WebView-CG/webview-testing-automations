/**
 * Android WebView test against collector.openwebdocs.org
 * Uses direct CDP WebSocket connection
 */

import { test, expect } from '@playwright/test';
import {
  getConnectedDevices,
  launchAndroidApp,
  connectToWebView,
  getDeviceInfo,
  getWebViewVersion
} from '../../src/android/webview-helper';
import { createTestResult, sleep } from '../../src/common/utils';
import * as fs from 'fs/promises';
import * as path from 'path';

const PACKAGE_NAME = 'com.caniwebview.android';
const ACTIVITY_NAME = `${PACKAGE_NAME}.MainActivity`;
const TEST_URL = 'https://collector.openwebdocs.org/';

test.describe('Android WebView - collector.openwebdocs.org', () => {
  let deviceId: string;
  let testResult: ReturnType<typeof createTestResult>;
  
  test.beforeAll(async () => {
    // Get connected device
    const devices = await getConnectedDevices();
    if (devices.length === 0) {
      throw new Error('No Android devices connected. Please connect a device or start an emulator.');
    }
    deviceId = devices[0];
    console.log(`Using device: ${deviceId}`);
    
    // Initialize test result
    testResult = createTestResult('android');
    
    // Get device info
    const deviceInfo = await getDeviceInfo(deviceId);
    testResult.osVersion = deviceInfo['ro.build.version.release'] || 'unknown';
    testResult.deviceModel = `${deviceInfo['ro.product.manufacturer']} ${deviceInfo['ro.product.model']}`.trim();
    testResult.webviewVersion = await getWebViewVersion(deviceId);
    testResult.testUrl = TEST_URL;
    
    console.log('Device Info:', {
      model: testResult.deviceModel,
      osVersion: testResult.osVersion,
      webviewVersion: testResult.webviewVersion
    });
  });
  
  test.afterAll(async () => {
    // Save results
    const resultsDir = path.join(process.cwd(), 'test-results');
    await fs.mkdir(resultsDir, { recursive: true });
    const resultsPath = path.join(resultsDir, 'android-results.json');
    await fs.writeFile(resultsPath, JSON.stringify(testResult, null, 2));
    console.log(`Results saved to: ${resultsPath}`);
  });

  test('should load collector page in WebView', async () => {
    const startTime = Date.now();
    
    try {
      // Launch app
      await launchAndroidApp(deviceId, PACKAGE_NAME, ACTIVITY_NAME);
      
      // Wait for WebView to be ready
      await sleep(5000);
      
      // Connect to WebView (CDP client)
      const cdp = await connectToWebView(deviceId, PACKAGE_NAME);
      
      // Get current URL
      const { result: { url } } = await cdp.send('Page.getNavigationHistory');
      console.log(`Current URL: ${url || 'unknown'}`);
      
      // Navigate if needed
      if (!url || !url.includes('collector.openwebdocs.org')) {
        await cdp.send('Page.navigate', { url: TEST_URL });
        await sleep(3000);
      }
      
      // Get page title
      const { result } = await cdp.send('Runtime.evaluate', {
        expression: 'document.title',
        returnByValue: true
      });
      const title = result.value;
      console.log('Page title:', title);
      
      expect(title).toBeTruthy();
      
      // Take screenshot
      const { data: screenshotData } = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false
      });
      
      await fs.writeFile('test-results/android-collector-page.png', Buffer.from(screenshotData, 'base64'));
      
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
      const cdp = await connectToWebView(deviceId, PACKAGE_NAME);
      
      // Check URL
      const { result: { url } } = await cdp.send('Page.getNavigationHistory');
      
      if (!url || !url.includes('collector.openwebdocs.org')) {
        await cdp.send('Page.navigate', { url: TEST_URL });
        await sleep(5000);
      }
      
      // Wait for collector to run
      await sleep(10000);
      
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
      const cdp = await connectToWebView(deviceId, PACKAGE_NAME);
      
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
