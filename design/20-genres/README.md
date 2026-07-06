# 20-genres/ — the creative genre templates

Each module here is the **design** counterpart to a section of
[`docs/FUN.md`](../../docs/FUN.md). FUN.md answers *"how do I PROVE this genre is
fair?"* — solvers, bot runs, pacing windows, both-ways affordance proofs. These
modules answer the front-half question FUN.md can't: *"how do I DESIGN a great
one?"* — the pillars, the loop stack, the systems it needs, the twist seams, and
the traps that kill it.

**They pair, they don't overlap.** Every genre module sets `verify-with:` to its
matching FUN.md section and *links* it rather than restating a single verify
recipe. Design here; prove there. When your design blends genres, satisfy **every
parent's** verify pattern (rhythm = roguelike + input legality; Peggle = physics +
aim search — FUN.md Part 3).

Reach for one when the [pipeline](../README.md) hits **COMPOSE**: you've named the
[[anchor]] the game *is*, and you need the genre's design skeleton — pillars, loop
stack, and the `[[system-*]]` parts to bolt on — before you [twist](../00-process/the-twist.md)
it into something worth building.

## The 24 genre modules

The first 21 map 1:1 to FUN.md §1–§21. The last three are **extensions** beyond
FUN.md's corpus — genres the campaign didn't cover but the Codex designs for.

| id | title | one-line pillar |
|---|---|---|
| [[genre-grid-puzzle]] | Grid Puzzle (Sokoban) | The solvable knot: obvious move is the trap. |
| [[genre-precision-platformer]] | Precision Platformer (Celeste) | Trust in inputs; every death is your own. |
| [[genre-metroidvania]] | Metroidvania | The locked-door promise, always kept. |
| [[genre-action-adventure]] | Action-Adventure (Zelda) | Readable combat; telegraphs make reaction fair. |
| [[genre-stealth]] | Stealth | Plannable danger you can read and route. |
| [[genre-horde-survival]] | Horde Survival (Vampire Survivors) | The rising tide vs your rising build. |
| [[genre-bullet-hell]] | Bullet Hell | Density that reads; uptime, not dodging, is the skill. |
| [[genre-tower-defense]] | Tower Defense | Build decisions that matter; coverage is geometry. |
| [[genre-rts]] | RTS-lite | Mass under command; asymmetry that balances. |
| [[genre-roguelike]] | Traditional Roguelike | Fair discovery; procgen that always connects. |
| [[genre-deckbuilder]] | Roguelike Deckbuilder | Drafts with teeth; a win-rate window. |
| [[genre-tactics]] | Turn-based Tactics (Into the Breach) | Rewriting the telegraphed future. |
| [[genre-match3]] | Match-3 | Cascades you triggered; instant sim, animated view. |
| [[genre-incremental]] | Incremental / Idle | A pacing curve with no deserts. |
| [[genre-farming-sim]] | Farming / Life Sim | Gentle solvency; plans that can come true. |
| [[genre-survival-horror]] | Survival Horror | Dread you can budget in resource arithmetic. |
| [[genre-city-builder]] | City / Colony Builder | The exposed score; negative synergies. |
| [[genre-rhythm]] | Rhythm | Tight but fair; the beat is sim time. |
| [[genre-physics-arcade]] | Physics Arcade (Peggle) | Trustworthy flight; swept collision. |
| [[genre-racing]] | Top-down Racing | The speed/line tradeoff made physically real. |
| [[genre-narrative-decisions]] | Narrative Decisions (Reigns) | Impossible stewardship between two ditches. |
| [[genre-coop-chaos]] | Co-op Chaos (Overcooked) | *Extension* — communication under time pressure. |
| [[genre-auto-battler]] | Auto-battler | *Extension* — prep then watch; economy + positioning + synergy. |
| [[genre-exploration]] | Exploration / Immersive-sim-lite | *Extension* — curiosity and knowledge as the reward. |

## Authoring one

Follow [`../CONTRIBUTING.md`](../CONTRIBUTING.md): the **genre** skeleton is
Pillars (exactly 3) · The loop stack (moment/encounter/session/meta) · Essential
systems (a table linking `[[system-*]]` ids + why each) · Content & difficulty
model · Signature-mechanic seeds (3–5 "X but Y" bends) · Common pitfalls · Anchors
· Verify (link the FUN.md section) · See also. Keep it 120–260 lines, tables over
prose, the [`docs/FUN.md`](../../docs/FUN.md) voice. Never invent a Hayao API —
point at a [`sandboxes/`](../../sandboxes/) lab or [`examples/`](../../examples/)
slug that already wires it.
