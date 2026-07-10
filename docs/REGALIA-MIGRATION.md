# Regalia Migration — one canonical design + sound system

**Status:** proposed plan, not yet executed. Written 2026-07-10.

**Goal.** Make **Regalia** the single, canonical, still-growing design system for
Hayao — color, type, UI, motion, **and sound**. Fully remove **Kentō / Woodblock**
as a palette, font, UI chrome, and brand identity. Archive the entire existing
game corpus (it was good prototyping) and rebuild from a shared, high-polish game
kit before shipping the three games the website already promises: a **2D
platformer**, a **tiny RTS**, and a **mobile puzzle**.

Decisions locked (2026-07-10):
- **Archive** = git tag `corpus-v0` (fully recoverable) then `git rm` from main.
- **Branding** = full identity rebrand off the kentō woodblock mark onto Regalia
  in this migration (not a follow-up).
- This document is the reviewable plan; execution follows once approved.

---

## 0. North star & naming

**Regalia is the umbrella**, not just a palette. It spans:

| Pillar    | Lives in                                  | Today |
|-----------|-------------------------------------------|-------|
| Color     | `src/art/palette.ts` (`REGALIA*`)         | ✅ default already |
| Duotone art | `src/art/duotone.ts` (`REGALIA_SCHEMES`) | ✅ default already |
| Type      | `web/src/styles/global.css` (Overpass/Poppins) | ✅ |
| UI / nav  | `src/ui/` + `web/.../SiteNav.tsx`         | ✅ Regalia-defaulted |
| Motion    | `src/anim/`                               | — needs Regalia motion tokens |
| **Sound** | `src/audio/` (currently anonymous)        | ⛔ unbranded — becomes "Regalia's sound layer" |

**Audio naming resolution.** The audio engine is currently anonymous. It does
**not** get a separate brand that collides with the palette — it becomes *the
sound pillar of Regalia*. Public framing: "Regalia — color, type, UI, motion, and
sound." Internally we keep `src/audio/` module names; we add a single Regalia
sound **doctrine + lint gate** (soft synthesis: sine/triangle/noise, six voices ↔
six Regalia jobs, pentatonic, deterministic).

**How we *assure* compliance (the core of the ask):** conventions don't hold —
gates do. Every rule below fails `npm run check`, not a code review.

---

## 1. Phase 0 — pre-flight (recoverable safety net)

1. Green baseline: `npm run check && npm test && npm run verify`.
2. Tag the corpus so nothing is ever lost:
   `git tag corpus-v0 -m "Full prototype corpus (34 games + 11 sandboxes) before Regalia reset"`
   and `git push origin corpus-v0`.
3. Snapshot the archived list into `docs/ARCHIVE.md` (name, genre, one line) so the
   corpus stays discoverable in prose even after removal.

---

## 2. Phase 1 — archive the corpus (do this BEFORE the palette purge)

**Why first:** the 34 games + 11 sandboxes are the *bulk* of the KENTO consumers.
Removing them collapses the later purge from ~50 files to ~6.

- `git rm -r examples/*` (all 34) and `git rm -r sandboxes/*` (all 11), **keeping**:
  - `examples/sokoban/` — the logic/view-split reference (CLAUDE.md invariant 3).
    Re-theme it to Regalia in Phase 2 as the one living convention reference.
  - The `examples/embed.html` shell if the new games reuse it.
- Keep 1–2 sandboxes that are *pure mechanic labs* still needed as build
  references (e.g. `synth-lab` for audio, `physics-lab`) — re-theme, don't archive,
  or re-create clean. Decide per-lab; default is archive.
- Update the discovery/registry surfaces so nothing dangles:
  - `src/studio/mcpServer.ts` `discoverGames()` — will now find only the kept refs.
  - `play/index.html`, `roadmap/index.html` — rewrite to "coming: platformer / RTS
    / puzzle" instead of listing archived games.
- Gate: `npm run check` stays green with the reduced set.

---

## 3. Phase 2 — purge Kentō from the engine

Now tiny, because the games are gone.

- `src/art/palette.ts`: delete `KENTO` (12–42), `MEADOW` (95–109), `DUSK`
  (111–125), `PAPER` (127–140), registry entries (177–184), and the Kentō header
  doc (1–7). Keep `REGALIA` / `REGALIA_DAY` / `REGALIA_NIGHT` / `DEFAULT_PALETTE`.
  Fix the `Palette.swatches` union (line 92) to `typeof REGALIA`.
- `src/index.ts:74` re-export stays (barrel), just no longer surfaces KENTO.
- Re-theme the 3 remaining engine consumers to Regalia hues:
  `src/art/duotone.ts`, `src/art/hero.ts`, `src/scene/light.ts`.
- Re-theme the kept `examples/sokoban/` reference.

---

## 4. Phase 3 — the gate becomes a Regalia gate (assurance)

- Rewrite `scripts/palette-audit.ts`: drop `KENTO, MEADOW, DUSK` imports; audit
  `REGALIA_DAY` + `REGALIA_NIGHT` only; update messages. Keep the AA/2.4 thresholds.
- **New: Regalia-only color lint** (`scripts/regalia-lint.ts`, wired into
  `npm run check`). Fails if any `#rrggbb`/`rgb()` literal appears in `examples/`,
  `sandboxes/`, `web/src/`, or `src/` outside `palette.ts` — colors must resolve to
  a `REGALIA` token or a `--color-*`/`--hy-*` variable. **This is the missing
  enforcement that makes Regalia actually canonical.**
- Update `src/art/palette.test.ts` to the surviving symbols.

---

## 5. Phase 4 — one token vocabulary (kill the drift)

Today the engine calls hues `gold`/`green`/`blue`/`ink`; the website `@theme`
calls the *same hex* `orange`/`green`/`blue`/`navy`. Two vocabularies for one
palette = guaranteed drift.

- Pick one canonical set of hue names (recommend the engine's `gold`/`green`/
  `blue`/`ink` + `rose`/`bark`) and rename the website `@theme` tokens
  (`web/src/styles/global.css:34-53`) to match. Update Tailwind utility usage
  across `web/src/`.
- Document the one vocabulary in `docs/API.md` and `design/`.

---

## 6. Phase 5 — brand the sound pillar

- Add a Regalia sound doctrine doc (`design/60-audio/regalia-sound.md` or fold into
  existing `soundscape.md`): soft synthesis, six voices ↔ six Regalia jobs,
  pentatonic, deterministic via `world.rng`.
- Promote `src/audio/lint.ts` to a **hard gate** in `npm run check` (soft-synthesis
  rules: allowed waveforms, deterministic seeds, no `Math.random`/`Date.now`).
- Header-comment `src/audio/audio.ts` etc. as "Regalia sound layer" for a single
  named identity without new API churn.

---

## 7. Phase 6 — full identity rebrand (off woodblock)

Per decision, this pass rewrites the marketing/identity surfaces. Memory
`product-thesis-game-pane` already records that woodblock branding is superseded.

- `branding/index.html`, `branding/d-applications.html` — replace the 見当/kentō
  mark + copy with the Regalia crown mark and Bold-Duotone identity.
- `README.md:6`, root `index.html:204,244` — drop "house woodblock style".
- `web/src/styles/global.css:73-75` — remove the "kentō-style lattice" background.
- `studio/studio.css:1` — retitle the "kentō woodblock chrome".
- `play/index.html`, `roadmap/index.html` — woodblock copy → Regalia.
- `design/` doctrine — retire/rewrite the woodblock-centric docs:
  `40-worldbuilding/aesthetic-direction.md`, `naming-and-tone.md`, `JUDGE.md`
  (the "Kentō AA guarantee" gate), `INDEX.md`, plus the ~25 single-mention docs and
  `design/index.json` search entries.
- `.claude/skills/judge/SKILL.md:40` — "house woodblock palette (KENTO)" → Regalia.
- `bin/create-hayao.mjs` — scaffold seeds Regalia only (drop the 8 KENTO refs).

---

## 8. Phase 7 — the shared game kit, THEN the three games

Per your sequencing: build consistent components + art + sound + animation
*before* the games, so all three ship at flagship polish and read as one family.

1. **Regalia game kit** (`src/kit/` or extend `src/ui/` + `src/art/`): shared HUD,
   menus, transitions, hit/juice feedback, a duotone sprite/tile vocabulary, a
   motion-token set, and a Regalia sound bank (SFX + adaptive music beds).
2. **Art style bible** for the three genres — a locked duotone asset language so a
   platformer, an RTS, and a puzzle visibly share Regalia.
3. Then build, in order, each to the flagship bar (`/judge` + `npm run verify`):
   - `examples/` **2D platformer** → wires `/play/platformer` (`SiteNav.tsx:42`).
   - `examples/` **tiny RTS** → wires `/play/rts` (`SiteNav.tsx:43`).
   - `examples/` **mobile puzzle** → wires `/play/puzzle` (`SiteNav.tsx:44`).
4. Only then re-point the website's promised routes to real, playable pages.

---

## 9. Gate summary — what "assured" means after this

`npm run check` must fail on any of:
- a color literal outside `palette.ts` (Regalia-only lint, Phase 3),
- a contrast miss on `REGALIA_DAY`/`NIGHT` (palette audit, Phase 3),
- an audio spec that breaks soft-synthesis rules (audio lint, Phase 5),
- a non-Regalia token vocabulary in `web/` (Phase 4),
- (existing) determinism, `world.hash()`, solver-proof, cosmetic invariants.

---

## 10. Memory updates to make on completion

- Update `kento-palette.md` → superseded; Regalia is the sole prototype palette.
- Update `art-direction.md`, `branding-direction.md` → Regalia identity, woodblock retired.
- Update `littlejs-parity.md` / `audio-direction-soft-synthesis.md` → "Regalia sound layer" named + gated.
- New memory: the corpus is archived at tag `corpus-v0`; the three flagship genres are the living examples.
