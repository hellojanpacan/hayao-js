---
id: anchor-papers-please
title: Papers, Please
kind: anchor
tags: [bureaucracy, moral-vise, rules-as-play, narrative-decisions]
summary: A document-checking job that becomes a moral vise — rules vs. mercy vs. feeding your family, one stamp at a time.
use-when: You want tension from applying rules under pressure with human stakes.
composes-with: [genre-narrative-decisions, system-quests-and-objectives, world-narrative-delivery]
anchors: [anchor-papers-please]
verify-with: design/FUN.md#21-·-narrative-decisions
---

# Papers, Please

**What it is.** You are a border checkpoint inspector. Each traveler hands you
documents; you cross-check them against **today's rulebook**, then stamp APPROVED
or DENIED. That's the whole verb. The horror is that the rulebook grows daily, the
line never ends, and every stamp is a life.

**Player fantasy / why it's fun.** The dull becomes the damning. A clerical
checklist turns into a **moral vise** because three forces pull against each other
at once: the *rules* (obey or be fined), *mercy* (this person is clearly
desperate), and *your family* (each correct stamp is dinner, medicine, heat). You
don't role-play an inspector — you *become* one, and the game makes you feel the
weight of choosing the rulebook over a human, or a human over your dying child.

## Design DNA

The essence: **a mundane procedure + escalating rules + personal stakes, so every
routine keystroke is secretly a moral choice.** Four parts.

- **The procedure is trivially simple** — compare two documents, spot the mismatch,
  stamp. No skill ceiling in the *action*; the whole game lives in *whether you'll
  do it*.
- **The rulebook is the antagonist.** New rules arrive every day, contradict old
  ones, and pile faster than you can internalize them. Difficulty is *cognitive
  load and moral load*, not reflex → [[system-difficulty-and-dda]].
- **Stakes are personal and metered.** Your pay feeds a family with named needs;
  errors cost money; money is survival. The consequence of a stamp is a spreadsheet
  that is also a person you love → [[pattern-risk-reward]].
- **Mercy costs.** Bending a rule to help someone is *always* a real sacrifice —
  a fine, a risk, a meal your kid won't eat. No free virtue.

Judgement must beat any fixed policy: an always-APPROVE bot and an always-DENY bot
both fail (they get fined *and* they let the wrong people through), while a player
who actually reads the rulebook survives — prove this in FUN.md §21.

## Load-bearing structures

| Structure | Why it works |
|---|---|
| **The rulebook as antagonist** | The obstacle isn't an enemy — it's *the rules themselves*, growing and self-contradicting. Applying them under pressure is the play. → [[genre-narrative-decisions]] |
| **Cross-check-and-stamp loop** | A tiny, legible verb (compare fields, find the discrepancy, commit) that's instantly learnable and infinitely re-runnable. → [[process-core-loop]] |
| **Escalating daily rules** | Each day adds a rule or reverses one; the ramp is *information*, not speed. Yesterday's reflex is today's mistake. → [[system-onboarding]] → [[system-mastery-curve]] |
| **Family-as-pressure meter** | Off-screen dependents with named needs turn abstract score into visceral stakes — every fine has a face at home. → [[pattern-pacing-and-tension]] |
| **Discretion with a price tag** | You *can* break the rules; the game just always charges you for it. Mercy is a resource you spend. → [[pattern-meaningful-choice]] |
| **The pleading traveler** | A human face + a one-line story per applicant makes each binary stamp a micro-decision with weight. → [[world-narrative-delivery]] |
| **Fail-forward consequence** | A wrong stamp doesn't end the run — it dents the meter and threads into tomorrow (citations, a sick kid, a smuggler you let pass). → [[pattern-escalation-and-payoff]] |

## What to steal

- **Make the rulebook the antagonist.** The most portable idea. Give the player a
  *simple verb* and a *growing set of rules* to apply it under, and let the
  difficulty come from the rules mounting up, not from execution. Any check-this-
  against-that job works: a bouncer, a pharmacist, a code reviewer, a customs dog.
- **Family-as-pressure.** Attach the score to *named dependents with needs* so a
  number becomes a stomach. The meter isn't "points" — it's whether someone eats.
  This is what converts a clerical task into a moral one → [[world-character-design]].
- **Price every mercy.** If bending a rule is free, there's no vise. Make
  compassion *cost* — a fine, a risk, a resource — so the player feels the trade
  every single time → [[pattern-risk-reward]].
- **One human per decision.** Give each applicant a face and a one-line story. The
  stamp is binary; the *feeling* isn't. Cheap to author, enormous in effect.
- **Contradiction as content.** New rules that clash with old ones force the player
  to *choose which rule to serve* — that's where discretion (and story) lives.

## What's just theme (drop it)

- **The dystopian-Eastern-Bloc setting.** Grim border of a fictional police state
  is atmosphere, not mechanism. The vise works at a festival gate, a soup kitchen,
  a spaceport, a hospital triage desk → [[world-theme-vectors]] · [[world-mood-and-atmosphere]].
- **Passports and stamps specifically.** The documents are one skin over
  "cross-check A against B." Tickets, prescriptions, permits, spell scrolls all fit.
- **The literal border booth.** The checkpoint is a container for "an endless line
  of human requests you must adjudicate." Any queue of pleading petitioners works.
- **The pixel-grunge art.** Production style, not design. The moral vise survives
  in clean vector or pure text → [[world-aesthetic-direction]].

## Composes into

- [[genre-narrative-decisions]] — the parent genre; Papers is its defining anchor
  for *procedure-as-morality* (as [[anchor-reigns]] is for *meters-as-stewardship*).
- [[system-quests-and-objectives]] — the daily quota and the standing storylines
  (a smuggler, a resistance, a relative) that thread through the deck of applicants.
- [[world-narrative-delivery]] — the game *is* its delivery: story arrives one
  document, one face, one one-liner at a time; no cutscenes needed.
- [[system-economy]] — pay, fines, and the family budget are the pressure that
  makes stamps hurt.
- [[system-encounter-design]] — each applicant is a hand-authored "encounter": a
  document set, a discrepancy, a plea, a consequence.

## Twist seams

- **Papers but you write the rules others must follow** *(perspective)* — flip the
  chair: the player *authors* the day's rulebook, then watches inspectors (NPCs or
  other players) enforce it and lives with the fallout. Now the moral vise is
  *legislative* — every rule you add has a face it will crush tomorrow. Pairs with
  [[system-faction-asymmetry]] and the stewardship framing of [[anchor-reigns]].
- **Rules-as-play but the rulebook contradicts itself and you choose** *(constraint)*
  — hand the player two rules that *cannot both be satisfied* for a given applicant,
  and make picking which to obey the actual move. Being wrong is content, not a
  fail-state → [[pattern-meaningful-choice]] · [[antipattern-fake-choice]] (the trap
  to avoid: contradictions where one answer is secretly always right).
- **Papers but the queue is a colony you're triaging** *(scale)* — the applicants
  aren't strangers but your own settlement's members competing for scarce rations;
  each stamp reallocates survival. Pairs with [[anchor-rimworld]] · [[anchor-frostpunk]].
- **Cross-check-and-stamp but it's deduction, not compliance** *(structure)* — the
  rules don't tell you the answer; *evidence* does, and you must reason the verdict
  from clues rather than match fields. Leans toward [[anchor-return-of-the-obra-dinn]]
  · [[recipe-detective-deduction-board]].

## See also

- [[anchor-reigns]] — the sibling anchor: choice-as-whole-game with meters instead
  of documents; steal its content-as-linted-data discipline for your applicant deck.
- [[anchor-frostpunk]] — moral cost under survival pressure at colony scale; the
  "every choice hurts someone" vise, systematized.
- [[anchor-disco-elysium]] — narrative weight from a tight loop; systems-as-story
  without a border booth.
- [[recipe-swipe-kingdom]] — a build recipe when you want the binary-choice-with-
  meters skeleton prebuilt; reskin the swipe as a stamp.
- [[world-narrative-delivery]] · [[system-quests-and-objectives]] · [[system-economy]]
  — the three docs you'll live in to build this.
- Prove judgement beats any fixed stamp policy in `design/FUN.md#21-·-narrative-decisions`;
  a rulebook you can ignore is [[antipattern-fake-choice]].
