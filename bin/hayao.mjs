#!/usr/bin/env node
// The `hayao` CLI — the court's mint.
//   hayao strike <entry> [...]     save a game to one Coin (.coin.html)
//   hayao open <coin>              play a Coin in the browser
//   hayao open --seal <coin>       print the two faces (Heads / Tails)
//   hayao open --assay <coin>      re-run the Seal's proof from the coin alone
//   hayao treasury                 (coming soon) list local Coins by their faces
//
// `open` is pure Node and needs nothing but the coin file: --assay unpacks the
// embedded assay bundle and re-derives the hash, so the proof travels with the coin.
import { spawnSync, execFileSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const [cmd, ...rest] = process.argv.slice(2);

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

// ── read a coin ────────────────────────────────────────────────
function readCoin(path) {
  if (!path || !existsSync(path)) fail(`hayao open: coin not found: ${path ?? '(no path)'}`);
  const html = readFileSync(path, 'utf8');
  const mMatch = html.match(/<script type="application\/hayao-coin\+json"[^>]*>([\s\S]*?)<\/script>/);
  if (!mMatch) fail(`hayao open: ${path} is not a Hayao coin (no manifest)`);
  const manifest = JSON.parse(mMatch[1]);
  const aMatch = html.match(/<script type="application\/hayao-assay\+gzip"[^>]*>([\s\S]*?)<\/script>/);
  return { html, manifest, assayB64: aMatch ? aMatch[1].trim() : null };
}

// ── open --seal : print the two faces ──────────────────────────
function printSeal(path) {
  const { manifest: m } = readCoin(path);
  const a = m.heads.arms ?? {};
  const armsLine = a.field ? `${a.field} field · ${a.accent} ${a.charge} · ${a.arrangement} · ${a.division}` : '(none)';
  const labelKb = m.heads.label ? (Buffer.byteLength(m.heads.label) / 1024).toFixed(1) + ' KB' : '(none)';
  const s = m.tails.seal ?? {};
  console.log(`${m.heads.title} — a Hayao coin`);
  console.log(`  engine   hayao ${m.hayao}${m.heads.struck ? `   ·   struck ${m.heads.struck}` : ''}`);
  console.log(`\nHeads`);
  console.log(`  maker    ${m.heads.maker}`);
  console.log(`  arms     ${armsLine}`);
  console.log(`  label    ${labelKb}`);
  console.log(`\nTails`);
  console.log(`  seal     seed ${s.seed} · ${s.steps} steps · hash ${s.hash}`);
  console.log(`  source   ${m.tails.source ?? '—'}`);
}

// ── open --assay : re-derive the hash from the embedded bundle ──
function assay(path) {
  const { manifest: m, assayB64 } = readCoin(path);
  const seal = m.tails.seal ?? {};
  if (!assayB64) fail(`hayao open --assay: ${path} carries no assay bundle (struck by an older strike?)`);
  const code = gunzipSync(Buffer.from(assayB64, 'base64'));
  const tmp = join(tmpdir(), `hayao-assay-${process.pid}.mjs`);
  writeFileSync(tmp, code);
  let got;
  try {
    got = execFileSync(process.execPath, [tmp, 'assay', String(seal.seed), String(seal.steps)], { encoding: 'utf8' }).trim();
  } catch (e) {
    unlinkSync(tmp);
    fail(`hayao open --assay: the assay bundle failed to run — ${e.message}`);
  }
  unlinkSync(tmp);
  const ok = got === seal.hash;
  console.log(`${m.heads.title} — assay`);
  console.log(`  determinism  replay seed ${seal.seed} · ${seal.steps} steps`);
  console.log(`  stamped      ${seal.hash}`);
  console.log(`  re-derived   ${got}`);
  if (ok) console.log(`\n  ✓ SEAL HOLDS — the coin re-proves itself.`);
  else console.log(`\n  ✗ BROKEN SEAL — re-derived hash does not match the stamp.`);
  process.exit(ok ? 0 : 1);
}

// ── open (play) : hand the file to the OS browser ──────────────
function play(path) {
  if (!path || !existsSync(path)) fail(`hayao open: coin not found: ${path ?? '(no path)'}`);
  const url = pathToFileURL(resolve(path)).href;
  const opener = process.platform === 'darwin' ? ['open', [url]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : ['xdg-open', [url]];
  try {
    spawn(opener[0], opener[1], { detached: true, stdio: 'ignore' }).unref();
    console.log(`opening ${path} …`);
  } catch {
    console.log(`open this coin in a browser: ${url}`);
  }
}

function open(args) {
  const flag = args.find((v) => v.startsWith('--'));
  const path = args.find((v) => !v.startsWith('--'));
  if (flag === '--seal') return printSeal(path);
  if (flag === '--assay') return assay(path);
  if (flag && flag !== '--play') fail(`hayao open: unknown flag ${flag} (use --seal or --assay)`);
  return play(path);
}

// ── strike : dispatch to the tsx source (repo) or the built entry ──
function strike(args) {
  const src = resolve(here, '../src/coin/strike.ts');
  const dist = resolve(here, '../dist/strike.js');
  if (existsSync(src)) process.exit(spawnSync('npx', ['tsx', src, ...args], { stdio: 'inherit' }).status ?? 1);
  else if (existsSync(dist)) process.exit(spawnSync(process.execPath, [dist, ...args], { stdio: 'inherit' }).status ?? 1);
  else fail('hayao: strike implementation not found');
}

switch (cmd) {
  case 'strike':
    strike(rest);
    break;
  case 'open':
    open(rest);
    break;
  case 'treasury':
    console.error('hayao treasury: coming soon (see docs/COIN.md).');
    process.exit(2);
    break;
  default:
    console.log('hayao — the court mint\n\n  hayao strike <entry> [--maker @handle] [-o out.coin.html]\n  hayao open <coin>            play it\n  hayao open --seal <coin>     print Heads / Tails\n  hayao open --assay <coin>    re-prove the Seal\n  hayao treasury               (coming soon)');
    process.exit(cmd ? 1 : 0);
}
