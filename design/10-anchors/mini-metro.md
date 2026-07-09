---
id: anchor-mini-metro
title: Mini Metro
kind: anchor
tags: [minimalist, systemic, elegance, abstract, tuning]
summary: A transit puzzle stripped to lines, stations, and rising demand — minimalist systemic elegance; every element earns its place.
use-when: You want maximum depth from minimum parts — the discipline of subtraction.
composes-with: [genre-abstract-strategy, pattern-restraint-and-negative-space, system-difficulty-and-dda]
anchors: [anchor-mini-metro]
verify-with: design/JUDGE.md
---

**What it is.** Draw subway lines between geometric stations to move commuters before any station overflows. Three or four systems — routing, throughput, rising demand — and nothing else.

**Player fantasy / why it's fun.** You are the invisible hand behind a living city, and every clean solution you draw looks like the diagram you'd frame on a wall. The board slowly outgrows your plan; you re-plan under pressure and feel smart doing it.

## Design DNA

The compressed essence, in one breath: **few systems, total legibility, monotone rising load, score-attack loop.**

- **Subtraction is the design.** Every removable element has been removed. What remains is load-bearing. This is the opposite of [[antipattern-feature-soup]] and [[antipattern-false-depth]].
- **Depth comes from interaction, not count.** Three systems that multiply beat ten that sit side by side. See [[pattern-emergence]] and [[system-emergent-systems]].
- **The read is instant.** A circle, a triangle, a line — shape *is* rule. No legend, no tooltip. See [[pattern-readability]].
- **Pressure is a curve, not an event.** Demand rises smoothly; the failure state (overcrowding) is always visible and always approaching. See [[pattern-pacing-and-tension]].
- **One loop, replayed for score.** No campaign, no unlock wall — a weekly seed and a leaderboard. See [[system-session-structure]] and [[system-achievements-and-leaderboards]].

## Load-bearing structures

| Structure | Why it works |
| --- | --- |
| **Shape-as-passenger** (circle wants circle) | Zero-legend legibility; the routing rule is readable at a glance. [[pattern-readability]] |
| **Rising demand** (new stations, new shapes over time) | A single monotone difficulty ramp; no spikes, no cliffs. [[system-difficulty-and-dda]] · [[pattern-escalation-and-payoff]] |
| **Overcrowding clock** (station fills → game over) | One legible fail condition creates all the tension. [[pattern-fairness-and-trust]] · [[pattern-pacing-and-tension]] |
| **Scarce assets** (lines, carriages, tunnels drip in weekly) | Every choice is a real trade under a hard cap. [[pattern-meaningful-choice]] · [[system-resource-loops]] |
| **Redraw-anytime lines** | Low-friction planning; the puzzle is continuous, not turn-gated. [[system-camera-and-controls]] |
| **Weekly seed + score** | Session-length loop with a reason to return. [[system-session-structure]] · [[pattern-mastery-and-flow]] |
| **Negative space as the canvas** | The empty map is the readable field the network draws on. [[pattern-restraint-and-negative-space]] |

## What to steal

- **The legibility bar.** Before adding any element, ask: does it read without a tooltip, from a still frame? If not, cut it or re-encode it as shape/color/motion. This is your [[pattern-readability]] gate — proof lives in [[design/JUDGE.md]].
- **The subtraction pass.** Ship the smallest system set that still produces emergence. Count your systems; if two do the same job, merge them. Guard against [[antipattern-second-system]].
- **The single rising curve.** One monotone load ramp beats hand-tuned levels for a systemic game. Tie failure to a visible, always-approaching threshold. See [[system-difficulty-and-dda]] and avoid [[antipattern-difficulty-cliff]].
- **The scarce-asset economy.** Drip resources against demand so every allocation is a trade. See [[system-economy]] and [[pattern-risk-reward]].
- **The score-attack shell.** A seed, a run, a number, a board — the whole meta. Cheap to build, deep to master. See [[system-achievements-and-leaderboards]].

## What's just theme (drop it)

- **Trains, subways, commuters.** The mechanic is *route-constrained flow under rising load.* Reskin freely — pipes, blood vessels, delivery drones, signal networks. See [[world-theme-vectors]].
- **The specific cities.** Real-world maps are flavor; a procedural station field works as well. See [[system-procgen-design]].
- **The muted flat palette.** Iconic, not essential — though the *discipline* it signals (see [[world-aesthetic-direction]]) is worth keeping.
- **The gentle audio.** Generative ambient sells the calm, but the systemic clarity would survive silence.

## Composes into

- [[genre-abstract-strategy]] — its native home: pure systems, no fiction weight.
- [[genre-city-builder]] and [[genre-management-tycoon]] — the flow-under-pressure core scales up.
- [[genre-tower-defense]] — routing + rising waves is the same skeleton with combat bolted on.
- [[genre-incremental]] — the monotone curve and score loop generalize to numbers-go-up.
- Systems it feeds: [[system-resource-loops]], [[system-difficulty-and-dda]], [[system-emergent-systems]], [[system-session-structure]].

## Twist seams

- **Mini Metro but the map is your own city, live** *(theme)* — seed the station field from real geodata (your actual home town), so the abstract network overlays a place you know. The routing mechanic is untouched; the emotional register shifts from puzzle to portrait. Keep the deterministic seed so it stays a fair board — see [[system-procgen-design]].
- **Minimalist systemic but two players share one network** *(perspective)* — one drives lines, one allocates scarce carriages/tunnels, and neither can win alone. The legibility bar now has to survive a split attention field. See [[system-coop-and-competition]] and [[genre-coop-chaos]]; watch for the readability tax that [[antipattern-unreadable-juice]] warns about when two cursors move at once.
- **Mini Metro but the demand fights back** *(agency)* — passengers reroute, boycott slow lines, or clump adversarially, turning the load curve into a soft opponent. Adds a light [[system-enemy-ai]] pressure without breaking the calm.
- **Score-attack but every run rewrites the ruleset** *(structure)* — a roguelike draft of one new constraint per week (no bridges; double demand; teleport stations). See [[system-meta-progression]] and [[anchor-into-the-breach]] for constraint-as-content done tight.

## See also

- [[anchor-into-the-breach]] — the other master of legible, minimal, fully-readable systemic tension.
- [[anchor-tetris]] — rising load + one clean fail condition + score-attack, decades earlier.
- [[anchor-factorio]] — the maximalist opposite: flow networks with everything *added* back in.
- [[pattern-restraint-and-negative-space]] and [[pattern-readability]] — the two patterns this anchor exists to demonstrate.
- [[genre-abstract-strategy]] — the genre page for pure-system design.
- [[process-the-twist]] — how to take the "X but Y" seams above into a brief.
