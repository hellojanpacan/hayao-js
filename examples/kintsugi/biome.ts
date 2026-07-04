// Per-biome art identity — the palette + backdrop mood for each of the five
// regions. All colours are KENTO woodblock hues; the scene composes a gradient
// sky, parallax silhouettes, autotiled walls, and glow from these. Kept as data
// so a room only needs to know its biome id to look right.

import { KENTO, mix, withAlpha } from '@hayao';

export interface BiomeArt {
  skyTop: string;
  skyBot: string;
  /** Distant silhouette band colour (parallax). */
  far: string;
  wall: string;
  wallEdge: string;
  accent: string;
  glow: string;
  hazard: string;
  fog: string;
}

export const BIOME_ART: Record<string, BiomeArt> = {
  grove: {
    skyTop: KENTO.aiDeep,
    skyBot: mix(KENTO.kaki, KENTO.matsuDeep, 0.45),
    far: mix(KENTO.matsuDeep, KENTO.aiDeep, 0.5),
    wall: mix(KENTO.stone, KENTO.matsuDeep, 0.55),
    wallEdge: KENTO.sumi,
    accent: KENTO.matsu,
    glow: KENTO.ko,
    hazard: KENTO.shu,
    fog: withAlpha(KENTO.gofun, 0.05),
  },
  cistern: {
    skyTop: KENTO.yohaku,
    skyBot: KENTO.aiDeep,
    far: mix(KENTO.aiDeep, KENTO.kuro, 0.4),
    wall: mix(KENTO.stone, KENTO.aiDeep, 0.6),
    wallEdge: KENTO.kuro,
    accent: KENTO.asagi,
    glow: KENTO.asagi,
    hazard: KENTO.shu,
    fog: withAlpha(KENTO.asagi, 0.06),
  },
  ember: {
    skyTop: mix(KENTO.kuro, KENTO.shuDeep, 0.35),
    skyBot: KENTO.kakiDeep,
    far: mix(KENTO.sumi, KENTO.shuDeep, 0.45),
    wall: mix(KENTO.sumi, KENTO.kakiDeep, 0.4),
    wallEdge: KENTO.kuro,
    accent: KENTO.kaki,
    glow: KENTO.kaki,
    hazard: KENTO.shu,
    fog: withAlpha(KENTO.kaki, 0.06),
  },
  sky: {
    skyTop: KENTO.asagiDeep,
    skyBot: mix(KENTO.fuji, KENTO.gofun, 0.5),
    far: mix(KENTO.fuji, KENTO.gofun, 0.35),
    wall: mix(KENTO.kinako, KENTO.stone, 0.5),
    wallEdge: KENTO.sumiSoft,
    accent: KENTO.fuji,
    glow: KENTO.gofun,
    hazard: KENTO.shu,
    fog: withAlpha(KENTO.gofun, 0.08),
  },
  heart: {
    skyTop: KENTO.yohaku,
    skyBot: mix(KENTO.fujiDeep, KENTO.kuro, 0.5),
    far: mix(KENTO.fujiDeep, KENTO.kuro, 0.35),
    wall: mix(KENTO.kuro, KENTO.fujiDeep, 0.3),
    wallEdge: KENTO.kuro,
    accent: KENTO.fuji,
    glow: KENTO.ko,
    hazard: KENTO.shu,
    fog: withAlpha(KENTO.fuji, 0.07),
  },
};

export function biomeArt(biome: string): BiomeArt {
  return BIOME_ART[biome] ?? BIOME_ART.grove;
}
