import { describe, expect, it } from "vitest";
import { WORLD_SEED } from "./gameConfig";
import { SeededRng, hashString } from "./seededRng";

describe("SeededRng", () => {
  it("is deterministic for the pinned world seed", () => {
    const a = new SeededRng(WORLD_SEED);
    const b = new SeededRng(WORLD_SEED);
    const seqA = Array.from({ length: 8 }, () => a.next());
    const seqB = Array.from({ length: 8 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("hashString is stable", () => {
    const h = hashString("harborline-1997");
    expect(h).toBe(hashString("harborline-1997"));
    expect(h).toBeGreaterThan(0);
  });
});
