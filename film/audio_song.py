"""Soundtrack variant: BTS 'SWIM' (user-supplied file, not committed) edited to the film + the film's SFX.

Song map (94 BPM, beat 0.6383 s, downbeats at 0.858 + n*2.553 s, key A major):
  intro 0-13.6 | beat drops 13.62 | verse 23.8 | pre-chorus 44.3 | chorus 54.48 | chorus 2 95.3 | outro 136.18
Edit:
  film 0.00-7.78   <- song 10.22-18.00  (soft intro end; beat drops on the clock hit at film 3.40 = song 13.62)
  film 7.78-8.20   tape-stop as the cake falls, then silence for the THUD / sigh / laugh (stingers in D/A)
  film 10.0-20.0   <- song 54.48-64.69  (first 4 chorus bars, atempo x1.0212 so 4 bars = 10.0 s)
  film 20.0-22.5   <- song 136.18-       (soft outro under the candle magic, fade out)
Writes out/audio_swim.wav (-14 LUFS) and js/swim_data.js (mouth envelope for the show scene).
"""
import json, subprocess
from pathlib import Path
import numpy as np
import scipy.signal as sg

HERE = Path(__file__).parent
SONG_FILE = HERE / "assets/song/swim.mp3"
src = (HERE / "audio.py").read_text()
ns = {"__file__": str(HERE / "audio.py")}
exec(src[:src.index("# ================================================================== SCORE")], ns)
globals().update({k: v for k, v in ns.items() if not k.startswith("__")})

STRETCH = (4 * 4 * 60 / 94.0) / 10.0   # 4 bars -> 10.0 s
PH = 0.025                              # measured kick onset lag vs. the fitted grid


def load_song(t0, dur, tempo=1.0):
    af = [] if tempo == 1.0 else ["-af", f"atempo={tempo:.6f}"]
    raw = subprocess.run(["ffmpeg", "-v", "quiet", "-ss", f"{t0:.4f}", "-t", f"{dur:.4f}", "-i", str(SONG_FILE), *af,
                          "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(float)


MUS = np.zeros((N, 2))
def put(sig, t0):
    i0 = int(round(t0 * SR)); n = min(len(sig), N - i0)
    MUS[i0:i0 + n] += sig[:n]
def ramp(sig, fin=0.0, fout=0.0):
    n = len(sig); e = np.ones(n)
    a, b = int(fin * SR), int(fout * SR)
    if a: e[:a] = np.linspace(0, 1, a) ** 1.5
    if b: e[n - b:] *= np.linspace(1, 0, b) ** 1.2
    return sig * e[:, None]

# --- A: film 0 -> 7.78 (+ tape stop) ---
A = load_song(10.22 + PH, 7.78 + 0.6)
cut = int(7.78 * SR)
head = ramp(A[:cut], fin=0.35)
put(head, 0.0)
# tape stop: playback rate 1 -> 0 over 0.42 s
L = int(0.42 * SR); rate = np.linspace(1, 0, L) ** 1.3
pos = np.cumsum(rate); pos = pos - pos[0]
tail = A[cut:cut + int(pos[-1]) + 2]
ts = np.stack([np.interp(pos, np.arange(len(tail)), tail[:, c]) for c in range(2)], 1)
ts *= np.linspace(1, 0, L)[:, None] ** .6
put(lp(ts.T, 4000).T, 7.78)

# --- B: chorus, stretched so 4 bars = 10 s ---
pre = 0.012
Bm = load_song(54.48 + PH - pre * STRETCH, (10.21 + 0.3), tempo=STRETCH)
Bm = ramp(Bm[: int((10.0 + pre + 0.03) * SR)], fin=pre, fout=0.03)
put(Bm, 10.0 - pre)

# --- C: soft outro under the ending ---
Cm = load_song(136.18 + PH - 0.01, 2.6)
Cm = ramp(Cm[: int((22.5 - 20.0 + .01) * SR)], fin=0.03, fout=0.95)
put(Cm, 20.0 - 0.01)

# ---------------------------------------------------------------- SFX + stingers (in the song's keys)
# Scene 1
place(paper_slide(0.42, 0.7), 0.44, 1, .55, .1)
place(whoosh(0.35, 1500, 600, 0.25), 0.45, 1, .6, .1)
place(paper_slide(0.12, 0.6), 1.2, 1, .3, .05)
for k, n in enumerate(['A5', 'C#6', 'E6', 'A6']): place(glock(m(n), 0.5), 1.27 + k * 0.045, 1, .3 - k * .15, .35)
for k, n in enumerate(['A4', 'B4', 'C#5', 'E5', 'F#5', 'A5']): place(pluck(m(n), 0.5, 0.25, 0.7, 0.995), 1.76 + k * 0.045, 1, -.4 + k * .12, .35)
place(whoosh(0.34, 300, 3000, 0.45), 2.12, 1, 0, .15)
place(crash(0.45), 2.45, 1, .2, .3); place(timpani(m('A1'), 0.55), 2.45, 1, 0, .3)
place(whoosh(0.3, 500, 4000, 0.5), 3.12, 1, -.2, .15)
# Scene 2
place(impact(0.6), 3.4, 1, 0, .2); place(crash(0.4), 3.4, 1, -.2, .3)
place(woodblock(2200, .9), 3.5, 1, .3, .15)
alarm(3.62, 0.42, 0.8)
place(woodblock(1600, .7), 3.8, 1, -.3, .15)
for k in range(6):
    place(whoosh(0.16, 800, 3000, 0.22), 4.4 + k * 0.14, 1, (-1) ** k * .4, .05)
    place(pop(0.25, 300, 700), 4.42 + k * 0.14, 1, (-1) ** k * .4, .1)
place(spray(0.52, 0.8), 4.62, 1, -.3, .1)
for k, n in enumerate(['A5', 'C#6', 'E6']): place(glock(m(n), .55), 5.28 + k * 0.06, 1, -.1, .35)
place(boing(0.9), 5.82, 1, .2, .15)
place(whoosh(0.5, 300, 1800, 0.4), 6.1, 1, -.3, .1)
for k in range(5): place(thud(0.12), 6.15 + k * 0.15, 1, -.2 + k * .12, .05)
place(door_slam(0.7), 6.9, 1, .4, .3)
# Scene 3
t = tt(0.8)
wob = np.sin(2 * np.pi * np.cumsum(hz(m('E5')) * (1 + 0.035 * np.sin(23 * t))) / SR) * (0.2 + 0.8 * (t / 0.8) ** 2)
place(fade(wob, .02, .03) * 0.05, 7.0, 1, .2, .25)
for k in range(3): place(thud(0.15), 7.05 + k * 0.24, 1, -.3 + k * .2, .05)
slide_whistle(7.8, 0.26, m('D5'), m('A6'), 0.9)
slide_whistle(8.06, 0.27, m('A6'), m('B4'), 0.9)
for k in range(4): place(whoosh(0.28, 400, 2200, 0.35), 7.86 + k * 0.06, 1, -.5 + k * .3, .1)
place(thud(1.0), 8.33, 1, 0, .25); place(timpani(m('D1'), 0.9, 1.2), 8.33, 1, 0, .25)
for k in range(5): place(thud(0.3), 8.35 + k * 0.035, 1, -.4 + k * .2, .1)
place(crash(0.35, 1.0), 8.34, 1, .1, .2)
for k, n in enumerate(['D4', 'F#4', 'A4', 'D5', 'F#5', 'A5', 'D6']): place(pluck(m(n), 1.2, 0.3, 0.6, 0.997), 8.6 + k * 0.035, 1, -.3 + k * .1, .4)
place(pad(['D3', 'A3', 'D4', 'F#4', 'A4'], 0.55, 0.9, att=0.25, rel=0.4), 8.55, 1, 0, .35)
place(breath(0.32, 0.9, 'a'), 8.82, 1, 0, .2)
place(breath(0.1, 0.8, 'u'), 9.05, 1, .1, .15)
place(pluck(m('A4'), .3, .45, .3, .99), 9.15, 1, -.3, .2)
place(pluck(m('E4'), .3, .45, .3, .99), 9.31, 1, .3, .2)
for t0, n in [(9.45, ['D4', 'F#4', 'A4', 'D5']), (9.6, ['D4', 'F#4', 'A4', 'D5']), (9.75, ['D4', 'G4', 'B4', 'D5']), (9.88, ['C#4', 'E4', 'A4', 'C#5'])]:
    for k, nn in enumerate(n): place(pluck(m(nn), .35, .32, .6, .992), t0 + k * 0.012, 1, -.2 + k * .12, .2)
gig, ts0 = choir([(9.5, .06, m('A4'), 'a'), (9.58, .06, m('F#4'), 'a'), (9.66, .06, m('A4'), 'a'), (9.76, .06, m('E4'), 'a'),
                  (9.84, .06, m('G4'), 'a'), (9.92, .07, m('D4'), 'a')], octave_layers=((0, 0.8), (5, 0.4)), vib=8, breath=0.15)
place(gig, ts0, 0.5, .1, .2)
roll(9.68, 9.99, 0.15, 0.85)
place(crash(0.3, 1.0)[::-1] * 0.7, 10.0 - 1.0, 1, 0, .1)
# Scene 4: the show on the chorus
crowd(9.95, 10.1, 0.75, swell=lambda t: 0.25 + 0.75 * np.exp(-((t - 0.5) / 0.35) ** 2)
      + 0.9 * np.clip((t - 7.55) / 0.4, 0, 1) * np.exp(-np.clip(t - 8.0, 0, None) / 1.2), seed=11)
place(crash(0.6), 10.0, 1, .3, .3)
for k, t0 in enumerate([10.15, 10.30, 10.45]):
    place(thud(0.3), t0, 1, (-.5, .5, 0)[k], .25); place(woodblock(900, .45), t0, 1, (-.5, .5, 0)[k], .3)
place(whoosh(0.4, 3000, 600, 0.25), 14.6, 1, 0, .2)
JUMP = 17.5
for k, s in enumerate((-.7, .7)):
    place(thud(0.55), JUMP + k * .02, 1, s, .2); place(pop(0.5, 900, 300), JUMP + k * .02, 1, s, .2)
    place(hp(noise(0.3), 2000) * np.exp(-tt(0.3) * 12) * .15, JUMP + .01 + k * .02, 1, s, .2)
place(crash(0.7, 2.5), JUMP, 1, .2, .35)
applause(JUMP + .05, 2.1, 300, 0.8)
place(whoosh(0.66, 200, 6000, 0.4), 19.36, 1, 0, .2)
# Scene 5: candle magic in D
for k, n in enumerate(['D5', 'E5', 'F#5', 'A5', 'B5', 'D6', 'E6', 'F#6', 'A6']): place(pluck(m(n), 1.0, 0.24, 0.75, 0.997), 20.12 + k * 0.04, 1, -.5 + k * .12, .45)
for k, n in enumerate(['F#6', 'A6', 'D7', 'A6', 'F#6']): place(celesta(m(n), .28), 20.2 + k * 0.07, 1, (-1) ** k * .3, .4)
place(glock(m('A6'), .7, 2.0), 20.55, 1, -.3, .45); place(breath(0.08, .5, 'u'), 20.53, 1, -.3, .1)
place(glock(m('D7'), .7, 2.0), 20.75, 1, .3, .45); place(breath(0.08, .5, 'u'), 20.73, 1, .3, .1)
for k, n in enumerate(['D6', 'F#6', 'A6', 'C#7', 'E7']): place(glock(m(n), .35, 1.8), 20.95 + k * 0.08, 1, -.4 + k * .2, .45)
crowd(20.85, 1.65, 0.35, swell=lambda t: np.exp(-((t - 0.25) / 0.5) ** 2), seed=21)

# ---------------------------------------------------------------- mix
def reverb_ir(L=1.8, pre=0.018):
    n = int(L * SR); t = np.arange(n) / SR; ir = np.zeros((n, 2))
    for ch in range(2):
        x = rng.standard_normal(n)
        ir[:, ch] = (hp(x, 1500) * np.exp(-t / 0.18) * .4 + lp(x, 3500) * np.exp(-t / 0.42)) * np.minimum(1, t / 0.004)
    ir = np.r_[np.zeros((int(pre * SR), 2)), ir]
    return ir / np.sqrt((ir ** 2).sum(0, keepdims=True)) * 0.8
ir = reverb_ir()
wet = np.stack([sg.fftconvolve(VERB[:, c], ir[:, c])[:N] for c in range(2)], 1)
fx = DRY + wet * 0.9
# duck the song a little under the sound effects
fenv = np.sqrt(lp(np.maximum(fx[:, 0] ** 2, fx[:, 1] ** 2), 10, 1).clip(1e-12))
fenv /= np.percentile(fenv, 99.5)
duck = 1 - 0.35 * np.clip(fenv, 0, 1)
duck = lp(duck, 6, 1)
mus_rms = np.sqrt((MUS[int(10 * SR):int(20 * SR)] ** 2).mean())
fx_rms = np.sqrt((fx ** 2).mean())
mix = MUS * duck[:, None] / mus_rms * 0.22 + fx / max(fx_rms, 1e-9) * 0.075
mix = hp(mix.T, 25).T
mix[-int(0.02 * SR):] *= np.linspace(1, 0, int(0.02 * SR))[:, None]
mix = mix / np.abs(mix).max() * 0.9
mix = np.tanh(mix * 1.1) / np.tanh(1.1)

out = HERE / "out"; out.mkdir(exist_ok=True)
raw = out / "raw_swim.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", str(raw)], input=mix.astype(np.float32).tobytes(), check=True)
e = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(raw), "-af", "loudnorm=I=-14:TP=-1.6:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(e[e.rindex("{"):e.rindex("}") + 1])
af = (f"loudnorm=I=-14:TP=-1.6:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", af, "-ar", str(SR), str(out / "audio_swim.wav")], check=True)
raw.unlink()

# ---------------------------------------------------------------- mouth envelope for the show (film 10-20 s, 60 fps)
mid = (Bm[:, 0] + Bm[:, 1]) / 2; side = (Bm[:, 0] - Bm[:, 1]) / 2
vb = lambda x: bp(x, 250, 3500, 4)
em = lp(vb(mid) ** 2, 14, 2).clip(0); es = lp(vb(side) ** 2, 14, 2).clip(0)
voc = np.sqrt(np.maximum(em - 1.4 * es, 0))
voc /= np.percentile(voc, 97) + 1e-9
fps = 60
vals = [float(np.clip(voc[int((pre + i / fps) * SR)] if int((pre + i / fps) * SR) < len(voc) else 0, 0, 1)) for i in range(10 * fps)]
(HERE / "js/swim_data.js").write_text("// mouth openness for the show scene (film 10-20 s, 60 fps), derived from the song's centre-channel vocal band\n"
                                      f"const SWIM_MOUTH = [{','.join(f'{v:.2f}' for v in vals)}];\n")
print("audio ->", out / "audio_swim.wav", "| mouth frames", len(vals), "| mean open", round(float(np.mean(vals)), 2))
