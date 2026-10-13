// main.js : seek(t), in-page motion-blur accumulation, preview controls
'use strict';
const CUTS = [3.35, 7.0, 10.0, 20.0];
const qs = new URLSearchParams(location.search);
if (qs.has('render')) document.body.classList.add('render');

// static overlay: vignette + fine grain (same every frame)
const overlay = document.createElement('canvas'); overlay.width = W; overlay.height = H;
(function buildOverlay() {
  const g = overlay.getContext('2d');
  const vg = g.createRadialGradient(W / 2, H / 2, W * .35, W / 2, H / 2, W * .78);
  vg.addColorStop(0, 'rgba(60,30,20,0)'); vg.addColorStop(1, 'rgba(60,30,20,.22)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  const img = g.getImageData(0, 0, W, H), d = img.data, r = mulberry32(77);
  for (let i = 0; i < d.length; i += 4) {
    const n = r();
    if (n < .5) { d[i] = d[i] || 255; d[i + 1] = d[i + 1] || 250; d[i + 2] = d[i + 2] || 240; d[i + 3] = Math.max(d[i + 3], (r() * 10) | 0); }
    else if (n < .75) { d[i] = 70; d[i + 1] = 40; d[i + 2] = 30; d[i + 3] = Math.max(d[i + 3], (r() * 12) | 0); }
  }
  g.putImageData(img, 0, 0);
})();

function drawFrame(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#e9b5a0'; ctx.fillRect(0, 0, W, H);
  renderScene(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(overlay, 0, 0);
}

window.seek = async (t) => { drawFrame(clamp(t, 0, TT - 1e-4)); document.getElementById('tc').textContent = t.toFixed(2); };

// average SUB subframes over the shutter, never across a cut
const acc = document.createElement('canvas'); acc.width = W; acc.height = H;
const actx = acc.getContext('2d');
window.renderBlur = (t, sub, shutter, fps, q = 0.93) => {
  const offs = [];
  for (let j = 0; j < sub; j++) offs.push((j - (sub - 1) / 2) * shutter / (fps * sub));
  actx.globalAlpha = 1; actx.clearRect(0, 0, W, H);
  offs.forEach((o, j) => {
    let ts = clamp(t + o, 0, TT - 1e-4);
    for (const c of CUTS) if ((ts < c) !== (t < c)) ts = t < c ? c - 1e-4 : c;
    drawFrame(ts);
    actx.globalAlpha = 1 / (j + 1); actx.drawImage(cv, 0, 0);
  });
  actx.globalAlpha = 1;
  return acc.toDataURL('image/jpeg', q);
};
window.still = (t, q = 0.95) => { drawFrame(t); return cv.toDataURL('image/jpeg', q); };

// preview player (the only place a clock is used)
let playing = false, t0 = 0, tStart = 0, cur = parseFloat(qs.get('t') || '0');
function loop(now) {
  if (!playing) return;
  cur = tStart + (now - t0) / 1000;
  if (cur >= TT) { cur = TT - 1e-3; playing = false; }
  window.seek(cur);
  requestAnimationFrame(loop);
}
addEventListener('keydown', e => {
  if (e.code === 'Space') { playing = !playing; if (playing) { t0 = performance.now(); tStart = cur >= TT - .01 ? 0 : cur; requestAnimationFrame(loop); } e.preventDefault(); }
  if (e.code === 'ArrowRight') { playing = false; cur = Math.min(TT, cur + 1 / 30); window.seek(cur); }
  if (e.code === 'ArrowLeft') { playing = false; cur = Math.max(0, cur - 1 / 30); window.seek(cur); }
  if (e.code === 'KeyR') { cur = 0; playing = true; t0 = performance.now(); tStart = 0; requestAnimationFrame(loop); }
});

document.fonts.load('600 40px Fredoka').then(() => document.fonts.load('40px "Patrick Hand"')).then(() => document.fonts.ready).then(() => {
  window.seek(cur);
  window.ready = true;
});
