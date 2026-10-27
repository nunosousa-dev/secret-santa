import { defineConfig } from '@playwright/test';
import { HOST, ORIGIN, PORT } from './scripts/visual-public-state';

/**
 * Mobile-first visual-acceptance harness for public screens.
 * Captures full-page screenshots at 320 / 390 / 430 CSS-px widths
 * against a dedicated standalone server instance backed by a throwaway
 * SQLite database created fresh under the OS temp dir by
 * scripts/visual-public-stack.ts, so this pass is reproducible in any
 * fresh clone, worktree or CI run rather than depending on one
 * developer's locally seeded real family data.
 */
const BASE_URL = ORIGIN;

export default defineConfig({
  testDir: './tests',
  testMatch: 'visual-acceptance.spec.ts', // node:test suites use *.test.ts and stay out of here; the
  // authenticated admin/edit coverage lives in visual-acceptance-admin.spec.ts,
  // run separately via `npx playwright test --config=playwright.admin.config.ts`
  // so this public, unauthenticated pass keeps running exactly as before.
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
    command: 'tsx scripts/visual-public-stack.ts',
    env: { PORT: String(PORT), HOSTNAME: HOST, APP_URL: ORIGIN, NODE_ENV: 'production' },
    url: `${BASE_URL}/health/live`,
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 60_000,
  },
});
