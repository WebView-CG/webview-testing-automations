# WebView Automated Testing

Automated testing infrastructure for WebViews using Playwright, targeting the [CanIWebView](https://caniwebview.com) test applications.

## Overview

This project provides tooling and documentation for automated WebView testing using Playwright and Appium. It tests web content behavior inside native WebView containers (Android WebView and iOS WKWebView) by navigating to [collector.openwebdocs.org](https://collector.openwebdocs.org/) and collecting browser compatibility data (BCD).

The collected data is automatically uploaded to the [webview-bcd-results](https://github.com/WebView-CG/webview-bcd-results) repository.

## What Do The Tests Do?

Each test platform (Android and iOS) performs a single, comprehensive test:

### Android WebView Test

1. **Launch App**: Starts the CanIAndroidWebView app on a connected device/emulator
2. **Connect via CDP**: Connects to the WebView using Chrome DevTools Protocol
3. **Navigate**: Loads https://collector.openwebdocs.org/
4. **Wait for Collection**: Waits 30 seconds for the BCD collector to complete
5. **Extract Data**: Retrieves browser compatibility data from `window.__bcd` and `window.__resources`
6. **Save Results**: Writes results to `test-results/android-results.json`

### iOS WKWebView Test

1. **Launch App**: Starts the CanIWKWebView app in iOS Simulator via Appium
2. **Connect via WebDriver**: Connects to the WebView using Appium's WebDriver
3. **Navigate**: Loads https://collector.openwebdocs.org/
4. **Wait for Collection**: Waits 30 seconds for the BCD collector to complete
5. **Extract Data**: Retrieves browser compatibility data from `window.__bcd` and `window.__resources`
6. **Save Results**: Writes results to `test-results/ios-results.json`

### Result Format

Both platforms produce JSON files with this structure:

```json
{
  "timestamp": "2024-03-27T10:00:00.000Z",
  "platform": "android",
  "osVersion": "14",
  "deviceModel": "Google Pixel 5",
  "webviewVersion": "122.0.6261.64",
  "testUrl": "https://collector.openwebdocs.org/",
  "results": {
    "bcd-collection": {
      "status": "passed",
      "duration": 35421,
      "data": {
        "userAgent": "Mozilla/5.0...",
        "dataSize": 245678
      }
    }
  },
  "metadata": {
    "collectorData": {
      "userAgent": "Mozilla/5.0...",
      "bcd": { /* Browser compat data */ },
      "collector": { /* Additional test results */ }
    }
  }
}
```

## Project Structure

```
webview-testing/
├── src/
│   ├── android/       # Android WebView testing utilities
│   ├── ios/           # iOS WKWebView testing utilities
│   ├── common/        # Shared utilities
│   └── upload/        # Result upload to GitHub
├── tests/
│   ├── android/       # Android test specs
│   ├── ios/           # iOS test specs
│   └── fixtures/      # Test data
├── docs/              # Documentation
└── apps/              # Cloned test apps (gitignored)
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Android SDK and emulator (for Android testing)
- Xcode and iOS Simulator (for iOS testing on macOS)
- Java 11+ (for Appium)

### Installation

```bash
npm install
npx playwright install
npx appium driver install uiautomator2
npx appium driver install xcuitest  # macOS only
```

### Running Tests

```bash
# Android WebView tests
npm run test:android

# iOS WKWebView tests
npm run test:ios

# Upload results
npm run upload-results
```

## Documentation

- [Quick Start](QUICKSTART.md)
- [Setup Guide](docs/SETUP.md)
- [Android Testing Guide](docs/ANDROID.md)
- [iOS Testing Guide](docs/IOS.md)
- [GitHub Actions](docs/GITHUB_ACTIONS.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## Test Applications

This project tests against:
- [CanIAndroidWebView](https://github.com/WebView-CG/CanIAndroidWebView) - Android WebView test app
- [CanIWKWebView](https://github.com/WebView-CG/CanIWKWebView) - iOS WKWebView test app

## Test Target

Tests run against [collector.openwebdocs.org](https://collector.openwebdocs.org/) to collect browser compatibility data within WebView contexts.

## Results

Test results are automatically uploaded to [webview-bcd-results](https://github.com/WebView-CG/webview-bcd-results).

## Contributing

Contributions welcome! See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

## License

Apache 2.0 - See [LICENSE](LICENSE)

## Related Projects

- [WebView Community Group](https://www.w3.org/community/webview/)
- [CanIWebView](https://caniwebview.com)
