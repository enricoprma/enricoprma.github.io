---
project: wahl-navi
locale: de
summary: "Eine kommunale Wahlhilfe, die Antworten und Parteipositionen vergleichbar macht. Heute als Demo mit fiktiven Wahldaten."
role: "Anwendungsimplementierung und Portfolio-Überarbeitung"
team: "Zusammenarbeit im Projektteam"
context: "Kooperation von Zukunft Bottrop und Hochschule Ruhr West"
period: "Entwicklung 2025; Überarbeitung September 2026"
video:
  src: /projects/wahl-navi/questionnaire-results.mp4
  poster: /projects/wahl-navi/questionnaire-results.webp
  width: 954
  height: 536
  caption: "Wahl-Navi: vom Fragebogen zum Ergebnis"
  description: "Thesen beantworten, Zusatzinformation öffnen, Gewichtung ändern und Ergebnis mit Parteibegründungen ansehen."
---

## Lokalpolitische Positionen vergleichbar machen

Wahl-Navi hilft Menschen dabei, ihre eigenen Positionen mit denen von Parteien zu vergleichen. Die Anwendung entstand für die Kommunalwahl 2025 in Bottrop und wurde auch von der WAZ Essen mit eigenen lokalen Inhalten übernommen. Für mein Portfolio habe ich diese im September 2026 überarbeitet. Die heutige Live-Demo verwendet ausschließlich fiktive Wahldaten.

## Mein Beitrag

Ich habe die Anwendung implementiert: von der Angular-Oberfläche über Fragebogen und Auswertung bis zur Aufbereitung der Wahldaten. Die Entwicklung und Prüfung der politischen Thesen gehörten zur redaktionellen Arbeit des Projektteams. Mein Schwerpunkt lag darauf, diese Inhalte in einen verständlichen Bedienablauf zu übersetzen.

Nutzende beantworten Thesen, können sie überspringen und besonders wichtige Themen doppelt gewichten. Das Ergebnis zeigt die Übereinstimmung mit den Parteien. Anschließend lassen sich einzelne Positionen und Begründungen vergleichen. Antworten und Gewichtungen können auch aus der Ergebnisansicht heraus geändert werden. In der heutigen Demo bleibt der Fortschritt im Browser gespeichert.

<figure class="project-media">
  <img src="/projects/wahl-navi/results.webp" alt="Ergebnisliste mit Übereinstimmungswerten für fiktive Parteien und Vergleich ihrer Antworten." width="1600" height="1000" loading="lazy" />
  <figcaption>Ergebnisansicht der Portfolio-Demo mit fiktiven Parteien.</figcaption>
</figure>

## Ein Ergebnis, dessen Grundlage sichtbar bleibt

Eine Prozentzahl allein erklärt noch nicht, wie sie zustande kommt. Deshalb habe ich die Übersicht mit den dahinterliegenden Antworten und Parteipositionen verbunden. Mir war wichtig, die Parteien vergleichbar darzustellen: Die aktuelle Oberfläche verwendet für sie dieselben Darstellungs- und Bedienmuster. Individuelle Farben habe ich weitgehend auf erkennbare Elemente wie Logos begrenzt.

Die Berechnung folgt einer klaren Regel: Nur identische Antworten zählen als Übereinstimmung. Doppelt gewichtete Thesen zählen zweimal, übersprungene Thesen gar nicht. Neutral ist dabei eine eigene Antwort und keine halbe Zustimmung. Eine passende Antwort mit doppeltem Gewicht und eine abweichende Antwort mit einfachem Gewicht ergeben beispielsweise gerundet 67 Prozent.

<aside class="project-explainer project-score" aria-labelledby="score-example-title">
  <p id="score-example-title" class="eyebrow">Ein Beispiel mit zwei Thesen</p>
  <table class="project-score-table">
    <thead><tr><th scope="col">Antwort</th><th scope="col">Gewicht</th><th scope="col">Punkte</th></tr></thead>
    <tbody>
      <tr><th scope="row">Passend</th><td>× 2</td><td>2</td></tr>
      <tr><th scope="row">Abweichend</th><td>× 1</td><td>0</td></tr>
    </tbody>
  </table>
  <p class="project-score-result">
    <span><strong>2 von 3</strong><span>möglichen Punkten</span></span>
    <span class="project-score-arrow" aria-hidden="true">→</span>
    <span><strong>67 %</strong><span>Übereinstimmung, gerundet</span></span>
  </p>
  <p class="project-score-rule">Nur identische Positionen stimmen überein. Übersprungene Thesen zählen nicht mit.</p>
</aside>

## Inhalte unabhängig von der Oberfläche pflegen

Die Wahlinhalte werden in Excel gepflegt. In der Portfolio-Version prüft ein Python-Import die Daten und erzeugt daraus YAML für die Anwendung. Dadurch lässt sich ein neuer Wahldatensatz einbinden, ohne die Oberfläche umzubauen. Pro Build wird ein Datensatz verwendet.

Die Überarbeitung ergänzt außerdem Datenvalidierung, einen verlässlicheren Wiedereinstieg und automatisierte Prüfungen. Der konkrete Nutzen bleibt im Vordergrund: Inhalte pflegen, den Fragebogen unterbrechen und die Grundlage eines Ergebnisses nachvollziehen können. Der ursprüngliche reale Einsatz und die spätere Demo sind zwei klar getrennte Projektstände.

<p><a href="https://www.hochschule-ruhr-west.de/news/news_2025/wahl-navi-bottrop-als-orientierungshilfe-fuer-die-kommunalwahl-gestartet" target="_blank" rel="noreferrer">HRW-Bericht zum Einsatz bei der Kommunalwahl ↗</a></p>
