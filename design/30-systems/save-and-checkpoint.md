---
id: system-save-and-checkpoint
title: Save & Checkpoint
kind: system
tags: [save, checkpoint, retry, respect-time, snapshot, hash, round-trip, resume]
summary: Save, checkpoint, and retry that respect the player's time — built free on Hayao's pure-state snapshot/hash round-trip.
use-when: The player can lose progress, needs to stop and resume, or should retry a failure without ceremony.
composes-with: [system-session-structure, system-meta-progression, system-grace, pattern-anti-frustration]
anchors: [anchor-celeste, anchor-hades]
verify-with: docs/CONVENTIONS.md
---

# Save & Checkpoint

**What it is.** The machinery that **preserves progress** — full saves, mid-level
checkpoints, and instant retry after failure. Its real subject is **respect for the
player's time**: never make someone redo what they've mastered, and never make a
failure cost more than the mistake did.

**Player fantasy / why it's fun.** Trust and momentum. Instant retry keeps a
platformer in flow (Celeste: "each retry is instant, keeping the momentum alive").
A checkpoint before a boss means the *fight* is the challenge, not the walk to it.
The pull is that the game values your hours as much as you do.

## When to use / when NOT

| Design it carefully when | It's simpler when |
|---|---|
| Runs/levels are long enough to lose real progress | A 90-second arcade loop — restart is the save |
| Failure is frequent (platformer, roguelite) | A turn-based game you can quit anytime (state is always saveable) |
| The player stops and resumes across sittings | A pure toy with no progress to keep |

> **The cost of failure should equal the mistake, not the walk back to it.**
> Re-treading solved content to reach the hard part is a tax on time, not a test of
> skill. Checkpoint *at* the challenge; retry *into* it.

## Variants

| Variant | Granularity | Feels like | Best for |
|---|---|---|---|
| **Instant retry** | the moment | "again, now" | precision platformer ([[anchor-celeste]]) |
| **Checkpoint** | before a hard beat | "the fight, not the trek" | action, boss runs |
| **Autosave** | on meaningful change | "I can quit safely" | sims, adventures |
| **Manual save** | player-chosen | "I own my progress" | long-form, strategy |
| **Roguelite persistence** | between runs | "death advanced *something*" | roguelites ([[anchor-hades]]) |
| **Run suspend** | mid-run, resume later | "stop without losing the run" | long sessions |

## Tuning levers

| Lever | Effect | Watch for |
|---|---|---|
| **Checkpoint density** | how much a death costs | too sparse = punishing; too dense = no stakes |
| **Retry latency** | flow vs. weight | any load screen breaks a platformer's momentum |
| **What persists** | run-reset vs. carry-over | defines how heavy death feels ([[system-meta-progression]]) |
| **Save scope** | full world vs. milestone flags | full snapshot is exact; flags are compact but lossy |

## How it wires to Hayao

- **Save is nearly free here.** `world.state` is plain JSON + `world.rng`; RNG and
  clock state are part of `world.hash()`, `world.snapshot()`, and saves, so a
  restored world **resumes identically** — the property that makes replay and save
  the same mechanism (CONVENTIONS: "a restored world resumes identically";
  FUN.md law 7).
- **Serialize / restore:** `serializeSnapshot(snap)` and `parseSnapshot(text)`
  (grep `docs/API.md`) turn a `WorldSnapshot` into storable text and back —
  round-trip a snapshot and hash both sides for a save-integrity test.
- **Checkpoints are cheap snapshots.** The engine already keeps a periodic
  `SnapshotRing` (every N frames) for Workshop scrubbing/tape
  ([`docs/WORKSHOP.md`](../../docs/WORKSHOP.md)) — the same primitive that powers
  time-travel powers your checkpoints.
- **Instant retry is `restart`.** A clean rebuild of world state (no leaked nodes,
  no stale RNG) is a verified checklist item (CONVENTIONS §6). Buffer the retry
  input across the death pause ([[system-grace]], FUN.md law 5).
- **Meta persistence** is the between-run save ([[system-meta-progression]]).

## Fails when…

- **Re-treading solved content.** A death that sends you back through mastered
  rooms taxes time, not skill — the anti-fun that grace exists to kill
  ([[pattern-anti-frustration]]).
- **Retry latency.** Any load/animation between death and retry drains a
  platformer's momentum (contrast Celeste's instant retry).
- **Save corrupts on resume.** If snapshot→restore doesn't round-trip to an equal
  hash, saves silently diverge — test it (CONVENTIONS §5).
- **Restart leaks.** Stale nodes or un-reset RNG after `restart` mean run N+1
  inherits run N's ghosts (CONVENTIONS §6).
- **Non-determinism sneaks in.** Any wall-clock or `Math.random` outside `world.rng`
  makes a restored world *not* resume identically.

## Verify

- **Snapshot round-trip:** `snapshot → serializeSnapshot → parseSnapshot → restore`,
  assert equal `world.hash()` at every checkpoint (CONVENTIONS §5, FUN.md law 7).
- **Restart is clean:** `restart` fully rebuilds state — no leaked nodes, no stale
  RNG (CONVENTIONS §6).
- **Retry buffers intent:** frame-pump the death→retry window and assert the
  buffered input is accepted ([`src/verify/gates.ts`](../../src/verify/gates.ts)
  forgiveness gate; FUN.md law 5).
- **Full run pinned:** `t.golden('full run', world.hash())` proves the whole
  session replays bit-exactly (CONVENTIONS §7).

## Composes with

- [[system-session-structure]] — session length dictates checkpoint granularity.
- [[system-meta-progression]] — the persistent save between runs.
- [[system-grace]] — instant retry and input-buffering-through-a-pause are grace.
- [[pattern-anti-frustration]] — respecting time is the mindset this system enforces.

## See also

- [`docs/CONVENTIONS.md`](../../docs/CONVENTIONS.md) — pure state, snapshot/hash, restart cleanliness.
- [`docs/WORKSHOP.md`](../../docs/WORKSHOP.md) — the `SnapshotRing` and replay round-trip.
- [[anchor-celeste]] · [[anchor-hades]] — instant retry and death-as-progress.
