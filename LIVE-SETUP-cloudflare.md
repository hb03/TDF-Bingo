# Live-Mehrspieler über Cloudflare (Worker + WebSockets)

Der Mehrspielermodus („📡 Live-Spiel") läuft über einen **Cloudflare Worker**
mit **Durable Objects**: ein Raum (4-stelliger Code) = ein Durable Object,
alle Mitspieler sind per **WebSocket** verbunden. Präsenz (Name + Anzahl
gefundener Felder) und Ereignisse (`found` / `bingo`) werden live an alle im
Raum verteilt. Es wird **nichts dauerhaft gespeichert** – der Raum lebt nur,
solange jemand verbunden ist.

Dateien: `cloudflare/worker/` (Worker-Code + `wrangler.toml`).

---

## 1. Voraussetzungen

- Ein (kostenloses) **Cloudflare-Konto**.
- **Node.js** lokal installiert (für `wrangler`, das Cloudflare-CLI).

Durable Objects sind im **kostenlosen Workers-Plan** nutzbar (SQLite-Variante,
in `wrangler.toml` bereits als `new_sqlite_classes` konfiguriert – wir nutzen
keine persistente Speicherung).

---

## 2. Worker deployen

```bash
cd cloudflare/worker
npx wrangler login          # öffnet den Browser, einmalig Cloudflare autorisieren
npx wrangler deploy
```

Nach dem Deploy zeigt `wrangler` die Adresse an, z. B.:

```
https://bingo-live.DEIN-SUBDOMAIN.workers.dev
```

Die **WebSocket-Adresse** ist dieselbe mit `wss://` statt `https://`:

```
wss://bingo-live.DEIN-SUBDOMAIN.workers.dev
```

Kurztest im Browser: `https://bingo-live.DEIN-SUBDOMAIN.workers.dev/health`
sollte `bingo-live ok` anzeigen.

---

## 3. Adresse in der App eintragen

In `index.html` oben die Konstante setzen:

```js
let LIVE_WS_URL = "wss://bingo-live.DEIN-SUBDOMAIN.workers.dev";
```

**Ohne** neu zu deployen testen: In der laufenden Web-App die Konsole öffnen und

```js
localStorage.setItem('bingo.liveWsUrl', 'wss://bingo-live.DEIN-SUBDOMAIN.workers.dev'); location.reload();
```

Sobald die Adresse gesetzt ist, erscheint im „📡 Live-Spiel"-Panel das
Beitreten-Feld. Ein Spieler lässt das Code-Feld leer (erzeugt einen neuen
Raum), die anderen geben denselben Code ein.

---

## 4. Web-App auf Cloudflare Pages hosten

Zwei Wege:

**A) Git-Anbindung (empfohlen):** In Cloudflare → *Workers & Pages* → *Create*
→ *Pages* → Repo `hb03/tdf-bingo` verbinden. Einstellungen:

- Framework preset: **None**
- Build command:
  `mkdir -p _site && cp index.html bombe.html manifest.webmanifest sw.js _site/ && cp -r icons _site/`
- Build output directory: **`_site`**

Danach ist die Seite unter `https://<projekt>.pages.dev/` (Bingo) bzw.
`.../bombe.html` (Bombenspiel) erreichbar; eine eigene Domain lässt sich in den
Pages-Einstellungen hinzufügen.

**B) Direkt-Upload per CLI:**

```bash
mkdir -p _site && cp index.html bombe.html manifest.webmanifest sw.js _site/ && cp -r icons _site/
npx wrangler pages deploy _site --project-name tdf-bingo
```

> Hinweis: Worker (Schritt 2) und Pages sind getrennt. Die statische Seite kann
> auch weiterhin auf GitHub Pages liegen – der Mehrspielermodus funktioniert von
> jedem Host aus, solange `LIVE_WS_URL` auf den Worker zeigt (WebSockets sind
> nicht an den Seiten-Host gebunden).

---

## 5. Android-APK

Die APK bündelt `index.html`. Nach dem Setzen von `LIVE_WS_URL` und dem nächsten
CI-Build enthält auch die APK die Live-Funktion (WebSockets funktionieren im
Android-WebView).

---

## Protokoll (zur Referenz)

JSON über WebSocket, Endpunkt `wss://…/room/CODE`:

```
Client → Server:
  { t:'join',     id, name, count }
  { t:'presence', id, name, count }
  { t:'event',    id, name, kind:'found'|'bingo', motiv }
  { t:'leave',    id }
Server → Client:
  { t:'players', players:[{id,name,count}] }
  { t:'event',   by, name, kind, motiv }
```

Der Client verbindet sich automatisch neu, wenn die Verbindung kurz abreißt.
