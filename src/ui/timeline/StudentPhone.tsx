import { useEffect, useState } from 'react';
import {
  ENGLISH_SCHEDULES,
  getRoomSpecForStage,
  getTimelinePlan,
} from '../../data/timeline/curriculumPlans';
import { getMajorTermActivity } from '../../data/timeline/majorContent';
import { useCampusStore } from '../../store/useCampusStore';
import { useLangStore } from '../../store/useLangStore';
import { useTimelineStore } from '../../store/useTimelineStore';
import { useWalkStore } from '../../store/useWalkStore';
import { UI_TEXT, useT } from '../text';

function formatClock(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function StudentPhone() {
  const tr = useT();
  const lang = useLangStore((s) => s.lang);
  const walkMode = useWalkStore((s) => s.walkMode);
  const selectedBuildingId = useCampusStore((s) => s.selectedBuildingId);

  const phoneOpen = useTimelineStore((s) => s.phoneOpen);
  const setPhoneOpen = useTimelineStore((s) => s.setPhoneOpen);
  const phoneApp = useTimelineStore((s) => s.phoneApp);
  const setPhoneApp = useTimelineStore((s) => s.setPhoneApp);
  const activeTermId = useTimelineStore((s) => s.activeTermId);
  const weekInTerm = useTimelineStore((s) => s.weekInTerm);
  const stage = useTimelineStore((s) => s.stage);
  const englishLevel = useTimelineStore((s) => s.englishLevel);
  const ieltsStatus = useTimelineStore((s) => s.ieltsStatus);
  const ieltsBand = useTimelineStore((s) => s.ieltsBand);
  const selectedMajorId = useTimelineStore((s) => s.selectedMajorId);
  const courseGrades = useTimelineStore((s) => s.courseGrades);
  const completedMoodleIds = useTimelineStore((s) => s.completedMoodleIds);
  const modalOpen = useTimelineStore((s) => s.modalOpen);

  const [moodlePicked, setMoodlePicked] = useState<Record<string, number>>({});
  const [clockText, setClockText] = useState<string>(() => formatClock());

  useEffect(() => {
    if (!phoneOpen) return;
    setClockText(formatClock());
    const id = window.setInterval(() => setClockText(formatClock()), 30_000);
    return () => window.clearInterval(id);
  }, [phoneOpen]);

  // Nhường mép phải cho BuildingPanel hoặc khi đang ngồi học / dùng Desktop ảo
  if (!walkMode && selectedBuildingId) return null;
  if (modalOpen) return null;

  const plan = getTimelinePlan(selectedMajorId);
  const term = plan.terms.find((t) => t.termId === activeTermId) ?? plan.terms[0];
  if (!term) return null;
  const engSched = ENGLISH_SCHEDULES[englishLevel];
  const majorActivity = getMajorTermActivity(activeTermId);
  const roomSpec = getRoomSpecForStage(stage);
  const pendingMoodleCount = majorActivity.moodleTasks.filter(
    (t) => !completedMoodleIds.includes(t.id)
  ).length;

  const earnedCredits = plan.terms
    .flatMap((t) => t.courses)
    .reduce((sum, c) => (c.code in courseGrades && courseGrades[c.code] !== 'D' ? sum + c.credits : sum), 0);
  const creditPercent = Math.min(100, Math.round((earnedCredits / Math.max(1, plan.totalCredits)) * 100));

  const isEnglishPhase =
    term.phase === 'english' ||
    stage === 'placement-written' ||
    stage === 'placement-speaking' ||
    stage === 'english-class' ||
    stage === 'english-exam';

  const handleHomeBarClick = () => {
    if (phoneApp !== 'home') {
      setPhoneApp('home');
    } else {
      setPhoneOpen(false);
    }
  };

  return (
    <>
      {/* Nút icon Điện thoại cố định mép phải */}
      {!phoneOpen && (
        <button
          type="button"
          onClick={() => {
            setPhoneApp('home');
            setPhoneOpen(true);
          }}
          title={tr(UI_TEXT.timelinePhoneTitle)}
          aria-label={tr(UI_TEXT.timelinePhoneTitle)}
          className="pointer-events-auto fixed right-3 top-14 z-40 flex h-12 w-10 items-center justify-center rounded-[13px] border-2 border-slate-500/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white shadow-xl backdrop-blur-md transition hover:scale-105 active:scale-95 sm:right-5 sm:top-20"
        >
          {/* Khung mini giống màn hình điện thoại thật */}
          <span className="flex h-9 w-7 flex-col items-center justify-between rounded-[8px] bg-gradient-to-br from-[#0b3d91] via-sky-700 to-indigo-950 px-1 py-1">
            <span className="h-[2.5px] w-3 rounded-full bg-black/80" />
            <span className="grid grid-cols-2 gap-[2px]">
              <span className="h-1.5 w-1.5 rounded-[2px] bg-sky-300" />
              <span className="h-1.5 w-1.5 rounded-[2px] bg-amber-300" />
              <span className="h-1.5 w-1.5 rounded-[2px] bg-emerald-300" />
              <span className="h-1.5 w-1.5 rounded-[2px] bg-purple-300" />
            </span>
            <span className="h-[2px] w-3 rounded-full bg-white/70" />
          </span>
          {pendingMoodleCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow ring-2 ring-slate-950">
              {pendingMoodleCount}
            </span>
          )}
        </button>
      )}

      {/* Khung Điện thoại thông minh sinh viên EIU */}
      {phoneOpen && (
        <div
          role="dialog"
          aria-label={tr(UI_TEXT.timelinePhoneTitle)}
          className="pointer-events-auto fixed right-3 top-14 z-50 sm:right-5 sm:top-20"
        >
          {/* Nút vật lý cạnh trái (gạt im lặng + tăng/giảm âm lượng) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-[3px] top-[76px] h-6 w-[3px] rounded-l bg-slate-500 shadow"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-[3px] top-[116px] h-11 w-[3px] rounded-l bg-slate-500 shadow"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-[3px] top-[170px] h-11 w-[3px] rounded-l bg-slate-500 shadow"
          />
          {/* Nút nguồn vật lý cạnh phải (bấm để khóa/đóng máy) */}
          <button
            type="button"
            onClick={() => setPhoneOpen(false)}
            aria-label={tr(UI_TEXT.close)}
            title={lang === 'vi' ? 'Khóa màn hình' : 'Lock screen'}
            className="absolute -right-[4px] top-[132px] h-14 w-[4px] rounded-r bg-slate-400 transition hover:bg-sky-300"
          />

          {/* Vỏ khung titanium bo cong + viền kính đen bóng */}
          <div className="rounded-[44px] bg-gradient-to-b from-slate-500 via-slate-700 to-slate-600 p-[3px] shadow-[0_24px_60px_rgba(2,6,23,0.75)]">
            <div className="relative flex h-[min(calc(100dvh-5rem),600px)] w-[min(90vw,308px)] flex-col overflow-hidden rounded-[41px] border-[6px] border-black bg-[#060b18] text-white">
              {/* Hình nền OLED chiều sâu khi ở Home */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden"
              >
                <div className="absolute -left-14 -top-12 h-52 w-52 rounded-full bg-sky-500/25 blur-3xl" />
                <div className="absolute -right-12 top-32 h-56 w-56 rounded-full bg-indigo-500/25 blur-3xl" />
                <div className="absolute -bottom-16 left-8 h-48 w-48 rounded-full bg-amber-400/15 blur-3xl" />
              </div>

              {/* Thanh trạng thái iOS + Dynamic Island */}
              <div className="relative z-10 flex items-center justify-between px-5 pb-1.5 pt-2.5 text-[11px] font-semibold tracking-tight text-white">
                <span className="w-12 tabular-nums">{clockText}</span>

                {/* Dynamic Island */}
                <div className="flex h-[22px] w-[88px] items-center justify-between rounded-full bg-black px-2.5 shadow-inner ring-1 ring-white/10">
                  <span className="flex items-center gap-1">
                    {pendingMoodleCount > 0 && (
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                    )}
                  </span>
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-900 ring-1 ring-sky-400/40">
                    <span className="ml-[3px] mt-[3px] block h-1 w-1 rounded-full bg-sky-300/60" />
                  </span>
                </div>

                {/* Cột sóng 5G + Wi-Fi + Pin */}
                <div className="flex w-12 items-center justify-end gap-1.5">
                  <svg viewBox="0 0 16 12" className="h-2.5 w-3.5 text-white" aria-hidden="true">
                    <rect x="0.5" y="8" width="2.5" height="3.5" rx="0.6" fill="currentColor" />
                    <rect x="4.5" y="5.8" width="2.5" height="5.7" rx="0.6" fill="currentColor" />
                    <rect x="8.5" y="3.2" width="2.5" height="8.3" rx="0.6" fill="currentColor" />
                    <rect x="12.5" y="0.8" width="2.5" height="10.7" rx="0.6" fill="currentColor" />
                  </svg>
                  <svg viewBox="0 0 16 12" className="h-2.5 w-3 text-white" aria-hidden="true">
                    <path
                      d="M8 9.2a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Zm-3.2-1.8a4.7 4.7 0 0 1 6.4 0 .8.8 0 0 1-1.1 1.1 3.1 3.1 0 0 0-4.2 0 .8.8 0 0 1-1.1-1.1Zm-2.6-2.6a8.4 8.4 0 0 1 11.6 0 .8.8 0 0 1-1.1 1.1 6.8 6.8 0 0 0-9.4 0 .8.8 0 0 1-1.1-1.1Z"
                      fill="currentColor"
                    />
                  </svg>
                  <div className="flex items-center" aria-hidden="true">
                    <div className="flex h-[10px] w-[19px] items-center rounded-[3px] border border-white/75 p-[1.5px]">
                      <div className="h-full w-[82%] rounded-[1.5px] bg-emerald-400" />
                    </div>
                    <div className="ml-[1px] h-1 w-[1.5px] rounded-r bg-white/75" />
                  </div>
                </div>
              </div>

              {/* Thanh điều hướng ứng dụng con (khi mở aao.eiu hoặc Moodle) */}
              {phoneApp !== 'home' ? (
                <div className="relative z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/75 px-3.5 py-2 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => setPhoneApp('home')}
                    className="flex items-center gap-0.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300 transition hover:bg-white/20"
                  >
                    <span>‹</span>
                    <span>Home</span>
                  </button>
                  <span className="text-xs font-bold tracking-wide text-white">
                    {phoneApp === 'aao' ? 'aao.eiu' : 'Moodle EIU'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPhoneOpen(false)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] text-slate-300 hover:bg-white/20 hover:text-white"
                    aria-label={tr(UI_TEXT.close)}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="relative z-10 flex items-center justify-between px-4 pb-1 pt-0.5">
                  <span className="text-[10px] font-semibold tracking-wider text-sky-200/80">
                    EIU Student OS
                  </span>
                  <button
                    type="button"
                    onClick={() => setPhoneOpen(false)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] text-slate-200 transition hover:bg-white/20"
                    aria-label={tr(UI_TEXT.close)}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Nội dung màn hình chính / ứng dụng */}
              <div className="relative z-10 flex-1 overflow-y-auto px-3.5 pb-3 pt-2">
                {phoneApp === 'home' && (
                  <div className="flex h-full flex-col justify-between gap-3">
                    <div className="space-y-3.5">
                      {/* Widget Thẻ Sinh viên EIU */}
                      <div className="relative overflow-hidden rounded-[22px] border border-white/20 bg-gradient-to-br from-[#0b3d91]/95 via-sky-700/90 to-indigo-800/95 p-3.5 shadow-lg">
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-100">
                            {lang === 'vi' ? `Kỳ ${activeTermId} · Tuần ${weekInTerm}` : `Term ${activeTermId} · W${weekInTerm}`}
                          </span>
                          <span className="text-[10px] font-semibold text-amber-200">
                            {ieltsStatus === 'none'
                              ? `English Lv.${englishLevel}`
                              : `IELTS ${ieltsBand?.toFixed(1) ?? '6.0'} ✓`}
                          </span>
                        </div>

                        <div className="mt-2 text-sm font-extrabold tracking-tight text-white">
                          {plan.name[lang]}
                        </div>

                        {/* Thanh tiến độ tín chỉ */}
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between text-[10px] text-sky-100/90">
                            <span>{lang === 'vi' ? 'Tiến độ tín chỉ' : 'Credits'}</span>
                            <span className="font-bold">
                              {earnedCredits}/{plan.totalCredits} TC ({creditPercent}%)
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/30">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-300 to-emerald-300 transition-all"
                              style={{ width: `${Math.max(4, creditPercent)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Lưới icon ứng dụng kiểu smartphone (squircle glossy) */}
                      <div className="grid grid-cols-4 gap-x-2 gap-y-3 px-0.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setPhoneApp('aao')}
                          className="group flex flex-col items-center gap-1.5"
                        >
                          <span className="flex h-[54px] w-[54px] items-center justify-center rounded-[15px] bg-gradient-to-br from-sky-400 to-blue-700 text-2xl shadow-lg ring-1 ring-white/25 transition group-hover:scale-105 group-active:scale-95">
                            📅
                          </span>
                          <span className="text-[10px] font-semibold text-white/95">aao.eiu</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPhoneApp('moodle')}
                          className="group relative flex flex-col items-center gap-1.5"
                        >
                          <span className="relative flex h-[54px] w-[54px] items-center justify-center rounded-[15px] bg-gradient-to-br from-amber-400 to-orange-600 text-2xl shadow-lg ring-1 ring-white/25 transition group-hover:scale-105 group-active:scale-95">
                            📚
                            {pendingMoodleCount > 0 && (
                              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow ring-2 ring-[#060b18]">
                                {pendingMoodleCount}
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] font-semibold text-white/95">Moodle</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPhoneOpen(false);
                            useTimelineStore.getState().setTimelineOpen(true);
                          }}
                          className="group flex flex-col items-center gap-1.5"
                        >
                          <span className="flex h-[54px] w-[54px] items-center justify-center rounded-[15px] bg-gradient-to-br from-emerald-400 to-teal-700 text-2xl shadow-lg ring-1 ring-white/25 transition group-hover:scale-105 group-active:scale-95">
                            🗓️
                          </span>
                          <span className="truncate max-w-[60px] text-[10px] font-semibold text-white/95">
                            {lang === 'vi' ? 'Lộ trình' : 'Roadmap'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPhoneOpen(false);
                            useTimelineStore.getState().openIeltsChallenge();
                          }}
                          className="group flex flex-col items-center gap-1.5"
                        >
                          <span className="flex h-[54px] w-[54px] items-center justify-center rounded-[15px] bg-gradient-to-br from-violet-400 to-purple-700 text-2xl shadow-lg ring-1 ring-white/25 transition group-hover:scale-105 group-active:scale-95">
                            📜
                          </span>
                          <span className="text-[10px] font-semibold text-white/95">IELTS 6.0</span>
                        </button>
                      </div>

                      {/* Widget lịch học hôm nay / Thông báo nhanh */}
                      <div className="rounded-[20px] border border-white/12 bg-white/[0.07] p-3 backdrop-blur-md">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-sky-300">
                          <span>{lang === 'vi' ? 'Lịch học hiện tại' : 'Next Class'}</span>
                          <span className="rounded-full bg-sky-400/20 px-1.5 py-0.5 text-[9px] text-sky-200">
                            {roomSpec.roomCode}
                          </span>
                        </div>
                        <div className="mt-1.5 text-xs font-bold text-white">
                          {isEnglishPhase
                            ? `English Level ${englishLevel} (${engSched.shiftLabel[lang]})`
                            : `${majorActivity.featuredCourseCode} · Block 8`}
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-300">
                          <span>⏰ {isEnglishPhase ? engSched.timeText : '08:00 – 11:00'}</span>
                          <button
                            type="button"
                            onClick={() => setPhoneApp('aao')}
                            className="font-semibold text-sky-300 hover:underline"
                          >
                            {lang === 'vi' ? 'Xem lịch ›' : 'Details ›'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Thanh Dock kính mờ dưới cùng giống smartphone thật */}
                    <div className="mx-0.5 mb-0.5 flex items-center justify-around rounded-[24px] border border-white/15 bg-white/10 px-2.5 py-2 backdrop-blur-xl">
                      <button
                        type="button"
                        onClick={() => setPhoneApp('aao')}
                        title="aao.eiu"
                        className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-gradient-to-br from-sky-400 to-blue-700 text-lg shadow transition hover:scale-105 active:scale-95"
                      >
                        📅
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhoneApp('moodle')}
                        title="Moodle"
                        className="relative flex h-11 w-11 items-center justify-center rounded-[13px] bg-gradient-to-br from-amber-400 to-orange-600 text-lg shadow transition hover:scale-105 active:scale-95"
                      >
                        📚
                        {pendingMoodleCount > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                            {pendingMoodleCount}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneOpen(false);
                          useTimelineStore.getState().setTimelineOpen(true);
                        }}
                        title={tr(UI_TEXT.timelineBtn)}
                        className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-gradient-to-br from-emerald-400 to-teal-700 text-lg shadow transition hover:scale-105 active:scale-95"
                      >
                        🗓️
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhoneOpen(false)}
                        title={lang === 'vi' ? 'Cất điện thoại' : 'Close phone'}
                        className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-white/15 text-base font-bold text-white shadow transition hover:bg-rose-500/80 active:scale-95"
                      >
                        ⏻
                      </button>
                    </div>
                  </div>
                )}

                {phoneApp === 'aao' && (
                  <div className="space-y-3 text-xs">
                    <div className="rounded-2xl border border-sky-400/30 bg-sky-500/10 p-3">
                      <div className="font-bold text-sky-300">
                        📅 {lang === 'vi' ? `Thời khóa biểu · Kỳ ${term.termId}` : `Timetable · Term ${term.termId}`}
                      </div>
                      {isEnglishPhase ? (
                        <div className="mt-2 space-y-1 text-slate-200">
                          <div className="font-semibold text-amber-300">
                            English Level {englishLevel} ({engSched.shiftLabel[lang]})
                          </div>
                          <div>⏰ {engSched.timeText}</div>
                          <div>☕ Breaktime: {engSched.breakText}</div>
                          <div>📍 Block 8 — {lang === 'vi' ? 'Phòng 204.B8 / 206.B8' : 'Rooms 204.B8 / 206.B8'}</div>
                        </div>
                      ) : (
                        <div className="mt-2 space-y-1.5">
                          <div className="text-slate-300">
                            • {lang === 'vi' ? 'Lý thuyết (Tuần 1–4): 208.B8 · 08:00–11:00' : 'Theory (W1–4): 208.B8 · 08:00–11:00'}
                          </div>
                          <div className="text-slate-300">
                            • {lang === 'vi' ? 'Thực hành Lab (Tuần 5–9): 406.B8 Tầng 4 · 13:00–16:00' : 'Lab (W5–9): 406.B8 F4 · 13:00–16:00'}
                          </div>
                          <div className="text-slate-300">
                            • {lang === 'vi' ? 'Thi cuối kỳ: Tuần 10' : 'Final Exam: Week 10'}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="mb-1.5 font-bold text-slate-200">
                        {lang === 'vi' ? 'Danh sách môn học kỳ này' : 'Courses this term'}
                      </div>
                      <div className="space-y-1.5">
                        {term.courses.length === 0 ? (
                          <div className="rounded-xl bg-white/5 p-2.5 text-slate-400">
                            {lang === 'vi' ? 'Kỳ tiếng Anh chuyên sâu / Lễ tốt nghiệp.' : 'Intensive English / Graduation.'}
                          </div>
                        ) : (
                          term.courses.map((c) => (
                            <div key={c.code} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-2">
                              <div>
                                <div className="font-mono font-bold text-sky-300">{c.code}</div>
                                <div className="text-[11px] text-slate-200">{c.name[lang]}</div>
                              </div>
                              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                                {courseGrades[c.code] ?? `${c.credits} TC`}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {phoneApp === 'moodle' && (
                  <div className="space-y-3 text-xs">
                    <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3">
                      <div className="font-bold text-amber-300">
                        📚 Moodle — {lang === 'vi' ? 'Bài tập giảng viên giao' : 'Teacher Assignments'}
                      </div>
                      <div className="text-[11px] text-slate-300">
                        {lang === 'vi' ? `Kỳ ${activeTermId} · Hoàn thành để ghi nhận tiến độ` : `Term ${activeTermId}`}
                      </div>
                    </div>

                    {majorActivity.moodleTasks.map((task) => {
                      const done = completedMoodleIds.includes(task.id);
                      const picked = moodlePicked[task.id];
                      return (
                        <div key={task.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] font-bold text-sky-300">{task.courseCode}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                              {done ? (lang === 'vi' ? 'Đã nộp ✓' : 'Submitted ✓') : task.dueLabel[lang]}
                            </span>
                          </div>
                          <div className="mt-1 font-bold text-white">{task.title[lang]}</div>
                          <p className="mt-1 text-[11px] text-slate-300">{task.prompt[lang]}</p>

                          {!done && (
                            <div className="mt-2 space-y-1.5">
                              {task.options.map((opt, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setMoodlePicked((prev) => ({ ...prev, [task.id]: idx }))}
                                  className={`w-full rounded-xl border px-2.5 py-1.5 text-left text-[11px] ${
                                    picked === idx
                                      ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                                      : 'border-white/10 bg-slate-900/60 text-slate-200 hover:bg-white/10'
                                  }`}
                                >
                                  {opt[lang]}
                                </button>
                              ))}
                              <button
                                type="button"
                                disabled={picked === undefined}
                                onClick={() => useTimelineStore.getState().submitMoodleTask(task.id)}
                                className="mt-1 w-full rounded-xl bg-amber-400 py-1.5 text-xs font-bold text-slate-950 disabled:opacity-40"
                              >
                                {lang === 'vi' ? 'Nộp bài lên Moodle' : 'Submit Assignment'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Thanh Home Indicator dưới đáy màn hình */}
              <div className="relative z-10 flex justify-center pb-2 pt-1">
                <button
                  type="button"
                  onClick={handleHomeBarClick}
                  aria-label={phoneApp === 'home' ? tr(UI_TEXT.close) : 'Home'}
                  title={phoneApp === 'home' ? (lang === 'vi' ? 'Đóng điện thoại' : 'Close') : 'Home'}
                  className="h-1 w-28 rounded-full bg-white/75 transition hover:w-32 hover:bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
