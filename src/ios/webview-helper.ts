/**
 * iOS WKWebView connection utilities
 * Handles connecting Playwright to iOS WKWebView
 */

import { webkit, Browser, BrowserContext, Page } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

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
 * Connect Playwright to WKWebView
 * Note: This is more complex than Android and may require Appium
 */
export async function connectToWKWebView(
  udid: string,
  bundleId: string
): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
  // For WKWebView, we typically need to use Appium's WebDriver interface
  // or connect via Safari Remote Debugging Protocol
  
  // This is a placeholder - actual implementation depends on the approach:
  // Option 1: Use Appium with WebKit automation
  // Option 2: Use ios-webkit-debug-proxy for remote debugging
  // Option 3: Use Safari RemoteAutomation (requires Safari Technology Preview)
  
  throw new Error('iOS WKWebView connection not yet implemented. See docs/IOS.md for implementation options.');
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
