"""Original score + SFX for "Make a wish, May!", synthesized from scratch with numpy/scipy.

Scene moods (see BEATMAP.md):
  1  0.0-3.4   F major 100 BPM: soft piano + "aah" warm-up, curious pizzicato, glock sparkle, surprise stab
  2  3.4-7.0   A minor 150 BPM: clock tick + alarm, polka-chase groove (bass, marimba, woodblock tick-tock)
  3  7.0-10.0  E tremolo tension + wobble, slide whistle, THUD, silence, C major relief, "wah-wah", giggles
  4  10.0-20.0 drum roll, then "Happy Birthday" (public domain) in 3/4 at 180 BPM: choir + glock melody,
               oom-pah piano/bass, kick + claps, fermata on "May", big final chord, confetti, crowd
  5  20.0-22.5 celesta/harp magic, candle chimes, lush C major add9 ending
Writes out/audio.wav at -14 LUFS (two-pass loudnorm).
"""
import json, subprocess
from pathlib import Path
import numpy as np
import scipy.signal as sg

HERE = Path(__file__).parent
SR, T = 48000, 22.5
N = int(T * SR)
rng = np.random.default_rng(27)
DRY = np.zeros((N, 2))
VERB = np.zeros((N, 2))
SC = np.zeros((N, 2))      # synths that duck under the kick (K-pop pump)
SCV = np.zeros((N, 2))
KICKS = []


def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
NOTE = {n: i for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}
NOTE.update({'Db': 1, 'Eb': 3, 'Gb': 6, 'Ab': 8, 'Bb': 10})
def m(name):
    p, o = (name[:2], name[2:]) if name[1] in '#b' else (name[:1], name[1:])
    return 12 * (int(o) + 1) + NOTE[p]
def tt(d): return np.arange(int(round(d * SR))) / SR


def place(sig, t0, gain=1.0, pan=0.0, rev=0.15, bus=None):
    """add mono or stereo signal at time t0 (s) with constant-power pan (-1..1) and a reverb send"""
    dry, verb = (SC, SCV) if bus == 'sc' else (DRY, VERB)
    sig = np.asarray(sig, dtype=float)
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.stack([sig * np.cos(a), sig * np.sin(a)], 1)
    i0 = int(round(t0 * SR))
    if i0 < 0: sig, i0 = sig[-i0:], 0
    n = min(len(sig), N - i0)
    if n <= 0: return
    dry[i0:i0 + n] += sig[:n] * gain
    verb[i0:i0 + n] += sig[:n] * gain * rev


def lp(x, fc, order=2): return sg.sosfilt(sg.butter(order, fc, 'low', fs=SR, output='sos'), x)
def hp(x, fc, order=2): return sg.sosfilt(sg.butter(order, fc, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, order=2): return sg.sosfilt(sg.butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)
def noise(d): return rng.standard_normal(int(round(d * SR)))
def fade(x, a=0.005, r=0.02):
    n = len(x); ia, ir = int(a * SR), int(r * SR)
    e = np.ones(n)
    if ia: e[:ia] = np.linspace(0, 1, ia)
    if ir: e[max(0, n - ir):] *= np.linspace(1, 0, min(n, ir))
    return x * e


# ------------------------------------------------------------------ instruments
def piano(mid, dur, vel=0.7):
    f = hz(mid); L = dur + 1.4; t = tt(L); y = np.zeros_like(t)
    for k in range(1, 14):
        fk = k * f * np.sqrt(1 + 0.00035 * k * k)
        if fk > 15000: break
        amp = vel * (1 / k ** 1.15) * (1.0 + 0.6 * (k == 2))
        dec = 0.55 + 0.5 * k + f / 900
        y += amp * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6.28)) * np.exp(-dec * t)
    y *= np.minimum(1, t / 0.002)
    y *= np.where(t < dur, 1, np.exp(-(t - dur) / 0.09))
    ham = lp(noise(0.02), 2500) * np.exp(-tt(0.02) / 0.004) * 0.15 * vel
    y[:len(ham)] += ham
    return y * 0.22


def chord(notes, t0, dur, vel=0.6, roll=0.0, pan_spread=0.5, rev=0.2, inst=None):
    inst = inst or piano
    for i, n in enumerate(notes):
        mid = m(n) if isinstance(n, str) else n
        p = ((mid - 60) / 24) * pan_spread
        place(inst(mid, dur, vel), t0 + i * roll, 1.0, max(-.8, min(.8, p)), rev)


def glock(mid, vel=0.5, L=1.6):
    f = hz(mid); t = tt(L); y = np.zeros_like(t)
    for r, a, d in [(1, 1, 2.6), (2.76, .35, 7), (5.40, .18, 11), (8.93, .08, 16)]:
        if r * f < 18000: y += a * np.sin(2 * np.pi * r * f * t) * np.exp(-d * t)
    y *= np.minimum(1, t / 0.0015)
    return y * vel * 0.17


def celesta(mid, vel=0.5, L=2.0):
    f = hz(mid); t = tt(L)
    y = np.sin(2 * np.pi * f * t) * np.exp(-1.6 * t) + .25 * np.sin(4 * np.pi * f * t) * np.exp(-4 * t) + .08 * np.sin(8 * np.pi * f * t) * np.exp(-9 * t)
    return y * np.minimum(1, t / 0.002) * vel * 0.3


def pluck(mid, L=0.8, vel=0.6, bright=0.5, decay=0.995):
    """Karplus-Strong at an integer period, then resampled to the exact pitch"""
    f = hz(mid); p = max(2, int(round(SR / f - 0.5))); n = int(L * SR * (SR / f) / (p + 0.5)) + p + 2
    y = np.zeros(n)
    ex = rng.uniform(-1, 1, p)
    ex = lp(ex, 1200 + bright * 7000, 1)
    y[:p + 1] = np.r_[ex, ex[:1]]
    i = p + 1
    while i < n:
        j = min(n, i + p)
        y[i:j] = decay * 0.5 * (y[i - p:j - p] + y[i - p - 1:j - p - 1])
        i = j
    ratio = (SR / f) / (p + 0.5)
    out_n = int(L * SR)
    src = np.arange(out_n) / ratio
    out = np.interp(src, np.arange(n), y)
    return fade(out, 0.001, 0.05) * vel * 0.5


def saw_phase(phase, fmax):
    K = max(1, int(16000 / max(fmax, 30)))
    K = min(K, 60)
    y = np.zeros_like(phase)
    for k in range(1, K + 1):
        y += np.sin(k * phase) / k
    return y


def bass(mid, dur, vel=0.7):
    f = hz(mid); L = dur + 0.15; t = tt(L)
    y = np.sin(2 * np.pi * f * t) + .35 * np.sin(4 * np.pi * f * t) + .12 * np.sin(6 * np.pi * f * t)
    e = np.exp(-t * 2.2) * np.minimum(1, t / 0.004)
    e *= np.where(t < dur, 1, np.exp(-(t - dur) / 0.04))
    return np.tanh(1.6 * y * e) * vel * 0.38


def pad(notes, dur, vel=0.5, att=0.3, rel=0.6, cutoff=2400):
    L = dur + rel; t = tt(L); y = np.zeros_like(t)
    for n in notes:
        f = hz(m(n) if isinstance(n, str) else n)
        for d in (-7, 0, 7):
            ff = f * 2 ** (d / 1200)
            ph = 2 * np.pi * ff * t + rng.uniform(0, 6.28)
            y += saw_phase(ph, ff) * 0.33
    y = lp(y, cutoff, 2)
    e = np.minimum(1, t / att) * np.where(t < dur, 1, np.exp(-(t - dur) / (rel / 3)))
    return y * e * vel * 0.06


def brass_stab(notes, dur=0.5, vel=0.7):
    L = dur + 0.3; t = tt(L); y = np.zeros_like(t)
    for n in notes:
        f = hz(m(n))
        for d in (-6, 6):
            y += saw_phase(2 * np.pi * f * 2 ** (d / 1200) * t, f)
    cutoff = 600 + 4000 * np.exp(-t * 6)
    # time-varying lowpass by blocks
    out = np.zeros_like(y); zi = None; B = 512
    for i in range(0, len(y), B):
        sos = sg.butter(2, min(cutoff[i], SR * .45), 'low', fs=SR, output='sos')
        if zi is None: zi = sg.sosfilt_zi(sos) * 0
        out[i:i + B], zi = sg.sosfilt(sos, y[i:i + B], zi=zi)
    e = np.minimum(1, t / 0.01) * np.where(t < dur, np.exp(-t * 1.5), np.exp(-dur * 1.5) * np.exp(-(t - dur) / 0.08))
    return out * e * vel * 0.08


# ---- formant "aah" choir (time-varying vowels) ----
VOWEL = {'a': (730, 1090, 2440), 'ae': (660, 1720, 2410), 'i': (300, 2250, 3000), 'er': (490, 1350, 1690),
         'e': (530, 1840, 2480), 'u': (320, 870, 2240), 'o': (570, 840, 2410), 'ah': (750, 1200, 2600)}


def biquad_bp(fc, q):
    w = 2 * np.pi * fc / SR; al = np.sin(w) / (2 * q)
    b = np.array([al, 0, -al]); a = np.array([1 + al, -2 * np.cos(w), 1 - al])
    return b / a[0], a / a[0]


def formant_filter(x, vt):
    """vt(t)->(F1,F2,F3) arrays per block. parallel 3 band-pass with carried state"""
    B = 256; out = np.zeros_like(x)
    zis = [np.zeros(2), np.zeros(2), np.zeros(2)]
    gains = (1.0, 0.55, 0.28); qs = (6, 9, 12)
    for i in range(0, len(x), B):
        Fs = vt(i / SR)
        seg = x[i:i + B]; acc = np.zeros_like(seg)
        for k in range(3):
            b, a = biquad_bp(Fs[k], qs[k])
            yk, zis[k] = sg.lfilter(b, a, seg, zi=zis[k])
            acc += yk * gains[k]
        out[i:i + B] = acc
    return out


def choir(notes, octave_layers=((0, 1.0), (-12, 0.55)), voices=5, vib=5.6, breath=0.04, vdepth=0.18):
    """notes: list of (t0, dur, midi, vowel or (v0,v1)). Builds one legato line with glides, formant filtered."""
    t_start = notes[0][0] - 0.1; t_end = notes[-1][0] + notes[-1][1] + 0.4
    L = t_end - t_start; t = tt(L); n = len(t)
    # pitch contour (midi) with 45 ms glides, amplitude envelope with small dips between syllables
    pm = np.zeros(n); amp = np.zeros(n)
    vow_at = []
    for k, (t0, d, mid, v) in enumerate(notes):
        i0 = int((t0 - t_start) * SR); i1 = int((t0 + d - t_start) * SR)
        pm[i0:] = mid
        a = np.ones(i1 - i0)
        att = min(len(a), int(0.035 * SR)); a[:att] = np.linspace(0.25, 1, att)
        rel = min(len(a), int(0.05 * SR)); a[-rel:] *= np.linspace(1, 0.55, rel)
        amp[i0:i1] = np.maximum(amp[i0:i1], a)
        vow_at.append((t0 - t_start, t0 + d - t_start, v))
    last = notes[-1]; i1 = int((last[0] + last[1] - t_start) * SR)
    amp[i1:] = np.exp(-np.arange(n - i1) / SR / 0.08) * amp[i1 - 1]
    pm[:int((notes[0][0] - t_start) * SR)] = notes[0][2]
    pm = lp(pm, 18, 1)  # glide
    amp = lp(amp, 60, 1)

    def vt(ts):
        for a, b, v in vow_at:
            if ts < b + 0.02:
                if isinstance(v, tuple):
                    u = min(1, max(0, (ts - a) / max(1e-3, b - a)))
                    v0, v1 = VOWEL[v[0]], VOWEL[v[1]]
                    return tuple(v0[j] + (v1[j] - v0[j]) * u for j in range(3))
                return VOWEL[v]
        return VOWEL[vow_at[-1][2] if not isinstance(vow_at[-1][2], tuple) else vow_at[-1][2][1]]

    out = np.zeros((n, 2))
    for shift, g in octave_layers:
        src = np.zeros(n)
        for vce in range(voices):
            det = rng.uniform(-9, 9); vph = rng.uniform(0, 6.28); vr = vib * rng.uniform(.9, 1.1)
            vibr = vdepth * np.sin(2 * np.pi * vr * t + vph) * np.minimum(1, t / 0.35)
            jit = lp(rng.standard_normal(n), 6, 1) * 1.2
            f = hz(pm + shift + (det + jit * 4) / 100 + vibr)
            ph = 2 * np.pi * np.cumsum(f) / SR
            src += saw_phase(ph, f.max()) * (1 / voices)
        src += lp(rng.standard_normal(n), 6000) * breath
        y = formant_filter(src * amp, vt)
        y = hp(y, 120)
        pan = 0.25 if shift < 0 else -0.15
        a = (pan + 1) * np.pi / 4
        out[:, 0] += y * g * np.cos(a); out[:, 1] += y * g * np.sin(a)
    return out * 0.5, t_start


# ---- drums ----
def kick(vel=1.0):
    t = tt(0.45); f = 48 + 110 * np.exp(-t * 28)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    y[:200] += lp(noise(200 / SR), 4000)[:200] * 0.3 * np.linspace(1, 0, 200)
    return np.tanh(y * 1.4) * vel * 0.55
def snare(vel=0.8):
    t = tt(0.25)
    y = bp(noise(0.25), 900, 6500) * np.exp(-t * 22) * 0.7 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.5
    return y * vel * 0.35
def clap(vel=0.8):
    t = tt(0.3); y = np.zeros_like(t)
    for k, o in enumerate((0, 0.011, 0.022)):
        i = int(o * SR); seg = bp(noise(0.3 - o), 900, 3500) * np.exp(-tt(0.3 - o) * (60 if k < 2 else 14))
        y[i:i + len(seg)] += seg
    return y * vel * 0.3
def hat(vel=0.5, L=0.05):
    t = tt(L); return hp(noise(L), 7000) * np.exp(-t * 70) * vel * 0.18
def crash(vel=0.7, L=2.2):
    t = tt(L); y = hp(noise(L), 3500) * np.exp(-t * 2.2)
    y += hp(noise(L), 8000) * np.exp(-t * 6) * .5
    return y * vel * 0.16
def tom(mid, vel=0.7):
    t = tt(0.4); f = hz(mid) * (1 + .5 * np.exp(-t * 25))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * vel * 0.4
def timpani(mid, vel=0.8, L=1.6):
    t = tt(L); f = hz(mid)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 2.2) + .4 * np.sin(2 * np.pi * f * 1.5 * t) * np.exp(-t * 4) + lp(noise(L), 600) * np.exp(-t * 30) * .4
    return y * vel * 0.4
def woodblock(f=1800, vel=0.5):
    t = tt(0.08); return (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.3 * t)) * np.exp(-t * 70) * vel * 0.3


def roll(t0, t1, vel0=0.2, vel1=0.9, rate=24, pan=0):
    k = 0; t = t0
    while t < t1:
        u = (t - t0) / (t1 - t0)
        place(snare(vel0 + (vel1 - vel0) * u) * (0.85 + 0.3 * (k % 2)), t, 0.8, pan + .1 * (k % 2 * 2 - 1), 0.15)
        t += 1 / rate; k += 1


# ---- K-pop synths ----
def supersaw(notes, dur, vel=0.6, att=0.008, rel=0.22, cutoff=7000, voices=7, spread=24):
    L = dur + rel; t = tt(L); out = np.zeros((len(t), 2))
    for n in notes:
        f = hz(m(n) if isinstance(n, str) else n)
        for v in range(voices):
            u = v / (voices - 1) * 2 - 1
            ff = f * 2 ** (u * spread / 1200)
            y = saw_phase(2 * np.pi * ff * t + rng.uniform(0, 6.28), ff)
            a = (u * .8 + 1) * np.pi / 4
            out[:, 0] += y * np.cos(a); out[:, 1] += y * np.sin(a)
    out = lp(hp(out.T, 140), cutoff, 2).T
    e = np.minimum(1, t / att) * np.where(t < dur, 0.85 + 0.15 * np.exp(-t * 8), 0.85 * np.exp(-(t - dur) / (rel / 3)))
    return out * e[:, None] * vel * 0.022
def spluck(mid, vel=0.5, L=0.32):
    f = hz(mid); t = tt(L); y = np.zeros_like(t)
    for k in range(1, 24):
        if k * f > 16000: break
        y += (1 / k) * (1 if k % 2 else .55) * np.sin(2 * np.pi * k * f * t + .3 * k) * np.exp(-t * (6 + k * 2.4))
    return y * np.minimum(1, t / 0.0015) * vel * 0.32
def b808(mid, dur, vel=0.8):
    t = tt(dur + 0.08); f = hz(mid) * (1 + .18 * np.exp(-t * 30))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR)
    e = np.minimum(1, t / 0.003) * np.exp(-t * 1.1) * np.where(t < dur, 1, np.exp(-(t - dur) / 0.025))
    return np.tanh(2.6 * y * e) * vel * 0.42
def kick_pop(vel=1.0):
    k = kick(vel); KICK_CLICK = hp(noise(0.01), 3000) * np.exp(-tt(0.01) / 0.002) * .25 * vel
    k[:len(KICK_CLICK)] += KICK_CLICK
    return k
def K(t0, vel=1.0, pan=0):
    place(kick_pop(vel), t0, 1, pan, .03); KICKS.append((t0, vel))
def impact(vel=1.0):
    t = tt(1.4); f = 30 + 45 * np.exp(-t * 4)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2) + lp(noise(1.4), 1500) * np.exp(-t * 9) * .5
    return np.tanh(y * 1.3) * vel * 0.5
def hats(t0, t1, rate, vel=0.32, pan=.25):
    t = t0
    while t < t1 - 1e-6:
        place(hat(vel, 0.035), t, 1, pan, .03); t += 1 / rate
def riser(d, vel=0.5, f0=300, f1=5000):
    w = whoosh(d, f0, f1, vel) * np.linspace(0.2, 1, int(round(d * SR)))
    r = tt(d); w += np.sin(2 * np.pi * np.cumsum(f0 * .5 * (f1 / f0) ** (r / d * .6)) / SR) * (r / d) ** 2 * .04 * vel
    return w

# ---- sfx ----
def whoosh(d=0.4, f0=400, f1=2500, vel=0.5):
    x = noise(d); out = np.zeros_like(x); B = 512; zi = np.zeros((2, 2))
    for i in range(0, len(x), B):
        u = i / len(x); fc = f0 * (f1 / f0) ** u
        sos = sg.butter(2, [fc * .6, min(fc * 1.6, 20000)], 'band', fs=SR, output='sos')
        out[i:i + B], zi = sg.sosfilt(sos, x[i:i + B], zi=zi)
    e = np.sin(np.pi * np.linspace(0, 1, len(x))) ** 1.5
    return out * e * vel * 0.6
def slide_whistle(t0, d, m0, m1, vel=0.4):
    t = tt(d); mm = m0 + (m1 - m0) * (t / d) ** 0.9
    f = hz(mm + .25 * np.sin(2 * np.pi * 6 * t))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) + .12 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    y += bp(noise(d), 1500, 6000) * .05
    place(fade(y, .02, .04) * vel * 0.3, t0, 1, 0.1, 0.25)
def thud(vel=1.0):
    t = tt(0.7); f = 40 + 90 * np.exp(-t * 14)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) + lp(noise(0.7), 900) * np.exp(-t * 14) * .6
    return np.tanh(y * 1.5) * vel * 0.6
def pop(vel=0.5, f0=400, f1=1200):
    t = tt(0.09); f = f0 + (f1 - f0) * t / 0.09
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35) * vel * 0.4
def boing(vel=0.5):
    t = tt(0.6); f = 220 * (1 + .25 * np.sin(2 * np.pi * 14 * t) * np.exp(-t * 4)) * (1 + .4 * np.exp(-t * 8))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5) * vel * 0.35
def spray(d=0.5, vel=0.4):
    x = hp(noise(d), 4000); e = np.minimum(1, tt(d) / 0.02) * np.exp(-tt(d) * 2.5)
    return fade(x * e, 0.005, 0.08) * vel * 0.25
def paper_slide(d=0.4, vel=0.4):
    x = bp(noise(d), 1500, 7000) * (0.6 + 0.4 * lp(rng.standard_normal(int(d * SR)), 30))
    e = np.sin(np.pi * np.linspace(0, 1, len(x)))
    return x * e * vel * 0.25
def breath(d=0.3, vel=0.4, vowel='a'):
    x = noise(d); F = VOWEL[vowel]
    y = sum(sg.lfilter(*biquad_bp(F[k], 4), x) * g for k, g in ((0, 1), (1, .5), (2, .3)))
    e = np.sin(np.pi * np.linspace(0, 1, len(x))) ** .8
    return y * e * vel * 0.3
def alarm(t0, d, vel=0.4):
    t = tt(d); sel = (np.floor(t * 28) % 2)
    f = np.where(sel > 0, 2200, 1800)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) + .3 * np.sin(2 * np.pi * np.cumsum(f * 2.7) / SR)
    e = (0.6 + 0.4 * np.abs(np.sin(np.pi * 28 * t))) * np.minimum(1, t / .01) * np.exp(-t * 2.2)
    place(fade(y * e, .005, .05) * vel * 0.15, t0, 1, .2, .2)
def door_slam(vel=0.8):
    t = tt(0.5); y = thud(1)[:len(t)] * .7 + bp(noise(0.5), 300, 2500) * np.exp(-t * 18) * .4
    return y * vel
def crowd(t0, d, level=0.3, swell=None, seed=1):
    r = np.random.default_rng(seed)
    n = int(d * SR); t = np.arange(n) / SR
    x = np.zeros((n, 2))
    for ch in range(2):
        base = bp(r.standard_normal(n), 300, 3200)
        mod = np.zeros(n)
        for k in range(6):
            mod += np.abs(np.sin(2 * np.pi * r.uniform(1.5, 5) * t + r.uniform(0, 6)))
        x[:, ch] = base * (0.5 + mod / 6)
        # whoo whistles
        for k in range(int(d * 2.5)):
            ws = r.uniform(0, d - .5); wl = r.uniform(.25, .6); wt = tt(wl)
            f = r.uniform(900, 1500) * (1 + .25 * np.sin(np.pi * wt / wl))
            w = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * wt / wl) ** 2 * .15
            i = int(ws * SR); x[i:i + len(w), ch] += w[:max(0, n - i)]
    env = swell(t) if swell else np.ones(n)
    place(x * env[:, None] * level * 0.12, t0, 1, 0, 0.3)
def applause(t0, d, rate=260, level=0.3, seed=3):
    r = np.random.default_rng(seed); n = int(d * SR); x = np.zeros((n, 2))
    k = int(d * rate)
    cl = bp(r.standard_normal(int(0.012 * SR)), 800, 4000) * np.exp(-np.arange(int(0.012 * SR)) / SR * 300)
    for _ in range(k):
        i = r.integers(0, n - len(cl)); ch = r.integers(0, 2)
        x[i:i + len(cl), ch] += cl * r.uniform(.3, 1)
    env = np.minimum(1, np.arange(n) / SR / 0.3) * np.minimum(1, (n - np.arange(n)) / SR / 0.8)
    place(x * env[:, None] * level * 0.25, t0, 1, 0, 0.25)


# ================================================================== SCORE
# ---------- Scene 1: the letter (F major, 100 BPM) ----------
chord(['F2', 'C3', 'A3', 'E4', 'G4'], 0.02, 0.95, vel=0.42, roll=0.025)
place(piano(m('A4'), 0.3, 0.3), 0.62, 1, .2, .25)
place(piano(m('C5'), 0.3, 0.3), 0.92, 1, .25, .25)
warm, ts = choir([(0.04, 0.27, m('F3'), 'a'), (0.32, 0.27, m('A3'), 'a'), (0.62, 0.36, m('C4'), ('a', 'u'))], octave_layers=((12, 0.75), (0, 0.6)))
place(warm, ts, 0.55, 0, 0.3)
place(paper_slide(0.42, 0.7), 0.44, 1, .55, .1)
place(whoosh(0.35, 1500, 600, 0.25), 0.45, 1, .6, .1)
for t0, n in [(1.0, 'C5'), (1.15, 'A4'), (1.30, 'F4'), (1.45, 'A4'), (1.6, 'C5'), (1.75, 'D5')]:
    place(pluck(m(n), 0.5, 0.45, 0.35, 0.99), t0, 1, -.3, .2)
place(paper_slide(0.12, 0.6), 1.2, 1, .3, .05)
for k, n in enumerate(['F5', 'A5', 'C6', 'F6']):
    place(glock(m(n), 0.45), 1.27 + k * 0.045, 1, .3 - k * .15, .35)
place(pad(['D4', 'F4', 'A4'], 0.6, 0.6, att=0.3, rel=0.4), 1.45, 1, 0, .3)
for k, n in enumerate(['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5']):
    place(pluck(m(n), 0.6, 0.35, 0.7, 0.995), 1.74 + k * 0.042, 1, -.4 + k * .1, .35)
place(whoosh(0.34, 300, 3000, 0.45), 2.12, 1, 0, .15)
place(brass_stab(['Bb2', 'F3', 'Bb3', 'D4', 'F4'], 0.45, 0.9), 2.45, 1, 0, .3)
place(timpani(m('Bb1'), 0.8), 2.45, 1, 0, .3)
place(crash(0.6), 2.45, 1, .2, .3)
for k, n in enumerate(['F4', 'A4', 'C5', 'F5', 'A5', 'C6']):
    place(piano(m(n), 0.15, 0.35 + k * .05), 2.6 + k * 0.075, 1, -.2 + k * .08, .25)
chord(['Bb3', 'D4', 'F4', 'Bb4'], 3.05, 0.3, vel=0.4)
roll(2.95, 3.38, 0.1, 0.7)
place(whoosh(0.3, 500, 4000, 0.5), 3.12, 1, -.2, .15)

# ---------- Scene 2: the panic (A minor, 150 BPM trap-pop: beat .4, 16th .1) ----------
place(impact(0.9), 3.4, 1, 0, .2)
place(timpani(m('A1'), 0.8), 3.4, 1, 0, .3)
place(crash(0.5), 3.4, 1, -.2, .3)
place(woodblock(2200, .9), 3.5, 1, .3, .15)
alarm(3.62, 0.42, 0.9)
place(woodblock(1600, .7), 3.8, 1, -.3, .15)
place(riser(0.3, .35, 600, 4000), 3.65, 1, 0, .1)
G0 = 3.95; S16 = 0.1
prog = [(['A3', 'C4', 'E4'], 'A1'), (['F3', 'A3', 'C4'], 'F1'), (['G3', 'B3', 'D4'], 'G1'), (['E3', 'G#3', 'B3', 'D4'], 'E1')]
mel = [['E5', 'D5', 'C5', 'B4'], ['A4', 'C5', 'F5', 'E5'], ['D5', 'B4', 'G4', 'B4'], ['G#4', 'B4', 'E5', 'D5']]
for c, (ch, root) in enumerate(prog):
    u0 = G0 + c * 0.8
    K(u0, .95); K(u0 + .5, .6)
    place(clap(.75), u0 + .4, 1, .05, .15); place(snare(.45), u0 + .4, 1, -.05, .1)
    place(b808(m(root), .42, .85), u0, 1, 0, .02); place(b808(m(root), .2, .6), u0 + .5, 1, 0, .02)
    place(supersaw(ch, .08, .7, cutoff=6000), u0 + .2, 1, 0, .12, bus='sc'); place(supersaw(ch, .08, .6, cutoff=6000), u0 + .6, 1, 0, .12, bus='sc')
    hats(u0, u0 + .6, 10, .3); hats(u0 + .6, u0 + .8, 30 if c % 2 else 20, .26)
    for k in range(4):
        t = u0 + k * 0.2
        place(spluck(m(mel[c][k]), .55, .3), t, 1, .3, .2)
        place(spluck(m(mel[c][k]) + 12, .22, .2), t + .1, 1, -.3, .2)
        place(woodblock(2200 if (c * 2 + k // 2) % 2 == 0 else 1600, .4), t, 1, .35 if k % 2 == 0 else -.35, .1) if k % 2 == 0 else None
for k in range(6):
    place(whoosh(0.16, 800, 3000, 0.22), 4.4 + k * 0.14, 1, (-1) ** k * .4, .05)
    place(pop(0.25, 300, 700), 4.42 + k * 0.14, 1, (-1) ** k * .4, .1)
place(spray(0.52, 0.8), 4.62, 1, -.3, .1)
for k, n in enumerate(['C6', 'E6', 'G6']):
    place(glock(m(n), .5), 5.28 + k * 0.06, 1, -.1, .35)
place(boing(0.9), 5.82, 1, .2, .15)
place(whoosh(0.5, 300, 1800, 0.4), 6.1, 1, -.3, .1)
for k in range(5):
    place(thud(0.12), 6.15 + k * 0.15, 1, -.2 + k * .12, .05)
place(door_slam(0.75), 6.9, 1, .4, .3)
# tremolo rise into scene 3
place(pad(['E3', 'B3', 'E4'], 0.45, 0.5, att=0.4, rel=0.1, cutoff=3000), 6.55, 1, 0, .2)

# ---------- Scene 3: near disaster ----------
t = tt(0.8)
trem = pad(['E3', 'B3', 'E4', 'G4'], 0.78, 0.9, att=0.6, rel=0.05, cutoff=3500)
trem[:len(t)] *= 0.55 + 0.45 * np.abs(np.sin(2 * np.pi * 7 * t))
place(trem, 7.0, 1, 0, .25)
wob = np.sin(2 * np.pi * np.cumsum(hz(m('E5')) * (1 + 0.035 * np.sin(23 * t))) / SR) * (0.2 + 0.8 * (t / 0.8) ** 2)
place(fade(wob, .02, .03) * 0.07, 7.0, 1, .2, .25)
for k in range(4):
    place(bass(m('E2'), 0.15, 0.5), 7.0 + k * 0.2, 1, 0, .05)
for k in range(3):
    place(thud(0.15), 7.05 + k * 0.24, 1, -.3 + k * .2, .05)
slide_whistle(7.78, 0.27, m('C5'), m('G6'), 0.9)
slide_whistle(8.05, 0.28, m('G6'), m('A4'), 0.9)
for k in range(4):
    place(whoosh(0.28, 400, 2200, 0.35), 7.86 + k * 0.06, 1, -.5 + k * .3, .1)
place(thud(1.0), 8.33, 1, 0, .25)
place(timpani(m('E1'), 0.9, 1.2), 8.33, 1, 0, .25)
for k in range(5):
    place(thud(0.3), 8.35 + k * 0.035, 1, -.4 + k * .2, .1)
place(crash(0.35, 1.0), 8.34, 1, .1, .2)
for k, n in enumerate(['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6']):
    place(pluck(m(n), 1.2, 0.3, 0.6, 0.997), 8.6 + k * 0.035, 1, -.3 + k * .1, .4)
place(pad(['C3', 'G3', 'C4', 'E4', 'G4'], 0.55, 0.9, att=0.25, rel=0.4), 8.55, 1, 0, .35)
place(breath(0.32, 0.9, 'a'), 8.82, 1, 0, .2)
place(breath(0.1, 0.8, 'u'), 9.05, 1, .1, .15)
place(pluck(m('G4'), .3, .45, .3, .99), 9.15, 1, -.3, .2)
place(pluck(m('D4'), .3, .45, .3, .99), 9.31, 1, .3, .2)
for t0, n in [(9.45, ['C4', 'E4', 'G4', 'C5']), (9.6, ['C4', 'E4', 'G4', 'C5']), (9.75, ['C4', 'F4', 'A4', 'C5']), (9.88, ['B3', 'D4', 'G4', 'B4'])]:
    for k, nn in enumerate(n): place(pluck(m(nn), .35, .32, .6, .992), t0 + k * 0.012, 1, -.2 + k * .12, .2)
gig, ts = choir([(9.5, .06, m('G4'), 'a'), (9.58, .06, m('E4'), 'a'), (9.66, .06, m('G4'), 'a'), (9.76, .06, m('D4'), 'a'),
                 (9.84, .06, m('F4'), 'a'), (9.92, .07, m('C4'), 'a')], octave_layers=((0, 0.8), (5, 0.4)), vib=8, breath=0.15)
place(gig, ts, 0.5, .1, .2)
roll(9.68, 10.6, 0.1, 0.85)
place(crash(0.3, 1.0)[::-1] * 0.8, 10.0 - 1.0, 1, 0, .1)

# ---------- Scene 4: the show ("Happy Birthday", C major, 3/4 at 180 BPM) ----------
crowd(9.95, 10.1, 1.0, swell=lambda t: 0.25 + 0.75 * np.exp(-((t - 0.5) / 0.35) ** 2)
      + 0.9 * np.clip((t - 8.35) / 0.4, 0, 1) * np.exp(-np.clip(t - 8.75, 0, None) / 1.2), seed=11)
place(crash(0.7), 10.0, 1, .3, .3)
for k, t0 in enumerate([10.15, 10.30, 10.45]):
    place(thud(0.35), t0, 1, (-.5, .5, 0)[k], .25); place(woodblock(900, .5), t0, 1, (-.5, .5, 0)[k], .3)
B = 1 / 3
SONG = [  # (t, dur, melody midi (high layer), vowel)
    (10.667, .24, 'G4', ('ae', 'ae')), (10.917, .08, 'G4', 'i'), (11.0, .32, 'A4', 'er'), (11.333, .32, 'G4', ('e', 'i')), (11.667, .32, 'C5', 'u'), (12.0, .62, 'B4', 'u'),
    (12.667, .24, 'G4', 'ae'), (12.917, .08, 'G4', 'i'), (13.0, .32, 'A4', 'er'), (13.333, .32, 'G4', ('e', 'i')), (13.667, .32, 'D5', 'u'), (14.0, .62, 'C5', 'u'),
    (14.667, .24, 'G4', 'ae'), (14.917, .08, 'G4', 'i'), (15.0, .32, 'G5', 'er'), (15.333, .32, 'E5', ('e', 'i')), (15.667, .32, 'C5', ('i', 'er')),
    (16.0, .32, 'B4', 'e'), (16.333, .64, 'A4', ('e', 'i')),
    (17.0, .24, 'F5', 'ae'), (17.25, .08, 'F5', 'i'), (17.333, .32, 'E5', 'er'), (17.667, .32, 'C5', ('e', 'i')), (18.0, .32, 'D5', 'u'), (18.333, 1.0, 'C5', ('u', 'a')),
]
vox, ts = choir([(t0, d, m(n) - 12, v) for t0, d, n, v in SONG], octave_layers=((12, 0.62), (0, 0.85)), voices=6, vib=5.4)
place(vox, ts, 0.8, 0, 0.32)
for t0, d, n, v in SONG:
    place(glock(m(n) + 12, 0.22, 0.8), t0, 1, .3, .3)
# ---- K-pop production (6/8 feel: bar = 1 s, eighth = 1/6 s) ----
E6 = 1 / 6
CH = {'C': (['C4', 'E4', 'G4'], 'C2', ['C5', 'E5', 'G5', 'C6', 'G5', 'E5']), 'G7': (['B3', 'D4', 'F4', 'G4'], 'G1', ['G4', 'B4', 'D5', 'F5', 'D5', 'B4']),
      'C7': (['Bb3', 'C4', 'E4', 'G4'], 'C2', ['C5', 'E5', 'G5', 'Bb5', 'G5', 'E5']), 'F': (['A3', 'C4', 'F4', 'G4'], 'F1', ['F4', 'A4', 'C5', 'G5', 'C5', 'A4']),
      'C/G': (['G3', 'C4', 'E4'], 'G1', ['G4', 'C5', 'E5', 'G5', 'E5', 'C5'])}
def groove_bar(t0, name, energy=1.0, half=False, roll_end=False):
    ch, root, arp = CH[name]
    K(t0, 1.0)
    if not half: K(t0 + 4 * E6, .55)
    place(b808(m(root), .5, .9), t0, 1, 0, .02)
    if not half: place(b808(m(root) + 12, .14, .5), t0 + 4 * E6, 1, 0, .02)
    place(supersaw(ch, 1.0 - .02, .55 * energy, cutoff=7500), t0, 1, 0, .25, bus='sc')
    sn = t0 + (3 * E6 if not half else 3 * E6)
    place(clap(.85), sn, 1, .05, .2); place(snare(.55), sn, 1, -.05, .15)
    rate = 12 if energy > 1 else 6
    hats(t0, t0 + (5 * E6 if roll_end else 1.0), rate, .3 if not half else .2)
    if roll_end: hats(t0 + 5 * E6, t0 + 1.0, 36, .28)
    place(hp(noise(.18), 6000) * np.exp(-tt(.18) * 14) * .09, t0 + 2 * E6, 1, -.3, .05)
    for k in range(6): place(spluck(m(arp[k]), .4 * energy, .28), t0 + k * E6, 1, (-1) ** k * .35, .25, bus='sc')
    chord(ch, t0, .3, vel=.28, rev=.15)
# pickup + verse 1-2
place(crash(.35, 1.0)[::-1] * .7, 11.0 - 1.0, 1, 0, .1)
for k, n in enumerate(['G4', 'B4', 'D5', 'G5']): place(spluck(m(n), .3, .25), 10.667 + k * E6 / 2, 1, .2, .25)
place(b808(m('G1'), .3, .7), 10.667, 1, 0, .02)
groove_bar(11.0, 'C'); groove_bar(12.0, 'G7', roll_end=True); groove_bar(13.0, 'G7'); groove_bar(14.0, 'C', roll_end=True)
# bar 5: build toward the drop on "May" (banner lands)
K(15.0, .9); K(15.333, .8); K(15.667, .9)
place(b808(m('C2'), .9, .8), 15.0, 1, 0, .02)
place(supersaw(CH['C7'][0], .9, .5, att=.4, cutoff=3500), 15.0, 1, 0, .25, bus='sc')
for k in range(12):
    tk = 15.0 + k * (1 / 12) if k < 6 else 15.5 + (k - 6) * (1 / 14)
    place(snare(.25 + k * .05), tk, 1, (-1) ** k * .1, .15)
place(riser(0.9, .7), 15.02, 1, 0, .2)
for k in range(6): place(spluck(m(CH['C7'][2][k]), .3 + k * .05, .25), 15.0 + k * E6, 1, (-1) ** k * .3, .25, bus='sc')
# 16.0 DROP: impact, F add9, 808; fermata on "Ma-ay" in half time
K(16.0, 1.2); place(impact(1.0), 16.0, 1, 0, .25); place(crash(.95, 2.6), 16.0, 1, .25, .35); place(crash(.7, 2.6), 16.01, 1, -.3, .35)
place(b808(m('F1'), 1.25, 1.0), 16.0, 1, 0, .02)
place(supersaw(['F3', 'A3', 'C4', 'G4', 'A4', 'C5'], 1.25, .7, cutoff=9000), 16.0, 1, 0, .3, bus='sc')
chord(['F2', 'C3', 'A3', 'G4', 'C5'], 16.0, 1.2, vel=.45, roll=.01)
place(clap(.8), 16.5, 1, 0, .25); place(snare(.5), 16.5, 1, 0, .2)
hats(16.0, 16.8, 12, .16)
for k in range(9): place(snare(.3 + k * .07), 16.833 + k * (0.5 / 9), 1, (-1) ** k * .12, .12)
place(riser(0.5, .55, 500, 7000), 16.83, 1, 0, .15)
place(b808(m('F1'), .3, .7), 17.0, 1, 0, .02)
for k, n in enumerate(['F5', 'A5', 'C6']): place(spluck(m(n), .35, .25), 17.0 + k * E6 * .66, 1, .2, .25)
# bar 7: full energy, then the final hit on "you"
place(crash(.75), 17.333, 1, -.3, .3)
K(17.333, 1.0); K(17.333 + 2 * E6, .7); K(17.333 + 4 * E6, .8)
place(b808(m('G1'), .62, .9), 17.333, 1, 0, .02); place(b808(m('G1'), .3, .8), 18.0, 1, 0, .02)
place(supersaw(CH['C/G'][0], .64, .65, cutoff=8500), 17.333, 1, 0, .25, bus='sc')
place(supersaw(CH['G7'][0], .32, .7, cutoff=8500), 18.0, 1, 0, .25, bus='sc')
place(clap(.9), 17.333 + 3 * E6, 1, .05, .2); place(snare(.6), 17.333 + 3 * E6, 1, -.05, .15)
hats(17.333, 18.25, 12, .3); hats(18.25, 18.333, 48, .3)
for k, n in enumerate(['G4', 'C5', 'E5', 'G5', 'B4', 'D5']): place(spluck(m(n), .45, .28), 17.333 + k * E6, 1, (-1) ** k * .35, .25, bus='sc')
chord(['G3', 'C4', 'E4'], 17.333, .3, vel=.3); chord(['G3', 'B3', 'D4', 'F4'], 18.0, .3, vel=.3)
K(18.333, 1.3); place(impact(1.1), 18.333, 1, 0, .25)
place(b808(m('C1'), 1.05, 1.0), 18.333, 1, 0, .02)
place(supersaw(['C3', 'G3', 'C4', 'E4', 'G4', 'D5', 'E5'], 1.0, .8, cutoff=10000, rel=.6), 18.333, 1, 0, .35, bus='sc')
chord(['C3', 'E3', 'G3', 'C4', 'E4', 'G4', 'C5'], 18.333, 1.0, vel=0.55, roll=0.012)
for k in range(4): K(18.333 + (k + 1) * .25, .35)
place(crash(0.9, 2.5), 18.333, 1, .2, .35); place(crash(0.7, 2.5), 18.34, 1, -.3, .35)
place(timpani(m('C2'), 0.9), 18.333, 1, 0, .3)
for k, s in enumerate((-.7, .7)):
    place(thud(0.6), 18.333 + k * .02, 1, s, .2); place(pop(0.5, 900, 300), 18.333 + k * .02, 1, s, .2)
    place(hp(noise(0.3), 2000) * np.exp(-tt(0.3) * 12) * .15, 18.34 + k * .02, 1, s, .2)
for k, n in enumerate(['C6', 'E6', 'G6', 'C7']):
    place(glock(m(n), .35), 18.45 + k * 0.07, 1, .2 - k * .1, .35)
applause(18.35, 1.7, 300, 1.0)
place(whoosh(0.66, 200, 6000, 0.5), 19.36, 1, 0, .2)
r = tt(0.66); place(np.sin(2 * np.pi * np.cumsum(200 * 2 ** (r * 3)) / SR) * (r / .66) ** 2 * .05, 19.36, 1, 0, .3)

# ---------- Scene 5: make a wish ----------
for k, n in enumerate(['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6']):
    place(pluck(m(n), 1.0, 0.28, 0.75, 0.997), 20.12 + k * 0.04, 1, -.5 + k * .12, .45)
for k, n in enumerate(['E6', 'G6', 'C7', 'G6', 'E6']):
    place(celesta(m(n), .3), 20.2 + k * 0.07, 1, (-1) ** k * .3, .4)
place(glock(m('G6'), .6, 2.0), 20.55, 1, -.3, .45); place(breath(0.08, .5, 'u'), 20.53, 1, -.3, .1)
place(glock(m('C7'), .6, 2.0), 20.75, 1, .3, .45); place(breath(0.08, .5, 'u'), 20.73, 1, .3, .1)
chord(['C2', 'G2', 'E3', 'B3', 'D4', 'G4'], 20.86, 1.6, vel=0.5, roll=0.03)
place(pad(['C3', 'G3', 'D4', 'E4', 'B4'], 1.5, 0.9, att=0.2, rel=0.6), 20.85, 1, 0, .4)
end, ts = choir([(20.88, 1.45, m('E4'), ('a', 'ah'))], octave_layers=((0, .6), (-4, .45), (-9, .4), (3, .35)), voices=5)
place(end, ts, 0.6, 0, .4)
for k, n in enumerate(['C6', 'E6', 'G6', 'B6', 'D7']):
    place(glock(m(n), .35, 1.8), 20.95 + k * 0.08, 1, -.4 + k * .2, .45)
crowd(20.85, 1.65, 0.45, swell=lambda t: np.exp(-((t - 0.25) / 0.5) ** 2), seed=21)

# ================================================================== MIX
def reverb_ir(L=2.0, pre=0.018):
    n = int(L * SR); t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    for ch in range(2):
        x = rng.standard_normal(n)
        bright = hp(x, 1500) * np.exp(-t / 0.18)
        dark = lp(x, 3500) * np.exp(-t / 0.42)
        ir[:, ch] = (bright * .4 + dark) * np.minimum(1, t / 0.004)
    ip = int(pre * SR)
    ir = np.r_[np.zeros((ip, 2)), ir]
    return ir / np.sqrt((ir ** 2).sum(0, keepdims=True)) * 0.8

# sidechain: duck the synth bus after every kick
duck = np.ones(N)
for tk, v in KICKS:
    i0 = int(tk * SR); n = min(N - i0, int(0.45 * SR))
    if n <= 0: continue
    tt_ = np.arange(n) / SR
    d = 1 - min(0.75, 0.6 * v) * np.minimum(1, tt_ / 0.004) * np.exp(-tt_ / 0.11)
    duck[i0:i0 + n] = np.minimum(duck[i0:i0 + n], d)
DRY += SC * duck[:, None]; VERB += SCV * duck[:, None]
ir = reverb_ir()
wet = np.stack([sg.fftconvolve(VERB[:, c], ir[:, c])[:N] for c in range(2)], 1)
mix = DRY + wet * 0.9
mix = hp(mix.T, 28).T
# gentle bus compression
env = np.sqrt(lp(np.maximum(mix[:, 0] ** 2, mix[:, 1] ** 2), 8, 1).clip(1e-9))
thr = np.percentile(env, 92)
gain = np.where(env > thr, (thr / env) ** (1 - 1 / 2.2), 1.0)
gain = lp(gain, 15, 1)
mix *= gain[:, None]
# end fade
f0 = int(21.7 * SR); mix[f0:] *= np.linspace(1, 0, N - f0)[:, None] ** 1.6
mix[:int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))[:, None]
mix = mix / np.abs(mix).max() * 0.9
mix = np.tanh(mix * 1.1) / np.tanh(1.1)

out = HERE / "out"; out.mkdir(exist_ok=True)
raw = out / "raw.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", str(raw)], input=mix.astype(np.float32).tobytes(), check=True)
e = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(raw), "-af", "loudnorm=I=-14:TP=-1.6:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(e[e.rindex("{"):e.rindex("}") + 1])
af = (f"loudnorm=I=-14:TP=-1.6:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", af, "-ar", str(SR), str(out / "audio.wav")], check=True)
print("audio ->", out / "audio.wav", "| measured input", j['input_i'], "LUFS")
