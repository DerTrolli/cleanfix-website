# Cleanfix Website Go-Live Rollout Checklist

**Project:** Cleanfix Reinigen und Waschen website migration  
**Production Domain:** cleanfix-mg.de  
**Staging Domain:** cleanfix.thetrolli.com (remains unchanged)  
**Hosting:** Cloudflare Pages (project: cleanfix)  
**Rollout Date:** [Insert date]  
**Owner:** [Name]

---

## Phase 1: Pre-Launch Code Preparation

### 1.1 Merge feature branch to main
- [ ] Ensure all changes on branch `claude/fix-domain-addition-error-xjxxn` are reviewed and approved
- [ ] Verify CI/CD checks pass on the branch
- [ ] Merge the branch to `main` (use `git merge` or GitHub merge button)
- [ ] Cloudflare Pages will auto-deploy within ~60 seconds of merge
- [ ] Monitor deployment in [Cloudflare Pages dashboard](https://dash.cloudflare.com) → cleanfix project

### 1.2 Replace Web Analytics beacon token
⚠️ **Critical:** The beacon token must be replaced before DNS cutover or Web Analytics will not function

- [ ] Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
- [ ] Navigate to: **Web Analytics** → **cleanfix-mg.de** (or use available site selector)
- [ ] Copy the beacon token from the Web Analytics snippet (looks like `XXXXXX-X`)
- [ ] Open these three files in the repository:
  - `Cleanfix/public-site/index.html` (line 738)
  - `Cleanfix/public-site/datenschutz.html` (line 257)
  - `Cleanfix/public-site/impressum.html` (line 144)
- [ ] Replace `SITE_TOKEN` placeholder with the real beacon token in all three files
- [ ] Commit changes: `git commit -m "Replace Web Analytics beacon tokens for production"`
- [ ] Push to main: `git push origin main`
- [ ] Verify redeploy in Cloudflare Pages dashboard (~60 seconds)

### 1.3 Verify monthly offer (Monatsangebot) is published
- [ ] Log into cleanfix-admin.thetrolli.com
- [ ] Navigate to: **Zeitplan** (Schedule) section
- [ ] Verify a current/valid **Monatsangebot** entry exists
- [ ] If missing: Create a new Monatsangebot entry
- [ ] Click **"Änderungen veröffentlichen"** in the publish bar
- [ ] Wait for n8n to commit the updated `schedule.json` to GitHub (check commit log in GitHub)
- [ ] Verify Cloudflare Pages redeploys
- [ ] Confirm `/data/schedule.json` is updated by checking the site source

### 1.4 Verify price data is current
- [ ] Log into cleanfix-admin.thetrolli.com
- [ ] Navigate to: **Preise** (Prices) section
- [ ] Verify all price entries (`preise-*.json`) are populated with current prices
- [ ] If prices were modified: Click **"Änderungen veröffentlichen"** to sync to GitHub
- [ ] Verify Cloudflare Pages redeploys

### 1.5 Test staging site functionality
- [ ] Open https://cleanfix.thetrolli.com in a browser
- [ ] Verify all pages load without errors (index, datenschutz, impressum)
- [ ] Test contact form submission
  - [ ] Fill out form with test data
  - [ ] Submit and verify success message
  - [ ] Check info@cleanfix-mg.de inbox for test email (may take 1–2 minutes)
- [ ] Test newsletter signup
  - [ ] Sign up with a test email address
  - [ ] Verify double opt-in email arrives in inbox
- [ ] Test price tables and monthly offer display
- [ ] Test dark mode toggle (localStorage persistence)
- [ ] Test mobile responsiveness at 375px width

---

## Phase 2: DNS Configuration & Domain Cutover

⚠️ **Warning:** DNS changes affect all services pointing to cleanfix-mg.de. Ensure email is not interrupted.

### 2.1 Prepare Cloudflare Pages custom domains
- [ ] Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
- [ ] Navigate to: **Pages** → **cleanfix** project → **Custom domains**
- [ ] Add custom domain: `cleanfix-mg.de`
  - Cloudflare will auto-generate CNAME records
  - You may see a warning about existing A records (expected; will remove them next)
- [ ] Add custom domain: `www.cleanfix-mg.de`
  - Cloudflare will auto-generate CNAME records
- [ ] Do NOT close this page; we'll verify CNAME creation in step 2.2

### 2.2 Verify and delete old DNS A records
⚠️ **Critical:** Must delete the old A records pointing to 85.13.147.176 before new CNAME can resolve

- [ ] In Cloudflare, navigate to: **DNS** records for cleanfix-mg.de
- [ ] Locate and **DELETE** these A records:
  - `cleanfix-mg.de` → `85.13.147.176` (proxied)
  - `www.cleanfix-mg.de` → `85.13.147.176` (proxied)
- [ ] **DO NOT DELETE** wildcard (`*`) A record (DNS only)
- [ ] **DO NOT TOUCH** MX, SPF, DKIM, DMARC records
- [ ] Verify deletion is complete (may take 1–2 minutes to reflect in dashboard)

### 2.3 Verify CNAME records are created
- [ ] In Cloudflare DNS records, confirm these CNAME records now exist:
  - `cleanfix-mg.de` → `cleanfix.pages.dev` (proxied via Cloudflare)
  - `www.cleanfix-mg.de` → `cleanfix.pages.dev` (proxied via Cloudflare)
- [ ] If CNAME records are not present, manually create them pointing to `cleanfix.pages.dev`
- [ ] Set both to **Proxied** (orange cloud icon) for Cloudflare Page Rules and SSL to work

### 2.4 Verify Cloudflare SSL certificate
- [ ] Still in DNS settings, navigate to: **SSL/TLS** section
- [ ] Verify **Full (Strict)** mode is enabled
- [ ] Verify certificate covers both `cleanfix-mg.de` and `*.cleanfix-mg.de`
- [ ] No action needed; Cloudflare auto-provisions and renews

### 2.5 Wait for DNS propagation
- [ ] Cloudflare DNS is instant, but propagation to global resolvers takes ~5–15 minutes
- [ ] Use [DNS Checker](https://dnschecker.org/) to verify propagation:
  - [ ] Verify `cleanfix-mg.de` resolves to Cloudflare IP
  - [ ] Verify `www.cleanfix-mg.de` resolves to Cloudflare IP
- [ ] Use `nslookup cleanfix-mg.de` or `dig cleanfix-mg.de` locally
- [ ] Proceed to Phase 3 once DNS is globally resolving

---

## Phase 3: Post-Launch Verification

### 3.1 Verify production site loads correctly
- [ ] Open https://cleanfix-mg.de in a browser (private/incognito window to bypass cache)
- [ ] Verify page loads completely (no 404 or 502 errors)
- [ ] Check browser console for JavaScript errors
- [ ] Verify all page elements render correctly

### 3.2 Verify www subdomain
- [ ] Open https://www.cleanfix-mg.de in a browser
- [ ] Verify it loads the same content as https://cleanfix-mg.de
- [ ] Verify redirect works correctly (should serve directly, not redirect in browser)

### 3.3 Verify SSL certificate
- [ ] Click the lock icon in the address bar
- [ ] Verify certificate is valid and issued by Cloudflare
- [ ] Verify certificate covers both `cleanfix-mg.de` and `*.cleanfix-mg.de`
- [ ] Verify no SSL warnings or errors

### 3.4 Test contact form
- [ ] Fill out contact form on https://cleanfix-mg.de with test data
- [ ] Submit the form
- [ ] Verify success message displays
- [ ] Check info@cleanfix-mg.de inbox for test email (allow 1–2 minutes)
- [ ] Verify email content is correct and from: noreply@cleanfix-mg.de

### 3.5 Test newsletter signup
- [ ] Subscribe to newsletter with a test email address on https://cleanfix-mg.de
- [ ] Verify success/thank-you message displays
- [ ] Check test email inbox for CleverReach double opt-in confirmation email
- [ ] Verify double opt-in email has correct branding and content
- [ ] Do NOT click the confirmation link yet (will be done in Phase 4)

### 3.6 Verify price tables display
- [ ] On https://cleanfix-mg.de, navigate to sections displaying prices
- [ ] Verify prices load from `/data/preise-*.json` (inspect Network tab → XHR)
- [ ] Verify no 404 errors for price data files
- [ ] Verify prices display with correct formatting and currency (EUR)

### 3.7 Verify monthly offer (Monatsangebot) displays
- [ ] On https://cleanfix-mg.de, locate the monthly offer section
- [ ] Verify offer displays correctly with current month's content
- [ ] Verify offer data loads from `/data/schedule.json` (inspect Network tab)
- [ ] Verify no 404 errors for schedule data

### 3.8 Verify Web Analytics
- [ ] Open https://cleanfix-mg.de and interact with the page
- [ ] Navigate to [Cloudflare Web Analytics](https://dash.cloudflare.com) → cleanfix-mg.de site
- [ ] Wait 2–3 minutes, then refresh the analytics dashboard
- [ ] Verify pageviews are being recorded
- [ ] Verify beacon token is working (no warnings in Web Analytics UI)

### 3.9 Verify dark mode toggle
- [ ] On https://cleanfix-mg.de, test the dark mode toggle
- [ ] Verify dark mode activates and applies styles correctly
- [ ] Refresh the page
- [ ] Verify dark mode preference persists (stored in localStorage)
- [ ] Test toggle again to switch back to light mode
- [ ] Verify light mode persists

### 3.10 Verify mobile responsiveness
- [ ] Open https://cleanfix-mg.de on a mobile device or mobile browser (375px width)
- [ ] Verify layout reflows correctly
- [ ] Test touch interactions (menu toggle, dark mode, form submission)
- [ ] Verify no horizontal scroll or layout overflow
- [ ] Test on both portrait and landscape orientations

### 3.11 Verify staging site still works
- [ ] Open https://cleanfix.thetrolli.com in a browser
- [ ] Verify staging site still loads and functions normally
- [ ] Verify staging site is NOT affected by DNS changes
- [ ] This ensures a rollback target is still available

### 3.12 Verify old WordPress site still accessible
- [ ] Verify the old All-Inkl hosted WordPress site is still online
- [ ] This is critical to ensure email services and backup access remain available
- [ ] Contact All-Inkl support if site is down

---

## Phase 4: Service Configuration Updates

### 4.1 Update CleverReach newsletter form redirect
⚠️ **Note:** Only perform this step after confirming Phase 3 verification is complete

- [ ] Log into [CleverReach](https://www.cleverreach.com) account
- [ ] Navigate to: **Forms** → locate the Cleanfix newsletter form
- [ ] Edit form settings
- [ ] Update **Weiterleitung nach Anmeldung** (Redirect after signup) from:
  - Old: `https://cleanfix.thetrolli.com`
  - New: `https://cleanfix-mg.de`
- [ ] Save form settings
- [ ] Test by signing up to newsletter again with a different email address
- [ ] Verify you are redirected to https://cleanfix-mg.de after signup

### 4.2 Verify contact form n8n workflow
- [ ] Log into n8n at cleanfix-api.thetrolli.com
- [ ] Navigate to: **Workflows** → contact form workflow
- [ ] Verify the SMTP configuration is still pointing to All-Inkl (should not change)
- [ ] Verify the "To" email address is `info@cleanfix-mg.de`
- [ ] No action needed if configured correctly; workflow handles both old and new domain

### 4.3 Verify admin panel still accessible
- [ ] Open https://cleanfix-admin.thetrolli.com in a browser
- [ ] Verify admin login page loads
- [ ] Log in with credentials
- [ ] Verify all admin functions still work
- [ ] Admin panel URL should NOT change during migration

### 4.4 Verify auth worker still accessible
- [ ] Open https://cleanfix-auth.trollojunior.workers.dev in a browser
- [ ] Verify auth endpoints respond correctly
- [ ] Auth Worker URL should NOT change during migration

---

## Phase 5: Cleanup & Stabilization

### 5.1 Remove old A records from DNS (final confirmation)
- [ ] Log into Cloudflare DNS settings for cleanfix-mg.de
- [ ] Confirm old A records (85.13.147.176) are deleted
- [ ] Confirm CNAME records are in place for production Pages domains
- [ ] No further DNS changes should be made

### 5.2 Update internal documentation
- [ ] Update team wiki / README / internal docs with:
  - [ ] Production domain is now: https://cleanfix-mg.de
  - [ ] Staging domain: https://cleanfix.thetrolli.com
  - [ ] Admin panel: https://cleanfix-admin.thetrolli.com
  - [ ] n8n API: https://cleanfix-api.thetrolli.com
- [ ] Update any client-facing documentation (hosting details, support links)

### 5.3 Monitor for issues (first 24 hours)
- [ ] Monitor Cloudflare Analytics dashboard for unusual traffic patterns
- [ ] Check email inbox (info@cleanfix-mg.de) for incoming contact form submissions
- [ ] Verify at least 3–5 test form submissions and newsletters arrive correctly
- [ ] Monitor error logs / Cloudflare Page Rules for blocked requests
- [ ] Keep auth and admin services monitored for any 4xx/5xx errors

### 5.4 Decommission old server (after stability period)
⚠️ **Note:** Only proceed after 48+ hours of stable production operation

- [ ] Confirm cleanfix-mg.de is serving from Cloudflare Pages (not All-Inkl)
- [ ] Confirm no urgent rollback is needed
- [ ] Contact All-Inkl support to request removal of old WordPress site
- [ ] Keep MX and email records on All-Inkl intact (do not remove)
- [ ] All-Inkl server should remain online for email relay and SMTP services

---

## Rollback Plan

If something goes wrong during or after rollout, follow this rollback procedure:

### Immediate Rollback (< 5 minutes)
1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to: **Pages** → **cleanfix** project → **Custom domains**
3. Delete the custom domains:
   - Remove `cleanfix-mg.de`
   - Remove `www.cleanfix-mg.de`
4. Traffic will immediately revert to the old A records (85.13.147.176 / All-Inkl server)
5. DNS propagation is instant via Cloudflare
6. Contact All-Inkl support to confirm WordPress site is serving traffic again

### Rollback Verification
- [ ] Open https://cleanfix-mg.de → should load old WordPress site
- [ ] Open https://www.cleanfix-mg.de → should load old WordPress site
- [ ] Open https://cleanfix.thetrolli.com → should still work (staging unaffected)
- [ ] Verify email services are restored (contact form should route to All-Inkl)

### Investigation & Recovery
- [ ] Identify the issue from Cloudflare logs, Page Rules, or browser console
- [ ] Fix the issue on the `claude/fix-domain-addition-error-xjxxn` or `main` branch
- [ ] Merge fixes to main and wait for Pages redeploy
- [ ] Re-add custom domains to Pages and repeat Phase 3 verification
- [ ] Only proceed to Phase 4 after issues are resolved

---

## Critical Contacts & Resources

| Service | Contact | Notes |
|---------|---------|-------|
| Cloudflare Support | https://dash.cloudflare.com → Support | For Pages, DNS, SSL issues |
| All-Inkl Support | support@all-inkl.com | For email, SMTP, old server issues |
| GitHub | https://github.com/DerTrolli/cleanfix-website | Source code and deployment logs |
| CleverReach | https://www.cleverreach.com | Newsletter platform |
| n8n (API) | https://cleanfix-api.thetrolli.com | Workflow automation |

---

## Sign-Off

- [ ] Phase 1 (Pre-Launch) completed and verified: _________________ Date: _______
- [ ] Phase 2 (DNS & Domain) completed and verified: _________________ Date: _______
- [ ] Phase 3 (Post-Launch) completed and verified: _________________ Date: _______
- [ ] Phase 4 (Services) completed and verified: _________________ Date: _______
- [ ] Phase 5 (Cleanup) completed and verified: _________________ Date: _______

**Rollout Status:** LIVE ✓  
**Go-Live Timestamp:** _______________________  
**Verified By:** _______________________
