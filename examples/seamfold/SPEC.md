# SPEC — Seamfold (benchmark B1)

Reproduction target: **Edge Not Found** — js13kGames 2020, **#2 Overall**
(author Tom Hermans; `play_url` js13kgames.com/2020/games/edge-not-found).
Corpus source: `~/Documents/js13k/games/2020/edge-not-found/` (read for design
extraction only — no license file in the repo, so no code, art, or level
layouts are ported; all Seamfold levels are original).

## Core loop

Sokoban where the play field is a **twisted torus**: there is no outside — walk
or push off any open edge and you re-enter from the opposite side, possibly
*shifted along the other axis* by a level-defined offset. Solving means using
the seams, not avoiding them.

## Extracted wrap semantics (from original `wrapCoords`)

- Level defines `xOff`, `yOff` (default 0).
- Crossing a vertical seam: `x ∓= W`, `y ∓= yOff` (sign follows direction).
- Crossing a horizontal seam: `y ∓= H`, `x ∓= xOff`.
- Original resolves x→y→x with a commented known bug (`//QQQ`); Seamfold
  instead resolves to a fixpoint (loop until in-bounds) — cleaner, same
  observable behavior for reachable offsets.

## Mechanics checklist (each M has a verify.ts check)

- **M1 torus wrap** — stepping off any open edge re-enters opposite side.
- **M2 twisted seams** — `xOff`/`yOff` shift re-entry along the other axis.
- **M3 boxes wrap too** — a push across a seam moves the box (and then the
  pushing player) through the same twisted mapping.
- **M4 the seam IS the mechanic** — every level is UNsolvable in a variant
  where seam-crossing moves are forbidden (proved by running the solver on a
  no-wrap puzzle and asserting failure).
- **M5 undo + restart** — full-state undo stack; restart rebuilds the level.
- **M6 level progression** — solve → win screen → next level → play again.
- **M7 infinite-world view** — 3×3 ghost tiling around the canonical copy,
  ghosts dimmed, twist honored (right copy drawn shifted by `yOff`, bottom
  copy by `xOff`), all `cosmetic`.
- **M8 solver proof** — every level machine-proven winnable (house gate).

## Feel targets

- The wrap must read as *one continuous world*: ghost copies always in sync
  with the canonical copy (same rebuild).
- The "aha": a box pushed off one edge visibly arrives shifted — teach with a
  pure-torus level first, then one twist axis at a time, then both.

## Determinism hazards in the original

- Wall-clock (`timePlaying % 5`) feeds only *drawing* wobble — view-only, maps
  to hayao's cosmetic layer. Sim is strictly input-driven; no RNG in rules.

## Out of scope (original features not reproduced in B1)

Offset-*shifting* boxes (pushing them mutates `xOff`/`yOff`), gates/rubble,
the level-select-hub-as-playable-level, zzfx audio, the level editor.

## Scoring notes

Content parity target: ≥4 original levels teaching torus → yOff twist →
xOff twist → both. Fidelity = M1–M8 green in `verify.ts`.
