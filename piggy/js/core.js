// core.js : canvas, timing helpers, song timing (beats, words, accents), deterministic random
'use strict';
const W = 1080, H = 1920, TT = DATA.total;
const cv = document.getElementById('stage');
const ctx = cv.getContext('2d');

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  io: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  out: x => 1 - Math.pow(1 - x, 3),
  inn: x => x * x * x,
  sine: x => -(Math.cos(Math.PI * x) - 1) / 2,
  back: x => { const c1 = 1.70158, c3 = c1 + 1; return x >= 1 ? 1 : 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
};
// damped spring step response 0 -> 1
function spring(t, f = 3, z = 0.5) {
  if (t <= 0) return 0;
  const w = TAU * f, wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t));
}
const pop = (t, t0, f = 3.2, z = 0.42) => spring(t - t0, f, z);
// decaying kick 0..1 after t0
const hit = (t, t0, k = 9) => t < t0 ? 0 : Math.exp(-(t - t0) * k);
function vnoise(x, seed = 1) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  const h = n => mulberry32((n * 374761393 + seed * 668265263) | 0)() * 2 - 1;
  return lerp(h(i), h(i + 1), u);
}
function sample(arr, t) {
  const x = clamp(t * DATA.fps, 0, arr.length - 1), i = Math.floor(x), f = x - i;
  return lerp(arr[i], arr[Math.min(i + 1, arr.length - 1)], f);
}
const voc = t => sample(DATA.voc, t);
const loud = t => sample(DATA.rms, t);

// ---------- song timing ----------
const BEAT = DATA.beat, B0 = DATA.beat0 + BEAT;              // first beat ~0.31 s
const beatPhase = t => (t - B0) / BEAT;                       // beats since the first downbeat
// lyric lines: word onsets read off the vocal envelope; ECHO = the three echoes of the last 'pigur' in the tail
const LINES = [
  { words: [['זה', .30], ['פיגי', .61], ['פיגי', 1.62], ['פיגור', 2.15]], show: .22, hide: 3.05 },
  { words: [['זה', 3.31], ['פיגי', 3.74], ['פיגי', 4.72], ['פיגור', 5.20]], show: 3.25, hide: 5.80 },
  { words: [['זה', 6.44], ['פיגי', 6.56], ['פיגי', 6.82], ['פיגי', 7.12], ['פיגי', 7.42], ['פיגי', 7.70], ['פיגור!', 7.98]], show: 6.40, hide: 8.16, rows: [3, 4] },
];
const TADA = [2.15, 5.20, 7.98];   // each line's 'pigur': a jump with arms up and a star burst
const ECHO = [7.99 + BEAT, 7.99 + 2 * BEAT, 7.99 + 3 * BEAT];
const KICK = 6.93;
const ACCENTS = [.30, .61, 1.62, 2.15, 3.31, 3.74, 4.72, 5.20, 6.44, 6.56, 6.82, KICK, 7.12, 7.42, 7.70, 7.98];
// scene cuts (motion blur never averages across these)
const CUTS = [3.31, 6.20, 8.11];
// time since the most recent event in a list (Infinity before the first)
function since(t, list) { let d = Infinity; for (const x of list) if (t >= x) d = Math.min(d, t - x); return d; }
