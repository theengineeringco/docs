#!/usr/bin/env python3
"""Frame raw product screenshots on the flow-brand background.

Follows branch-demo's flow-brand product-media rules:

- full: 1920 x 1080 canvas, the 1920 x 1120 background fitted (narrow black side
  bars kept), the window at 1536 x 960 on (192, 60) with 24px rounded corners.
- closeup: 1920 x 1120 canvas, the complete window enlarged to `width` and anchored
  so it runs off the left and bottom edges, with background above and to the right.
  Only the visible top-right window corner shows rounding.

    python3 render.py <background.png> <raw.png> <out.png> full
    python3 render.py <background.png> <raw.png> <out.png> closeup <width>

Raw captures are 1440 x 900 viewports; closeups should come from a 2x capture.
"""
import subprocess
import sys

RIGHT, TOP = 120, 160  # closeup margins to the canvas's right and top edges


def mask(width, height, radius):
    return (
        f"color=black:s={width}x{height}:r=30,format=gray,"
        f"geq=lum='255*clip({radius}.5-hypot(max(max({radius}-X,X-(W-{radius + 1})),0),"
        f"max(max({radius}-Y,Y-(H-{radius + 1})),0)),0,1)',trim=end_frame=1[mask];"
    )


def render(background, raw, out, mode, width=None):
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
