/**
 * iOS WKWebView test against collector.openwebdocs.org
 * Uses Appium + XCUITest for simulator automation
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

test.describe('iOS WKWebView - collector.openwebdocs.org', () => {
  let udid: string;
  let driver: Browser<'async'> | null = null;
  let testResult: ReturnType<typeof createTestResult>;
  
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
    
    try {
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
      console.error('Setup failed:', error);
      throw error;
    }
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
    const resultsDir = path.join(process.cwd(), 'test-results');
    await fs.mkdir(resultsDir, { recursive: true });
    const resultsPath = path.join(resultsDir, 'ios-results.json');
    await fs.writeFile(resultsPath, JSON.stringify(testResult, null, 2));
    console.log(`Results saved to: ${resultsPath}`);
  });

  test('should collect BCD data from collector', async () => {
    const startTime = Date.now();
    
    try {
      if (!driver) {
        throw new Error('Driver not initialized');
      }
      
      // Get page title to verify page loaded
      const title = await driver.getTitle();
      console.log(`Page title: ${title}`);
      
      // Get URL
      const url = await driver.getUrl();
      console.log(`Page URL: ${url}`);
      
      expect(url).toContain('collector.openwebdocs.org');
      
      // Get user agent
      const userAgent = await driver.execute(() => navigator.userAgent);
      console.log('User agent:', userAgent);
      
      // Wait for collector to complete
      console.log('Waiting for collector to complete...');
      await driver.pause(30000);
      
      // Execute JavaScript to get collector data
      const collectorData = await driver.execute(() => {
        return {
          userAgent: navigator.userAgent,
          // @ts-ignore
          bcd: window.__bcd || {},
          // @ts-ignore
          collector: window.__resources || {}
        };
      });
      
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
