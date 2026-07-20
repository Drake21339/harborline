export interface SaveData {
  version: 1;
  cash: number;
  score: number;
  missionUnlockIndex: number;
  masterVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
}

const KEY = "harborline-save-v1";

export function defaultSave(): SaveData {
  return {
    version: 1,
    cash: 0,
    score: 0,
    missionUnlockIndex: 0,
    masterVolume: 0.8,
    sfxVolume: 0.9,
    ambienceVolume: 0.4,
  };
}

export function validateSave(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;
  if (typeof o.cash !== "number" || !Number.isFinite(o.cash)) return null;
  if (typeof o.score !== "number" || !Number.isFinite(o.score)) return null;
  if (typeof o.missionUnlockIndex !== "number" || !Number.isFinite(o.missionUnlockIndex)) {
    return null;
  }
  const clamp01 = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : fallback;
  return {
    version: 1,
    cash: Math.max(0, o.cash),
    score: Math.max(0, o.score),
    missionUnlockIndex: Math.max(0, Math.floor(o.missionUnlockIndex)),
    masterVolume: clamp01(o.masterVolume, 0.8),
    sfxVolume: clamp01(o.sfxVolume, 0.9),
    ambienceVolume: clamp01(o.ambienceVolume, 0.4),
  };
}

export function loadSave(storage: Storage = localStorage): SaveData {
  try {
    const text = storage.getItem(KEY);
    if (!text) return defaultSave();
    const parsed: unknown = JSON.parse(text);
    return validateSave(parsed) ?? defaultSave();
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData, storage: Storage = localStorage): void {
  storage.setItem(KEY, JSON.stringify(data));
}

export function resetSave(storage: Storage = localStorage): SaveData {
  const fresh = defaultSave();
  writeSave(fresh, storage);
  return fresh;
}
