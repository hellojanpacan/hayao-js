---
id: genre-precision-platformer
title: Precision Platformer (Celeste-like)
kind: genre
tags: [platformer, precision, celeste, movement, grace, dash, coyote, feel]
summary: Trust in inputs — a movement envelope so honest that every death is the player's own, and the retry is instant enough to make failure fuel.
use-when: Designing a tight single-screen platformer where mastery of one movement verb is the whole game.
composes-with: [system-grace, system-onboarding, system-difficulty-and-dda, system-save-and-checkpoint, system-collectibles]
anchors: [anchor-celeste]
verify-with: design/FUN.md#2--precision-platformer-celeste-like
---

# Precision Platformer (Celeste-like)

**What it is.** A character, a jump, usually one signature air-verb (dash,
grapple, double-jump), and rooms built exactly to the edge of what that verb can
do. Death is cheap; the room is the puzzle; your *hands* are the solution.

**Player fantasy / why it's fun.** *"That was me."* The screen fills with your
corpses and then you thread the room clean, and the difference was skill you can
feel yourself having grown. The controls never betray you, so every failure is a
lesson you accept.

## Pillars

1. **The controls are trustworthy.** Inputs land on the frame you press them.
   Coyote time, jump buffering, corner correction — the [[system-grace]] canon
   makes the character do what you *meant*. Deaths are never the game's fault.
2. **Death is free.** Instant respawn, at the room's mouth, momentum unbroken.
   Retry friction is the enemy of flow. (Corpus: CLAWSTRIKE sells itself on
   "each retry is instant, keeping the momentum alive.")
3. **The room is a sentence.** Each screen states one idea in your verb's
   vocabulary and asks you to say it back cleanly. Rooms compose ideas; they
   never pad.

## The loop stack

| Scale | The loop |
|---|---|
| **Moment** | Jump/dash across one gap. Land or die. Sub-second. |
| **Encounter** | One room (screen): read the layout → attempt → die → adjust one input → thread it clean. |
| **Session** | A chapter of ~20–40 rooms sharing a movement idea, ending on a room that combines them all. |
| **Meta** | Optional B-side rooms, hidden collectibles, deathless-run and speedrun goals — the ceiling for players who own the floor. |

## Essential systems

| System | Why it's needed |
|---|---|
| [[system-grace]] | The genre's spine. Coyote/buffer/corner-correction/variable-height are ~15 unit tests, not vibes (FUN.md law 5). Spec every window in frames. |
| [[system-onboarding]] | Teach the verb by *safe* rooms first — a dash over a pit you can't fall out of — before the verb is load-bearing over a spike. |
| [[system-difficulty-and-dda]] | The chapter is the curve; assist mode (slower time, invincibility, air-dashes) extends the audience without touching the core (see Celeste). |
| [[system-save-and-checkpoint]] | Per-room respawn is the checkpoint; deaths must never rewind more than the current room. |
| [[system-collectibles]] | Optional off-path collectibles give the skilled a reason to master rooms twice. |

## Content & difficulty model

- **Derive the room from the envelope, never eyeball it.** Compute
  `jumpDistance` / `dashJumpDistance` from the actual config *first*; a gap that's
  one pixel past the dash isn't hard, it's broken. Leave human slack — a
  frame-perfect gap is a bug. See [`recipes/platformer-feel.md`](../../recipes/platformer-feel.md)
  for the movement-envelope recipe and [FUN.md law 3](../FUN.md#part-1--universal-laws).
- **One idea per room, then combine.** Room introduces "dash *up*," next room
  "dash up into a wall-slide," boss room chains four ideas at speed.
- **Difficulty = execution length between checkpoints, not gap tightness.** A
  long clean sequence is harder than one brutal jump; scale by *how many* honest
  inputs in a row, not by shaving pixels.
- **Momentum must survive flight.** Split air-acceleration from air-friction so
  inherited speed carries; a dash off a moving lift should feel like the lift gave
  it to you (FUN.md §2).

Reference wiring: [`examples/small-flame`](../../examples/small-flame) — the
precision platformer-feel reference, whose fuel-aware waypoint bot proves the
chamber winnable 0-deaths and whose grace windows are feel-gated end to end.
Extending the movement envelope with a suite of abilities (the metroidvania
spine) is a design shape to compose here, not a shipped example.

## Signature-mechanic seeds

"X but Y" ([[process-the-twist]]) — bend the *verb* or the *cost of death*.

- **Celeste but you keep one echo of your last run** — a ghost replays your prior
  attempt and you must not touch it. (mechanic-swap)
- **Celeste but the dash paints the platform it lands on** — traversal builds the
  level for a second lap. (mechanic-swap)
- **Celeste but momentum never resets** — no braking; the room is solved by
  *shedding* speed, not adding it. (constraint)
- **Celeste but death rewinds time three seconds** — failure is a scrub, not a
  respawn; you re-enter your own recent past. (structure)
- **Celeste but two characters, one jump button** — mirrored twins share input;
  the room resolves only when both survive. (constraint)

## Common pitfalls

- **Untrustworthy input.** No coyote/buffer/corner-correction → the player blames
  the game, correctly. This is the one non-negotiable; ship the grace canon or
  don't ship. [[system-grace]].
- **Retry friction.** A death animation, a fade, a "you died" screen — each one
  bleeds flow. Respawn on the next frame.
- **Difficulty by pixel-shaving.** Frame-perfect gaps read as unfair. Depth comes
  from *sequences*, not from tolerances.
- **Momentum amnesia.** Flight that discards inherited speed makes dashes feel
  dead. Preserve it (FUN.md §2).
- **Verb creep.** Adding a fourth air-move dilutes mastery of the first. One
  signature verb, deeply explored, beats four shallow ones.

## Anchors

- [[anchor-celeste]] — the precision platformer *and* the humaneness of assist
  mode; grace as a first-class system, not polish.

## Verify

Prove it with **[FUN.md §2 · Precision platformer](../FUN.md#2--precision-platformer-celeste-like)** —
waypoint bot beats every room 0-deaths; movement-envelope inequalities asserted
against config; grace windows tested edge-in/edge-out. Design the feel here; prove
the trust there.

## Composes with

- [[system-grace]] — the load-bearing system; the pillar-1 promise made mechanical.
- [[pattern-mastery-and-flow]] — the retry loop lives or dies on flow.
- [[pattern-anti-frustration]] — free death is the whole forgiveness contract.

## See also

- [`recipes/platformer-feel.md`](../../recipes/platformer-feel.md) — the movement-feel recipe.
- [`examples/small-flame`](../../examples/small-flame) — the precision feel reference.
- [`design/FUN.md §2`](../FUN.md#2--precision-platformer-celeste-like) — the proof playbook.
