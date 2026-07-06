---
id: system-reward-schedules
title: Reward Schedules — Drops, Chests & Ethical Compulsion
kind: system
tags: [rewards, variable-ratio, loot, drops, chests, compulsion, dark-patterns, ethics]
summary: How often and how surprisingly the game pays out; variable-ratio's grip, and the honest line between compelling and exploitative.
use-when: The design hands out loot, drops, or chests and you need the payout rhythm to feel exciting without tipping into manipulation.
composes-with: [system-economy, system-collectibles, system-meta-progression, system-progression, system-procgen-design]
anchors: [anchor-vampire-survivors, anchor-hades, anchor-peggle]
verify-with: docs/FUN.md#19-physics-arcade-breakoutpeggle
---

# Reward Schedules — Drops, Chests & Ethical Compulsion

**What it is.** The **schedule** on which the game pays out — fixed (every N), or
**variable-ratio** (random, averaging N). Variable-ratio is the most powerful
reinforcement pattern known, which is exactly why it demands an ethical hand. This
module is about wielding its *grip* to make earning thrilling — and refusing its
use to *extract*.

**Player fantasy / why it's fun.** "Maybe *this* one." Anticipation is the reward;
the drop is the payoff. Uncertainty makes a trivial input (Peggle's last peg,
opening a chest) feel enormous (**[[anchor-peggle]]**, maximal juice on trivial
input).

## When to use / when NOT

| Use it when | Skip it when |
|---|---|
| Loot/drops are a core reward channel | Rewards are deterministic and that's the point (puzzle clears) |
| Anticipation itself is fun (chests, gacha-of-cosmetics) | The randomness would gate *required* progress unfairly |
| You want surprise to punctuate a grind | It'd become a slot machine dressed as a game |

**The honesty line.** Variable-ratio is fine for *cosmetics, flavor, and bonus*
rewards where the base game is complete without them. It becomes a **dark pattern**
when it gates required power behind paid randomness, hides odds, or engineers
loss-aversion (streaks you'll "lose"). Design compulsion you'd be proud to explain.

## Variants

| Variant | Schedule | Feels like | Watch for |
|---|---|---|---|
| **Fixed-ratio** | Reward every N | Reliable, plannable | Predictable → less exciting |
| **Variable-ratio** | Random, averages N | The slot-machine pull | Ethics; the honest use is *cosmetic/bonus* |
| **Fixed-interval** | Reward every T time | Daily-login cadence | Retention manipulation if punitive |
| **Pity / bad-luck protection** | Guaranteed by attempt N | Fairness floor on RNG | *Always* add this to variable-ratio |
| **Tiered / weighted** | Common→rare distribution | Chase the rare | Odds must be *shown* |
| **Deterministic reveal** | RNG resolved, shown honestly | Trust | This is the ethical default |

## Tuning levers

| Lever | What it controls | Healthy range / rule |
|---|---|---|
| **Base rate** | How often you pay out | Frequent small + rare large — a steady drip with peaks |
| **Variance** | How swingy | Enough surprise to thrill; not so much it feels arbitrary |
| **Pity timer** | The fairness floor | *Mandatory* on any variable-ratio — guarantee by attempt N |
| **Odds transparency** | Whether players know the chances | Show them. Hidden odds are a dark pattern, full stop |
| **What's behind RNG** | Cosmetic vs required power | Keep *required* progress off the random schedule |
| **Anticipation window** | The pause before reveal | Long enough to build tension, short enough not to annoy ([[pattern-juice-choreography]]) |

### Dark patterns to refuse

- **Hidden odds** — never. Publish them.
- **Pay-to-random for power** — required strength behind a paywalled RNG box.
- **Loss-aversion engineering** — "your streak resets in 2h" pressure.
- **Near-miss manufacturing** — faking "so close!" reveals to bait retries.
- **FOMO scarcity** — artificial time-limited rarity to force impulse.

Compulsion is a tool; extraction is a choice. The Codex's stance: use anticipation
to *reward* engagement, never to *punish* disengagement.

## How it wires to Hayao

- **RNG is sim, through `world.rng`.** Every drop rolls on `world.rng` — never
  `Math.random` (CLAUDE.md invariant 2). This makes the whole schedule
  *deterministic per seed*: a golden run hashes identically, and you can *audit*
  the payout distribution in a test.
- **Resolve, then choreograph.** The sim resolves the drop instantly and *returns*
  the reveal as choreography; the view plays the chest-open, the flash, the rarity
  color (`LAYER_HUD`, `cosmetic = true`) — deletable without changing the outcome
  (**[[FUN.md law 6]]**). The anticipation is *view time over sim truth*, like
  match-3's cascade script (**[[FUN.md §13]]**).
- **Audit odds and pity in CI.** Roll N drops over seeds; assert the empirical
  distribution matches the *stated* odds and that pity fires by attempt N — the
  same "intent honesty" audit deckbuilders run on telegraphs (**[[FUN.md §11]]**).
- **Prove the base game is complete without the RNG** — a bot that never opens a
  random reward still clears the game. That's the ethical proof.

## Fails when…

- **No pity floor.** Pure RNG can strand a player for hundreds of attempts — cruel.
  Always cap it.
- **Hidden or lying odds.** The distribution doesn't match the shown numbers — an
  auditable, shippable-blocking bug *and* an ethics failure.
- **Required power behind RNG.** Progress gated on luck (or a wallet) — the game is
  now a slot machine.
- **Reveal fatigue.** Anticipation windows so long or frequent they annoy — tune
  the pause.
- **Reward inflation.** Everything's legendary → nothing is. Rarity needs scarcity
  ([[system-economy]] inflation).

## Verify

- Odds/pity distribution audit over seeds (intent honesty): **[[FUN.md §11]]**.
- Determinism per seed (golden hash of a drop run): **[[FUN.md law 7]]**.
- Reveal is cosmetic — sim resolves, view replays, hashes equal: **[[FUN.md law 6]]**.
- Base game clears without opening any random reward (a null-reward baseline):
  **[[FUN.md law 4]]**.

## Composes with

- [[system-economy]] — drops are a faucet; rarity is inflation control.
- [[system-collectibles]] — variable-ratio drives set completion.
- [[system-meta-progression]] — the meta ledger fed by run rewards.
- [[system-procgen-design]] — seeded randomness shares the same rng discipline.
- [[pattern-juice-choreography]] — the anticipation→reveal is pure choreography.
- [[pattern-risk-reward]] — push-your-luck chests turn the schedule into a decision.

## See also

- [`docs/FUN.md`](../../docs/FUN.md) §11 (intent-honesty audit) · law 6 (resolve-
  then-choreograph) · law 4 (null baseline).
- [`docs/JUICE.md`](../../docs/JUICE.md) — the anticipation→reveal feel gates.
- **[[anchor-peggle]]** — maximal juice on a trivial, uncertain input.
