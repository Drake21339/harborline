/** Tiny Web Audio bus — unlocks only after a user gesture. */
export type SfxKind = "pickup" | "shoot" | "ui" | "arrest" | "engine";

export class AudioBus {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private ambience!: GainNode;
  private unlocked = false;
  private ambOsc: OscillatorNode | null = null;
  /** Distinct kinds heard since unlock (proof for polish Done-when). */
  readonly playedKinds = new Set<SfxKind>();

  masterVol = 0.8;
  sfxVol = 0.9;
  ambienceVol = 0.4;

  get isUnlocked(): boolean {
    return this.unlocked;
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
    this.startAmbience();
  }

  setVolumes(master: number, sfx: number, ambience: number): void {
    this.masterVol = master;
    this.sfxVol = sfx;
    this.ambienceVol = ambience;
    this.applyVolumes();
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
      default:
        break;
    }
  }

  private applyVolumes(): void {
    if (!this.unlocked) return;
    this.master.gain.value = this.masterVol;
    this.sfx.gain.value = this.sfxVol;
    this.ambience.gain.value = this.ambienceVol;
  }

  private startAmbience(): void {
    if (!this.ctx) return;
    this.ambOsc?.stop();
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
