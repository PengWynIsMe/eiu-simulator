/** Âm thanh Web Audio tự sinh (không file). AudioContext chỉ tạo sau lần bấm / gõ đầu tiên của người dùng. */
const KEY = 'campussim.muted';

let ctx: AudioContext | null = null;
let muted = (() => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
})();
const listeners = new Set<() => void>();

export const isMuted = () => muted;
export const subscribeMuted = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export function setMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem(KEY, value ? '1' : '0');
  } catch {
    /* bỏ qua */
  }
  listeners.forEach((fn) => fn());
}

function unlock() {
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

/** Gắn một lần ở module: tạo AudioContext ở cử chỉ đầu tiên. */
if (typeof window !== 'undefined') {
  const once = () => {
    unlock();
    window.removeEventListener('pointerdown', once, true);
    window.removeEventListener('keydown', once, true);
  };
  window.addEventListener('pointerdown', once, true);
  window.addEventListener('keydown', once, true);
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, gain: number, endFreq?: number) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const ready = () => !muted && ctx !== null && ctx.state === 'running';

export const sfx = {
  /** Tiếng gõ phím ngắn. */
  key() {
    if (!ready()) return;
    tone(1800 + Math.random() * 500, 0, 0.04, 'square', 0.04, 900);
  },
  /** "Ting" khi đúng. */
  correct() {
    if (!ready()) return;
    tone(1319, 0, 0.35, 'sine', 0.15);
    tone(1760, 0.08, 0.45, 'sine', 0.12);
  },
  /** "Bụp" trầm khi sai. */
  wrong() {
    if (!ready()) return;
    tone(180, 0, 0.22, 'triangle', 0.25, 90);
  },
  /** Chuông 2 nốt: vào / tan học. */
  bell() {
    if (!ready()) return;
    tone(784, 0, 0.7, 'sine', 0.18);
    tone(988, 0.45, 0.9, 'sine', 0.18);
  },
};
