import type { HeatState } from "./heat";
import { createHeatState } from "./heat";
import type { WalletState } from "./pickups";

export const PAINT_SHOP_FEE = 150;
export const PAINT_SHOP_RADIUS = 52;

/** Harborline garage palette — original colors only. */
export const PAINT_COLORS = [
  0x6ec6ff,
  0xc8d0dc,
  0xff5a5a,
  0xd2a86a,
  0xf0c040,
  0x3a5cff,
  0x9ef0c0,
  0xe8a0c8,
  0xffffff,
  0x222228,
] as const;

export function nearestPaintShop(
  shops: Array<{ id: string; x: number; y: number; fee: number }>,
  x: number,
  y: number,
  radius = PAINT_SHOP_RADIUS,
): { id: string; x: number; y: number; fee: number } | null {
  let best: { id: string; x: number; y: number; fee: number } | null = null;
  let bestD = radius;
  for (const s of shops) {
    const d = Math.hypot(s.x - x, s.y - y);
    if (d <= bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

export function tryUsePaintShop(args: {
  wallet: WalletState;
  heat: HeatState;
  fee: number;
  rng: () => number;
}): { ok: boolean; color: number | null; reason?: string; heat: HeatState } {
  if (args.wallet.cash < args.fee) {
    return { ok: false, color: null, reason: "broke", heat: args.heat };
  }
  args.wallet.cash -= args.fee;
  const color = PAINT_COLORS[Math.floor(args.rng() * PAINT_COLORS.length)]!;
  const cleared = createHeatState();
  return { ok: true, color, heat: cleared };
}
