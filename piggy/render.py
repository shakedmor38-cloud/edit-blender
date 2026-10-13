"""probe t1 t2.. | sheet name t1 t2.. | draft | full [a b] | pops [file]   (serve the folder first)"""
import asyncio, base64, json, os, shutil, subprocess, sys, time
from pathlib import Path
import numpy as np
from playwright.async_api import async_playwright

URL = os.environ.get("CLIP_URL", "http://localhost:8768/clip.html?render=1")
W, H = 1080, 1920
FPS, SUB, SHUTTER = 30, int(os.environ.get("SUB", 5)), 0.5
T = json.loads((Path(__file__).parent / "js/data.js").read_text().split("=", 1)[1].rstrip().rstrip(";"))["total"]
NAME = "video"
FAST = [(2.86, 3.62), (4.72, 5.05), (6.30, 6.50), (6.88, 7.05), (7.95, 8.45)]
def sub_for(t, base): return 12 if any(a <= t <= b for a, b in FAST) else base
HERE = Path(__file__).parent
FF = "ffmpeg"
ARGS = ["--font-render-hinting=none", "--force-color-profile=srgb", "--disable-gpu"]

async def open_page(p):
    b = await p.chromium.launch(args=ARGS, executable_path="/opt/pw-browsers/chromium")
    pg = await b.new_page(viewport={"width": W, "height": H + 60})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append("console: " + m.text) if m.type in ("error", "warning") else None)
    await pg.goto(URL)
    await pg.wait_for_function("window.ready === true", timeout=120000)
    return b, pg, errs

def save_dataurl(durl, path):
    Path(path).write_bytes(base64.b64decode(durl.split(",", 1)[1]))

def sheet(folder, pattern, n, out, cols=4, size=300):
    rows = -(-n // cols)
    subprocess.run([FF, "-v", "error", "-y", "-i", str(folder / pattern), "-vf",
                    f"scale={size}:-1,tile={cols}x{rows}:padding=6:color=white", "-frames:v", "1", str(out)], check=True)

async def probe(times, name="sheet.png", cols=4, size=360):
    out = HERE / "probe"; out.mkdir(exist_ok=True)
    for f in out.glob("p_*.jpg"): f.unlink()
    async with async_playwright() as p:
        b, pg, errs = await open_page(p)
        for i, t in enumerate(times):
            save_dataurl(await pg.evaluate(f"window.still({t})"), out / f"p_{i:02d}.jpg")
        await b.close()
    if errs: print("PAGE ERRORS:", errs[:8])
    sheet(out, "p_%02d.jpg", len(times), out / name, cols=cols, size=size)
    print("probe ->", out / name)

async def full(a=0.0, z=None, fps=FPS, sub=SUB, tag=None):
    z = T if z is None else z
    tag = tag or f"{a:g}_{z:g}"
    d = HERE / f"frames_{tag}"; shutil.rmtree(d, ignore_errors=True); d.mkdir()
    i0, i1 = int(round(a * fps)), int(round(z * fps))
    t0 = time.time()
    async with async_playwright() as p:
        b, pg, errs = await open_page(p)
        for k, i in enumerate(range(i0, i1)):
            save_dataurl(await pg.evaluate(f"window.renderBlur({i / fps}, {sub_for(i / fps, sub)}, {SHUTTER}, {fps})"), d / f"f_{k:05d}.jpg")
            if i % 30 == 0: print(f"[{tag}] frame {i}/{i1}  {time.time() - t0:.0f}s", flush=True)
        await b.close()
    if errs: print("PAGE ERRORS:", errs[:8])
    print(f"[{tag}] done {time.time() - t0:.0f}s")

def encode(tags, fps=FPS, out="out/video.mp4", width=None):
    lst = HERE / "frames_list.txt"
    files = []
    for tg in tags: files += sorted((HERE / f"frames_{tg}").glob("f_*.jpg"))
    seq = HERE / "frames_all"; shutil.rmtree(seq, ignore_errors=True); seq.mkdir()
    for k, f in enumerate(files): os.link(f, seq / f"f_{k:05d}.jpg")
    vf = (f"scale={width}:-2," if width else "") + "scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p"
    (HERE / "out").mkdir(exist_ok=True)
    subprocess.run([FF, "-v", "error", "-y", "-framerate", str(fps), "-i", str(seq / "f_%05d.jpg"), "-vf", vf,
                    "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-color_range", "tv", "-colorspace", "bt709",
                    "-color_primaries", "bt709", "-color_trc", "bt709", str(HERE / out)], check=True)
    print("video ->", HERE / out)

def frames_gray(path, size=180):
    raw = subprocess.run([FF, "-v", "quiet", "-i", str(path), "-vf", f"scale={size}:{size},format=gray", "-f", "rawvideo", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, size, size).astype(np.float32)

def pops(path, fps=FPS):
    fr = frames_gray(path); d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
    hits = [(i + 1, round((i + 1) / fps, 3), round(float(d[i]), 2)) for i in range(1, len(d) - 1)
            if d[i] > 3 * max(d[i - 1], d[i + 1], 0.3) and d[i] > 2.0]
    print("pops:", len(hits)); [print("  frame", *h) for h in hits]
    fl = [(n, round(n / fps, 3)) for n in range(1, len(fr) - 1)
          if min(d[n - 1], d[n]) > 2.0 and np.abs(fr[n + 1] - fr[n - 1]).mean() < 0.35 * min(d[n - 1], d[n])]
    print("one-frame flashes:", len(fl)); [print("  frame", *f) for f in fl]

if __name__ == "__main__":
    cmd, rest = sys.argv[1], sys.argv[2:]
    if cmd == "probe": asyncio.run(probe([float(x) for x in rest]))
    elif cmd == "sheet": asyncio.run(probe([float(x) for x in rest[2:]], rest[0], cols=int(rest[1])))
    elif cmd == "full": asyncio.run(full(float(rest[0]), float(rest[1]), tag=rest[2] if len(rest) > 2 else None))
    elif cmd == "draft": asyncio.run(full(0, T, fps=15, sub=1, tag="draft"))
    elif cmd == "encode": encode(rest[1:], fps=int(rest[0]), out=os.environ.get("OUT", "out/video.mp4"))
    elif cmd == "pops": pops(rest[0], int(rest[1]) if len(rest) > 1 else FPS)
