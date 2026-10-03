---
project: wahl-navi
locale: en
summary: "A local voting advice tool that makes answers and party positions comparable. Now available as a demo using fictional election data."
role: "Application implementation and portfolio revision"
team: "Collaboration within the project team"
context: "Cooperation between Zukunft Bottrop and Hochschule Ruhr West"
period: "Development in 2025; revised in September 2026"
video:
  src: /projects/wahl-navi/questionnaire-results.mp4
  poster: /projects/wahl-navi/questionnaire-results.webp
  width: 954
  height: 536
  caption: "Wahl-Navi: from questionnaire to results"
  description: "Answer statements, open additional information, change their weight and explore the results with explanations from the parties."
---

## Making local political positions comparable

Wahl-Navi helps people compare their own positions with those of political parties. The application was developed for the 2025 local election in Bottrop and was also adopted by WAZ Essen with its own local content. I revised it for my portfolio in September 2026. The current live demo uses only fictional election data.

## My contribution

I implemented the application, from the Angular interface and questionnaire to the evaluation and preparation of the election data. Developing and reviewing the political statements was part of the project team's editorial work. My focus was on turning those statements into a clear interaction flow.

Users answer statements, can skip them and give extra weight to topics they consider particularly important. The result shows how closely their answers match each party's positions. They can then compare individual positions and explanations. Answers and weights can also be changed directly from the results view. In the current demo, progress is saved in the browser.

<figure class="project-media">
  <img src="/projects/wahl-navi/results.webp" alt="Results list showing match percentages for fictional parties and a comparison of their answers." width="1600" height="1000" loading="lazy" />
  <figcaption>Results view of the portfolio demo with fictional parties.</figcaption>
</figure>

## A result you can trace back to its answers

A percentage alone does not explain how it was calculated. That is why I connected the overview to the answers and party positions behind it. I wanted the parties to be easy to compare: the current interface uses the same visual and interaction patterns for all of them. I largely limited individual colours to recognisable elements such as logos.

The calculation follows a clear rule: only identical answers count as a match. Statements with extra weight count twice; skipped statements do not count at all. Neutral is a separate answer, not half a match. For example, one matching answer with double weight and one differing answer with normal weight produce a rounded result of 67 percent.

<aside class="project-explainer project-score" aria-labelledby="score-example-title">
  <p id="score-example-title" class="eyebrow">An example with two statements</p>
  <table class="project-score-table">
    <thead><tr><th scope="col">Answer</th><th scope="col">Weight</th><th scope="col">Points</th></tr></thead>
    <tbody>
      <tr><th scope="row">Matching</th><td>× 2</td><td>2</td></tr>
      <tr><th scope="row">Differing</th><td>× 1</td><td>0</td></tr>
    </tbody>
  </table>
  <p class="project-score-result">
    <span><strong>2 out of 3</strong><span>possible points</span></span>
    <span class="project-score-arrow" aria-hidden="true">→</span>
    <span><strong>67 %</strong><span>match, rounded</span></span>
  </p>
  <p class="project-score-rule">Only identical positions count as a match. Skipped statements do not count.</p>
</aside>

## Updating content independently of the interface

The election content is maintained in Excel. In the portfolio version, a Python import validates the data and generates YAML for the application. This allows a new election dataset to be added without rebuilding the interface. Each build uses one dataset.

The revision also adds data validation, a more reliable way to resume the questionnaire and automated checks. The practical benefit remains the priority: maintaining content, taking a break from the questionnaire and understanding the basis of a result. The original real-world use and the later demo are two distinct stages of the project.

<p><a href="https://www.hochschule-ruhr-west.de/news/news_2025/wahl-navi-bottrop-als-orientierungshilfe-fuer-die-kommunalwahl-gestartet" target="_blank" rel="noreferrer">HRW article on its use in the local election (in German) ↗</a></p>
