import { describe, expect, it } from "vitest";
import { defaultSave, loadSave, resetSave, validateSave, writeSave } from "./save";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

describe("save", () => {
  it("rejects corrupt payloads and falls back", () => {
    expect(validateSave(null)).toBeNull();
    expect(validateSave({ version: 2 })).toBeNull();
    expect(validateSave({ version: 1, cash: "nope" })).toBeNull();
    const ok = validateSave({
      version: 1,
      cash: 10,
      score: 20,
      missionUnlockIndex: 1,
      masterVolume: 2,
      sfxVolume: -1,
      ambienceVolume: 0.5,
    });
    expect(ok?.masterVolume).toBe(1);
    expect(ok?.sfxVolume).toBe(0);
  });

  it("round-trips and reset-save clears progress", () => {
    const mem = new MemoryStorage();
    const data = defaultSave();
    data.cash = 250;
    writeSave(data, mem);
    expect(loadSave(mem).cash).toBe(250);
    expect(resetSave(mem).cash).toBe(0);
    expect(loadSave(mem).cash).toBe(0);
  });
});
