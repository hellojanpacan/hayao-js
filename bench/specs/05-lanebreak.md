slug: lanebreak

# Lanebreak — a three-lane defense

**Difficulty: 5/6.** Wave scheduling, an economy, counter relationships,
balance proofs.

## Brief

Creatures march down three horizontal lanes toward your hedge on the left.
You spend **sap** (income: +1 per second, plus bounties per kill) to plant
defenders at the front of a chosen lane (up/down selects lane; keys 1–3
plant):

- **Bramble** (cheap) — blocks and chips; strong vs Runners, shredded by
  Chargers.
- **Thornshooter** (mid) — ranged, hits the nearest creature in its lane;
  strong vs Chargers, overwhelmed by Runner packs.
- **Sapwell** (economy) — no combat; +1 extra sap per second while alive.

Enemies: **Runners** (fast, weak, come in packs) and **Chargers** (slow,
tanky, smash blockers). A creature reaching the hedge costs 1 of 5 hearts.
Survive a fixed, seeded 5-wave schedule to win; 0 hearts loses.

## Content

One 5-wave level with an authored difficulty ramp. Standard overlays,
restart. HUD (DOM): sap, hearts, wave counter.

## Definition of done

Everything in docs/CONVENTIONS.md "Definition of done", concretely at least:

1. `npm run check`, `npm test`, `npm run verify` all green.
2. All combat/economy/wave rules in a pure logic module (deterministic
   given seed + placement log); the scene tree renders it.
3. verify.ts proves a **scripted or bot-driven winning placement log**
   through all 5 waves, replayed through the real game.
4. **Null-strategy baseline:** planting nothing loses (hearts reach 0
   before wave 3 ends). A threat a null strategy survives isn't a threat.
5. **Counter-system duel proofs:** brambles-only dies to a Charger wave;
   thornshooters-only leaks a Runner pack; the mixed composition from the
   winning log survives both. Assert all three.
6. Determinism + snapshot checks pass; full-run golden hash pinned.
7. Two feel probes with tuned windows (e.g. hearts lost over time stays
   above a tension floor but never hits 0; sap is spent, not hoarded —
   average bank below a ceiling) + a filmstrip artifact.
8. Complete loop: title → play → win/lose → restart, keyboard only.
