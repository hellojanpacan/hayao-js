---
id: genre-visual-novel
title: Visual Novel / Interactive Fiction
kind: genre
tags: [narrative, branching, choice, dialogue, character]
summary: Story is the mechanic — branching text and choices; the design is the shape of the tree and the weight of each fork.
use-when: You want a character/story-driven game where choices and prose carry it.
composes-with: [anchor-disco-elysium, system-dialogue-and-branching, genre-narrative-decisions, world-character-design]
anchors: [anchor-disco-elysium]
verify-with: design/FUN.md#21-·-narrative-decisions
---

**What it is.** A game where the interface is a page and the verbs are *read* and *choose*. Prose, characters, and a branching tree are the entire system; the mechanic is which fork you take and what the story remembers.

**Player fantasy / why it's fun.** You author a person's life from inside it — every choice is a small bet on who this character is, and the story answers back. The pull is authorship under uncertainty, not optimization.

## Pillars (exactly 3)

1. **Meaningful forks.** A choice must change *something the player can later see* — a scene, a line, an ending. If both branches land on the same next paragraph with no trace, it was set dressing. This is the whole game; see [[antipattern-fake-choice]] and [[pattern-meaningful-choice]].
2. **Distinct characters.** The cast is the content. Each must sound, want, and refuse differently enough that you'd recognize a line with the name stripped. Prose lives or dies here — see [[world-character-design]].
3. **Prose that pulls.** The only feedback loop is *turn the page*. Every screen ends on a hook, a want, or an unanswered question. Boredom is your only failure state.

## The loop stack

| Layer | What happens | Design lever |
|---|---|---|
| **Moment** | Read a passage, feel a beat land | Rhythm of line length; the click-to-advance cadence |
| **Encounter** | Reach a fork, weigh it, commit | Framing the choice so consequence is *legible before* you pick — see [[pattern-readability]] |
| **Session** | A chapter/route with its own turn | Give each sitting one reversal so it feels complete |
| **Meta** | Replay for other branches, collect endings, complete the cast | [[system-prestige-and-newgame-plus]]; unlock-on-replay content |

## Essential systems

- [[system-dialogue-and-branching]] — the tree itself: nodes, forks, and how paths rejoin. Your central design object.
- **State that remembers.** Flags, relationship meters, items-known. A choice only matters if it's *stored* and later *read*. See [[system-progression]] and [[system-save-and-checkpoint]] (branch-heavy VNs need generous saves — [[pattern-anti-frustration]]).
- [[world-narrative-delivery]] — pacing text: reveals, cliffhangers, when to withhold.
- [[system-quests-and-objectives]] — soft goals (routes, character arcs) that orient without a HUD.
- [[world-character-design]] + [[world-mood-and-atmosphere]] — the cast and the room they speak in.
- [[system-collectibles]] — endings gallery, CG unlocks, glossary; the meta-hook that justifies replay.

## Content & difficulty model

- **There is no difficulty axis — there's a comprehension axis.** The player must always know *enough to choose meaningfully* and *never so much that the fork is obvious*. Withhold, don't gate.
- **Content is the cost.** Real branches multiply writing. Budget with a **hub-and-spoke** or **gauntlet** tree, not a full binary explosion — most great VNs fake breadth with a few load-bearing forks.
- **Reconvergence is a tool, not a lie.** Paths *may* rejoin — but the rejoin must carry a scar (a changed line, a remembered slight). Invisible reconvergence is the genre's cardinal sin.
- **Pace by reversal, not by challenge.** See [[pattern-pacing-and-tension]] and [[pattern-escalation-and-payoff]]. A route needs a midpoint turn and a payoff that pays the setup.
- Guard against overwhelm at forks — too many equal-weight options is [[antipattern-decision-paralysis]]; too few real ones is [[antipattern-content-desert]].

## Signature-mechanic seeds

Pick one and let it reshape the tree — don't bolt it on. See [[process-the-twist]].

1. **VN but choices are made by dice you can weight** *(structure)* — forks resolve on a skill check; you spend a currency to load the dice. Failure branches are *written*, not dead ends. [[anchor-disco-elysium]] is the north star — see [[system-dialogue-and-branching]] + [[pattern-risk-reward]].
2. **Interactive fiction but two readers share one branching story** *(perspective)* — same tree, two players, each choosing for their own character; forks lock or unlock the other's path. Consequence becomes social. See [[system-coop-and-competition]] and [[anchor-it-takes-two]].
3. **VN but the tree is a physical map you walk** *(spatial)* — nodes are places; revisiting a room re-reads its state. Branch = route through space, memory = what changed there.
4. **VN but every choice is a governed resource** *(economy)* — swipe-left / swipe-right against four meters, one decision at a time; the story is the failure you're steering away from. See [[anchor-reigns]] and [[genre-narrative-decisions]].
5. **VN but a single ambiguous ledger drives the ending** *(deduction)* — the player accumulates facts and the ending resolves on what they concluded, not what they clicked. See [[anchor-return-of-the-obra-dinn]] and [[recipe-detective-deduction-board]].

## Common pitfalls

- **Fake branches that reconverge invisibly** — the defining failure. If a choice leaves no trace, cut it or scar the merge. [[antipattern-fake-choice]].
- **Illusory depth** — a wide-looking menu of forks that all reach the same three endings. [[antipattern-false-depth]].
- **Guess-the-writer forks** — the "right" choice is unknowable and punishes blindly; players resent, then reload. [[antipattern-guess-the-designer]].
- **Choice overload** — five equal options with no legible difference stall the reader. [[antipattern-decision-paralysis]].
- **Wall-of-text pacing** — no reversal, no hook, prose that informs instead of pulling. Cut until it moves; see [[pattern-opening-hook]] and [[pattern-restraint-and-negative-space]].
- **Feature soup** — grafting combat/minigames onto text because you fear the text isn't enough. Trust the prose or change genres. [[antipattern-feature-soup]].

## Anchors

- [[anchor-disco-elysium]] — skill-check forks, a state that remembers everything, prose as the entire combat system. The proof that branching + character can *be* the game.
- [[anchor-reigns]] — the minimalist extreme: two choices, four meters, endless consequence.
- [[anchor-papers-please]] — narrative pressure through a mechanical loop; story emerges from constraint.
- Compare siblings: [[genre-narrative-decisions]] (choice-as-system, lighter prose) and [[genre-walking-sim]] (story through space, few forks).

## Verify

Prove the forks are real and the story pulls per **design/FUN.md#21-·-narrative-decisions** — assert that distinct choices reach distinct, remembered states, not a silent reconvergence. Keep the tree a pure, inspectable data structure so branch coverage is machine-checkable.
