/**
 * iOS WKWebView test against collector.openwebdocs.org
 * Runs the BCD collector and captures results
 */

import { test, expect } from '@playwright/test';
import { startAppium, connectToIOSWebView } from '../../src/ios/appium-helper';
import { getBootedSimulators, getDeviceInfo } from '../../src/ios/webview-helper';
import { createTestResult } from '../../src/common/utils';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { Browser } from 'webdriverio';

const BUNDLE_ID = 'com.caniwebview.wkwebview';
const TEST_URL = 'https://collector.openwebdocs.org/';
const APPIUM_PORT = 4723;

test.describe('iOS WKWebView - BCD Collector', () => {
  let udid: string;
  let driver: Browser<'async'> | null = null;
  let testResult: ReturnType<typeof createTestResult>;
  let setupError: Error | null = null;
  
  test.beforeAll(async () => {
    test.setTimeout(300000);
    try {
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
      
      // Connect to app's WebView via Appium
      driver = await connectToIOSWebView(udid, BUNDLE_ID, APPIUM_PORT);
      
      // Navigate to test URL
      console.log(`Navigating to: ${TEST_URL}`);
      await driver.url(TEST_URL);
      
      // Wait for page to fully load
      await driver.pause(15000);
      
    } catch (error) {
      setupError = error as Error;
      console.error('Setup failed:', setupError);
    }
  });
  
  test.afterAll(async () => {
    if (driver) {
      try {
        await driver.deleteSession();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    // Always save results
    try {
      const resultsDir = path.join(process.cwd(), 'test-results');
      await fs.mkdir(resultsDir, { recursive: true });
      const resultsPath = path.join(resultsDir, 'ios-results.json');
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
    
    if (!driver) {
      throw new Error('Driver not initialized');
    }
    
    // Verify page loaded
    const title = await driver.getTitle();
    console.log(`Page title: ${title}`);
    expect(title).toBeTruthy();
    
    const url = await driver.getUrl();
    console.log(`Page URL: ${url}`);
    expect(url).toContain('collector.openwebdocs.org');
    
    // Get user agent
    const userAgent = await driver.execute(() => navigator.userAgent);
    console.log('User agent:', userAgent);
    
    // Wait for collector to complete
    console.log('Waiting for collector to complete (30s)...');
    await driver.pause(30000);
    
    // Get collector data
    const collectorData = await driver.execute(() => {
      return {
        userAgent: navigator.userAgent,
        // @ts-ignore
        bcd: window.__bcd || {},
        // @ts-ignore
        resources: window.__resources || {}
      };
    });
    
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
