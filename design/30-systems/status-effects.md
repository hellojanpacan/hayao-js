---
id: system-status-effects
title: Status Effects — damage and change over time
kind: system
tags: [status, dot, buff, debuff, stacking, poison, burn, legibility]
summary: DoT, buffs, and debuffs as first-class state — with stacking rules that are legible, bounded, and interact with builds instead of just piling up.
use-when: You want conditions (poison, burn, slow, shield, rage) that persist across turns/seconds and interact with the rest of combat.
composes-with: [system-combat-model, system-counter-systems, system-build-diversity, system-telegraphs]
anchors: [anchor-slay-the-spire, anchor-hades]
verify-with: docs/FUN.md#11-roguelike-deckbuilder
---

# Status Effects — damage and change over time

**What it is.** **Conditions** that persist: poison ticking each turn, a burn, a
shield, a slow, a rage buff. Status turns a hit from a one-frame event into a
*state you carry* — the layer that lets [[system-build-diversity]] and
[[system-counter-systems]] interact instead of just stacking flat numbers.

**Player fantasy / why it's fun.** Setting up. The poison you stacked three turns
ago finally kills; the shield you pre-cast eats the boss's big hit. Status rewards
*plans*, not just reactions — it's the memory of combat.

## When to use / when NOT

| Use status when… | Skip when… |
|---|---|
| You want set-up-then-payoff play | Combat is pure twitch reaction |
| Builds should interact (a synergy engine) | You have < ~4 effects (just make them direct) |
| Counters need a vocabulary (cleanse, resist) | Legibility budget is already spent |

Every status is a rule the player must hold in their head. Ship the fewest that
carry the most interaction — a bloated status list is unreadable, not deep.

## Variants

| Kind | Shape | Stacking | Example |
|---|---|---|---|
| **DoT** (poison, burn) | damage per tick, N ticks | intensity or duration | Slay the Spire poison (−1/turn, decays) |
| **Debuff** (slow, weak, vuln) | multiplier on the target | usually duration | weak = −25% dmg dealt |
| **Buff** (rage, haste, shield) | multiplier / absorb on self | intensity or refresh | block that expires next turn |
| **CC** (stun, freeze, root) | skips/limits actions | rarely stacks; diminishing | one turn skipped |
| **Trigger** (mark, curse) | fires on a condition | count-based | "next hit crits" |

## Stacking rules — pick one per effect, state it

| Rule | Behaviour | Good for |
|---|---|---|
| **Intensity** | more applications = bigger effect | poison, bleed |
| **Duration** | more applications = longer, same size | slow, weak |
| **Refresh** | re-apply resets the timer, no stack | most buffs |
| **Independent** | each application is its own timer | rare; hard to read |
| **Cap** | stacks up to N, then no-op | keep any of the above bounded |

Ambiguous stacking is the #1 status bug. Decide intensity-vs-duration *per effect*
and cap it — an uncapped intensity DoT trivializes the game (FUN.md law 3).

## Tuning levers

| Lever | Does | Healthy range |
|---|---|---|
| **Tick timing** | when DoT resolves | fixed point in the turn/second; deterministic |
| **Decay** | how stacks fall off | poison −1/turn keeps it self-limiting |
| **Cap** | max stacks/intensity | always set one |
| **Cleanse cost** | price to remove a status | real, so statuses are a threat not a nuisance |
| **Duration** | turns/seconds it lasts | long enough to matter, short enough to plan around |

## How it wires to Hayao

- **Status is pure state** on the entity in `world.state` — a `{ id, stacks, turns }`
  list, resolved by a pure tick function; all rolls via `world.rng`. That makes
  clone-and-score bots free (FUN.md law 7): pilot the intended build, assert it beats
  the null build (FUN.md law 2, §11 draft-delta).
- **Legibility is intent honesty.** A shown "poison 6" must deal exactly 6 over its
  ticks (FUN.md §11 — resolve the telegraph, compare to the number). Audit it.
- **The tick returns choreography** — the number pop and tint are cosmetic
  (`FloatingText`, `FLOAT_PRESETS`; JUICE Part 1), out of `world.hash()`.
- No special engine primitive is needed — status is *your* data. Grep [`docs/API.md`](../../docs/API.md)
  before citing; there is no `applyStatus` in the surface, and there shouldn't be.

## Fails when…

- **Uncapped intensity.** One infinite-scaling DoT becomes the only strategy
  (dominant, [[system-build-diversity]] collapses).
- **Illegible stacking.** The player can't predict the tick, so they stop planning —
  status becomes noise, not depth.
- **No counter-play.** A status with no cleanse/resist and a long duration is just
  unfair; give the vocabulary a full loop ([[system-counter-systems]]).
- **Silent resolution.** Ticks with no pop/tint read as HP randomly draining. Answer
  on ≥ 2 senses (JUICE).

## Verify

- **[FUN.md §11](../../docs/FUN.md)** — draft/build delta (the status build beats the
  null build); intent honesty (shown status == resolved damage).
- **[FUN.md law 3](../../docs/FUN.md)** — the cap inequality asserted against config.
- Determinism: golden hash of a scripted fight with statuses; view-on == view-off.
- Feel: number pops answer on ≥ 2 senses → **[JUICE.md Part 3](../../docs/JUICE.md)**.

## Composes with

- [[system-combat-model]] — status is damage/change that resolves over the model's clock.
- [[system-counter-systems]] — cleanse/resist/immunity are the counter vocabulary.
- [[system-build-diversity]] — status synergies are a primary source of viable builds.
- [[system-telegraphs]] — a big incoming debuff should itself telegraph.

## See also

- [`docs/FUN.md`](../../docs/FUN.md) §11 — deckbuilder draft-delta and intent honesty.
- [`docs/JUICE.md`](../../docs/JUICE.md) Part 1 — `FloatingText` / `FLOAT_PRESETS` for pops.
- [[anchor-slay-the-spire]] — the reference for legible, capped, build-defining status.
