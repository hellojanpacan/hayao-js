// SVG sanitize for the rasterizer — works around a real @resvg/resvg-js 2.6.2 bug.
//
// resvg panics (SIGABRT at crates/resvg/src/geom.rs:27, `Option::unwrap()` on a
// None) when an element with `opacity < 1` has a bounding box ENTIRELY off-canvas:
// the element opacity forces an isolation layer, resvg sizes that layer to the
// shape∩canvas rect, that rect is empty, and `NonZeroRect` unwraps None. (Verified
// minimally: off-canvas + opacity<1 → panic; opacity=1, or on/partially-on-canvas
// → fine, regardless of shape or fill.)
//
// A fully-off-canvas element contributes NOTHING to the rendered image, so removing
// it is lossless. We only touch translucent (`opacity<1`) elements we can prove are
// off-canvas — the exact trigger, minimal blast radius. Anything we can't bound is
// left alone (the judge's per-process isolation is the backstop). Our renderer emits
// a flat list with `transform="matrix(...)"`, which is all this needs to handle.

const num = (el, name) => {
  const m = el.match(new RegExp(`\\b${name}="(-?[\\d.eE]+)"`));
  return m ? parseFloat(m[1]) : undefined;
};

const matrixOf = (el) => {
  const m = el.match(/transform="matrix\(([-\d.eE\s]+)\)"/);
  if (!m) return [1, 0, 0, 1, 0, 0];
  const n = m[1].trim().split(/\s+/).map(Number);
  return n.length === 6 && n.every(Number.isFinite) ? n : [1, 0, 0, 1, 0, 0];
};

/**
 * Real bounding box of a path `d`, walking commands and collecting endpoints AND
 * control points (a Bézier lies inside its control hull → this over-bounds, never
 * under-bounds → it never false-culls). Arcs are bounded conservatively by ±r
 * around their endpoints. Handles absolute + relative commands. Null if empty.
 */
function pathBounds(d) {
  const tk = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g);
  if (!tk) return null;
  let i = 0, cx = 0, cy = 0, sx = 0, sy = 0, cmd = '';
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const add = (x, y) => { if (Number.isFinite(x) && Number.isFinite(y)) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); } };
  const n = () => parseFloat(tk[i++]);
  while (i < tk.length) {
    if (/[a-zA-Z]/.test(tk[i])) { cmd = tk[i++]; }
    else if (!cmd) { i++; continue; }
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const bx = rel ? cx : 0, by = rel ? cy : 0;
    if (C === 'M') { cx = bx + n(); cy = by + n(); sx = cx; sy = cy; add(cx, cy); cmd = rel ? 'l' : 'L'; }
    else if (C === 'L') { cx = bx + n(); cy = by + n(); add(cx, cy); }
    else if (C === 'H') { cx = bx + n(); add(cx, cy); }
    else if (C === 'V') { cy = by + n(); add(cx, cy); }
    else if (C === 'C') { add(bx + n(), by + n()); add(bx + n(), by + n()); cx = bx + n(); cy = by + n(); add(cx, cy); }
    else if (C === 'S' || C === 'Q') { add(bx + n(), by + n()); cx = bx + n(); cy = by + n(); add(cx, cy); }
    else if (C === 'T') { cx = bx + n(); cy = by + n(); add(cx, cy); }
    else if (C === 'A') { const rx = n(), ry = n(); n(); n(); n(); cx = bx + n(); cy = by + n(); add(cx - rx, cy - ry); add(cx + rx, cy + ry); }
    else if (C === 'Z') { cx = sx; cy = sy; }
    else { i++; }
  }
  return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : null;
}

/** Local-space [[minX,minY],[maxX,maxY]] for one element, or null if unknown. */
function localBounds(tag, el) {
  const p = (num(el, 'stroke-width') ?? 0) / 2; // stroke overhangs the geometry
  const pick = (...ns) => ns.every((v) => v !== undefined);
  if (tag === 'circle') {
    const cx = num(el, 'cx') ?? 0, cy = num(el, 'cy') ?? 0, r = (num(el, 'r') ?? 0) + p;
    return [[cx - r, cy - r], [cx + r, cy + r]];
  }
  if (tag === 'ellipse') {
    const cx = num(el, 'cx') ?? 0, cy = num(el, 'cy') ?? 0, rx = (num(el, 'rx') ?? 0) + p, ry = (num(el, 'ry') ?? 0) + p;
    return [[cx - rx, cy - ry], [cx + rx, cy + ry]];
  }
  if (tag === 'rect') {
    const x = (num(el, 'x') ?? 0) - p, y = (num(el, 'y') ?? 0) - p, w = (num(el, 'width') ?? 0) + p * 2, h = (num(el, 'height') ?? 0) + p * 2;
    return [[x, y], [x + w, y + h]];
  }
  if (tag === 'line') {
    const x1 = num(el, 'x1') ?? 0, y1 = num(el, 'y1') ?? 0, x2 = num(el, 'x2') ?? 0, y2 = num(el, 'y2') ?? 0;
    return [[Math.min(x1, x2) - p, Math.min(y1, y2) - p], [Math.max(x1, x2) + p, Math.max(y1, y2) + p]];
  }
  if (tag === 'polygon' || tag === 'polyline') {
    const raw = (el.match(/points="([^"]*)"/) || [])[1];
    if (!raw) return null;
    const n = raw.trim().split(/[\s,]+/).map(Number);
    const xs = [], ys = [];
    for (let i = 0; i + 1 < n.length; i += 2) { xs.push(n[i]); ys.push(n[i + 1]); }
    if (!xs.length) return null;
    return [[Math.min(...xs) - p, Math.min(...ys) - p], [Math.max(...xs) + p, Math.max(...ys) + p]];
  }
  if (tag === 'path') {
    const d = (el.match(/\bd="([^"]*)"/) || [])[1];
    if (!d) return null;
    const b = pathBounds(d);
    if (!b) return null;
    return [[b.minX - p, b.minY - p], [b.maxX + p, b.maxY + p]];
  }
  if (tag === 'text') {
    const x = num(el, 'x') ?? 0, y = num(el, 'y') ?? 0, size = num(el, 'font-size') ?? num(el, 'size') ?? 16;
    const t = (el.match(/>([^<]*)</) || [])[1] || '';
    const w = Math.max(size, t.length * size * 0.7); // anchor unknown → widen both ways
    return [[x - w, y - size], [x + w, y + size]];
  }
  return null;
}

function worldBox(tag, el) {
  const b = localBounds(tag, el);
  if (!b) return null;
  const [a, bb, c, d, e, f] = matrixOf(el);
  const corners = [[b[0][0], b[0][1]], [b[1][0], b[0][1]], [b[0][0], b[1][1]], [b[1][0], b[1][1]]].map(([x, y]) => [a * x + c * y + e, bb * x + d * y + f]);
  const xs = corners.map((q) => q[0]), ys = corners.map((q) => q[1]);
  if (![...xs, ...ys].every(Number.isFinite)) return null;
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

/**
 * Remove elements proven to lie entirely outside the canvas that ALSO force an
 * isolation layer (`opacity<1`, `filter`, `mask`, or `clip-path`) — the exact
 * resvg panic trigger (an empty canvas-clipped layer region). It is lossless: an
 * off-canvas element draws nothing. Returns `{ svg, culled }`. Elements we can't
 * bound, or that don't force a layer, are untouched (the harness's per-process
 * isolation remains the backstop). Filtered elements get a wide margin so a shape
 * whose blur still reaches the canvas (and so does NOT panic) is never culled.
 */
export function cullOffCanvasLayers(svg) {
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const W = vb ? parseFloat(vb[1]) : parseFloat((svg.match(/\bwidth="([\d.]+)"/) || [])[1]) || 1280;
  const H = vb ? parseFloat(vb[2]) : parseFloat((svg.match(/\bheight="([\d.]+)"/) || [])[1]) || 720;
  const M = 4; // base safety margin (px)
  const FILTER_PAD = 256; // filters (blur/shadow) grow the visible region — cull only when far off
  let culled = 0;
  const out = svg.replace(/<(circle|rect|ellipse|line|polygon|polyline|path|text)\b[^>]*?(?:\/>|>[\s\S]*?<\/\1>)/g, (el, tag) => {
    const op = num(el, 'opacity');
    const filtered = /\b(?:filter|mask|clip-path)="[^"]/.test(el);
    if (!(filtered || (op !== undefined && op < 1))) return el; // only layer-forcing elements can trip it
    const box = worldBox(tag, el);
    if (!box) return el; // unbounded → leave it; isolation is the backstop
    const pad = M + (filtered ? FILTER_PAD : 0);
    const off = box.maxX < -pad || box.minX > W + pad || box.maxY < -pad || box.minY > H + pad;
    if (off) { culled++; return ''; }
    return el;
  });
  return { svg: out, culled };
}
