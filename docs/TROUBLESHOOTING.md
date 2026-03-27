# Troubleshooting

## Android Issues

### ADB Not Found

**Symptoms**: `adb: command not found`

**Solutions**:
```bash
# macOS - Install via Homebrew
brew install android-platform-tools

# Linux - Install via apt
sudo apt-get install android-tools-adb android-tools-fastboot

# Or add Android SDK platform-tools to PATH
export PATH=$PATH:$HOME/Android/Sdk/platform-tools
```

### Device Unauthorized

**Symptoms**: `adb devices` shows device as "unauthorized"

**Solutions**:
- Check device screen for authorization prompt
- Revoke USB debugging: Settings → Developer options → Revoke USB debugging authorizations
- Reconnect device and authorize again

### WebView Debugging Not Working

**Symptoms**: Cannot find WebView socket or connect via CDP

**Solutions**:
1. Ensure `WebView.setWebContentsDebuggingEnabled(true)` is in the app code
2. Rebuild and reinstall the app
3. Check if WebView is actually loaded (visit a page in the app)
4. Verify socket exists: `adb shell cat /proc/net/unix | grep webview_devtools_remote`

### Multiple WebViews Detected

**Symptoms**: Multiple webview_devtools_remote sockets found

**Solutions**:
- Close other apps using WebView
- Use PID filtering to find the correct WebView
- Modify test to specify exact package name

### Gradle Build Fails

**Symptoms**: Cannot build Android app

**Solutions**:
```bash
# Update Gradle wrapper
cd apps/CanIAndroidWebView
./gradlew wrapper --gradle-version 8.0

# Clean build
./gradlew clean build

# Check Java version (needs JDK 11+)
java -version
```

## iOS Issues

### Xcode Command Line Tools Not Found

**Symptoms**: `xcodebuild: command not found`

**Solutions**:
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Set active developer directory
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### Simulator Not Booting

**Symptoms**: Simulator won't start or appears stuck

**Solutions**:
```bash
# List simulators
xcrun simctl list devices

# Delete and recreate simulator
xcrun simctl delete <device-id>
xcrun simctl create "iPhone 13" "iPhone 13"

# Reset simulator
xcrun simctl erase <device-id>

# Restart CoreSimulatorService
sudo killall -9 com.apple.CoreSimulator.CoreSimulatorService
```

### Code Signing Issues

**Symptoms**: App won't install or launch due to signing errors

**Solutions**:
1. Open project in Xcode
2. Select the app target
3. Go to "Signing & Capabilities"
4. Enable "Automatically manage signing"
5. Select your development team
6. Build from Xcode first to resolve signing

### Web Inspector Not Available

**Symptoms**: Can't see WKWebView in Safari Develop menu

**Solutions**:
1. Ensure app is built in Debug configuration
2. Add `isInspectable = true` for iOS 16.4+ (see docs/IOS.md)
3. Restart Safari
4. Check Safari → Preferences → Advanced → "Show Develop menu in menu bar"

## Appium Issues

### Appium Server Won't Start

**Symptoms**: `Error: listen EADDRINUSE: address already in use :::4723`

**Solutions**:
```bash
# Find process using port 4723
lsof -i :4723

# Kill process
kill -9 <PID>

# Or use different port
npx appium --port 4724
```

### Driver Installation Fails

**Symptoms**: `appium driver install` fails

**Solutions**:
```bash
# Clear Appium cache
rm -rf ~/.appium

# Reinstall driver with verbose output
npx appium driver install uiautomator2 --verbose
```

## Playwright Issues

### Browser Download Fails

**Symptoms**: Cannot download Playwright browsers

**Solutions**:
```bash
# Set custom download path
export PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright

# Re-install browsers
npx playwright install --force
```

### CDP Connection Timeout

**Symptoms**: `TimeoutError: Timeout 30000ms exceeded` when connecting

**Solutions**:
1. Increase timeout in test configuration
2. Check if WebView is fully loaded before connecting
3. Verify port forwarding: `adb forward --list`
4. Check if CDP endpoint is accessible: `curl http://localhost:9222/json`

## Test Execution Issues

### Tests Timeout

**Symptoms**: Tests consistently timeout

**Solutions**:
- Increase test timeout in `playwright.config.ts`
- Check network connectivity on device/simulator
- Verify the test URL (collector.openwebdocs.org) is accessible
- Add more wait time after app launch

### Flaky Tests

**Symptoms**: Tests pass sometimes, fail other times

**Solutions**:
- Add explicit waits: `await page.waitForLoadState('networkidle')`
- Increase `sleep()` durations after app launch
- Use retry logic for connection establishment
- Check device performance (low memory, CPU throttling)

### Screenshot/Video Capture Fails

**Symptoms**: Artifacts not saved

**Solutions**:
```bash
# Ensure directory exists
mkdir -p test-results

# Check permissions
chmod 755 test-results

# Verify in playwright.config.ts
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
}
```

## Upload Issues

### GitHub Token Invalid

**Symptoms**: `401 Unauthorized` when uploading

**Solutions**:
1. Verify token has `repo` scope
2. Check token hasn't expired
3. Test token: `curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user`

### Upload Fails

**Symptoms**: Results don't appear in repository

**Solutions**:
- Check repository name: `WebView-CG/webview-bcd-results`
- Verify branch exists (default: `main`)
- Check file permissions
- View detailed error: `DEBUG=* npm run upload-results`

## Environment Issues

### Java Version Incompatible

**Symptoms**: Appium fails to start with Java errors

**Solutions**:
```bash
# Check Java version (needs 11+)
java -version

# Install correct version
# macOS
brew install openjdk@17
echo 'export PATH="/usr/local/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc

# Linux
sudo apt-get install openjdk-17-jdk
```

## Getting Help

- Open an issue: https://github.com/WebView-CG/webview-testing/issues
- WebView CG: https://www.w3.org/community/webview/
- Playwright Discord: https://aka.ms/playwright/discord
- Appium Discussions: https://github.com/appium/appium/discussions
