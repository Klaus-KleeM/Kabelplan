# Tracking – Kurzfassung für den Chat am MSI

Kontext: Planung zur Weiterentwicklung meines Tracking-Programms (läuft auf dem MSI).
Ausführliche Fassung: GitHub Klaus-KleeM/Kabelplan, Zweig `claude/tracking-konzept`, Datei `TRACKING-KONZEPT.md`

## Ausgangslage
- Tracking arbeitet mit festen Regeln (Framing) und Wahrscheinlichkeiten für Ereignisse (Person betritt Bühne, Blickrichtung in Diskussion, Arm mit Mikro gehoben) und lernt im Betrieb.
- Betriebsarten: Vorschlag / manuell / Automatik.
- Erster Schritt: Code analysieren, wie Regeln, Wahrscheinlichkeiten und Lernen gespeichert sind. Alles Neue dockt dort an.

## 1) Lernmodus Video-Analyse (YouTube-Link oder eigene Aufzeichnung)
- Im Tracking-Programm, mit **derselben Erkennung** wie live, aber als **getrennter Modus** (nie während einer Show).
- Ablauf: Video auf ca. 360p und 2 Bilder/s reduzieren (Ton behalten) → Schnitte erkennen → pro Einstellung Einstellungsgröße, Personen, Sprecher, Blick, Mikro-Arm, Framing → „Ereignis → Regie-Reaktion inkl. Timing“ → Veranstaltungsart erkennen (Show/Konferenz/Panel/Konzert) → Profil aktualisieren.
- Ergebnis: Profil-JSON pro Veranstaltungsart (ca. 10–100 KB), mit Version, Vorschau der Änderungen, Rollback.
- Eigene Live-Entscheidungen zählen stärker als fremde YouTube-Regie.
- Grenze: Nur das Programmbild ist sichtbar → Schnitt, Timing und Framing lernbar, Kamerabewegungen kaum. YouTube-Download rechtlich heikel; eigene Videos sind ok.

## 2) Kamera-Analyse
- Einstellungen nach Perspektive gruppieren = Anzahl Kameras. Gegenprobe über Kameras, die in Totalen sichtbar sind.
- Position schätzen über Perspektive und Fluchtpunkte: Winkel ±10–15°, Höhe, Brennweite. Meter nur mit bekanntem Maß.
- Ausgabe: Draufsicht (später evtl. Export in den Kabelplan).
- Über mehrere Videos: Empfehlung, wie viele Kameras nötig sind (Pflicht vs. optional).
- Schwierig: Zoom vs. zweite Kamera, bewegte Kameras, nie geschnittene Kameras, Einspieler.

## 3) Panasonic Crop
- **UE150/UE160:** 4K-Gesamtbild + HD-Ausschnitt gleichzeitig. (UE160 angenommen, nicht geprüft.)
- **UE100:** bei aktivem Crop kein 4K mehr. 2 HD-Bilder: Gesamtbild herunterskaliert (12G-SDI/HDMI) + Ausschnitt (3G-SDI/NDI/IP).
- Bis zu 3 gespeicherte Crop-Positionen, aber nur **ein** Ausschnitt gleichzeitig.
- Bis Faktor 2 verlustfrei (4K → HD 1:1). Darüber wird hochgerechnet (Digitalzoom). Tele effektiv: 20x → ca. 40x, 24x → ca. 48x. Zwischen Gesamtbild und Ausschnitt maximal Faktor 2.
- Ziel: Das Tracking setzt den Crop frei per Netzwerkbefehl. Panasonic bewirbt Crop-Tracking (AW-SF100/200), also sollte das gehen.
- **Zu klären:** Befehle (Interface Specification oder in der Weboberfläche über die Browser-Entwicklertools mitlesen), Reaktionszeit, ob die UE100 den Crop im Preset speichert.

## 4) Sport-Module
- Zuschaltbar, versioniert. Gemeinsames Gerüst: Eingänge (Pose, Ton, Scoreboard/Scoring-Daten) → Spielzustand → Regeln → Gelerntes → Kamera-/Crop-Vorschlag mit Wahrscheinlichkeit (bei Unsicherheit Totale).

### Darts (Idee, Details noch mit Profis klären)
- a) Wurfhaltung erkennen → **vor** dem Wurf auf die Scheibe schneiden (Flugzeit nur 0,15–0,2 s). Nach dem 3. Dart zurück auf den Spieler. Einschlag-Ton zur Absicherung.
- b) Spielstand bevorzugt aus der Scoring-Software (alternativ Autodarts/Scolia, eigene Bilderkennung als Notlösung).
- c) 501/Double-Out: >170 meist T20 (verdeckt → T19); ≤170 Checkout-Wege (170 = T20-T20-Bull, 40 = D20 …). Lieblings-Doppel pro Spieler lernen → Crop auf das wahrscheinlichste Zielfeld.

### Sportarten
- **Sehr gut geeignet:** Darts, Tischtennis, Volleyball/Beach, Handball, Basketball, Eisstockschießen, Sportkegeln, Billard/Pool/Snooker.
- **Gut geeignet:** Klettern/Bouldern, Badminton/Squash, Boxen/Kampfsport, Schach, Eishockey, Floorball/Futsal.
- **Nicht im Fokus:** Ski/Skispringen/Langlauf, Fußball (fertige Systeme wie Veo/Pixellot), Reiten, Leichtathletik.
- Reihenfolge: Darts → Tischtennis oder Volleyball → Eisstock oder Kegeln.

## Umsetzungsreihenfolge
1. Code analysieren
2. Profil-Format + Import
3. Lernmodus Video-Analyse
4. Kamera-Analyse + Empfehlung
5. Crop-Steuerung über das Netzwerk (vorher am Gerät testen)
6. Modul-Gerüst + Darts
