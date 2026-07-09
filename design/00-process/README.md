# 00-process/ — The Design Pipeline

The **process** modules are the spine of the Codex: the ordered steps that turn a
one-line request into a design that's *designed enough to build*. Where the other
sections are a **parts bin** (anchors, genres, systems, worlds, patterns), these
six are the **method** for using it. Run them in order — each stage names the
sections it draws on and hands its output to the next.

```
INTENT ──▶ ANCHOR ──▶ COMPOSE ──▶ TWIST ──▶ SHAPE ──▶ HANDOFF ──▶ (FUN/JUICE/JUDGE)
```

**Intent-to-brief** parses the ask. **Pillars** distill it into a three-way
decision filter. **The twist** picks the creative bend and **composition** sources
and blends the parts, scored against the pillars. **Core-loop** shapes the play
into a nested stack. **Refine-and-handoff** converts the whole thing into a
verification contract and passes it to the craft playbooks — the seam where the
Codex shelves end and [FUN.md](../FUN.md), [JUICE.md](../JUICE.md),
and [JUDGE.md](../JUDGE.md) begin (all three live alongside the shelves here in
`design/`). The Codex never duplicates the playbooks; it *routes* to them.

## The six modules

| id | title | summary |
|---|---|---|
| [process-intent-to-brief](intent-to-brief.md) | Intent → Brief | Parse a vague request into a one-page brief: player fantasy, one-line hook, scope, hard constraints, target session length. |
| [process-pillars](pillars.md) | The Three Pillars | Derive exactly three pillars — evocative + testable — and use them as the scoring function for every later choice. |
| [process-core-loop](core-loop.md) | The Core Loop Stack | Design the nested moment/encounter/session/meta loops and the verb→challenge→feedback→reward→growth cycle inside each. |
| [process-the-twist](the-twist.md) | The Twist — "X but Y" | Anchor to a proven core, then bend it along one of six twist vectors so it's yours, not a clone. *(the quality exemplar)* |
| [process-composition](composition.md) | Composition | Assemble the design from anchor + genre template + implied systems; blend genres by satisfying every parent's verify pattern. |
| [process-refine-and-handoff](refine-and-handoff.md) | Refine & Handoff | Turn the finished design into a verification contract and hand off to FUN / JUICE / JUDGE / CONVENTIONS. |

## Order notes

The arrows are the default path, not a straitjacket. In practice:

- **Pillars gate the twist and composition** — both are *scored against* the three
  pillars, so pillars come before either even though the pipeline draws twist next.
- **The twist happens *inside* composition** — it's the creative bend you apply
  while assembling parts, not a separate assembly.
- **The loop stack is the SHAPE step** — design it once the systems are chosen; the
  systems are what fill the loop's layers.
- **Handoff is always last** — you can only write the verification contract once
  the pillars, loop, and system list exist to be proven.

See [`design/README.md`](../README.md) for the full pipeline and how these feed the
[`10-anchors/`](../10-anchors/), [`20-genres/`](../20-genres/),
[`30-systems/`](../30-systems/), [`40-worldbuilding/`](../40-worldbuilding/), and
[`50-patterns/`](../50-patterns/) sections.
