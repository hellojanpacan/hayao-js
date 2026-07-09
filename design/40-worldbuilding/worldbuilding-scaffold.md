---
id: world-worldbuilding-scaffold
title: Worldbuilding Scaffold — the minimum viable world
kind: worldbuilding
tags: [lore, world, setting, stakes, fantasy, rules, coherence, scaffold]
summary: From a setting to a coherent world with rules, stakes, and a fantasy — the minimum viable lore a small deterministic game actually needs.
use-when: You picked a theme and need to turn it into a world that holds together — enough lore to justify the mechanics, no more.
composes-with: [world-theme-vectors, world-faction-identity, world-narrative-delivery, world-naming-and-tone]
verify-with: none
---

# Worldbuilding Scaffold — the minimum viable world

**What it is.** A world is not a wiki. For a small deterministic game it's a
tight bundle: a **premise**, the rules that premise implies, the stakes that make
a loss sting, and the fantasy the player is buying. Build the load-bearing
minimum, then stop. Every sentence of lore should either justify a mechanic or
raise the stakes; if it does neither, it's decoration.

**Player fantasy / why it's fun.** A coherent world makes the player *fill in the
rest*. Give them a rule and a stake and they'll imagine the history for free.
Your job is the skeleton, not the encyclopedia.

## The five load-bearing pieces

A world holds together when these five agree. Write one line each — that's the
whole doc for a small game.

| Piece | The question it answers | Kept small by |
|---|---|---|
| **Premise** | What is the world and what just went wrong? | One sentence. "The tide is rising and the lantern network is failing." |
| **Rules of the world** | What's true here that isn't true elsewhere? | 2–3 rules max, each mapping to a mechanic |
| **Stakes** | What's lost if you fail? | Something concrete and small enough to feel |
| **The player's role** | Who are you, and why is it *your* problem? | A verb: keeper, mender, surveyor, forager |
| **The fantasy** | What does the player get to *feel*? | One clause; this is the sales pitch |

The discipline: **every rule of the world is a mechanic in disguise.** If a
lore rule has no mechanical echo, it's flavour — fine in small doses, but it
isn't scaffolding. If a mechanic has no lore rule, the player will invent one;
make sure it's the one you want.

## Vectors / options — how much world does the scope need?

Match lore weight to session shape ([[system-session-structure]]):

| Game shape | World weight | What you actually write |
|---|---|---|
| Single-screen puzzle / arcade | **A premise line** | One evocative sentence; the mechanic is the story |
| Run-based (roguelite) | **Premise + 2 rules + a role** | Enough for the loop to *mean* something across runs |
| Campaign / metroidvania | **Full five + a place-geography** | Regions with identity; a why-here for each gate |
| Systemic / emergent | **Premise + rules that interact** | Lean lore; the *systems* author the stories ([[system-emergent-systems]]) |

More world is not better world. *tarnholm* and *rootward* say almost nothing
explicitly — the premise is in the name and the mechanics carry the rest.

## Method

1. **Write the premise line.** The world plus the disturbance — the thing that
   makes it a *game* and not a diorama. Inherit the register from
   [[world-theme-vectors]].
2. **Derive 2–3 rules of the world** *from your mechanics*, phrased as fiction.
   Mechanic "resources decay" → rule "nothing keeps in the salt air." Mechanic
   "you can't be everywhere" → rule "one keeper, many lamps." Each rule is a
   promise the systems must keep.
3. **Set the stake.** Name what failure costs in the fiction — and make it
   concrete and *scaled to the loop*, not "the world ends." A drowned village
   reads; a fallen empire is abstract in a 5-minute run.
4. **Name the role with a verb.** Keeper, mender, surveyor. The verb is the
   player's fantasy and often the core mechanic's name.
5. **State the fantasy in one clause.** "The quiet competence of keeping the
   light on." This is what the [[world-aesthetic-direction]] and
   [[pattern-juice-choreography]] must deliver on.
6. **Cut everything else.** If a fact doesn't back a rule, a stake, or the
   fantasy, it's out of the scaffold. Let players imagine the rest.

## Worked example

**Premise:** *"A coastal shrine-network is drowning; the last keeper walks the
path relighting lanterns before the dark and the tide close it."*

- **Rules of the world:** (1) *Light holds the dark back only while it burns* →
  timed lantern mechanic. (2) *One keeper, many lamps* → you can't cover
  everything; routing is the game. (3) *Oil is scarce and doesn't keep* →
  a resource loop that punishes hoarding.
- **Stake:** each lantern that goes dark strands the hamlet behind it — a small,
  legible loss, not an abstract apocalypse.
- **Role:** the **keeper** — the verb is the mechanic.
- **Fantasy:** *the quiet, dwindling competence of holding a line of light against
  a rising night.*

Three sentences of lore; three mechanics justified; one feeling to deliver.
Anything more is a wiki.

## Aesthetic hook

The **Kentō woodblock** register (`MEADOW`/`DUSK`; see
[[world-aesthetic-direction]]) is quiet, weathered, and elegiac by construction —
it rewards *small, human* stakes over cosmic ones. A world of one keeper and a
drowning coast reads instantly in ink and washi; a galactic-empire premise fights
the intimacy the palette wants. Let the scaffold's *scale* match the look: the
house lean is small worlds with big feelings. The premise line doubles as the
title/first-screen invitation the JUDGE scores for "invites" (chrome & finish).

## Traps

- **The encyclopedia.** Pages of history no mechanic touches. Cut to the
  load-bearing five.
- **Rule without echo.** Lore that promises something the systems never deliver
  ("the gods are watching" but nothing watches). Every rule needs a mechanic.
- **Stakes too big to feel.** "Save the universe" is abstract; "don't let this
  village go dark" lands. Scale the stake to the session.
- **Role without a verb.** "You are the chosen one" is a title, not a fantasy.
  Name what you *do*.
- **Front-loaded lore dump.** Text walls at the start. Deliver the world through
  play — [[world-narrative-delivery]].

## Composes with

- [[world-theme-vectors]] — supplies the register and the rhyme this scaffold
  builds on.
- [[world-faction-identity]] — when the world has sides, each faction is a
  sub-scaffold with its own premise and values.
- [[world-narrative-delivery]] — how the scaffold reaches the player without
  text walls.
- [[world-naming-and-tone]] — the premise line and role verb are named here.

## See also

- [`design/JUDGE.md`](../JUDGE.md) — chrome & finish: does the first screen
  *invite*? The premise line is your invitation.
- Example worlds *lanternway*, *rootward*, *tarnholm*, *kintsugi* — each is a
  three-sentence world, not a wiki (reference the *restraint*, not the content).
