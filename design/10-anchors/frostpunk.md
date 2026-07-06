---
id: anchor-frostpunk
title: Frostpunk
kind: anchor
tags: [society-survival, moral-management, city-builder, tension]
summary: A survival city-builder where every efficient choice has a human cost — you manage a society, not just a grid.
use-when: You want management with moral weight — survival vs. what you become to survive.
composes-with: [genre-management-tycoon, genre-city-builder, pattern-risk-reward]
anchors: [anchor-frostpunk]
verify-with: docs/FUN.md#17-·-city-builder
---

**What it is.** A city-builder wrapped around a dying generator: you keep a frozen society alive by rationing heat, food, and hope, and you pass **laws** that buy survival at the price of what the city becomes. The map is a resource puzzle; the law book is a moral one.

**Player fantasy / why it's fun.** You are the one adult in a freezing room full of children, and every warm answer costs something. The pull is the **vise** — the storm forces a decision, the decision forces a law, the law forces you to look at who you've become. You don't win the map; you survive it and then live with the ledger.

## Design DNA

- **Two coupled resource loops.** A physical loop (heat/coal/food/materials) and a social loop (hope/discontent). The physical loop kills you fast; the social loop kills you slow and is the one you actually optimize against. See [[system-resource-loops]], [[system-economy]].
- **The law book is the real game.** Laws are irreversible one-way branches on a small tree. Each is framed as relief but reads as a step down a road — Order or Faith, comfort or control. This is the humanity-for-efficiency trade made mechanical.
- **Escalating scripted crises over a survival baseline.** Cold snaps, refugee waves, and sickness ratchet the floor upward on a fixed clock, so yesterday's stable city is today's failing one. Pacing is authored, not emergent. See [[pattern-escalation-and-payoff]], [[system-weather-and-time]].
- **Every optimization is a moral choice.** The efficient answer — child labor, sawdust in the soup, a snow pit for the dead — is always available and always visible. Efficiency and cruelty are the same button. This is the whole engine.

## Load-bearing structures

| Structure | Why it works |
| --- | --- |
| **Coupled physical + social meters** | You can't spend hope like coal, so the two loops demand different play; the tension lives in the gap between them. [[system-resource-loops]] |
| **One-way law tree** | Irreversible choices make the metagame a record of *you*, not a build to reroll. Removes take-backs, so every node is a [[pattern-meaningful-choice]]. [[system-tech-tree]] |
| **The ramping storm clock** | A fixed escalation curve means the map is never "solved" — stability is temporary by construction. [[pattern-pacing-and-tension]], [[system-difficulty-and-dda]] |
| **Efficiency = cruelty overlap** | The cheapest path is the ugliest one, so optimizing *is* the moral test. Defeats [[antipattern-boring-optimal]] by making the optimal line cost you something real. [[pattern-risk-reward]] |
| **Hope/discontent as fail states** | Two soft-fail bars (abandonment, overthrow) sit under the hard-fail (freezing), so you lose to your people before you lose to the cold. [[system-progression]] |
| **The final judgment beat** | An end card asks "was it worth it?" and names the lines you crossed. The payoff is reflection, not a score. [[pattern-escalation-and-payoff]], [[world-narrative-delivery]] |

## What to steal

- **The one-way law book.** A short tree of framed-as-relief, irreversible policies where each choice narrows who you are. Portable to any management or [[genre-narrative-decisions]] game. Compare [[anchor-reigns]]'s two-card version and [[anchor-papers-please]]'s creeping-rule pressure.
- **Two loops that don't convert.** Give the player a fast material loop and a slow social loop that can't be traded for each other. The friction between them is the game.
- **Efficiency-as-cruelty.** Make the cost-optimal action the morally expensive one, surfaced plainly. The tension is free once the numbers and the ethics point the same way.
- **The authored ramp.** A visible, escalating clock (a storm, a debt, a countdown) so "stable" is always provisional. See [[pattern-pacing-and-tension]].
- **The ledger at the end.** Close by showing the player what their choices summed to. Turns a management run into a story with a [[world-narrative-delivery]] payoff.

## What's just theme (drop it)

- **Steampunk / Victorian frost.** The generator, top hats, and snow are skin. The vise works in a spaceship, a drought, a plague ward, or a sinking city.
- **The literal cold.** "Heat" is any resource whose absence is death on a timer. Swap it for oxygen, water, sanity, or signal.
- **Grimdark tone.** The moral weight comes from the *irreversible choice*, not from misery. A warm, hopeful reskin can keep the vise (see the abundance twist below).
- **The specific laws.** Child labor and sawdust rations are content, not mechanic. The mechanic is: relief now, identity cost forever.
- **Faith vs. Order.** A fine pair of end-game paths, but the load-bearing part is that they're *mutually exclusive and irreversible*, not the specific ideologies.

## Composes into

- [[genre-management-tycoon]] — the natural home; adds moral weight to spreadsheet play.
- [[genre-city-builder]] — grafts a survival clock and a conscience onto placement puzzles. Contrast the peaceful sprawl of [[genre-farming-sim]] or [[anchor-stardew-valley]].
- [[genre-narrative-decisions]] — the law book *is* a branching decision engine; pairs with [[system-dialogue-and-branching]].
- [[genre-sandbox-survival]] — share the resource-death-clock; Frostpunk adds a society on top of the individual. See [[anchor-rimworld]] for the emergent-colony cousin.
- Feeds [[system-difficulty-and-dda]], [[system-resource-loops]], [[system-tech-tree]], and [[pattern-risk-reward]] as a worked example.

## Twist seams

- **Frostpunk but you are one citizen, not the state (perspective).** Same laws, same storm — but you live *under* the decisions, not making them. Rules arrive as constraints; survival is about slipping through the cracks the state left. Turns management into [[genre-immersive-sim]] or [[anchor-papers-please]]-style compliance-and-resistance.
- **Society-survival but the crisis is abundance, not scarcity (tonal).** The generator never fails — instead resources overflow and the threat is idleness, sprawl, complacency, meaning-collapse. Laws now ration *purpose* instead of heat; discontent rises from having nothing to strive for. Keeps the vise, inverts the mood.
- **Frostpunk but every law is reversible at a rising cost (systemic).** Break irreversibility on purpose — you *can* repeal, but each reversal spends hope and history. Explores whether the horror was the choice or the finality.
- **Frostpunk but the storm is another player (competitive).** The escalating crisis is a second human tuning your disasters, turning the authored ramp into an asymmetric [[system-faction-asymmetry]] duel. See [[system-coop-and-competition]].

## See also

- [[anchor-reigns]] — the law book stripped to two swipes; irreversible framing at minimum scale.
- [[anchor-papers-please]] — bureaucratic complicity; rules-as-pressure from the small end.
- [[anchor-rimworld]] — emergent colony survival where story comes from systems, not scripted crises.
- [[anchor-civilization]] — long-horizon management without the moral vise, for contrast.
- [[recipe-swipe-kingdom]] — a buildable that carries the one-way-choice DNA.
- [[process-the-twist]] · [[pattern-meaningful-choice]] · [[pattern-pacing-and-tension]] — the tools this anchor leans on hardest.
