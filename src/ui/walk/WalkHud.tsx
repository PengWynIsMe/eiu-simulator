import { useEffect, useRef, useState } from 'react';
import { useWalkStore } from '../../store/useWalkStore';
import { useActivityStore } from '../../store/useActivityStore';
import { useLessonStore } from '../../store/useLessonStore';
import { useExploreStore } from '../../store/useExploreStore';

export default function WalkHud() {
  const walkMode = useWalkStore((state) => state.walkMode);
  const interior = useWalkStore((state) => state.interior);
  const shuttleActive = useExploreStore((state) => state.shuttleActive);
  const knob = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);
  const [viewMode, setViewMode] = useState(0);

  const activity = useActivityStore((state) => state.activity);
  const phase = useActivityStore((state) => state.phase);
  const screenOpen = useActivityStore((state) => state.screenOpen);
  const isEngaged = Boolean(activity && (phase === 'engaged' || screenOpen));

  const lessonPhase = useLessonStore((state) => state.phase);
  const isLessonEngaged = lessonPhase !== 'idle' && lessonPhase !== 'goToClass' && lessonPhase !== 'findSeat';

  // Ẩn toàn bộ cần điều khiển và nút khi đang trong bài học/hội thoại (không đè lên nút Tiếp trên mobile)
  const isStudying = isEngaged || isLessonEngaged;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]')) return;
      if (event.key.toLowerCase() === 'v' && !event.repeat) useWalkStore.getState().toggleWalkMode();
      if (event.key === 'Escape' && document.pointerLockElement === null) useWalkStore.getState().exitWalkMode();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onViewMode = (event: Event) => setViewMode((event as CustomEvent<{ mode: number }>).detail.mode);
    window.addEventListener('campussim:view-mode', onViewMode);
    return () => window.removeEventListener('campussim:view-mode', onViewMode);
  }, []);

  if (!walkMode || shuttleActive) return null;

  const setFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const radius = rect.width * 0.36;
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const length = Math.hypot(dx, dy);
    const scale = length > radius ? radius / length : 1;
    const x = (dx * scale) / radius;
    const y = (-dy * scale) / radius;
    if (knob.current) knob.current.style.transform = `translate(${dx * scale}px, ${dy * scale}px)`;
    useWalkStore.getState().setMoveInput(x, y);
  };

  const release = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (knob.current) knob.current.style.transform = 'translate(0, 0)';
    useWalkStore.getState().setMoveInput(0, 0);
  };

  return (
    <>
      {!isStudying && (
        <div className="pointer-events-none fixed bottom-5 left-5 z-40 hidden rounded-xl border border-slate-700/60 bg-slate-950/80 px-4 py-2.5 text-xs text-slate-200 shadow-lg backdrop-blur-md md:block">
          Góc nhìn: {['Sau vai', 'Thứ nhất (FPS)', 'Trên xuống'][viewMode]} ·{' '}
          {viewMode === 1
            ? 'W A S D: đi · Shift: chạy · Bấm màn hình xoay chuột · Esc: nhả chuột'
            : interior
              ? 'W A S D / ↑↓←→: đi · Shift: chạy · Kéo chuột: xoay nhìn · Cuộn chuột: thu phóng (2.5–7m)'
              : 'W A S D / ↑↓←→: đi · Shift: chạy · Kéo chuột: xoay nhìn'}{' '}
          · C: đổi góc nhìn
        </div>
      )}
      {viewMode === 1 && !isStudying && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center" aria-hidden="true">
          <span className="text-xl font-bold leading-none text-white" style={{ textShadow: '-1px -1px 1px #000, 1px -1px 1px #000, -1px 1px 1px #000, 1px 1px 1px #000' }}>+</span>
        </div>
      )}
      {!isStudying && (
        <>
          <div
            role="group"
            aria-label="Cần điều khiển đi bộ"
            className="fixed bottom-6 left-6 z-50 flex h-32 w-32 touch-none select-none items-center justify-center rounded-full border border-white/60 bg-slate-900/35 shadow-lg [@media(pointer:fine)]:hidden"
            onPointerDown={(event) => {
              event.stopPropagation();
              activePointer.current = event.pointerId;
              event.currentTarget.setPointerCapture(event.pointerId);
              setFromPointer(event);
            }}
            onPointerMove={(event) => {
              event.stopPropagation();
              if (activePointer.current === event.pointerId) setFromPointer(event);
            }}
            onPointerUp={release}
            onPointerCancel={release}
          >
            <div className="pointer-events-none absolute h-24 w-24 rounded-full border border-white/30" />
            <div ref={knob} className="pointer-events-none h-12 w-12 rounded-full border border-white/80 bg-white/75 shadow transition-transform duration-75" />
          </div>
          <button
            type="button"
            className="fixed bottom-7 right-6 z-50 rounded-xl bg-slate-950/80 px-4 py-3 font-semibold text-white shadow-lg [@media(pointer:fine)]:hidden min-h-[44px]"
            onClick={() => useWalkStore.getState().exitWalkMode()}
          >
            Thoát đi bộ
          </button>
        </>
      )}
    </>
  );
}
