import { test, expect, type Page } from '@playwright/test';

/**
 * Visual acceptance for PUBLIC screens only (no auth flows).
 * Runs at three mobile widths (320 / 390 / 430) defined in
 * playwright.config.ts projects. Every shot is full-page at DPR 2.
 *
 * Screenshot names carry the width, e.g. home-320.png.
 */

const NUNO_UUID = '09ce5f5f-6c80-49e5-8a7e-e95f1aba7b98';

const SCREENS: Array<{ name: string; path: string; expectStatus: number }> = [
  { name: 'home', path: '/', expectStatus: 200 },
  { name: 'profile-sample', path: '/p/m-001', expectStatus: 200 },
  { name: 'profile-empty-list', path: '/p/m-006', expectStatus: 200 },
  { name: 'profile-long-name', path: `/p/${NUNO_UUID}`, expectStatus: 200 },
  { name: 'not-found-profile', path: '/p/missing-profile', expectStatus: 404 },
  { name: 'edit-rewrite', path: '/editar/m-001', expectStatus: 200 },
  { name: 'not-found-route', path: '/nao-existe-xyz', expectStatus: 404 },
];

const WIDTHS = [320, 390, 430] as const;
const failures: string[] = [];

test.describe('visual acceptance — public screens', () => {
  for (const screen of SCREENS) {
    test(`${screen.name} — screenshot + no horizontal overflow`, async ({ page }) => {
      const width = page.viewportSize()?.width ?? 0;
      if (!WIDTHS.includes(width as (typeof WIDTHS)[number])) {
        test.skip();
        return;
      }

      const response = await page.goto(screen.path, { waitUntil: 'networkidle' });
      expect(response?.status(), `HTTP status for ${screen.path}`).toBe(screen.expectStatus);

      // Stable render: let fonts settle before capture.
      await page.evaluate(() => document.fonts.ready);

      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      const clientWidth = await page.evaluate(
        () => document.documentElement.clientWidth,
      );
      const overflowing = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const bad: string[] = [];
        for (const el of document.querySelectorAll('body *')) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.right > vw + 1) {
            bad.push(
              `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${(el.className || '').toString().split(' ').slice(0, 2).join('.')}`
            );
          }
        }
        return [...new Set(bad)].slice(0, 10);
      });

      await expect
        .poll(
          async () => {
            const sw = await page.evaluate(() => document.documentElement.scrollWidth);
            const cw = await page.evaluate(() => document.documentElement.clientWidth);
            return sw <= cw;
          },
          { message: `horizontal overflow at ${width}px on ${screen.path}: ${overflowing.join(', ')}` }
        )
        .toBe(true)
        .catch((err) => {
          failures.push(`${screen.name} @${width}px: scrollWidth=${scrollWidth} clientWidth=${clientWidth} offenders=[${overflowing.join(', ')}]`);
          throw err;
        });

      await page.screenshot({
        path: `__screenshots__/${screen.name}-${width}.png`,
        fullPage: true,
      });
    });
  }

  test.afterAll(async () => {
    if (failures.length) {
      console.log('\n=== Horizontal overflow failures ===\n' + failures.join('\n'));
    }
  });
});
