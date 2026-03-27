/**
 * iOS WebView automation using Appium + XCUITest
 * This works with iOS Simulators (unlike ios-webkit-debug-proxy which needs real devices)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { remote, RemoteOptions } from 'webdriverio';

const execAsync = promisify(exec);

let appiumProcess: ReturnType<typeof exec> | null = null;

/**
 * Start Appium server
 */
export async function startAppium(port: number = 4723): Promise<void> {
  console.log(`Starting Appium server on port ${port}...`);
  
  // Check if already running
  try {
    await fetch(`http://localhost:${port}/status`);
    console.log('✓ Appium already running');
    return;
  } catch {
    // Not running, start it
  }
  
  appiumProcess = exec(`npx appium --port ${port}`);
  
  appiumProcess.stdout?.on('data', (data) => {
    if (data.toString().includes('Appium REST http interface listener started')) {
      console.log('✓ Appium server started');
    }
  });
  
  appiumProcess.stderr?.on('data', (data) => {
    console.error('Appium error:', data.toString());
  });
  
  // Wait for Appium to be ready
  for (let i = 0; i < 30; i++) {
    try {
      const response = await fetch(`http://localhost:${port}/status`);
      if (response.ok) {
        console.log('✓ Appium is ready');
        return;
      }
    } catch {
      // Not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('Appium failed to start');
}

/**
 * Stop Appium server
 */
export function stopAppium(): void {
  if (appiumProcess) {
    appiumProcess.kill('SIGTERM');
    appiumProcess = null;
    console.log('✓ Appium stopped');
  }
}

/**
 * Connect to iOS WebView via Appium
 */
export async function connectToIOSWebView(
  udid: string,
  bundleId: string,
  appiumPort: number = 4723
) {
  const opts: RemoteOptions = {
    hostname: 'localhost',
    port: appiumPort,
    path: '/',
    capabilities: {
      platformName: 'iOS',
      'appium:platformVersion': await getSimulatorIOSVersion(udid),
      'appium:deviceName': await getSimulatorName(udid),
      'appium:udid': udid,
      'appium:bundleId': bundleId,
      'appium:automationName': 'XCUITest',
      'appium:noReset': true,
      'appium:webviewConnectTimeout': 30000,
      'appium:autoLaunch': true,
      'appium:newCommandTimeout': 300,
    },
  };

  console.log('Connecting to iOS WebView via Appium...');
  console.log(`Bundle ID: ${bundleId}`);
  console.log(`Simulator: ${udid}`);
  
  const driver = await remote(opts);
  console.log('✓ Appium session created');
  
  // Wait for WebView context to appear
  console.log('Waiting for WebView context...');
  let contexts: string[] = [];
  for (let i = 0; i < 20; i++) {
    contexts = await driver.getContexts();
    const webviewContext = contexts.find(ctx => 
      ctx !== 'NATIVE_APP' && ctx.includes('WEBVIEW')
    );
    
    if (webviewContext) {
      console.log(`✓ Found WebView context: ${webviewContext}`);
      await driver.switchContext(webviewContext);
      console.log(`✓ Switched to context: ${webviewContext}`);
      return driver;
    }
    
    console.log(`Attempt ${i + 1}/20: Available contexts:`, contexts);
    await driver.pause(1000);
  }
  
  throw new Error(`No WebView context found after 20 seconds. Available contexts: ${contexts.join(', ')}`);
}

/**
 * Get simulator iOS version
 */
async function getSimulatorIOSVersion(udid: string): Promise<string> {
  try {
    const { stdout } = await execAsync(
      `xcrun simctl list devices -j | jq -r '.devices | to_entries[] | .value[] | select(.udid=="${udid}") | .state as $state | .name + " (" + .udid + ") - " + (.deviceTypeIdentifier | split(".") | last) + " - iOS " + (parent | .key | split(".") | last)'`
    );
    const match = stdout.match(/iOS\s+(\d+)/);
    return match ? match[1] : '17.0';
  } catch {
    return '17.0'; // Default
  }
}

/**
 * Get simulator name
 */
async function getSimulatorName(udid: string): Promise<string> {
  try {
    const { stdout } = await execAsync(
      `xcrun simctl list devices -j | jq -r '.devices | to_entries[] | .value[] | select(.udid=="${udid}") | .name'`
    );
    return stdout.trim() || 'iPhone';
  } catch {
    return 'iPhone';
  }
}
