# Authoring the Codex

How to write and extend Codex modules so 100+ files by many authors read as one
library. Read this + [`_TEMPLATE.md`](_TEMPLATE.md) before writing a module.

## The contract (non-negotiable)

1. **Voice** = [`design/FUN.md`](../design/FUN.md): terse, imperative, second-person,
   proof-aware. No throat-clearing. Bold the load-bearing noun, not sentences.
2. **Length** 120–260 lines. Tables and tight bullets over paragraphs.
3. **Frontmatter** exactly per `_TEMPLATE.md`. `id`, `title`, `kind`, `tags`,
   `summary`, `use-when` are **required**. IDs are STABLE and match the inventory
   below.
4. **Never invent a Hayao API.** Cite only names that exist in
   [`docs/API.md`](../docs/API.md) (grep first). Prefer pointing to the
   `sandboxes/<x>-lab` or `examples/<slug>` that already wires it over pasting code.
5. **Design here, prove there.** Do not restate FUN.md's mechanical truths or
   verify recipes — set `verify-with` and link them inline. The Codex is the
   *generative* half; FUN/JUICE/JUDGE are the *verification* half.
6. **Cross-link** with `[[module-id]]` (from the inventory) and `composes-with`.
   Link forward freely — a `[[id]]` for a not-yet-written module is a valid TODO.
7. **One file per Write.** Small modules, written as drafted.

## Body skeletons by kind

- **process** → *The step* · *Inputs → outputs* · *How to run it* (numbered) ·
  *Worked example* (a real intent taken through it) · *Traps*.
- **anchor** → *Design DNA* (the compressed essence) · *Load-bearing structures*
  (what actually makes it work — table) · *What to steal* · *What's just theme*
  (drop it) · *Composes into* (which genres/systems it feeds).
- **genre** → *Pillars* (exactly 3) · *The loop stack* (moment/encounter/session/
  meta) · *Essential systems* (link `system-*`) · *Content & difficulty model* ·
  *Signature-mechanic seeds* (3–5 twist ideas) · *Common pitfalls* · *Anchors* ·
  *Verify* (link the matching FUN.md genre section).
- **system** → *What it is* · *When to use / when NOT* · *Variants* (table) ·
  *Tuning levers* · *How it wires to Hayao* (real primitives / sandbox pointer) ·
  *Fails when…* · *Verify*.
- **worldbuilding** → *The kit* · *Vectors/options* · *Method* (numbered) ·
  *Aesthetic hook* (Kentō palette / JUDGE) · *Traps*.
- **pattern** → *The principle* · *Why it works* · *Levers* · *Applied across
  genres* (table) · *Overdone when…* · *Verify/feel-gate link*.
- **mechanic** → *The verb* (what the player does, in one line) · *How it feels /
  why it's fun* · *Tuning levers* (table, with sane defaults) · *Slots into*
  (genres + anchors) · *Twist seams* (2–3 "X but Y") · *How it wires to Hayao*
  (real primitive / sandbox pointer) · *Fails when…* · *Verify*. A mechanic is the
  atomic **player verb** below a `system-*`; keep it that granular.
- **antipattern** → *The smell* (name it) · *How it happens* · *The tell* (spot it
  in your own design) · *The fix* (link the `system-*`/`pattern-*` that cures it) ·
  *Seen in…* (concrete) · *Verify/guard link*. The mirror of `50-patterns/`:
  a named failure mode an agent checks its design against before handoff.
- **recipe** → *The brief* (one-line "X but Y") · *Anchors* · *Genre + systems
  pulled* (link them) · *The twist applied* · *The 3 pillars* · *Scope & first
  playable* · *Handoff* (`verify-with` targets). A recipe is a **pre-composed
  design** — it wires existing modules into a buildable starting point; it links,
  never restates. Recipes are convention references, NOT clones of `examples/`.

## Every anchor, genre & mechanic must name a twist seam

The whole point is composition + a bend. Anchor, genre, and mechanic modules must
include at least 2–3 concrete *signature-mechanic seeds* or *twist* ideas in the
[[process-the-twist]] vocabulary (theme / mechanic-swap / structure / perspective
/ constraint / tonal), each phrased as "X but Y". Show the reader where to bend.

---

## Master inventory

Filenames are relative to the section dir. IDs are final — link to them freely.

> The generated [`INDEX.md`](INDEX.md) / [`index.json`](index.json) are the
> **authoritative, always-current** list of every module. The tables below are the
> authoring seed plus the `mechanic-*` / `antipattern-*` / `recipe-*` kinds; when
> breadth is added to an existing kind it lands in `INDEX.md` first. Grep
> `INDEX.md` when in doubt, not this file.

### 00-process/ — `process-*`
| id | file | scope |
|---|---|---|
| process-intent-to-brief | intent-to-brief.md | Parse a high-level request into a design brief: fantasy, one-line hook, scope, hard constraints |
| process-pillars | pillars.md | Derive exactly 3 design pillars; use them as the decision filter for every later choice |
| process-core-loop | core-loop.md | The loop stack — moment / encounter / session / meta; the verb→challenge→feedback→reward→growth cycle |
| process-the-twist | the-twist.md | The "X but Y" composition formula; the six twist vectors; worked examples (Unrailed, Fertile Crescent, Shadow of War) |
| process-composition | composition.md | Combining anchors + genre + systems into one coherent whole; genre-blend rules (satisfy every parent) |
| process-refine-and-handoff | refine-and-handoff.md | Turn the design into a verification contract; the definition of "designed enough to build"; handoff to FUN/JUICE/JUDGE |

### 10-anchors/ — `anchor-*` (also write README.md)
| id | file | scope |
|---|---|---|
| anchor-celeste | celeste.md | Precision platformer + assist-mode humaneness; grace as system |
| anchor-hades | hades.md | Action roguelite whose meta-progression IS the narrative; death as content |
| anchor-vampire-survivors | vampire-survivors.md | Minimal-input horde survival; build-growth vs rising tide; the auto-attack fantasy |
| anchor-dead-cells | dead-cells.md | Metroidvania × roguelite; permanent unlocks over impermanent runs |
| anchor-slay-the-spire | slay-the-spire.md | Roguelike deckbuilder; draft-of-3, map choice, deck as evolving strategy |
| anchor-into-the-breach | into-the-breach.md | Perfect-information tactics; rewriting a telegraphed future |
| anchor-balatro | balatro.md | Score-multiplier deckbuilder; the joker-synergy "number goes up" juice |
| anchor-tetris | tetris.md | Pure endless mastery; the perfectly-tuned single verb |
| anchor-peggle | peggle.md | Physics arcade + variable-ratio reward + maximal juice on trivial input |
| anchor-baba-is-you | baba-is-you.md | Rule-manipulation puzzle; the mechanic IS the content |
| anchor-nuclear-throne | nuclear-throne.md | Arcade twin-stick roguelite; run-based tight-loop mastery |
| anchor-loop-hero | loop-hero.md | Placement + auto-combat + deck; composing three genres into one novel loop |
| anchor-age-of-empires | age-of-empires.md | RTS eco/tech ramp; age-up power spikes; build orders |
| anchor-starcraft | starcraft.md | RTS faction asymmetry done right; three rosters, one balance |
| anchor-factorio | factorio.md | Automation/logistics; the factory as the toy; scaling complexity |
| anchor-rimworld | rimworld.md | Colony sim as a story generator; an AI director authoring drama |
| anchor-stardew-valley | stardew-valley.md | Gentle life sim; open-ended goals; the calm compulsion loop |
| anchor-civilization | civilization.md | 4X "one more turn"; layered systems; snowball vs comeback |
| anchor-overcooked | overcooked.md | Couch-coop chaos; communication-forced-by-design; escalating kitchens |
| anchor-it-takes-two | it-takes-two.md | Asymmetric coop set-pieces; a new mechanic per chapter; interdependence |
| anchor-shadow-of-mordor | shadow-of-mordor.md | The nemesis system; emergent personalized rivals; systemic memory |
| anchor-reigns | reigns.md | Swipe-choice narrative; meters between two ditches; stewardship |
| anchor-outer-wilds | outer-wilds.md | Knowledge as the only progression; a curiosity-gated open world |
| anchor-return-of-the-obra-dinn | return-of-the-obra-dinn.md | Deduction as the core loop; the game trusts your reasoning |

### 20-genres/ — `genre-*` (also write README.md)
| id | file | scope (deep CREATIVE template; verify links to FUN.md) |
|---|---|---|
| genre-grid-puzzle | grid-puzzle.md | Sokoban-like; the solvable knot (FUN.md §1) |
| genre-precision-platformer | precision-platformer.md | Celeste-like; trust in inputs (FUN.md §2) |
| genre-metroidvania | metroidvania.md | The locked-door promise (FUN.md §3) |
| genre-action-adventure | action-adventure.md | Top-down Zelda-like; readable combat (FUN.md §4) |
| genre-stealth | stealth.md | Plannable danger (FUN.md §5) |
| genre-horde-survival | horde-survival.md | Twin-stick survivors; rising tide vs build (FUN.md §6) |
| genre-bullet-hell | bullet-hell.md | Density that reads (FUN.md §7) |
| genre-tower-defense | tower-defense.md | Build decisions that matter (FUN.md §8) |
| genre-rts | rts.md | Mass under command; asymmetry (FUN.md §9) |
| genre-roguelike | roguelike.md | Fair discovery; procgen connectivity (FUN.md §10) |
| genre-deckbuilder | deckbuilder.md | Drafts with teeth (FUN.md §11) |
| genre-tactics | tactics.md | Rewriting the telegraphed future (FUN.md §12) |
| genre-match3 | match3.md | Cascades you triggered (FUN.md §13) |
| genre-incremental | incremental.md | Pacing curve with no deserts (FUN.md §14) |
| genre-farming-sim | farming-sim.md | Gentle solvency (FUN.md §15) |
| genre-survival-horror | survival-horror.md | Dread you can budget (FUN.md §16) |
| genre-city-builder | city-builder.md | The exposed score; negative synergies (FUN.md §17) |
| genre-rhythm | rhythm.md | Tight but fair; beat is sim time (FUN.md §18) |
| genre-physics-arcade | physics-arcade.md | Trustworthy flight (FUN.md §19) |
| genre-racing | racing.md | Speed/line tradeoff (FUN.md §20) |
| genre-narrative-decisions | narrative-decisions.md | Impossible stewardship (FUN.md §21) |
| genre-coop-chaos | coop-chaos.md | EXTENSION beyond FUN.md's 21: couch-coop/party; communication under time pressure |
| genre-auto-battler | auto-battler.md | EXTENSION: prep-then-watch; economy + positioning + synergy |
| genre-exploration | exploration.md | EXTENSION: discovery/immersive-sim-lite; curiosity & knowledge as reward |

### 30-systems/ — `system-*` (also write README.md)
| id | file | scope |
|---|---|---|
| system-progression | progression.md | XP / levels / the power curve; pacing power gain |
| system-skill-trees | skill-trees.md | Branching unlocks; builds; meaningful exclusivity |
| system-meta-progression | meta-progression.md | Roguelite persistent unlocks between runs; power vs. options |
| system-mastery-curve | mastery-curve.md | Learnable depth; skill ceiling; the "easy to learn, hard to master" mechanism |
| system-economy | economy.md | Faucets & sinks; currencies; inflation control |
| system-resource-loops | resource-loops.md | Gather→convert→spend cycles; bottlenecks as pacing |
| system-crafting | crafting.md | Recipes; combinatorial depth; discovery vs. lookup |
| system-tech-tree | tech-tree.md | Research gating; branch exclusivity; the ramp of options |
| system-reward-schedules | reward-schedules.md | Variable-ratio drops, chests, loot; ethical compulsion |
| system-collectibles | collectibles.md | Sets, completion, cosmetics; optional goals with pull |
| system-combat-model | combat-model.md | Damage, resolution, timing; the shape of a hit |
| system-telegraphs | telegraphs.md | Tells, windups, readable threat; reaction windows |
| system-status-effects | status-effects.md | DoT/buffs/debuffs; stacking rules; build interaction |
| system-counter-systems | counter-systems.md | Rock-paper-scissors; near-hard counters; the duel matrix |
| system-faction-asymmetry | faction-asymmetry.md | Asymmetric identities that balance; the design of "different but fair" |
| system-unit-rosters | unit-rosters.md | Unit roles, tiers, and diversity; a legible roster |
| system-boss-design | boss-design.md | Phases, telegraphs, spectacle; the set-piece fight |
| system-build-diversity | build-diversity.md | Weapons/loadouts/synergies; making many viable strategies |
| system-grace | grace.md | Coyote/i-frames/buffer/mercy as a SYSTEM (concrete; FUN.md law 5) |
| system-enemy-ai | enemy-ai.md | Behavior, aggro/threat, steering; readable, beatable minds |
| system-enemy-archetypes | enemy-archetypes.md | Roles: tank/skirmisher/artillery/swarm/support; the enemy alphabet |
| system-encounter-design | encounter-design.md | Composing archetypes into fights; pressure & pockets |
| system-difficulty-and-dda | difficulty-and-dda.md | Difficulty curves, spikes/breathers, dynamic difficulty, assist |
| system-onboarding | onboarding.md | Tutorialization; teach-by-doing; the first ten minutes |
| system-accessibility | accessibility.md | Assist modes, remap, colour/contrast, readability floors |
| system-procgen-design | procgen-design.md | Runs, seeds, variance as content; controlled randomness |
| system-session-structure | session-structure.md | Run / campaign / level / world; session length & shape |
| system-save-and-checkpoint | save-and-checkpoint.md | Save, checkpoint, retry; respecting the player's time |
| system-emergent-systems | emergent-systems.md | Nemesis-style memory, relationships, reputation; systemic story |
| system-coop-and-competition | coop-and-competition.md | Coop/PvP hooks; asymmetric coop; interdependence & rivalry |

### 40-worldbuilding/ — `world-*` (also write README.md)
| id | file | scope |
|---|---|---|
| world-theme-vectors | theme-vectors.md | Choosing a setting/theme space; theme as a twist vector |
| world-worldbuilding-scaffold | worldbuilding-scaffold.md | From a setting to a coherent world with rules & stakes |
| world-faction-identity | faction-identity.md | Making factions feel distinct in fiction (pairs with system-faction-asymmetry) |
| world-naming-and-tone | naming-and-tone.md | Names, voice, register; the Kentō house restraint |
| world-aesthetic-direction | aesthetic-direction.md | Art direction; the Kentō woodblock palette; JUDGE hook |
| world-narrative-delivery | narrative-delivery.md | Environmental / systemic / embedded storytelling with little text |

### 50-patterns/ — `pattern-*` (also write README.md)
| id | file | scope |
|---|---|---|
| pattern-feedback-loops | feedback-loops.md | Positive/negative loops; runaway control; snowball vs. comeback |
| pattern-risk-reward | risk-reward.md | Push-your-luck; decisions with teeth; double-edged choices |
| pattern-mastery-and-flow | mastery-and-flow.md | The flow channel; matching challenge to skill |
| pattern-emergence | emergence.md | Second-order design; interacting rules; depth from few pieces |
| pattern-anti-frustration | anti-frustration.md | Forgiveness, respecting time; the grace mindset (pairs with system-grace) |
| pattern-juice-choreography | juice-choreography.md | Feel as choreography; the 2-senses contract (pairs with JUICE.md) |
| pattern-readability | readability.md | Signposting, salience, affordances (pairs with JUDGE.md) |
| pattern-pacing-and-tension | pacing-and-tension.md | Peaks & valleys; session rhythm; the tension curve |
| pattern-meaningful-choice | meaningful-choice.md | Anatomy of a real decision; distinct options, no dominant answer |
| pattern-fairness-and-trust | fairness-and-trust.md | The player must trust the sim; every loss attributable to a choice |
| pattern-escalation-and-payoff | escalation-and-payoff.md | Setup → escalation → release; promises made and kept |
| pattern-surprise-and-delight | surprise-and-delight.md | Secrets, reactivity, moments; the world noticed you back |
| pattern-opening-hook | opening-hook.md | The first two minutes; hook fast, teach by doing |
| pattern-restraint-and-negative-space | restraint-and-negative-space.md | Subtraction as design; every element earns its place |

### 60-mechanics/ — `mechanic-*` (also write README.md)
The atomic player **verb** below a `system-*`. Each names 2–3 twist seams.
| id | file | scope |
|---|---|---|
| mechanic-dash | dash.md | Directional burst; the escape/approach verb |
| mechanic-double-jump | double-jump.md | Second air impulse; forgiveness as a verb |
| mechanic-wall-jump | wall-jump.md | Kick off walls; vertical traversal |
| mechanic-wall-run | wall-run.md | Momentum along a surface; keep feeding it |
| mechanic-ledge-grab | ledge-grab.md | Catch an edge; recovery mercy |
| mechanic-climb | climb.md | Stamina-gated free ascent |
| mechanic-glide | glide.md | Trade fall speed for control |
| mechanic-swing | swing.md | Pendulum momentum; release timing is the skill |
| mechanic-grapple | grapple.md | Tethered pull; reach as a verb |
| mechanic-teleport | teleport.md | Instant relocation; a targeting decision |
| mechanic-gravity-flip | gravity-flip.md | Invert down; recontextualize every room |
| mechanic-ground-pound | ground-pound.md | A committed downward strike |
| mechanic-bounce | bounce.md | Rebound / pogo; aerial chaining |
| mechanic-parry | parry.md | Tight defensive window; the riposte read |
| mechanic-deflect | deflect.md | Reflect projectiles back at the sender |
| mechanic-block | block.md | Absorb hits at a cost; guard break |
| mechanic-dodge-roll | dodge-roll.md | Evade with i-frames; recovery is the cost |
| mechanic-charge-attack | charge-attack.md | Hold-to-power; a visible commitment |
| mechanic-combo-string | combo-string.md | Chain / cancel; the depth verb |
| mechanic-lock-on | lock-on.md | Bind camera and attacks to one foe |
| mechanic-throw | throw.md | Pick up and hurl; the world as ammo |
| mechanic-rewind | rewind.md | Roll time back; failure as a draft |
| mechanic-time-stop | time-stop.md | Freeze / slow as a spendable resource |
| mechanic-stack | stack.md | Pile and balance; height as jeopardy |
| mechanic-merge | merge.md | Fuse like-with-like into the next tier |
| mechanic-clone | clone.md | Record-replay; solve with your past selves |
| mechanic-portal | portal.md | Linked openings; momentum through folded space |
| mechanic-magnet | magnet.md | Attract / repel field over the world |
| mechanic-grow-shrink | grow-shrink.md | Scale as a key: fit, reach, crush |
| mechanic-possess | possess.md | Body-swap; which vessel solves which room |

### 70-antipatterns/ — `antipattern-*` (also write README.md)
The mirror of `50-patterns/`: a failure mode to check a design against pre-handoff.
| id | file | scope |
|---|---|---|
| antipattern-feature-soup | feature-soup.md | Many systems, no spine |
| antipattern-second-system | second-system.md | Over-built follow-up system |
| antipattern-false-depth | false-depth.md | Complexity mistaken for depth |
| antipattern-currency-spaghetti | currency-spaghetti.md | Too many currencies, unclear roles |
| antipattern-decision-paralysis | decision-paralysis.md | Too many options at once |
| antipattern-grind-wall | grind-wall.md | Progress gated by repetition, not skill |
| antipattern-power-creep | power-creep.md | New outclasses old; content decays |
| antipattern-stat-inflation | stat-inflation.md | Bigger numbers as fake progression |
| antipattern-boring-optimal | boring-optimal.md | The best strategy is the least fun |
| antipattern-pay-to-skip | pay-to-skip.md | Friction manufactured to sell the cure |
| antipattern-difficulty-cliff | difficulty-cliff.md | An unsignalled spike the ramp never taught |
| antipattern-endless-tutorial | endless-tutorial.md | Teaching that never yields control |
| antipattern-content-desert | content-desert.md | A big empty world padded with distance |
| antipattern-fail-loop-tax | fail-loop-tax.md | Losing costs time, not lessons |
| antipattern-backtracking-tax | backtracking-tax.md | Length padded by re-walking ground |
| antipattern-fake-choice | fake-choice.md | Options that collapse to one right answer |
| antipattern-solved-metagame | solved-metagame.md | One dominant build; copy the wiki |
| antipattern-rng-frustration | rng-frustration.md | Variance that erases skill |
| antipattern-unreadable-juice | unreadable-juice.md | Feedback so loud it hides state |
| antipattern-input-lie | input-lie.md | Dropped / delayed inputs break trust |
| antipattern-guess-the-designer | guess-the-designer.md | Unfair leaps; read the author's mind |

### 80-recipes/ — `recipe-*` (also write README.md)
A pre-composed design: anchor + genre + systems + a twist, wired and linked.
| id | file | scope |
|---|---|---|
| recipe-cozy-deckbuilder | cozy-deckbuilder.md | Slay the Spire but cozy, no death (tonal) |
| recipe-one-button-boss-rush | one-button-boss-rush.md | Cuphead but one input (constraint) |
| recipe-tower-defense-roguelite | tower-defense-roguelite.md | Tower defense but drafted each run (structure) |
| recipe-detective-deduction-board | detective-deduction-board.md | Obra Dinn but on a solvable grid (structure) |
| recipe-colony-nemesis | colony-nemesis.md | RimWorld but the raiders remember (mechanic-swap) |
| recipe-rhythm-platformer | rhythm-platformer.md | Celeste but the beat is sim time (mechanic-swap) |
| recipe-merge-factory | merge-factory.md | 2048 but you automate the merging (structure) |
| recipe-swipe-kingdom | swipe-kingdom.md | Reigns but your choices build a city (mechanic-swap) |

---

## The index is generated

Do **not** hand-edit `INDEX.md` or `index.json` — they are built from module
frontmatter by `scripts/build-design-index.mjs`. Just write correct frontmatter.
