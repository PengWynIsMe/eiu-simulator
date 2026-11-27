import { useState } from 'react';
import { ALL_TIMELINE_PLANS, ENGLISH_SCHEDULES, getTimelinePlan, type TimelineTerm } from '../../data/timeline/curriculumPlans';
import { useTimelineStore } from '../../store/useTimelineStore';
import { useLangStore } from '../../store/useLangStore';
import { UI_TEXT, useT } from '../text';

export default function TimelineMenuModal() {
  const tr = useT();
  const lang = useLangStore((s) => s.lang);
  const timelineOpen = useTimelineStore((s) => s.timelineOpen);
  const setTimelineOpen = useTimelineStore((s) => s.setTimelineOpen);
  const selectedMajorId = useTimelineStore((s) => s.selectedMajorId);
  const setSelectedMajorId = useTimelineStore((s) => s.setSelectedMajorId);
  const activeTermId = useTimelineStore((s) => s.activeTermId);
  const ieltsStatus = useTimelineStore((s) => s.ieltsStatus);
  const ieltsBand = useTimelineStore((s) => s.ieltsBand);
  const courseGrades = useTimelineStore((s) => s.courseGrades);

  const [yearTab, setYearTab] = useState<1 | 2 | 3 | 4 | 5>(1);

  if (!timelineOpen) return null;

  const plan = getTimelinePlan(selectedMajorId);
  const yearTerms = plan.terms.filter((t) => t.year === yearTab);

  const earnedCredits = plan.terms
    .flatMap((t) => t.courses)
    .reduce((sum, c) => (c.code in courseGrades && courseGrades[c.code] !== 'D' ? sum + c.credits : sum), 0);

  const handleJumpTerm = (term: TimelineTerm) => {
    const ts = useTimelineStore.getState();
    if (term.phase === 'graduation') {
      ts.jumpToMilestone({ stage: 'graduation', termId: '5.4' });
    } else if (term.phase === 'english') {
      ts.jumpToMilestone({
        stage: 'english-class',
        termId: term.termId,
        englishLevel: term.englishLevel ?? 1,
      });
    } else {
      ts.jumpToMilestone({ stage: 'major-theory', termId: term.termId });
    }
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 backdrop-blur-sm sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tr(UI_TEXT.timelineTitle)}
        className="flex h-[min(94vh,780px)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-slate-900 text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3 sm:px-6">
          <div>
            <h2 className="text-base font-bold sm:text-xl">🗓 {tr(UI_TEXT.timelineTitle)}</h2>
            <p className="text-xs text-slate-300">{tr(UI_TEXT.timelineSubtitle)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
              {ieltsStatus === 'none'
                ? 'IELTS: Chưa có (cần 6.0)'
                : `IELTS ${ieltsBand?.toFixed(1) ?? '6.0'} ✓`}
            </span>
            <span className="rounded-full border border-sky-400/35 bg-sky-500/15 px-3 py-1 text-xs font-bold text-sky-300">
              {earnedCredits}/{plan.totalCredits} TC
            </span>
            <button
              type="button"
              onClick={() => setTimelineOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm hover:bg-white/20"
              aria-label={tr(UI_TEXT.close)}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Hàng hành động nhanh + Chọn ngành đào tạo */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-slate-950/50 px-4 py-2.5 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => useTimelineStore.getState().startFreshman()}
              className="rounded-full bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow hover:bg-amber-300"
            >
              {tr(UI_TEXT.timelineStartFresher)}
            </button>
            <button
              type="button"
              onClick={() => useTimelineStore.getState().openIeltsChallenge()}
              className="rounded-full bg-sky-500 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-sky-400"
            >
              {tr(UI_TEXT.timelineTakeIeltsNow)}
            </button>
            <button
              type="button"
              onClick={() => useTimelineStore.getState().jumpToMilestone({ stage: 'graduation', termId: '5.4' })}
              className="rounded-full border border-emerald-400/50 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30"
            >
              {tr(UI_TEXT.timelineViewGrad)}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="timeline-major-select" className="text-xs font-semibold text-slate-300">
              {lang === 'vi' ? 'Chương trình:' : 'Program:'}
            </label>
            <select
              id="timeline-major-select"
              value={selectedMajorId}
              onChange={(e) => setSelectedMajorId(e.target.value)}
              className="rounded-xl border border-white/20 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white"
            >
              {ALL_TIMELINE_PLANS.map((p) => (
                <option key={p.majorId} value={p.majorId}>
                  {p.name[lang]} ({p.totalCredits} TC){p.majorId === 'ktpm' ? ' · ★ 3D Full' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 5 Giai đoạn (Năm 1 → Năm 5) */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-white/10 px-4 py-2.5 sm:px-6">
          {([1, 2, 3, 4, 5] as const).map((y) => {
            const label =
              y === 1
                ? lang === 'vi'
                  ? 'Năm 1 · Tiếng Anh Lv1–4 + Đại cương'
                  : 'Year 1 · English Lv1–4 + GenEd'
                : y === 2
                  ? lang === 'vi'
                    ? 'Năm 2 · Lv5 / IELTS + Cơ sở ngành'
                    : 'Year 2 · Lv5 / IELTS + Core'
                  : y === 5
                    ? lang === 'vi'
                      ? 'Năm 5 · Đồ án & Tốt nghiệp'
                      : 'Year 5 · Capstone & Graduation'
                    : lang === 'vi'
                      ? `Năm ${y} · Chuyên ngành`
                      : `Year ${y} · Major`;
            return (
              <button
                key={y}
                type="button"
                onClick={() => setYearTab(y)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  yearTab === y
                    ? 'bg-white text-slate-950 shadow'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Lưới 4 học kỳ của năm đang chọn */}
        <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-4 md:grid-cols-2 lg:grid-cols-4 sm:p-6">
          {yearTerms.map((term) => {
            const isCurrent = term.termId === activeTermId;
            const engSched = term.englishLevel ? ENGLISH_SCHEDULES[term.englishLevel] : null;
            return (
              <div
                key={term.termId}
                className={`flex flex-col justify-between rounded-2xl border p-3.5 ${
                  isCurrent
                    ? 'border-amber-400/70 bg-amber-500/10'
                    : term.isSummer
                      ? 'border-sky-400/25 bg-slate-950/60'
                      : 'border-white/15 bg-white/5'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-lg bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-amber-300">
                      {lang === 'vi' ? `Kỳ ${term.termId}` : `Term ${term.termId}`}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-300">
                      {term.totalCredits > 0 ? `${term.totalCredits} TC` : term.phase === 'graduation' ? '🎓' : '0 TC'}
                    </span>
                  </div>

                  <div className="mt-1.5 text-xs font-bold text-white">
                    {term.phase === 'graduation'
                      ? tr(UI_TEXT.timelineViewGrad)
                      : term.isSummer
                        ? tr(UI_TEXT.timelineSummerBadge)
                        : tr(UI_TEXT.timelineMainTerm, { n: term.semesterInYear })}
                  </div>

                  {engSched && (
                    <div className="mt-2 rounded-xl border border-sky-400/30 bg-sky-500/10 p-2 text-[11px]">
                      <div className="font-bold text-sky-300">
                        English Level {engSched.level} · {engSched.shiftLabel[lang]}
                      </div>
                      <div className="text-slate-200">{engSched.timeText}</div>
                      <div className="text-slate-400">Break: {engSched.breakText}</div>
                    </div>
                  )}

                  {term.phase === 'graduation' && (
                    <div className="mt-2 rounded-xl border border-emerald-400/30 bg-emerald-500/15 p-2.5 text-xs text-emerald-200">
                      {lang === 'vi'
                        ? 'Hoàn tất toàn bộ chuyên ngành ở Kỳ 3 năm cuối (5.3) và tham dự Lễ Tốt nghiệp tại Kỳ Hè (5.4).'
                        : 'Complete all major requirements by Term 5.3 and celebrate Graduation in Summer Term 5.4.'}
                    </div>
                  )}

                  <div className="mt-2.5 space-y-1.5">
                    {term.courses.length === 0 && term.phase !== 'graduation' && (
                      <p className="text-[11px] italic text-slate-400">
                        {term.isSummer
                          ? lang === 'vi'
                            ? 'Học kỳ hè tự chọn (không bắt buộc đăng ký môn).'
                            : 'Optional summer term.'
                          : lang === 'vi'
                            ? 'Tập trung hoàn thành Tiếng Anh.'
                            : 'Focused English term.'}
                      </p>
                    )}

                    {term.courses.map((c) => {
                      const grade = courseGrades[c.code];
                      return (
                        <div key={c.code} className="rounded-xl border border-white/10 bg-slate-950/65 p-2 text-[11px]">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono font-bold text-sky-300">{c.code}</span>
                            <div className="flex items-center gap-1">
                              {grade && (
                                <span className="rounded bg-emerald-500/25 px-1.5 font-bold text-emerald-300">
                                  {grade}
                                </span>
                              )}
                              <span className="text-slate-400">{c.credits} TC</span>
                            </div>
                          </div>
                          <div className="mt-0.5 font-medium text-slate-100">{c.name[lang]}</div>
                          {c.prereqs.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              <span className="text-[10px] text-amber-300/90">
                                {lang === 'vi' ? 'Tiên quyết:' : 'Prereq:'} {c.prereqs.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => handleJumpTerm(term)}
                    className="w-full rounded-xl bg-amber-400 px-3 py-2 text-xs font-bold text-slate-950 shadow hover:bg-amber-300"
                  >
                    {tr(UI_TEXT.timelineJumpBtn)}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-slate-950/50 px-4 py-2 text-[11px] text-slate-400 sm:px-6">
          {tr(UI_TEXT.timelineNursingNote)}
        </div>
      </div>
    </div>
  );
}
