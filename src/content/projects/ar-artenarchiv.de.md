---
project: ar-artenarchiv
locale: de
---

## Die Idee

Das AR-Artenarchiv macht Artensterben räumlich erfahrbar. Fünf ausgestorbene oder möglicherweise ausgestorbene Tierarten erscheinen in der realen Umgebung. Informationspanels ergänzen die Begegnung um Fakten zu den Arten und ihren Bedrohungen.

## Mein Beitrag

Im Zweierteam habe ich die gesamte Implementierung einschließlich UI und Interaktion übernommen. Dazu gehören die Tierauswahl, die Platzierung per Handtracking und die Einbindung von Raumdaten und Spatial Anchors. Mein Projektpartner übernahm die Modelle und Animationen, die ich in die Anwendung integrierte.

## Die Umsetzung

Die Anwendung nutzt Godot und OpenXR auf der Meta Quest 3. Passthrough hält die reale Umgebung sichtbar; virtuelle Tiere werden darin platziert. Jeweils eine Tierart steht im Mittelpunkt – vom lebensgroßen Nashorn bis zur kleinen Goldkröte auf der Hand.

## Herausforderungen

Handtracking und räumliche Bedienung mussten direkt im Headset getestet werden. Remote Deploy über WLAN erleichterte später die Testabläufe. Für ein Folgeprojekt würden wir diesen Workflow früher nutzen und mehr Zeit für die Abstimmung von Modellen, Animationen und Interaktion einplanen.
