---
id: pattern-fairness-and-trust
title: Fairness & Trust
kind: pattern
tags: [fairness, trust, readability, honesty, feel]
summary: The player must trust the sim — deaths are earned, inputs land, rules are consistent; trust broken once colors everything after.
use-when: Anytime randomness, hitboxes, or hidden rules could make a loss feel stolen.
composes-with: [system-grace, antipattern-rng-frustration, antipattern-input-lie]
verify-with: docs/JUICE.md
---

# Fairness & Trust

**What it is.** The player must believe the sim is honest: every loss traces to a
choice *they* made, inputs land as pressed, and the rules that killed them are the
rules that were always running. **Trust** is the substrate under every other
pattern — break it once and the player re-reads every prior death as a cheat.

**Player fantasy.** *"That was on me."* The loss stings but it's *owned* — I see
the mistake, I know the fix, I go again. The opposite fantasy — *"the game robbed
me"* — is where players quit and don't come back.

## Why it works

- **Attribution is the whole engine of learning.** A player only improves if they
  can map loss → cause → fix. An *unattributable* death (offscreen shot, a rule
  they never saw) teaches nothing and reads as theft. Dark Souls is brutal but
  trusted precisely because every death is legible and re-runnable.
- **Trust is asymmetric.** It's earned across hundreds of fair frames and lost in
  one unfair one. After a felt injustice the player audits everything — the next
  ten *fair* deaths also feel stolen. Guard the floor; you can't spend your way back.
- **Perceived fairness beats actual fairness.** Players don't run the numbers; they
  feel them. A true-random streak of six misses reads as rigged even though it's
  honest — so ship the *felt* fairness (pity, pseudo-random distribution), not the
  spreadsheet's ([[antipattern-rng-frustration]]).
- **The input must be the contract.** If a jump you pressed doesn't fire, no amount
  of polish survives it — the player stops trusting their own hands ([[antipattern-input-lie]]).

## Levers

| Lever | What it buys | Example |
|---|---|---|
| **Telegraph** | The threat is *shown in time* to answer | ~0.45s attack flash; the range ring ([[system-telegraphs]]) |
| **Honest hitbox** | The death matches the picture | Hurtbox smaller than the sprite; coyote time / input buffer ([[system-grace]]) |
| **Deterministic rules** | Same input, same result, every time | A pure rules module; no hidden dice on core logic ([[pattern-readability]]) |
| **Elected variance** | The gamble was *opted into* | You chose the elite room; the swing isn't forced ([[pattern-risk-reward]]) |
| **Pity / floor** | Streaks can't run forever | Bad-luck protection, guaranteed drop by N ([[system-reward-schedules]]) |
| **Perfect information** | The bad outcome was foreseeable | Into the Breach shows every enemy move before you commit |
| **Recoverable loss** | A mistake costs *a* thing, not *the* thing | Checkpoint near the wall ([[system-save-and-checkpoint]]) |

## Applied across genres

| Genre | The trust that must hold |
|---|---|
| **Precision platformer** ([[genre-precision-platformer]]) | The jump lands when pressed; coyote time & buffer make the *fair* feel forgiving (Celeste) |
| **Bullet hell** ([[genre-bullet-hell]]) | A tiny, *visible* hurtbox — the near-miss thrills because the death was earned ([[anchor-nuclear-throne]]) |
| **Tactics** ([[genre-tactics]]) | Perfect information, shown honestly — you saw the move and chose anyway ([[anchor-into-the-breach]]) |
| **Roguelike** ([[genre-roguelike]]) | The seed is fair *and* the death is attributable — Spelunky never kills you with a rule you couldn't see ([[anchor-spelunky]]) |
| **Deckbuilder** ([[genre-deckbuilder]]) | The incoming hit is blockable in principle; the draw variance was a risk you drafted into ([[anchor-slay-the-spire]]) |
| **Soulslike** ([[genre-soulslike]]) | Enemy tells readable, arena fair — the difficulty is trusted, not cheap ([[anchor-dark-souls]]) |
| **Fighting game** ([[genre-fighting-game]]) | Frame data is the same for both players; no hidden advantage ([[anchor-street-fighter]]) |

## The twist seams

- **Deterministic rules but hidden dice on presentation** *(vector: honesty split
  — the sim is provably fair, the mask isn't).* Papers, Please: the rulebook is
  exact and consistent, yet a "random inspection" you couldn't predict still *feels*
  fair because it's the world being arbitrary, not the game cheating you.
- **Honest hitbox but the animation lies generously** *(vector: forgiveness over
  literalism).* The hurtbox is smaller than the sprite and the landing has coyote
  frames — the *code* is stricter than it looks, so the player is fooled toward
  survival, never toward death. Fooling upward builds trust; fooling downward burns it.
- **Elected variance but a floor under the streak** *(vector: chosen risk, capped
  cruelty).* The player opts into the gamble ([[pattern-risk-reward]]), but pity
  systems and pseudo-random distribution stop true randomness from producing a
  losing streak the player would (rightly) read as rigged.

## Overdone when…

- **Fairness sands off all tension.** If nothing can *ever* punish you, no win is
  earned. Trust is the floor under difficulty, not a replacement for it — Dark Souls
  is fair *and* lethal ([[system-difficulty-and-dda]]). Guarantee the loss is
  attributable, not that it can't happen.
- **Telegraph inflation.** Every threat wrapped in a half-second flashing warning
  removes the read entirely; the game plays itself. Signpost the *unfair* surprise,
  not the fair challenge ([[pattern-readability]]).
- **Pity that erases risk.** A floor so high the gamble can't sting — now the
  "risk" is theater and the reward means nothing ([[pattern-risk-reward]]).
- **Grace as a crutch for bad hitboxes.** Coyote time and buffers *tighten* a fair
  system; they don't excuse a hurtbox that's a coin flip ([[system-grace]]).
- **Consistency drift.** A rule that fires here but not there ("fire spreads
  sometimes") is the single fastest way to void trust — the player can no longer
  form a mental model, so every plan is a guess ([[pattern-emergence]]).

## The trust-break cascade

Trust is not one variable — it's the *precondition* the other patterns spend:

- **Readability** ([[pattern-readability]]) is trust's front line — a death you
  couldn't *see* coming is unfair before it's anything else.
- **Risk/reward** ([[pattern-risk-reward]]) only reads as drama if the variance was
  *elected*; forced swing reads as robbery.
- **Meaningful choice** ([[pattern-meaningful-choice]]) collapses if outcomes are
  arbitrary — a choice whose result is a hidden die is a [[antipattern-fake-choice]].
- **Anti-frustration** ([[pattern-anti-frustration]]) is trust maintenance: every
  friction that *isn't* the intended challenge quietly taxes the player's faith.

## Verify / feel-gate link

Fairness is one of the few *taste* qualities with a mechanical proxy — see
`docs/JUICE.md` for the feel-gate discipline, and prove the sim's half directly:

- **Determinism is provable.** Same seed + same inputs → same result, byte-for-byte
  ([[system-save-and-checkpoint]]). If a replay diverges, some hidden non-determinism
  is lying to the player. This is the hardest floor and it's machine-checkable.
- **Blockable-in-principle.** For combat variance, the worst incoming must be ≤ the
  player's answer ceiling — the line between a hard choice and a coin flip. Assert it.
- **Attributability is a design review, not a metric.** For each death path ask:
  *could the player have seen it, and could they do better next time?* If the honest
  answer is no, it's not difficulty — it's a broken contract.

## Worked micro-example

*"A twin-stick roguelike where deaths feel cheap."* The naive build kills the
player with offscreen projectiles and a hurtbox the size of the sprite — every loss
reads as theft, and the player quits at floor two. Restore trust in three moves:
(1) **honest hitbox** — shrink the hurtbox well inside the sprite so near-misses
*feel* near ([[anchor-nuclear-throne]]); (2) **telegraph** — no threat spawns or
fires without a readable tell inside the play space ([[system-telegraphs]]); (3)
**pity floor** — a pseudo-random distribution on drops so a cruel dry streak can't
compound the felt injustice ([[antipattern-rng-frustration]]). Now the same
difficulty reads as *earned*. The player still dies — but says "again," not "cheap."

## Composes with

- [[system-grace]] — coyote time, input buffers, and generous hurtboxes are trust
  made mechanical; they fool the player *upward*, toward survival.
- [[antipattern-rng-frustration]] — the failure mode when honest randomness produces
  felt injustice; the reason pity systems and PRD exist.
- [[antipattern-input-lie]] — the deepest betrayal: an input the player pressed that
  the game silently dropped. No polish survives it.
- [[pattern-readability]] — a death you couldn't read coming is unfair first; legibility
  is where trust is won or lost.
- [[pattern-risk-reward]] — variance is drama when elected, robbery when forced; trust
  is what separates the two.

## See also

- [`docs/JUICE.md`](../../docs/JUICE.md) — the feel-gate discipline; fairness is a
  taste quality with a determinism-shaped mechanical floor.
- [[anchor-into-the-breach]] · [[anchor-spelunky]] — perfect-information fairness and
  fair-seed fairness as whole design philosophies.
- [[anchor-celeste]] · [[anchor-dark-souls]] — forgiving-but-honest and
  lethal-but-trusted; the two proofs that fairness and difficulty are orthogonal.
- [[anchor-papers-please]] — the world can be arbitrary while the *game* stays exactly,
  legibly fair.
