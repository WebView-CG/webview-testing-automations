# iOS WKWebView Testing Guide

## Overview

Testing iOS WKWebView using Playwright, Appium, and Safari Web Inspector.

## How It Works

1. **App Launch**: CanIWKWebView app launches on iOS device/simulator
2. **Web Inspector**: WKWebView enables Safari Web Inspector
3. **Appium Connection**: Appium XCUITest driver controls the app
4. **Playwright Connection**: Playwright connects via WebKit protocol
5. **Test Execution**: Tests run against web content in WKWebView

## Prerequisites

- macOS (required for iOS development)
- Xcode 13+
- iOS Simulator or physical device
- Apple Developer account (for device testing)

### Required Modifications to CanIWKWebView

Enable Web Inspector in the app. Modify the WebView configuration:

```swift
// In ContentView.swift or wherever WKWebView is configured
import WebKit

#if DEBUG
if #available(iOS 16.4, *) {
    webView.isInspectable = true
}
#endif

// For older iOS versions, Web Inspector is enabled by default in debug builds
```

## Running Tests

### 1. Start Appium Server

```bash
npx appium
```

### 2. Build and Install App

```bash
# For Simulator
cd apps/CanIWKWebView
xcodebuild -project CanIWKWebView.xcodeproj \
  -scheme CanIWKWebView \
  -configuration Debug \
  -sdk iphonesimulator \
  -derivedDataPath build

# Install on booted simulator
xcrun simctl install booted build/Build/Products/Debug-iphonesimulator/CanIWKWebView.app
```

### 3. Run Tests

```bash
npm run test:ios
```

## Test Structure

Similar to Android tests but using iOS-specific helpers:

```typescript
import { webkit } from '@playwright/test';
import { connectToWKWebView } from '../../src/ios/webview-helper';

const { browser, context, page } = await connectToWKWebView(deviceUDID, bundleId);

await page.goto('https://collector.openwebdocs.org/');
// Run tests...

await browser.close();
```

## Debugging

### Safari Web Inspector

1. Connect device/simulator
2. Open Safari → Develop → [Device Name] → [App Name]
3. Use Web Inspector to debug WebView content

### View Console Logs

```bash
# Simulator logs
xcrun simctl spawn booted log stream --predicate 'process == "CanIWKWebView"'

# Device logs
idevicesyslog | grep CanIWKWebView
```

## Common Issues

### Issue: "Web Inspector not available"

**Solution**: Ensure app is built in Debug configuration with `isInspectable = true` (iOS 16.4+)

### Issue: "Cannot connect to simulator"

**Solution**: 
- Ensure simulator is booted: `xcrun simctl list devices | grep Booted`
- Try restarting simulator

### Issue: "Code signing failed"

**Solution**: Configure automatic signing in Xcode or use development provisioning profile

## CI/CD Integration

GitHub Actions with macOS runner:

```yaml
runs-on: macos-latest
steps:
  - name: Start simulator
    run: |
      xcrun simctl boot "iPhone 13"
  - name: Run tests
    run: npm run test:ios
```

## Next Steps

- Run tests: `npm run test:ios`
- View results: `test-results/ios-results.json`
- Upload results: `npm run upload-results test-results/ios-results.json`
