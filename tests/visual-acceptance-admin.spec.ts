import { existsSync, readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import { ORIGIN, STATE_FILE, type VisualAdminState } from '../scripts/visual-admin-state';

/**
 * Visual acceptance for screens that require authentication, plus the
 * home page's demo-preview banner. Runs at three mobile widths
 * (320 / 390 / 430, see playwright.admin.config.ts) against a dedicated
 * server backed by an isolated, throwaway SQLite database created by
 * scripts/visual-admin-stack.ts. The admin password and member editing
 * session used below are synthetic and freshly generated per run —
 * nothing here ever touches data/family.sqlite or a real family member.
 *
 * Run with: npx playwright test --config=playwright.admin.config.ts
 */

function loadState(): VisualAdminState {
  if (!existsSync(STATE_FILE)) {
    throw new Error(`Missing ${STATE_FILE} — the admin webServer (scripts/visual-admin-stack.ts) did not run yet.`);
  }
  return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
}

async function loginAsAdminViaApi(page: Page, password: string) {
  const response = await page.request.post('/api/admin/login', {
    data: { password },
    headers: { Origin: ORIGIN },
  });
  expect(response.ok(), 'admin API login must succeed with the harness-generated password').toBeTruthy();
}

const WIDTHS = [320, 390, 430] as const;
const failures: string[] = [];

async function checkOverflowAndShoot(page: Page, name: string, width: number) {
  // Stable render: let fonts settle before measuring/capturing.
  await page.evaluate(() => document.fonts.ready);

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
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
      { message: `horizontal overflow at ${width}px on ${name}: ${overflowing.join(', ')}` }
    )
    .toBe(true)
    .catch((err) => {
      failures.push(`${name} @${width}px: scrollWidth=${scrollWidth} clientWidth=${clientWidth} offenders=[${overflowing.join(', ')}]`);
      throw err;
    });

  await page.screenshot({
    path: `__screenshots__/${name}-${width}.png`,
    fullPage: true,
  });
}

test.describe('visual acceptance — admin login (unauthenticated)', () => {
  for (const width of WIDTHS) {
    test(`admin login form @${width}`, async ({ page }) => {
      if ((page.viewportSize()?.width ?? 0) !== width) { test.skip(); return; }

      const response = await page.goto('/admin', { waitUntil: 'networkidle' });
      expect(response?.status(), 'HTTP status for /admin (no session)').toBe(200);
      await expect(page.getByLabel('Palavra-passe do organizador')).toBeVisible();

      await checkOverflowAndShoot(page, 'admin-login', width);
    });
  }
});

test.describe('visual acceptance — admin panel (authenticated via the real login form)', () => {
  for (const width of WIDTHS) {
    test(`admin panel @${width}`, async ({ page }) => {
      if ((page.viewportSize()?.width ?? 0) !== width) { test.skip(); return; }
      const { adminPassword } = loadState();

      // Exercises the real end-to-end login flow, not a faked cookie.
      await page.goto('/admin', { waitUntil: 'networkidle' });
      await page.getByLabel('Palavra-passe do organizador').fill(adminPassword);
      await page.getByRole('button', { name: 'Entrar na administração' }).click();
      await page.waitForURL('**/admin');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: 'Perfis e ligações privadas' })).toBeVisible();

      await checkOverflowAndShoot(page, 'admin-panel', width);
    });
  }
});

test.describe('visual acceptance — admin/cards screen layout (authenticated)', () => {
  for (const width of WIDTHS) {
    test(`admin cards layout @${width}`, async ({ page }) => {
      if ((page.viewportSize()?.width ?? 0) !== width) { test.skip(); return; }
      const { adminPassword } = loadState();
      await loginAsAdminViaApi(page, adminPassword);

      const response = await page.goto('/admin/cards', { waitUntil: 'networkidle' });
      expect(response?.status(), 'HTTP status for /admin/cards (authenticated)').toBe(200);

      await checkOverflowAndShoot(page, 'admin-cards', width);
    });
  }
});

test.describe('visual acceptance — admin/cards A4 print emulation', () => {
  test('admin cards print preview + PDF', async ({ page }) => {
    // Media/PDF emulation does not vary by viewport width; run it once.
    if ((page.viewportSize()?.width ?? 0) !== 320) { test.skip(); return; }
    const { adminPassword } = loadState();
    await loginAsAdminViaApi(page, adminPassword);

    const response = await page.goto('/admin/cards', { waitUntil: 'networkidle' });
    expect(response?.status(), 'HTTP status for /admin/cards (authenticated)').toBe(200);
    await page.evaluate(() => document.fonts.ready);

    await page.emulateMedia({ media: 'print' });
    await page.screenshot({ path: '__screenshots__/admin-cards-print-a4.png', fullPage: true });
    await page.pdf({ path: '__screenshots__/admin-cards-print-a4.pdf', format: 'A4', printBackground: true });
  });
});

test.describe('visual acceptance — edit locked (no session)', () => {
  for (const width of WIDTHS) {
    test(`edit locked @${width}`, async ({ page }) => {
      if ((page.viewportSize()?.width ?? 0) !== width) { test.skip(); return; }
      const { memberId } = loadState();

      const response = await page.goto(`/edit/${memberId}`, { waitUntil: 'networkidle' });
      expect(response?.status(), `HTTP status for /edit/${memberId} (no session)`).toBe(200);
      await expect(page.getByRole('heading', { name: 'A tua ligação privada' })).toBeVisible();

      await checkOverflowAndShoot(page, 'edit-locked', width);
    });
  }
});

test.describe('visual acceptance — edit unlocked (member session)', () => {
  for (const width of WIDTHS) {
    test(`edit unlocked @${width}`, async ({ page, context }) => {
      if ((page.viewportSize()?.width ?? 0) !== width) { test.skip(); return; }
      const { memberId, memberSessionToken, memberSessionExpiresAt } = loadState();

      // The session itself was created with store.openMemberSession() in
      // scripts/visual-admin-stack.ts (same real code path as /api/edit/session);
      // we only attach the resulting cookie here instead of re-driving the form.
      await context.addCookies([{
        name: 'as_member',
        value: memberSessionToken,
        url: ORIGIN,
        httpOnly: true,
        sameSite: 'Lax',
        expires: Math.floor(memberSessionExpiresAt / 1000),
      }]);

      const response = await page.goto(`/edit/${memberId}`, { waitUntil: 'networkidle' });
      expect(response?.status(), `HTTP status for /edit/${memberId} (member session)`).toBe(200);
      await expect(page.getByRole('button', { name: 'Guardar preferências' })).toBeVisible();

      await checkOverflowAndShoot(page, 'edit-unlocked', width);
    });
  }
});

test.describe('visual acceptance — home page with the demo/preview banner', () => {
  for (const width of WIDTHS) {
    test(`home demo banner @${width}`, async ({ page }) => {
      if ((page.viewportSize()?.width ?? 0) !== width) { test.skip(); return; }

      const response = await page.goto('/', { waitUntil: 'networkidle' });
      expect(response?.status(), 'HTTP status for /').toBe(200);
      await expect(page.getByText('Pré-visualização · nomes, avatares e preferências fictícios.')).toBeVisible();

      await checkOverflowAndShoot(page, 'home-demo-banner', width);
    });
  }
});

test.afterAll(async () => {
  if (failures.length) {
    console.log('\n=== Horizontal overflow failures (admin) ===\n' + failures.join('\n'));
  }
});
