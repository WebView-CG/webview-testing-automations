# WebView Testing Summary

## What We've Built

This repository provides automated testing infrastructure for WebViews on Android and iOS platforms, specifically designed to run the [mdn-bcd-collector](https://collector.openwebdocs.org/) and upload results to the [webview-bcd-results](https://github.com/WebView-CG/webview-bcd-results) repository.

## Test Structure

### Android Tests
- **Platform**: Android WebView
- **Apps Tested**: [CanIAndroidWebView](https://github.com/WebView-CG/CanIAndroidWebView)
- **Method**: Direct CDP (Chrome DevTools Protocol) WebSocket connection
- **What it does**:
  1. Launches the Android app in an emulator
  2. Connects to the WebView via CDP
  3. Navigates to collector.openwebdocs.org
  4. Waits 30s for the collector to gather browser feature data
  5. Captures the BCD (Browser Compatibility Data) results
  6. Saves results to `test-results/android-results.json`

### iOS Tests  
- **Platform**: iOS WKWebView
- **Apps Tested**: [CanIWKWebView](https://github.com/WebView-CG/CanIWKWebView)
- **Method**: Appium + XCUITest for simulator automation
- **What it does**:
  1. Boots an iOS simulator
  2. Launches the iOS app via Appium
  3. Connects to the app's WebView context
  4. Navigates to collector.openwebdocs.org
  5. Waits 30s for the collector to gather browser feature data
  6. Captures the BCD results
  7. Saves results to `test-results/ios-results.json`

## CI/CD Pipeline

### Schedule
- Runs **weekly on Sundays at 2 AM UTC**
- Can also be triggered manually via `workflow_dispatch`

### Test Matrix
- **Android**: API levels 29, 30, 33, 34
- **iOS**: Latest available version on macos-26 runner

### Workflow Steps

#### Android Job
1. Setup Node.js, Java, Android SDK
2. Clone and build CanIAndroidWebView app
3. Start Android emulator with the specified API level
4. Install the app
5. Run tests via `npm run test:android`
6. Upload results to webview-bcd-results (if `RESULTS_UPLOAD_TOKEN` is set)
7. Archive test artifacts

#### iOS Job
1. Setup Node.js and Appium
2. Clone and build CanIWKWebView app
3. Boot iOS simulator
4. Install the app
5. Start Appium server
6. Run tests via `npm run test:ios`
7. Upload results to webview-bcd-results (if `RESULTS_UPLOAD_TOKEN` is set)
8. Archive test artifacts

#### Summary Job
- Downloads all test artifacts
- Creates a comprehensive summary showing:
  - Test status (✅ passed / ❌ failed) for each platform/version
  - Device information
  - Number of BCD features collected
  - Link to the results repository
  - Co-author attribution notice

## Result Upload

Results are automatically uploaded to the [webview-bcd-results](https://github.com/WebView-CG/webview-bcd-results) repository with:
- Timestamped filename: `results/{platform}-{timestamp}.json`
- Latest result: `results/latest-{platform}.json`
- Commit message includes device info and WebView version
- **All commits include co-author attribution**: `Co-authored-by: GitHub Copilot <copilot@github.com>`

## Error Handling

- Tests properly propagate errors from `beforeAll` setup
- Failed tests return non-zero exit codes
- Results are saved even if tests fail
- CI jobs fail properly when tests fail

## Local Testing

### Android
```bash
# Setup
npm run setup:android-app
cd apps/CanIAndroidWebView && ./gradlew assembleDebug

# Run tests (requires emulator or device)
npm run test:android
```

### iOS
```bash
# Setup
npm run setup:ios-app
cd apps/CanIWKWebView
xcodebuild -project CanIWKWebView.xcodeproj \
  -scheme CanIWKWebView \
  -configuration Debug \
  -sdk iphonesimulator

# Run tests (requires booted simulator)
npm run test:ios
```

## Configuration

### Required Secrets
- `RESULTS_UPLOAD_TOKEN`: GitHub personal access token with `repo` scope for uploading to webview-bcd-results

### Git Configuration
- Commit template configured with `.gitmessage-copilot` for co-author attribution
- All future commits in this repo will automatically include Copilot co-author

## Key Features

✅ **Simplified Tests**: Single test per platform focused on BCD collection  
✅ **Proper Error Handling**: Failures are correctly detected and reported  
✅ **Comprehensive Results**: Captures device info, WebView version, and full BCD data  
✅ **Automated Uploads**: Results automatically pushed to dedicated repository  
✅ **Attribution**: All work properly credited with co-author tags  
✅ **CI/CD Ready**: Full GitHub Actions workflow with matrix testing  
✅ **Summary Reports**: Human-readable test summaries in GitHub Actions UI  

## Result Format

```json
{
  "timestamp": "2024-03-28T10:00:00.000Z",
  "platform": "android",
  "osVersion": "11",
  "deviceModel": "Google Pixel 5",
  "webviewVersion": "83.0.4103.120",
  "testUrl": "https://collector.openwebdocs.org/",
  "results": {
    "bcd-collection": {
      "status": "passed",
      "duration": 35000,
      "data": {
        "userAgent": "Mozilla/5.0 ...",
        "dataSize": 125000,
        "bcdCount": 1500,
        "resourceCount": 250
      }
    }
  },
  "metadata": {
    "collectorData": {
      "userAgent": "...",
      "bcd": { /* full BCD data */ },
      "resources": { /* resource data */ }
    }
  }
}
```

## Next Steps

1. ✅ Setup complete
2. ✅ Tests simplified and working
3. ✅ Error handling fixed
4. ✅ Co-author attribution configured
5. 🔄 Monitor weekly runs
6. 📊 Analyze collected BCD data in webview-bcd-results repo
