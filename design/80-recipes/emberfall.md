---
id: recipe-emberfall
title: Emberfall
kind: recipe
tags: [precision-platformer, descent, light, committal-movement, mastery, recipe]
summary: A dying ember falls down a lightless flue; the one flare that lights your way is the one flare that moves you — and spends the life you have left.
use-when: You want a tight, luminous, retry-mastery action game whose single verb is also its scarcity and its sight.
composes-with: [genre-precision-platformer, system-procgen-design, pattern-mastery-and-flow, process-the-spine]
anchors: [anchor-celeste, anchor-spelunky]
spine: "Descend a lightless shaft where your only light IS your only movement IS your only life — mastery of the flare-rhythm."
verify-with: design/FUN.md
---

# Emberfall

**What it is.** You are a guttering ember falling down a vast, cold flue, trying to
reach the hearth at the bottom before you go out. You have exactly one verb — a
**flare-kick** — and it does three things at once: it *lights* a radius so you can
see, it *launches* you in a chosen direction, and it *burns* fuel you can't get
back. Between flares you fall in the dark. The whole game is the rhythm of
flare → read → commit, over and over, deeper.

**Player fantasy / why it's fun.** Not "a platformer in the dark" but "*I am a small
light trying to stay lit long enough to get home, and every time I look, I spend
myself doing it.*" Mastery is learning to flare late enough to conserve, early
enough to survive — reading a hazard in the half-second of light and committing to
a trajectory before the dark closes back in.

## The brief

**Celeste but your dash is your only lantern — and your lantern is your fuel.** One
verb that is sight, motion, and life at once.

## The spine

*Descend a lightless shaft where your only light **is** your only movement **is**
your only life — mastery of the flare-rhythm.*

| Part | This game |
|---|---|
| **Objective** | Reach the hearth at the bottom of the flue |
| **Superpower** | The **flare-kick** — burst that lights a radius *and* launches you a chosen direction |
| **Scarcity** | **Fuel** (each flare burns embers = life) **+ commitment** (light fades in ~1s; the launch can't be cancelled) **+ the constant fall** in the dark between flares |
| **Obstacle** | Soot-chokes that snuff you, wet walls that douse a flare, updrafts, dead-end geometry — all invisible until lit |
| **Renewal** | Procedurally-segmented flue; each segment introduces **one** new element that recombines with the flare (updraft, damp, crosswind) |

## Resonance

Every element traces to the spine. This table **is** the coherence proof — see
[[process-the-spine]].

| Element | Arrow back to the spine |
|---|---|
| Verb: flare-kick | The single agency; sight, motion, and spend fused into one input |
| **Power creates the problem** | Flaring lights *and* commits your arc before the dark returns *and* burns the life you're trying to preserve → looking, moving, and dying are the same act *(passes the gate)* |
| Scarcity: fuel = life | The flare isn't free, so *when to look* is the whole decision |
| Renewal: one new element per segment | Re-poses "read-and-commit in one beat" against a fresh interaction each time |
| Death-handling: instant relight at last hearth-checkpoint | Spine is *retry-mastery*; a punishing death would be **dissonant** ([[antipattern-dissonance]]) |
| Setting: falling down a cold house-flue toward the hearth | Objective made physical — going *home before you go out* |
| Theme: holding a dying light | The mechanic (spend yourself to see) is the metaphor (a small flame's last errand) |
| Feel: warm bloom in the lit radius, near-silence in the dark, frame-tight launch | Mastery demands failure be *yours*; the dark must feel fair, the light must feel precious ([[design/JUICE.md]]) |
| Fuel pickups: stray embers glowing faintly in the dark | The one thing worth flaring *toward* — reward and risk on the same axis ([[pattern-risk-reward]]) |

No row is decoration; no row fights the spine. The gate holds: **you cannot see
without spending the life you're trying to save.**

## The twist applied — *constraint*

The bend that found this spine is a hard **constraint** (see [[process-the-twist]]
as the sub-tool of [[process-the-spine]]): *the light source, the movement, and the
life bar are one resource.* Collapse three systems most games keep separate — vision,
locomotion, health — into a single verb, and the loop falls out on its own. Don't
add a second light or a jump; the constraint is the game.

## The three pillars

Fall out of the spine. Cut anything serving none — see [[process-pillars]].

1. **One verb, three meanings.** Flare = see + move + spend. If you ever add a
   free look or a free jump, you've broken the spine. Guard [[antipattern-feature-soup]].
2. **The dark is fair.** Everything lethal is *readable in the flare* before you
   commit. A hazard you couldn't have seen is [[antipattern-input-lie]], not
   difficulty. Lean on [[system-telegraphs]] and [[pattern-readability]].
3. **Mastery, not attrition.** Death is instant and cheap; the loop rewards a
   better rhythm, never grinding fuel. Guard [[antipattern-fail-loop-tax]] and
   [[antipattern-grind-wall]].

## Scope & first playable

Ruthlessly minimal. One vertical shaft, one hazard type, fuel that is *visible*.

| Layer | First playable | Deliberately deferred |
|---|---|---|
| Verb | flare-kick: lights radius r, launches on aim, burns 1 fuel | charge-flares, wall-kicks, glide |
| Fall | constant downward drift; dark between flares | horizontal chambers, moving flue walls |
| Scarcity | fuel bar = life; 1 flare = 1 fuel; hearths refill + checkpoint | fuel economy, hoarding decisions |
| Obstacle | **one** hazard: soot-choke that snuffs you on contact | wet walls, updrafts, crosswind |
| Renewal | 3 hand-built segments proving read-and-commit | [[system-procgen-design]] segment generator |
| Show | warm bloom in-radius, hard black out-of-radius, ember particle on flare | screen-shake tuning, music bus |

The one beat the first playable must earn: **the held breath before a flare** — the
player hesitating because looking costs life. If that half-second of tension isn't
there with one hazard, more content won't add it. Avoid [[antipattern-content-desert]]:
prove the flare-rhythm, *then* generate depth.

Determinism is the hard constraint. The flue segments, hazard placement, and any
drift all roll through the world's deterministic RNG so a seed replays the same
descent — the retry-mastery loop *depends* on the run being the same run. Keep the
bloom/particle layer [[pattern-readability]]-clean and cosmetic; it never enters
`world.hash()`. See [[system-save-and-checkpoint]] for the hearth checkpoints.

## Handoff

A design isn't done until it names its proofs.

- **`design/FUN.md` law 8 — the ablation proof.** Build the descent twice:
  `coupled` (flare burns fuel) and `ablated` (free light). Run a skilled pilot and
  a lazy one over both; `assertLoadBearing({ coupling: 'flare-cost', coupled,
  ablated, skilled, lazy })` must show the skill-gap **collapse** when the cost is
  removed. If free-light plays the same, the held-breath was never real and the
  coupling is a lie.
- **`design/JUICE.md`** — the entire feel rests on the light/dark contrast and the
  preciousness of the flare. This is a feel proof, not a numbers proof.
- **Coherence gate** — the Resonance table above must stay complete; any new
  system needs a row or it's [[antipattern-decoration]].

Then design *your own* committal-single-resource spine — don't reskin this one. See
[[process-refine-and-handoff]].
