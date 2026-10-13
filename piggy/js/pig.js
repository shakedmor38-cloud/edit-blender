// pig.js : the piggy character. Origin = ground point between the feet, R = head radius.
'use strict';
const INK = '#4a1f36';
const PALETTES = {
  pink:  { body: '#ffb7cc', shade: '#f48fb1', snout: '#ff95b6', nose: '#b8436f', ear: '#ff86ab' },
  peach: { body: '#ffc6b0', shade: '#f7a08a', snout: '#ffa98f', nose: '#b4553f', ear: '#ff9a82' },
  rose:  { body: '#ffa3c0', shade: '#ec7aa2', snout: '#ff83aa', nose: '#a8335f', ear: '#ff6f9b' },
  lilac: { body: '#f3b8e6', shade: '#d98fcc', snout: '#ec9bdc', nose: '#93407f', ear: '#e384d0' },
};

function blob(g, x, y, rx, ry, fill, lw, rot = 0) {
  g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU);
  g.fillStyle = fill; g.fill();
  if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.stroke(); }
}

// o: { R, pal, mouth 0..1, puff 0..1, blink 0..1, wink, look [x,y], ear -1..1, tilt, squash, arms [l,r] radians,
//      tail phase, acc ('bow'|'glasses'|'crown'|'party'|'phones'|'flower'), flip, legs 0..1 (hop tuck), happy 0..1 }
function drawPig(g, o) {
  const R = o.R, p = PALETTES[o.pal || 'pink'], lw = R * .075;
  const sq = o.squash || 0;
  g.save();
  g.scale(o.flip ? -1 : 1, 1);
  g.scale(1 + sq * .9, 1 - sq);
  g.lineJoin = 'round'; g.lineCap = 'round';

  // tail (behind the body)
  const tp = o.tail || 0;
  g.save(); g.translate(R * .7, -R * .6); g.rotate(Math.sin(tp) * .35 - .2);
  g.beginPath();
  for (let i = 0; i <= 40; i++) {
    const a = i / 40 * TAU * 1.6, r = R * (.06 + i / 40 * .2);
    const x = R * .16 + Math.cos(a) * r, y = -Math.sin(a) * r;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.lineWidth = R * .2; g.strokeStyle = INK; g.stroke();
  g.lineWidth = R * .2 - lw * 1.4; g.strokeStyle = p.shade; g.stroke();
  g.restore();

  // feet
  const tuck = (o.legs || 0) * R * .12;
  for (const s of [-1, 1]) {
    g.save(); g.translate(s * R * .36, -tuck);
    g.beginPath(); g.roundRect(-R * .17, -R * .34, R * .34, R * .34, [R * .1, R * .1, R * .09, R * .09]);
    g.fillStyle = p.shade; g.fill(); g.lineWidth = lw; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.moveTo(0, -R * .12); g.lineTo(0, 0); g.lineWidth = lw * .8; g.stroke();
    g.restore();
  }
  // body
  const bg = g.createLinearGradient(0, -R * 1.2, 0, -R * .1);
  bg.addColorStop(0, p.body); bg.addColorStop(1, p.shade);
  blob(g, 0, -R * .62, R * .8, R * .55, bg, lw);
  // belly highlight
  blob(g, 0, -R * .58, R * .45, R * .3, 'rgba(255,255,255,.22)', 0);

  // arms (front trotters)
  const arms = o.arms || [.5, .5];
  for (const s of [-1, 1]) {
    const a = arms[s < 0 ? 0 : 1];
    g.save(); g.translate(s * R * .62, -R * .78); g.rotate(-s * a);
    g.beginPath(); g.roundRect(-R * .12, -R * .02, R * .24, R * .5, R * .12);
    g.fillStyle = p.body; g.fill(); g.lineWidth = lw; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.moveTo(-R * .1, R * .36); g.lineTo(R * .1, R * .36); g.lineWidth = lw * .8; g.stroke();
    g.restore();
  }

  // head
  g.save(); g.translate(0, -R * 1.02); g.rotate(o.tilt || 0); g.translate(0, -R * .6);
  const ear = o.ear || 0;
  for (const s of [-1, 1]) {
    g.save(); g.translate(s * R * .55, -R * .62); g.rotate(s * (.35 + ear * .35));
    g.beginPath(); g.moveTo(-R * .26, R * .12); g.quadraticCurveTo(-R * .1, -R * .5, s * R * .02 + R * .06, -R * .52);
    g.quadraticCurveTo(R * .3, -R * .2, R * .26, R * .12); g.closePath();
    g.fillStyle = p.body; g.fill(); g.lineWidth = lw; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.moveTo(-R * .13, R * .06); g.quadraticCurveTo(-R * .04, -R * .3, R * .05, -R * .32);
    g.quadraticCurveTo(R * .17, -R * .12, R * .14, R * .06); g.closePath(); g.fillStyle = p.ear; g.fill();
    g.restore();
  }
  const hg = g.createRadialGradient(-R * .3, -R * .4, R * .1, 0, 0, R * 1.05);
  hg.addColorStop(0, '#fff0f4'); hg.addColorStop(.35, p.body); hg.addColorStop(1, p.shade);
  const puff = o.puff || 0;
  g.beginPath(); g.ellipse(0, 0, R * (1 + puff * .07), R * .92, 0, 0, TAU); g.fillStyle = hg; g.fill();
  g.lineWidth = lw; g.strokeStyle = INK; g.stroke();

  // blush (bigger when cheeks puff)
  for (const s of [-1, 1]) blob(g, s * R * .6, R * .16, R * (.17 + puff * .1), R * (.1 + puff * .06), `rgba(255,80,130,${.38 + puff * .25})`, 0);

  // eyes
  const lk = o.look || [0, 0], happy = o.happy || 0;
  for (const s of [-1, 1]) {
    const ex = s * R * .36 + lk[0] * R * .05, ey = -R * .22 + lk[1] * R * .05;
    const bl = (o.wink && s > 0) ? 1 : (o.blink || 0);
    if (happy > .5 || bl > .85) {
      // closed / happy arc
      g.beginPath(); g.arc(ex, ey + R * .04, R * .12, Math.PI * 1.1, Math.PI * 1.9);
      g.lineWidth = lw * 1.1; g.strokeStyle = INK; g.stroke();
    } else {
      g.save(); g.translate(ex, ey); g.scale(1, 1 - bl);
      blob(g, 0, 0, R * .13, R * .17, INK, 0);
      blob(g, -R * .04, -R * .07, R * .05, R * .06, '#fff', 0);
      blob(g, R * .05, R * .06, R * .02, R * .025, '#fff', 0);
      g.restore();
    }
  }
  // snout
  blob(g, 0, R * .2, R * .4, R * .28, p.snout, lw);
  blob(g, -R * .1, R * .1, R * .16, R * .07, 'rgba(255,255,255,.35)', 0);
  for (const s of [-1, 1]) blob(g, s * R * .14, R * .21, R * .065, R * .1, p.nose, 0);

  // mouth
  const m = clamp(o.mouth || 0);
  if (puff > .3) {
    // round 'o' lips
    const r = R * (.07 + m * .04);
    blob(g, R * .02, R * .6, r * 1.15, r, '#7a1d3f', lw * .8);
  } else if (m > .05) {
    const mw = R * (.2 + m * .08), mh = R * (.04 + m * .22);
    g.beginPath(); g.moveTo(-mw, R * .55);
    g.quadraticCurveTo(0, R * .55 + mh * 2.2, mw, R * .55);
    g.quadraticCurveTo(0, R * .5, -mw, R * .55); g.closePath();
    g.fillStyle = '#7a1d3f'; g.fill(); g.lineWidth = lw * .8; g.strokeStyle = INK; g.stroke();
    g.save(); g.clip();
    blob(g, 0, R * .55 + mh * 1.5, mw * .6, mh * .7, '#ff6f93', 0);
    g.restore();
  } else {
    g.beginPath(); g.moveTo(-R * .17, R * .55); g.quadraticCurveTo(0, R * .68, R * .17, R * .55);
    g.lineWidth = lw * .9; g.strokeStyle = INK; g.stroke();
  }
  drawAccessory(g, o.acc, R, lw);
  g.restore(); // head
  g.restore();
}

function drawAccessory(g, acc, R, lw) {
  if (!acc) return;
  g.lineWidth = lw; g.strokeStyle = INK;
  if (acc === 'bow') {
    g.save(); g.translate(R * .45, -R * .78); g.rotate(.3);
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(s * R * .35, -R * .3, s * R * .38, 0); g.quadraticCurveTo(s * R * .35, R * .3, 0, 0);
      g.fillStyle = '#ff3d7f'; g.fill(); g.stroke();
    }
    blob(g, 0, 0, R * .1, R * .1, '#ff3d7f', lw); g.restore();
  } else if (acc === 'glasses') {
    g.save(); g.translate(0, -R * .24);
    for (const s of [-1, 1]) { g.beginPath(); g.roundRect(s * R * .36 - R * .24, -R * .15, R * .48, R * .3, R * .1); g.fillStyle = '#1c1028'; g.fill(); g.stroke(); }
    g.beginPath(); g.moveTo(-R * .12, -R * .04); g.lineTo(R * .12, -R * .04); g.stroke();
    blob(g, -R * .46, -R * .06, R * .07, R * .035, 'rgba(255,255,255,.7)', 0, -.4);
    blob(g, R * .26, -R * .06, R * .07, R * .035, 'rgba(255,255,255,.7)', 0, -.4);
    g.restore();
  } else if (acc === 'crown') {
    g.save(); g.translate(0, -R * .86);
    g.beginPath(); g.moveTo(-R * .36, R * .08); g.lineTo(-R * .4, -R * .32); g.lineTo(-R * .18, -R * .1); g.lineTo(0, -R * .42);
    g.lineTo(R * .18, -R * .1); g.lineTo(R * .4, -R * .32); g.lineTo(R * .36, R * .08); g.closePath();
    g.fillStyle = '#ffd23f'; g.fill(); g.stroke();
    for (const x of [-.2, 0, .2]) blob(g, x * R, -R * .02, R * .05, R * .05, x ? '#4fc3ff' : '#ff3d7f', 0);
    g.restore();
  } else if (acc === 'party') {
    g.save(); g.translate(-R * .2, -R * .8); g.rotate(-.25);
    g.beginPath(); g.moveTo(-R * .26, R * .05); g.lineTo(0, -R * .62); g.lineTo(R * .26, R * .05); g.closePath();
    g.fillStyle = '#6ad1ff'; g.fill(); g.stroke();
    g.save(); g.clip();
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-R, -R * .1 - i * R * .17); g.lineTo(R, -R * .3 - i * R * .17); g.lineWidth = R * .06; g.strokeStyle = '#ffe14d'; g.stroke(); }
    g.restore();
    blob(g, 0, -R * .64, R * .09, R * .09, '#ff3d7f', lw);
    g.restore();
  } else if (acc === 'phones') {
    g.beginPath(); g.arc(0, -R * .1, R * .98, Math.PI * 1.12, Math.PI * 1.88); g.lineWidth = R * .12; g.stroke();
    g.lineWidth = R * .12 - lw * 1.2; g.strokeStyle = '#7c4dff'; g.stroke();
    g.lineWidth = lw; g.strokeStyle = INK;
    for (const s of [-1, 1]) { g.beginPath(); g.roundRect(s * R * .98 - R * .14, -R * .3, R * .28, R * .42, R * .12); g.fillStyle = '#7c4dff'; g.fill(); g.stroke(); }
  } else if (acc === 'flower') {
    g.save(); g.translate(-R * .5, -R * .72);
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; blob(g, Math.cos(a) * R * .13, Math.sin(a) * R * .13, R * .11, R * .11, '#fff', lw * .7); }
    blob(g, 0, 0, R * .09, R * .09, '#ffd23f', lw * .7); g.restore();
  }
}
