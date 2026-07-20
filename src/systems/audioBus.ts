/** Tiny Web Audio bus — unlocks only after a user gesture. */
export class AudioBus {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private ambience!: GainNode;
  private unlocked = false;
  private ambOsc: OscillatorNode | null = null;

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
    this.beep(440, 0.06, "sfx");
  }

  setVolumes(master: number, sfx: number, ambience: number): void {
    this.masterVol = master;
    this.sfxVol = sfx;
    this.ambienceVol = ambience;
    this.applyVolumes();
  }

  playSfx(kind: "pickup" | "shoot" | "ui" | "arrest"): void {
    if (!this.unlocked || !this.ctx) return;
    const freqs = { pickup: 660, shoot: 180, ui: 520, arrest: 120 };
    this.beep(freqs[kind], kind === "shoot" ? 0.05 : 0.08, "sfx");
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

  private beep(freq: number, dur: number, bus: "sfx"): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.frequency.value = freq;
    g.gain.value = 0.12;
    osc.connect(g);
    g.connect(bus === "sfx" ? this.sfx : this.master);
    osc.start();
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    osc.stop(this.ctx.currentTime + dur + 0.02);
  }
}

export const audioBus = new AudioBus();
