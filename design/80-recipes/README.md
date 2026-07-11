# 80-recipes/ — Pre-Composed Designs

The **worked compositions**. Every other section is a parts bin; this one shows
the parts *already assembled* into a design that holds together. A recipe is a
single design taken through the pipeline and written down as a buildable starting
point: the brief, the pillars, the first playable, and the handoff.

**Every recipe here is spine-first.** Each leads with a
[`spine`](../00-process/the-spine.md) — a one-tension core — and carries a
**Resonance table** proving every element (setting, theme, feel, death-handling)
traces back to that tension. That's the exemplar of *coupled* design: not "X but Y"
assembled from parts, but one spine seen from every side. The "X but Y"
[twist](../00-process/the-twist.md) still names each recipe's creative bend (the
column below), but it's the *face*, not the loop — the spine is the loop. New
recipes must carry a resonance table (`build-design-index.mjs` enforces it).

> **Recipes are convention references, not a menu.** Like [`examples/`](../../examples/),
> they show *how the pieces wire*, not *what you should build* (see
> [AGENTS.md](../../AGENTS.md)). Read one to see composition in action, then go
> design your own game from its mechanic — don't reskin the recipe. A recipe
> **links** the modules it uses; it never restates them.

## The exemplars — read these first, beside [`process-the-spine`](../00-process/the-spine.md)

These two are the reference pair: the table *is* the method. Same audit, **opposite
death-handling** — because each *derives* its failure rule from its spine, not from
a genre default. That contrast is the whole point of [[antipattern-dissonance]].

| id | title | the spine | contrast |
|---|---|---|---|
| [[recipe-emberfall]] | Emberfall | Light **is** movement **is** life — spend yourself to see | retry-mastery: death is instant + free |
| [[recipe-waterline]] | Waterline | Water meters everything, and drawing it now dries the table you'll need later | survival: death stings, by design |

## The full shelf

Each carries a spine + resonance table; the twist vector names its creative bend.

| id | title | the spine (one line) | twist vector |
|---|---|---|---|
| [[recipe-colony-nemesis]] | Colony Nemesis | A raid is a grudge, not a wave — winning without ending the rival authors a deadlier return | mechanic-swap |
| [[recipe-cozy-deckbuilder]] | Cozy Deckbuilder | Grow a blooming engine before a gentle season closes — the calm scarcity is time itself | tonal |
| [[recipe-detective-deduction-board]] | Detective Deduction Board | Every fact you lock in narrows the space — a confident wrong lock-in silently poisons the chain | structure |
| [[recipe-merge-factory]] | Merge Factory | Board space is the scarcity, and the automation that clears cells is what floods them | structure |
| [[recipe-one-button-boss-rush]] | One-Button Boss Rush | One button, so every press commits you out of the answer the next attack demands | constraint |
| [[recipe-rhythm-platformer]] | Rhythm Platformer | The beat-window is the scarcity — a move committed on the beat locks you to the grid the next hazard is timed against | mechanic-swap |
| [[recipe-swipe-kingdom]] | Swipe Kingdom | Every swipe grows one meter while starving another — the gesture that builds your city tips one toward the ditch | mechanic-swap |
| [[recipe-tower-defense-roguelite]] | Tower-Defense Roguelite | You don't choose your towers — the run drafts them, so you commit geometry to the tools you were dealt | structure |

## How to read a recipe

Follow the links. A recipe's value is the *wiring* — which anchor it borrows a
loop from, which systems it pulls, which vector it bent. Open those modules; the
recipe is the map, they are the territory. When you've seen how one composes,
generate your own: `npm run design:spine` seeds a tension-first **loop** to derive
(the primary path — start here), or `npm run design:spark` samples an "X but Y"
**pitch** to assemble (the twist sub-tool).

Then hand off: every recipe names its `verify-with` targets, because a design
isn't done until it names its proofs. See
[`00-process/refine-and-handoff`](../00-process/refine-and-handoff.md).
