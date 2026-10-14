# Family Secret Santa — implementation plan

Status: implementation in progress, 14 October 2026. Public profiles, editing/access, full administration, avatar uploads and printable cards are implemented. The amd64 Docker image and homelab Helm/Argo CD configuration are prepared and locally verified. Live deployment and mobile/print visual acceptance remain pending.

Initial milestone delivered: Next.js/React/TypeScript setup, CSS Modules, mobile-first Portuguese landing/profile pages, searchable family directory, local placeholder avatars, optional-field/empty states, a Portuguese 404 page, and local setup documentation. The production build uses standalone output for future container packaging.

Second milestone delivered: SQLite persistence with Drizzle schema and versioned SQL migrations; explicit, idempotent sample seeding; protected organiser login and credential setup/recovery command; member creation; private editing links; member-scoped editing sessions; mobile preference/wish/size forms; stale-write conflict detection; and consistent database backups. Admin sessions last 12 hours and member sessions 7 days. Editing links are reusable until rotation/revocation, which invalidates associated sessions. Tokens are sent in URL fragments and exchanged explicitly for cookies; only hashes are persisted.

Third milestone delivered: organiser rename/archive/restore, versioned family settings, validated avatar upload/replacement/removal, and protected A4 printing with six avatar/name/QR cards per sheet. Avatar BLOBs are stored with profiles in SQLite so one consistent snapshot includes both. Archiving revokes editing access; restoring preserves the stable profile ID and requires a fresh editing link.

Deployment preparation delivered: non-root, read-only amd64 container; live/readiness routes; local Helm chart matching Argo CD, Traefik Gateway, iSCSI and optional NFS backups; and a GitHub Actions image publishing workflow. The homelab repository was inspected without modification. Cluster deployment remains pending.

Language conventions: documentation, identifiers, comments, CLI output and developer diagnostics use English. Family-facing UI, accessibility text, metadata, validation messages and fictional profiles remain in European Portuguese. Canonical routes are `/edit/<id>`, `/avatars/<id>` and `/admin/cards`; compatibility rewrites retain older Portuguese URLs. Package, chart and undeployed Kubernetes resource names use `secret-santa`. Stable public profile IDs and `/p/<id>` URLs remain unchanged.

Verification: lint, TypeScript checks, production compilation, 12 focused tests, production HTTP flows, Helm lint/rendering and the actual amd64 Docker container pass. Coverage includes permissions, stale writes, image validation, migration from schema v1, QR decoding, archive/restore, restarts and complete profile/avatar recovery onto a fresh Docker volume. Browser access to the local preview was denied earlier, so interactive/visual layouts and real mobile-device behaviour remain to be verified. Production dependency audit is clear; an unpatched development lint dependency advisory is recorded in the README.

## 1. Agreed product scope

- One shared family landing page where everyone can browse everyone's profile.
- Public browsing of the family landing page, profiles, and avatars, without a login or family passcode.
- Portuguese interface, including forms, validation messages, administration, and print controls.
- Mobile-first design: phones are the primary device for browsing, editing, and organiser tasks; larger layouts adapt from the phone experience.
- Protected organiser administration and private, random-token links for editing individual profiles; store only token hashes on the server.
- Individual profiles containing optional gift wishes, gift links, interests, dislikes, clothing/shoe sizes, and a personal note.
- Avatars supplied by the organiser; avatar generation is outside the application.
- Printable cards containing only the avatar, name, and QR code.
- Physical shuffling and drawing. The application does not record gift assignments.
- Profile URLs and printed QR codes remain valid when preferences or names change.
- Deployment to the family's homelab Kubernetes cluster.
- Family messages or chat are later features, outside the first release.

## 2. First-release behaviour

The following organiser, session and printing workflows are implemented, with visual and family acceptance checks still pending.

### Mobile-first experience

- Design and review phone layouts first, then adapt to tablets and desktops.
- Keep browsing and editing usable at 320–430 CSS pixels wide without horizontal scrolling.
- Use readable text, comfortably spaced controls, and touch targets of approximately 44 by 44 CSS pixels or larger.
- Profile forms use a single-column layout with persistent labels, suitable mobile keyboards, and clear save/error feedback. Opening the keyboard must not hide the active field or prevent saving.
- Keep avatar payloads modest and avoid unnecessary client-side code so profiles open quickly on mobile connections.
- Verify representative iOS Safari and Android Chrome journeys, including opening editing links, returning from external gift links, and scanning printed QR codes.
- Organiser screens must work on phones too. Card printing uses a separate A4 layout rather than printing the mobile page directly.

### Family browsing

- Anyone can open the family landing page and profiles without signing in.
- The landing page shows a welcome, optional budget/date, and an avatar/name grid.
- Each card opens that person's profile. Empty optional fields are hidden.
- A QR scan opens the same public profile directly, without a login step.
- Browsing access does not grant permission to change profiles.

### Editing and organising

- An organiser manages names, avatars, family settings, and profile editing links.
- Each person receives a private editing link for their own profile, shared manually using the family's existing messaging app.
- Generate each editing token from 32 cryptographically secure random bytes and encode it for use in a URL. Store only its SHA-256 hash, linked to the member; validate presented tokens by hashing them for comparison. The URL carries the original random token, not the stored hash.
- Editing links establish a member-scoped session; secrets are not included in ordinary profile URLs or QR codes.
- Implemented link lifetime: reusable until the organiser revokes/regenerates it. Sessions expire after 7 days for members and 12 hours for the organiser. Revoke sessions established by the old token when it is revoked. Rotating editing access never changes the public profile URL or printed QR code.
- Treat possession of an editing link as permission to edit that member's profile. Carry the token in a URL fragment, remove it before explicitly exchanging it for a session, and avoid token exposure in request logs and referrer headers.
- The organiser can revoke/regenerate editing links and recover access for someone who loses theirs. Since only a hash is stored, recovery issues a replacement link rather than retrieving the original.
- A separate organiser credential protects administration. Setup/recovery uses an interactive local command that saves only a scrypt hash. Changing that hash and restarting invalidates previous admin sessions. Public browsing never grants organiser access.
- Avatar uploads are organiser-only initially; members edit preferences.
- Archiving a member requires an explicit confirmation, hides their profile/avatar and revokes editing access. Restoration keeps the same ID and needs a fresh editing link. IDs are never reassigned.

### Printing

- An organiser-only print page lays out six 88 × 84 mm cards on each A4 sheet with dashed cutting outlines and horizontal/vertical midpoint fold guides. Avatar and name occupy the upper-left and upper-right quarters. The 30 mm QR occupies the lower-right quarter, about 6 mm clear of the horizontal fold and 7 mm clear of the vertical fold. Fold in half in each direction, contents inward, and open to scan.
- Browser print/save-as-PDF is the initial export; a separate PDF generator is unnecessary initially.
- Cards contain only avatar, name, and QR code, with sufficient QR contrast and clear surrounding space.
- Choose a stable public hostname before printing real cards. The QR contains an absolute HTTPS profile URL using a stable member ID, not the editable name.

## 3. Implemented technical approach

The application uses the requested TypeScript stack. Installed dependency versions are recorded in the lockfile.

| Area | Implementation | Purpose |
| --- | --- | --- |
| Application | Next.js, React, TypeScript | Pages, forms, and server operations in one codebase/container |
| Styling | CSS Modules with shared design variables | A small festive design and dedicated print styles |
| Database access | Drizzle ORM and versioned SQL migrations | Typed schema and explicit database changes |
| Database | SQLite on a single-replica iSCSI PVC | Small family workload with Recreate rollouts |
| Avatars | Validated 512 px WebP BLOBs in SQLite | Atomic profile/image backups, outside the container image |
| Packaging | Docker image, non-root runtime | Same application build locally and in Kubernetes |
| Deployment | Helm chart and Argo CD Application | Match the homelab's existing chart-based GitOps workflow |
| Verification | Focused tests, production HTTP, QR decoding and container smoke | Verify permissions, persistence, image processing and recovery; visual checks pending |

Prefer one application service. No separate frontend/backend deployment, queue, Redis, or real-time service is needed for the first release.

Database decision:

- SQLite is selected for this small workload, with one replica and the homelab's block-backed `truenas-iscsi-retain` storage class. Verify the actual CSI permissions, persistence and recovery before release.
- Use `truenas-nfs-retain` only for consistent backup snapshots, never for the active SQLite database.
- SQLite deployments use a Recreate rollout strategy and accept short maintenance downtime. A PVC alone is not a backup.
- Back up database and avatar BLOBs together using SQLite's online backup API, not a blind copy of an actively written file. Optional daily backups have no automatic retention deletion; monitor storage and job success.
- Do not implement two database backends for the first release. Switching engines later requires deliberate schema/data migration work.

## 4. Data and access model

Initial records:

- **Family settings:** display name, welcome text, optional exchange date, budget/currency.
- **Member:** stable ID, display name, avatar reference, interests, likes, things to avoid, optional size fields, personal note, timestamps.
- **Wish item:** member ID, title, optional HTTP(S) shop URL, optional note, display order.
- **Access/session records:** organiser/member capabilities, editing-token hashes and member association, session expiry, and token revocation/version information to invalidate associated sessions.

Optional fields must stay optional. Sizes should allow descriptive text such as “usually M; prefer a loose fit.” No gift-assignment table is needed.

Public pages, profile data, and avatars require no authentication. Enforce access on the server for editing, administration, private endpoints, and all mutations. Keep editing credentials out of public responses, printed cards, analytics, and logs. Use protected session cookies and protect state-changing requests against cross-site submission. Validate input lengths, gift URL schemes, and image file content/size.

## 5. Delivery phases

### Phase 0 — settle foundations

- Confirm whether budget/date belong in version one. Public browsing, Portuguese, protected administration, and random-token editing links are agreed. Credential setup/recovery and session policies are now implemented as documented above.
- Gather homelab ingress/TLS, storage, database, CPU architecture, image registry, and deployment workflow details.
- Select the database, stable hostname, and external access approach; relatives must be able to reach it from their phones away from the homelab.
- Sketch phone layouts for landing, profile, edit, and organiser pages first; define the separate A4 print layout.

Done when: core journeys, access boundaries, stack, and infrastructure assumptions are documented well enough to implement.

### Phase 1 — application foundation and visual preview

- Scaffold the TypeScript application, lock dependencies, and document local setup/configuration.
- Add a mobile-first page shell and a small shared design system, with Portuguese UI text and the document language set accordingly. Build phone layouts before larger-screen adaptations.
- Build landing and profile pages with clearly labelled fictional sample data.
- Create schema/migrations for the selected database and a repeatable development seed.

Implemented locally: scaffold, phone-first CSS, sample content, schema/migrations, and seed. Visual review on actual phones remains pending.

### Phase 2 — first complete working flow

- Implement public family browsing, protected organiser access, and member-specific editing sessions.
- Save and load profile preferences and wish items, with clear validation and save/error feedback.
- Ensure another browser sees updated preferences after refresh.
- Handle missing profiles, invalid/revoked links, and empty profiles.

Implemented and verified through production HTTP tests: one sample member can edit only their profile, the family can read the saved result, and data survives an application restart. Interactive mobile form review remains pending.

### Phase 3 — family administration and avatars

- Build member creation/edit/removal and family settings forms.
- Add avatar upload, preview/replacement, and a fallback image.
- Add organiser tools to issue and revoke member editing links.
- Document initial organiser setup and credential recovery without requiring database edits.

Done when: the organiser can prepare the real family without changing source code, and members can fill in their own preferences.

Implemented and verified through automated tests: names, image processing/storage, archive/restore, family settings and link management. Organiser usability on phones remains pending.

### Phase 4 — printable cards and usability

- Generate QR codes from the configured public origin and stable profile paths.
- Build the A4 print sheet with predictable card dimensions and page breaks.
- Check long names, different avatar proportions, missing avatars, and multiple pages.
- Verify keyboard access, readable text, touch targets, mobile keyboards/forms, and loading/error states on representative phone sizes and browsers.
- Print a sample sheet and scan actual printed cards on phones, verifying that each profile opens directly without authentication.

Done when: every card resolves to the correct profile and later profile/name changes leave printed QR codes usable.

Implemented: protected A4 sheets, stable QR URLs, long-name sizing, image loading before printing and page grouping. Actual QR images decode to the expected profiles in tests. Visual review, real printing and phone scanning remain pending.

### Phase 5 — container and homelab deployment

- Build and run the production container locally with persistent data and runtime configuration.
- Add health/readiness endpoints, deployment/service, ingress/TLS configuration, resource requests/limits, storage, and secret references.
- Define a safe migration step and image-release workflow compatible with the cluster architecture and registry.
- Add backup/restore instructions and upgrade/rollback steps; application rollback must account for schema compatibility.
- Deploy through the homelab's existing workflow, using GitOps if already present.

Done when: the HTTPS site is reachable from a phone outside the home network, data survives pod replacement, a backup restores successfully, and an upgrade has been exercised.

Prepared and locally verified: amd64 Docker image, non-root/read-only runtime, health checks, Helm/Argo CD manifests, optional backup CronJob, image workflow and [deployment instructions](deploy/README.md). The actual container preserves data across restart and restores profiles/avatars from an online backup onto a fresh volume. Live integration still needs a published image, SealedSecret, final hostname, Cloudflare tunnel/DNS entry and reviewed changes in the homelab repository. Cluster rollout/CSI/backup checks remain pending.

### Phase 6 — family pilot and release

- Have two family members complete browsing and editing on their own phones; include representative iOS and Android coverage where available.
- Check organiser recovery, link revocation, and printed QR scanning against the final hostname.
- Replace sample data with the real family, confirm avatar/name associations, and print the final cards.
- Record how to update profiles, reprint cards, and operate the service.

Done when: the family can use the application and the organiser can maintain/recover it using the documentation.

## 6. Verification priorities

- Anonymous visitors can browse the family page, profiles, and avatars but cannot edit profiles or access organiser functions.
- One member's editing credential cannot edit another member or issue credentials.
- Revoked editing links and sessions established from them stop working; replacement links affect only the intended member and leave public URLs intact.
- Only token hashes are persisted; raw editing tokens are excluded from public responses, logs, and referrer headers.
- Saved preferences persist, and no secrets leak through family-facing responses or logs.
- QR destinations stay stable and open the intended public profile without authentication.
- User-facing labels, validation messages, and empty/error states are in Portuguese.
- Phone layouts have no horizontal overflow; forms remain usable with the on-screen keyboard, and touch controls are comfortably sized. Larger-screen layouts remain usable.
- Real printed cards scan successfully; names and avatars are not clipped across page breaks.
- Database migrations and a database-plus-avatar restore work against the chosen production engine/storage setup.

Avoid broad test scaffolding for decorative components. Prioritise permissions, data integrity, and end-to-end journeys.

## 7. Outstanding decisions

- Homelab inspected: amd64 Talos/Proxmox, Argo CD with local Helm charts, Traefik Gateway, public Cloudflare HTTPS/tunnel, iSCSI live storage and NFS backup storage. Confirm actual permissions and recovery in the cluster.
- Release: the application repository is `nunosousa-dev/secret-santa`, with SSH origin and branch `main`. Verify the image publishing workflow and set its immutable tag; prepare a namespace-bound SealedSecret.
- Access implementation: interactive organiser setup/recovery, 12-hour admin sessions, 7-day member sessions, and reusable editing links with revocation are implemented. Review usability during the family pilot.
- Content: family title, approximate member count, optional budget/date, avatar files.
- Printing: review the implemented six-card A4 layout, then print and scan a sample on phones.
- Exposure: public hostname `amigo-secreto.nunosousa.dev` is confirmed. Add Cloudflare DNS/tunnel configuration after the local pilot and before printing final cards.
- Local-first rollout: the public hostname `amigo-secreto.nunosousa.dev` is confirmed. Initially load `values-local.yaml` for `amigo-secreto.local.nunosousa.dev` on the HTTPS Gateway listener. Validate on the LAN/VPN before preparing Cloudflare routing and public promotion. Preserve the same release and PVCs; print final cards after promotion.

Messages/chat and annual event history remain future work. Preserve stable member IDs and straightforward migrations without building those features now.

## 8. Official technical references

- [Next.js deployment options](https://nextjs.org/docs/app/getting-started/deploying)
- [Next.js self-hosting guidance](https://nextjs.org/docs/app/guides/self-hosting)
- [Drizzle schema and database tooling](https://orm.drizzle.team/docs/overview)
- [SQLite workload and storage suitability](https://www.sqlite.org/whentouse.html)
- [Kubernetes persistent volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
