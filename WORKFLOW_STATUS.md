# WebView Testing Workflow Status

## Overview
This repository contains automated testing infrastructure for WebViews on Android and iOS platforms. Tests run weekly via GitHub Actions and upload results to the [webview-bcd-results](https://github.com/WebView-CG/webview-bcd-results) repository.

## Current Status

### ✅ Android Tests
- **Status**: Working
- **Configuration**: Tests multiple API levels (29, 30, 33, 34)
- **Process**:
  1. Builds the CanIAndroidWebView app from source
  2. Launches Android emulator
  3. Installs app and runs tests via Playwright
  4. Captures BCD collector data from WebView
  5. Uploads results to webview-bcd-results repo

### ⚠️ iOS Tests  
- **Status**: Needs attention
- **Known Issues**:
  - App installation and launch timing in CI environment
  - Appium connection stability
  - WebView inspector connection via ios-webkit-debug-proxy

### Recent Fixes
1. **Workflow Syntax Errors** (2026-03-28)
   - Fixed broken shell script in Android workflow causing parse errors
   - Simplified test execution commands
   - Improved results summary generation

2. **Co-Author Attribution**
   - All commits now include `Co-authored-by: GitHub Copilot <copilot@github.com>`
   - Upload script automatically adds co-author to result commits

## Test Structure

### Android Tests (`tests/android/collector.spec.ts`)
- Single test that runs the BCD collector
- Connects to Android WebView via Chrome DevTools Protocol (CDP)
- Navigates to https://collector.openwebdocs.org/
- Waits 30s for collector to complete
- Captures `window.__bcd` and `window.__resources` data
- Saves results to `test-results/android-results.json`

### iOS Tests (`tests/ios/collector.spec.ts`)
- Single test that runs the BCD collector
- Connects to iOS WKWebView via Appium + WebDriverIO
- Same collector process as Android
- Saves results to `test-results/ios-results.json`

## Result Upload Process

Results are uploaded via the `upload-results` script:
- Reads JSON results file
- Creates timestamped filename: `{platform}-{timestamp}.json`
- Uploads to `results/` directory in webview-bcd-results repo
- Also updates `results/latest-{platform}.json` for quick access
- All commits include co-author attribution

## Configuration

### Required Secrets
- `RESULTS_UPLOAD_TOKEN`: GitHub token with write access to webview-bcd-results repo

### Workflow Triggers
- **Schedule**: Every Sunday at 2 AM UTC
- **Manual**: `workflow_dispatch` with optional upload toggle

## Next Steps

To improve iOS testing reliability:
1. Investigate Appium connection timing in CI
2. Consider alternative WebView connection methods
3. Add better error handling and retry logic
4. Explore running tests in parallel vs sequential

## Git Configuration

The repository is configured to automatically add co-author attribution:
- `.gitmessage-copilot` contains the co-author line
- Git commit template is set via `git config commit.template`
- All future commits will include attribution automatically
