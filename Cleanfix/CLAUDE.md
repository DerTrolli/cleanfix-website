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

- `index.html` — Main single-page site. Sections in order: nav, hero, promo banner, leistungen, angebote, preise (tabs), filialen, newsletter, kontakt, footer
- `style.css` — All styles; single file, no preprocessor. Also imported by `admin.html` for CSS tokens and live preview rendering.
- `main.js` — All public-site interactivity; vanilla JS, no ES modules
- `admin.html` — Self-contained management panel; all admin JS/CSS is inline in the file
- `impressum.html` — Legal imprint (§5 DDG)
- `datenschutz.html` — GDPR privacy policy
- `Monatsangebot.txt` — Legacy fallback monthly offer data file; read at runtime by JS only when no schedule entry exists
- `Preise.xlsx` — Source of truth for all prices; update this file when prices change, then reflect changes in the HTML price tables and admin.html DEFAULTS object
- `Logo-Cleanfix Transparent.png` — Logo used in nav/footer (must stay PNG — transparency required)
- `favicon.png` — Browser tab icon

## Architecture

### CSS Design System
All design tokens live as CSS custom properties in `:root` in `style.css`. Dark mode overrides those same tokens under `[data-theme="dark"]` — no component-level dark rules needed. The `data-theme` attribute lives on `<html>`.

Brand colors: `--blue: #0830DD`, `--pink: #F508B8`.

Dark mode exceptions (components that need explicit dark overrides rather than relying purely on token inheritance) are grouped near the top of `style.css`.

`admin.html` imports `style.css` to reuse tokens and to render live previews of the promo banner and monatsangebot card using their actual production CSS.

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

### How `main.js` applies schedule entries
1. Load `cleanfix-schedule` from localStorage
2. Filter by `isActive(entry)` (date check against today's ISO date)
3. **MA**: apply best active monatsangebot entry, else fall back to `cleanfix-monatsangebot` legacy key, else fetch `Monatsangebot.txt` (HTTP only)
4. **Banner**: apply best active banner entry, else fall back to `cleanfix-banner` legacy key (supports both `{icon,title,desc}` new format and `{text:...}` very old HTML-blob format)
5. **Deals**: apply all active deal entries as an array, else fall back to `cleanfix-deals` legacy array

MA hardcoded defaults are applied immediately on page load (before any async ops) so the card is never visually empty.

### Legacy key migration
`admin.html` runs `migrateData()` on every admin load. It reads the three old keys (`cleanfix-monatsangebot`, `cleanfix-banner`, `cleanfix-deals`), lifts them into schedule entries (type=permanent, no dates), appends them to the schedule array, and deletes the old keys. This is idempotent after first run.

---

## Data Flow: Prices

`Preise.xlsx` is the source of truth. Prices are also hardcoded in three `localStorage` keys written by the admin panel:
- `cleanfix-preise-reinigung` → `{ groups: [{ label, rows: [{artikel, preis}] }] }`
- `cleanfix-preise-buegeln` → same structure
- `cleanfix-preise-waesche` → same structure, rows have `preis` and `preis2`

`main.js` reads these keys and re-renders the tbody elements (`#tbody-reinigung`, `#tbody-buegeln`, `#tbody-waesche`). If a key is absent, the HTML hardcoded in `index.html` is shown as-is.

The `DEFAULTS` object in `admin.html` JS contains the canonical price data. When updating prices: edit `Preise.xlsx`, update `DEFAULTS.preiseReinigung/preiseBuegeln/preiseWaesche` in `admin.html`, and also update the hardcoded rows in `index.html`.

---

## Admin Panel Architecture (`admin.html`)

All admin JS lives in a single large IIFE (`'use strict'`) at the bottom of the file. All admin CSS is in an inline `<style>` block in `<head>`.

### Authentication
- Password: `cleanfix2026`
- Login checks against SHA-256 hash via `crypto.subtle.digest`; plain string compare as fallback if `crypto.subtle` unavailable
- `PASS_HASH` must be the exact SHA-256 hex digest of `PASS_PLAIN`. Current correct hash for `cleanfix2026`: `fa635e3ca4aaed9001b0f2c6cd1b52cd8fec1254e0e2ac998064a577afb99f92`
- Auth state: `sessionStorage.getItem('cleanfix-admin-auth') === 'ok'` — clears on tab close
- **When changing the password**: update **both** `PASS_PLAIN` and `PASS_HASH` together. Compute the new hash with: `node -e "require('crypto').subtle.digest('SHA-256',new TextEncoder().encode('NEW_PASSWORD')).then(b=>console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))"`. If the hash is wrong, login silently falls back to insecure plaintext comparison — this is a bug-prone state, not a feature.

### Sections (sidebar nav → section IDs)
| Nav label | Section ID | Content |
|-----------|-----------|---------|
| 📣 Aktionen & Banner | `section-aktionen` | MA form + Banner form side-by-side with schedule dates; live previews |
| 🗓️ Zeitplan | `section-zeitplan` | Full list of all schedule entries; inline edit + delete |
| 🏷️ Sonderangebote | `section-deals` | Deal cards editor with per-card date fields |
| 💶 Preise | `section-preise` | Price table editor with group/row management |
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
- `initAktionen()` — loads active MA+Banner into forms; wires save + load-current buttons; live preview on input
- `initZeitplan()` — renders schedule list; wires new-entry button
- `initDeals()` — renders deals editor from schedule entries; wires add/save/reset
- `initPreise()` — renders price editors from localStorage; wires group/row management
- `initData()` — export/import/clear-all buttons. Export and clear-all both use an `allKeys` array that must include `cleanfix-schedule` alongside the legacy and price keys. Import accepts any `cleanfix-*` key from the JSON file.

**Zeitplan rendering:**
- `renderScheduleList()` — reads all schedule entries, sorts (permanent→active→scheduled→expired), renders `.sched-entry` rows
- `buildEditFormHTML(entry)` — returns HTML for inline edit form appropriate to entry type
- `wireEditForm(formEl, entry)` — attaches save handler to inline edit form; updates entry in-place
- Edit button toggles `.sched-edit-form` visibility inside the entry row
- Delete button confirms + splices entry from schedule array + re-renders

**Deals editor:**
- Each deal is stored as individual `type='deal'` schedule entry (not a flat array)
- `renderDealsEditor()` — reads all deal entries from schedule; renders card editors with per-card emoji picker, date fields, hidden `d-id` field
- `collectAndSaveDeals()` — removes all existing deal entries; re-inserts from current form state
- DEFAULTS.deals defines the two permanent built-in deals (Donnerstag Hosen + Mengenrabatt)

### Emoji Picker
Shared `EMOJIS` array (glyph + search keywords) + picker panel in each location that needs it (banner, each deal card). Fuzzy search via `renderEmojis(filter)` scanning both glyph and keyword string. Banner picker is wired with `initEmojiPicker(btnId, panelId, searchId, gridId, onSelect)`. Deal pickers are wired inline per-card in `renderDealsEditor()`. A global click-outside handler closes any open picker.

### localStorage Keys (complete list)

All keys the system uses — any new key must be added to the export/clear-all `allKeys` arrays in `initData()`:

| Key | Written by | Read by | Content |
|-----|-----------|---------|---------|
| `cleanfix-schedule` | admin.html | admin.html, main.js | Unified schedule array (MA, banner, deal entries) |
| `cleanfix-preise-reinigung` | admin.html | main.js | Price data JSON for Reinigung tab |
| `cleanfix-preise-buegeln` | admin.html | main.js | Price data JSON for Nur Bugeln tab |
| `cleanfix-preise-waesche` | admin.html | main.js | Price data JSON for Wasche & Mangeln tab |
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

- **Logo**: Always use `Logo-Cleanfix Transparent.png` (PNG required for transparency). Never switch to JPG for the transparent variant.
- **Prices**: German decimal format with comma (`37,50 €`), not period.
- **Language**: All user-facing text is German.
- **Bonus cards**: Each card has a `.bonus-shirt-grid` with individual `<span class="shirt-cross">` elements — one per shirt. Update count manually when changing shirt numbers.
- **Price group headers**: Use `<tr class="price-group-header"><td colspan="N">Label</td></tr>` — styled as a subtle section divider inside tables.
- **Tabs**: The price tab system uses `hidden` attribute on inactive panels and `aria-selected` on buttons — both must be updated together in JS when switching tabs. The search tab (`#tab-suche`, `#btn-suche`) is the first tab but not the default active one.
- **Forms**: No backend connected yet. Contact and newsletter forms show a success state client-side only. Real submission requires a webhook (n8n via Cloudflare Tunnel is planned).
- **Next Gen mode**: When toggling off, the IIFE cleans up by calling `obs.disconnect()` on all observers in `activeObservers[]` and running all `cleanupFunctions[]` (scroll/mouse listeners). Always push new observers/listeners into these arrays when adding motion effects.
- **`esc()` vs `escHtml()`**: `admin.html` uses `esc()` (defined at top of its IIFE). `main.js` uses `escHtml()` (defined as a global before the schedule IIFE). They are identical in implementation — do not confuse them.
- **Saving from Aktionen always creates a new entry** — it never overwrites an existing one. To update the current live entry, use "Aktuellen laden", edit, save new, then delete the old one in Zeitplan. Dated entries expire naturally.
- **Price editor `onclick` handlers**: The price group/row buttons use inline `onclick` attributes calling `addGroup()`, `deleteGroup()`, `addRow()`, `deleteRow()`. These functions are explicitly assigned to `window` inside the IIFE (e.g. `window.addGroup = function(tab) {...}`) to make them accessible from inline handlers. This pattern is intentional — do not refactor to addEventListener without also removing the `onclick` attributes.
- **`initAdmin()` error isolation**: Each init function is wrapped in its own `try/catch` (line ~2320), so a crash in one section (e.g. `initDeals`) does not prevent other sections from loading. Errors are logged to `console.error` with the function name. Check the browser console if a section appears broken.

---

## Known Historical Issues (for context)

- **`\!` syntax bug**: A Python-based text replacement once escaped every `!` operator as `\!` in `admin.html`. Fixed by global replacement. If this recurs, run: `python -c "open('admin.html','w').write(open('admin.html').read().replace('\\\\!','!'))"` and re-validate with `node --check`.
- **Stale localStorage causing broken admin**: Old `cleanfix-banner` stored as `{text: '<strong>...</strong>'}` (HTML blob). `migrateData()` and the fallback guard in the banner reader handle this. If something still breaks, open DevTools → Application → Storage → Clear all `cleanfix-*` keys to reset to DEFAULTS.
- **Rich text editor removed**: The banner description was previously a `contenteditable` div with `execCommand` — it was unreliable. It was replaced with three plain text inputs (`banner-icon`, `banner-title`, `banner-desc`). Do not reintroduce `contenteditable` for this.
- **Wrong password hash (Feb 2026)**: `PASS_HASH` was a fabricated value that didn't match `cleanfix2026`. Login only worked via the insecure plaintext fallback (`PASS_PLAIN`). Fixed by computing the real SHA-256 hash. **Always recompute the hash when changing the password** — see Authentication section above.
- **Export/Clear missing `cleanfix-schedule` (Feb 2026)**: The export and clear-all functions in `initData()` only listed legacy keys in their `allKeys` arrays, omitting `cleanfix-schedule`. This caused exports to silently lose all schedule data (MA, banner, deal entries) and "clear all" to leave schedule entries untouched. Fixed by adding `cleanfix-schedule` to both arrays. **When adding new localStorage keys, always update the `allKeys` arrays in `initData()`.**
