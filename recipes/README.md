# recipes/ — deletable userland patterns, not framework

A **recipe** is a pattern you *copy into your game*, not an API you import from
`@hayao`. This directory is the seam between two very different kinds of code:

| | **core** (`src/`, behind `@hayao`) | **recipes** (here, copied into your game) |
|---|---|---|
| Owns | world, rng, hash, clock, scene tree, physics, render, the verify harness | genre feel: how a platformer *samples input and answers with juice*, how a wave director is wired, how a deck is drafted |
| Lifetime | maintained forever — every export is public API | **deletable** — it lives in your `examples/<slug>/`, you own it, you edit it |
| Grows the… | engine | ecosystem |

## Why the seam exists

The engine is broad (444 exports). Left unchecked, "add a genre" means *adding to
the framework* — and every game then makes the engine heavier instead of the
ecosystem richer, until the barrel calcifies into an API nobody can change. The
fix is boring and durable: keep the **genre-agnostic core** small and swappable
behind `@hayao`, and keep **genre feel** as recipes that get copied into games and
can be thrown away.

> Rule of thumb: if deleting it would break *another* game, it belongs in core.
> If deleting it only changes *this* game, it's a recipe — copy it, don't import it.

The one genre artifact that graduated *into* core is the **level format**
(`@hayao`'s `defineLevel` / `platformerReachable` / `diffLevels`): a level is
plain data a solver can prove, so it earns a place in the kernel the way a scene
does. Geometry-as-data is core; the *feel* laid over it is a recipe.

## Using a recipe

1. Read the recipe here for the shape and the reasoning.
2. Copy its pattern into your `examples/<slug>/logic.ts` + `game.ts` — adapt names,
   tune numbers. It is yours now.
3. Prove it with the gates the recipe names (see `docs/VERIFICATION.md` Channel 4
   and `design/JUICE.md`).

Each recipe points at a **living instance** in `examples/` — a real, verified game
that embodies it. Copy from the instance; read the recipe for *why*.

## Index

| recipe | living instance | what it gives you |
|---|---|---|
| [platformer-feel](platformer-feel.md) | [`examples/updrift`](../examples/updrift) | input→sim→juice wiring, a feedback contract, and a level authored as provable data — passing all four feel gates |

*(More recipes graduate here as reference games are built; a recipe is only added
once a verified example proves the pattern.)*
