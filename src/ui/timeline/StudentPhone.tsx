import { useState } from 'react';
import { ENGLISH_SCHEDULES, getTimelinePlan } from '../../data/timeline/curriculumPlans';
import { getMajorTermActivity } from '../../data/timeline/majorContent';
import { useTimelineStore } from '../../store/useTimelineStore';
import { useWalkStore } from '../../store/useWalkStore';
import { useCampusStore } from '../../store/useCampusStore';
import { useLangStore } from '../../store/useLangStore';
import { UI_TEXT, useT } from '../text';

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
  const stage = useTimelineStore((s) => s.stage);
  const englishLevel = useTimelineStore((s) => s.englishLevel);
  const ieltsStatus = useTimelineStore((s) => s.ieltsStatus);
  const ieltsBand = useTimelineStore((s) => s.ieltsBand);
  const selectedMajorId = useTimelineStore((s) => s.selectedMajorId);
  const courseGrades = useTimelineStore((s) => s.courseGrades);
  const completedMoodleIds = useTimelineStore((s) => s.completedMoodleIds);
  const modalOpen = useTimelineStore((s) => s.modalOpen);

  const [moodlePicked, setMoodlePicked] = useState<Record<string, number>>({});

  // Nhường mép phải cho BuildingPanel hoặc khi đang ngồi học / dùng Desktop ảo
  if (!walkMode && selectedBuildingId) return null;
  if (modalOpen) return null;

  const plan = getTimelinePlan(selectedMajorId);
  const term = plan.terms.find((t) => t.termId === activeTermId) ?? plan.terms[0];
  if (!term) return null;
  const engSched = ENGLISH_SCHEDULES[englishLevel];
  const majorActivity = getMajorTermActivity(activeTermId);
  const pendingMoodleCount = majorActivity.moodleTasks.filter((t) => !completedMoodleIds.includes(t.id)).length;

  const earnedCredits = plan.terms
    .flatMap((t) => t.courses)
    .reduce((sum, c) => (c.code in courseGrades && courseGrades[c.code] !== 'D' ? sum + c.credits : sum), 0);

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
          className="pointer-events-auto fixed right-3 top-14 z-40 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/30 bg-slate-950/85 text-xl text-white shadow-xl backdrop-blur-md transition hover:scale-105 active:scale-95 sm:right-5 sm:top-20 sm:h-12 sm:w-12"
        >
          <span>📱</span>
          {pendingMoodleCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow">
              {pendingMoodleCount}
            </span>
          )}
        </button>
      )}

      {/* Khung Điện thoại sinh viên */}
      {phoneOpen && (
        <div
          role="dialog"
          aria-label={tr(UI_TEXT.timelinePhoneTitle)}
          className="pointer-events-auto fixed right-3 top-14 z-50 flex max-h-[calc(100dvh-4.5rem)] w-[min(92vw,340px)] flex-col overflow-hidden rounded-[28px] border-4 border-slate-700 bg-slate-950 text-white shadow-2xl sm:right-5 sm:top-20"
        >
          {/* Thanh trạng thái trên cùng */}
          <div className="flex items-center justify-between border-b border-white/10 bg-slate-900 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-2">
              {phoneApp !== 'home' && (
                <button
                  type="button"
                  onClick={() => setPhoneApp('home')}
                  className="rounded-lg bg-white/10 px-2 py-0.5 text-[11px] font-bold hover:bg-white/20"
                >
                  ‹ Home
                </button>
              )}
              <span className="font-bold text-sky-300">
                {phoneApp === 'aao' ? 'aao.eiu' : phoneApp === 'moodle' ? 'Moodle EIU' : 'EIU Student OS'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPhoneOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs hover:bg-white/20"
              aria-label={tr(UI_TEXT.close)}
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {phoneApp === 'home' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0b3d91] to-sky-700 p-3.5 shadow">
                  <div className="text-[11px] uppercase tracking-wider text-sky-200">
                    {lang === 'vi' ? `Kỳ ${activeTermId} · Tuần ${useTimelineStore.getState().weekInTerm}` : `Term ${activeTermId}`}
                  </div>
                  <div className="mt-0.5 text-sm font-bold">{plan.name[lang]}</div>
                  <div className="mt-2 flex items-center justify-between text-xs text-sky-100">
                    <span>{ieltsStatus === 'none' ? `English Lv.${englishLevel}` : `IELTS ${ieltsBand?.toFixed(1) ?? '6.0'} ✓`}</span>
                    <span>{earnedCredits}/{plan.totalCredits} TC</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPhoneApp('aao')}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-sky-400/30 bg-sky-500/15 p-3.5 text-center transition hover:bg-sky-500/25"
                  >
                    <span className="text-2xl">📅</span>
                    <span className="text-xs font-bold text-sky-200">aao.eiu</span>
                    <span className="text-[10px] text-slate-300">
                      {lang === 'vi' ? 'Thời khóa biểu & Điểm' : 'Timetable & Grades'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPhoneApp('moodle')}
                    className="relative flex flex-col items-center gap-1.5 rounded-2xl border border-amber-400/30 bg-amber-500/15 p-3.5 text-center transition hover:bg-amber-500/25"
                  >
                    {pendingMoodleCount > 0 && (
                      <span className="absolute right-2 top-2 rounded-full bg-rose-500 px-1.5 text-[10px] font-bold">
                        {pendingMoodleCount}
                      </span>
                    )}
                    <span className="text-2xl">📚</span>
                    <span className="text-xs font-bold text-amber-200">Moodle</span>
                    <span className="text-[10px] text-slate-300">
                      {lang === 'vi' ? 'Bài tập giảng viên' : 'Assignments'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPhoneOpen(false);
                      useTimelineStore.getState().setTimelineOpen(true);
                    }}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-emerald-400/30 bg-emerald-500/15 p-3.5 text-center transition hover:bg-emerald-500/25"
                  >
                    <span className="text-2xl">🗓️</span>
                    <span className="text-xs font-bold text-emerald-200">{tr(UI_TEXT.timelineBtn)}</span>
                    <span className="text-[10px] text-slate-300">
                      {lang === 'vi' ? 'Chọn mốc học tập' : 'Switch Milestone'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPhoneOpen(false);
                      useTimelineStore.getState().openIeltsChallenge();
                    }}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-purple-400/30 bg-purple-500/15 p-3.5 text-center transition hover:bg-purple-500/25"
                  >
                    <span className="text-2xl">📜</span>
                    <span className="text-xs font-bold text-purple-200">IELTS 6.0</span>
                    <span className="text-[10px] text-slate-300">
                      {lang === 'vi' ? 'Đăng ký thi chứng chỉ' : 'Take IELTS Exam'}
                    </span>
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
                  {term.phase === 'english' || stage === 'placement-written' || stage === 'placement-speaking' || stage === 'english-class' || stage === 'english-exam' ? (
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
        </div>
      )}
    </>
  );
}
