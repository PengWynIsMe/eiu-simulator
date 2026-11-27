import { ENGLISH_SCHEDULES, getRoomSpecForStage } from '../../data/timeline/curriculumPlans';
import { getMajorTermActivity } from '../../data/timeline/majorContent';
import { useTimelineStore } from '../../store/useTimelineStore';
import { useLangStore } from '../../store/useLangStore';

export default function MissionTrackerCard() {
  const lang = useLangStore((s) => s.lang);
  const active = useTimelineStore((s) => s.active);
  const stage = useTimelineStore((s) => s.stage);
  const activeTermId = useTimelineStore((s) => s.activeTermId);
  const englishLevel = useTimelineStore((s) => s.englishLevel);
  const englishSession = useTimelineStore((s) => s.englishSession);
  const weekInTerm = useTimelineStore((s) => s.weekInTerm);
  const nearbyMissionTarget = useTimelineStore((s) => s.nearbyMissionTarget);
  const modalOpen = useTimelineStore((s) => s.modalOpen);
  const desktopMinimized = useTimelineStore((s) => s.desktopMinimized);

  if (!active || stage === 'graduation' || stage === 'ielts-exam') return null;
  if (modalOpen && !desktopMinimized) return null;

  const spec = getRoomSpecForStage(stage);
  const sched = ENGLISH_SCHEDULES[englishLevel];
  const majorAct = getMajorTermActivity(activeTermId);

  const stageTitle =
    stage === 'placement-written'
      ? lang === 'vi'
        ? 'Test Đầu vào: Reading + Listening + Writing'
        : 'Placement Test: Reading + Listening + Writing'
      : stage === 'placement-speaking'
        ? lang === 'vi'
          ? 'Test Đầu vào: Speaking 1:1 cùng Giáo viên'
          : 'Placement Speaking: 1-on-1 Teacher Interview'
        : stage === 'english-class'
          ? lang === 'vi'
            ? `Học Tiếng Anh Level ${englishLevel} (Buổi ${englishSession}/2)`
            : `English Level ${englishLevel} Class (Session ${englishSession}/2)`
          : stage === 'english-exam'
            ? lang === 'vi'
              ? `Thi cuối kỳ Tiếng Anh Level ${englishLevel}`
              : `English Level ${englishLevel} Final Exam`
            : stage === 'major-theory'
              ? lang === 'vi'
                ? `Lý thuyết ${majorAct.featuredCourseCode} tại Block 8`
                : `${majorAct.featuredCourseCode} Theory Lecture (B8)`
              : stage === 'major-lab'
                ? lang === 'vi'
                  ? `Thực hành Lab tầng 4 (${spec.roomCode})`
                  : `Floor 4 Lab Practice (${spec.roomCode})`
                : lang === 'vi'
                  ? `Thi học kỳ ${activeTermId} (Tuần 10)`
                  : `Term ${activeTermId} Final Exam (Week 10)`;

  const isEnglish =
    stage === 'placement-written' ||
    stage === 'placement-speaking' ||
    stage === 'english-class' ||
    stage === 'english-exam';

  return (
    <>
      <div className="pointer-events-auto fixed left-2.5 top-[178px] z-30 w-[min(78vw,285px)] rounded-2xl border border-amber-400/40 bg-slate-950/88 p-3 text-white shadow-xl backdrop-blur-md sm:left-4 sm:top-48">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
            {isEnglish
              ? `Kỳ ${activeTermId} · Lv.${englishLevel}`
              : `Kỳ ${activeTermId} · Tuần ${weekInTerm}/10`}
          </span>
          <button
            type="button"
            onClick={() => useTimelineStore.getState().pauseMission()}
            className="text-xs text-slate-400 hover:text-white"
            aria-label="Đóng thẻ nhiệm vụ"
          >
            ✕
          </button>
        </div>

        <div className="mt-1.5 text-xs font-bold leading-snug text-white">{stageTitle}</div>
        <div className="mt-0.5 text-[11px] text-sky-300">
          📍 {spec.roomCode} (Tầng {spec.floor} Block 8)
        </div>

        {stage === 'english-class' && (
          <div className="mt-1 text-[10px] text-slate-300">
            ⏰ {sched.timeText} · Break {sched.breakText}
          </div>
        )}

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => useTimelineStore.getState().teleportToMissionRoom()}
            className="rounded-xl bg-sky-500 px-2.5 py-1.5 text-[11px] font-bold text-white shadow hover:bg-sky-400"
          >
            ⚡ {lang === 'vi' ? `Vào phòng ${spec.roomCode}` : `Go to ${spec.roomCode}`}
          </button>
          <button
            type="button"
            onClick={() => useTimelineStore.getState().triggerCurrentActivity()}
            className="rounded-xl bg-amber-400 px-2.5 py-1.5 text-[11px] font-bold text-slate-950 shadow hover:bg-amber-300"
          >
            ▶ {lang === 'vi' ? 'Làm bài / Học' : 'Start Activity'}
          </button>
          {isEnglish && (
            <button
              type="button"
              onClick={() => useTimelineStore.getState().openIeltsChallenge()}
              className="rounded-xl border border-white/20 bg-white/10 px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-white/20"
            >
              📜 IELTS 6.0
            </button>
          )}
        </div>
      </div>

      {nearbyMissionTarget && (
        <button
          type="button"
          onClick={() => useTimelineStore.getState().triggerCurrentActivity()}
          className="pointer-events-auto fixed bottom-40 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border-2 border-amber-300 bg-[#f5b700] px-5 py-2.5 text-xs font-bold text-slate-950 shadow-2xl sm:bottom-16 sm:text-sm"
        >
          <span className="rounded bg-slate-900/15 px-1.5 py-0.5 text-[11px] font-black">E</span>
          <span>{stageTitle}</span>
        </button>
      )}
    </>
  );
}
