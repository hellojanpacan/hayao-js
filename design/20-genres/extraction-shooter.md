---
id: genre-extraction-shooter
title: Extraction Shooter
kind: genre
tags: [risk-reward, loot, tension, pvpve, session]
summary: Go in with gear, grab loot, get out alive — the tension is the walk to the exit with everything to lose.
use-when: You want high-stakes risk/reward sessions where extracting IS the win.
composes-with: [pattern-risk-reward, system-loot-tables, system-session-structure, genre-survival-horror]
anchors: [anchor-spelunky]
verify-with: docs/VERIFICATION.md
---

**What it is.** You deploy into a hostile map carrying gear you own, fill your bag with loot, and race to an extraction point. Die and you lose everything you brought and found. The genre is Tarkov, Hunt: Showdown, DMZ, Dark and Darker.

**Player fantasy / why it's fun.** Every run is a bet you sized yourself. The greed of "one more room" fights the fear of "I have enough — leave now." The win isn't the kill; it's the exit door closing behind you with a full bag.

## Pillars (exactly 3)

1. **Risk you chose.** The player sets the stakes — what to bring, how deep to push, when to bail. Danger is opt-in, so loss is authored, not inflicted. See [[pattern-risk-reward]].
2. **Loot you can lose.** Gear is persistent and forfeitable. What's in your bag has weight because a death vaporizes it. No stakes without loss.
3. **The tense exit.** Extraction is a fixed, contested event with a timer or a walk. The last 90 seconds are the whole game — you had the loot; now you have to *keep* it. See [[pattern-pacing-and-tension]].

Drop any pillar and it degrades: no chosen risk → forced grind; no losable loot → a normal shooter; no tense exit → a looter with no climax.

## The loop stack

| Layer | Beat | What's at stake |
|---|---|---|
| **Moment** | Peek a corner, hear a footstep, decide to shoot or hide | This trade |
| **Encounter** | Fight or evade a threat guarding loot | This engagement's cost |
| **Session** | Deploy → loot → *commit to exit* → extract or die | This whole run's bag |
| **Meta** | Stash grows, gear tiers unlock, insurance/loadout economy | Your long-term war chest |

The commit-to-exit beat is the genre's signature: a discrete moment where the player stops accumulating and starts protecting. Design the map so that moment is legible and costly.

## Essential systems

- [[system-loot-tables]] — tiered, weighted drops with rarity that reads at a glance. The bag's contents must telegraph their own value so the exit decision has real inputs.
- [[system-economy]] — gear-at-stake is the core tension knob. Every item has an acquisition cost and a loss cost; the gap between them is the wager. See [[system-resource-loops]] for the stash → loadout → deploy cycle.
- [[system-session-structure]] — a run is a bounded, self-contained arc with a hard win/lose gate at extraction. Sessions must *end* cleanly, win or lose.
- [[system-spawn-directors]] — escalating danger over the run's clock: quiet start, loud middle, hunted exit. The director should make late-run maps more dangerous so lingering is punished.
- [[system-hazards-and-environment]] — the map itself pressures the player toward the door (shrinking safe zones, storms, timed lockdowns).
- [[system-map-and-navigation]] — extract points must be knowable, plural, and contestable. The route home is the decision space.
- [[system-inventory-and-ui]] — bag space is a design lever; forcing "what do I drop to fit this?" is core tension, not friction. See also [[system-crafting]] for stash-side gear prep.
- [[system-reward-schedules]] — variable, legible payoffs keep the greed engine running without becoming a slot machine. See [[system-difficulty-and-dda]] for tuning the risk/reward slope.

## Content & difficulty model

- **Procgen the danger, author the geography.** Keep maps hand-shaped and learnable (players memorize extract points and loot rooms); randomize spawns, loot rolls, and threat density on top. See [[system-procgen-design]].
- **Difficulty is self-selected, then escalated.** The player picks stakes via loadout richness and how deep they push; the director escalates pressure the longer they stay. Reward leaving; punish greed — but let the greedy sometimes win big.
- **PvPvE tunes the threat mix.** Human opponents supply unpredictability; AI supplies reliable pressure and pacing. Dial the ratio to taste — pure-PvE variants (below) lean hard on the director and hazards.
- **Meta-progression is a war chest, not a power ladder.** [[system-meta-progression]] should widen options (more gear to *risk*), not trivialize runs. Guard against [[system-progression]] that removes the loss stakes.

## Signature-mechanic seeds

1. **Extraction but PvE and the map is the predator (perspective).** No human enemies — the environment hunts. A roaming apex threat, a rising flood, a lights-out timer. The exit tension comes from the map closing in, not other players. Lean on [[system-hazards-and-environment]] and [[genre-survival-horror]]; think Hunt's boss-monster gravity without the other hunters.
2. **Extraction but you extract knowledge, not gear (theme).** Your "loot" is intel — a decoded clue, a witnessed event, a map fragment. Die and the knowledge is lost with the run; extract and it enters a persistent case-file the meta-game builds on. Marries this loop to [[genre-exploration]] and deduction; see [[anchor-return-of-the-obra-dinn]] and [[anchor-outer-wilds]] for knowledge-as-progress.
3. **Insurance as a stakes dial (economy).** Let players pre-pay to soften a loss. The premium *is* the risk price — buy peace and net less; go bare and net everything or nothing. Tunes [[system-economy]] without a fake-safety net.
4. **Shared bag, split at the door (co-op).** A squad's loot pools into one carriable stash; someone has to physically carry it out, making the carrier a target and the split a negotiation. See [[system-coop-and-competition]].
5. **The louder you loot, the harder they hunt.** Every valuable pickup raises your heat; the richest bag is also the most hunted. Greed and danger become the *same* variable, not two knobs. Ties [[system-loot-tables]] to [[system-spawn-directors]].

## Common pitfalls

- **Punishing loss so hard players stop taking risks** — the defining trap. If a death is unrecoverable, the risk-averse turtle at the entrance and the greed engine stalls. Seed a floor: free-ish base loadouts, cheap re-entry, secured item slots. See [[antipattern-fail-loop-tax]] and [[pattern-anti-frustration]].
- **[[antipattern-grind-wall]]** — gating gear behind hours of safe farming kills the "bet you sized yourself" fantasy. Let players buy into higher stakes directly.
- **[[antipattern-power-creep]]** — if late-game gear makes deaths painless, you've removed the stakes. Keep the loss *proportional* to what you brought.
- **[[antipattern-rng-frustration]]** — a death to an unseen, unfair source (spawn on top of you, one-tap you never heard) reads as robbery, not risk. Every loss must feel authored by the player. See [[pattern-fairness-and-trust]] and [[system-telegraphs]].
- **[[antipattern-boring-optimal]]** — if the dominant strategy is "run to the nearest exit, loot nothing," your loot tables aren't tempting enough or your exit isn't tense enough. The greed pull must beat the safe play.
- **[[antipattern-currency-spaghetti]]** — resist stacking five overlapping currencies onto the stash economy. One clear value axis makes the exit decision sharp.

## Anchors

- [[anchor-spelunky]] — the purest study in *chosen* risk: the ghost timer that hunts lingering greed, the "leave now or grab the idol" beat, permadeath that vaporizes a good run. Its exit-vs-greed tension is this genre's DNA at 2D scale.

## Verify

Design here; prove there. Take the loop to docs/VERIFICATION.md — assert that a run has a legible commit-to-exit moment, that loss is proportional and player-authored, and that the greed pull measurably beats the safe play.
