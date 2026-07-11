---
description: Author a hayao house-style sprite/icon — Solar Bold Duotone recut in Regalia, as code (procedural draw ops or SVG paths), never a binary asset.
argument-hint: <subject, e.g. "a key", "small dragon, Meadow">
---

Author a hayao duotone sprite: $ARGUMENTS

The house recipe (full guide: `docs/STYLE.md` in the engine repo; the engine
ships palette + duotone helpers on its public surface — inspect
`docs/API.md` / the installed `.d.ts` for exact names before importing):

1. **One hue, two opacities.** Pick ONE palette colour for the subject's job —
   Regalia Gold `#e59500` (marks, joy, magic), Ink Navy `#29335c` (structure,
   night), Meadow `#337357` (nature, success), Dusk Blue `#669bbc` (sky,
   water, tech); Rose `#c65b5b` only for hearts/health/damage, Bark `#7a4f34`
   only for wood/earth.
2. **Mass at 32%, focal detail at 100%.** Big silhouette light, the one detail
   the eye should land on at full strength.
3. **Bold & rounded, no outlines, no gradients, no drop-shadows, no third
   colour.** Solid fills, generous radii — must survive 16px.
4. **Friendly geometry**, air around the subject.
5. **Author on a 24×24 grid**, pure vector.

Deliver it as code (the engine's duotone/shape helpers, or a raw SVG path
pair), render it headlessly to check the silhouette reads, and show the
result. Never emit or request a raster/binary asset.
