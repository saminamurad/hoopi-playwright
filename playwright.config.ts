import { defineConfig, devices } from '@playwright/test';

import 'dotenv/config';

/**
 * Hoopi Playwright config
 * - Uses your logged-in Chrome test profile (playwright/.chrome-profile, created by `npm run auth`)
 * - Screenshot + video + trace kept only when a test fails
 * - HTML report for people, JSON report for the test sheet export
 */
export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',   // closes a leftover test-profile Chrome before the run
  timeout: 60_000,                 // AI pages are slow; chat tests raise this further
  expect: { timeout: 10_000 },
  fullyParallel: false,            // one live account + shared workspace -> run in order
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: process.env.HOOPI_BASE_URL || 'https://app.hoopi.ai',
    // Login: tests run inside the Chrome test profile from `npm run auth` (see fixtures.ts).
    // Screenshot, video and trace of every failure are attached by fixtures.ts.
    headless: true,
    actionTimeout: 15_000,
  },
  projects: [
    { name: 'chrome', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } }, grepInvert: /@mobile/ },
    // Cross-browser (TC-071): only when ALL_BROWSERS=1 (the login profile is Chrome-only)
    ...(process.env.ALL_BROWSERS ? [
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, grepInvert: /@mobile/ }, // note: login profile is Chrome-only
    { name: 'webkit-safari', use: { ...devices['Desktop Safari'] }, grepInvert: /@mobile/ },
    ] : []),
    // Mobile layout (TC-069)
    { name: 'mobile', use: { ...devices['iPhone SE'] }, grep: /@mobile/ },
  ],
});
