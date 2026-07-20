import { audioUrl, type MusicBed, type MusicSting } from "./audioTracks";

/** Tiny Web Audio bus — unlocks only after a user gesture. */
export type SfxKind = "pickup" | "shoot" | "ui" | "arrest" | "engine" | "crash";

export class AudioBus {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private ambience!: GainNode;
  private unlocked = false;
  private ambOsc: OscillatorNode | null = null;
  private bedEl: HTMLAudioElement | null = null;
  private bedSource: MediaElementAudioSourceNode | null = null;
  private currentBed: MusicBed | "synth" | null = null;
  private bedReady = new Map<MusicBed, boolean>();
  /** Distinct kinds heard since unlock (proof for polish Done-when). */
  readonly playedKinds = new Set<SfxKind>();

  masterVol = 0.8;
  sfxVol = 0.9;
  ambienceVol = 0.4;

  get isUnlocked(): boolean {
    return this.unlocked;
  }

  get activeBed(): MusicBed | "synth" | null {
    return this.currentBed;
  }

  /** Which Suno beds probed successfully after unlock (empty until unlock). */
  bedFileReady(bed: MusicBed): boolean {
    return this.bedReady.get(bed) === true;
  }

  async unlock(): Promise<void> {
    if (this.unlocked) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.sfx = this.ctx.createGain();
    this.ambience = this.ctx.createGain();
    this.sfx.connect(this.master);
    this.ambience.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.applyVolumes();
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.unlocked = true;
    await this.probeBeds();
  }

  setVolumes(master: number, sfx: number, ambience: number): void {
    this.masterVol = master;
    this.sfxVol = sfx;
    this.ambienceVol = ambience;
    this.applyVolumes();
  }

  /** Looping music bed; falls back to soft synth if file missing. */
  setBed(bed: MusicBed): void {
    if (!this.unlocked || !this.ctx) return;
    if (this.currentBed === bed && this.bedEl && !this.bedEl.paused) return;

    this.stopBedElement();
    this.stopSynthAmbience();

    if (this.bedReady.get(bed)) {
      const el = new Audio(audioUrl(bed));
      el.loop = true;
      el.preload = "auto";
      try {
        this.bedSource = this.ctx.createMediaElementSource(el);
        this.bedSource.connect(this.ambience);
      } catch {
        // Element may already be wired in rare HMR cases — use element volume.
        el.volume = Math.max(0, Math.min(1, this.masterVol * this.ambienceVol));
      }
      void el.play().catch(() => {
        this.startSynthAmbience();
        this.currentBed = "synth";
      });
      this.bedEl = el;
      this.currentBed = bed;
      this.applyVolumes();
      return;
    }

    this.startSynthAmbience();
    this.currentBed = "synth";
  }

  playSting(kind: MusicSting): void {
    if (!this.unlocked || !this.ctx) return;
    const el = new Audio(audioUrl(kind));
    el.preload = "auto";
    el.volume = Math.max(0, Math.min(1, this.masterVol * this.sfxVol * 0.9));
    void el.play().catch(() => {
      /* missing file — ignore */
    });
  }

  playSfx(kind: SfxKind): void {
    if (!this.unlocked || !this.ctx) return;
    this.playedKinds.add(kind);
    switch (kind) {
      case "pickup":
        this.tone(720, 0.07, "triangle");
        this.tone(960, 0.05, "triangle", 0.04);
        break;
      case "shoot":
        this.noiseBurst(0.045);
        this.tone(160, 0.04, "square");
        break;
      case "ui":
        this.tone(520, 0.06, "sine");
        break;
      case "arrest":
        this.tone(140, 0.12, "sawtooth");
        this.tone(90, 0.16, "sawtooth", 0.05);
        break;
      case "engine":
        this.tone(90, 0.1, "sawtooth");
        this.tone(130, 0.08, "triangle", 0.03);
        break;
      case "crash":
        this.noiseBurst(0.08);
        this.tone(70, 0.1, "sawtooth");
        this.tone(45, 0.14, "square", 0.04);
        break;
      default:
        break;
    }
  }

  private async probeBeds(): Promise<void> {
    const kinds: MusicBed[] = ["title", "city", "heat"];
    await Promise.all(
      kinds.map(async (k) => {
        try {
          // Prefer HEAD; some hosts only answer GET — either proves the drop-in exists.
          let res = await fetch(audioUrl(k), { method: "HEAD" });
          if (!res.ok) res = await fetch(audioUrl(k), { method: "GET", headers: { Range: "bytes=0-1" } });
          this.bedReady.set(k, res.ok);
        } catch {
          this.bedReady.set(k, false);
        }
      }),
    );
  }

  private applyVolumes(): void {
    if (!this.unlocked) return;
    this.master.gain.value = this.masterVol;
    this.sfx.gain.value = this.sfxVol;
    this.ambience.gain.value = this.ambienceVol;
    if (this.bedEl && !this.bedSource) {
      this.bedEl.volume = Math.max(0, Math.min(1, this.masterVol * this.ambienceVol));
    }
  }

  private stopBedElement(): void {
    if (this.bedEl) {
      this.bedEl.pause();
      this.bedEl.src = "";
      this.bedEl = null;
    }
    this.bedSource = null;
  }

  private stopSynthAmbience(): void {
    try {
      this.ambOsc?.stop();
    } catch {
      /* already stopped */
    }
    this.ambOsc = null;
  }

  private startSynthAmbience(): void {
    if (!this.ctx) return;
    this.stopSynthAmbience();
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 70;
    g.gain.value = 0.03;
    osc.connect(g);
    g.connect(this.ambience);
    osc.start();
    this.ambOsc = osc;
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType,
    delay = 0,
  ): void {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = 0.11;
    osc.connect(g);
    g.connect(this.sfx);
    osc.start(t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.stop(t0 + dur + 0.02);
  }

  private noiseBurst(dur: number): void {
    if (!this.ctx) return;
    const frames = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * 0.35;
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    src.buffer = buffer;
    g.gain.value = 0.14;
    src.connect(g);
    g.connect(this.sfx);
    src.start();
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
  }
}

export const audioBus = new AudioBus();
