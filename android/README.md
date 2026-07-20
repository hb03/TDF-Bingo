# Android-App (Bingo & Bombenspiel)

Schlanke native **WebView-Hülle** um die Web-App. Die HTML-/JS-/Icon-Dateien
werden als App-Assets gebündelt und über den `WebViewAssetLoader` unter einer
`https`-Herkunft ausgeliefert – die App läuft damit **komplett offline**
(nur das optionale Live-Spiel im Bingo braucht Internet).

## APK herunterladen

Die APK wird automatisch von GitHub Actions gebaut
(Workflow `.github/workflows/android-apk.yml`):

- **Als Release-Datei:** unter *Releases → „Android-App (neueste APK)"* →
  `bingo-bombe.apk` herunterladen.
- **Als Build-Artefakt:** im jeweiligen Actions-Lauf unter *Artifacts →
  `bingo-bombe-apk`*.

Auf dem Android-Handy die Datei öffnen und installieren. Beim ersten Mal muss
„Installation aus unbekannten Quellen" für den Browser bzw. die Dateien-App
erlaubt werden.

## Lokal bauen (Android SDK erforderlich)

```bash
cd android
# Web-Dateien in die Assets spiegeln (einmalig bzw. nach Änderungen):
mkdir -p app/src/main/assets/www/icons
cp ../index.html ../bombe.html ../manifest.webmanifest ../sw.js app/src/main/assets/www/
cp ../icons/*.png app/src/main/assets/www/icons/

./gradlew assembleRelease   # Ergebnis: app/build/outputs/apk/release/app-release.apk
```

Die Release-APK wird der Einfachheit halber mit dem Debug-Schlüssel signiert,
damit sie ohne eigenes Keystore-Setup direkt installierbar ist.

## Eckdaten

- `applicationId`: `de.hb03.tdfbingo`
- `minSdk` 23 (Android 6.0), `targetSdk`/`compileSdk` 34
- Einzige Abhängigkeit: `androidx.webkit`
