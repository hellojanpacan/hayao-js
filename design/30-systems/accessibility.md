---
id: system-accessibility
title: Accessibility
kind: system
tags: [accessibility, assist, remap, colorblind, contrast, readability, a11y, salience]
summary: Assist modes, input remap, and colour/contrast that clear a readability floor — more players reach the game, none are shamed for it.
use-when: You want the game playable by more people — different hands, eyes, and skill levels — without a separate "easy" ghetto.
composes-with: [system-difficulty-and-dda, pattern-readability, world-aesthetic-direction, system-onboarding]
anchors: [anchor-celeste]
verify-with: design/JUDGE.md
---

# Accessibility

**What it is.** The set of choices that let **more people play the same game**:
assist modes (speed, invulnerability, skip), full **input remap**, and a
**colour/contrast** floor so threats and the avatar read for colour-blind and
low-vision players. Accessibility is not a difficulty setting bolted on — it's a
**readability and control floor** the whole design stands on.

**Player fantasy / why it's fun.** Everyone gets the *actual* fantasy, tuned to
their body. Celeste's assist mode doesn't make a lesser game — it makes the *same*
game reachable. The pull is dignity: the game meets the player where they are.

## When to use / when NOT

| Use it when | Non-negotiable when |
|---|---|
| Any single-player game | *Colour/contrast is never optional* — it's a floor, always on |
| Skill games with a high ceiling | Remap: any keyboard/gamepad game — bodies differ |
| Games leaning on colour to signal | Assist modes: any game where "too hard" loses players you could keep |

> **Accessibility is a floor, not a mode.** Contrast, remap, and salience aren't
> a menu you *could* add — they're the baseline every player relies on, including
> the ones who never open the options screen. Build the floor first; the toggles
> are the ramp above it.

## The axes

| Axis | What it covers | Cheapest win |
|---|---|---|
| **Motor** | remap, hold-vs-toggle, reduced APM, larger targets | full key/button remap |
| **Visual** | contrast, colour-blind-safe palette, non-colour cues, text size | shape/icon *plus* colour, never colour alone |
| **Cognitive** | clear goals, no time-pressure option, readable telegraphs | slower/optional timers |
| **Difficulty** | assist toggles (speed %, i-frames, skip) | per-axis, not one slider |

## Tuning levers

| Lever | Effect | Watch for |
|---|---|---|
| **Contrast ratio** (avatar vs. field, text vs. bg) | legibility floor | measure it — don't eyeball it |
| **Redundant cues** | colour + shape + motion for each signal | colour-only = invisible to ~8% of players |
| **Remap coverage** | which actions are rebindable | a hard-coded key is an inaccessible wall |
| **Assist granularity** | per-axis toggles vs. one dial | one slider forces all-or-nothing |

## How it wires to Hayao

- **Contrast is measurable.** `contrastRatio(a, b)` (grep `docs/API.md`) gives the
  WCAG-style ratio for any two hex colours — gate avatar-vs-field and text-vs-bg
  against a threshold. The Kentō palette is *already* AA-gated
  ([[world-aesthetic-direction]], `npm run palette`), so build on it.
- **Redundant cues ride readability.** The `src/verify/gates.ts` readability gate
  checks the avatar out-contrasts its surroundings and threats telegraph — that
  *is* the visual-accessibility floor made checkable. Pair colour with the
  telegraph shape so the signal survives colour-blindness ([[pattern-readability]],
  JUDGE).
- **Remap & assist are declared tuning.** Model assist axes as `tuning:` knobs
  ([`docs/WORKSHOP.md`](../../docs/WORKSHOP.md)); resolved via `world.tune(key)`, they
  stay in `world.hash()`, so an assisted or remapped run is still a first-class,
  replayable artifact — never a cheat path.
- **Input is action-based.** Because UI intent flows through input *actions*
  (CONVENTIONS), remapping a key is a lookup change, not a sim change — the action
  log and determinism are untouched.

## Fails when…

- **Colour carries a signal alone.** Red-vs-green danger with no shape cue is
  invisible to a large minority — always add a second channel.
- **Hard-coded controls.** One unbindable key excludes anyone whose hands don't fit
  it.
- **Assist as a lesser mode.** Withholding content/achievements on assist turns a
  humane tool into a punishment (the opposite of Celeste's stance).
- **Contrast by vibe.** "Looks fine to me" fails the players it's for — measure
  with `contrastRatio`.
- **Text-size afterthought.** Tiny fixed HUD text walls out low-vision players.

## Verify

- **Contrast gate:** `contrastRatio(avatar, field)` and text-vs-bg pass a threshold
  (build on the AA-gated Kentō palette, `npm run palette`).
- **Readability floor:** avatar out-contrasts surroundings, threats telegraph —
  [`src/verify/gates.ts`](../../src/verify/gates.ts) + [JUDGE.md](../JUDGE.md)
  (the headless SVG look).
- **Assist stays deterministic:** golden-hash a run per assist setting; tuning is
  in `world.hash()` (WORKSHOP knob semantics).
- **Remap covers every action:** lint that no gameplay action is bound to an
  unremappable key.

## Composes with

- [[system-difficulty-and-dda]] — assist modes are difficulty's accessible face.
- [[pattern-readability]] — the salience floor accessibility depends on.
- [[world-aesthetic-direction]] — the AA-gated Kentō palette is your contrast head-start.
- [[system-onboarding]] — a readable first ten minutes is an accessibility win.

## See also

- [`design/JUDGE.md`](../JUDGE.md) — the readability/look bar, judged headlessly.
- [`src/verify/gates.ts`](../../src/verify/gates.ts) — the readability feel gate.
- [[anchor-celeste]] — assist mode as the field's humane benchmark.
