---
description: Design and build a new hayao game — from mechanic, through pure logic, to solver-proven and deterministic.
argument-hint: <game idea or mechanic>
---

Build a new hayao game: $ARGUMENTS

Load and follow the plugin's **author-game** skill end to end. In particular:

1. If this is the engine repo (`hayao-js`), the repo's own `/new-game` skill
   and BUILDLOG loop take precedence — follow `.claude/skills/new-game/`.
2. In a consumer project, start from the existing scaffold (`npm create
   hayao`'s logic/game/verify split) or create one matching it.
3. Design from the mechanic first (one-sentence mechanic + player fantasy
   before any code), inspect the installed API surface before using any
   symbol, keep rules in a pure `Puzzle` module, and do not present the game
   until `npm run verify` proves it winnable and deterministic.
