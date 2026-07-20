import { isSolidTile, type TileId } from "./tileTypes";
import type { CollisionRect } from "./types";

/**
 * Greedy horizontal-then-vertical merge of solid tiles into fewer AABBs.
 * Rects are axis-aligned in tile units (later scaled to pixels).
 */
export function mergeSolidRects(
  tiles: Uint8Array,
  width: number,
  height: number,
): CollisionRect[] {
  const used = new Uint8Array(width * height);
  const out: CollisionRect[] = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      if (used[i]) continue;
      const tile = tiles[i] as TileId;
      if (!isSolidTile(tile)) continue;

      let x1 = x + 1;
      while (
        x1 < width &&
        !used[y * width + x1] &&
        isSolidTile(tiles[y * width + x1] as TileId)
      ) {
        x1 += 1;
      }

      let y1 = y + 1;
      let canGrow = true;
      while (canGrow && y1 < height) {
        for (let cx = x; cx < x1; cx += 1) {
          const ci = y1 * width + cx;
          if (used[ci] || !isSolidTile(tiles[ci] as TileId)) {
            canGrow = false;
            break;
          }
        }
        if (canGrow) y1 += 1;
      }

      for (let ty = y; ty < y1; ty += 1) {
        for (let tx = x; tx < x1; tx += 1) {
          used[ty * width + tx] = 1;
        }
      }

      out.push({ x, y, w: x1 - x, h: y1 - y });
    }
  }

  return out;
}
