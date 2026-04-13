# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static marketing website for **Cleanfix Reinigen und Waschen**, a textile cleaning business in Mönchengladbach, Germany. Pure vanilla HTML/CSS/JS — no build tools, no dependencies, no framework. Deploy by copying files to any static host (e.g. Cloudflare Pages).

Companion `admin.html` is a password-protected management panel (same directory, no server needed) for editing all dynamic content.

## No Build/Lint/Test Commands

There is no package.json, no build pipeline, no linter, and no test suite. Open `index.html` directly in a browser to develop. Changes are live immediately on refresh.

> **Note:** `fetch('Monatsangebot.txt')` requires HTTP — use VS Code Live Server or `npx serve .` locally. Direct file:// open will silently hide the monthly offer card unless schedule data exists in localStorage.

Validate JS syntax manually: extract the `<script>` block from `admin.html` and run `node --check` on it. Quick one-liner:
```
node -e "const fs=require('fs');const h=fs.readFileSync('admin.html','utf8');const m=h.match(/<script>([\s\S]*?)<\/script>/);fs.writeFileSync('_tmp.js',m[1])" && node --check _tmp.js && rm _tmp.js
```
`node --check admin.html` does **not** work directly (ERR_UNKNOWN_FILE_EXTENSION).

## File Structure

These paths are relative to `Cleanfix/` (the project root inside the repo). The public site and admin site each have their own deploy directory, but the file roles are the same.

**Public site** (`public-site/`):
- `index.html` — Main single-page site. Sections in order: nav, hero, promo banner, leistungen, angebote, preise (tabs), filialen, newsletter, kontakt, footer
- `style.css` — All styles; single file, no preprocessor. Also copied into `admin-site/` for shared tokens and live preview rendering.
- `main.js` — All public-site interactivity; vanilla JS, no ES modules
- `impressum.html` — Legal imprint (§5 DDG)
- `datenschutz.html` — GDPR privacy policy
- `data/schedule.json` — Server-side schedule state (committed by n8n via GitHub API)
- `data/preise-reinigung.json`, `data/preise-buegeln.json`, `data/preise-waesche.json`, `data/preise-bonus.json` — Server-side price state

**Admin site** (`admin-site/`):
- `index.html` — Entire admin app (HTML + inline CSS + inline JS). Password-protected. This is the actively deployed and maintained admin panel.
- `style.css` — Copy of `public-site/style.css` for shared tokens / live previews. **Must be kept in sync** with the public version.

**Shared / root-level files:**
- `admin.html` — Legacy single-file admin panel (kept for reference, **not deployed**)
- `index.html` — Legacy copy of the public site (not deployed to production)
- `Monatsangebot.txt` — Legacy fallback monthly offer data file; read at runtime by JS only when no schedule entry exists
- `Preise.xlsx` — Source of truth for all prices; update this file when prices change, then reflect changes in the HTML price tables and admin.html DEFAULTS object
- `Logo Cleanfix JH.png` — Logo used in nav/footer (must stay PNG — transparency required)
- `favicon.png` — Browser tab icon

## Architecture

### CSS Design System
All design tokens live as CSS custom properties in `:root` in `style.css`. Dark mode overrides those same tokens under `[data-theme="dark"]` — no component-level dark rules needed. The `data-theme` attribute lives on `<html>`.

Brand colors: `--blue: #0830DD`, `--pink: #F508B8`.

Dark mode exceptions (components that need explicit dark overrides rather than relying purely on token inheritance) are grouped near the top of `style.css`.

The admin site's `style.css` is a copy of the public site's `style.css`, used for shared tokens and live preview rendering. **Both files must be kept in sync** — when editing styling, apply the same change to both `public-site/style.css` and `admin-site/style.css`.

#### Key CSS tokens (`:root` in `style.css`)
```css
/* Colors */
--blue: #0830DD;  --blue-dark: #061FA8;  --blue-deeper: #04156E;
--blue-light: #E8EDFF;  --blue-mid: #C0CCFF;
--pink: #F508B8;  --pink-dark: #C2018F;  --pink-light: #FFE0F7;
/* Neutrals (swapped in dark mode to create inverted contrast) */
--neutral-900: #0F1117;  --neutral-700: #374151;  --neutral-600: #4B5563;
--neutral-400: #9CA3AF;  --neutral-300: #D1D5DB;  --neutral-200: #E5E7EB;
--neutral-100: #F8F9FB;  --white: #FFFFFF;
/* Gradients, shadows, radii */
--gradient: linear-gradient(135deg, var(--blue), var(--pink));
--shadow-sm / --shadow-md / --shadow-lg  /* blue-tinted in light, pure black in dark */
--radius-sm: 8px;  --radius-md: 14px;  --radius-lg: 22px;  --radius-xl: 32px;
/* Typography & motion */
--font: 'Inter', system-ui, -apple-system, sans-serif;
--transition: 0.22s cubic-bezier(0.4, 0, 0.2, 1);
```

#### Dark mode strategy
Dark mode swaps the neutral scale in `:root` (e.g. `--white` becomes `#111318`, `--neutral-900` becomes `#EEF0F6`). Most components just inherit and automatically look correct. Components that need explicit dark overrides (header backdrop, mobile nav, form inputs, price table rows, footer) are grouped at the top of `style.css` with `[data-theme="dark"]` selectors.

#### Component-level CSS variables
- `.price-table-wrapper` uses `--table-bg: var(--white)` (overridden in dark mode to `var(--neutral-100)`) so the mobile scroll-shadow gradient trick works in both themes.

#### Mobile-specific overrides (≤640px)
```css
html { font-size: 18px; }  /* Bumps all rem-based text for older readers */
```
The admin panel's inline `<style>` overrides this back to `16px` so admin UI keeps its normal sizing.

#### Mobile price tables (≤640px)
On phones, the `.price-table-wrapper` enables horizontal swipe scrolling via `overflow-x: auto` with a `background-attachment: local` scroll-shadow trick. Four gradient layers (two themed covers as `local`, two dark shadows as `scroll`) create edge shadows that appear/disappear based on scroll position, hinting that more columns exist. The 3-column table (`.price-table--multi`, used by Wäsche & Mangeln) gets `min-width: 460px` to force the wrapper to actually scroll on narrow viewports.

#### Form field styling
All form inputs, textareas, and selects share the same visual treatment:
```css
.form-group input,
.form-group textarea,
.form-group select { /* same padding, border, radius, focus ring */ }
```
The `.invalid` class + `.field-error` span pattern is used for client-side validation errors. Dark mode overrides exist for input backgrounds and borders.

#### Admin panel CSS override
The admin site's `index.html` has an inline `<style>` block that overrides the public site's mobile root font-size bump (`html { font-size: 16px; }` at ≤640px) so the admin panel keeps its normal sizing on phones. All admin-only component styles (`.admin-body`, `.admin-nav`, `.sched-entry`, publish bar, etc.) live in this inline block.

### JavaScript Blocks in `main.js` (sequential, no ES modules)
1. **Dark mode IIFE** — reads `localStorage`, sets `data-theme` on `<html>` before paint
2. **Year auto-fill** — fills `#year` span in footer
3. **`escHtml()` global** — shared HTML-escape helper; must be defined before the schedule IIFE
4. **Unified schedule reader IIFE** — reads `cleanfix-schedule` (new system), applies active entries to the page; falls back to legacy individual keys, then to `Monatsangebot.txt` for MA. See *Data Flow: Schedule System* below.
5. **Price tables IIFE** — reads `cleanfix-preise-*` keys, renders price table rows from admin-saved JSON
6. **Sticky nav** — hysteresis scroll detection (12px threshold with `anchorY` anchor pattern) toggling `.scrolled` on `.site-header`
7. **Mobile burger** — toggles `.open` on `#nav-list`; outside-click closes menu
8. **Price tabs** — ARIA-compliant tab switching (`hidden` attr + `aria-selected`) with keyboard arrow support
9. **Price search IIFE** — builds index lazily from live DOM on first keypress; alias map for fuzzy matching; scores and renders results with highlighted matches
10. **Contact form validation** — inline errors, client-side success state
11. **Newsletter form validation** — same pattern
12. **Intersection Observer fade-ins** — basic card entrance animations (always active, no cleanup needed)
13. **Next Gen motion IIFE** — opt-in scroll-driven animations; reads/writes `localStorage('cleanfix-motion')`; tracks `activeObservers[]` and `cleanupFunctions[]` arrays for teardown on toggle-off

### State Flags
- `data-theme="dark"` on `<html>` → dark mode CSS kicks in
- `data-motion="on"` on `<html>` → next-gen animation CSS kicks in
- `.scrolled` on `.site-header` → header shrinks (desktop + mobile, same class)
- `.open` on `#nav-list` → mobile nav menu visible

### Mobile Nav Architecture
The header is `position: sticky` on both desktop and mobile. The burger button sits inside the sticky header (no separate floating element). The nav dropdown is `position: absolute; top: 100%` — it falls below the header edge. No `mob-scrolled` class exists; the same `.scrolled` class drives shrink on all breakpoints.

### Responsive Breakpoints
- `≤900px` — mobile nav (burger replaces link list), single-column layouts, admin sidebar becomes horizontal scroll tabs
- `≤760px` — newsletter stacks vertically
- `≤640px` — tighter section padding, monatsangebot right panel hidden

---

## Data Flow: Schedule System

This is the core dynamic content architecture. All three content types (Monatsangebot, Promo-Banner, Sonderangebote/Deals) are stored as a **single unified array** in localStorage.

### localStorage key: `cleanfix-schedule`

Every entry has this shape:
```js
{
  id: 'abc12345',                      // 8–12 char random hex, generated by generateId()
  type: 'monatsangebot' | 'banner' | 'deal',
  startDate: '2026-03-01',             // ISO date string; '' or missing = no start restriction
  endDate:   '2026-03-31',             // ISO date string; '' or missing = no expiry
  data: { /* type-specific payload */ }
}
```

**type-specific `data` payloads:**
```js
// monatsangebot:
{ monat, titel, text, angebot, auf }

// banner:
{ icon, title, desc }
// Note: old banner format was { text: '<html string>' } — legacy fallback handles this

// deal:
{ badge, icon, title, price, priceUnit, desc, highlight }
```

### Status Logic (computed, never stored)
| Condition | Status | CSS class |
|-----------|--------|-----------|
| No dates (permanent) | `permanent` | `status-chip--permanent` (grey, ∞ Dauerhaft) |
| startDate in future | `scheduled` | `status-chip--scheduled` (blue, 🕐 Geplant) |
| Between dates (or active now) | `active` | `status-chip--active` (green, ✓ Aktiv) |
| endDate in past | `expired` | `status-chip--expired` (red, ✗ Abgelaufen) |

### Priority Rule for MA and Banner (single-value types)
When multiple active entries exist for the same type, the **dated entry beats permanent**; among equals, **highest array index (last saved) wins**. This is implemented in `getBestActive(type)` in both `admin.html` JS and `main.js`.

### Server-side data (`data/schedule.json`)
The schedule is persisted server-side as a committed JSON file. When the admin publishes, the n8n workflow commits the full schedule array to `Cleanfix/public-site/data/schedule.json` via the GitHub API, triggering a Cloudflare Pages redeploy.

### How `main.js` applies schedule entries
1. Show MA placeholder immediately (card never empty)
2. Fetch `/data/schedule.json` from the server (primary source of truth)
3. If fetch succeeds, filter by `isActive(entry)` (date check against today's ISO date)
4. If fetch fails (offline, 404, etc.), fall back to `cleanfix-schedule` in localStorage
5. **MA**: apply best active monatsangebot entry, else fall back to `cleanfix-monatsangebot` legacy key, else fetch `Monatsangebot.txt` (HTTP only)
6. **Banner**: apply best active banner entry, else fall back to `cleanfix-banner` legacy key (supports both `{icon,title,desc}` new format and `{text:...}` very old HTML-blob format)
7. **Deals**: apply all active deal entries as an array, else fall back to `cleanfix-deals` legacy array

### Admin panel server sync (cross-device consistency)
On every admin load, `initAdmin()` fires two async fetches:
- `fetchServerSchedule()` — fetches `schedule.json`, writes to localStorage, re-renders schedule list + timeline, resets dirty-tracking snapshot. Includes a race-condition guard: if the user has already made local edits (localStorage differs from snapshot), the server write is skipped to avoid clobbering in-progress work.
- `fetchServerPreise()` — fetches all four price JSON files (`preise-reinigung`, `preise-buegeln`, `preise-waesche`, `preise-bonus`), writes to localStorage, re-renders all price editors.

The UI renders immediately from localStorage (may be stale), then updates in the background once the server response arrives. This ensures the admin always shows the latest published state, even when opened on a different device.

### Legacy key migration
`admin.html` runs `migrateData()` on every admin load. It reads the three old keys (`cleanfix-monatsangebot`, `cleanfix-banner`, `cleanfix-deals`), lifts them into schedule entries (type=permanent, no dates), appends them to the schedule array, and deletes the old keys. This is idempotent after first run.

---

## Data Flow: Prices

`Preise.xlsx` is the source of truth. Prices are stored in four `localStorage` keys written by the admin panel:
- `cleanfix-preise-reinigung` → `{ groups: [{ label, rows: [{artikel, preis}] }] }`
- `cleanfix-preise-buegeln` → same structure
- `cleanfix-preise-waesche` → same structure, rows have `preis` and `preis2`
- `cleanfix-preise-bonus` → `{ cards: [...] }` — bonus/loyalty card data

Prices are also persisted server-side as committed JSON files under `data/`:
- `data/preise-reinigung.json`, `data/preise-buegeln.json`, `data/preise-waesche.json`, `data/preise-bonus.json`

`main.js` fetches these JSON files first (server = truth), falls back to localStorage, then to hardcoded HTML in `index.html`.

The `DEFAULTS` object in `admin-site/index.html` JS contains the canonical price data. When updating prices: edit `Preise.xlsx`, update `DEFAULTS.preiseReinigung/preiseBuegeln/preiseWaesche` in the admin, and also update the hardcoded rows in `index.html`.

---

## Admin Panel Architecture (`admin-site/index.html`)

The actively deployed admin panel. All admin JS lives in a single large IIFE (`'use strict'`) at the bottom of the file. All admin CSS is in an inline `<style>` block in `<head>`. The legacy `admin.html` in the project root is kept for reference only and is **not deployed**.

### Authentication
- Login POSTs the password to the `cleanfix-auth` Cloudflare Worker (`POST /login`). The Worker verifies it server-side against a bcrypt hash stored as a Worker secret (`PASS_HASH`) — no hash lives in the client code.
- On success the Worker returns a signed JWT; the admin stores it in `sessionStorage` as `cleanfix-admin-token` (clears on tab close).
- All subsequent API calls (`apiSave`) send `Authorization: Bearer <token>`; n8n verifies the token via `POST /verify` on the same Worker before writing to GitHub.
- **When changing the password**: generate a new bcrypt hash (`node -e "const b=require('bcryptjs');b.hash('newpass',10).then(h=>console.log(h))"`) and update the `PASS_HASH` secret in Cloudflare Dashboard → Workers & Pages → cleanfix-auth → Settings → Variables → Secrets. No code change or redeploy needed.

### Sections (sidebar nav → section IDs)
| Nav label | Section ID | Content |
|-----------|-----------|---------|
| 🗓️ Zeitplan | `section-zeitplan` | Unified schedule management: visual timeline, type chooser (MA/Banner/Deal), load-existing dropdown, live preview, schedule list with inline edit + delete |
| 💶 Preise | `section-preise` | Price table editor with group/row management; Excel import/export |
| 💾 Daten | `section-daten` | Export/import localStorage as JSON |

Active section toggled via `.active` class on both `.admin-nav-item` and `.admin-section`.

### Key Admin JS Functions

**Schedule helpers (at top of IIFE):**
- `generateId()` — 8–12 char random hex string
- `entryStatus(e)` — returns `'permanent'|'active'|'scheduled'|'expired'` based on dates vs `TODAY`
- `getSchedule()` / `saveSchedule(arr)` — safe JSON read/write for `cleanfix-schedule`
- `getBestActive(type)` — returns highest-priority active entry for MA or banner
- `lsGet/lsSet/lsDel` — safe localStorage wrappers

**Section init functions (called from `initAdmin()`):**
- `initNav()` — wires sidebar nav click handlers
- `initZeitplan()` — unified section: renders timeline + schedule list, wires type chooser (MA/Banner/Deal), load-existing dropdown, new-entry form with live preview, Planen toggle, and save handler. Calls `takeSnapshot()` for dirty tracking.
- `initPreise()` — renders price editors from localStorage; wires group/row management; Excel import/export via SheetJS
- `initData()` — export/import/clear-all buttons. Export and clear-all both use an `allKeys` array that must include `cleanfix-schedule` alongside the legacy and price keys. Import accepts any `cleanfix-*` key from the JSON file.
- `initPublishBar()` — wires publish (calls `apiSave`) and discard (reverts to snapshot) buttons on the sticky bottom bar

**Zeitplan rendering:**
- `renderScheduleList()` — reads all schedule entries, sorts (permanent→active→scheduled→expired), renders `.sched-entry` rows with inline edit + delete
- `renderTimeline()` — draws a visual Gantt-chart timeline (5-month window, current ±2) with colored bars per type; bars are clickable to scroll to entries
- `buildEditFormHTML(entry)` — returns HTML for inline edit form appropriate to entry type (dates at bottom, Planen toggle, emoji picker markup for banner/deal)
- `wireEditForm(formEl, entry)` — attaches save, cancel, Planen toggle, and emoji picker handlers to inline edit form; calls `renderTimeline()` + `checkDirty()` after save; does NOT call `apiSave()`
- `updateEntryPreview(type, container)` — renders a live preview of the entry being created/edited
- `populateLoadExisting(type)` — fills the "load existing" dropdown with entries of the selected type as templates

**Publish bar (dirty tracking):**
- `takeSnapshot()` — stores JSON snapshot of current schedule state
- `checkDirty()` — compares current vs snapshot, builds human-readable change list, shows/hides publish bar
- All edit/delete handlers call `checkDirty()` — only the publish bar's publish button triggers `apiSave()`

### Emoji Picker
Shared `EMOJIS` array (glyph + search keywords) + picker panel for banner/deal icon fields. Fuzzy search via `renderEmojis(filter)` scanning both glyph and keyword string. `initEmojiPicker(btnOrId, panelOrId, searchOrId, gridOrId, onSelect)` accepts both string IDs and DOM elements, used in both the new-entry form and inline edit forms. A global click-outside handler closes any open picker.

### localStorage Keys (complete list)

All keys the system uses — any new key must be added to the export/clear-all `allKeys` arrays in `initData()`:

| Key | Written by | Read by | Content |
|-----|-----------|---------|---------|
| `cleanfix-schedule` | admin.html | admin.html, main.js | Unified schedule array (MA, banner, deal entries) |
| `cleanfix-preise-reinigung` | admin | main.js | Price data JSON for Reinigung tab |
| `cleanfix-preise-buegeln` | admin | main.js | Price data JSON for Nur Bügeln tab |
| `cleanfix-preise-waesche` | admin | main.js | Price data JSON for Wäsche & Mangeln tab |
| `cleanfix-preise-bonus` | admin | main.js | Bonus/loyalty card data |
| `cleanfix-monatsangebot` | legacy (migrated) | main.js fallback | Old single MA object |
| `cleanfix-banner` | legacy (migrated) | main.js fallback | Old single banner object |
| `cleanfix-deals` | legacy (migrated) | main.js fallback | Old deals array |
| `cleanfix-theme` | main.js | main.js | `'light'` or `'dark'` |
| `cleanfix-motion` | main.js | main.js | `'on'` or `'off'` |
| `cleanfix-admin-auth` | admin.html (sessionStorage) | admin.html | `'ok'` when logged in |

### Toast Notifications
`toast(msg, type)` — appends `.admin-toast.admin-toast--success/error` div to body; auto-removes after 3.2s. Role=`status` for screen readers.

---

## Angebote Section (public site)

Sits between Leistungen and Preise. Contains:
1. **Monatsangebot card** — dynamic, fed from schedule system (or `Monatsangebot.txt` as last resort)
2. **Sonderangebote/Deals grid** (`#deals-grid`) — rendered from active `type='deal'` schedule entries by `main.js`

---

## Price Search

The search index is built lazily (on first keypress) by reading all `.price-table tbody tr` elements from the live DOM across all tabs, plus `.bonus-card` elements. The `ALIASES` object at the top of the price search IIFE maps typed words to additional search terms — extend it freely when adding new items. Scoring favors longer substring matches.

---

## Service Cards (Leistungen section)

Cards use `.service-card`. Special modifiers:
- `.service-card--highlight` — pink gradient border
- `.service-card--wide` — spans 2 columns on desktop (`grid-column: span 2`), collapses to 1 on ≤900px

Currently Expressservice uses both `--highlight` and `--wide`. The Expressservice card mentions "Aufpreis ab 30 %" for express processing.

---

## German Legal Requirements
- Impressum references **§5 DDG** (not TMG — law changed in 2024)
- No cookie banner needed (no analytics/tracking used)
- Newsletter requires double opt-in (UWG) — not yet implemented in backend
- GDPR supervisory authority: NRW Landesbeauftragte

---

## Key Conventions

- **Logo**: Always use `Logo Cleanfix JH.png` (PNG required for transparency). Never switch to JPG for the transparent variant.
- **Prices**: German decimal format with comma (`37,50 €`), not period.
- **Language**: All user-facing text is German.
- **Bonus cards**: Each card has a `.bonus-shirt-grid` with individual `<span class="shirt-cross">` elements — one per shirt. Update count manually when changing shirt numbers.
- **Price group headers**: Use `<tr class="price-group-header"><td colspan="N">Label</td></tr>` — styled as a subtle section divider inside tables.
- **Tabs**: The price tab system uses `hidden` attribute on inactive panels and `aria-selected` on buttons — both must be updated together in JS when switching tabs. The search tab (`#tab-suche`, `#btn-suche`) is the first tab but not the default active one.
- **Contact form**: Posts JSON to `API_BASE + '/contact-form'` (n8n webhook). Fields: `name` (required), `email` (required), `kundentyp` (required, `'privat'` or `'gewerblich'` — mandatory `<select>` dropdown), `subject` (optional), `message` (required). The n8n workflow (`n8n-workflows/contact-form.json`) sends email from `noreply@cleanfix-mg.de` to `info@cleanfix-mg.de` with the visitor's address as `Reply-To`. ✅ Fully operational — SMTP via All-Inkl / KAS (`w0179bc8.kasserver.com`), n8n workflow active. See `CONTACT-FORM-SETUP.md` at the repo root for details.
- **Newsletter form**: Client-side only, not yet wired to a backend. UWG requires double opt-in — see Future Work in `README.md`.
- **Next Gen mode**: When toggling off, the IIFE cleans up by calling `obs.disconnect()` on all observers in `activeObservers[]` and running all `cleanupFunctions[]` (scroll/mouse listeners). Always push new observers/listeners into these arrays when adding motion effects.
- **`esc()` vs `escHtml()`**: `admin.html` uses `esc()` (defined at top of its IIFE). `main.js` uses `escHtml()` (defined as a global before the schedule IIFE). They are identical in implementation — do not confuse them.
- **Saving a new entry always creates a new schedule entry** — it never overwrites an existing one. To update an existing entry, use inline edit in the schedule list, or load it as a template via the "load existing" dropdown. Dated entries expire naturally.
- **Price editor `onclick` handlers**: The price group/row buttons use inline `onclick` attributes calling `addGroup()`, `deleteGroup()`, `addRow()`, `deleteRow()`. These functions are explicitly assigned to `window` inside the IIFE (e.g. `window.addGroup = function(tab) {...}`) to make them accessible from inline handlers. This pattern is intentional — do not refactor to addEventListener without also removing the `onclick` attributes.
- **`initAdmin()` error isolation**: Each init function is wrapped in its own `try/catch`, so a crash in one section does not prevent other sections from loading. Errors are logged to `console.error` with the function name. Check the browser console if a section appears broken.
- **Publish bar pattern**: No inline `apiSave()` calls from schedule edits. All schedule changes are local (localStorage) until the user clicks the publish bar's "Änderungen veröffentlichen" button, which batch-syncs to the server. Price saves still use inline `apiSave()` separately.

---

## Known Historical Issues (for context)

- **`\!` syntax bug**: A Python-based text replacement once escaped every `!` operator as `\!` in `admin.html`. Fixed by global replacement. If this recurs, run: `python -c "open('admin.html','w').write(open('admin.html').read().replace('\\\\!','!'))"` and re-validate with `node --check`.
- **Stale localStorage causing broken admin**: Old `cleanfix-banner` stored as `{text: '<strong>...</strong>'}` (HTML blob). `migrateData()` and the fallback guard in the banner reader handle this. If something still breaks, open DevTools → Application → Storage → Clear all `cleanfix-*` keys to reset to DEFAULTS.
- **Rich text editor removed**: The banner description was previously a `contenteditable` div with `execCommand` — it was unreliable. It was replaced with three plain text inputs (`banner-icon`, `banner-title`, `banner-desc`). Do not reintroduce `contenteditable` for this.
- **Wrong password hash (Feb 2026)**: `PASS_HASH` was a fabricated value in the old client-side auth. Superseded in Apr 2026 by server-side JWT auth via the cleanfix-auth Cloudflare Worker — no hash lives in the client code anymore.
- **Export/Clear missing `cleanfix-schedule` (Feb 2026)**: The export and clear-all functions in `initData()` only listed legacy keys in their `allKeys` arrays, omitting `cleanfix-schedule`. This caused exports to silently lose all schedule data (MA, banner, deal entries) and "clear all" to leave schedule entries untouched. Fixed by adding `cleanfix-schedule` to both arrays. **When adding new localStorage keys, always update the `allKeys` arrays in `initData()`.**
