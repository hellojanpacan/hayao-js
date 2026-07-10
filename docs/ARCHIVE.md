# Archived corpus — `corpus-v0`

The full prototype corpus built before the Regalia reset (2026-07-10). These were
strong prototypes; they are archived, **not deleted**. Everything below is
recoverable at git tag **`corpus-v0`** (pushed to origin):

```
git checkout corpus-v0 -- examples/<name>     # restore one game
git show corpus-v0:examples/<name>/game.ts     # inspect without restoring
```

Why archived: the new website promises three games — a 2D platformer, a tiny RTS,
and a mobile puzzle — each to be rebuilt at flagship polish on a shared Regalia
game kit (shared components, art, sound, animation). Rather than re-theme 33
Kentō-era prototypes, we reset and rebuild. See `docs/REGALIA-MIGRATION.md`.

## Example games archived (33)

| Game | Genre |
|------|-------|
| bramblefall | real-time strategy (flow-field, counter triangle) |
| brasswick | pinball (rigid-body physics) |
| cadence | rhythm dungeon (Cadence Hollow) |
| driftlight | atmospheric drift |
| duskveil | bullet hell |
| emberfold | slide-and-merge puzzle (2048-like) |
| emberreign | narrative decisions (Reigns-like) |
| emberwake | horde survival (vampire-survivors) |
| fernclash | 2-player netplay duel (lockstep) |
| fernrow | farming sim |
| gleamvale | action-adventure (sword combat) |
| glimmerfall | match-3 |
| gravewell | tap puzzle (benchmark B2, Black Hole Square) |
| hollowdeep | traditional roguelike |
| kinfall | 2-player co-op survival (surviv.io duo) |
| kintsugi | metroidvania (flagship — 30 rooms) |
| lanternfold | lights-out puzzle |
| lanternway | scrolling traversal |
| lumen-forge | idle / incremental |
| meadowhop | one-screen 2D platformer (dogfoods DuotoneHero) |
| palewood | survival horror |
| pinshine | physics arcade (swept-circle) |
| rookspire | demolition slingshot |
| rootward | tower defense |
| seamfold | twisted-torus sokoban (benchmark B1, Edge Not Found) |
| shard-ascent | precision platformer |
| sproutveil | metroidvania |
| tarnholm | island town builder |
| thornspire | roguelike deckbuilder |
| updrift | precision platformer (the "golden feel" reference) |
| vantage | turn-based tactics |
| veilstep | stealth |
| vellgrove | top-down racing (Vellgrove Rally) |

## Kept (not archived)

- **`examples/sokoban/`** — the logic/view-split convention reference (CLAUDE.md
  invariant 3). Re-themed to Regalia in Phase 2.
- **`examples/embed.html`** — the shared embed shell.
- **`sandboxes/*`** (11 labs: anim-lab, camera-lab, hero-lab, juice-lab, light-lab,
  particle-workshop, pathfinding-demo, physics-lab, procgen-lab, synth-lab,
  webgl-lab) — single-mechanic primitive references, not games. Re-themed to
  Regalia in Phase 2, leaned on by the Phase 7 shared-kit rebuild.
