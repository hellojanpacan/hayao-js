// End-to-end smoke over the real relay: spawn scripts/relay.mjs, connect two
// WebSocket transports, run a host + join room handshake and a short lockstep
// game, and prove both worlds hash identically. Requires the global WebSocket
// client (Node ≥ 21) — skipped cleanly elsewhere.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { World } from '../world';
import { connectWebSocket } from './transport';
import { hostRoom, joinRoom, type NetGame } from './room';
import { playerInput } from './players';

const hasWebSocket = typeof globalThis.WebSocket === 'function';

function makeWorld(seed: number): World {
  const world = new World({ seed });
  world.state = { x: { p1: 0, p2: 0 } };
  world.root.addBehavior({
    update() {
      const s = world.state as { x: Record<string, number> };
      for (const p of Object.keys(s.x)) {
        if (playerInput(world, p).isDown('right')) s.x[p] += 1;
      }
    },
  });
  return world;
}

describe.skipIf(!hasWebSocket)('relay: real sockets end to end', () => {
  let relay: ChildProcess;
  let url = '';

  beforeAll(async () => {
    const script = join(dirname(fileURLToPath(import.meta.url)), '../../scripts/relay.mjs');
    relay = spawn(process.execPath, [script], { env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'inherit'] });
    url = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('relay did not start')), 10_000);
      relay.stdout!.on('data', (chunk: Buffer) => {
        const m = /ws:\/\/localhost:(\d+)/.exec(chunk.toString());
        if (m) {
          clearTimeout(timer);
          resolve(`ws://localhost:${m[1]}`);
        }
      });
    });
  }, 15_000);

  afterAll(() => {
    relay?.kill();
  });

  it('host + joiner play 30 identical frames over the relay', async () => {
    const room = `test-${process.pid}`;
    const hostTransport = await connectWebSocket(`${url}/${room}`);
    const clientTransport = await connectWebSocket(`${url}/${room}`);

    const host = hostRoom({ transport: hostTransport, makeWorld, seed: 11 });
    const joinPromise = joinRoom({ transport: clientTransport, makeWorld });

    // Give the hello time to cross the wire, then start.
    await waitFor(() => host.roster.length === 2, 'second player joined');
    const hostGame = host.start();
    const clientGame: NetGame = await joinPromise;

    // Drive both sessions with real async delivery in between.
    for (let i = 0; i < 200 && (hostGame.session.frame < 30 || clientGame.session.frame < 30); i++) {
      hostGame.session.tick(['right']);
      clientGame.session.tick(i % 2 === 0 ? ['right'] : []);
      await sleep(2);
    }
    expect(hostGame.session.frame).toBeGreaterThanOrEqual(30);
    expect(clientGame.session.frame).toBeGreaterThanOrEqual(30);

    // Settle to a common frame and compare full state hashes.
    const target = Math.max(hostGame.session.frame, clientGame.session.frame);
    for (let i = 0; i < 100 && (hostGame.session.frame < target || clientGame.session.frame < target); i++) {
      if (hostGame.session.frame < target) hostGame.session.tick([]);
      if (clientGame.session.frame < target) clientGame.session.tick([]);
      await sleep(2);
    }
    expect(hostGame.session.frame).toBe(clientGame.session.frame);
    expect(hostGame.world.hash()).toBe(clientGame.world.hash());
    const s = hostGame.world.state as { x: Record<string, number> };
    expect(s.x.p1).toBeGreaterThan(10); // inputs actually flowed

    hostGame.dispose();
    clientGame.dispose();
    hostTransport.close();
    clientTransport.close();
  }, 20_000);
});

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitFor(cond: () => boolean, what: string, timeoutMs = 5000): Promise<void> {
  const start = Date.now();
  while (!cond()) {
    if (Date.now() - start > timeoutMs) throw new Error(`timed out waiting for ${what}`);
    await sleep(10);
  }
}
