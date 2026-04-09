# Phase 1: Deployment Concept & AI Agent Instructions

## Ziel

Die Cleanfix-Website vollständig lauffähig deployen — mit funktionierendem Backend, Admin Panel und Newsletter — auf einer temporären Domain. Am Ende muss nur noch die DNS-Umstellung auf die echte Cleanfix-Domain erfolgen.

### URLs (Test-Phase)
| Dienst | URL | Hosting |
|--------|-----|---------|
| Public Website | `cleanfix.thetrolli.com` | Cloudflare Pages |
| Admin Panel | `cleanfix-admin.thetrolli.com` | Cloudflare Pages (separates Projekt) |
| Backend API | `cleanfix-api.thetrolli.com` | Cloudflare Tunnel → lokales n8n |

### URLs (Final — nach DNS-Umstellung)
| Dienst | URL |
|--------|-----|
| Public Website | `www.cleanfix-mg.de` (oder ähnlich) |
| Admin Panel | `admin.cleanfix-mg.de` |
| Backend API | `api.cleanfix-mg.de` |

---

## Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE                             │
│                                                             │
│  ┌──────────────────────┐    ┌──────────────────────────┐   │
│  │  Cloudflare Pages    │    │  Cloudflare Pages        │   │
│  │  (Public Site)       │    │  (Admin Panel)           │   │
│  │                      │    │                          │   │
│  │  index.html          │    │  admin.html              │   │
│  │  style.css           │    │  style.css (shared)      │   │
│  │  main.js             │    │                          │   │
│  │  /data/schedule.json │    │                          │   │
│  │  /data/preise-*.json │    │                          │   │
│  └──────────┬───────────┘    └──────────┬───────────────┘   │
│             │ fetch()                   │ POST              │
│             │ (liest JSON)              │ (sendet Daten)    │
│             │                           │                   │
│  ┌──────────┴───────────────────────────┴───────────────┐   │
│  │              Cloudflare Tunnel                       │   │
│  │         cleanfix-api.thetrolli.com                   │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                   │
└─────────────────────────┼───────────────────────────────────┘
                          │ (nur Admin-Traffic,
                          │  wenige KB pro Monat)
                          │
              ┌───────────┴───────────────┐
              │     Lokales Netzwerk       │
              │                            │
              │  ┌──────────────────────┐  │
              │  │        n8n           │  │
              │  │                      │  │
              │  │  Workflows:          │  │
              │  │  • /save-schedule    │  │
              │  │  • /save-preise      │  │
              │  │  • /newsletter-sub   │  │
              │  │  • /contact-form     │  │
              │  └──────────┬───────────┘  │
              │             │              │
              └─────────────┼──────────────┘
                            │
              ┌─────────────┴──────────────┐
              │  GitHub API                 │
              │  Commit JSON → Repo         │
              │  → Cloudflare Pages rebuild │
              │    (auto, ~30 Sek.)         │
              └────────────────────────────┘
```

---

## Datenfluss im Detail

### Admin speichert Monatsangebot/Banner/Deal:
```
1. Admin klickt "Speichern" in admin.html
2. admin.html POST → cleanfix-api.thetrolli.com/save-schedule
   Body: { schedule: [ ...alle Einträge... ] }
3. n8n empfängt Request
4. n8n committet /data/schedule.json ins GitHub Repo
5. Cloudflare Pages erkennt neuen Commit → auto-rebuild (~30 Sek.)
6. Besucher sehen ab jetzt die neuen Daten
```

### Admin speichert Preise:
```
1. Admin klickt "Preise speichern"
2. admin.html POST → cleanfix-api.thetrolli.com/save-preise
   Body: { reinigung: {...}, buegeln: {...}, waesche: {...} }
3. n8n committet /data/preise-reinigung.json, preise-buegeln.json, preise-waesche.json
4. Cloudflare Pages rebuild → live
```

### Newsletter-Anmeldung (Besucher):
```
1. Besucher füllt Newsletter-Formular aus
2. main.js POST → cleanfix-api.thetrolli.com/newsletter-sub
   Body: { email: "...", name: "..." }
3. n8n ruft CleverReach API auf → fügt Subscriber hinzu
4. n8n sendet Double-Opt-In E-Mail (über CleverReach)
5. Besucher bekommt Bestätigungs-E-Mail
```

### Kontaktformular:
```
1. Besucher füllt Kontaktformular aus
2. main.js POST → cleanfix-api.thetrolli.com/contact-form
   Body: { name, email, betreff, nachricht }
3. n8n sendet E-Mail an info@cleanfix-mg.de (via SMTP oder CleverReach transactional)
4. Optional: Bestätigungsmail an Absender
```

---

## Infrastruktur-Setup (Schritt für Schritt)

### 1. Cloudflare Account & Domain
- Cloudflare Account erstellen (falls nicht vorhanden)
- `thetrolli.com` muss bereits auf Cloudflare sein (DNS verwaltet)
- Subdomains anlegen:
  - `cleanfix.thetrolli.com` → CNAME → Cloudflare Pages
  - `cleanfix-admin.thetrolli.com` → CNAME → Cloudflare Pages
  - `cleanfix-api.thetrolli.com` → Cloudflare Tunnel

### 2. GitHub Repo Struktur
```
Claude-Website/
└── Cleanfix/
    ├── public-site/          ← Cloudflare Pages Projekt 1
    │   ├── index.html
    │   ├── style.css
    │   ├── main.js
    │   ├── impressum.html
    │   ├── datenschutz.html
    │   ├── favicon.png
    │   ├── Logo Cleanfix JH.png
    │   └── data/
    │       ├── schedule.json
    │       ├── preise-reinigung.json
    │       ├── preise-buegeln.json
    │       └── preise-waesche.json
    │
    ├── admin-site/           ← Cloudflare Pages Projekt 2
    │   ├── admin.html → index.html (umbenannt)
    │   └── style.css         (Kopie oder Symlink)
    │
    ├── CLAUDE.md
    ├── MIGRATION-NOTES.md
    └── CONCEPT.md (diese Datei)
```

### 3. Cloudflare Pages — Public Site
- Neues Pages-Projekt erstellen
- GitHub Repo verbinden
- Build-Einstellungen:
  - Build command: (leer — statische Dateien)
  - Build output directory: `Cleanfix/public-site`
- Custom Domain: `cleanfix.thetrolli.com`

### 4. Cloudflare Pages — Admin Panel
- Zweites Pages-Projekt erstellen
- Selbes Repo, anderer Output-Pfad:
  - Build output directory: `Cleanfix/admin-site`
- Custom Domain: `cleanfix-admin.thetrolli.com`
- Optional: Cloudflare Access davor (zusätzlicher Login-Schutz)

### 5. Cloudflare Tunnel + n8n
- `cloudflared` auf lokalem Server installieren
- Tunnel erstellen: `cloudflared tunnel create cleanfix-api`
- Konfiguration:
  ```yaml
  tunnel: <TUNNEL-ID>
  credentials-file: /root/.cloudflared/<TUNNEL-ID>.json

  ingress:
    - hostname: cleanfix-api.thetrolli.com
      service: http://localhost:5678  # n8n Default-Port
    - service: http_status:404
  ```
- DNS: `cleanfix-api.thetrolli.com` → CNAME → `<TUNNEL-ID>.cfargotunnel.com`

### 6. n8n Workflows

#### Workflow 1: `/save-schedule` (Webhook → GitHub Commit)
```
Trigger: Webhook POST /save-schedule
  → Schritt 1: JSON Body lesen (schedule array)
  → Schritt 2: GitHub API — Update file /Cleanfix/public-site/data/schedule.json
     PUT https://api.github.com/repos/DerTrolli/Claude-Website/contents/Cleanfix/public-site/data/schedule.json
     Body: { content: base64(JSON), message: "Update schedule", sha: <current-sha> }
  → Schritt 3: Response 200 OK zurück an Admin Panel
```

#### Workflow 2: `/save-preise` (Webhook → GitHub Commit)
```
Trigger: Webhook POST /save-preise
  → Für jede der 3 Dateien: GitHub API Update
  → Response 200 OK
```

#### Workflow 3: `/newsletter-sub` (Webhook → CleverReach API)
```
Trigger: Webhook POST /newsletter-sub
  → Schritt 1: CleverReach API — Subscriber anlegen
     POST https://rest.cleverreach.com/v3/groups/{group_id}/receivers
  → Schritt 2: Double-Opt-In triggern
  → Response 200 OK (+ Erfolgsmeldung für Frontend)
```

#### Workflow 4: `/contact-form` (Webhook → E-Mail)
```
Trigger: Webhook POST /contact-form
  → Schritt 1: Validierung (Name, E-Mail, Nachricht vorhanden)
  → Schritt 2: E-Mail senden an info@cleanfix-mg.de
     (via SMTP Node oder CleverReach Transactional API)
  → Response 200 OK
```

### 7. CleverReach Integration
- CleverReach API-Key generieren (unter Account → API)
- API-Token in n8n als Credential speichern
- Bestehende Empfängerliste (Group ID) ermitteln
- Double-Opt-In Formular/Template in CleverReach konfigurieren

---

## DNS-Umstellung (Phase 2 — wenn Zugang kommt)

Wenn die Test-Phase abgeschlossen ist und alles funktioniert:

1. **Aktuelle DNS-Records bei All-Inkl dokumentieren** (Screenshot machen!)
   - Besonders MX-Records für E-Mail notieren
2. **Option A — Einfach (empfohlen):**
   - Bei All-Inkl nur den A-Record / CNAME für `www` und `@` ändern → auf Cloudflare Pages zeigen
   - MX-Records bleiben bei All-Inkl → E-Mail funktioniert weiter
   - Neue Subdomains `admin.cleanfix-mg.de` und `api.cleanfix-mg.de` anlegen
3. **Option B — Volle Kontrolle:**
   - Nameserver bei All-Inkl auf Cloudflare umstellen
   - Alle DNS-Records in Cloudflare neu anlegen (inkl. MX!)
   - Mehr Kontrolle, aber höheres Risiko bei Fehlern
4. **Cloudflare Pages Custom Domains aktualisieren:**
   - Public Site: `cleanfix.thetrolli.com` → `www.cleanfix-mg.de`
   - Admin Panel: `cleanfix-admin.thetrolli.com` → `admin.cleanfix-mg.de`
   - Tunnel: `cleanfix-api.thetrolli.com` → `api.cleanfix-mg.de`
5. **API-URL in admin.html und main.js anpassen** (eine Zeile pro Datei)

---

## Sicherheitskonzept (3-Schichten-Modell)

Die API-Endpunkte sind durch drei unabhängige Sicherheitsschichten geschützt. Ein Angreifer müsste alle drei gleichzeitig überwinden.

### Schicht 1: Cloudflare Access (Türsteher am Eingang)
- Cloudflare Access (Zero Trust) steht **vor** dem Tunnel-Endpunkt
- Verwendet **Service Tokens** — zwei lange zufällige Schlüssel (Client-ID + Client-Secret)
- Nur Requests mit gültigem Token im Header werden durchgelassen
- Alles andere wird **sofort an der Cloudflare-Edge geblockt** — erreicht nie das Heimnetzwerk
- Kostenlos für bis zu 50 User
- Setup: Zero Trust Dashboard → Access → Applications → Service Token erstellen

```
Ohne Token:  Hacker → Cloudflare Edge → ABGELEHNT ✗ (kommt nicht weiter)
Mit Token:   Admin Panel → Cloudflare Edge → Token gültig → Tunnel → n8n ✓
```

**Konfiguration im Admin Panel (`admin.html`):**
```js
async function apiSave(endpoint, data) {
  const res = await fetch(CLEANFIX_API + endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CF-Access-Client-Id': '<client-id>',         // Service Token ID
      'CF-Access-Client-Secret': '<client-secret>'   // Service Token Secret
    },
    body: JSON.stringify(data)
  });
  // ...
}
```

**Für die Public-Site Endpunkte (Newsletter, Kontakt):**
- Diese brauchen keinen Service Token (Besucher haben keinen)
- Stattdessen: Rate Limiting + Bot Protection über Cloudflare WAF Rules
- Alternativ: Cloudflare Turnstile (kostenloser CAPTCHA-Ersatz) vor den Formularen

### Schicht 2: n8n Webhook-Authentifizierung (zweite Tür)
- Jeder n8n Webhook-Node hat **eigene Authentifizierung** (Header Auth)
- Selbst wenn jemand irgendwie an Cloudflare Access vorbeikommt, braucht er ein weiteres Passwort
- Konfiguration: Im n8n Webhook-Node → Authentication → Header Auth → eigenes Secret setzen

### Schicht 3: Netzwerk-Isolation (unsichtbare Festung)
- n8n läuft auf `127.0.0.1` (localhost only) — `N8N_HOST=127.0.0.1`
- **Kein Port ist nach außen offen** — der Cloudflare Tunnel baut eine ausgehende Verbindung auf
- Nicht mal andere Geräte im selben WLAN können n8n direkt erreichen
- Von außen ist das Heimnetzwerk komplett unsichtbar

### Admin Panel — Zusätzlicher Schutz
- SHA-256 Passwort-Hash im Admin Panel (bereits implementiert)
- Admin Panel auf separater Subdomain → nicht öffentlich verlinkt, nicht von Google indexiert
- Optional: Cloudflare Access auch vor dem Admin Panel selbst (zusätzliche Login-Schicht)

### API-Endpunkte — Zusammenfassung

| Endpunkt | Wer ruft auf? | Cloudflare Access | n8n Auth | Rate Limit |
|----------|--------------|-------------------|----------|------------|
| `/save-schedule` | Admin Panel | Service Token (Pflicht) | Header Auth | 10/min |
| `/save-preise` | Admin Panel | Service Token (Pflicht) | Header Auth | 10/min |
| `/newsletter-sub` | Besucher | Kein Token (public) | Header Auth | 5/min |
| `/contact-form` | Besucher | Kein Token (public) | Header Auth | 3/min |

### Daten-Sicherheit
- Alle Daten in JSON-Dateien im Git-Repo → **versioniert, jede Änderung nachvollziehbar**
- Git-History = automatisches Backup — jeder Stand wiederherstellbar
- Kein Datenbankserver nötig → kein SQL-Injection-Risiko
- localStorage im Admin-Browser als lokaler Cache (Fallback bei API-Ausfall)

---

## Datenschutz / DSGVO

| Thema | Status | Details |
|-------|--------|---------|
| Cookies | Keine | Kein Cookie-Banner nötig |
| Tracking | Keines | Kein Google Analytics, keine externen Tracker |
| Cloudflare Pages | DSGVO-konform | Cloudflare bietet EU Data Processing Agreement (DPA) |
| Cloudflare Web Analytics | DSGVO-konform | Cookie-los, keine personenbezogenen Daten |
| Kontaktformular | Konform | Daten gehen nur an die Geschäfts-E-Mail, keine Speicherung |
| Newsletter (CleverReach) | Konform | Deutscher Anbieter, Double-Opt-In Standard, AV-Vertrag verfügbar |
| Impressum | Vorhanden | `impressum.html` (§5 DDG) |
| Datenschutzerklärung | Vorhanden | `datenschutz.html` — muss ggf. um Cloudflare-Hinweis ergänzt werden |

**Noch zu tun für DSGVO:**
- [ ] Datenschutzerklärung um Cloudflare Pages/Analytics Abschnitt ergänzen
- [ ] Cloudflare DPA abschließen (im Cloudflare Dashboard unter Account → Legal)
- [ ] CleverReach AV-Vertrag prüfen/abschließen

---

## Analytics ohne Cookies: Cloudflare Web Analytics

### Was es bietet (kostenlos, DSGVO-konform)
- Seitenaufrufe pro Tag / Woche / Monat
- Meistbesuchte Seiten
- Referrer (woher kommen Besucher)
- Länder der Besucher
- Core Web Vitals (Ladezeit, Performance)
- Gerätetype (Desktop / Mobile)

### Setup
Ein JavaScript-Snippet in `index.html` einfügen (vor `</body>`):
```html
<!-- Cloudflare Web Analytics -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js'
        data-cf-beacon='{"token": "<SITE-TOKEN>"}'></script>
```

- Token wird im Cloudflare Dashboard generiert (Web Analytics → Add Site)
- Selbes Snippet auch in `impressum.html` und `datenschutz.html` einfügen
- **Keine Cookies, kein localStorage, keine IP-Speicherung**
- Dashboard unter: dash.cloudflare.com → Web Analytics

---

---

# AI Agent Instructions: Code-Anpassungen

Die folgenden Anweisungen beschreiben exakt welche Änderungen am Code vorgenommen werden müssen, damit die Website mit dem oben beschriebenen Backend funktioniert.

## Voraussetzungen

Bevor der Agent startet, muss feststehen:
- Die Backend-API-URL (z.B. `https://cleanfix-api.thetrolli.com`)
- Ob localStorage als lokaler Fallback/Cache erhalten bleiben soll (empfohlen: ja)

## Aufgabe 1: Repo-Struktur umbauen

### Beschreibung
Die Dateien müssen in zwei separate Ordner aufgeteilt werden: `public-site/` (für Besucher) und `admin-site/` (für Admin Panel). Dazu kommt ein `/data/`-Ordner mit Initial-JSON-Dateien.

### Schritte
1. Erstelle `Cleanfix/public-site/` und verschiebe dorthin:
   - `index.html`, `style.css`, `main.js`
   - `impressum.html`, `datenschutz.html`
   - `favicon.png`, `Logo Cleanfix JH.png`
   - `Monatsangebot.txt` (Legacy-Fallback)
2. Erstelle `Cleanfix/public-site/data/` mit leeren Initial-Dateien:
   - `schedule.json` → `[]`
   - `preise-reinigung.json` → `{"groups":[]}`
   - `preise-buegeln.json` → `{"groups":[]}`
   - `preise-waesche.json` → `{"groups":[]}`
3. Erstelle `Cleanfix/admin-site/` und verschiebe/kopiere:
   - `admin.html` → `admin-site/index.html` (umbenennen!)
   - `style.css` → Kopie nach `admin-site/style.css`
4. `CLAUDE.md`, `MIGRATION-NOTES.md`, `CONCEPT.md`, `Preise.xlsx` bleiben in `Cleanfix/`

### Validierung
- `public-site/index.html` existiert und referenziert `style.css`, `main.js`
- `admin-site/index.html` existiert und referenziert `style.css`
- `data/`-Ordner enthält 4 JSON-Dateien

---

## Aufgabe 2: `main.js` — Von localStorage auf JSON-Fetch umstellen

### Beschreibung
`main.js` liest aktuell alle dynamischen Daten aus localStorage. Es muss stattdessen JSON-Dateien per `fetch()` laden. localStorage bleibt als Fallback falls der Fetch fehlschlägt (z.B. offline/lokal).

### Konfiguration (oben in main.js hinzufügen)
```js
// ── Backend Config ──────────────────────────────
const CLEANFIX_API = 'https://cleanfix-api.thetrolli.com';
const DATA_BASE    = '/data';
```

### Änderung 1: Schedule-System (aktuell Zeile 59–212 in main.js)

**Aktuell:**
```js
const raw = localStorage.getItem('cleanfix-schedule');
const schedule = raw ? JSON.parse(raw) : [];
```

**Neu:**
```js
async function loadSchedule() {
  try {
    const res = await fetch(DATA_BASE + '/schedule.json');
    if (res.ok) return await res.json();
  } catch (e) { /* offline fallback */ }
  // Fallback: localStorage
  const raw = localStorage.getItem('cleanfix-schedule');
  return raw ? JSON.parse(raw) : [];
}
```

- Die gesamte Schedule-IIFE muss `async` werden
- `loadSchedule()` aufrufen statt direkt `localStorage.getItem`
- Die Funktionen `applyMA()`, `applyBanner()`, `applyDeals()` bleiben unverändert
- Legacy-Fallback-Kette bleibt erhalten (Schedule → legacy keys → Monatsangebot.txt)
- **Wichtig**: Die hardcoded MA-Defaults müssen weiterhin sofort (synchron) gesetzt werden, bevor der async Fetch startet, damit die Karte nie leer ist

### Änderung 2: Preise (aktuell Zeile 215–246 in main.js)

**Aktuell:**
```js
const reinigung = localStorage.getItem('cleanfix-preise-reinigung');
```

**Neu:**
```js
async function loadPreise(tab) {
  try {
    const res = await fetch(DATA_BASE + '/preise-' + tab + '.json');
    if (res.ok) return await res.json();
  } catch (e) { /* offline fallback */ }
  const raw = localStorage.getItem('cleanfix-preise-' + tab);
  return raw ? JSON.parse(raw) : null;
}
```

- Für alle drei Tabs aufrufen: `reinigung`, `buegeln`, `waesche`
- Render-Logik (tbody-Befüllung) bleibt identisch
- Wenn `null` zurückkommt → HTML-Hardcoded-Rows bleiben stehen (wie bisher)

### Änderung 3: Kontaktformular (aktuell nur client-side)

**Neu:**
```js
contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  // ... bestehende Validierung ...
  try {
    const res = await fetch(CLEANFIX_API + '/contact-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, betreff, nachricht })
    });
    if (res.ok) {
      // Erfolgs-UI anzeigen (wie bisher)
    } else {
      // Fehler-UI anzeigen
    }
  } catch (err) {
    // Netzwerk-Fehler anzeigen
  }
});
```

### Änderung 4: Newsletter-Formular (aktuell nur client-side)

**Neu:**
```js
newsletterForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  // ... bestehende Validierung ...
  try {
    const res = await fetch(CLEANFIX_API + '/newsletter-sub', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name })
    });
    if (res.ok) {
      // "Bestätigungsmail gesendet" anzeigen
    }
  } catch (err) {
    // Fehler anzeigen
  }
});
```

### Was NICHT geändert wird in main.js
- `cleanfix-theme` (localStorage) → bleibt lokal (User-Präferenz)
- `cleanfix-motion` (localStorage) → bleibt lokal (User-Präferenz)
- Dark Mode IIFE → unverändert
- Sticky Nav, Burger, Tabs, Price Search, Animations → alles unverändert

---

## Aufgabe 3: `admin.html` — Saves an Backend senden

### Beschreibung
Das Admin Panel muss beim Speichern die Daten an die n8n-API senden. localStorage wird weiterhin als lokaler Cache geschrieben (damit das Admin Panel auch offline/lokal nutzbar bleibt und Live-Previews funktionieren).

### Konfiguration (oben im Script-Block hinzufügen)
```js
const CLEANFIX_API = 'https://cleanfix-api.thetrolli.com';
```

### Neue Hilfsfunktion
```js
async function apiSave(endpoint, data) {
  try {
    const res = await fetch(CLEANFIX_API + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Server: ' + res.status);
    toast('Gespeichert & veröffentlicht ✓', 'success');
    return true;
  } catch (err) {
    toast('Lokal gespeichert, aber Server-Sync fehlgeschlagen: ' + err.message, 'error');
    return false;
  }
}
```

### Änderung 1: Schedule speichern

Überall wo `saveSchedule(arr)` aufgerufen wird, danach `apiSave` aufrufen:

```js
// Bestehend (bleibt):
saveSchedule(schedule);
// Neu (hinzufügen):
await apiSave('/save-schedule', { schedule });
```

**Betroffene Stellen:**
- `#btn-save-ma` Handler (Zeile ~1522)
- `#btn-save-banner` Handler (Zeile ~1550)
- `collectAndSaveDeals()` (Zeile ~2025)
- Zeitplan Edit-Save (in `wireEditForm`)
- Zeitplan Delete

### Änderung 2: Preise speichern

**Aktuell (Zeile ~2101–2107):**
```js
lsSet('cleanfix-preise-reinigung', priceData.reinigung);
lsSet('cleanfix-preise-buegeln', priceData.buegeln);
lsSet('cleanfix-preise-waesche', priceData.waesche);
```

**Zusätzlich:**
```js
await apiSave('/save-preise', {
  reinigung: priceData.reinigung,
  buegeln: priceData.buegeln,
  waesche: priceData.waesche
});
```

### Änderung 3: Export/Import

- **Export**: Muss zusätzlich zum localStorage-Export auch die aktuellen JSON-Dateien vom Server lesen können (GET-Endpunkte)
- **Import**: Muss nach dem localStorage-Import auch die Daten an den Server senden
- **Clear All**: Muss auch die Server-Daten zurücksetzen (leere JSONs committen)

### Was NICHT geändert wird in admin.html
- Login-System (SHA-256 Hash) → bleibt identisch
- Live-Previews → lesen weiterhin aus den Formular-Feldern (nicht aus localStorage)
- Emoji-Picker → unverändert
- Alle Render-Funktionen → unverändert
- `migrateData()` → bleibt als Fallback für alte Daten

---

## Aufgabe 4: CORS, Security Headers & Authentifizierung

### In n8n Webhook-Nodes — CORS Headers
Jeder Webhook muss folgende Response-Headers setzen:
```
Access-Control-Allow-Origin: https://cleanfix-admin.thetrolli.com
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, CF-Access-Client-Id, CF-Access-Client-Secret, X-Webhook-Auth
```

Für den Newsletter- und Kontakt-Endpunkt zusätzlich:
```
Access-Control-Allow-Origin: https://cleanfix.thetrolli.com
```

### In n8n Webhook-Nodes — Authentifizierung
- Jeden Webhook-Node auf **Header Auth** stellen
- Header Name: `X-Webhook-Auth`
- Header Value: Ein langes zufälliges Passwort (z.B. 64 Zeichen)
- Dieses Passwort muss in `admin.html` und `main.js` als Header mitgesendet werden

### In Cloudflare Zero Trust — Service Tokens (für Admin-Endpunkte)
1. Zero Trust Dashboard → Access → Service Auth → Service Tokens → Create
2. Token-Name: `cleanfix-admin`
3. Die generierten `CF-Access-Client-Id` und `CF-Access-Client-Secret` im Admin Panel einbauen
4. Access Application erstellen für `cleanfix-api.thetrolli.com/save-*`
5. Policy: Nur Service Token `cleanfix-admin` erlauben

### In Cloudflare — Rate Limiting & Bot Protection
- WAF Custom Rule: Rate Limit auf `/newsletter-sub` und `/contact-form`: max 5 Requests/Minute pro IP
- Optional: Cloudflare Turnstile (kostenloser CAPTCHA-Ersatz) für Newsletter- und Kontaktformular

### Im Admin Panel Code (`admin.html`)
```js
// Diese Werte werden bei der Einrichtung eingetragen:
const CF_ACCESS_CLIENT_ID     = '<wird-bei-setup-eingetragen>';
const CF_ACCESS_CLIENT_SECRET = '<wird-bei-setup-eingetragen>';
const WEBHOOK_AUTH_TOKEN      = '<wird-bei-setup-eingetragen>';

async function apiSave(endpoint, data) {
  try {
    const res = await fetch(CLEANFIX_API + endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Access-Client-Id': CF_ACCESS_CLIENT_ID,
        'CF-Access-Client-Secret': CF_ACCESS_CLIENT_SECRET,
        'X-Webhook-Auth': WEBHOOK_AUTH_TOKEN
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Server: ' + res.status);
    toast('Gespeichert & veröffentlicht ✓', 'success');
    return true;
  } catch (err) {
    toast('Lokal gespeichert, aber Server-Sync fehlgeschlagen: ' + err.message, 'error');
    return false;
  }
}
```

### Sicherheits-Hinweis für den AI Agent
Die Token-Werte (`CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET`, `WEBHOOK_AUTH_TOKEN`) dürfen **nicht** hart im Code stehen wenn das Repo öffentlich ist. Stattdessen:
- Entweder das Repo privat halten (aktuell der Fall)
- Oder die Werte über Cloudflare Pages Environment Variables injizieren und zur Build-Zeit einsetzen

---

## Aufgabe 5: Initiale Daten befüllen

### Beschreibung
Die JSON-Dateien im `/data/`-Ordner müssen mit den aktuellen DEFAULTS aus `admin.html` befüllt werden, damit die Website sofort korrekte Daten anzeigt.

### Schritte
1. Aus dem `DEFAULTS`-Objekt in `admin.html` (~Zeile 1286) die Initialdaten extrahieren:
   - `DEFAULTS.monatsangebot` → als permanenten Schedule-Eintrag in `schedule.json`
   - `DEFAULTS.banner` → als permanenten Schedule-Eintrag in `schedule.json`
   - `DEFAULTS.deals` → als permanente Deal-Einträge in `schedule.json`
   - `DEFAULTS.preiseReinigung` → `preise-reinigung.json`
   - `DEFAULTS.preiseBuegeln` → `preise-buegeln.json`
   - `DEFAULTS.preiseWaesche` → `preise-waesche.json`
2. Die JSON-Dateien mit diesen Daten schreiben

---

## Aufgabe 6: Cloudflare Web Analytics einbauen

### Beschreibung
Cookie-lose, DSGVO-konforme Besucherstatistiken über Cloudflare Web Analytics.

### Schritte
1. Folgenden Snippet vor `</body>` einfügen in:
   - `public-site/index.html`
   - `public-site/impressum.html`
   - `public-site/datenschutz.html`

```html
<!-- Cloudflare Web Analytics (cookieless, DSGVO-konform) -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js'
        data-cf-beacon='{"token": "SITE_TOKEN"}'></script>
```

2. `SITE_TOKEN` wird bei der Cloudflare-Einrichtung generiert und muss dann eingesetzt werden
3. **Nicht** im Admin Panel einbauen (unnötig, keine Besucher-Seite)

### Datenschutzerklärung ergänzen
In `public-site/datenschutz.html` folgenden Abschnitt hinzufügen:

> **Webanalyse (Cloudflare Web Analytics)**
> Wir nutzen Cloudflare Web Analytics zur statistischen Auswertung der Seitenbesuche. Dieser Dienst verwendet keine Cookies und speichert keine personenbezogenen Daten. Es werden ausschließlich aggregierte, anonymisierte Daten erhoben (Seitenaufrufe, Referrer, Land, Gerätetyp). Anbieter: Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, USA. Datenschutzhinweise: https://www.cloudflare.com/privacypolicy/

---

## Zusammenfassung: Änderungs-Checkliste

| Datei | Änderung | Aufwand |
|-------|----------|---------|
| Repo-Struktur | Dateien in `public-site/` und `admin-site/` aufteilen | Klein |
| `main.js` | Schedule + Preise via `fetch()` laden statt localStorage | Mittel |
| `main.js` | Kontakt- und Newsletter-Formular an API senden | Klein |
| `admin.html` | `apiSave()` Funktion + alle Save-Handler erweitern | Mittel |
| `admin.html` | Export/Import um Server-Sync erweitern | Klein |
| JSON-Dateien | Initiale Daten aus DEFAULTS befüllen | Klein |
| Analytics | Cloudflare Web Analytics Snippet in alle public HTML-Dateien | Klein |
| Datenschutz | `datenschutz.html` um Cloudflare-Abschnitt ergänzen | Klein |
| Security | CF Access Service Tokens + n8n Header Auth in API-Calls einbauen | Mittel |
| n8n | 4 Workflows erstellen (save-schedule, save-preise, newsletter, contact) | Extern |
| Cloudflare | Pages-Projekte + Tunnel + Access + Analytics konfigurieren | Extern |

**Geschätzter Code-Aufwand**: Die reinen Code-Änderungen an `main.js` und `admin.html` sind überschaubar — es werden keine neuen Features gebaut, sondern nur die Datenquelle von localStorage auf fetch/API umgestellt. Die bestehende Logik (Rendering, Previews, Validation) bleibt vollständig erhalten.
