# Device verification checklist

Automated checks (lint, TypeScript, unit tests, production build, and the Playwright
visual-acceptance harness in `tests/visual-acceptance.spec.ts`) confirm layout and
markup at 320/390/430 CSS-pixel widths in a headless browser. They cannot confirm real
device behaviour: iOS Safari, Android Chrome, printer output and QR scanning with an
actual phone camera. Run this checklist by hand before the family launch.

Mark each row done/blocked as you go. Use a real family member's editing link where a
step needs one, or ask the organiser to generate one from `/admin`.

## 1. Setup

- [ ] Confirm the hostname you are testing against: local HTTPS
      (`https://amigo-secreto.local.nunosousa.dev`) or public
      (`https://amigo-secreto.nunosousa.dev`) once promoted. Printed QR codes and
      shared editing links only work against the origin they were generated for.
- [ ] Confirm phones are on the home network/VPN if testing the local hostname.
- [ ] Have at least one real editing link ready (ask the organiser, or generate one
      from `/admin` → member → "Criar ligação privada").
- [ ] Have one printed card sheet ready (see §5), or a PDF of one on the test phone.

## 2. iOS Safari

Device/model: _______________  iOS version: _______________

- [ ] Open the family landing page (`/`). No horizontal scrolling, hero/illustration
      not clipped, directory grid readable, tap targets comfortable with a thumb.
- [ ] Search the family directory; results filter without layout jumps.
- [ ] Open a profile from the directory (`/p/<id>`). Optional empty fields are hidden,
      not shown as blank/awkward gaps.
- [ ] Open an editing link (`/edit/<id>#token=...`) fresh (no prior session in this
      browser). Confirm the locked "EditAccess" screen appears first, then unlocks.
- [ ] Edit a field (e.g. a wish) on the phone keyboard. Confirm the keyboard does not
      hide the field being edited or the save control, and saving gives clear
      success/error feedback.
- [ ] Background the app mid-edit (switch apps, lock the phone) and return. Confirm
      the session/edit state survives or fails gracefully.
- [ ] Follow an external gift link from a profile, then use Safari's back button to
      return to the profile without losing place.
- [ ] Scan a printed QR code with the Camera app. Confirm it opens the public profile
      directly with no login prompt.
- [ ] Rotate the phone to landscape on the landing page and a profile; confirm no
      broken layout (not a primary target, but shouldn't look broken).

## 3. Android Chrome

Device/model: _______________  Android version: _______________

- [ ] Repeat every bullet from §2 (landing page, search, profile, editing link,
      keyboard behaviour, backgrounding, external link + back button, QR scan).
- [ ] Specifically check the on-screen keyboard's "resize vs overlay" behaviour on
      the edit form, since Android handles viewport-on-keyboard differently from iOS.
- [ ] Scan a printed QR code with Google Lens / the default camera app, not just a
      dedicated QR app, since that's what most family members will actually use.

## 4. Organiser/admin on a phone

- [ ] Log into `/admin` on a phone. Form is usable one-handed, password field behaves
      (no autocapitalize/autocorrect issues).
- [ ] From `/admin`, view the member list, rotate/reveal a private editing link, and
      confirm the long token/URL is readable or copyable without breaking layout.
- [ ] Open `/admin/cards` on a phone. Confirm the screen preview (not the print
      layout) is legible at this width.

## 5. Printing (A4, 6 cards per sheet)

- [ ] Open `/admin/cards` on a desktop/laptop browser and use the in-page print
      button (not the browser's own print shortcut) to trigger `window.print()`.
- [ ] In the print dialog, confirm paper size is A4, scale is 100% (not "fit to
      page"), and margins match the page's own `@page` rule (print preview should
      already look correct without manual adjustment).
- [ ] Print (or "Save as PDF" first, then print) one full sheet. Confirm 6 cards
      appear per sheet, each with avatar, name and QR code, and the dashed fold
      guides line up with where you'd actually cut/fold.
- [ ] Check name rendering for a short name, a medium name, and a long name (e.g.
      "Nuno Sousa") — confirm the font-size steps keep long names from overflowing
      their quarter of the card.
- [ ] Cut or fold one printed card along the guides. Confirm the result is a clean,
      correctly sized card (compare against the 88mm × 84mm card size in
      `src/app/admin/cards/print.module.css`).
- [ ] Scan the printed (not on-screen) QR code with a phone camera from a normal
      reading distance. Confirm it decodes reliably on the first try, including
      after a black-and-white/non-colour printer pass if that's what you'll use for
      real.

## 6. Sign-off

- [ ] All sections above completed or explicitly marked blocked with a reason.
- [ ] Any issues found are filed as follow-up fixes before printing the real family
      cards or sharing real editing links.

Date completed: _______________  Tested by: _______________
