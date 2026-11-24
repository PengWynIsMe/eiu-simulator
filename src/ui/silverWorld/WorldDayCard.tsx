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
 * Thẻ ngày / thẻ chuyển cảnh fade:
 * - Nhỏ phía trên giữa màn hình, KHÔNG làm mờ nền.
 * - Tự biến mất sau 1,8 s (1,2 s hiển thị -> 0,6 s fade-out).
 * - Sửa lỗi React StrictMode: effect quản lý timer dựa trên activeCard để cleanup/remount không làm kẹt thẻ.
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

  // Quản lý timer tự tắt 1,8s (1,2s in + 0,6s out) bền vững với StrictMode và đổi cảnh lúc đang mờ
  useEffect(() => {
    if (!activeCard) {
      setFadeState('hidden');
      return;
    }

    setFadeState('in');
    let timerHide: ReturnType<typeof setTimeout> | null = null;
    const timerOut = setTimeout(() => {
      setFadeState('out');
      timerHide = setTimeout(() => {
        setFadeState('hidden');
        setActiveCard(null);
      }, 600);
    }, 1200);

    return () => {
      clearTimeout(timerOut);
      if (timerHide) {
        clearTimeout(timerHide);
      }
    };
  }, [activeCard]);

  useEffect(() => {
    // Chỉ reset trạng thái ghi nhớ khi ra ngoài home/closed hoặc sang chương khác
    if (screen === 'home' || screen === 'closed') {
      lastDayRef.current = null;
      lastSceneIdRef.current = null;
      lastChapterRef.current = null;
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
      setActiveCard(null);
      return;
    }

    const meeting = playItem.meeting;
    const scene = playItem.scene;

    // 1. Trường hợp có lịch học theo ngày (chương 2.2): đổi ngày -> hiện thẻ ngày
    if (meeting && meeting.day !== undefined) {
      const newDay = meeting.day;
      if (lastDayRef.current !== newDay) {
        lastDayRef.current = newDay;
        const dayInfo = DAY_NAMES[newDay];
        if (dayInfo) {
          setActiveCard({
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
          setActiveCard({
            primary: scene.title,
            icon: '🎓',
          });
        }
      }
    }
  }, [screen, chapterId, playItem]);

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
      className={`pointer-events-none fixed top-16 left-1/2 z-40 -translate-x-1/2 select-none transition-all duration-500 ease-out ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'
      }`}
    >
      <div className="flex items-center gap-2.5 rounded-2xl border border-sky-400/40 bg-gradient-to-r from-[#0b3d91]/95 to-[#082b66]/95 px-5 py-2.5 shadow-xl backdrop-blur-md">
        <span className="text-xl" aria-hidden="true">
          {activeCard.icon}
        </span>
        <div>
          <h2 className="text-sm font-extrabold tracking-wide text-white sm:text-base">
            {primaryName}
          </h2>
          <p className="text-[10px] font-semibold tracking-wider text-sky-200 uppercase sm:text-xs">
            {secondaryName}
          </p>
        </div>
      </div>
    </div>
  );
}
