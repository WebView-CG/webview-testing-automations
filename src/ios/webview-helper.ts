/**
 * iOS WKWebView connection utilities
 * Uses ios-webkit-debug-proxy for remote debugging
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { CDPClient } from '../android/cdp-client';

const execAsync = promisify(exec);

export interface IOSDevice {
  udid: string;
  name: string;
  state: string;
  type: 'simulator' | 'device';
}

/**
 * Get list of available iOS simulators
 */
export async function getSimulators(): Promise<IOSDevice[]> {
  const { stdout } = await execAsync('xcrun simctl list devices available -j');
  const data = JSON.parse(stdout);
  const simulators: IOSDevice[] = [];
  
  for (const [runtime, devices] of Object.entries(data.devices)) {
    if (runtime.includes('iOS')) {
      for (const device of devices as any[]) {
        simulators.push({
          udid: device.udid,
          name: device.name,
          state: device.state,
          type: 'simulator'
        });
      }
    }
  }
  
  return simulators;
}

/**
 * Get booted iOS simulators
 */
export async function getBootedSimulators(): Promise<IOSDevice[]> {
  const simulators = await getSimulators();
  return simulators.filter(sim => sim.state === 'Booted');
}

/**
 * Boot iOS simulator
 */
export async function bootSimulator(udid: string): Promise<void> {
  try {
    await execAsync(`xcrun simctl boot ${udid}`);
    // Wait for simulator to fully boot
    await new Promise(resolve => setTimeout(resolve, 10000));
  } catch (error: any) {
    if (!error.message.includes('Unable to boot device in current state: Booted')) {
      throw error;
    }
    // Already booted
  }
}

/**
 * Install app on simulator
 */
export async function installApp(udid: string, appPath: string): Promise<void> {
  await execAsync(`xcrun simctl install ${udid} "${appPath}"`);
}

/**
 * Launch iOS app
 */
export async function launchIOSApp(udid: string, bundleId: string): Promise<void> {
  await execAsync(`xcrun simctl launch ${udid} ${bundleId}`);
  // Give app time to start
  await new Promise(resolve => setTimeout(resolve, 3000));
}

/**
 * Get iOS version
 */
export async function getIOSVersion(udid: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`xcrun simctl list devices -j`);
    const data = JSON.parse(stdout);
    
    for (const [runtime, devices] of Object.entries(data.devices)) {
      for (const device of devices as any[]) {
        if (device.udid === udid) {
          const match = runtime.match(/iOS-(\d+(?:-\d+)?)/);
          return match ? match[1].replace('-', '.') : 'unknown';
        }
      }
    }
    return 'unknown';
  } catch (e) {
    return 'unknown';
  }
}

/**
 * Connect to WKWebView using ios-webkit-debug-proxy
 * Note: Requires ios_webkit_debug_proxy to be installed and running
 */
export async function connectToWKWebView(
  udid: string,
  bundleId: string,
  localPort: number = 9222
): Promise<CDPClient> {
  // ios-webkit-debug-proxy should be running on port 9221 (default)
  // It exposes each device/simulator on sequential ports
  
  // For simulator, we can use Safari Remote Debugging directly
  // Get the WebSocket endpoint
  const inspectorUrl = `http://localhost:${localPort}`;
  
  try {
    // List available pages
    const response = await fetch(`${inspectorUrl}/json`);
    const pages = await response.json();
    
    if (!pages || pages.length === 0) {
      throw new Error(
        `No WebView pages found for ${bundleId}.\n` +
        `Make sure:\n` +
        `1. The app is running and has loaded a page\n` +
        `2. Web Inspector is enabled in the app\n` +
        `3. ios-webkit-debug-proxy is running (brew install ios-webkit-debug-proxy)`
      );
    }
    
    // Find page matching our app
    const targetPage = pages.find((p: any) => 
      p.url && !p.url.startsWith('about:') && !p.url.startsWith('data:')
    ) || pages[0];
    
    console.log(`Connecting to WKWebView: ${targetPage.title || targetPage.url}`);
    console.log(`WebSocket URL: ${targetPage.webSocketDebuggerUrl}`);
    
    // Connect to CDP WebSocket
    const client = await CDPClient.connect(targetPage.webSocketDebuggerUrl);
    
    // Enable required domains
    await client.send('Runtime.enable');
    await client.send('Page.enable');
    await client.send('Network.enable');
    
    return client;
  } catch (error) {
    throw new Error(
      `Failed to connect to WKWebView: ${(error as Error).message}\n\n` +
      `Setup instructions:\n` +
      `1. Install: brew install ios-webkit-debug-proxy\n` +
      `2. Start proxy: ios_webkit_debug_proxy -c ${udid}:${localPort} -d\n` +
      `3. Enable Web Inspector in your iOS app\n` +
      `4. Ensure app is running with a WebView loaded`
    );
  }
}

/**
 * Get device information
 */
export async function getDeviceInfo(udid: string): Promise<Record<string, string>> {
  try {
    const { stdout } = await execAsync(`xcrun simctl list devices -j`);
    const data = JSON.parse(stdout);
    
    for (const [runtime, devices] of Object.entries(data.devices)) {
      for (const device of devices as any[]) {
        if (device.udid === udid) {
          return {
            name: device.name,
            udid: device.udid,
            state: device.state,
            runtime: runtime,
            ios_version: await getIOSVersion(udid)
          };
        }
      }
    }
    
    return { error: 'Device not found' };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/**
 * Take screenshot of simulator
 */
export async function takeSimulatorScreenshot(udid: string, outputPath: string): Promise<void> {
  await execAsync(`xcrun simctl io ${udid} screenshot "${outputPath}"`);
}

/**
 * Record video of simulator (start recording)
 */
export async function startSimulatorRecording(udid: string, outputPath: string): Promise<{ stop: () => Promise<void> }> {
  const proc = exec(`xcrun simctl io ${udid} recordVideo "${outputPath}"`);
  
  return {
    stop: async () => {
      proc.kill('SIGINT');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };
}
