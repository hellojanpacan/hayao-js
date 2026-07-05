// Smoke test for the Studio MCP sidecar: spawn it over stdio, run the MCP
// handshake, list tools, and call list_games + (if a session exists)
// inspect_moment. Exercises the real transport — the same path Claude Code
// uses. Run: node scripts/mcp-smoke.mjs
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const child = spawn('npx', ['tsx', 'bin/hayao-mcp.ts'], { stdio: ['pipe', 'pipe', 'inherit'] });
let buf = '';
const pending = new Map();
child.stdout.on('data', (d) => {
  buf += d.toString();
  let idx;
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    const msg = JSON.parse(line);
    if (msg.id !== undefined && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  }
});

let nextId = 1;
function rpc(method, params) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, (msg) => (msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)));
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    setTimeout(() => reject(new Error(`${method} timed out`)), 60_000);
  });
}
const notify = (method, params) => child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');

const fail = (msg) => {
  console.error(`✗ ${msg}`);
  child.kill();
  process.exit(1);
};

await rpc('initialize', {
  protocolVersion: '2025-06-18',
  capabilities: {},
  clientInfo: { name: 'mcp-smoke', version: '0' },
});
notify('notifications/initialized', {});
console.log('✓ initialize handshake');

const tools = (await rpc('tools/list', {})).tools.map((t) => t.name).sort();
for (const t of ['get_knob_state', 'inspect_moment', 'list_games', 'list_sessions', 'run_verify']) {
  if (!tools.includes(t)) fail(`missing tool ${t}`);
}
console.log(`✓ tools/list → ${tools.join(', ')}`);

const games = JSON.parse((await rpc('tools/call', { name: 'list_games', arguments: {} })).content[0].text);
if (!games.some((g) => g.slug === 'updrift' && g.knobs.includes('jumpVelocity'))) fail('list_games missing updrift knobs');
console.log(`✓ list_games → ${games.length} games (updrift has jump knobs)`);

const knobs = JSON.parse((await rpc('tools/call', { name: 'get_knob_state', arguments: { game: 'physics-lab' } })).content[0].text);
if (knobs.spec.knobs.length !== 3) fail('physics-lab knob spec wrong');
console.log('✓ get_knob_state → physics-lab declares 3 knobs');

const sessionsDir = join(process.cwd(), '.studio', 'sessions');
const sessions = existsSync(sessionsDir) ? readdirSync(sessionsDir).filter((f) => f.endsWith('.json')) : [];
if (sessions.length > 0) {
  const id = sessions[sessions.length - 1].replace(/\.json$/, '');
  const res = await rpc('tools/call', { name: 'inspect_moment', arguments: { sessionId: id } });
  const summary = JSON.parse(res.content[0].text);
  const hasImage = res.content.some((c) => c.type === 'image');
  if (typeof summary.hash !== 'string') fail('inspect_moment returned no hash');
  console.log(`✓ inspect_moment(${id}) → frame ${summary.frame}, hash ${summary.hash.slice(0, 8)}…, png=${hasImage}`);
} else {
  console.log('· no sessions on disk — inspect_moment skipped (play something in Studio first)');
}

console.log('MCP smoke: all green');
child.kill();
process.exit(0);
