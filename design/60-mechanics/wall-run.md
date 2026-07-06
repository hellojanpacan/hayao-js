---
id: mechanic-wall-run
title: Wall Run
kind: mechanic
tags: [movement, momentum, traversal, parkour]
summary: Sprint along a vertical surface for a beat — momentum you must keep feeding or fall.
use-when: Fast traversal wants flow across surfaces, punishing hesitation.
composes-with: [mechanic-wall-jump, mechanic-dash, pattern-mastery-and-flow]
verify-with: docs/JUICE.md
---

# Wall Run

**What it is.** Press into a wall while moving fast and the player runs *along* it —
horizontal or diagonal — instead of falling. It lasts a **beat**, not forever:
gravity claws back, and you exit into a jump or drop off.

**Player fantasy.** *"I don't stop for terrain."* The wall isn't an obstacle, it's a
surface you *use*. Speed becomes a resource that buys you a second path — the room's
architecture turns into a line you get to draw at a run.

## The verb

Hold *toward* the surface while carrying horizontal speed → the run engages, gravity
suspends or slows, and you travel until the **duration budget** drains or you launch.
The verb is not "stick to wall"; it's "**spend** momentum to defer the fall."

## How it feels

- **Borrowed time, not free flight.** The pleasure is the *countdown* — you feel the
  wall running out and thread the exit before it does. A wall run that never ends is
  just a floor turned sideways; the fun is the budget.
- **Speed in, speed out.** Enter slow and it fizzles; enter fast and you rocket. The
  mechanic *rewards the approach*, so the level teaches you to set up before you commit.
- **Reads as flow, punishes hesitation.** Stall on the wall and gravity wins. This is
  the "keep moving" contract — the mechanic that most makes a room feel like a
  sentence you speak in one breath. See [[pattern-mastery-and-flow]].

## Tuning levers

| Lever | What it moves | Sane default |
|---|---|---|
| **Duration budget** | Frames of run before forced detach | ~0.6–1.0 s |
| **Gravity ramp** | How fast the fall reasserts across the run | Suspend fully for first ~40%, then ease gravity back in |
| **Entry-speed gate** | Min horizontal speed to engage | ~70% of run speed — slow walks bounce off |
| **Stick vs slide** | Does the run hold height or bleed downward | Slight downward drift so it always ends |
| **Detach jump** | Launch angle/impulse off the wall | Outward + up, biased away from the surface |
| **Cooldown / same-wall lock** | Can you re-grip the wall you just left | Lock the *same* wall; free on a *new* one |
| **Coyote / buffer** | Grace at entry and on the exit jump | A few frames each way (feel-gate; see JUICE.md) |

The two most load-bearing levers are the **duration budget** (how long the promise
lasts) and the **gravity ramp** (how the promise decays). Get those two shaped right
and the rest is polish.

## The chaining contract

Wall run only sings when it's a *segment*, not a destination. The exit is the point:

- **Wall run → jump.** The detach launches you outward — often onto the *next* wall,
  which starts a fresh budget. Chained walls become a ladder of momentum. This is the
  seam with [[mechanic-wall-jump]]: the run carries you, the jump redirects you.
- **Dash → wall run.** A [[mechanic-dash]] tops up entry speed so a marginal wall
  engages — the dash *pays the entry-speed gate*.
- **Wall run → dash / air move.** Detach with momentum banked so an air option
  ([[mechanic-double-jump]], [[mechanic-glide]]) extends the line past the wall.
- **Same-wall lock** is what forces the chain: you can't farm one wall forever, so the
  level's walls become a *route*, not a resting spot. Without the lock, the mechanic
  collapses into hovering.

## Slots into

| Genre / anchor | Where the run lives |
|---|---|
| [[genre-precision-platformer]] ([[anchor-celeste]]) | A hold-and-climb variant is the spine — momentum + budget as the skill test |
| [[genre-metroidvania]] | A gated traversal verb that reopens old rooms as new lines |
| [[genre-action-adventure]] ([[anchor-shadow-of-mordor]]) | Parkour flow between combat beats; the city becomes a road |
| [[genre-racing]] | Surfaces as an alt-line — speed you keep by leaving the ground |
| [[genre-roguelike]] ([[anchor-dead-cells]], [[anchor-nuclear-throne]]) | Movement tech that skips arenas and buys mastery-curve ceiling |

Pairs naturally with the parkour anchors ([[mechanic-ledge-grab]], [[mechanic-climb]],
[[mechanic-swing]]) — a traversal *kit*, not a lone verb. See [[system-mastery-curve]]
for how a movement toolset builds a ceiling.

## Twist seams

- **Wall run but only while a note holds on the soundtrack** *(mechanic-swap)* — the
  duration budget isn't a timer, it's the *sustained note*. Release the wall when the
  note ends or you drop; the level's walls are placed to the chart. Fuses traversal
  with [[genre-rhythm]] — the budget becomes music. (See [[recipe-rhythm-platformer]].)
- **Wall run but the wall is another player** *(perspective)* — in [[genre-coop-chaos]]
  ([[anchor-it-takes-two]]) one player *braces* and becomes the runnable surface; the
  runner spends their partner's stability as budget. The "keep moving" contract becomes
  a trust contract. See [[system-coop-and-competition]].
- **Wall run but the wall runs out from under you** *(escalation)* — surfaces crumble a
  beat after you touch them ([[system-hazards-and-environment]]), so the run *creates*
  the pressure it relieves; hesitation isn't just slow, it's fatal. See
  [[pattern-escalation-and-payoff]].

## How it wires to Hayao

- **Deterministic movement + collision** — the run is a state on the mover: detect a
  wall contact with lateral speed, suspend/ramp gravity, drain a frame budget, resolve
  the detach impulse. Read [`sandboxes/physics-lab`](../../sandboxes/physics-lab) for
  the collision + integrator seam; keep all of it deterministic (no wall-clock, no
  `Math.random`) so the run replays frame-identical.
- **Grace + feel** live as framed windows (entry coyote, exit buffer) — spec them in
  frames and gate them; the recipe is in `docs/JUICE.md`, not here.
- **The look** — dust off the shoe, a lean into the wall, a speed-scaled trail — is
  cosmetic. Study [`sandboxes/juice-lab`](../../sandboxes/juice-lab) for the trail /
  squash vocabulary and [`sandboxes/camera-lab`](../../sandboxes/camera-lab) for the
  slight lead the camera should give a fast mover. None of it touches `world.hash()`.
- [`examples/updrift`](../../examples/updrift) is the golden platformer reference for
  how a momentum verb + grace windows are wired and feel-gated end to end.

## Fails when…

- **The budget never ends.** No drain, no drift, no lock → the wall is a hover pad and
  the flow evaporates. The countdown *is* the mechanic.
- **The entry is a coin flip.** Vague contact/speed detection means the run engages when
  you didn't ask and refuses when you did — an [[antipattern-input-lie]]. The player must
  feel that *they* triggered it.
- **It's mandatory but ungraced.** A required wall run with a one-frame window and no
  coyote/buffer is a [[antipattern-difficulty-cliff]], not a skill test. Grace the entry
  and the exit ([[pattern-fairness-and-trust]]).
- **It trivialises the room.** If the run skips the whole challenge with no cost, the
  level stops being a level. Gate it, cost it, or design the room *for* it.
- **It's decoration.** A wall run that leads nowhere — no chain, no shortcut, no time
  saved — is [[antipattern-false-depth]]. If the exit doesn't open a line, cut the verb.

## See also

- [[mechanic-wall-jump]] — the redirect that turns a single run into a chain of them;
  read the two together, they're one traversal loop.
- [[mechanic-dash]] — the momentum injector that pays the entry-speed gate.
- [[pattern-mastery-and-flow]] — why "keep moving" reads as flow, and how the budget
  keeps challenge riding the skill line.
- [[system-mastery-curve]] — a movement kit as a skill ceiling; the run is one rung.
- [`docs/JUICE.md`](../../docs/JUICE.md) — grace windows, trail/camera feel, and the
  feel-gates that prove the run *feels* right, not just runs right.
