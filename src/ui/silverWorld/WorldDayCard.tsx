import { useEffect, useRef, useState } from 'react';
import { useLangStore } from '../../store/useLangStore';
import { useActivityStore } from '../../store/useActivityStore';
import { useSilver } from '../silver/adapter';
import { getStage } from '../../data/silver/stages';

export const DAY_NAMES = [
  { vi: 'Thứ Hai', en: 'Monday' },
  { vi: 'Thứ Ba', en: 'Tuesday' },
  { vi: 'Thứ Tư', en: 'Wednesday' },
  { vi: 'Thứ Năm', en: 'Thursday' },
  { vi: 'Thứ Sáu', en: 'Friday' },
  { vi: 'Thứ Bảy', en: 'Saturday' },
] as const;

interface ActiveCard {
  primary: { vi: string; en: string };
  icon: string;
  dayIndex?: number;
}

/**
 * Thẻ ngày / thẻ chuyển cảnh fade 0,6 s hiển thị tên thứ hoặc tên cảnh từ scene.title.
 * - Chỉ hiện khi đổi ngày hoặc đổi cảnh (hai môn/bài cùng phòng, cùng ngày, đang ngồi không hiện lại).
 * - Không hiện lại khi mở lịch tuần rồi quay lại cùng ngày.
 * - Tự biến mất sau 1,8 s (0,6 s fade-in -> giữ 0,6 s -> 0,6 s fade-out).
 */
export default function WorldDayCard() {
  const lang = useLangStore((s) => s.lang);
  const screen = useSilver((s) => s.screen);
  const chapterId = useSilver((s) => (s.screen === 'play' ? s.play?.chapterId : undefined));
  const playItem = useSilver((s) => (s.screen === 'play' ? s.play?.item : undefined));

  const [activeCard, setActiveCard] = useState<ActiveCard | null>(null);
  const [fadeState, setFadeState] = useState<'hidden' | 'in' | 'out'>('hidden');

  const lastDayRef = useRef<number | null>(null);
  const lastChapterRef = useRef<string | null>(null);
  const lastSceneIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Chỉ reset trạng thái ghi nhớ khi ra ngoài home/closed hoặc sang chương khác
    if (screen === 'home' || screen === 'closed') {
      lastDayRef.current = null;
      lastSceneIdRef.current = null;
      lastChapterRef.current = null;
      if (timerRef.current) clearTimeout(timerRef.current);
      setFadeState('hidden');
      setActiveCard(null);
      return;
    }

    if (chapterId && lastChapterRef.current && chapterId !== lastChapterRef.current) {
      lastDayRef.current = null;
      lastSceneIdRef.current = null;
    }
    lastChapterRef.current = chapterId ?? null;

    // Khi ở màn phụ khác (ví dụ: 'week'), tạm ẩn thẻ nhưng KHÔNG xóa lastDayRef
    if (screen !== 'play' || !playItem) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setFadeState('hidden');
      setActiveCard(null);
      return;
    }

    const meeting = playItem.meeting;
    const scene = playItem.scene;

    const triggerCard = (card: ActiveCard) => {
      setActiveCard(card);
      setFadeState('in');

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setFadeState('out');
        timerRef.current = setTimeout(() => {
          setFadeState('hidden');
        }, 600);
      }, 1200);
    };

    // 1. Trường hợp có lịch học theo ngày (chương 2.2): đổi ngày -> hiện thẻ ngày
    if (meeting && meeting.day !== undefined) {
      const newDay = meeting.day;
      if (lastDayRef.current !== newDay) {
        lastDayRef.current = newDay;
        const dayInfo = DAY_NAMES[newDay];
        if (dayInfo) {
          triggerCard({
            primary: dayInfo,
            icon: '📅',
            dayIndex: newDay,
          });
        }
      }
      return;
    }

    // 2. Trường hợp cảnh theo cốt truyện không có ngày (entrance, 1.1...): hiện tiêu đề từ scene.title
    if (scene && scene.title) {
      const currSceneId = scene.id;
      if (lastSceneIdRef.current !== currSceneId) {
        const currStage = getStage(currSceneId);
        const prevStage = lastSceneIdRef.current ? getStage(lastSceneIdRef.current) : null;
        const sameRoom = Boolean(currStage?.roomCode && prevStage?.roomCode && currStage.roomCode === prevStage.roomCode);
        const wasSeated = useActivityStore.getState().seated;
        const isKeepSeated = sameRoom && wasSeated;

        lastSceneIdRef.current = currSceneId;

        // Nếu giữ nguyên ghế ngồi trong cùng phòng thì không làm phiền bằng fade
        if (!isKeepSeated) {
          triggerCard({
            primary: scene.title,
            icon: '🎓',
          });
        }
      }
    }
  }, [screen, chapterId, playItem]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (fadeState === 'hidden' || activeCard === null) {
    return null;
  }

  const primaryName = lang === 'vi' ? activeCard.primary.vi : activeCard.primary.en;
  const secondaryName = lang === 'vi' ? activeCard.primary.en : activeCard.primary.vi;

  const isVisible = fadeState === 'in';

  return (
    <div
      data-silver-day-card="true"
      data-silver-day-index={activeCard.dayIndex}
      className={`pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity duration-[600ms] ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="mx-4 max-w-sm rounded-2xl border border-sky-400/30 bg-gradient-to-b from-[#0b3d91]/95 to-[#082b66]/95 px-8 py-6 text-center shadow-2xl sm:px-12 sm:py-8">
        <div className="mb-2 text-2xl sm:text-3xl" aria-hidden="true">
          {activeCard.icon}
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
