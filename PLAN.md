# Implementation Plan - WebView Automated Testing

**Last Updated**: March 26, 2026  
**Status**: Phase 1 - Initial Setup Complete

## Repository Structure Decision ✅

- **Testing Infrastructure**: `WebView-CG/webview-testing` (this repo)
- **Test Results**: `WebView-CG/webview-bcd-results` (existing)
- **App Modifications**: PRs to individual app repos

## Current Status

### ✅ Completed
- [x] Repository initialized with git
- [x] npm project created with dependencies
- [x] Project structure created
- [x] TypeScript configuration
- [x] Android WebView helper utilities created
- [x] iOS WKWebView helper utilities created (stub)
- [x] Common utilities and types defined
- [x] Result upload mechanism implemented
- [x] Sample Android test suite created
- [x] GitHub Actions workflows created
- [x] Documentation written (SETUP, ANDROID, IOS, TROUBLESHOOTING, CONTRIBUTING)
- [x] README with project overview

### 🚧 In Progress
- [ ] Testing the Android implementation

### ⏳ Not Started
- [ ] iOS implementation details
- [ ] Comprehensive test coverage
- [ ] Real device testing
- [ ] Result visualization

---

## Phase 1: Android WebView Testing (CURRENT)

### Next Immediate Steps

1. **Clone and Modify Android App**
   ```bash
   cd apps
   git clone https://github.com/WebView-CG/CanIAndroidWebView.git
   cd CanIAndroidWebView
   ```
   
   - [ ] Identify the MainActivity file
   - [ ] Add `WebView.setWebContentsDebuggingEnabled(true)`
   - [ ] Add intent handling for URL parameter
   - [ ] Build APK: `./gradlew assembleDebug`
   - [ ] Test APK installation and launch

2. **Test Basic Connection**
   - [ ] Connect Android device or start emulator
   - [ ] Install modified APK
   - [ ] Launch app
   - [ ] Test port forwarding manually
   - [ ] Verify CDP endpoint: `curl http://localhost:9222/json`

3. **Run First Automated Test**
   - [ ] Update package name in test file
   - [ ] Run: `npm run test:android`
   - [ ] Debug and fix any connection issues
   - [ ] Verify collector.openwebdocs.org loads

4. **Enhance Test Suite**
   - [ ] Add more collector feature tests
   - [ ] Extract BCD (Browser Compatibility Data)
   - [ ] Test various WebView settings
   - [ ] Capture comprehensive device metadata

5. **Create PR for Android App**
   - [ ] Fork CanIAndroidWebView
   - [ ] Create branch: `feature/automation-support`
   - [ ] Commit minimal changes for automation
   - [ ] Write PR description with rationale
   - [ ] Submit PR to WebView-CG/CanIAndroidWebView

---

## Phase 2: iOS WKWebView Testing

### Implementation Approach Decision Needed

**Option A: Appium + WebDriver**
- Use Appium XCUITest driver
- Standard WebDriver protocol
- More complex setup

**Option B: Safari Remote Debugging**
- Use ios-webkit-debug-proxy
- Direct WebKit debugging protocol
- Similar to Android approach

**Option C: Safari RemoteAutomation**
- Native Safari automation
- Requires Safari Technology Preview
- Most reliable but limited availability

**Recommended**: Start with Option A (Appium), document Option B as alternative

### Steps
- [ ] Research best iOS automation approach
- [ ] Implement connection helper
- [ ] Modify iOS app for debugging
- [ ] Port Android tests to iOS
- [ ] Test on simulator
- [ ] Test on real device
- [ ] Create PR for iOS app

---

## Phase 3: Result Collection & Upload

### Current Implementation
- ✅ Upload script created
- ✅ GitHub API integration via Octokit
- ✅ JSON result format defined

### Enhancements Needed
- [ ] Test upload script with real results
- [ ] Add result validation
- [ ] Create result schema documentation
- [ ] Add summary generation
- [ ] Create index/catalog of all results

### Results Repository Setup
- [ ] Create README in webview-bcd-results
- [ ] Document result schema
- [ ] Add GitHub Actions for validation
- [ ] Create visualization/dashboard (optional)

---

## Phase 4: CI/CD Integration

### GitHub Actions
- ✅ Android workflow created
- ✅ iOS workflow created
- [ ] Test workflows in repository
- [ ] Configure secrets (RESULTS_UPLOAD_TOKEN)
- [ ] Set up scheduled runs
- [ ] Add status badges to README

### Testing Strategy
- Run on multiple Android API levels (29, 30, 33, 34)
- Run on multiple iOS versions (16.4, 17.0, 17.4)
- Test on different device sizes
- Schedule daily/weekly runs

---

## Phase 5: Documentation & Community

### Technical Documentation
- ✅ Setup guide
- ✅ Android guide
- ✅ iOS guide (basic)
- ✅ Troubleshooting
- ✅ Contributing guide
- [ ] API documentation
- [ ] Architecture diagram
- [ ] Result schema documentation

### Community Resources
- [ ] Create example project repository
- [ ] Write blog post for caniwebview.com
- [ ] Create video tutorial (screen recording)
- [ ] Submit article to MDN
- [ ] Share on Twitter/Mastodon
- [ ] Present at WebView CG meeting

### caniwebview.com Integration
- [ ] Add "Automated Testing" section
- [ ] Link to this repository
- [ ] Link to results repository
- [ ] Embed result visualizations
- [ ] Add getting started guide

---

## Technical Debt & Future Work

### Improvements
- [ ] Support for Selenium WebDriver
- [ ] Support for WebDriverIO
- [ ] Windows WebView2 testing
- [ ] Test result comparison over time
- [ ] Performance benchmarking
- [ ] Accessibility testing
- [ ] Network condition simulation
- [ ] Geolocation testing

### Infrastructure
- [ ] Docker containers for reproducible environments
- [ ] Cloud device testing integration (BrowserStack, Sauce Labs)
- [ ] Result caching and deduplication
- [ ] Automated regression detection

---

## Key Decisions & Rationale

### Why Playwright?
- Modern, well-maintained
- Excellent Chrome DevTools Protocol support
- Good TypeScript integration
- Strong community

### Why Separate Repos?
- **Testing infrastructure**: Reusable by community
- **Apps**: Keep simple and focused
- **Results**: Centralized data, easy to query

### Why collector.openwebdocs.org?
- Comprehensive feature detection
- Maintained by Open Web Docs
- Produces structured, useful data
- Aligns with BCD goals

---

## Success Metrics

**Phase 1 (Android) - Target: Week 2**
- [x] Infrastructure setup complete
- [ ] Android tests run successfully
- [ ] Results uploaded to webview-bcd-results
- [ ] PR submitted to CanIAndroidWebView

**Phase 2 (iOS) - Target: Week 4**
- [ ] iOS tests run successfully
- [ ] Results uploaded
- [ ] PR submitted to CanIWKWebView

**Phase 3 (Polish) - Target: Week 6**
- [ ] CI/CD running
- [ ] Documentation complete
- [ ] Community announcement

---

## Next Action Items (Priority Order)

1. **IMMEDIATE**: Modify CanIAndroidWebView app for automation
2. **IMMEDIATE**: Test Android WebView connection manually
3. **TODAY**: Run first automated test
4. **THIS WEEK**: Complete Android implementation
5. **NEXT WEEK**: Start iOS implementation

---

## Questions to Resolve

- [ ] What is the actual package name for CanIAndroidWebView?
- [ ] What WebView settings should be tested?
- [ ] Should we test on real devices or emulators/simulators?
- [ ] How frequently should CI run? (daily/weekly/on-demand)
- [ ] What level of detail in results? (full BCD data or summary)

---

## Resources

- Collector: https://collector.openwebdocs.org/
- Results repo: https://github.com/WebView-CG/webview-bcd-results
- Android app: https://github.com/WebView-CG/CanIAndroidWebView
- iOS app: https://github.com/WebView-CG/CanIWKWebView
- Playwright: https://playwright.dev/
- Appium: http://appium.io/
