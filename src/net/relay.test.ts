// End-to-end smoke over the real relay: spawn scripts/relay.mjs, connect two
// WebSocket transports, run a host + join room handshake and a short lockstep
// game, and prove both worlds hash identically. Requires the global WebSocket
// client (Node ≥ 21) — skipped cleanly elsewhere.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { connect as netConnect, type Socket } from 'node:net';
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

  it('reassembles fragmented client messages before broadcasting', async () => {
    // Browsers fragment large sends (late-join snapshots easily qualify), so
    // speak RFC 6455 by hand over a raw socket to control the fragmentation.
    const room = `frag-${process.pid}`;
    const receiver = await connectWebSocket(`${url}/${room}`);
    const received = new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('fragmented message never arrived')), 5000);
      const unsub = receiver.onMessage((data) => {
        clearTimeout(timer);
        unsub();
        resolve(data);
      });
    });

    const port = Number(new URL(url).port);
    const raw = netConnect(port, 'localhost');
    await wsHandshake(raw, room);
    const msg = `{"pad":"${'x'.repeat(200_000)}"}`;
    raw.write(maskedFrame(0x1, false, msg.slice(0, 70_000)));
    raw.write(maskedFrame(0x0, false, msg.slice(70_000, 140_000)));
    raw.write(maskedFrame(0x0, true, msg.slice(140_000)));

    expect(await received).toBe(msg);
    raw.destroy();
    receiver.close();
  }, 15_000);
});

/** Minimal client-side upgrade handshake for the hand-rolled socket. */
function wsHandshake(sock: Socket, room: string): Promise<void> {
  return new Promise((resolve, reject) => {
    sock.once('data', (d: Buffer) =>
      d.toString().includes(' 101 ') ? resolve() : reject(new Error('upgrade refused')),
    );
    sock.once('error', reject);
    sock.write(
      `GET /${room} HTTP/1.1\r\n` +
        'Host: localhost\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n' +
        'Sec-WebSocket-Version: 13\r\n\r\n',
    );
  });
}

/** Encode a masked client→server frame (text 0x1 / continuation 0x0). */
function maskedFrame(opcode: number, fin: boolean, text: string): Buffer {
  const payload = Buffer.from(text);
  const len = payload.length;
  const mask = Buffer.from([0x1a, 0x2b, 0x3c, 0x4d]);
  let header: Buffer;
  if (len < 126) header = Buffer.from([(fin ? 0x80 : 0) | opcode, 0x80 | len]);
  else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = (fin ? 0x80 : 0) | opcode;
    header[1] = 0x80 | 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = (fin ? 0x80 : 0) | opcode;
    header[1] = 0x80 | 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  const masked = Buffer.allocUnsafe(len);
  for (let i = 0; i < len; i++) masked[i] = payload[i] ^ mask[i & 3];
  return Buffer.concat([header, mask, masked]);
}

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
