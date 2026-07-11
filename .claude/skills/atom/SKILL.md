---
name: atom
description: Author and iterate ONE atom — a visual, scene, or audio component — inside a project's atoms/, visible in the Workshop from the moment it exists. Use at the start of an atom-first project (no game yet), or to add/iterate an atom in any project. When an atom starts radiating a game, hand off to design/00-process/the-seed.md.
---

# /atom — author one component until it's good alone

An atom is a project's authored component (`defineAtom` in `atoms/<name>.ts`):
a sprite/rig catalog (`visual`), a mood/tableau (`scene`), or a set of cues
(`audio`). It compiles to a miniature world, so knobs, HMR, and session
recording ride along free. The Workshop shows a tab per kind — a tab exists
only when its content does. Doctrine: `docs/CONVENTIONS.md` → *project
anatomy*; `docs/WORKSHOP.md` → *the tabs*.

## The loop

1. **Place it.** `atoms/<name>.ts` exporting `defineAtom({ kind, title, build |
   cues, tuning? })` — everything rendered is `cosmetic`, knobs via the same
   `tuning` system as games, imports from `@hayao` only. Register it in the
   project's `runProject({ atoms: [...] })` list. If the project lacks a
   `TIMELINE.md`, write one (Original entry may just say what you're trying).
2. **Log as you go.** The file's HEADER COMMENT is the iteration log — one line
   per meaningful version, what changed and why. Update the Timeline's
   `## Present` (what you're iterating, what feedback you await).
3. **Iterate against the kind's gate**, not the game contract:
   - *visual / scene* → headless SVG + the vision judge (`/judge` applies, on
     the atom's page `?atom=<id>`); duotone/palette discipline.
   - *audio* → the audio lint + quality scores (`src/audio/lint.ts`,
     `quality.ts`) in a small vitest; soft-synthesis house rules.
   - *all* → `npm run check`, `npm run invariants`, deterministic knobs.
4. **Human pass.** The Workshop tab is the review surface: knobs, annotate,
   accept — same loops as `/workshop`. Ask the human to look/listen there.
5. **Name what it radiates.** Fill `radiates:` — the fantasy/verb/tension the
   atom suggests. If after honest iteration it radiates *nothing*: archive
   (delete the file, append a dated note to the Timeline). A dead seed costs a
   day; tending it costs the project.
6. **Hand off when it sings.** An atom that radiates a game goes to
   `design/00-process/the-seed.md` (spine backwards → Original Concept into the
   Timeline → loop assembly). An atom that turns out engine-general graduates
   the card-kit path instead: sandbox → `src/` → `@hayao`.

## Guardrails

- **Before loop assembly, atoms outrank concepts** — pivoting the concept to
  follow a better atom costs a paragraph in the Timeline. After `game.ts`
  exists, the spine outranks atoms; park new darlings in `## Future`.
- Never `game.ts` scaffolding "while we're here" — that's the seed module's
  call, made only when a spine holds.
- The Workshop beholds; it does not edit. All authoring happens in code.
