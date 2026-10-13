// props.js : clock, cake, envelope + card, speech bubble, notes, confetti, puffs, sparkles
'use strict';
const PAL = {
  peach: '#e9b5a0', denim: '#4f6399', mint: '#85baab', purple: '#7362ab', mustard: '#e4be63', night: '#252e54',
  salmon: '#dd9883', brick: '#c4563d', pink: '#ec9fae', cream: '#f8efe2', lilac: '#a58fc0', wood: '#c79a6c',
};

// ---------- clock ----------
function drawClock(id, x, y, r, hh, mm, o = {}) {
  withT(x, y, o.rot || 0, o.s || 1, o.s || 1, () => {
    pEll(`${id}.rim`, 0, 0, r, r, PAL.brick, { amp: 1.2 });
    pEll(`${id}.face`, 0, 0, r * .84, r * .84, '#fbf3e6', { rim: 0, amp: .8 });
    if (o.wedge) {
      const a0 = -Math.PI / 2 + (o.wedgeFrom / 60) * TAU, a1 = -Math.PI / 2 + TAU;
      ctx.save(); ctx.globalAlpha = .82 * clamp(o.wedge);
      ctx.fillStyle = paperPattern('#e8857a'); ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.arc(0, 0, r * .8 * (0.6 + 0.4 * clamp(o.wedge)), a0, lerp(a0, a1, clamp(o.wedge * 1.2))); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = INK;
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU, l = i % 3 === 0 ? .14 : .07;
      ctx.save(); ctx.rotate(a); ctx.fillRect(-r * .018 - (i % 3 === 0 ? r * .01 : 0), -r * .76, r * .036 + (i % 3 === 0 ? r * .02 : 0), r * l); ctx.restore();
    }
    const ha = ((hh % 12) + mm / 60) / 12 * TAU, ma = mm / 60 * TAU;
    ctx.lineCap = 'round'; ctx.strokeStyle = INK;
    ctx.lineWidth = r * .075; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(ha) * r * .42, -Math.cos(ha) * r * .42); ctx.stroke();
    ctx.lineWidth = r * .05; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(ma) * r * .64, -Math.cos(ma) * r * .64); ctx.stroke();
    if (o.sec !== undefined) { const sa = o.sec / 60 * TAU; ctx.strokeStyle = PAL.brick; ctx.lineWidth = r * .02; ctx.beginPath(); ctx.moveTo(-Math.sin(sa) * r * .12, Math.cos(sa) * r * .12); ctx.lineTo(Math.sin(sa) * r * .7, -Math.cos(sa) * r * .7); ctx.stroke(); }
    ctx.fillStyle = PAL.brick; ctx.beginPath(); ctx.arc(0, 0, r * .07, 0, TAU); ctx.fill();
  });
}

// ---------- cake (origin = bottom centre of the cake, on its plate) ----------
function drawCake(id, x, y, s, o = {}) {
  const t = o.t || 0;
  withT(x, y, o.rot || 0, s, s, () => {
    if (o.plate !== false) pEll(`${id}.plate`, 0, 4, 128, 14, '#dcd6cd', { amp: .8 });
    // bottom tier
    pRect(`${id}.t1`, -110, -92, 220, 94, 12, '#ec9aa3', { amp: 1.2 });
    pPoly(`${id}.d1`, [[-112, -94], [112, -94], [112, -70], [96, -60], [84, -72], [66, -54], [48, -70], [30, -58], [12, -72], [-6, -56], [-24, -70], [-44, -58], [-62, -72], [-80, -56], [-98, -70], [-112, -62]], '#fbf2e4', { smooth: 1, amp: .8, rim: 0 });
    ctx.fillStyle = '#fff4e6'; for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.arc(-103 + i * 13.7, -5, 4.6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.arc(-104.5 + i * 13.7, -6.5, 1.6, 0, TAU); ctx.fill(); }
    iced('still with you', 0, -36, 25);
    // top tier
    pRect(`${id}.t2`, -74, -160, 148, 72, 10, '#fbf2e4', { amp: 1.2 });
    pPoly(`${id}.d2`, [[-76, -162], [76, -162], [76, -142], [60, -132], [46, -146], [28, -128], [10, -144], [-8, -130], [-28, -146], [-46, -130], [-62, -144], [-76, -136]], '#f2a3b0', { smooth: 1, amp: .8, rim: 0 });
    // strawberries along the bottom tier ledge
    for (let i = 0; i < 6; i++) {
      const bx = -95 + i * 38 + (i > 2 ? 0 : 0);
      if (Math.abs(bx) < 70) continue;
      pEll(`${id}.sb${i}`, bx, -100, 13, 12, '#d9443f', { amp: .8, rim: 2 });
      pPoly(`${id}.sl${i}`, [[bx - 8, -110], [bx + 8, -110], [bx, -104]], '#6e9a6a', { smooth: 0, rim: 0 });
    }
    for (let i = 0; i < 4; i++) { const bx = -54 + i * 36; pEll(`${id}.tb${i}`, bx, -166, 11, 10, '#d9443f', { amp: .8, rim: 2 }); }
    // number candles "2" and "7"
    const lit = o.lit || [1, 1];
    [['2', -34, PAL.mint], ['7', 34, PAL.lilac]].forEach(([d, cx, col], k) => {
      withT(cx, -196, 0, 1, 1, () => {
        ctx.save();
        ctx.font = '700 74px Fredoka'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round'; ctx.strokeStyle = paperPattern(RIM); ctx.lineWidth = 9;
        ctx.save(); ctx.translate(1.2, 3); ctx.strokeStyle = 'rgba(74,38,26,.22)'; ctx.strokeText(d, 0, 0); ctx.restore();
        ctx.strokeText(d, 0, 0);
        ctx.fillStyle = paperPattern(col); ctx.fillText(d, 0, 0);
        ctx.restore();
        ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(0, -44); ctx.stroke();
        const L = lit[k];
        if (L > 0.01) drawFlame(0, -46, L, t + k * 1.7, o.flameS || 1);
        if (o.smoke && o.smoke[k] > 0) drawSmoke(0, -46, o.smoke[k], k);
      });
    });
  });
}
// piped cream lettering
function iced(str, x, y, size) {
  ctx.save();
  ctx.font = `${size}px Pacifico`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = ctx.strokeStyle = 'rgba(160,70,72,.30)'; ctx.lineWidth = size * .2;
  ctx.strokeText(str, x + size * .04, y + size * .09); ctx.fillText(str, x + size * .04, y + size * .09);
  ctx.fillStyle = ctx.strokeStyle = '#fff4e6'; ctx.lineWidth = size * .17;
  ctx.strokeText(str, x, y); ctx.fillText(str, x, y);
  ctx.strokeStyle = 'rgba(230,200,180,.55)'; ctx.lineWidth = size * .035; ctx.strokeText(str, x, y + size * .02);
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText(str, x - size * .03, y - size * .04);
  ctx.restore();
}
function drawFlame(x, y, s, t, k = 1) {
  const fl = 1 + vnoise(t * 9, 3) * .12, sway = vnoise(t * 6, 9) * .12;
  withT(x, y, sway, s * k, s * k * fl, () => {
    ctx.save();
    const g = ctx.createRadialGradient(0, -14, 2, 0, -14, 42);
    g.addColorStop(0, 'rgba(255,214,120,.55)'); g.addColorStop(1, 'rgba(255,214,120,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -14, 42, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f0a443'; ctx.beginPath(); ctx.moveTo(0, -36); ctx.quadraticCurveTo(12, -12, 9, -2); ctx.quadraticCurveTo(0, 6, -9, -2); ctx.quadraticCurveTo(-12, -12, 0, -36); ctx.fill();
    ctx.fillStyle = '#fbe08a'; ctx.beginPath(); ctx.moveTo(0, -24); ctx.quadraticCurveTo(6, -10, 5, -3); ctx.quadraticCurveTo(0, 2, -5, -3); ctx.quadraticCurveTo(-6, -10, 0, -24); ctx.fill();
    ctx.restore();
  });
}
function drawSmoke(x, y, p, seed) {
  ctx.save();
  ctx.strokeStyle = `rgba(150,140,140,${.7 * (1 - p)})`; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 20; i++) {
    const u = i / 20, yy = y - u * 90 * (0.3 + p), xx = x + Math.sin(u * 7 + seed + p * 4) * 10 * u;
    if (u > p * 1.4 + .2) break;
    i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
  }
  ctx.stroke(); ctx.restore();
}

// ---------- envelope + card ----------
function drawEnvelope(x, y, s, rot, open = 0) {
  withT(x, y, rot, s, s, () => {
    pRect('env.back', -60, -38, 120, 76, 6, '#e98fa3', { amp: 1 });
    if (open > 0) {
      // flap folded up
      withT(0, -38, 0, 1, -1 * open + (1 - open), () => pPoly('env.flapO', [[-60, 0], [60, 0], [0, 46]], '#f0a7b6', { smooth: 0, amp: .8, rim: 2 }));
    }
    pPoly('env.front', [[-60, -10], [0, 22], [60, -10], [60, 38], [-60, 38]], '#f0a7b6', { smooth: 0, amp: .9, rim: 0 });
    if (open <= 0) {
      pPoly('env.flap', [[-60, -38], [60, -38], [0, 10]], '#f5b5c2', { smooth: 0, amp: .8, rim: 2 });
      heart(0, 4, 10, '#c4453c');
    }
  });
}
function heart(x, y, r, color, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(r / 10, r / 10);
  ctx.fillStyle = o.flat ? color : paperPattern(color);
  if (o.rim) { ctx.lineWidth = 4; ctx.strokeStyle = paperPattern(RIM); }
  ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-14, -2, -9, -14, 0, -6); ctx.bezierCurveTo(9, -14, 14, -2, 0, 8); ctx.closePath();
  if (o.rim) ctx.stroke();
  ctx.fill(); ctx.restore();
}
function drawCard(x, y, s, rot, a = 1) {
  if (a <= 0) return;
  withT(x, y, rot, s, s, () => {
    pRect('card', -92, -66, 184, 132, 6, '#fdf6ea', { amp: 1 });
    ctx.save(); ctx.globalAlpha = .9;
    pRect('card.in', -84, -58, 168, 116, 4, '#fbe3e6', { rim: 0, amp: .8 });
    ctx.restore();
    text('Happy', 0, -30, 34, '#b8404c', { font: 'Patrick Hand', weight: 400 });
    text('Birthday', 0, 2, 34, '#b8404c', { font: 'Patrick Hand', weight: 400 });
    text('May', -6, 36, 40, PAL.purple, { font: 'Patrick Hand', weight: 400 });
    heart(40, 36, 9, '#e0606d'); heart(-62, -40, 6, '#e98fa3'); heart(64, -44, 5, PAL.lilac);
  });
}

// ---------- speech bubble (anchored at tail tip) ----------
function bubble(id, x, y, lines, size, o = {}) {
  const a = o.a ?? 1;
  if (a <= 0.001) return;
  ctx.save();
  ctx.font = `600 ${size}px Fredoka`;
  const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + size * 1.3;
  const h = lines.length * size * 1.18 + size * .9;
  ctx.restore();
  const bx = x + (o.dx ?? 0), by = y - (o.dy ?? 40) - h / 2;
  withT(x, y, o.rot || 0, a, a, () => {
    const cx = bx - x, cy = by - y;
    const tail = shape(`${id}.tail`, () => sPoly([[cx - 24, cy + h / 2 - 18], [cx + 20, cy + h / 2 - 18], [0, 0]], 0), { amp: .8, rim: 3 });
    paper(tail, '#fffaf2');
    pRect(`${id}.b`, cx - w / 2, cy - h / 2, w, h, Math.min(h / 2, size * .9), '#fffaf2', { amp: 1.2, rim: 3.4 });
    ctx.fillStyle = paperPattern('#fffaf2'); ctx.fill(tail.main);
    lines.forEach((l, i) => text(l, cx, cy + (i - (lines.length - 1) / 2) * size * 1.18 + size * .04, size, o.color || INK, { weight: 600 }));
  });
}

// ---------- small things ----------
function note(id, x, y, s, rot, color, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  withT(x, y, rot, s, s, () => {
    pEll(`${id}.h`, -6, 12, 11, 8, color, { rim: 2.4, amp: .8 });
    pRect(`${id}.st`, 2, -26, 5, 38, 2, color, { rim: 2, amp: .5 });
    pPoly(`${id}.fl`, [[4, -26], [20, -16], [18, -6], [6, -14]], color, { smooth: 1, rim: 2, amp: .5 });
  });
  ctx.restore();
}
function sparkle(x, y, s, color = '#fff3c4', rot = 0) {
  if (s <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = color; star(0, 0, 14, 3.4, 4); ctx.restore();
}
function puff(x, y, p, r = 30, seed = 1, color = '#fbf4ea') {
  if (p <= 0 || p >= 1) return;
  const rr = mulberry32(seed);
  ctx.save(); ctx.globalAlpha = (1 - p) * .9;
  for (let i = 0; i < 5; i++) {
    const a = rr() * TAU, d = r * (.4 + rr() * .8) * E.out(p);
    ctx.fillStyle = paperPattern(color); ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * .6, r * (.35 + rr() * .3) * (0.6 + p * .6), 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function motionLines(x, y, len, n, a, color = 'rgba(255,250,240,.85)', dir = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) { const yy = y + (i - (n - 1) / 2) * 22; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x - dir * len * (0.6 + 0.4 * ((i * 7) % 3) / 2), yy); ctx.stroke(); }
  ctx.restore();
}

// ---------- confetti (analytic ballistic + drag + flutter) ----------
const CONF_COLS = [PAL.mustard, PAL.mint, PAL.pink, PAL.lilac, PAL.peach, '#f6f0e6', PAL.denim, PAL.brick];
function confetti(t, t0, x0, y0, dir, n, seed) {
  const dt = t - t0;
  if (dt <= 0) return;
  const r = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    const ang = (-Math.PI / 2) + dir * (0.18 + r() * 0.75), sp = 900 + r() * 900;
    const vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp, k = 2.6 + r() * 1.6, g = 520 + r() * 260;
    const e = 1 - Math.exp(-k * dt);
    const x = x0 + vx / k * e + Math.sin(dt * (3 + r() * 3) + i) * 18 * clamp(dt - .4);
    const yy = y0 + vy / k * e + g / k * dt - g / (k * k) * e;
    const col = CONF_COLS[i % CONF_COLS.length];
    const w = 9 + r() * 8, h = 5 + r() * 5, rot = r() * TAU + dt * (4 + r() * 6), flip = Math.cos(dt * (6 + r() * 8) + i);
    ctx.save(); ctx.translate(x, yy); ctx.rotate(rot); ctx.scale(1, Math.max(.12, Math.abs(flip)));
    ctx.fillStyle = paperPattern(col); ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }
}
