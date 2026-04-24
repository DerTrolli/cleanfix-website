# Going live on cleanfix-mg.de – migration guide

This file explains **how we move the new website onto the real domain
`cleanfix-mg.de`** without breaking email, and without needing access to
the All-Inkl account (since Jörg hosts other domains on the same
account, he'll do those steps himself).

It's written for someone with **no hosting background**. Each step
explains *what* we're doing and *why*. At the end there's a clean
checklist to forward to Jörg – he only has to execute those instructions
in All-Inkl, nothing else.

---

## 1. The mental model (read this first)

A website and an email account look like one thing to a customer –
both live at `cleanfix-mg.de` – but technically they are **two
independent services** that just happen to share the same domain name.

Think of the domain as a **street address**:

| Thing | Analogy |
|-------|---------|
| `cleanfix-mg.de` | The street address "Gladbacher Straße 30" |
| Website hosting | The actual **shop building** standing at that address |
| Email hosting | The **letterbox** mounted on the wall |
| DNS records | The **entry in the phone book** that tells the world "here is the shop, and the post goes to this letterbox" |

Today, All-Inkl runs **all three**: the shop (WordPress), the letterbox
(email via `w0179bc8.kasserver.com`), and the phone book entry (DNS).

What we want to do is **move the shop to a new building** (Cloudflare
Pages, where the new site already runs on `cleanfix.thetrolli.com`) –
but leave the **letterbox exactly where it is**. Email must keep
working the whole time. And we want to leave the phone book itself
(All-Inkl's DNS service) alone, just update the one line that points
people to the shop.

### Why Cloudflare Pages and not All-Inkl?

All-Inkl is great for WordPress and email, but the new site isn't
WordPress – it's a modern static site backed by the admin panel and
n8n automation. Cloudflare Pages hosts it **for free**, deploys
automatically every time we push to GitHub, and provides free SSL
(the little lock icon in the browser). There's no ongoing cost and no
maintenance.

### Why don't we just change everything at once?

Because email is critical to the business. If we accidentally break the
mail-forwarding records, `info@cleanfix-mg.de` goes silent and no one
notices until a customer complains days later. The safe approach is:
**change only the minimum number of DNS records, leave email
records untouched.**

---

## 2. What changes, what stays

| Piece | Today | After migration |
|-------|-------|-----------------|
| Website visitors see | WordPress on All-Inkl | New static site on Cloudflare Pages |
| Domain registrar | All-Inkl | **All-Inkl** (unchanged) |
| DNS nameservers | All-Inkl | **All-Inkl** (unchanged) |
| Email (`info@`, `noreply@`) | All-Inkl (KAS) | **All-Inkl** (unchanged) |
| Webmail login | All-Inkl | **All-Inkl** (unchanged) |
| SSL certificate | All-Inkl's | Cloudflare's (free, auto-renewed) |
| Contact form | Works via n8n + All-Inkl SMTP | **Same** (unchanged) |
| Cost | All-Inkl hosting fees | Only domain + email fees at All-Inkl; hosting is €0 |

Only **two DNS records change** – the ones that map the website name to
the server. Everything else in the DNS zone (MX, SPF, DKIM, DMARC,
autodiscover, webmail) stays exactly as-is.

---

## 3. The plan, in phases

### Phase A – Preparation (**you**, on Cloudflare side)

Before we ask Jörg to do anything at All-Inkl, we set up the new domain
on Cloudflare so that the target exists.

1. **Log into Cloudflare** → *Workers & Pages* → the `cleanfix`
   project (the one already serving `cleanfix.thetrolli.com`).
2. Open **Custom domains** → **Set up a custom domain** →
   enter `cleanfix-mg.de`.
3. Cloudflare will show you a **small box of DNS instructions**. Write
   these down exactly – you'll forward them to Jörg. They'll look like
   one of these two shapes:

   - **CNAME record for www:** `www` → `cleanfix.pages.dev` (or similar)
   - **A record(s) for the root (apex):** `@` → one or more IP addresses

   Cloudflare shows the exact values – copy them verbatim.
4. Repeat step 2–3 for `www.cleanfix-mg.de` so both variants work.
5. **Do not continue** until you have these exact values. Without them
   Jörg has nothing to enter.

### Phase B – Pre-flight (ask Jörg for the first small favour)

Before the big switch, Jörg does **one tiny preparatory step** that
makes any rollback faster:

> **Task for Jörg:** In KAS (All-Inkl admin panel), lower the TTL on
> the existing A record(s) for `cleanfix-mg.de` (and `www`) to
> **300 seconds**. Nothing else changes – just the TTL value.

Why: TTL is how long the phone book entry gets cached around the world.
Default is often 1 day. If we need to roll back, we don't want to wait
24 hours for the old entry to disappear from everyone's cache. 300 sec
= 5 minutes. Do this **a day or two in advance** of the cutover so the
low TTL has time to propagate.

### Phase C – The cutover (hand-off checklist for Jörg)

This is the list you actually send to Jörg. It's in Section 5 below,
ready to copy-paste.

### Phase D – Verification (**you**, after Jörg confirms he's done)

1. Wait ~5–10 minutes for DNS to propagate.
2. Open `https://cleanfix-mg.de` – should show the new site with the
   little lock icon. (Cloudflare auto-issues the SSL certificate within
   a few minutes.)
3. Open `https://www.cleanfix-mg.de` – same.
4. Test **email is still working**:
   - Send a test mail from your phone's email app (or Gmail) to
     `info@cleanfix-mg.de`. Jörg should confirm it arrived.
   - Reply to that mail from `info@cleanfix-mg.de` to yourself – confirm
     outgoing mail still works.
5. Test the contact form on the live domain:
   - Fill out the form on `https://cleanfix-mg.de/#kontakt` and submit.
   - Jörg should receive the email within a minute in
     `info@cleanfix-mg.de`.
6. Click around: `/impressum.html`, `/datenschutz.html`, and a few
   deep links (`/#preise`, `/#filialen`) – all should work.

### Phase E – Cleanup (a week or two later, once everything is stable)

Once we're confident the new site is solid:

1. **Task for Jörg:** in KAS, disable or remove the WordPress
   installation (and its database) that used to serve
   `cleanfix-mg.de`. Important: this is the *website* at All-Inkl,
   **not** the email – leave email alone.
2. Update `README.md` in this repo to show `cleanfix-mg.de` as the
   live URL instead of `cleanfix.thetrolli.com`.
3. Optionally: decide whether to keep `cleanfix.thetrolli.com` as a
   private staging URL or remove it from Cloudflare Pages.

---

## 4. What happens if something breaks?

Because the TTL is low (from Phase B), we can revert within ~5 minutes.

1. **Website is broken, but email still works** → tell Jörg to restore
   the old A/CNAME records he changed. Email was never touched, so
   it's unaffected during the broken window.
2. **Email is broken** → this should not happen because we never touch
   email records. If it does, Jörg verifies the MX, SPF, DKIM and
   DMARC records are exactly the same values as the backup he took
   before starting. (See task 0 in section 5.)
3. **Cloudflare shows "SSL error" for a few minutes after the switch**
   → normal. Cloudflare needs a few minutes to issue the new
   certificate. Refresh after 5–10 minutes.

---

## 5. The task list to send to Jörg (copy-paste-friendly)

> Hallo Jörg,
>
> wir möchten die neue Cleanfix-Website live schalten – die alte
> WordPress-Seite wird dadurch ersetzt, aber **E-Mail bleibt komplett
> bei All-Inkl** und funktioniert wie bisher. Es ändern sich nur **zwei
> DNS-Einträge** für die Website selbst.
>
> Bitte führe die folgenden Schritte im KAS-Panel
> (https://kas.all-inkl.com) aus, in dieser Reihenfolge:
>
> ---
>
> **0. Backup zur Sicherheit**
>
> - KAS → *Tools* → *KAS-Backup* → vollständige Sicherung der Domain
>   `cleanfix-mg.de` anlegen (WordPress-Dateien + Datenbank + DNS-Zone).
> - Außerdem einen Screenshot der aktuellen DNS-Einstellungen machen
>   (KAS → *Domain* → `cleanfix-mg.de` → *DNS-Einstellungen*). Wichtig
>   vor allem die **MX**, **SPF (TXT)**, **DKIM (TXT)** und **DMARC
>   (TXT)** Einträge.
>
> **1. TTL senken (bitte 1–2 Tage vor dem Umstieg machen)**
>
> - KAS → *Domain* → `cleanfix-mg.de` → *DNS-Einstellungen*.
> - Beim A-Record für `@` (oder leer) und beim A- oder CNAME-Record
>   für `www` den **TTL-Wert auf 300 Sekunden** setzen. Sonst nichts
>   ändern.
> - Speichern.
>
> **2. Die Website-Einträge umstellen (der eigentliche Umstieg)**
>
> Am Stichtag, wieder unter KAS → *DNS-Einstellungen* für
> `cleanfix-mg.de`:
>
> - Den bestehenden **A-Record für `@`** (Root) ersetzen durch die von
>   Cloudflare vorgegebenen IP-Adresse(n). Die genauen Werte bekommst
>   du von mir – ich sende sie direkt vor der Umstellung.
> - Den bestehenden Record für **`www`** ersetzen durch den
>   CNAME-Eintrag, den Cloudflare ausgibt (z. B.
>   `www → cleanfix.pages.dev`).
> - Speichern.
>
> **3. Bitte NICHT anfassen (sonst bricht die E-Mail!)**
>
> - Alle **MX-Records** (mail-routing, typ. `mail.cleanfix-mg.de` o. ä.)
> - Der **SPF-TXT-Record** (beginnt mit `v=spf1 …`)
> - Der **DKIM-TXT-Record** (heißt meistens `default._domainkey` oder
>   ähnlich)
> - Der **DMARC-TXT-Record** (`_dmarc.cleanfix-mg.de`)
> - Einträge wie `mail`, `webmail`, `smtp`, `imap`, `autodiscover`,
>   `_autodiscover._tcp` – die bleiben alle unverändert.
>
> **4. Nach dem Umstieg**
>
> - Kurz bestätigen, dass `https://cleanfix-mg.de` im Browser die neue
>   Seite zeigt (dauert ggf. 5–10 Minuten).
> - Kurz bestätigen, dass eingehende E-Mails an `info@cleanfix-mg.de`
>   weiterhin ankommen (z. B. eine Test-Mail von einer privaten Adresse
>   schicken).
>
> **5. Später (1–2 Wochen nach dem Umstieg, wenn alles stabil läuft)**
>
> - Die alte WordPress-Installation und deren Datenbank für
>   `cleanfix-mg.de` in KAS abschalten oder löschen.
> - E-Mail-Postfächer, MX, SPF etc. wieder **nicht anfassen** – die
>   laufen weiter unverändert.
>
> Danke! Bei Fragen einfach melden, ich bin während des Umstiegs
> erreichbar.

---

## 6. Optional: move nameservers to Cloudflare later ("Option B")

This is **not** part of the current plan, just mentioned so you know
it exists. Today All-Inkl is the phone book. Optionally, later, we
could make **Cloudflare** the phone book instead. Advantages:

- Cloudflare's full feature set on the real domain (Web Analytics,
  firewall rules, caching controls, bot protection).
- Faster DNS updates in the future (controllable from the Cloudflare
  dashboard, without Jörg every time).

Downsides:

- More disruptive: every DNS record – especially **MX, SPF, DKIM,
  DMARC** – has to be recreated **exactly** in Cloudflare before
  switching. One typo and email goes down until it's fixed.
- Bigger trust ask: the Cloudflare account (currently yours/personal)
  becomes responsible for Cleanfix's email routing.

Recommendation: **do Option A (this guide) first, revisit Option B
later**, only if there's a concrete feature we need that we can't get
via All-Inkl DNS.

---

## 7. Glossary

- **DNS** — Domain Name System. The global "phone book" that maps
  `cleanfix-mg.de` to a specific computer's IP address.
- **A record** — A DNS entry that points a name to an **IPv4 address**
  (e.g. `cleanfix-mg.de → 203.0.113.42`).
- **AAAA record** — Same as A but for **IPv6**.
- **CNAME record** — A DNS entry that points one name at **another
  name** (e.g. `www.cleanfix-mg.de → cleanfix.pages.dev`).
- **MX record** — A DNS entry that says "send mail for this domain to
  *this* server". Untouched in our plan.
- **SPF / DKIM / DMARC** — TXT records that prove our outgoing mail is
  legitimate. Also untouched.
- **TTL** — Time To Live. How long (in seconds) a DNS answer is cached.
  Lower = faster updates, higher = less load on DNS servers.
- **Nameserver** — The machine that answers DNS queries for a domain.
  Today: All-Inkl's nameservers. After this migration: **still
  All-Inkl's nameservers** – we only change records *within* them.
- **Apex / root domain** — `cleanfix-mg.de` without any prefix. Often
  written as `@` in DNS panels.
- **SSL / TLS certificate** — The thing that puts the lock icon in the
  browser. Cloudflare issues one for free and renews automatically.
- **Cloudflare Pages** — Cloudflare's free static-site hosting. Our
  new site lives here; pushing to GitHub re-deploys it automatically.
- **KAS** — All-Inkl's customer admin panel
  (https://kas.all-inkl.com).

---

## 8. Related docs

- `Cleanfix/MIGRATION-NOTES.md` – higher-level migration overview and
  history
- `CONTACT-FORM-SETUP.md` – SMTP / email-sending details (unchanged
  by this migration)
- `README.md` – general project overview; the "Live URL" column in the
  top table needs a one-line update after Phase E
