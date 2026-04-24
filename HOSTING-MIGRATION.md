# Going live on cleanfix-mg.de – migration guide

This file documents **exactly how we move the new website onto the real domain
`cleanfix-mg.de`** without breaking email.

**Who does what:**
- **Trolli** (you reading this) – owns the Cloudflare account and the GitHub repo.
  Does all Cloudflare-side setup.
- **Fabian** – Jörg's son, current IT contact, has access to the All-Inkl / KAS
  panel. Does the one DNS change described in Section 5.
- **Jörg** – owner of Cleanfix. No technical work needed from him.

---

## 1. The mental model (read this first)

A website and an email account look like one thing to a customer –
both live at `cleanfix-mg.de` – but technically they are **two
independent services** that just happen to share the same domain name.

Think of the domain as a **street address**:

| Thing | Analogy |
|-------|---------|
| `cleanfix-mg.de` | The street address "Gladbacher Straße 30" |
| Website hosting | The **shop building** standing at that address |
| Email hosting | The **letterbox** on the wall |
| DNS records | The **entry in the phone book** that tells the world "here is the shop, and the post goes to this letterbox" |
| Nameservers | **Which company runs the phone book** |

Today, All-Inkl runs everything: shop (WordPress), letterbox (email), and
the phone book (DNS). **We are moving the phone book management to Cloudflare**
(Option B) so that Trolli has full control over DNS from the Cloudflare
dashboard – without needing Fabian to log in for future changes.
Email stays 100 % at All-Inkl; only the tool that manages the DNS records moves.

### Why Option B (move the nameservers) and not Option A (just change a few records)?

Option A (keeping All-Inkl as the DNS manager) would require Fabian to log in
and manually change specific A/CNAME records. That works, but:
- Future DNS changes still need Fabian every time.
- The apex domain (`cleanfix-mg.de` without `www`) can't use a CNAME in standard
  DNS; Cloudflare's CNAME-flattening solves this automatically once they're the
  nameserver.

Option B: **Cloudflare becomes the nameserver for `cleanfix-mg.de`**. Cloudflare
already imported all the existing DNS records (MX, SPF, DKIM, DMARC, A, CNAME…)
when you added the domain. Fabian's only job is to swap the two nameserver values
in KAS – one change, done once, and from then on all DNS is managed through the
Cloudflare dashboard.

### Why not worry about email?

Cloudflare imported a copy of every DNS record from All-Inkl, **including all the
email records** (MX, SPF, DKIM, DMARC). Once those are verified to be correct in
Cloudflare, the mailboxes themselves still live at All-Inkl and keep working as
before – the only difference is that the pointer (DNS) is now managed in
Cloudflare instead of KAS.

---

## 2. What changes, what stays

| Piece | Today | After migration |
|-------|-------|-----------------|
| Website visitors see | WordPress on All-Inkl | New static site on Cloudflare Pages |
| Domain registrar | All-Inkl | **All-Inkl** (unchanged) |
| DNS nameservers | All-Inkl | **Cloudflare** (this is the one change) |
| DNS records for email | All-Inkl | Same records, now managed in Cloudflare |
| Email mailboxes | All-Inkl (KAS) | **All-Inkl** (unchanged – email itself never moves) |
| Webmail login | All-Inkl | **All-Inkl** (unchanged) |
| SSL certificate | All-Inkl's | Cloudflare's (free, auto-renewed) |
| Contact form | Works via n8n + All-Inkl SMTP | **Same** (unchanged) |
| Cost | All-Inkl hosting fees | Domain + email fees only at All-Inkl; hosting is €0 |

---

## 3. Current state in Cloudflare (what you've already done)

You've already added `cleanfix-mg.de` to your Cloudflare account as a zone.
Cloudflare scanned All-Inkl's DNS and auto-imported all records. Here is what
it found, and what still needs to be fixed before flipping the nameservers:

### Records confirmed correct ✅

| Type | Name | Value | Note |
|------|------|-------|------|
| MX | `@` | `w0179bc8.kasserver.com` (prio 10) | DNS-only – email routing, looks correct |
| TXT | `@` | `v=spf1 a mx include:spf.kasserver.com ~all` | DNS-only – SPF record, looks correct |

### Records that need fixing before going live ⚠️

#### 1. Wildcard A record must be DNS-only (not Proxied)

Cloudflare set the `*` (wildcard) A record to **Proxied** (orange cloud).
That breaks IMAP and SMTP – those protocols are not HTTP, so they can't go
through Cloudflare's HTTP proxy. Mail clients like Outlook or Thunderbird would
fail to connect.

**Fix:** In Cloudflare DNS → find the `* → 85.13.147.176` A record →
click the orange cloud icon → switch it to **DNS only** (grey cloud). Save.

#### 2. DKIM record is at the wrong location

Cloudflare imported the DKIM TXT record at the domain root (`@` =
`cleanfix-mg.de`). But DKIM records **must** live at the selector subdomain:
`<selector>._domainkey.cleanfix-mg.de` – where `<selector>` is a short name
like `default`, `mail`, `k1`, etc. (All-Inkl's KAS assigns this name; it's
visible in the DNS zone there.)

Without the correct selector name we can't place the record properly in
Cloudflare. See Section 4 for what to ask Fabian.

**Interim fix:** Delete or ignore the wrongly-placed DKIM entry at `@`.
Once Fabian sends you the correct selector name, create a new TXT record:
- **Name:** `<selector>._domainkey` (e.g. `default._domainkey`)
- **Content:** the full DKIM value starting with `v=DKIM1; k=rsa; p=…`
- **Proxy status:** DNS only

#### 3. DMARC record – check if it exists

DMARC is a TXT record at `_dmarc.cleanfix-mg.de` that tells receiving mail
servers what to do with emails that fail SPF/DKIM checks. It may or may not
exist on the All-Inkl zone – Cloudflare's scan didn't import one, which either
means it wasn't there or the scan missed it. Ask Fabian to check.

If it doesn't exist yet, you can add a safe minimal one yourself after the switch:
- **Name:** `_dmarc`
- **Content:** `v=DMARC1; p=none; rua=mailto:info@cleanfix-mg.de`
- **Proxy status:** DNS only

(`p=none` means "monitor only, don't reject anything" – safe as a first step.)

---

## 4. What to ask Fabian before the nameserver switch

Before you tell Fabian to swap the nameservers, you need two pieces of
information from him (so you can fix the DKIM record in Cloudflare first):

1. **The DKIM selector name** – in KAS → Domain → `cleanfix-mg.de` → DNS-Einstellungen,
   look for a TXT record whose name looks like `something._domainkey.cleanfix-mg.de`.
   The "something" part is the selector. Also copy the full TXT record value.
2. **Whether a DMARC record exists** – same DNS view, look for a TXT record at
   `_dmarc.cleanfix-mg.de`. If it exists, copy the full value.

A ready-to-send German message for Fabian is in `MESSAGE-TO-FABIAN.md` at the
repo root.

---

## 5. The full step-by-step plan

### Phase A – Fix DNS records in Cloudflare (Trolli, before involving Fabian)

1. Fix the wildcard proxy issue (Section 3 → item 1 above).
2. Wait for Fabian's reply with the DKIM selector (see Section 4 / the message).
3. In Cloudflare DNS:
   - Delete the wrongly-placed DKIM TXT record at `@` (if it's there).
   - Create a new TXT record: name = `<selector>._domainkey`, content = the
     full DKIM value Fabian sends, proxy = DNS only.
   - If DMARC doesn't exist, optionally add the `_dmarc` record (Section 3 → item 3).
4. Attach `cleanfix-mg.de` as a custom domain to the Cloudflare Pages project:
   - Cloudflare → Workers & Pages → `cleanfix` project → Custom domains
   - Add `cleanfix-mg.de` and `www.cleanfix-mg.de`
   - Cloudflare will automatically handle routing for both.

### Phase B – Get Cloudflare's nameserver values (Trolli)

In Cloudflare → your `cleanfix-mg.de` zone overview, find the two nameserver
addresses that Cloudflare assigned. They look like:
```
<name>.ns.cloudflare.com
<name>.ns.cloudflare.com
```
Write these down exactly – you'll send them to Fabian.

### Phase C – Fabian swaps the nameservers in KAS (one task for Fabian)

See the copy-paste German message in `MESSAGE-TO-FABIAN.md`.

In KAS, Fabian goes to: **Domain → `cleanfix-mg.de` → Nameserver-Einstellungen**
and replaces the two current All-Inkl nameservers with the two Cloudflare ones
you send him. He saves. That's the entire change.

**Important: he does not touch any DNS records** – those are already correctly
set up in Cloudflare. He only changes where the world looks for the DNS records
(the nameservers), not the records themselves.

### Phase D – Wait for propagation and verify (Trolli, after Fabian confirms)

DNS changes propagate globally within **24–48 hours** (often much faster, ~1–4 h).

1. Check propagation status at `https://dnschecker.org/#NS/cleanfix-mg.de` –
   wait until most nodes show Cloudflare's nameservers.
2. Open `https://cleanfix-mg.de` – should show the new site with a lock icon.
   (Cloudflare auto-issues SSL within minutes of the nameserver switch.)
3. Open `https://www.cleanfix-mg.de` – same.
4. **Test email is still working:**
   - Send a test mail from your personal address to `info@cleanfix-mg.de`.
     Fabian or Jörg should confirm it arrived in KAS webmail.
   - Ask Fabian to reply from `info@cleanfix-mg.de` to you – confirm delivery.
5. Test the contact form at `https://cleanfix-mg.de/#kontakt` – fill it out and
   submit. `info@cleanfix-mg.de` should receive the notification within ~1 minute.
6. Click through `/impressum.html`, `/datenschutz.html`, and anchors like
   `/#preise`, `/#filialen` – all should work.

### Phase E – Cleanup (a week or two after go-live)

Once everything has been stable for a week:

1. **Task for Fabian:** In KAS, disable or delete the old WordPress installation
   (and its database) for `cleanfix-mg.de`. **Do not touch email** – the
   mailboxes stay exactly as they are.
2. Update `README.md` in this repo: change the "Live URL" to `cleanfix-mg.de`
   instead of `cleanfix.thetrolli.com`.
3. Decide whether to keep `cleanfix.thetrolli.com` as a private staging URL or
   remove the custom domain from Cloudflare Pages.

---

## 6. What happens if something breaks?

| Problem | Likely cause | Fix |
|---------|-------------|-----|
| Website broken, email fine | Pages custom domain not attached yet, or DNS not propagated | Wait 10 min; check Pages custom domain status in Cloudflare dashboard |
| SSL error for a few minutes | Cloudflare issuing the certificate | Normal – refresh after 5–10 min |
| Email broken | DKIM record wrong/missing in Cloudflare | Verify the DKIM record in Cloudflare DNS matches the selector+value Fabian sent |
| Email broken (MX) | MX record went missing or got proxied | Check Cloudflare DNS: MX must be DNS-only, pointing to `w0179bc8.kasserver.com` prio 10 |
| Everything broken | Nameservers not yet propagated | Check `dnschecker.org/#NS/cleanfix-mg.de`; may need more time |
| Need to roll back fast | Any critical issue | Ask Fabian to restore All-Inkl's original nameservers in KAS – that reverts everything |

---

## 7. Glossary

- **DNS** — Domain Name System. The global "phone book" that maps `cleanfix-mg.de`
  to a specific computer's IP address.
- **A record** — A DNS entry that points a name to an **IPv4 address**.
- **CNAME record** — A DNS entry that points one name to **another name**.
- **MX record** — "Mail eXchange" – tells the world which server receives email
  for the domain. Must never be proxied or changed.
- **TXT record** — Free-text DNS record, used for SPF, DKIM, DMARC, and domain
  verification tokens.
- **SPF** — Sender Policy Framework. A TXT record at `@` that lists which mail
  servers are allowed to send mail as `@cleanfix-mg.de`. Prevents spoofing.
- **DKIM** — DomainKeys Identified Mail. A TXT record at
  `<selector>._domainkey.cleanfix-mg.de` containing a public key. All-Inkl signs
  outgoing mails with the matching private key; recipients verify the signature.
  If the DKIM record is missing or in the wrong place, mails may land in spam.
- **DMARC** — Domain-based Message Authentication, Reporting & Conformance.
  A TXT record at `_dmarc.cleanfix-mg.de` that tells receiving servers what to do
  with mails that fail SPF/DKIM. `p=none` = log only, `p=quarantine` = spam folder,
  `p=reject` = block.
- **Nameserver (NS)** — The server that answers DNS queries for a domain.
  Today: All-Inkl's nameservers. After migration: Cloudflare's nameservers.
  The domain *registrar* (All-Inkl) stores which nameservers are in use – that's
  what Fabian changes in KAS.
- **Apex / root domain** — `cleanfix-mg.de` without any prefix.
  Often written as `@` in DNS panels.
- **Wildcard record (`*`)** — Matches any subdomain not otherwise listed, e.g.
  `anything.cleanfix-mg.de`. Must be DNS-only to avoid breaking mail clients.
- **Proxied (orange cloud) vs DNS-only (grey cloud)** — Cloudflare's proxy routes
  HTTP/HTTPS traffic through Cloudflare's edge (gives DDoS protection, caching,
  etc.). DNS-only just answers the DNS query and lets the client connect directly.
  Mail-related records (MX, wildcard `*`, `mail.*`, `imap.*`, `smtp.*`) must all
  be DNS-only because the proxy only handles HTTP.
- **TTL** — Time To Live. How long (in seconds) a DNS answer is cached.
  Irrelevant here since we're swapping nameservers (which have their own
  propagation time of 24–48 h), but good to know.
- **CNAME-flattening** — Cloudflare's trick that lets an apex domain (`@`) use
  a CNAME-like record even though standard DNS doesn't allow it. This is why
  Option B works cleanly: Cloudflare can map `cleanfix-mg.de` directly to the
  Pages hostname without needing raw IP addresses.
- **KAS** — Kunden-Administrations-System. All-Inkl's customer admin panel
  at `https://kas.all-inkl.com`. Fabian uses this to manage DNS and email.
- **Cloudflare Pages** — Cloudflare's free static-site hosting. The new site
  lives here; pushing to GitHub re-deploys it automatically.

---

## 8. Related docs

- `Cleanfix/MIGRATION-NOTES.md` – higher-level migration overview and history
- `CONTACT-FORM-SETUP.md` – SMTP / email-sending details (unchanged by this migration)
- `MESSAGE-TO-FABIAN.md` – ready-to-send German message to Fabian with the info request
- `README.md` – general project overview; the "Live URL" column needs updating after Phase E
