// WebGL lab driver. Wires the WebGL2Renderer and manages the post-processing
// pipeline based on the game's world.state.effectIdx / param.

import { runStudio, WebGL2Renderer, WEBGL_EFFECTS, BLOOM_PIPELINE } from '@hayao';
import { webglLabGame, EFFECTS, type LabState } from './webgl-lab';

const mount = document.getElementById('app')!;

// Map effect modes to pipelines / shaders.
function effectPipeline(idx: number): Parameters<WebGL2Renderer['setPipeline']>[0] | string {
  const eff = EFFECTS[idx];
  if (eff.mode === 'bloom')       return BLOOM_PIPELINE;
  if (eff.mode === 'passthrough') return WEBGL_EFFECTS.passthrough;
  if (eff.mode === 'vignette')    return WEBGL_EFFECTS.vignette;
  if (eff.mode === 'pixelate')    return WEBGL_EFFECTS.pixelate;
  if (eff.mode === 'crt')         return WEBGL_EFFECTS.crt;
  if (eff.mode === 'chroma')      return WEBGL_EFFECTS.chromaticAberration;
  if (eff.mode === 'hue')         return WEBGL_EFFECTS.hueRotate;
  if (eff.mode === 'wave')        return WEBGL_EFFECTS.wave;
  return WEBGL_EFFECTS.passthrough;
}

let lastEffectIdx = -1;

const handle = runStudio(webglLabGame, mount, {
  renderer: 'webgl',
  shell: false,
  onAdvance(world) {
    const s = world.state as unknown as LabState;
    const renderer = handle.renderer as WebGL2Renderer;
    const idx = s.effectIdx;

    // Rebuild pipeline only when effect changes (avoids redundant shader compiles).
    if (idx !== lastEffectIdx) {
      const p = effectPipeline(idx);
      if (Array.isArray(p)) renderer.setPipeline(p);
      else renderer.setPostProcess(p);
      lastEffectIdx = idx;
    }

    // Drive the current effect's main parameter uniform.
    const eff = EFFECTS[idx];
    if (eff.uniform) renderer.setUniform(eff.uniform, s.param);
  },
  hot: import.meta.hot,
});
import.meta.hot?.accept();
