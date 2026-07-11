---
id: anchor-braid
title: Braid
kind: anchor
tags: [time-puzzle, puzzle-platformer, single-idea, elegance]
summary: A puzzle-platformer where each world twists ONE time rule — mastery is understanding a single idea completely.
use-when: You want elegant puzzles that each explore one variation of a core rule.
composes-with: [mechanic-rewind, genre-puzzle-platformer, pattern-emergence]
anchors: [anchor-braid]
verify-with: design/FUN.md#1-·-grid-puzzle
---

**What it is.** A puzzle-platformer where each world hands you exactly one twist on time — rewind everywhere, objects immune to rewind, time tied to your horizontal motion, a shadow that replays your last run — and then mines that single idea until you understand it completely.

**Player fantasy / why it's fun.** The click of comprehension. Not "I have fast reflexes" but "I finally *see* how this rule works." Each solution reframes the rule you thought you knew.

## Design DNA

- **One rule per world.** Every world introduces a single time mechanic and never adds a second. Depth comes from combining that rule with plain platforming, not from stacking rules.
- **Exhaustive mining.** The rule is explored to exhaustion — each puzzle is a distinct *consequence* of the same law, not a harder version of the last.
- **The rule is the tutorial.** No text explains it. Puzzle 1 of a world teaches the rule by making it the only way through. See [[system-onboarding]].
- **Reset is free, failure isn't punished.** Rewind (or full retry) is instant, so the player experiments without cost. The tension is cognitive, not twitch. See [[pattern-anti-frustration]].
- **Small vocabulary, deep grammar.** A handful of objects (doors, keys, monsters, platforms) recombine under each world's rule to yield dozens of "aha" configurations.

## Load-bearing structures

| Structure | Why it works |
|---|---|
| One time-rule per world | Bounds the search space — the player reasons about *one* new variable, so every puzzle is legible. [[pattern-readability]] |
| Rule-immune objects (the glow) | The exception is what creates puzzles — a rule with no counter-object is trivial. See [[system-counter-systems]]. |
| Instant, costless rewind | Turns the level into a thinking space; players test hypotheses instead of fearing death. [[mechanic-rewind]], [[pattern-fairness-and-trust]] |
| Non-blocking collectibles | Puzzle pieces are optional and off the critical path — hard puzzles never gate progress. [[system-collectibles]], [[pattern-pacing-and-tension]] |
| Escalation within a world | Puzzles ramp from "state the rule" to "abuse the rule" before the world ends. [[system-mastery-curve]], [[pattern-escalation-and-payoff]] |
| The "one true solution" feel | Each puzzle has a single elegant answer; finding it is the reward, not executing it. [[pattern-mastery-and-flow]] |

## What to steal

- **The chapter contract:** one idea, fully mined, per chapter — then retire it and move on. Do not carry the rule forward into the next world.
- **Teach by construction.** The first puzzle of a set *is* the explanation; the player can't pass without demonstrating they understand. Never bolt on a text tutorial. See [[antipattern-endless-tutorial]].
- **Make the exception the content.** Author the rule, then author the *one object that breaks it*. That object is where 90% of your puzzles live. [[pattern-emergence]]
- **Decouple difficulty from progress.** Route the hard content through optional collectibles so a stuck player still advances. [[pattern-anti-frustration]]
- **Solvable-by-thought, not by twitch.** Keep execution windows generous; the puzzle should live in the player's head. Contrast [[anchor-celeste]], where the same platform vocabulary is deliberately execution-hard.
- **Single true solution.** Design each puzzle to a unique elegant answer — resist letting brute force or reflexes cheese it. [[antipattern-false-depth]]

## What's just theme (drop it)

- **The ambiguous prose narrative.** The between-world text is evocative but load-bearing to *nobody's* puzzle. Keep your worlds if the story dissolves. Ship the mechanic; theme it later with [[world-theme-vectors]].
- **The "profound meaning" framing.** Players remember the rewind, not the epilogue. Don't design puzzles to serve a message.
- **Painterly art specifically.** The elegance is structural, not stylistic — a pixel-art or neon skin proves the same DNA. See [[world-aesthetic-direction]].
- **Melancholy tone.** The one-idea-per-world engine is tone-agnostic; a bright, playful skin works identically.

## Composes into

- [[genre-puzzle-platformer]] — the native home; Braid *is* the reference spec for this genre.
- [[genre-grid-puzzle]] — drop the platforming, keep one-rule-per-level on a grid; the DNA survives intact. Prove the solver via [[process-core-loop]] against `examples/sokoban/`.
- [[system-progression]] — worlds-as-chapters give a clean, legible progression spine.
- [[pattern-mastery-and-flow]] — the comprehension loop is the mastery curve.
- [[genre-precision-platformer]] — invert it: keep the vocabulary, move tension from head to hands.

## Twist seams

- **Braid but the time rule is chosen by the player each level** *(structure)* — the world hands you two or three rules and you pick which to apply; the puzzle becomes "which lens solves this?" Now the meta-choice is the content. Watch for [[antipattern-fake-choice]] — every offered rule must actually solve *some* configuration. See [[pattern-meaningful-choice]].
- **One-rule-per-world but the rules stack as you go** *(emergence)* — instead of retiring each rule, you keep it; world 3 puzzles demand rewind *and* motion-time *and* a shadow at once. Combinatorial depth, but you must gate the ramp hard or you hit [[antipattern-difficulty-cliff]]. See [[pattern-emergence]], [[system-mastery-curve]].
- **Braid but the shadow is another player** *(co-op)* — the replay you race against is a second person's live run; coordination replaces solo insight. See [[genre-coop-chaos]], [[anchor-it-takes-two]].
- **Time-rule-per-world but framed as a boss** *(combat)* — each world's rule is a fight where the boss obeys the same law you do. See [[system-boss-design]], [[anchor-cuphead]].

## See also

- [[mechanic-rewind]] — the single most-used Braid rule, isolated.
- [[mechanic-time-stop]] — an adjacent time verb to build a world around.
- [[anchor-baba-is-you]] — the other great "one legible rule, exhaustively mined" puzzle anchor; there the rule itself is editable.
- [[anchor-portal]] — same DNA (one spatial rule, taught by construction, mined to exhaustion) in a different verb.
- [[anchor-outer-wilds]] — one time-loop idea mined for a whole game, knowledge as the only progression.
- [[process-the-twist]] — how to pick your single rule and its one exception.
- [[design/FUN.md]] verify-with above proves the puzzle is winnable; author the rule here, prove the solver there.
