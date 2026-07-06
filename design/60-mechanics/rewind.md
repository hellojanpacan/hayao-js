---
id: mechanic-rewind
title: Rewind / Undo
kind: mechanic
tags: [time, puzzle, forgiveness, mechanic]
summary: Roll time backward on demand — failure becomes a draft; the puzzle is what NOT to undo.
use-when: A puzzle or precision game wants exploration without punishment, or time as the toy.
composes-with: [mechanic-time-stop, mechanic-clone, pattern-anti-frustration]
anchors: [anchor-braid]
verify-with: docs/FUN.md#1-·-grid-puzzle
---

**What it is.** A button that runs the world backward — either a full **scrub** to any past state, or a discrete **step-back** that pops the last move off a stack. Failure stops being terminal; it becomes a draft you revise.

**Player fantasy / why it's fun.** Consequence without commitment. You get to *try the dangerous thing* — walk onto the spike, spend the key, provoke the guard — because the mistake is reversible. The tension migrates: it is no longer "will I survive?" but "which of these moves do I keep?"

## The verb
Hold or tap **Rewind**: time flows backward and you re-drive from an earlier point. In stepwise form, one press = one atomic move undone.

## How it feels / why it's fun
- **Removes the reload tax.** Death or a wrong move costs seconds, not a checkpoint reload. This is the mercy floor — see [[pattern-anti-frustration]] and [[system-grace]].
- **Turns exploration free.** A puzzle you can undo is a puzzle you can *poke at*. The player brute-forces less and reasons more, because probing is cheap.
- **Makes time the toy.** When rewind is diegetic (the world visibly runs backward), it stops being a menu affordance and becomes the mechanic itself — the thing levels are *about*.

## Two shapes (pick one, do not blur them)
| | **Full scrub (Braid)** | **Stepwise undo (grid puzzle)** |
|---|---|---|
| Granularity | Continuous, any past moment | Discrete, per-move |
| Fits | Real-time / platforming | Turn-based / [[genre-grid-puzzle]] |
| Cost model | Usually free, unlimited | Usually free, unlimited |
| Design load | State must be *recorded* every tick | State must be *serializable* per move |
| Danger | Trivializes if EVERYTHING rewinds | Trivializes if there's no throwaway resource |

## The Braid rule: what rewind must NOT touch
Rewind is only interesting when something **survives** it. If the whole world rewinds, there is no puzzle — just a scrubber. The design lives in the **exception**:
- *Braid*: green-glowing objects are immune to rewind — you rewind yourself past a locked door while a green key stays fetched.
- A monster you killed *stays* dead while you rewind your own position back to safety.
- A switch, once thrown, holds its state across the scrub.

That immune object is the whole puzzle. Author it first, then build the room around what it lets the player smuggle backward in time.

## Rewind-as-puzzle vs rewind-as-mercy
Decide which you're building — they tune opposite.

| | **Mercy** | **Puzzle mechanic** |
|---|---|---|
| Role | Safety net, invisible ideally | The core verb, front-and-center |
| Budget | Generous / infinite | May be metered, charged, or one-shot |
| Immune objects | Rare | Central — see Braid rule |
| Feedback | Quiet ("oops, back you go") | Loud, diegetic, part of the fiction |
| Reference | *Celeste* assist retry ([[anchor-celeste]]) | *Braid* ([[anchor-braid]]), *Outer Wilds* loop ([[anchor-outer-wilds]]) |

Never sell a puzzle whose intended solution is "spam undo until it works" — that is a [[antipattern-boring-optimal]]. If undo makes the optimal play *tedious rather than clever*, you built a scrubber, not a puzzle.

## Tuning levers
| Lever | What it controls | Sane default |
|---|---|---|
| **Depth** | How far back you can go | Full history (puzzle); ~5–10s buffer (action) |
| **Granularity** | Continuous scrub vs per-move step | Per-move for turn-based; continuous for real-time |
| **Cost** | Free / metered / charged / one-shot | Free for mercy; metered only if rewind is the toy |
| **Immunity set** | Which objects ignore rewind | 0–1 object types per room (start at exactly 1) |
| **Redo** | Can you un-undo? | Yes for puzzles (lets players branch safely) |
| **Scope** | Self only vs whole world | Whole world (mercy); self-only enables clone tricks |
| **Speed** | Rewind playback rate | 2–4× forward speed, so it reads as "reversing" |

## Slots into
- [[genre-grid-puzzle]] and [[genre-puzzle-platformer]] — the native home (stepwise undo, *Baba Is You* [[anchor-baba-is-you]], *Braid*).
- [[genre-precision-platformer]] — as instant-retry mercy, not a verb ([[anchor-celeste]]).
- [[genre-tactics]] and [[genre-abstract-strategy]] — "take-back" undo for planning; guard it in ranked play.
- [[genre-exploration]] / narrative loops — the whole game *is* the rewind ([[anchor-outer-wilds]]).
- Anchors: [[anchor-braid]] (the canonical immune-object design), [[anchor-outer-wilds]] (rewind as a 22-minute loop with retained *knowledge*).

## Twist seams
- **Rewind but one object is immune to it** (constraint) — the *Braid* move. The green key, the dead enemy, the thrown switch persist while your position scrubs back. The immune object is the puzzle's payload; everything else is the delivery mechanism.
- **Rewind but enemies remember the timeline you erased** (structure) — you undo the guard spotting you, but the guard is now *warier* on this stretch, as if scarred by a future it half-recalls. A soft nemesis memory across resets ([[anchor-shadow-of-mordor]] as a flavor cousin); raises the cost of sloppy exploration.
- **Rewind but it costs a shared resource** (economy) — every second scrubbed drains a bar you also need for a power. Now the player triages: spend rewind to fix *this* mistake, or hoard it? Turns mercy into [[pattern-risk-reward]].

## How it wires to Hayao
- **State snapshots.** Because the sim is deterministic and hashable (see the invariants), a rewind buffer is a ring of past states — record on each move, restore by replacing the current state. Stepwise undo is a stack of `Puzzle<State, Move>` states; the pure-logic module already makes each state a serializable value, so undo is just popping the stack. Keep the *immune object* out of the snapshot so it survives restore.
- **Determinism makes replay-rewind cheap.** With all randomness through the seeded RNG, you can store *inputs* instead of full states and re-simulate forward — a rewind is "restore to snapshot, replay N-1 steps." The corpus's turn-based examples (`examples/sokoban/`) show the state/move split undo relies on.
- **View, not logic.** The visual "reversing" flourish (particles running backward, a scrub trail) is pure decoration — mark it cosmetic so it stays out of the world hash. Study a particles or tween lab under `sandboxes/` for the backward-playback look; the *feel* of the reverse is choreography (see [[pattern-juice-choreography]]).

## Fails when…
- **Everything rewinds.** No immune object ⇒ no puzzle, just a time slider. Fix: author the exception first.
- **Undo is the optimal grind.** If the fastest solve is "poke, undo, poke, undo," you've built tedium ([[antipattern-boring-optimal]]).
- **Hidden state desyncs.** Something (a timer, an off-screen enemy, an RNG cursor) isn't in the snapshot, so restore produces a subtly wrong world. Determinism + a full state hash is the guard — assert the hash matches after a rewind→same-forward round-trip.
- **The buffer costs too much.** Recording full state every tick in a real-time game bloats memory; switch to input-replay rewind.
- **It removes all tension.** Free infinite rewind in a game that was *about* risk guts the risk. If rewind is mercy, keep it quiet; if it's the toy, meter or constrain it.

## See also
- [[mechanic-time-stop]] — freezes time instead of reversing it; composes with rewind (stop to plan, rewind to correct).
- [[mechanic-clone]] — self-only rewind + recording your past self as an actor is one step from a time-clone puzzle.
- [[mechanic-teleport]] — spatial "undo" of position; contrast with rewind's temporal undo.
- [[pattern-anti-frustration]], [[system-grace]], [[system-save-and-checkpoint]] — the mercy family rewind belongs to.
- [[pattern-risk-reward]] — how metered rewind re-injects the tension free rewind removes.
- [[anchor-braid]], [[anchor-outer-wilds]], [[anchor-celeste]] — the three canonical treatments.
