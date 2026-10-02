---
project: local-remote
locale: de
summary: "Vom Bett aus die Lautstärke ändern und den PC bedienen: Das Smartphone wird im Browser zur Fernbedienung für Windows."
role: "Konzeption und vollständige Umsetzung"
team: "Einzelprojekt"
context: "Persönliches Projekt"
period: "September 2026"
video:
  src: /projects/local-remote/phone-controls-pc.mp4
  poster: /projects/local-remote/phone-controls-pc.webp
  width: 532
  height: 320
  caption: "Local-Remote: Smartphone und PC im Zusammenspiel"
  description: "Smartphone und Windows-PC gemeinsam: per QR-Code verbinden und den PC über die mobile Oberfläche bedienen."
---

## Die Lautstärke vom Bett aus einstellen

Die Idee zu Local-Remote entstand beim Netflix-Schauen im Bett. Der Film lief auf meinem PC, doch die richtige Lautstärke ließ sich vom Schreibtisch aus schlecht einschätzen. Ich stand auf, stellte sie um, legte mich wieder hin und musste erneut nachregeln. Auch für die nächste Folge oder zum Überspringen wollte ich nicht jedes Mal zum PC gehen.

Daraus entstand eine einfache Frage: Kann mein Smartphone zur Fernbedienung werden, ohne dass ich darauf eine zusätzliche App installieren muss? Local-Remote macht den Browser zu einem drahtlosen Touchpad und einer Tastatur für Windows.

## Vom Verbinden zur Bedienung

Ich habe das Projekt allein konzipiert und umgesetzt. Eine kleine Desktop-Anwendung stellt die Verbindung bereit; auf dem Smartphone genügt der Browser. Beide Geräte befinden sich im selben lokalen Netzwerk. Ein QR-Code öffnet den Zugang, alternativ lässt sich ein sechsstelliger Kopplungscode eingeben.

Die mobile Oberfläche unterstützt Mausbewegung, Klicks, Scrollen, Ziehen und Texteingabe sowie Tasten für Lautstärke und Navigation. Damit lässt sich der PC direkt bedienen, ohne eine spezielle Integration für Netflix zu benötigen. Es werden Windows-Eingaben ausgelöst; die Anwendung überträgt kein Bildschirmbild auf das Smartphone.

<figure class="project-media project-media-pair project-phone-pair">
  <img src="/projects/local-remote/pairing.webp" alt="Mobile Kopplungsseite mit Eingabefeld für einen sechsstelligen Code." width="591" height="1280" loading="lazy" />
  <img src="/projects/local-remote/touchpad.webp" alt="Mobile Bedienfläche mit großem Touchpad sowie Lautstärke- und Navigationstasten." width="591" height="1280" loading="lazy" />
  <figcaption>Kopplung per Code und mobile Bedienfläche mit Lautstärke- und Navigationstasten.</figcaption>
</figure>

## Gesten müssen auch beim Loslassen stimmen

Bei der Gestenerkennung musste ich mehr unterscheiden als die Richtung einer Fingerbewegung. Ein kurzes Tippen mit einem Finger löst einen Linksklick aus, eine Bewegung steuert den Mauszeiger. Kommt ein zweiter Finger hinzu, kann daraus ein Rechtsklick oder Scrollen werden. Drei Finger ermöglichen das Ziehen.

Besonders wichtig waren mir die Übergänge. Wird ein Finger abgehoben oder eine Eingabe abgebrochen, darf daraus keine unbeabsichtigte neue Aktion entstehen. Deshalb habe ich diese Situationen in der Gestenerkennung ausdrücklich berücksichtigt. Nach dem Scrollen oder Ziehen müssen zunächst alle Finger abgehoben werden, bevor eine neue Geste beginnt.

<figure class="project-explainer project-gesture-flow" aria-labelledby="gesture-flow-title">
  <figcaption id="gesture-flow-title" class="eyebrow">Von der Berührung zur Aktion</figcaption>
  <ol class="gesture-flow-stages">
    <li class="gesture-flow-stage">
      <p class="gesture-flow-node"><strong>Ein Finger setzt auf</strong></p>
      <ul class="gesture-flow-branches">
        <li><span>Kurz tippen und loslassen</span><span class="gesture-flow-arrow" aria-hidden="true">↓</span><strong>Linksklick</strong></li>
        <li><span>Bewegen</span><span class="gesture-flow-arrow" aria-hidden="true">↓</span><strong>Mauszeiger bewegen</strong></li>
      </ul>
    </li>
    <li class="gesture-flow-stage">
      <p class="gesture-flow-transition" aria-hidden="true">↓</p>
      <p class="gesture-flow-node"><strong>Zweiter Finger kommt dazu</strong></p>
      <ul class="gesture-flow-branches">
        <li><span>Beide kurz tippen und loslassen</span><span class="gesture-flow-arrow" aria-hidden="true">↓</span><strong>Rechtsklick</strong></li>
        <li><span>Gemeinsam bewegen</span><span class="gesture-flow-arrow" aria-hidden="true">↓</span><strong>Scrollen</strong></li>
      </ul>
    </li>
  </ol>
  <p class="gesture-flow-continuation"><span aria-hidden="true">↓</span> <span>Dritter Finger kommt dazu</span> <span aria-hidden="true">→</span> <strong>Ziehen</strong></p>
  <p class="gesture-flow-note">Kommt der zweite Finger während einer Bewegung dazu, geht die Geste direkt ins Scrollen über.</p>
  <p class="gesture-flow-reset">Nach Scrollen oder Ziehen: alle Finger abheben, dann eine neue Geste beginnen.</p>
</figure>

## Auch ein Abbruch gehört zur Interaktion

Ein Verbindungsproblem darf keine dauerhaft gedrückte Maustaste hinterlassen. Deshalb habe ich eingebaut, dass die Desktop-Anwendung einen Ziehvorgang nach 15 Sekunden ohne Bewegung löst. Das ist ein bewusster Kompromiss: Auch ein langes unbewegtes Festhalten endet dann und muss neu begonnen werden.

Technisch führt der Weg vom Touch-Ereignis im Browser über HTTP und Express zu RobotJS, das die Windows-Eingabe ausführt. Entstanden ist eine portable Windows-Anwendung für das persönliche Alltagsproblem. Sie ist für vertrauenswürdige lokale Netzwerke ausgelegt; die Übertragung ist unverschlüsselt. Der interessante Teil der Entwicklung liegt dabei in der Verbindung aus einfachem Zugang und sorgfältig behandelten Interaktionsabläufen.
