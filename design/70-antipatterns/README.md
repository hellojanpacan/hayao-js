# 70-antipatterns/ — The Failure-Mode Catalog

The **mirror** of [`50-patterns/`](../50-patterns/). Where patterns are the moves
that make a game good, these are the named ways it goes wrong — the design smells
an agent should check its own work against **before** it hands off to the proof
playbook. LLMs default to bloated, derivative, unfocused designs; this shelf is
the antibody. Run it at [REFINE & HANDOFF](../00-process/refine-and-handoff.md):
walk the list, and for every smell you find, follow **the fix** to the
`system-*`/`pattern-*` that cures it.

Each module says **the smell · how it happens · the tell (spot it in your own
design) · the fix (linked) · seen in… · a guard link**. These name *conception*
failures — the design was wrong before a line was written. The *implementation*
failures (it crashes, it desyncs, it's unreadable) live in
[`design/FUN.md`](../FUN.md) / [`design/JUICE.md`](../JUICE.md) /
[`design/JUDGE.md`](../JUDGE.md). Design-smell here; break-check there.

Cross-link with `[[antipattern-id]]`; follow `composes-with`.

## Scope & focus

| id | title | the smell |
|---|---|---|
| [[antipattern-feature-soup]] | Feature Soup | Many systems, no spine; the game is about nothing |
| [[antipattern-second-system]] | Second-System Effect | Over-building the follow-up with every cut idea |
| [[antipattern-false-depth]] | False Depth | Complexity mistaken for depth; rules that don't interact |
| [[antipattern-currency-spaghetti]] | Currency Spaghetti | Too many currencies with unclear roles |
| [[antipattern-decision-paralysis]] | Decision Paralysis | Too many options at once; depth reads as noise |

## Progression & economy

| id | title | the smell |
|---|---|---|
| [[antipattern-grind-wall]] | Grind Wall | Progress gated by repetition, not skill or choice |
| [[antipattern-power-creep]] | Power Creep | Each addition outclasses the old; content decays on arrival |
| [[antipattern-stat-inflation]] | Stat Inflation | Bigger numbers standing in for real progression |
| [[antipattern-boring-optimal]] | The Boring Optimal | The best strategy is the least fun one |
| [[antipattern-pay-to-skip]] | Pay-to-Skip | Friction manufactured so the design can sell the cure |

## Difficulty, pacing & onboarding

| id | title | the smell |
|---|---|---|
| [[antipattern-difficulty-cliff]] | Difficulty Cliff | A spike the ramp never prepared for |
| [[antipattern-endless-tutorial]] | The Endless Tutorial | Teaching that never yields control |
| [[antipattern-content-desert]] | Content Desert | A big empty world padded with distance |
| [[antipattern-fail-loop-tax]] | The Fail-Loop Tax | Losing costs time, not lessons |
| [[antipattern-backtracking-tax]] | Backtracking Tax | Length padded by re-walking known ground |

## Fairness & feel

| id | title | the smell |
|---|---|---|
| [[antipattern-fake-choice]] | Fake Choice | Options that collapse to one right answer |
| [[antipattern-solved-metagame]] | Solved Metagame | One build dominates; mastery is copying the wiki |
| [[antipattern-rng-frustration]] | RNG Frustration | Variance that erases skill; the loss feels stolen |
| [[antipattern-unreadable-juice]] | Unreadable Juice | Feedback so loud it hides state |
| [[antipattern-input-lie]] | The Input Lie | The game drops or delays inputs; trust dies |
| [[antipattern-guess-the-designer]] | Guess-the-Designer | Puzzles solved by reading the author's mind |

## Use it as a checklist

Before you [hand off](../00-process/refine-and-handoff.md), read this shelf top to
bottom against your design. A single confirmed smell is worth a redesign pass —
they compound. Most fixes point back into [`30-systems/`](../30-systems/) and
[`50-patterns/`](../50-patterns/): the cure for a failure mode is almost always a
system you under-tuned or a pattern you skipped.
