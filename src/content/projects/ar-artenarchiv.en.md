---
project: ar-artenarchiv
locale: en
summary: "Encounter extinct and possibly extinct animals in mixed reality. Interact with your hands and explore information directly in your real surroundings."
role: "Implementation, UI and XR interaction"
team: "Two-person team. My partner: models and animations; me: technical integration"
context: "VR/AR course module, four-week project"
period: "April to May 2026"
video:
  src: /projects/ar-artenarchiv/select-place.mp4
  poster: /projects/ar-artenarchiv/select-place.webp
  width: 1280
  height: 720
  caption: "AR-Artenarchiv: placing a dodo in your surroundings"
  description: "Open the animal menu, select the dodo by direct touch, choose a target position and place it in the real surroundings."
---

## An encounter with vanished animals

A life-sized rhinoceros and a small golden toad on the hand create very different encounters. With AR-Artenarchiv, I use these differences in scale and proximity as a starting point for exploring species extinction. The mixed-reality application for Meta Quest 3 keeps the real surroundings visible and adds virtual animals and information panels.

The project was created within a four-week timeframe in a VR/AR course module. In our two-person team, I implemented the entire application, including the user interface and interaction. My project partner created the models and animations, which I integrated into the application.

## Select, place and explore

The application is controlled with the hands. A gesture with the left hand opens the animal menu. Its spatial buttons can be pressed directly with a finger. We wanted this "poking" interaction to feel as immediate as pressing a physical button.

For ground animals, a target ray indicates a possible position on a surface; a pinch confirms placement. The golden toad has its own interaction mode: it appears on the back of a flat, open hand. This gives both large and small animals a suitable way to be encountered.

<figure class="project-media project-media-pair">
  <img src="/projects/ar-artenarchiv/golden-toad.webp" alt="A small virtual golden toad sits on the back of an upward-facing hand outdoors." width="1600" height="913" loading="lazy" />
  <img src="/projects/ar-artenarchiv/rhino.webp" alt="A life-sized virtual rhinoceros stands on the paved ground of a real courtyard." width="1600" height="900" loading="lazy" />
  <figcaption>A golden toad on the back of the hand and a life-sized rhinoceros: different forms of spatial proximity.</figcaption>
</figure>

To make the animals respond to the actual room, I integrated the Quest's room scan. The application loads the captured floor, wall, ceiling and table surfaces. If no room data is available yet, it requests a scan. I use this data for placement on real surfaces and to define the boundaries of the animals' movement.

I linked the imperial woodpecker's flight area and the thylacine's roaming area to the detected dimensions of the indoor space. The imperial woodpecker flies independently through this area, changes direction and turns to face its direction of flight. It avoids detected obstacles. The thylacine roams along the ground, with its movement also following the room boundaries and obstacles. This lets the animals move within the surroundings where I am encountering them.

For places without complete room data, I provided a fixed movement area. The courtyard recording shows the imperial woodpecker in flight and turning in front of the garages.

<figure class="project-media project-video">
  <video controls playsinline preload="none" poster="/projects/ar-artenarchiv/woodpecker-turn.webp" width="1280" height="720" aria-label="Imperial woodpecker flying in front of the garages" aria-describedby="woodpecker-turn-description">
    <source src="/projects/ar-artenarchiv/woodpecker-turn.mp4" type="video/mp4" />
    <a href="/projects/ar-artenarchiv/woodpecker-turn.mp4">Open video as MP4</a>
  </video>
  <figcaption>
    <strong>The imperial woodpecker changes direction</strong>
    <p id="woodpecker-turn-description">The imperial woodpecker flies through the real courtyard, turns in front of the garages and faces its new direction of flight.</p>
  </figcaption>
</figure>

One animal takes centre stage at a time. I use the information panel to complement the encounter with details about its origin, threats and conservation status.

<figure class="project-media">
  <img src="/projects/ar-artenarchiv/dodo-info.webp" alt="A virtual dodo in a real indoor space with an information panel about its origin, threats and conservation status." width="1600" height="900" loading="lazy" />
  <figcaption>The dodo appears in the real surroundings; a panel adds information about the animal.</figcaption>
</figure>

## An outline instead of rough occlusion

An important question during testing was what happens when the real hand is in front of a virtual object. We compared a rendering approach that leaves the real hand visible within the overlapping area with an outline around the hand.

The occlusion we tried looked too rough and visually unconvincing to us. The outline worked better for us: it showed the position of the hand and helped us feel that we were interacting with our own hands. That is why we chose the outline. In the finished application, it appears specifically where the hand overlaps virtual content.

<figure class="project-media project-video">
  <video controls playsinline preload="none" poster="/projects/ar-artenarchiv/hand-outline.webp" width="1280" height="720" aria-label="Hand rendering and golden toad" aria-describedby="hand-outline-description">
    <source src="/projects/ar-artenarchiv/hand-outline.mp4" type="video/mp4" />
    <a href="/projects/ar-artenarchiv/hand-outline.mp4">Open video as MP4</a>
  </video>
  <figcaption>
    <strong>Hand rendering and switching to the golden toad</strong>
    <p id="hand-outline-description">Hand rendering while using the virtual menu, followed by a switch to the golden toad on the hand.</p>
  </figcaption>
</figure>

## Evaluating the experience in the headset

We were already familiar with Godot. What was new was evaluating interaction and perception directly on the Quest. Hand tracking, spatial buttons and the combination of real and virtual content were difficult to assess on a PC alone. Repeatedly installing the application and putting on the headset interrupted the workflow; later, remote deployment over Wi-Fi made testing easier.

The result is an interactive educational demo with five virtual animals. For a follow-up project, we would test on the target device earlier and present the experience more as a connected exhibition. Sound and spatial stations are possible extensions, rather than features of the current result.
