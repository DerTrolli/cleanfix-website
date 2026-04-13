# CleverReach Migration Guide — Official Cleanfix Account

Step-by-step instructions for switching the CleverReach integration
from the current test account to the official Cleanfix account.

This covers **two workflows**:
1. **Newsletter signup** (public website → double opt-in → subscriber list)
2. **Newsletter sending** (admin panel → CleverReach mailing)

---

## Overview: What needs to change

| Component | Where | What to update |
|-----------|-------|----------------|
| OAuth credentials | n8n workflows | `client_id` + `client_secret` in both workflows |
| Group ID | n8n `newsletter-sub` + `send-newsletter` | New subscriber list ID |
| DOI Form ID | n8n `newsletter-sub` | New double opt-in form ID |
| Sender email | n8n `send-newsletter` | `newsletter@cleanfix-mg.de` (or new domain) |

Everything else (website form, admin panel, n8n workflow structure)
stays the same.

---

## Step 1: Create a CleverReach OAuth App

1. Log into the **official Cleanfix** CleverReach account
2. Go to **Mein Konto** (My Account) → **Extras** → **REST API**
   - Or direct: Account Settings → API / OAuth
3. Click **OAuth-App erstellen** (Create OAuth App)
4. Fill in:
   - **Name:** `Cleanfix Website` (or any name you like)
   - **Redirect URI:** `https://localhost` (not used, but required)
5. After creating, note down:
   - **Client ID** — a long string like `aBcDeFgHiJkL123456`
   - **Client Secret** — another long string

> These two values are used by n8n to authenticate API calls.
> Keep them safe — anyone with these can access your CleverReach account via API.

---

## Step 2: Create a Subscriber List (Group)

You may already have a default list, or you can create a new one.

1. Go to **Empfaenger** (Recipients) in the left sidebar
2. Click **+ Neue Liste** (New List) or use an existing one
3. Name it something like `Newsletter` or `Website-Abonnenten`
4. Note the **Group ID** — visible in:
   - The URL when viewing the list: `.../groups/XXXXXX/...`
   - Or list settings / details

> Example: `512059` was the test account's Group ID.
> Your new one will be different.

---

## Step 3: Create a Double Opt-In (DOI) Form

This form defines the **confirmation email** that new subscribers
receive. It does NOT create a visible form on your website —
it only controls the email template.

### 3a. Create the form

1. Go to **Formulare** (Forms) in the left sidebar
2. Click **+ Formular erstellen** (Create Form)
3. Choose **Anmeldeformular** (Signup Form)
4. Select your subscriber list from Step 2

### 3b. Configure the Opt-In Email

In the form editor, go to the **Opt-In E-Mail** tab.
This is the confirmation email subscribers receive.

Configure it:

- **Absender** (Sender): `Cleanfix Reinigen und Waschen`
- **Absender-E-Mail** (Sender Email): `newsletter@cleanfix-mg.de`
  (or your official sending address)
- **Betreff** (Subject): `Bitte bestaetige deine Newsletter-Anmeldung`

**Email Body — use the HTML/Source editor:**

```html
<div style="font-family:Arial,Helvetica,sans-serif; max-width:560px; margin:0 auto; padding:30px 20px;">
  <div style="text-align:center; margin-bottom:24px;">
    <img src="YOUR_LOGO_URL" alt="Cleanfix" style="height:48px;" />
  </div>

  <h2 style="color:#0F1117; font-size:20px; margin:0 0 12px;">
    Newsletter-Anmeldung bestaetigen
  </h2>

  <p style="color:#4A4F5C; font-size:15px; line-height:1.6;">
    Hallo! Du hast dich fuer den Cleanfix-Newsletter angemeldet.
    Bitte klicke auf den Button, um deine Anmeldung zu bestaetigen:
  </p>

  <div style="text-align:center; margin:28px 0;">
    <a href="{ACTIVATION_LINK}"
       style="display:inline-block; padding:14px 32px; background:#0830DD;
              color:#fff; text-decoration:none; border-radius:8px;
              font-weight:600; font-size:15px;">
      Anmeldung bestaetigen
    </a>
  </div>

  <p style="color:#8A8F9C; font-size:13px; line-height:1.5;">
    Falls du dich nicht angemeldet hast, kannst du diese E-Mail ignorieren.
  </p>

  <hr style="border:none; border-top:1px solid #E5E7EB; margin:24px 0;" />

  <p style="color:#8A8F9C; font-size:12px; text-align:center;">
    Cleanfix Reinigen und Waschen<br />
    Muehlenstrasse 17, 41236 Moenchengladbach
  </p>
</div>
```

> **Important:** The `{ACTIVATION_LINK}` placeholder is a CleverReach
> variable. It gets replaced with the actual confirmation link when
> the email is sent. Do NOT change this placeholder.

> Replace `YOUR_LOGO_URL` with the actual logo URL (e.g. from your
> Cloudflare Pages site).

### 3c. Configure the Confirmation Page

In the **Bestaetigung** (Confirmation) tab, set the redirect URL
to your website:

```
https://cleanfix.thetrolli.com
```

(or your official domain)

### 3d. Save and note the Form ID

1. Save the form
2. Note the **Form ID** — visible in:
   - The URL: `.../forms/XXXXXX/...`
   - Or form settings

> Example: `426164` was the test account's Form ID.
> Your new one will be different.

---

## Step 4: Update n8n Workflows

You need to update **two workflows** in n8n.

### 4a. Newsletter Signup Workflow (`newsletter-sub`)

Open the `newsletter-sub` workflow in n8n and update these nodes:

**Node: "CleverReach: Get Token"**
- Change `client_id` → your new Client ID
- Change `client_secret` → your new Client Secret

**Node: "CleverReach: Add Subscriber"**
- Change the URL from:
  `https://rest.cleverreach.com/v3/groups/512059/receivers`
  to:
  `https://rest.cleverreach.com/v3/groups/NEW_GROUP_ID/receivers`

**Node: "CleverReach: Send DOI"**
- Change the URL from:
  `https://rest.cleverreach.com/v3/forms/426164/send/activate`
  to:
  `https://rest.cleverreach.com/v3/forms/NEW_FORM_ID/send/activate`

### 4b. Newsletter Sending Workflow (`send-newsletter`)

Open the `send-newsletter` workflow in n8n and update these nodes:

**Node: "CleverReach: Get Token"**
- Change `client_id` → your new Client ID
- Change `client_secret` → your new Client Secret

**Node: "CleverReach: Create Mailing"**
- In the jsonBody, change `"groups": [512059]` to `"groups": [NEW_GROUP_ID]`
- Update `sender_email` if your sending address changes

### 4c. Save and Activate

1. Save both workflows (Ctrl+S)
2. Make sure both are **activated** (toggle in top-right)

---

## Step 5: Update Git Repository (Optional)

If you want the git repo to reflect the new IDs:

### `n8n-workflows/newsletter-sub.json`
- Line with `client_id`: update placeholder or add new one
- Line with `/groups/512059/`: change to new Group ID
- Line with `/forms/426164/`: change to new Form ID

### `n8n-workflows/send-newsletter.json`
- Line with `client_id`: update placeholder or add new one
- Line with `"groups": [512059]`: change to new Group ID

> The git files use placeholder credentials (`YOUR_CLEVERREACH_CLIENT_ID`
> / `YOUR_CLEVERREACH_CLIENT_SECRET`). The real credentials only live
> in the live n8n instance. You can update the Group ID and Form ID
> in git since those aren't secrets.

---

## Step 6: Test Everything

### Test newsletter signup:
1. Go to `https://cleanfix.thetrolli.com`
2. Scroll to the newsletter signup section
3. Enter your email and click subscribe
4. Check your inbox for the DOI confirmation email
5. Click the confirmation link
6. Go to CleverReach → Empfaenger → your list
7. Verify the subscriber shows as **active**

### Test newsletter sending:
1. Go to the admin panel
2. Fill in a test newsletter
3. Click "HTML kopieren" (Copy HTML)
4. In CleverReach: **E-Mails** → **Neue E-Mail** → **Quellcode-Editor**
5. Paste the HTML
6. Send a test email to yourself
7. Verify it looks correct (header, badge, content, CTA button, footer)

---

## Quick Reference: Values to Collect

| Value | Where to find it | Current (test) | New (official) |
|-------|-------------------|----------------|----------------|
| Client ID | Mein Konto → Extras → REST API | (in live n8n) | ______________ |
| Client Secret | Same as above | (in live n8n) | ______________ |
| Group ID | Empfaenger → your list → URL | `512059` | ______________ |
| DOI Form ID | Formulare → your DOI form → URL | `426164` | ______________ |
| Sender Email | Your choice | `newsletter@cleanfix-mg.de` | ______________ |

---

## Troubleshooting

### "401 Unauthorized" from CleverReach API
- Client ID or Secret is wrong → double-check in n8n
- Token expired → the workflow fetches a fresh token on every request,
  so this shouldn't happen unless credentials are invalid

### Subscriber added but no confirmation email
- DOI Form ID is wrong → check the URL in "CleverReach: Send DOI" node
- Form is not linked to the correct list → in CleverReach, check that
  the DOI form's list matches your Group ID
- Email in spam folder

### Newsletter HTML looks broken in CleverReach
- Use the **Quellcode-Editor** (Source Code Editor), not the drag & drop editor
- The drag & drop editor will strip/modify your HTML
- Path: E-Mails → Neue E-Mail → Quellcode-Editor → paste HTML

### CORS errors on newsletter signup
- The webhook has `Access-Control-Allow-Origin: *` configured
- If you change the n8n webhook URL, update `API_BASE` in `main.js`
