# The Coin — Hayao's shareable game file

A **Coin** is one self-contained `.html` file that *is* a whole game: the engine,
the game, and a proof that it works, sealed together. It opens in any browser with
zero external requests, and because the engine is frozen inside it, **a Coin runs
identically in 2036 as it does today** — no back-compat burden, ever. That is the
[EMBED](EMBED.md) single-file cart, given an identity, a face, and a seal.

To **strike** a Coin is to save a game to one file. You keep your Coins in a
[Treasury](#treasury); you hand them to other builders; they open and play.

> A Coin you can *trust on vibes* is just an HTML file. A Hayao Coin carries a
> **Seal** — a re-executable machine proof. You don't trust the Coin; you re-run it.

## Two faces

A coin has two sides, and each carries exactly one job.

- **Heads** — the *face*. Who made it and what it is: title, the maker's **arms**
  (see [Provenance](#provenance)), and a **label** (the game's rendered opening
  frame). This is the human-facing identity — the thing you recognize in a Treasury.
- **Tails** — the *reverse*. The **Seal**: the machine proof, the seed, the engine
  version, and a link back to the remix source. Machine-facing truth.

*"Flip the coin to read its seal."*

Both faces live in one embedded manifest at the top of the file:

```html
<!doctype html><meta charset="utf-8">
<title>Lanternway — a Hayao coin</title>
<script type="application/hayao-coin+json" id="coin">
{
  "coin": 1,                     // coin-format version
  "hayao": "0.4.4",              // engine version FROZEN inside this file
  "heads": {
    "title": "Lanternway",
    "maker": "@aldric",
    "arms": { "field": "rose", "accent": "green", "charge": "crescent",
              "arrangement": "triad", "division": "plain" },   // blazon → crestSvg()
    "label": "data:image/svg+xml,...",   // rendered opening frame
    "struck": "2026-07-10"               // passed in at strike time — never Date.now()
  },
  "tails": {
    "seal": {
      "seed": 1,                          // effective seed
      "steps": 120,                       // canonical empty-input frames replayed
      "hash": "982dcaec9376e67e"          // world.hash() after those steps
    },
    "source": "https://github.com/…"      // optional: where to fork it by prompt
  }
}
</script>
<script type="application/hayao-assay+gzip" id="assay" data-encoding="gzip+base64">…</script>
<div id="app"></div>
<script>/* ⇩ inlined engine + game (IIFE) — auto-boots into #app ⇩ */ …</script>
```

The `#assay` script is a gzipped, tree-shaken **node** bundle (createWorld + headless
render + the game, no DOM) — the proof, travelling with the coin. The browser ignores
its unknown type; `hayao open --assay` unpacks and runs it.

## The Seal

The Seal is what makes a Coin more than a file: **the proof is re-executable, not
asserted.** Anyone can edit the JSON — so the JSON is not the guarantee. The
guarantee is that the Coin carries enough to *re-derive* its own seal:

- **Determinism** (built) re-proves from the Coin alone: `createWorld(def, {seed})`,
  run `steps` canonical empty-input frames, and confirm `world.hash()` equals
  `seal.hash`. The embedded `#assay` bundle does exactly this in Node — no source tree.
- **Winnability** (later) re-proves when the game exports its `Puzzle`: re-run `solve()`.

`hayao open --assay` runs the self-contained proof and reports drift: a Seal whose
replay no longer reproduces its hash is a **broken seal** — visibly so, with a non-zero
exit. (The six [GALLERY](GALLERY.md) channels — `winnable · determinism · ramp · feel ·
generated · art` — are the roadmap; v1 stamps and re-proves *determinism*.)

## Provenance

`heads.arms` is a **blazon**, and a blazon is a pure function of the maker's handle
(`readCrest('@aldric')`, see [`src/art/crest.ts`](../src/art/crest.ts)). So the arms
on a Coin's face can be *checked*: render `crestSvg(heads.maker)` and it must equal
the stamped arms. Forge the handle and the arms won't match — provenance you can see,
and verify, without a server.

## The verbs

The `hayao` bin, alongside `create-hayao` and `hayao-mcp` ([`bin/hayao.mjs`](../bin/hayao.mjs)):

```sh
hayao strike <entry> --maker @you -o game.coin.html   # built ✓
hayao open   game.coin.html                           # built ✓  play it in a browser
hayao open   --seal   game.coin.html                  # built ✓  print the two faces
hayao open   --assay  game.coin.html                  # built ✓  re-prove the Seal (exit 1 if broken)
hayao treasury                                        # planned  list local Coins by their faces
```

`strike` ([`src/coin/strike.ts`](../src/coin/strike.ts)) is the whole pipeline in one command:
1. bundle a node **assay bundle** (createWorld + headless render + game) via esbuild;
2. run it in `forge` mode → the Seal (`seed`/`steps`/`hash`) + the label;
3. render the opening frame headlessly → `heads.label`;
4. blazon `heads.maker` → `heads.arms`;
5. bundle the **browser payload** (engine + game, IIFE, auto-boot);
6. write one `.coin.html` — manifest + gzipped assay bundle + payload.

`strike` needs `esbuild` at runtime (an **optional peer dependency** — it bundles the
game); it prints an install hint if absent. `open` is pure Node and needs nothing but
the coin. In-repo the CLI runs the TS source via `tsx`; a published install runs the
built `dist/strike.js`.

## Treasury

A Treasury is just a directory of `*.coin.html` files. `hayao treasury` reads each
Coin's manifest and lists them by their faces — title, arms, and a ✓/✗ per assay
channel. No accounts, no server; the files *are* the library. (Exchange between
builders — circulating Coins — is a later, community-scale layer; the Treasury is
valuable at N=1.)

## v1 scope

- **Built:** the manifest + auto-booting payload; `hayao strike`; `hayao open` /
  `--seal` / `--assay`; the Seal's determinism re-proof (embedded, self-contained);
  arms + label on Heads; works both in-repo and from a published install.
- **Later:** `hayao treasury` listing; winnability re-proof gated on a `Puzzle` export
  convention; `--seal` verifying arms against `crestSvg(maker)`; a signed Seal (today's
  is *reproducible*, not *cryptographic*); Coin exchange.
- **Non-goals:** a proprietary binary format (a Coin is honest HTML you can read),
  and any runtime that isn't frozen into the file.

## Why this shape

Every property here is something Hayao already had, unassembled:
the vessel is [EMBED](EMBED.md), the label is `npm run thumbs`, the seal is
[GALLERY](GALLERY.md)'s verify harness, and the arms are `src/art/crest.ts`. The Coin
is the object that ties them into one thing a builder can hold, prove, and hand over.
