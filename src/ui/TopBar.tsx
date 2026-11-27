import { TEXT, UI_TEXT, useT } from './text';
import LangToggle from './major/LangToggle';
import { useReviewStore } from '../store/useReviewStore';
import { useWalkStore } from '../store/useWalkStore';
import { useLessonStore } from '../store/useLessonStore';
import { useLessonUi } from './lesson/lessonUi';
import { useSnowStore } from '../store/useSnowStore';
import { useTimelineStore } from '../store/useTimelineStore';
import { useSilver } from './silver/adapter';
import { useSilverPresentation } from './silver/presentation';
import { ST } from './silver/text';

/** Nút thanh trên: vuông 32 px (chỉ icon) trên điện thoại, nút có chữ từ sm. */
const BTN =
  'flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg text-xs sm:text-sm font-medium shadow transition-colors sm:h-auto sm:min-w-0 sm:px-2.5 sm:py-1.5';

export default function TopBar() {
  const tr = useT();
  const { mode } = useSilverPresentation();
  const reviewMode = useReviewStore((s) => s.reviewMode);
  const toggleReviewMode = useReviewStore((s) => s.toggleReviewMode);
  const openCount = useReviewStore(
    (s) => s.notes.filter((n) => n.status === 'mo').length,
  );

  const walkMode = useWalkStore((s) => s.walkMode);
  const toggleWalkMode = useWalkStore((s) => s.toggleWalkMode);

  const lessonIdle = useLessonStore((s) => s.phase === 'idle');
  const scheduleOpen = useLessonUi((s) => s.scheduleOpen);
  const toggleSchedule = useLessonUi((s) => s.toggleSchedule);

  const isSnowing = useSnowStore((s) => s.isSnowing);
  const toggleSnow = useSnowStore((s) => s.toggleSnow);
  const startCinematic = useSnowStore((s) => s.startCinematic);

  const silverScreen = useSilver((s) => s.screen);
  const silverClosed = silverScreen === 'closed';

  // Ẩn TopBar chung khi đang ở màn play của chế độ 3D world (WorldLayer có header riêng)
  if (silverScreen === 'play' && mode === 'world') {
    return null;
  }

  return (
    <>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 p-2 sm:p-4">
        <h1 className="pointer-events-auto shrink-0 whitespace-nowrap rounded-lg bg-white/85 px-2.5 py-1.5 text-sm font-semibold text-slate-800 shadow backdrop-blur-sm sm:px-3 sm:text-base lg:text-lg">
          {tr(UI_TEXT.appTitle)}
        </h1>

        {/* Điện thoại: chỉ icon (nhãn ẩn, có title/aria-label) để một hàng, không chồng; từ sm trở lên đầy đủ chữ như cũ */}
        <div className="pointer-events-auto flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          <LangToggle />

          {/* Nút Tuyết rơi */}
          <button
            type="button"
            onClick={() => toggleSnow()}
            aria-pressed={isSnowing}
            aria-label={isSnowing ? tr(UI_TEXT.snowBtnActive) : tr(UI_TEXT.snowBtn)}
            className={`${BTN} ${
              isSnowing
                ? 'bg-sky-600 text-white ring-2 ring-sky-300'
                : 'bg-white/85 text-slate-700 hover:bg-white hover:text-slate-900 backdrop-blur-sm'
            }`}
            title={isSnowing ? tr(UI_TEXT.snowBtnActive) : tr(UI_TEXT.snowBtnTip)}
          >
            <span className="text-base leading-none">❄️</span>
            <span className="hidden sm:inline">{isSnowing ? tr(UI_TEXT.snowBtnActive) : tr(UI_TEXT.snowBtn)}</span>
          </button>

          {/* Xem lại cảnh mở đầu (chỉ desktop) */}
          {isSnowing && (
            <button
              type="button"
              onClick={startCinematic}
              className="hidden lg:flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-800 border border-sky-300 shadow backdrop-blur-sm hover:bg-sky-100 transition-all"
              title={tr(UI_TEXT.replayIntro)}
            >
              <span>🎬</span>
              <span>{tr(UI_TEXT.replayIntro)}</span>
            </button>
          )}

          {/* Nút Đi bộ */}
          <button
            type="button"
            onClick={toggleWalkMode}
            aria-pressed={walkMode}
            aria-label={walkMode ? tr(UI_TEXT.walkBtnActive) : tr(UI_TEXT.walkBtn)}
            className={`${BTN} ${
              walkMode
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                : 'bg-white/85 text-slate-700 hover:bg-white hover:text-slate-900 backdrop-blur-sm'
            }`}
            title={walkMode ? tr(UI_TEXT.walkBtnActiveTip) : tr(UI_TEXT.walkBtnTip)}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="5" r="2" />
              <path d="m9 20 3-6 3 6" />
              <path d="m6 8 6 2 6-2" />
              <path d="M12 10v4" />
            </svg>
            <span className="hidden sm:inline">{walkMode ? tr(UI_TEXT.walkBtnActive) : tr(UI_TEXT.walkBtn)}</span>
          </button>

          {/* Nút Buổi học */}
          {lessonIdle && silverClosed && !reviewMode && (
            <button
              type="button"
              onClick={toggleSchedule}
              aria-pressed={scheduleOpen}
              aria-label={tr(UI_TEXT.lessonOpenBtn)}
              className={`${BTN} ${
                scheduleOpen
                  ? 'bg-[#0b3d91] text-white ring-2 ring-sky-300'
                  : 'bg-white/85 text-slate-700 hover:bg-white hover:text-slate-900 backdrop-blur-sm'
              }`}
              title={tr(UI_TEXT.lessonOpenBtn)}
            >
              <span className="text-base leading-none sm:hidden">📚</span>
              <span className="hidden sm:inline">{tr(UI_TEXT.lessonOpenBtn)}</span>
            </button>
          )}

          {/* Nút Lộ trình 5 năm */}
          {lessonIdle && silverClosed && !reviewMode && !scheduleOpen && (
            <button
              type="button"
              onClick={() => useTimelineStore.getState().setTimelineOpen(true)}
              aria-label={tr(UI_TEXT.timelineBtn)}
              className={`${BTN} bg-amber-400/95 text-slate-950 font-bold hover:bg-amber-300`}
              title={tr(UI_TEXT.timelineTitle)}
            >
              <span className="text-base leading-none sm:hidden">🗓️</span>
              <span className="hidden sm:inline">🗓️ {tr(UI_TEXT.timelineBtn)}</span>
            </button>
          )}

          {/* Nút IT Silver */}
          {lessonIdle && silverClosed && !reviewMode && !scheduleOpen && (
            <button
              type="button"
              data-silver-trigger="true"
              onClick={() => {
                if (mode !== 'world') {
                  useWalkStore.getState().exitWalkMode();
                }
                useSilver.getState().openHome();
              }}
              aria-label={tr(ST.open)}
              className={`${BTN} bg-white/85 text-slate-700 hover:bg-white hover:text-slate-900 backdrop-blur-sm`}
              title={tr(ST.open)}
            >
              <span className="text-base leading-none sm:hidden">🎓</span>
              <span className="hidden sm:inline">{tr(ST.open)}</span>
            </button>
          )}

          {/* Nút Chế độ góp ý */}
          <button
            type="button"
            onClick={toggleReviewMode}
            aria-pressed={reviewMode}
            aria-label={tr(UI_TEXT.reviewBtn)}
            className={`relative ${BTN} ${
              reviewMode
                ? 'border-2 border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-300'
                : 'bg-white/85 text-slate-700 hover:bg-white hover:text-slate-900 backdrop-blur-sm'
            }`}
            title={tr(UI_TEXT.reviewBtnTip)}
          >
            <svg
              className={`h-4 w-4 ${reviewMode ? 'text-amber-600' : 'text-slate-500'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="hidden sm:inline">{tr(UI_TEXT.reviewBtn)}</span>
            {reviewMode && (
              <span className="hidden sm:inline rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                {tr(UI_TEXT.reviewBadgeActive)}
              </span>
            )}
            {openCount > 0 && (
              <span
                className={`absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white sm:static sm:ml-0.5 sm:h-5 sm:min-w-5 sm:text-xs ${
                  reviewMode ? 'bg-amber-600' : 'bg-amber-500'
                }`}
              >
                {openCount}
              </span>
            )}
          </button>
        </div>
      </header>
      <p className="pointer-events-none absolute bottom-1 right-2 text-[10px] text-slate-600 z-10">
        {TEXT.osmCredit}
      </p>
    </>
  );
}
