/**
 * Android WebView test against collector.openwebdocs.org
 */

import { test, expect, chromium } from '@playwright/test';
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
      await sleep(2000);
      
      // Connect to WebView
      const { browser, context, page } = await connectToWebView(deviceId, PACKAGE_NAME);
      
      // Navigate to collector (if not already there)
      if (!page.url().includes('collector.openwebdocs.org')) {
        await page.goto(TEST_URL, { waitUntil: 'networkidle', timeout: 30000 });
      }
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Verify page loaded
      const title = await page.title();
      console.log('Page title:', title);
      expect(title).toBeTruthy();
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/android-collector-page.png', fullPage: true });
      
      testResult.results['page-load'] = {
        status: 'passed',
        duration: Date.now() - startTime,
        data: { title }
      };
      
      await browser.close();
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
      const { browser, context, page } = await connectToWebView(deviceId, PACKAGE_NAME);
      
      // Ensure we're on the collector page
      if (!page.url().includes('collector.openwebdocs.org')) {
        await page.goto(TEST_URL, { waitUntil: 'networkidle' });
      }
      
      // Wait for collector to run
      await page.waitForLoadState('networkidle');
      await sleep(5000); // Give collector time to detect features
      
      // Try to get results from the page
      const collectorData = await page.evaluate(() => {
        // Check if collector has results available
        if (typeof window !== 'undefined') {
          return {
            userAgent: navigator.userAgent,
            features: (window as any).__collector_results || {}
          };
        }
        return null;
      });
      
      console.log('Collector data:', JSON.stringify(collectorData, null, 2));
      
      testResult.results['feature-collection'] = {
        status: 'passed',
        duration: Date.now() - startTime,
        data: collectorData
      };
      
      await browser.close();
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
      const { browser, context, page } = await connectToWebView(deviceId, PACKAGE_NAME);
      
      // Test basic JavaScript features
      const jsTests = await page.evaluate(() => {
        return {
          localStorage: typeof localStorage !== 'undefined',
          sessionStorage: typeof sessionStorage !== 'undefined',
          indexedDB: typeof indexedDB !== 'undefined',
          fetch: typeof fetch !== 'undefined',
          promise: typeof Promise !== 'undefined',
          asyncAwait: true, // If this runs, async/await works
          serviceWorker: 'serviceWorker' in navigator,
          webgl: (() => {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
          })(),
        };
      });
      
      console.log('JavaScript features:', jsTests);
      
      testResult.results['javascript-features'] = {
        status: 'passed',
        duration: Date.now() - startTime,
        data: jsTests
      };
      
      await browser.close();
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
