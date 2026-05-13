# Cleanfix Admin-Panel Benutzerhandbuch

## Willkommen!

Dieses Handbuch erklärt, wie Sie das Cleanfix Admin-Panel verwenden, um Website-Inhalte selbstständig zu verwalten — ohne technische Kenntnisse und ohne Code anzufassen.

Mit dem Admin-Panel können Sie:
- **Monatsangebote** erstellen und ändern
- **Aktionsbanner** hinzufügen
- **Sonderangebote** (Deals) verwalten
- **Preise** aktualisieren
- **Backups** exportieren und importieren

Das Admin-Panel erspart Ihnen die Abhängigkeit von einem Webentwickler für regelmäßige Inhaltsänderungen.

---

## Anmelden

**URL:** https://cleanfix-admin.thetrolli.com

1. Öffnen Sie die Adresse im Browser
2. Geben Sie das Passwort ein (fragen Sie den Website-Manager, falls Sie es nicht haben)
3. Sie sind angemeldet und sehen das Dashboard

**Wichtig:** Die Anmeldung endet automatisch, wenn Sie den Browser-Tab schließen. Sie müssen sich beim nächsten Besuch erneut anmelden.

---

## Das Dashboard verstehen

Das Admin-Panel hat drei Hauptbereiche (in der linken Seitenleiste):

| Bereich | Funktion |
|---------|----------|
| **Zeitplan** (🗓️) | Verwalten Sie Monatsangebote, Banner und Deals mit Zeitplanung |
| **Preise** (💶) | Ändern Sie Preistabellen |
| **Daten** (💾) | Sichern Sie Daten oder stellen Sie alte Versionen wieder her |

---

## Bereich 1: Zeitplan

Dies ist der wichtigste Bereich. Hier verwalten Sie alle zeitabhängigen Inhalte.

### Was zeigt der Zeitplan?

Oben sehen Sie eine **visuelle Timeline** (5-Monats-Fenster), die zeigt:
- Welche Inhalte gerade aktiv sind
- Welche geplant sind
- Welche abgelaufen sind

Darunter folgt eine **Inhaltsliste** mit allen Einträgen und ihren Status-Informationen.

### Die vier Inhaltstypen

#### 1. Monatsangebot
Das ist das große Angebot-Quadrat auf der Website-Startseite.

**Was es enthält:**
- Monatsname (z.B. "Juni 2026")
- Titel (z.B. "Sommer-Special")
- Beschreibung
- Angebots-Prozentsatz (z.B. "20%")
- "auf"-Text (z.B. "alle Hemden")

**Besonderheit:** Es kann nur EIN Monatsangebot gleichzeitig aktiv sein. Einträge mit Datum überschreiben permanente Einträge.

#### 2. Aktionsbanner
Ein prominentes Banner mit Icon, Titel und Text.

**Was es enthält:**
- Emoji-Icon
- Titel
- Beschreibung

**Besonderheit:** Nur EIN Banner kann gleichzeitig aktiv sein.

#### 3. Sonderangebot (Deal)
Spezielle Angebote in einer Gitter-Ansicht.

**Was es enthält:**
- Icon-Emoji
- Titel
- Preis
- Preiseinheit (z.B. "pro Stück")
- Beschreibung
- Optional: Highlight-Flag (hebt das Angebot hervor)

**Besonderheit:** Mehrere Deals können gleichzeitig aktiv sein.

### Status-Bedeutungen

| Status | Icon | Bedeutung |
|--------|------|-----------|
| **Dauerhaft** | ∞ | Keine Daten gesetzt — immer sichtbar (außer ein datierter Eintrag ist aktiv) |
| **Geplant** | 🕐 | Startdatum liegt in der Zukunft — noch nicht sichtbar |
| **Aktiv** | ✓ | Gerade live auf der Website (grün hervorgehoben) |
| **Abgelaufen** | ✗ | Enddatum ist vorbei — nicht mehr sichtbar |

---

## Schritt-für-Schritt: Ein Monatsangebot erstellen

Dies ist das häufigste Szenario. Wir erstellen ein neues Monatsangebot für Juni.

### Schritt 1: Inhaltstyp wählen

1. Klicken Sie auf den Button **"Neuer Eintrag"** oben im Zeitplan-Bereich
2. Wählen Sie aus der Dropdown-Liste: **"Monatsangebot"**
3. Ein Formular erscheint

### Schritt 2: Felder ausfüllen

Geben Sie folgende Informationen ein:

| Feld | Beispiel | Notizen |
|------|----------|---------|
| **Monatsname** | Juni | Der Name/Monat, z.B. "Juni 2026" |
| **Titel** | Sommer-Special | Kurzer, ansprechender Titel |
| **Beschreibung** | Genießen Sie bis zu 50% Rabatt auf alle Sommerartikel | Erklärtext |
| **Angebots-Text** | 50% | Der Prozentsatz oder die Aktion |
| **auf-Text** | alle Hemden | Worauf sich das Angebot bezieht |

**Hinweis:** Während Sie tippen, sehen Sie rechts eine Live-Vorschau, wie das Angebot auf der Website aussieht.

### Schritt 3: Zeitraum festlegen (optional)

Falls Sie das Angebot nur für einen bestimmten Zeitraum aktiv machen möchten:

1. Aktivieren Sie den Toggle **"Planen"**
2. Setzen Sie das **Startdatum** (z.B. 1. Juni 2026)
3. Setzen Sie das **Enddatum** (z.B. 30. Juni 2026)

Falls Sie keinen Zeitraum setzen, bleibt das Angebot dauerhaft aktiv (bis Sie es manuell löschen).

### Schritt 4: Speichern

1. Klicken Sie auf **"Speichern"**
2. Der Eintrag erscheint sofort in der Liste unten
3. **Wichtig:** Das ist nur ein lokaler Speicher!

### Schritt 5: Veröffentlichen

Nach dem Speichern erscheint unten ein **blaues Banner** mit dem Text "Änderungen veröffentlichen".

1. Lesen Sie die Zusammenfassung der Änderungen (optional)
2. Klicken Sie auf **"Änderungen veröffentlichen"**
3. Warten Sie etwa 60 Sekunden
4. Die Website aktualisiert sich — das neue Angebot ist jetzt live!

**Ohne diesen Schritt ist das Angebot nur im Admin-Panel sichtbar, nicht auf der Website.**

---

## Inhalte bearbeiten und löschen

### Einen Eintrag bearbeiten

1. Finden Sie den Eintrag in der Liste unter dem Formular
2. Klicken Sie auf **"Bearbeiten"**
3. Das Formular öffnet sich mit den aktuellen Werten
4. Nehmen Sie Ihre Änderungen vor
5. Klicken Sie auf **"Speichern"**
6. Das blaue Veröffentlichungs-Banner erscheint → klicken Sie **"Änderungen veröffentlichen"**

### Einen Eintrag löschen

1. Finden Sie den Eintrag in der Liste
2. Klicken Sie auf **"Löschen"**
3. Eine Bestätigung fragt: "Wirklich löschen?"
4. Bestätigen Sie
5. Das blaue Veröffentlichungs-Banner erscheint → klicken Sie **"Änderungen veröffentlichen"**

### Änderungen rückgängig machen

Falls Sie Änderungen gemacht haben, aber noch nicht veröffentlicht haben:

1. Klicken Sie im blauen Banner auf **"Verwerfen"**
2. Alle Änderungen werden rückgängig gemacht
3. Sie sehen wieder den zuletzt veröffentlichten Zustand

---

## Bereich 2: Preise

In diesem Bereich verwalten Sie alle Preistabellen.

### Überblick

Sie sehen mehrere **Tabs** (Reiter):
- Reinigung
- Nur Bügeln
- Wäsche & Mangeln
- Bonuskarten

Jeder Tab zeigt eine Preistabelle mit **Gruppen** (z.B. Kategorien) und **Zeilen** (Artikel + Preis).

### Preis ändern

1. Klicken Sie auf den Tab der Tabelle, die Sie ändern möchten
2. Finden Sie den Artikel und klicken Sie auf den Preis-Wert
3. Geben Sie den neuen Preis ein
4. Drücken Sie **Enter** oder klicken Sie außerhalb des Feldes
5. Klicken Sie auf **"Speichern"** (unten rechts in der Tabelle)

**Besonderheit:** Bei Preisen ist der Speichern-Knopf unmittelbar aktiv — es gibt kein separates Veröffentlichungs-Banner wie im Zeitplan.

### Zeile hinzufügen

1. Gehen Sie zu einer Gruppe in der Tabelle
2. Klicken Sie auf **"+ Zeile hinzufügen"**
3. Ein neues Eingabefeld erscheint
4. Geben Sie Artikelname und Preis ein
5. Klicken Sie **"Speichern"**

### Zeile oder Gruppe löschen

1. Klicken Sie auf das **Löschen-Icon** (Papierkorb) neben der Zeile oder Gruppe
2. Bestätigen Sie
3. Klicken Sie **"Speichern"**

### Preise aus Excel importieren

Falls Sie eine Excel-Datei mit Preisen haben:

1. Klicken Sie auf **"Aus Datei importieren"** (oben in der Preise-Sektion)
2. Wählen Sie eine Excel-Datei aus
3. Das System gleicht die Daten ab
4. Klicken Sie **"Importieren"** zur Bestätigung

**Hinweis:** Die Datei `Preise.xlsx` im Projekt ist die Referenz-Vorlage.

---

## Bereich 3: Daten

Hier können Sie Backups erstellen oder wiederherstellen.

### Daten exportieren (Backup erstellen)

1. Gehen Sie zum Bereich **"Daten"**
2. Klicken Sie auf **"Exportieren"**
3. Eine JSON-Datei wird heruntergeladen (z.B. `cleanfix-backup-2026-06-13.json`)
4. Speichern Sie diese Datei sicher — es ist ein vollständiges Backup aller Inhalte

**Wann exportieren?** Vor größeren Änderungen oder regelmäßig als Sicherung.

### Daten importieren (Backup einspielen)

Falls Sie Inhalte wiederherstellen möchten:

1. Gehen Sie zum Bereich **"Daten"**
2. Klicken Sie auf **"Importieren"**
3. Wählen Sie eine zuvor exportierte JSON-Datei
4. Bestätigen Sie, dass alle aktuellen Daten überschrieben werden
5. Das System stellt den Zustand aus dem Backup wieder her

### Alle Daten löschen (Notfall-Reset)

1. Klicken Sie auf **"Alle Daten löschen"**
2. Eine Warnung erscheint: "Alle Inhalte werden unwiederbringlich gelöscht!"
3. Nur im Notfall bestätigen
4. Das System setzt alles auf Fabrik-Einstellungen zurück

---

## Tipps und häufige Probleme

### Die Website zeigt noch den alten Inhalt

**Problem:** Ich habe veröffentlicht, aber die Website zeigt noch das alte Angebot.

**Lösung:**
1. Warten Sie 60 Sekunden nach dem Veröffentlichen
2. Laden Sie die Website neu: **Strg+Shift+R** (oder **Cmd+Shift+R** auf Mac)
3. Dies ist ein "harter Reload", der den Browser-Cache löscht

### Das Admin-Panel sieht fehlerhaft aus

**Problem:** Buttons sind an der falschen Stelle, Formulare laden nicht, oder das Layout ist durcheinander.

**Lösung:**
1. Clearen Sie den Browser-Cache oder nutzen Sie ein **privates Fenster** (Incognito-Modus)
2. Schließen Sie den Browser-Tab und öffnen Sie die URL neu
3. Falls das nicht hilft, kontaktieren Sie den Website-Manager

### Ich bin angemeldet, aber der Bildschirm ist leer

**Problem:** Das Dashboard zeigt keine Inhalte.

**Lösung:**
1. Laden Sie die Seite mit **F5** neu
2. Falls weiterhin nichts angezeigt wird, melden Sie sich ab und neu an
3. Nutzen Sie ggf. einen anderen Browser

### Ich habe einen Eintrag gelöscht, aber will ihn zurück

**Problem:** Ich habe versehentlich etwas gelöscht und veröffentlicht.

**Lösung:**
1. Gehen Sie zum Bereich **"Daten"**
2. Falls Sie vorher ein Backup exportiert haben, können Sie dieses importieren
3. Falls nicht: Erstellen Sie den Eintrag neu oder kontaktieren Sie den Website-Manager

### Das Veröffentlichungs-Banner ist weg, aber ich bin mir nicht sicher, ob alles gespeichert wurde

**Problem:** Ich sehe kein blaues Banner mehr, bin mir aber nicht sicher, ob alles live ist.

**Lösung:**
1. Alle Änderungen im Zeitplan werden nur veröffentlicht, wenn das blaue Banner sichtbar war und Sie es bestätigt haben
2. Falls Sie unsicher sind: Machen Sie einen **Screenshot** oder notieren Sie Ihre Änderung und fragen Sie nach
3. Preisänderungen sind sofort aktiv, wenn Sie "Speichern" klicken

---

## Wichtige Regeln zusammengefasst

1. **Zeitplan-Bereich:** Nach jeder Änderung (erstellen, bearbeiten, löschen) müssen Sie **"Änderungen veröffentlichen"** klicken
2. **Preise-Bereich:** Klicken Sie nur **"Speichern"** — die Preise sind dann sofort live
3. **Veröffentlichung dauert:** Etwa 60 Sekunden nach dem Veröffentlichen ist die Website aktualisiert
4. **Session endet:** Wenn Sie den Browser-Tab schließen, müssen Sie sich neu anmelden
5. **Hard-Reload:** Falls die Website noch alte Inhalte zeigt, drücken Sie **Strg+Shift+R**
6. **Backup vor Großänderungen:** Exportieren Sie Daten, bevor Sie viel ändernden

---

## Support und Problembehebung

### Was Sie selbst prüfen können

- Ist die Website https://cleanfix.de aktualisiert? (Nach 60 Sekunden und Hard-Reload)
- Ist das Passwort korrekt? (Fragen Sie den Website-Manager)
- Funktionieren andere Browser oder Private-Modus-Fenster?
- Haben Sie alle Änderungen **veröffentlicht**?

### Wann Sie den Website-Manager kontaktieren

- Das Admin-Panel lädt nicht oder zeigt nur Error-Meldungen
- Sie können sich nicht anmelden (und das Passwort ist korrekt)
- Die Website aktualisiert sich nicht, auch nach mehreren Minuten und Hard-Reload
- Daten, die Sie gelöscht haben, sind nicht wiederzustellen
- Sie haben Fragen, die dieses Handbuch nicht beantwortet

---

## Kontakt

**Website-Manager:** [Kontaktinformation einfügen]

Für technische Probleme, die nicht in diesem Handbuch behandelt werden, kontaktieren Sie bitte den Website-Manager mit einer Beschreibung des Problems und wenn möglich einem Screenshot.

---

**Version:** 1.0  
**Zuletzt aktualisiert:** Juni 2026  
**Sprache:** Deutsch  
**Zielgruppe:** Geschäftsführer und Inhalts-Manager (nicht-technisch)
