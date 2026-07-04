# Lessons — distilled from building games as an AI

hayao.js is the third iteration of a question: *what does a game engine look like
if an LLM is the primary developer?* These lessons come from real builds —
**narrow-js** (a kit over the LittleJS canvas engine) and **One Hundred Year
Garden** (a DOM/SVG game with a pure simulation core). The engine bakes most of
them in; this file is why.

## Determinism is the keystone
Make the game a pure function of (seed, input log) and every hard thing becomes
easy: tests call `step()` in Node; replays compare a state hash; levels are
searchable; undo is a snapshot; a refactor is safe iff the hash is unchanged.
The cost is discipline — all randomness through one seeded `Rng`, no wall-clock in
the sim, ordered iteration. hayao enforces it and `assertDeterministic` catches
any leak. Everything else in this file depends on this one.

## A structural hash must be stable across the serialization it will cross
`world.hash()` is only as trustworthy as the boundaries the state travels
through. Building save/load surfaced a latent bug: `hashValue` counted an
`undefined`-valued object key as present, but JSON — which every save crosses —
drops it, so a snapshot hashed one value live and a different value after a
save→load round-trip (a `Sprite`'s unset `paint` fields were the trigger). The
fix is to make the hash match the serialization's own semantics (`{a:undefined}`
≡ `{}`, as in JSON). The general lesson: a determinism hazard can hide for a long
time behind a boundary nothing has crossed yet — the day you add persistence,
netcode, or a new backend is the day it surfaces, so make the canonical hash
agree with the canonical wire format *by construction*.

## Verification before content
The single highest-leverage habit. Without a harness you will confidently ship
unreachable rooms and unwinnable levels — the author's certainty is not evidence.
narrow-js's BFS solver rejected three consecutive hand-authored tactics levels,
each for a structural reason only visible after the counterexample. Build the
`Puzzle` + solver first; author levels second.

## Prove content beatable — geometry lies
"It looks fine" is a failure mode. A puzzle you are sure is solvable often isn't;
a platform exit that looks reachable bonks its underside every ascent. Pure logic
+ a solver (or, for real-time, reachability arithmetic + a scripted playthrough of
the critical path) is the only trustworthy proof.

## Code-as-art, never binary assets
LLMs are good at code and bad at binary blobs. Vector shapes, gradients, glyphs,
and procedural paths give a coherent, polished look with zero asset pipeline —
and they diff, serialize, and hash. hayao's renderer speaks only a vector display
list; `art/` provides palettes and shape builders. Constrain the art space (named
palettes, keyframe shapes) and combinatorial output stays on-model.

## DOM for menus; SVG beats canvas for many genres
Humans compare your in-game type to the DOM around it, and canvas text loses —
it's rasterized at a fixed backbuffer and fuzzy on hiDPI. Put chrome (titles,
menus, HUD) in DOM overlays (`showScreen`). Better still, for non-action genres,
render the *game* in SVG too: resolution-independent (no fuzz) and DOM-inspectable
(verification for free). Reach for the Canvas2D backend only when node count bites.

## Separate canonical state from view
The bug that motivated `cosmetic`: a move counter shown in the HUD leaked into the
state hash, so snapshot/restore "failed" though the game was fine. Keep derived,
transient display (counters, particles, tweened positions) OUT of the canonical
state — mark those nodes `cosmetic`. What's hashed should be exactly what defines
the game, nothing more.

## Dev-server semantics cause more user-visible bugs than game code
The SPA fallback silently re-serves the hub for missing pages ("Enter does
nothing" — actually a 200 on a typo'd path). Use MPA mode so 404s are honest.
Bind the dev server to a harness-assignable port so two sessions don't collide.
The boring glue is where the surprises live.

## Consolidate on the third copy — and let goldens prove the lift
Copy-paste between examples is *correct* for the first two occurrences (the
abstraction isn't visible yet). By the third verbatim copy, promote it into
`src/` behind `@hayao` — the frame-scoped `NodePool` existed six times before
the mid-campaign sweep found it. Two rules from that sweep: (1) promote only
near-identical code; same-shaped-but-divergent patterns (wave schedulers,
enemy FSMs, room transitions) lose expressiveness when unified — leave them in
the games. (2) Do the lift right after pinning golden replay hashes: five
games migrated, every golden byte-identical, refactor proven pure in one
command (`npm run verify`).

## Multi-agent orchestration
Subagents stall holding a whole 1000-line file in one unwritten response — instruct
builders to write one small module per tool call. Give verification agents their
own dev-server port (the shared preview tab is contended). Run research in
parallel at session start; it's cheap and shapes everything after. And **verify
that a delegated agent's files actually landed** — a connection drop can end an
agent "successfully" with half its writes missing.

## Easy vs hard for an LLM, in this stack
**Easy:** pure deterministic logic and the solvers that prove it; vector art as
code; DOM UI + localStorage; TypeScript strictness as a free correctness gate;
statistical property tests over a stochastic system.
**Hard (scaffold or avoid):** judging interactive feel blind (build the probe/
screenshot harness first); hand-authoring provably-complete levels (always solve
them); binary/spritesheet art; music; frame-perfect real-time; giant single files.

## Prove the mechanic is load-bearing, not just that levels are winnable
Winnability proofs accept levels that ignore the game's core mechanic. The
cheap, strong upgrade (from Seamfold/B1): run the SAME solver on a rules
variant with the mechanic disabled and assert *unsolvable* — one extra
`Puzzle` object reusing `apply` with a flag. "Every level needs the seam"
became CI, and it caught the designer being wrong about his own level in both
directions. Works anywhere a mechanic gates progress: ability-gating
(metroidvania reachability minus the ability), dash-gated platforming, the
twist mechanic of any puzzle genre. Negative proofs are as cheap as positive
ones and assert design intent, not just feasibility.

## Pointer games port keyboard-first: cursor + confirm keeps taps replayable
Reproducing a tap/pointer game (Gravewell/B2): model the tap as a keyboard
cursor + confirm action instead of raw pointer coords. Every tap then lives in
the same deterministic input log as any key (record/replay covers it), and a
`tapsToFrames()` helper compiles solver paths into cursor walks so proofs
drive the REAL view. Two rules: the cursor is CANONICAL state, never cosmetic
(it decides what confirm does); and taps that change nothing must not consume
resources — charge effects, not clicks.

## Continuous physics is verified by failure classes, not trajectories
The rigid-body build's five real bugs were all CLASSES with names — warm-start
capture order (an energy pump), bias velocity vs sleep (position error must
not carry momentum), per-body sleep in piles (must be island-atomic), and
three distinct CCD pinning traps (exact-TOI leaves no penetration for the
discrete solver; exit crossings count as hits; already-touching surfaces
re-clamp a slider every frame). None were visible in a trajectory eyeball;
every one fell out of a genre-truth gate ("piles sleep", "an unflipped table
always drains", "a bounce never adds energy"). Write the gate for the CLASS
and the instance finds itself. Continuous state can't be BFS-solved like a
grid puzzle, but plain-data physics gives the same power back as
structuredClone search bots: an aim-searching siege bot and a flip-timing bot
are the solver, and a displacement-score gradient turns a greedy bot into a
multi-stage planner.

## Constrained motion wants kinematic bodies, not fought motors
When gameplay needs a paddle/platform/blade that follows a SCRIPT (flippers,
crushers, lifts), don't pin a dynamic body with a motored joint and fight the
constraint for authority — a revolute motor drives relative velocity about
centroids and the pivot constraint eats most of it. A kinematic body whose
pose AND velocity are recomputed about the pivot each step is infinitely
stiff, tuning-free, and the contact solver hands its true surface velocity to
whatever it strikes. Reserve joints for things that should genuinely be
pushed around (ropes, wrecking balls, ragdolls, bridges).

## A deterministic path needs a tie-break, not just a correct cost
Porting graph search into a lockstep engine, the trap isn't correctness — a
textbook A* finds an optimal-cost path anywhere. It's that *which* optimal path
it returns must be bit-identical on every JS engine, or a cross-machine game
desyncs even though both peers "found the shortest route." Two disciplines buy
this: order the open-set min-heap on `(f, insertionSeq)` so equal-`f` nodes pop
in push order (never heap-internal swap order, which is engine-defined), and
keep the heuristic in exact arithmetic (Manhattan/octile, integer-stable) so
float wobble can't re-order ties. Same rule as `dmath` for transcendentals:
the answer being *right* isn't enough; it has to be right the *same way*
everywhere. BFS is immune (array frontier = insertion order for free); every
priority-ordered search is not.

## FSM has two jobs; the timed one is the tween kit's missing half
"Add an FSM helper" hides two distinct primitives. One is the classic
condition-driven machine (onEnter/update/leave + an ordered guard table) for AI
and screens. The other — the one 5 js13k games hand-rolled with ad-hoc timers —
is a *timed phase* that eases the moment a logical step commits and hands the
view a 0→1 progress alpha to interpolate against (super-castle's
`IState`+`NextPhaseMap`). The engine already eased cosmetic values
(`AnimationPlayer`); what it lacked was easing the *timing of the logic*, on the
same fixed-`dt` clock, so a discrete move and its smooth animation can't drift.
Ship both under one name and the discrete↔continuous bridge stops being
per-game glue.

## Weigh a mined mixin against the seams you already have
norman's `Behaviour{onUpdate,onCollision,onDamage}` mixin is a real win — in a
codebase with no scene graph. Hayao has `Node.onProcess` + `Signal`/`EventBus`
already covering those three hooks, so adding a parallel per-entity hook bus
would be a *second* update path competing with the node tree — the redundancy
the "keep the tree lean" invariant exists to prevent. The test for adopting a
mined primitive isn't "did a sampled game build it?" but "does it collapse into
a seam I already have?" If yes, decline it and record why; a declined gap with
a reason is a deliverable, not a gap left open.

## The cosmetic/hash line in procgen is drawn per-output, not per-module
Adding generators, the instinct is to classify the *module* — "procgen is
cosmetic" or "procgen is level data." Both are wrong. One `src/procgen/` dir
legitimately holds cave/dungeon/terrain carving (collision geometry — logical,
hash-relevant, must run deterministically off `world.rng` or an explicit seed)
right beside coordinate-hash scatter and value noise (decoration — `cosmetic`,
out of `world.hash()`). The invariant resolves per *output*: are you producing
structure the rules read, or dressing the view? Structure carves logic; scatter
dusts it. A helper file is not the unit the determinism rule applies to.

## For endless content, make generation a pure function, not a seeded stream
knight-dreams' real anti-pattern isn't only `Math.random` — it's *stateful*
generation. A generator that mutates as it runs forces the world to be built in
order, and reproducing column N means replaying columns 0..N-1. Express the
surface as `f(col, seed)` instead (layered value noise off an integer cell
hash) and determinism stops being a discipline you maintain over a mutating
object and becomes a *property of the function*: any column, any order, any
peer, same answer, no stream to serialize. Seeded PRNG is right for a *bounded*
carve (a cave, a floor); a stateless coordinate hash is right for the
*unbounded* one (endless terrain, per-cell scatter).

## Gamma-correct and netplay-deterministic turned out to be the same fix
An honest sRGB→linear color blend needs a 2.4-power transfer curve. `Math.pow`
is both the perceptually-correct tool here and an engine-nondeterministic op the
invariants ban. The reflex is to treat these as competing constraints; they're
not. Building `dpow` on the existing `dexp2`/`dlog2` (already exact-rounded for
lockstep) delivers the correct blend and the reproducible blend in one stroke.
When a "quality" requirement and a "determinism" requirement seem to collide,
check whether the determinism-safe primitive you already have is also the
higher-quality one — here linear-light lerp is both.

## Two views of one grid are two coordinate systems — say so at the seam
Autotiling ships two solvers over the same `boolean[][]`: a neighbour bitmask
(each cell is a *tile*, a filled square) and marching squares (each cell is a
*corner*, a sampled point). They are duals — the corner grid sits half a tile
in from the tile grid — so overlaying the contour on the fill at a shared origin
puts the outline `tile/2` off, a bug that still *renders* and only the headless
screenshot catches. The lesson isn't "pick one." It's that when two primitives
consume the same input structure through different interpretations, the offset
between their outputs is a real part of the API and belongs documented at the
call site, not discovered in a frame. A shared input type quietly implies a
shared coordinate system that isn't there.

## Enforce the cosmetic invariant by construction, not by discipline
The art-from-code primitives are the ones most likely to leak into `world.hash()`
— a decoded sprite or a laid-out glyph *feels* like state. Two structural
choices make the leak impossible rather than merely discouraged: the pure
functions emit plain `DrawCommand[]` (commands are never hashed, so the data has
no path into the hash at all), and the view nodes set `this.cosmetic = true` in
their own constructor instead of asking the caller to remember. A forgetful game
can't pollute determinism even by accident. When an invariant is easy to violate
and expensive to catch, move the guarantee into the type's construction so the
safe path is the only path.

## A render capability lands in the shared paint vocabulary, not per-game code
The instinct for "make this game look impressive" is to write clever art in the
game. But the highest-leverage upgrade is one field on the backend-agnostic
display list: adding `gradient` and `shadow` to `Paint` lit *every* game at once
— skies, water, glowing projectiles, health bars — and cost nothing in
determinism because commands are never hashed (the same reason the art
primitives are safe). A gradient in OBJECT-BOUNDING-BOX space (0..1 of the
shape's own bounds) is size- and position-independent, so one descriptor reads
on a 12px firefly and a 3000px sky alike; the SVG backend emits `<defs>`, the
Canvas backend maps the unit box to pixels, and neither the game nor the display
list knows which backend it feeds. When a whole class of games wants a new look,
push the capability down to the display list and let the backends resolve it —
don't paint it by hand upstream.

## Ids in a reusable fragment collide when the fragment is composited
`renderToSVGString` was only ever one document, so gradient/filter ids like `g0`
were unique by construction. The moment the filmstrip stitches N frames into ONE
`<svg>`, `url(#g0)` — which is DOCUMENT-global in SVG — makes panel 3's fill
resolve to panel 0's gradient: silent cross-bleed the golden hash can't catch
(it hashes state, not markup). The fix is to salt ids by a caller-supplied
prefix. The general trap: any markup fragment that mints `id`/`url(#…)` pairs is
only self-contained until someone embeds two copies in one document. If a
fragment can be composited, its ids need a namespace parameter — assume it will
be, and thread the salt from the start.
