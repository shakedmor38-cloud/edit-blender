"""Render storyboard panels from the film engine and lay them out into storyboard.png"""
import asyncio, base64, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import render
from playwright.async_api import async_playwright

HERE = Path(__file__).resolve().parent
PANELS = [
    (0.30, "1 · The letter", "Seven singers warm up in the rehearsal room."),
    (0.75, "1 · The letter", "A pink envelope slides in under the door."),
    (1.15, "1 · The letter", "The bucket-hat singer picks it up."),
    (1.80, "1 · The letter", "He reads the card: “Happy Birthday May”."),
    (2.80, "1 · The letter", "Spin, jump: “It's May's birthday today!”"),
    (3.70, "2 · The panic", "Clock 7:53, note SHOW 8:00, red 7-minute wedge."),
    (4.75, "2 · The panic", "Blonde fixes his hair at the bulb mirror."),
    (5.45, "2 · The panic", "Black-haired singer digs out his mic."),
    (5.90, "2 · The panic", "Red-tracksuit singer stuck in his jacket."),
    (6.50, "2 · The panic", "Blue-haired singer runs out with the “27” cake."),
    (7.55, "3 · Near disaster", "Hallway to the stage: the cake wobbles."),
    (8.05, "3 · Near disaster", "The cake flies, everyone dives."),
    (8.60, "3 · Near disaster", "One big pile. The cake is caught."),
    (8.97, "3 · Near disaster", "Their sigh of relief blows out the candles."),
    (9.70, "3 · Near disaster", "They look at each other and burst out laughing."),
    (10.30, "4 · The show", "Curtains open, spotlights, purple lightsticks."),
    (12.30, "4 · The show", "“Happy Birthday” with synced choreography."),
    (14.30, "4 · The show", "Hearts pop on “to you”."),
    (16.40, "4 · The show", "Banner drops on “dear May”."),
    (18.70, "4 · The show", "Last note: jump + confetti cannons."),
    (20.62, "5 · The ending", "Close-up: the candles magically relight."),
    (21.80, "5 · The ending", "The band to camera: “Happy Birthday!” Cake reads “still with you”."),
]

async def main():
    out = HERE / "panels"; out.mkdir(exist_ok=True)
    async with async_playwright() as p:
        b, pg, errs = await render.open_page(p)
        for i, (t, _, _) in enumerate(PANELS):
            render.save_dataurl(await pg.evaluate(f"window.still({t}, .9)"), out / f"p{i:02d}.jpg")
        figs = "".join(
            f'<figure><img src="panels/p{i:02d}.jpg"><figcaption><span class="tc">{t:.2f} s</span>'
            f'<b>{sc}</b><span>{d}</span></figcaption></figure>' for i, (t, sc, d) in enumerate(PANELS))
        html = f"""<!doctype html><html><head><meta charset=utf-8><style>
@font-face{{font-family:Fredoka;src:url(../assets/fonts/Fredoka.woff2)}}
body{{margin:0;background:#f6ece4;color:#3a2a24;font-family:Fredoka,sans-serif}}
.wrap{{width:1560px;padding:36px 40px 44px}}
h1{{font-weight:600;font-size:40px;margin:0 0 4px}} p.sub{{margin:0 0 26px;color:#7d655b;font-size:19px}}
.grid{{display:grid;grid-template-columns:repeat(4,1fr);gap:22px}}
figure{{margin:0;background:#fffaf5;padding:8px 8px 12px;box-shadow:0 3px 10px rgba(60,30,20,.14)}}
img{{width:100%;display:block}}
figcaption{{display:flex;flex-direction:column;gap:2px;padding:8px 4px 0;font-size:17px;line-height:1.3}}
.tc{{font-size:14px;color:#c4563d;font-variant-numeric:tabular-nums}} b{{font-weight:600}}
</style></head><body><div class=wrap><h1>Happy Birthday, May · storyboard</h1>
<p class=sub>1080 x 1080 · 22.5 s · paper-cut collage style · frames rendered from the actual animation code</p>
<div class=grid>{figs}</div></div></body></html>"""
        (HERE / "storyboard.html").write_text(html)
        sb = await b.new_page(viewport={"width": 1640, "height": 1000})
        await sb.goto(render.URL.split("film.html")[0] + "storyboard/storyboard.html")
        await sb.evaluate("document.fonts.ready")
        await sb.screenshot(path=str(HERE / "storyboard.png"), full_page=True)
        await b.close()
    print("storyboard ->", HERE / "storyboard.png")

asyncio.run(main())
