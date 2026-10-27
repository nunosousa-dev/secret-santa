# Visual acceptance (automated)

Playwright drives headless Chromium at three mobile widths — 320, 390 and 430 CSS
pixels (`playwright.config.ts` / `playwright.admin.config.ts` projects `width-320`,
`width-390`, `width-430`) — to catch layout regressions before a manual device pass
(see `DEVICE_VERIFICATION.md` for what still needs a real phone/printer).

Every test takes a full-page screenshot into `__screenshots__/<name>-<width>.png`
(gitignored) and asserts there is no horizontal overflow
(`document.documentElement.scrollWidth <= clientWidth`), reporting the first ten
overflowing elements if it fails.

## Public screens — `tests/visual-acceptance.spec.ts`

```sh
npx playwright test --config=playwright.config.ts
```

Boots a dedicated standalone server (`scripts/visual-public-stack.ts`) on port 3100,
backed by a **fresh, throwaway SQLite database** created under the OS temp directory
and seeded with the standard sample members plus one synthetic long-name member with
no named avatar (to exercise the initials-fallback avatar and long-name layout). This
never reads or writes the committed `data/family.sqlite`, so the pass is reproducible
in any fresh clone, worktree or CI run.

Covers: home (`/`), a full sample profile, an empty-wishlist profile, the
long-name/initials-avatar profile, both 404 variants (`/p/missing-profile` and an
unknown route), and one Portuguese-URL rewrite sanity check (`/editar/<id>`).

## Authenticated screens — `tests/visual-acceptance-admin.spec.ts`

```sh
npx playwright test --config=playwright.admin.config.ts
```

Boots a second, independent standalone server (`scripts/visual-admin-stack.ts`) on
port 3101, backed by its own fresh throwaway SQLite database with a **freshly
generated, synthetic admin password** and a **freshly created member editing
session** — never a real admin password, never a real family member's session.
Admin login is driven through the real `/api/admin/login` form/endpoint rather than
a faked cookie; the member session cookie is attached directly since it is created
with the same `openMemberSession` store call the real `/api/edit/session` endpoint
uses.

Covers: `/admin` unauthenticated (login form) and authenticated (panel), `/admin/cards`
screen layout, the `/admin/cards` A4 print layout (via
`page.emulateMedia({ media: 'print' })`, captured as both a screenshot and a
`page.pdf()` A4 export), `/edit/<id>` locked (no session) and unlocked (member
session), and the home page's demo/preview banner.

Both specs are intentionally kept in separate config/test files so the public pass
never needs authentication and the authenticated pass never risks touching real
family data — each runs against its own independent, disposable database.

## What remains a manual pass

Neither spec (nor any automated check) can confirm real iOS Safari / Android Chrome
behaviour, actual printer output and paper alignment, or QR-code scanning with a real
phone camera. See `DEVICE_VERIFICATION.md` for that checklist.
