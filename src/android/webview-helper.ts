/**
 * Android WebView connection utilities
 * Handles connecting Playwright to Android WebView via Chrome DevTools Protocol
 */

import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface AndroidDevice {
  deviceId: string;
  webViewPackage: string;
}

export interface WebViewInfo {
  socketName: string;
  pid: string;
  packageName: string;
}

/**
 * Get list of connected Android devices
 */
export async function getConnectedDevices(): Promise<string[]> {
  const { stdout } = await execAsync('adb devices');
  const lines = stdout.split('\n').slice(1);
  return lines
    .filter(line => line.includes('device'))
    .map(line => line.split('\t')[0])
    .filter(Boolean);
}

/**
 * Get WebView debugging sockets on device
 */
export async function getWebViewSockets(deviceId: string): Promise<WebViewInfo[]> {
  try {
    const { stdout } = await execAsync(`adb -s ${deviceId} shell cat /proc/net/unix | grep webview_devtools_remote`);
    const webviews: WebViewInfo[] = [];
    
    for (const line of stdout.split('\n')) {
      const match = line.match(/@webview_devtools_remote_(\d+)/);
      if (match) {
        const pid = match[1];
        // Get package name from PID
        try {
          const { stdout: psOut } = await execAsync(`adb -s ${deviceId} shell ps -p ${pid} -o NAME=`);
          const packageName = psOut.trim();
          webviews.push({
            socketName: `webview_devtools_remote_${pid}`,
            pid,
            packageName
          });
        } catch (e) {
          // Process might have ended
        }
      }
    }
    
    return webviews;
  } catch (error) {
    // No WebView sockets found - this is expected if WebView debugging is not enabled
    console.log('No WebView debugging sockets found. Make sure the app has WebView.setWebContentsDebuggingEnabled(true)');
    return [];
  }
}

/**
 * Forward WebView debugging port from device to local machine
 */
export async function forwardWebViewPort(deviceId: string, socketName: string, localPort: number): Promise<void> {
  await execAsync(`adb -s ${deviceId} forward tcp:${localPort} localabstract:${socketName}`);
}

/**
 * Launch Android app via adb
 */
export async function launchAndroidApp(deviceId: string, packageName: string, activityName: string): Promise<void> {
  await execAsync(`adb -s ${deviceId} shell am start -n ${packageName}/${activityName}`);
  // Give app time to start
  await new Promise(resolve => setTimeout(resolve, 3000));
}

/**
 * Install APK on device
 */
export async function installAPK(deviceId: string, apkPath: string): Promise<void> {
  await execAsync(`adb -s ${deviceId} install -r ${apkPath}`);
}

/**
 * Connect Playwright to Android WebView
 */
export async function connectToWebView(deviceId: string, packageName: string, localPort: number = 9222): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
  // Get WebView sockets
  const webviews = await getWebViewSockets(deviceId);
  
  if (webviews.length === 0) {
    throw new Error(
      `No WebView debugging sockets found on device ${deviceId}.\n` +
      `This usually means:\n` +
      `1. The app is not running\n` +
      `2. The app doesn't have WebView.setWebContentsDebuggingEnabled(true)\n` +
      `3. No WebView has been loaded yet\n\n` +
      `To fix: Add this to your app's MainActivity onCreate():\n` +
      `  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {\n` +
      `    WebView.setWebContentsDebuggingEnabled(true)\n` +
      `  }`
    );
  }
  
  console.log('Available WebViews:', webviews.map(w => `${w.packageName} (PID: ${w.pid})`).join(', '));
  
  const targetWebView = webviews.find(wv => wv.packageName.includes(packageName));
  
  if (!targetWebView) {
    throw new Error(
      `No WebView found for package: ${packageName}\n` +
      `Available packages: ${webviews.map(w => w.packageName).join(', ')}\n` +
      `Make sure the app is running and has loaded a WebView.`
    );
  }
  
  console.log(`Connecting to WebView: ${targetWebView.packageName} (PID: ${targetWebView.pid})`);
  
  // Forward port
  await forwardWebViewPort(deviceId, targetWebView.socketName, localPort);
  
  // Connect Playwright to the WebView
  const browser = await chromium.connectOverCDP(`http://localhost:${localPort}`);
  const contexts = browser.contexts();
  
  if (contexts.length === 0) {
    throw new Error('No browser contexts found');
  }
  
  const context = contexts[0];
  const pages = context.pages();
  
  if (pages.length === 0) {
    // Wait for page to be created
    const page = await context.waitForEvent('page', { timeout: 10000 });
    return { browser, context, page };
  }
  
  return { browser, context, page: pages[0] };
}

/**
 * Get Android device info
 */
export async function getDeviceInfo(deviceId: string): Promise<Record<string, string>> {
  const properties = [
    'ro.build.version.release',      // Android version
    'ro.build.version.sdk',          // SDK version
    'ro.product.manufacturer',       // Manufacturer
    'ro.product.model',              // Model
    'ro.build.version.security_patch', // Security patch
  ];
  
  const info: Record<string, string> = {};
  
  for (const prop of properties) {
    try {
      const { stdout } = await execAsync(`adb -s ${deviceId} shell getprop ${prop}`);
      info[prop] = stdout.trim();
    } catch (e) {
      info[prop] = 'unknown';
    }
  }
  
  return info;
}

/**
 * Get WebView version
 */
export async function getWebViewVersion(deviceId: string): Promise<string> {
  try {
    const { stdout } = await execAsync(
      `adb -s ${deviceId} shell dumpsys package com.google.android.webview | grep versionName`
    );
    const match = stdout.match(/versionName=([^\s]+)/);
    return match ? match[1] : 'unknown';
  } catch (e) {
    return 'unknown';
  }
}
