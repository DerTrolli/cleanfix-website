# Newsletter signup – CleverReach integration guide

How to wire up the newsletter signup form on `cleanfix.thetrolli.com`
so that subscribers are added to CleverReach with UWG-compliant
double opt-in — **without using CleverReach's iframe embed**.

---

## Current status (as of this commit)

| Piece | Where it lives | State |
|-------|---------------|-------|
| HTML form | `Cleanfix/public-site/index.html` (`#newsletter-form`) | ✅ Done — email input + submit button |
| Client-side validation + POST | `Cleanfix/public-site/main.js` | ✅ Done — posts JSON to `API_BASE + '/newsletter-sub'` |
| n8n workflow | `n8n-workflows/newsletter-sub.json` | ✅ Done — validates email, adds subscriber, sends DOI email |
| CleverReach DOI form | CleverReach → Formulare (ID: 426164) | ✅ Created — sends branded confirmation email |
| CleverReach API credentials in n8n | n8n → same as send-newsletter | ⚠️ Need to copy client_id/secret into the workflow |

**Bottom line:** the workflow is ready to import into n8n. Just copy
the CleverReach client_id/secret from the send-newsletter workflow
into the newsletter-sub workflow's "Get Token" node, then activate.

---

## Architecture

```
Visitor fills in email on website
    ↓
POST https://cleanfix-api.thetrolli.com/webhook/newsletter-sub
    ↓ (Cloudflare Tunnel → n8n)
n8n workflow:
    1. Validate email
    2. POST /v3/groups/{group_id}/receivers  → add subscriber (activated: 0)
    3. POST /v3/forms/{form_id}/send/activate → trigger DOI email
    4. Return { success: true }
    ↓
CleverReach sends double opt-in confirmation email to visitor
    ↓
Visitor clicks confirmation link → subscriber becomes active in CleverReach
```

No iframe, no CleverReach form embed. Your own form, your own
styling, CleverReach only handles the mailing list + DOI email.

---

## Step 1: Create a CleverReach OAuth app

1. Log into your CleverReach account
2. Go to **account settings** (or My Account → Extras → REST API)
3. Create a new **OAuth app**
4. Note down these two values:
   - **Client ID**
   - **Client Secret**

These are used to get an access token for API calls.

---

## Step 2: Get your Group ID and Form ID

### Group ID (mailing list)
1. In CleverReach, go to **Empfänger** (Recipients) → your subscriber list
2. The group ID is visible in the URL or list settings
3. Note it down — e.g. `123456`

### Form ID (double opt-in form)
1. In CleverReach, go to **Formulare** (Forms)
2. Create a new DOI form (or use an existing one)
3. This form defines the **confirmation email template** that
   subscribers receive (subject line, design, confirmation link)
4. Customize the confirmation email to match your branding
5. Note the form ID — e.g. `789012`

---

## Step 3: Configure n8n

### 3a. Get an access token

The CleverReach REST API uses OAuth 2.0. For your own account, use
the **client credentials** flow:

```
POST https://rest.cleverreach.com/oauth/token.php
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/json

{ "grant_type": "client_credentials" }
```

Response:
```json
{
  "access_token": "eyJ...",
  "expires_in": 2592000,
  "token_type": "Bearer",
  "refresh_token": "..."
}
```

The token lasts ~30 days. Use the `refresh_token` to renew it.

### 3b. Update the n8n workflow

The n8n workflow (`n8n-workflows/newsletter-sub.json`) needs three
nodes after the Webhook:

1. **Validate Email** (Code node) — already exists in the stub
2. **Add Subscriber** (HTTP Request node):
   ```
   POST https://rest.cleverreach.com/v3/groups/{group_id}/receivers
   Authorization: Bearer {access_token}

   {
     "email": "visitor@example.de",
     "registered": 1681380000,
     "activated": 0,
     "source": "cleanfix-mg.de Website"
   }
   ```
   - `activated: 0` means the subscriber is **inactive** until they
     confirm via email
   - `registered` should be the current Unix timestamp

3. **Send DOI Email** (HTTP Request node):
   ```
   POST https://rest.cleverreach.com/v3/forms/{form_id}/send/activate
   Authorization: Bearer {access_token}

   {
     "email": "visitor@example.de",
     "doidata": {
       "user_ip": "...",
       "referer": "cleanfix-mg.de",
       "user_agent": "..."
     }
   }
   ```
   - `doidata` fields are for GDPR audit trail (proof of consent)
   - The IP/user-agent can be forwarded from the webhook request
     headers

4. **Success Response** (Code node):
   ```js
   return [{ json: { success: true, message: 'Bestätigungsmail gesendet' } }];
   ```

### 3c. Token refresh

The access token expires after ~30 days. Options:
- **Manual:** Regenerate the token in n8n when it expires
- **Automatic:** Add a separate n8n workflow that refreshes the token
  on a schedule (e.g. weekly) using the refresh token endpoint:
  ```
  POST https://rest.cleverreach.com/oauth/token.php
  Authorization: Basic base64(client_id:client_secret)

  {
    "grant_type": "refresh_token",
    "refresh_token": "..."
  }
  ```
- **n8n built-in:** Check if n8n has a CleverReach node with built-in
  OAuth — this would handle token refresh automatically

---

## Step 4: Test

1. Activate the workflow in n8n
2. Go to `https://cleanfix.thetrolli.com` → newsletter section
3. Enter your own email and submit
4. Check that you receive a DOI confirmation email from CleverReach
5. Click the confirmation link
6. Verify in CleverReach that the subscriber is now active in your list

---

## Values you need to collect

| Value | Where to find it | Status |
|-------|------------------|--------|
| **Client ID** | CleverReach → Account → REST API / OAuth app | ✅ Same as send-newsletter (already in live n8n) |
| **Client Secret** | Same as above | ✅ Same as send-newsletter (already in live n8n) |
| **Group ID** | CleverReach → Empfänger → "Neu" list | ✅ `512059` |
| **DOI Form ID** | CleverReach → Formulare → "Cleanfix Newsletter Anmeldung" | ✅ `426164` |
| **Access Token** | Generated via OAuth token endpoint | ✅ Fetched at runtime by workflow |

The n8n workflow (`newsletter-sub.json`) is ready. Import it into n8n,
replace the `YOUR_CLEVERREACH_CLIENT_ID` / `YOUR_CLEVERREACH_CLIENT_SECRET`
placeholders with the same values used in the `send-newsletter` workflow,
and activate it.

---

## Frontend reference

The newsletter form in `main.js` POSTs:
```json
{ "email": "visitor@example.de" }
```
to `https://cleanfix-api.thetrolli.com/webhook/newsletter-sub`.

If you later want to add a name field or newsletter preferences, add
them to both the HTML form and the JSON payload — the n8n workflow
can forward any extra fields to CleverReach as `global_attributes`.
