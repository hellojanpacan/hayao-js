# 80-recipes/ — Pre-Composed Designs

The **worked compositions**. Every other section is a parts bin; this one shows
the parts *already assembled*. A recipe is a single design taken through the
pipeline — [ANCHOR](../10-anchors/) + [GENRE](../20-genres/) +
[SYSTEMS](../30-systems/) + a [TWIST](../00-process/the-twist.md) — and written
down as a buildable starting point: the brief, the pillars, the first playable,
and the handoff.

> **Recipes are convention references, not a menu.** Like [`examples/`](../../examples/),
> they show *how the pieces wire*, not *what you should build* (see
> [AGENTS.md](../../AGENTS.md)). Read one to see composition in action, then go
> design your own game from its mechanic — don't reskin the recipe. A recipe
> **links** the modules it uses; it never restates them.

Each recipe is one line of "X but Y", expanded. They're deliberately spread
across the twist vectors so the shelf doubles as a worked tour of
[`process-the-twist`](../00-process/the-twist.md).

| id | title | the one-liner | twist vector |
|---|---|---|---|
| [[recipe-cozy-deckbuilder]] | Cozy Deckbuilder | Slay the Spire but cozy, no death | tonal |
| [[recipe-one-button-boss-rush]] | One-Button Boss Rush | Cuphead but one input | constraint |
| [[recipe-tower-defense-roguelite]] | Tower-Defense Roguelite | Tower defense but drafted each run | structure |
| [[recipe-detective-deduction-board]] | Detective Deduction Board | Obra Dinn but on a solvable grid | structure |
| [[recipe-colony-nemesis]] | Colony Nemesis | RimWorld but the raiders remember | mechanic-swap |
| [[recipe-rhythm-platformer]] | Rhythm Platformer | Celeste but the beat is sim time | mechanic-swap |
| [[recipe-merge-factory]] | Merge Factory | 2048 but you automate the merging | structure |
| [[recipe-swipe-kingdom]] | Swipe Kingdom | Reigns but your choices build a city | mechanic-swap |

## How to read a recipe

Follow the links. A recipe's value is the *wiring* — which anchor it borrows a
loop from, which systems it pulls, which vector it bent. Open those modules; the
recipe is the map, they are the territory. When you've seen how one composes,
generate your own with `node scripts/compose-design.mjs spark` — it samples the
Codex into a fresh "X but Y" brief for you to design from.

Then hand off: every recipe names its `verify-with` targets, because a design
isn't done until it names its proofs. See
[`00-process/refine-and-handoff`](../00-process/refine-and-handoff.md).
