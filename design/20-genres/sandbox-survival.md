---
id: genre-sandbox-survival
title: Sandbox Survival
kind: genre
tags: [crafting, open-goals, emergent, build, day-night]
summary: Gather, craft, build, and endure in a systemic world where the player sets the goal and the night sets the pressure.
use-when: You want open-ended creation with survival pressure and self-set goals.
composes-with: [anchor-minecraft, anchor-terraria, system-crafting, mechanic-throw]
anchors: [anchor-minecraft, anchor-terraria]
verify-with: docs/VERIFICATION.md
---

# Sandbox Survival

**What it is.** A systemic world you dig, gather, and shape. You craft tools from
raw material, build shelter, and endure a recurring threat — but the goal is
yours. There is no lose screen scheduled; the **night** is.

**Player fantasy / why it's fun.** *"I made this, and it kept me alive."* Authorship
plus jeopardy: the base you built at dusk is the base tested at midnight. The pull
is a world that answers your ideas — dig here, and there's a cave; stack these two,
and there's a door.

## Pillars

1. **Player authorship.** The player names the goal — a house, a farm, a monument,
   *reach the boss* — and the world is the medium, not the quest-giver. Systems
   must be broad enough that a plan you invent is *expressible*. Give tools, not
   objectives.
2. **Legible material grammar.** Every material reads and combines by consistent
   rules: wood burns, stone shelters, ore upgrades. A player should *predict* a
   recipe before finding it. The grammar is the tutorial ([[system-crafting]]).
3. **Survival pressure as pacing.** The day/night (or season/wave) cycle is the
   metronome. Day is open and calm — gather, build, explore; night is the squeeze
   that makes the day's work *matter*. Pressure paces authorship; it doesn't
   replace it ([[pattern-pacing-and-tension]]).

## The loop stack

| Scale | The loop |
|---|---|
| **Moment** | Swing a tool at a resource node; it yields; the material stacks. |
| **Encounter** | Nightfall: the threat arrives and tests the shelter/gear you built today. |
| **Session** | A gather → craft → build → survive cycle over several days; end with a bigger base and a new capability. |
| **Meta** | The tech/tool ladder and the world map — each unlocked material opens biomes and builds that were previously sealed. |

## Essential systems

| System | Why it's needed |
|---|---|
| [[system-crafting]] | The heart. A legible recipe grammar (raw → refined → tool) that the player can predict, not memorize. |
| [[system-resource-loops]] | Gather → convert → consume must close cleanly; every material needs a sink or the world becomes a hoard. |
| [[system-weather-and-time]] | The day/night (and seasons) cycle *is* the pacing engine — the deterministic clock that schedules the threat. |
| [[system-hazards-and-environment]] | The night threat, biome dangers, hunger/temperature — the pressure that makes shelter meaningful. |
| [[system-progression]] | The optional ladder: tool tiers gate biomes so open goals still have a spine (see below). |
| [[system-procgen-design]] | A world worth exploring, generated within bounds you can reason about and re-seed deterministically. |
| [[system-inventory-and-ui]] | Inventory *is* the puzzle surface here — carry limits and hotbars turn "what do I bring tonight" into a decision. |

## Content & difficulty model

- **Give an optional ladder; that's the antidote to aimlessness.** Terraria is the
  proof: a boss/tier progression sits *underneath* the sandbox — you can ignore it,
  but it always answers *"what now?"*. Minecraft leans harder on self-set goals and
  loses some players to the void. Ship the ladder; let mastery ignore it
  ([[system-progression]], [[pattern-mastery-and-flow]]).
- **Gate biomes behind materials, not walls.** Better tools reach deeper places
  that hold better materials — a self-reinforcing loop where progress is
  *capability*, not a keycard ([[system-tech-tree]], [[pattern-feedback-loops]]).
- **Difficulty rides the clock, not a slider.** Each cycle the threat scales a
  notch; the player's job is to out-build the curve. Assert the night threat
  actually escalates so a fortress can't trivialize it forever.
- **Determinism is the world contract.** Same seed, same world; all worldgen and
  spawns through one deterministic RNG so a base is reproducible and the sim is
  provable. Cosmetic weather/particles stay out of world state.
- **Emergence is content.** The best moments (water + lava = obsidian; sand +
  gravity = a trap) are *combinations you didn't script*. Design the grammar so
  systems collide productively ([[system-emergent-systems]], [[pattern-emergence]]).

## Signature-mechanic seeds

"X but Y" ([[process-the-twist]]) — bend the *world*, the *threat*, or the *frame*.

- **Survival but the world edits your builds each night** — the night doesn't just
  spawn enemies; it *rewrites* terrain, so your base is a moving target you patch
  at dawn. (structure — pairs with [[pattern-pacing-and-tension]])
- **Sandbox but one screen that zooms as you scale** — no scrolling world; the
  single framed view zooms out as your build grows, so scale is legible and the
  whole creation stays on-screen. (constraint — pairs with [[system-camera-and-controls]])
- **Survival but everything you craft is thrown, never held** — tools and defenses
  are placed by throwing; aim and arc are the whole build verb. ([[mechanic-throw]])
- **Sandbox but the material grammar is only three elements** — a tiny periodic
  table whose *reactions* carry all the depth; mastery is chemistry, not a recipe
  book. (constraint — pairs with [[system-emergent-systems]])
- **Survival but day and night are two different players** — one builds by day, one
  attacks by night, sharing the same world. (perspective — pairs with [[genre-coop-chaos]])

## Common pitfalls

- **Aimlessness.** A pure sandbox with no ladder strands the majority who need a
  *"what now?"*. Ship an optional progression spine ([[antipattern-content-desert]],
  [[system-progression]]).
- **Feature soup.** Ten half-systems that don't interlock beat one grammar that
  does. Every material must *compose*, or you have a menu, not a game
  ([[antipattern-feature-soup]]).
- **Illegible recipes.** If the player can't predict a craft, they're at the wiki,
  not in the world. Recipes should read from the material grammar
  ([[antipattern-guess-the-designer]]).
- **Currency spaghetti.** A dozen materials with no clear sinks becomes an
  unreadable inventory. Keep the resource loops closed and few
  ([[antipattern-currency-spaghetti]]).
- **Grind wall between tiers.** If reaching the next material is hours of the same
  swing, the ladder is a chore, not a pull ([[antipattern-grind-wall]]).
- **Night as pure noise.** A threat that's random, unfair, or ignorable stops
  pacing anything. Telegraph it, escalate it, make shelter answer it
  ([[antipattern-rng-frustration]]).

## Anchors

- [[anchor-minecraft]] — the block grammar; self-set goals; day/night as the core
  loop's metronome; emergence from simple, consistent rules.
- [[anchor-terraria]] — the *optional ladder* done right: a boss/tier progression
  under a 2D sandbox that answers "what now?" without caging the sandbox.

## Verify

Prove the sim contract with **[docs/VERIFICATION.md](../../docs/VERIFICATION.md)** —
deterministic worldgen (same seed → same world), the day/night clock and threat
escalation asserted on world state, closed resource loops, and cosmetic-only
weather/particles kept out of the world hash. Design the grammar and the ladder
here; prove determinism and pressure there.

## Composes with

- [[anchor-minecraft]] · [[anchor-terraria]] — the two poles: open self-set goals
  vs. the optional ladder. Pick where your game sits between them.
- [[system-crafting]] — the legible recipe grammar that is this genre's core verb.
- [[mechanic-throw]] — a placement/attack verb seed (see the twist seams).
- [[system-emergent-systems]] — combinations you don't script are the real content.

## See also

- [[genre-farming-sim]] — the cozy, pressure-light cousin; steal its cadence when
  you dial the night down.
- [[genre-city-builder]] — when authorship outgrows survival and becomes pure
  optimization.
- [[genre-exploration]] — the biome-gating loop shares DNA with map-as-reward
  design.
- [[process-the-twist]] — the seed generator for the "X but Y" seams above.
