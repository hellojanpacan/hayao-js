---
id: system-dialogue-and-branching
title: Dialogue & Branching
kind: system
tags: [narrative, choice, conversation, state, trees]
summary: The structure of talking and choosing — trees, gates, and state that remembers, so choices feel weighted, not cosmetic.
use-when: You need conversation, choices, or branching narrative with real consequence.
composes-with: [genre-visual-novel, anchor-disco-elysium, pattern-meaningful-choice]
anchors: [anchor-disco-elysium]
verify-with: design/FUN.md#21-·-narrative-decisions
---

**What it is.** A **graph** of authored lines the player walks by choosing edges, gated by state and stamped back into state. Talking is the verb; branching is where the verb has stakes.

**Player fantasy / why it's fun.** *This world listened.* The pull is authorship of self — a line you picked, a bridge you burned, a truth the NPC now knows about you. Choice is only fun when the world **remembers** it made a difference.

## When to use / when NOT

- **Use** when the player's relationship to characters or facts is the content — [[genre-visual-novel]], [[genre-narrative-decisions]], [[genre-immersive-sim]], any RPG conversation.
- **Use** to expose [[world-worldbuilding-scaffold]] and voice — dialogue is how [[world-narrative-delivery]] reaches the player at speaking distance.
- **NOT** for exposition you could bake into the level — see [[world-level-as-story]]. A locked door teaches faster than an NPC explaining the door.
- **NOT** if every branch reconverges to the same next scene with no state written. That is [[antipattern-fake-choice]] wearing a menu.
- **NOT** as your only choice channel in an action game — dialogue trees stall pacing; keep them out of the [[process-core-loop]].

## Variants

| Variant | Structure | Choice weight | Reference |
|---|---|---|---|
| **Branch-and-bottleneck** | Branches fan out, then reconverge at authored bottlenecks | Local flavor + remembered flags; spine stays fixed | most narrative RPGs, [[anchor-papers-please]] framing |
| **Stat / skill check** | Options exist only if your build clears a threshold; roll or auto-pass | Your sheet is the key; failure is content, not a wall | [[anchor-disco-elysium]] |
| **Reactive state flags** | Lines and options appear/vanish from prior flags | Deep memory; NPCs cite what you did three hours ago | [[anchor-shadow-of-mordor]] nemesis chatter |
| **Swipe / binary under pressure** | One card, two edges, fast | Volume of small choices compounds into a reign | [[anchor-reigns]] |
| **Hub-and-spoke** | Return to a topic menu; spokes exhaust | Exploration, not commitment; pacing risk | classic adventure games |

## Twist seams

- **Dialogue but your build changes what lines exist** *(mechanic-swap)* — options are gated by stats/perks, so two players read two different scripts. [[anchor-disco-elysium]]'s skills *speak up unprompted*; the choice is which voices you leveled. Composes with [[system-skill-trees]], [[system-build-diversity]].
- **Branching but choices are made under a timer** *(constraint)* — the menu decays; no answer is an answer. Pressure converts a browsing UI into a reflex. See [[pattern-pacing-and-tension]] and the failure mode [[antipattern-decision-paralysis]] it deliberately courts, then defuses.

## Tuning levers

| Lever | Low | High | Watch for |
|---|---|---|---|
| **Branch depth** | Shallow, reconverge fast | Long divergent arcs | Cost scales with the square; content budget dies at high depth |
| **Reconverge cadence** | Rare (true forks) | Frequent bottlenecks | Frequent + unwritten state = [[antipattern-fake-choice]] |
| **Memory horizon** | Forgets by next scene | Cites hour-old flags | Long memory needs a readable ledger or it feels arbitrary |
| **Check difficulty** | Auto-pass | Coin-flip / hard-gated | Gate hard and failure must *branch*, not dead-end |
| **Option count** | 2–3 | 6+ | Past ~5, add [[antipattern-decision-paralysis]] risk; timer amplifies it |
| **Flag visibility** | Silent | Toast / journal echo | Invisible consequence reads as no consequence |

**The load-bearing lever is memory.** Depth and reconvergence are cosmetic without state that persists and gets *referenced back*. A choice the world never mentions again did not happen.

## How it wires to Hayao

- Model the conversation as **pure data + a pure step**: `(node, flags, sheet) → visible options`, and `(node, choice, flags) → (next node, flags')`. Same discipline as `examples/sokoban/` — rules are a pure module, the view renders from a probe. Dialogue is a `Puzzle`-shaped graph where "winnable" means "every node is reachable and no gate strands the player".
- Keep **flags in sim state** so they enter the world hash and survive save/load — see [[system-save-and-checkpoint]]. Cosmetic-only nodes (a portrait fade, a screen-shake on a hard truth) set `cosmetic` so they stay out of the hash.
- **Determinism is the whole game** for stat rolls: draw every check from the deterministic RNG, never `Math.random`, so a session replays identically and a solver can prove the graph. See the procgen discipline in [[system-procgen-design]].
- Render the menu as **DOM chrome**, not sim geometry — it is UI, like any [[system-inventory-and-ui]] surface.
- Prove reachability the way a puzzle proves winnability: walk the graph, assert no orphan nodes and no gate the current sheet can never satisfy. Ties to [[system-quests-and-objectives]] when a branch sets an objective flag.

## Composes with

- [[pattern-meaningful-choice]] — the standard every branch is measured against.
- [[system-progression]] / [[system-meta-progression]] — flags that outlive one conversation become the meta-layer; [[anchor-reigns]] and [[anchor-hades]] both let dialogue *accrue*.
- [[world-character-design]] / [[world-naming-and-tone]] — a branch is only as sharp as the voice speaking it.
- [[system-onboarding]] — the first conversation teaches the choice grammar; make the first fork *cheap and legible*.
- [[pattern-escalation-and-payoff]] — plant a flag early, cash it late; the callback is the payoff.

## Fails when…

- **Branches reconverge invisibly.** Player forks, feels agency, lands in the identical scene with no flag written — [[antipattern-fake-choice]]. The fix is not more branches; it is *one line elsewhere* that proves the world noticed.
- **The optimal line is obvious.** If one option always wins, it is not a choice — see [[antipattern-boring-optimal]]. Trade-offs, not right answers.
- **The player must read the author's mind** to pick — [[antipattern-guess-the-designer]]. Telegraph the *kind* of consequence without spoiling the outcome.
- **False depth.** Six options that all set the same flag are one option in a costume — [[antipattern-false-depth]].
- **Checks dead-end instead of branching.** A failed skill check that just blocks progress is a wall; make failure *its own path*. [[anchor-disco-elysium]] turns failure into the best writing in the game.

## Verify

Design is done here; proof lives there. Judge these branches against narrative-decision craft in [design/FUN.md#21-·-narrative-decisions](design/FUN.md#21-·-narrative-decisions): does a choice change a probe-able flag, does that flag get referenced downstream, and does every gate have at least one clearing path? A branch that fails the "did the world remember?" test is cosmetic — cut it or give it teeth.
