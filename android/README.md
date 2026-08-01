# Android-Apps (zwei getrennte APKs)

Zwei eigenständige WebView-Apps, jede bündelt nur ihr eigenes Spiel und läuft
komplett offline:

| Modul     | App-Name    | Package                  | Start-Seite  |
|-----------|-------------|--------------------------|--------------|
| `:bingo`  | TdF Bingo   | `de.hb03.tdfbingo`       | `index.html` |
| `:bombe`  | Bombenspiel | `de.hb03.bombenspiel`    | `bombe.html` |

Beide Spiele sind vollständig getrennt – keine Verlinkung untereinander. Weil
sie unterschiedliche Package-IDs haben, lassen sie sich parallel auf demselben
Gerät installieren.

## APKs herunterladen

Gebaut von GitHub Actions (`.github/workflows/android-apk.yml`), je als eigenes
Release:

- **TdF Bingo** → Release *„TdF Bingo (neueste APK)"* → `tdf-bingo.apk`
- **Bombenspiel** → Release *„Bombenspiel (neueste APK)"* → `bombenspiel.apk`

Alternativ als Build-Artefakt `apks` im jeweiligen Actions-Lauf.

Auf dem Handy die `.apk` öffnen und installieren (einmalig „Installation aus
unbekannten Quellen" erlauben).

## Lokal bauen (Android SDK erforderlich)

```bash
cd android
# Web-Dateien in die Modul-Assets spiegeln:
cp ../index.html ../manifest.webmanifest bingo/src/main/assets/www/
cp ../icons/*.png bingo/src/main/assets/www/icons/
cp ../bombe.html ../manifest.webmanifest bombe/src/main/assets/www/
cp ../icons/*.png bombe/src/main/assets/www/icons/

./gradlew :bingo:assembleRelease :bombe:assembleRelease
# Ergebnisse:
#   bingo/build/outputs/apk/release/bingo-release.apk
#   bombe/build/outputs/apk/release/bombe-release.apk
```

Die Release-APKs werden der Einfachheit halber mit dem Debug-Schlüssel
signiert, damit sie ohne eigenes Keystore-Setup direkt installierbar sind.

## Datenspeicherung

Beide Apps aktivieren DOM-Storage (`setDomStorageEnabled`). Der `localStorage`
wird von der Android-WebView dauerhaft im privaten App-Speicher abgelegt und
überlebt App-Neustarts (Spielstände, Einstellungen). In der APK wird kein
Service-Worker registriert – die Assets liegen lokal und sind ohnehin offline.
