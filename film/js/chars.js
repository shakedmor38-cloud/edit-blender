// chars.js : the seven chibi singers as paper cut-outs (local coords: feet at 0,0, up = -y)
// Modelled on the reference photo, left to right: A B C D E F G.
'use strict';
const SKIN = '#f9e0cf', SKIN2 = '#f0cbb5', CHEEK = '#f1a198', MOUTH = '#8a3236', TONGUE = '#e47f78', EYE = '#24140f';
const WHITE = '#f6f0e6', BLACKP = '#2d2b31', RED = '#c4473d';

const SINGERS = {
  // black swoop + white/red headband, black "MIC" sweatshirt, dark-red pants
  A: { hair: '#25222a', hl: '#4b4653', brow: '#2a2024', iris: ['#4e2c1f', '#a06a45'], top: '#2c2b31', pants: '#a9333a', shoes: '#26252a', sleeve: '#2c2b31' },
  // champagne-blonde curtain bob, black jacket with red trim, white tee + white pants
  B: { hair: '#dccb9f', hl: '#f0e6c8', brow: '#a58560', iris: ['#55301f', '#a8744c'], top: '#2f2e34', pants: '#f1ede6', shoes: '#c03a36', sleeve: '#2f2e34' },
  // burgundy full bangs + silver clip, red tracksuit with black inner collar
  C: { hair: '#7a2f36', hl: '#9e4d52', brow: '#5e2a2a', iris: ['#4f2b1e', '#9c6643'], top: '#c8323a', pants: '#c02f36', shoes: '#26252a', sleeve: '#c8323a' },
  // black bucket hat, dark-brown hair, black track top with white stripes
  D: { hair: '#3a2c28', hl: '#55433d', brow: '#3a2a24', iris: ['#4b2a1d', '#986341'], top: '#2a292f', pants: '#2a292f', shoes: '#8b2a35', sleeve: '#2a292f' },
  // light-blue hair over a black bandana, all-white outfit, striped pants
  E: { hair: '#a8c7dd', hl: '#d3e4ef', brow: '#6b5446', iris: ['#4d2b1e', '#9e6844'], top: '#f2efea', pants: '#f2efea', shoes: '#c03a36', sleeve: '#f2efea' },
  // ash-brown side sweep, navy bandana with red edge, patchwork jacket
  F: { hair: '#9c9081', hl: '#bdb4a6', brow: '#5d4c40', iris: ['#4f2c1f', '#a06a45'], top: '#363a58', pants: '#25242a', shoes: '#26252a', sleeve: '#363a58' },
  // dusty-purple quiff (forehead showing), gray-blue eyes, red varsity jacket
  G: { hair: '#7f6b8a', hl: '#a693b0', brow: '#5a4752', iris: ['#33485e', '#8ba7bf'], top: '#b9292f', pants: '#25242a', shoes: '#26252a', sleeve: '#b9292f' },
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
// band between two points (x0,y0)-(x1,y1) with a slight upward bow, thickness th
function slantBand(x0, y0, x1, y1, th, bow = 10, n = 14) {
  const top = [], bot = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = lerp(x0, x1, u), y = lerp(y0, y1, u) - bow * Math.sin(Math.PI * u);
    top.push([x, y]); bot.push([x, y + th]);
  }
  return top.concat(bot.reverse());
}
// glossy highlight strand (thin crescent along a quadratic curve)
function strand(id, x0, y0, cx, cy, x1, y1, w, color) {
  const pts = [], back = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10, x = (1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * cx + u * u * x1, y = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * cy + u * u * y1;
    const k = Math.sin(Math.PI * u) * w;
    pts.push([x, y - k * .5]); back.push([x, y + k * .5]);
  }
  pPoly(id, pts.concat(back.reverse()), color, { smooth: 0, rim: 0, amp: .4 });
}

function taper(id, x0, y0, cx, cy, x1, y1, w, color, o = {}) {
  const L = [], R = [];
  for (let i = 0; i <= 12; i++) {
    const u = i / 12, x = (1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * cx + u * u * x1, y = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * cy + u * u * y1;
    const dx = 2 * (1 - u) * (cx - x0) + 2 * u * (x1 - cx), dy = 2 * (1 - u) * (cy - y0) + 2 * u * (y1 - cy), l = Math.hypot(dx, dy) || 1;
    const hw = w * .5 * Math.pow(1 - u, .75);
    L.push([x - dy / l * hw, y + dx / l * hw]); R.push([x + dy / l * hw, y - dx / l * hw]);
  }
  pPoly(id, L.concat(R.reverse()), color, { smooth: 0, amp: .8, rim: o.rim ?? 2.4 });
}
// thin darker strand lines for hair texture
const LOW = {
  A: [[-60, -60, -40, -20, -60, 30], [-30, -90, 10, -100, 50, -82]], B: [[-30, -60, -60, -30, -80, 30], [24, -64, 56, -30, 74, 30], [-6, -110, -6, -80, -6, -60]],
  C: [[-50, -60, -40, -40, -46, -20], [10, -70, 14, -40, 6, -24], [56, -66, 62, -40, 56, -22]], D: [], E: [[-30, -80, -10, -100, 30, -104], [60, -80, 90, -60, 104, -30]],
  F: [[-40, -80, 0, -96, 50, -94], [80, -40, 96, -10, 98, 20]], G: [],
};
function lowlights(id, c) {
  ctx.save(); ctx.strokeStyle = 'rgba(30,15,20,.28)'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  for (const [x0, y0, cx, cy, x1, y1] of LOW[id]) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke(); }
  ctx.restore();
}
// ---------------- hair (head-local, head centre = 0,0; face top ~ -80, eyes at y 20) ----------------
const MASS = (cx = 0, cy = -18, rx = 116, ry = 110) => sEllipse(cx, cy, rx, ry);
const CAP = (a0 = 160, a1 = 380, cy = -18, rx = 114, ry = 108) => arcPts(0, cy, rx, ry, a0, a1, 30);
// fringe of pointed locks between x0 and x1 (right -> left)
function locks(x0, x1, n, yTip, yNotch, jit = 6, seed = 1) {
  const r = mulberry32(seed), o = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = lerp(x0, x1, u);
    o.push([x + (i ? (x1 - x0) / n * .5 : 0) * 0, yNotch + (r() - .5) * jit]);
    if (i < n) o.push([lerp(x0, x1, (i + .55) / n), yTip + (r() - .5) * jit]);
  }
  return o;
}
const HAIR = {
  A: {
    back: () => MASS(-4, -16, 118, 110),
    band: () => slantBand(-108, -14, 108, -74, 21, 6),
    stripe: () => slantBand(-108, -7, 108, -67, 5, 6),
    front: () => [...CAP(170, 368), [110, 6], [104, 34], [94, 6], [92, -36], [86, -70], [58, -80], [28, -74], [6, -66],
      [-8, -54], [-20, -34], [-30, -12], [-40, 8], [-52, 18], [-64, 30], [-76, 52], [-84, 76], [-96, 56], [-104, 82], [-112, 50], [-118, 10]],
    hls: [[-70, -80, -10, -112, 70, -84, 10], [-90, -40, -60, -90, -10, -100, 7], [-20, -70, -40, -40, -70, 20, 6]],
  },
  B: {
    back: () => MASS(0, -14, 120, 112),
    front: () => [...CAP(158, 382, -16, 118, 110), [112, 64], [100, 42], [98, 70], [88, 34], [82, 4], [72, -16], [54, -30], [34, -38], [14, -44], [-4, -60],
      [-20, -44], [-40, -38], [-60, -28], [-74, -12], [-84, 8], [-92, 36], [-98, 72], [-106, 46], [-112, 68], [-118, 30]],
    hls: [[-8, -118, -48, -96, -84, -30, 11], [0, -118, 40, -96, 78, -30, 11], [-30, -110, -74, -70, -96, 20, 6], [30, -110, 70, -70, 96, 20, 6]],
  },
  C: {
    back: () => MASS(0, -16, 118, 110),
    front: () => [...CAP(158, 382), [112, 56], [100, 34], [96, 58], [86, 14], ...locks(80, -80, 7, -12, -34, 8, 3), [-86, 14], [-96, 58], [-100, 34], [-112, 56], [-116, 20]],
    hls: [[-40, -114, -20, -84, -14, -40, 9], [30, -112, 50, -80, 56, -36, 8], [-80, -80, -70, -40, -76, 0, 5]],
  },
  D: {
    back: () => MASS(0, 0, 108, 96),
    front: () => [[-104, -44], [104, -44], [104, 6], [98, 34], [90, 4], ...locks(84, -84, 7, -14, -36, 8, 4), [-90, 4], [-98, 34], [-104, 6]],
    crown: () => [...arcPts(0, -50, 100, 90, 182, 358), [104, -58], [-104, -58]],
    brim: () => [[-106, -72], [106, -72], [128, -42], [136, -16], [112, -8], [0, -6], [-112, -8], [-136, -16], [-128, -42]],
  },
  E: {
    back: () => MASS(0, -16, 122, 114),
    band: () => slantBand(-110, -42, 110, -50, 26, 18),
    tail1: () => [[96, -22], [122, -6], [116, 64], [102, 70], [104, 4]],
    tail2: () => [[102, -14], [130, 6], [138, 56], [124, 58], [116, 8]],
    top: () => [...CAP(176, 364, -18, 120, 112), [116, -6], [102, -46], [60, -68], [20, -74], [-20, -72], [-60, -64], [-100, -46], [-118, -10]],
    locks: [
      () => [[-40, -76], [-14, -72], [-24, -40], [-40, -8], [-52, -30]],
      () => [[-78, -62], [-52, -68], [-62, -28], [-78, 0], [-88, -24]],
      () => [[-118, -30], [-98, -40], [-92, 20], [-100, 62], [-118, 30]],
      () => [[118, -30], [100, -40], [92, 10], [104, 52], [118, 20]],
      () => [[10, -80], [36, -78], [30, -50], [20, -30], [12, -50]],
    ],
    hls: [[-30, -116, 30, -122, 90, -70, 11], [-80, -96, -30, -120, 30, -112, 7], [-100, -60, -90, -90, -60, -110, 5]],
  },
  F: {
    back: () => MASS(0, -16, 118, 110),
    band: () => slantBand(-112, -4, 112, -68, 28, 8),
    edge: () => slantBand(-112, -4, 112, -68, 7, 8),
    tail: () => [[-100, 4], [-118, 8], [-114, 80], [-100, 84], [-96, 14]],
    front: () => [...CAP(176, 364, -18, 116, 110), [114, -2], [108, -44], [84, -70], [50, -80], [20, -76], [-10, -66], [-40, -52], [-72, -36], [-100, -22], [-114, -4]],
    lock: () => [[30, -84], [76, -76], [104, -46], [112, 8], [104, 40], [92, 14], [84, -16], [66, -44]],
    sideL: () => [[-100, -12], [-112, 30], [-104, 50], [-92, 22], [-90, 0]],
    hls: [[-70, -96, 0, -122, 80, -86, 11], [-96, -50, -50, -92, 10, -100, 7], [70, -60, 98, -30, 104, 20, 6]],
  },
  G: {
    back: () => MASS(0, -30, 108, 92),
    front: () => [[-98, 8], [-92, -30], [-72, -52], [-40, -63], [-6, -67], [30, -63], [64, -53], [88, -34], [100, -4],
      [110, -30], [108, -70], [80, -100], [30, -112], [-20, -110], [-70, -98], [-104, -70], [-112, -30]],
    quiff: [
      [-80, -50, -100, -96, -64, -118, 64, 0], [76, -44, 100, -80, 104, -108, 56, 0],
      [-40, -64, -50, -116, -6, -132, 70, 1], [10, -66, 20, -118, 64, -136, 70, 1], [50, -58, 76, -100, 92, -124, 50, 1],
      [-20, -66, -16, -110, 20, -126, 30, 2], [36, -62, 50, -100, 74, -118, 22, 2],
    ],
    hls: [[-80, -60, -60, -96, -30, -110, 6]],
  },
};

function drawHairBack(id, c) {
  pPoly(`${id}.hb`, sPoly(HAIR[id].back(), 0), c.hair, { smooth: 0, amp: 2.2, rim: 3.4 });
}
function hls(id, c) { lowlights(id, c); (HAIR[id].hls || []).forEach(([x0, y0, cx, cy, x1, y1, w], i) => strand(`${id}.hl${i}`, x0, y0, cx, cy, x1, y1, w, c.hl)); }
function drawHairFront(id, c, q) {
  const h = HAIR[id];
  const o = { smooth: 1, amp: 1.5, rim: 3 };
  switch (id) {
    case 'A':
      pPoly('A.band', h.band(), WHITE, { smooth: 0, amp: .8, rim: 2 });
      pPoly('A.stripe', h.stripe(), '#c23a3c', { smooth: 0, amp: .5, rim: 0 });
      pPoly('A.hf', h.front(), c.hair, o);
      hls(id, c);
      break;
    case 'B':
      pPoly('B.hf', h.front(), c.hair, o);
      hls(id, c);
      break;
    case 'C':
      pPoly('C.hf', h.front(), c.hair, o);
      hls(id, c);
      for (const [dx, dy] of [[0, 0], [12, 14]]) withT(56 + dx, -60 + dy, -0.6, 1, 1, () => pRect(`C.pin${dx}`, -15, -3, 30, 6, 3, '#d8d8de', { rim: 1.6 }));
      break;
    case 'D':
      pPoly('D.hf', h.front(), c.hair, o);
      withT(0, 0, -0.06, 1, 1, () => {
        pPoly('D.crown', h.crown(), '#242328', { smooth: 0, amp: 1.4, rim: 3 });
        strand('D.sheen', -70, -96, -10, -124, 60, -104, 8, '#3c3a42');
        pPoly('D.brim', h.brim(), '#1f1e23', { smooth: 2, amp: 1.2, rim: 3 });
        ctx.save(); ctx.setLineDash([5, 6]); ctx.strokeStyle = 'rgba(200,195,205,.45)'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(-124, -22); ctx.quadraticCurveTo(0, -8, 124, -22); ctx.stroke(); ctx.restore();
      });
      break;
    case 'E':
      pPoly('E.t1', h.tail1(), '#232128', { smooth: 1, amp: .8, rim: 2.2 });
      pPoly('E.t2', h.tail2(), '#232128', { smooth: 1, amp: .8, rim: 2.2 });
      pPoly('E.top', h.top(), c.hair, { smooth: 1, amp: 2.2, rim: 3 });
      pPoly('E.band', h.band(), '#232128', { smooth: 0, amp: .8, rim: 2.4 });
      ctx.fillStyle = 'rgba(215,210,220,.6)';
      for (let i = 0; i < 7; i++) { const x = -90 + i * 30, u = (x + 110) / 220, y = lerp(-29, -37, u) - 18 * Math.sin(Math.PI * u); ctx.save(); ctx.translate(x, y); ctx.rotate(i * .9); ctx.beginPath(); ctx.ellipse(0, 0, 5, 2.6, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(7, 4, 1.4, 0, TAU); ctx.fill(); ctx.restore(); }
      h.locks.forEach((f, i) => pPoly(`E.lk${i}`, f(), c.hair, { smooth: 1, amp: 1, rim: 2.4 }));
      hls(id, c);
      break;
    case 'F':
      pPoly('F.tail', h.tail(), '#2a2d45', { smooth: 1, amp: .8, rim: 2.2 });
      pPoly('F.sideL', h.sideL(), c.hair, { smooth: 1, amp: .8, rim: 2.2 });
      pPoly('F.band', h.band(), '#2a2d45', { smooth: 0, amp: .8, rim: 2.4 });
      pPoly('F.edge', h.edge(), '#c73d3f', { smooth: 0, amp: .5, rim: 0 });
      ctx.strokeStyle = 'rgba(250,245,240,.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-112, 0); ctx.lineTo(112, -64); ctx.stroke();
      ctx.save(); ctx.setLineDash([7, 6]); ctx.beginPath(); ctx.moveTo(-112, 13); ctx.lineTo(112, -51); ctx.stroke(); ctx.restore();
      pPoly('F.hf', h.front(), c.hair, o);
      pPoly('F.lock', h.lock(), c.hair, { smooth: 1, amp: 1, rim: 2.4 });
      hls(id, c);
      break;
    case 'G':
      pPoly('G.hf', h.front(), c.hair, { smooth: 1, amp: 1.8, rim: 3 });
      h.quiff.forEach(([x0, y0, cx, cy, x1, y1, w, tone], i) => taper(`G.q${i}`, x0, y0, cx, cy, x1, y1, w, ['#6c5978', c.hair, c.hl][tone], { rim: tone === 2 ? 0 : 2.4 }));
      hls(id, c);
      break;
  }
}
const BROWS = { A: [1], B: [-1, 1], C: [], D: [], E: [-1, 1], F: [1], G: [-1, 1] };
function drawBrows(id, c, q) {
  ctx.strokeStyle = c.brow; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
  const lift = q.eyes === 'huge' || q.eyes === 'shock' ? -6 : 0, worry = q.mouth === 'wavy' ? 1 : 0;
  for (const sd of BROWS[id]) {
    const x = sd * 40 + q.turn * 12, y = -16 + lift;
    ctx.beginPath(); ctx.moveTo(x - sd * 14, y + 3 - worry * 5); ctx.quadraticCurveTo(x, y - 4, x + sd * 14, y + 2 + worry * 3); ctx.stroke();
  }
}

// ---------------- outfits ----------------
const TORSO = () => [[-44, -156], [44, -156], [54, -60], [-54, -60]];
function drawTorso(id, c, q) {
  const tor = shape(`${id}.torso`, () => sPoly(TORSO(), 2), { amp: 1.2 });
  paper(tor, c.top);
  ctx.save(); ctx.clip(tor.main);
  switch (id) {
    case 'A':
      if (!q.back) { text('MIC', 0, -112, 19, '#c9c6cc', { weight: 700, rot: -0.04 }); pRect('A.hem', -60, -70, 120, 10, 3, '#232227', { rim: 0 }); }
      break;
    case 'B':
      if (!q.back) {
        pRect('B.tee', -16, -160, 32, 104, 4, WHITE, { rim: 0 });
        pRect('B.l1', -24, -160, 9, 104, 3, '#3d3c43', { rim: 0 }); pRect('B.l2', 15, -160, 9, 104, 3, '#3d3c43', { rim: 0 });
        pRect('B.s1', -46, -150, 22, 7, 2, RED, { rim: 0 }); pRect('B.s2', 24, -150, 22, 7, 2, RED, { rim: 0 });
      }
      break;
    case 'C':
      if (!q.back) { pRect('C.col', -22, -164, 44, 22, 8, '#26252a', { rim: 0 }); ctx.fillStyle = 'rgba(250,240,230,.9)'; ctx.fillRect(-1.5, -142, 3, 80); }
      pRect('C.hem', -60, -70, 120, 10, 3, '#a8282f', { rim: 0 });
      break;
    case 'D':
      for (let i = 0; i < 3; i++) pRect(`D.ts${i}`, -6, -136 + i * 14, 62, 7, 3, WHITE, { rim: 0 });
      if (!q.back) { ctx.fillStyle = 'rgba(250,245,240,.55)'; ctx.fillRect(-1.5, -150, 3, 90); }
      break;
    case 'E':
      if (!q.back) { pPoly('E.col', [[-26, -160], [0, -134], [26, -160]], '#dedad3', { smooth: 0, rim: 0 }); ctx.strokeStyle = 'rgba(160,150,140,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-30, -96); ctx.quadraticCurveTo(-10, -86, 6, -100); ctx.stroke(); }
      pRect('E.hem', -60, -72, 120, 12, 3, '#e4e0d8', { rim: 0 });
      break;
    case 'F': {
      const cols = ['#8a3040', '#f1ece4', '#7e6aa8', '#8a3040', '#23222b', '#f1ece4', '#7e6aa8', '#b8564d', '#8a3040', '#f1ece4'];
      for (let i = 0; i < 16; i++) { const r = mulberry32(900 + i); withT(-52 + r() * 104, -154 + r() * 92, (r() - .5) * 1.2, 1, 1, () => pRect(`F.pt${i}`, -10 - r() * 8, -5 - r() * 4, 20 + r() * 14, 10 + r() * 8, 2, cols[i % cols.length], { rim: 0, amp: 1 })); }
      if (!q.back) pRect('F.tee', -13, -160, 26, 100, 4, WHITE, { rim: 0 });
      break;
    }
    case 'G':
      if (!q.back) { pRect('G.tee', -12, -162, 24, 30, 4, WHITE, { rim: 0 }); ctx.fillStyle = '#f3ecdf'; ctx.fillRect(-2, -140, 4, 80); pRect('G.pk1', -42, -98, 22, 5, 2, '#f3ecdf', { rim: 0 }); pRect('G.pk2', 20, -98, 22, 5, 2, '#f3ecdf', { rim: 0 }); }
      pRect('G.hem', -60, -72, 120, 12, 3, '#f3ecdf', { rim: 0 });
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
    if (id === 'B') pRect('B.as', -14, ARM_L - 16, 28, 7, 3, RED, { rim: 0 });
    if (id === 'D') { pRect('D.as', -14, 22, 28, 5, 2, WHITE, { rim: 0 }); pRect('D.as2', -14, 31, 28, 5, 2, WHITE, { rim: 0 }); }
    if (id === 'G') pRect('G.cuff', -14, ARM_L - 12, 28, 10, 3, '#f3ecdf', { rim: 0 });
    if (id === 'F') { pRect('F.ap1', -10, 6, 14, 9, 2, '#8a3040', { rim: 0 }); pRect('F.ap2', 0, 26, 12, 8, 2, '#f1ece4', { rim: 0 }); pRect('F.ap3', -12, 40, 12, 8, 2, '#7e6aa8', { rim: 0 }); }
    ctx.restore();
    ctx.translate(0, (ARM_L + 4) * st);
    paper(shape('hand', () => sEllipse(0, 0, 15, 15), { amp: .8, rim: 2.4 }), SKIN);
    if (prop) withT(0, 0, side * ang, 1, 1, () => prop(side));
  });
}
function drawLeg(id, c, side, ang, knee) {
  withT(side * HIP_X, HIP_Y, -side * ang, 1, 1, () => {
    paper(shape(`${id}.leg`, () => sRRect(-15, -6, 30, 60 - knee, 12), { amp: 1 }), c.pants);
    if (id === 'D') pRect('D.ls', -15, 22, 30, 6, 2, WHITE, { rim: 0 });
    if (id === 'E') for (let k = 0; k < 3; k++) pRect(`E.ls${k}`, -15, 18 + k * 12 - knee * .5, 30, 6, 2, '#26252a', { rim: 0 });
    if (id === 'B') { ctx.fillStyle = '#3a3940'; for (let k = 0; k < 4; k++) ctx.fillRect(side * 12 - 1.5, 2 + k * 12, 3, 6); }
    paper(shape(`shoe${side}`, () => sEllipse(side * 6, 58, 23, 13), { amp: 1 }), c.shoes);
    if (id === 'C' || id === 'B' || id === 'E') pRect(`sole${side}`, side * 6 - 20, 64, 40, 5, 2, '#f3eee6', { rim: 0 });
  });
}

// ---------------- face ----------------
function drawEyes(q, c) {
  const ex = 38, ey = 20, lx = q.lookX * 5 + q.turn * 10, ly = q.lookY * 4;
  const iris = c.iris;
  for (const side of [-1, 1]) {
    const x = side * ex + q.turn * 12, y = ey;
    ctx.save(); ctx.translate(x, y);
    switch (q.eyes) {
      case 'happy': case 'squint': {
        ctx.strokeStyle = EYE; ctx.lineWidth = 5.5; ctx.lineCap = 'round'; ctx.beginPath();
        if (q.eyes === 'happy') { ctx.moveTo(-13, 5); ctx.quadraticCurveTo(0, -12, 13, 5); }
        else { ctx.moveTo(-11 * side, -9); ctx.lineTo(9 * side, 0); ctx.lineTo(-11 * side, 9); }
        ctx.stroke(); break;
      }
      case 'closed': {
        ctx.strokeStyle = EYE; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-13, -2); ctx.quadraticCurveTo(0, 9, 13, -2); ctx.stroke(); break;
      }
      case 'shock': {
        ctx.fillStyle = '#fffaf2'; ctx.beginPath(); ctx.ellipse(0, 0, 17, 21, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = EYE; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = iris[0]; ctx.beginPath(); ctx.arc(lx * .6, ly * .6, 7, 0, TAU); ctx.fill();
        ctx.fillStyle = EYE; ctx.beginPath(); ctx.arc(lx * .6, ly * .6, 3.5, 0, TAU); ctx.fill(); break;
      }
      default: {
        const big = q.eyes === 'huge' ? 1.22 : 1;
        const rx = 19 * big, ry = 23.5 * big * q.blink;
        if (ry < 2.5) { ctx.strokeStyle = EYE; ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-13, 2); ctx.quadraticCurveTo(0, 6, 13, 2); ctx.stroke(); break; }
        // sclera sliver
        ctx.fillStyle = '#fffaf4'; ctx.beginPath(); ctx.ellipse(-side * 2, 1, rx + 3, ry, 0, 0, TAU); ctx.fill();
        ctx.save(); ctx.translate(lx, ly);
        ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fillStyle = iris[0]; ctx.fill();
        ctx.save(); ctx.clip();
        ctx.fillStyle = iris[1]; ctx.beginPath(); ctx.ellipse(0, ry * .62, rx * .9, ry * .62, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#1b0e0b'; ctx.beginPath(); ctx.ellipse(0, ry * .02, rx * .5, ry * .52, 0, 0, TAU); ctx.fill();
        ctx.restore();
        if (q.blink > .5) {
          ctx.fillStyle = '#fffdf8';
          ctx.beginPath(); ctx.ellipse(rx * .32, -ry * .36, rx * .34, ry * .3, -.3, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.arc(-rx * .42, ry * .44, rx * .13, 0, TAU); ctx.fill();
          if (q.eyes === 'huge') star(-rx * .1, ry * .1, 6, 1.8);
        }
        ctx.restore();
        // upper lid with an outer flick, light lower lash
        ctx.strokeStyle = EYE; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 4.6;
        ctx.beginPath(); ctx.moveTo(-side * (rx + 2), -ry * .15);
        ctx.quadraticCurveTo(-side * rx * .2, -ry * 1.32, side * (rx + 3), -ry * .42);
        ctx.lineTo(side * (rx + 7), -ry * .18); ctx.stroke();
        ctx.strokeStyle = 'rgba(120,70,55,.45)'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.ellipse(0, 0, rx + 1, ry + 1, 0, Math.PI * .25, Math.PI * .75); ctx.stroke();
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
  const x = q.turn * 12, y = 52, m = q.mo;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(222,150,130,.7)'; ctx.beginPath(); ctx.ellipse(0, -16, 3, 2, 0, 0, TAU); ctx.fill();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  switch (q.mouth) {
    case 'smile': ctx.strokeStyle = MOUTH; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-8, -2); ctx.quadraticCurveTo(0, 6, 8, -2); ctx.stroke(); break;
    case 'smirk': ctx.strokeStyle = MOUTH; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-9, 1); ctx.quadraticCurveTo(2, 6, 10, -4); ctx.stroke(); break;
    case 'flat': ctx.strokeStyle = MOUTH; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-7, 1); ctx.lineTo(7, 1); ctx.stroke(); break;
    case 'wavy': ctx.strokeStyle = MOUTH; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(-11, 2); ctx.quadraticCurveTo(-5.5, -4, 0, 2); ctx.quadraticCurveTo(5.5, 8, 11, 2); ctx.stroke(); break;
    case 'o': ctx.fillStyle = MOUTH; ctx.beginPath(); ctx.ellipse(0, 3, 4.5 + m * 3, 5 + m * 7, 0, 0, TAU); ctx.fill(); break;
    case 'sing': case 'open': case 'laugh': {
      const w = q.mouth === 'laugh' ? 16 : q.mouth === 'sing' ? 10 : 12, d = (q.mouth === 'laugh' ? 24 : 17) * (0.35 + 0.65 * m);
      ctx.fillStyle = MOUTH; ctx.beginPath(); ctx.moveTo(-w, -3);
      ctx.quadraticCurveTo(0, -6, w, -3); ctx.quadraticCurveTo(w * .9, d, 0, d); ctx.quadraticCurveTo(-w * .9, d, -w, -3); ctx.fill();
      ctx.save(); ctx.clip(); ctx.fillStyle = TONGUE; ctx.beginPath(); ctx.ellipse(0, d + 2, w * .7, d * .45, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fffaf4'; ctx.fillRect(-w, -6, w * 2, 4.5); ctx.restore();
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
  drawLeg(id, c, -1, q.legL, q.kneeL); drawLeg(id, c, 1, q.legR, q.kneeR);
  pRect(`${id}.hip`, -51, -84, 102, 32, 14, c.pants, { rim: 2.5 });
  if (id === 'G' && !back) withT(24, -70, .08, 1, 1, () => { pRect('G.patch', -10, -9, 20, 18, 3, '#e8932f', { rim: 1.5 }); text('A', 0, 1, 14, '#f6d36a', { weight: 700 }); });
  const UP = 1.25;
  if (back) { if (q.armL < UP) drawArm(id, c, -1, q.armL, q, q.propL); if (q.armR < UP) drawArm(id, c, 1, q.armR, q, q.propR); }
  drawTorso(id, c, { back });
  if (!back) {
    if (!q.hide.armL && q.armL < UP) drawArm(id, c, -1, q.armL, q, q.propL);
    if (!q.hide.armR && q.armR < UP) drawArm(id, c, 1, q.armR, q, q.propR);
  }
  if (!q.hide.head) {
    ctx.save();
    ctx.translate(0, HEAD_Y + q.headDy); ctx.rotate(q.headTilt);
    drawHairBack(id, c);
    if (!back) {
      for (const sd of [-1, 1]) pEll(`ear${sd}`, sd * 92, 14, 15, 18, SKIN, { rim: 2.4, amp: .8 });
      paper(shape('face', () => sEllipse(0, 6, HRX, HRY), { amp: 1.3, rim: 3 }), SKIN);
      if (q.cheeks) { ctx.save(); ctx.globalAlpha = .5 * q.cheeks; pEll('chk-1', -58 + q.turn * 10, 44, 17, 10, CHEEK, { rim: 0, amp: 1 }); pEll('chk1', 58 + q.turn * 10, 44, 17, 10, CHEEK, { rim: 0, amp: 1 }); ctx.restore(); }
      drawEyes(q, c); drawMouth(q);
      drawHairFront(id, c, q);
      drawBrows(id, c, q);
      if (q.headset) { ctx.strokeStyle = '#3a3640'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-92, 20); ctx.quadraticCurveTo(-80, 58, -42, 60); ctx.stroke(); ctx.fillStyle = '#3a3640'; ctx.beginPath(); ctx.arc(-40, 60, 5, 0, TAU); ctx.fill(); }
      if (q.sweat > 0) { ctx.save(); ctx.globalAlpha = q.sweat; ctx.fillStyle = '#bfe0ee'; ctx.beginPath(); ctx.moveTo(84, -24); ctx.quadraticCurveTo(96, -2, 88, 6); ctx.quadraticCurveTo(76, 6, 80, -6); ctx.closePath(); ctx.fill(); ctx.restore(); }
    } else {
      paper(shape(`${id}.hbk`, () => sEllipse(0, -10, 116, 108), { amp: 2, rim: 3 }), c.hair);
      if (id === 'D') withT(0, 0, -.06, 1, 1, () => { pPoly('D.crown', HAIR.D.crown(), '#242328', { smooth: 0, amp: 1.4, rim: 3 }); pPoly('D.brim', HAIR.D.brim(), '#1f1e23', { smooth: 2, amp: 1.2, rim: 3 }); });
      if (id === 'A') pPoly('A.band', HAIR.A.band(), WHITE, { smooth: 0, amp: .8, rim: 2 });
      if (id === 'E') pPoly('E.band', HAIR.E.band(), '#232128', { smooth: 0, amp: .8, rim: 2.4 });
      if (id === 'F') pPoly('F.band', HAIR.F.band(), '#2a2d45', { smooth: 0, amp: .8, rim: 2.4 });
      if (id === 'G') pPoly('G.hf', HAIR.G.front(), c.hair, { smooth: 1, amp: 1.8, rim: 3 });
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
