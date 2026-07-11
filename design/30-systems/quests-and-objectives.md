---
id: system-quests-and-objectives
title: Quests & Objectives
kind: system
tags: [goals, structure, pacing, guidance, tasks]
summary: How the game states what to do and why — the objective layer that turns systems into a sequence of pulls.
use-when: Players are unsure what to do next, or you need to pace goals across a session.
composes-with: [system-onboarding, system-session-structure, world-narrative-delivery]
verify-with: docs/VERIFICATION.md
---

**What it is.** The layer that names the next thing worth doing and gives a reason to care. Systems generate possibility; the **objective layer** points at one of them and says *go there*. Without it a rich sim reads as a shrug.

**Player fantasy / why it's fun.** A clear pull forward — the itch of an open thread, the small closure of resolving it. Good objectives feel like *your* plan; bad ones feel like a manager's to-do list. The pull is anticipation, not obligation.

---

## What it is

An objective is a **triple**: a target state, a signal that says how to move toward it, and a payoff on arrival. Change the guidance strength and the same target becomes a hard-directed waypoint, a whispered breadcrumb, or a goal the player invents unprompted. Quests are objectives with narrative skin and a lifecycle (offered → active → resolved).

The objective layer is where [[system-progression]] becomes legible: it converts "the world has changed" into "here is what changed and what to reach for next."

## When to use / when NOT

Use it when:
- The mechanic space is wide and a new player would stall (open worlds, sims, [[genre-immersive-sim]]).
- You want to **pace** intensity — space hard beats with soft ones across a [[system-session-structure]].
- Story and system need to move together ([[genre-action-adventure]], [[genre-metroidvania]]).

Skip or minimize it when:
- The core loop *is* the objective — [[anchor-tetris]], [[anchor-vampire-survivors]], most [[genre-physics-arcade]] games. Adding a quest log here is noise.
- The pull is intrinsic and legible from the board — [[genre-abstract-strategy]], [[genre-grid-puzzle]]. The win condition is the only objective you need.
- You'd be papering over a loop that isn't fun yet. Fix [[process-core-loop]] first; a quest can't rescue a dead verb.

## Variants

| Variant | Guidance strength | Who authors the goal | Reference | Best for |
|---|---|---|---|---|
| **Hard-directed** | High — waypoint, arrow, marker | Designer | [[anchor-into-the-breach]] objective; RTS mission brief | Tutorials, tight [[system-encounter-design]], time pressure |
| **Breadcrumb** | Low — hints, landmarks, "smoke on the horizon" | Designer, indirectly | [[anchor-dark-souls]]; [[anchor-outer-wilds]] | Exploration, discovery, [[pattern-surprise-and-delight]] |
| **Self-set** | None — player picks the target | Player | [[anchor-minecraft]]; [[anchor-terraria]]; [[anchor-rimworld]] | Sandboxes, colony sims, long tails |
| **Main quest** | Med-high, always resumable | Designer | Any story game's critical path | The spine; guarantees an ending exists |
| **Side quest** | Med, optional | Designer | [[anchor-stardew-valley]] bundles | Texture, reward variety, world colour |
| **Emergent** | Zero authored — the sim raises the stakes | Systems | [[anchor-rimworld]] crises; [[anchor-shadow-of-mordor]] nemesis grudges | Replay, stories the player tells others |

Most games layer several: a resumable main spine, a scatter of side threads, and a soil where emergent goals grow. See [[pattern-pacing-and-tension]] for how to sequence hard against soft.

## Twist seams

- **Quests but the player writes them** *(perspective)* — the game hands out no to-do list; the player declares intent and the systems adjudicate it. [[anchor-minecraft]] and [[anchor-rimworld]] live here. The design work moves from *authoring quests* to *making the sim legible enough that self-set goals feel earned*. Guardrail: give the player a scratchpad or pin-a-target affordance so their goal has UI presence — otherwise it evaporates.
- **Objectives but only revealed by doing, never listed** *(constraint)* — no journal, no marker; the objective is inferred from a changed world. [[anchor-outer-wilds]] (the ship log records what you *saw*, never what to do next) and [[anchor-return-of-the-obra-dinn]] (the book fills as you deduce). Danger: crosses into [[antipattern-guess-the-designer]] the moment the intended read isn't inferable from the fiction. Every hidden objective needs one honest diegetic tell.

## Tuning levers

- **Guidance strength** — the master dial. Arrow → marker → hint → landmark → nothing. Turn it *down* over a session as the player learns the world's grammar; front-load it in [[system-onboarding]].
- **Reward shape** — what arrival pays: power, story, cosmetic, currency, a new verb. Vary it. See [[system-reward-schedules]] and [[pattern-risk-reward]]. A quest whose only reward is XP trains the player to skim.
- **Journal / tracker UI** — how many threads are visible, how they sort, whether the player pins one. This is [[system-inventory-and-ui]] work; a bad log turns a good quest into homework.
- **Count & concurrency** — how many objectives are live at once. Too few starves; too many triggers [[antipattern-decision-paralysis]]. Gate side content behind main beats to control the fan-out.
- **Framing verbs** — "investigate / avenge / restore" pull harder than "collect 10 / kill 5 / visit". Fetch is fine as *connective tissue*, fatal as the *whole quest*. See [[world-narrative-delivery]].
- **Resumability** — after a break, can the player re-read *why* they cared? A one-line "so far / next" recap is the cheapest retention lever you have.

## How it wires to Hayao

- **Objective state is model, chrome is chrome.** The active-objective set, completion flags, and journal entries are part of world state — they belong in the deterministic model and must survive `hash()`. The panel that *draws* them is DOM/`showScreen()` menu chrome or a `cosmetic` view node.
- **Progression-as-graph.** When quests gate each other (prereqs, branches), model the objective graph as a pure `Puzzle<State, Move>` structure — the same logic/view split `examples/sokoban` uses to machine-prove its levels. Prove that a completable path to the ending exists — no soft-locks.
- **Emergent objectives ride the director.** A sim that *raises* goals (a raid incoming, a resource crisis) is a spawn-director concern — see [[system-spawn-directors]] and the physics/procgen `sandboxes/` labs for how one mechanic is exercised in isolation. Keep every roll on the world RNG so an emergent quest replays identically from a seed.
- **Reveal-by-doing** reads world state and shows the *consequence*, never a scripted "objective updated" toast the fiction can't justify.

## Fails when…

- It becomes a **checklist chore** — a wall of "collect/visit/kill N" with only XP at the end. The player optimizes the list instead of inhabiting the world → [[antipattern-boring-optimal]], [[antipattern-content-desert]].
- The log is a **firehose** — twenty concurrent threads, no priority, no closure → [[antipattern-decision-paralysis]].
- Hidden objectives aren't inferable — reveal-by-doing without a diegetic tell → [[antipattern-guess-the-designer]].
- The reward is hollow — a quest that promised a choice and pays the same either way → [[antipattern-fake-choice]].
- Quests exist to inflate hours — travel padding, backtrack fetches → [[antipattern-backtracking-tax]], [[antipattern-grind-wall]].
- You bolt a quest system onto a loop that isn't fun, hoping structure substitutes for a verb → [[antipattern-feature-soup]].

## Verify

Design intent — clear next-pull, varied rewards, no soft-locks, honest reveals — is proved, not asserted. Machine-check that every objective graph has a completable path and that objective/journal state is in `hash()` and reproduces from a seed. See **docs/VERIFICATION.md**, and let [[docs/JUDGE|judge]] confirm the tracker reads as shipped chrome, not debug text.
