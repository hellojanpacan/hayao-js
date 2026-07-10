---
id: process-refine-and-handoff
title: Refine & Handoff — The Verification Contract
kind: process
tags: [handoff, verification-contract, done, spec, proof, seam, checklist, assertions]
summary: Turn the finished design into a verification contract and hand off to the proof playbook — FUN, JUICE, JUDGE, CONVENTIONS. The seam where the Codex ends.
use-when: The design is composed and twisted, and you need to declare "designed enough to build" as a set of assertions the proof playbook will run.
composes-with: [process-composition, process-core-loop, process-pillars, process-the-twist]
verify-with: docs/VERIFICATION.md
---

# Refine & Handoff — The Verification Contract

**What it is.** The **last** Codex step and the **seam** to the proof playbook.
You convert the finished design into a *verification contract*: the concrete
assertions that must hold for the game to be what the pillars promised. The Codex
generates; from here on, the game is *proven*, not designed.

**Why it matters.** A design isn't done when it's imagined — it's done when it
**names its proofs**. The contract is the bridge: FUN.md, JUICE.md, JUDGE.md, and
CONVENTIONS pick it up and run it. Hand off a design with no contract and the
proof playbook has nothing to gate against.

## The step

Composed design → a verification contract + a clean handoff. You are not writing
tests here (that's the build). You are declaring *what would have to be true* — the
assertions the build must satisfy — and routing each to its channel.

## "Designed enough to build"

The definition of done for the Codex. All must be true:

- [ ] **One "X but Y" hook** survives as a store sentence ([[process-the-twist]]).
- [ ] **Exactly three pillars**, each with a testable clause ([[process-pillars]]).
- [ ] **A named moment verb**, prototyped or prototypable in a `sandboxes/*-lab`.
- [ ] **The loop stack** filled: moment/encounter/session/meta each named
      ([[process-core-loop]]).
- [ ] **A system list**, each `[[system-*]]` justified by a pillar
      ([[process-composition]]).
- [ ] **Parent genres named** with their FUN.md sections — the verify union.
- [ ] **The signature mechanic's consequence traced** through ≥ 3 systems.
- [ ] **A verification contract** (below) — every pillar has a proof, every parent
      genre its verify pattern, every feel claim a gate.

If any box is empty, refine — don't hand off. A gap here becomes an unverifiable
mess downstream.

## The verification contract

For each design claim, name the assertion and route it to a channel. Do **not**
write the assertion's recipe — [docs/VERIFICATION.md](../../docs/VERIFICATION.md)
owns that. You name *what* and *where*; it owns *how*.

| Design claim (from…) | Becomes the assertion… | Channel / doc |
|---|---|---|
| Pillar 1's testable clause | a probe/skill-delta the clause maps to | [FUN.md](../FUN.md) law 2, Ch. 1a |
| "The intended strategy beats null play" | `smartScore > nullScore * K` | FUN.md law 2 |
| A derived envelope (jump gap, season length, fuel budget) | a stated inequality asserted vs. config | FUN.md law 3, Ch. 3 |
| Each parent genre in the blend | that genre's FUN.md §N verify pattern | FUN.md Part 2 (union — all parents) |
| Puzzle/turn-based rules | every level solver-provable | [VERIFICATION.md](../../docs/VERIFICATION.md) Ch. 1b |
| "Same seed → same game" | golden hash + snapshot round-trip | Ch. 1c/1d |
| Every feel/juice claim ("responsive", "impactful") | a `FeedbackContract` + feel gate | [JUICE.md](../JUICE.md), Ch. 4 |
| Pacing ("breathers", "peak finale") | a feel probe over the timeline | Ch. 3 |
| "Reads at a glance" / the look | the headless SVG judged on palette/legibility | [JUDGE.md](../JUDGE.md), Ch. 2/5 |

The contract is done when **every pillar traces to at least one row** and **no
parent genre's verify pattern is missing**.

## How to run it

1. **Walk the pillars.** For each of the three, write the one assertion that
   proves its testable clause. A pillar with no proof is a pillar you can't keep.
2. **Union the verify patterns.** From [[process-composition]], list each parent
   genre and copy in its FUN.md §N verify line. All of them (the blend law).
3. **Extract the inequalities.** Every derived number (envelope, calendar, fuel,
   coverage, payback) is a law-3 inequality — state it as a comment-shaped claim.
4. **Declare the feedback contract.** Every feel adjective from the brief becomes a
   `FeedbackContract` entry + a Channel 4 gate. Design the *event*; JUICE proves it.
5. **Name the null strategy.** The do-nothing/never-draft/undefended run that must
   *lose* — the cheapest and most important scenario (FUN.md law 4).
6. **Route the look.** State what the headless screenshot must show (bright avatar,
   palette, legible layout) for JUDGE to pass.
7. **Hand off.** The contract *is* the spec. Per FUN.md law 1, *the verify suite is
   the design doc* — you've now written its assertions, first.

## The explicit handoff

Where each concern goes, and the doc that owns it from here:

| Concern | Handed to | Owns |
|---|---|---|
| Mechanical truth, skill-delta, inequalities, solver, determinism | **[FUN.md](../FUN.md)** + [VERIFICATION.md](../../docs/VERIFICATION.md) Ch. 1/3 | Is it correct and beatable? |
| Feel, feedback contract, shake/hit-stop envelopes | **[JUICE.md](../JUICE.md)** + Ch. 4 | Does it feel professional? |
| Looks — palette, layout, legibility | **[JUDGE.md](../JUDGE.md)** + Ch. 2/5 | Does it look shipped, not debug? |
| State/view split, `@hayao` imports, cosmetic rule, determinism hygiene | **[CONVENTIONS.md](../../docs/CONVENTIONS.md)** | Is it built the Hayao way? |

After handoff, the build runs `npm run check`, `npm test`, `npm run verify`, and
`npm run judge` — and the design stands or falls on the contract you wrote. Workshop
([Hayao Workshop](../../docs/WORKSHOP.md); `runWorkshop`) then closes the human-feel loop.

## Worked example

**Design:** the drafted-tower-defense from [[process-composition]]. Pillars:
(1) *build decisions matter*, (2) *drafts with teeth*, (3) *the range ring is UI*.

**Contract:**

- **Pillar 1** → mixed drafted build survives 10/10; mono-draft (bigger budget)
  fails. *(FUN.md §8, Ch. 1a)*
- **Pillar 2** → same pilot, never-drafting loses by a margin. *(FUN.md §11
  draft-delta — the grafted parent's pattern)*
- **Pillar 3** → the range ring renders; headless SVG shows coverage legibly.
  *(JUDGE, Ch. 2)*
- **Blend union:** §8 (coverage chord, wave-curve breathes, counter duels both
  ways) **and** §11 (win-rate window, draft-delta, intent audit). Both, in full.
- **Inequality:** `range × distanceToLane ≥ minFireChord` per drafted tower, per
  lane — asserted vs. actual map geometry.
- **Feedback contract:** `place`, `kill`, `leak` each answer on ≥ 2 senses; shake
  ≤ envelope. *(JUICE Ch. 4)*
- **Null:** bare-lane run falls early. *(FUN.md law 4)*

Every pillar has a row; both parents' patterns are present; the seam (drafted
tower × coverage) has its own proof. **Designed enough to build.**

## Traps

- **Handing off a mood.** "It should feel great" is not a contract. Every claim
  needs a channel and an assertion, or it can't be gated.
- **Dropping a parent's verify pattern.** A blend that proves only its dominant
  genre ships the other half broken. Union, always.
- **Restating the recipe.** Don't paste FUN/JUICE/VERIFICATION content here — name
  the claim and *link* the channel. Design here; prove there.
- **Contract without the null.** If nothing is asserted to *lose*, you haven't
  proven the game has teeth (FUN.md law 4). Name the null first.
- **Skipping the look route.** A design that never says what the screenshot must
  show hands JUDGE nothing to judge. State the salience/palette claim.

## Composes with

- [[process-composition]] — its system list + parent genres become the verify
  union you owe.
- [[process-pillars]] — each pillar's testable clause is a contract row.
- [[process-core-loop]] — the loop's feedback beats become the feedback contract.
- [[process-the-twist]] — the signature mechanic's traced consequences are extra
  assertions (the seam proofs).

## See also

- [docs/VERIFICATION.md](../../docs/VERIFICATION.md) — the five channels this
  contract routes into; the *how* behind every row above.
- [design/FUN.md](../FUN.md) law 1 — *the verify suite IS the design doc*;
  this step is where you write its assertions first.
- [design/JUICE.md](../JUICE.md) · [design/JUDGE.md](../JUDGE.md) ·
  [docs/CONVENTIONS.md](../../docs/CONVENTIONS.md) — the docs that own the design
  from here.
