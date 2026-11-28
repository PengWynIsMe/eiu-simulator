import {
  B8_OUTSIDE_ENTRANCE,
  b8UvToWorld,
  ENGLISH_SCHEDULES,
  getRoomSpecForStage,
} from '../../data/timeline/curriculumPlans';
import { getMajorTermActivity } from '../../data/timeline/majorContent';
import { useExploreStore } from '../../store/useExploreStore';
import { useLangStore } from '../../store/useLangStore';
import { useTimelineStore } from '../../store/useTimelineStore';
import { useWalkStore } from '../../store/useWalkStore';

const B8_EX_X = 0.97398;
const B8_EX_Z = -0.22663;
const B8_EV_X = 0.22663;
const B8_EV_Z = 0.97398;
const B8_ELEVATOR_WORLD = b8UvToWorld(53.5, -188.35);

function normalizeAngleDeg(rad: number): number {
  let deg = (rad * 180) / Math.PI;
  while (deg > 180) deg -= 360;
  while (deg < -180) deg += 360;
  return deg;
}

function getTurnText(relDeg: number, lang: 'vi' | 'en'): string {
  const abs = Math.abs(relDeg);
  if (abs <= 32) return lang === 'vi' ? 'Đi thẳng' : 'Go straight';
  if (abs >= 140) return lang === 'vi' ? 'Quay lại' : 'Turn around';
  if (relDeg > 0) return lang === 'vi' ? 'Rẽ phải' : 'Turn right';
  return lang === 'vi' ? 'Rẽ trái' : 'Turn left';
}

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

  const playerPos = useWalkStore((s) => s.playerPos);
  const interior = useWalkStore((s) => s.interior);
  const playerYaw = useExploreStore((s) => s.playerYaw);

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

  // Tính mục tiêu chặng kế tiếp & góc mũi tên tương đối theo hướng nhìn hiện tại
  let guideTarget: readonly [number, number] = B8_OUTSIDE_ENTRANCE;
  let guideStepLabel = lang === 'vi' ? 'Tới cửa Block 8' : 'Head to Block 8';
  let isTransit = false;

  if (interior) {
    if (interior.buildingId.toLowerCase() !== 'b8') {
      isTransit = true;
      guideTarget = B8_OUTSIDE_ENTRANCE;
      guideStepLabel = lang === 'vi' ? 'Ra ngoài → sang Block 8' : 'Exit → go to Block 8';
    } else if (interior.floor !== spec.floor) {
      isTransit = true;
      guideTarget = B8_ELEVATOR_WORLD;
      guideStepLabel =
        lang === 'vi'
          ? `Tới thang máy → Tầng ${spec.floor}`
          : `Elevator → Floor ${spec.floor}`;
    } else {
      const pu = playerPos.x * B8_EX_X + playerPos.z * B8_EX_Z;
      const pv = playerPos.x * B8_EV_X + playerPos.z * B8_EV_Z;
      const roomMinU = spec.maxU - 9.4;
      const inRoom = pv <= -200.0 && pu >= roomMinU && pu <= spec.maxU;
      if (inRoom) {
        guideTarget = b8UvToWorld(spec.beaconUv[0], spec.beaconUv[1]);
        guideStepLabel =
          lang === 'vi' ? `Vào vị trí học (${spec.roomCode})` : `Step into ${spec.roomCode}`;
      } else if (pv > -194.5) {
        guideTarget = b8UvToWorld(52.2, -198.4);
        guideStepLabel =
          lang === 'vi' ? `Qua cầu hành lang → ${spec.roomCode}` : `North corridor → ${spec.roomCode}`;
      } else {
        const doorW = roomMinU + 1.1;
        const doorE = spec.maxU - 1.1;
        const doorU = Math.abs(pu - doorW) <= Math.abs(pu - doorE) ? doorW : doorE;
        guideTarget = b8UvToWorld(doorU, -200.0);
        guideStepLabel = lang === 'vi' ? `Cửa phòng ${spec.roomCode}` : `Door ${spec.roomCode}`;
      }
    }
  }

  const dx = guideTarget[0] - playerPos.x;
  const dz = guideTarget[1] - playerPos.z;
  const distMeters = Math.round(Math.hypot(dx, dz));
  const relDeg = normalizeAngleDeg(Math.atan2(dz, dx) - playerYaw);
  const turnText = distMeters <= 2 ? (lang === 'vi' ? 'Ngay trước mặt' : 'Right here') : getTurnText(relDeg, lang);

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

        {/* Mũi tên chỉ đường trực tiếp theo hướng nhìn nhân vật */}
        <div
          className={`mt-2 flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5 ${
            isTransit
              ? 'border-sky-400/40 bg-sky-500/15'
              : 'border-amber-400/40 bg-amber-400/12'
          }`}
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
              isTransit
                ? 'border-sky-300/60 bg-sky-500/25 text-sky-200'
                : 'border-amber-300/70 bg-amber-400/25 text-amber-300'
            }`}
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 transition-transform duration-150 ease-out"
              style={{ transform: `rotate(${Math.round(relDeg)}deg)` }}
            >
              <path
                d="M12 3 L19 19 L12 15.2 L5 19 Z"
                fill="currentColor"
                stroke="#0f172a"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="flex items-center justify-between gap-1 text-[11px] font-bold">
              <span className={isTransit ? 'text-sky-200' : 'text-amber-300'}>{turnText}</span>
              <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                {distMeters} m
              </span>
            </div>
            <div className="mt-0.5 truncate text-[10px] text-slate-300">{guideStepLabel}</div>
          </div>
        </div>

        {stage === 'english-class' && (
          <div className="mt-1.5 text-[10px] text-slate-300">
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
