---
id: mechanic-magnet
title: Magnet / Attract-Repel
kind: mechanic
tags: [physics, pull-push, puzzle, combat]
summary: Pull toward or push from a point — action-at-a-distance over metal, foes, and floors.
use-when: You want field-based physics puzzles or crowd control.
composes-with: [mechanic-throw, genre-physics-arcade, system-hazards-and-environment]
verify-with: design/FUN.md#19-·-physics-arcade
---

**What it is.** A **field** the player projects from a point — attract draws magnetic bodies toward it, repel shoves them away. You never touch the object; the force does. It's [[mechanic-throw]] without the hands: action over a distance, on anything the world marks as *magnetic*.

**Player fantasy / why it's fun.** You bend the room with an invisible hand. Coins leap to your palm, a portcullis rips off its track, a mob of foes clumps then scatters at your whim. The pull is **telekinesis with rules** — power you feel through second-order motion, not a button that just deletes the obstacle.

## The verb
Aim a point (or emit from self) → choose **polarity** (attract / repel) → hold → magnetic bodies accelerate along the field until you release or they arrive. Two live decisions every frame: *which polarity* and *what's in range*.

## How it feels / why it's fun
- **Second-order control.** You don't move the object; you move the *force*, and the object obeys physics. The delight is the lag — you lead, it follows, it overshoots. That gap is the skill, same family as the arc-read in [[mechanic-throw]] and [[anchor-peggle]].
- **Polarity is a live toggle, not a mode.** Flipping attract↔repel mid-motion is the expressive core: yank a crate close, then shove it through a wall of foes. One input, two verbs — keep the flip instant and readable.
- **Crowd authoring.** Against many bodies the field is a brush. Repel is peel-off crowd control ([[system-combat-model]]); attract is a trap primer — gather, then detonate. See [[genre-horde-survival]].

## Tuning levers
| Lever | Default | Pushed low → | Pushed high → |
|---|---|---|---|
| **Falloff** | linear over radius | flat pull (arcadey, forgiving) | inverse-square (physical, punishing edges) |
| **Range** | mid (2–4 screens of a room) | tight, must-approach | room-wide, trivializes routing |
| **Force cap** | clamped max accel | gentle drift, easy read | snap-yank, hard to catch |
| **Polarity swap** | instant, free | commit to one pole per press | costed flip → planning tension |
| **Target scope** | marked-magnetic only | few loud objects, legible | everything metal, dense + noisy |
| **Self-vs-object** | pull objects to you | you stay put, world moves | pull *you* to anchors (grapple-like) |
| **Charge / duration** | hold-to-sustain | tap-pulse, twitchy | metered battery → resource loop |

Defaults target **physics-puzzle** feel: legible, mid-range, instant flip. Widen range and flatten falloff for arcade crowd-control; add a battery and inverse-square for a tense management verb — [[system-resource-loops]].

## Self-vs-object: who moves?
The single biggest design fork.
- **Object-attract (you anchored).** The world comes to you. Reads as telekinesis; native to puzzles and tower-style crowd control. Weight the player heavy so recoil doesn't drag them.
- **Self-attract (you're the metal).** Fire the field at a fixed anchor and *you* fly to it — now it's a traversal verb, cousin to [[mechanic-grapple]] and [[mechanic-teleport]]. The room's magnetic points become a movement graph; this is the [[genre-metroidvania]] seam.
- **Both, toggled** is richest and heaviest to teach. Gate it: teach object-pull first, introduce self-pull as a named traversal beat — [[system-onboarding]], [[pattern-mastery-and-flow]].

## Legibility: mark what is magnetic
The whole verb collapses if the player can't tell **what the field grips**. This is the non-negotiable:
- **One loud material cue.** Magnetic bodies share a single unmistakable read — a color, a shimmer, a metal sheen. Everything else is inert scenery. Don't make the player probe to learn the ruleset — [[pattern-readability]], [[system-telegraphs]].
- **Show the field.** Range ring, polarity color (warm=pull, cool=push is a safe convention), and force lines so the player predicts *before* committing. A field you can't see is a coin flip.
- **Poles must be unambiguous.** Attract and repel need distinct color *and* shape language — color-blind-safe, an [[system-accessibility]] gate, not a nicety.

## One field, many uses
A magnet is a **verb multiplier** — the same force is a key, a weapon, and a floor:
- **Key:** pull a lever, rip a barred gate, drag a metal bridge into place.
- **Weapon:** repel foes into [[system-hazards-and-environment]]; attract a spiked crate into a crowd.
- **Traversal:** self-pull across a gap between anchors.
One authored room yields three challenges depending on which use it demands. Design each room to be *interesting under at least two of them* — that constraint is where the [[pattern-emergence]] lives.

## Slots into
- **Genres:** [[genre-physics-arcade]] (native soil), [[genre-grid-puzzle]] and [[genre-puzzle-platformer]] (discrete, provable field moves), [[genre-horde-survival]] and [[genre-bullet-hell]] (crowd shove / bullet-bend), [[genre-metroidvania]] (self-pull as a gated power), [[genre-immersive-sim]] (a physics verb that composes off-script).
- **Anchors:** [[anchor-portal]] (a physics tool that reframes each room), [[anchor-katamari]] (attract-and-accrete as the whole loop), [[anchor-vampire-survivors]] (a repel/pull field as crowd control), [[anchor-nuclear-throne]] (magnetic ammo/health pickup as a quality-of-life field).
- **Systems:** [[system-hazards-and-environment]] (throw foes *into* the room), [[system-combat-model]], [[system-status-effects]] (a "magnetized" tag), [[system-resource-loops]] (a metered field).

## Twist seams
- **Magnet but you are the metal and the world pulls you** *(perspective)* — flip the frame: the player is ferrous and every anchor in the level exerts pull on *them*. Now you plan routes by which magnets are live, thread between competing fields, and get dragged into hazards you failed to read. Traversal becomes a field-navigation puzzle — pairs with [[mechanic-grapple]], [[genre-metroidvania]], and the "you are the exception to the world's rule" energy of [[mechanic-gravity-flip]].
- **Magnet but same-polarity enemies clump then explode** *(emergence)* — give foes a polarity. Attract like-poles and they resist, pile, and detonate at a density threshold; opposite poles snap together into a bigger, meaner mass. Crowd control becomes chemistry — you're arranging reactions, not just shoving. See [[pattern-emergence]], [[system-enemy-archetypes]], [[genre-horde-survival]].
- **Magnet but polarity is the level's, not yours** *(inversion)* — the room decides the field; you only choose *where you stand*. Zones pull or push on a timer, and the puzzle is positioning inside forces you don't own — [[system-hazards-and-environment]], [[pattern-pacing-and-tension]].

## How it wires to Hayao
- Model the field as a **per-frame force** applied to magnetic bodies before the physics integrates: `accel = polarity · strength · falloff(distance)`. The body's motion is the solver's job over fixed ticks — deterministic, replayable, hashable.
- Any tie-break when multiple fields or many bodies contend (equal distance, spawn order of a clump) resolves through **ordered iteration** or a **deterministic RNG** — never argless timing, or replays diverge and physics proofs break.
- For the pull/push/impact feel, study the physics lab in `sandboxes/` in isolation before wiring it into a game.
- If the magnet is a **puzzle** move (grid, provable), keep it a pure `Move` — a field pulse that maps input state to a new cell layout — and split logic from view the way `examples/sokoban/` splits pushable-object rules from rendering. The landing cell is state; the force lines you draw are **cosmetic**.
- The range ring, polarity glow, force lines, and metal-sheen cue are all **cosmetic** overlays — they read but stay out of `world.hash()`. What's magnetic and where it ends up is state.
- Prove the *field feel* against design/FUN.md#19-·-physics-arcade; prove puzzle levels the way a puzzle proves winnability — every solution must have a reachable pull.

## Fails when…
- **What's magnetic is invisible.** If the player can't tell metal from scenery, every attempt is a probe, not a plan — that's [[antipattern-input-lie]]. One loud material cue, always.
- **The field just deletes the obstacle.** A pull with no lag, no overshoot, no cost is a teleport wearing a costume — the second-order skill evaporates into [[antipattern-false-depth]]. Keep the motion physical.
- **Range trivializes routing.** Room-wide, flat-falloff attract means you never approach anything — the level's geometry goes dead and the optimal play is stand-and-hold: [[antipattern-boring-optimal]].
- **Poles read the same.** Attract and repel that differ only by a hue nobody can parse under pressure is a readability *and* accessibility failure — distinct color and shape, or don't ship it.
- **The magnet is strictly the best verb.** If pulling beats moving, meleeing, and shooting everywhere, the rest of the kit rots — [[antipattern-boring-optimal]]. Gate it: limit what's ferrous, meter the field, or cost the polarity flip.
- **Overloaded input.** Attract *and* repel *and* dash on one button muddies the mental model — [[antipattern-feature-soup]]. Keep the field its own clean verb.

## See also
- [[mechanic-throw]] · [[mechanic-grapple]] · [[mechanic-bounce]] — the other action-at-a-distance and physics verbs a magnet sits beside.
- [[mechanic-teleport]] · [[mechanic-gravity-flip]] · [[mechanic-portal]] — the "reframe the room with one force" family.
- [[genre-physics-arcade]] · [[genre-horde-survival]] · [[pattern-emergence]] · [[pattern-readability]] — the design frame this lives inside.
