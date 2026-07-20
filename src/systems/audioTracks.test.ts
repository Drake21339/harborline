import { describe, expect, it } from "vitest";
import { audioFilename, audioUrl } from "./audioTracks";

describe("audioTracks Suno drop-in contract", () => {
  it("maps beds and stings to exact Harborline filenames", () => {
    expect(audioFilename("title")).toBe("title-theme (harborline).mp3");
    expect(audioFilename("city")).toBe("city-night (harborline).mp3");
    expect(audioFilename("heat")).toBe("heat-chase (harborline).mp3");
    expect(audioFilename("win")).toBe("mission-win (harborline).mp3");
    expect(audioFilename("fail")).toBe("mission-fail (harborline).mp3");
  });

  it("URL-encodes spaces so public/audio drop-ins load", () => {
    expect(audioUrl("title")).toBe("/audio/title-theme%20(harborline).mp3");
    expect(audioUrl("city")).toContain("%20");
    expect(audioUrl("heat")).toContain("heat-chase");
  });
});
