// main.js : seek(t), in-page motion-blur accumulation, preview player with the song
'use strict';
const qs = new URLSearchParams(location.search);
if (qs.has('render')) document.body.classList.add('render');

// soft vignette, same every frame
const overlay = document.createElement('canvas'); overlay.width = W; overlay.height = H;
(function () {
  const g = overlay.getContext('2d');
  const vg = g.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .62);
  vg.addColorStop(0, 'rgba(40,10,40,0)'); vg.addColorStop(1, 'rgba(40,10,40,.2)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
})();

function drawFrame(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  renderScene(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(overlay, 0, 0);
}
window.seek = (t) => { drawFrame(clamp(t, 0, TT - 1e-4)); document.getElementById('tc').textContent = t.toFixed(2); };

// average SUB subframes over the shutter, never across a cut
const acc = document.createElement('canvas'); acc.width = W; acc.height = H;
const actx = acc.getContext('2d');
window.renderBlur = (t, sub, shutter, fps, q = 0.93) => {
  actx.globalAlpha = 1; actx.clearRect(0, 0, W, H);
  for (let j = 0; j < sub; j++) {
    let ts = clamp(t + (j - (sub - 1) / 2) * shutter / (fps * sub), 0, TT - 1e-4);
    for (const c of CUTS) if ((ts < c) !== (t < c)) ts = t < c ? c - 1e-4 : c;
    drawFrame(ts);
    actx.globalAlpha = 1 / (j + 1); actx.drawImage(cv, 0, 0);
  }
  actx.globalAlpha = 1;
  return acc.toDataURL('image/jpeg', q);
};
window.still = (t, q = 0.95) => { drawFrame(t); return cv.toDataURL('image/jpeg', q); };

// preview player
const audio = document.getElementById('song');
let playing = false, cur = parseFloat(qs.get('t') || '0');
function loop() {
  if (!playing) return;
  cur = audio.currentTime;
  if (audio.ended || cur >= TT) { playing = false; cur = TT - 1e-3; }
  window.seek(cur);
  requestAnimationFrame(loop);
}
function play(from) { audio.currentTime = from; audio.play(); playing = true; requestAnimationFrame(loop); }
addEventListener('keydown', e => {
  if (e.code === 'Space') { if (playing) { playing = false; audio.pause(); } else play(cur >= TT - .01 ? 0 : cur); e.preventDefault(); }
  if (e.code === 'ArrowRight') { playing = false; audio.pause(); cur = Math.min(TT, cur + 1 / 30); window.seek(cur); }
  if (e.code === 'ArrowLeft') { playing = false; audio.pause(); cur = Math.max(0, cur - 1 / 30); window.seek(cur); }
  if (e.code === 'KeyR') play(0);
});
cv.addEventListener('click', () => playing ? (playing = false, audio.pause()) : play(cur >= TT - .01 ? 0 : cur));

document.fonts.load('700 40px Fredoka', 'פיגי').then(() => document.fonts.load('700 40px Fredoka', 'Pig')).then(() => document.fonts.ready).then(() => {
  window.seek(cur);
  window.ready = true;
});
