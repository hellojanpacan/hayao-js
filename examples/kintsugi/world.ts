// Kintsugi — the world graph: the PROVABLE contract for the whole game. Regions
// (rooms) joined by ability-gated seams, with the five golden abilities and the
// ember-shard collectibles placed across them. Everything downstream — room
// geometry, camera, save, story — is a view of THIS data. The spine
// (`worldgraph.ts`) proves it completable, 100%-completable, and softlock-free
// before a single tile is drawn (see world.test.ts).
//
// Pure data. No engine imports here — this is the design, machine-checkable.

import type { WorldGraphDef, WorldRegion, WorldEdge, WorldPickup } from '@hayao';

// ── the five golden abilities (each a mended seam) ──────────────────
export const ABIL = {
  step: 'goldstep', // double-jump — reach high seams
  rush: 'goldrush', // dash — cross wide breaks
  mend: 'wallmend', // wall-cling/jump — climb shattered shafts
  wing: 'goldwing', // glide — ride the wind over long spans
  burst: 'emberlight', // light-burst — shatter light-sealed gates
} as const;
export type AbilityId = (typeof ABIL)[keyof typeof ABIL];

/** In-world order the Mender recovers the seams (drives HUD + story). */
export const ABILITY_ORDER: AbilityId[] = [ABIL.step, ABIL.rush, ABIL.mend, ABIL.wing, ABIL.burst];

export interface BiomeMeta {
  id: string;
  name: string;
  /** One-line story beat revealed on first entry (a shrine mural). */
  beat: string;
  /** The guardian encountered here (a boss id, or null for the tutorial grove). */
  guardian: string | null;
}

export const BIOMES: BiomeMeta[] = [
  { id: 'grove', name: 'Sunder Grove', beat: 'The heart-kiln shattered; the light bled out and the world drifted apart. You wake as the Mender, a needle of gold in your chest.', guardian: null },
  { id: 'cistern', name: 'Weeping Cistern', beat: 'Below, the rains never stopped. A drowned bell tolls for a seam that rusted shut. Mend the water and it will answer.', guardian: 'drowned_bell' },
  { id: 'ember', name: 'Emberworks', beat: 'The forge that fired the world stands cold. Its warden hardened around the last coal, grief turned to cinder. It will not yield the wall.', guardian: 'cinder_warden' },
  { id: 'sky', name: 'Skydrift Span', beat: 'The upper seams tore free and the wind took them. A gale wears the shape of a keeper who could not hold on. Ride it or fall.', guardian: 'gale' },
  { id: 'heart', name: 'Heartroot', beat: 'The kiln’s root, dark and vast. Here the first crack ran. The Grief waits at the cold hearth with the last ember cupped in its hands.', guardian: 'grief' },
];

// ── region + graph authoring helpers ────────────────────────────────
const regions: WorldRegion[] = [];
const edges: WorldEdge[] = [];
const pickups: WorldPickup[] = [];

function room(id: string, biome: string, name: string): void {
  regions.push({ id, biome, name });
}
/** Bidirectional seam, optionally gated by abilities. */
function seam(a: string, b: string, requires?: AbilityId[]): void {
  edges.push({ from: a, to: b, requires });
}
/** One-way drop a → b (a break you can fall through but not climb back). */
function drop(a: string, b: string, requires?: AbilityId[]): void {
  edges.push({ from: a, to: b, requires, oneWay: true });
}
function grant(id: string, region: string, ability: AbilityId): void {
  pickups.push({ id, region, grants: ability });
}
function shard(id: string, region: string): void {
  // Ember shards are 100%-content; they grant a nominal, ungating ability id so
  // full-completion counts them without opening any seam.
  pickups.push({ id, region, grants: `shard:${id}` });
}

// ── SUNDER GROVE (start / tutorial) ─────────────────────────────────
room('grove_gate', 'grove', 'The Sundered Gate'); // start + first save shrine
room('grove_hollow', 'grove', 'Root Hollow');
room('grove_climb', 'grove', 'Broken Stair');
room('grove_shrine', 'grove', 'Shrine of the First Step'); // Goldstep here
room('grove_alcove', 'grove', 'Sealed Alcove'); // dash-gated shard (backtrack)
room('grove_high', 'grove', 'Canopy Ledge'); // DJ gate up toward the cistern
seam('grove_gate', 'grove_hollow');
seam('grove_hollow', 'grove_climb');
seam('grove_climb', 'grove_shrine');
grant('step', 'grove_shrine', ABIL.step);
seam('grove_hollow', 'grove_alcove', [ABIL.rush]); // only reachable after the Cistern's dash
shard('grove_shard', 'grove_alcove');
seam('grove_climb', 'grove_high', [ABIL.step]); // double-jump to the high ledge
seam('grove_high', 'cistern_mouth', [ABIL.step]);

// ── WEEPING CISTERN ─────────────────────────────────────────────────
room('cistern_mouth', 'cistern', 'Cistern Mouth');
room('cistern_fall', 'cistern', 'The Long Fall'); // one-way waterfall drop
room('cistern_pool', 'cistern', 'Still Pool');
room('cistern_bell', 'cistern', 'The Drowned Bell'); // guardian
room('cistern_shrine', 'cistern', 'Shrine of the Rush'); // Goldrush here
room('cistern_vault', 'cistern', 'Sunken Vault'); // wall-gated shard (backtrack)
seam('cistern_mouth', 'cistern_pool');
drop('cistern_mouth', 'cistern_fall'); // a drop; you land deeper
seam('cistern_fall', 'cistern_pool'); // and can walk back around
seam('cistern_pool', 'cistern_bell');
seam('cistern_bell', 'cistern_shrine');
grant('rush', 'cistern_shrine', ABIL.rush);
seam('cistern_pool', 'cistern_vault', [ABIL.mend]); // reachable after Emberworks' wall-cling
shard('cistern_shard', 'cistern_vault');
seam('cistern_shrine', 'ember_gate', [ABIL.rush]); // dash the wide break into Emberworks

// ── EMBERWORKS ──────────────────────────────────────────────────────
room('ember_gate', 'ember', 'Cold Threshold');
room('ember_forge', 'ember', 'The Dead Forge');
room('ember_flues', 'ember', 'Ash Flues');
room('ember_warden', 'ember', 'The Cinder Warden'); // boss
room('ember_shrine', 'ember', 'Shrine of the Mend'); // Wallmend after boss
room('ember_kilnwalk', 'ember', 'Kiln Walk'); // burst-gated shard (backtrack)
seam('ember_gate', 'ember_forge');
seam('ember_forge', 'ember_flues');
seam('ember_flues', 'ember_warden');
seam('ember_warden', 'ember_shrine');
grant('mend', 'ember_shrine', ABIL.mend);
seam('ember_forge', 'ember_kilnwalk', [ABIL.burst]); // reachable after Heartroot's light-burst
shard('ember_shard', 'ember_kilnwalk');
seam('ember_shrine', 'sky_ascent', [ABIL.mend]); // wall-climb the shattered shaft up

// ── SKYDRIFT SPAN ───────────────────────────────────────────────────
room('sky_ascent', 'sky', 'Torn Ascent');
room('sky_span', 'sky', 'The Long Span');
room('sky_updraft', 'sky', 'Updraft Choir');
room('sky_gale', 'sky', 'The Gale'); // boss
room('sky_shrine', 'sky', 'Shrine of the Wing'); // Goldwing after boss
room('sky_perch', 'sky', 'High Perch'); // dj+glide shard
seam('sky_ascent', 'sky_span');
seam('sky_span', 'sky_updraft');
seam('sky_updraft', 'sky_gale');
seam('sky_gale', 'sky_shrine');
grant('wing', 'sky_shrine', ABIL.wing);
seam('sky_span', 'sky_perch', [ABIL.step, ABIL.wing]); // needs both to reach
shard('sky_shard', 'sky_perch');
seam('sky_shrine', 'heart_descent', [ABIL.wing]); // glide the long span to Heartroot

// ── HEARTROOT (finale) ──────────────────────────────────────────────
room('heart_descent', 'heart', 'The Deep Descent');
room('heart_seam', 'heart', 'The First Crack');
room('heart_light', 'heart', 'Vault of Light'); // Emberlight here
room('heart_gate', 'heart', 'The Light-Sealed Door'); // burst-gated
room('heart_grief', 'heart', 'The Cold Hearth'); // final boss
room('heart_kiln', 'heart', 'The Heart-Kiln'); // GOAL — refire
seam('heart_descent', 'heart_seam');
seam('heart_seam', 'heart_light');
grant('burst', 'heart_light', ABIL.burst);
seam('heart_light', 'heart_gate', [ABIL.burst]); // shatter the light-seal
seam('heart_gate', 'heart_grief');
seam('heart_grief', 'heart_kiln');

export const KINTSUGI_WORLD: WorldGraphDef = {
  regions,
  edges,
  pickups,
  start: 'grove_gate',
  goal: 'heart_kiln',
};

/** Count of ember shards (100%-content beyond the 5 abilities). */
export const SHARD_COUNT = pickups.filter((p) => p.grants.startsWith('shard:')).length;
