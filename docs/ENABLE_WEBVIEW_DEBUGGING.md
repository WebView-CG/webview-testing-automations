# Enabling WebView Debugging in CanIAndroidWebView

## Problem

The CanIAndroidWebView app currently doesn't enable WebView debugging, which is required for automated testing via Chrome DevTools Protocol.

## Solution

Add `WebView.setWebContentsDebuggingEnabled(true)` to enable remote debugging of WebView content.

## Required Changes

### File: `app/src/main/java/com/caniwebview/android/MainActivity.kt`

Add this import at the top:
```kotlin
import android.webkit.WebView
import android.os.Build
```

Add this to the `onCreate()` method (before or after `setContentView`):
```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // Enable WebView debugging for automation
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
        WebView.setWebContentsDebuggingEnabled(true)
    }

    binding = ActivityMainBinding.inflate(layoutInflater)
    setContentView(binding.root)
    
    // ... rest of the code
}
```

### Complete Modified MainActivity.kt

```kotlin
package com.caniwebview.android

import android.os.Build
import android.os.Bundle
import android.webkit.WebView
import com.google.android.material.bottomnavigation.BottomNavigationView
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.findNavController
import androidx.navigation.ui.AppBarConfiguration
import androidx.navigation.ui.setupActionBarWithNavController
import androidx.navigation.ui.setupWithNavController
import com.caniwebview.android.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Enable WebView debugging for automation and development
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(true)
        }

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val navView: BottomNavigationView = binding.navView

        val navController = findNavController(R.id.nav_host_fragment_activity_main)
        val appBarConfiguration = AppBarConfiguration(
            setOf(
                R.id.navigation_webview, R.id.navigation_config
            )
        )
        setupActionBarWithNavController(navController, appBarConfiguration)
        navView.setupWithNavController(navController)
    }
}
```

## Security Considerations

This enables WebView debugging on **all builds** including release builds. For production apps, you might want to:

1. **Debug-only** (recommended for most apps):
```kotlin
if (BuildConfig.DEBUG) {
    WebView.setWebContentsDebuggingEnabled(true)
}
```

2. **Always enabled** (fine for test apps like CanIWebView):
```kotlin
WebView.setWebContentsDebuggingEnabled(true)
```

Since CanIAndroidWebView is a testing tool, it's appropriate to always enable debugging.

## Verification

After making this change and rebuilding:

1. Install the app: `adb install -r app/build/outputs/apk/debug/app-debug.apk`
2. Launch the app
3. Load a page in the WebView
4. Check for debugging socket:
   ```bash
   adb shell cat /proc/net/unix | grep webview_devtools_remote
   ```
   
   You should see output like:
   ```
   00000000: 00000002 00000000 00010000 0001 01 123456 @webview_devtools_remote_12345
   ```

5. Or check in Chrome:
   - Open `chrome://inspect/#devices` in Chrome
   - You should see the WebView listed

## Pull Request

This change should be submitted as a PR to the CanIAndroidWebView repository with:

**Title**: Enable WebView debugging for automation support

**Description**:
```
Enables WebView remote debugging to support automated testing with Playwright 
and Chrome DevTools Protocol.

This allows developers to:
- Test the app with automation tools
- Debug WebView content remotely
- Use tools like Playwright for E2E testing

Reference: https://github.com/WebView-CG/webview-testing
```

## Testing

After enabling debugging, tests in this repository should work:

```bash
npm run test:android
```

The tests will be able to connect to the WebView and run automated browser compatibility tests.
