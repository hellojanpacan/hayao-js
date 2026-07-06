---
id: kind-slug                       # STABLE. namespaced: process-* anchor-* genre-* system-* world-* pattern-*
title: Human Readable Title
kind: process | anchor | genre | system | worldbuilding | pattern
tags: [lowercase, search, keywords] # 4–10; the words an agent would grep for
summary: One sentence, <140 chars — this is what appears in INDEX.md and index.json.
use-when: One line — the situation in which an agent should reach for this module.
composes-with: [other-id, other-id] # sibling modules that pair with this one (use real ids)
anchors: [anchor-id, anchor-id]     # reference games this draws on (omit for process/pattern if N/A)
verify-with: docs/FUN.md#... | docs/JUICE.md#... | docs/VERIFICATION.md#... | none
---

# {Title}

<!--
AUTHORING CONTRACT — delete these comments in real files.

VOICE: the house voice of docs/FUN.md — terse, imperative, second-person,
proof-aware. Every claim earns its place. No filler, no "in the world of game
design…" throat-clearing. Bold the load-bearing noun of a sentence, not whole
sentences.

LENGTH: 120–260 lines. Comprehensive but scannable. Prefer tables and tight
bullets over paragraphs. One screen should orient a reader.

GROUNDING:
- Never invent a Hayao API. If you cite one, it must exist in docs/API.md.
  Prefer POINTING to the sandbox/example/doc that already wires it over pasting
  code. Grep before you cite.
- Never restate FUN.md's mechanical-truth/verify content — LINK it via verify-with
  and inline. Design here, prove there.
- Cross-link liberally with [[module-id]] (renders as text; the id resolves via
  INDEX.md). A [[id]] that isn't written yet is fine — it marks intent.
- Cite real reference games by name where it sharpens a point. Be concrete
  ("Slay the Spire's card-reward-of-3 with a skip") not vague ("some games").
-->

**What it is.** 1–3 sentences. The design concept in its most compressed form.

**Player fantasy / why it's fun.** What the player *feels*. The pull.

## Body — structure by `kind`

Pick the skeleton for this module's kind (see design/CONTRIBUTING.md for the full
spec). In brief:

- **anchor** → Design DNA · The load-bearing structures · What to steal · What's
  theme (drop it) · Composes into.
- **genre** → Pillars (3) · The loop stack · Essential systems (link `system-*`) ·
  Content & difficulty model · Signature-mechanic seeds · Common pitfalls ·
  Anchors · Verify (link FUN.md).
- **system** → What it is · When to use / when NOT · Variants · Tuning levers ·
  How it wires to Hayao · Fails when… · Verify.
- **process** → The step · Inputs → outputs · How to run it · Worked example ·
  Traps.
- **worldbuilding** → The kit · Vectors / options · Method · Hayao/aesthetic hook
  (Kentō palette) · Traps.
- **pattern** → The principle · Why it works · Levers · Applied across genres ·
  Overdone when… · Verify/feel-gate link.

## Composes with

Bulleted `[[links]]` to the modules that most naturally combine with this one,
each with a half-line on *why*.

## See also

Links into `docs/` (FUN, JUICE, JUDGE, CONVENTIONS) and any `sandboxes/` or
`examples/` that demonstrate the wiring.
