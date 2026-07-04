# CLAUDE.md

**See [AGENTS.md](AGENTS.md) for the full operating manual.** The five invariants
that matter most:

1. **Import only from `@hayao`.** Grep `docs/API.md` for the real surface — never
   guess an API from memory.
2. **Determinism is sacred.** All randomness through `world.rng`; no `Date.now`/
   `Math.random`/argless `new Date` in the sim; ordered iteration for logic.
3. **Pure logic + solver proof.** Turn-based/puzzle rules live in a pure
   `Puzzle<State, Move>` module; every level is machine-proven winnable.
4. **DOM for menus, `cosmetic` for view.** Chrome is `showScreen()`; pure-view
   nodes set `cosmetic = true` so they stay out of `world.hash()`.
5. **Verify before you present.** `npm run check`, `npm test`, `npm run verify` —
   assert on `world.probe()`/`hash()`, judge looks from a headless SVG only.

**Design from the mechanic, not from the corpus.** The examples are *convention
references* (how the API is wired, how state/view split) and *proof fixtures* —
they are **not** a menu of what to build. Don't survey `examples/` for ideas;
decide what the game is as if the corpus didn't exist, then borrow only its
structure. For "how do I use one primitive?" (physics, particles, camera,
pathfinding, tweens, procgen, audio) read the matching `sandboxes/` lab — a
single mechanic in isolation — not a whole game. `examples/sokoban/` is the
reference for the logic/view split; `sandboxes/` is the reference for the parts.
