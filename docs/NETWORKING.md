# NETWORKING.md — deterministic multiplayer

hayao's sim was always a lockstep engine: `step(inputs)` is a pure transition,
randomness is seeded, runs replay from an input log, and `world.hash()`
fingerprints the whole state. The net layer adds the only missing piece —
moving inputs between machines — and never touches the sim.

```
  keyboard ─▶ session ─▶ merged frame ─▶ world.step()   (identical on every peer)
                ▲  │
        transport  └─ hash exchange → desync detection
```

## The five layers

| layer | module | what it does |
|---|---|---|
| players | `playerIds`, `playerAction`, `mergePlayerFrames`, `playerInput` | namespaces actions per player (`p1:left`); a merged frame is an ordinary input frame |
| transport | `LoopbackHub`, `BroadcastChannelTransport`, `connectWebSocket` | a **bus**: `send()` reaches every other peer. Tabs, relay, or in-memory test network |
| session | `LockstepSession`, `RollbackSession` | decides *when* a frame may step and *what* goes in it |
| room | `hostRoom`, `joinRoom` | seed + roster + config handshake, start, late join by snapshot, leaves |
| driver | `runBrowserNet` | the browser loop: lobby → session → render |

## Writing a netplay game

1. **Read inputs through `playerInput(world, 'p1')`** — never `world.input`
   directly. The same game then runs hot-seat (pre-namespaced input map) and
   networked (session merges remote inputs) with zero branches. See
   `examples/fernclash/`.
2. **Keep canonical state in `world.state`**, view in `cosmetic` nodes, and put
   game logic in a **registered custom node's `onProcess`** (`registerNode`).
   Registered nodes survive `World.restore()`, so rollback and late join need
   no re-attach hook. Behaviors added as closures do NOT survive restore —
   if you use them, pass `attach(world)` to the session/room options.
3. **All sim-affecting decisions flow through the input stream.** A rematch
   button must `input.press('again')`, not mutate `world.state` in a DOM
   callback — otherwise only one peer resets and you desync.
4. **Use dmath** (`dsin`/`dcos`/`datan2`/`dexp2`/`dhypot`/`dlog*`) instead of
   the implementation-defined `Math.*` — enforced by `npm run invariants`.
   `+ - * /`, `Math.sqrt`, and the round/abs/min/max family are IEEE-exact and
   fine. This is what makes *cross-machine* determinism hold.

## Lockstep (default)

Every peer steps frame N only when it holds every player's input for N; local
input is scheduled `inputDelay` frames ahead (default 2 ≈ 33 ms at 60 Hz) to
hide latency. A silent peer stalls the sim (it never desyncs). Input messages
re-send a small window (`redundancy`) so a lost packet doesn't stall anyone.

```ts
const session = new LockstepSession({ world, transport, localPlayer: 'p1', players: ['p1', 'p2'] });
// per render frame:
session.advance(realMs, keyboard.currentActions());
```

Late join is lockstep-only: the host schedules the newcomer at
`frame + joinMargin`, snapshots the world exactly there, and ships it; every
peer adds the player at the same frame, so rosters never diverge.

## Rollback

`RollbackSession` sends local input immediately, predicts remote inputs
(repeat-last), and on a misprediction restores the ring snapshot at the bad
frame and re-simulates — GGPO-style, built directly on the engine's proven
`snapshot()`/`restore()`. Backpressure keeps the sim within `maxRollback`
frames of the last confirmed frame so a correction can always land. Hash
exchange runs on confirmed frames only.

## Desync safety

Every `hashInterval` frames each peer broadcasts `world.hash()`. On mismatch
the session freezes and hands `onDesync` the frame, both hashes, and the full
merged input log — feed it to `replay()` and binary-search the divergence
offline. In practice a desync means invariant breakage (unordered iteration,
`Math.*`, sim state outside `world.state`), all of which `npm run verify`
hunts already.

## Transports

- **Two tabs, zero servers**: `new BroadcastChannelTransport('room-name')`.
- **Across machines**: `npm run relay` (zero-dep WebSocket room hub,
  `scripts/relay.mjs`), then `await connectWebSocket('ws://host:8787/room')`.
- **Tests**: `new LoopbackHub({ delay, dropEvery })` — deterministic latency
  and loss, `hub.tick()` moves the network one step. Network tests are exactly
  reproducible; see `src/net/net.test.ts`.

## Verifying netplay

`examples/fernclash/verify.ts` is the template: run two sessions over a lossy
`LoopbackHub` to a finished match, settle both to the same frame, and assert
`worldA.hash() === worldB.hash()`. The relay path is covered end-to-end with
real sockets in `src/net/relay.test.ts`.
