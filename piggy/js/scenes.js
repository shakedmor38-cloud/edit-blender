// scenes.js : backgrounds, effects, the four scenes, lyrics and the scene timeline
'use strict';

// ---------- shared drawing ----------
function sunburst(g, cx, cy, n, rot, c1, c2) {
  g.fillStyle = c1; g.fillRect(-400, -400, W + 800, H + 800);
  g.fillStyle = c2;
  const R = 2600;
  for (let i = 0; i < n; i += 2) {
    const a0 = rot + i / n * TAU, a1 = rot + (i + 1) / n * TAU;
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R);
    g.lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R); g.closePath(); g.fill();
  }
}
function cloud(g, x, y, s, fill = '#fff', lw = 7) {
  const parts = [[0, 0, 1], [-.9, .25, .7], [.9, .22, .75], [-.4, -.45, .72], [.45, -.4, .66], [1.6, .4, .45], [-1.55, .45, .42]];
  g.save(); g.translate(x, y); g.scale(s, s);
  if (lw) {
    g.beginPath(); for (const [px, py, r] of parts) { g.moveTo(px * 60 + r * 60 + lw / s, py * 60); g.arc(px * 60, py * 60, r * 60 + lw / s, 0, TAU); }
    g.fillStyle = INK; g.fill();
  }
  g.beginPath(); for (const [px, py, r] of parts) { g.moveTo(px * 60 + r * 60, py * 60); g.arc(px * 60, py * 60, r * 60, 0, TAU); }
  g.fillStyle = fill; g.fill();
  g.beginPath(); for (const [px, py, r] of parts) { g.moveTo(px * 60 + r * 45, py * 60 + 20); g.arc(px * 60, py * 60 + 20, r * 45, 0, TAU); }
  g.fillStyle = 'rgba(160,190,230,.18)'; g.fill();
  g.restore();
}
function star(g, x, y, r, rot, fill, lw = 0) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot + i / 10 * TAU - Math.PI / 2, rr = i % 2 ? r * .45 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath(); g.fillStyle = fill; g.fill();
  if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke(); }
}
function heart(g, x, y, s, fill, lw = 0, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.beginPath(); g.moveTo(0, 18);
  g.bezierCurveTo(-34, -6, -22, -34, 0, -18); g.bezierCurveTo(22, -34, 34, -6, 0, 18);
  g.closePath(); g.fillStyle = fill; g.fill();
  if (lw) { g.lineWidth = lw / s; g.strokeStyle = INK; g.stroke(); }
  g.restore();
}
function hill(g, y, c1, c2) {
  g.beginPath(); g.moveTo(-50, y + 90);
  g.bezierCurveTo(250, y - 40, 830, y - 40, W + 50, y + 90); g.lineTo(W + 50, H + 700); g.lineTo(-50, H + 700); g.closePath();
  const gr = g.createLinearGradient(0, y, 0, H); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
  g.fillStyle = gr; g.fill(); g.lineWidth = 9; g.strokeStyle = INK; g.stroke();
}
function flower(g, x, y, s, t, seed, col) {
  const b = Math.sin(beatPhase(t) * Math.PI * 2 + seed) * .12;
  g.save(); g.translate(x, y); g.rotate(b); g.scale(s, s);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -46); g.lineWidth = 6; g.strokeStyle = '#2f7a3d'; g.stroke();
  g.translate(0, -50);
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + seed; blob(g, Math.cos(a) * 15, Math.sin(a) * 15, 13, 13, col, 4); }
  blob(g, 0, 0, 10, 10, '#ffd23f', 4);
  g.restore();
}
// deterministic particle burst: every particle has a launch angle/speed, gravity and lifetime
function burst(g, t, t0, o) {
  const dt = t - t0; if (dt < 0 || dt > (o.life || 1)) return;
  const r = mulberry32(o.seed || 1);
  for (let i = 0; i < o.n; i++) {
    const a = (o.a0 ?? 0) + (o.spread ?? TAU) * (r() - .5);
    const sp = o.speed * (.45 + r() * .75), life = (o.life || 1) * (.6 + r() * .4);
    if (dt > life) { r(); r(); continue; }
    const d0 = o.r0 || 0, x = o.x + Math.cos(a) * (d0 + sp * dt), y = o.y + Math.sin(a) * (d0 + sp * dt) + .5 * (o.grav || 0) * dt * dt;
    const k = dt / life, sz = o.size * (.6 + r() * .7), rot = r() * TAU + dt * 6;
    g.globalAlpha = 1 - Math.pow(k, 3);
    o.draw(g, x, y, sz * (o.grow ? 1 + k * o.grow : 1 - k * .3), rot, i);
    g.globalAlpha = 1;
  }
}
const CONF = ['#ff3d7f', '#ffd23f', '#4fc3ff', '#7cdb6a', '#b388ff', '#ff8a3d'];
function confetti(g, t, t0, n, seed, fallTime = 2.4) {
  if (t < t0) return;
  const r = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    const x0 = r() * W, d = r() * .5, v = 600 + r() * 700, sway = 30 + r() * 50, ph = r() * TAU, c = CONF[(r() * CONF.length) | 0];
    const dt = t - t0 - d; if (dt < 0) continue;
    const y = -60 - r() * 300 + v * dt, x = x0 + Math.sin(dt * 3 + ph) * sway;
    if (y > H + 60) continue;
    g.save(); g.translate(x, y); g.rotate(dt * 5 + ph); g.scale(1, Math.cos(dt * 7 + ph));
    g.fillStyle = c; g.fillRect(-13, -7, 26, 14); g.restore();
  }
}

// ---------- pig motion ----------
const TADA_HOLD = [[TADA[0], .78], [TADA[1], .52], [TADA[2], .36]];
function tadaEnv(t, list = TADA_HOLD) {
  let v = 0;
  for (const [t0, d] of list) v = Math.max(v, prog(t, t0 - .03, t0 + .05) * (1 - prog(t, t0 + d, t0 + d + .12)));
  return v;
}
// dance pose on the beat grid; o: { off, amp, sing, seed, arms ('wave'|'up'|'side') }
function dance(t, o = {}) {
  const ph = beatPhase(t) + (o.off || 0), k = Math.floor(ph), f = ph - k;
  const air = 1 - Math.pow(2 * f - 1, 2), amp = o.amp ?? 60;
  const side = k % 2 ? 1 : -1;
  const r = mulberry32((o.seed || 1) * 977);
  const blinkAt = 0.4 + r() * 1.2;
  const bp = ((t + (o.seed || 0) * .7) % 2.3);
  const sw = Math.sin(Math.PI * f);
  let arms;
  if (o.arms === 'up') arms = [2.4 + sw * .4, 2.4 + sw * .4];
  else if (o.arms === 'side') arms = [1.1 + sw * .3, 1.1 + sw * .3];
  else arms = [.5 + (side < 0 ? sw * 1.9 : sw * .3), .5 + (side > 0 ? sw * 1.9 : sw * .3)];
  return {
    hop: air * amp,
    squash: .12 * Math.exp(-f * 14) - .05 * air,
    tilt: side * sw * .13,
    arms, ear: .55 * Math.exp(-f * 9) - air * .5,
    tail: t * 14 + (o.seed || 0),
    mouth: clamp(voc(t) * (o.sing ?? 1.25)),
    blink: Math.abs(bp - blinkAt) < .07 ? 1 : 0,
    legs: air,
  };
}
// 'pigur!' : a ring of stars bursts around a pig
function tadaStars(g, t, t0, x, y, R, seed, n = 12) {
  burst(g, t, t0, { x, y, n, seed, r0: R * 1.15, speed: R * 3, size: R / 200, life: .75, grav: 400,
    draw: (g2, px, py, sz, rot, j) => star(g2, px, py, 34 * sz, rot, ['#ffe14d', '#fff', '#ff6f9c'][j % 3], 4) });
}

// ---------- lyrics ----------
const FONT = (px) => `700 ${px}px Fredoka`;
function wordStyle(g, txt, x, y, px, fill, alpha = 1) {
  g.font = FONT(px); g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl';
  g.globalAlpha = alpha;
  g.lineJoin = 'round';
  g.fillStyle = 'rgba(40,10,30,.35)'; g.fillText(txt, x + 6, y + 10);
  g.lineWidth = px * .2; g.strokeStyle = INK; g.strokeText(txt, x, y);
  g.fillStyle = fill; g.fillText(txt, x, y);
  g.globalAlpha = 1;
}
function drawLyrics(g, t) {
  for (const L of LINES) {
    if (t < L.show || t > L.hide + .25) continue;
    const rows = L.rows || [L.words.length];
    const base = rows.length > 1 ? 104 : 130, gap = base * .4, rowH = base * 1.18;
    const inS = spring(t - L.show, 2.6, .55), out = prog(t, L.hide, L.hide + .22);
    const yTop = 300 - (rows.length - 1) * rowH / 2;
    let wi = 0;
    rows.forEach((n, ri) => {
      const ws = L.words.slice(wi, wi + n);
      g.font = FONT(base);
      const widths = ws.map(([w]) => g.measureText(w).width);
      let total = widths.reduce((a, b) => a + b, 0) + gap * (n - 1);
      const fit = Math.min(1, 900 / total); total *= fit;
      let x = W / 2 + total / 2;  // right edge: Hebrew reads right to left
      ws.forEach(([w, tw], j) => {
        const idx = wi + j, next = idx + 1 < L.words.length ? L.words[idx + 1][1] : L.hide;
        const ww = widths[j] * fit, cx = x - ww / 2;
        x -= ww + gap * fit;
        const sung = t >= tw, active = sung && t < next;
        const p = sung ? spring(t - tw, 3.4, .38) : 0;
        const sc = (sung ? .85 + .15 * p + (active ? (rows.length > 1 ? .08 : .16) * (1 - prog(t, tw + .1, next)) : 0) : .82) * inS * (1 - out * .15);
        const y = yTop + ri * rowH - (active ? 18 * Math.exp(-(t - tw) * 7) : 0) - E.inn(out) * 90;
        g.save(); g.translate(cx, y); g.scale(sc, sc); g.rotate(active ? Math.sin((t - tw) * 18) * .05 * Math.exp(-(t - tw) * 4) : 0);
        wordStyle(g, w, 0, 0, base * fit, active ? '#ffe14d' : '#fff', (sung ? 1 : .5) * (1 - out));
        g.restore();
      });
      wi += n;
    });
  }
}

// ---------- camera ----------
function camera(g, t, cx, cy, z, rot = 0) {
  let punch = 0;
  for (const a of ACCENTS) punch += hit(t, a, 10) * .035;
  const sh = hit(t, KICK, 7) * 22 + hit(t, TADA[2], 6) * 14;
  const sx = vnoise(t * 30, 3) * sh, sy = vnoise(t * 30, 9) * sh;
  g.translate(W / 2 + sx, H / 2 + sy); g.scale(z * (1 + punch), z * (1 + punch)); g.rotate(rot); g.translate(-cx, -cy);
}

// ---------- scene A : hello piggy (sky) ----------
function sceneA(g, t) {
  g.save(); camera(g, t, W / 2, H / 2, lerp(1.06, 1.0, E.out(prog(t, 0, 1.2))) + prog(t, 2.15, 3.2) * .06);
  sunburst(g, W / 2, 1150, 24, t * .18, '#8fd6ff', '#a9e2ff');
  cloud(g, 170 + t * 30, 640, 1.2); cloud(g, 900 - t * 22, 470, .9); cloud(g, 1000 - t * 18, 900, .7);
  for (let i = 0; i < 9; i++) {
    const r = mulberry32(40 + i), x = r() * W, y = 250 + r() * 900, tw = .5 + .5 * Math.sin(t * 6 + i * 2);
    star(g, x, y, 10 + tw * 12, t + i, 'rgba(255,255,255,.9)');
  }
  hill(g, 1560, '#86e07a', '#4fb35a');
  const fl = [[80, 1760, 1.1, '#ff6f9c'], [200, 1870, .9, '#fff'], [980, 1750, 1.05, '#ffd23f'], [880, 1890, .95, '#ff6f9c'], [40, 1930, .8, '#b388ff'], [1040, 1930, .9, '#fff']];
  fl.forEach(([x, y, s, c], i) => flower(g, x, y, s, t, i * 1.3, c));
  // pig pops up from behind the hill, then dances
  const R = 255, gx = W / 2, gy = 1705;
  const enter = spring(t, 2.4, .5), yIn = lerp(700, 0, enter);
  const d = dance(t, { amp: 70 * prog(t, .25, .5), seed: 1 });
  const pf = tadaEnv(t);
  // 'pigur' : a hop with both arms up
  const lean = 0, tadaHop = Math.sin(clamp((t - TADA[0]) / .4) * Math.PI) * 120;
  g.save(); g.translate(gx, gy + yIn - d.hop - tadaHop);
  // ground shadow
  g.save(); g.translate(0, d.hop); blob(g, 0, 8, R * (.95 - d.hop / 600), R * .17, 'rgba(30,70,30,.28)', 0); g.restore();
  g.rotate(lean);
  drawPig(g, { R, ...d, happy: pf > .2 || t > 2.95 ? 1 : 0, arms: t < .3 || pf > .2 ? [2.6, 2.6] : d.arms });
  g.restore();
  // hearts float off the dancing pig
  for (const [t0, s] of [[.61, 1], [1.62, -1]]) burst(g, t, t0, { x: gx + s * 300, y: gy - 560, n: 5, seed: t0 * 100, speed: 220, a0: -Math.PI / 2, spread: 1.4, grav: -120, size: 1.1, life: 1.1,
    draw: (g2, x, y, sz, rot) => heart(g2, x, y, sz, '#ff5c93', 5, Math.sin(rot) * .3) });
  tadaStars(g, t, TADA[0], gx, gy - R * 1.6 - tadaHop, R, 11, 16);
  g.restore();
  // a cloud rushes at the camera: wipe into scene B
  cloudWipe(g, prog(t, 2.86, 3.31), 21);
  drawLyrics(g, t);
}

// cover the frame with expanding cloud puffs (p 0..1); fully white at p=1
function cloudWipe(g, p, seed) {
  if (p <= 0) return;
  const r = mulberry32(seed);
  const e = E.inn(p) * .4 + E.io(p) * .6;
  for (let i = 0; i < 26; i++) {
    const x = r() * W, y = 300 + r() * 1400, s = (.8 + r() * 1.2) * (e * 9);
    const d = r() * .35; if (p < d) continue;
    cloud(g, x, y, s * prog(p, d, 1) + .01, '#fff', 0);
  }
  if (p > .85) { g.fillStyle = `rgba(255,255,255,${prog(p, .85, 1)})`; g.fillRect(0, 0, W, H); }
}
function cloudClear(g, p, seed) {
  // reverse of the wipe: big puffs drift outward and thin
  if (p >= 1) return;
  const r = mulberry32(seed);
  g.fillStyle = `rgba(255,255,255,${1 - E.out(prog(p, 0, .35))})`; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 16; i++) {
    const a = r() * TAU, d0 = 100 + r() * 500, s = 3 + r() * 3;
    const k = E.out(p), x = W / 2 + Math.cos(a) * (d0 + k * 1300), y = H / 2 + Math.sin(a) * (d0 + k * 1500);
    g.globalAlpha = 1 - k; cloud(g, x, y, s * (1 + k), '#fff', 0); g.globalAlpha = 1;
  }
}

// ---------- scene B : mud party (two piggies) ----------
function puddle(g, x, y, w, t) {
  const wob = 1 + hit(t, 3.38, 6) * .1 + hit(t, 5.0, 6) * .1;
  blob(g, x, y, w * wob, w * .2 * wob, '#8a5232', 8);
  blob(g, x - w * .2, y - w * .04, w * .45, w * .07, '#a56a44', 0);
  blob(g, x + w * .35, y + w * .03, w * .18, w * .035, 'rgba(255,255,255,.25)', 0);
}
function mudSplash(g, t, t0, x, y, seed, big = 1) {
  burst(g, t, t0, { x, y, n: 16, seed, speed: 900 * big, a0: -Math.PI / 2, spread: 2.4, grav: 2600, size: 18 * big, life: .7,
    draw: (g2, px, py, sz) => blob(g2, px, py, sz, sz * .9, '#8a5232', 4) });
}
const BPIGS = { main: { x: 335, R: 200, pal: 'pink' }, pal: { x: 760, R: 185, pal: 'rose', acc: 'bow' } };
function sceneB(g, t) {
  g.save(); camera(g, t, W / 2, H / 2 + 60, 1.02 + prog(t, 3.31, 5.6) * .05);
  sunburst(g, W / 2, 1200, 20, -t * .22, '#ffd56b', '#ffe596');
  blob(g, 880, 620, 105, 105, '#fff3b0', 9);           // sun
  for (let i = 0; i < 6; i++) { const r = mulberry32(70 + i); heart(g, r() * W, 500 + r() * 600 - ((t * 60 + i * 90) % 300), .9 + r() * .6, 'rgba(255,120,160,.45)'); }
  cloud(g, 150 + t * 25, 560, .9);
  hill(g, 1500, '#9be36f', '#5fb84a');
  const fl = [[60, 1680, 1, '#fff'], [1020, 1670, 1.1, '#ff6f9c'], [110, 1900, .9, '#b388ff'], [980, 1905, .95, '#ffd23f']];
  fl.forEach(([x, y, s, c], i) => flower(g, x, y, s, t, i * 2.1, c));
  puddle(g, W / 2, 1745, 500, t);
  const gy = 1750;
  // main pig: big jump into the mud on 'ze' (already airborne as the cloud clears)
  const m = BPIGS.main, d1 = dance(t, { amp: 55, seed: 2 });
  const jumpIn = t < 3.38 ? (1 - Math.pow((t - 3.14) / .24 * 2 - 1, 2)) * 260 * (t > 3.14) : 0;
  // big shared jump on the second 'piggy' (4.72 -> lands 5.0)
  const big = t > 4.72 && t < 5.0 ? (1 - Math.pow((t - 4.72) / .28 * 2 - 1, 2)) * 300 : 0;
  const spin = t > 4.72 && t < 5.0 ? E.io(prog(t, 4.72, 5.0)) * TAU : 0;
  const pf = tadaEnv(t);
  const drawB = (P, d, x, extraHop, s, flip, turn) => {
    const hop = d.hop * (big ? 0 : 1) + extraHop + big;
    g.save(); g.translate(x, gy - hop);
    g.save(); g.translate(0, hop); blob(g, 0, 6, P.R * (.9 - hop / 900), P.R * .16, 'rgba(60,30,10,.3)', 0); g.restore();
    g.rotate(turn); g.scale(s, 1);
    drawPig(g, { R: P.R, pal: P.pal, acc: P.acc, ...d, squash: big ? -.06 : d.squash + hit(t, 5.0, 10) * .12,
      flip, happy: (hit(t, 5.0, 2) > .3 && t < 5.2) || pf > .2 ? 1 : 0, arms: pf > .2 ? [2.6, 2.6] : d.arms, look: [flip ? -1 : 1, 0] });
    g.restore();
  };
  // pal slides in from the right on the first 'piggy'
  const pin = spring(t - 3.62, 2.8, .55);
  const p = BPIGS.pal, d2 = dance(t, { amp: 55, off: .5, seed: 3 });
  if (t > 3.55) drawB(p, d2, lerp(1350, p.x, pin), t < 3.95 ? Math.sin(prog(t, 3.62, 3.95) * Math.PI) * 180 : 0, Math.cos(spin) || 1e-3, true, 0);
  drawB(m, d1, m.x, jumpIn, Math.cos(spin) || 1e-3, false, 0);
  mudSplash(g, t, 3.38, m.x, gy - 10, 5);
  mudSplash(g, t, 5.0, m.x, gy - 10, 6, .8); mudSplash(g, t, 5.0, p.x, gy - 10, 7, .8);
  // 'pigur' : arms up and a heart pops between them
  if (t > TADA[1]) {
    const hp = spring(t - TADA[1] - .12, 2.6, .4), hy = 1080 - (t - TADA[1]) * 60;
    heart(g, W / 2, hy, 3.4 * hp * (1 - prog(t, 5.85, 6.0)), '#ff3d7f', 8, Math.sin((t - TADA[1]) * 8) * .1);
    burst(g, t, TADA[1] + .15, { x: W / 2, y: hy, n: 10, seed: 77, speed: 500, size: 1, life: .8, draw: (g2, x, y, sz, rot) => star(g2, x, y, 26 * sz, rot, '#fff6a8', 4) });
  }
  g.restore();
  cloudClear(g, prog(t, 3.31, 3.62), 21);
  drawLyrics(g, t);
}
// ---------- iris : snout shaped (scene B -> C) ----------
function snoutPath(g, x, y, r) { g.ellipse(x, y, r * 1.35, r, 0, 0, TAU); }
function drawSnoutLogo(g, x, y, r, t) {
  const p = PALETTES.pink;
  blob(g, x, y, r * 1.35, r, p.snout, r * .09);
  blob(g, x - r * .4, y - r * .35, r * .5, r * .18, 'rgba(255,255,255,.35)', 0);
  const flare = 1 + hit(t, 6.21, 8) * .25;
  for (const s of [-1, 1]) blob(g, x + s * r * .45, y + r * .05, r * .2 * flare, r * .34 * flare, p.nose, 0);
}

// ---------- scene C : disco stage, the piggies multiply ----------
const CPIGS = [
  { x: 540, y: 1640, R: 165, pal: 'pink', t0: -1 },
  { x: 225, y: 1560, R: 128, pal: 'peach', acc: 'glasses', t0: 6.56 },
  { x: 855, y: 1560, R: 128, pal: 'rose', acc: 'crown', t0: 6.82 },
  { x: 365, y: 1270, R: 104, pal: 'lilac', acc: 'party', t0: 7.12 },
  { x: 715, y: 1270, R: 104, pal: 'peach', acc: 'phones', t0: 7.42 },
  { x: 540, y: 1105, R: 92, pal: 'rose', acc: 'flower', t0: 7.70 },
];
function stage(g, t) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1b0b3a'); gr.addColorStop(.6, '#4a1677'); gr.addColorStop(1, '#2a0d4d');
  g.fillStyle = gr; g.fillRect(-400, -400, W + 800, H + 1200);
  const kick = hit(t, KICK, 5);
  // beams
  g.save(); g.globalCompositeOperation = 'lighter';
  const cols = ['255,80,160', '80,200,255', '255,220,90', '170,110,255'];
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 2 + Math.sin(t * 1.6 + i * 1.7) * .55, x0 = 140 + i * 267;
    const bg = g.createLinearGradient(x0, 0, x0 + Math.cos(a) * 1900, Math.sin(a) * 1900);
    bg.addColorStop(0, `rgba(${cols[i]},${.42 + kick * .4})`); bg.addColorStop(1, `rgba(${cols[i]},0)`);
    g.fillStyle = bg; g.beginPath(); g.moveTo(x0, -20);
    g.lineTo(x0 + Math.cos(a - .12) * 2100, Math.sin(a - .12) * 2100); g.lineTo(x0 + Math.cos(a + .12) * 2100, Math.sin(a + .12) * 2100);
    g.closePath(); g.fill();
  }
  g.restore();
  for (let i = 0; i < 14; i++) { const r = mulberry32(300 + i); const x = r() * W, y = 150 + r() * 1100, tw = Math.max(0, Math.sin(t * 7 + i * 1.9)); star(g, x, y, 6 + tw * 16, 0, `rgba(255,255,255,${.3 + tw * .7})`); }
  // risers
  g.fillStyle = '#7b2cbf'; g.strokeStyle = INK; g.lineWidth = 8;
  g.beginPath(); g.roundRect(150, 1268, 780, 70, 18); g.fill(); g.stroke();
  g.beginPath(); g.roundRect(380, 1103, 320, 60, 16); g.fillStyle = '#9d4edd'; g.fill(); g.stroke();
  // floor
  const fy = 1450;
  g.fillStyle = '#240a40'; g.fillRect(-400, fy, W + 800, H + 900 - fy);
  const beatK = Math.floor(beatPhase(t));
  for (let r = 0; r < 8; r++) {
    const y0 = fy + Math.pow(r / 6, 1.6) * (H - fy), y1 = fy + Math.pow((r + 1) / 6, 1.6) * (H - fy);
    const w0 = 0.5 + r / 6 * .9, w1 = 0.5 + (r + 1) / 6 * .9;
    for (let c = -6; c < 6; c++) {
      const on = ((r + c + beatK) % 3 + 3) % 3 === 0;
      g.fillStyle = on ? ['#ff3d9a', '#3dc6ff', '#ffd23f'][((c + r) % 3 + 3) % 3] : ((r + c) % 2 ? '#3c1466' : '#2c0e52');
      g.globalAlpha = on ? .55 + kick * .45 : 1;
      g.beginPath();
      g.moveTo(W / 2 + c * 135 * w0 * 1.2, y0); g.lineTo(W / 2 + (c + 1) * 135 * w0 * 1.2, y0);
      g.lineTo(W / 2 + (c + 1) * 135 * w1 * 1.2, y1); g.lineTo(W / 2 + c * 135 * w1 * 1.2, y1); g.closePath(); g.fill();
      g.globalAlpha = 1;
    }
  }
  g.beginPath(); g.moveTo(0, fy); g.lineTo(W, fy); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
}
function sceneC(g, t) {
  g.save();
  const z = lerp(1.28, 1.0, E.io(prog(t, 6.3, 7.85)));
  camera(g, t, W / 2, lerp(1480, 1180, E.io(prog(t, 6.3, 7.85))), z);
  stage(g, t);
  const pf = tadaEnv(t);
  CPIGS.forEach((P, i) => {
    if (t < P.t0) return;
    const ip = P.t0 < 0 ? 1 : spring(t - P.t0, 3, .45);
    const d = dance(t, { amp: P.R * .32, off: (i % 2) * .5, seed: 10 + i, arms: t > 7.9 ? 'side' : (i % 2 ? 'wave' : 'wave') });
    const kj = hit(t, KICK, 4) * (t > KICK ? Math.sin(clamp((t - KICK) / .3) * Math.PI) : 0) * P.R * 1.1;
    const hop = d.hop * (P.t0 < 0 || t - P.t0 > .25 ? 1 : 0) + kj;
    g.save(); g.translate(P.x, P.y - hop);
    g.save(); g.translate(0, hop); blob(g, 0, 6, P.R * .9, P.R * .15, 'rgba(0,0,0,.35)', 0); g.restore();
    g.scale(ip, ip);
    drawPig(g, { R: P.R, pal: P.pal, acc: P.acc, ...d, happy: pf > .2 ? 1 : 0, arms: pf > .2 ? [2.6, 2.6] : d.arms, flip: i % 2 === 1 });
    g.restore();
    if (P.t0 > 0) burst(g, t, P.t0, { x: P.x, y: P.y - P.R * 1.4, n: 9, seed: 50 + i, speed: 800, size: .8, life: .5,
      draw: (g2, x, y, sz, rot, j) => star(g2, x, y, 30 * sz, rot, CONF[j % CONF.length], 4) });
  });
  confetti(g, t, KICK, 70, 9);
  // final 'pigur!' : everybody throws their arms up, stars burst, then the cloud takes the frame
  CPIGS.forEach((P, i) => tadaStars(g, t, TADA[2], P.x, P.y - P.R * 1.5, P.R, 60 + i, 8));
  // kick flash
  g.restore();
  const fl = hit(t, KICK, 9) * .35 + hit(t, 6.44, 7) * .5;
  if (fl > .01) { g.fillStyle = `rgba(255,240,255,${fl})`; g.fillRect(0, 0, W, H); }
  cloudWipe(g, prog(t, 7.97, 8.11), 88);
  drawLyrics(g, t);
}

// ---------- scene D : outro logo ----------
const DPIGS = [
  { x: 150, y: 1540, R: 92, pal: 'peach', acc: 'glasses' },
  { x: 930, y: 1540, R: 92, pal: 'rose', acc: 'crown' },
  { x: 300, y: 1390, R: 78, pal: 'lilac', acc: 'party' },
  { x: 780, y: 1390, R: 78, pal: 'peach', acc: 'phones' },
  { x: 540, y: 1300, R: 70, pal: 'rose', acc: 'flower' },
];
function logo(g, t) {
  const words = [['פיגי', 0], ['פיגי', 1], ['פיגור!', 2]];
  const rowsY = [560, 760];
  const echoes = ECHO;
  g.save();
  words.forEach(([w, k]) => {
    const t0 = 8.16 + k * .09;
    const s = spring(t - t0, 2.6, .42);
    let b = 0; for (const e of echoes) b += hit(t, e, 9) * (k === 2 ? .2 : .1);
    const x = k === 2 ? W / 2 : (k === 0 ? 745 : 335), y = k === 2 ? rowsY[1] + 40 : rowsY[0];
    const px = k === 2 ? 230 : 200;
    g.save(); g.translate(x, y); g.rotate((k - 1) * .05 + Math.sin(t * 3 + k) * .02); g.scale(s * (1 + b), s * (1 + b));
    g.font = FONT(px); g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl'; g.lineJoin = 'round';
    for (let e = 14; e > 0; e -= 2) { g.fillStyle = '#b8235f'; g.fillText(w, e * .6, e); }
    g.lineWidth = px * .2; g.strokeStyle = '#fff'; g.strokeText(w, 0, 0);
    g.lineWidth = px * .1; g.strokeStyle = INK; g.strokeText(w, 0, 0);
    const fg = g.createLinearGradient(0, -px / 2, 0, px / 2); fg.addColorStop(0, '#ff8fb8'); fg.addColorStop(1, '#ff3d7f');
    g.fillStyle = fg; g.fillText(w, 0, 0);
    g.restore();
  });
  g.restore();
}
function sceneD(g, t) {
  g.save(); camera(g, t, W / 2, H / 2, 1.0 + prog(t, 8.11, TT) * .04);
  sunburst(g, W / 2, 700, 28, t * .25, '#ffc4d8', '#ffd9e6');
  for (let i = 0; i < 10; i++) { const r = mulberry32(500 + i); const x = r() * W, y = 150 + r() * 1500 - ((t - 8) * 50 * (1 + r())); heart(g, x, y, .7 + r() * .8, 'rgba(255,90,140,.35)'); }
  hill(g, 1520, '#ff9cc0', '#f2709f');
  const echoPuff = ECHO.map(e => [e, .22]);
  DPIGS.forEach((P, i) => {
    const d = dance(t, { amp: P.R * .3, off: (i % 2) * .5, seed: 20 + i, arms: 'wave' });
    const ip = spring(t - 8.2 - i * .05, 2.6, .5);
    g.save(); g.translate(P.x, P.y + P.R * 2.4 * (1 - ip) - d.hop);
    drawPig(g, { R: P.R, pal: P.pal, acc: P.acc, ...d, mouth: d.mouth * .6, happy: 1, flip: P.x > W / 2 });
    g.restore();
  });
  // hero pig front and centre, arms up on each echo, wink at the end
  const R = 205, gx = W / 2, gy = 1800;
  const d = dance(t, { amp: 45, seed: 4 });
  const pf = tadaEnv(t, echoPuff);
  g.save(); g.translate(gx, gy - d.hop + 500 * (1 - spring(t - 8.11, 2.4, .55)));
  drawPig(g, { R, ...d, mouth: d.mouth * .7, wink: t > 9.15, arms: t > 9.15 ? [.6, 2.7] : (pf > .2 ? [2.5, 2.5] : d.arms), happy: 0 });
  g.restore();
  ECHO.forEach((e, i) => tadaStars(g, t, e, gx, gy - d.hop - R * 1.6, R * (.8 - i * .15), 90 + i, 7));
  confetti(g, t, 8.11, 90, 13);
  g.restore();
  logo(g, t);
  cloudClear(g, prog(t, 8.11, 8.42), 88);
  // sparkle on the wink
  if (t > 9.15) star(g, gx + 150, 1800 - R * 2.1, 40 * spring(t - 9.15, 3, .4) * (1 - prog(t, 9.4, 9.6)), (t - 9.15) * 4, '#fff6a8', 5);
}

// ---------- timeline ----------
function renderScene(t) {
  const g = ctx;
  if (t < CUTS[0]) sceneA(g, t);
  else if (t < CUTS[1]) {
    sceneB(g, t);
    // snout iris closes on the main pig's face
    const p = prog(t, 5.82, 6.12);
    if (p > 0) {
      const fx = BPIGS.main.x, fy = 1750 - BPIGS.main.R * 1.62, r = lerp(1500, 0, E.inn(p) * .3 + E.io(p) * .7);
      g.save(); g.beginPath(); g.rect(0, 0, W, H); snoutPath(g, fx, fy, r); g.fillStyle = '#1d0b22'; g.fill('evenodd');
      if (r > 4) { g.beginPath(); snoutPath(g, fx, fy, r); g.lineWidth = 18; g.strokeStyle = '#ff8fb8'; g.stroke(); }
      g.restore();
      if (t > 6.0) { g.fillStyle = '#1d0b22'; g.fillRect(0, 0, W, H); drawSnoutLogo(g, W / 2, 960, 230 * spring(t - 6.0, 3, .45), t); }
    }
  } else if (t < CUTS[2]) {
    // the snout opens onto the stage
    const p = prog(t, 6.30, 6.46);
    if (p < 1) { g.fillStyle = '#1d0b22'; g.fillRect(0, 0, W, H); }
    if (p < 1) {
      const r = lerp(230, 1700, E.inn(p));
      drawSnoutLogo(g, W / 2, 960, 230 * (1 + hit(t, 6.21, 8) * .12), t);
      if (p > 0) { g.save(); g.beginPath(); snoutPath(g, W / 2, 960, r); g.clip(); sceneC(g, t); g.restore();
        g.beginPath(); snoutPath(g, W / 2, 960, r); g.lineWidth = 20; g.strokeStyle = '#ff8fb8'; g.stroke(); }
    } else sceneC(g, t);
  } else sceneD(g, t);
}
