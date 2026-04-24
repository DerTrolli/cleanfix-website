# Nachricht an Fabian – vor der Live-Schaltung

Diesen Text kannst du direkt per WhatsApp oder E-Mail an Fabian schicken.
Es gibt zwei Phasen: erst kurz Info anfragen (jetzt), dann später die
Nameserver tauschen (wenn alles in Cloudflare bereit ist).

---

## Teil 1 – DNS-Infos anfragen (jetzt schicken)

> Hey Fabian,
>
> ich bereite gerade alles vor, um die neue Cleanfix-Website live zu schalten.
> Den Newsletter-Teil habe ich erstmal rausgenommen, bis das Backend fertig ist.
>
> Damit ich bei mir in Cloudflare die DNS-Einträge sauber einrichten kann,
> bräuchte ich kurz zwei Informationen aus dem KAS-Panel:
>
> **1. DKIM-Eintrag**
> Im KAS unter *Domain → cleanfix-mg.de → DNS-Einstellungen* gibt es einen
> TXT-Eintrag, dessen Name ungefähr so aussieht:
> `etwas._domainkey.cleanfix-mg.de`
> Das „etwas" davor ist der sogenannte Selector (z. B. `default`, `mail`, `k1`
> oder ähnlich). Kannst du mir den vollständigen Namen des Eintrags und den
> Inhalt (beginnt mit `v=DKIM1; k=rsa; p=…`) schicken?
>
> **2. DMARC-Eintrag**
> Gibt es bei euch einen TXT-Eintrag namens `_dmarc.cleanfix-mg.de`?
> Falls ja, schick mir bitte auch dessen Inhalt (beginnt mit `v=DMARC1; …`).
>
> Die beiden Infos brauche ich, bevor ich dir die Cloudflare-Nameserver
> schicke – damit die E-Mail nach dem Wechsel garantiert weiterläuft.
>
> Danke!

---

## Teil 2 – Nameserver tauschen (schicken wenn Cloudflare bereit ist)

> Hey Fabian,
>
> ich hab jetzt alles in Cloudflare fertig eingerichtet – alle DNS-Einträge
> (MX, SPF, DKIM, DMARC) sind korrekt übernommen, die neue Website ist als
> Custom Domain verknüpft.
>
> Jetzt brauche ich von dir **eine einzige Änderung im KAS**:
>
> KAS → *Domain* → `cleanfix-mg.de` → *Nameserver-Einstellungen*
>
> Dort die aktuellen All-Inkl-Nameserver durch diese zwei Cloudflare-Nameserver
> ersetzen:
>
> ```
> [NAMESERVER 1 hier eintragen]
> [NAMESERVER 2 hier eintragen]
> ```
>
> *(Die genauen Werte trage ich ein, sobald ich sie aus dem Cloudflare-Dashboard
> kopiert habe – ich schick sie dir dann direkt als Ersatz für die Platzhalter
> oben.)*
>
> **Wichtig:** Bitte nur die Nameserver-Einträge ändern – keine DNS-Einträge
> anfassen, die liegen jetzt alle bei Cloudflare und müssen nicht mehr in KAS
> bearbeitet werden.
>
> Nach der Änderung dauert es meistens 1–4 Stunden, bis die neue Seite weltweit
> sichtbar ist (offiziell bis zu 48 h). E-Mail läuft die ganze Zeit normal weiter.
>
> Kannst du mir kurz Bescheid geben, wenn du es gemacht hast?
>
> Danke!

---

## Erinnerung: Nameserver-Werte eintragen

Bevor du Teil 2 abschickst, hol dir die Werte aus Cloudflare:
Cloudflare Dashboard → Zone `cleanfix-mg.de` → *Overview* → rechte Seite
→ **Cloudflare nameservers**. Du siehst zwei Adressen im Format
`<name>.ns.cloudflare.com`. Die trägst du in die Platzhalter in Teil 2 ein.
