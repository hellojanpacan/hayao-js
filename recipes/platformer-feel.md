# Recipe · platformer feel

**Living instance:** [`examples/updrift`](../examples/updrift) — a wind-swept
switchback ascent that passes all four feel gates. Copy from it; read here for why.

A platformer is 10% "the character moves" and 90% "the character *feels* alive."
The engine already ships the 10% (`stepPlatformer` — the full coyote/buffer/
variable-height/dash canon). This recipe is the 90%: how you sample intent, how you
answer every event on the senses, and how you author geometry a solver can prove.

## The shape (four files, copied and owned)

```
examples/<slug>/
  logic.ts   # pure: the level DATA, the config, stepX(), the feedback contract
  game.ts    # the view: sample input → stepX → JUICE; camera; HUD; win/lose
  bot.ts     # a waypoint climber that proves the ascent 0-death
  drive.ts   # run the bot against the real game → input log + outcome
  verify.ts  # the gates (winnability, determinism, + the four feel gates)
```

Keep the sim in `world.state` (one `PlatformerState`), keep every pixel `cosmetic`.
Then goldens, snapshots, and replay come free (the engine's whole bet).

## 1 · Geometry as provable data

Author the stage through `defineLevel`, not hand-placed sprites. Derive the ledge
spacing from the movement envelope — never eyeball "looks jumpable":

```ts
const RISE = Math.floor(jumpHeight(CONFIG) / TILE);   // ledges rise ≤ this
const REACH = Math.floor(jumpDistance(CONFIG) / TILE); // gaps span ≤ this
// ...generate ledges within (RISE, REACH), then:
export const LEVEL = defineLevel({ name, tileSize: TILE, rows, legend: { o: 'crystal' } });
```

Prove it in `verify.ts` **before** trusting the bot:

```ts
platformerReachable(LEVEL, { jumpTiles: RISE, runTiles: REACH }).ok // → true
```

Use **one-way platforms** (`-`) for climbing ledges: the body rises up through them
and lands on top, so an ascent never means ramming a solid ledge's side face — the
single biggest reason a hand-built climb feels stiff (and the reason a simple bot
can clear it).

## 2 · Sample intent as edges, answer with juice

In `game.ts`'s `onProcess`, read **actions** (never keys) and pass jump/dash as
rising edges; `stepPlatformer` returns the feel events you turn into juice:

```ts
const ev = stepPlatformer(pc, {
  moveX: input.isDown('right') ? 1 : input.isDown('left') ? -1 : 0,
  moveY: 0,
  jumpHeld: input.isDown('jump'),
  jumpPressed: input.justPressed('jump'),   // EDGE — a held jump must not re-buffer
  dashPressed: input.justPressed('dash'),
}, dt, MAP, CONFIG);

if (ev.jumped) { audio.tone({ freq: 620, duration: 0.08 }); particles.burst(6, feet, dust); }
if (ev.landed) { audio.tone({ freq: 180, duration: 0.07 }); particles.burst(8, feet, dust); shaker.addTrauma(0.12); }
if (ev.dashed) { audio.tone({ freq: 440, duration: 0.10 }); particles.burst(12, mid, streak); shaker.addTrauma(0.10); }
if (ev.died)  { die(); }
```

Every emitter (`Particles`, `Shaker`, `AmbientField`, `FloatingText`) is cosmetic —
it carries its own Rng and never enters `world.hash()`, so deleting it changes no
game bit. That is what lets the reference lean into juice without risking the sim.

## 3 · Declare a feedback contract (and gate it)

Don't just *fire* juice — **declare** it, so the feedback-completeness gate can
prove every significant event answers on ≥2 senses inside the envelope:

```ts
export const FEEDBACK: FeedbackContract = {
  jump: { channels: ['audio', 'visual'] },
  land: { channels: ['audio', 'visual', 'haptic'], shake: 0.12 },
  dash: { channels: ['audio', 'visual'], shake: 0.10 },
  death:{ channels: ['audio', 'visual', 'haptic'], shake: 0.5, hitstopFrames: 6 },
};
// verify.ts:
feedbackIssues(FEEDBACK, ['jump','land','dash','death']).length === 0;
```

## 4 · The four feel gates (copy into verify.ts)

| gate | call | proves |
|---|---|---|
| forgiveness | `forgivenessIssues(CONFIG)` + `graceWindowIssues('coyote', W, accepts)` | grace windows exist AND a late jump lands to the frame |
| feedback | `feedbackIssues(FEEDBACK, events)` | every event answers on ≥2 senses, juice bounded |
| readability | `salienceIssues(render(), avatarFill, background)` | the avatar out-contrasts the scenery |
| camera | `cameraIssues(camSamples)` + `lookAheadIssues(cam, target)` | the follow never snaps/jerks and leads the motion |

See [`examples/updrift/verify.ts`](../examples/updrift/verify.ts) for all four wired
end-to-end, and [design/JUICE.md](../design/JUICE.md) for the full cookbook.

## Pitfalls this recipe already paid for

- **A tapped jump gets cut to 40%** (variable height). A bot — and a nervous
  player — must *hold* jump for the full rise. Sample `jumpHeld` honestly.
- **The camera snaps to (0,0)** if the follow target has no position when the
  controller first `ready()`s. Seed the avatar at the spawn before wiring the camera.
- **Reachability over-approximates.** `platformerReachable` ignores ceiling bonks;
  it's a necessary gate, not sufficient. The 0-death **bot run** is the ground truth.
