import { defineConfig } from '@playwright/test';
import { HOST, ORIGIN, PORT } from './scripts/visual-admin-state';

/**
 * Visual-acceptance harness for screens that require authentication:
 * /admin (login + authenticated panel), /admin/cards (layout + A4 print),
 * /edit/<id> (locked + unlocked) and the home page's demo-preview banner.
 *
 * Runs its own standalone server instance (a different port from
 * playwright.config.ts) backed by a throwaway SQLite database created
 * fresh under the OS temp dir by scripts/visual-admin-stack.ts. It never
 * reads or writes the committed/gitignored data/family.sqlite, and every
 * admin password / member session it uses is generated at run time.
 *
 * Run with: npx playwright test --config=playwright.admin.config.ts
 */
export default defineConfig({
  testDir: './tests',
  testMatch: 'visual-acceptance-admin.spec.ts', // keep separate from the public-screen spec
  outputDir: './test-results-admin',
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
    baseURL: ORIGIN,
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
    command: 'tsx scripts/visual-admin-stack.ts',
    env: { PORT: String(PORT), HOSTNAME: HOST, APP_URL: ORIGIN, NODE_ENV: 'production' },
    url: `${ORIGIN}/health/live`,
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 60_000,
  },
});
