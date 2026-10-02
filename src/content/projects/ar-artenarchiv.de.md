---
project: ar-artenarchiv
locale: de
summary: "Ausgestorbenen und möglicherweise ausgestorbenen Tieren in Mixed Reality begegnen. Mit Handinteraktion und Informationen direkt in der realen Umgebung."
role: "Implementierung, UI und XR-Interaktion"
team: "Zweierteam. Mein Partner: Modelle und Animationen; ich: technische Integration"
context: "Studienmodul VR/AR, vierwöchiger Projektrahmen"
period: "April bis Mai 2026"
video:
  src: /projects/ar-artenarchiv/select-place.mp4
  poster: /projects/ar-artenarchiv/select-place.webp
  width: 1280
  height: 720
  caption: "AR-Artenarchiv: einen Dodo in den Raum setzen"
  description: "Tiermenü öffnen, Dodo direkt auswählen, Zielposition bestimmen und den Dodo in der realen Umgebung platzieren."
---

## Verschwundenen Tieren im eigenen Raum begegnen

Ein Nashorn in Lebensgröße und eine kleine Goldkröte auf der Hand vermitteln sehr unterschiedliche Begegnungen. Mit dem AR-Artenarchiv nutze ich diese räumlichen Unterschiede als Einstieg in das Thema Artensterben. Die Mixed-Reality-Anwendung für die Meta Quest 3 lässt die reale Umgebung sichtbar und ergänzt sie um virtuelle Tiere und Informationspanels.

Das Projekt entstand innerhalb eines vierwöchigen Rahmens im Studienmodul VR/AR. Im Zweierteam habe ich die gesamte Anwendung einschließlich Benutzeroberfläche und Interaktion implementiert. Mein Projektpartner kümmerte sich um Modelle und Animationen, die ich in die Anwendung integrierte.

## Auswählen, platzieren und entdecken

Die Bedienung erfolgt mit den Händen. Über eine Geste der linken Hand wird das Tiermenü geöffnet. Seine räumlichen Buttons lassen sich direkt mit dem Finger drücken. Dieses „Poken“ sollte sich für uns ähnlich unmittelbar anfühlen wie das Drücken eines echten Buttons.

Für Bodentiere zeigt ein Zielstrahl eine mögliche Position auf einer Fläche; ein Pinch bestätigt die Platzierung. Die Goldkröte hat einen eigenen Interaktionsmodus: Sie erscheint auf dem Handrücken einer flach gehaltenen offenen Hand. Große und kleine Tiere erhalten so jeweils eine passende Form der Begegnung.

<figure class="project-media project-media-pair">
  <img src="/projects/ar-artenarchiv/golden-toad.webp" alt="Eine kleine virtuelle Goldkröte sitzt auf dem nach oben gehaltenen Handrücken im Außenbereich." width="1600" height="913" loading="lazy" />
  <img src="/projects/ar-artenarchiv/rhino.webp" alt="Ein virtuelles Nashorn in Lebensgröße steht in einem realen Hof auf gepflastertem Boden." width="1600" height="900" loading="lazy" />
  <figcaption>Goldkröte auf dem Handrücken und lebensgroßes Nashorn: unterschiedliche Formen räumlicher Nähe.</figcaption>
</figure>

Damit die Tiere auf den tatsächlichen Raum reagieren, habe ich den Raumscan der Quest eingebunden. Die Anwendung lädt die erfassten Boden-, Wand-, Decken- und Tischflächen. Sind noch keine Raumdaten vorhanden, fordert sie einen Scan an. Diese Daten nutze ich für die Platzierung auf echten Flächen und als Grenzen für die Bewegung der Tiere.

Den Flugbereich des Kaiserspechts und die Laufzone des Beutelwolfs habe ich an die erkannten Dimensionen des Innenraums gekoppelt. Der Kaiserspecht fliegt selbstständig durch diesen Bereich, wechselt seine Richtung und dreht sich dabei in Flugrichtung. Er weicht erkannten Hindernissen aus. Der Beutelwolf streift am Boden umher und richtet seine Bewegung ebenfalls nach den Raumgrenzen und Hindernissen aus. So bewegen sich die Tiere in der Umgebung, in der ich ihnen gerade begegne.

Für Orte ohne vollständige Raumdaten habe ich einen festen Bewegungsbereich vorgesehen. Die Aufnahme im Hof zeigt den Flug des Kaiserspechts und sein Wenden vor den Garagen.

<figure class="project-media project-video">
  <video controls playsinline preload="none" poster="/projects/ar-artenarchiv/woodpecker-turn.webp" width="1280" height="720" aria-label="Kaiserspecht im Flug vor der Garage" aria-describedby="woodpecker-turn-description">
    <source src="/projects/ar-artenarchiv/woodpecker-turn.mp4" type="video/mp4" />
    <a href="/projects/ar-artenarchiv/woodpecker-turn.mp4">Video als MP4 öffnen</a>
  </video>
  <figcaption>
    <strong>Der Kaiserspecht wechselt die Flugrichtung</strong>
    <p id="woodpecker-turn-description">Der Kaiserspecht fliegt durch den realen Hof, dreht vor den Garagen um und richtet sich in seine neue Flugrichtung aus.</p>
  </figcaption>
</figure>

Jeweils ein Tier steht im Mittelpunkt. Mit dem Informationspanel ergänze ich die Begegnung um Herkunft, Bedrohungen und Schutzstatus.

<figure class="project-media">
  <img src="/projects/ar-artenarchiv/dodo-info.webp" alt="Virtueller Dodo in einem realen Innenraum mit einem Informationspanel zu Herkunft, Bedrohungen und Schutzstatus." width="1600" height="900" loading="lazy" />
  <figcaption>Der Dodo erscheint in der realen Umgebung; ein Panel ergänzt die Begegnung um Artinformationen.</figcaption>
</figure>

## Eine Kontur statt grober Verdeckung

Eine wichtige Frage beim Ausprobieren war, was passiert, wenn die echte Hand vor einem virtuellen Objekt liegt. Wir verglichen eine Darstellung, bei der die reale Hand im überlagerten Bereich sichtbar ausgespart wird, mit einer Kontur um die Hand.

Die ausprobierte Verdeckung wirkte auf uns zu grob und visuell wenig überzeugend. Die Kontur war für uns überzeugender: Sie machte die Position der Hand sichtbar und unterstützte für uns das Gefühl, mit der eigenen Hand zu interagieren. Deshalb entschieden wir uns für die Kontur. In der fertigen Anwendung wird sie gezielt bei Überlagerungen mit virtuellen Inhalten eingeblendet.

<figure class="project-media project-video">
  <video controls playsinline preload="none" poster="/projects/ar-artenarchiv/hand-outline.webp" width="1280" height="720" aria-label="Handdarstellung und Goldkröte" aria-describedby="hand-outline-description">
    <source src="/projects/ar-artenarchiv/hand-outline.mp4" type="video/mp4" />
    <a href="/projects/ar-artenarchiv/hand-outline.mp4">Video als MP4 öffnen</a>
  </video>
  <figcaption>
    <strong>Handdarstellung und Wechsel zur Goldkröte</strong>
    <p id="hand-outline-description">Handdarstellung beim Bedienen des virtuellen Menüs; anschließend Wechsel zur Goldkröte auf der Hand.</p>
  </figcaption>
</figure>

## Im Headset beurteilen

Godot war uns bereits vertraut. Neu war vor allem, Interaktion und Wahrnehmung direkt auf der Quest zu beurteilen. Handtracking, räumliche Buttons und das Zusammenspiel von realen und virtuellen Inhalten ließen sich am PC nur eingeschränkt einschätzen. Das wiederholte Installieren und Aufsetzen des Headsets unterbrach den Arbeitsfluss; später erleichterte Remote Deploy über WLAN die Tests.

Entstanden ist eine interaktive Bildungsdemo mit fünf Tierdarstellungen. Für ein Folgeprojekt würden wir früher auf dem Zielgerät testen und die Präsentation stärker als zusammenhängende Ausstellung gestalten. Sound und räumliche Stationen sind mögliche Erweiterungen, keine Bestandteile des aktuellen Ergebnisses.
