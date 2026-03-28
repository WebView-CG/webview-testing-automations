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
  let cdp: any = null;
  
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
    
    try {
      // Launch app once for all tests
      await launchAndroidApp(deviceId, PACKAGE_NAME, ACTIVITY_NAME);
      
      // Wait for WebView to be ready
      await sleep(5000);
      
      // Connect to WebView (CDP client)
      cdp = await connectToWebView(deviceId, PACKAGE_NAME);
      
      // Navigate to collector
      console.log(`Navigating to: ${TEST_URL}`);
      await cdp.send('Page.navigate', { url: TEST_URL });
      
      // Wait for page to load
      await sleep(10000);
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  });
  
  test.afterAll(async () => {
    // Close connection
    if (cdp) {
      try {
        await cdp.close();
      } catch (e) {
        console.log('Error closing CDP:', e);
      }
    }
    
    // Save results
    const resultsDir = path.join(process.cwd(), 'test-results');
    await fs.mkdir(resultsDir, { recursive: true });
    const resultsPath = path.join(resultsDir, 'android-results.json');
    await fs.writeFile(resultsPath, JSON.stringify(testResult, null, 2));
    console.log(`Results saved to: ${resultsPath}`);
  });

  test('should collect BCD data from collector', async () => {
    const startTime = Date.now();
    
    try {
      if (!cdp) {
        throw new Error('CDP connection not established');
      }
      
      // Get page title to verify page loaded
      const { result: titleResult } = await cdp.send('Runtime.evaluate', {
        expression: 'document.title',
        returnByValue: true
      });
      console.log('Page title:', titleResult.value);
      
      // Get user agent
      const { result: uaResult } = await cdp.send('Runtime.evaluate', {
        expression: 'navigator.userAgent',
        returnByValue: true
      });
      const userAgent = uaResult.value;
      console.log('User agent:', userAgent);
      
      // Wait for collector to finish (it may take time)
      console.log('Waiting for collector to complete...');
      await sleep(30000);
      
      // Get collector data
      const { result } = await cdp.send('Runtime.evaluate', {
        expression: `JSON.stringify({
          userAgent: navigator.userAgent,
          bcd: window.__bcd || {},
          collector: window.__resources || {}
        })`,
        returnByValue: true
      });
      
      const collectorData = JSON.parse(result.value);
      console.log('Collected data keys:', Object.keys(collectorData));
      
      testResult.metadata.collectorData = collectorData;
      testResult.results['bcd-collection'] = {
        status: 'passed',
        duration: Date.now() - startTime,
        data: {
          userAgent,
          dataSize: JSON.stringify(collectorData).length
        }
      };
      
      expect(collectorData.userAgent).toBeTruthy();
    } catch (error) {
      testResult.results['bcd-collection'] = {
        status: 'failed',
        duration: Date.now() - startTime,
        error: (error as Error).message
      };
      throw error;
    }
  });
});
