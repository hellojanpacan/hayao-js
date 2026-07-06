---
id: antipattern-guess-the-designer
title: Guess-the-Designer
kind: antipattern
tags: [puzzle, fairness, readability, solution]
summary: Puzzles solved by reading the author's mind, not the rules — leaps of logic the game never taught.
use-when: A puzzle solution depends on knowledge the game did not provide.
composes-with: [pattern-fairness-and-trust, pattern-readability, genre-grid-puzzle]
verify-with: docs/FUN.md#1-·-grid-puzzle
---

**What it is.** A puzzle whose answer follows not from what the game **showed** but from what the author happened to be thinking. The player doesn't deduce — they guess your intent, or open a wiki.

**Why it hurts.** A solvable puzzle you failed teaches you. A **guess-the-designer** puzzle you "solved" teaches you nothing — you learned that the game lies about what its rules are. Trust dies, and every later puzzle now feels like a coin-flip. See [[pattern-fairness-and-trust]].

## The smell

The solution requires a rule, verb, or fact the game **never taught, showed, or implied** at that moment. The path to the answer runs through the author's head, not the board.

## How it happens

| Cause | What it looks like |
|---|---|
| **Untaught verb** | The solve needs an interaction (push a specific tile, combine two objects) the game never demonstrated. |
| **Off-screen state** | The clue lives in a manual, a loading screen, an earlier room, or a mechanic three levels back. |
| **Moon-logic** | Two objects combine only because the designer's word-association says so — the adventure-game "cat-hair mustache" (Gabriel Knight 3), the whole point-and-click moon-logic lineage. |
| **Invisible affordance** | The lever exists but reads as decoration — a [[pattern-readability]] failure masquerading as difficulty. |
| **Pixel-hunt** | The answer is *there* but sub-threshold: one pixel, one frame, one unlabeled hotspot. |
| **Author's blind spot** | Obvious to the person who built it; opaque to anyone arriving cold. Playtest-of-one. |

## The tell

Check YOUR design against these before handoff:

- You can only explain the solution by saying **"you were supposed to remember / notice / try"** — not "the board shows."
- Your solver proves the level winnable, but the winning move uses a rule the player has **no in-game reason to know**. Machine-solvable ≠ human-fair.
- In playtest, testers reach the answer by **exhaustive trial** or by **asking you**, never by reasoning aloud to it.
- Removing the "aha" clue changes **nothing** on screen — proof it was never on screen.
- The fun is in the *reveal of intent*, not the *click of logic*. That's a magic trick, not a puzzle.

## The fix

**Telegraph the rule, then let the solution fall out of it.** Every fact the answer needs must be legible on the board, in the last five seconds, or in a verb the player already owns.

- **Show the verb before you test it.** Teach in a safe room, then demand it. See [[system-onboarding]] and [[system-telegraphs]].
- **Put the clue on screen.** State the world reads must live in what the player can see — [[pattern-readability]], [[system-telegraphs]]. If it matters, render it; don't footnote it.
- **Make affordances announce themselves.** Interactive ≠ decoration. Distinct silhouette, color, or motion for anything that acts. [[world-aesthetic-direction]].
- **One new idea per level.** Introduce, isolate, then combine — the [[genre-grid-puzzle]] contract and [[system-mastery-curve]]. A leap is only fair if it's *one* leap from taught ground.
- **Anti-frustration backstops.** A hint ladder or reveal for the stuck player converts a guess-wall into a slope. [[pattern-anti-frustration]], [[system-grace]].
- **Deduction from full information.** The gold standard: everything needed is *present*, the difficulty is *assembling* it. [[recipe-detective-deduction-board]].

## Twist seams

Legit designs that flirt with this line — and stay honest by paying a specific toll (twist vector in parens):

- **Guess-the-designer but the mind you read is the game's own grammar** *(consistency)* — [[anchor-baba-is-you]] and [[anchor-portal]] have leaps, but every rule is a manipulable object on screen. You infer *the system*, never *the author*. The verb set is closed and shown.
- **Guess-the-designer but the deduction is the entire game** *(full information)* — [[anchor-return-of-the-obra-dinn]] and [[anchor-disco-elysium]]'s checks: leaps are huge, yet every clue is in your logbook. The three-lock confirm turns a guess into a proof. Contrast [[recipe-detective-deduction-board]].
- **Guess-the-designer but the fog is a designed mechanic, not an oversight** *(honest opacity)* — [[anchor-outer-wilds]] withholds on purpose, but the ship's log tells you *what you don't yet know*. The unknown is legible as unknown; you're never guessing whether a rule exists.

## Seen in / near it

- **Classic point-and-click adventures** — the genre's reputation for "use donkey wrench on ravioli." Moon-logic combinatorics; the wiki is the intended interface.
- **[[anchor-braid]]** — a few late puzzles lean on obscure timing/parallax reads that testers brute-forced; the time mechanics themselves stay fair, the *presentation* of the clue slips.
- **Early Zelda / metroidvania walls** — the bombable wall that looks identical to every other wall ([[genre-metroidvania]]). Solved by bombing *everything*, not by reading the wall. Fix: telegraph the crack.
- **Kaizo/ROM-hack "blind jumps"** — invisible traps you can only clear after dying to learn them. Guess-the-designer as difficulty; contrast [[antipattern-input-lie]] and [[antipattern-fail-loop-tax]].

## Neighbors

- Sits beside [[antipattern-fake-choice]] (options that don't matter) — here the *one* real path is hidden.
- Distinct from [[antipattern-rng-frustration]]: that's the *dice* betraying you; this is the *rulebook*.
- A [[pattern-readability]] failure at root: the information exists but never reaches the player's eyes.

## Verify / guard

The board must be **solvable by deduction from what's on it** — prove it the way [[genre-grid-puzzle]] demands. See `docs/FUN.md#1-·-grid-puzzle`: a machine solver proves winnability, but *you* must confirm the winning line uses only taught rules. Reference `examples/sokoban/` for the pure-logic split that keeps the rule set inspectable. A solver that wins via an untaught verb is a red flag, not a green check.
