---
id: system-prestige-and-newgame-plus
title: Prestige & New Game+
kind: system
tags: [replay, reset, meta, longevity, ascension]
summary: Structured replay — reset for a persistent edge (prestige) or replay harder with what you kept (NG+); longevity from the loop.
use-when: You want replay value and a long tail without authoring endless new content.
composes-with: [system-meta-progression, system-progression, pattern-mastery-and-flow]
verify-with: docs/FUN.md#14-·-incremental
---

**What it is.** Structured replay. **Prestige** wipes your run for a permanent multiplier that makes the next climb faster; **NG+** restarts the whole game harder with your build and gear carried over. Same content, re-authored decisions.

**Player fantasy / why it's fun.** "I could tear through the part that broke me last time — and now the game finally fights back." The reset stings for a second, then the acceleration is pure dopamine. Content you already own becomes a playground.

## When to use / when NOT

Use it when:
- Your **loop** is short and repeatable — a run, a wave, a board. See [[process-core-loop]].
- You have a scarcity of hand-authored content but a rich **decision space** that recombines.
- Mastery outpaces content: skilled players finish and want the game to escalate, not end.

Do NOT use it when:
- The first playthrough is a one-shot **story** whose surprises die on replay (a mystery, a twist) — a second lap is hollow. See [[genre-narrative-decisions]], [[anchor-return-of-the-obra-dinn]].
- You'd bolt it on to hide a thin core. Replay amplifies whatever the loop already is; a dull loop replayed is dull twice. See [[antipattern-content-desert]].
- The metagame is already solved — one optimal path means every reset plays identically. See [[antipattern-solved-metagame]].

## Variants

| Variant | Carries over | Resets | The new-run hook |
| --- | --- | --- | --- |
| **Incremental prestige** | A permanent multiplier / prestige currency | Level, resources, most upgrades | Same climb, faster — with new upgrade tiers the multiplier unlocks. Anchor: [[genre-incremental]], [[anchor-loop-hero]]. |
| **New Game+** | Build, gear, unlocks, knowledge | World state, story beats | Harder enemies, remixed encounters, gear that finally matters. Anchor: [[anchor-hades]], [[anchor-dark-souls]]. |
| **Ascension modifiers** | Meta-unlocks, roster | The run | Stacking difficulty clauses you opt into for prestige/rewards. Anchor: [[anchor-slay-the-spire]] (Ascension 1–20), [[anchor-dead-cells]] (Boss Cells). |
| **Run-based meta** | Cosmetics, unlocks, meta-currency | Everything else | A fresh seed plus a slightly wider toolbox each time. Anchor: [[anchor-hades]], [[anchor-vampire-survivors]]. |

Prestige answers *"go again, faster."* NG+ answers *"go again, harder."* Ascension answers *"go again, on your terms."* Pick the question your loop earns.

## Tuning levers

- **What carries.** The single most important knob. Carry too much → the next run is a victory lap ([[antipattern-fake-choice]]). Carry too little → the reset feels like punishment. Carry *capability and knowledge*, gate *power*.
- **What resets.** Reset enough that early decisions matter again. If you keep your endgame build, the opening 30 minutes are dead air. Slay the Spire keeps your card pool *available* but not *assembled* — you still draft.
- **The new-run hook.** Every reset must open a decision the last run couldn't. New tier, new modifier, new enemy placement, a fresh seed. No new decision = [[antipattern-boring-optimal]].
- **The multiplier curve.** Prestige gain must undercut the grind it replaces or nobody prestiges; overshoot and you trivialize the loop. Tune so a reset pays for itself in a fraction of the prior run's time.
- **Escalation slope.** NG+ difficulty should re-threaten a mastered player without a wall. See [[system-difficulty-and-dda]], [[antipattern-difficulty-cliff]].
- **Opt-in vs forced.** Ascension is voluntary self-challenge; NG+ is often gated behind a first clear. Voluntary reads as respect; forced resets read as [[antipattern-grind-wall]].
- **Prestige floor.** Guarantee each reset leaves the player strictly ahead. A reset that can net *lose* progress corrodes trust — see [[pattern-fairness-and-trust]].

## Twist seams

Two ways to break the "same content, again" tautology:

- **NG+ but the world remembers your last run** *(twist: structure)*. Your previous playthrough writes state into the new one — the town you razed is ash, the boss you spared returns as an ally, doors mark where you died. Shades of [[anchor-shadow-of-mordor]]'s Nemesis and [[anchor-hades]]'s inter-run dialogue. Replay stops being a copy and becomes a **sequel** to your own choices. See [[world-level-as-story]], [[pattern-escalation-and-payoff]].
- **Prestige but you keep knowledge, lose power** *(twist: constraint)*. The reset strips your stats but never what you learned — the map, the boss tells, the optimal route stay in *your* head, not the save file. The run gets mechanically harder yet subjectively easier because you got better. [[anchor-outer-wilds]] and [[anchor-dark-souls]] live here: the only thing that truly carries over is the player. See [[system-mastery-curve]], [[pattern-mastery-and-flow]].

## How it wires to Hayao

- **State partition.** Split persistent state (meta-currency, unlocks, prestige tier) from run state (level, HP, board) so a reset clears one and keeps the other. Model the run as a discrete `State` your loop advances; the reset is a pure transition to a fresh initial state seeded by the persistent half. Compose with [[system-save-and-checkpoint]].
- **Determinism.** New-run variety must come from your **deterministic RNG**, not wall-clock entropy — same seed + same carryover = same run, which is what lets you machine-prove an NG+ level is still winnable. See [[system-procgen-design]] and the `sandboxes/procgen-lab`.
- **Difficulty as data.** Express ascension/NG+ modifiers as a data layer applied over the base ruleset (enemy HP scalar, spawn table swap, added clauses) rather than a forked codebase — one game, many parameterizations. See [[system-difficulty-and-dda]], [[system-loot-tables]], [[system-spawn-directors]].
- **Prestige as an economy.** The multiplier is a [[system-economy]] variable; tune its curve like any [[system-resource-loops]] sink/source and pressure-test with [[system-reward-schedules]].
- **Meta spine.** This system is the *replay engine*; the persistent tree it feeds is [[system-meta-progression]]. Keep them distinct — meta-progression is *what unlocks*, prestige/NG+ is *why you reset to earn it*.

## Fails when…

- Replay is **identical** — no new decision, no new threat, just a longer number. Dead loop. See [[antipattern-boring-optimal]], [[antipattern-content-desert]].
- The optimal reset path is solved and forced, so every prestige is the same rote sequence. See [[antipattern-solved-metagame]], [[antipattern-fake-choice]].
- Carryover is so strong the new run is a **cakewalk** — power creep with no counter-pressure. See [[antipattern-power-creep]], [[antipattern-stat-inflation]].
- The reset is a **grind gate** in disguise: the only way forward is to prestige, and prestiging is a slog. See [[antipattern-grind-wall]], [[antipattern-pay-to-skip]].
- NG+ spikes into a wall a mastered player still can't clear. See [[antipattern-difficulty-cliff]].

## Verify

Prove it's genuine longevity, not a treadmill: does each reset open a *new decision* and stay winnable? Assert on run/meta state via the loop's probe; judge escalation against [docs/FUN.md#14-·-incremental](docs/FUN.md#14-·-incremental).
