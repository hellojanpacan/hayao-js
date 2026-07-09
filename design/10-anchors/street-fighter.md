---
id: anchor-street-fighter
title: Street Fighter
kind: anchor
tags: [fighting-game, footsies, frame-data, reads, mastery]
summary: One-on-one duel of spacing, timing, and reads — frame data is the hidden rulebook; footsies are the conversation.
use-when: You want a high-ceiling duel where mind-reading and spacing decide it.
composes-with: [genre-fighting-game, mechanic-combo-string, system-mastery-curve]
anchors: [anchor-street-fighter]
verify-with: design/FUN.md#4-·-action-adventure
---

**What it is.** Two fighters, one lane, a clock. Every attack has a startup, an active window, and a recovery tail — who acts next is decided by that math. Win the space, win the read, land the punish.

**Player fantasy / why it's fun.** You are inside your opponent's head. The joy isn't the special move — it's the moment you *knew* they'd jump, and you were already anti-airing. Skill reads as clairvoyance.

## Design DNA

The compressed essence, in three linked ideas:

- **Neutral.** Before anyone commits, both players circle at the edge of their longest poke. This is the **footsie** game — threaten, bait, whiff-punish. It is the whole match in miniature. See [[pattern-pacing-and-tension]].
- **Frame advantage.** After a blocked hit, one player recovers first. That numeric edge — plus or minus frames — is who "has the turn." The hidden rulebook that makes every exchange legible once learned. See [[system-mastery-curve]].
- **The triangle.** Strike beats throw-attempt. Throw beats block. Block beats strike. A grounded [[pattern-risk-reward]] rock-paper-scissors run at the speed of reaction. See [[system-counter-systems]].

Everything else — supers, characters, art — decorates these three.

## Load-bearing structures

| Structure | Why it works |
| --- | --- |
| **Frame data** ([[system-mastery-curve]]) | Turns feel into fact. "Minus 4 on block" is a rule you can *learn*, so mastery compounds instead of plateauing. |
| **Footsies / neutral** ([[pattern-pacing-and-tension]]) | The whiff-punish loop makes empty space tense. Nothing happening *is* the game. |
| **Strike / throw / block triangle** ([[system-counter-systems]], [[pattern-risk-reward]]) | Legible RPS means no option is safe; every choice is a read against a read. |
| **The punish** ([[mechanic-combo-string]]) | One mistake converts to a big, deterministic reward. Stakes on every button. |
| **Anti-air / space control** ([[mechanic-charge-attack]], [[pattern-readability]]) | Vertical threat (the jump-in) has a clean counter, so aggression stays honest. |
| **Round/set structure** ([[system-session-structure]]) | Best-of-3 rounds inside a match give momentum, comebacks, and adjustment beats. |
| **Character roster** ([[system-combat-model]], [[world-character-design]]) | Distinct ranges/weights make the same triangle read differently per matchup. |

## What to steal

- **The read as the core verb.** Design so the winning move is *anticipating*, not out-twitching. Reward the player who guessed the pattern.
- **A hidden rulebook that rewards study.** Numeric frame advantage is the model: consistent, discoverable, deep. Surface it slowly — see [[system-onboarding]].
- **Legible RPS at speed.** Three options, each beating one and losing to one. Cheap to teach, endless to master. See [[pattern-mastery-and-flow]].
- **Tension from empty space.** The scariest moment is *before* contact. Space and range are your suspense engine, not damage.
- **Deterministic punishment.** Whiff or get blocked at minus frames → eat a guaranteed combo. No RNG in the exchange; the [[pattern-feedback-loops]] must feel earned. Prove the exchange resolves the same every time — see verify-with.

## What's just theme (drop it)

- **1-frame links.** The classic execution barrier. It gates *dexterity*, not decision-making — pure [[antipattern-input-lie]] fuel and a [[antipattern-difficulty-cliff]]. Make combos forgiving; keep the depth in the reads.
- **Motion inputs** (quarter-circles, charges). Flavor, not fun. A single button or a two-tap can carry the same triangle. See [[system-accessibility]].
- **Twenty-character rosters.** Range/weight archetypes matter; sheer count doesn't. Three well-shaped fighters out-teach twenty samey ones — avoid [[antipattern-content-desert]] cover for [[antipattern-false-depth]].
- **Meter/super theatrics.** A comeback valve is optional. The triangle stands without it.
- **Fireballs as spectacle.** A projectile is just a slow, committal poke that controls space. Keep the *function*, ditch the flash.

## Composes into

- [[genre-fighting-game]] — the native home; this anchor *is* its spine.
- [[system-combat-model]] — grounded, frame-accurate melee for any duel.
- [[system-counter-systems]] — the strike/throw/block triangle generalizes to any read-based conflict.
- [[system-mastery-curve]] — frame data is the exemplar of a learnable-forever skill floor-to-ceiling.
- [[genre-tactics]] / [[genre-abstract-strategy]] — the read-vs-read core survives being slowed to turns.
- Boss duels in [[genre-action-adventure]] and [[genre-soulslike]] — one great matchup, learned deeply (see [[anchor-dark-souls]], [[system-boss-design]]).

## Twist seams

- **Fighting game but one button, all depth in timing** *(constraint)*. Strip the move list to a single attack; every meaning lives in *when* you press — startup, spacing, and hold-length carry the whole triangle. Depth from restraint, not vocabulary. See [[recipe-one-button-boss-rush]], [[pattern-restraint-and-negative-space]], [[anchor-cuphead]].
- **Fighter but you queue moves and watch them resolve** *(mechanic-swap)*. Both players commit orders in secret, then the round plays out — the read moves entirely to prediction, killing execution as a barrier. A duel that's pure [[pattern-meaningful-choice]]. Pairs with a deterministic sim; see verify-with.
- **Footsies but the arena is a shared resource** *(rule-add)*. Winning neutral doesn't just deal damage — it claims space/tempo on a board both players draw from. See [[system-resource-loops]], [[pattern-risk-reward]].
- **1v1 reads but asymmetric roles** *(asymmetry)*. One fighter, one trapper — the triangle differs per side. See [[system-faction-asymmetry]].

## See also

- [[genre-fighting-game]] · [[system-counter-systems]] · [[system-mastery-curve]] — the direct scaffolding.
- [[mechanic-combo-string]] · [[mechanic-parry]] · [[mechanic-charge-attack]] — verbs to build the exchange from.
- [[anchor-dark-souls]] · [[system-boss-design]] — the duel logic ported to PvE.
- [[pattern-pacing-and-tension]] · [[pattern-mastery-and-flow]] · [[pattern-readability]] — why neutral holds attention.
- [[recipe-one-button-boss-rush]] — the compression twist, already spec'd.
- [[process-the-twist]] — for turning a seam above into a brief.
