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
    },
  };

  console.log('Connecting to iOS WebView via Appium...');
  const driver = await remote(opts);
  
  // Wait for WebView context
  await driver.pause(3000);
  
  // List contexts
  const contexts = await driver.getContexts();
  console.log('Available contexts:', contexts);
  
  // Switch to WebView context
  const webviewContext = contexts.find(ctx => 
    ctx !== 'NATIVE_APP' && ctx.includes('WEBVIEW')
  );
  
  if (!webviewContext) {
    throw new Error('No WebView context found');
  }
  
  await driver.switchContext(webviewContext);
  console.log(`✓ Switched to context: ${webviewContext}`);
  
  return driver;
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
