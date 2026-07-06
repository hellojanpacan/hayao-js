---
id: antipattern-stat-inflation
title: Stat Inflation
kind: antipattern
tags: [progression, numbers, feel, fake-growth]
summary: Bigger numbers standing in for real progression — +10% forever, with no new decision behind the growth.
use-when: Your progression adds magnitude without adding options.
composes-with: [system-progression, system-skill-trees, antipattern-power-creep]
verify-with: docs/VERIFICATION.md
---

**What it is.** Progression that raises **magnitude** without changing what the player does. +10% damage, +50 HP, tier-7 sword — the bar fills, the fantasy of growth is sold, but the *decision space* is frozen. You fight the same, you just fight it in bigger digits.

**Why it hurts.** Growth you can't feel is growth that isn't there. If the enemy's HP scaled to match your damage, the fight is identical to hour one — you've spent the session running to stand still. The **treadmill** feels like effort and reads as nothing.

## The smell

Numbers rise but play doesn't change. Strip the UI and the moment-to-moment inputs, timings, and choices at hour 20 are the ones from hour 1. The reward is a larger integer, not a new verb.

## How it happens

- **Damage is the only knob.** Every upgrade multiplies one stat because a multiplier is trivial to author and to tune. Verbs are expensive; percentages are free.
- **Enemy scaling cancels it.** You buff the player 10%, so you buff the encounter 10% to hold the curve — now the buff is invisible by construction. See [[system-difficulty-and-dda]] doing this badly.
- **Skill tree is a stat sheet.** The [[system-skill-trees]] exists but every node reads "+X% Y." A tree of numbers is a shopping list, not a build. See [[antipattern-fake-choice]].
- **Loot tables print tiers.** [[system-loot-tables]] hand out Sword +7 → Sword +8, same swing, higher label. See [[antipattern-power-creep]] for the arms-race sibling.
- **Prestige without a new lever.** [[system-prestige-and-newgame-plus]] resets the bar and hands back the same climb with a ×2 sticker.

## The tell (check YOUR design)

Run these on your own progression before handoff:

| Probe | Inflated | Real growth |
|---|---|---|
| **Decision test** | Post-upgrade, the optimal action is unchanged | A new option becomes viable or dominant |
| **Verb count** | Same moves at hour 20 as hour 1 | New verb, or old verb in a new context |
| **Strip-the-number** | Hide all stats — the build is indistinguishable | Hide stats — you still play differently |
| **Enemy-cancels** | Damage +10% *and* enemy HP +10% | The buff shifts what you can survive/skip |
| **Screenshot at two depths** | Only the digits differ | The *board* differs |

If three rows land in the left column, you're inflating. The fix isn't a better curve — it's a different currency of reward.

## The fix

Trade magnitude for **options**. Every meaningful upgrade should change a *decision*, not just a number.

- **Unlock verbs, not multipliers.** A [[system-skill-trees]] node should grant a [[mechanic-dash]], a [[mechanic-double-jump]], a [[mechanic-parry]] — a new thing you *do* — before it grants +X%. Route growth through [[system-progression]] and [[system-tech-tree]] as capability gates.
- **Make numbers cross thresholds.** If a stat must rise, tie it to a **breakpoint**: this much attack speed cancels the recovery frame; this much range one-shots a whole [[system-enemy-archetypes]]. A number that unlocks a *tactic* is real. See [[pattern-mastery-and-flow]].
- **Grow the option pool, not the values.** [[system-build-diversity]] and [[system-status-effects]] add growth you feel: a new synergy, a new counter, a new [[pattern-risk-reward]] line. See [[system-emergent-systems]].
- **Let growth open the map, not the damage bar.** In a [[genre-metroidvania]] the reward is *access* — [[mechanic-grapple]], [[mechanic-wall-jump]] — which reshapes where you can go. That's felt growth with zero stat inflation.
- **Reward with schedule and meaning, not size.** Pair with [[system-reward-schedules]] and [[system-meta-progression]] so the *kind* of reward escalates, not just the quantity. See [[pattern-escalation-and-payoff]].

## Seen in

- **Diablo-likes / ARPG endgame** — the canonical treadmill: +damage%, +area%, higher-tier zones, enemy HP scaled to match. Ilvl goes up, the click loop is frozen. The genres that *escape* it (see the good end of [[genre-roguelike]]) do so by making upgrades change verbs.
- **[[anchor-vampire-survivors]]** — dodges inflation: leveling adds *new weapons and evolutions*, not just +damage. Each pick changes the screen. Contrast a version where every pick was "+10% damage" — same swarm, bigger numbers, dead build.
- **[[anchor-slay-the-spire]]** — a card that reads "+2 damage" is often a trap pick; the deck grows by *new plays* (scaling engines, synergies), not raw stats. See [[genre-deckbuilder]] and [[system-build-diversity]].
- **[[anchor-hades]] / [[anchor-dead-cells]]** — boons and mutations are *verb-changers* (chain lightning, retaliation, dash-strikes), so a run *feels* different even when the DPS number is similar.
- **Grindy MMOs** — [[antipattern-grind-wall]]'s cousin: hours of farming buy +item-level that the next zone's scaling erases. The [[system-economy]] moves; the game doesn't.
- **[[anchor-loop-hero]]** — resists it by making each tier *unlock placement rules and synergies*, so more power means more board decisions.

## Twist seams

- **Idle/incremental but every prestige unlocks a mechanic, not a multiplier** (twist vector: reward-currency — swap the ×2 sticker for a new [[genre-incremental]] verb each layer, so [[system-prestige-and-newgame-plus]] adds decisions).
- **RPG but stats are thresholds, never linear** (twist vector: value-shape — a stat does nothing until it crosses a breakpoint that enables a tactic; see [[anchor-into-the-breach]] — precision over magnitude).
- **Loot game but items grant verbs, not tiers** (twist vector: what-drops — [[system-loot-tables]] print *abilities* and [[system-status-effects]] instead of Sword+8, so growth is horizontal).

## Verify / guard

Guard against inflation the same way you catch [[antipattern-false-depth]]: a build that reads different but *plays* identical is inflated. Before handoff, run the decision test and strip-the-number probe from the tell table; if hiding every stat leaves play unchanged, the growth is cosmetic. See docs/VERIFICATION.md, and cross-check the sibling arms-race in [[antipattern-power-creep]] and the empty-tree tell in [[antipattern-fake-choice]].
