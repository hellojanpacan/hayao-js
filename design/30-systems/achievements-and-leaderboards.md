---
id: system-achievements-and-leaderboards
title: Achievements & Leaderboards
kind: system
tags: [goals, competition, mastery, optional, status]
summary: Optional goals and social ranking — extrinsic pull layered over intrinsic play; badges for mastery, boards for status.
use-when: You want optional long-tail goals or competitive comparison.
composes-with: [system-collectibles, system-coop-and-competition, pattern-mastery-and-flow]
verify-with: docs/VERIFICATION.md
---

**What it is.** A layer of **optional goals** (achievements) and **social ranking** (leaderboards) bolted onto play. Achievements name skilful or thorough behaviour and reward it with a badge; leaderboards sort players against each other or the world.

**Player fantasy / why it's fun.** "I did the hard thing, and there's proof." Achievements convert diffuse mastery into legible **status**; leaderboards give it an audience. The pull is extrinsic — it works only when it points at play that was already worth doing.

## When to use / when NOT

Use when:
- Your core loop has depth players won't exhaust on the golden path — extra goals surface it. See [[pattern-mastery-and-flow]].
- You want a **long tail**: reasons to return after the credits. Pairs with [[system-meta-progression]], [[system-prestige-and-newgame-plus]].
- Play is comparable — a clean score, a clock, a run — so ranking is meaningful. See [[system-coop-and-competition]].

Do NOT use when:
- The reward has to **manufacture** motivation the game lacks. A badge cannot rescue a boring loop; fix the loop first ([[process-core-loop]]).
- Goals would drag players off the fun path onto a tedious optimum — the [[antipattern-boring-optimal]] trap.
- Scores aren't comparable (heavy build variance, uncapped RNG) and a board would just rank luck. See [[antipattern-rng-frustration]].

## Variants

| Variant | What it rewards | Reference | Watch for |
|---|---|---|---|
| Completion | Thoroughness — see/collect everything | [[anchor-stardew-valley]], [[system-collectibles]] | Padding into a checklist chore |
| Mastery | Skill under constraint — no-hit, no-death, speed | [[anchor-hades]], [[anchor-celeste]] | Gating behind luck, not skill |
| Discovery | Finding the hidden or surprising | [[anchor-outer-wilds]], [[anchor-baba-is-you]] | Guide-dependency; unguessable steps |
| Global board | Rank vs the world | [[anchor-tetris]], [[anchor-vampire-survivors]] | Cheating, unreachable top ([[antipattern-solved-metagame]]) |
| Friend board | Rank vs your circle | [[anchor-mini-metro]], [[anchor-peggle]] | Empty when solo; needs identity |
| Daily seed | One shared run, ranked | [[anchor-spelunky]], [[anchor-slay-the-spire]] | Seed exploits; timezone fairness |

## Tuning levers

- **Goal legibility.** State the target crisply *(beat the boss without dashing)* or hide it deliberately (see twist below). Ambiguity that forces a wiki is [[antipattern-guess-the-designer]].
- **Reward.** Cosmetic-only (a badge) keeps play honest; power rewards drag players onto the grind. If earning it changes the meta, you've built [[system-reward-schedules]], not an achievement — treat it as such.
- **Effort curve.** Spread from trivial (first kill) to brutal (100% no-death) so every skill tier has a next rung. A wall of only-brutal reads as [[antipattern-grind-wall]].
- **Anti-cheat.** Boards are worthless if the top is fake. Prefer **replay verification** (re-simulate the seed + inputs) over trusting a submitted number.
- **Board freshness.** Rolling windows (this week, this season — see [[system-live-ops-and-seasons]]) keep the #1 slot contestable; an all-time board calcifies.
- **Failure legibility.** Missable achievements need a warning or a mercy path; a permanent lockout for an unmarked choice is [[antipattern-backtracking-tax]].

## Twist seams

- **Leaderboard but everyone races the same daily seed** *(constraint)* — remove luck as an excuse. One seed, one day, global; the run is now a pure test of decisions, and coffee-break replay chatter emerges ([[anchor-spelunky]] daily, [[anchor-slay-the-spire]] daily climb). Fairness demands a fixed close time and replay proof.
- **Achievements but the game hides they exist until earned** *(structure)* — no list to grind, no spoilers. Each pop is a genuine surprise that *retroactively* names what you just did — the [[anchor-outer-wilds]] and [[anchor-return-of-the-obra-dinn]] register-of-discovery feel. See [[pattern-surprise-and-delight]]. Cost: no signposting, so tie unlocks to natural play, never to obscure inputs.

## How it wires to Hayao

- **Achievement checks are pure predicates over run state.** Fold them into your end-of-run summary as functions of the recorded outcome (deaths, time, items) — the same probe surface tests already read. No new subsystem; a badge is a boolean.
- **Determinism makes boards possible.** Because the sim is seed-driven and reproducible, a leaderboard entry can be *(seed, input-log)* and re-simulated to verify the score — that's your anti-cheat, for free, from the same replay tooling the [[anchor-spelunky]]-style daily needs.
- **Daily seed = one seed, one calendar day.** Derive it from the date so every player shares a run; keep all randomness on the deterministic RNG so identical inputs give identical outcomes.
- **Chrome is DOM, the badge pop is cosmetic.** The achievement list, the board table, the toast — menu-and-overlay furniture, kept out of sim state; see the logic/view split in `examples/sokoban/`. For the toast's juice, [[pattern-juice-choreography]].

## Fails when…

- It rewards the tedious over the fun, pulling players onto a joyless optimum — [[antipattern-boring-optimal]].
- The board's top is a solved, cheated, or luck-decided slot no honest player can touch — [[antipattern-solved-metagame]], [[antipattern-rng-frustration]].
- 100%-ing becomes an obligation chore instead of an invitation — [[antipattern-grind-wall]], [[antipattern-content-desert]].
- Targets are unguessable without a guide — [[antipattern-guess-the-designer]].

## Verify

Assert achievement predicates fire exactly on the intended run states, and that a submitted *(seed, inputs)* re-simulates to the claimed score, per `docs/VERIFICATION.md`. Design the goals here; prove they trigger — and only then — there.
