# Cleanfix Website

Marketing website and management panel for **Cleanfix Reinigen und Waschen**, a textile-cleaning business in Mönchengladbach, Germany.

The repo contains three independently-deployed pieces:

| Piece | Path | Live URL | Stack |
|------|------|---------|-------|
| Public marketing site | `Cleanfix/public-site/` | https://cleanfix.thetrolli.com | Vanilla HTML/CSS/JS, no build |
| Admin management panel | `Cleanfix/admin-site/` | (separate Cloudflare Pages project) | Vanilla HTML/CSS/JS, password-protected |
| n8n automation workflows | `n8n-workflows/` | https://cleanfix-api.thetrolli.com/webhook/* | n8n self-hosted, behind Cloudflare Tunnel |

There is **no build step, no package.json, no framework, no dependencies** other than two CDN scripts (SheetJS for Excel I/O in admin, and Inter font from Google Fonts). Open the HTML files directly in a browser to develop, or use any static file server. Changes go live on push via Cloudflare Pages auto-deploy.

---

## Repository layout

```
.
├── README.md                      ← you are here
├── .claude/                       ← shared Claude Code config (committed)
│   ├── launch.json                ← `preview_start` config for the admin dev server
│   └── settings.local.json        ← Bash permission allow-list (no secrets)
├── Cleanfix/
│   ├── CLAUDE.md                  ← deep architecture reference for Claude / contributors
│   ├── CONCEPT.md                 ← original product concept
│   ├── MIGRATION-NOTES.md         ← notes from the v1 → v2 migration
│   ├── Preise.xlsx                ← source-of-truth for prices (must be updated alongside the JSON / HTML)
│   ├── Monatsangebot.txt          ← legacy fallback for the monthly offer card
│   ├── public-site/               ← what visitors see at cleanfix.thetrolli.com
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
│   │       └── preise-waesche.json
│   ├── admin-site/                ← password-protected management panel
│   │   ├── index.html             ← entire admin app, single file (HTML + inline CSS + inline JS)
│   │   ├── style.css              ← copy of public-site style.css for shared tokens / live previews
│   │   └── wrangler.jsonc         ← Cloudflare project config (separate project from public site)
│   └── admin.html                 ← legacy single-file admin (kept for reference, not deployed)
└── n8n-workflows/                 ← workflow JSON exports for the n8n instance
    ├── save-schedule.json         ← writes Cleanfix/public-site/data/schedule.json via GitHub API
    ├── save-preise.json           ← writes the three preise-*.json files
    ├── newsletter-sub.json        ← (not yet wired)
    └── contact-form.json          ← (not yet imported — see Future Work)
```

---

## Architecture in one diagram

```
┌─────────────┐                   ┌──────────────────┐
│  Visitor    │ ── HTTPS ───────► │  Cloudflare      │
│  (browser)  │                   │  Pages           │ ◄── git push (auto-deploy)
└─────────────┘                   │  cleanfix.*      │
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

The admin uses **client-side SHA-256 hash comparison** for login. The plaintext password is **never stored in the repo** — only its SHA-256 hex digest in `PASS_HASH` (search `admin-site/index.html` for `PASS_HASH`). When you log in, the browser hashes what you typed via `crypto.subtle.digest` and compares to `PASS_HASH`. A successful match writes `cleanfix-admin-auth = 'ok'` to `sessionStorage` (clears on tab close).

> ⚠️ **`crypto.subtle` requires a secure context.** It works on `https://` and `http://localhost`, but **not on plain `file://`** or `http://` over a LAN.

### Changing the password

1. Compute the new SHA-256 hex digest:
   ```bash
   node -e "require('crypto').subtle.digest('SHA-256', new TextEncoder().encode('NEW_PASSWORD')).then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join('')))"
   ```
2. Replace the value of `PASS_HASH` in **`Cleanfix/admin-site/index.html`** (and the legacy `Cleanfix/admin.html` if you still use it).
3. Commit and push. The first 12 hex chars are used as a session "fingerprint", so changing the hash automatically invalidates any open sessions on next page load.
4. **Never commit the plaintext password anywhere** — not in code, not in commit messages, not in `.claude/settings.local.json`, not in this README.

### Why this scheme is **not** strong, and what we want to do about it

The current scheme is "secrets-by-obscurity-plus-a-hash". A bad actor can:
1. Open DevTools on the admin URL, view-source, and read the SHA-256 hex digest.
2. Run an offline dictionary / brute-force attack against the digest with no rate limit.
3. Once they recover the plaintext, log in normally.

It's a speed bump, not a lock. For now it's acceptable because (a) the admin URL isn't published anywhere, (b) all destructive actions go through n8n, which itself sits behind Cloudflare Tunnel and could be hardened independently, and (c) the threat model is "casual prodding", not "targeted attack". But it should be replaced.

**See the [Future Work](#future-work) section below for the planned backend-verified auth.**

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
| `newsletter-sub.json` | `POST /webhook/newsletter-sub` | Newsletter double opt-in handler | ⚠️ workflow exists, not wired into UI |
| `contact-form.json` | `POST /webhook/contact-form` | Contact form → email | ⚠️ workflow exists, not imported, blocked on SMTP — see Future Work |

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

### 1. Replace client-side hash auth with a backend-verified login

**Why:** the current `PASS_HASH` in `admin-site/index.html` is publicly readable. Anyone who finds the admin URL can grab the hash and run an offline brute-force / dictionary attack with unlimited tries. There is no rate limit, no logging, no lockout, and no way to revoke a leaked password without redeploying.

**What we want instead:** a small backend endpoint (n8n workflow or Cloudflare Worker) that takes a plaintext password from the admin UI over HTTPS, compares it server-side against a hash that lives **only on the server**, and returns either a short-lived signed JWT or a session cookie. The admin UI then proves its identity to all subsequent webhook calls (`save-schedule`, `save-preise`, etc.) by sending that token.

**Implementation sketch:**

1. **Pick a host for the auth endpoint.** Two options:
   - **n8n workflow `auth-login`** — easiest, reuses the existing tunnel/infra. Webhook node → Crypto node (SHA-256) → IF node → JWT/Set node. Add a **rate-limit** in front (e.g. an `n8n-nodes-base.wait` keyed by client IP, or Cloudflare's free rate-limiting rules on the tunnel hostname).
   - **Cloudflare Worker** — slightly more code but better at rate-limiting and lives on the same edge as the static site.
2. **Move `PASS_HASH` out of the admin HTML entirely.** Store it as an n8n credential / Worker secret. The admin HTML knows nothing about it.
3. **Issue a token on success.** A signed JWT with a short TTL (e.g. 8 h) and a `sub` claim of `admin`. Sign with an HMAC secret that lives in the same n8n credential / Worker secret store.
4. **Update all save-* workflows to require the JWT.** Add a JWT-verify node at the start of each. Reject anything without a valid token.
5. **Store the JWT in `sessionStorage`** in the admin (replaces the current `cleanfix-admin-auth = 'ok'` flag). Clear on logout.
6. **Add server-side rate limiting and logging:**
   - Cloudflare WAF rule: ≤ 5 requests / minute per IP to `/webhook/auth-login`
   - n8n logs every login attempt (success or fail) so we can spot brute-force attempts
   - Optionally: lockout for 15 min after 5 consecutive failures from the same IP
7. **Optional hardening:**
   - Add a second factor (TOTP via `speakeasy` in n8n, or Cloudflare Access in front of the admin domain — **Cloudflare Access is by far the easiest and probably the right answer** if it's in budget)
   - Rotate the JWT signing secret on a schedule

**Threat model after this change:** an attacker on the open internet sees a login form. They can guess passwords, but each guess hits a real server, gets rate-limited, and is logged. They never see the hash. Even with the right password, they need the rate-limit window. This moves us from "speed bump" to "actual lock".

**When to do this:** any time before the admin URL leaks, ideally before adding any new sensitive features (e.g. customer data, payment info, personal data of newsletter subscribers).

### 2. Wire up the contact form (currently blocked on SMTP)

The contact form HTML and client-side JS exist in `Cleanfix/public-site/`, and a workflow template lives at `n8n-workflows/contact-form.json` (not imported). The plan is **Cloudflare Turnstile + honeypot in front of an n8n workflow that sends an email**. Full step-by-step plan:

1. Add Turnstile site key + widget to the contact form HTML
2. Add a hidden honeypot field
3. Update the form submit JS to send the Turnstile token + honeypot
4. Update the n8n workflow to verify the token server-side and bail silently if the honeypot is filled
5. Configure SMTP credentials in n8n (Brevo free tier or Gmail app-password)
6. Import the workflow and test end-to-end
7. Add Turnstile disclosure to `datenschutz.html`

**Currently blocked on:** no SMTP / email account exists for `cleanfix-mg.de` yet. Pick this back up once email is set up.

### 3. Newsletter double opt-in

UWG requires double opt-in for newsletters. The HTML form, the n8n workflow, and the storage layer are all unimplemented. Lower priority than auth and contact form.

### 4. Server-side validation for all admin save endpoints

Right now the n8n save-* workflows trust the JSON payload from the admin UI completely. After the auth rework above, also add schema validation (Zod-style) inside each workflow so a compromised or buggy admin can't write malformed JSON to `data/schedule.json`.

---

## License & contact

Private repo. Not licensed for redistribution. Contact the repo owner before reusing any of this code.
