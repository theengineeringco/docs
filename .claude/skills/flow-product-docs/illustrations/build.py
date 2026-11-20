#!/usr/bin/env python3
"""Render the docs illustrations in light and dark.

Each spec in this folder is a flow-illustration spec drawn for the light page. This script
renders it twice, with the circles' fill matched to the page background in each mode, and
writes the animated SVGs to images/illustrations/.

    python3 .claude/skills/flow-product-docs/illustrations/build.py [name ...] [--png DIR]

--png also writes a PNG of each mode to DIR, for checking renders.
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
RENDER = REPO / ".claude/skills/flow-illustration/scripts/render.mjs"
OUT = REPO / "images/illustrations"

# Page backgrounds from docs.json, so circles match the surface they sit on.
MODES = {
    "light": {"theme": "light", "colors": {"paper": "#FDFDFB"}, "suffix": ""},
    "dark": {"theme": "dark", "colors": {"paper": "#161513"}, "suffix": "-dark"},
}


def main(argv):
    png_dir = None
    if "--png" in argv:
        i = argv.index("--png")
        png_dir = Path(argv[i + 1]).resolve()
        argv = argv[:i] + argv[i + 2 :]
    names = set(argv)
    specs = sorted(p for p in HERE.glob("*.json") if not names or p.stem in names)
    if not specs:
        sys.exit("no specs matched")
    OUT.mkdir(parents=True, exist_ok=True)
    failed = False
    with tempfile.TemporaryDirectory() as tmp:
        for spec_path in specs:
            spec = json.loads(spec_path.read_text())
            for mode in MODES.values():
                variant = dict(spec)
                variant["name"] = spec_path.stem + mode["suffix"]
                variant["theme"] = mode["theme"]
                variant["colors"] = {**spec.get("colors", {}), **mode["colors"]}
                variant["background"] = None
                tmp_spec = Path(tmp) / f"{variant['name']}.json"
                tmp_spec.write_text(json.dumps(variant))
                runs = [(OUT, "animated")]
                if png_dir:
                    runs.append((png_dir, "png"))
                for out, fmt in runs:
                    out.mkdir(parents=True, exist_ok=True)
                    result = subprocess.run(
                        ["node", str(RENDER), str(tmp_spec), "--out", str(out), "--formats", fmt],
                        capture_output=True,
                        text=True,
                    )
                    sys.stdout.write(result.stdout)
                    sys.stderr.write(result.stderr)
                    failed |= result.returncode != 0
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main(sys.argv[1:])
