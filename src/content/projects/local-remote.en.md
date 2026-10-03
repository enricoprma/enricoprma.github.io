---
project: local-remote
locale: en
summary: "Change the volume and control your PC from bed: your smartphone becomes a remote control for Windows in the browser."
role: "Concept and complete implementation"
team: "Solo project"
context: "Personal project"
period: "September 2026"
video:
  src: /projects/local-remote/phone-controls-pc.mp4
  poster: /projects/local-remote/phone-controls-pc.webp
  width: 532
  height: 320
  caption: "Local-Remote: smartphone and PC working together"
  description: "Smartphone and Windows PC together: connect via QR code and control the PC through the mobile interface."
---

## Changing the volume from bed

The idea for Local-Remote came from watching Netflix in bed. The film was playing on my PC, but it was difficult to judge the right volume from my desk. I got up, changed it, lay back down and had to adjust it again. I also wanted to start the next episode or skip ahead without going to the PC every time.

That led to a simple question: could my smartphone become a remote control without needing an extra app? Local-Remote turns the browser into a wireless touchpad and keyboard for Windows.

## From connection to control

I designed and implemented the project on my own. A small desktop application provides the connection; the smartphone only needs a browser. Both devices are on the same local network. A QR code opens the connection page, with a six-digit pairing code as an alternative.

The mobile interface supports mouse movement, clicks, scrolling, dragging and text input, as well as volume and navigation keys. This lets me control the PC directly without a specific Netflix integration. The application sends Windows input; it does not stream the PC screen to the smartphone.

<figure class="project-media project-media-pair project-phone-pair">
  <img src="/projects/local-remote/pairing.webp" alt="Mobile pairing page with an input field for a six-digit code." width="591" height="1280" loading="lazy" />
  <img src="/projects/local-remote/touchpad.webp" alt="Mobile control interface with a large touchpad, volume keys and navigation keys." width="591" height="1280" loading="lazy" />
  <figcaption>Code-based pairing and the mobile control interface with volume and navigation keys.</figcaption>
</figure>

## Gestures need to work when fingers lift too

Recognising gestures meant distinguishing more than the direction of a finger movement. A quick tap with one finger triggers a left click; moving it controls the mouse pointer. Adding a second finger can lead to a right click or scrolling. Three fingers allow dragging.

The transitions were particularly important to me. Lifting a finger or cancelling an input must not trigger an unintended new action. That is why I explicitly accounted for these situations in the gesture recognition. After scrolling or dragging, all fingers must be lifted before a new gesture can begin.

<figure class="project-explainer project-gesture-flow" aria-labelledby="gesture-flow-title">
  <figcaption id="gesture-flow-title" class="eyebrow">From touch to action</figcaption>
  <ol class="gesture-flow-stages">
    <li class="gesture-flow-stage">
      <p class="gesture-flow-node"><strong>One finger touches down</strong></p>
      <ul class="gesture-flow-branches">
        <li><span>Tap briefly and release</span><span class="gesture-flow-arrow" aria-hidden="true">↓</span><strong>Left click</strong></li>
        <li><span>Move</span><span class="gesture-flow-arrow" aria-hidden="true">↓</span><strong>Move the mouse pointer</strong></li>
      </ul>
    </li>
    <li class="gesture-flow-stage">
      <p class="gesture-flow-transition" aria-hidden="true">↓</p>
      <p class="gesture-flow-node"><strong>A second finger joins</strong></p>
      <ul class="gesture-flow-branches">
        <li><span>Tap briefly with both and release</span><span class="gesture-flow-arrow" aria-hidden="true">↓</span><strong>Right click</strong></li>
        <li><span>Move together</span><span class="gesture-flow-arrow" aria-hidden="true">↓</span><strong>Scroll</strong></li>
      </ul>
    </li>
  </ol>
  <p class="gesture-flow-continuation"><span aria-hidden="true">↓</span> <span>A third finger joins</span> <span aria-hidden="true">→</span> <strong>Drag</strong></p>
  <p class="gesture-flow-note">If the second finger joins while a movement is already in progress, the gesture switches directly to scrolling.</p>
  <p class="gesture-flow-reset">After scrolling or dragging: lift all fingers, then begin a new gesture.</p>
</figure>

## Cancellation is part of the interaction too

A connection problem must not leave a mouse button permanently pressed. I therefore made the desktop application release a drag after 15 seconds without movement. This is a deliberate compromise: holding still for a long time also ends the drag, so it has to be started again.

Technically, the input travels from a touch event in the browser via HTTP and Express to RobotJS, which performs the Windows input. The result is a portable Windows application for a personal everyday problem. It is designed for trusted local networks; transmission is unencrypted. For me, the interesting part of its development is combining easy access with carefully handled interaction flows.
