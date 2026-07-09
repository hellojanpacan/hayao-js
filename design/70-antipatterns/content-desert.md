---
id: antipattern-content-desert
title: Content Desert
kind: antipattern
tags: [open-world, pacing, space, filler]
summary: A big empty world padded with distance — traversal masquerading as content, with nothing to find.
use-when: You are scaling up world size and worrying it feels thin.
composes-with: [system-map-and-navigation, pattern-pacing-and-tension, world-level-as-story]
verify-with: design/FUN.md#3-·-metroidvania
---

**What it is.** You grew the map, not the game. Minutes of empty traversal sit between beats, and the space in between says **nothing** — no reward, no story, no decision. The size number went up; the density went down.

**Why it hurts.** Travel is not content. A player crossing dead ground is a player waiting, and waiting is where they quit. Big worlds set an implicit promise — *there is something out there* — and an empty one breaks it every stride.

## The smell

**Distance stands in for design.** When someone asks "is there enough to do?" and the answer is "the map is huge," you have already lost. Bigger became the plan.

## How it happens

- **Scope-as-progress.** Square kilometers are easy to measure and impressive in a pitch; **beats-per-minute** is the metric that actually matters and nobody tracked it.
- **Procgen without a budget.** A generator tiles terrain forever, but content is hand-placed and finite, so the ratio of stuff-to-space collapses as the world grows. See [[system-procgen-design]].
- **Copy-paste density.** The same camp, the same shrine, the same three-enemy ambush stamped every 300 meters — technically full, experientially empty. This is [[antipattern-boring-optimal]] wearing a map.
- **Traversal built for scale, then abandoned.** Fast travel gets bolted on late precisely because the between-space failed; the game admits its own desert.

## The tell

Spot it in **your own** design before a player does:

| Signal | What it means |
|---|---|
| You describe the world by its size, not its beats | Scope replaced design |
| A straight run between two objectives has zero decisions | Dead corridor, not a path |
| You added fast travel to "fix pacing" | You are papering over a desert |
| Removing a region changes nothing the player would miss | That region was never content |
| Your [[system-map-and-navigation]] is mostly blank between icons | The blanks say nothing |
| Playtesters skip the middle to reach the marker | The middle is a tax — see [[antipattern-backtracking-tax]] |

Cheap probe: walk any two adjacent beats and count the **meaningful decisions** in between — a fork, a risk, a lookout, a secret. Zero means desert.

## The fix

Density over size. Shrink the map until every screen earns its place, then let the space itself carry meaning.

- **Make space tell story.** Every vista, ruin, and route is a sentence. Compose the level as narrative, not backdrop — [[world-level-as-story]]. A silent world is a wasted one; give it [[world-mood-and-atmosphere]] and a [[world-motif-and-symbol]] so the walk *reads*.
- **Author the rhythm.** Alternate tension and rest on purpose so travel becomes recovery between spikes, not filler — [[pattern-pacing-and-tension]]. Empty stretches are legitimate *only* as deliberate negative space: [[pattern-restraint-and-negative-space]].
- **Reward the between.** Seed the corridors with things worth the detour — [[system-collectibles]], [[system-quests-and-objectives]] beats, an [[pattern-opening-hook]] visible from afar that pulls you off the road. Curiosity, not distance, should move the player.
- **Gate with ability, not kilometers.** A metroidvania keeps its world small and dense by locking regions behind traversal verbs, so old space re-opens with new meaning instead of new emptiness — [[genre-metroidvania]], [[system-map-and-navigation]].
- **Turn traversal into a toy.** If crossing ground is fun to *do* — [[mechanic-grapple]], [[mechanic-glide]], [[mechanic-swing]] — the between earns itself. But movement joy is a supplement to content, never a substitute for it.
- **Set the density budget first.** Decide beats-per-minute in the brief, then size the world to fit it — [[process-intent-to-brief]], [[process-pillars]]. Grow the map only when you have content to fill the growth.

## Twist seams

- **Open world but every point of interest is visible from every other** (twist vector: line-of-sight replaces the map — the horizon is the quest log, à la *Breath of the Wild*'s "see it, go there").
- **Vast map but it contracts as you learn it** (twist vector: mastery shrinks distance — shortcuts, mounts, and knowledge fold the desert down, the way [[anchor-dark-souls]] laces a compact world into itself).
- **Emptiness but the emptiness is the content** (twist vector: negative space as the whole point — a [[genre-walking-sim]] where silence is authored dread, not absent design; see [[anchor-outer-wilds]] rewarding curiosity over any handhold).

## Seen in…

- **Early open-world sprawl** (mid-2010s Ubisoft-style maps): towers, icons, filler between — the genre's cautionary tale of size beating substance.
- **Weak *No Man's Sky* at launch:** infinite planets, near-identical after the first — procgen scale without a content budget, later patched toward density.
- **Counter-examples worth studying:** [[anchor-outer-wilds]] (a tiny solar system where every rock hides a beat), [[anchor-dark-souls]] (a small world folded dense), [[anchor-minecraft]] (infinite space, but *you* author the content). [[anchor-hades]] keeps its world compact and beat-packed by design.

## Verify / guard

Prove density, don't assert it. Treat the pacing map as a first-class artifact and check beats-per-minute before handoff.

- Design pointer: [[pattern-pacing-and-tension]], [[world-level-as-story]], [[process-refine-and-handoff]].
- Verify with `design/FUN.md#3-·-metroidvania` — the metroidvania fun-gate is where dead space gets caught: it asks whether the world stays dense as it scales.
