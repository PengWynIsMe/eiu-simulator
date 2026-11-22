import { useState } from 'react';
import { getClassroom, getLesson, getLessons } from '../../data';
import { useLessonStore } from '../../store/useLessonStore';
import { useWalkStore } from '../../store/useWalkStore';
import { TEXT } from '../text';

/** Nút nổi + thẻ lịch học (pha idle). */
export function LessonStarter() {
  const [open, setOpen] = useState(false);
  const lesson = getLessons()[0];
  if (!lesson) return null;
  const room = getClassroom(lesson.roomCode);

  return (
    <div className="fixed bottom-40 left-3 z-30 flex flex-col items-start gap-2 md:bottom-20 md:left-5">
      {open && (
        <div className="w-72 space-y-2 rounded-2xl bg-white p-4 shadow-2xl">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#0b3d91]">{lesson.title}</div>
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
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                useLessonStore.getState().startLesson(lesson.id);
              }}
              className="min-h-[44px] flex-1 rounded-xl bg-[#0b3d91] text-sm font-bold text-white hover:brightness-110"
            >
              {TEXT.lessonStart}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="min-h-[44px] rounded-xl bg-slate-100 px-3 text-sm text-slate-700 hover:bg-slate-200">
              {TEXT.lessonCancel}
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="min-h-[44px] rounded-xl bg-[#0b3d91] px-4 text-sm font-semibold text-white shadow-lg hover:brightness-110"
      >
        {TEXT.lessonOpenBtn}: {lesson.course}
      </button>
    </div>
  );
}

/** Mũi tên la bàn: Bắc bản đồ = hướng lên màn hình (chưa có hướng camera trong store). */
function Compass({ dx, dz }: { dx: number; dz: number }) {
  const deg = (Math.atan2(dx, -dz) * 180) / Math.PI;
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0" aria-hidden="true">
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

/** Thẻ nhỏ góc trên-trái: lịch + la bàn (goToClass) hoặc gợi ý ngồi (findSeat). */
export default function LessonHud() {
  const lessonId = useLessonStore((s) => s.lessonId);
  const phase = useLessonStore((s) => s.phase);
  const pos = useWalkStore((s) => s.playerPos);
  const lesson = lessonId ? getLesson(lessonId) : undefined;
  const room = lesson ? getClassroom(lesson.roomCode) : undefined;
  if (!lesson || !room) return null;

  const [tx, tz] = room.doorWorld;
  const dx = tx - pos.x;
  const dz = tz - pos.z;
  const distance = Math.round(Math.hypot(dx, dz));
  const wrongFloor = pos.floor !== null && pos.floor !== room.floor;

  return (
    <div className="w-64 space-y-2 rounded-2xl bg-white/95 p-3 shadow-xl backdrop-blur-sm">
      <div className="text-sm font-semibold text-slate-800">
        {lesson.time} · {lesson.course} · {room.code}
      </div>
      {phase === 'goToClass' && (
        <>
          <div className="flex items-center gap-3">
            <Compass dx={dx} dz={dz} />
            <div className="text-sm text-slate-600">
              {TEXT.lessonDistanceLeft} <b className="text-slate-900">{distance} m</b>
              {wrongFloor && (
                <div className="text-xs text-amber-700">
                  {TEXT.lessonGoToFloor} {room.floor}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => useLessonStore.getState().arriveAtClass()}
            className="min-h-[44px] w-full rounded-xl bg-[#f5b700] text-sm font-bold text-slate-900 hover:brightness-105"
          >
            {TEXT.lessonArriveNow}
          </button>
        </>
      )}
      {phase === 'findSeat' && (
        <>
          <p className="text-sm text-slate-600">{TEXT.lessonFindSeatHint}</p>
          {/* Tạm thời, đến khi scene có ghế 3D tương tác */}
          <button
            type="button"
            onClick={() => useLessonStore.getState().sitDown(room.playerSeat)}
            className="min-h-[44px] w-full rounded-xl bg-[#0b3d91] text-sm font-bold text-white hover:brightness-110"
          >
            {TEXT.lessonSitDown}
          </button>
        </>
      )}
    </div>
  );
}
