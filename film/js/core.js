// core.js : timing helpers, seeded random, paper textures and torn-paper shapes.
'use strict';
const W = 1080, H = 1080, TT = 22.5;
// ?swim=1 : soundtrack variant cut to BTS 'SWIM' (94 BPM); the show scene follows the song's beat
const SWIM = new URLSearchParams(location.search).has('swim');
const cv = document.getElementById('stage');
const ctx = cv.getContext('2d');

// ---------- deterministic random ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// ---------- time helpers ----------
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  lin: x => x,
  io: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  out: x => 1 - Math.pow(1 - x, 3),
  inn: x => x * x * x,
  in2: x => x * x,
  o5: x => 1 - Math.pow(1 - x, 5),
  sine: x => -(Math.cos(Math.PI * x) - 1) / 2,
  back: x => { const c1 = 1.70158, c3 = c1 + 1; return x >= 1 ? 1 : 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
};
// closed-form damped spring step response (0 -> 1), f in Hz, z damping ratio
function spring(t, f = 3, z = 0.5) {
  if (t <= 0) return 0;
  const w = TAU * f;
  if (z >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t));
}
// keyframes: [[t, v], ...] numbers, eased per segment
function kf(t, keys, ease = E.io) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1], [t1, v1, e] = keys[i];
      return lerp(v0, v1, (e || ease)(prog(t, t0, t1)));
    }
  }
  return keys[keys.length - 1][1];
}
// pop-in scale with overshoot (0 before t0)
function pop(t, t0, f = 3.2, z = 0.42) { return spring(t - t0, f, z); }
// smooth 1D value noise for idle drift
function vnoise(x, seed = 1) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  const h = n => { const r = mulberry32((n * 374761393 + seed * 668265263) | 0); return r() * 2 - 1; };
  return lerp(h(i), h(i + 1), u);
}

// ---------- paper textures (pattern per colour, cached) ----------
const texCache = new Map();
function paperPattern(color) {
  let p = texCache.get(color);
  if (p) return p;
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d');
  g.fillStyle = color; g.fillRect(0, 0, N, N);
  const r = mulberry32(hashStr(color));
  // soft mottling (tileable: integer periods)
  const img = g.getImageData(0, 0, N, N), d = img.data;
  const ph = [r() * TAU, r() * TAU, r() * TAU, r() * TAU];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const m = Math.sin(TAU * x / N + ph[0] + Math.sin(TAU * y / N + ph[1]) * 1.3) * 1.6
            + Math.sin(TAU * y / N * 2 + ph[2] + Math.sin(TAU * x / N * 2 + ph[3]) * 1.1) * 1.2;
    const n = (r() - .5) * 12 + m;
    const i = (y * N + x) * 4;
    d[i] = clamp(d[i] + n, 0, 255); d[i + 1] = clamp(d[i + 1] + n, 0, 255); d[i + 2] = clamp(d[i + 2] + n * .9, 0, 255);
  }
  g.putImageData(img, 0, 0);
  // fibres
  for (let k = 0; k < 70; k++) {
    const x = r() * N, y = r() * N, a = r() * TAU, l = 6 + r() * 18, light = r() < .55;
    g.strokeStyle = light ? 'rgba(255,250,240,.16)' : 'rgba(60,35,25,.08)';
    g.lineWidth = .6 + r() * .7;
    for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) {
      g.beginPath(); g.moveTo(x + ox, y + oy);
      g.quadraticCurveTo(x + ox + Math.cos(a) * l * .5 + (r() - .5) * 4, y + oy + Math.sin(a) * l * .5 + (r() - .5) * 4,
        x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l);
      g.stroke();
    }
  }
  p = ctx.createPattern(c, 'repeat');
  texCache.set(color, p);
  return p;
}

// ---------- outlines ----------
function sEllipse(cx, cy, rx, ry, a0 = 0, a1 = TAU, step = 5) {
  const per = Math.PI * (rx + ry) * Math.abs(a1 - a0) / TAU;
  const n = Math.max(24, Math.ceil(per / step));
  const pts = [];
  for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return pts;
}
function sRRect(x, y, w, h, r, step = 5) {
  r = Math.min(r, w / 2, h / 2);
  const pts = [];
  const arc = (cx, cy, a0) => { const n = Math.max(3, Math.ceil(r * Math.PI / 2 / step)); for (let i = 0; i <= n; i++) { const a = a0 + Math.PI / 2 * i / n; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  arc(x + w - r, y + r, -Math.PI / 2); arc(x + w - r, y + h - r, 0); arc(x + r, y + h - r, Math.PI / 2); arc(x + r, y + r, Math.PI);
  return resample(pts, step);
}
function chaikin(pts, it = 2) {
  for (let k = 0; k < it; k++) {
    const o = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      o.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]);
    }
    pts = o;
  }
  return pts;
}
function resample(pts, step = 5) {
  const o = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(l / step));
    for (let j = 0; j < n; j++) o.push([lerp(a[0], b[0], j / n), lerp(a[1], b[1], j / n)]);
  }
  return o;
}
function sPoly(pts, smooth = 2, step = 5) { return resample(smooth ? chaikin(pts, smooth) : pts, step); }

// torn-paper offset: closed smooth noise along the perimeter
function tornPath(pts, seed, amp, off = 0) {
  const r = mulberry32(seed);
  const n = pts.length;
  const cum = [0];
  for (let i = 1; i <= n; i++) { const a = pts[i - 1], b = pts[i % n]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const L = cum[n] || 1;
  const terms = [];
  for (let k = 0; k < 5; k++) {
    const wl = [140, 70, 38, 20, 11][k];
    terms.push([Math.max(1, Math.round(L / wl)), r() * TAU, amp * [0.9, 0.6, 0.45, 0.3, 0.2][k] * (0.6 + r() * 0.8)]);
  }
  const p = new Path2D();
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    let nx = b[1] - a[1], ny = -(b[0] - a[0]);
    const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    const s = cum[i] / L;
    let d = off;
    for (const [f, ph, A] of terms) d += A * Math.sin(TAU * f * s + ph);
    d += (r() - .5) * amp * .25;
    const x = pts[i][0] + nx * d, y = pts[i][1] + ny * d;
    i ? p.lineTo(x, y) : p.moveTo(x, y);
  }
  p.closePath();
  return p;
}
// orientation sign so that "off" always pushes outward
function polyArea(pts) { let s = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }

const shapeCache = new Map();
// returns {main, rim}; geometry fn called once
function shape(id, gen, opt = {}) {
  let s = shapeCache.get(id);
  if (s) return s;
  const pts = gen();
  const sign = polyArea(pts) > 0 ? -1 : 1; // canvas y-down: positive area = clockwise
  const amp = opt.amp ?? 1.4, rimW = opt.rim ?? 3.2, seed = hashStr(id);
  s = {
    main: tornPath(pts, seed, amp, 0),
    rim: rimW > 0 ? tornPath(pts, seed + 7, amp * 1.7, sign * rimW) : null,
  };
  shapeCache.set(id, s);
  return s;
}

const RIM = '#fbf4ea';
const INK = '#3a2622';
let SHADOWS = true;
function curScale() { const m = ctx.getTransform(); return Math.hypot(m.a, m.b) / (cv.width / W); }
// draw a paper piece: soft-ish layered offset shadow (screen-space light) + torn cream rim + textured fill
function shadowFill(path, k, alpha = 1) {
  const m = ctx.getTransform(), det = m.a * m.d - m.b * m.c;
  if (!det) return;
  const sc = cv.width / W;
  for (const [f, al] of [[1.0, .10], [0.55, .12], [0.25, .08]]) {
    const dx = 1.6 * f * k * sc, dy = 4.2 * f * k * sc;
    const lx = (m.d * dx - m.c * dy) / det, ly = (-m.b * dx + m.a * dy) / det;
    ctx.save(); ctx.translate(lx, ly); ctx.fillStyle = `rgba(74,38,26,${al * alpha})`; ctx.fill(path); ctx.restore();
  }
}
function paper(s, color, o = {}) {
  const k = (o.sh ?? 1) * Math.min(3, curScale());
  if (s.rim && o.rim !== false) {
    if (SHADOWS && o.shadow !== false) shadowFill(s.rim, k);
    ctx.fillStyle = paperPattern(o.rimColor || RIM); ctx.fill(s.rim);
  } else if (SHADOWS && o.shadow === true) shadowFill(s.main, k);
  ctx.fillStyle = o.flat ? color : paperPattern(color);
  ctx.fill(s.main);
}
// quick helpers that build + draw in one call (id must be unique per geometry)
function pEll(id, cx, cy, rx, ry, color, o = {}) { paper(shape(id, () => sEllipse(cx, cy, rx, ry), o), color, o); }
function pRect(id, x, y, w, h, r, color, o = {}) { paper(shape(id, () => sRRect(x, y, w, h, r), o), color, o); }
function pPoly(id, pts, color, o = {}) { paper(shape(id, () => sPoly(pts, o.smooth ?? 2), o), color, o); }

function withT(x, y, rot, sx, sy, fn) {
  ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); if (sx !== 1 || sy !== 1) ctx.scale(sx, sy ?? sx); fn(); ctx.restore();
}

// ---------- text ----------
function text(str, x, y, size, color, o = {}) {
  ctx.save();
  ctx.font = `${o.weight || 600} ${size}px ${o.font || 'Fredoka'}`;
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
  if (o.rot) { ctx.translate(x, y); ctx.rotate(o.rot); x = 0; y = 0; }
  if (o.ls) ctx.letterSpacing = o.ls + 'px';
  ctx.fillStyle = color; ctx.fillText(str, x, y);
  ctx.restore();
}
// paper cut letters: each glyph on its own torn cream backing
function cutText(id, str, x, y, size, color, o = {}) {
  ctx.save();
  ctx.font = `700 ${size}px ${o.font || 'Fredoka'}`;
  const widths = [...str].map(ch => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + (str.length - 1) * (o.gap ?? size * .04);
  let cx = x - total / 2;
  const r = mulberry32(hashStr(id));
  [...str].forEach((ch, i) => {
    const w = widths[i], gx = cx + w / 2, rot = (r() - .5) * (o.wob ?? .12), dy = (r() - .5) * size * .06;
    cx += w + (o.gap ?? size * .04);
    if (ch === ' ') return;
    const a = o.appear ? o.appear(i) : 1;
    if (a <= 0) return;
    withT(gx, y + dy, rot, a, a, () => {
      if (o.back !== false) pRect(`${id}#${i}`, -w / 2 - size * .1, -size * .58, w + size * .2, size * 1.1, size * .16, o.backColor || RIM, { rim: 0, shadow: true, amp: 1.2 });
      ctx.font = `700 ${size}px ${o.font || 'Fredoka'}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = color; ctx.fillText(ch, 0, size * .04);
    });
  });
  ctx.restore();
}
