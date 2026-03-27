# WebView Automated Testing

Automated testing infrastructure for WebViews using Playwright, targeting the [CanIWebView](https://caniwebview.com) test applications.

## Overview

This project provides tooling and documentation for automated WebView testing using Playwright and Appium. It tests web content behavior inside native WebView containers (Android WebView and iOS WKWebView) and uploads results to the [webview-bcd-results](https://github.com/WebView-CG/webview-bcd-results) repository.

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

- [Setup Guide](docs/SETUP.md)
- [Android Testing Guide](docs/ANDROID.md)
- [iOS Testing Guide](docs/IOS.md)
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
