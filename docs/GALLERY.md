# The verified gallery

Most "AI makes games" demos ask you to take the output on faith. hayao's don't.
Every game in this repo ships a `verify.ts` suite that **machine-proves** its
claims — and you can run the proof yourself:

```sh
npm run verify                        # prove the whole portfolio (solver + determinism + gates)
npm run verify -- lumen sokoban       # just these — scopes every stage, not only the feel audit
npm run eval                          # scorecard: verified rate + proof coverage per game
npm run eval -- lumen sokoban         # just these
```

That is the honest version of an AI-first gallery: not "trust me, an agent built
this," but "an agent built this, a human directed it, and here is the machine proof
that it works." The proof is the marketing.

## What "verified" means here

Each game asserts truth on up to six independent **proof channels**. `npm run eval`
reports which ones each game exercises:

| Channel | What it proves | How |
|---|---|---|
| **winnable** | every level/board is beatable | `solve()` / `assertSolvable` — a real search, not a vibe |
| **determinism** | same inputs → same world, bit for bit | `checkDeterministic` + golden replay hashes |
| **ramp** | the difficulty curve escalates without cliffs | `assertRamp` / `rampIssues` over the campaign |
| **feel** | grace windows, readable avatar, telegraphed threats | the feel gates (`salienceIssues`, `forgivenessIssues`, …) |
| **generated** | content was composed, not hand-authored | `generateLevels` / `composeCampaign` |
| **code-as-art** | it's drawn with gradients/shapes, not placeholder squares | the `art/` + paint toolkit |

## The flagship: Lumen

**Prompt-shaped as:** *“a light-routing chain puzzle that always serves a fair, winnable board, build with hayao.”*

**What ships:** a light-routing puzzle — drop a spark, its four beams cascade
through prisms — served on an Elo curve so every board is matched to the player, and
**not one board was drawn by hand.** Each board is expressed as a seed + params and
kept only if the solver proves it winnable within its spark budget; that same solver
estimate is what the rating loop matches on. Boards re-derive identically on every
machine.

**The proof (`npm run verify -- lumen`):**

- ✓ every generated board across four rating bands is solver-proven winnable (24 boards: 4 bands × 6 seeds)
- ✓ the difficulty estimate ramps monotonically — harder bands average higher ratings
- ✓ a scripted drag-drop playthrough lights every prism and banks the rating gain
- ✓ golden replay hash pinned; sim deterministic across runs

It leads on winnable + generated + determinism — the reference for generate-and-prove
content that can't ship a board it hasn't proven. Source: [examples/lumen](../examples/lumen).

## The rest of the portfolio

Every other game under [examples/](../examples) is verified too — one per major 2D
genre, plus physics and netplay showcases. They lead on different channels (a
platformer proves reachability + feel; a horde game proves determinism under load; a
tactics game proves counter-play), and the playable builds live at
[hayao.dev](https://hayao.dev/). Run `npm run eval` for the current, honest scorecard
rather than a screenshot you have to trust.
