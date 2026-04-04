# Cleanfix Website Migration Notes

## Current Setup (Confirmed)
- Website runs on **WordPress**
- Hosting provider: **All-Inkl**
- Domain registrar: **All-Inkl** (same provider)
- Email: All addresses run via **All-Inkl webmail service**
- Newsletter: **CleverReach** (external service)
- Subdomains: **None**
- Current contact: **Fabian** (manages the website, son of Jörg/owner)

## Information Still Needed

### Access
- [ ] Hosting dashboard credentials (Fabian can't share directly — other domains on the same account. Jörg (owner/father) needs to approve. Fabian will discuss with Jörg over the weekend)
- [ ] CleverReach login credentials
- [ ] Contract/billing cycle for All-Inkl hosting

### Email Details
- [ ] Which email addresses exist on the domain? (info@, kontakt@, etc.)
- [ ] MX records (can check once we have All-Inkl access)

---

## Test-First Plan

### Phase 1: Test on Cloudflare Pages subdomain (NOW — no DNS access needed)
1. Connect GitHub repo to Cloudflare Pages
2. Site goes live on `cleanfix.pages.dev` (or similar) automatically
3. Set up n8n + Cloudflare Tunnel for admin panel data flow
4. Integrate CleverReach API for newsletter
5. Test everything end-to-end on the `.pages.dev` URL

### Phase 2: Go live (once DNS access is granted)
1. Check current DNS records at All-Inkl (especially MX for email)
2. Either:
   - **Option A**: Change DNS at All-Inkl to point to Cloudflare Pages (simpler, keep All-Inkl as registrar)
   - **Option B**: Move nameservers to Cloudflare entirely (more control, but must recreate all DNS records including MX for email)
3. Re-create MX records so email keeps working
4. Done — real domain now serves the new site

### Phase 3: Cleanup
1. Remove/disable WordPress installation at All-Inkl
2. Keep All-Inkl for domain registration + email (or migrate email too, TBD)

---

## Planned New Setup

### Architecture
```
Visitors  ──→  Cloudflare Pages (static HTML/CSS/JS)
                      ↑
                      │ (deploy updated JSON files via GitHub commit)
                      │
Admin panel ──→ Cloudflare Tunnel ──→ n8n (local) ──→ GitHub repo ──→ auto-deploy
```

### Components
- **Static hosting**: Cloudflare Pages (free tier)
- **DNS**: Cloudflare or All-Inkl (TBD)
- **Admin data flow**: Admin panel → n8n webhook (via Cloudflare Tunnel) → commit JSON to GitHub → Cloudflare Pages auto-redeploy
- **Forms (contact/newsletter)**: n8n webhook via Cloudflare Tunnel
- **Newsletter**: CleverReach (existing provider — integrate via API)

### Code Changes Needed for Deployment
- `main.js`: Read from `/data/schedule.json` and `/data/preise-*.json` instead of localStorage
- `admin.html`: POST to n8n webhook on save instead of (or alongside) localStorage writes
- n8n workflow: Receive JSON → commit to GitHub → done
- Newsletter form: POST to n8n → n8n calls CleverReach API to add subscriber

### Important
- **Email must not break during migration** — copy all DNS/MX records before changing anything
- **SSL**: Cloudflare provides free SSL automatically
- Visitor traffic never touches the home network — only admin saves go through the tunnel
