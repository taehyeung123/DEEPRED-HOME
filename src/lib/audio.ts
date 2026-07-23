/**
 * 전량 프로시저럴 WebAudio 엔진 — 외부 오디오 파일 없이
 * 앰비언트 드론, 천둥, 임팩트, 상승 SFX를 합성한다.
 * 기본 음소거. 사용자 제스처(토글 클릭) 시 컨텍스트 생성.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private _muted = true;
  private intensity = 0.4;

  get muted() {
    return this._muted;
  }

  /** 사용자 제스처 안에서 호출해야 함 */
  toggle(): boolean {
    this._muted = !this._muted;
    if (!this._muted) {
      this.ensure();
      this.ctx?.resume();
      this.fadeMaster(0.9, 1.2);
    } else {
      this.fadeMaster(0, 0.4);
    }
    return !this._muted;
  }

  private ensure() {
    if (this.ctx) return;
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 6;
    this.master.connect(comp);
    comp.connect(ctx.destination);

    // 공용 화이트노이즈 버퍼 (4초)
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;

    this.startAmbient();
  }

  private fadeMaster(to: number, sec: number) {
    if (!this.ctx || !this.master) return;
    const g = this.master.gain;
    g.cancelScheduledValues(this.ctx.currentTime);
    g.setValueAtTime(g.value, this.ctx.currentTime);
    g.linearRampToValueAtTime(to, this.ctx.currentTime + sec);
  }

  private startAmbient() {
    const ctx = this.ctx!;
    const amb = ctx.createGain();
    amb.gain.value = 0.5;
    amb.connect(this.master!);
    this.ambientGain = amb;

    // 저역 드론 (브라운 노이즈 근사: 화이트 → 강한 로우패스)
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 110;
    lp.Q.value = 0.4;
    const lpGain = ctx.createGain();
    lpGain.gain.value = 0.55;
    src.connect(lp).connect(lpGain).connect(amb);
    src.start();

    // 서브 베이스
    const sub = ctx.createOscillator();
    sub.frequency.value = 38;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.05;
    sub.connect(subGain).connect(amb);
    sub.start();

    // 바람 (밴드패스 노이즈 + LFO)
    const wind = ctx.createBufferSource();
    wind.buffer = this.noiseBuf;
    wind.loop = true;
    wind.playbackRate.value = 0.7;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 620;
    bp.Q.value = 1.4;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.05;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.035;
    lfo.connect(lfoGain).connect(windGain.gain);
    wind.connect(bp).connect(windGain).connect(amb);
    wind.start();
    lfo.start();
  }

  /** 씬 강도 0..1 → 앰비언트 볼륨 */
  setIntensity(v: number) {
    this.intensity = v;
    if (!this.ctx || !this.ambientGain) return;
    const g = this.ambientGain.gain;
    g.cancelScheduledValues(this.ctx.currentTime);
    g.setValueAtTime(g.value, this.ctx.currentTime);
    g.linearRampToValueAtTime(0.3 + v * 0.5, this.ctx.currentTime + 0.6);
  }

  thunder(strength = 1) {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = 0.42;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(420, t);
    lp.frequency.exponentialRampToValueAtTime(55, t + 2.2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.7 * strength, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    src.connect(lp).connect(g).connect(this.master!);
    src.start(t);
    src.stop(t + 3);
  }

  impact(strength = 1) {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    // 킥 드롭
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(36, t + 0.4);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.9 * strength, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    osc.connect(og).connect(this.master!);
    osc.start(t);
    osc.stop(t + 0.6);
    // 노이즈 스냅
    const snap = ctx.createBufferSource();
    snap.buffer = this.noiseBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1400;
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.35 * strength, t);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    snap.connect(hp).connect(sg).connect(this.master!);
    snap.start(t);
    snap.stop(t + 0.15);
    // 붐 테일
    this.thunder(0.5 * strength);
  }

  whoosh(dur = 0.9) {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = 1.1;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(240, t);
    bp.frequency.exponentialRampToValueAtTime(2600, t + dur * 0.6);
    bp.frequency.exponentialRampToValueAtTime(420, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.34, t + dur * 0.45);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(this.master!);
    src.start(t);
    src.stop(t + dur + 0.1);
  }

  chime(base = 520) {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    [1, 1.5, 2.01].forEach((m, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = base * m;
      const g = ctx.createGain();
      const amp = 0.12 / (i + 1);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      o.connect(g).connect(this.master!);
      o.start(t);
      o.stop(t + 1.5);
    });
  }

  riser(dur = 2.4) {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 2.2;
    bp.frequency.setValueAtTime(180, t);
    bp.frequency.exponentialRampToValueAtTime(3800, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.3, t + dur * 0.85);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.3);
    src.connect(bp).connect(g).connect(this.master!);
    src.start(t);
    src.stop(t + dur + 0.4);
  }

  private ready() {
    return !!this.ctx && !this._muted;
  }
}

export const audio = new AudioEngine();
