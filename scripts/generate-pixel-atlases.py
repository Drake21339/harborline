#!/usr/bin/env python3
"""Generate HD top-down pixel atlases for Harborline (Pier Ward slice)."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "art" / "atlases"
REFS = ROOT / "public" / "art" / "refs"
MAP = ROOT / "docs" / "art" / "PIXEL-ATLAS-MAP.md"

CAR_W, CAR_H = 96, 52
PED_W, PED_H = 36, 36
CELL_PAD = 10


def rgba(c: int, a: int = 255) -> tuple[int, int, int, int]:
    return ((c >> 16) & 0xFF, (c >> 8) & 0xFF, c & 0xFF, a)


def darken(c: int, t: float) -> int:
    r = int(((c >> 16) & 0xFF) * (1 - t))
    g = int(((c >> 8) & 0xFF) * (1 - t))
    b = int((c & 0xFF) * (1 - t))
    return (r << 16) | (g << 8) | b


def lighten(c: int, t: float) -> int:
    r = min(255, int(((c >> 16) & 0xFF) + (255 - ((c >> 16) & 0xFF)) * t))
    g = min(255, int(((c >> 8) & 0xFF) + (255 - ((c >> 8) & 0xFF)) * t))
    b = min(255, int((c & 0xFF) + (255 - (c & 0xFF)) * t))
    return (r << 16) | (g << 8) | b


def cell_size(cw: int, ch: int) -> tuple[int, int]:
    return cw + CELL_PAD * 2, ch + CELL_PAD * 2


def new_sheet(cols: int, rows: int, cw: int, ch: int) -> Image.Image:
    cell_w, cell_h = cell_size(cw, ch)
    return Image.new("RGBA", (cols * cell_w, rows * cell_h), (0, 0, 0, 0))


def cell_origin(col: int, row: int, cw: int, ch: int) -> tuple[int, int]:
    cell_w, cell_h = cell_size(cw, ch)
    return col * cell_w + CELL_PAD, row * cell_h + CELL_PAD


def draw_shadow(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int) -> None:
    draw.ellipse([x + 6, y + h - 12, x + w + 4, y + h + 4], fill=(0, 0, 0, 100))


def draw_car(
    img: Image.Image,
    col: int,
    row: int,
    body: int,
    *,
    kind: str = "sedan",
    accent: int | None = None,
    lightbar: bool = False,
    taxi: bool = False,
    stripes: bool = False,
    emergency: bool = False,
) -> None:
    x, y = cell_origin(col, row, CAR_W, CAR_H)
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw_shadow(draw, x, y, CAR_W, CAR_H)

    body_y0 = y + 8
    body_y1 = y + CAR_H - 10
    body_x0 = x + 6
    body_x1 = x + CAR_W - 8
    if kind == "compact":
        body_x1 = x + CAR_W - 18
        body_y0 = y + 10
        body_y1 = y + CAR_H - 12
    elif kind == "van":
        body_y0 = y + 6
        body_y1 = y + CAR_H - 8
    elif kind == "sports":
        body_y0 = y + 12
        body_y1 = y + CAR_H - 14
        body_x1 = x + CAR_W - 4

    # Outer body with bevel
    draw.rounded_rectangle(
        [body_x0, body_y0, body_x1, body_y1],
        radius=8,
        fill=rgba(body),
        outline=rgba(darken(body, 0.55)),
        width=2,
    )
    # Top highlight band
    draw.rounded_rectangle(
        [body_x0 + 3, body_y0 + 2, body_x1 - 3, body_y0 + 8],
        radius=3,
        fill=rgba(lighten(body, 0.35), 170),
    )
    # South shade
    draw.rectangle(
        [body_x0 + 3, body_y1 - 8, body_x1 - 3, body_y1 - 2],
        fill=rgba(darken(body, 0.32), 200),
    )
    # Cabin glass
    roof_x0 = body_x0 + (12 if kind != "van" else 10)
    roof_x1 = body_x1 - (18 if kind != "van" else 10)
    roof_y0 = body_y0 + 6
    roof_y1 = body_y1 - 10
    glass = 0x5A7A9A
    draw.rounded_rectangle(
        [roof_x0, roof_y0, roof_x1, roof_y1],
        radius=5,
        fill=rgba(glass, 230),
        outline=rgba(lighten(body, 0.15)),
        width=1,
    )
    # Glass specular
    draw.rectangle(
        [roof_x1 - 10, roof_y0 + 3, roof_x1 - 3, roof_y1 - 3],
        fill=rgba(0xD0E8F8, 150),
    )
    draw.rectangle(
        [roof_x0 + 3, roof_y0 + 2, roof_x0 + 8, roof_y1 - 2],
        fill=rgba(0x203040, 120),
    )
    # Pillars
    draw.rectangle([roof_x0 - 2, roof_y0, roof_x0 + 1, roof_y1], fill=rgba(darken(body, 0.2)))
    draw.rectangle([roof_x1 - 1, roof_y0, roof_x1 + 2, roof_y1], fill=rgba(darken(body, 0.2)))

    # Bumper / grille
    draw.rectangle(
        [body_x1 - 5, body_y0 + 6, body_x1 - 1, body_y1 - 6],
        fill=rgba(0x2A2A30, 220),
    )
    # Headlights
    draw.ellipse([body_x1 - 5, body_y0 + 5, body_x1 + 3, body_y0 + 14], fill=rgba(0xFFF6C8))
    draw.ellipse([body_x1 - 5, body_y1 - 15, body_x1 + 3, body_y1 - 6], fill=rgba(0xFFF6C8))
    # Soft headlight glow
    draw.ellipse([body_x1 - 2, body_y0 + 4, body_x1 + 10, body_y0 + 15], fill=(255, 242, 180, 40))
    draw.ellipse([body_x1 - 2, body_y1 - 16, body_x1 + 10, body_y1 - 5], fill=(255, 242, 180, 40))
    # Taillights
    draw.rectangle([body_x0, body_y0 + 6, body_x0 + 4, body_y0 + 13], fill=rgba(0xFF2828))
    draw.rectangle([body_x0, body_y1 - 14, body_x0 + 4, body_y1 - 7], fill=rgba(0xFF2828))

    # Wheels with hubs
    for wx in (body_x0 + 14, body_x1 - 22):
        for wy in (body_y0 - 3, body_y1 - 1):
            draw.rectangle([wx, wy, wx + 11, wy + 4], fill=rgba(0x121214))
            draw.rectangle([wx + 3, wy + 1, wx + 8, wy + 3], fill=rgba(0x6A6A72))

    # Side mirror
    draw.ellipse([roof_x1 - 2, body_y0 - 1, roof_x1 + 6, body_y0 + 5], fill=rgba(darken(body, 0.1)))
    draw.ellipse([roof_x1 - 2, body_y1 - 5, roof_x1 + 6, body_y1 + 1], fill=rgba(darken(body, 0.1)))

    if taxi:
        draw.rounded_rectangle(
            [roof_x0 + 10, roof_y0 - 6, roof_x0 + 28, roof_y0 + 1],
            radius=2,
            fill=rgba(0xF8F8F8),
            outline=rgba(0x222222),
        )
        draw.rectangle([roof_x0 + 13, roof_y0 - 4, roof_x0 + 25, roof_y0 - 1], fill=rgba(0x222222))
    if stripes:
        mid = (body_y0 + body_y1) // 2
        draw.rectangle([body_x0 + 8, mid - 3, body_x1 - 10, mid + 3], fill=rgba(0xFFFFFF, 210))
        draw.rectangle([body_x0 + 8, mid - 1, body_x1 - 10, mid + 1], fill=rgba(0xE8E8E8, 180))
    if lightbar:
        lx0, lx1 = roof_x0 + 8, roof_x1 - 8
        ly = roof_y0 - 4
        draw.rounded_rectangle([lx0, ly, lx1, ly + 5], radius=2, fill=rgba(0x101018))
        draw.rectangle([lx0 + 2, ly + 1, lx0 + 12, ly + 4], fill=rgba(0xFF2020))
        draw.rectangle([lx1 - 12, ly + 1, lx1 - 2, ly + 4], fill=rgba(0x2040FF))
        draw.ellipse([lx0 - 2, ly - 1, lx0 + 6, ly + 6], fill=(255, 40, 40, 50))
        draw.ellipse([lx1 - 6, ly - 1, lx1 + 2, ly + 6], fill=(40, 80, 255, 50))
    if emergency:
        cx = (roof_x0 + roof_x1) // 2
        cy = (roof_y0 + roof_y1) // 2
        draw.ellipse([cx - 7, cy - 7, cx + 7, cy + 7], outline=rgba(0x2060C0), width=2)
        draw.rectangle([cx - 1, cy - 5, cx + 1, cy + 5], fill=rgba(0x2060C0))
        draw.rectangle([cx - 5, cy - 1, cx + 5, cy + 1], fill=rgba(0x2060C0))
        if accent is not None:
            draw.rectangle([body_x0 + 2, body_y0 + 3, body_x0 + 7, body_y1 - 3], fill=rgba(accent))

    img.alpha_composite(layer)


def draw_ped(
    img: Image.Image,
    col: int,
    row: int,
    shirt: int,
    pants: int,
    hair: int,
    *,
    skin: int = 0xE0B090,
    cop: bool = False,
    swat: bool = False,
) -> None:
    x, y = cell_origin(col, row, PED_W, PED_H)
    draw = ImageDraw.Draw(img)
    draw.ellipse([x + 6, y + PED_H - 9, x + PED_W - 6, y + PED_H - 1], fill=(0, 0, 0, 90))

    # Boots
    draw.rectangle([x + 10, y + 28, x + 15, y + 32], fill=rgba(0x1A1A1A))
    draw.rectangle([x + 21, y + 28, x + 26, y + 32], fill=rgba(0x1A1A1A))
    # Legs
    draw.rectangle([x + 11, y + 20, x + 15, y + 29], fill=rgba(pants))
    draw.rectangle([x + 21, y + 20, x + 25, y + 29], fill=rgba(pants))
    # Torso
    torso = 0x152238 if swat else (0x2A4A8A if cop else shirt)
    draw.rounded_rectangle([x + 9, y + 12, x + 27, y + 22], radius=4, fill=rgba(torso))
    draw.rectangle([x + 10, y + 12, x + 26, y + 14], fill=rgba(lighten(torso, 0.28), 180))
    # Arms
    draw.rectangle([x + 7, y + 13, x + 10, y + 20], fill=rgba(skin if not swat else darken(torso, 0.1)))
    draw.rectangle([x + 26, y + 13, x + 29, y + 20], fill=rgba(skin if not swat else darken(torso, 0.1)))

    if swat:
        draw.rounded_rectangle([x + 10, y + 11, x + 26, y + 16], radius=2, fill=rgba(0x0A1018))
        draw.ellipse([x + 12, y + 5, x + 24, y + 15], fill=rgba(0x3A3A44))
        draw.ellipse([x + 13, y + 6, x + 23, y + 13], fill=rgba(0x2A2A32))
        draw.rectangle([x + 14, y + 8, x + 22, y + 10], fill=rgba(0x1A1A22))  # visor
        # Vest pouches
        draw.rectangle([x + 12, y + 16, x + 16, y + 20], fill=rgba(0x0A1018))
        draw.rectangle([x + 20, y + 16, x + 24, y + 20], fill=rgba(0x0A1018))
    elif cop:
        draw.ellipse([x + 13, y + 5, x + 23, y + 14], fill=rgba(skin))
        draw.rounded_rectangle([x + 12, y + 4, x + 24, y + 9], radius=2, fill=rgba(0x1A2A5A))
        draw.rectangle([x + 16, y + 15, x + 20, y + 18], fill=rgba(0xD0A040))
        draw.rectangle([x + 11, y + 18, x + 25, y + 20], fill=rgba(0x1A1A22))  # belt
    else:
        draw.ellipse([x + 13, y + 5, x + 23, y + 14], fill=rgba(skin))
        draw.ellipse([x + 13, y + 3, x + 23, y + 9], fill=rgba(hair))
        # Face hint
        draw.point((x + 16, y + 10), fill=rgba(0x402020))
        draw.point((x + 20, y + 10), fill=rgba(0x402020))


def save_meta(name: str, frames: list[dict], cw: int, ch: int, cols: int, rows: int) -> None:
    cell_w, cell_h = cell_size(cw, ch)
    meta = {
        "image": f"{name}.png",
        "frameWidth": cell_w,
        "frameHeight": cell_h,
        "contentWidth": cw,
        "contentHeight": ch,
        "pad": CELL_PAD,
        "cols": cols,
        "rows": rows,
        "frames": frames,
    }
    (OUT / f"{name}.json").write_text(json.dumps(meta, indent=2) + "\n")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    REFS.mkdir(parents=True, exist_ok=True)
    (ROOT / "docs" / "art").mkdir(parents=True, exist_ok=True)

    civ_frames = [
        ("compact", 0xE24A4A, {"kind": "compact"}),
        ("sedan", 0xC8D0DC, {}),
        ("sports", 0x2A6AFF, {"stripes": True, "kind": "sports"}),
        ("van", 0x3A8A5A, {"kind": "van"}),
        ("pickup", 0x3A6A9A, {"kind": "van"}),
        ("muscle", 0x7A3AA0, {"kind": "sports"}),
        ("orange", 0xE08830, {"kind": "compact"}),
        ("service", 0xE8E8E8, {"kind": "van"}),
        ("luxury", 0x1A1A22, {}),
        ("taxi", 0xF0C040, {"taxi": True}),
    ]
    civ = new_sheet(5, 2, CAR_W, CAR_H)
    civ_meta = []
    for i, (name, color, opts) in enumerate(civ_frames):
        col, row = i % 5, i // 5
        draw_car(
            civ,
            col,
            row,
            color,
            kind=opts.get("kind", "sedan"),
            stripes=opts.get("stripes", False),
            taxi=opts.get("taxi", False),
        )
        civ_meta.append({"index": i, "name": name, "role": "civilian", "col": col, "row": row})
    civ.save(OUT / "cars-civ.png")
    save_meta("cars-civ", civ_meta, CAR_W, CAR_H, 5, 2)

    pol = new_sheet(4, 2, CAR_W, CAR_H)
    pol_meta = []
    for i in range(8):
        col, row = i % 4, i // 4
        body = 0x1A1A22 if i % 2 == 0 else 0xE8E8F0
        kind = "van" if i >= 6 else "sedan"
        draw_car(pol, col, row, body, kind=kind, lightbar=True)
        pol_meta.append({"index": i, "name": f"patrol-{i}", "role": "police", "col": col, "row": row})
    pol.save(OUT / "cars-police.png")
    save_meta("cars-police", pol_meta, CAR_W, CAR_H, 4, 2)

    em = new_sheet(3, 2, CAR_W, CAR_H)
    em_meta = []
    em_defs = [
        ("ambulance", 0xE8E8E8, 0xE02020),
        ("fire-suv", 0xD02020, 0xFFFFFF),
        ("rescue-van", 0xC01818, 0xFFD040),
        ("medic", 0xF0F0F0, 0x2040C0),
        ("tanker-cab", 0xC02020, 0x222222),
        ("utility", 0xB01818, 0xF0F0F0),
    ]
    for i, (name, body, accent) in enumerate(em_defs):
        col, row = i % 3, i // 3
        draw_car(
            em,
            col,
            row,
            body,
            kind="van" if "van" in name or "tanker" in name else "sedan",
            lightbar=True,
            emergency=True,
            accent=accent,
        )
        em_meta.append({"index": i, "name": name, "role": "emergency", "col": col, "row": row})
    em.save(OUT / "cars-emergency.png")
    save_meta("cars-emergency", em_meta, CAR_W, CAR_H, 3, 2)

    ped = new_sheet(6, 3, PED_W, PED_H)
    ped_meta = []
    shirts = [
        0xE04040, 0xF0A0C0, 0xE0C040, 0xE07020, 0x3A3A4A, 0x4A6AB0,
        0x1A1A1A, 0x2A8A4A, 0x8A40C0, 0xF0F0F0, 0x3A8A5A, 0xE8E8E8,
        0x3A6AB0, 0x8A6030, 0xC02040, 0x7A40A0, 0x5A4030, 0x2A4A8A,
    ]
    pants = [
        0x2A3A6A, 0x1A1A1A, 0x4A4A3A, 0x3A3A3A, 0x2A2A2A, 0x2A2A3A,
        0x1A1A1A, 0x2A3A6A, 0x1A1A1A, 0x1A1A1A, 0x2A4A3A, 0x3A3A3A,
        0x2A3A5A, 0x4A3A2A, 0x1A1A1A, 0x1A1A1A, 0x3A2A1A, 0x1A2A4A,
    ]
    hairs = [
        0x2A1A10, 0xE0C060, 0x3A2A18, 0x2A2A2A, 0x1A1A1A, 0x4A3020,
        0x20A040, 0xC04020, 0x4060C0, 0x1A1A1A, 0x3A2A18, 0xE0E0E0,
        0x2A4A8A, 0x8A6030, 0x1A1A1A, 0x2A1A10, 0x3A2A18, 0x1A1A1A,
    ]
    skins = [
        0xE0B090, 0xF0C8A0, 0xC89060, 0xE0B090, 0x8A5A38, 0xF0C8A0,
        0xE0B090, 0xC89060, 0xF0C8A0, 0x8A5A38, 0xE0B090, 0xF0C8A0,
        0xC89060, 0xE0B090, 0xF0C8A0, 0x8A5A38, 0xC89060, 0xE0B090,
    ]
    for i in range(18):
        col, row = i % 6, i // 6
        cop = i == 17
        draw_ped(ped, col, row, shirts[i], pants[i], hairs[i], skin=skins[i], cop=cop)
        ped_meta.append(
            {
                "index": i,
                "name": f"civ-{i}" if not cop else "beat-cop",
                "role": "cop" if cop else "civilian",
                "col": col,
                "row": row,
            }
        )
    ped.save(OUT / "civilians.png")
    save_meta("civilians", ped_meta, PED_W, PED_H, 6, 3)

    sw = new_sheet(5, 2, PED_W, PED_H)
    sw_meta = []
    for i in range(10):
        col, row = i % 5, i // 5
        draw_ped(sw, col, row, 0x1A2A4A, 0x0A1020, 0x3A3A42, swat=True)
        sw_meta.append({"index": i, "name": f"swat-{i}", "role": "swat", "col": col, "row": row})
    sw.save(OUT / "swat.png")
    save_meta("swat", sw_meta, PED_W, PED_H, 5, 2)

    (REFS / "README.md").write_text(
        "# Art refs\n\nDrop Daniel's GPT production sheets here "
        "(`civilians.png`, `swat.png`, `cars-civ.png`, `cars-police.png`, "
        "`cars-emergency.png`, scene comps). Atlases in `../atlases/` are "
        "generated stand-ins matching that direction until sheets are copied in.\n"
    )

    cell_w, cell_h = cell_size(CAR_W, CAR_H)
    ped_cw, ped_ch = cell_size(PED_W, PED_H)
    MAP.write_text(
        f"""# Harborline — Pixel Atlas Map

Plain English: which sprite frame is which car/person in the Pier Ward HD pixel slice.

Generated by `scripts/generate-pixel-atlases.py` → `public/art/atlases/`.
Replace with sliced GPT sheets when available (same frame indices / JSON names).

Frame cell sizes: cars `{cell_w}×{cell_h}`, peds `{ped_cw}×{ped_ch}` (includes pad).

## cars-civ.png (5×2)

| index | name | fleet mapping |
|------:|------|---------------|
| 0 | compact | archetype `compact` |
| 1 | sedan | archetype `sedan` |
| 2 | sports | archetype `sports` |
| 3 | van | archetype `van` |
| 4 | pickup | traffic NPC pool |
| 5 | muscle | traffic NPC pool |
| 6 | orange | traffic NPC pool |
| 7 | service | traffic NPC pool |
| 8 | luxury | traffic NPC pool |
| 9 | taxi | archetype `taxi` |

## cars-police.png (4×2)

| index | name | use |
|------:|------|-----|
| 0–5 | patrol-* | archetype `police` + PoliceRuntime cars |
| 6–7 | patrol vans | high-heat vans |

## cars-emergency.png (3×2)

| index | name | use |
|------:|------|-----|
| 0 | ambulance | archetype `ambulance` |
| 1–5 | fire/rescue | parked flavor / future |

## civilians.png (6×3)

| index | role |
|------:|------|
| 0–16 | civilian ped variants |
| 17 | beat-cop (foot) |

## swat.png (5×2)

| index | use |
|------:|------|
| 0–9 | PoliceRuntime foot units at high heat |

## Scene comps

Night pier / intersection GPT comps are style targets for `paintWorldTexture` Pier Ward paint — not tiled directly in v0.5.0.
"""
    )
    print(f"Wrote atlases to {OUT}")
    print(f"car cell {cell_w}x{cell_h} ped cell {ped_cw}x{ped_ch}")


if __name__ == "__main__":
    main()
