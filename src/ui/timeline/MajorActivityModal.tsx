import { useEffect, useMemo, useRef, useState } from 'react';
import { getTimelinePlan } from '../../data/timeline/curriculumPlans';
import { getMajorTermActivity } from '../../data/timeline/majorContent';
import { useTimelineStore, type LetterGrade } from '../../store/useTimelineStore';
import { useLangStore } from '../../store/useLangStore';
import { sfx } from '../audio/sfx';
import { TEXT, UI_TEXT, useT } from '../text';
import { useTrackRightColumn } from '../ActionPrompt';
import DialogueView, { Avatar } from '../lesson/views/DialogueView';
import SlideView from '../lesson/views/SlideView';
import QuestionView from '../lesson/views/QuestionView';
import DesktopView, { type DesktopLabels, type DesktopSlide } from '../desktop/DesktopView';
import CodeLabView, { type CodeLabLabels, type CodeLabRunState } from '../desktop/CodeLabView';

export default function MajorActivityModal() {
  const tr = useT();
  const lang = useLangStore((s) => s.lang);
  const modalOpen = useTimelineStore((s) => s.modalOpen);
  const setModalOpen = useTimelineStore((s) => s.setModalOpen);
  const stage = useTimelineStore((s) => s.stage);
  const activeTermId = useTimelineStore((s) => s.activeTermId);
  const selectedMajorId = useTimelineStore((s) => s.selectedMajorId);
  const courseGrades = useTimelineStore((s) => s.courseGrades);
  const ieltsBand = useTimelineStore((s) => s.ieltsBand);
  const desktopMinimized = useTimelineStore((s) => s.desktopMinimized);
  const setDesktopMinimized = useTimelineStore((s) => s.setDesktopMinimized);

  // State cho buổi học Lý thuyết (dialogue -> lecture -> question -> summary)
  const [theoryStep, setTheoryStep] = useState<'dialogue' | 'lecture' | 'question' | 'summary'>('dialogue');
  const [greetChosenId, setGreetChosenId] = useState<string | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [qChosen, setQChosen] = useState<string | null>(null);
  const [qResult, setQResult] = useState<{ correct: boolean; explain?: string } | null>(null);
  const [stamped, setStamped] = useState(false);

  // State cho phòng Lab tầng 4 (DesktopView + CodeLabView)
  const [exIdx, setExIdx] = useState(0);
  const [codeValue, setCodeValue] = useState('');
  const [runState, setRunState] = useState<CodeLabRunState>('idle');
  const [runId, setRunId] = useState(0);
  const [labResult, setLabResult] = useState<{ correct: boolean; output: string; explain?: string } | null>(null);
  const [hintsShown, setHintsShown] = useState<string[]>([]);
  const [stars, setStars] = useState(3);
  const [revealed, setRevealed] = useState(false);
  const [labDone, setLabDone] = useState(false);
  const compileTimerRef = useRef<number | null>(null);

  // State cho Thi Tuần 10
  const [examQIdx, setExamQIdx] = useState(0);
  const [examAnswers, setExamAnswers] = useState<Record<string, number>>({});
  const [examChoice, setExamChoice] = useState<string | null>(null);
  const [examResult, setExamResult] = useState<{ correct: boolean; explain?: string } | null>(null);
  const [examDoneGrade, setExamDoneGrade] = useState<LetterGrade | null>(null);

  const isMajorStage =
    stage === 'major-theory' ||
    stage === 'major-lab' ||
    stage === 'major-exam' ||
    stage === 'graduation';

  const plan = getTimelinePlan(selectedMajorId);
  const term = plan.terms.find((t) => t.termId === activeTermId) ?? plan.terms[0];
  const activity = useMemo(() => getMajorTermActivity(activeTermId), [activeTermId]);

  const isRightColOpen =
    modalOpen &&
    ((stage === 'major-theory' && (theoryStep === 'lecture' || theoryStep === 'question')) ||
      (stage === 'major-exam' && examDoneGrade === null));
  const rightColRef = useTrackRightColumn(isRightColOpen);

  useEffect(() => {
    if (!modalOpen || !isMajorStage) return;
    if (stage === 'major-theory' || stage === 'major-lab') sfx.bell();
    setTheoryStep('dialogue');
    setGreetChosenId(null);
    setSlideIdx(0);
    setQIdx(0);
    setQChosen(null);
    setQResult(null);
    setStamped(false);

    setExIdx(0);
    setCodeValue('');
    setRunState('idle');
    setLabResult(null);
    setHintsShown([]);
    setStars(3);
    setRevealed(false);
    setLabDone(false);

    setExamQIdx(0);
    setExamAnswers({});
    setExamChoice(null);
    setExamResult(null);
    setExamDoneGrade(null);

    return () => {
      if (compileTimerRef.current !== null) window.clearTimeout(compileTimerRef.current);
    };
  }, [modalOpen, stage, activeTermId, isMajorStage]);

  // Đồng bộ slide lên Màn chiếu 3D trên tường Block 8
  useEffect(() => {
    const ts = useTimelineStore.getState();
    if (!modalOpen || !isMajorStage) return;
    const cover = {
      title: activity.featuredCourseCode,
      subtitle: `${activity.featuredCourseName[lang]} · Kỳ ${activeTermId}`,
    };
    if (stage === 'major-theory' && theoryStep === 'lecture') {
      const s = activity.theorySlides[slideIdx];
      ts.setLiveSlide(s ? { title: s.title[lang], body: s.body[lang], code: s.code } : null, cover);
    } else if (stage === 'major-theory' && theoryStep === 'question') {
      const q = activity.theoryQuiz[qIdx];
      ts.setLiveSlide(q ? { title: activity.featuredCourseCode, body: q.prompt[lang], code: q.code } : null, cover);
    } else {
      ts.setLiveSlide(null, cover);
    }
  }, [modalOpen, isMajorStage, stage, theoryStep, slideIdx, qIdx, activity, activeTermId, lang]);

  // Kích hoạt đóng dấu khi vào màn tổng kết
  useEffect(() => {
    if (!modalOpen) return;
    const isSummary =
      (stage === 'major-theory' && theoryStep === 'summary') ||
      (stage === 'major-lab' && labDone) ||
      (stage === 'major-exam' && examDoneGrade !== null) ||
      stage === 'graduation';
    if (!isSummary) {
      setStamped(false);
      return;
    }
    const id = window.setTimeout(() => setStamped(true), 280);
    return () => window.clearTimeout(id);
  }, [modalOpen, stage, theoryStep, labDone, examDoneGrade]);

  if (!modalOpen || !isMajorStage || !term) return null;

  const closeBar = (
    <button
      type="button"
      onClick={() => setModalOpen(false)}
      className="fixed right-3 top-14 z-50 rounded-xl border border-slate-300 bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-lg hover:bg-slate-50 sm:right-5 sm:top-16"
    >
      ✕ {tr(UI_TEXT.close)}
    </button>
  );

  // 1. LỄ TỐT NGHIỆP (5.4) — Bảng bằng trắng vàng phong cách EIU + Dấu đỏ
  if (stage === 'graduation') {
    const passedCount = Object.values(courseGrades).filter((g) => g !== 'D').length;
    return (
      <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
        <div role="dialog" aria-modal="true" className="w-full max-w-md space-y-4 rounded-2xl border border-amber-200 bg-[#fffdfa] p-6 text-center text-slate-800 shadow-2xl">
          <div className="text-4xl">🎓</div>
          <h2 className="text-xl font-bold text-[#0b3d91]">
            {lang === 'vi' ? 'Lễ Tốt nghiệp EIU — Kỳ Hè Năm 5 (5.4)' : 'EIU Graduation Ceremony (5.4)'}
          </h2>
          <p className="text-sm font-semibold text-slate-600">{plan.name[lang]}</p>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
              <div className="text-slate-500">IELTS</div>
              <div className="mt-0.5 text-base font-bold text-emerald-700">{ieltsBand?.toFixed(1) ?? '6.5'} ✓</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
              <div className="text-slate-500">{lang === 'vi' ? 'Tín chỉ' : 'Credits'}</div>
              <div className="mt-0.5 text-base font-bold text-[#0b3d91]">{plan.totalCredits} TC</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
              <div className="text-slate-500">{lang === 'vi' ? 'Môn đạt' : 'Passed'}</div>
              <div className="mt-0.5 text-base font-bold text-amber-600">{passedCount}</div>
            </div>
          </div>

          <div className="flex justify-center py-1">
            <div
              className={`flex h-28 w-28 items-center justify-center rounded-full border-4 border-red-600 p-2 text-center text-xs font-extrabold uppercase leading-4 text-red-600 transition-all duration-300 ease-out ${
                stamped ? 'opacity-90' : 'opacity-0'
              }`}
              style={{ transform: `rotate(-12deg) scale(${stamped ? 1 : 1.6})` }}
            >
              {lang === 'vi' ? 'TỐT NGHIỆP ĐẠI HỌC EIU' : 'EIU BACHELOR GRADUATE'}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                useTimelineStore.getState().setTimelineOpen(true);
              }}
              className="min-h-[44px] flex-1 rounded-xl bg-[#f5b700] px-4 text-xs font-bold text-slate-900 shadow hover:brightness-105"
            >
              🗓 {tr(UI_TEXT.timelineBtn)}
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="min-h-[44px] flex-1 rounded-xl bg-[#0b3d91] px-4 text-xs font-bold text-white hover:brightness-110"
            >
              {TEXT.summaryBack}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. LÝ THUYẾT CHUYÊN NGÀNH TẠI B8 (208.B8) — Giữ nguyên giao diện Buổi học (DialogueView -> SlideView -> QuestionView -> Summary)
  if (stage === 'major-theory') {
    if (theoryStep === 'dialogue') {
      const replyText = greetChosenId
        ? activity.greeting.options.find((o) => o.id === greetChosenId)?.reply[lang] ?? null
        : null;
      return (
        <>
          {closeBar}
          <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 px-3 sm:bottom-5 sm:px-4">
            <DialogueView
              speakerName={activity.teacherName}
              avatarInitial={activity.teacherName.replace(/^(Thầy|Cô|Ms\.|Mr\.)\s+/i, '').charAt(0).toUpperCase() || 'G'}
              avatarTone="blue"
              text={activity.greeting.text[lang]}
              options={activity.greeting.options.map((o) => ({ id: o.id, text: o.text[lang] }))}
              selectedOptionId={greetChosenId}
              reply={replyText}
              hotkeys={true}
              nextLabel={TEXT.lessonNext}
              onChoose={(id) => {
                setGreetChosenId(id);
                sfx.correct();
              }}
              onNext={() => setTheoryStep('lecture')}
            />
          </div>
        </>
      );
    }

    if (theoryStep === 'lecture') {
      const slide = activity.theorySlides[slideIdx] ?? activity.theorySlides[0];
      if (!slide) return null;
      return (
        <>
          {closeBar}
          <div
            ref={rightColRef}
            className="pointer-events-none fixed bottom-0 inset-x-0 z-40 p-2.5 sm:p-4 sm:landscape:bottom-4 sm:landscape:top-24 sm:landscape:right-4 sm:landscape:left-auto sm:landscape:w-[320px] lg:bottom-4 lg:top-24 lg:right-4 lg:left-auto lg:w-[380px] xl:w-[400px] flex flex-col justify-end"
          >
            <SlideView
              title={slide.title[lang]}
              body={slide.body[lang]}
              code={slide.code}
              slideIndex={slideIdx}
              slideCount={activity.theorySlides.length}
              compact={false}
              zoomInLabel={TEXT.lessonZoomSlide}
              zoomOutLabel={TEXT.lessonMinimizeSlide}
              expandLabel={tr(UI_TEXT.expand)}
              collapseLabel={tr(UI_TEXT.collapse)}
              seeAllLabel={tr(UI_TEXT.seeAll)}
              nextLabel={TEXT.lessonNext}
              onNext={() => {
                if (slideIdx < activity.theorySlides.length - 1) setSlideIdx(slideIdx + 1);
                else setTheoryStep('question');
              }}
            />
          </div>
        </>
      );
    }

    if (theoryStep === 'question') {
      const q = activity.theoryQuiz[qIdx];
      if (!q) return null;
      const correctId = String(q.correctIndex);
      return (
        <>
          {closeBar}
          <div
            ref={rightColRef}
            className="pointer-events-none fixed bottom-0 inset-x-0 z-40 p-2.5 sm:p-4 sm:landscape:bottom-4 sm:landscape:top-24 sm:landscape:right-4 sm:landscape:left-auto sm:landscape:w-[320px] lg:bottom-4 lg:top-24 lg:right-4 lg:left-auto lg:w-[380px] xl:w-[400px] flex flex-col justify-end"
          >
            <QuestionView
              speakerName={activity.teacherName}
              prompt={`${qIdx + 1}/${activity.theoryQuiz.length} · ${q.prompt[lang]}`}
              code={q.code}
              options={q.options.map((o, i) => ({ id: String(i), text: o[lang] }))}
              chosenId={qChosen}
              result={qResult ? { ...qResult, correctAnswerId: correctId } : null}
              hotkeys={true}
              nextLabel={TEXT.lessonNext}
              onChoose={(id) => {
                setQChosen(id);
                const ok = id === correctId;
                if (ok) sfx.correct();
                else sfx.wrong();
                setQResult({ correct: ok, explain: ok ? q.explainCorrect[lang] : q.explainWrong[lang] });
              }}
              onRetry={() => {
                setQChosen(null);
                setQResult(null);
              }}
              onNext={() => {
                if (qIdx < activity.theoryQuiz.length - 1) {
                  setQIdx(qIdx + 1);
                  setQChosen(null);
                  setQResult(null);
                } else {
                  sfx.bell();
                  setTheoryStep('summary');
                }
              }}
            />
          </div>
        </>
      );
    }

    return (
      <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6">
        <div className="pointer-events-auto max-h-[92vh] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl bg-white p-6 text-center shadow-2xl">
          <h2 className="text-xl font-bold text-[#0b3d91]">
            {lang === 'vi' ? `Hoàn thành Lý thuyết ${activity.featuredCourseCode}!` : `${activity.featuredCourseCode} Theory Complete!`}
          </h2>
          <div className="text-4xl tracking-widest text-[#f5b700]">★★★</div>
          <div className="flex justify-center py-1">
            <div
              className={`flex h-28 w-28 items-center justify-center rounded-full border-4 border-red-600 p-2 text-center text-xs font-extrabold uppercase leading-4 text-red-600 transition-all duration-300 ease-out ${
                stamped ? 'opacity-90' : 'opacity-0'
              }`}
              style={{ transform: `rotate(-12deg) scale(${stamped ? 1 : 1.6})` }}
            >
              {lang === 'vi' ? 'ĐẠT LÝ THUYẾT BLOCK 8' : 'B8 THEORY PASSED'}
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-left">
            <Avatar name={activity.teacherName} />
            <p className="text-sm leading-6 text-slate-700">
              {lang === 'vi'
                ? 'Làm tốt lắm! Giờ hãy di chuyển lên phòng Lab 406.B8 tầng 4 để thực hành lập trình trên máy tính ảo nhé.'
                : 'Well done! Head up to Floor 4 Computer Lab (406.B8) for your coding lab.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => useTimelineStore.getState().completeMajorTheory()}
            className="min-h-[44px] w-full rounded-xl bg-[#f5b700] px-6 text-sm font-bold text-slate-900 shadow hover:brightness-105"
          >
            {lang === 'vi' ? 'Lên Lab Tầng 4 (406.B8) →' : 'Go to Floor 4 Lab (406.B8) →'}
          </button>
        </div>
      </div>
    );
  }

  // 3. THỰC HÀNH TẦNG 4 (406.B8) — MÁY TÍNH ẢO EIU DESKTOP + CODE LAB IDE CỦA ĐỒNG NGHIỆP
  if (stage === 'major-lab') {
    if (labDone) {
      return (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6">
          <div className="pointer-events-auto w-full max-w-md space-y-4 rounded-2xl bg-white p-6 text-center shadow-2xl">
            <h2 className="text-xl font-bold text-[#0b3d91]">
              {lang === 'vi' ? `Hoàn thành Thực hành Lab 406.B8!` : `Lab 406.B8 Complete!`}
            </h2>
            <div className="text-4xl tracking-widest" aria-label={`${stars}/3`}>
              {[0, 1, 2].map((i) => (
                <span key={i} className={i < stars ? 'text-[#f5b700]' : 'text-slate-300'}>
                  {i < stars ? '★' : '☆'}
                </span>
              ))}
            </div>
            <div className="flex justify-center py-1">
              <div
                className={`flex h-28 w-28 items-center justify-center rounded-full border-4 border-red-600 p-2 text-center text-xs font-extrabold uppercase leading-4 text-red-600 transition-all duration-300 ease-out ${
                  stamped ? 'opacity-90' : 'opacity-0'
                }`}
                style={{ transform: `rotate(-12deg) scale(${stamped ? 1 : 1.6})` }}
              >
                {lang === 'vi' ? 'HOÀN THÀNH LAB TẦNG 4' : 'FLOOR 4 LAB PASSED'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => useTimelineStore.getState().completeMajorLab()}
              className="min-h-[44px] w-full rounded-xl bg-[#0b3d91] px-6 text-sm font-bold text-white hover:brightness-110"
            >
              {lang === 'vi' ? 'Chuẩn bị Thi Cuối kỳ Tuần 10 →' : 'Proceed to Week 10 Final Exam →'}
            </button>
          </div>
        </div>
      );
    }

    const ex = activity.codeExercises[exIdx] ?? activity.codeExercises[0];
    if (!ex) return null;

    const desktopLabels: DesktopLabels = {
      loginStudentId: TEXT.desktopLoginStudentId,
      loginPassword: TEXT.desktopLoginPassword,
      loginBtn: TEXT.desktopLoginBtn,
      loggingIn: TEXT.desktopLoggingIn,
      studentName: TEXT.desktopStudentName,
      codeLabApp: TEXT.desktopCodeLab,
      slidesApp: TEXT.desktopSlides,
      trashApp: TEXT.desktopTrash,
      trashEmpty: TEXT.desktopTrashEmpty,
      noLecture: TEXT.desktopNoLecture,
      slideLabel: TEXT.lessonSlideLabel,
      minimize: TEXT.desktopMinimize,
      close: TEXT.desktopClose,
      hideTip: TEXT.desktopHideTip,
    };

    const codeLabLabels: CodeLabLabels = {
      hintBtn: TEXT.codeHint,
      hintCost: TEXT.codeHintCost,
      blankLabel: TEXT.codeBlankLabel,
      runBtn: TEXT.codeRun,
      outputTitle: TEXT.codeOutput,
      compiling: TEXT.codeCompiling,
      outputEmpty: TEXT.codeOutputEmpty,
      revealBtn: lang === 'vi' ? 'Xem gợi ý đáp án' : 'Reveal solution',
      simNote: `Lab 406.B8 · ${activity.featuredCourseCode}`,
    };

    const desktopSlides: DesktopSlide[] = activity.theorySlides.map((s) => ({
      title: s.title[lang],
      body: s.body[lang],
      code: s.code,
    }));

    const handleRunCode = () => {
      setRunState('compiling');
      setLabResult(null);
      if (compileTimerRef.current !== null) window.clearTimeout(compileTimerRef.current);
      compileTimerRef.current = window.setTimeout(() => {
        const cleaned = codeValue.trim();
        const ok = ex.answers.includes(cleaned);
        if (ok) sfx.correct();
        else sfx.wrong();
        setRunState('shown');
        setRunId((n) => n + 1);
        setLabResult({
          correct: ok,
          output: ok ? ex.outputCorrect : ex.outputWrong,
          explain: ok ? undefined : ex.explainWrong[lang],
        });
      }, 450);
    };

    const handleNextExercise = () => {
      if (exIdx < activity.codeExercises.length - 1) {
        setExIdx(exIdx + 1);
        setCodeValue('');
        setRunState('idle');
        setLabResult(null);
        setHintsShown([]);
        setRevealed(false);
      } else {
        sfx.bell();
        setLabDone(true);
      }
    };

    return (
      <>
        {desktopMinimized && (
          <>
            {closeBar}
            <div className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 select-none">
              <button
                type="button"
                onClick={() => setDesktopMinimized(false)}
                className="flex min-h-[46px] items-center gap-2 rounded-2xl bg-[#0b3d91] px-5 py-2.5 text-sm font-bold text-white shadow-2xl transition hover:brightness-110 active:scale-95"
              >
                <span>{TEXT.lessonReopenDesktop}</span>
              </button>
            </div>
          </>
        )}
        <div className={desktopMinimized ? 'hidden' : 'fixed inset-0 z-50 sm:p-6 bg-slate-950/40 backdrop-blur-[2px]'}>
          <DesktopView
            labels={desktopLabels}
            slides={desktopSlides}
            locale={lang === 'en' ? 'en-US' : 'vi-VN'}
            exitSlot={
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded bg-rose-600/90 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-500"
              >
                {TEXT.lessonExitYes}
              </button>
            }
            codeContent={
              <CodeLabView
                key={ex.id}
                title={ex.title[lang]}
                instruction={ex.instruction[lang]}
                template={ex.template}
                value={codeValue}
                runState={runState}
                runId={runId}
                result={labResult}
                hints={hintsShown}
                revealed={revealed}
                nextLabel={exIdx < activity.codeExercises.length - 1 ? TEXT.codeNextExercise : TEXT.codeSubmit}
                labels={codeLabLabels}
                starsSlot={
                  <span className="shrink-0 text-xs text-amber-400">
                    {'★'.repeat(stars)}{'☆'.repeat(3 - stars)}
                  </span>
                }
                onChange={(v) => {
                  setCodeValue(v);
                  if (runState === 'shown') setRunState('idle');
                }}
                onRun={handleRunCode}
                onRequestHint={() => {
                  if (hintsShown.length === 0) {
                    setStars((s) => Math.max(1, s - 1));
                    setHintsShown([ex.hint[lang]]);
                  }
                }}
                onReveal={() => {
                  setRevealed(true);
                  setCodeValue(ex.answers[0] ?? '');
                  setLabResult({ correct: true, output: ex.outputCorrect });
                  setRunState('shown');
                }}
                onNext={handleNextExercise}
              />
            }
          />
        </div>
      </>
    );
  }

  // 4. THI CUỐI KỲ TUẦN 10 — Dùng QuestionView cột phải với cảnh lớp học 3D trực tiếp
  if (examDoneGrade !== null) {
    return (
      <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6">
        <div className="pointer-events-auto w-full max-w-md space-y-4 rounded-2xl bg-white p-6 text-center shadow-2xl">
          <h2 className="text-xl font-bold text-[#0b3d91]">
            {lang === 'vi' ? `Kết quả Thi Học kỳ ${activeTermId}` : `Term ${activeTermId} Final Result`}
          </h2>
          <div className="text-4xl font-black text-emerald-600">{examDoneGrade}</div>
          <p className="text-xs text-slate-600">
            {lang === 'vi'
              ? `Các môn đã ghi nhận điểm ${examDoneGrade}: ${term.courses.map((c) => c.code).join(', ')}`
              : `Grades recorded (${examDoneGrade}): ${term.courses.map((c) => c.code).join(', ')}`}
          </p>
          <div className="flex justify-center py-1">
            <div
              className={`flex h-28 w-28 items-center justify-center rounded-full border-4 border-red-600 p-2 text-center text-xs font-extrabold uppercase leading-4 text-red-600 transition-all duration-300 ease-out ${
                stamped ? 'opacity-90' : 'opacity-0'
              }`}
              style={{ transform: `rotate(-12deg) scale(${stamped ? 1 : 1.6})` }}
            >
              {lang === 'vi' ? `QUA KỲ ${activeTermId}` : `TERM ${activeTermId} PASS`}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const nextGrades: Record<string, LetterGrade> = {};
              term.courses.forEach((c) => {
                nextGrades[c.code] = examDoneGrade;
              });
              useTimelineStore.getState().completeMajorExam(nextGrades);
            }}
            className="min-h-[44px] w-full rounded-xl bg-[#f5b700] px-6 text-sm font-bold text-slate-900 shadow hover:brightness-105"
          >
            {lang === 'vi' ? 'Qua học kỳ tiếp theo →' : 'Next Semester →'}
          </button>
        </div>
      </div>
    );
  }

  const eq = activity.examQuestions[examQIdx];
  if (!eq) return null;
  const correctEqId = String(eq.correctIndex);

  return (
    <>
      {closeBar}
      <div
        ref={rightColRef}
        className="pointer-events-none fixed bottom-0 inset-x-0 z-40 p-2.5 sm:p-4 sm:landscape:bottom-4 sm:landscape:top-24 sm:landscape:right-4 sm:landscape:left-auto sm:landscape:w-[320px] lg:bottom-4 lg:top-24 lg:right-4 lg:left-auto lg:w-[380px] xl:w-[400px] flex flex-col justify-end"
      >
        <QuestionView
          speakerName={activity.teacherName}
          prompt={`Thi Tuần 10 (${examQIdx + 1}/${activity.examQuestions.length}) · ${eq.prompt[lang]}`}
          options={eq.options.map((o, i) => ({ id: String(i), text: o[lang] }))}
          chosenId={examChoice}
          result={examResult ? { ...examResult, correctAnswerId: correctEqId } : null}
          hotkeys={true}
          nextLabel={examQIdx < activity.examQuestions.length - 1 ? TEXT.lessonNext : TEXT.codeSubmit}
          onChoose={(id) => {
            setExamChoice(id);
            const idx = Number(id);
            setExamAnswers((prev) => ({ ...prev, [eq.id]: idx }));
            const ok = id === correctEqId;
            if (ok) sfx.correct();
            else sfx.wrong();
            setExamResult({ correct: ok, explain: ok ? eq.explainCorrect[lang] : eq.explainWrong[lang] });
          }}
          onRetry={() => {
            setExamChoice(null);
            setExamResult(null);
          }}
          onNext={() => {
            if (examQIdx < activity.examQuestions.length - 1) {
              setExamQIdx(examQIdx + 1);
              setExamChoice(null);
              setExamResult(null);
            } else {
              const score = activity.examQuestions.reduce(
                (s, item) => (examAnswers[item.id] === item.correctIndex ? s + 1 : s),
                0,
              );
              sfx.bell();
              setExamDoneGrade(score >= 4 ? 'A' : score >= 3 ? 'B' : 'C');
            }
          }}
        />
      </div>
    </>
  );
}
