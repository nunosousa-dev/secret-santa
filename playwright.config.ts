import { defineConfig } from '@playwright/test';

/**
 * Mobile-first visual-acceptance harness for public screens.
 * Captures full-page screenshots at 320 / 390 / 430 CSS-px widths
 * against the standalone production server (scripts/start.mjs).
 */
const BASE_URL = 'http://127.0.0.1:3100';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts', // node:test suites use *.test.ts and stay out of here
  outputDir: './test-results',
  snapshotDir: './__screenshots__',
  expect: {
    toHaveScreenshot: {
      // Deterministic full-page comparison defaults
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    baseURL: BASE_URL,
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: false,
    screenshot: 'off',
    trace: 'off',
    video: 'off',
  },
  projects: [
    // Layout testing only cares about CSS-px width, so chromium is used for
    // all three (iPhone device presets would force a WebKit download).
    { name: 'width-320', use: { viewport: { width: 320, height: 568 } } },
    { name: 'width-390', use: { viewport: { width: 390, height: 844 } } },
    { name: 'width-430', use: { viewport: { width: 430, height: 932 } } },
  ],
  webServer: {
    command: 'PORT=3100 HOSTNAME=127.0.0.1 node scripts/start.mjs',
    url: `${BASE_URL}/health/live`,
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 60_000,
  },
});
