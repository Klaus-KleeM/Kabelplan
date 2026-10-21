# Tracking-System – Konzept für die Weiterentwicklung

Zusammenfassung aus der Planung (Oktober 2026). Arbeitsgrundlage für die Umsetzung im Tracking-Code auf dem MSI.

---

## 0. Ausgangslage (bestehendes Tracking-Programm)

- Läuft auf dem MSI (Nvidia-GPU).
- Arbeitet mit **festen Regeln** (z. B. Framing: Kopfraum, Bildaufteilung) und **Wahrscheinlichkeiten** für Ereignisse, z. B.:
  - Person betritt die Bühne
  - Blickrichtung in einer Diskussion (wer spricht als Nächstes)
  - Person hebt den Arm mit Mikrofon
- **Lernt im laufenden Betrieb.**
- Drei Betriebsarten: **Vorschlag** (System schlägt Schnitt vor) / **manuell** (Regie schneidet selbst) / **Automatik**.

**Erster Schritt bei der Umsetzung:** Code durchsehen und dokumentieren, wie Regeln, Wahrscheinlichkeiten und das Lernen heute gespeichert sind. Alle neuen Teile sollen an diese bestehenden Strukturen andocken.

---

## 1. Lernmodus: Video-Analyse (YouTube-Links / eigene Aufzeichnungen)

### Ziel
Videos (YouTube-Link oder Datei) einlesen. Das System erkennt daraus die Veranstaltungsart (Show, Konferenz, Panel, Konzert …) und lernt, wie dort geschnitten und kadriert wird. Das Gelernte wird als **Update (Profil-Datei)** ins Tracking übernommen.

### Architektur-Entscheidung
- **Im Tracking-Programm integriert**, mit **derselben Erkennung** (Personen, Pose, Blickrichtung, Mikro-Arm, Framing) wie im Live-Betrieb. Dadurch beschreibt das Gelernte alles in denselben Begriffen und Regeln wie das Live-System.
- **Läuft aber getrennt vom Live-Betrieb** als eigener Modus bzw. Prozess:
  - Kein Lernen aus YouTube während einer Show (GPU-Last, Stabilität).
  - Neues Gelerntes ändert nicht ungeprüft mitten in einer Veranstaltung das Verhalten.

### Ablauf
1. Video laden (Link oder Datei), zur Analyse auf ca. **360p mit 2 Bildern pro Sekunde** reduzieren. Der Ton bleibt erhalten (Applaus, Musik, Sprecher).
2. **Schnitte erkennen**, das Video in Einstellungen zerlegen.
3. Pro Einstellung erkennen: Einstellungsgröße (Totale / Halbnah / Close), Personen, Sprecher, Blickrichtung, Mikro-Arm, Framing-Werte.
4. **Ereignis → Regie-Reaktion** auswerten, z. B. „Mikro gehoben → nach 1,2 s Schnitt auf Close“.
5. Veranstaltungsart klassifizieren.
6. Profil aktualisieren.

### Ergebnis: Profil-Datei
- Pro Veranstaltungsart eine Datei, z. B. `profil-konferenz.json`, `profil-show.json`.
- Inhalt: Wahrscheinlichkeiten für Ereignis → Schnitt, Schnitt-Timing (mittlere Länge einer Einstellung, Reaktionszeiten), Verteilung der Einstellungsgrößen, Framing-Werte.
- **Versionsnummer**, **Vorschau der Änderungen vor dem Übernehmen**, **Zurück zur alten Version** möglich.
- **Gewichtung:** Eigene Live-Entscheidungen (selbst geschnitten, Vorschlag abgelehnt oder angenommen) zählen **stärker** als fremde YouTube-Regie. YouTube-Videos dienen eher als Startwerte für neue Veranstaltungsarten.

### Grenzen
- Aus einem YouTube-Video sieht man nur das fertige Programmbild, nicht die einzelnen Kameras. Lernbar sind **Schnitt-Timing, Bildauswahl und Framing**. **Kamerabewegungen** (Schwenks, Zoomfahrten) lassen sich daraus kaum lernen, die kommen weiter aus dem Live-Betrieb.
- **Rechtlich:** YouTube erlaubt das Herunterladen in den Nutzungsbedingungen grundsätzlich nicht. Eigene Videos oder Videos mit Erlaubnis sind unproblematisch.

### Datenmengen
| Was | Größe |
|---|---|
| YouTube-Video, 1 h in 1080p (nur temporär) | ca. 1–3 GB |
| Für die Analyse verkleinert (360p) | ca. 100–300 MB, wird danach gelöscht |
| Erkannte Merkmale pro Video | ca. 1–5 MB |
| **Profil-Update (JSON)** | **ca. 10–100 KB** |
| Optional später: eigenes KI-Modell | ca. 5–50 MB |

### Hardware
- Analyse auf dem MSI (Nvidia). Ein einstündiges Video sollte deutlich unter einer Stunde dauern.
- Das iPad ist für die Analyse nicht geeignet. Profil-Updates einspielen und ansehen geht dort aber problemlos.

---

## 2. Kamera-Analyse: Anzahl, Position und Empfehlung

### Ziel
Aus einem Video erkennen, **wie viele Kameras** eingesetzt wurden und **wo sie ungefähr stehen**. Über mehrere Videos derselben Veranstaltungsart soll das System **empfehlen, wie viele Kameras man braucht**.

### Methode
1. **Einstellungen nach Kamera gruppieren:** Jede Kamera hat ihre typische Perspektive (Hintergrund wie LED-Wand, Bühnenkante oder Truss, Blickwinkel, Höhe, Brennweite). Gleiche Perspektive = gleiche Kamera.
2. **Gegenprobe:** In Totalen sind oft andere Kameras samt Kameraleuten zu sehen.
3. **Position schätzen** über Perspektive und Fluchtpunkte (Bühnenkante, Pult, Leinwände) und die Größe von Personen:
   - seitlicher Winkel (z. B. „30° von links“), ca. ±10–15°
   - Höhe: Augenhöhe, erhöht oder von unten
   - Brennweite: Weitwinkel oder Tele, also ungefähr nah oder weit weg
   - Meter nur, wenn ein Maß bekannt ist (Bühnenbreite, LED-Wand)
4. **Ausgabe:** Draufsicht mit Bühne und Kamerapositionen samt Blickrichtung. Optional später als Export in den Kabelplan.
5. **Kamerazahl-Empfehlung:** Über mehrere Videos werten, welche Kameras ständig genutzt werden (Pflicht) und welche selten (optional). Beispiel: „Panel mit 4 Personen: mindestens 3, üblich 4–5 Kameras“.

### Schwierige Fälle
- Zoom einer PTZ-Kamera oder zweite Kamera? Zwei Kameras direkt nebeneinander?
- Bewegte Kameras (Handkamera, Steadicam, Kran) als eigene Klasse „bewegt“ führen.
- Kameras, die nie geschnitten wurden, sind unsichtbar, außer sie stehen in einer Totalen im Bild.
- Einspieler, Grafiken, Leinwand-Zuspielungen und Wiederholungen aussortieren.

### Erwartung
- Bei 3–6 Kameras sollte die Anzahl meist stimmen oder um eins danebenliegen. Die Positionen taugen als Skizze, nicht als Aufbauplan auf den Meter.
- Zusätzlicher Nutzen: Das Lernen aus Abschnitt 1 wird genauer, wenn bekannt ist, von welcher Kamera auf welche geschnitten wurde.

---

## 3. Crop-Funktion der Panasonic PTZ-Kameras

| | AW-UE150 / AW-UE160 | AW-UE100 |
|---|---|---|
| Crop vorhanden | ja | ja |
| Gleichzeitige Bilder mit Crop | **4K-Gesamtbild + HD-Ausschnitt** | **2 HD-Bilder**: Gesamtbild herunterskaliert (12G-SDI/HDMI) + HD-Ausschnitt (3G-SDI, NDI, IP-Ausgang 1 und 2). **Kein 4K** bei aktivem Crop |
| Crop-Positionen | bis zu 3 gespeicherte | bis zu 3 gespeicherte |
| Ausgegebene Ausschnitte | jeweils **nur einer gleichzeitig**, man schaltet zwischen den 3 Positionen um | dto. |
| Crop-Position im Preset gespeichert | laut RP150-Angaben **ja** | **unklar**, am Gerät testen |
| Crop-Zoom | – | bis 5-fach, aber mit Qualitätsverlust |
| Steuerung | RP150, RP60, Weboberfläche | RP150, RP60, Weboberfläche |

UE160: Dass sie sich wie die UE150 verhält (4K + HD-Crop), ist angenommen und noch nicht eigens geprüft.

### Bildqualität
- 4K (3840×2160) → HD (1920×1080): Ein Ausschnitt **bis Faktor 2 ist verlustfrei**, weil die Pixel 1:1 übernommen werden.
- Über Faktor 2 wird hochgerechnet. Das ist dann echter Digitalzoom und wird weicher.
- Das Tele-Ende verlängert sich in HD effektiv: **UE150/160: 20-fach → ca. 40-fach**, **UE100: 24-fach → ca. 48-fach**. Das Weitwinkel-Ende bleibt gleich.
- Der Crop kommt immer aus dem aktuellen optischen Bild. Zwischen Gesamtbild und Ausschnitt liegt also **maximal Faktor 2**. Gesamtbild und sehr enges Close gleichzeitig gehen nicht.
- **Regel fürs Tracking:** Crop-Ausschnitte nicht kleiner als 1920×1080 Pixel auf dem 4K-Bild (= ein Viertel der Fläche). Für engere Einstellungen den optischen Zoom oder eine eigene Kamera verwenden.

### Crop-Tracking über das Netzwerk
- Panasonic bewirbt Tracking mit Crop (eigene Tracking-Software AW-SF100/SF200). Der Crop-Ausschnitt muss sich also **von außen frei und laufend über das Netzwerk steuern lassen**.
- **Ziel:** Das Tracking-Programm setzt den Ausschnitt direkt per Befehl („Ausschnitt jetzt bei x/y“), ohne Umweg über Presets.
- **Offene Punkte / zu klären:**
  1. Die Crop-Befehle in Panasonics „Interface Specifications“ (HTTP-Befehle der AW-Serie) suchen.
  2. Falls sie dort fehlen: In der Weboberfläche der Kamera den Crop bewegen und im Browser (Entwicklertools → Netzwerk) mitlesen, welche Befehle gesendet werden. Oder beim Panasonic-Support anfragen.
  3. Wie schnell reagiert die Kamera? Fährt der Ausschnitt flüssig nach? Am Gerät testen.
  4. UE100: Wird die Crop-Position im Preset gespeichert? Test: Preset mit Crop speichern, Crop verschieben, Preset abrufen.

---

## 4. Sport-Module

### Prinzip
Sportartspezifische Funktionen als **zuschaltbare Module** im Tracking-System. Sie liefern Kamera- oder Crop-Vorschläge mit Wahrscheinlichkeit, so wie die übrige Logik. Die drei Betriebsarten (Vorschlag / manuell / Automatik) bleiben unverändert. Module werden wie Profile als **versioniertes Update** eingespielt.

Gemeinsames Gerüst für jedes Modul:

| Teil | Bedeutung |
|---|---|
| Eingänge | Körpererkennung, Ton, externe Daten (Scoreboard, Scoring-Software, Matchuhr) |
| Spielzustand | z. B. Spielstand, wer ist dran, Phase des Spiels |
| Regeln | Spielregeln der Sportart |
| Gelerntes | z. B. Vorlieben einzelner Spieler, Timing der Regie |
| Ausgabe | Kamera- oder Crop-Vorschlag mit Wahrscheinlichkeit; bei Unsicherheit zurück auf die Totale |

### Erstes Modul: Darts (Idee, Details noch mit Profis abklären)

**a) Wurf erkennen → auf die Scheibe schneiden**
- Ein Dart braucht von der Hand bis zur Scheibe nur ca. 0,15–0,2 s. Ein Schnitt erst beim Einschlag kommt zu spät.
- Deshalb **vor dem Wurf** schneiden: Die Körpererkennung sieht, dass der Spieler am Oche steht, den Arm hebt und zielt. Dann geht das Bild auf die Scheibe.
- Während der drei Würfe bleibt das Bild auf der Scheibe. Nach dem dritten Dart oder wenn der Spieler sich wegdreht, geht es zurück auf den Spieler.
- Zur Absicherung den Einschlag-Ton über das Mikrofon erkennen.

**b) Treffer mitrechnen (Profi-Bereich)**
- Bevorzugt den **Spielstand aus der vorhandenen Scoring-Software** übernehmen (Schreiber oder automatisch).
- Alternative: bestehende automatische Treffererkennung (z. B. Autodarts, Scolia). Ob und wie man an deren Daten kommt, ist zu prüfen.
- Eigene Bilderkennung über die TV-Kamera nur als Notlösung.

**c) Ziel vorhersagen → Kamera oder Crop wählen**
- Regeln: 501, Double-Out.
- Restpunkte **über 170**: meist Triple 20. Ist das Feld verdeckt, oft Triple 19.
- Restpunkte **bis 170**: Standard-Checkout-Wege (z. B. 170 = T20 – T20 – Bull, 40 = D20, 32 = D16). Nach jedem Dart neu rechnen.
- **Lernen:** Lieblings-Doppel und -Wege pro Spieler (z. B. D16 statt D20).
- **Ausgabe:** Crop auf das wahrscheinlichste Zielfeld, z. B. T20 oben, Bull in der Mitte, Doppel am Rand.
  - Board-Kamera in 4K. Ausschnitt verlustfrei bis Faktor 2 (siehe Abschnitt 3).
  - Mit festen Crop-Positionen nur 3 Zonen (z. B. T20 / Bull / aktuelles Doppel). Bei freier Steuerung über das Netzwerk jedes Feld.
  - Bei Unsicherheit die ganze Scheibe zeigen. Lieber kein Close als ein falsches Close.

**Noch offen (mit Profis klären):** Anzahl Kameras bei Darts, eigene Board-Kamera, welche Scoring-Software verwendet wird.

### Weitere Sportarten (in Österreich verbreitet)

#### Sehr gut geeignet
Halle, überschaubarer Bereich, klare Regeln, vorhersehbare Abläufe.

| Sport | Was das Modul macht | Datenquelle |
|---|---|---|
| **Darts** | wie oben | Scoring-Software |
| **Tischtennis** | Aufschlag erkennen, Totale im Ballwechsel, nach dem Punkt Close auf den Gewinner, Satzende-Reaktion | Anzeigetafel oder Eingabe |
| **Volleyball / Beachvolleyball** | Aufschlag: Close auf den Aufschläger, dann Totale; Jubel-Close nach dem Punkt; Timeout → Bank | Scoreboard, Pfiff (Ton) |
| **Handball** (HLA) | Ballseite verfolgen; 7-Meter: Schütze und Tormann; Zeitstrafen | Matchuhr, Spielstand |
| **Basketball** (BSL) | Angriffsrichtung; Freiwurf als fester Ablauf mit Close; Shot-Clock | Anzeigetafel, Shot-Clock |
| **Eisstockschießen** | Wurf erkennen, Stock verfolgen, Draufsicht aufs Ziel (ähnlich wie Curling) | Eingabe oder Bilderkennung |
| **Sportkegeln** | Wurf: Spieler → Kugel → Kegelbild, dazu Ergebnis | Datenausgabe der Kegel-Anlage (oft vorhanden) |
| **Billard / Pool / Snooker** | Stoß-Vorbereitung erkennen, Draufsicht, Close aufs Zielloch | Spielstand, Kugelerkennung |

#### Gut geeignet

| Sport | Was das Modul macht |
|---|---|
| **Klettern / Bouldern** | Kletternden nach oben verfolgen, Griff-Zonen als Crop, Top-Moment, Wechsel zwischen den Bouldern |
| **Badminton / Squash** | wie Tischtennis, aber schneller, eher Totale |
| **Boxen / Kampfsport** | Ring mit zwei Personen, Rundenpausen in der Ecke, Treffer-Highlights |
| **Schach** (auch Schnellschach) | Zug erkennen → Brett-Close, Uhr, Nachdenk-Close |
| **Eishockey** (ICE League) | sehr schnell, kleiner Puck: Totale mit Puckseite, anspruchsvoll |
| **Floorball / Futsal** | Ballseite, Torszenen |

#### Bewusst nicht im Fokus
- Ski alpin, Skispringen, Langlauf: Freiluft, große Strecken, ganz anderes Setup.
- Fußball: Dafür gibt es schon fertige automatische Systeme (Veo, Pixellot).
- Reiten, Leichtathletik: Spezialfälle.

### Reihenfolge der Module
1. **Darts**
2. **Tischtennis** oder **Volleyball**
3. **Eisstockschießen** oder **Kegeln** (Nische, kaum Konkurrenz)

---

## 5. Vorgeschlagene Umsetzungsreihenfolge

1. Bestehenden Tracking-Code analysieren und dokumentieren (Regeln, Wahrscheinlichkeiten, Lernen, Betriebsarten).
2. **Profil-Format** festlegen: versioniert, mit Vorschau der Änderungen und Rollback. Import ins Tracking.
3. **Lernmodus Video-Analyse** (Abschnitt 1) als getrennter Modus mit derselben Erkennung.
4. **Kamera-Analyse und Kamerazahl-Empfehlung** (Abschnitt 2).
5. **Crop-Steuerung** der Panasonic-Kameras über das Netzwerk (Abschnitt 3). Vorher die Befehle klären und am Gerät testen.
6. **Modul-Gerüst** und erstes Sport-Modul **Darts** (Abschnitt 4).

---

## Quellen (Panasonic)
- FAQ AW-UE100: https://eww.pass.panasonic.co.jp/pro-av/support/content/faq/EN/faq_ue100.htm
- FAQ AW-UE150: https://eww.pass.panasonic.co.jp/pro-av/support/content/faq/EN/faq_ue150.htm
- FAQ AW-RP150: https://eww.pass.panasonic.co.jp/pro-av/support/content/faq/EN/faq_rp150.htm
- AW-RP150G Bedienungsanleitung: https://pro-av.panasonic.net/manual/pdf/AW-RP150G_Operation(DVQP1819ZA)_E.pdf
- Broschüre AW-UE100: https://org.pro-av.panasonic.net/en/download/brochure/pdf/aw-ue100.pdf
