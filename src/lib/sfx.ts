let audioCtx: AudioContext | null = null;
let master: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

async function ensureRunning(): Promise<AudioContext | null> {
  const ctx = getCtx();
  if (!ctx) return null;
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  if (!compressor || !master) {
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-24, ctx.currentTime);
    compressor.knee.setValueAtTime(24, ctx.currentTime);
    compressor.ratio.setValueAtTime(10, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.22, ctx.currentTime);

    master = ctx.createGain();
    master.gain.setValueAtTime(0.75, ctx.currentTime);

    compressor.connect(master);
    master.connect(ctx.destination);
  }
  return ctx;
}

function tone(ctx: AudioContext, freq: number, startAt: number, duration: number, gainValue: number, type: OscillatorType = "sawtooth") {
  if (!compressor) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(Math.max(gainValue, 0.0001), startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(gain);
  gain.connect(compressor);

  osc.start(startAt);
  osc.stop(startAt + duration + 0.04);
}

function noiseBurst(ctx: AudioContext, startAt: number, duration: number, gainValue: number) {
  if (!compressor) return;
  const sampleRate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1400, startAt);
  filter.Q.setValueAtTime(0.8, startAt);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainValue, startAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(compressor);

  source.start(startAt);
  source.stop(startAt + duration + 0.02);
}

export async function playClickSfx() {
  const ctx = await ensureRunning();
  if (!ctx) return;

  const t = ctx.currentTime + 0.01;
  tone(ctx, 980, t, 0.09, 0.12, "square");
  tone(ctx, 1560, t + 0.03, 0.06, 0.08, "triangle");
}

export async function playStartBattleSfx() {
  const ctx = await ensureRunning();
  if (!ctx) return;

  const t = ctx.currentTime + 0.02;

  // impact + rumble
  noiseBurst(ctx, t, 0.22, 0.24);
  tone(ctx, 70, t, 0.28, 0.22, "sine");

  // heroic rise
  tone(ctx, 180, t + 0.06, 0.24, 0.14, "sawtooth");
  tone(ctx, 260, t + 0.12, 0.24, 0.14, "sawtooth");
  tone(ctx, 390, t + 0.18, 0.3, 0.13, "triangle");

  // final hit chord
  tone(ctx, 392, t + 0.34, 0.35, 0.12, "square");
  tone(ctx, 494, t + 0.34, 0.35, 0.1, "square");
  tone(ctx, 587, t + 0.34, 0.35, 0.09, "triangle");
}

export async function playStartBattleAudio() {
  try {
    const audio = new Audio("/sounds/game-start.mp3");
    audio.volume = 0.9;
    await audio.play();
    return true;
  } catch {
    await playStartBattleSfx();
    return false;
  }
}

export async function playRedFoundSfx() {
  const ctx = await ensureRunning();
  if (!ctx) return;

  const t = ctx.currentTime + 0.01;
  // sharp alert with short low hit
  tone(ctx, 820, t, 0.11, 0.14, "square");
  tone(ctx, 1100, t + 0.035, 0.09, 0.1, "triangle");
  tone(ctx, 120, t, 0.16, 0.12, "sine");
}
