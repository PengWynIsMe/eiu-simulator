import { useEffect, useState } from 'react';
import { getClassroom, getLesson, getLessons } from '../../data';
import { useLessonStore } from '../../store/useLessonStore';
import { useWalkStore } from '../../store/useWalkStore';
import { TEXT } from '../text';
import { useLessonUi } from './lessonUi';
import MuteButton from './MuteButton';
import ActionPrompt from '../ActionPrompt';

const STORAGE_KEY = 'campussim:lesson-nav-expanded';

/** Thẻ lịch học (pha idle), mở từ nút "Buổi học" ở TopBar. */
export function LessonStarter() {
  const open = useLessonUi((s) => s.scheduleOpen);
  const skin = useWalkStore((s) => s.playerSkin);
  const lesson = getLessons()[0];
  if (!lesson || !open) return null;
  const room = getClassroom(lesson.roomCode);
  const close = () => useLessonUi.getState().closeSchedule();

  const skinBtn = (value: 'player' | 'playerAlt', label: string) => (
    <button
      type="button"
      onClick={() => useWalkStore.getState().setPlayerSkin(value)}
      aria-pressed={skin === value}
      className={`min-h-[40px] flex-1 rounded-lg border-2 text-sm font-medium ${
        skin === value ? 'border-[#0b3d91] bg-[#0b3d91]/10 text-[#0b3d91]' : 'border-slate-200 text-slate-600 hover:border-slate-400'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed left-3 right-3 top-16 z-30 max-h-[calc(100vh-5rem)] space-y-2 overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:left-auto sm:right-4 sm:w-72">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-[#0b3d91]">{lesson.title}</div>
        <MuteButton className="!bg-slate-100" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{lesson.course}</h3>
      <dl className="space-y-0.5 text-sm text-slate-600">
        <div>
          {TEXT.lessonTimePrefix}: <b className="text-slate-800">{lesson.time}</b>
        </div>
        <div>
          {TEXT.lessonRoomPrefix}: <b className="text-slate-800">{room ? `${room.code} · ${room.name}` : lesson.roomCode}</b>
        </div>
        <div>
          {TEXT.lessonTeacherPrefix}: <b className="text-slate-800">{lesson.teacherName}</b>
        </div>
        <div>
          ⏱ {lesson.durationMinutes} {TEXT.lessonDurationUnit}
        </div>
      </dl>
      <div>
        <div className="mb-1 text-xs font-semibold text-slate-500">Nhân vật của bạn</div>
        <div className="flex gap-2">
          {skinBtn('player', '🧑 Nam')}
          {skinBtn('playerAlt', '👩 Nữ')}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            close();
            useLessonStore.getState().startLesson(lesson.id);
          }}
          className="min-h-[44px] flex-1 rounded-xl bg-[#0b3d91] text-sm font-bold text-white hover:brightness-110"
        >
          {TEXT.lessonStart}
        </button>
        <button type="button" onClick={close} className="min-h-[44px] rounded-xl bg-slate-100 px-3 text-sm text-slate-700 hover:bg-slate-200">
          {TEXT.lessonCancel}
        </button>
      </div>
    </div>
  );
}

/** Mũi tên la bàn: Bắc bản đồ = hướng lên màn hình. */
function Compass({ dx, dz, size = 40 }: { dx: number; dz: number; size?: number }) {
  const deg = (Math.atan2(dx, -dz) * 180) / Math.PI;
  return (
    <svg viewBox="0 0 40 40" style={{ width: size, height: size }} className="shrink-0 select-none" aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill="#0b3d91" opacity="0.1" stroke="#0b3d91" strokeWidth="1.5" />
      <text x="20" y="8" textAnchor="middle" fontSize="7" fill="#0b3d91" fontWeight="700">
        B
      </text>
      <g transform={`rotate(${deg} 20 20)`}>
        <path d="M20 9 L26 26 L20 22 L14 26 Z" fill="#f5b700" stroke="#0b3d91" strokeWidth="1.2" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/**
 * Thẻ nhỏ góc trên-trái:
 * - Mặc định gập 1 dòng: phòng · số mét · la bàn.
 * - Mở rộng: lịch học, la bàn lớn, số mét, nút "Tới lớp ngay".
 * - Nhớ trạng thái gập/mở trong localStorage (bọc try/catch).
 */
export default function LessonHud() {
  const lessonId = useLessonStore((s) => s.lessonId);
  const phase = useLessonStore((s) => s.phase);
  const pos = useWalkStore((s) => s.playerPos);
  const [seatPrompt, setSeatPrompt] = useState(false);
  const [expanded, setExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // bỏ qua lỗi storage
      }
      return next;
    });
  };

  const lesson = lessonId ? getLesson(lessonId) : undefined;
  const room = lesson ? getClassroom(lesson.roomCode) : undefined;

  // Hợp đồng với luồng A: window event 'campussim:seat-prompt' { detail: { visible: boolean } }.
  useEffect(() => {
    const on = (e: Event) => setSeatPrompt((e as CustomEvent<{ visible: boolean }>).detail?.visible === true);
    window.addEventListener('campussim:seat-prompt', on);
    return () => window.removeEventListener('campussim:seat-prompt', on);
  }, []);
  useEffect(() => {
    if (phase !== 'findSeat') setSeatPrompt(false);
  }, [phase]);

  if (!lesson || !room) return null;

  const [tx, tz] = room.doorWorld;
  const dx = tx - pos.x;
  const dz = tz - pos.z;
  const distance = Math.round(Math.hypot(dx, dz));
  const wrongFloor = pos.floor !== null && pos.floor !== room.floor;

  return (
    <>
      {phase === 'findSeat' && seatPrompt && (
        <ActionPrompt
          label="Ngồi"
          hotkey="E"
          onAction={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }))}
          touchPosition="bottom-right"
          touchOnly={true}
        />
      )}

      {!expanded ? (
        /* Dạng gập 1 dòng */
        <button
          type="button"
          onClick={toggleExpanded}
          aria-expanded={false}
          className="flex max-w-[calc(100vw-1.5rem)] cursor-pointer select-none items-center gap-2 rounded-xl border border-white/70 bg-white/95 px-3 py-1.5 shadow-lg backdrop-blur-md transition-all hover:bg-white active:scale-95"
          title="Mở rộng"
        >
          <Compass dx={dx} dz={dz} size={24} />
          <span className="truncate max-w-[140px] text-xs font-bold text-[#0b3d91] sm:max-w-[180px]">
            {room.code}
          </span>
          <span className="text-xs font-semibold text-slate-600 border-l border-slate-200 pl-2">
            {distance} m
          </span>
          <span className="text-xs text-slate-400">▾</span>
        </button>
      ) : (
        /* Dạng mở rộng đầy đủ */
        <div className="w-64 space-y-2 rounded-2xl border border-white/70 bg-white/95 p-3.5 shadow-xl backdrop-blur-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm font-semibold text-slate-800">
              {lesson.time} · {lesson.course} · {room.code}
            </div>
            <button
              type="button"
              onClick={toggleExpanded}
              aria-expanded={true}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              title="Thu gọn"
            >
              ▴
            </button>
          </div>

          {phase === 'goToClass' && (
            <>
              <div className="flex items-center gap-3 border-t border-slate-100 pt-2">
                <Compass dx={dx} dz={dz} size={36} />
                <div className="flex-1 text-sm text-slate-600">
                  {TEXT.lessonDistanceLeft} <b className="text-slate-900">{distance} m</b>
                  {wrongFloor && (
                    <div className="text-xs font-semibold text-amber-700">
                      {TEXT.lessonGoToFloor} {room.floor}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => useLessonStore.getState().arriveAtClass()}
                className="min-h-[44px] w-full rounded-xl bg-[#f5b700] text-sm font-bold text-slate-900 shadow hover:brightness-105 active:scale-95"
              >
                {TEXT.lessonArriveNow}
              </button>
            </>
          )}

          {phase === 'findSeat' && (
            <p className="border-t border-slate-100 pt-2 text-sm text-slate-600">
              {TEXT.lessonFindSeatHint}
            </p>
          )}
        </div>
      )}
    </>
  );
}
