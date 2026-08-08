# Projekt-Notizen (tdf-bingo)

Zwei eigenständige Single-File-Spiele plus Android-Wrapper und Web-Hosting.

## Konventionen (wichtig)

- **Bingo-Themen: mindestens 60 Motive pro Thema.** Jedes Thema in
  `index.html` (`THEMES` / `POOL_*`) hat IMMER ≥ 60 verschiedene Motive
  (Text + selbst gezeichnetes SVG). Ein 5×5-Blatt zieht 24 Motive; die
  Untergrenze von 60 sorgt für spürbare Abwechslung. Beim Anlegen oder
  Erweitern eines Themas diese Grenze einhalten.

## Dateien

- `bombe.html` — Bombenspiel (eigenständig, eigenes localStorage `bombe.*`).
- `index.html` — Bingo mit Themenwahl (`THEMES`: Tour de France, Fußball …).
  Motive pro Thema als `POOL_TDF`, `POOL_FUSSBALL`, …; `POOL` zeigt aufs
  aktive Thema (via `setzeThema`). Ausgeschlossene Motive werden pro Thema
  gespeichert; gewähltes Thema steckt in `state.thema`.
- `sw.js` — Service-Worker; bei jeder Web-Änderung `CACHE` hochzählen.
- `android/bingo`, `android/bombe` — WebView-APKs; die jeweilige HTML wird in
  `.../assets/www/` gespiegelt.

## Deploy-Ablauf

1. Änderung an `index.html`/`bombe.html`.
2. `sw.js`-Cache hochzählen; HTML in das passende `android/*/assets/www/`
   spiegeln.
3. Auf dem Feature-Branch committen/pushen, PR auf den Default-Branch
   (`claude/tour-de-france-bingo-app-jendbs`) und mergen.
4. GitHub Actions baut die APKs (`bingo-latest`, `bombe-latest`) und
   veröffentlicht GitHub Pages (`https://hb03.github.io/tdf-bingo/`).

## Test

- `node --check` auf dem extrahierten `<script>`.
- Playwright (`playwright-core` im Scratchpad, Chromium unter
  `/opt/pw-browsers/`), `file://`-URL, `localStorage` seeden.
