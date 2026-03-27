# Quick Start

## 🚀 Get Started in 5 Minutes

### 1. Install
```bash
npm install
npx playwright install
npx appium driver install uiautomator2
```

### 2. Setup Android App
```bash
npm run setup:android-app
cd apps/CanIAndroidWebView
./gradlew assembleDebug
```

### 3. Connect Device
```bash
# Connect Android device with USB debugging enabled
adb devices
```

### 4. Install & Launch App
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.example.caniandroidwebview/.MainActivity
```

### 5. Run Tests
```bash
cd ../..
npm run test:android
```

### 6. Upload Results
```bash
export GITHUB_TOKEN=your_token
npm run upload-results test-results/android-results.json
```

## 📋 Commands Cheat Sheet

| Command | Description |
|---------|-------------|
| `npm run test:android` | Run Android tests |
| `npm run test:ios` | Run iOS tests |
| `npm run test` | Run all tests |
| `npm run upload-results <file>` | Upload results to GitHub |
| `npx appium` | Start Appium server |
| `adb devices` | List Android devices |
| `xcrun simctl list devices` | List iOS simulators |

## 📁 Project Structure

```
webview-testing/
├── src/
│   ├── android/          # Android utilities
│   ├── ios/              # iOS utilities
│   ├── common/           # Shared code
│   └── upload/           # GitHub upload
├── tests/
│   ├── android/          # Android test specs
│   └── ios/              # iOS test specs
├── docs/                 # Full documentation
└── apps/                 # Cloned test apps
```

## 📖 Documentation

- **[SETUP.md](docs/SETUP.md)** - Full setup instructions
- **[ANDROID.md](docs/ANDROID.md)** - Android testing guide
- **[IOS.md](docs/IOS.md)** - iOS testing guide
- **[TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common issues
- **[PLAN.md](PLAN.md)** - Implementation roadmap

## 🎯 Next Steps

See **[PLAN.md](PLAN.md)** for detailed implementation status and next actions.
