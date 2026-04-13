# Contact form – setup guide

Everything you need to know to finish wiring up the contact form on
`cleanfix.thetrolli.com` so that submissions actually turn into emails
in the `info@cleanfix-mg.de` inbox.

This file is written for **you** (the site owner) as a checklist to hand
off to the IT admin and then finish yourself. It is not a code reference
— for architecture details see `Cleanfix/CLAUDE.md` and `README.md`.

---

## Current status (as of this commit)

| Piece | Where it lives | State |
|-------|---------------|-------|
| HTML form | `Cleanfix/public-site/index.html` (`#contact-form`) | ✅ Done — includes mandatory *Art der Anfrage* dropdown (Privat / Gewerblich), Name, E-Mail, Betreff, Nachricht |
| Client-side validation + POST | `Cleanfix/public-site/main.js` | ✅ Done — posts JSON to `https://cleanfix-api.thetrolli.com/webhook/contact-form` |
| n8n workflow template | `n8n-workflows/contact-form.json` | ⚠️ Exists in the repo but **not imported** into the running n8n instance |
| SMTP credentials in n8n | n8n → Credentials | ⚠️ Credentials received — must be entered in n8n UI |
| Sender mailbox on the domain | `noreply@cleanfix-mg.de` | ✅ Created by IT admin (All-Inkl / KAS) |
| Anti-spam (Turnstile + honeypot) | — | ⏳ Planned, not yet added |

**Bottom line:** the front end is done. The `noreply@cleanfix-mg.de`
mailbox now exists (hosted at All-Inkl / KAS). The remaining step is
to enter the SMTP credentials in n8n and import + activate the workflow.

---

## Form fields sent to the webhook

When a visitor submits the form, the browser POSTs this JSON to
`https://cleanfix-api.thetrolli.com/webhook/contact-form`:

```json
{
  "name":      "Max Mustermann",
  "email":     "max@example.de",
  "kundentyp": "privat",            // or "gewerblich"
  "subject":   "Abholung am Donnerstag?",
  "message":   "Hallo, …"
}
```

`name`, `email`, `kundentyp`, and `message` are **required** (validated
client-side). `subject` is optional.

The n8n workflow turns this into an email like:

```
Subject: [Privat] Kontaktanfrage von Max Mustermann – cleanfix-mg.de
From:    noreply@cleanfix-mg.de
To:      info@cleanfix-mg.de
Reply-To: max@example.de

Neue Kontaktanfrage über die Website

Art:     Privatperson
Name:    Max Mustermann
E-Mail:  max@example.de
Betreff: Abholung am Donnerstag?
Datum:   09.04.2026, 14:23:10

Nachricht:
Hallo, …
```

Because `Reply-To` is set to the visitor's address, hitting "Reply" in
Outlook writes directly to the customer — you never have to copy-paste
their address.

---

## What to ask the IT admin for

Hand him this list. These are the five values that go into an SMTP
credential in n8n.

> **✅ Received (Apr 2026).** The IT admin provided the credentials:
>
> | Setting | Value |
> |---------|-------|
> | Mailbox | `noreply@cleanfix-mg.de` |
> | SMTP Host | `w0179bc8.kasserver.com` (All-Inkl / KAS) |
> | SMTP Port | `587` (STARTTLS) or `465` (SSL/TLS) |
> | Username | `m07e4c7c` |
> | Password | *(stored privately, not committed to repo)* |
>
> **SPF / DKIM / DMARC** DNS records should already exist for the
> domain (All-Inkl typically sets these up). If automated mails land
> in spam, ask the IT admin to verify these records.

> ℹ️ You do **not** need login access to `info@cleanfix-mg.de` itself.
> The workflow only *sends from* `noreply@` and uses the visitor's own
> address as `Reply-To`.

### Heads-up for the admin (optional but nice)

Mention that we're planning to put **Cloudflare Turnstile** (invisible
CAPTCHA) in front of the form later to block spam bots, plus a hidden
honeypot field. He doesn't need to do anything for this — just a
heads-up so he isn't confused when the Turnstile widget shows up on
the page later.

---

## Once you have the five SMTP values

Log into n8n at `cleanfix-api.thetrolli.com` and walk through these
steps. Nothing here needs code changes in the repo.

### 1. Create the SMTP credential in n8n

1. **Credentials → New → SMTP** (or "Send Email" — they use the same
   credential type).
2. Fill in:
   - **Host**: `w0179bc8.kasserver.com`
   - **Port**: `587`
   - **User**: `m07e4c7c`
   - **Password**: *(the password from the IT admin — not in this file)*
   - **SSL/TLS**: off (port 587 uses STARTTLS, which n8n enables
     automatically)
3. **Save**. Name it `Cleanfix SMTP`. n8n will generate an internal
   credential ID.

### 2. Import the workflow template

1. In n8n: **Workflows → Import from File**
2. Select `n8n-workflows/contact-form.json` from this repo
3. Open the imported workflow

### 3. Attach the credential

1. Open the **Send Email** node in the workflow
2. Under "Credential to connect with", pick the `Cleanfix SMTP`
   credential you just created (this replaces the placeholder
   `SMTP_CRED_ID` from the JSON template)
3. Double-check the **From Email** field — it should say
   `noreply@cleanfix-mg.de`. If the admin gave you a different address,
   update it here.

### 4. Activate and test

1. Toggle the workflow **Active** (top right in n8n).
2. Go to `https://cleanfix.thetrolli.com#kontakt` and fill out the form
   with your own email as the visitor.
3. Confirm the mail arrives in `info@cleanfix-mg.de` within a few
   seconds and that:
   - The subject is prefixed with `[Privat]` or `[Gewerblich]`
   - Hitting "Reply" in Outlook writes back to *your* test address,
     not to `noreply@…`
4. If nothing arrives, check n8n's **Executions** tab for the
   contact-form workflow — the failure will be logged there (typically
   wrong port, wrong auth, or missing STARTTLS).

### 5. Save the workflow back to git

If you edit the workflow in n8n (e.g. to tweak the subject line or
add a filter), export the new version and commit it so we don't lose
the changes when the n8n instance is rebuilt:

1. n8n UI → open the workflow → **⋮ menu → Download → JSON**
2. Overwrite `n8n-workflows/contact-form.json` in the repo with the
   new file
3. Commit and push

---

## Alternative: transactional email provider

If the IT admin can't or won't give out SMTP for the domain (some
corporate hosters lock this down), use a transactional email provider
as the sender instead. Cheapest options:

| Provider | Free tier | Notes |
|----------|-----------|-------|
| **Brevo** (ex-Sendinblue) | 300 mails/day | Easiest, German UI, GDPR-compliant |
| **Mailjet** | 200 mails/day | Similar to Brevo |
| **Postmark** | 100 mails/month | Best deliverability, paid after that |

For any of these:

1. Sign up and verify the `cleanfix-mg.de` domain — this requires
   **adding a DNS TXT record** (SPF + DKIM), which the IT admin has to
   do **once**. He doesn't need to create a mailbox for this path.
2. The provider hands you SMTP host / port / user / password.
3. Plug those into n8n exactly like step 1 above.
4. Set the **From Email** to `noreply@cleanfix-mg.de` (the provider
   will reject it if you haven't verified the domain — that's what the
   DNS records are for).

This path lets you skip the "create a real mailbox" step and only
needs a DNS change from the admin.

---

## Future hardening (not blocking)

These are planned but not required to go live. See
`README.md` "Future Work" for the full list.

- **Cloudflare Turnstile** in front of the form — invisible CAPTCHA,
  free, blocks most bots with zero UX cost. Add the widget to
  `index.html`, add a Turnstile-verify node at the start of the n8n
  workflow, and disclose it in `datenschutz.html`.
- **Honeypot field** — hidden text input that real users never fill
  in. Any submission with it filled is silently dropped. Cheap
  belt-and-suspenders on top of Turnstile.
- **Rate limit** on the webhook hostname — Cloudflare free tier lets
  you cap `/webhook/contact-form` to e.g. 10 requests/minute per IP.
- **Logging** — the n8n workflow currently doesn't log submissions
  anywhere except as an n8n execution record. If you want a durable
  log (e.g. a Google Sheet of every inquiry), add a "Google Sheets →
  Append" node between the Webhook and Send Email nodes.

---

## TL;DR

1. ~~Ask the IT admin for a mailbox `noreply@cleanfix-mg.de`~~ — ✅ Done.
2. ~~Ask him to confirm **SPF / DKIM / DMARC** DNS records~~ — check
   with admin if mails land in spam.
3. In n8n: **Credentials → New → SMTP** → Host:
   `w0179bc8.kasserver.com`, Port: `587`, User: `m07e4c7c`,
   Password: *(from IT admin)*, SSL/TLS: off. Save as `Cleanfix SMTP`.
4. In n8n: **Workflows → Import from File** →
   `n8n-workflows/contact-form.json`.
5. Open the **Send Email** node, attach the `Cleanfix SMTP` credential,
   activate the workflow.
6. Submit the form on the live site and check that the mail arrives
   at `info@cleanfix-mg.de`.

Done. From this point on, every contact form submission turns into an
email in your inbox, tagged with `[Privat]` or `[Gewerblich]` in the
subject so you can triage at a glance.
