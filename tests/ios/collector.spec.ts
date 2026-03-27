/**
 * iOS WKWebView test against collector.openwebdocs.org
 * Uses Appium + XCUITest for simulator automation
 */

import { test, expect } from '@playwright/test';
import { startAppium, stopAppium, connectToIOSWebView } from '../../src/ios/appium-helper';
import { getBootedSimulators, getDeviceInfo } from '../../src/ios/webview-helper';
import { createTestResult } from '../../src/common/utils';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { Browser } from 'webdriverio';

const BUNDLE_ID = 'com.caniwebview.wkwebview';
const TEST_URL = 'https://collector.openwebdocs.org/';
const APPIUM_PORT = 4723;

test.describe('iOS WKWebView - collector.openwebdocs.org', () => {
  let udid: string;
  let driver: Browser<'async'> | null = null;
  let testResult: ReturnType<typeof createTestResult> | null = null;
  
  test.beforeAll(async () => {
    testResult = createTestResult('ios');
    
    // Get booted simulator
    const simulators = await getBootedSimulators();
    
    if (simulators.length === 0) {
      throw new Error('No iOS simulator is booted');
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
    
    // Start Appium if not running
    await startAppium(APPIUM_PORT);
  });
  
  test.afterAll(async () => {
    if (driver) {
      try {
        await driver.deleteSession();
      } catch (e) {
        console.log('Failed to close driver:', e);
      }
    }
    
    // Save results
    if (testResult) {
      const resultsDir = path.join(process.cwd(), 'test-results');
      await fs.mkdir(resultsDir, { recursive: true });
      const resultsPath = path.join(resultsDir, 'ios-results.json');
      await fs.writeFile(resultsPath, JSON.stringify(testResult, null, 2));
      console.log(`Results saved to: ${resultsPath}`);
    }
  });

  test('should load collector page in WKWebView', async () => {
    const startTime = Date.now();
    
    try {
      // Connect to app's WebView via Appium
      driver = await connectToIOSWebView(udid, BUNDLE_ID, APPIUM_PORT);
      
      // Navigate to test URL
      console.log(`Navigating to: ${TEST_URL}`);
      await driver.url(TEST_URL);
      
      // Wait for page to load
      await driver.pause(5000);
      
      // Get page title
      const title = await driver.getTitle();
      console.log(`Page title: ${title}`);
      
      // Get URL
      const url = await driver.getUrl();
      console.log(`Page URL: ${url}`);
      
      expect(url).toContain('collector.openwebdocs.org');
      
      testResult!.tests.push({
        name: 'Load collector page',
        passed: true,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      testResult!.tests.push({
        name: 'Load collector page',
        passed: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
      });
      throw error;
    }
  });

  test('should collect browser features', async () => {
    const startTime = Date.now();
    
    try {
      if (!driver) {
        driver = await connectToIOSWebView(udid, BUNDLE_ID, APPIUM_PORT);
      }
      
      // Make sure we're on the collector page
      const url = await driver.getUrl();
      if (!url.includes('collector.openwebdocs.org')) {
        await driver.url(TEST_URL);
        await driver.pause(5000);
      }
      
      // Execute JavaScript to get collector data
      const collectorData = await driver.execute(() => {
        // @ts-ignore
        return window.__bcd || { userAgent: navigator.userAgent, features: {} };
      });
      
      console.log('Collector data:', JSON.stringify(collectorData, null, 2));
      
      testResult!.collectorData = collectorData;
      testResult!.tests.push({
        name: 'Collect browser features',
        passed: true,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      testResult!.tests.push({
        name: 'Collect browser features',
        passed: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
      });
      throw error;
    }
  });

  test('should test JavaScript execution', async () => {
    const startTime = Date.now();
    
    try {
      if (!driver) {
        driver = await connectToIOSWebView(udid, BUNDLE_ID, APPIUM_PORT);
      }
      
      // Test various JavaScript features
      const jsFeatures = await driver.execute(() => {
        return {
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
          })(),
        };
      });
      
      console.log('JavaScript features:', jsFeatures);
      
      expect(jsFeatures.localStorage).toBe(true);
      expect(jsFeatures.fetch).toBe(true);
      
      testResult!.tests.push({
        name: 'JavaScript execution',
        passed: true,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      testResult!.tests.push({
        name: 'JavaScript execution',
        passed: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
      });
      throw error;
    }
  });
});
    
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
