# GitHub Actions Setup

This repository is configured to automatically run WebView tests and upload results.

## Workflows

### 1. `weekly-tests.yml` - Main Automated Testing
**Schedule**: Every Sunday at 2 AM UTC  
**Platforms**: Android (API 29, 30, 33, 34) + iOS (17.2, 17.4)  
**Auto-upload**: ✅ Yes (to webview-bcd-results)

### 2. `android-tests.yml` - Android Only
**Triggers**: Push to main, PRs, Manual, Weekly (Mondays)  
**Platforms**: Android (API 29, 30, 33)  
**Auto-upload**: ✅ Yes (scheduled runs only)

### 3. `ios-tests.yml` - iOS Only  
**Triggers**: Push to main, PRs, Manual, Weekly (Tuesdays)  
**Platforms**: iOS (16.4, 17.0)  
**Auto-upload**: ✅ Yes (scheduled runs only)

## Required Secrets

Add these secrets to your GitHub repository:

### `RESULTS_UPLOAD_TOKEN`
A GitHub Personal Access Token with `repo` scope to upload to webview-bcd-results.

**Create token:**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (all)
4. Copy the token
5. Add to repository secrets:
   - Go to repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `RESULTS_UPLOAD_TOKEN`
   - Value: your token

## Schedule Overview

```
Sunday    2 AM UTC  → Weekly full test run (all platforms)
Monday    2 AM UTC  → Android tests (if enabled separately)
Tuesday   2 AM UTC  → iOS tests (if enabled separately)
```

**Recommendation**: Keep only `weekly-tests.yml` enabled for weekly runs, disable schedules in android/ios-tests.yml to avoid duplicates.

## Manual Triggers

Run tests manually via GitHub Actions UI:
1. Go to Actions tab
2. Select workflow
3. Click "Run workflow"
4. Choose branch and options

## Test Matrix

### Android
- API Level 29 (Android 10)
- API Level 30 (Android 11)
- API Level 33 (Android 13)
- API Level 34 (Android 14)

### iOS
- iOS 17.2 (Xcode 15.2)
- iOS 17.4 (Xcode 15.3)

## Result Upload Flow

```
1. Tests run on emulator/simulator
2. Results saved to test-results/*.json
3. Upload script authenticates with GITHUB_TOKEN
4. Results pushed to webview-bcd-results repo
5. Summary posted to GitHub Actions
```

## Monitoring

- Check Actions tab for workflow status
- View artifacts for detailed results
- Monitor webview-bcd-results repo for uploaded data
- Set up notifications for failed runs

## Cost Considerations

**GitHub Actions free tier:**
- 2,000 minutes/month for private repos
- Unlimited for public repos

**Estimated usage per run:**
- Android (4 API levels): ~40 minutes
- iOS (2 versions): ~30 minutes
- **Total per week**: ~70 minutes

This is well within free tier limits for public repositories.

## Customization

### Change schedule
Edit the `cron` expression in workflow files:
```yaml
schedule:
  - cron: '0 2 * * 0'  # Sunday at 2 AM UTC
  # Format: minute hour day-of-month month day-of-week
```

### Add more platforms
```yaml
strategy:
  matrix:
    api-level: [29, 30, 31, 32, 33, 34]  # Add more API levels
```

### Skip upload
Remove or comment out the "Upload test results" step.

## Troubleshooting

### Workflow fails to start
- Check repository has Actions enabled
- Verify workflow YAML syntax
- Check branch protection rules

### Upload fails
- Verify RESULTS_UPLOAD_TOKEN secret is set
- Check token has `repo` scope
- Verify webview-bcd-results repository exists and is accessible

### Tests timeout
- Increase timeout in playwright.config.ts
- Adjust emulator boot time waits
- Check emulator performance settings

## Disabling Automated Runs

To disable automatic weekly runs while keeping manual trigger:

```yaml
on:
  # Remove or comment out schedule section
  # schedule:
  #   - cron: '0 2 * * 0'
  workflow_dispatch:  # Keep this for manual runs
```
