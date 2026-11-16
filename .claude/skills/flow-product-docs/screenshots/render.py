#!/usr/bin/env python3
"""Frame raw product screenshots on the flow-brand background.

Follows branch-demo's flow-brand product-media rules:

- full: 1920 x 1080 canvas, the 1920 x 1120 background fitted (narrow black side
  bars kept), the window at 1536 x 960 on (192, 60) with 24px rounded corners.
- closeup: 1920 x 1120 canvas, the complete window enlarged to `width` and anchored
  so it runs off the left and bottom edges, with background above and to the right.
  Only the visible top-right window corner shows rounding.
- component: one UI element (a dialog, menu, or panel captured on its own) centred
  on the 1920 x 1120 background, keeping its own corner radius. This is a deliberate
  exception to flow-brand's "no floating cards" rule, requested for Linear-style docs.
- crop: a tight region of the UI on its own, rounded corners, transparent outside.

    python3 render.py <background.png> <raw.png> <out.png> full
    python3 render.py <background.png> <raw.png> <out.png> closeup <width>
    python3 render.py <background.png> <raw.png> <out.png> component
    python3 render.py <background.png> <raw.png> <out.png> crop

Element captures (component, crop) come from a 2x capture with a sibling
`<raw>.json` holding the element's CSS corner `radius` and the capture `dsf`.

Raw captures are 1440 x 900 viewports; closeups should come from a 2x capture.
"""
import json
import subprocess
import sys
from pathlib import Path

RIGHT, TOP = 120, 160  # closeup margins to the canvas's right and top edges


def mask(width, height, radius):
    return (
        f"color=black:s={width}x{height}:r=30,format=gray,"
        f"geq=lum='255*clip({radius}.5-hypot(max(max({radius}-X,X-(W-{radius + 1})),0),"
        f"max(max({radius}-Y,Y-(H-{radius + 1})),0)),0,1)',trim=end_frame=1[mask];"
    )


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=width,height",
                          "-of", "csv=p=0", path], check=True, capture_output=True, text=True).stdout
    return tuple(int(v) for v in out.strip().split(","))


def element(background, raw, out, mode):
    meta_path = Path(raw).with_suffix(".json")
    meta = json.loads(meta_path.read_text()) if meta_path.exists() else {"radius": 0, "dsf": 2}
    w, h = probe(raw)
    if mode == "crop":
        radius = 24
        graph = (f"[0:v]format=rgba,setsar=1[ui];" + mask(w, h, radius)
                 + "[ui][mask]alphamerge[out]")
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", raw,
                        "-filter_complex", graph, "-map", "[out]", "-frames:v", "1", out], check=True)
        return (w, h)
    # Fit within the middle of the canvas; never enlarge past 1.25x the 2x capture.
    scale = min(1320 / w, 800 / h, 1.25)
    sw, sh = round(w * scale), round(h * scale)
    radius = max(1, round(meta["radius"] * meta["dsf"] * scale))
    x, y = (1920 - sw) // 2, (1120 - sh) // 2
    graph = (
        "[0:v]scale=1920:1120,setsar=1[bg];"
        + f"[1:v]scale={sw}:{sh}:flags=lanczos,setsar=1[ui];"
        + mask(sw, sh, radius)
        + f"[ui][mask]alphamerge[rounded];[bg][rounded]overlay={x}:{y}[out]"
    )
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", background, "-i", raw,
                    "-filter_complex", graph, "-map", "[out]", "-frames:v", "1", out], check=True)
    return (1920, 1120)


def render(background, raw, out, mode, width=None):
    if mode in ("component", "crop"):
        return element(background, raw, out, mode)
    if mode == "full":
        w, h, x, y, canvas, radius = 1536, 960, 192, 60, (1920, 1080), 24
        bg = "[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[bg];"
    else:
        w = int(width)
        h = round(w * 900 / 1440)
        x, y, canvas, radius = 1920 - RIGHT - w, TOP, (1920, 1120), round(24 * w / 1536)
        bg = "[0:v]scale=1920:1120,setsar=1[bg];"
    graph = (
        bg
        + f"[1:v]scale={w}:{h}:flags=lanczos,setsar=1[ui];"
        + mask(w, h, radius)
        + f"[ui][mask]alphamerge[rounded];[bg][rounded]overlay={x}:{y}[out]"
    )
    subprocess.run(
        ["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", background, "-i", raw,
         "-filter_complex", graph, "-map", "[out]", "-frames:v", "1", out],
        check=True,
    )
    return canvas


if __name__ == "__main__":
    render(*sys.argv[1:])
