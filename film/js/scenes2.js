// scenes2.js : Scene 3 (hallway), Scene 4 (the show), Scene 5 (the wish)
'use strict';

// =============================================================== SCENE 3: near disaster (7 - 10)
const HALL = { floorY: 812 };
function drawHallBack(t) {
  ctx.fillStyle = paperPattern(PAL.mint); ctx.fillRect(-600, -600, 3200, HALL.floorY + 620);
  ctx.strokeStyle = 'rgba(240,250,245,.45)'; ctx.lineWidth = 3;
  for (let x = -600; x < 2600; x += 72) { ctx.beginPath(); ctx.moveTo(x, -600); ctx.lineTo(x, 600); ctx.stroke(); }
  for (let y = -600; y < 600; y += 72) { ctx.beginPath(); ctx.moveTo(-600, y); ctx.lineTo(2600, y); ctx.stroke(); }
  pRect('h.wain', -600, 590, 3200, HALL.floorY - 590, 0, '#6f9f91', { amp: 1.4 });
  pRect('h.rail', -600, 578, 3200, 18, 3, '#f3e7d6', { amp: 1 });
  ctx.fillStyle = paperPattern('#9a6f52'); ctx.fillRect(-600, HALL.floorY, 3200, 900);
  pRect('h.runner', -600, HALL.floorY + 40, 3200, 150, 0, PAL.brick, { amp: 2, rim: 3 });
  ctx.strokeStyle = 'rgba(228,190,99,.75)'; ctx.lineWidth = 5;
  for (const yy of [HALL.floorY + 56, HALL.floorY + 174]) { ctx.beginPath(); ctx.moveTo(-600, yy); ctx.lineTo(2600, yy); ctx.stroke(); }
  pRect('h.base', -600, HALL.floorY - 20, 3200, 24, 2, '#5d8c7f', { amp: 1 });
  // framed photos + clock + stage sign
  [[240, 300, PAL.peach], [1500, 290, PAL.lilac]].forEach(([x, y, c], i) => withT(x, y, i ? -.04 : .05, 1, 1, () => {
    pRect(`h.ph${i}`, -70, -56, 140, 112, 4, '#f6ecdc'); pRect(`h.pi${i}`, -58, -44, 116, 88, 3, c, { rim: 0 });
    for (let k = 0; k < 3; k++) pEll(`h.pf${i}${k}`, -32 + k * 32, -2, 14, 14, SKIN, { rim: 0 });
  }));
  drawClock('hclk', 640, 270, 62, 7, 56 + (t - 7) / 60 * 10, { sec: (t * 6) % 60 });
  withT(1180, 300, -.03, 1, 1, () => {
    pRect('h.sign', -128, -48, 256, 96, 10, PAL.purple);
    text('STAGE', -26, 2, 46, '#fbf3e6', { weight: 700 });
    pPoly('h.arrow', [[68, -14], [92, -14], [92, -30], [122, 0], [92, 30], [92, 14], [68, 14]], PAL.mustard, { smooth: 0, rim: 2.4 });
  });
}
// pile layout: [id, hipX, footY, rot, s]
const PILE = [
  ['C', 905, 880, -1.57], ['A', 1095, 880, 1.57],
  ['F', 945, 770, -1.38], ['B', 1065, 762, 1.4],
  ['G', 960, 668, -0.75], ['D', 1048, 656, 0.62],
];
const PILE_START = { A: [380, 905], B: [470, 905], C: [300, 905], D: [560, 905], F: [220, 905], G: [520, 905] };
function sceneHall(t) {
  const cam = camAt(t, [[7.0, 1.3, 470, 735], [7.75, 1.3, 800, 735, E.lin], [8.3, 1.3, 960, 690, E.out], [8.85, 1.34, 965, 688, E.lin],
    [9.05, 1.6, 1000, 640, E.io], [9.45, 1.58, 1000, 645, E.lin], [9.75, 1.34, 965, 690, E.io], [10, 1.35, 965, 690, E.lin]]);
  const [sx, sy] = shake(t, 8.35, 16, .4);
  applyCam(cam, sx, sy);
  drawHallBack(t);
  const s = 0.72;
  const ph = (t - 7) * 26;
  // ---- E: runs, cake wobbles, trips, sits at the front
  const ex = t < 7.78 ? lerp(240, 820, prog(t, 7.0, 7.78)) : lerp(820, 760, E.out(prog(t, 7.78, 8.2)));
  const wob = t < 7.78 ? Math.sin((t - 7) * 23) * (0.05 + 0.3 * E.in2(prog(t, 7.0, 7.75))) : 0;
  // ---- the other six chase, then dive into a pile
  const lander = (id, i) => {
    const st = PILE_START[id], pl = PILE.find(p => p[0] === id);
    const td = 7.86 + i * .035, tl = 8.33;
    let x, y, rot, jump = 0, extra = {};
    if (t < td) {
      const runX = st[0] + (t - 7) * 430 - 260;
      x = runX; y = st[1]; rot = .12; jump = -12 * Math.abs(Math.sin(ph + i));
      extra = { legL: .35 * Math.sin(ph + i), legR: -.35 * Math.sin(ph + i), armL: .6 + .4 * Math.sin(ph + i), armR: .6 - .4 * Math.sin(ph + i), eyes: t > 7.7 ? 'shock' : 'open', mouth: t > 7.7 ? 'o' : 'open', mo: .6 };
    } else if (t < tl) {
      const u = prog(t, td, tl), e = E.io(u);
      const x0 = st[0] + (td - 7) * 430 - 260;
      x = lerp(x0, pl[1], e); y = lerp(st[1], pl[2], e) - Math.sin(Math.PI * u) * 170; rot = lerp(.12, pl[3], E.out(u));
      extra = { armL: 2.4, armR: 2.4, legL: .1, legR: .1, eyes: 'shock', mouth: 'o', mo: 1 };
    } else {
      x = pl[1]; y = pl[2]; rot = pl[3];
      const land = t - tl;
      extra = { sq: 1 - .12 * Math.exp(-land * 9) * Math.cos(land * 30), armL: .5, armR: .5 };
    }
    return { x, y, rot, jump, s, ...extra };
  };
  const react = (p, i) => {
    if (t < 8.33) return p;
    if (t < 8.45) { p.eyes = 'closed'; p.mouth = 'wavy'; }
    else if (t < 8.85) { p.eyes = 'huge'; p.mouth = 'o'; p.mo = .3; }
    else if (t < 9.08) { p.eyes = 'closed'; p.mouth = 'o'; p.mo = 1; p.cheeks = 1.4; }
    else if (t < 9.45) { p.eyes = 'open'; p.mouth = 'flat'; p.lookX = Math.sin((t - 9.1) * 9 + i * 2) > 0 ? 1 : -1; }
    else { p.eyes = 'squint'; p.mouth = 'laugh'; p.mo = .6 + .4 * Math.abs(Math.sin((t - 9.45) * 14 + i)); p.jump = -10 * Math.abs(Math.sin((t - 9.45) * 12 + i)); p.rot += Math.sin((t - 9.45) * 12 + i) * .06; }
    return p;
  };
  // draw order: bottom of pile first
  const ids = ['C', 'A', 'F', 'B', 'G', 'D'];
  const poses = {};
  ids.forEach((id, i) => { poses[id] = react(lander(id, ORDER.indexOf(id)), i); });
  // runners not yet diving are drawn behind E
  ids.forEach(id => { if (t < 7.86) drawSinger(id, poses[id]); });
  // E
  let ep;
  if (t < 7.78) ep = { x: ex, y: 905 - 12 * Math.abs(Math.sin(ph)), s, rot: .14 + wob * .3, turn: .5, lookX: .3, lookY: -1, eyes: t > 7.45 ? 'shock' : 'huge', mouth: t > 7.45 ? 'wavy' : 'open', mo: .6, armR: 1.35, armL: -.35, legL: .35 * Math.sin(ph), legR: -.35 * Math.sin(ph), sweat: 1 };
  else {
    const u = prog(t, 7.78, 8.2);
    ep = { x: ex, y: 905, s, rot: lerp(.5, 0, E.out(u)) * (u < 1 ? 1 : 0), sq: lerp(.8, .86, u), legL: 1.25, legR: 1.25, armL: .9, armR: .9, eyes: 'shock', mouth: 'o', mo: 1 };
    ep = react(ep, 6);
    if (t > 8.33 && t < 8.85) { ep.lookX = 1; ep.lookY = -1; }
  }
  // ---- pile
  ids.forEach(id => { if (t >= 7.86) drawSinger(id, poses[id]); });
  drawSinger('E', ep);
  // ---- arms holding the tray up from the top of the pile
  const caught = t >= 8.33;
  const cakeTopY = 470;
  const armK = 1 - .1 * Math.exp(-(t - 8.33) * 8) * Math.cos((t - 8.33) * 28);
  const ARMS = [[972, 600, -.22, 'D'], [1084, 606, .2, 'G']];
  if (caught) ARMS.forEach(([x, y, a, id]) => looseArm(x, y, a, (y - cakeTopY - 8) / Math.cos(a) * armK, SINGERS[id].sleeve, id, false));
  // ---- cake: on tray -> flying -> caught
  let cx, cy, crot, cs = .52;
  if (t < 7.78) { cx = ex + 78 * s / S1S * (S1S / .62) * .9; cy = 905 - 12 * Math.abs(Math.sin(ph)) - s * 160 - 6; crot = wob; }
  else if (!caught) {
    const u = prog(t, 7.78, 8.33);
    const x0 = 820 + 70, y0 = 905 - s * 160 - 6;
    cx = lerp(x0, 1028, u); cy = y0 + (cakeTopY - y0) * u - 300 * Math.sin(Math.PI * u) * (1 - u * .3); crot = .5 * Math.sin(Math.PI * u) + u * .1;
  } else {
    const d = t - 8.33; cx = 1028; cy = cakeTopY + 10 * Math.exp(-d * 7) * Math.sin(d * 30); crot = .12 * Math.exp(-d * 5) * Math.sin(d * 20);
  }
  const lit = t < 9.06 ? [1, 1] : [0, 0];
  const smoke = [prog(t, 9.06, 9.8), prog(t, 9.1, 9.85)];
  pRect('tray', cx - 82, cy, 164, 12, 6, '#d9d4cc', { amp: .8 });
  drawCake('cakeR', cx, cy, cs, { t, rot: crot, plate: false, lit, smoke, flameS: 1 + (t > 8.85 && t < 9.06 ? -.4 * prog(t, 8.85, 9.06) : 0) });
  if (caught) ARMS.forEach(([x, y, a, id]) => looseArm(x, y, a, (y - cakeTopY - 8) / Math.cos(a) * armK, SINGERS[id].sleeve, id, true));
  // ---- impact puffs, sigh wind, laugh tears
  if (t > 8.33) for (let k = 0; k < 4; k++) puff(840 + k * 110, 900, prog(t, 8.33, 8.9), 50, 30 + k);
  if (t > 8.84 && t < 9.12) {
    const a = Math.sin(Math.PI * prog(t, 8.84, 9.12));
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    [[860, 700], [1140, 690], [900, 600], [1110, 590], [760, 760]].forEach(([fx, fy], i) => {
      const tx = 1028 + (i - 2) * 14, ty = cakeTopY - 150;
      ctx.setLineDash([26, 18]); ctx.lineDashOffset = -(t - 8.84) * 260;
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo((fx + tx) / 2 + (i % 2 ? 40 : -40), (fy + ty) / 2, tx, ty); ctx.stroke();
    });
    ctx.restore();
  }
  if (t > 7.8 && t < 8.33) motionLines(700, 760, 140, 4, 1, 'rgba(255,250,240,.7)');
}
function looseArm(x, y, ang, len, color, id, hand) {
  withT(x, y, ang, 1, 1, () => {
    if (!hand) {
      ctx.save(); ctx.scale(1, len / 110);
      pRect(`la.${id}`, -12, -110, 24, 118, 12, color, { amp: .8 });
      if (id === 'D') { pRect('la.Ds', -6, -104, 3, 100, 1.5, WHITE, { rim: 0 }); pRect('la.Ds2', 2, -104, 3, 100, 1.5, WHITE, { rim: 0 }); }
      ctx.restore();
    } else pEll('la.h', 0, -len + 4, 12, 12, SKIN, { rim: 2.2 });
  });
}

// =============================================================== SCENE 4: the show (10 - 20)
const SONG = [ // [time, syllable, dur]
  [10.667, 'Hap', .25], [10.917, 'py', .083], [11.0, 'birth', .333], [11.333, 'day', .333], [11.667, 'to', .333], [12.0, 'you', .667],
  [12.667, 'Hap', .25], [12.917, 'py', .083], [13.0, 'birth', .333], [13.333, 'day', .333], [13.667, 'to', .333], [14.0, 'you', .667],
  [14.667, 'Hap', .25], [14.917, 'py', .083], [15.0, 'birth', .333], [15.333, 'day', .333], [15.667, 'dear', .333], [16.0, 'Ma', .333], [16.333, 'ay', .667],
  [17.0, 'Hap', .25], [17.25, 'py', .083], [17.333, 'birth', .333], [17.667, 'day', .333], [18.0, 'to', .333], [18.333, 'you', 1.0],
];
function singMouth(t) {
  let best = null;
  for (const n of SONG) if (t >= n[0] - .03 && t < n[0] + n[2] + .02) best = n;
  if (!best) return 0.08;
  const d = t - best[0] + .03;
  return clamp(d / .05) * (0.55 + 0.45 * Math.exp(-d * 4));
}
const STAGE = { floor: 790, front: 892 };
const S4X = ORDER.map((_, i) => 150 + i * 130);
function drawStageBack(t, o = {}) {
  ctx.fillStyle = paperPattern('#3c3266'); ctx.fillRect(-300, -300, 1700, STAGE.floor + 300);
  for (let i = 0; i < 12; i++) pRect(`sp.p${i}`, -300 + i * 150, -300, 70, STAGE.floor + 300, 0, '#45397a', { rim: 0, amp: 1.6 });
  // hanging paper stars + bunting
  const r = mulberry32(31);
  for (let i = 0; i < 9; i++) {
    const x = 60 + i * 120 + r() * 30, len = 60 + r() * 120, sw = Math.sin(t * 1.3 + i) * .05;
    withT(x, -20, sw, 1, 1, () => {
      ctx.strokeStyle = 'rgba(250,240,220,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, len); ctx.stroke();
      ctx.save(); ctx.translate(0, len + 16); ctx.fillStyle = paperPattern(i % 2 ? PAL.mustard : '#f6e7b8'); star(0, 0, 18, 8, 5); ctx.restore();
    });
  }
  for (let row = 0; row < 1; row++) {
    ctx.strokeStyle = 'rgba(250,240,220,.7)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-50, 60); ctx.quadraticCurveTo(540, 150, 1130, 60); ctx.stroke();
    for (let i = 0; i < 15; i++) {
      const u = i / 14, x = lerp(-30, 1110, u), y = 60 + 90 * 4 * u * (1 - u) * .5 * 2 * .5 + 0;
      const yy = (1 - u) * (1 - u) * 60 + 2 * u * (1 - u) * 150 + u * u * 60;
      withT(x, yy, Math.sin(t * 2 + i) * .04, 1, 1, () => pPoly(`bf${i}`, [[-22, 0], [22, 0], [0, 40]], CONF_COLS[i % CONF_COLS.length], { smooth: 0, amp: .8, rim: 2.4 }));
    }
  }
  // floor
  ctx.fillStyle = paperPattern('#b98a5e'); ctx.fillRect(-300, STAGE.floor, 1700, STAGE.front - STAGE.floor);
  ctx.strokeStyle = 'rgba(110,70,45,.3)'; ctx.lineWidth = 3;
  for (let y = STAGE.floor + 24; y < STAGE.front; y += 26) { ctx.beginPath(); ctx.moveTo(-300, y); ctx.lineTo(1400, y); ctx.stroke(); }
  pRect('st.edge', -300, STAGE.front - 4, 1700, 34, 3, '#6b4a3a', { amp: 1.2 });
  ctx.fillStyle = paperPattern('#2a2140'); ctx.fillRect(-300, STAGE.front + 28, 1700, 600);
}
function spotlights(t, on) {
  const L = [[170, 1, 10.15], [910, 1, 10.3], [540, 1.3, 10.45]];
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  L.forEach(([x, w, t0], i) => {
    const a = (t > t0 ? 1 : 0) * (0.85 + 0.15 * Math.sin(t * 3 + i)) * on;
    if (a <= 0) return;
    const flick = t - t0 < .08 ? .5 : 1;
    const tx = i === 2 ? 540 : x + (i ? -120 : 120) + Math.sin(t * .9 + i) * 40;
    const g = ctx.createLinearGradient(0, -60, 0, STAGE.front);
    g.addColorStop(0, `rgba(255,236,180,${.42 * a * flick})`); g.addColorStop(1, `rgba(255,236,180,${.16 * a * flick})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 24, -60); ctx.lineTo(x + 24, -60); ctx.lineTo(tx + 190 * w, STAGE.front - 40); ctx.lineTo(tx - 190 * w, STAGE.front - 40); ctx.closePath(); ctx.fill();
    ctx.fillStyle = `rgba(255,240,200,${.25 * a * flick})`; ctx.beginPath(); ctx.ellipse(tx, STAGE.floor + 50, 200 * w, 34, 0, 0, TAU); ctx.fill();
  });
  ctx.restore();
}
function drawCurtains(t) {
  const open = E.io(prog(t, 10.0, 10.6));
  const off = open * 500;
  for (const side of [-1, 1]) {
    withT(540 + side * (270 + off), 0, 0, 1, 1, () => {
      pRect(`cur${side}`, -290, -100, 580, STAGE.front + 120, 8, '#b8433a', { amp: 2.2, rim: 3 });
      for (let i = 0; i < 6; i++) pRect(`curf${side}${i}`, -270 + i * 96, -100, 34, STAGE.front + 110, 14, '#9c3530', { rim: 0, amp: 1.6 });
      pRect(`curt${side}`, side * -290 + (side < 0 ? 0 : -24), 380, 24, 70, 8, PAL.mustard, { rim: 2 });
    });
  }
  // valance
  const sc = [];
  for (let i = 0; i <= 18; i++) { const x = -40 + i * 64; sc.push([x, 70], [x + 32, 104]); }
  pPoly('val', [[-60, -60], [1140, -60], [1140, 70], ...sc.reverse()], '#a63a33', { smooth: 1, amp: 1.6, rim: 3 });
  ctx.strokeStyle = PAL.mustard; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-60, 58); ctx.lineTo(1140, 58); ctx.stroke();
}
function crowd(t) {
  const r = mulberry32(55);
  const rows = [[STAGE.front + 70, 18, 60, '#2e2448'], [STAGE.front + 150, 15, 72, '#251d3c']];
  rows.forEach(([y, n, hr, col], ri) => {
    for (let i = 0; i < n; i++) {
      const x = -40 + i * (1160 / (n - 1)) + (r() - .5) * 30, by = y + (r() - .5) * 16;
      const beat = t > 10.6 ? Math.sin((t - 11) * Math.PI * 3 + i * .7 + ri) : 0;
      const bob = -Math.abs(beat) * 6;
      // lightstick
      const lsOn = t > 10.35 + (i % 5) * .04;
      if (lsOn && r() > .25) {
        const ang = beat * .35 + (r() - .5) * .3, hx = x + (r() > .5 ? 34 : -34);
        withT(hx, by - hr * .4 + bob, ang, 1, 1, () => {
          ctx.fillStyle = '#2b2533'; ctx.fillRect(-5, -60, 10, 60);
          ctx.save(); ctx.globalCompositeOperation = 'screen';
          const g = ctx.createRadialGradient(0, -78, 2, 0, -78, 48); g.addColorStop(0, 'rgba(190,140,255,.75)'); g.addColorStop(1, 'rgba(150,90,230,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -78, 48, 0, TAU); ctx.fill(); ctx.restore();
          ctx.fillStyle = '#c9a3ff'; ctx.beginPath(); ctx.arc(0, -76, 17, 0, TAU); ctx.fill();
          ctx.fillStyle = '#efe3ff'; ctx.beginPath(); ctx.arc(-4, -80, 6, 0, TAU); ctx.fill();
        });
      } else r();
      withT(x, by + bob, 0, 1, 1, () => {
        ctx.fillStyle = paperPattern(col);
        ctx.beginPath(); ctx.ellipse(0, hr * 1.25, hr * 1.25, hr * .9, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, hr * .62, 0, TAU); ctx.fill();
      });
    }
  });
}
function choreo(t, i) {
  const p = { mouth: 'sing', mo: singMouth(t), eyes: 'open', headset: true };
  const bt = (t - 11) * 3; // beats since bar 1
  const beatPulse = x => Math.pow(Math.max(0, Math.cos(Math.PI * (x - Math.round(x)))), 6);
  if (t < 10.6) { Object.assign(p, { armL: .2, armR: .2, mouth: 'smile', jump: -4 * Math.abs(Math.sin(t * 8 + i)) }); }
  else if (t < 11.0) { const k = E.out(prog(t, 10.6, 10.95)); Object.assign(p, { armL: lerp(.2, 2.2, k), armR: lerp(.2, 2.2, k) }); }
  else if (t < 12.0) { const sw = Math.sin(bt * Math.PI); Object.assign(p, { rot: .1 * sw, armL: 2.2 + .35 * sw, armR: 2.2 - .35 * sw, jump: -14 * beatPulse(bt), eyes: 'happy' }); }
  else if (t < 12.667) { const k = pop(t, 12.0, 3, .5); Object.assign(p, { armL: lerp(2.2, 1.45, k), armR: lerp(2.2, 1.45, k), jump: -26 * Math.sin(Math.PI * prog(t, 12.0, 12.3)) }); }
  else if (t < 14.0) { const c = beatPulse(bt); Object.assign(p, { armL: lerp(.55, -.62, c), armR: lerp(.55, -.62, c), jump: -10 * c, rot: .06 * Math.sin(bt * Math.PI) }); }
  else if (t < 14.667) { const k = pop(t, 14.0, 3, .5); Object.assign(p, { armL: lerp(.4, 2.45, k), armR: lerp(.4, 2.45, k), eyes: 'happy', heart: k }); }
  else if (t < 15.55) { const sw = Math.sin((t - 14.667) * Math.PI * 3); Object.assign(p, { armL: -.3, armR: 1.35 + .1 * sw, rot: .08 * sw, jump: -8 * beatPulse(bt) }); }
  else if (t < 16.0) { const k = E.out(prog(t, 15.55, 15.85)); Object.assign(p, { armL: lerp(-.3, 2.5, k), armR: lerp(1.35, 2.6, k), lookY: -k, headTilt: (i - 3) * -.02 * k }); }
  else if (t < 17.0) { const sw = Math.sin((t - 16) * Math.PI * 1.5); Object.assign(p, { armL: 1.55 + .2 * sw, armR: 1.55 - .2 * sw, rot: .14 * sw, eyes: 'happy' }); }
  else if (t < 17.333) { const k = E.io(prog(t, 17.0, 17.3)); Object.assign(p, { armL: lerp(1.55, .3, k), armR: lerp(1.55, .3, k), sq: 1 - .08 * k }); }
  else if (t < 18.333) { const b = Math.floor(bt), c = beatPulse(bt); Object.assign(p, { armR: b % 2 ? .5 : 2.3, armL: b % 2 ? 2.3 : .5, jump: -12 * c, sq: .94 + .06 * (1 - c) }); }
  else {
    const d = t - 18.333, air = clamp(d / .55);
    Object.assign(p, { jump: -150 * Math.sin(Math.PI * air), armL: 2.3 + .1 * Math.sin(t * 10), armR: 2.3 + .1 * Math.sin(t * 10 + 1), legL: .35 * Math.sin(Math.PI * air), legR: .35 * Math.sin(Math.PI * air), eyes: 'happy', mouth: 'open', mo: .9 });
    if (d > .55) { const l = d - .55; p.sq = 1 - .1 * Math.exp(-l * 8) * Math.cos(l * 26); p.jump = -8 * Math.abs(Math.sin(l * 8)); p.mouth = 'laugh'; }
  }
  return p;
}
function banner(t) {
  const d = t - 15.55;
  if (d < 0) return;
  const y = lerp(-320, 0, spring(d, 1.6, .45));
  const sw = Math.sin(d * 2.2) * .02 * Math.exp(-d * .4);
  withT(540, 150 + y, sw, 1, 1, () => {
    ctx.strokeStyle = 'rgba(250,240,220,.8)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-330, -40); ctx.lineTo(-300, -400); ctx.moveTo(330, -40); ctx.lineTo(300, -400); ctx.stroke();
    const sc = []; for (let i = 0; i <= 14; i++) { const x = 400 - i * (800 / 14); sc.push([x, 150], [x - 800 / 28, 176]); }
    pPoly('ban', [[-400, -60], [400, -60], ...sc], PAL.pink, { smooth: 1, amp: 1.8, rim: 4 });
    cutText('bt1', 'Happy 27th Birthday', 0, 6, 52, PAL.purple, { backColor: '#fffaf2' });
    cutText('bt2', 'May', 0, 100, 74, '#c4453c', { backColor: '#fffaf2' });
    heart(-150, 100, 22, PAL.lilac, { rim: true }); heart(150, 100, 22, PAL.mustard, { rim: true });
  });
}
function cannons(t) {
  for (const side of [-1, 1]) {
    const x = 540 + side * 455, y = STAGE.front - 24;
    const kick = t > 18.333 ? -14 * Math.exp(-(t - 18.333) * 9) : 0;
    withT(x, y, side * -.55, 1, 1, () => {
      pRect(`can${side}`, -22, -96 + kick, 44, 110, 10, side < 0 ? PAL.denim : PAL.purple);
      pRect(`canb${side}`, -24, -100 + kick, 48, 14, 5, PAL.mustard, { rim: 2 });
    });
    if (t > 18.333) puff(x - side * 50, y - 110, prog(t, 18.333, 18.9), 50, 70 + side);
  }
}
function sceneStage(t) {
  const punch = t > 11 && t < 18.333 ? .012 * Math.exp(-(((t - 11) * 3) % 1) * 4) : 0;
  const cam = camAt(t, [[10, 1.0, 540, 540], [11, 1.02, 540, 540, E.lin], [12.9, 1.06, 540, 545, E.sine], [13.4, 1.42, 540, 640, E.io], [14.9, 1.45, 540, 640, E.lin],
    [15.45, 1.0, 540, 520, E.io], [16.3, 1.0, 540, 515, E.lin], [18.2, 1.06, 540, 535, E.sine], [19.35, 1.03, 540, 540, E.sine], [20, 3.2, 540, 790, E.inn]]);
  cam.z *= 1 + punch;
  const [sx, sy] = shake(t, 18.333, 12, .45);
  applyCam(cam, sx, sy);
  drawStageBack(t);
  banner(t);
  spotlights(t, 1);
  // singers
  ORDER.forEach((id, i) => {
    const p = choreo(t - (i % 2) * 0, i);
    drawSinger(id, { x: S4X[i], y: STAGE.floor + 40, s: .66, ...p, propR: id === 'A' && t > 10.6 ? propMic : null, headset: id !== 'A' });
    if (p.heart) { const k = p.heart; heart(S4X[i], STAGE.floor + 40 - .66 * 400 - 20 * k, 28 * k, PAL.pink, { rim: true }); }
  });
  // the cake at the front, candles out
  pRect('ctab4', 540 - 70, STAGE.front - 58, 140, 18, 6, '#f3e7d6');
  pRect('ctab4l', 540 - 8, STAGE.front - 44, 16, 44, 4, '#e2d4c0', { rim: 2 });
  drawCake('cake4', 540, STAGE.front - 58, .42, { t, lit: [0, 0], plate: true });
  cannons(t);
  confetti(t, 18.333, 120, STAGE.front - 120, 1, 150, 7);
  confetti(t, 18.333, 960, STAGE.front - 120, -1, 150, 8);
  // notes from the singers
  for (let k = 0; k < 10; k++) {
    const born = 11 + k * .72, age = t - born;
    if (age < 0 || age > 1.4 || t > 18.3) continue;
    const i = (k * 3) % 7;
    note(`n4${k}`, S4X[i] + 30 + Math.sin(age * 4 + k) * 12, STAGE.floor - 230 - age * 130, .6, Math.sin(age * 3 + k) * .3, [PAL.mustard, PAL.mint, '#f6e7b8', PAL.pink][k % 4], Math.sin(Math.PI * age / 1.4));
  }
  crowd(t);
  drawCurtains(t);
}

// =============================================================== SCENE 5: make a wish (20 - 22.5)
function sceneEnd(t) {
  const cam = camAt(t, [[20, 1.1, 540, 560], [20.5, 1.02, 540, 545, E.out], [22.5, 1.0, 540, 540, E.sine]]);
  applyCam(cam);
  // backdrop
  ctx.fillStyle = paperPattern('#3c3266'); ctx.fillRect(-200, -200, 1500, 1500);
  for (let i = 0; i < 9; i++) pRect(`e.p${i}`, -200 + i * 170, -200, 80, 1500, 0, '#45397a', { rim: 0, amp: 1.6 });
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const g = ctx.createRadialGradient(540, 420, 40, 540, 420, 620); g.addColorStop(0, 'rgba(255,220,170,.42)'); g.addColorStop(1, 'rgba(255,220,170,0)');
  ctx.fillStyle = g; ctx.fillRect(-200, -200, 1500, 1500); ctx.restore();
  for (let i = 0; i < 11; i++) {
    const u = i / 10, x = lerp(-40, 1120, u), yy = (1 - u) * (1 - u) * 30 + 2 * u * (1 - u) * 120 + u * u * 30;
    withT(x, yy, Math.sin(t * 2 + i) * .04, 1.4, 1.4, () => pPoly(`ebf${i}`, [[-22, 0], [22, 0], [0, 40]], CONF_COLS[i % CONF_COLS.length], { smooth: 0, amp: .8, rim: 2.4 }));
  }
  // the band crowding behind the cake
  const turn = E.out(prog(t, 20.85, 21.05));
  const band = [['B', 330, 640, .9], ['D', 540, 610, .92], ['F', 750, 640, .9], ['A', 105, 900, 1.0], ['C', 280, 960, 1.0], ['E', 800, 960, 1.0], ['G', 975, 900, 1.0]];
  band.forEach(([id, x, y, s], i) => {
    const toward = x < 540 ? 1 : x > 540 ? -1 : 0;
    const p = { x, y: y - 6 * Math.abs(Math.sin(t * 2.2 + i)) * (1 - turn), s, shadow: false, headset: id !== 'A' };
    if (turn < 1e-3) Object.assign(p, { lookX: toward * .8, lookY: 1, headTilt: toward * .12, eyes: 'open', mouth: t > 20.55 ? 'o' : 'smile', mo: .5, armL: .3, armR: .3 });
    else {
      const k = pop(t, 20.85 + i * .025, 3.2, .45);
      Object.assign(p, { lookX: toward * .8 * (1 - turn), lookY: 1 - turn, headTilt: toward * .12 * (1 - k), eyes: 'huge', mouth: 'open', mo: .55 + .4 * Math.abs(Math.sin((t - 20.9) * 10)) * (t < 21.6 ? 1 : .3), armL: lerp(.3, 2.25, k), armR: lerp(.3, 2.25, k), jump: -24 * Math.sin(Math.PI * clamp((t - 20.85 - i * .025) / .32)) });
      p.armL += .1 * Math.sin(t * 3 + i); p.armR += .1 * Math.sin(t * 3 + i + 1);
      if (t > 21.8 && Math.abs(((t - 21.8 + i * .13) % 1.6)) < .12) p.blink = .1;
    }
    drawSinger(id, p);
  });
  // cake close-up
  const lit2 = pop(t, 20.55, 3, .5), lit7 = pop(t, 20.75, 3, .5);
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const cg = ctx.createRadialGradient(540, 560, 10, 540, 560, 360); cg.addColorStop(0, `rgba(255,214,140,${.35 * Math.max(lit2, lit7)})`); cg.addColorStop(1, 'rgba(255,214,140,0)');
  ctx.fillStyle = cg; ctx.fillRect(0, 0, 1080, 1080); ctx.restore();
  drawCake('cake5', 540, 1040, 2.15, { t, lit: [lit2, lit7], plate: true, flameS: .9 });
  // magic sparkles travelling to the wicks
  for (let k = 0; k < 14; k++) {
    const target = k % 2 ? [540 + 34 * 2.15, 1040 - 2.15 * 242] : [540 - 34 * 2.15, 1040 - 2.15 * 242];
    const t0 = 20.12 + (k % 7) * .05 + (k % 2) * .2, u = prog(t, t0, t0 + .42);
    if (u <= 0 || u >= 1) continue;
    const a0 = k * 2.3, R = 260 * (1 - E.io(u));
    sparkle(target[0] + Math.cos(a0 + u * 5) * R, target[1] + Math.sin(a0 + u * 5) * R * .7, 1.1 * Math.sin(Math.PI * u) + .2, k % 3 ? '#fff1b8' : '#f3d9ff', u * 6);
  }
  for (let k = 0; k < 6; k++) { const tw = Math.sin(t * 5 + k * 1.7); if (t > 20.75) sparkle(380 + k * 64, 360 + (k % 2) * 60, .45 * Math.max(0, tw) * Math.max(lit2, lit7), '#fff1b8', t); }
  // bubble
  if (t > 20.9) {
    const a = pop(t, 20.9, 2.6, .5);
    bubble('b5', 600, 300, ['Make a wish, May!'], 58, { a, dx: -20, dy: 70, rot: -.02 + .015 * Math.sin(t * 2.4) });
  }
}
