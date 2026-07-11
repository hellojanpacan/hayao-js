# hayao — the Claude Code plugin

First-class AI-authoring tooling for the [hayao engine](https://hayao.dev),
as two layers:

1. **An agent-agnostic core** that lives in the plain repo and works with any
   coding agent: `AGENTS.md` (the operating manual, read natively by
   Codex/Cursor/etc.), `docs/` (conventions, verification philosophy, the
   Regalia/duotone style codex), and the runnable verify harness
   (`npm run verify`, `assertDeterministic`, `world.hash()`) — vendor-neutral
   and CI-shellable.
2. **This thin plugin** on top, for distribution and *enforcement*.

## Install

```
/plugin marketplace add hellojanpacan/hayao-js
/plugin install hayao@hayao
```

## What you get

- **Skills** — `author-game` (the inspect→author→prove loop, house style as a
  default) and `verify-determinism` (run the harness, read its failures, fix
  root causes).
- **Commands** — `/hayao:new-game`, `/hayao:verify`, `/hayao:inspect-api`
  (the anti-hallucination lookup), `/hayao:sprite`.
- **Agents** — `game-builder` (authoring in an isolated context) and
  `determinism-verifier` (adversarial: tries to break the game's claims).
- **The determinism gate** — a `Stop` hook (`scripts/determinism-gate.mjs`)
  that runs the project's verify harness whenever a session changed source in
  a hayao project, and blocks the agent from finishing until it passes. This
  turns "no obvious bugs" from a model *hope* into a gate it **cannot ship
  past** — enforcement lives in the harness, not model discretion. It no-ops
  fast outside hayao projects and when nothing changed; humans can bypass
  with `HAYAO_SKIP_GATE=1`.

## The boundary principle (why this won't rot)

The core teaches the *workflow* — inspect the installed `.d.ts` /
`docs/API.md`, never assume an API shape from memory; the plugin *packages
and enforces* it. Nothing in the plugin hardcodes an API signature, so
nothing here goes stale across engine versions: **the installed `.d.ts` is
the reference.**

## Decisions of record

- **Monorepo** (`plugin/` in `hayao-js`, marketplace manifest at repo root):
  pre-v1.0 the plugin must evolve in lockstep with the engine and its docs.
- **`version` intentionally unset** in `plugin.json` — installs track the git
  SHA during active development.
- **No MCP layer yet** — the Workshop MCP server (`bin/hayao-mcp.ts`) already
  covers playtest data; a plugin MCP surface waits until a live service
  (Arcade publish, determinism-check-as-a-service) exists to wrap.
