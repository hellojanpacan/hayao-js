---
id: genre-tactics
title: Turn-Based Tactics
kind: genre
tags: [tactics, turn-based, grid, telegraphs, perfect-information, puzzle, positioning]
summary: Rewriting a telegraphed future — perfect information, honest tells stored as directions, and every fight a solvable positioning puzzle.
use-when: You want a grid combat game where you see the enemy's plan and the fun is redirecting it, not out-rolling it.
composes-with: [system-telegraphs, system-enemy-archetypes, system-encounter-design, system-combat-model, system-difficulty-and-dda]
anchors: [anchor-into-the-breach]
verify-with: design/FUN.md#12--turn-based-tactics-into-the-breach-like
---

# Turn-Based Tactics

**What it is.** Grid combat where the enemy **shows you their whole plan**, then
you act. No hidden rolls, no fog — the fun is *rewriting a telegraphed future*
with positioning: push an enemy so its attack hits another enemy, block a spawn,
bump a unit off a ledge. Each fight is a solvable puzzle, not a dice game.

**Player fantasy / why it's fun.** *"I saw the disaster coming and turned it
against them."* Perfect information makes you feel like a chess master: the win
is *found*, not *rolled*, and a clean multi-enemy redirect is pure satisfaction.

## Pillars

1. **Rewrite the telegraph.** Store telegraphs as **directions on units**, not
   target tiles — so pushing a unit *re-resolves* what it hits. The telegraph is
   a live plan you edit, which is the entire game.
2. **Perfect information, perfect honesty.** What's shown is exactly what
   resolves. No hidden variance. The genre's trust is that the display is the
   truth (law 6).
3. **Both proofs, every scenario.** A scenario needs a *winning line* AND a
   *losing do-nothing*. If passivity survives, there's no threat; if no line
   exists, it's unfair. The first cut's bug is usually "can't even reach the
   objective."

## The loop stack

| Scale | The beat |
|---|---|
| **Moment** | Read a telegraph → move/push a unit → watch the future re-resolve in your favor. |
| **Encounter** | A scenario: protect an objective from telegraphed threats over N turns using positioning. |
| **Session** | A mission chain / island: escalating scenarios, limited resources carried between them. |
| **Meta** | Unlock squads, mechs, and mechanics; learn the redirect vocabulary. |

## Essential systems

| System | Why it's load-bearing |
|---|---|
| [[system-telegraphs]] | The whole loop. Stored as directions, resolved after your move — the editable future. |
| [[system-enemy-archetypes]] | The threat roles whose telegraphs you redirect — melee, artillery, spawner, boss. |
| [[system-encounter-design]] | Composing archetypes + objectives into a scenario with a findable line and a losing null. |
| [[system-combat-model]] | Push, bump, redirect resolution — the deterministic rules a scenario is built on. |
| [[system-difficulty-and-dda]] | Threat density and turn count as the ramp; harder = tighter lines, not hidden rolls. |

## Content & difficulty model

- **Content is scenarios, not stats.** A scenario is a board + objective + a
  telegraphed threat sequence with a *provable* solution. Hand-authored or
  generated, each must pass the two proofs.
- **Difficulty = tighter solution space.** More threats, fewer turns, harder
  objectives — the line still exists but demands more precision. Never add hidden
  variance to raise difficulty.
- **Every mechanic proven in isolation.** Push, bump, redirect, spawn-block each
  get a unit test before they combine (law 3 / derive-don't-vibe).
- **Bots are real defenders.** A 1-ply greedy planner over `structuredClone`
  scoring is a genuine baseline — it should perfect-clear a solvable scenario and
  the do-nothing bot should lose everything.

## Signature-mechanic seeds

- **Tactics but you command the enemies too** *(perspective)* — set both sides'
  telegraphs, then a rival edits yours; a duel of redirects.
- **Tactics but the grid is a deck you draft** *(structure)* — Into-the-Breach
  meets Slay-the-Spire; your moves are cards. Bridges [[genre-deckbuilder]].
- **Tactics but one push ripples through a chain** *(mechanic-swap)* — dominoes:
  every shove can cascade, turning the board into a physics puzzle.
- **Tactics but you protect a city that remembers** *(theme + structure)* —
  a town rebuilt between missions; buildings saved persist as bonuses.
- **Tactics but the future is shown only for one turn** *(constraint)* — a memory
  variant; you plan several moves against a telegraph you can no longer see.

## Common pitfalls

- **Telegraphs stored as tiles.** If a tell targets a *tile*, pushing the
  attacker doesn't rewrite it — and the core verb (redirect) silently breaks.
  Store directions on units.
- **Hidden variance.** Any concealed roll violates the perfect-information trust;
  a "miss" the player couldn't foresee feels like a betrayal.
- **Passive survives.** A scenario a do-nothing bot lives through has no threat.
  Always assert the losing null.
- **No line exists.** An unsolvable scenario is unfair. Prove the winning line
  before shipping (greedy bot perfect-clears).
- **Objective unreachable.** The classic first-cut bug — the plan can't even
  touch the goal. Test reachability.

## Anchors

- [[anchor-into-the-breach]] — the definitive reference: perfect information,
  telegraphed grid, redirect-the-future. Steal the whole model.
- [[genre-deckbuilder]] — a natural blend (moves-as-cards); shares the
  telegraph-honesty and skill-delta discipline.

## Verify

Prove it in **[FUN.md §12 · Turn-based
tactics](../FUN.md#12--turn-based-tactics-into-the-breach-like)**: the
greedy bot perfect-clears, the do-nothing bot loses everything, each mechanic
(push/bump/redirect) is proven in isolation, and a golden end-state replays.

## Composes with

- [[system-telegraphs]] — the editable future that IS the loop.
- [[system-enemy-archetypes]] — the threat roles you redirect.
- [[system-encounter-design]] — scenarios with a findable line and a losing null.

## See also

- [`examples/sokoban`](../../examples/sokoban) — the pure `Puzzle<State,Move>`
  logic/view split and clone-and-score bot; tactics is that pattern with
  telegraphs (laws 6, 7).
- [design/FUN.md](../FUN.md) Part 1 — laws 3, 6, 7 underwrite this genre's
  determinism and honesty.
