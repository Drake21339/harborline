#!/usr/bin/env python3
"""Slice Daniel's GPT ref sheets into Phaser atlases + stable ref names."""
from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
REFS = ROOT / "public" / "art" / "refs"
OUT = ROOT / "public" / "art" / "atlases"
MAP = ROOT / "docs" / "art" / "PIXEL-ATLAS-MAP.md"

# ChatGPT filenames → role
SRC = {
    1: "scene-riverdale.png",
    2: "cars-civ.png",
    3: "cars-police.png",
    4: "cars-emergency.png",
    5: "swat.png",
    6: "civilians.png",
    7: "scene-intersection.png",
    8: "scene-harborview.png",
    9: "scene-harbor-shade.png",
    10: "scene-pinecrest.png",
}

PAD = 8


def src_path(n: int) -> Path:
    return REFS / f"ChatGPT Image Jul 20, 2026, 02_42_59 PM ({n}).png"


def copy_stable_names() -> None:
    for n, name in SRC.items():
        shutil.copy2(src_path(n), REFS / name)
        print(f"ref → {name}")


def bg_mask(im: Image.Image, tol: int = 28) -> Image.Image:
    """Make near-background gray pixels transparent."""
    rgba = im.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    # Sample corners for bg color
    samples = [px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3]]
    br = sum(s[0] for s in samples) // 4
    bg = sum(s[1] for s in samples) // 4
    bb = sum(s[2] for s in samples) // 4
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if abs(r - br) <= tol and abs(g - bg) <= tol and abs(b - bb) <= tol:
                px[x, y] = (r, g, b, 0)
    return rgba


def content_bbox(im: Image.Image) -> tuple[int, int, int, int] | None:
    a = im.split()[-1]
    bb = a.getbbox()
    return bb


def extract_grid(
    im: Image.Image,
    cols: int,
    rows: int,
    *,
    rotate_ccw90: bool = False,
    margin_frac: float = 0.04,
) -> list[Image.Image]:
    """Split sheet into equal cells, chroma-key bg, tight-crop content."""
    w, h = im.size
    mx = int(w * margin_frac)
    my = int(h * margin_frac)
    usable = im.crop((mx, my, w - mx, h - my))
    uw, uh = usable.size
    cw, ch = uw // cols, uh // rows
    frames: list[Image.Image] = []
    for row in range(rows):
        for col in range(cols):
            cell = usable.crop((col * cw, row * ch, (col + 1) * cw, (row + 1) * ch))
            cell = bg_mask(cell)
            bb = content_bbox(cell)
            if not bb:
                frames.append(Image.new("RGBA", (8, 8), (0, 0, 0, 0)))
                continue
            cropped = cell.crop(bb)
            if rotate_ccw90:
                # Sheet faces north; game heading 0 faces +X → rotate so nose points right.
                cropped = cropped.rotate(-90, expand=True)
            frames.append(cropped)
    return frames


def pack_atlas(
    frames: list[Image.Image],
    cols: int,
    rows: int,
    out_name: str,
    roles: list[dict],
) -> tuple[int, int]:
    # Uniform cell = max content + pad
    max_w = max(f.size[0] for f in frames) + PAD * 2
    max_h = max(f.size[1] for f in frames) + PAD * 2
    # keep even
    max_w += max_w % 2
    max_h += max_h % 2
    sheet = Image.new("RGBA", (cols * max_w, rows * max_h), (0, 0, 0, 0))
    meta_frames = []
    for i, fr in enumerate(frames):
        col, row = i % cols, i // cols
        ox = col * max_w + (max_w - fr.size[0]) // 2
        oy = row * max_h + (max_h - fr.size[1]) // 2
        sheet.paste(fr, (ox, oy), fr)
        meta_frames.append({**roles[i], "index": i, "col": col, "row": row})
    OUT.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT / f"{out_name}.png")
    meta = {
        "image": f"{out_name}.png",
        "frameWidth": max_w,
        "frameHeight": max_h,
        "pad": PAD,
        "cols": cols,
        "rows": rows,
        "frames": meta_frames,
    }
    (OUT / f"{out_name}.json").write_text(json.dumps(meta, indent=2) + "\n")
    print(f"atlas {out_name}: {cols}x{rows} cell {max_w}x{max_h}")
    return max_w, max_h


def main() -> None:
    copy_stable_names()

    # --- cars-civ 5x2, face north → rotate to +X ---
    civ = Image.open(REFS / "cars-civ.png")
    civ_frames = extract_grid(civ, 5, 2, rotate_ccw90=True)
    civ_roles = [
        {"name": "compact", "role": "civilian"},
        {"name": "taxi", "role": "civilian"},
        {"name": "sports", "role": "civilian"},
        {"name": "van", "role": "civilian"},
        {"name": "pickup", "role": "civilian"},
        {"name": "muscle", "role": "civilian"},
        {"name": "orange", "role": "civilian"},
        {"name": "service", "role": "civilian"},
        {"name": "luxury", "role": "civilian"},
        {"name": "wagon", "role": "civilian"},
    ]
    cw, ch = pack_atlas(civ_frames, 5, 2, "cars-civ", civ_roles)

    # --- police 5x2 ---
    pol = Image.open(REFS / "cars-police.png")
    pol_frames = extract_grid(pol, 5, 2, rotate_ccw90=True)
    # Our loader expects 4x2 historically — pack as 5x2 and update loader
    pol_roles = [{"name": f"patrol-{i}", "role": "police"} for i in range(10)]
    pw, ph = pack_atlas(pol_frames, 5, 2, "cars-police", pol_roles)

    # --- emergency 5x2 ---
    em = Image.open(REFS / "cars-emergency.png")
    em_frames = extract_grid(em, 5, 2, rotate_ccw90=True)
    em_names = [
        "ladder",
        "pumper-a",
        "pumper-b",
        "ladder-b",
        "rescue-box",
        "command-suv",
        "ambulance",
        "tanker",
        "utility",
        "brush",
    ]
    em_roles = [{"name": n, "role": "emergency"} for n in em_names]
    ew, eh = pack_atlas(em_frames, 5, 2, "cars-emergency", em_roles)

    # --- swat 5x2 top-down, rotate so facing +X ---
    sw = Image.open(REFS / "swat.png")
    sw_frames = extract_grid(sw, 5, 2, rotate_ccw90=True, margin_frac=0.06)
    sw_roles = [{"name": f"swat-{i}", "role": "swat"} for i in range(10)]
    sw_w, sw_h = pack_atlas(sw_frames, 5, 2, "swat", sw_roles)

    # --- civilians 6x3 — 3/4 view, no rotate (facing camera); still usable as top markers ---
    ped = Image.open(REFS / "civilians.png")
    ped_frames = extract_grid(ped, 6, 3, rotate_ccw90=False, margin_frac=0.05)
    ped_roles = [
        {"name": f"civ-{i}", "role": "civilian" if i < 17 else "cop"} for i in range(18)
    ]
    ped_roles[17] = {"name": "beat-cop", "role": "cop"}
    ped_w, ped_h = pack_atlas(ped_frames, 6, 3, "civilians", ped_roles)

    # Write sizes for TS loader
    sizes = {
        "carsCiv": {"frameWidth": cw, "frameHeight": ch, "cols": 5, "rows": 2},
        "carsPolice": {"frameWidth": pw, "frameHeight": ph, "cols": 5, "rows": 2},
        "carsEmergency": {"frameWidth": ew, "frameHeight": eh, "cols": 5, "rows": 2},
        "swat": {"frameWidth": sw_w, "frameHeight": sw_h, "cols": 5, "rows": 2},
        "civilians": {"frameWidth": ped_w, "frameHeight": ped_h, "cols": 6, "rows": 3},
    }
    (OUT / "frame-sizes.json").write_text(json.dumps(sizes, indent=2) + "\n")

    MAP.write_text(
        f"""# Harborline — Pixel Atlas Map

Sliced from Daniel’s GPT sheets in `public/art/refs/` via `scripts/slice-gpt-refs.py`.

## Stable refs

| file | source # | role |
|------|--------:|------|
| `scene-riverdale.png` | 1 | style / HUD / night action |
| `cars-civ.png` | 2 | civilian vehicle sheet |
| `cars-police.png` | 3 | police fleet sheet |
| `cars-emergency.png` | 4 | fire / ambulance sheet |
| `swat.png` | 5 | tactical ped sheet |
| `civilians.png` | 6 | civilian ped sheet |
| `scene-intersection.png` | 7 | daytime city density |
| `scene-harborview.png` | 8 | Pier Ward night target |
| `scene-harbor-shade.png` | 9 | dock raid / heat |
| `scene-pinecrest.png` | 10 | suburban emergency |

## Atlas frame sizes (Phaser spritesheet)

| atlas | cell | grid |
|-------|------|------|
| cars-civ | {cw}×{ch} | 5×2 |
| cars-police | {pw}×{ph} | 5×2 |
| cars-emergency | {ew}×{eh} | 5×2 |
| swat | {sw_w}×{sw_h} | 5×2 |
| civilians | {ped_w}×{ped_h} | 6×3 |

Vehicle sheets are rotated so nose faces **+X** (matches game heading 0).

## cars-civ frames

| index | name | fleet |
|------:|------|-------|
| 0 | compact | `compact` |
| 1 | taxi | `taxi` |
| 2 | sports | `sports` |
| 3 | van | `van` |
| 4 | pickup | traffic |
| 5 | muscle | traffic |
| 6 | orange | traffic |
| 7 | service | traffic |
| 8 | luxury | sedan look / traffic |
| 9 | wagon | traffic |

## cars-police / cars-emergency / swat / civilians

See matching `public/art/atlases/*.json` frame lists. Ambulance = emergency index **6**.
Police archetype uses police index **0**.
"""
    )
    print("done")


if __name__ == "__main__":
    main()
