# Kabelplan – Schnittstellen (Version 2.2)

Alle Formate sind JSON. Der Kabelplan erkennt sie beim Laden über das Feld `kind`.

## 1. Lager → Kabelplan: `kleem-lager-job`

```json
{
  "kind": "kleem-lager-job", "v": 1,
  "job": { "id": 42, "name": "Gala Hofburg", "kunde": "ABC", "von": "2026-11-03", "bis": "2026-11-05", "ort": "Wien" },
  "positionen": [
    { "typ": "artikel",  "kabelplan_id": "lib-aw-ue160", "hersteller": "Panasonic", "bezeichnung": "AW-UE160", "menge": 5, "zumiete": false },
    { "typ": "zubehoer", "bezeichnung": "Netzteil UE160", "menge": 5 },
    { "typ": "frei",     "bezeichnung": "Techniker", "menge": 2 }
  ],
  "inventar": [ { "kabelplan_id": "lib-aw-ue160", "bestand": 4 } ]
}
```

- Nur `typ: "artikel"` wird zu Geräten im Plan. Zubehör und Freipositionen werden übersprungen, weil der Kabelplan Kabel und Zubehör selbst erzeugt.
- Zuordnung: zuerst über `kabelplan_id`, sonst über Hersteller + Bezeichnung (exakt, Alias, dann eindeutige Teilübereinstimmung).
- `inventar` (optional) setzt die Lagerstückzahlen in der Kabelplan-Bibliothek.
- Mit `kind: "kleem-lager-inventar"` und nur `inventar` werden nur die Stückzahlen aktualisiert.
- Gibt es zur `job.id` schon einen Plan, fragt der Kabelplan: ersetzen oder neu anlegen.

## 2. Kabelplan → Lager: `kleem-kabelplan-packliste`

Erzeugt über Packliste → „An Lager übergeben“.

```json
{
  "kind": "kleem-kabelplan-packliste", "v": 1,
  "plan": { "id": "…", "name": "…", "lager": { "jobId": 42, "von": "…", "bis": "…" } },
  "geraete":  [ { "kabelplan_id": "lib-aw-ue160", "hersteller": "Panasonic", "bezeichnung": "AW-UE160", "menge": 4, "zumiete": false } ],
  "kabel":    [ { "bezeichnung": "SDI 12G · BNC", "menge": 12 } ],
  "zubehoer": [ { "bezeichnung": "Modul QSFP28 100G LR4 (Singlemode)", "menge": 2 } ],
  "cases":    [ { "bezeichnung": "Rack A", "typ": "Rack 4 HE" } ],
  "software": [ { "name": "QLab", "menge": 1, "rechner": ["Apple MacBook Pro 16\" #1"] } ]
}
```

## 3. Kabelplan → Companion-Builder: `kleem.kabelplan.export` v1

- Wird bei jeder Änderung in `localStorage["kleem.kabelplan.export.v1"]` geschrieben. Jede App unter derselben Adresse (https://klaus-kleem.github.io/…) kann das lesen.
- Zusätzlich als Datei über Pläne → „Für Companion exportieren“ (nur aktueller Plan).

```json
{
  "kind": "kleem.kabelplan.export", "v": 1, "app": "2.3", "updated": "ISO-Zeit", "current": "<planId>",
  "plans": [ {
    "id": "…", "name": "…", "format": "HD|4K", "lager": null,
    "devices": [ {
      "id": "…", "label": "Panasonic AW-UE160 #1", "libId": "lib-aw-ue160", "name": "AW-UE160", "mfr": "Panasonic",
      "group": "Kamera", "os": "", "rent": false, "power": "Netzteil 12 V", "software": [],
      "ports": [ {
        "port": "LAN (PoE++)", "dir": "io", "type": "ETH", "level": "", "conn": "RJ45", "index": 1, "cable": "Ethernet",
        "peer": { "deviceId": "…", "device": "NETGEAR M4350-24X4V", "port": "Port 3", "index": 3 },
        "ip": "192.168.0.10", "ipSource": "job|default", "mask": "", "gw": "", "vlan": "", "host": ""
      } ]
    } ]
  } ]
}
```

- `index` ist die laufende Nummer unter gleichartigen Anschlüssen (z. B. Videohub „In 5“ → index 5) und eignet sich für Router- und Mischer-Eingänge.
- `ip` erscheint nur, wenn eine Adresse gesetzt ist.


## Gemeinsame Ablage am iPad (ab 2.3)

Kabelplan (`index.html`) und Lager (`lager.html`) liegen unter derselben Adresse und teilen sich `localStorage`:

| Schlüssel | schreibt | liest | Inhalt |
|---|---|---|---|
| `kleem.kabelplan.export.v1` | Kabelplan | Companion-Builder | Pläne, Geräte, Anschlüsse, Gegenstellen, IPs (Format oben) |
| `kleem.kabelplan.library.v1` | Kabelplan | Lager | `{devices:[{id,mfr,name,grp,aliases,qty}]}` – Geräteliste fürs Zuordnen |
| `kleem.kabelplan.packlisten.v1` | Kabelplan | Lager | `{plans:[<kleem-kabelplan-packliste>]}` – eine Packliste pro Plan |
| `kleem.lager.export.v1` | Lager | Kabelplan | `{inventar:[{kabelplan_id,bestand}], jobs:[<kleem-lager-job>]}` – Jobs der letzten 90 Tage und künftige |

Die Lagerdaten selbst liegen in IndexedDB (`kleem-lager`), die Kabelplan-Daten in `kleem-kabelplan-v1`.
Datei- und Einfügen-Wege bleiben für die Server-Version des Lagers erhalten.
