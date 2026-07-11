# 00-process/ — The Design Pipeline

The **process** modules are the spine of the Codex: the ordered steps that turn a
one-line request into a design that's *designed enough to build*. Where the other
sections are a **parts bin** (anchors, genres, systems, worlds, patterns), these
are the **method** for using it. Run them in order — each stage names the
sections it draws on and hands its output to the next.

```
INTENT ──┐
         ├──▶ SPINE ──▶ (TWIST) ──▶ COMPOSE ──▶ SHAPE ──▶ HANDOFF ──▶ (FUN/JUICE/JUDGE)
SEED  ───┘
```

The pipeline has **two lawful entries** and one gate. **Intent-to-brief** parses
a *request* into a brief — concept-first. **The seed** enters from an authored,
iterated *atom* (a character, a motif, a look, a verb-in-a-greybox) and runs the
spine *backwards* until the atom is load-bearing — atom-first. Either way,
nothing proceeds to loop assembly until a spine holds; only the direction of
travel differs. **The spine** is the primary generator: it
names the one *tension* the game is about — objective · superpower · scarcity ·
obstacle · renewal — runs the gate (*does using the superpower well create the next
problem?*), then *derives* theme, setting, feel, and death-handling as expressions
of that tension, audited by a resonance table. **The twist** is now a *sub-tool of
the spine* — one way to find or refresh a spine's face ("X but Y"). **Pillars**
distill the spine into a three-way decision filter; **composition** sources the
parts the spine demands; **core-loop** shapes the play into a nested stack.
**Refine-and-handoff** converts the whole thing into a verification contract and
passes it to the craft playbooks — the seam where the Codex shelves end and
[FUN.md](../FUN.md), [JUICE.md](../JUICE.md), and [JUDGE.md](../JUDGE.md) begin (all
three live alongside the shelves here in `design/`). The Codex never duplicates the
playbooks; it *routes* to them.

**Which generator?** Start from the **spine** — it produces a *loop* (a thing you
do). Reach for the **twist** when you want a fresh *face* for a spine you already
have, or when bending a proven game is how you'll *discover* the tension. Spine
first, twist optionally — never twist-first, or you get a pitch in search of a loop.

## The eight modules

| id | title | summary |
|---|---|---|
| [process-intent-to-brief](intent-to-brief.md) | Intent → Brief | Parse a vague request into a one-page brief: player fantasy, one-line hook, scope, hard constraints, target session length. *(entry 1: concept-first)* |
| [process-the-seed](the-seed.md) | The Seed — atom-first design | Enter from an authored atom: interrogate what it radiates, run the spine backwards until the atom is load-bearing, log the concept in the Timeline. *(entry 2: atom-first)* |
| [process-the-spine](the-spine.md) | The Spine — tension-first design | Name the one tension, run the superpower-creates-problem gate, derive everything from it, and audit with a resonance table. *(the primary generator)* |
| [process-pillars](pillars.md) | The Three Pillars | Derive exactly three pillars — evocative + testable — and use them as the scoring function for every later choice. |
| [process-core-loop](core-loop.md) | The Core Loop Stack | Design the nested moment/encounter/session/meta loops and the verb→challenge→feedback→reward→growth cycle inside each. |
| [process-the-twist](the-twist.md) | The Twist — "X but Y" | The spine's sub-tool: bend a proven core along one of six vectors to find or refresh a tension's face. *(the composition exemplar)* |
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
