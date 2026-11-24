import { useEffect, useRef, useState } from 'react';
import { useLangStore } from '../../store/useLangStore';
import { useSilver } from '../silver/adapter';

export const DAY_NAMES = [
  { vi: 'Thứ Hai', en: 'Monday' },
  { vi: 'Thứ Ba', en: 'Tuesday' },
  { vi: 'Thứ Tư', en: 'Wednesday' },
  { vi: 'Thứ Năm', en: 'Thursday' },
  { vi: 'Thứ Sáu', en: 'Friday' },
  { vi: 'Thứ Bảy', en: 'Saturday' },
] as const;

/**
 * Thẻ ngày fade 0,6 s hiển thị tên thứ song ngữ từ meeting.day khi đổi ngày.
 * - Chỉ hiện khi đổi ngày (hai môn cùng ngày không hiện lại).
 * - Tự biến mất sau 1,8 s (0,6 s fade-in -> giữ 0,6 s -> 0,6 s fade-out).
 */
export default function WorldDayCard() {
  const lang = useLangStore((s) => s.lang);
  const screen = useSilver((s) => s.screen);
  const meeting = useSilver((s) => (s.screen === 'play' ? s.play?.item.meeting : undefined));

  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [fadeState, setFadeState] = useState<'hidden' | 'in' | 'out'>('hidden');

  const lastDayRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (screen !== 'play') {
      lastDayRef.current = null;
      if (timerRef.current) clearTimeout(timerRef.current);
      setFadeState('hidden');
      setActiveDay(null);
      return;
    }

    if (meeting && meeting.day !== undefined) {
      const newDay = meeting.day;
      // Chỉ kích hoạt khi đổi ngày khác với ngày trước đó
      if (lastDayRef.current !== newDay) {
        lastDayRef.current = newDay;
        setActiveDay(newDay);
        setFadeState('in');

        if (timerRef.current) clearTimeout(timerRef.current);
        // Sau 1200ms bắt đầu fade-out (0.6s)
        timerRef.current = setTimeout(() => {
          setFadeState('out');
          // Sau thêm 600ms chuyển sang hidden
          timerRef.current = setTimeout(() => {
            setFadeState('hidden');
          }, 600);
        }, 1200);
      }
    }
  }, [screen, meeting]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (fadeState === 'hidden' || activeDay === null) {
    return null;
  }

  const dayInfo = DAY_NAMES[activeDay];
  if (!dayInfo) return null;

  const primaryName = lang === 'vi' ? dayInfo.vi : dayInfo.en;
  const secondaryName = lang === 'vi' ? dayInfo.en : dayInfo.vi;

  const isVisible = fadeState === 'in';

  return (
    <div
      data-silver-day-card="true"
      data-silver-day-index={activeDay}
      className={`pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity duration-[600ms] ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="mx-4 max-w-sm rounded-2xl border border-sky-400/30 bg-gradient-to-b from-[#0b3d91]/95 to-[#082b66]/95 px-8 py-6 text-center shadow-2xl sm:px-12 sm:py-8">
        <div className="mb-2 text-2xl sm:text-3xl" aria-hidden="true">
          📅
        </div>
        <h2 className="text-2xl font-extrabold tracking-wide text-white sm:text-3xl">
          {primaryName}
        </h2>
        <p className="mt-1.5 text-xs font-semibold tracking-widest text-sky-200 uppercase sm:text-sm">
          {secondaryName}
        </p>
      </div>
    </div>
  );
}
