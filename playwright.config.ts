import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Mobile tests should run sequentially
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  timeout: 60000,
  expect: {
    timeout: 10000
  },
  projects: [
    {
      name: 'android-webview',
      testDir: './tests/android',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'ios-webview',
      testDir: './tests/ios',
      use: {
        ...devices['iPhone 13'],
      },
    },
  ],
});
