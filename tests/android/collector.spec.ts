/**
 * Android WebView test against collector.openwebdocs.org
 * Runs the BCD collector and captures results
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

test.describe('Android WebView - BCD Collector', () => {
  let deviceId: string;
  let testResult: ReturnType<typeof createTestResult>;
  let cdp: any = null;
  let setupError: Error | null = null;
  
  test.beforeAll(async () => {
    try {
      // Get connected device
      const devices = await getConnectedDevices();
      if (devices.length === 0) {
        throw new Error('No Android devices connected');
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
      
      // Launch app and connect
      await launchAndroidApp(deviceId, PACKAGE_NAME, ACTIVITY_NAME);
      await sleep(5000);
      
      cdp = await connectToWebView(deviceId, PACKAGE_NAME);
      
      // Navigate to collector
      console.log(`Navigating to: ${TEST_URL}`);
      await cdp.send('Page.navigate', { url: TEST_URL });
      await sleep(10000);
      
    } catch (error) {
      setupError = error as Error;
      console.error('Setup failed:', setupError);
    }
  });
  
  test.afterAll(async () => {
    if (cdp) {
      try {
        await cdp.close();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    // Always save results
    try {
      const resultsDir = path.join(process.cwd(), 'test-results');
      await fs.mkdir(resultsDir, { recursive: true });
      const resultsPath = path.join(resultsDir, 'android-results.json');
      await fs.writeFile(resultsPath, JSON.stringify(testResult, null, 2));
      console.log(`Results saved to: ${resultsPath}`);
    } catch (e) {
      console.error('Failed to save results:', e);
    }
  });

  test('should run BCD collector and capture results', async () => {
    // Fail immediately if setup failed
    if (setupError) {
      throw setupError;
    }
    
    const startTime = Date.now();
    
    if (!cdp) {
      throw new Error('CDP connection not established');
    }
    
    // Verify page loaded
    const { result: titleResult } = await cdp.send('Runtime.evaluate', {
      expression: 'document.title',
      returnByValue: true
    });
    console.log('Page title:', titleResult.value);
    expect(titleResult.value).toBeTruthy();
    
    // Get user agent
    const { result: uaResult } = await cdp.send('Runtime.evaluate', {
      expression: 'navigator.userAgent',
      returnByValue: true
    });
    const userAgent = uaResult.value;
    console.log('User agent:', userAgent);
    
    // Wait for collector to complete
    console.log('Waiting for collector to complete (30s)...');
    await sleep(30000);
    
    // Get collector data
    const { result } = await cdp.send('Runtime.evaluate', {
      expression: `JSON.stringify({
        userAgent: navigator.userAgent,
        bcd: window.__bcd || {},
        resources: window.__resources || {}
      })`,
      returnByValue: true
    });
    
    const collectorData = JSON.parse(result.value);
    console.log('Collector data collected:', {
      hasUserAgent: !!collectorData.userAgent,
      hasBCD: !!collectorData.bcd && Object.keys(collectorData.bcd).length > 0,
      hasResources: !!collectorData.resources && Object.keys(collectorData.resources).length > 0,
      bcdKeys: Object.keys(collectorData.bcd || {}).length,
      resourceKeys: Object.keys(collectorData.resources || {}).length
    });
    
    // Store results
    testResult.metadata.collectorData = collectorData;
    testResult.results['bcd-collection'] = {
      status: 'passed',
      duration: Date.now() - startTime,
      data: {
        userAgent,
        dataSize: JSON.stringify(collectorData).length,
        bcdCount: Object.keys(collectorData.bcd || {}).length,
        resourceCount: Object.keys(collectorData.resources || {}).length
      }
    };
    
    expect(collectorData.userAgent).toBeTruthy();
    console.log('✓ BCD collection completed successfully');
  });
});
