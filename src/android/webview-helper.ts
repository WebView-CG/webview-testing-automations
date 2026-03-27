/**
 * Android WebView connection utilities
 * Uses raw CDP WebSocket connection to avoid unsupported browser-level commands
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { CDPClient } from './cdp-client';

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
 * Connect to Android WebView using raw CDP WebSocket
 */
export async function connectToWebView(deviceId: string, packageName: string, localPort: number = 9222): Promise<CDPClient> {
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
  
  // Get the WebSocket endpoint URL for the page
  const response = await fetch(`http://localhost:${localPort}/json`);
  const pages = await response.json();
  
  if (!pages || pages.length === 0) {
    throw new Error('No pages found in WebView. Make sure a page is loaded.');
  }
  
  const pageInfo = pages[0];
  console.log(`Connecting to page: ${pageInfo.title || pageInfo.url}`);
  console.log(`WebSocket URL: ${pageInfo.webSocketDebuggerUrl}`);
  
  // Connect to CDP WebSocket directly
  const client = await CDPClient.connect(pageInfo.webSocketDebuggerUrl);
  
  // Enable required domains
  await client.send('Runtime.enable');
  await client.send('Page.enable');
  await client.send('Network.enable');
  
  return client;
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
