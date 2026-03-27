# iOS WKWebView Testing Setup

## Prerequisites

### 1. Install ios-webkit-debug-proxy

```bash
brew install ios-webkit-debug-proxy
```

### 2. Clone and Build the CanIWKWebView App

```bash
# Clone the app
npm run setup:ios-app

# Build for simulator
cd apps/CanIWKWebView
xcodebuild -project CanIWKWebView.xcodeproj \
  -scheme CanIWKWebView \
  -configuration Debug \
  -sdk iphonesimulator \
  -derivedDataPath build \
  CODE_SIGNING_ALLOWED=NO
```

### 3. Enable Web Inspector in the App

The app needs to enable Web Inspector for remote debugging. Add this to `WebViewTab.swift`:

```swift
// In the WKWebViewConfiguration setup
if #available(iOS 16.4, *) {
    configuration.preferences.isElementFullscreenEnabled = true
}
// Enable inspector
configuration.preferences.setValue(true, forKey: "developerExtrasEnabled")
```

## Running Tests

### Step 1: Start iOS Simulator

```bash
# List available simulators
xcrun simctl list devices available

# Boot a simulator (or use Xcode to start one)
open -a Simulator
```

### Step 2: Install and Launch App

```bash
# Get simulator UDID
UDID=$(xcrun simctl list devices booted | grep -E -o -i "([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})" | head -1)

# Install app
xcrun simctl install $UDID apps/CanIWKWebView/build/Build/Products/Debug-iphonesimulator/CanIWKWebView.app

# Launch app
xcrun simctl launch $UDID com.caniwebview.wkwebview
```

### Step 3: Start ios-webkit-debug-proxy

```bash
# Start proxy for the simulator
ios_webkit_debug_proxy -c $UDID:9222 -d
```

Keep this running in a separate terminal.

### Step 4: Run Tests

```bash
npm run test:ios
```

## Troubleshooting

### "No WebView pages found"

- Make sure the app is running
- Ensure Web Inspector is enabled (see step 3 above)
- Check that ios-webkit-debug-proxy is running
- Try navigating to a page in the app first

### "fetch failed" 

- ios-webkit-debug-proxy might not be running
- Check if the proxy is accessible: `curl http://localhost:9222/json`
- Restart the proxy if needed

### "failed to launch com.caniwebview.wkwebview"

- App might not be installed
- Check installed apps: `xcrun simctl listapps $UDID`
- Reinstall the app

### Connection Issues

```bash
# Check if proxy is running
lsof -i :9222

# Kill existing proxy
pkill -9 ios_webkit_debug_proxy

# Restart proxy
ios_webkit_debug_proxy -c $UDID:9222 -d
```

## CI/CD

The GitHub Actions workflow automatically:
1. Boots simulator
2. Builds and installs app
3. Starts ios-webkit-debug-proxy
4. Runs tests
5. Uploads results

No manual setup needed in CI!
