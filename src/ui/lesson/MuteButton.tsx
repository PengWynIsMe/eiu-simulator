import { useSyncExternalStore } from 'react';
import { isMuted, setMuted, subscribeMuted } from '../audio/sfx';

/** Nút bật / tắt âm thanh buổi học. */
export default function MuteButton({ className = '' }: { className?: string }) {
  const muted = useSyncExternalStore(subscribeMuted, isMuted);
  return (
    <button
      type="button"
      onClick={() => setMuted(!muted)}
      title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
      aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
      aria-pressed={muted}
      className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-sm shadow hover:bg-white ${className}`}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
