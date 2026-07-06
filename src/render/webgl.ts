// WebGL2 backend — the GPU display surface for hayao.
//
// Architecture: Canvas2D rasterizes the display list to an offscreen canvas;
// WebGL2 uploads the result as a texture and runs it through a programmable
// GLSL post-processing pipeline. This gives:
//
//   1. Pixel-exact parity with Canvas2DRenderer for ALL command types
//      (text, paths, gradients, shadows) with zero per-type GPU code.
//   2. A programmable multi-pass post-processing pipeline with auto-uniforms
//      (u_time, u_resolution) and user-settable uniforms (setUniform).
//   3. Standard multi-pass patterns via setPipeline(): bloom, blur chains,
//      composite effects — each pass reads u_scene (original frame) and
//      u_prev (previous pass output).
//   4. Named built-in effects via WEBGL_EFFECTS — import and use without
//      writing GLSL.
//
// Sim/determinism contract: untouched. This renderer is a pure display-list
// consumer. Wall-clock (u_time) is host-only and never enters world.hash().

import type { DrawCommand } from './commands';
import { clientToDesign, fitViewport, type Renderer, type RendererConfig, type Viewport } from './renderer';
import { drawToCanvas2D } from './canvas2d-core';
import type { Vec2 } from '../core/math';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Value for a GLSL uniform: float, vec2, vec3, or vec4. */
export type UniformValue = number | [number, number] | [number, number, number] | [number, number, number, number];

/**
 * One pass in a post-processing pipeline. Each pass is a GLSL fragment shader
 * that receives:
 *   uniform sampler2D u_scene      — the original Canvas2D rasterized frame
 *   uniform sampler2D u_prev       — output of the previous pass (= u_scene for pass 0)
 *   uniform float     u_time       — wall-clock seconds (cosmetic only, never hashed)
 *   uniform vec2      u_resolution — display canvas size in pixels
 *   in vec2           v_uv         — 0..1 UV with (0,0) at top-left
 *   out vec4          fragColor    — output pixel
 *
 * Plus any custom uniforms added via setUniform() or the pass's own `uniforms` map.
 */
export interface PostProcessPass {
  /** GLSL #version 300 es fragment shader source. */
  shader: string;
  /** Per-pass custom uniforms (merged with the renderer-level ones, pass overrides renderer). */
  uniforms?: Record<string, UniformValue>;
}

// ── GLSL ─────────────────────────────────────────────────────────────────────

const VERT_SRC = /* glsl */ `#version 300 es
out vec2 v_uv;
void main() {
  const vec2 CORNERS[4] = vec2[](
    vec2(-1.0, -1.0), vec2(1.0, -1.0),
    vec2(-1.0,  1.0), vec2(1.0,  1.0)
  );
  const vec2 UVS[4] = vec2[](
    vec2(0.0, 1.0), vec2(1.0, 1.0),
    vec2(0.0, 0.0), vec2(1.0, 0.0)
  );
  v_uv = UVS[gl_VertexID];
  gl_Position = vec4(CORNERS[gl_VertexID], 0.0, 1.0);
}`;

const PASSTHROUGH_FRAG = /* glsl */ `#version 300 es
precision mediump float;
in vec2 v_uv;
uniform sampler2D u_scene;
uniform sampler2D u_prev;
out vec4 fragColor;
void main() { fragColor = texture(u_prev, v_uv); }`;

// ── Named built-in effects ───────────────────────────────────────────────────

/**
 * Ready-made GLSL fragment shaders for common post-processing effects.
 * Use in setPostProcess() or as passes in setPipeline().
 *
 * Each effect references u_scene / u_prev / u_time / u_resolution as needed.
 * Custom tuning: pass a custom uniform via setUniform() — names are noted below.
 *
 * @example
 * ```ts
 * import { WebGL2Renderer, WEBGL_EFFECTS } from '@hayao';
 * const renderer = new WebGL2Renderer({ width, height, postProcess: WEBGL_EFFECTS.vignette });
 * // Tune: renderer.setUniform('u_vignette', 0.5);
 * ```
 */
export const WEBGL_EFFECTS = {
  /** Passthrough — no effect. */
  passthrough: PASSTHROUGH_FRAG,

  /** Pixelate: blockSize in pixels (default 4). setUniform('u_block', N) */
  pixelate: /* glsl */ `#version 300 es
precision mediump float;
in vec2 v_uv;
uniform sampler2D u_prev;
uniform vec2 u_resolution;
uniform float u_block;
out vec4 fragColor;
void main() {
  float block = max(1.0, u_block > 0.0 ? u_block : 4.0);
  vec2 px = floor(v_uv * u_resolution / block) * block / u_resolution;
  fragColor = texture(u_prev, px);
}`,

  /** Vignette: darkens edges. setUniform('u_vignette', 0.0..1.0, default 0.4) */
  vignette: /* glsl */ `#version 300 es
precision mediump float;
in vec2 v_uv;
uniform sampler2D u_prev;
uniform float u_vignette;
out vec4 fragColor;
void main() {
  vec4 col = texture(u_prev, v_uv);
  vec2 uv = v_uv - 0.5;
  float d = dot(uv, uv);
  float strength = u_vignette > 0.0 ? u_vignette : 0.4;
  fragColor = col * (1.0 - d * strength * 4.0);
}`,

  /** CRT scanlines + slight barrel distortion. u_time drives the scan roll. */
  crt: /* glsl */ `#version 300 es
precision mediump float;
in vec2 v_uv;
uniform sampler2D u_prev;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_crt_lines;    // scanline density, default 600
uniform float u_crt_warp;     // barrel strength, default 0.08
out vec4 fragColor;
void main() {
  float lines = u_crt_lines > 0.0 ? u_crt_lines : 600.0;
  float warp  = u_crt_warp  > 0.0 ? u_crt_warp  : 0.08;
  // barrel distortion
  vec2 uv = v_uv - 0.5;
  float r2 = dot(uv, uv);
  uv *= 1.0 + warp * r2;
  uv += 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  vec4 col = texture(u_prev, uv);
  // rolling scanlines
  float scan = sin((uv.y * lines + u_time * 40.0) * 3.14159) * 0.5 + 0.5;
  col.rgb *= 0.75 + 0.25 * scan;
  // slight green phosphor tint
  col.rgb = mix(col.rgb, col.rgb * vec3(0.9, 1.05, 0.85), 0.3);
  fragColor = col;
}`,

  /** Chromatic aberration / RGB fringe. setUniform('u_aberration', 0..0.01, default 0.004) */
  chromaticAberration: /* glsl */ `#version 300 es
precision mediump float;
in vec2 v_uv;
uniform sampler2D u_prev;
uniform float u_aberration;
out vec4 fragColor;
void main() {
  float amt = u_aberration > 0.0 ? u_aberration : 0.004;
  vec2 dir = v_uv - 0.5;
  float r = texture(u_prev, v_uv + dir * amt * 2.0).r;
  float g = texture(u_prev, v_uv).g;
  float b = texture(u_prev, v_uv - dir * amt * 2.0).b;
  fragColor = vec4(r, g, b, 1.0);
}`,

  /** Palette-shift / hue rotation. u_hue_shift in radians, driven by u_time for animation. */
  hueRotate: /* glsl */ `#version 300 es
precision mediump float;
in vec2 v_uv;
uniform sampler2D u_prev;
uniform float u_hue_shift; // radians; if 0 uses u_time
uniform float u_time;
out vec4 fragColor;
void main() {
  float angle = u_hue_shift != 0.0 ? u_hue_shift : u_time * 0.5;
  vec4 col = texture(u_prev, v_uv);
  // Hue rotate via Rodrigues in YIQ-ish space
  float c = cos(angle), s = sin(angle);
  mat3 m = mat3(
    0.299+0.701*c+0.168*s, 0.587-0.587*c+0.330*s, 0.114-0.114*c-0.497*s,
    0.299-0.299*c-0.328*s, 0.587+0.413*c+0.035*s, 0.114-0.114*c+0.292*s,
    0.299-0.300*c+1.250*s, 0.587-0.588*c-1.050*s, 0.114+0.886*c-0.203*s
  );
  fragColor = vec4(m * col.rgb, col.a);
}`,

  /** Wave distortion (heat haze, underwater). setUniform('u_wave_amp', default 0.003) */
  wave: /* glsl */ `#version 300 es
precision mediump float;
in vec2 v_uv;
uniform sampler2D u_prev;
uniform float u_time;
uniform float u_wave_amp;
uniform float u_wave_freq;
out vec4 fragColor;
void main() {
  float amp  = u_wave_amp  > 0.0 ? u_wave_amp  : 0.003;
  float freq = u_wave_freq > 0.0 ? u_wave_freq : 8.0;
  vec2 uv = v_uv;
  uv.x += sin(uv.y * freq + u_time * 2.5) * amp;
  uv.y += cos(uv.x * freq + u_time * 2.5) * amp;
  fragColor = texture(u_prev, clamp(uv, 0.0, 1.0));
}`,

  // ── Multi-pass bloom building blocks ───────────────────────────────────────
  // Use with setPipeline([brightpass, hblur, vblur, bloomComposite]).

  /** Bloom pass 1/4: extract bright pixels above threshold (default 0.6). */
  bloomBrightpass: /* glsl */ `#version 300 es
precision mediump float;
in vec2 v_uv;
uniform sampler2D u_prev;
uniform float u_bloom_threshold;
out vec4 fragColor;
void main() {
  vec4 col = texture(u_prev, v_uv);
  float lum = dot(col.rgb, vec3(0.2126, 0.7152, 0.0722));
  float thresh = u_bloom_threshold > 0.0 ? u_bloom_threshold : 0.55;
  float weight = smoothstep(thresh - 0.05, thresh + 0.05, lum);
  fragColor = col * weight;
}`,

  /** Bloom pass 2/4: horizontal gaussian blur (13-tap). */
  bloomHBlur: /* glsl */ `#version 300 es
precision mediump float;
in vec2 v_uv;
uniform sampler2D u_prev;
uniform vec2 u_resolution;
uniform float u_bloom_spread;
out vec4 fragColor;
void main() {
  float spread = u_bloom_spread > 0.0 ? u_bloom_spread : 1.0;
  vec2 texel = vec2(spread / u_resolution.x, 0.0);
  const float W[7] = float[](0.0625, 0.125, 0.1875, 0.25, 0.1875, 0.125, 0.0625);
  vec4 sum = vec4(0.0);
  for (int i = 0; i < 7; i++)
    sum += texture(u_prev, clamp(v_uv + float(i-3) * texel, 0.0, 1.0)) * W[i];
  fragColor = sum;
}`,

  /** Bloom pass 3/4: vertical gaussian blur (13-tap). */
  bloomVBlur: /* glsl */ `#version 300 es
precision mediump float;
in vec2 v_uv;
uniform sampler2D u_prev;
uniform vec2 u_resolution;
uniform float u_bloom_spread;
out vec4 fragColor;
void main() {
  float spread = u_bloom_spread > 0.0 ? u_bloom_spread : 1.0;
  vec2 texel = vec2(0.0, spread / u_resolution.y);
  const float W[7] = float[](0.0625, 0.125, 0.1875, 0.25, 0.1875, 0.125, 0.0625);
  vec4 sum = vec4(0.0);
  for (int i = 0; i < 7; i++)
    sum += texture(u_prev, clamp(v_uv + float(i-3) * texel, 0.0, 1.0)) * W[i];
  fragColor = sum;
}`,

  /** Bloom pass 4/4: composite original + blurred bloom. u_bloom_intensity controls strength. */
  bloomComposite: /* glsl */ `#version 300 es
precision mediump float;
in vec2 v_uv;
uniform sampler2D u_scene;
uniform sampler2D u_prev;
uniform float u_bloom_intensity;
out vec4 fragColor;
void main() {
  vec4 scene = texture(u_scene, v_uv);
  vec4 bloom = texture(u_prev, v_uv);
  float intensity = u_bloom_intensity > 0.0 ? u_bloom_intensity : 0.8;
  fragColor = vec4(scene.rgb + bloom.rgb * intensity, scene.a);
}`,
} as const satisfies Record<string, string>;

// Convenience bloom pipeline — the canonical 4-pass setup.
export const BLOOM_PIPELINE: PostProcessPass[] = [
  { shader: WEBGL_EFFECTS.bloomBrightpass },
  { shader: WEBGL_EFFECTS.bloomHBlur },
  { shader: WEBGL_EFFECTS.bloomVBlur },
  { shader: WEBGL_EFFECTS.bloomComposite },
];

// ── WebGL helpers ─────────────────────────────────────────────────────────────

function compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type);
  if (!sh) throw new Error('hayao/webgl: createShader failed');
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`hayao/webgl: shader compile error\n${log}`);
  }
  return sh;
}

function buildProgram(gl: WebGL2RenderingContext, fragSrc: string): WebGLProgram {
  const vert = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const prog = gl.createProgram();
  if (!prog) throw new Error('hayao/webgl: createProgram failed');
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error(`hayao/webgl: program link error\n${log}`);
  }
  return prog;
}

function applyUniform(gl: WebGL2RenderingContext, prog: WebGLProgram, name: string, value: UniformValue): void {
  const loc = gl.getUniformLocation(prog, name);
  if (loc === null) return; // silently ignore unused uniforms
  if (typeof value === 'number') {
    gl.uniform1f(loc, value);
  } else if (value.length === 2) {
    gl.uniform2f(loc, value[0], value[1]);
  } else if (value.length === 3) {
    gl.uniform3f(loc, value[0], value[1], value[2]);
  } else {
    gl.uniform4f(loc, value[0], value[1], value[2], value[3]);
  }
}

interface FboSlot {
  fbo: WebGLFramebuffer;
  tex: WebGLTexture;
}

function makeFboSlot(gl: WebGL2RenderingContext, w: number, h: number): FboSlot {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fbo, tex };
}

// ── WebGL2Renderer ────────────────────────────────────────────────────────────

export interface WebGLRendererConfig extends RendererConfig {
  /**
   * Initial post-processing shader or pipeline. Pass a GLSL string for a
   * single-pass effect, or use setPipeline() for multi-pass. Defaults to
   * passthrough.
   */
  postProcess?: string;
}

/**
 * GPU-accelerated renderer with a programmable GLSL post-processing pipeline.
 *
 * ## Quick start
 * ```ts
 * import { WebGL2Renderer, WEBGL_EFFECTS, BLOOM_PIPELINE } from '@hayao';
 *
 * // Single-pass:
 * const renderer = new WebGL2Renderer({ width, height,
 *   postProcess: WEBGL_EFFECTS.vignette });
 * renderer.setUniform('u_vignette', 0.5);
 *
 * // Multi-pass bloom:
 * const renderer = new WebGL2Renderer({ width, height });
 * renderer.setPipeline(BLOOM_PIPELINE);
 * renderer.setUniform('u_bloom_intensity', 1.2);
 *
 * // Runtime effect swap:
 * renderer.setPostProcess(WEBGL_EFFECTS.crt);
 * renderer.clearPostProcess(); // back to passthrough
 * ```
 *
 * ## Auto-uniforms (available in every shader, every pass)
 * - `uniform float u_time`       — wall-clock seconds (cosmetic, never hashed)
 * - `uniform vec2 u_resolution`  — display canvas size in px (w, h)
 * - `uniform sampler2D u_scene`  — original Canvas2D rasterized frame
 * - `uniform sampler2D u_prev`   — output of the previous pass (= u_scene for pass 0)
 *
 * ## Determinism
 * `u_time` is wall-clock and NOT part of `world.hash()`. The renderer is a
 * pure display-list consumer — it never writes state back into the engine.
 * All verify passes run against `HeadlessRenderer` / `SvgRenderer` and see
 * the same DrawCommand[] regardless of post-processing.
 */
export class WebGL2Renderer implements Renderer {
  readonly width: number;
  readonly height: number;
  private background: string;

  private glCanvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private offscreen: HTMLCanvasElement;
  private ctx2d: CanvasRenderingContext2D;
  private dpr = 1;

  /** Original rasterized scene texture. */
  private sceneTex: WebGLTexture;
  /** Intermediate pass framebuffers (one per non-final pass). */
  private fbos: FboSlot[] = [];
  /** Compiled programs, one per pass. */
  private programs: WebGLProgram[] = [];
  /** Per-pass uniform maps (merged with global uniforms). */
  private passUniforms: Array<Record<string, UniformValue>> = [];
  /** Empty VAO for gl_VertexID-only draws. */
  private vao: WebGLVertexArrayObject;

  /** Frames drawn, driving u_time at a nominal 60 fps (cosmetic, but deterministic). */
  private framesDrawn = 0;
  /** Global custom uniforms applied to every pass. */
  private uniforms = new Map<string, UniformValue>();

  constructor(config: WebGLRendererConfig) {
    this.width = config.width;
    this.height = config.height;
    this.background = config.background ?? '#ffffff';

    this.glCanvas = document.createElement('canvas');
    this.glCanvas.style.width = '100%';
    this.glCanvas.style.height = '100%';
    this.glCanvas.style.objectFit = 'contain';
    this.glCanvas.style.display = 'block';

    const gl = this.glCanvas.getContext('webgl2', { alpha: false, antialias: false, preserveDrawingBuffer: false });
    if (!gl) throw new Error('hayao/webgl: WebGL2 unavailable — fall back to Canvas2DRenderer');
    this.gl = gl;

    this.offscreen = document.createElement('canvas');
    const ctx2d = this.offscreen.getContext('2d');
    if (!ctx2d) throw new Error('hayao/webgl: Canvas2D unavailable for rasterization');
    this.ctx2d = ctx2d;

    this.resize();

    const vao = gl.createVertexArray();
    if (!vao) throw new Error('hayao/webgl: createVertexArray failed');
    this.vao = vao;

    const tex = gl.createTexture();
    if (!tex) throw new Error('hayao/webgl: createTexture failed');
    this.sceneTex = tex;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Default: single passthrough pass.
    this.buildPipeline([{ shader: config.postProcess ?? PASSTHROUGH_FRAG }]);
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.glCanvas);
    this.resize();
  }

  private resize(): void {
    this.dpr = Math.min(3, globalThis.devicePixelRatio || 1);
    const w = Math.round(this.width * this.dpr);
    const h = Math.round(this.height * this.dpr);
    this.glCanvas.width = w;
    this.glCanvas.height = h;
    this.offscreen.width = w;
    this.offscreen.height = h;
    this.gl.viewport(0, 0, w, h);
    // FBOs must be resized too.
    for (const slot of this.fbos) {
      this.gl.bindTexture(this.gl.TEXTURE_2D, slot.tex);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, w, h, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
    }
  }

  private buildPipeline(passes: PostProcessPass[]): void {
    const gl = this.gl;
    const w = this.glCanvas.width || Math.round(this.width * this.dpr);
    const h = this.glCanvas.height || Math.round(this.height * this.dpr);

    // Release old resources.
    for (const p of this.programs) gl.deleteProgram(p);
    for (const s of this.fbos) { gl.deleteFramebuffer(s.fbo); gl.deleteTexture(s.tex); }
    this.programs = [];
    this.fbos = [];
    this.passUniforms = [];

    for (const pass of passes) {
      this.programs.push(buildProgram(gl, pass.shader));
      this.passUniforms.push(pass.uniforms ?? {});
    }

    // Create N-1 intermediate FBOs (final pass renders to screen).
    for (let i = 0; i < passes.length - 1; i++) {
      this.fbos.push(makeFboSlot(gl, w, h));
    }
  }

  draw(commands: DrawCommand[]): void {
    const gl = this.gl;
    const n = this.programs.length;
    const t = this.framesDrawn++ / 60;
    const w = this.glCanvas.width;
    const h = this.glCanvas.height;

    // 1. Rasterize the display list onto the offscreen Canvas2D.
    drawToCanvas2D(this.ctx2d, commands, this.width, this.height, this.background, this.dpr);

    // 2. Upload the rasterized frame to the scene texture (TEXTURE0).
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.offscreen);

    gl.bindVertexArray(this.vao);

    for (let i = 0; i < n; i++) {
      const prog = this.programs[i];
      const isLast = i === n - 1;

      // Target: intermediate FBO or screen.
      if (isLast) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, w, h);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbos[i].fbo);
        gl.viewport(0, 0, w, h);
      }

      gl.useProgram(prog);

      // u_scene = original scene (TEXTURE0).
      gl.uniform1i(gl.getUniformLocation(prog, 'u_scene'), 0);

      // u_prev = previous pass output (TEXTURE1), or scene if first pass.
      gl.activeTexture(gl.TEXTURE1);
      if (i === 0) {
        gl.bindTexture(gl.TEXTURE_2D, this.sceneTex);
      } else {
        gl.bindTexture(gl.TEXTURE_2D, this.fbos[i - 1].tex);
      }
      gl.uniform1i(gl.getUniformLocation(prog, 'u_prev'), 1);
      gl.activeTexture(gl.TEXTURE0);

      // Auto-uniforms.
      gl.uniform1f(gl.getUniformLocation(prog, 'u_time'), t);
      gl.uniform2f(gl.getUniformLocation(prog, 'u_resolution'), w, h);

      // Global custom uniforms.
      for (const [name, val] of this.uniforms) applyUniform(gl, prog, name, val);

      // Per-pass uniforms (override global).
      for (const [name, val] of Object.entries(this.passUniforms[i])) applyUniform(gl, prog, name, val);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  // ── Public control API ────────────────────────────────────────────────────

  /**
   * Set a custom uniform applied to every pass. Useful for knob-driven effect
   * parameters (intensity, scale, colour) without recompiling the shader.
   * The value is set on every draw() until cleared or overridden.
   *
   * ```ts
   * renderer.setUniform('u_vignette', 0.5);
   * renderer.setUniform('u_bloom_intensity', [1.0, 0.8]);
   * ```
   */
  setUniform(name: string, value: UniformValue): this {
    this.uniforms.set(name, value);
    return this;
  }

  /** Remove a custom uniform. */
  clearUniform(name: string): this {
    this.uniforms.delete(name);
    return this;
  }

  /**
   * Replace the post-processing pipeline. Accepts an array of passes; each
   * pass reads `u_prev` (previous output) and `u_scene` (original frame).
   * Throws on shader compile error — previous pipeline stays active.
   *
   * For single-pass effects, prefer `setPostProcess(shader)`. For the standard
   * bloom setup, use `setPipeline(BLOOM_PIPELINE)`.
   *
   * ```ts
   * renderer.setPipeline([
   *   { shader: WEBGL_EFFECTS.bloomBrightpass },
   *   { shader: WEBGL_EFFECTS.bloomHBlur },
   *   { shader: WEBGL_EFFECTS.bloomVBlur },
   *   { shader: WEBGL_EFFECTS.bloomComposite },
   * ]);
   * renderer.setUniform('u_bloom_intensity', 1.0);
   * ```
   */
  setPipeline(passes: PostProcessPass[]): this {
    this.buildPipeline(passes.length ? passes : [{ shader: PASSTHROUGH_FRAG }]);
    return this;
  }

  /**
   * Convenience: set a single-pass post-processing shader.
   * Throws on compile error — previous effect stays active.
   */
  setPostProcess(fragmentShader: string): this {
    return this.setPipeline([{ shader: fragmentShader }]);
  }

  /** Restore passthrough (no post-processing). */
  clearPostProcess(): this {
    return this.setPostProcess(PASSTHROUGH_FRAG);
  }

  get element(): HTMLCanvasElement { return this.glCanvas; }

  toDesign(clientX: number, clientY: number): Vec2 {
    return clientToDesign(this.glCanvas.getBoundingClientRect(), this.width, this.height, clientX, clientY);
  }

  viewport(): Viewport {
    return fitViewport(this.glCanvas.getBoundingClientRect(), this.width, this.height);
  }

  dispose(): void {
    const gl = this.gl;
    gl.deleteTexture(this.sceneTex);
    for (const p of this.programs) gl.deleteProgram(p);
    for (const s of this.fbos) { gl.deleteFramebuffer(s.fbo); gl.deleteTexture(s.tex); }
    gl.deleteVertexArray(this.vao);
    this.glCanvas.remove();
  }
}
