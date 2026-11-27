import { isMuted, subscribeMuted } from './sfx';

/** Hợp âm ambient chill nhẹ nhàng (Cmaj7 -> Am7 -> Fmaj7 -> G6) sinh bằng Web Audio API. */
const CHORDS: readonly number[][] = [
  [261.63, 329.63, 392.0, 493.88],
  [220.0, 261.63, 329.63, 392.0],
  [174.61, 220.0, 261.63, 329.63],
  [196.0, 246.94, 293.66, 329.63],
];

let ctx: AudioContext | null = null;
let filterNode: BiquadFilterNode | null = null;
let masterGain: GainNode | null = null;
let timerId: number | null = null;
let chordIndex = 0;
let requestedEnabled = false;

function ensureAudioGraph(): boolean {
  if (typeof window === 'undefined') return false;
  if (!ctx) {
    try {
      ctx = new AudioContext();
      filterNode = ctx.createBiquadFilter();
      filterNode.type = 'lowpass';
      filterNode.frequency.value = 620;

      masterGain = ctx.createGain();
      masterGain.gain.value = 0.032;

      filterNode.connect(masterGain);
      masterGain.connect(ctx.destination);
    } catch {
      return false;
    }
  }
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }
  return true;
}

function playChord(): void {
  if (!ctx || !filterNode || isMuted() || !requestedEnabled || ctx.state !== 'running') return;
  const notes = CHORDS[chordIndex % CHORDS.length];
  chordIndex = (chordIndex + 1) % CHORDS.length;
  if (!notes) return;

  const now = ctx.currentTime;
  const dur = 2.5;
  notes.forEach((freq, i) => {
    if (!ctx || !filterNode) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = i % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.22 / notes.length, now + 0.45);
    env.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(env);
    env.connect(filterNode);
    osc.start(now + i * 0.06);
    osc.stop(now + dur + 0.08);
  });
}

function syncPlayback(): void {
  const shouldRun = requestedEnabled && !isMuted();
  if (shouldRun) {
    if (!ensureAudioGraph()) return;
    if (timerId === null) {
      playChord();
      timerId = window.setInterval(playChord, 2500);
    }
  } else if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

subscribeMuted(syncPlayback);

export function setAmbientMusicEnabled(enabled: boolean): void {
  requestedEnabled = enabled;
  syncPlayback();
}
