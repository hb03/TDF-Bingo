# Live-Spiel einrichten (Firebase Realtime Database)

Das Live-Spiel lässt mehrere Leute in einem **Raum** spielen. Jeder behält sein
**eigenes Blatt**; sobald jemand ein Feld markiert, sehen alle anderen eine kurze
Meldung: *„Luisa hat ‚Sturz' gefunden"*. Bingos werden ebenfalls gemeldet.

Technisch nutzt die App die **REST-Schnittstelle** der Firebase Realtime
Database (Empfang per `EventSource`, Senden per `fetch`). **Kein Firebase-SDK**,
keine zusätzliche Library – du brauchst nur eine Datenbank-URL.

## Schritt für Schritt

1. **Firebase-Projekt anlegen**
   - Gehe auf <https://console.firebase.google.com> → *Projekt hinzufügen*.
   - Name z. B. `tdf-bingo`. Google Analytics kannst du deaktivieren.

2. **Realtime Database erstellen**
   - Linke Leiste → *Build* → **Realtime Database** → *Datenbank erstellen*.
   - Region wählen (z. B. *europe-west1*).
   - Startmodus: **Testmodus** (oder gesperrt und Regeln wie unten setzen).

3. **Datenbank-URL kopieren**
   - Oben in der Realtime Database steht die URL, z. B.
     `https://tdf-bingo-default-rtdb.europe-west1.firebasedatabase.app`

4. **URL in die App eintragen**
   - In `index.html` ganz oben im `<script>` die Zeile anpassen:
     ```js
     const FIREBASE_DB_URL = "https://tdf-bingo-default-rtdb.europe-west1.firebasedatabase.app";
     ```
   - **Ohne** Schrägstrich am Ende. Danach erscheint das Live-Spiel automatisch.

5. **Datenbank-Regeln setzen** (Reiter *Regeln*)

   Einfachste Variante für den privaten Gebrauch (offen – jeder mit der URL und
   einem Raumcode kann mitlesen/-schreiben):
   ```json
   {
     "rules": {
       "rooms": {
         "$room": {
           ".read": true,
           ".write": true
         }
       }
     }
   }
   ```

## Spielen

- Unter **📡 Live-Spiel** einen **Namen** eingeben.
- **Raumcode** leer lassen → es wird ein neuer Code erzeugt (z. B. `K7QP`), den du
  teilst. Oder einen erhaltenen Code eintragen, um beizutreten.
- **Beitreten** drücken. Ab jetzt sieht jeder im Raum die Fund-Meldungen der
  anderen und einen kleinen Punktestand (gefundene Felder pro Spieler).

## Hinweise / Grenzen

- Markieren ist **Ehrensache** – man tippt an, was man selbst gesehen hat.
- Die offenen Regeln sind für eine Familien-/Freundesrunde okay. Wer es sicherer
  will, kann später Firebase Authentication + strengere Regeln ergänzen.
- Alte Räume/Events bleiben in der Datenbank stehen. Bei Bedarf in der Firebase-
  Konsole unter *Realtime Database* einfach den Knoten `rooms` löschen.
- Kosten: Für gelegentliches Spielen bleibt das klar im kostenlosen Spark-Tarif.
