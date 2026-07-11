# The Hayao Design Codex

**`design/` is the single home for game design in this repo** — the whole
discipline of deciding *what to build* and *making it feel good*, kept separate
from `docs/`, which is the engineering manual (how the engine works and how you
prove it correct). It has two halves:

- **The Codex** (the numbered shelves, `00-process/` … `80-recipes/`) — the
  *generative* front half. It turns a high-level intent — *"design an RTS with
  deeply strategic choices, faction asymmetry, and visually impressive battles"* —
  into a concrete, creative, buildable design.
- **The craft playbooks** — [`FUN.md`](FUN.md) (the design/verification playbook),
  [`JUICE.md`](JUICE.md) (the game-feel cookbook), and [`JUDGE.md`](JUDGE.md) (the
  vision judge). Where the Codex decides what a game *is*, these make it *fun,
  juicy, and beautiful* — and prove it isn't broken.

The Codex runs first and hands off to the playbooks; together they own the design
half end to end, then hand off to `docs/` for conventions and machine verification.

The engine pre-solves *implementation*. This library pre-solves *conception*: it
gives you reference DNA to anchor to, modular systems to compose, a twist formula
to make it yours, and a pipeline that ends where [`FUN.md`](FUN.md) begins.

> **You are still the designer.** The Codex is scaffolding, not a slot machine.
> It exists so you spend your creativity on the *twist* and the *feel*, not on
> re-deriving what every roguelite already knows about meta-progression. Compose
> the known, then bend it.

---

## How to use it — the design pipeline

Run these in order. Each stage names the modules that drive it. Do **not** open
`examples/` for ideas (see [AGENTS.md](../AGENTS.md)); design from the mechanic
and the fantasy, using this library as your parts bin.

```
INTENT ──┐
         ├──▶ SPINE ──▶ (TWIST) ──▶ COMPOSE ──▶ SHAPE ──▶ HANDOFF ──▶ (FUN/JUICE/JUDGE)
SEED  ───┘
```

Two lawful entries, one gate: enter from a *request* (INTENT) or from an
*authored atom* (SEED — a character, a motif, a look that already exists and
radiates a game); either way nothing proceeds past the SPINE until one tension
holds. The Codex runs in the background — the player of this library is the
agent; what a user sees is the concept it proposes, not the shelves.

1. **INTENT → brief** *(entry 1)*. Parse the request into a design brief: player
   fantasy, the one-sentence hook, scope, hard constraints.
   → [`00-process/intent-to-brief`](00-process/intent-to-brief.md)
   **— or — SEED → spine-backwards** *(entry 2)*. Start from an atom you've
   already iterated; interrogate what it radiates, audition tensions until the
   atom is load-bearing, log the concept in the project Timeline.
   → [`00-process/the-seed`](00-process/the-seed.md)
2. **SPINE.** The primary generator and the gate both entries pass through:
   name the one tension — objective · superpower · scarcity · obstacle ·
   renewal — run the *superpower-creates-the-next-problem* gate, then derive
   theme, feel, and structure from it, audited by a resonance table.
   → [`00-process/the-spine`](00-process/the-spine.md)
3. **TWIST** *(optional, a sub-tool of the spine)*. Bend a proven core along a
   vector (theme, mechanic-swap, structure, perspective, constraint, tonal) to
   find or refresh the tension's face. The verb is where a twist bites hardest
   — reach into [`60-mechanics/`](60-mechanics/). *Unrailed = Overcooked +
   voxel + roguelite + train.* → [`00-process/the-twist`](00-process/the-twist.md)
4. **COMPOSE.** Anchor on the 1–3 touchstone games this *is* (their load-bearing
   DNA, not their theme), then assemble genre template + the systems the spine
   demands (progression, economy, combat, factions…). Genres blend; satisfy
   every parent. → [`10-anchors/`](10-anchors/) · [`20-genres/`](20-genres/) ·
   [`30-systems/`](30-systems/)
5. **SHAPE.** Derive pillars, the loop stack, the world, the verbs, and the
   aesthetic; check every choice against the pillars. → [`00-process/pillars`](00-process/pillars.md) ·
   [`00-process/core-loop`](00-process/core-loop.md) · [`60-mechanics/`](60-mechanics/) ·
   [`40-worldbuilding/`](40-worldbuilding/)
6. **HANDOFF.** Check the design against [`70-antipatterns/`](70-antipatterns/) for
   smells, convert it into the verification contract, and hand off to the proof
   playbook. → [`00-process/refine-and-handoff`](00-process/refine-and-handoff.md)

Stuck on conception? [`80-recipes/`](80-recipes/) shows the whole pipeline already
run on eight worked "X but Y" designs — read one for the *wiring*, not to reskin it.

Cross-cutting fun/polish concerns (feedback loops, risk-reward, mastery, pacing,
anti-frustration) apply at every stage → [`50-patterns/`](50-patterns/).

---

## Layout

| Path | What's in it | Reach for it when |
|---|---|---|
| [`FUN.md`](FUN.md) · [`JUICE.md`](JUICE.md) · [`JUDGE.md`](JUDGE.md) | The **craft playbooks** — design/verification, game-feel, the vision judge | Making the composed design fun, juicy, and beautiful — and proving it |
| [`00-process/`](00-process/) | The pipeline: intent→brief, pillars, loops, **the twist**, composition, handoff | Running a design end-to-end |
| [`10-anchors/`](10-anchors/) | Reference-game **DNA** — touchstones distilled to load-bearing structure | Naming what a game *is*; importing a solved loop |
| [`20-genres/`](20-genres/) | Deep **creative** genre templates (pillars, loops, essential systems, seeds, pitfalls) | You know the genre; you need its design skeleton |
| [`30-systems/`](30-systems/) | The modular **systems library** — progression, economy, combat, factions, AI, rewards… | Composing the parts a design needs |
| [`40-worldbuilding/`](40-worldbuilding/) | Theme / lore / faction / aesthetic **kits** | Giving the design a world and a look |
| [`50-patterns/`](50-patterns/) | Cross-cutting **fun & polish** design patterns | Any stage — these are always on |
| [`60-mechanics/`](60-mechanics/) | The **verb library** — the atomic things a player *does* (dash, parry, rewind, merge) | Deciding what the hands do; designing from the mechanic |
| [`70-antipatterns/`](70-antipatterns/) | Named **failure modes** — the mirror of patterns | Checking a design for smells before handoff |
| [`80-recipes/`](80-recipes/) | **Pre-composed designs** — worked "X but Y" compositions | Seeing the parts already assembled |
| [`INDEX.md`](INDEX.md) · [`index.json`](index.json) | The searchable index of every module (id · kind · tags · summary) | Looking something up by keyword |

> **Generate a starting point:** `node scripts/compose-design.mjs spark` samples an
> anchor + genre + verb + systems + a twist vector into a fresh brief to design
> from. `list` / `show` / `graph` search and walk the library from the terminal.

## Searching the Codex

Every module carries YAML frontmatter with `id`, `tags`, `use-when`, and
`composes-with`. To find pieces:

- **By keyword:** `grep -ri "asymmetr" design/` or search [`INDEX.md`](INDEX.md).
- **By tag:** `grep -rl "tags:.*economy" design/`.
- **By relationship:** follow `composes-with:` and inline `[[module-id]]` links.

IDs are stable and namespaced by kind: `process-*`, `anchor-*`, `genre-*`,
`system-*`, `world-*`, `pattern-*`. A link like `[[system-faction-asymmetry]]`
always resolves to `30-systems/faction-asymmetry.md`.

## The Codex and the playbooks

The Codex shelves hand off; they never duplicate. When a module needs to state
*how you prove the thing is fun/fair*, it **links** the matching entry in
[`FUN.md`](FUN.md) (mechanical truth + verify pattern), [`JUICE.md`](JUICE.md)
(feel gates), or [`docs/VERIFICATION.md`](../docs/VERIFICATION.md) rather than
restating it. Conceive on the shelves; make it feel good in the playbooks; prove
it in `docs/`. A design isn't done until it names its proofs —
[`00-process/refine-and-handoff`](00-process/refine-and-handoff.md) is the seam.
