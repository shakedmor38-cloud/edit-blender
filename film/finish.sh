#!/bin/sh
# encode rendered chunks, mux the score, and build review sheets
set -e
cd "$(dirname "$0")"
python3 render.py encode 30 c1 c2 c3
ffmpeg -v error -y -i out/video.mp4 -i out/audio.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart out/final.mp4
ffmpeg -v error -y -i out/final.mp4 -vf "fps=2,scale=270:-1,tile=6x8" -frames:v 1 out/contact.png
ffmpeg -v error -y -i out/final.mp4 -vf "fps=1,scale=360:-1,tile=6x4" -frames:v 1 out/phone.png
echo "final -> out/final.mp4"
