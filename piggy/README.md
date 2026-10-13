# זה פיגי פיגי פיגור : music video

1080x1920 (9:16), 30 fps, 9.66 s. Canvas 2D animation keyed to the song (Suno, 8.1 s) plus an echoed tail.

| t (s) | Scene | What happens |
|---|---|---|
| 0.00-3.31 | Sky hill | Piggy pops up from behind the hill and dances on the beat (161 BPM); hearts on each "פיגי"; on "פיגור" (2.15) it jumps with arms up in a burst of stars; a cloud rushes at the camera |
| 3.31-6.20 | Mud party | Lands in the mud (splash); a friend with a bow slides in; shared spinning jump (4.72); "פיגור" (5.20) arms up + a heart; snout-shaped iris closes |
| 6.20-8.11 | Disco stage | The snout opens onto the stage; a new piggy pops in on every "פיגי" (6.56 ... 7.70); kick at 6.93 = jump, confetti, flash; "פיגור!" (7.98) stars and a cloud wipe |
| 8.11-9.66 | Outro | Logo "פיגי פיגי פיגור!" bounces on the three echoes of the last word; the hero winks |

Build: put the song at `assets/song.wav`, then `python3 audio.py` (soundtrack + `js/data.js`),
serve this folder on :8768, `python3 render.py full A B tag` per chunk, `python3 render.py encode 30 c1 c2 c3`,
and mux `out/audio.wav`. Preview: open `clip.html` (space = play with sound).
