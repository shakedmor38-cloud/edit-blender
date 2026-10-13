// scenes.js : camera + scene dispatch + Scenes 1-2 (the room)
'use strict';
function camAt(t, keys) {
  if (t <= keys[0][0]) { const k = keys[0]; return { z: k[1], x: k[2], y: k[3] }; }
  for (let i = 1; i < keys.length; i++) {
    const k1 = keys[i];
    if (t <= k1[0]) {
      const k0 = keys[i - 1], p = (k1[4] || E.io)(prog(t, k0[0], k1[0]));
      return { z: Math.exp(lerp(Math.log(k0[1]), Math.log(k1[1]), p)), x: lerp(k0[2], k1[2], p), y: lerp(k0[3], k1[3], p) };
    }
  }
  const k = keys[keys.length - 1]; return { z: k[1], x: k[2], y: k[3] };
}
function applyCam(c, sx = 0, sy = 0, rot = 0) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.translate(W / 2 + sx, H / 2 + sy);
  if (rot) ctx.rotate(rot);
  ctx.scale(c.z, c.z);
  ctx.translate(-c.x, -c.y);
}
function shake(t, t0, amp, dur = .35, f = 22) {
  const d = t - t0;
  if (d < 0 || d > dur) return [0, 0];
  const k = amp * Math.pow(1 - d / dur, 2);
  return [Math.sin(d * f * TAU) * k, Math.cos(d * f * 1.3 * TAU) * k * .7];
}
const SING_BEAT = 0.6;

function renderScene(t) {
  if (t < 3.4) sceneRoom1(t);
  else if (t < 7.0) sceneRoom2(t);
  else if (t < 10.0) sceneHall(t);
  else if (t < 20.0) sceneStage(t);
  else sceneEnd(t);
}

// =============================================================== ROOM
const ROOM = { floorY: 812, door: [1480, 1640], clock: [1000, 250] };
function drawRoomBack(t, o = {}) {
  // wall
  ctx.fillStyle = paperPattern(PAL.peach); ctx.fillRect(-400, -600, 2800, ROOM.floorY + 620);
  for (let x = -360, i = 0; x < 2300; x += 96, i++) pRect(`wst${i}`, x, -600, 40, ROOM.floorY + 600, 0, '#efc3ae', { rim: 0, amp: 1.6 });
  const r = mulberry32(5);
  ctx.fillStyle = 'rgba(255,248,236,.75)';
  for (let i = 0; i < 70; i++) { const x = -300 + r() * 2500, y = -500 + r() * 1250; ctx.save(); ctx.translate(x, y); ctx.rotate(r()); star(0, 0, 6, 1.6, 4); ctx.restore(); }
  // floor
  ctx.fillStyle = paperPattern(PAL.wood); ctx.fillRect(-400, ROOM.floorY, 2800, 900);
  ctx.strokeStyle = 'rgba(120,75,45,.28)'; ctx.lineWidth = 3;
  for (let y = ROOM.floorY + 34, i = 0; y < 1700; y += 46 + i * 6, i++) { ctx.beginPath(); ctx.moveTo(-400, y); ctx.lineTo(2400, y); ctx.stroke(); }
  pRect('baseboard', -400, ROOM.floorY - 22, 2800, 26, 2, '#c98a72', { amp: 1 });
  // poster
  withT(1290, 330, .04, 1, 1, () => {
    pRect('poster', -62, -80, 124, 160, 4, '#f6ecdc');
    pRect('poster.in', -50, -68, 100, 136, 3, PAL.purple, { rim: 0 });
    heart(0, -10, 34, PAL.pink, { rim: true });
    note('pn', 22, 40, .9, .2, PAL.mustard);
  });
  // vanity mirror with bulbs
  withT(410, 0, 0, 1, 1, () => {
    pRect('mir.fr', -150, 460, 300, 300, 14, '#f3e3cc');
    pRect('mir.gl', -126, 484, 252, 252, 8, '#cad7dc', { rim: 0, amp: 1 });
    ctx.save(); ctx.globalAlpha = .35; pPoly('mir.sh', [[-90, 484], [-40, 484], [-126, 600], [-126, 540]], '#ffffff', { smooth: 0, rim: 0 }); ctx.restore();
    if (o.mirror) o.mirror();
    for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) { pEll(`bulb${i}${sx}`, sx * 138, 486 + i * 62, 11, 11, '#f7dd8f', { rim: 2.4 }); }
    pRect('desk', -170, 760, 340, 26, 6, '#b97a5c');
    pRect('desk.l', -150, 784, 16, 40, 4, '#a5694f', { rim: 2 }); pRect('desk.r', 134, 784, 16, 40, 4, '#a5694f', { rim: 2 });
    pRect('spray', 108, 700, 22, 60, 6, PAL.denim, { rim: 2.4 }); pRect('spray.c', 112, 690, 14, 12, 3, '#dcd6cd', { rim: 2 });
  });
  // coat rack
  withT(985, ROOM.floorY + 60, o.rackRot || 0, 1, 1, () => {
    pRect('rack.p', -7, -420, 14, 420, 5, '#8a5a40', { amp: 1 });
    pEll('rack.b', 0, -2, 46, 10, '#7a4e38', { amp: 1 });
    pPoly('rack.scarf', [[-8, -380], [8, -380], [30, -300], [16, -240], [4, -300]], PAL.mustard, { smooth: 1 });
    pPoly('rack.hat', [[-40, -404], [-6, -404], [-10, -440], [-36, -440]], PAL.mint, { smooth: 1 });
  });
  // door
  const [dx0, dx1] = ROOM.door, dh = 380, dy0 = ROOM.floorY - dh;
  pRect('door.fr', dx0 - 18, dy0 - 18, dx1 - dx0 + 36, dh + 22, 4, '#f3e7d6', { amp: 1.2 });
  pRect('door.hole', dx0, dy0, dx1 - dx0, dh, 2, '#3a2c38', { rim: 0 });
  const open = o.doorOpen || 0;
  withT(dx1, 0, 0, Math.max(0.06, 1 - open * 0.9), 1, () => {
    const w = dx1 - dx0;
    pRect('door.p', -w, dy0, w, dh, 3, PAL.mint, { amp: 1, rim: 2.4 });
    pRect('door.i1', -w + 20, dy0 + 24, w - 40, 140, 4, '#9ccabd', { rim: 0 });
    pRect('door.i2', -w + 20, dy0 + 190, w - 40, 160, 4, '#9ccabd', { rim: 0 });
    pEll('door.k', -w + 22, dy0 + 200, 9, 9, PAL.mustard, { rim: 2 });
  });
  // clock + show note
  const [cx, cy] = ROOM.clock;
  drawClock('clk', cx + (o.clockJx || 0), cy, 66, 7, o.mm ?? 52.5, { sec: o.sec, wedge: o.wedge || 0, wedgeFrom: 53, rot: o.clockRot || 0 });
  withT(cx + 92, cy + 82, .1, 1, 1, () => {
    pRect('note', -52, -26, 104, 52, 3, '#f7e7a6', { amp: 1 });
    pRect('note.tape', -18, -34, 36, 14, 2, 'rgba(255,255,255,.6)', { rim: 0, flat: true });
    text('SHOW 8:00', 0, 2, 21, INK, { weight: 700 });
  });
}

// ---------------- Scene 1: the letter (0 - 3.4) ----------------
const S1X = { A: 600, B: 735, C: 870, E: 1005, F: 1140, G: 1275, D: 1405 };
const S1Y = 890, S1S = 0.72;
function rehearsePose(id, t, i) {
  const ph = (t / SING_BEAT) * Math.PI;
  const b = Math.abs(Math.sin(ph));
  return {
    jump: -7 * b, mouth: 'sing', mo: .35 + .65 * b, eyes: i % 3 === 1 ? 'happy' : 'open',
    armL: i % 2 ? 0.95 + .12 * Math.sin(ph) : -0.45, armR: i % 2 ? -0.45 : 0.95 + .12 * Math.sin(ph),
    headTilt: Math.sin(ph * .5 + i) * .05,
  };
}
function sceneRoom1(t) {
  // camera: wide -> push on D -> pull for the reaction -> whip to the clock
  const cam = camAt(t, [[0, 1.1, 1085, 610], [0.75, 1.15, 1092, 618, E.sine], [1.2, 1.95, 1385, 700, E.io], [2.15, 1.97, 1382, 698, E.lin],
    [2.5, 1.42, 1250, 625, E.out], [3.15, 1.44, 1245, 622, E.lin], [3.4, 3.4, 1015, 272, E.inn]]);
  applyCam(cam);
  const sec = (t * 6) % 60;
  drawRoomBack(t, { sec, mm: 52 + t / 60 });
  // envelope on the floor
  const envP = E.out(prog(t, 0.45, 0.88));
  const envOn = t < 1.08;
  if (t >= 0.45 && envOn) {
    const ex = lerp(1555, 1468, envP), ey = lerp(ROOM.floorY - 4, 905, envP);
    drawEnvelope(ex, ey, lerp(.45, .62, envP), lerp(-.5, .18, envP) + Math.sin(envP * 9) * .05 * (1 - envP), 0);
    motionLines(ex + 60, ey, 60, 2, (1 - envP) * (t < 0.9 ? 1 : 0), 'rgba(255,250,240,.8)', -1);
  }
  // singers
  ORDER.forEach((id, i) => {
    if (id === 'D') return;
    let p = { x: S1X[id], y: S1Y, s: S1S, ...rehearsePose(id, t, i) };
    const stop = prog(t, 0.95, 1.2);
    if (stop > 0) {
      p.mouth = t < 2.45 ? 'o' : 'open'; p.mo = t < 2.45 ? .3 : .9;
      p.jump *= 1 - stop; p.lookX = stop; p.turn = .35 * stop; p.eyes = 'open';
      p.armL = lerp(p.armL, 0.2, stop); p.armR = lerp(p.armR, 0.2, stop);
    }
    if (t > 2.45) { const k = pop(t, 2.45 + i * .03, 3, .45); p.eyes = 'huge'; p.jump = -26 * Math.sin(Math.PI * clamp((t - 2.45 - i * .03) / .35)); p.armL = lerp(.2, 1.9, k); p.armR = lerp(.2, 1.9, k); p.sq = 1 + .05 * Math.sin(Math.PI * clamp((t - 2.45) / .3)); }
    if (t > 1.0 && t < 1.12) p.blink = .1;
    drawSinger(id, p);
  });
  drawD1(t);
  // notes while rehearsing
  for (let k = 0; k < 9; k++) {
    const id = ORDER[k % 7], born = (k * 0.13) % 0.95, age = t - born;
    if (age < 0 || age > 1.1 || t > 1.4) continue;
    const a = Math.sin(Math.PI * clamp(age / 1.1)) * (1 - prog(t, 1.0, 1.3));
    note(`n1${k}`, S1X[id] + 40 + Math.sin(age * 5 + k) * 14, S1Y - 230 - age * 120, .55 + .2 * (k % 2), Math.sin(age * 4 + k) * .3, [PAL.purple, PAL.mustard, PAL.mint, PAL.denim][k % 4], a);
  }
  // speech bubble
  if (t > 2.42) {
    const a = pop(t, 2.42, 2.6, .5);
    bubble('b1', S1X.D - 40, S1Y - 262, ["It's May's", 'birthday today!'], 42, { a, dx: -80, dy: 30, rot: -.03 + .02 * Math.sin(t * 3) });
  }
}
function drawD1(t) {
  const x = S1X.D, s = S1S;
  let p = { x, y: S1Y, s, ...rehearsePose('D', t, 3) };
  let propR = null;
  if (t > 0.85) { const k = prog(t, .85, 1.0); p.mouth = 'o'; p.mo = .2; p.jump *= 1 - k; p.turn = .45 * k; p.lookX = k; p.lookY = k; p.eyes = 'open'; p.armL = lerp(p.armL, .2, k); p.armR = lerp(p.armR, .2, k); }
  if (t > 1.0 && t < 1.3) { const k = Math.sin(Math.PI * prog(t, 1.0, 1.3)); p.sq = 1 - .14 * k; p.rot = .22 * k; p.armR = lerp(.2, .75, k); }
  if (t >= 1.08 && t < 1.32) {
    const k = E.io(prog(t, 1.08, 1.3));
    propR = () => { withT(0, 18, 0, 1, 1, () => drawEnvelope(0, 0, lerp(1, .9, k), .1, prog(t, 1.2, 1.3))); };
  }
  if (t >= 1.25) {
    const k = E.out(prog(t, 1.25, 1.42));
    p.armL = lerp(.2, -.55, k); p.armR = lerp(.75, -.55, k); p.rot = 0; p.turn = .45 * (1 - k); p.lookX = 1 - k; p.lookY = lerp(1, -.2, k); p.mouth = 'o'; p.mo = .1;
    if (t > 1.72) { p.eyes = 'huge'; p.mouth = 'o'; p.mo = .9 * pop(t, 1.72, 4, .5); p.sq = 1 + .03 * Math.sin((t - 1.72) * 30) * Math.exp(-(t - 1.72) * 5); }
  }
  if (t >= 2.15) {
    const u = prog(t, 2.15, 2.45), sp = E.io(u);
    p.turnX = Math.cos(TAU * sp); p.jump = -70 * Math.sin(Math.PI * u); p.eyes = 'huge'; p.mouth = 'open'; p.mo = .8;
    p.armL = lerp(-.55, 2.2, E.out(u)); p.armR = lerp(-.55, 2.2, E.out(u));
  }
  if (t >= 2.45) {
    const k = pop(t, 2.45, 2.4, .42);
    p.turnX = 1; p.jump = -8 * Math.abs(Math.sin((t - 2.45) * 9)) * Math.exp(-(t - 2.45) * 2); p.sq = 1 + .07 * (1 - k);
    p.armL = 2.2 + .15 * Math.sin(t * 9); p.armR = 2.2 + .15 * Math.sin(t * 9 + 1); p.eyes = 'huge'; p.mouth = 'open';
    p.mo = .55 + .45 * Math.abs(Math.sin((t - 2.45) * 11));
  }
  drawSinger('D', { ...p, propR });
  // the card, held in front of the chest
  if (t >= 1.25 && t < 2.6) {
    let cxp = x, cyp = S1Y - 70 + p.jump * s, sc = .8, rot = -.03, a = 1;
    const up = E.back(prog(t, 1.25, 1.45));
    cyp += (1 - up) * 30; sc *= lerp(.4, 1, up);
    cyp += Math.sin(t * 22) * 1.2 * clamp((t - 1.72) * 4);
    if (t > 2.15) { const f = prog(t, 2.15, 2.6); cxp += f * -140; cyp += -260 * E.out(f) + 200 * f * f; rot += f * 5; sc *= 1 - .4 * f; a = 1 - E.inn(f); }
    ctx.save(); ctx.globalAlpha = a; drawCard(cxp, cyp, sc, rot); ctx.restore();
  }
}

// ---------------- Scene 2: the panic (3.4 - 7.0) ----------------
function sceneRoom2(t) {
  const cam = camAt(t, [[3.4, 3.4, 1015, 272], [3.95, 3.25, 1012, 270, E.lin], [4.3, 1.0, 780, 620, E.io], [4.36, 1.0, 780, 620, E.lin],
    [4.55, 1.75, 445, 640, E.io], [4.95, 1.75, 450, 640, E.lin], [5.12, 1.8, 668, 680, E.io], [5.5, 1.8, 672, 680, E.lin],
    [5.66, 1.75, 900, 690, E.io], [6.08, 1.75, 905, 690, E.lin], [6.3, 1.55, 1060, 660, E.io], [6.95, 1.55, 1400, 650, E.sine], [7.0, 1.55, 1415, 650, E.lin]]);
  const [sx, sy] = shake(t, 6.92, 9);
  applyCam(cam, sx, sy);
  // clock: tick to 7:53, red seven-minute wedge, alarm shake
  const tick = spring(t - 3.5, 4, .35);
  const ring = t > 3.62 && t < 4.05 ? Math.sin(t * 70) * .05 * (1 - prog(t, 3.62, 4.05)) : 0;
  const mirrorFn = () => drawMirrorB(t);
  const rackRot = 0.12 * Math.exp(-(t - 5.82) * 5) * Math.sin((t - 5.82) * 22) * (t > 5.82 ? 1 : 0);
  const doorOpen = t < 6.62 ? 0 : t < 6.92 ? E.out(prog(t, 6.62, 6.72)) : 1 - E.inn(prog(t, 6.88, 6.95));
  drawRoomBack(t, { sec: (t * 6) % 60, mm: 52.6 + .4 * tick, wedge: E.out(prog(t, 3.55, 3.85)), clockRot: ring, mirror: mirrorFn, rackRot, doorOpen });
  if (t < 3.95) return;
  const eRun = t >= 6.1;
  // --- B at the mirror (back view), comb
  const combY = Math.sin(t * 34) * 8;
  drawSinger('B', { x: 360, y: 905, s: S1S, back: true, armL: 2.0 + Math.sin(t * 34) * .25, armR: 0.3, jump: -2 * Math.abs(Math.sin(t * 17)) });
  if (t > 4.62 && t < 5.25) puff(430, 640, prog(t, 4.62, 5.15), 34, 4, '#ffffff');
  // --- A behind the trunk, items flying, finds the mic
  pRect('trunk.lid', 668 - 86, 700, 172, 30, 6, '#8e563c', { amp: 1 });
  const found = t > 5.28;
  const dig = Math.sin(t * 30);
  drawSinger('A', {
    x: 668, y: 860, s: S1S, rot: found ? 0 : .12, headDy: found ? 0 : 14, eyes: found ? 'huge' : 'shock', mouth: found ? 'open' : 'wavy', mo: .9,
    armL: found ? .4 : .5 + dig * .7, armR: found ? lerp(.5, 2.4, pop(t, 5.28, 3, .5)) : .5 - dig * .7, propR: found ? propMic : null, sweat: found ? 0 : 1,
  });
  if (found) for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + t * 2; sparkle(668 + 104 + Math.cos(a) * 46, 660 - 76 + Math.sin(a) * 40, .7 * Math.sin(Math.PI * prog(t, 5.28, 5.8)), '#fff1b8', t * 3); }
  // trunk
  withT(668, 0, 0, 1, 1, () => {
    pRect('trunk', -80, 768, 160, 110, 8, '#a8664a');
    pRect('trunk.s1', -52, 768, 14, 110, 3, PAL.mustard, { rim: 0 }); pRect('trunk.s2', 38, 768, 14, 110, 3, PAL.mustard, { rim: 0 });
  });
  const items = [[PAL.mint, 'sock'], [PAL.mustard, 'shirt'], [PAL.pink, 'hat'], [PAL.denim, 'shoe'], [PAL.lilac, 'sock'], [PAL.brick, 'shirt']];
  items.forEach(([col, kind], k) => {
    const t0 = 4.4 + k * .14, age = t - t0;
    if (age < 0 || age > 1.1) return;
    const dir = k % 2 ? 1 : -1, ix = 668 + dir * age * (180 + k * 30), iy = 780 - 420 * age + 520 * age * age;
    withT(ix, iy, age * 9 * dir, .9, .9, () => {
      if (kind === 'sock') pPoly(`it${k}`, [[-8, -24], [8, -24], [8, 4], [22, 10], [20, 22], [-8, 18]], col, { smooth: 1 });
      else if (kind === 'shirt') pPoly(`it${k}`, [[-26, -20], [26, -20], [34, -4], [20, 0], [20, 24], [-20, 24], [-20, 0], [-34, -4]], col, { smooth: 1 });
      else if (kind === 'hat') pPoly(`it${k}`, [[-24, 6], [24, 6], [16, -18], [-16, -18]], col, { smooth: 1 });
      else pPoly(`it${k}`, [[-24, -10], [6, -10], [24, 4], [24, 12], [-24, 12]], col, { smooth: 1 });
    });
  });
  // --- C with jacket stuck over his head
  const cx = 890 + Math.sin(t * 5.5) * 24 - 30 * Math.exp(-Math.max(0, t - 5.82) * 4) * (t > 5.82 ? 1 : 0);
  drawSinger('C', {
    x: cx, y: 902, s: S1S, rot: Math.sin(t * 11) * .12, armL: 2.4 + Math.sin(t * 14) * .25, armR: 2.5 + Math.cos(t * 13) * .25,
    hide: { head: true }, legL: .1 + Math.max(0, Math.sin(t * 11)) * .3, legR: .1 + Math.max(0, -Math.sin(t * 11)) * .3,
    post: () => {
      withT(0, HEAD_Y + 10, Math.sin(t * 9) * .1, 1, 1, () => {
        for (const sd of [-1, 1]) withT(sd * 92, 30, sd * (.35 + Math.sin(t * 13 + sd) * .3), 1, 1, () => pRect(`C.sl${sd}`, -17, -10, 34, 120, 15, '#c9443b', { amp: 1.4 }));
        pEll('C.jk', 0, 0, 112, 104, '#c9443b', { amp: 2.2 });
        pRect('C.jkc', -56, 64, 112, 34, 14, '#a93730', { rim: 0 });
        ctx.fillStyle = 'rgba(250,240,230,.85)'; ctx.fillRect(-2, -100, 4, 160);
        pEll('C.bump', 6, -6, 60, 54, '#d24f45', { rim: 0, amp: 1.4 });
      });
    },
  });
  if (t > 5.82 && t < 6.4) for (let k = 0; k < 3; k++) { const a = t * 8 + k * TAU / 3; sparkle(cx + Math.cos(a) * 60, 650 + Math.sin(a) * 16, .8, PAL.mustard, a); }
  // --- background chaos: D hopping into a shoe, F with clothes, G panicking
  const dodge = (x0) => eRun ? -40 * E.out(prog(t, 6.25 + (x0 - 1000) / 900, 6.45 + (x0 - 1000) / 900)) : 0;
  drawSinger('D', { x: 1085, y: 896 + dodge(1085), s: S1S, jump: -30 * Math.abs(Math.sin(t * 8)), legL: .5, kneeL: 20, armL: -.2, armR: 1.1, eyes: 'shock', mouth: 'wavy', rot: Math.sin(t * 8) * .1 });
  drawSinger('G', { x: 1290, y: 904 + dodge(1290), s: S1S, eyes: 'shock', mouth: 'o', mo: 1, armL: -.95, armR: -.95, turnX: Math.cos(t * 9), sweat: 1 });
  const fx = 1180 + Math.sin(t * 3) * 60;
  drawSinger('F', { x: fx, y: 930 + dodge(1180), s: S1S, eyes: 'huge', mouth: 'open', mo: .7, armL: -.5, armR: -.5, jump: -10 * Math.abs(Math.sin(t * 12)), rot: .1 });
  withT(fx, 930 - 80 + dodge(1180) - 10 * Math.abs(Math.sin(t * 12)), .05, 1, 1, () => {
    pRect('pile1', -50, -20, 100, 24, 8, PAL.lilac); pRect('pile2', -44, -38, 88, 22, 8, PAL.mustard); pRect('pile3', -36, -54, 72, 20, 8, PAL.mint);
  });
  // --- E running out the door with the cake
  if (eRun && t < 6.87) {
    const u = prog(t, 6.1, 6.86), ex = lerp(640, 1560, E.in2(u) * .4 + u * .6), inDoor = prog(t, 6.72, 6.86);
    const ey = lerp(905, ROOM.floorY + 10, inDoor), es = S1S * (1 - .25 * inDoor);
    const run = Math.sin(t * 26);
    ctx.save();
    if (inDoor > 0) { ctx.beginPath(); ctx.rect(ROOM.door[0] - 400 * (1 - inDoor), ROOM.floorY - 380, ROOM.door[1] - ROOM.door[0] + 400 * (1 - inDoor), 380 + 200 * (1 - inDoor)); ctx.clip(); }
    drawSinger('E', { x: ex, y: ey - 12 * Math.abs(run), s: es, rot: .14, turn: .5, lookX: 1, eyes: 'huge', mouth: 'open', mo: .7, armR: 1.35, armL: -.35, legL: .35 * run, legR: -.35 * run, sweat: 1 });
    drawCake('cakeR', ex + 78 * es / S1S, ey - 12 * Math.abs(run) - es * 160, .52 * es / S1S, { t, rot: Math.sin(t * 13) * .04 });
    ctx.restore();
    motionLines(ex - 90, ey - 120, 90, 3, 1 - inDoor);
  }
}
function drawMirrorB(t) {
  // B's reflection (front view) inside the glass
  ctx.save();
  ctx.beginPath(); ctx.rect(-126, 484, 252, 252); ctx.clip();
  ctx.globalAlpha = .95;
  drawSinger('B', { x: 20, y: 822, s: .62, flip: -1, eyes: 'shock', mouth: 'wavy', armR: 2.0 + Math.sin(t * 34) * .25, armL: .3, shadow: false, propR: propComb, sweat: 1 });
  ctx.fillStyle = 'rgba(200,220,228,.28)'; ctx.fillRect(-126, 484, 252, 252);
  ctx.restore();
}

