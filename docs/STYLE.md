# STYLE.md — the Hayao visual house style

The look is **Solar Bold Duotone, recut in the Regalia palette**: one hue at two
opacities, bold rounded masses, no outlines. It is a *default, not a wall* — see
`docs/ASSETS.md` for how to leave it entirely and lose nothing structural. This
doc is the promise made reproducible: hand it to a person or an agent and they
draw in-house **without seeing the corpus**. `docs/AUDIO.md` is the same promise
for sound.

The palette and the duotone helpers ship as code on the `@hayao` surface
(`art/palette`, `art/duotone`, `art/shapes`, `art/hero`) — grep `docs/API.md`
for the exact names. This doc is the *authoring* guide that sits on top of them.

## The palette — a core of four, grown by the job

Every shape is a single hue shown at two opacities: the mass at **32%**, the
focal detail at **100%**. That pairing is the whole trick.

| Role | Name | Hex | Owns |
|---|---|---|---|
| Primary | Regalia Gold | `#e59500` | marks, CTAs, joy, coins, magic |
| Structure | Ink Navy | `#29335c` | rules, type, line, night |
| Growth | Meadow | `#337357` | nature, success, foliage |
| Calm | Dusk Blue | `#669bbc` | sky, water, tech, shields |

Grow the palette **by the job, not the mood**. A new hue earns its place only by
owning one specific thing, and it stays out of the core UI chrome, which the four
above keep to themselves.

| Job | Name | Hex | Owns |
|---|---|---|---|
| Vitality | Rose | `#c65b5b` | hearts, health, damage — nothing else reads right in gold or green |
| Material | Bark | `#7a4f34` | wood & earth — trunks, crates, soil, roots |

## Draw anything in five rules

1. **One hue, two opacities.** Pick a single palette colour. Everything in the
   graphic is that colour — the difference is 100% vs 32% opacity. Never mix two
   hues inside one icon (the crown's navy rule is the one sanctioned exception).
2. **Mass at 32%, focal at 100%.** The big silhouette is the light layer. The one
   detail you want the eye to land on — a face, a keyhole, a star point — sits on
   top at full strength.
3. **Bold & rounded, no outlines.** Solid fills only. Generous corner radii,
   thick limbs, no hairline strokes. If it survives being shrunk to a 16px
   favicon, it's bold enough.
4. **Friendly geometry.** Circles over corners, smiles over frowns, a little
   bounce in the proportions. Comic-clean, never sharp or corporate. Leave air
   around the subject.
5. **24-grid, then scale.** Author on a 24×24 grid so weight stays consistent
   across the set. Keep it vector — one path family reads crisp from sprite to
   billboard.

**DON'T break the spell.** No gradients, no drop-shadows inside the art, no
three-plus colours per shape, no thin outlines, no photographic texture. The
charm is in the restraint.

## The pattern, in code

Every icon is authored on a `0 0 24 24` viewBox as **exactly two fills of one
hue**: the `duo-mass` element at 32% opacity, the focal detail(s) at 100%. In
the engine you get this for free with the duotone helpers; the raw SVG shows the
shape of the idea.

```html
<!-- Coin (Regalia Gold): a big disc, a bright star on top -->
<svg viewBox="0 0 24 24" fill="var(--orange)">
  <circle opacity=".32" cx="12" cy="12" r="9"/>
  <path d="M12 7.2l1.42 3.03 3.33.38-2.47 2.25.66 3.28L12 14.6l-2.94 1.62.66-3.28-2.47-2.25 3.33-.38z"/>
</svg>

<!-- Heart (Rose): the mass, then a single soft highlight -->
<svg viewBox="0 0 24 24" fill="var(--rose)">
  <path opacity=".32" d="M12 20.7l-1.1-1C6.14 15.28 3 12.42 3 8.9 3 6.2 5.1 4.1 7.8 4.1c1.54 0 3.02.72 3.98 1.87A5.2 5.2 0 0 1 16.2 4.1C18.9 4.1 21 6.2 21 8.9c0 3.52-3.14 6.38-7.9 10.8z"/>
  <path d="M8.7 7c-1.05 0-1.98.68-2.3 1.7a.8.8 0 0 0 1.52.48c.12-.4.42-.66.78-.66a.8.8 0 0 0 0-1.52z"/>
</svg>

<!-- Key (Regalia Gold): bow-ring mass, then teeth + a bright centre -->
<svg viewBox="0 0 24 24" fill="var(--orange)">
  <circle opacity=".32" cx="12" cy="7" r="4.6"/>
  <rect x="10.9" y="10.6" width="2.2" height="9.9" rx="1.1"/>
  <rect x="12.9" y="14.8" width="3" height="2" rx="1"/>
  <rect x="12.9" y="17.8" width="2.4" height="2" rx="1"/>
  <circle cx="12" cy="7" r="1.7"/>
</svg>

<!-- Star (Regalia Gold): the five-point mass, a smaller star inside -->
<svg viewBox="0 0 24 24" fill="var(--orange)">
  <path opacity=".32" d="M12 2.6c.5 0 .9.3 1.13.75l2.36 4.78 5.28.77c1 .15 1.4 1.38.68 2.08l-3.82 3.72.9 5.26c.17 1-.88 1.76-1.78 1.29L12 18.9l-4.72 2.48c-.9.47-1.95-.3-1.78-1.29l.9-5.26-3.82-3.72c-.72-.7-.32-1.93.68-2.08l5.28-.77 2.36-4.78c.23-.45.63-.75 1.13-.75Z"/>
  <path d="M12 8.5l1.1 2.4 2.4 1.1-2.4 1.1L12 15.5l-1.1-2.4L8.5 12l2.4-1.1z"/>
</svg>
```

Bigger illustrations are the same recipe scaled up: **stacked duotone masses**,
layered light-to-dark, flat and rounded — a sun disc behind a brighter sun, hills
as two overlapping green waves, a chest as a rounded box with a bright lock. No
gradients, no outlines; depth comes from stacking opacities, not shading.

## The mark

The Hayao crown is the brand's one **sanctioned two-hue** shape: a Regalia-Gold
crown carrying an Ink-Navy rule (the base bar). Everywhere else, hold the line —
one hue per shape.

```html
<!-- Regalia crown — the only place two hues share one icon -->
<svg viewBox="2 2 20 20">
  <path fill="var(--orange)" d="m21.8382 11.1263 -0.2292 2.4353c-0.3777 4.0126 -0.5665 6.0189 -1.7491 7.2286C18.6773 22 16.9048 22 13.3599 22h-2.7198c-3.54493 0 -5.31739 0 -6.50001 -1.2098 -1.18261 -1.2097 -1.37144 -3.216 -1.74909 -7.2286l-0.22919 -2.4353c-0.18001 -1.9126 -0.27001 -2.86891 0.05718 -3.26423 0.17699 -0.21384 0.41767 -0.34487 0.675 -0.36747 0.47569 -0.04178 1.07309 0.6383 2.26788 1.99847 0.6179 0.70343 0.92685 1.05513 1.2715 1.10963 0.19097 0.0301 0.38555 -0.0009 0.56189 -0.0896 0.31825 -0.1602 0.53044 -0.59498 0.95481 -1.46458l2.23683 -4.58366C10.9888 2.82162 11.3898 2 12 2c0.6102 0 1.0112 0.82162 1.8131 2.46485l2.2368 4.58366c0.4244 0.86961 0.6366 1.30439 0.9548 1.46459 0.1764 0.0887 0.371 0.1197 0.5619 0.0896 0.3447 -0.0545 0.6536 -0.4062 1.2715 -1.10963 1.1948 -1.36017 1.7922 -2.04025 2.2679 -1.99847 0.2573 0.0226 0.498 0.15363 0.675 0.36747 0.3272 0.39532 0.2372 1.35163 0.0572 3.26423Z"/>
  <path fill="var(--navy)" d="M8.25 18c0 -0.4142 0.33579 -0.75 0.75 -0.75h6c0.4142 0 0.75 0.3358 0.75 0.75s-0.3358 0.75 -0.75 0.75H9c-0.41421 0 -0.75 -0.3358 -0.75 -0.75Z"/>
</svg>
```

The canonical wordmark lockup is `web/src/components/logo.ts` (the wordmark is
outlined vector, no font dependency). Attribution for the Solar Bold Duotone
origin lives in `web/CREDITS.md`.
