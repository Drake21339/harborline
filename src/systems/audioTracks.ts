/** Daniel’s Suno drop-ins in public/audio/ (exact filenames). */
export type MusicBed = "title" | "city" | "heat";
export type MusicSting = "win" | "fail";

const FILES: Record<MusicBed | MusicSting, string> = {
  title: "title-theme (harborline).mp3",
  city: "city-night (harborline).mp3",
  heat: "heat-chase (harborline).mp3",
  win: "mission-win (harborline).mp3",
  fail: "mission-fail (harborline).mp3",
};

export function audioUrl(kind: MusicBed | MusicSting): string {
  return `/audio/${encodeURIComponent(FILES[kind])}`;
}

export function audioFilename(kind: MusicBed | MusicSting): string {
  return FILES[kind];
}
