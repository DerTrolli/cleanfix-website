# Cleanfix Website

Marketing website and management panel for **Cleanfix Reinigen und Waschen**, a textile-cleaning business in Mönchengladbach, Germany.

The repo contains three independently-deployed pieces:

| Piece | Path | Live URL | Stack |
|------|------|---------|-------|
| Public marketing site | `Cleanfix/public-site/` | https://cleanfix-mg.de | Vanilla HTML/CSS/JS, no build |
| Admin management panel | `Cleanfix/admin-site/` | (separate Cloudflare Pages project) | Vanilla HTML/CSS/JS, password-protected |
| n8n automation workflows | `n8n-workflows/` | https://cleanfix-api.thetrolli.com/webhook/* | n8n self-hosted, behind Cloudflare Tunnel |

> **Note:** The Cloudflare Web Analytics token is currently a placeholder (`SITE_TOKEN`) in all three public HTML files. Replace it with the real token from Cloudflare Dashboard → Web Analytics once the domain is connected. See `ROLLOUT.md` for the full go-live checklist.

There is **no build step, no package.json, no framework, no dependencies** other than two CDN scripts (SheetJS for Excel I/O in admin, and Inter font from Google Fonts). Open the HTML files directly in a browser to develop, or use any static file server. Changes go live on push via Cloudflare Pages auto-deploy.

---

## Repository layout

```
.
├── README.md                      ← you are here
├── CONTACT-FORM-SETUP.md          ← handoff guide for wiring the contact form (SMTP setup)
├── .claude/                       ← shared Claude Code config (committed)
│   ├── launch.json                ← `preview_start` config for dev servers
│   └── settings.local.json        ← Bash permission allow-list (no secrets)
├── Cleanfix/
│   ├── CLAUDE.md                  ← deep architecture reference for Claude / contributors
│   ├── CONCEPT.md                 ← original product concept
│   ├── MIGRATION-NOTES.md         ← notes from the v1 → v2 migration
│   ├── Preise.xlsx                ← source-of-truth for prices (must be updated alongside the JSON / HTML)
│   ├── Monatsangebot.txt          ← legacy fallback for the monthly offer card
│   ├── public-site/               ← what visitors see at cleanfix-mg.de
│   │   ├── index.html             ← single-page marketing site
│   │   ├── style.css              ← all styles, including dark-mode tokens
│   │   ├── main.js                ← all interactivity (vanilla JS, no modules)
│   │   ├── impressum.html         ← legal imprint (§5 DDG)
│   │   ├── datenschutz.html       ← GDPR privacy policy
│   │   ├── _headers               ← Cloudflare Pages CORS rule for /data/*
│   │   ├── wrangler.jsonc         ← Cloudflare project config
│   │   └── data/                  ← server-side state (committed JSON, written by n8n)
│   │       ├── schedule.json
│   │       ├── preise-reinigung.json
│   │       ├── preise-buegeln.json
│   │       ├── preise-waesche.json
│   │       └── preise-bonus.json
│   ├── admin-site/                ← password-protected management panel
│   │   ├── index.html             ← entire admin app, single file (HTML + inline CSS + inline JS)
│   │   ├── style.css              ← copy of public-site style.css for shared tokens / live previews
│   │   └── wrangler.jsonc         ← Cloudflare project config (separate project from public site)
│   └── admin.html                 ← legacy single-file admin (kept for reference, not deployed)
└── n8n-workflows/                 ← workflow JSON exports for the n8n instance
    ├── save-schedule.json         ← writes Cleanfix/public-site/data/schedule.json via GitHub API
    ├── save-preise.json           ← writes the four preise-*.json files
    ├── newsletter-sub.json        ← (not yet wired)
    └── contact-form.json          ← contact form → email (✅ active in n8n)
```

---

## Architecture in one diagram

```
┌─────────────┐                   ┌──────────────────┐
│  Visitor    │ ── HTTPS ───────► │  Cloudflare      │
│  (browser)  │                   │  Pages           │ ◄── git push (auto-deploy)
└─────────────┘                   │  cleanfix-mg.de  │
       │                          └─────────┬────────┘
       │ contact-form POST                  │
       │                                    │ reads /data/*.json
       ▼                                    ▼
┌─────────────────────┐            ┌──────────────────┐
│  n8n via Cloudflare │            │ public-site      │
│  Tunnel             │            │ (static HTML/JS) │
│  cleanfix-api.*     │            └──────────────────┘
└──────────┬──────────┘
           │ workflow handles, formats,
           │ then commits to GitHub via PAT
           ▼
┌──────────────────────┐           ┌──────────────────┐
│  GitHub repo         │ ◄────────▶│  Admin           │
│  (this one)          │  API/UI   │  cleanfix-admin.*│
│                      │           │  (Cloudflare     │
└──────────┬───────────┘           │   Pages, auth)   │
           │ push triggers          └──────────────────┘
           ▼
   Cloudflare Pages redeploys → site is live
```

The admin panel writes locally first (`localStorage`) and the user clicks **"Änderungen veröffentlichen"** in the publish bar, which POSTs to an n8n webhook. n8n re-serialises the data and commits it to `Cleanfix/public-site/data/*.json` via the GitHub API. Cloudflare Pages picks up the commit and redeploys within ~60 seconds.

For deeper architecture details (data flow, schedule shapes, JS module ordering, helper functions, known historical issues) read **[`Cleanfix/CLAUDE.md`](Cleanfix/CLAUDE.md)**. That file is the canonical reference and is loaded into Claude Code whenever it works in this repo.

---

## Local development

There is no `npm install`. To work on the public site:

```bash
# from repo root
npx serve Cleanfix/public-site -p 8900
# open http://localhost:8900
```

To work on the admin site:

```bash
npx serve Cleanfix/admin-site -p 8901
# open http://localhost:8901
```

Or in Claude Code, the admin server is preconfigured in `.claude/launch.json` and can be started with `preview_start admin`.

> **Why a server, not `file://`?**
> `main.js` calls `fetch('Monatsangebot.txt')` (legacy fallback) and the admin's live previews load `style.css` cross-document. Both fail under `file://` and silently break the UI.

### Validating JS syntax

There is no linter. To check the admin's main IIFE compiles:

```bash
node -e "const fs=require('fs');const h=fs.readFileSync('Cleanfix/admin-site/index.html','utf8');const m=h.match(/<script>([\s\S]*?)<\/script>(?![\s\S]*<\/script>)/);fs.writeFileSync('_tmp.js',m[1])" \
  && node --check _tmp.js \
  && rm _tmp.js
```

(`node --check Cleanfix/admin-site/index.html` does **not** work — Node refuses unknown extensions.)

For the public-site JS, just:

```bash
node --check Cleanfix/public-site/main.js
```

---

## Deployment

Both sites deploy automatically via **Cloudflare Pages** with the GitHub integration. The two projects (`cleanfix` and `cleanfix-admin`) point at the same git repo, with different `wrangler.jsonc` build directories. There is nothing to do beyond `git push` — Pages picks up the commit and rebuilds within ~60 seconds.

If a deploy looks stuck, check the Cloudflare dashboard → **Workers & Pages** → the relevant project → **Deployments**.

The `_headers` file in `public-site/` adds permissive CORS to `/data/*` so the admin panel (different origin) can read `schedule.json` and the price files.

---

## Admin panel: authentication

The admin uses **server-side JWT auth** via the `cleanfix-auth` Cloudflare Worker. No password hash lives in the client code.

**Login flow:**
1. Browser POSTs the password to `https://cleanfix-auth.trollojunior.workers.dev/login`
2. Worker verifies it against a bcrypt hash stored as a Worker secret (`PASS_HASH`) — never in the repo
3. On success the Worker returns a signed JWT; stored in `sessionStorage` as `cleanfix-admin-token` (clears on tab close)
4. All publish calls (`save-schedule`, `save-preise`) send `Authorization: Bearer <token>`; n8n verifies the token via `POST /verify` before writing to GitHub

### Changing the password

1. Generate a new bcrypt hash:
   ```bash
   node -e "const b=require('bcryptjs');b.hash('NEW_PASSWORD',10).then(h=>console.log(h))"
   ```
2. Update the `PASS_HASH` secret in **Cloudflare Dashboard → Workers & Pages → cleanfix-auth → Settings → Variables → Secrets**
3. No code change or redeploy needed — existing sessions expire naturally when the JWT TTL runs out

**Never commit the plaintext password anywhere** — not in code, not in commit messages, not in this README.

---

## n8n workflows

The n8n instance lives at `cleanfix-api.thetrolli.com` (Cloudflare Tunnel → self-hosted n8n). Workflow definitions are version-controlled as JSON exports under `n8n-workflows/`. To re-import a workflow after editing it in n8n:

1. n8n UI → **Workflows** → open the workflow → **⋮ menu** → **Download** → JSON
2. Save into `n8n-workflows/<name>.json`
3. Commit and push

To restore one of these workflows on a fresh n8n instance, do the reverse: **Workflows** → **Import from File**.

| Workflow | Webhook | Purpose | Status |
|----------|---------|---------|--------|
| `save-schedule.json` | `POST /webhook/save-schedule` | Receives the unified schedule array from admin, commits it to `Cleanfix/public-site/data/schedule.json` via GitHub API | ✅ live |
| `save-preise.json` | `POST /webhook/save-preise` | Receives one of the three price tabs, commits the matching `preise-*.json` | ✅ live |
| `newsletter-sub.json` | `POST /webhook/newsletter-sub` | Newsletter signup → CleverReach (double opt-in handled by CleverReach) | ✅ live |
| `contact-form.json` | `POST /webhook/contact-form` | Contact form → email | ✅ Active — sends from `noreply@cleanfix-mg.de` to `info@cleanfix-mg.de` |

The GitHub PAT used by the save-* workflows lives only in n8n credentials, never in this repo. If it leaks or expires, rotate it in GitHub → **Settings** → **Developer settings** → **Personal access tokens**, then update the n8n credential.

---

## Working with Claude Code on this repo

This repo is set up so that Claude Code can collaborate on it remotely. The relevant config files are tracked in git:

- **`Cleanfix/CLAUDE.md`** — auto-loaded into every Claude Code conversation in this repo. Contains the architecture reference, conventions, and known historical issues. **If you make a structural change, update this file.**
- **`.claude/launch.json`** — preconfigured dev server entry for `preview_start admin`.
- **`.claude/settings.local.json`** — pre-approved Bash command allow-list. New machines will need to re-approve any commands not already on this list.

### Adding a new machine

1. `git clone https://github.com/DerTrolli/cleanfix-website.git`
2. Open in Claude Code or your editor of choice
3. The CLAUDE.md and `.claude/` config come with the clone — Claude is immediately oriented
4. Run a dev server (`preview_start admin` or `npx serve Cleanfix/public-site -p 8900`) and start working

### Things Claude should never do (and you should never ask it to)

- Commit plaintext credentials of any kind (passwords, tokens, API keys, GitHub PATs)
- Push without your explicit say-so for sensitive areas
- Run `git push --force` on `main`
- Skip pre-commit hooks (`--no-verify`)

---

## Future Work

### 1. ~~Replace client-side hash auth with a backend-verified login~~ ✅ Done

Implemented via the `cleanfix-auth` Cloudflare Worker (Apr 2026). Password hash lives only in a Worker secret; the admin HTML has no credentials. All publish calls are JWT-gated in n8n.

**Threat model after this change:** an attacker on the open internet sees a login form. They can guess passwords, but each guess hits a real server, gets rate-limited, and is logged. They never see the hash. Even with the right password, they need the rate-limit window. This moves us from "speed bump" to "actual lock".

**When to do this:** any time before the admin URL leaks, ideally before adding any new sensitive features (e.g. customer data, payment info, personal data of newsletter subscribers).

### 2. ~~Wire up the contact form~~ ✅ Done

The contact form is fully operational. Submissions are sent from
`noreply@cleanfix-mg.de` to `info@cleanfix-mg.de` via the n8n workflow
(SMTP via All-Inkl / KAS, Cloudflare Tunnel). Reply-To is set to the
visitor's email address.

**Remaining anti-spam hardening (not blocking):**

1. Add Cloudflare Turnstile site key + widget to the contact form HTML
2. Add a hidden honeypot field
3. Update the form submit JS to send the Turnstile token + honeypot
4. Update the n8n workflow to verify the token server-side and bail silently if the honeypot is filled
5. Add Turnstile disclosure to `datenschutz.html`

### ~~3. Newsletter double opt-in~~ ✅ Done

Newsletter signup is live. The frontend form posts to the n8n `/newsletter-sub` webhook, which forwards signups to CleverReach. Double opt-in is handled automatically by CleverReach (UWG-compliant). The subscriber list was migrated from the old WordPress/CleverReach account. See **`NEWSLETTER-SETUP.md`** for integration details.

### 4. Server-side validation for all admin save endpoints

Right now the n8n save-* workflows trust the JSON payload from the admin UI completely. After the auth rework above, also add schema validation (Zod-style) inside each workflow so a compromised or buggy admin can't write malformed JSON to `data/schedule.json`.

### 5. Photo gallery / carousel with R2-backed media library

Requested by the business owner: a visual gallery showing photos of the store, the cleaning process, finished garments, team at work, etc. Lives as an **inline section on the main public page**, not a subpage. Visually consistent with the existing card layout (rounded corners, brand gradients, `var(--shadow-md)`, etc.). **Images only for v1 — videos deferred to a later iteration** because of the extra complexity (poster frames, preload strategy, autoplay policies, codec fallbacks, much larger files).

**Storage: Cloudflare R2 (free tier)**

- One R2 bucket `cleanfix-media` with a custom domain `media.cleanfix.thetrolli.com` (free CNAME in Cloudflare)
- Two prefixes inside the bucket:
  - `staging/{uuid}.webp` + `staging/{uuid}-thumb.webp` — uploads that haven't been published yet
  - `live/{uuid}.webp` + `live/{uuid}-thumb.webp` — published, referenced by the public site
- R2 lifecycle rule: auto-delete anything in `staging/` older than 24 hours (catches orphans from closed tabs or failed publishes)
- R2 is only for media. Website code stays on Cloudflare Pages from GitHub, exactly as today.
- Free tier: 10 GB storage, 1M Class A ops/month, 10M Class B ops/month, free egress. A gallery of a few dozen photos is well under 1 GB — **€0/month**.

**Upload flow: client-side compression**

Browser does all the image processing. No server-side image pipeline. No Cloudflare Images (€5/month). No n8n sharp nodes receiving megabyte-sized originals.

1. Admin opens the Medien section in the admin panel, drops files into the upload zone (or uses a file picker).
2. For each file, the admin's browser uses the canvas API to produce **two** WebP variants:
   - **Full**: max 1600px wide, quality ~0.82 (~200–400 KB typical)
   - **Thumb**: max 400px wide, quality ~0.75 (~20–40 KB typical)
3. Admin panel calls an n8n webhook `POST /webhook/media-presign` → returns two short-lived presigned PUT URLs, one for the full and one for the thumb, targeting `staging/`.
4. Browser PUTs both blobs directly to R2 using those URLs.
5. Entry gets added to a local `media.json` in `localStorage` and shows up in the publish bar as "N Medien-Änderungen ausstehend".

Compression takes a few seconds per file on the admin's device, which is fine — it's an admin panel used occasionally by one person, not a public upload form.

**Admin panel UI**

New "Medien" tab in the admin, alongside Zeitplan and Preise:

- **Upload zone** at the top: drag-and-drop + file picker, accepts multiple files at once, shows per-file progress
- **Thumbnail grid** below: tiles show the thumb image, filename, and an "Alt-Text" input on each tile (manual entry — see below)
- **Drag-to-reorder**: same interaction model as the existing schedule list, stores `order` as an integer on each entry
- **Per-tile actions**: edit alt text inline, delete (flows through the publish bar, can be reverted)
- **Publish bar integration**: all additions, reorders, alt-text edits, and deletions are staged until the user clicks "Änderungen veröffentlichen". Revert wipes staged R2 uploads and restores `media.json` from the clean snapshot, same dirty-tracking pattern as the schedule.
- **Alt text is entered manually** by the admin. Not auto-generated. AI-generated alt text was considered (local Ollama + moondream on the n8n box) but rejected for consistency — for business-critical accessibility copy in German, the owner prefers to write or paste it (e.g. from Gemini) rather than trust unreviewed model output.

**Data shape: `Cleanfix/public-site/data/media.json`**

```json
[
  {
    "id": "abc123",
    "src":   "https://media.cleanfix.thetrolli.com/live/abc123.webp",
    "thumb": "https://media.cleanfix.thetrolli.com/live/abc123-thumb.webp",
    "width": 1600,
    "height": 1067,
    "alt": "Mitarbeiterin bügelt ein weißes Hemd an einer Dampfbügelstation.",
    "order": 0
  }
]
```

Committed to the repo via the same GitHub API flow as `schedule.json` and `preise-*.json`.

**n8n workflows (two new ones)**

- `media-presign.json`: webhook receives `{ filename, contentType }`, generates two R2 presigned PUT URLs (one for full, one for thumb) targeting `staging/`, returns them to the admin. Uses the R2 S3-compatible API with credentials stored as n8n credentials. Short TTL (e.g. 5 min) on each URL.
- `save-media.json`: webhook receives the full pending `media.json` payload plus lists of `{ promote: [...ids], delete: [...ids] }`. Workflow: copy staged objects to `live/`, delete their `staging/` siblings, delete any `live/` objects flagged for deletion, then commit the new `media.json` to `Cleanfix/public-site/data/media.json` via the GitHub API. Same pattern as `save-schedule.json`.

**Public site rendering**

New `<section id="galerie">` in `index.html`, rendered in `main.js`:

- Fetches `data/media.json` on page load, sorted by `order`
- Renders as a horizontally scrollable strip on mobile (`overflow-x: auto` + the same scroll-shadow trick used for the price tables) and a responsive grid / carousel on desktop (2–3 visible items)
- `<img loading="lazy" decoding="async" srcset="...thumb.webp 400w, ....webp 1600w">` for each tile
- Click/tap a tile → lightweight lightbox that swaps to the full-resolution `src`
- Pure CSS + vanilla JS, no Swiper/Slick (keep the no-dependency principle)
- Design tokens: reuse `var(--shadow-md)`, `var(--radius-lg)`, `var(--gradient-primary)` to match the rest of the site

**Why this design**

- **Free**: R2 free tier + client-side compression means zero recurring cost.
- **Current setup unchanged**: website code still ships via Pages from GitHub, admin still publishes via n8n + GitHub API, publish bar still handles dirty tracking. R2 is an *add-on*, not a rewrite.
- **R2 stays small**: only compressed WebPs ever land in the bucket, originals are never uploaded.
- **Fast on mobile**: 20–40 KB thumbs above-the-fold, full resolution only on lightbox open.
- **Safe revert semantics**: staging prefix + lifecycle rule means a cancelled upload leaves zero garbage behind within 24h.
- **Accessibility under owner control**: alt text is written by a human, not guessed by a model.

### 6. Optional time-of-day scheduling

Currently the schedule system only supports date ranges (start/end date). A future enhancement would add optional time-of-day fields (e.g. "only visible from 12:30 to 18:00") for more granular control over banners, monthly offers, and deals. The `isActive()` function in both `main.js` and the admin panel would need to compare `HH:MM` in addition to `YYYY-MM-DD`. Use `Europe/Berlin` timezone (not UTC) for the comparison since the business and all its customers are in Germany.

---

## License & contact

Private repo. Not licensed for redistribution. Contact the repo owner before reusing any of this code.
