---
id: anchor-portal
title: Portal
kind: anchor
tags: [first-person-puzzle, single-verb, teaching, momentum]
summary: A single spatial verb taught so well it needs no words — every room is a lesson, then a test, then a twist.
use-when: You want a puzzle built on ONE deep verb with masterclass wordless teaching.
composes-with: [mechanic-portal, genre-puzzle-platformer, system-onboarding]
anchors: [anchor-portal]
verify-with: design/FUN.md#1-·-grid-puzzle
---

**What it is.** A first-person puzzle box built on exactly one verb — link two surfaces so what enters one exits the other — and a curriculum of self-contained rooms that teach that verb without a single instruction screen.

**Player fantasy / why it's fun.** You feel *smart*, and you feel it fast. The game never explains; it arranges a room so the solution is the only thing that fits, and the click of understanding is the reward. Late rooms let you break spatial intuition on purpose — fall forever, launch across a chasm — and it feels like cheating physics you were handed the keys to.

## Design DNA

- **One verb, mined to the bottom.** No inventory, no second tool. Depth comes from *situations* around the [[mechanic-portal]], not from more mechanics. Everything below is a consequence of that one rule.
- **Momentum is conserved.** "Speedy thing goes in, speedy thing comes out." The verb isn't just teleport — it's teleport-that-keeps-your-velocity. This single clause is where half the puzzles live. See [[mechanic-teleport]] for the plain version; the momentum rule is the twist that makes it a game.
- **Teach by architecture, not by text.** The room *is* the tutorial. A gap you can't cross, one wall of the right material, a floor of the wrong one — the level geometry funnels you to the insight. This is [[system-onboarding]] done as level design.
- **A dry narrator for tone.** The teaching is silent; the *voice* is not. A flat, faintly menacing narrator gives the sterile test chambers a personality and a spine of dark comedy — carrying [[world-mood-and-atmosphere]] and [[world-naming-and-tone]] without ever explaining a puzzle.
- **Every room is provably solvable and provably has a floor.** The chamber teaches, then tests, then hands you the next chamber. Clean [[system-session-structure]] at the room grain.

## Load-bearing structures

| Structure | Why it works |
| --- | --- |
| **Introduce → practice → combine → subvert** room cadence | The whole engine of mastery. One new idea per room, isolated; then a room that only works if you've internalized it; then a room fusing it with a prior idea; then one that breaks your assumption about it. See [[system-mastery-curve]], [[pattern-mastery-and-flow]]. |
| **Single deep verb** | A finite rulebook the player can hold entirely in their head, so difficulty is *comprehension*, not memorization. The opposite of [[antipattern-feature-soup]]. |
| **Momentum conservation** | Turns a binary teleport into an analog tool — angle, height, and speed all become variables. This is the [[pattern-emergence]] source; a small rule, a large solution space. |
| **Wordless teaching via geometry** | Removes the [[antipattern-endless-tutorial]] failure mode entirely. The level *shows*, the player *derives*. |
| **Self-contained rooms** | Each chamber is a clean checkpoint and a clean unit of difficulty tuning. Natural [[system-save-and-checkpoint]] and [[pattern-pacing-and-tension]] grain. |
| **Diegetic narrator** | Tone and stakes without cutscenes; comedy that rewards *finishing* a room, not solving it. [[world-narrative-delivery]]. |

## What to steal

- **The four-beat room cadence.** Introduce a wrinkle in isolation, force one clean practice, combine with a known wrinkle, then subvert an assumption. This is the reusable spine — genre-agnostic. It works for a [[genre-grid-puzzle]] on a board just as well as in 3D.
- **Teach the verb by making the room impossible any other way.** Build the geometry so the solution is *inevitable* once seen. Never write "press X to portal."
- **A signature "aha" per room.** One insight, cleanly earned. If a room has two ideas, split it into two rooms.
- **Conserved momentum as a depth multiplier.** Any movement [[mechanic-portal]] / [[mechanic-teleport]] gains a whole puzzle language the moment velocity survives the trip.
- **Tone carried by a voice, not a wall of text.** A consistent narrator personality (see [[world-naming-and-tone]], [[world-tonal-juxtaposition]]) lets a clinical setting feel authored.
- **Restraint.** The discipline of *one* verb is the design. See [[pattern-restraint-and-negative-space]].

## What's just theme (drop it)

- **The specific fiction** — the lab, the AI antagonist, the cake. That's flavor, not structure. Keep the *shape* of a dry narrator; invent your own world.
- **First-person 3D.** The teaching cadence and single-verb depth port cleanly to top-down, side-on, or a [[genre-grid-puzzle]] grid. Perspective is a delivery choice, not a pillar.
- **The exact verb.** "Two linked surfaces" is one instance. The transferable idea is *one spatial verb, taught wordlessly, mined to the bottom* — the verb itself can be gravity-flip, clone, swap, or grow.
- **Sci-fi sterility.** The aesthetic serves the "test chamber = clean teaching unit" read; any theme that keeps rooms legible works. See [[world-aesthetic-direction]].

## Composes into

- [[genre-puzzle-platformer]] — the native home: spatial verb + movement + discrete rooms.
- [[genre-grid-puzzle]] — strip the momentum, keep the introduce→subvert cadence, and it's a turn-based board puzzle. Pair with the pure-logic split in `examples/sokoban/`.
- [[system-onboarding]] — this is the reference implementation of wordless, diegetic teaching.
- [[system-mastery-curve]] — the per-room difficulty ramp is a textbook mastery curve.
- [[genre-precision-platformer]] — momentum-portals fold directly into a movement-tech vocabulary alongside [[mechanic-dash]] / [[mechanic-double-jump]].

## Twist seams

- **Portal but the two ends are controlled by two players** *(perspective)* — one player aims the entry, the other the exit; neither can solve alone. The verb becomes a *conversation*. See [[system-coop-and-competition]], [[genre-coop-chaos]], and [[anchor-it-takes-two]] for asymmetric-coop shape; the puzzle is now about communication, not just geometry.
- **Portal but you place the exit only, the entry is always where you stand** *(constraint)* — halving the tool doubles the planning. Every solution becomes "where do I need to *be*, and where do I aim from there?" A tighter, more chess-like variant — pairs with [[pattern-meaningful-choice]] and the single-placement discipline of [[mechanic-teleport]].
- **Portal but the room resets its geometry each attempt** *(procedural)* — the *verb* stays constant, the *chamber* is generated; teaching moves from authored rooms to a generator that must still hit the four-beat cadence. See [[system-procgen-design]].
- **Portal but the narrator lies about the rules** *(subversion)* — the dry voice becomes an unreliable teacher; the real teaching is learning to distrust it. See [[world-narrative-delivery]], [[antipattern-guess-the-designer]] (the failure mode to avoid — the lie must be *learnable*, not arbitrary).

## See also

- [[anchor-braid]] — the other masterclass in "one time/space verb, subverted room by room"; closest cousin.
- [[anchor-baba-is-you]] — single-idea puzzle box where the *rules* are the toy; same "mine one verb to the bottom" ethic.
- [[anchor-celeste]] — momentum + single movement verb taught by geometry, in a platformer key.
- [[mechanic-portal]] · [[mechanic-teleport]] · [[mechanic-gravity-flip]] — the verb family this anchor draws from.
- [[system-mastery-curve]] · [[pattern-mastery-and-flow]] · [[pattern-restraint-and-negative-space]] — the teaching-and-restraint theory underneath.
- [[process-the-twist]] — for turning a stolen verb into your own via the "X but Y" seams above.
