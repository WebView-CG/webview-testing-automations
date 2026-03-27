# Setup Guide

## Prerequisites

### All Platforms
- Node.js 18+ and npm
- Git
- Java 11+ (for Appium)

### For Android Testing
- Android SDK (via Android Studio or command-line tools)
- Android emulator or physical device with USB debugging enabled
- ADB (Android Debug Bridge) in PATH

### For iOS Testing (macOS only)
- Xcode 13+
- iOS Simulator or physical device
- Xcode Command Line Tools

## Installation

### 1. Clone this repository

```bash
git clone https://github.com/WebView-CG/webview-testing.git
cd webview-testing
```

### 2. Install Node.js dependencies

```bash
npm install
```

### 3. Install Playwright browsers

```bash
npx playwright install
```

### 4. Install Appium drivers

```bash
# For Android
npx appium driver install uiautomator2

# For iOS (macOS only)
npx appium driver install xcuitest
```

### 5. Set up test applications

#### Android App

```bash
# Clone the app
npm run setup:android-app

# Build the app
cd apps/CanIAndroidWebView
./gradlew assembleDebug

# Install on device/emulator
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

#### iOS App (macOS only)

```bash
# Clone the app
npm run setup:ios-app

# Build the app
cd apps/CanIWKWebView
xcodebuild -project CanIWKWebView.xcodeproj \
  -scheme CanIWKWebView \
  -configuration Debug \
  -sdk iphonesimulator \
  -derivedDataPath build

# Install on simulator
xcrun simctl install booted build/Build/Products/Debug-iphonesimulator/CanIWKWebView.app
```

### 6. Configure environment variables

Create a `.env` file:

```bash
# GitHub token for uploading results (needs repo write access)
GITHUB_TOKEN=your_github_token_here

# Optional: specify branch for results
RESULTS_BRANCH=main

# Optional: Android device ID (auto-detected if not set)
ANDROID_DEVICE_ID=

# Optional: iOS device UDID (auto-detected if not set)
IOS_DEVICE_UDID=
```

## Verification

### Verify Android Setup

```bash
# Check connected devices
adb devices

# Check if WebView app is installed
adb shell pm list packages | grep caniandroidwebview

# Launch the app manually
adb shell am start -n com.example.caniandroidwebview/.MainActivity
```

### Verify iOS Setup (macOS only)

```bash
# List available simulators
xcrun simctl list devices

# Check if app is installed on booted simulator
xcrun simctl listapps booted | grep CanIWKWebView
```

### Test Appium Connection

```bash
# Start Appium server in one terminal
npx appium

# In another terminal, verify it's running
curl http://localhost:4723/status
```

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues and solutions.

## Next Steps

- Read the [Android Testing Guide](ANDROID.md)
- Read the [iOS Testing Guide](IOS.md)
- Run your first test: `npm run test:android`
