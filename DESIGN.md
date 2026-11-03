---
name: Amigo Secreto
description: The Parlour Wish Book — a warm, phone-first family Christmas space with a physical card draw
colors:
  paper: "#faf6ed"
  surface: "#fffdf7"
  pine: "#234f3e"
  pine-deep: "#193e30"
  pine-hover: "#eaf0e5"
  ink: "#263f34"
  holly: "#a53640"
  holly-deep: "#852a33"
  gold: "#a17a37"
  gold-bright: "#e5c485"
  parchment: "#f3ead7"
  muted: "#687066"
  line: "#e5ddcc"
  selection: "#dae5d6"
  status-ok: "#e9efdf"
  status-error: "#f8e5df"
  status-error-ink: "#8b3e29"
typography:
  display:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "clamp(38px, 8.5vw, 62px)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-1.8px"
  headline:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "clamp(30px, 4vw, 38px)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-1.2px"
  title:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "21–30px"
    fontWeight: 500
    lineHeight: 1.1
  body:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "13–16px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "12–13px"
    fontWeight: 650
    lineHeight: 1.6
    letterSpacing: "1.9px"
rounded:
  xs: "3px"
  sm: "5px"
  md: "7px"
  lg: "9px"
  xl: "12px"
  pill: "50%"
spacing:
  xs: "5px"
  sm: "8px"
  md: "14px"
  lg: "20px"
  xl: "24px"
  "2xl": "32px"
components:
  button-primary:
    backgroundColor: "{colors.holly}"
    textColor: "#fffefa"
    rounded: "{rounded.md}"
    padding: "13px 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.holly-deep}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.pine}"
    rounded: "{rounded.md}"
    padding: "13px 20px"
    height: "48px"
  input:
    backgroundColor: "#fffefa"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px"
    height: "48px"
  card-member:
    backgroundColor: "{colors.surface}"
    rounded: "14px"
    padding: "28px 16px"
  chip-tag:
    backgroundColor: "#f3eee2"
    textColor: "#626b60"
    rounded: "{rounded.xs}"
    padding: "5px 8px"
    typography: "{typography.body}"
  section-icon:
    backgroundColor: "{colors.pine}"
    textColor: "{colors.gold-bright}"
    rounded: "{rounded.lg}"
    size: "42 × 46px"
---

# Design System: Amigo Secreto

## Overview

**Creative North Star: "The Parlour Wish Book"**

The interface behaves like a family's handwritten gift list pinned up in the parlour for the season: warm cream paper, pine-green bunting, terracotta-red ribbon used sparingly, and antique gold reserved for keepsake moments (stars, garland lights, the tree topper). Nothing is glossy or app-shop generic — ornament is hand-crafted signal, not decoration noise. The Christmas imagery is inline vector, local and flat-illustrated (the tree with baubles, gift boxes, string lights, five-point stars), never photographic or emoji-led. The system is phone-first by construction: layouts are single-column at 320 px, all interactive targets are at least 44–48 px, and desktop is treated as the organically-grown wide version of the same sheet, never a separate design.

The palette follows the confirmed mood: **pine green leads, holly-red accents sparingly, antique gold only for keepsake moments, all on warm cream paper.** Components feel **tactile and restrained**: gentle lift on hover, dashed edges to signal "empty" or "physical" states, italic serif reserved for personal, human notes. The dark pine banner (`Como Funciona`, the site header) is the one loud surface; everything below it stays on paper.

Family-facing text is European Portuguese; the visual voice is warm but grown-up — no cartoon Christmas, no clip-art clutter, no snow at 60 fps.

**Key Characteristics:**
- Warm cream paper ground with a single soft radial light in the top-right corner
- Pine-green chrome (header, explainer banner) with cream-ivory text (`#fff8e8`) and gold icons
- Holly-red as the one action accent — buttons, wish numbers, star pin, eyebrow labels
- Georgia serif for anything spoken *about* a person (headings, names, notes); Arial for anything the person *uses* (labels, body, controls)
- Hand-made signals: taped wish card, ribbon-framed portrait medallions, dashed empty states, folded print cards
- 44–48 px touch targets everywhere; 16 px inputs on phones to prevent iOS zoom

## Colors

Pine, holly-red and gold on cream — a restrained Christmas palette where red is the voice of action and gold is the voice of keepsake.

### Primary
- **Pine Green** (`{colors.pine}` #234f3e): the system's coat — site header, "Como Funciona" banner, section icon tiles, secondary button borders, focus outlines, checkbox accent, member-card top edge (odd cards). Text on pine is ivory `#fff8e8` with gold `#e5c485` icons.
- **Holly Red / Rust** (`{colors.holly}` #a53640): the single action accent. Primary buttons, eyebrow micro-labels, italic word in the hero H1, wish-list numerals, the "Ver desejos" card link, the star pin on portrait medallions, footer icon. Deepens to **#852a33** on hover.

### Secondary
- **Antique Gold** (`{colors.gold}` #a17a37): keepsake ornament only — the left rule on the exchange-details strip, the intro star on profiles, the top edge of form/section cards, the `seasonBadge` frame. Bright gold `#e5c485` / `#f2d58e` is the on-pine variant (icons, lights, selection highlight in banners).

### Neutral
- **Warm Paper** (`{colors.paper}` #faf6ed): body background, under a soft radial glow (`#eeddbd45` at 90% 10%).
- **Ivory Surface** (`{colors.surface}` #fffdf7): cards, inputs, search field, sheet.
- **Pine Ink** (`{colors.ink}` #263f34): body text — green-tinted near-black, never pure black.
- **Sage Muted** (`{colors.muted}` #687066): secondary text, help copy, back links.
- **Linen Line** (`{colors.line}` #e5ddcc): all 1 px borders and dividers.
- **Parchment** (`{colors.parchment}` #f3ead7): warm note/tip panels and the season badge.
- **Status washes**: success `#e9efdf`, error `#f8e5df` with `#8b3e29` text — tinted panels, never colored borders or icons alone.

### Named Rules
**The One Red Voice Rule.** Holly-red is the only action color. If two elements on one screen both scream in red, one of them is wrong; gold and green never carry calls to action.
**The Keepsake Gold Rule.** Gold appears only where the system remembers, not where it asks: stars, ornament lights, framing accents, the tree topper. No gold buttons.
**The No-Pure-Black Rule.** Text, lines and shadows are green- or brown-tinted. Pure `#000` does not exist in this palette; `#fffefa` is the whitest white.
**The Thin-Margin Freeze.** `--muted` (#687066) on cream/surface measures 4.75–5.04:1 and chips 4.78:1 — passing AA with almost no headroom. Never lighten `--muted`, `--paper`, `--surface`, or the chip ink `#626b60` without re-measuring; one step lighter breaks the whole page.

## Typography

**Display/Headline Font:** Georgia, "Times New Roman", serif (local system stack)
**Body/Label Font:** Arial, Helvetica, sans-serif (local system stack)
**No webfonts.** Both stacks are locally-served system fonts — deliberate (offline-capable, zero network fonts) and binding until a redesign replaces the world.
**The One Verb Rule.** The card action is **"Ver desejos"** everywhere it appears on a card; the hero invitation is "Descobrir os desejos"; the profile owns "A minha lista de desejos". Never invent a fourth name for opening a member's wishes, and never duplicate the person's name into the card link's `aria-label` — the `<h3>` already said it.

**Character:** Georgia at weight 400–500 with tightened tracking (-0.6 to -1.8 px on large sizes) reads like a letterpress invitation; Arial does the honest work of labels, help text and controls. Italic Georgia is reserved for the human voice — wish-card titles, closing notes, the handwritten sign-off.

### Hierarchy
- **Display** (400, clamp(38px, 8.5vw, 62px), 1.12, -1.8px): hero H1 and profile-name H1 only. One per screen.
- **Headline** (400, clamp(30px, 4vw, 38px), 1.15, -1.2px): section H2s in Georgia. Within pine banners, drops to 25–29 px.
- **Title** (500, 21–30px, Georgia): member names on cards (27–30px), wish items, small section headings.
- **Body** (400, 13–16px, 1.7–1.85 line-height, Arial): all reading text; inputs are 16 px on phones (zoom guard) and 13 px at desktop.
- **Label / Eyebrow** (650, 12px mobile / 13px ≥720, 1.9px letter-spacing, sentence case): category tags above headings in holly-red; on pine they use bright gold.
- **Micro tag** (12px Arial, tight): interest chips, result count, back-to-top label, hero note, sample notice. Nothing family-facing ships below 12px; the only sub-12px text is the 9–10px tracked "ESTE NATAL" inside the decorative hero illustration (`aria-hidden`).

### Named Rules
**The Spoken-vs-Used Rule.** Serif for what is said *about* a person (names, headlines, personal notes); sans for what the person *operates* (buttons, labels, inputs, help). A serif button label is a bug.
**The Italic-is-Human Rule.** Georgia italic marks a human voice: the em-accent in the hero, wish-card titles, the closing "Com carinho" note. Never for emphasis in UI copy.

## Layout

- **Container:** `.container`, max-width **1160 px**, padding 20 px (40 px ≥ 720 px), centered. Admin/form pages cap at 900 px; cards sheet at 720 px.
- **Breakpoints:** 360 px (directory goes 2-up), 720 px (the main mobile→tablet switch: hero 1.1fr/.9fr, directory 3-up, header grows 82→98 px), 1000 px (profile content widens to `minmax(0,1fr) 325px`, exchange "ending" reveals).
- **Directory grid:** 1-col → 2-col (≥360) → 3-col (≥720, gap 22 px).
- **Profile:** single column on phones; ≥720 px becomes `content + 300px preferences sidebar`, ≥1000 px sidebar 325 px and 65 px gutter.
- **Spacing rhythm:** 4/8/12/14/16/20/24/32 with section padding-block 36–62 px; card interiors step in 13–24 px gaps. No rigid scale — rhythm reads handwritten, not gridded, but repeats consistently per component.
- **Print layout (A4):** `@page` 12 mm margin, six 88 × 84 mm cards at 2 × 3 with 8 mm/6 mm gaps; card internals in container-query units (`cqw`) so screen preview and print match; fold guides at exact midpoints, 30 mm QR in the lower-right quarter.
- Touch targets: interactive elements ≥ 44 px (buttons 48 px min-height), maintained at every width — verified at 320/390/430 px in the Playwright visual harness.

## Elevation & Depth

The system is **flat by default with whisper-soft ambient shadows and a few literal, physical ones**. Depth is conveyed primarily by tonal layering (paper → surface → tinted panels) and 1 px warm borders; shadows only exist to make a card rest on the paper or lift on interaction.

### Shadow Vocabulary
- **Card ambient** (`0 3px 12px #6d542b06` / `0 4px 20px #6d542b06`): resting state of member and form cards — a brown-tinted whisper, almost invisible.
- **Card lift** (`0 9px 24px #233e3010` + `translateY(-4px)`, 0.2 s ease): member-card hover, border warms to `#b99a62`.
- **Paper cut** (`3px 5px 0 #e5d8bb80`, no blur): the taped wish card in the hero — a hard offset shadow, the one deliberately "physical" projection, paired with a translucent tape strip pseudo-element.

### Named Rules
**The Flat-By-Default Rule.** Surfaces rest flat; a shadow appears only for hover/lift or to make the hero's paper cutout look cut out. No stacked, diffuse shadow layers.
**The Tonal-Layering Rule.** When something must separate, move one step paper → surface → parchment/sage tint before adding shadow or border weight.

## Shapes

- **Radius scale:** 3 px chips, 5 px badges, 7 px buttons & inputs, 9 px search & items, 12 px banners/notes/wish rows, 13 px preferences panel, 14 px member cards, 10 px section-icon tiles. Edges are gently rounded, never pill (except avatars, count badge, lights) and never sharp.
- **Circles:** avatars are perfect circles; the portrait medallion adds a 1 px `#cbb078` ribbon ring with a loop tab punched above it (pseudo-element) and a holly star overlapping top-right — the system's signature silhouette.
- **Dashed geometry marks the physical/empty:** `1px dashed` borders on empty states (directory, profile, print fold guides at `.2mm`) — "here something will be placed by hand."
- **Border accents:** cards carry a 3 px top border that rotates by context — green (member cards odd), rust (member cards even), gold (form/section cards) — the "wrapped ribbon edge."
- **Print:** 1 px solid borders, folded-paper rectangles, cutting outlines in dashed grey-green `#a9b4a3`.

## Components

### Buttons
- **Shape:** gently rounded (7 px), 48 px min-height, 13 px/550 Arial label, 12 px icon gap.
- **Primary:** holly fill, ivory text (`#fffefa`), deepens to `#852a33` on hover (0.2 s background).
- **Secondary:** transparent/surface fill, pine border + pine text, pale sage (`#eaf0e5`) wash on hover.
- **Text button:** underline-offset 3 px, pine/gold-on-pine text, 44 px min-height — used for reversible, low-stakes actions ("mostrar a família toda").
- **Focus:** the global `:focus-visible` 3 px pine outline (+4 px offset), gold on pine surfaces.

### Member Card (directory)
- **Corner style:** 14 px; 1 px linen border with 3 px ribbon top-edge alternating green/rust.
- **Structure:** medallion portrait with ribbon ring + star pin, Georgia 500 name (27→30 px), muted 12 px introduction (min 42 px), up to 3 interest chips (12 px on `#f3eee2`) plus a `+N` overflow chip, full-width **"Ver desejos"** link footer in holly with top divider. The card link carries **no per-card aria-label** — the name in the `<h3>` plus the visible label already name it uniquely; duplicating it would flatten the SR links list into N copies of one phrase.
- **Search feedback:** the results region shows a visible pine count line ("N perfil encontrado(s)" / the same "Não encontrámos ninguém…" phrasing as the empty panel) only while a filter is active. The page scrolls itself **at most once per search session**, and only when the results grid is genuinely off-screen — the paper world never moves under the thumb twice. A ghost "Voltar ao topo" (drawn arrow icon, never a raw glyph) appears only while a filter is active. Anchor arrivals clear the pine header via the `--header-h` token (100 px mobile / 116 px ≥720) plus 14 px.
- **Hover:** translateY(-4px), border warms gold-brown, shadow lifts to `0 9px 24px`.

### Search Field
- Surface fill, 1 px linen border, 9 px radius, 48 px tall, 14 px leading icon pad; focus = 2 px pine outline at 3 px offset (not glow). Clear button is a 44 px borderless ghost.

### Section Icon Tile
- 42 × 46 px pine tile, 10 px radius, bright-gold icon — the lead glyph of every profile section heading and banner eyebrow.

### Note / Preference Panels
- **Parchment note:** `#f3ead7` panel, `#e4d3b1` border, 12 px radius, holly icon + serif heading + italic-serif body ("Com carinho").
- **Preferences panel:** surface card, 3 px holly top rule, divided rows (1 px linen), 13 px muted list items with sage check icons.
- **Status boxes:** full-width tinted panels — sage success, terracotta error (`#f8e5df` / `#8b3e29`), 7 px radius.
- **Empty state:** dashed linen border, 14 px radius, centered icon, green serif heading, muted copy, secondary action.

### Header & Footer
- **Header:** pine band, 82→98 px, ivory 19→22 px bold two-line wordmark (second line weight 450), gold gift icon left, season line right; string lights (`14 px` row of glowing bulbs, gold/red/sage, slight rotations) hang along the bottom border — decorative only, pointer-events none.
- **Footer:** thin rule `#d8c7a5`, muted 12 px, holly heart, year right-aligned; demo databases show the sample-notice line with a holly dot.

### Printable Draw Card (signature)
- 88 × 84 mm quartered card: avatar top-left, name top-right (Georgia, size-stepped by name length via container queries), QR bottom-right (30 mm, ≥6/7 mm clear of folds), dashed cut + fold guides, contents fold inward. Only avatar, name and public-profile QR — nothing else is ever printed on it.

## Do's and Don'ts

### Do:
- **Do** keep every interactive target ≥ 44 px (buttons 48 px) at 320 px width, and inputs at 16 px font on phones.
- **Do** use holly-red for exactly one action per screen; keep gold for ornament and keepsake moments only.
- **Do** separate surfaces with the tonal ladder (paper → surface → parchment/sage tint) and 1 px `#e5ddcc` borders before reaching for shadows.
- **Do** alternate the 3 px ribbon top-border by its context rule (green/rust members, gold forms).
- **Do** use dashed 1 px borders to mean "empty or physical" — empty states and fold guides, nothing else.
- **Do** use Georgia italic for the human voice (notes, card titles) and keep all UI controls in Arial.
- **Do** keep ornament inline-SVG, local, `aria-hidden`, and flat-illustrated; preserve `prefers-reduced-motion` compliance and the skip-link/focus-outline baseline.
- **Do** print via the same `cqw`-based card internals so screen preview equals paper output.

### Don't:
- **Don't** introduce blue/purple/teal as interface colors, gradients on text/buttons, or glassmorphism — the world is pine/cream/gold flat paper.
- **Don't** use webfonts, icon fonts, or CDN assets; only locally-served system stacks and inline SVG.
- **Don't** use emoji as interface icons (they may appear only inside member-written wish text).
- **Don't** add pure black text or pure white backgrounds; use `#263f34` on `#faf6ed`/`#fffdf7`.
- **Don't** make anything pill-shaped except avatars, the member-count badge and the light bulbs; the ceiling is 14 px.
- **Don't** shadow-stack: one ambient shadow per surface, max.
- **Don't** put English in family-facing UI, or Portuguese in code/routes/dev output (AGENTS.md language rule).
- **Don't** replace factual profile content or printed card data with marketing claims; the QR always resolves to `/p/<stable-id>`.
