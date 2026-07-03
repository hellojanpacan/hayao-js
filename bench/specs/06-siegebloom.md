slug: siegebloom

# Siegebloom — a small tower-offense

**Difficulty: 6/6 (hardest).** You are the horde: path following, unit
economy, static defenses, and a skill-delta proof that tactics beat spam.

## Brief

The inverse of tower defense. A winding path (hand-authored, at least two
bends) leads from your **nest** to the enemy **keep**. Three towers sit at
fixed spots along the path, each with a circular range. You spend **spores**
(steady income) to release units from the nest; they walk the path
automatically:

- **Scurrier** (cheap, fast, fragile) — good at slipping through after
  tower fire is wasted on tougher units.
- **Shellback** (slow, tanky) — soaks tower shots; deals no damage but
  shields what walks behind it.
- **Gnawer** (mid) — the only unit that damages the keep AND can chew down
  a tower if it survives long enough in range.

Towers have finite fire rate and always target the **frontmost unit in
range** — so composition and release timing are the whole game. Destroying
the keep (bring its HP to 0) wins; running out of spores with nothing alive
and the keep standing loses.

## Content

One authored map, one keep, three towers. Standard overlays, restart. HUD
(DOM): spores, keep HP, unit counts.

## Definition of done

Everything in docs/CONVENTIONS.md "Definition of done", concretely at least:

1. `npm run check`, `npm test`, `npm run verify` all green.
2. Path/towers/units/economy in a pure logic module, deterministic given
   seed + release log; the scene tree renders it.
3. verify.ts proves a **winning release log** (scripted or found by a
   simple search/bot over the pure sim), replayed through the real game.
4. **Skill-delta proof:** a tactical strategy (e.g. shellback-first convoys
   timed between tower cooldowns) destroys the keep, while both null
   strategies fail or do meaningfully worse: (a) spam-cheapest-on-cooldown,
   (b) uniform random affordable releases with the run's seed. Assert the
   delta numerically.
5. **Tower-targeting truth:** a unit test that a tower always hits the
   frontmost in-range unit, and that a Shellback in front measurably
   extends the units behind it (survival frames with vs without escort).
6. Determinism + snapshot checks pass; full-run golden hash pinned.
7. Two feel probes with tuned windows (e.g. time-to-first-keep-damage;
   no dead air — longest lull between meaningful events under a ceiling)
   + a filmstrip artifact.
8. Complete loop: title → play → win/lose → restart, keyboard only.
