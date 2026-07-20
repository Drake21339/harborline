export type HeatOffense =
  | "attack"
  | "steal"
  | "crash"
  | "destroy"
  | "reoffend";

export interface HeatState {
  level: number; // 0..5
  unseenMs: number;
  arrestProgress: number; // 0..1
  lastOffenseAt: number;
}

export const HEAT = {
  max: 5,
  decayUnseenMs: 6000,
  arrestHoldMs: 1800,
  arrestRange: 36,
  offenseGain: {
    attack: 1,
    steal: 1,
    crash: 1,
    destroy: 2,
    reoffend: 1,
  } as Record<HeatOffense, number>,
  unitCaps: [0, 1, 2, 3, 4, 5] as const,
} as const;

export function createHeatState(): HeatState {
  return { level: 0, unseenMs: 0, arrestProgress: 0, lastOffenseAt: -Infinity };
}

export function reportOffense(state: HeatState, offense: HeatOffense, now: number): void {
  const gain = HEAT.offenseGain[offense];
  // Reoffend bump if already hot and acting again soon.
  let extra = 0;
  if (state.level > 0 && now - state.lastOffenseAt < 4000 && offense !== "reoffend") {
    extra = HEAT.offenseGain.reoffend;
  }
  state.level = Math.min(HEAT.max, state.level + gain + extra);
  state.unseenMs = 0;
  state.lastOffenseAt = now;
  state.arrestProgress = 0;
}

export function tickHeat(
  state: HeatState,
  dtMs: number,
  seenByPolice: boolean,
  inArrestRange: boolean,
): { arrested: boolean } {
  if (state.level <= 0) {
    state.unseenMs = 0;
    state.arrestProgress = 0;
    return { arrested: false };
  }

  if (seenByPolice) {
    state.unseenMs = 0;
  } else {
    state.unseenMs += dtMs;
    if (state.unseenMs >= HEAT.decayUnseenMs) {
      state.level = Math.max(0, state.level - 1);
      state.unseenMs = 0;
      state.arrestProgress = 0;
    }
  }

  if (inArrestRange && seenByPolice) {
    state.arrestProgress += dtMs / HEAT.arrestHoldMs;
    if (state.arrestProgress >= 1) {
      state.arrestProgress = 0;
      return { arrested: true };
    }
  } else {
    state.arrestProgress = Math.max(0, state.arrestProgress - dtMs / 900);
  }

  return { arrested: false };
}

export function policeCapForHeat(level: number): number {
  const idx = Math.max(0, Math.min(HEAT.max, Math.floor(level)));
  return HEAT.unitCaps[idx] ?? 0;
}

export function applyArrestPenalties(walletCash: number): { cash: number; scorePenalty: number } {
  const penalty = Math.min(walletCash, 100 + walletCash * 0.25);
  return { cash: Math.max(0, walletCash - penalty), scorePenalty: Math.round(penalty) };
}
