import { TEXT } from './text';
import { useReviewStore } from '../store/useReviewStore';
import { useWalkStore } from '../store/useWalkStore';
import { useLessonStore } from '../store/useLessonStore';
import { useLessonUi } from './lesson/lessonUi';
import { useSnowStore } from '../store/useSnowStore';
import { SNOW_TEXT } from './snowText';

export default function TopBar() {
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
  const lang = useSnowStore((s) => s.lang);
  const toggleLang = useSnowStore((s) => s.toggleLang);
  const snowText = SNOW_TEXT[lang];

  return (
    <>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4">
        <h1 className="pointer-events-auto rounded-lg bg-white/85 px-3 py-1.5 text-base font-semibold text-slate-800 shadow backdrop-blur-sm sm:text-lg">
          {TEXT.appTitle}
        </h1>

        <div className="pointer-events-auto flex items-center gap-2">
          {/* Nút Tuyết rơi */}
          <button
            type="button"
            onClick={() => toggleSnow()}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all shadow ${
              isSnowing
                ? 'bg-sky-600 text-white ring-2 ring-sky-300'
                : 'bg-white/85 text-slate-700 hover:bg-white hover:text-slate-900 backdrop-blur-sm'
            }`}
            title={isSnowing ? snowText.snowBtnActive : snowText.snowBtnTip}
          >
            <span className="text-base leading-none">❄️</span>
            <span>{isSnowing ? snowText.snowBtnActive : snowText.snowBtn}</span>
          </button>

          {/* Nếu đang ở chế độ tuyết, thêm nút xem lại mở đầu & đổi ngôn ngữ */}
          {isSnowing && (
            <>
              <button
                type="button"
                onClick={startCinematic}
                className="hidden md:flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-800 border border-sky-300 shadow backdrop-blur-sm hover:bg-sky-100 transition-all"
                title={snowText.replayIntro}
              >
                <span>🎬</span>
                <span>{snowText.replayIntro}</span>
              </button>
              <button
                type="button"
                onClick={toggleLang}
                className="flex items-center gap-1 rounded-lg bg-white/85 px-2.5 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 shadow backdrop-blur-sm hover:bg-white transition-all"
                title={snowText.langToggle}
              >
                <span>🌐</span>
                <span>{snowText.langToggle}</span>
              </button>
            </>
          )}

          {/* Nút Đi bộ */}
          <button
            type="button"
            onClick={toggleWalkMode}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors shadow ${
              walkMode
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                : 'bg-white/85 text-slate-700 hover:bg-white hover:text-slate-900 backdrop-blur-sm'
            }`}
            title={walkMode ? TEXT.walkBtnActiveTip : TEXT.walkBtnTip}
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
            <span>{walkMode ? TEXT.walkBtnActive : TEXT.walkBtn}</span>
          </button>

          {/* Nút Buổi học */}
          {lessonIdle && !reviewMode && (
            <button
              type="button"
              onClick={toggleSchedule}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors shadow ${
                scheduleOpen
                  ? 'bg-[#0b3d91] text-white ring-2 ring-sky-300'
                  : 'bg-white/85 text-slate-700 hover:bg-white hover:text-slate-900 backdrop-blur-sm'
              }`}
              title={TEXT.lessonOpenBtn}
            >
              <span>{TEXT.lessonOpenBtn}</span>
            </button>
          )}

          {/* Nút Chế độ góp ý */}
          <button
            type="button"
            onClick={toggleReviewMode}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all shadow ${
              reviewMode
                ? 'border-2 border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-300'
                : 'bg-white/85 text-slate-700 hover:bg-white hover:text-slate-900 backdrop-blur-sm'
            }`}
            title={TEXT.reviewBtnTip}
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
            <span>{TEXT.reviewBtn}</span>
            {reviewMode && (
              <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                {TEXT.reviewBadgeActive}
              </span>
            )}
            {openCount > 0 && (
              <span
                className={`ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold ${
                  reviewMode ? 'bg-amber-600 text-white' : 'bg-amber-500 text-white'
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
