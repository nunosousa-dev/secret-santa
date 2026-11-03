import { existsSync, readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { STATE_FILE, type VisualPublicState } from '../scripts/visual-public-state';

/**
 * Visual acceptance for PUBLIC screens only (no auth flows).
 * Runs at three mobile widths (320 / 390 / 430) and desktop (1280) defined in
 * playwright.config.ts projects. Every shot is full-page at DPR 2.
 *
 * Screenshot names carry the width, e.g. home-320.png.
 */

function loadLongNameMemberId(): string {
  if (!existsSync(STATE_FILE)) {
    throw new Error(`Missing ${STATE_FILE} — the webServer (scripts/visual-public-stack.ts) did not run yet.`);
  }
  const state: VisualPublicState = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  return state.longNameMemberId;
}

// A static path, or a function resolved at test-run time once the webServer's
// synthetic database (and the member ids it created) are ready.
const SCREENS: Array<{ name: string; path: string | (() => string); expectStatus: number }> = [
  { name: 'home', path: '/', expectStatus: 200 },
  { name: 'profile-sample', path: '/p/m-001', expectStatus: 200 },
  { name: 'profile-empty-list', path: '/p/m-006', expectStatus: 200 },
  { name: 'profile-long-name', path: () => `/p/${loadLongNameMemberId()}`, expectStatus: 200 },
  { name: 'not-found-profile', path: '/p/missing-profile', expectStatus: 404 },
  { name: 'edit-rewrite', path: '/editar/m-001', expectStatus: 200 },
  { name: 'not-found-route', path: '/nao-existe-xyz', expectStatus: 404 },
];

const WIDTHS = [320, 390, 430, 1280] as const;
const failures: string[] = [];

test.describe('family directory interactions', () => {
  test('finds a member regardless of accents or surrounding whitespace', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Procurar por nome ou interesse' }).fill('  Ines  ');
    const directory = page.getByRole('region', { name: 'A nossa família' });
    await expect(directory.getByRole('heading', { name: 'Inês', exact: true })).toBeVisible();
    await expect(directory.getByRole('listitem')).toHaveCount(1);
    await expect(directory.getByRole('status')).toHaveText('1 perfil encontrado');
    await page.screenshot({ path: `__screenshots__/home-search-${page.viewportSize()?.width}.png`, fullPage: true });
  });

  test('reports results even when a search matches the whole family', async ({ page }) => {
    await page.goto('/');
    const search = page.getByRole('searchbox', { name: 'Procurar por nome ou interesse' });
    const directory = page.getByRole('region', { name: 'A nossa família' });
    await search.fill('a');
    await expect(directory.getByRole('listitem')).toHaveCount(7);
    await expect(directory.getByRole('status')).toHaveText('7 perfis encontrados');
    await expect(directory.getByRole('status')).toBeVisible();
    await search.fill('   ');
    await expect(directory.getByRole('listitem')).toHaveCount(7);
    await expect(directory.getByRole('status')).toBeEmpty();
  });

  test('recovers from an empty search and keeps the search ready for typing', async ({ page }) => {
    await page.goto('/');
    const search = page.getByRole('searchbox', { name: 'Procurar por nome ou interesse' });
    const directory = page.getByRole('region', { name: 'A nossa família' });
    await search.fill('no-such-relative');
    await expect(directory.getByRole('heading', { name: 'Não encontrámos ninguém.' })).toBeVisible();
    await expect(directory.getByRole('status')).toHaveText('0 perfis encontrados');
    await page.screenshot({ path: `__screenshots__/home-search-empty-${page.viewportSize()?.width}.png`, fullPage: true });
    await directory.getByRole('button', { name: 'Ver toda a família' }).click();
    await expect(search).toHaveValue('');
    await expect(search).toBeFocused();
    await expect(directory.getByRole('listitem')).toHaveCount(7);
    await search.fill('Cafe');
    await expect(directory.getByRole('heading', { name: 'Miguel', exact: true })).toBeVisible();
    await directory.getByRole('button', { name: 'Limpar pesquisa' }).click();
    await expect(search).toBeFocused();
    await expect(directory.getByRole('listitem')).toHaveCount(7);
    await search.fill('Ines');
    await search.press('Escape');
    await expect(search).toHaveValue('');
    await expect(search).toBeFocused();
    await expect(directory.getByRole('listitem')).toHaveCount(7);
  });

  test('returns from a profile to the family heading', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const directory = page.getByRole('region', { name: 'A nossa família' });
    await directory.getByRole('link').filter({ has: page.getByRole('heading', { name: 'Inês', exact: true }) }).click();
    await expect(page).toHaveURL(/\/p\/m-003$/);
    await page.getByRole('link', { name: 'Voltar à família', exact: true }).click();
    await expect(page).toHaveURL(/\/#family$/);
    await expect(page.getByRole('heading', { name: 'A nossa família' })).toBeInViewport({ ratio: 1 });
  });
});

test.describe('visual acceptance — public screens', () => {
  for (const screen of SCREENS) {
    test(`${screen.name} — screenshot + no horizontal overflow`, async ({ page }) => {
      const width = page.viewportSize()?.width ?? 0;
      if (!WIDTHS.includes(width as (typeof WIDTHS)[number])) {
        test.skip();
        return;
      }

      const path = typeof screen.path === 'function' ? screen.path() : screen.path;
      const response = await page.goto(path, { waitUntil: 'networkidle' });
      expect(response?.status(), `HTTP status for ${path}`).toBe(screen.expectStatus);

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
          { message: `horizontal overflow at ${width}px on ${path}: ${overflowing.join(', ')}` }
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
