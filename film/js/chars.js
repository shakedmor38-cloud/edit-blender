// chars.js : the seven chibi singers as paper cut-outs (local coords: feet at 0,0, up = -y)
'use strict';
const SKIN = '#f7d8c2', SKIN2 = '#efc6ad', CHEEK = '#ee9c90', MOUTH = '#8e3438', TONGUE = '#e47f78', EYE = '#2e1f1d';
const WHITE = '#f6f0e6', BLACKP = '#33303a', RED = '#c4473d';

const SINGERS = {
  A: { hair: '#2e2a31', top: '#36333c', pants: '#c4483d', shoes: '#2c2a30', sleeve: '#36333c' },
  B: { hair: '#e6d29e', top: '#34323a', pants: '#efe8dc', shoes: '#c4473d', sleeve: '#34323a' },
  C: { hair: '#8c3a3f', top: '#c9443b', pants: '#c23f37', shoes: '#2c2a30', sleeve: '#c9443b' },
  D: { hair: '#2b2629', top: '#2f2d35', pants: '#2f2d35', shoes: '#8b2f3a', sleeve: '#2f2d35' },
  E: { hair: '#a9cfe6', top: '#f2ede4', pants: '#f2ede4', shoes: '#c4473d', sleeve: '#f2ede4' },
  F: { hair: '#b5a58e', top: '#3b4066', pants: '#2e2c33', shoes: '#2c2a30', sleeve: '#3b4066' },
  G: { hair: '#a58fc0', top: '#c4453c', pants: '#2e2c33', shoes: '#2c2a30', sleeve: '#c4453c' },
};
const ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

const HEAD_Y = -238, HRX = 94, HRY = 86;
const SH_X = 41, SH_Y = -142, ARM_L = 58;
const HIP_X = 21, HIP_Y = -64;

const DEFAULT_POSE = {
  x: 0, y: 0, s: 1, flip: 1, turnX: 1, rot: 0, jump: 0, sq: 1, back: false,
  armL: 0.18, armR: 0.18, legL: 0.04, legR: 0.04, kneeL: 0, kneeR: 0,
  headTilt: 0, headDy: 0, turn: 0,
  eyes: 'open', lookX: 0, lookY: 0, blink: 1, mouth: 'smile', mo: 0.5, cheeks: 1,
  headset: false, shadow: true, sweat: 0,
  propL: null, propR: null, hide: {},
};

function arcPts(cx, cy, rx, ry, a0, a1, n = 24) {
  const o = [];
  for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return o;
}
function bandPts(yTop, curve, thick, x0 = -100, x1 = 100, n = 16) {
  const top = [], bot = [];
  for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n); const y = yTop + curve * Math.pow(x / 100, 2); top.push([x, y]); bot.push([x, y + thick]); }
  return top.concat(bot.reverse());
}

// ---------------- hair styles (head-local, head centre = 0,0) ----------------
const HAIR = {
  A: {
    back: () => sEllipse(0, -4, 106, 98),
    band: () => bandPts(-58, 28, 20, -99, 99),
    stripe: () => bandPts(-50, 28, 5, -98, 98),
    front: () => [...arcPts(0, 0, 104, 98, 180, 360), [103, 6], [100, 28], [88, 12], [86, -22], [70, -38], [40, -52], [12, -58],
      [-10, -54], [-26, -42], [-42, -26], [-58, -12], [-74, -4], [-90, 4], [-100, 14]],
  },
  B: {
    back: () => sEllipse(0, -2, 107, 99),
    front: () => [...arcPts(0, 0, 105, 99, 176, 364), [98, 20], [86, -2], [74, -16], [60, -6], [46, -22], [30, -10], [14, -26], [2, -14],
      [-10, -26], [-26, -10], [-42, -22], [-58, -6], [-72, -16], [-86, -2], [-99, 20]],
    strands: () => [[-6, -96], [6, -96], [16, -60], [4, -40], [-8, -62]],
  },
  C: {
    back: () => sEllipse(0, -4, 106, 98),
    front: () => [...arcPts(0, 0, 105, 98, 176, 364), [100, 20], [90, 2], [82, -14], [70, -2], [58, -18], [44, -6], [30, -24], [14, -10],
      [-2, -28], [-20, -18], [-36, -34], [-54, -22], [-70, -32], [-84, -12], [-99, 16]],
  },
  D: {
    back: () => sEllipse(0, 8, 101, 86),
    front: () => [[-94, -30], [94, -30], [90, -4], [72, -14], [56, 0], [38, -14], [20, 2], [2, -12], [-16, 2], [-34, -12], [-52, 0], [-70, -14], [-90, -2]],
    crown: () => [...arcPts(0, -26, 90, 76, 186, 354), [92, -34], [-92, -34]],
    brim: () => [[-100, -46], [100, -46], [124, -20], [112, -6], [0, 2], [-112, -6], [-124, -20]],
  },
  E: {
    back: () => sEllipse(0, -6, 109, 101),
    front: () => [...arcPts(0, -4, 106, 98, 182, 358), [104, -6], [100, 24], [88, 6], [90, -26], [60, -42], [20, -50], [-20, -50], [-60, -42], [-90, -26],
      [-88, 6], [-100, 24], [-104, -6]],
    band: () => bandPts(-52, 26, 23, -100, 100),
    tufts: () => [[-72, -36], [-52, -38], [-58, -12], [-66, -6]],
    tufts2: () => [[36, -40], [58, -36], [52, -14]],
  },
  F: {
    back: () => sEllipse(0, -4, 107, 99),
    front: () => [...arcPts(0, -2, 105, 98, 182, 358), [104, -4], [100, 24], [88, 8], [90, -28], [60, -46], [20, -54], [-20, -54], [-60, -46], [-90, -28],
      [-88, 8], [-100, 22], [-104, -4]],
    band: () => bandPts(-56, 26, 24, -101, 101),
    stripe: () => bandPts(-56, 26, 6, -100, 100),
    lock: () => [[8, -62], [42, -56], [64, -30], [56, -2], [44, -22], [28, -42]],
    tail1: () => [[-92, -40], [-138, -26], [-128, -6], [-96, -20]],
    tail2: () => [[-94, -24], [-128, 6], [-112, 20], [-90, -8]],
  },
  G: {
    back: () => sEllipse(0, -8, 109, 101),
    front: () => [...arcPts(0, -2, 106, 99, 174, 366), [102, 24], [92, 4], [86, -10], [72, 0], [60, -14], [44, -4], [30, -22], [10, -30],
      [-10, -42], [-32, -50], [-52, -50], [-70, -40], [-86, -22], [-100, 8]],
    swirl: () => [[-40, -92], [20, -96], [60, -76], [20, -70], [-20, -62], [-50, -70]],
  },
};

function drawHairBack(id, c) {
  const h = HAIR[id];
  pPoly(`${id}.hb`, h.back(), c.hair, { smooth: 0, amp: 2.2, rim: 3.4 });
}
function drawHairFront(id, c, q) {
  const h = HAIR[id];
  const o = { smooth: 1, amp: 1.6, rim: 3 };
  switch (id) {
    case 'A':
      pPoly('A.band', h.band(), WHITE, { smooth: 0, amp: .8, rim: 2 });
      pPoly('A.stripe', h.stripe(), RED, { smooth: 0, amp: .6, rim: 0 });
      pPoly('A.hf', h.front(), c.hair, o);
      break;
    case 'B':
      pPoly('B.hf', h.front(), c.hair, o);
      ctx.strokeStyle = 'rgba(190,160,100,.55)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-4, -94); ctx.quadraticCurveTo(-12, -60, -30, -30); ctx.moveTo(4, -94); ctx.quadraticCurveTo(14, -60, 36, -32); ctx.stroke();
      break;
    case 'C':
      pPoly('C.hf', h.front(), c.hair, o);
      withT(-50, -46, -0.45, 1, 1, () => pRect('C.pin', -14, -4, 28, 8, 4, '#e4be63', { rim: 2 }));
      break;
    case 'D':
      pPoly('D.hf', h.front(), c.hair, o);
      pPoly('D.crown', h.crown(), '#2a2830', { smooth: 0, amp: 1.4, rim: 3 });
      withT(0, 0, -0.04, 1, 1, () => {
        pPoly('D.brim', h.brim(), '#24222a', { smooth: 2, amp: 1.2, rim: 3 });
        ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(240,232,220,.55)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-106, -24); ctx.quadraticCurveTo(0, -12, 106, -24); ctx.stroke(); ctx.restore();
      });
      // small white logo patch
      pRect('D.patch', -14, -66, 28, 12, 3, WHITE, { rim: 0 });
      break;
    case 'E':
      pPoly('E.hf', h.front(), c.hair, { smooth: 1, amp: 2.4, rim: 3 });
      pPoly('E.band', h.band(), '#2b2930', { smooth: 0, amp: .8, rim: 2.4 });
      ctx.fillStyle = 'rgba(240,235,225,.85)';
      for (let i = 0; i < 9; i++) { const x = -84 + i * 21, y = -42 + 26 * Math.pow(x / 100, 2); ctx.beginPath(); ctx.arc(x, y, 2.6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x + 9, y + 6, 1.6, 0, TAU); ctx.fill(); }
      pPoly('E.t1', h.tufts(), c.hair, { smooth: 1, amp: 1, rim: 2 });
      pPoly('E.t2', h.tufts2(), c.hair, { smooth: 1, amp: 1, rim: 2 });
      break;
    case 'F':
      pPoly('F.t1', h.tail1(), '#2f3554', { smooth: 1, amp: 1, rim: 2.5 });
      pPoly('F.t2', h.tail2(), '#2f3554', { smooth: 1, amp: 1, rim: 2.5 });
      pPoly('F.hf', h.front(), c.hair, o);
      pPoly('F.band', h.band(), '#2f3554', { smooth: 0, amp: .8, rim: 2.4 });
      pPoly('F.stripe', h.stripe(), RED, { smooth: 0, amp: .5, rim: 0 });
      ctx.fillStyle = 'rgba(240,235,225,.7)';
      for (let i = 0; i < 8; i++) { const x = -76 + i * 22, y = -40 + 26 * Math.pow(x / 100, 2); ctx.fillRect(x - 2, y - 2, 4, 4); }
      pPoly('F.lock', h.lock(), c.hair, { smooth: 2, amp: 1, rim: 2.4 });
      break;
    case 'G':
      pPoly('G.hf', h.front(), c.hair, o);
      pPoly('G.sw', h.swirl(), '#b9a5d2', { smooth: 2, amp: 1, rim: 0 });
      break;
  }
}

// ---------------- outfits ----------------
const TORSO = () => [[-44, -156], [44, -156], [53, -60], [-53, -60]];
function drawTorso(id, c, q) {
  const tor = shape(`${id}.torso`, () => sPoly(TORSO(), 2), { amp: 1.2 });
  paper(tor, c.top);
  ctx.save(); ctx.clip(tor.main);
  switch (id) {
    case 'A':
      if (!q.back) text('MIC', 0, -108, 20, '#f1ebe0', { weight: 700, rot: -0.06 });
      break;
    case 'B':
      if (!q.back) {
        pRect('B.tee', -15, -160, 30, 104, 4, WHITE, { rim: 0 });
        pRect('B.s1', -21, -160, 6, 104, 2, RED, { rim: 0 }); pRect('B.s2', 15, -160, 6, 104, 2, RED, { rim: 0 });
      }
      break;
    case 'C':
      if (!q.back) { ctx.fillStyle = 'rgba(250,240,230,.9)'; ctx.fillRect(-1.5, -150, 3, 92); pRect('C.col', -26, -160, 52, 16, 7, '#a93730', { rim: 0 }); }
      break;
    case 'D':
      for (let i = 0; i < 3; i++) withT(0, -128 + i * 16, -0.32, 1, 1, () => pRect(`D.ts${i}`, -10, -3.5, 70, 7, 3, WHITE, { rim: 0 }));
      break;
    case 'E':
      if (!q.back) { pPoly('E.col', [[-24, -158], [0, -132], [24, -158]], '#dcd5ca', { smooth: 0, rim: 0 }); ctx.fillStyle = '#2b2930'; ctx.fillRect(18, -122, 14, 10); }
      break;
    case 'F': {
      const cols = ['#8c3a4a', '#9a86b8', '#e9dfcf', '#22212a', '#8c3a4a', '#9a86b8', '#c66b5a'];
      for (let i = 0; i < 9; i++) { const r = mulberry32(900 + i); pEll(`F.cm${i}`, -50 + r() * 100, -150 + r() * 90, 12 + r() * 12, 8 + r() * 8, cols[i % cols.length], { rim: 0, amp: 2.5 }); }
      break;
    }
    case 'G':
      if (!q.back) { pPoly('G.tee', [[-16, -160], [16, -160], [0, -120]], WHITE, { smooth: 0, rim: 0 }); pPoly('G.vt', [[-22, -160], [-16, -160], [0, -120], [0, -112]], '#f3ecdf', { smooth: 0, rim: 0 }); pPoly('G.vt2', [[22, -160], [16, -160], [0, -120], [0, -112]], '#f3ecdf', { smooth: 0, rim: 0 }); }
      pRect('G.hem', -60, -72, 120, 6, 2, '#f3ecdf', { rim: 0 }); pRect('G.hem2', -60, -64, 120, 4, 2, '#f3ecdf', { rim: 0 });
      break;
  }
  ctx.restore();
}
function armStretch(ang) { const u = clamp((ang - 1.0) / 1.3); return 1 + 0.55 * u * u * (3 - 2 * u); }
function drawArm(id, c, side, ang, q, prop) {
  const st = armStretch(ang);
  withT(side * SH_X, SH_Y, -side * ang, 1, 1, () => {
    ctx.save(); ctx.scale(1, st);
    paper(shape(`${id}.arm`, () => sRRect(-14, -12, 28, ARM_L + 14, 14), { amp: 1 }), c.sleeve);
    if (id === 'B') pRect('B.as', -3, -6, 6, ARM_L - 2, 2, RED, { rim: 0 });
    if (id === 'D') { pRect('D.as', 6, -4, 4, ARM_L - 4, 2, WHITE, { rim: 0 }); pRect('D.as2', -2, -4, 4, ARM_L - 4, 2, WHITE, { rim: 0 }); }
    if (id === 'G' || id === 'E') pRect(`${id}.cuff`, -14, ARM_L - 12, 28, 9, 3, id === 'G' ? '#f3ecdf' : '#ddd6ca', { rim: 0 });
    ctx.restore();
    ctx.translate(0, (ARM_L + 4) * st);
    paper(shape('hand', () => sEllipse(0, 0, 15, 15), { amp: .8, rim: 2.4 }), SKIN);
    if (prop) withT(0, 0, side * ang, 1, 1, () => prop(side));
  });
}
function drawLeg(id, c, side, ang, knee) {
  withT(side * HIP_X, HIP_Y, -side * ang, 1, 1, () => {
    paper(shape(`${id}.leg`, () => sRRect(-15, -6, 30, 60 - knee, 12), { amp: 1 }), c.pants);
    if (id === 'D') pRect('D.ls', side * 10 - 2, 0, 4, 50 - knee, 2, WHITE, { rim: 0 });
    if (id === 'E') { pRect('E.ls', side * 9 - 2, 0, 4, 50 - knee, 2, '#2b2930', { rim: 0 }); }
    paper(shape(`shoe${side}`, () => sEllipse(side * 6, 58, 23, 13), { amp: 1 }), c.shoes);
  });
}

function drawEyes(q) {
  const ex = 35, ey = 16, lx = q.lookX * 5 + q.turn * 10, ly = q.lookY * 4;
  for (const side of [-1, 1]) {
    const x = side * ex + q.turn * 12, y = ey;
    ctx.save(); ctx.translate(x, y);
    switch (q.eyes) {
      case 'happy': case 'squint': {
        ctx.strokeStyle = EYE; ctx.lineWidth = 5.5; ctx.lineCap = 'round'; ctx.beginPath();
        if (q.eyes === 'happy') { ctx.moveTo(-12, 5); ctx.quadraticCurveTo(0, -12, 12, 5); }
        else { ctx.moveTo(-11 * side, -9); ctx.lineTo(9 * side, 0); ctx.lineTo(-11 * side, 9); }
        ctx.stroke(); break;
      }
      case 'closed': {
        ctx.strokeStyle = EYE; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-12, -2); ctx.quadraticCurveTo(0, 9, 12, -2); ctx.stroke(); break;
      }
      case 'shock': {
        ctx.fillStyle = '#fffaf2'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 20, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = EYE; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = EYE; ctx.beginPath(); ctx.arc(lx * .6, ly * .6, 6, 0, TAU); ctx.fill(); break;
      }
      default: {
        const big = q.eyes === 'huge' ? 1.3 : 1;
        const rx = 15 * big, ry = 19.5 * big * q.blink;
        if (ry < 2.5) { ctx.strokeStyle = EYE; ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-12, 2); ctx.quadraticCurveTo(0, 6, 12, 2); ctx.stroke(); break; }
        ctx.translate(lx, ly);
        ctx.fillStyle = EYE; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#5a3a30'; ctx.beginPath(); ctx.ellipse(0, ry * .35, rx * .62, ry * .42, 0, 0, TAU); ctx.fill();
        if (q.blink > .5) {
          ctx.fillStyle = '#fffaf2';
          if (q.eyes === 'huge') { star(5, -7 * big, 7.5, 2.6); ctx.beginPath(); ctx.arc(-6, 9, 3, 0, TAU); ctx.fill(); }
          else { ctx.beginPath(); ctx.arc(5, -7, 5.2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(-5, 8, 2.4, 0, TAU); ctx.fill(); }
        }
        // upper lash line
        ctx.strokeStyle = EYE; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.ellipse(0, 0, rx + 1.5, ry + 1, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      }
    }
    ctx.restore();
  }
}
function star(x, y, R, r, n = 4) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r : R; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill();
}
function drawMouth(q) {
  const x = q.turn * 12, y = 46, m = q.mo;
  ctx.save(); ctx.translate(x, y);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  switch (q.mouth) {
    case 'smile': ctx.strokeStyle = MOUTH; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(-8, -2); ctx.quadraticCurveTo(0, 7, 8, -2); ctx.stroke(); break;
    case 'flat': ctx.strokeStyle = MOUTH; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(-7, 1); ctx.lineTo(7, 1); ctx.stroke(); break;
    case 'wavy': ctx.strokeStyle = MOUTH; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-11, 2); ctx.quadraticCurveTo(-5.5, -4, 0, 2); ctx.quadraticCurveTo(5.5, 8, 11, 2); ctx.stroke(); break;
    case 'o': ctx.fillStyle = MOUTH; ctx.beginPath(); ctx.ellipse(0, 3, 5 + m * 3, 6 + m * 7, 0, 0, TAU); ctx.fill(); break;
    case 'sing': case 'open': case 'laugh': {
      const w = q.mouth === 'laugh' ? 17 : q.mouth === 'sing' ? 10 : 12, d = (q.mouth === 'laugh' ? 26 : 18) * (0.35 + 0.65 * m);
      ctx.fillStyle = MOUTH; ctx.beginPath(); ctx.moveTo(-w, -3);
      ctx.quadraticCurveTo(0, -6, w, -3); ctx.quadraticCurveTo(w * .9, d, 0, d); ctx.quadraticCurveTo(-w * .9, d, -w, -3); ctx.fill();
      ctx.save(); ctx.clip(); ctx.fillStyle = TONGUE; ctx.beginPath(); ctx.ellipse(0, d + 2, w * .7, d * .45, 0, 0, TAU); ctx.fill(); ctx.restore();
      break;
    }
  }
  ctx.restore();
}

// ---------------- the singer ----------------
function drawSinger(id, p) {
  const c = SINGERS[id];
  const q = Object.assign({}, DEFAULT_POSE, p);
  const back = q.back !== (q.turnX < 0);
  ctx.save();
  ctx.translate(q.x, q.y);
  if (q.shadow) {
    const lift = Math.max(0, -q.jump), k = 1 / (1 + lift / 160);
    ctx.fillStyle = `rgba(70,35,25,${.18 * k})`; ctx.beginPath(); ctx.ellipse(0, 4 * q.s, 80 * q.s * k, 13 * q.s * k, 0, 0, TAU); ctx.fill();
  }
  ctx.translate(0, q.jump * q.s);
  ctx.scale(q.s * q.flip * Math.max(0.04, Math.abs(q.turnX)), q.s);
  ctx.scale(1 / Math.sqrt(q.sq), q.sq);
  if (q.rot) { ctx.translate(0, HIP_Y); ctx.rotate(q.rot); ctx.translate(0, -HIP_Y); }

  if (q.pre) q.pre(q);
  // legs + hips
  drawLeg(id, c, -1, q.legL, q.kneeL); drawLeg(id, c, 1, q.legR, q.kneeR);
  pRect(`${id}.hip`, -51, -84, 102, 32, 14, c.pants, { rim: 2.5 });
  if (id === 'G' && !back) withT(26, -68, .1, 1, 1, () => pRect('G.patch', -9, -7, 18, 14, 3, '#e4be63', { rim: 1.5 }));
  // arms behind when back view
  const UP = 1.25;
  if (back) { if (q.armL < UP) drawArm(id, c, -1, q.armL, q, q.propL); if (q.armR < UP) drawArm(id, c, 1, q.armR, q, q.propR); }
  drawTorso(id, c, { back });
  if (!back) {
    if (!q.hide.armL && q.armL < UP) drawArm(id, c, -1, q.armL, q, q.propL);
    if (!q.hide.armR && q.armR < UP) drawArm(id, c, 1, q.armR, q, q.propR);
  }
  // head
  if (!q.hide.head) {
    ctx.save();
    ctx.translate(0, HEAD_Y + q.headDy); ctx.rotate(q.headTilt);
    drawHairBack(id, c);
    if (!back) {
      for (const sd of [-1, 1]) pEll(`ear${sd}`, sd * 92, 12, 15, 17, SKIN, { rim: 2.4, amp: .8 });
      paper(shape('face', () => sEllipse(0, 4, HRX, HRY), { amp: 1.3, rim: 3 }), SKIN);
      if (q.cheeks) { ctx.save(); ctx.globalAlpha = .55 * q.cheeks; pEll('chk-1', -60 + q.turn * 10, 40, 16, 10, CHEEK, { rim: 0, amp: 1 }); pEll('chk1', 60 + q.turn * 10, 40, 16, 10, CHEEK, { rim: 0, amp: 1 }); ctx.restore(); }
      drawEyes(q); drawMouth(q);
      drawHairFront(id, c, q);
      if (q.headset) { ctx.strokeStyle = '#3a3640'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-92, 18); ctx.quadraticCurveTo(-80, 54, -42, 56); ctx.stroke(); ctx.fillStyle = '#3a3640'; ctx.beginPath(); ctx.arc(-40, 56, 5, 0, TAU); ctx.fill(); }
      if (q.sweat > 0) { ctx.save(); ctx.globalAlpha = q.sweat; ctx.fillStyle = '#bfe0ee'; ctx.beginPath(); ctx.moveTo(84, -24); ctx.quadraticCurveTo(96, -2, 88, 6); ctx.quadraticCurveTo(76, 6, 80, -6); ctx.closePath(); ctx.fill(); ctx.restore(); }
    } else {
      paper(shape(`${id}.hbk`, () => sEllipse(0, 0, 104, 96), { amp: 2, rim: 3 }), c.hair);
      if (id === 'D') { pPoly('D.crown', HAIR.D.crown(), '#2a2830', { smooth: 0, amp: 1.4, rim: 3 }); pPoly('D.brim', HAIR.D.brim(), '#24222a', { smooth: 2, amp: 1.2, rim: 3 }); }
      if (id === 'A') pPoly('A.band', HAIR.A.band(), WHITE, { smooth: 0, amp: .8, rim: 2 });
      if (id === 'E') pPoly('E.band', HAIR.E.band(), '#2b2930', { smooth: 0, amp: .8, rim: 2.4 });
      if (id === 'F') pPoly('F.band', HAIR.F.band(), '#2f3554', { smooth: 0, amp: .8, rim: 2.4 });
    }
    if (q.headProp) q.headProp(q);
    ctx.restore();
  }
  if (!q.hide.armL && q.armL >= UP) drawArm(id, c, -1, q.armL, q, q.propL);
  if (!q.hide.armR && q.armR >= UP) drawArm(id, c, 1, q.armR, q, q.propR);
  if (q.post) q.post(q);
  ctx.restore();
}

// ---------------- props ----------------
function propMic(side) {
  withT(0, -4, -0.25 * side, 1, 1, () => {
    pRect('mic.h', -6, -6, 12, 52, 5, '#3b3842', { rim: 2 });
    pEll('mic.b', 0, -14, 14, 14, '#9a96a0', { rim: 2.4 });
    ctx.strokeStyle = 'rgba(60,55,65,.5)'; ctx.lineWidth = 1.5;
    for (let i = -8; i <= 8; i += 5) { ctx.beginPath(); ctx.moveTo(i, -26); ctx.lineTo(i, -2); ctx.stroke(); }
  });
}
function propComb() { withT(0, -10, 0, 1, 1, () => { pRect('comb', -6, -40, 12, 44, 4, '#e98a6f', { rim: 2 }); }); }
