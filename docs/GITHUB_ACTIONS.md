# GitHub Actions Setup

This repository is configured to automatically run WebView tests and upload results.

## Workflow

### `weekly-tests.yml` - Automated WebView Testing
**Schedule**: Every Sunday at 2 AM UTC  
**Platforms**: 
- Android: API 29, 30, 33, 34
- iOS: 17.2, 17.4  
**Auto-upload**: ✅ Yes (to webview-bcd-results)  
**Manual trigger**: ✅ Available via workflow_dispatch

## Required Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

| Secret | Description |
|--------|-------------|
| `RESULTS_APP_ID` | Numeric ID of the GitHub App |
| `RESULTS_APP_PRIVATE_KEY` | Private key (`.pem` contents) for the GitHub App |

Results are uploaded using a GitHub App installation token so commits to `webview-bcd-results` are attributed to the app bot, not a personal account.

### Setting up the GitHub App

**1. Create the app**
1. Go to GitHub Settings → Developer settings → GitHub Apps → New GitHub App
   - For a personal account: https://github.com/settings/apps/new
   - For an org: https://github.com/organizations/YOUR_ORG/settings/apps/new
2. Set a name (e.g. `webview-bcd-results-bot`)
3. Uncheck "Active" under Webhooks
4. Under "Repository permissions" set **Contents** to "Read and write"
5. Click "Create GitHub App"
6. Note the **App ID** shown on the app's settings page
7. Scroll to "Private keys" → click "Generate a private key" → save the downloaded `.pem` file

**2. Install the app on the results repository**
1. On the app's settings page click "Install App"
2. Install it on the `WebView-CG/webview-bcd-results` repository only

**3. Add secrets to this repository**
- `RESULTS_APP_ID`: the numeric App ID from the app's settings page
- `RESULTS_APP_PRIVATE_KEY`: the full contents of the `.pem` file, including the `-----BEGIN RSA PRIVATE KEY-----` header and footer

## Schedule Overview

```
Sunday  2 AM UTC  → Weekly full test run (Android + iOS, all versions)
```

Results automatically uploaded to webview-bcd-results repository.

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
3. Workflow exchanges app credentials for a short-lived installation token
4. Upload script authenticates with the installation token
5. Results pushed to webview-bcd-results repo (committed as the app bot)
6. Summary posted to GitHub Actions
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
- Verify `RESULTS_APP_ID` and `RESULTS_APP_PRIVATE_KEY` secrets are set
- Check the GitHub App is installed on `WebView-CG/webview-bcd-results` with Contents write permission
- Verify the private key in the secret includes the full PEM header and footer

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
