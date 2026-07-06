---
id: system-meta-progression
title: Meta-Progression — Persistent Unlocks Between Runs
kind: system
tags: [meta-progression, roguelite, unlocks, persistence, power-creep, always-earn, runs]
summary: The campaign under the runs — persistent unlocks that make a lost run still pay; the "always earn something" contract, and power-creep vs new options.
use-when: The game is run-based and you need each death to advance a longer arc, so failure feels like progress instead of a wiped slate.
composes-with: [system-progression, system-skill-trees, system-reward-schedules, system-save-and-checkpoint, system-session-structure]
anchors: [anchor-hades, anchor-dead-cells, anchor-nuclear-throne]
verify-with: docs/FUN.md#10-traditional-roguelike
---

# Meta-Progression — Persistent Unlocks Between Runs

**What it is.** The layer of power and content that **survives death.** A run
ends; the run's soft growth resets; but a slower, permanent ledger — unlocked
weapons, upgraded stats, new rooms, story beats — carries forward and shapes the
*next* run.

**Player fantasy / why it's fun.** "I lost, but I'm further along." Meta-
progression is what turns a roguelike's clean-slate purity into a roguelite's
long pull. Death stops being a punishment and becomes **content**
(**[[anchor-hades]]** — every death is a scripted conversation).

## When to use / when NOT

| Use it when | Skip it when |
|---|---|
| Runs are short and lossy; you need a reason to re-enter | The genre's soul is the clean wipe (traditional roguelike, **[[FUN.md §10]]**) |
| You want to gate content/difficulty behind repeated play | Persistent power would erase the mastery that IS the game (Spelunky purists) |
| Failure needs a consolation that isn't hollow | You can't afford to balance a moving power floor |

The tension to declare up front: **persistent power vs. persistent options.**
Power (permanent +stats) makes the game *easier over time* — comforting, but it
can turn skill into patience. Options (new weapons, new rooms, new starts) make
it *wider* without making it softer. Most durable roguelites lean options-heavy
and keep power gains small and capped.

## Variants

| Variant | What persists | Risk | Example |
|---|---|---|---|
| **Power meta** | Permanent stat/heart upgrades | Grind-to-win; skill floor erodes | Rogue Legacy manor |
| **Options meta** | New weapons/rooms/starts unlock | Balance sprawl | Dead Cells blueprints; Nuclear Throne chars |
| **Narrative meta** | Story advances across deaths | Runs out of content | Hades relationships |
| **Difficulty meta** | Harder tiers unlock (opt-in) | Only for the committed | Hades' Heat / pact of punishment |
| **Cosmetic meta** | Looks only, zero power | Weak pull for some | Skins, dyes ([[system-collectibles]]) |

## Tuning levers

| Lever | What it controls | Healthy range / rule |
|---|---|---|
| **Per-run payout floor** | The "always earn something" contract | Every run — even a 30-second death — grants *something* spendable |
| **Power-creep ceiling** | How much easier meta makes the game | Cap it. Small, felt, bounded — options over raw power |
| **Unlock cadence** | Runs between meaningful unlocks | ~1–3 runs early, stretching later; never a desert |
| **Front-load vs slow burn** | When the good stuff arrives | Front-load the *first* unlock to hook; pace the rest |
| **Opt-in difficulty** | Where mastery lives after power caps | Ascension/Heat tiers give the ceiling back to skill |
| **Reset granularity** | What a death actually costs | Soft (run) power gone; hard (meta) safe. Be explicit |

The **contract** that keeps a lossy loop kind: *no run is wasted.* Even a death
on floor 1 must convert to meta currency. Assert it — the null run (do-nothing,
instant death) still returns > 0 to the ledger.

## How it wires to Hayao

- **Two state scopes.** Run state (resets each run) and meta state (persists) are
  distinct slices of `world.state`. The run hashes for goldens; the meta slice is
  written through `SaveManager` + `LocalStorageAdapter` (grep `docs/API.md`) at
  `SAVE_FORMAT_VERSION`, so unlocks survive reload and version cleanly.
- **Unlocks are input-driven.** Spending meta currency to buy an unlock is an
  **input action**, so the whole meta arc replays and hashes (**[[FUN.md law 7]]**).
- **The between-run screen is chrome.** The hub/upgrade menu is `showScreen()`
  DOM, `cosmetic` where it renders in-world (CLAUDE.md invariant 4).
- **Prove the floor.** A test runs the *worst* run (instant death) and asserts the
  meta ledger still gained — the "always earn something" contract as CI, the same
  shape as a null-strategy baseline (**[[FUN.md law 4]]**).

## Fails when…

- **Grind gates.** Content locked behind dozens of runs of *the same* content —
  the unlock is a timer, not a reward.
- **Power creep to autopilot.** Permanent stats stack until skill stops mattering;
  the game solves itself. Cap power; give the ceiling back via opt-in difficulty.
- **The empty death.** A run that returns nothing to the ledger. Every loss must
  pay something, or losing feels like theft.
- **Front-load nothing.** No early unlock → the first hour is the hardest *and*
  the least rewarding. Hook with the first unlock fast.
- **Two economies fighting.** Meta currency and in-run currency confused for each
  other — keep faucets/sinks per scope explicit ([[system-economy]]).

## Verify

- The "always earn" floor as a null-run assertion: **[[FUN.md law 4]]**.
- Meta arc replays & hashes (persistent state round-trips): **[[FUN.md law 7]]**
  and save/load hash round-trip (**[[FUN.md §3]]** metroidvania pattern).
- Difficulty stays in a *window* after meta power applies: **[[FUN.md §11]]**.
- Roguelike baseline (what meta modifies): **[[FUN.md §10]]**.

## Composes with

- [[system-progression]] — meta is the *hard*, persistent axis under soft run growth.
- [[system-skill-trees]] — a persistent tree is the classic meta-power shape.
- [[system-save-and-checkpoint]] — meta persistence rides the save system.
- [[system-session-structure]] — meta only makes sense atop a run/campaign shape.
- [[system-reward-schedules]] — the drip that fills the meta ledger.
- [[pattern-feedback-loops]] — beware the runaway loop where power → easier → more power.

## See also

- [`docs/FUN.md`](../../docs/FUN.md) §10, laws 4 & 7 — roguelike baseline, null
  proof, persistent-state round-trip.
- **[[anchor-hades]]** · **[[anchor-dead-cells]]** — the two canonical meta shapes
  (narrative-as-meta; options-as-meta).
- `src/content/` — generate the run-space content the meta unlocks gate into.
