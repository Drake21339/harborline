# Harborline — Pixel Atlas Map

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
| cars-civ | 516×282 | 5×2 |
| cars-police | 516×282 | 5×2 |
| cars-emergency | 516×282 | 5×2 |
| swat | 254×160 | 5×2 |
| civilians | 152×254 | 6×3 |

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
