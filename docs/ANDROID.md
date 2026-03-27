# Android WebView Testing Guide

## Overview

This guide covers testing Android WebView using Playwright connected via Chrome DevTools Protocol.

## How It Works

1. **App Launch**: The CanIAndroidWebView app is launched on an Android device/emulator
2. **WebView Debugging**: The app exposes a Chrome DevTools Protocol endpoint
3. **Port Forwarding**: ADB forwards the WebView debugging port to localhost
4. **Playwright Connection**: Playwright connects to the WebView as if it were Chrome
5. **Test Execution**: Tests run against web content loaded in the WebView
6. **Result Collection**: Results are saved and can be uploaded to GitHub

## Architecture

```
┌─────────────────┐
│   Playwright    │
│   Test Suite    │
└────────┬────────┘
         │ Chrome DevTools Protocol
         ↓
┌─────────────────┐
│   localhost     │
│   :9222         │
└────────┬────────┘
         │ ADB Port Forward
         ↓
┌─────────────────┐
│  Android Device │
│   WebView App   │
│  (debugging on) │
└─────────────────┘
```

## Prerequisites

### Required Modifications to CanIAndroidWebView

The app needs WebView debugging enabled. Add this to `MainActivity.kt`:

```kotlin
import android.webkit.WebView

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Enable WebView debugging for automation
        WebView.setWebContentsDebuggingEnabled(true)
        
        // ... rest of the code
    }
}
```

### Device Setup

1. **Enable Developer Options** on your Android device
   - Go to Settings → About phone
   - Tap "Build number" 7 times

2. **Enable USB Debugging**
   - Go to Settings → Developer options
   - Enable "USB debugging"

3. **Connect Device**
   ```bash
   adb devices
   # Should show your device as "device" (not "unauthorized")
   ```

## Running Tests

### 1. Start Appium Server (optional)

While not strictly necessary for Chrome DevTools Protocol connection, Appium can help with app control:

```bash
npx appium
```

### 2. Launch the App

```bash
# Install APK if not already installed
adb install -r apps/CanIAndroidWebView/app/build/outputs/apk/debug/app-debug.apk

# Launch the app
adb shell am start -n com.example.caniandroidwebview/.MainActivity
```

### 3. Run Tests

```bash
npm run test:android
```

## Test Structure

### Basic WebView Connection Test

```typescript
import { chromium } from '@playwright/test';
import { connectToWebView } from '../../src/android/webview-helper';

const { browser, context, page } = await connectToWebView(deviceId, packageName);

// Now you can use Playwright as normal
await page.goto('https://collector.openwebdocs.org/');
const title = await page.title();
console.log('Page title:', title);

await browser.close();
```

### Testing Features

```typescript
// Test JavaScript APIs
const features = await page.evaluate(() => {
  return {
    localStorage: typeof localStorage !== 'undefined',
    serviceWorker: 'serviceWorker' in navigator,
    // ... more features
  };
});
```

## Debugging

### View WebView Console Logs

```bash
# Connect Chrome DevTools
chrome://inspect/#devices

# Or use adb logcat
adb logcat | grep -i "chromium\|webview"
```

### Check WebView Sockets

```bash
adb shell cat /proc/net/unix | grep webview_devtools_remote
```

### Manual CDP Connection

```bash
# Forward port
adb forward tcp:9222 localabstract:webview_devtools_remote_XXXX

# Open in browser
open http://localhost:9222
```

## Common Issues

### Issue: "No WebView found"

**Solution**: Ensure the app has WebView debugging enabled and is running with a WebView loaded.

### Issue: "Cannot connect to device"

**Solution**: 
- Check `adb devices` shows your device
- Revoke and re-grant USB debugging authorization
- Try `adb kill-server && adb start-server`

### Issue: "Port forwarding failed"

**Solution**:
- Check if port 9222 is already in use: `lsof -i :9222`
- Use a different port in your test configuration

## Advanced Configuration

### Testing on Multiple Devices

```typescript
const devices = await getConnectedDevices();
for (const deviceId of devices) {
  // Run tests on each device
}
```

### Custom WebView Settings

Modify the app to accept intents with settings:

```kotlin
// In MainActivity.kt
val url = intent.getStringExtra("url") ?: "https://collector.openwebdocs.org/"
webView.loadUrl(url)
```

Then launch with custom URL:

```bash
adb shell am start -n com.example.caniandroidwebview/.MainActivity \
  --es url "https://your-test-site.com"
```

## CI/CD Integration

See [.github/workflows/android-tests.yml](../.github/workflows/android-tests.yml) for GitHub Actions example.

## Next Steps

- Run the test suite: `npm run test:android`
- View results: `test-results/android-results.json`
- Upload results: `npm run upload-results test-results/android-results.json`
