---
id: antipattern-decision-paralysis
title: Decision Paralysis
kind: antipattern
tags: [ui, onboarding, clarity, choice]
summary: Too many options at once — the player freezes instead of choosing, and depth reads as noise.
use-when: You are presenting many simultaneous choices, especially early.
composes-with: [system-onboarding, pattern-meaningful-choice, system-inventory-and-ui]
verify-with: docs/VERIFICATION.md
---

**What it is.** You put too many **simultaneous** choices in front of the player at once. They can't evaluate them, so they freeze, stall, or pick at random — and your carefully-tuned depth reads as noise.

**Why it hurts.** A choice the player can't reason about isn't a choice — it's a **tax**. The first minutes decide whether they keep playing; a wall of unexplained options at the door reads as "this game is homework." Depth that arrives before the vocabulary to parse it is indistinguishable from chaos.

## The smell

**Cognitive overload** at the point of decision. Options outnumber the player's ability to compare them, or arrive before they have the concepts to weigh a single one.

## How it happens

- **Everything unlocked day one.** The full skill tree, the whole shop, all twelve units — visible before any of them mean anything.
- **Flat, unranked lists.** Twenty items with no default, no recommendation, no sort — every one demands equal scrutiny.
- **Undifferentiated options.** Choices that all look and cost about the same, so nothing anchors the eye (see [[antipattern-fake-choice]] — paralysis and fake-choice are cousins: too many that matter vs. many that don't).
- **Naked numbers.** +3 STR / +2 DEX / +4 INT with no idea what a point buys — the player can't convert stats into a decision.
- **No off-ramp.** No "recommended," no "auto," no way to defer. The only exit is to commit blind.

## The tell (check your OWN design)

- Playtesters **hover** — the cursor drifts across the menu for 10+ seconds with no click.
- Players **ignore the menu** entirely: skip the shop, dump points into whatever's leftmost, close the screen unread.
- You catch yourself writing a tooltip to explain *why the screen is fine* rather than fixing the screen.
- New players and veterans open the same screen and the veteran is **faster by an order of magnitude** — the layout only works once you already know the answer.
- You can't name the **one** thing the screen wants the player to decide. If there are five co-equal decisions, it's five screens.

## The fix

Reduce *what's live at once*, not what exists total. Depth stays; exposure staggers.

| Move | What it does | Cures |
| --- | --- | --- |
| **Stagger unlocks** | Reveal options as the player earns the concepts to use them | Everything-day-one |
| **Curate the draft** | Offer 3, not 30 — a random or filtered slice per beat | Flat lists |
| **Default sensibly** | Pre-select the safe/recommended pick; let them override | No off-ramp |
| **Rank and sort** | Highlight, badge "new," sort by relevance | Undifferentiated options |
| **Translate stats** | Show the *effect* ("+15% faster reloads"), not the raw stat | Naked numbers |
| **Chunk the screen** | Group, tab, or gate so the eye lands on one decision at a time | Wall of options |

Staggered reveal is [[system-onboarding]]'s core job — pace introductions so each choice lands with vocabulary already in hand. The curated-slice move is a whole design lever: see [[pattern-meaningful-choice]] for making the 3 you *do* offer distinct, and [[system-inventory-and-ui]] for laying them out legibly. Keep the presentation calm — [[pattern-readability]] and [[pattern-restraint-and-negative-space]] are what let a big menu breathe.

### Twist seams

- **Full complexity, but rationed** (twist: unlock cadence). [[anchor-slay-the-spire]] shows only 3 cards per reward and one relic at a time — the whole 300-card space exists, you just never face it at once. Compare a naked "here's the collection, build a deck" screen: same depth, opposite feel.
- **Many options, but one obvious default** (twist: guided freedom). [[anchor-civilization]]'s advisor and recommended build let a new player click "yes" through a turn while a veteran micromanages the same menu — the screen serves both by ranking, not hiding.
- **Overwhelming board, but read one glance at a time** (twist: staged legibility). [[anchor-into-the-breach]] hands you a fully-solved-information puzzle every turn, yet telegraphs each threat so cleanly you parse it in seconds — paralysis dissolves under [[system-telegraphs]], not fewer pieces.

## Seen in…

- **Well-managed:** [[anchor-balatro]] and [[anchor-slay-the-spire]] — draft of 3–5, never the whole space; the deck deepens without the *screen* deepening. [[anchor-hades]] gates boons behind rooms so the build assembles one legible pick at a time. [[anchor-reigns]] is the extreme cure — every choice is *two* options, swipe left or right. [[anchor-vampire-survivors]] level-up offers a draft of three — a small slice of the full weapon/passive pool, never the whole roster.
- **Where it bites:** deep 4X and grand strategy ([[genre-4x]], [[anchor-civilization]] without its advisors) open the tech tree and city menu at once and lose players in the first hour. Character creators that front-load a dozen stat sliders before the player knows the game. RPG skill trees ([[system-skill-trees]]) shown fully at level 1. Any [[genre-deckbuilder]] that skips the draft and hands over the full collection cold.

## Verify / guard

Frontmatter points at `docs/VERIFICATION.md`. This is a **design-review gate**, not an assert: before handoff, open every choice screen and ask *"how many decisions is this asking for, and does the player have the words for each?"* Watch a first-time playtest for hover-stalls and ignored menus. Adjacent failure modes to check in the same pass: [[antipattern-fake-choice]] (options that don't matter), [[antipattern-feature-soup]] (too many systems, upstream cause), [[antipattern-endless-tutorial]] (the over-correction — staggering so hard the player never gets to choose at all).
