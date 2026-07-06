---
id: antipattern-fail-loop-tax
title: The Fail-Loop Tax
kind: antipattern
tags: [difficulty, retry, respect, friction]
summary: Losing costs time, not lessons — long walks back and re-watched cutscenes punish failure without teaching.
use-when: Death/failure sends players through friction before they can try again.
composes-with: [system-save-and-checkpoint, pattern-anti-frustration, system-difficulty-and-dda]
verify-with: docs/VERIFICATION.md
---

**What it is.** Failure charges a **toll** — a load screen, a walk back, an unskippable cutscene, a re-fought trash mob — before the player may attempt the thing that killed them again. The mistake is fine; the tax on retrying it is not.

**Why it hurts.** Learning lives in the **attempt**. Every second between "I died" and "I'm trying again" is dead time that teaches nothing, and the player fills it with resentment instead of intent. The loop that should tighten — die, adjust, retry — slackens into a chore.

## The smell

The **walk-back is longer than the attempt**. If beating the checkpoint takes 20 seconds and returning to it takes 60, you are taxing failure at 3×. Players start counting the tax, not the challenge.

## How it happens

| Source | The toll it charges |
|---|---|
| **Distant checkpoint** | Respawn far from the fight; re-traverse cleared ground. |
| **Unskippable intro** | Boss monologue / cutscene replays every attempt. |
| **Re-cleared trash** | Adds/waves reset; you re-earn the right to the hard part. |
| **Resource re-grind** | Consumables/buffs spent on the failed run must be refarmed. |
| **Load-screen wall** | Death → menu → reload → cinematic → control. |
| **Cursor reset** | UI dumps you to the menu root, not the retry button. |

The insidious version: each toll is individually "small." Stacked, they turn a five-second death into a ninety-second sentence. Nobody designed the tax — it **accreted**.

## The tell (check YOUR design)

- Time the loop. **Death-to-control**: from the failure frame to the first meaningful input, how many seconds? Under ~3s is respectful; over ~10s is a tax.
- Count the inputs. How many button presses from death to retrying the *exact* thing that killed you? One (confirm) is the target.
- Watch a real session. If the player's first move after respawn is **skip / hold-to-skip / mash**, they are paying a toll you charged.
- Ask what the walk-back *teaches*. If "nothing — they already cleared it," delete it.
- Check the failed-run cost. If dying means re-farming buffs, the retry isn't a retry — it's a new expedition.

## The fix

**Checkpoint before the test, not before the corridor.** Put the respawn at the mouth of the fight. Cure with [[system-save-and-checkpoint]] — dense checkpoints, instant respawn, and a retry that lands you *pointing at* the challenge.

- **Fast retry over faithful restart.** [[anchor-celeste]] respawns you mid-air in under a second on the same screen; death is punctuation, not a paragraph. Match that floor. See [[pattern-anti-frustration]].
- **Make the tax skippable the second time.** First boss monologue: cinematic. Every retry after: press to skip, or auto-skip on death. [[anchor-cuphead]] and [[anchor-hades]] both cut the intro on re-entry.
- **Don't reset spent resources on failure** — or make the loss *the* lesson, not busywork. [[anchor-hades]] keeps meta-currency through death so the walk-forward, not back, carries value ([[system-meta-progression]]).
- **Separate difficulty from friction.** If the fight is too hard, tune the fight ([[system-difficulty-and-dda]]); do not "balance" it by making the retry expensive. A cheap death loop lets you make the challenge *harder* honestly.
- **Aim the cursor.** Land on RETRY by default, not the menu root.

Do not confuse a fail-loop tax with a *designed* run reset. In [[genre-roguelike]] the long walk back is the game — the point is [[system-meta-progression]] and a fresh seed, not re-treading the same corridor. The tax is friction inside a *single* challenge you already understood.

## Twist seams

- **Roguelike run-death but the last room is a free retry** (twist vector: *stake selection*) — the meta-loss is real, but the boss that ended the run is a one-shot rematch. Failure teaches without the full re-descent; see [[system-save-and-checkpoint]] × [[genre-roguelike]].
- **Souls-like corpse run but the walk is the telegraph** (twist vector: *friction-as-payload*) — [[anchor-dark-souls]] taxes death with a run-back, yet loads that path with enemy placement you must now read differently. If your walk-back teaches nothing, it's naked tax; if it teaches, it's a [[system-telegraphs]] under time pressure.
- **Precision platformer death but the checkpoint moves with mastery** (twist vector: *earned convenience*) — respawn tightens as the player proves the segment, so the tax shrinks exactly as competence grows. Ties to [[pattern-mastery-and-flow]] and [[system-difficulty-and-dda]].

## Seen in…

- **[[anchor-celeste]]** — the anti-tax exemplar: sub-second respawn, same screen, cursor already on go. Death costs nothing but the attempt.
- **[[anchor-hades]]** — re-clears the same early rooms each run, but gates the tax with meta-progress, skippable dialogue, and a house that changes; the walk-forward earns the walk-back.
- **[[anchor-dark-souls]]** — the corpse run is intentional weight, but bonfire spacing is where it tips: a boss two minutes of trash away from its fog gate is the tax players remember, not the boss.
- **[[anchor-cuphead]]** — boss-rush structured for retry: near-instant restart, skippable intro, and a death screen that shows *how far* you got. The loop is the whole game, so the tax is near zero.
- **Old-school checkpoint shooters / racing** — restart-the-level-from-zero on the final corner is the archetypal fail-loop tax; a checkpoint before the corner dissolves it.

## Verify / guard

This is a **failure mode to check before handoff**, not a feel to prove. Instrument the loop: log **death-to-control** time and **inputs-to-retry** count; assert both stay under budget (~3s, 1 press) on your hardest checkpoint. Confirm spent-resource state and cursor position on respawn. Fold the thresholds into your feel gates per `docs/VERIFICATION.md` — see also [[pattern-anti-frustration]] and [[system-difficulty-and-dda]] for the tuning knobs the guard protects.
