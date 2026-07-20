# Harborline — Suno Instrumental Prompts (for Daniel)

Plain English: generate these in **Suno Custom Mode**, download audio, drop the files into the game folder with the exact names below. The mega AFK wires playback; missing files fall back to synth beds.

**Drop-in folder:** `/Users/danielkirkpatrick/GAMES/NOT_GTA_1/public/audio/`

| Role | Filename | Length aim |
|---|---|---|
| Title / menu | `title-theme.ogg` (or `.mp3`) | 60–120s, loop-friendly |
| City cruise | `city-night.ogg` | 90–180s, seamless loop vibe |
| Heat / chase | `heat-chase.ogg` | 60–120s, tense |
| Mission success sting | `mission-win.ogg` | 5–15s one-shot |
| Bust / fail sting | `mission-fail.ogg` | 5–15s one-shot |

**Suno notes:** Custom Mode · paste STYLE / EXCLUDE / LYRICS as separate fields · **instrumental only** · do not name real artists or GTA/Rockstar · Free-tier tracks are non-commercial forever if that matters for a future release · Prefer OGG or MP3.

---

## 1) Title theme — `title-theme`

Nocturnal harbor brand moment: cool, cinematic, late-90s arcade city at dusk.

```text
STYLE:
cinematic instrumental, nocturnal urban mood medium-low energy, no vocals instrumental only, muted trumpet lead, dusty Rhodes piano, soft analog bass, vinyl-tinged trip-hop beat, wide night-city reverb, filmic late-90s game title aesthetic, 92 BPM
```

```text
EXCLUDE:
vocals, singing, choir, rap, EDM drop, chiptune lead
```

```text
LYRICS:
[Instrumental]
[Intro]
(sparse harbor night pad, distant buoy-like tone)
[Verse]
(Rhodes motif enters, muted trumpet answers)
[Chorus]
(beat settles, bass widens, trumpet hook peaks then holds)
[Break]
(filter opens on city ambience bed)
[Chorus]
(beat settles, bass widens, trumpet hook peaks then holds)
[Outro]
(elements peel away to pad + soft tick)
```

**Sliders (if available):** Weirdness ~35–45% · Style Influence strong · keep clean enough to loop.

---

## 2) City cruise — `city-night`

On-foot / cruise bed: groovy, not sleepy, not chase-yet.

```text
STYLE:
instrumental acid jazz groove, cool night-drive mood medium energy, no vocals instrumental only, clean wah guitar chops, upright-electric hybrid bass, crisp dusty drums, Rhodes stabs, subtle vinyl crackle, late-90s urban game underscore, 102 BPM
```

```text
EXCLUDE:
vocals, singing, trap 808s, heavy metal, orchestral choir
```

```text
LYRICS:
[Instrumental]
[Intro]
(drums + bass pocket only)
[Verse]
(wah guitar chop pattern, Rhodes answers)
[Chorus]
(full groove, wider stereo city sheen)
[Verse]
(wah guitar chop pattern, Rhodes answers)
[Chorus]
(full groove, wider stereo city sheen)
[Break]
(drums thin, bass walks, night air)
[Chorus]
(full groove, wider stereo city sheen)
[Outro]
(groove fades on repeating guitar stab)
```

---

## 3) Heat / chase — `heat-chase`

Cops on you: pulse up, still instrumental, still Harborline (not generic trailer drums).

```text
STYLE:
instrumental breakbeat tension, urgent nocturnal chase mood high energy, no vocals instrumental only, tight syncopated drums, distorted bass pulse, staccato synth stabs, metallic percussion hits, dry industrial room, late-90s arcade pursuit underscore, 128 BPM
```

```text
EXCLUDE:
vocals, singing, happy major melody, lo-fi chill, acoustic folk
```

```text
LYRICS:
[Instrumental]
[Intro]
(alarm-like muted stab pattern, drums enter)
[Verse]
(breakbeat runs, bass pulse locks)
[Build]
(stabs denser, snare rolls short)
[Chorus]
(full chase bed, metallic hits on downs)
[Verse]
(breakbeat runs, bass pulse locks)
[Chorus]
(full chase bed, metallic hits on downs)
[Outro]
(stabs cut, pulse remains then stops)
```

---

## 4) Mission success — `mission-win`

Short reward hit after a job pays.

```text
STYLE:
instrumental brass sting, triumphant but streetwise short cue high energy hit, no vocals instrumental only, punchy drums, muted horn stab, bright Rhodes sparkle, tight slapback, arcade reward jingle aesthetic, 118 BPM
```

```text
EXCLUDE:
vocals, long intro, orchestral choir, 30-second ambient pad
```

```text
LYRICS:
[Instrumental]
[Intro]
(one-bar drum pickup)
[Chorus]
(horn + Rhodes reward hit, two bars)
[Outro]
(tail reverb dies quick)
```

Generate a few; pick the shortest clean sting. Trim in Suno Studio / DAW if needed.

---

## 5) Bust / fail — `mission-fail`

Arrested or job blown — short downer, not comedy slide-whistle.

```text
STYLE:
instrumental minor sting, cold disappointment short cue low energy, no vocals instrumental only, detuned synth fall, sparse kick, muted trumpet sour bend, short dark reverb, late-90s fail jingle aesthetic, 88 BPM
```

```text
EXCLUDE:
vocals, comedy slide whistle, happy resolution, long pad wash
```

```text
LYRICS:
[Instrumental]
[Chorus]
(sour trumpet bend + detuned fall, two bars)
[Outro]
(kick stops, silence)
```

---

## After you generate

1. Export/download each keep.
2. Rename to the filenames in the table (ogg preferred, mp3 OK).
3. Put them in `public/audio/`.
4. Refresh `npm run dev` — beds should appear after Enter (gesture unlock).

If the mega AFK has not reached F5 yet, files can wait in that folder; wiring lands in F5.

### Quality Gate
Status: five instrumental roles; STYLE front-loaded; no artist/IP names; filenames match drop-in contract.  
Companion AFK: `docs/WALKAWAY-AFK-FINISH-GAME-PROMPT.md`.
