---
id: system-grace
title: Grace — forgiveness as a system
kind: system
tags: [grace, coyote, iframes, input-buffer, mercy, undo, forgiveness, retry]
summary: Coyote time, i-frames, input buffering, mercy clears, and undo as one concrete system — the same shape at every timescale, each unit-testable.
use-when: Any game where a fair input can feel dropped — a late jump, a hit through a pause, a run lost to a leftover threat. Which is nearly every game.
composes-with: [pattern-anti-frustration, system-combat-model, system-telegraphs, system-boss-design, system-save-and-checkpoint]
anchors: [anchor-celeste, anchor-into-the-breach]
verify-with: design/FUN.md#part-1--universal-laws
---

# Grace — forgiveness as a system

**What it is.** **Grace is a system, not polish** (FUN.md law 5). Coyote time, jump
buffering, i-frames, wound-before-death, mercy clears, undo, instant retry — they are
*the same shape at every timescale*: a window in which the game accepts intent it
could have rejected. This is the concrete engineering companion to
[[pattern-anti-frustration]] (the mindset) and the JUICE forgiveness gate (the proof).

**Player fantasy / why it's fun.** *Trust.* "My inputs land; my deaths are my fault."
Grace is invisible when it works — it converts a hundred cheap, rage-inducing
non-deaths into fair play, so every real failure reads as *yours*. That trust is the
floor a game stands on; without it, the tightest mechanics feel like they drop inputs.

## When to use / when NOT

| Grace applies when… | Ease off when… |
|---|---|
| A fair input can feel dropped | The window would erase a real skill check |
| A pause/freeze interrupts intent | Determinism forbids leniency (turn-perfect puzzle) |
| Failure has cost (a run, a phase, a level) | (rare — most games want *more* grace, not less) |

The trap is *too little*, almost never too much — but a grace window that outlasts
its spec is *unfair leniency* the gate also catches (see below).

## The grace family — one shape, every timescale

| Grace | Timescale | The window | Timescale example |
|---|---|---|---|
| **Coyote time** | frames | jump still fires just after leaving a ledge | [[anchor-celeste]] |
| **Jump/input buffer** | frames | press just before landing still fires | platformers |
| **Corner nudge** | pixels | clip a ceiling edge → slip past, keep momentum | Celeste corner correction |
| **Hit-stop buffering** | frames | inputs during the freeze re-emit after | FUN.md §4 |
| **i-frames** | frames | invulnerable window after a hit | action/boss |
| **Wound-before-death** | events | one grab is a story, two is a death | FUN.md §16 |
| **Mercy clear** | events | death/phase transition clears active threats | FUN.md §7 |
| **Undo / restart** | turns | take the move back | FUN.md §1, Dying Dreams |
| **Instant retry** | run | respawn keeps the momentum | FUN.md law 5, CLAWSTRIKE |

Notice the invariant: **any pause the sim injects must buffer intent across it.** A
hit-stop, a phase transition, a level-up screen — each swallows input unless it
re-emits the buffered press. That single rule prevents the most common cheap deaths.

## Tuning levers

| Lever | Does | Healthy range |
|---|---|---|
| **Coyote time** | grace after leaving ground | ≥ 0.05s (≈ 3 frames @60Hz) — the gate floor |
| **Jump buffer** | grace before landing | ≥ 0.05s — the gate floor |
| **Corner nudge** | sideways slip past a ceiling edge | non-zero (the gate requires it) |
| **i-frame window** | invuln after a hit | long enough to reposition; short enough to stay tense |
| **Mercy scope** | what a clear wipes | active threats only — not the whole difficulty |
| **Retry friction** | walk-back after death | near-zero; instant respawn keeps flow |

Every window is **specced in frames and proven to the exact frame** — grace is
leniency, and unbounded leniency is its own bug (accepting input *past* the window).

## How it wires to Hayao

- **Two gates, both in `@hayao`.** `forgivenessIssues(spec)` statically audits a
  controller's `ForgivenessSpec` (`coyoteTime`, `jumpBuffer`, `jumpCornerNudge`)
  against floors — the "does this platformer even *have* grace" check.
  `graceWindowIssues(label, windowFrames, accepts)` is the behavioural prover: it
  frame-pumps the window and asserts **accepted-inside / refused-outside to the exact
  frame** — coyote, buffer, i-frames, mercy, all one call.
- **Grace is sim state, timing is sim time.** Windows live in `world.state` on the
  fixed `dt` (FUN.md law 6); the *feel* (the landing puff) is cosmetic. A replay
  reproduces the grace exactly.
- **Pure state makes buffering testable.** Frame-pump the sim, apply the input N
  frames into the window, assert it took (FUN.md law 7).
- Reference wiring: [`examples/updrift`](../../examples/updrift) (all forgiveness
  fundamentals + the tapped-jump gotcha, JUICE Part 4); [`recipes/platformer-feel.md`]
  for the canon movement recipe. Grep [`docs/API.md`](../../docs/API.md) to confirm
  the gate names before citing.

## Fails when…

- **No coyote/buffer.** The single most common reason a *correct* platformer feels
  amateur — `forgivenessIssues` exists precisely to fail this (gates.ts comment).
- **A pause eats input.** Hit-stop / level-up / phase change that doesn't re-emit
  intent → attacks and jumps "randomly" vanish (FUN.md §4).
- **The window lies.** Accepts input past its spec — unfair *leniency*; `graceWindowIssues`
  fails the over-long window too.
- **Grace that erases the challenge.** Mercy that wipes the *difficulty*, not just
  stray threats — now nothing is a threat (FUN.md law 4: a null strategy must still lose).
- **High retry friction.** A long walk-back turns learn-by-dying into punishment
  ([[pattern-anti-frustration]]).

## Verify

- **[FUN.md law 5](../FUN.md)** — the whole grace family, each unit-testable;
  frame-pump edge-in / edge-out.
- `forgivenessIssues(spec)` and `graceWindowIssues(label, frames, accepts)` →
  **[JUICE.md Part 3](../JUICE.md)** (forgiveness gate), **[VERIFICATION Channel 4](../../docs/VERIFICATION.md)**.
- **[FUN.md law 4](../FUN.md)** — grace must not make the null strategy survive.
- Determinism: view-on == view-off hash (the feel of grace is cosmetic).

## Composes with

- [[pattern-anti-frustration]] — grace is the *system*; anti-frustration is the *mindset*
  it implements. Read them together.
- [[system-combat-model]] — hit-stop buffering and i-frames live at the combat clock.
- [[system-boss-design]] — mercy clears and transition i-frames are structural in set-pieces.
- [[system-save-and-checkpoint]] — checkpoint/retry is grace at the session timescale.

## See also

- [`design/FUN.md`](../FUN.md) law 5 (grace as a system), §4 (hit-stop buffering),
  §7 (mercy clears), §1 (undo), §16 (wound-before-death).
- [`design/JUICE.md`](../JUICE.md) Part 3 (forgiveness gate), Part 4 (the tapped-jump gotcha).
- [`recipes/platformer-feel.md`](../../recipes/platformer-feel.md) — the canon movement + grace recipe.
- [`src/verify/gates.ts`](../../src/verify/gates.ts) — `forgivenessIssues`, `graceWindowIssues`, `ForgivenessSpec`.
- [[anchor-celeste]] — grace (and assist mode) as a design thesis.
