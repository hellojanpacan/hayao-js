---
id: anchor-civilization
title: Civilization
kind: anchor
tags: [4x, turn-based, strategy, snowball, comeback, tech-tree, one-more-turn]
summary: The 4X "one more turn" engine — many shallow-per-turn systems layered into a deep whole, with victory paths and a snowball you must brake for comebacks.
use-when: The intent is a layered turn-based strategy game where compounding decisions and multiple win paths drive "just one more turn."
composes-with: [genre-rts, system-tech-tree, system-economy, pattern-feedback-loops, system-session-structure]
anchors: []
verify-with: design/FUN.md#9-rts-lite
---

# Civilization

**What it is.** A turn-based 4X (eXplore, eXpand, eXploit, eXterminate) where you
grow a civilisation across millennia. No single system is deep per turn; the depth
is **layering** — economy, tech, culture, diplomacy, military all tick together,
and each turn's small choices *compound*. Multiple **victory paths** (conquest,
science, culture…) mean many strategies win. The famous symptom is "**one more
turn**": the next decision always dangles.

**Player fantasy.** Author of history. You steer a people from a single settler to
a space-faring empire, and every era you unlock a new *layer* of play. The pull is
the compounding — a good decision twenty turns ago is still paying off — and the
horizon always holding one more reachable milestone.

## Design DNA

The engine is **layered compounding on a turn clock**. Each system is simple in
isolation; interacting, they generate deep decisions and long-horizon plans. A
turn's reward is *always* incremental and *always* sets up the next — the
"one-more-turn" hook is a deliberate [[pattern-pacing-and-tension]] design: never
end a turn without dangling an imminent payoff. The central risk is the
**snowball**: 4X economies runaway ([[pattern-feedback-loops]]), so a leader
accelerates away and the game dies at turn 100 of 300. Civ's answer is
**comeback/catch-up brakes** — tech diffusion, war weariness, per-city upkeep — so
a lead is real but not sealed.

## Load-bearing structures

| Structure | Why it works |
|---|---|
| **Layered systems** | Economy/tech/culture/military each shallow per turn; interacting, they yield deep plans. Depth from breadth, not one hard system. → [[pattern-emergence]]. |
| **Multiple victory paths** | Science/culture/domination each win; players pick a lane, and the AI must contest all of them. → [[system-build-diversity]]. |
| **Tech tree across eras** | Research gates whole new layers of play; each era is a legible power/options spike. → [[system-tech-tree]]. |
| **"One more turn" hook** | Every turn ends with an imminent payoff dangling — a growth finishing next turn, a wonder two off. → [[pattern-pacing-and-tension]]. |
| **Snowball with brakes** | Runaway economy (positive loop) is deliberately countered (diffusion, upkeep, war weariness) to keep games contestable. → [[pattern-feedback-loops]]. |
| **Perfect-information turns** | Turn-based and pure-state; the whole game replays deterministically and clones for AI scoring. (FUN.md law 7). |

## What to steal

- **Layering over depth**: many *simple* interacting systems out-produce one
  complex system for emergent decisions — and each is separately verifiable.
- The **"one more turn" pacing rule**: never let a turn end without an imminent,
  visible payoff. This is the retention engine. → [[pattern-pacing-and-tension]].
- **Multiple win paths** as replayability *and* as a balance test: the AI must
  contest each lane, so no single strategy dominates. → [[system-build-diversity]].
- **Snowball brakes**: pair every runaway positive loop with an explicit
  catch-up mechanic, or the game decides itself early. → [[pattern-feedback-loops]].

## What's just theme (drop it)

- The **real-world history** — leaders, wonders, and civs are flavour on a
  layered-4X spine; a fantasy, sci-fi, or abstract skin plays identically.
- **The exact five victory types** — the principle is "≥2 viable lanes," not the
  specific set. → [[world-theme-vectors]].
- **Hex map / literal units** — one presentation of "regions you develop"; a
  node-graph or card layout carries the same layering.
- **Scale (millennia, huge maps)** — the loop works at any scale; a single-session
  micro-4X keeps the DNA. → [[system-session-structure]].

## Composes into

- [[genre-rts]] — the turn-based strategy neighbour (shared macro/economy DNA;
  Civ trades real-time mass for layered turns).
- [[system-tech-tree]] — era research as the layer-unlock spine.
- [[system-economy]] — the compounding faucets/sinks that fund every lane.
- [[pattern-feedback-loops]] — the snowball and its required comeback brakes.
- [[pattern-pacing-and-tension]] — "one more turn" as an explicit pacing design.

## Twist seams

- **Civ but one session, one sitting** *(structure / constraint)* — a micro-4X
  that resolves in 30 minutes; layering without the epic length. Pairs with
  [[system-session-structure]].
- **Civ but you're one citizen** *(perspective)* — history from the ground: the
  empire is the *environment*, you a person living through its eras. Pairs with
  [[anchor-stardew-valley]].
- **Civ but the map is a deck** *(mechanic-swap)* — replace the hex world with a
  drafted card layout of provinces; layering survives the medium swap. Pairs with
  [[genre-deckbuilder]].
- **Civ but comeback-only** *(constraint)* — always play the underdog; the twist is
  a snowball you fight *against*, inverting the fantasy. Pairs with
  [[pattern-feedback-loops]].

## See also

- [`design/FUN.md#9-rts-lite`](../FUN.md) — strategy is the balance test; the
  intended line must beat the null line; pure-state turns clone for AI scoring.
- [[system-tech-tree]] · [[anchor-age-of-empires]] (real-time cousin) ·
  [[pattern-feedback-loops]].
