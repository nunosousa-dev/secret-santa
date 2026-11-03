# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 App Router (React 19, TypeScript, standalone output), better-sqlite3 + Drizzle, CSS Modules with tokens in `src/app/globals.css`. Prepared for deployment as a Docker image via Helm/Argo CD to a homelab; live deployment remains pending. Dev: `npm run dev`.

## Users

- Primary: family members using their own phones — browsing the public directory, viewing relatives' profiles, and editing their own wishes/preferences through a private link (or by tapping the Portuguese access button on an `/edit/<id>#token=…` URL).
- Secondary: the organiser (the host of the Secret Santa), who manages members, avatars, links and family settings from `/admin` on phones or larger screens, and prints the draw cards from `/admin/cards` on a desktop/laptop.

## Product Purpose

A Christmas space for the family: everyone publishes public gift wishes and preferences, and the actual name draw stays physical — the app prints avatar/name/QR cards instead of running a digital lottery. Success means the family enjoys using it on phones and the organiser can set up and print cards with minimal friction.

## Positioning

A personal, family-run profile book tied to a real physical ritual (folded A4 cards with QR links to stable public profile URLs), rather than a generic anonymous online Secret Santa generator. Profiles are public; editing access is private. The draw is deliberately analog; the app owns wishes, preferences, avatars and card production.

## Operating Context

- Family shares a link; members open profiles, search by name/interest, and edit via private links.
- Organiser workflow: create members → issue private links → upload avatars → set family settings → print A4 cards (six 88 × 84 mm cards, fold guides, 30 mm QR) → fold and hand out for the physical draw.
- Data lives in a single SQLite file on the homelab; backups use SQLite's online backup API.

## Capabilities and Constraints

- Public: family directory with name/interest search, profiles at `/p/<stable-id>`, avatar route, pt-PT 404.
- Protected `/admin`: member create/rename/archive/restore, avatar upload (PNG/JPEG/WebP ≤ 5 MB, server-cropped to 512×512 WebP), preferences, family settings, link issue/replace/revoke; locked until a password hash is configured.
- Editing links: `/edit/<id>#token=<random>`; fragments never sent to the server; only SHA-256 hashes stored; admin sessions 12 h, member sessions 7 d.
- Server-side origin/permission checks on every mutation; rate-limited organiser login; stale-form conflict handling; `noindex` on the site.
- Compatibility rewrites keep previously shared `/editar/<id>`, `/avatares/<id>`, `/admin/cartoes` URLs and stable public profile IDs/QR codes valid.
- Language conventions (AGENTS.md): code, routes, docs, diagnostics in English; family-facing UI, a11y text, validation, print instructions and fictional profile content in European Portuguese.
- Open decision: live public deployment pending; final `APP_URL` set before printing cards.

## Brand Commitments

- Brand name: **Amigo Secreto** (package name `secret-santa`); interface in European Portuguese, phone-first.
- Visual world is explicitly *not* pinned: the incumbent warm-Christmas system (cream `#faf6ed`, green, rust, gold; Georgia headings / Arial body, local SVG art) is a starting point open to visual evolution.
- Fonts and images served locally; no third-party CDN assets.

## Evidence on Hand

- Fictional seeded profiles (Tomás, Inês, etc.) in `src/lib/sample-data.ts` — demos only; previews marked as demonstration databases.
- Real content arrives only as family members are created; there are no real testimonials, usage data, or press. Future work must not fabricate any.
- Docs: `README.md`, `IMPLEMENTATION_PLAN.md`, `DEVICE_VERIFICATION.md`, `VISUAL_ACCEPTANCE.md`, `deploy/README.md`.
- Test suites: unit tests, `smoke:auth`, `smoke:container`, Playwright configs; QR decodability is auto-checked.

## Product Principles

1. The phone in a family member's hand is the primary canvas; desktop is the organiser's workshop.
2. Protect editing access by construction: private links, fragments and hashes — not accounts to remember. Browsing remains public.
3. The physical ritual is sacred: the app serves the card draw, it never replaces it.
4. Portuguese for the family, English for the machine.
5. Nothing ephemeral breaks a shared artifact: URLs, QR codes and printed cards must outlive renames and refactors.

## Accessibility & Inclusion

Phone-first usage across mixed-age family devices; interface ships pt-PT labels and accessibility text. Existing baseline: skip link, `:focus-visible` outlines, 48 px touch targets, `prefers-reduced-motion` respected, decorative SVGs `aria-hidden`. Viewport checks at 320/390/430 px and desktop are part of acceptance (`VISUAL_ACCEPTANCE.md`). No formal WCAG target was declared beyond this.
