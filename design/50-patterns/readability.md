---
id: pattern-readability
title: Readability
kind: pattern
tags: [readability, salience, signposting, affordance, contrast, clarity, legibility, ui]
summary: The player must instantly find the avatar, read the threat, and see the way — salience, signposting, and affordances.
use-when: Anywhere the player might lose the avatar, misread a threat, or miss a path/interaction; setting the visual hierarchy.
composes-with: [pattern-juice-choreography, pattern-emergence, system-telegraphs, system-onboarding]
verify-with: design/JUDGE.md#the-rubric
---

# Readability

**What it is.** Before a game can be fun it must be **legible**: the player
instantly finds their avatar, reads what's dangerous, sees where to go, and knows
what's interactive. Three tools — **salience** (the important thing out-contrasts
everything), **signposting** (the world points the way), **affordances** (a thing
*looks* like what it does). If the player can't read it, no mechanic underneath
matters.

**Player fantasy.** *"I always know what's going on."* The frame parses at a glance;
attention lands where it should; nothing important hides. Confidence, not confusion.

## Why it works

- **The avatar must be the brightest, highest-contrast thing on screen.** It's the
  one object the player tracks every frame; lose it and every input becomes a guess
  (JUICE.md Part 2: a bright lantern avatar on a twilight cliff). This is the
  **salience gate**.
- **Perception is a hierarchy.** The eye goes to contrast, motion, and saturation
  first. Spend that budget on what matters (avatar > threat > pickup > scenery); a
  flat, evenly-toned frame gives the eye nowhere to land (JUDGE.md rubric 1 & 2).
- **Affordances are a free tutorial.** A ledge that *looks* grabbable, a door that
  *looks* openable, a red spike that *reads* as death — the world teaches without
  text ([[system-onboarding]]).
- **Emergence needs legibility to be fair.** Interacting systems ([[pattern-emergence]])
  are only fun when the player can *foresee* the interaction — Into the Breach shows
  exactly what resolves. Unreadable emergence is just chaos.

## Levers

| Lever | Tool | Example |
|---|---|---|
| **Value contrast** | Salience | Bright avatar over a low-key ground |
| **Colour role** | Palette convention | Red = threat, gold = reward, blue = safe (kept consistent) |
| **Silhouette** | Shape reads before colour | Distinct enemy silhouettes; contour/autotile terrain masses |
| **Motion** | Draws the eye | The one thing moving is the thing to watch ([[pattern-juice-choreography]]) |
| **Telegraphs** | Signpost threat *in time* | ~0.45s flash before an attack ([[system-telegraphs]]) |
| **Composition** | Foreground/mid/background | Depth so objects don't float in a void (JUDGE.md rubric 2) |
| **Chrome restraint** | HUD out of the way | Framed, unobtrusive, nothing clipped (JUDGE.md rubric 6) |

## Applied across genres

| Genre | The read that must hold |
|---|---|
| **Bullet hell** ([[genre-bullet-hell]]) | Dense patterns that still *read* as coherent — density ≠ illegibility (FUN.md §7) |
| **Action-adventure** ([[genre-action-adventure]]) | The attack telegraph (~0.45s) makes reactive play possible (FUN.md §4) |
| **Tactics** ([[genre-tactics]]) | Perfect information *shown* honestly — telegraphed grid you can read (FUN.md §12) |
| **Tower defense** ([[genre-tower-defense]]) | The range ring is the genre's most important UI (FUN.md §8) |
| **City builder** ([[genre-city-builder]]) | The live "+N" under the cursor IS the UI (FUN.md §17) |
| **Precision platformer** ([[genre-precision-platformer]]) | Avatar out-contrasts scenery; a gap reads as jumpable |
| **Horde survival** ([[genre-horde-survival]]) | The avatar findable inside a screen-filling swarm |

## Overdone when…

- **Juice buries the read.** Particles and shake so heavy the avatar is lost — feel
  fighting readability, and readability must win ([[pattern-juice-choreography]]).
- **The flat gray frame.** No value range, no focal point — the eye has nowhere to
  go (the judge's most common failure: "empty / evenly-gray", JUDGE.md rubric 2).
- **Convention drift.** Red means threat here and reward there — the player's learned
  colour language now lies. Keep roles consistent.
- **Over-signposting.** Arrows, glows, and tooltips on everything — nothing stands
  out because everything shouts. Salience is a *budget*; spend it on the one thing.
- **Decorative clutter over the play space.** Foreground detail that occludes the
  avatar or reads as interactive when it isn't (false affordance).

## Verify / feel-gate link

Readability has a **mechanical floor and a taste ceiling** — both are gated:

- **Salience gate (floor).** `salienceIssues(world.render(), avatarFill, background)
  .length === 0` (JUICE.md Part 3, `npm run feel`) proves the avatar out-contrasts
  the scenery *pre-lighting*. Note the Regalia AA contrast guarantee holds pre-lighting
  only — judge lit contrast from the rendered PNG, never the hexes (JUDGE.md rubric 2).
- **The vision judge (ceiling).** `npm run judge` — a multimodal model looks at the
  actual pixels and scores **Readability** (rubric 1) and **Depth & composition**
  (rubric 2). The gates can pass while the image still reads empty (one game's
  invisible parallax mountains passed both gates; only the judge caught it).
- **Telegraph honesty** ([[system-telegraphs]], FUN.md §4/§12) — the read must arrive
  *in time*: assert the tell precedes the hit by the reaction window.

## Worked micro-example

*"A twilight-cliff platformer where the player never loses themselves."* The ground is
low-key by design (mood), which is exactly the trap — the avatar can vanish into it.
Fix it with a salience budget: (1) the avatar is the single **brightest, highest-
contrast** token (a bright lantern on the dark cliff), so the eye locks to it every frame; (2)
threats own **red**, pickups own **gold**, kept consistent so the colour language
never lies; (3) a real **background layer** (a graded night sky, a moon, layered
ridges) gives depth so nothing floats in a void. Prove it two ways:
`salienceIssues(...)` passes *pre-lighting* (the mechanical floor), then `npm run
judge` looks at the pixels and scores Readability and Depth ≥ 4 — the gate that caught
those invisible mountains the salience check couldn't.

## Composes with

- [[pattern-juice-choreography]] — the constant tension partner; juice must serve
  the read, never bury it.
- [[system-telegraphs]] — signposting threat *in time* is the combat face of
  readability.
- [[pattern-emergence]] — interacting systems are only fair when their interactions
  are foreseeable (legible).
- [[system-onboarding]] — affordances are the wordless tutorial; readability is how
  a game teaches itself.

## See also

- [`design/JUDGE.md`](../JUDGE.md) — the vision judge; rubric axes 1, 2 & 6 are
  this pattern scored from pixels. **The** reference here.
- [`design/JUICE.md`](../JUICE.md) Part 2 & 3 — the salience rule and the
  `salienceIssues` gate.
