// WebGL2 backend — the GPU display surface for hayao.
//
// Architecture: Canvas2D rasterizes the display list to an offscreen canvas;
// WebGL2 uploads the result as a texture and renders it via a fullscreen quad.
// This gives:
//   1. Pixel-exact parity with Canvas2DRenderer for ALL command types
//      (text, paths, gradients, shadows) with zero per-type GPU code.
//   2. A live GLSL post-processing pipeline: bloom, pixelate, palette rotation,
//      scanlines, glitch — any full-screen effect the fragment shader can do.
//   3. The infrastructure for future instanced primitive batching (replacing the
//      Canvas2D rasterizer for shapes) when entity counts warrant it.
//
// The sim / determinism contract is untouched: the renderer is a pure consumer
// of DrawCommand[] and never feeds state back into the engine.

import type { DrawCommand } from './commands';
import { clientToDesign, fitViewport, type Renderer, type RendererConfig, type Viewport } from './renderer';
import { drawToCanvas2D } from './canvas2d-core';
import type { Vec2 } from '../core/math';

// ── GLSL shaders ─────────────────────────────────────────────────────────────

const VERT_SRC = /* glsl */ `#version 300 es
// Fullscreen quad from gl_VertexID — no vertex buffer needed.
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

/** Default passthrough — scene lands on screen unmodified. */
const DEFAULT_FRAG_SRC = /* glsl */ `#version 300 es
precision mediump float;
in vec2 v_uv;
uniform sampler2D u_scene;
out vec4 fragColor;
void main() {
  fragColor = texture(u_scene, v_uv);
}`;

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

function linkProgram(gl: WebGL2RenderingContext, vert: WebGLShader, frag: WebGLShader): WebGLProgram {
  const prog = gl.createProgram();
  if (!prog) throw new Error('hayao/webgl: createProgram failed');
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error(`hayao/webgl: program link error\n${log}`);
  }
  return prog;
}

function buildProgram(gl: WebGL2RenderingContext, fragSrc: string): WebGLProgram {
  const vert = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const prog = linkProgram(gl, vert, frag);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  return prog;
}

// ── WebGL2Renderer ────────────────────────────────────────────────────────────

export interface WebGLRendererConfig extends RendererConfig {
  /**
   * Custom GLSL fragment shader source for the post-processing pass. The shader
   * must declare `in vec2 v_uv`, `uniform sampler2D u_scene`, and `out vec4
   * fragColor`. The default is a passthrough. See setPostProcess() to change it
   * at runtime.
   */
  postProcess?: string;
}

/**
 * GPU-accelerated renderer. Uses WebGL2 as the display surface and Canvas2D as
 * an offscreen rasterizer, giving pixel-exact parity with Canvas2DRenderer plus
 * a programmable GLSL post-processing pass. Falls back gracefully — throws at
 * construction if WebGL2 is unavailable, so callers can fall back to Canvas2D.
 *
 * Post-processing example (bloom-inspired brightpass glow):
 * ```ts
 * const renderer = new WebGL2Renderer({ width, height, postProcess: `
 *   #version 300 es
 *   precision mediump float;
 *   in vec2 v_uv;
 *   uniform sampler2D u_scene;
 *   out vec4 fragColor;
 *   void main() {
 *     vec4 col = texture(u_scene, v_uv);
 *     float lum = dot(col.rgb, vec3(0.299, 0.587, 0.114));
 *     fragColor = col + vec4(col.rgb * smoothstep(0.7, 1.0, lum) * 0.4, 0.0);
 *   }` });
 * ```
 *
 * Sim contract: determinism is unaffected — this renderer is a pure display-list
 * consumer and never writes state back into the world.
 */
export class WebGL2Renderer implements Renderer {
  readonly width: number;
  readonly height: number;
  private background: string;

  /** The WebGL2 display canvas — shown on screen, attached via mount(). */
  private glCanvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  /** Off-screen Canvas2D rasterizer — never shown in the DOM. */
  private offscreen: HTMLCanvasElement;
  private ctx2d: CanvasRenderingContext2D;
  private dpr = 1;

  /** Texture holding the rasterized scene. */
  private texture: WebGLTexture;
  /** Fullscreen-quad VAO (no vertex data — uses gl_VertexID). */
  private vao: WebGLVertexArrayObject;
  /** Currently active post-processing program. */
  private program: WebGLProgram;

  constructor(config: WebGLRendererConfig) {
    this.width = config.width;
    this.height = config.height;
    this.background = config.background ?? '#ffffff';

    // ── WebGL2 display canvas ────────────────────────────────────────────────
    this.glCanvas = document.createElement('canvas');
    this.glCanvas.style.width = '100%';
    this.glCanvas.style.height = '100%';
    this.glCanvas.style.objectFit = 'contain';
    this.glCanvas.style.display = 'block';

    const gl = this.glCanvas.getContext('webgl2', { alpha: false, antialias: false, preserveDrawingBuffer: false });
    if (!gl) throw new Error('hayao/webgl: WebGL2 unavailable — fall back to Canvas2DRenderer');
    this.gl = gl;

    // ── Off-screen Canvas2D rasterizer ───────────────────────────────────────
    this.offscreen = document.createElement('canvas');
    const ctx2d = this.offscreen.getContext('2d');
    if (!ctx2d) throw new Error('hayao/webgl: Canvas2D unavailable for rasterization');
    this.ctx2d = ctx2d;

    this.resize();

    // ── Shader program + VAO ─────────────────────────────────────────────────
    this.program = buildProgram(gl, config.postProcess ?? DEFAULT_FRAG_SRC);

    // gl_VertexID-only quad needs an empty VAO.
    const vao = gl.createVertexArray();
    if (!vao) throw new Error('hayao/webgl: createVertexArray failed');
    this.vao = vao;

    // ── Scene texture ────────────────────────────────────────────────────────
    const tex = gl.createTexture();
    if (!tex) throw new Error('hayao/webgl: createTexture failed');
    this.texture = tex;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
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
  }

  draw(commands: DrawCommand[]): void {
    const gl = this.gl;

    // 1. Rasterize the display list to the offscreen Canvas2D.
    drawToCanvas2D(this.ctx2d, commands, this.width, this.height, this.background, this.dpr);

    // 2. Upload the rasterized frame as a GPU texture.
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.offscreen);

    // 3. Render the fullscreen quad through the post-processing shader.
    gl.useProgram(this.program);
    gl.uniform1i(gl.getUniformLocation(this.program, 'u_scene'), 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /**
   * Replace the post-processing fragment shader at runtime. The new shader must
   * declare the same interface as the default: `in vec2 v_uv`,
   * `uniform sampler2D u_scene`, `out vec4 fragColor`. Throws on compile error —
   * the previous shader stays active until the new one compiles cleanly.
   *
   * ```ts
   * renderer.setPostProcess(`
   *   #version 300 es
   *   precision mediump float;
   *   in vec2 v_uv;
   *   uniform sampler2D u_scene;
   *   out vec4 fragColor;
   *   void main() {
   *     // 4×4 pixelate
   *     vec2 size = vec2(textureSize(u_scene, 0));
   *     vec2 block = floor(v_uv * size / 4.0) * 4.0 / size;
   *     fragColor = texture(u_scene, block);
   *   }`);
   * ```
   */
  setPostProcess(fragmentShader: string): void {
    const next = buildProgram(this.gl, fragmentShader);
    this.gl.deleteProgram(this.program);
    this.program = next;
  }

  /** Restore the default passthrough shader (no effects). */
  clearPostProcess(): void {
    this.setPostProcess(DEFAULT_FRAG_SRC);
  }

  get element(): HTMLCanvasElement {
    return this.glCanvas;
  }

  toDesign(clientX: number, clientY: number): Vec2 {
    return clientToDesign(this.glCanvas.getBoundingClientRect(), this.width, this.height, clientX, clientY);
  }

  viewport(): Viewport {
    return fitViewport(this.glCanvas.getBoundingClientRect(), this.width, this.height);
  }

  dispose(): void {
    const gl = this.gl;
    gl.deleteTexture(this.texture);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.program);
    this.glCanvas.remove();
  }
}
