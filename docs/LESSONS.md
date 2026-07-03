# Lessons — distilled from building games as an AI

hayao.js is the third iteration of a question: *what does a game engine look like
if an LLM is the primary developer?* These lessons come from real builds —
**narrow-js** (a kit over the LittleJS canvas engine) and **One Hundred Year
Garden** (a DOM/SVG game with a pure simulation core). The engine bakes most of
them in; this file is why.

## Determinism is the keystone
Make the game a pure function of (seed, input log) and every hard thing becomes
easy: tests call `step()` in Node; replays compare a state hash; levels are
searchable; undo is a snapshot; a refactor is safe iff the hash is unchanged.
The cost is discipline — all randomness through one seeded `Rng`, no wall-clock in
the sim, ordered iteration. hayao enforces it and `assertDeterministic` catches
any leak. Everything else in this file depends on this one.

## Verification before content
The single highest-leverage habit. Without a harness you will confidently ship
unreachable rooms and unwinnable levels — the author's certainty is not evidence.
narrow-js's BFS solver rejected three consecutive hand-authored tactics levels,
each for a structural reason only visible after the counterexample. Build the
`Puzzle` + solver first; author levels second.

## Prove content beatable — geometry lies
"It looks fine" is a failure mode. A puzzle you are sure is solvable often isn't;
a platform exit that looks reachable bonks its underside every ascent. Pure logic
+ a solver (or, for real-time, reachability arithmetic + a scripted playthrough of
the critical path) is the only trustworthy proof.

## Code-as-art, never binary assets
LLMs are good at code and bad at binary blobs. Vector shapes, gradients, glyphs,
and procedural paths give a coherent, polished look with zero asset pipeline —
and they diff, serialize, and hash. hayao's renderer speaks only a vector display
list; `art/` provides palettes and shape builders. Constrain the art space (named
palettes, keyframe shapes) and combinatorial output stays on-model.

## DOM for menus; SVG beats canvas for many genres
Humans compare your in-game type to the DOM around it, and canvas text loses —
it's rasterized at a fixed backbuffer and fuzzy on hiDPI. Put chrome (titles,
menus, HUD) in DOM overlays (`showScreen`). Better still, for non-action genres,
render the *game* in SVG too: resolution-independent (no fuzz) and DOM-inspectable
(verification for free). Reach for the Canvas2D backend only when node count bites.

## Separate canonical state from view
The bug that motivated `cosmetic`: a move counter shown in the HUD leaked into the
state hash, so snapshot/restore "failed" though the game was fine. Keep derived,
transient display (counters, particles, tweened positions) OUT of the canonical
state — mark those nodes `cosmetic`. What's hashed should be exactly what defines
the game, nothing more.

## Dev-server semantics cause more user-visible bugs than game code
The SPA fallback silently re-serves the hub for missing pages ("Enter does
nothing" — actually a 200 on a typo'd path). Use MPA mode so 404s are honest.
Bind the dev server to a harness-assignable port so two sessions don't collide.
The boring glue is where the surprises live.

## Multi-agent orchestration
Subagents stall holding a whole 1000-line file in one unwritten response — instruct
builders to write one small module per tool call. Give verification agents their
own dev-server port (the shared preview tab is contended). Run research in
parallel at session start; it's cheap and shapes everything after. And **verify
that a delegated agent's files actually landed** — a connection drop can end an
agent "successfully" with half its writes missing.

## Easy vs hard for an LLM, in this stack
**Easy:** pure deterministic logic and the solvers that prove it; vector art as
code; DOM UI + localStorage; TypeScript strictness as a free correctness gate;
statistical property tests over a stochastic system.
**Hard (scaffold or avoid):** judging interactive feel blind (build the probe/
screenshot harness first); hand-authoring provably-complete levels (always solve
them); binary/spritesheet art; music; frame-perfect real-time; giant single files.
