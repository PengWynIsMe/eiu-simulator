import { useEffect, useMemo, useState } from 'react';
import {
  ENGLISH_LEVEL_LESSONS,
  EXAM_LISTENING_SPEECH_TEXT,
  getExamDataset,
  PLACEMENT_LISTENING_QUESTIONS,
  PLACEMENT_LISTENING_SCRIPT,
  PLACEMENT_READING_PASSAGE,
  PLACEMENT_READING_QUESTIONS,
  PLACEMENT_SPEAKING_QUESTIONS,
  PLACEMENT_SPEAKING_WARMUP,
} from '../../data/timeline/englishContent';
import { ENGLISH_SCHEDULES } from '../../data/timeline/curriculumPlans';
import { useTimelineStore, type LetterGrade } from '../../store/useTimelineStore';
import { useLangStore } from '../../store/useLangStore';
import { sfx } from '../audio/sfx';
import { TEXT, UI_TEXT, useT } from '../text';
import { useTrackRightColumn } from '../ActionPrompt';
import DialogueView, { Avatar } from '../lesson/views/DialogueView';
import SlideView from '../lesson/views/SlideView';
import QuestionView from '../lesson/views/QuestionView';

function speakEnglish(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  } catch {
    // Bỏ qua nếu trình duyệt không hỗ trợ TTS
  }
}

function ratioToLetter(ratio: number): LetterGrade {
  if (ratio >= 0.85) return 'A';
  if (ratio >= 0.7) return 'B';
  if (ratio >= 0.5) return 'C';
  return 'D';
}

function ratioToBand(ratio: number): number {
  const raw = 3.5 + ratio * 5.0;
  return Math.round(raw * 2) / 2;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function EnglishActivityModal() {
  const tr = useT();
  const lang = useLangStore((s) => s.lang);
  const modalOpen = useTimelineStore((s) => s.modalOpen);
  const setModalOpen = useTimelineStore((s) => s.setModalOpen);
  const stage = useTimelineStore((s) => s.stage);
  const englishLevel = useTimelineStore((s) => s.englishLevel);
  const englishSession = useTimelineStore((s) => s.englishSession);
  const placementWrittenScore = useTimelineStore((s) => s.placementWrittenScore);

  const isEnglishStage =
    stage === 'placement-written' ||
    stage === 'placement-speaking' ||
    stage === 'english-class' ||
    stage === 'english-exam' ||
    stage === 'ielts-exam';

  const [tab, setTab] = useState<'reading' | 'listening' | 'writing' | 'speaking'>('reading');
  const [showScript, setShowScript] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [writingTexts, setWritingTexts] = useState<Record<number, string>>({});
  const [speakingChoices, setSpeakingChoices] = useState<Record<number, number>>({});

  // State cho Speaking 1:1 theo lượt đối thoại với Giáo viên 3D
  const [spTurn, setSpTurn] = useState<'warmup' | 'q1' | 'q2' | 'done'>('warmup');
  const [warmupIdx, setWarmupIdx] = useState<number | null>(null);
  const [assignedLevel, setAssignedLevel] = useState<1 | 2>(1);

  // State cho Lớp Tiếng Anh theo luồng DialogueView -> SlideView -> QuestionView -> Summary
  const [classStep, setClassStep] = useState<'dialogue' | 'lecture' | 'question' | 'summary'>('dialogue');
  const [greetOptionId, setGreetOptionId] = useState<string | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [breakTaken, setBreakTaken] = useState(false);
  const [qChosenId, setQChosenId] = useState<string | null>(null);
  const [qResult, setQResult] = useState<{ correct: boolean; explain?: string } | null>(null);
  const [stamped, setStamped] = useState(false);

  const [examResult, setExamResult] = useState<{
    grades: [LetterGrade, LetterGrade, LetterGrade, LetterGrade];
    dCount: number;
    passed: boolean;
    band?: number;
  } | null>(null);

  const isRightColOpen =
    modalOpen &&
    ((stage === 'placement-speaking' && (spTurn === 'q1' || spTurn === 'q2')) ||
      (stage === 'english-class' && (classStep === 'lecture' || classStep === 'question')));
  const rightColRef = useTrackRightColumn(isRightColOpen);

  useEffect(() => {
    if (!modalOpen || !isEnglishStage) return;
    if (stage === 'english-class') sfx.bell();
    setTab('reading');
    setShowScript(false);
    setAnswers({});
    setWritingTexts({});
    setSpeakingChoices({});
    setSpTurn('warmup');
    setWarmupIdx(null);
    setClassStep('dialogue');
    setGreetOptionId(null);
    setSlideIdx(0);
    setBreakTaken(false);
    setQChosenId(null);
    setQResult(null);
    setExamResult(null);
    setStamped(false);
  }, [modalOpen, isEnglishStage, stage, englishLevel, englishSession]);

  const lessonContent = ENGLISH_LEVEL_LESSONS.find((l) => l.level === englishLevel) ?? ENGLISH_LEVEL_LESSONS[0];
  const sched = ENGLISH_SCHEDULES[englishLevel];

  // Đồng bộ slide lớp Tiếng Anh lên Màn chiếu 3D trong phòng 204.B8
  useEffect(() => {
    const ts = useTimelineStore.getState();
    if (!modalOpen || !isEnglishStage || !lessonContent) return;
    const cover = {
      title: `English Level ${englishLevel}`,
      subtitle: `${sched.shiftLabel[lang]} · ${sched.timeText}`,
    };
    if (stage === 'english-class' && classStep === 'lecture') {
      const s = lessonContent.slides[slideIdx];
      ts.setLiveSlide(s ? { title: s.title[lang], body: s.body[lang], code: s.code } : null, cover);
    } else if (stage === 'english-class' && classStep === 'question') {
      ts.setLiveSlide({ title: `Level ${englishLevel} Quick Check`, body: lessonContent.quickCheck.prompt[lang] }, cover);
    } else if (stage === 'placement-speaking') {
      ts.setLiveSlide(null, { title: 'English Placement 1:1', subtitle: 'Room 210.B8 · Speaking Interview' });
    } else {
      ts.setLiveSlide(null, cover);
    }
  }, [modalOpen, isEnglishStage, stage, classStep, slideIdx, englishLevel, sched, lessonContent, lang]);

  useEffect(() => {
    if (!modalOpen) return;
    const isSummary =
      (stage === 'english-class' && classStep === 'summary') ||
      (stage === 'placement-speaking' && spTurn === 'done') ||
      ((stage === 'english-exam' || stage === 'ielts-exam') && examResult !== null);
    if (!isSummary) {
      setStamped(false);
      return;
    }
    const id = window.setTimeout(() => setStamped(true), 280);
    return () => window.clearTimeout(id);
  }, [modalOpen, stage, classStep, spTurn, examResult]);

  const examData = useMemo(
    () => getExamDataset(stage === 'ielts-exam' ? 'ielts' : 'level', englishLevel),
    [stage, englishLevel],
  );

  if (!modalOpen || !isEnglishStage || !lessonContent) return null;

  const closeBar = (
    <button
      type="button"
      onClick={() => setModalOpen(false)}
      className="fixed right-3 top-14 z-50 rounded-xl border border-slate-300 bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-lg hover:bg-slate-50 sm:right-5 sm:top-16"
    >
      ✕ {tr(UI_TEXT.close)}
    </button>
  );

  // 1. TEST ĐẦU VÀO PHẦN VIẾT (206.B8): Paper trắng EIU gọn sạch
  if (stage === 'placement-written') {
    const writingWords = countWords(writingTexts[0] ?? '');
    const handleSubmitPlacementWritten = () => {
      const rScore = PLACEMENT_READING_QUESTIONS.reduce((s, q) => (answers[q.id] === q.correctIndex ? s + 1 : s), 0);
      const lScore = PLACEMENT_LISTENING_QUESTIONS.reduce((s, q) => (answers[q.id] === q.correctIndex ? s + 1 : s), 0);
      sfx.correct();
      useTimelineStore.getState().completePlacementWritten({
        reading: rScore,
        listening: lScore,
        writingPassed: writingWords >= 3,
      });
    };

    return (
      <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6">
        <div role="dialog" aria-modal="true" className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-amber-200/80 bg-[#fffdfa] text-slate-800 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 bg-[#0b3d91] px-5 py-3.5 text-white">
            <div>
              <h2 className="text-base font-bold sm:text-lg">
                📝 {lang === 'vi' ? 'Kiểm tra Tiếng Anh Đầu vào — Phòng 206.B8' : 'English Placement Test — Room 206.B8'}
              </h2>
              <p className="text-xs text-sky-100">
                {lang === 'vi' ? 'Hoàn thành Reading (5), Listening (5), Writing đơn giản → Sang phòng 210.B8 Speaking 1:1.' : 'Complete Reading (5), Listening (5), and simple Writing → Room 210.B8 Speaking.'}
              </p>
            </div>
            <button type="button" onClick={() => setModalOpen(false)} className="h-8 w-8 rounded-full bg-white/15 text-sm hover:bg-white/25" aria-label={tr(UI_TEXT.close)}>✕</button>
          </div>

          <div className="flex gap-2 border-b border-slate-200 bg-slate-50 px-5 py-2.5">
            {(['reading', 'listening', 'writing'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-full px-3.5 py-1 text-xs font-bold capitalize ${tab === t ? 'bg-[#0b3d91] text-white shadow' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5 text-sm">
            {tab === 'reading' && (
              <>
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-xs leading-relaxed text-slate-700">
                  {PLACEMENT_READING_PASSAGE[lang]}
                </div>
                {PLACEMENT_READING_QUESTIONS.map((q) => (
                  <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                    <div className="font-semibold text-[#0b3d91]">{q.prompt[lang]}</div>
                    <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                      {q.options.map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAnswers((p) => ({ ...p, [q.id]: idx }))}
                          className={`rounded-xl border-2 px-3 py-2 text-left text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b3d91] ${answers[q.id] === idx ? 'border-[#0b3d91] bg-[#0b3d91] text-white' : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-sky-400 hover:bg-sky-50'}`}
                        >
                          {opt[lang]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            {tab === 'listening' && (
              <>
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                  <button
                    type="button"
                    onClick={() => speakEnglish(PLACEMENT_LISTENING_SCRIPT)}
                    className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-500"
                  >
                    🔊 {lang === 'vi' ? 'Nghe đoạn audio hướng dẫn' : 'Play Orientation Audio'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScript((v) => !v)}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {showScript ? (lang === 'vi' ? 'Ẩn lời thoại' : 'Hide Script') : (lang === 'vi' ? 'Hiện lời thoại hỗ trợ' : 'Show Transcript')}
                  </button>
                  {showScript && <p className="mt-2 w-full text-xs italic text-slate-700">{PLACEMENT_LISTENING_SCRIPT}</p>}
                </div>
                {PLACEMENT_LISTENING_QUESTIONS.map((q) => (
                  <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                    <div className="font-semibold text-[#0b3d91]">{q.prompt[lang]}</div>
                    <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                      {q.options.map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAnswers((p) => ({ ...p, [q.id]: idx }))}
                          className={`rounded-xl border-2 px-3 py-2 text-left text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b3d91] ${answers[q.id] === idx ? 'border-[#0b3d91] bg-[#0b3d91] text-white' : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-sky-400 hover:bg-sky-50'}`}
                        >
                          {opt[lang]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            {tab === 'writing' && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="font-semibold text-[#0b3d91]">
                  {lang === 'vi'
                    ? 'Writing đơn giản: Viết ít nhất 5 chữ mô tả trường EIU bằng tiếng Anh (chấm thoáng cho tân sinh viên):'
                    : 'Simple Writing: Write at least 5 English words describing EIU:'}
                </div>
                <textarea
                  rows={4}
                  value={writingTexts[0] ?? ''}
                  onChange={(e) => setWritingTexts({ 0: e.target.value })}
                  placeholder="EIU is a green modern university with friendly teachers and smart labs."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-[#0b3d91]"
                />
                <div className="text-xs font-semibold text-emerald-700">
                  {lang === 'vi' ? `Số từ hiện tại: ${writingWords} từ` : `Word count: ${writingWords} words`}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3">
            <span className="text-xs text-slate-500">
              {lang === 'vi' ? 'Nộp xong sẽ chuyển tới mốc sáng phòng 210.B8 Speaking 1:1' : 'Next: Speaking 1:1 in 210.B8'}
            </span>
            <button
              type="button"
              onClick={handleSubmitPlacementWritten}
              className="rounded-xl bg-[#f5b700] px-5 py-2 text-xs font-bold text-slate-900 shadow hover:brightness-105"
            >
              {lang === 'vi' ? 'Nộp 3 kỹ năng → Sang phòng Speaking' : 'Submit → Go to Speaking'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. SPEAKING ĐẦU VÀO 1:1 TRONG PHÒNG 210.B8 (Gặp mặt Giáo viên 3D trực tiếp)
  if (stage === 'placement-speaking') {
    if (spTurn === 'warmup') {
      return (
        <>
          {closeBar}
          <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 px-3 sm:bottom-5 sm:px-4">
            <DialogueView
              speakerName="Ms. Sarah (210.B8)"
              avatarInitial="S"
              avatarTone="blue"
              text={PLACEMENT_SPEAKING_WARMUP.teacherSay[lang]}
              options={PLACEMENT_SPEAKING_WARMUP.options.map((opt, idx) => ({ id: String(idx), text: opt[lang] }))}
              selectedOptionId={warmupIdx !== null ? String(warmupIdx) : null}
              reply={warmupIdx !== null ? (lang === 'vi' ? 'Rất tốt! Giờ cô hỏi em 2 câu phân cấp Level 1 và Level 2 nhé.' : 'Nice! Now let me ask 2 placement questions.') : null}
              hotkeys={true}
              nextLabel={TEXT.lessonNext}
              onChoose={(id) => {
                setWarmupIdx(Number(id));
                sfx.correct();
              }}
              onNext={() => setSpTurn('q1')}
            />
          </div>
        </>
      );
    }

    if (spTurn === 'q1' || spTurn === 'q2') {
      const idx = spTurn === 'q1' ? 0 : 1;
      const pq = PLACEMENT_SPEAKING_QUESTIONS[idx];
      if (!pq) return null;
      const chosen = speakingChoices[idx];

      const handlePick = (optIdx: number) => {
        setSpeakingChoices((p) => ({ ...p, [idx]: optIdx }));
        const tier = pq.options[optIdx]?.tier;
        if (tier === 'wrong') sfx.wrong();
        else sfx.correct();
      };

      const handleAdvance = () => {
        if (spTurn === 'q1') {
          setSpTurn('q2');
        } else {
          const q1Tier = PLACEMENT_SPEAKING_QUESTIONS[0]?.options[speakingChoices[0] ?? 0]?.tier ?? 'wrong';
          const q2Tier = PLACEMENT_SPEAKING_QUESTIONS[1]?.options[speakingChoices[1] ?? 0]?.tier ?? 'wrong';
          const written = placementWrittenScore ?? { reading: 3, listening: 3, writingPassed: true };
          const lv2Count = (q1Tier === 'lv2' ? 1 : 0) + (q2Tier === 'lv2' ? 1 : 0);
          const lv: 1 | 2 = lv2Count === 2 || (written.reading + written.listening >= 8 && lv2Count >= 1) ? 2 : 1;
          setAssignedLevel(lv);
          sfx.bell();
          setSpTurn('done');
        }
      };

      return (
        <>
          {closeBar}
          <div
            ref={rightColRef}
            className="pointer-events-none fixed bottom-0 inset-x-0 z-40 p-2.5 sm:p-4 sm:landscape:bottom-4 sm:landscape:top-24 sm:landscape:right-4 sm:landscape:left-auto sm:landscape:w-[340px] lg:bottom-4 lg:top-24 lg:right-4 lg:left-auto lg:w-[400px] flex flex-col justify-end"
          >
            <div className="pointer-events-auto max-h-[55vh] sm:max-h-[82vh] w-full space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <Avatar name="Sarah" size="sm" />
                <div>
                  <div className="text-xs font-bold text-[#0b3d91]">Ms. Sarah · Speaking 1:1</div>
                  <p className="text-xs text-slate-700 sm:text-sm">{pq.teacherPrompt[lang]}</p>
                </div>
              </div>
              <div className="grid gap-1.5">
                {pq.options.map((opt, oi) => (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => handlePick(oi)}
                    className={`rounded-xl border-2 px-3 py-2 text-left text-xs font-medium transition ${
                      chosen === oi
                        ? 'border-[#0b3d91] bg-[#0b3d91] text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-sky-400'
                    }`}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
              {chosen !== undefined && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAdvance}
                    className="min-h-[40px] rounded-xl bg-[#f5b700] px-5 text-xs font-bold text-slate-900 shadow hover:brightness-105"
                  >
                    {spTurn === 'q1' ? TEXT.lessonNext : (lang === 'vi' ? 'Nhận kết quả xếp lớp ›' : 'See Placement ›')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      );
    }

    const assignedSched = ENGLISH_SCHEDULES[assignedLevel];
    return (
      <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6">
        <div className="pointer-events-auto w-full max-w-md space-y-4 rounded-2xl bg-white p-6 text-center shadow-2xl">
          <h2 className="text-xl font-bold text-[#0b3d91]">
            {lang === 'vi' ? `Kết quả Xếp lớp: English Level ${assignedLevel}` : `Placement Result: English Level ${assignedLevel}`}
          </h2>
          <p className="text-xs text-slate-600">
            ⏰ {assignedSched.shiftLabel[lang]} ({assignedSched.timeText}) · ☕ Break: {assignedSched.breakText}
          </p>
          <div className="flex justify-center py-1">
            <div
              className={`flex h-28 w-28 items-center justify-center rounded-full border-4 border-red-600 p-2 text-center text-xs font-extrabold uppercase leading-4 text-red-600 transition-all duration-300 ease-out ${
                stamped ? 'opacity-90' : 'opacity-0'
              }`}
              style={{ transform: `rotate(-12deg) scale(${stamped ? 1 : 1.6})` }}
            >
              {`ENGLISH LEVEL ${assignedLevel}`}
            </div>
          </div>
          <button
            type="button"
            onClick={() => useTimelineStore.getState().completePlacementSpeaking(assignedLevel)}
            className="min-h-[44px] w-full rounded-xl bg-[#f5b700] px-6 text-sm font-bold text-slate-900 shadow hover:brightness-105"
          >
            {lang === 'vi' ? `Vào lớp Level ${assignedLevel} ngay →` : `Enter Level ${assignedLevel} Class →`}
          </button>
        </div>
      </div>
    );
  }

  // 3. LỚP HỌC TIẾNG ANH LEVEL 1..5 TRONG PHÒNG 204.B8 (DialogueView -> SlideView + Màn chiếu 3D -> QuestionView -> Summary)
  if (stage === 'english-class') {
    if (classStep === 'dialogue') {
      const replyText = greetOptionId
        ? lessonContent.greeting.options.find((o) => o.id === greetOptionId)?.reply[lang] ?? null
        : null;
      return (
        <>
          {closeBar}
          <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 px-3 sm:bottom-5 sm:px-4">
            <DialogueView
              speakerName={lessonContent.teacherName}
              avatarInitial="S"
              avatarTone="blue"
              text={lessonContent.greeting.text[lang]}
              options={lessonContent.greeting.options.map((o) => ({ id: o.id, text: o.text[lang] }))}
              selectedOptionId={greetOptionId}
              reply={replyText}
              hotkeys={true}
              nextLabel={TEXT.lessonNext}
              onChoose={(id) => {
                setGreetOptionId(id);
                sfx.correct();
              }}
              onNext={() => setClassStep('lecture')}
            />
          </div>
        </>
      );
    }

    if (classStep === 'lecture') {
      const slide = lessonContent.slides[slideIdx] ?? lessonContent.slides[0];
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
              body={`${englishSession === 1 ? lessonContent.session1Text[lang] : lessonContent.session2Text[lang]}\n\n${slide.body[lang]}`}
              code={slide.code}
              slideIndex={slideIdx}
              slideCount={lessonContent.slides.length}
              compact={false}
              zoomInLabel={TEXT.lessonZoomSlide}
              zoomOutLabel={TEXT.lessonMinimizeSlide}
              expandLabel={tr(UI_TEXT.expand)}
              collapseLabel={tr(UI_TEXT.collapse)}
              seeAllLabel={tr(UI_TEXT.seeAll)}
              nextLabel={TEXT.lessonNext}
              extraAction={
                <button
                  type="button"
                  onClick={() => setBreakTaken(true)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold ${breakTaken ? 'bg-emerald-100 text-emerald-800' : 'border border-amber-300 bg-amber-50 text-amber-900'}`}
                >
                  {breakTaken ? '☕ ✓ 30p' : '☕ Nghỉ 30p'}
                </button>
              }
              onNext={() => {
                if (slideIdx < lessonContent.slides.length - 1) setSlideIdx(slideIdx + 1);
                else setClassStep('question');
              }}
            />
          </div>
        </>
      );
    }

    if (classStep === 'question') {
      const qc = lessonContent.quickCheck;
      const correctId = String(qc.correctIndex);
      return (
        <>
          {closeBar}
          <div
            ref={rightColRef}
            className="pointer-events-none fixed bottom-0 inset-x-0 z-40 p-2.5 sm:p-4 sm:landscape:bottom-4 sm:landscape:top-24 sm:landscape:right-4 sm:landscape:left-auto sm:landscape:w-[320px] lg:bottom-4 lg:top-24 lg:right-4 lg:left-auto lg:w-[380px] xl:w-[400px] flex flex-col justify-end"
          >
            <QuestionView
              speakerName={lessonContent.teacherName}
              prompt={qc.prompt[lang]}
              options={qc.options.map((o, i) => ({ id: String(i), text: o[lang] }))}
              chosenId={qChosenId}
              result={qResult ? { ...qResult, correctAnswerId: correctId } : null}
              hotkeys={true}
              nextLabel={TEXT.lessonNext}
              onChoose={(id) => {
                setQChosenId(id);
                const ok = id === correctId;
                if (ok) sfx.correct();
                else sfx.wrong();
                setQResult({ correct: ok, explain: ok ? qc.explainCorrect[lang] : qc.explainWrong[lang] });
              }}
              onRetry={() => {
                setQChosenId(null);
                setQResult(null);
              }}
              onNext={() => {
                sfx.bell();
                setClassStep('summary');
              }}
            />
          </div>
        </>
      );
    }

    return (
      <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6">
        <div className="pointer-events-auto w-full max-w-md space-y-4 rounded-2xl bg-white p-6 text-center shadow-2xl">
          <h2 className="text-xl font-bold text-[#0b3d91]">
            {lang === 'vi'
              ? `Hoàn thành Buổi ${englishSession}/2 · Level ${englishLevel}!`
              : `English Level ${englishLevel} Session ${englishSession}/2 Done!`}
          </h2>
          <p className="text-xs text-slate-600">⏰ {sched.shiftLabel[lang]} ({sched.timeText})</p>
          <div className="flex justify-center py-1">
            <div
              className={`flex h-28 w-28 items-center justify-center rounded-full border-4 border-red-600 p-2 text-center text-xs font-extrabold uppercase leading-4 text-red-600 transition-all duration-300 ease-out ${
                stamped ? 'opacity-90' : 'opacity-0'
              }`}
              style={{ transform: `rotate(-12deg) scale(${stamped ? 1 : 1.6})` }}
            >
              {`LEVEL ${englishLevel} · B${englishSession}`}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => useTimelineStore.getState().completeEnglishSession()}
              className="min-h-[44px] w-full rounded-xl bg-[#f5b700] px-6 text-sm font-bold text-slate-900 shadow hover:brightness-105"
            >
              {englishSession === 1
                ? (lang === 'vi' ? 'Sang Buổi học 2 →' : 'Proceed to Session 2 →')
                : (lang === 'vi' ? 'Vào Thi Cuối kỳ Level →' : 'Take Level Final Exam →')}
            </button>
            <button
              type="button"
              onClick={() => useTimelineStore.getState().openIeltsChallenge()}
              className="min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-[#0b3d91] hover:bg-slate-50"
            >
              📜 {lang === 'vi' ? 'Đăng ký thi IELTS 6.0 sớm' : 'Challenge IELTS 6.0 Early'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4 & 5. THI CUỐI KỲ LEVEL (7R / 7L / 2W / 2S) HOẶC THI IELTS 6.0 (10R / 10L / 3W / 3S) — Paper trắng chuẩn học vụ EIU
  const isIelts = stage === 'ielts-exam';

  const handleGradeExam = () => {
    const rCorrect = examData.reading.reduce((s, q, i) => (answers[`r-${i}`] === q.correctIndex ? s + 1 : s), 0);
    const lCorrect = examData.listening.reduce((s, q, i) => (answers[`l-${i}`] === q.correctIndex ? s + 1 : s), 0);
    const wPassCount = examData.writing.reduce((s, _, i) => (countWords(writingTexts[i] ?? '') >= 4 ? s + 1 : s), 0);
    const sGrades = examData.speaking.map((sp, i) => sp.options[speakingChoices[i] ?? -1]?.grade ?? 'D');
    const sScoreAvg = sGrades.reduce((s, g) => s + (g === 'A' ? 1 : g === 'B' ? 0.8 : g === 'C' ? 0.6 : 0.3), 0) / sGrades.length;

    const rRatio = rCorrect / examData.reading.length;
    const lRatio = lCorrect / examData.listening.length;
    const wRatio = wPassCount / examData.writing.length;
    const grades: [LetterGrade, LetterGrade, LetterGrade, LetterGrade] = [
      ratioToLetter(rRatio),
      ratioToLetter(lRatio),
      ratioToLetter(wRatio),
      ratioToLetter(sScoreAvg),
    ];
    const dCount = grades.filter((g) => g === 'D').length;

    if (isIelts) {
      const avgBand = Math.round(((ratioToBand(rRatio) + ratioToBand(lRatio) + ratioToBand(wRatio) + ratioToBand(sScoreAvg)) / 4) * 2) / 2;
      if (avgBand >= 6.0) sfx.correct();
      else sfx.wrong();
      setExamResult({ grades, dCount, passed: avgBand >= 6.0, band: avgBand });
    } else {
      const passed = dCount < 2;
      if (passed) sfx.correct();
      else sfx.wrong();
      setExamResult({ grades, dCount, passed });
    }
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6">
      <div role="dialog" aria-modal="true" className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-amber-200/80 bg-[#fffdfa] text-slate-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#0b3d91] px-5 py-3.5 text-white">
          <div>
            <h2 className="text-base font-bold sm:text-lg">
              {isIelts
                ? '📜 Kỳ thi Chứng chỉ IELTS 6.0 (10R · 10L · 3W · 3S)'
                : `🎓 Thi Cuối kỳ Tiếng Anh Level ${englishLevel} (7R · 7L · 2W · 2S)`}
            </h2>
            <p className="text-xs text-sky-100">
              {isIelts
                ? (lang === 'vi' ? 'Đạt trung bình ≥ 6.0 để nhận chứng chỉ và vào học chuyên ngành IT.' : 'Overall ≥ 6.0 certifies you for IT Major.')
                : (lang === 'vi' ? 'Điểm theo A / B / C / D. Nhận ≥ 2 điểm D sẽ rớt và học lại Level.' : 'Graded A/B/C/D. ≥ 2 D grades means retake.')}
            </p>
          </div>
          <button type="button" onClick={() => setModalOpen(false)} className="h-8 w-8 rounded-full bg-white/15 text-sm hover:bg-white/25" aria-label={tr(UI_TEXT.close)}>✕</button>
        </div>

        {examResult ? (
          <div className="space-y-4 p-6 text-center">
            <h3 className="text-xl font-bold text-[#0b3d91]">
              {isIelts
                ? `IELTS Overall Band: ${examResult.band?.toFixed(1)}`
                : examResult.passed
                  ? (lang === 'vi' ? `ĐẠT KỲ THI LEVEL ${englishLevel}!` : `PASSED LEVEL ${englishLevel}!`)
                  : (lang === 'vi' ? `CHƯA ĐẠT (Nhận ${examResult.dCount} điểm D)` : `NOT PASSED (${examResult.dCount} D grades)`)}
            </h3>
            <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
              {(['Reading', 'Listening', 'Writing', 'Speaking'] as const).map((label, idx) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] text-slate-500">{label}</div>
                  <div className={`mt-1 text-xl font-black ${examResult.grades[idx] === 'D' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {examResult.grades[idx]}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center py-1">
              <div
                className={`flex h-24 w-24 items-center justify-center rounded-full border-4 p-2 text-center text-xs font-extrabold uppercase leading-4 transition-all duration-300 ease-out ${
                  examResult.passed ? 'border-emerald-600 text-emerald-700' : 'border-red-600 text-red-600'
                } ${stamped ? 'opacity-90' : 'opacity-0'}`}
                style={{ transform: `rotate(-12deg) scale(${stamped ? 1 : 1.6})` }}
              >
                {examResult.passed ? (isIelts ? 'IELTS PASSED' : 'LEVEL PASS') : 'RETAKE'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isIelts) useTimelineStore.getState().completeIeltsExam(examResult.band ?? 5.5);
                else useTimelineStore.getState().completeEnglishExam(examResult.passed);
              }}
              className="rounded-xl bg-[#f5b700] px-6 py-2.5 text-sm font-bold text-slate-900 shadow hover:brightness-105"
            >
              {examResult.passed ? (lang === 'vi' ? 'Tiếp tục lộ trình →' : 'Continue →') : (lang === 'vi' ? 'Quay lại ôn tập' : 'Back to Class')}
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 px-5 py-2.5">
              {(['reading', 'listening', 'writing', 'speaking'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-full px-3.5 py-1 text-xs font-bold capitalize ${tab === t ? 'bg-[#0b3d91] text-white shadow' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
                >
                  {t} ({t === 'reading' ? examData.reading.length : t === 'listening' ? examData.listening.length : t === 'writing' ? examData.writing.length : examData.speaking.length})
                </button>
              ))}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5 text-sm">
              {tab === 'reading' &&
                examData.reading.map((q, i) => (
                  <div key={`r-${i}`} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                    <div className="font-semibold text-[#0b3d91]">{i + 1}. {q.prompt[lang]}</div>
                    <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                      {q.options.map((opt, oi) => (
                        <button
                          key={oi}
                          type="button"
                          onClick={() => setAnswers((p) => ({ ...p, [`r-${i}`]: oi }))}
                          className={`rounded-xl border-2 px-3 py-2 text-left text-xs font-medium ${answers[`r-${i}`] === oi ? 'border-[#0b3d91] bg-[#0b3d91] text-white' : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-sky-400'}`}
                        >
                          {opt[lang]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

              {tab === 'listening' && (
                <>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <button
                      type="button"
                      onClick={() => speakEnglish(EXAM_LISTENING_SPEECH_TEXT)}
                      className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-500"
                    >
                      🔊 {lang === 'vi' ? 'Phát đoạn Listening' : 'Play Listening Audio'}
                    </button>
                  </div>
                  {examData.listening.map((q, i) => (
                    <div key={`l-${i}`} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                      <div className="font-semibold text-[#0b3d91]">{i + 1}. {q.prompt[lang]}</div>
                      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                        {q.options.map((opt, oi) => (
                          <button
                            key={oi}
                            type="button"
                            onClick={() => setAnswers((p) => ({ ...p, [`l-${i}`]: oi }))}
                            className={`rounded-xl border-2 px-3 py-2 text-left text-xs font-medium ${answers[`l-${i}`] === oi ? 'border-[#0b3d91] bg-[#0b3d91] text-white' : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-sky-400'}`}
                          >
                            {opt[lang]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {tab === 'writing' &&
                examData.writing.map((wp, i) => (
                  <div key={`w-${i}`} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                    <div className="font-semibold text-[#0b3d91]">{i + 1}. {wp[lang]}</div>
                    <textarea
                      rows={3}
                      value={writingTexts[i] ?? ''}
                      onChange={(e) => setWritingTexts((p) => ({ ...p, [i]: e.target.value }))}
                      placeholder="Write your short English answer..."
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 outline-none focus:border-[#0b3d91]"
                    />
                  </div>
                ))}

              {tab === 'speaking' &&
                examData.speaking.map((sp, i) => (
                  <div key={`s-${i}`} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                    <div className="font-semibold text-[#0b3d91]">{i + 1}. {sp.prompt[lang]}</div>
                    <div className="mt-2 grid gap-1.5">
                      {sp.options.map((opt, oi) => (
                        <button
                          key={oi}
                          type="button"
                          onClick={() => setSpeakingChoices((p) => ({ ...p, [i]: oi }))}
                          className={`rounded-xl border-2 px-3 py-2 text-left text-xs font-medium ${speakingChoices[i] === oi ? 'border-[#0b3d91] bg-[#0b3d91] text-white' : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-sky-400'}`}
                        >
                          {opt.text[lang]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-3">
              <button
                type="button"
                onClick={handleGradeExam}
                className="rounded-xl bg-[#f5b700] px-5 py-2 text-xs font-bold text-slate-900 shadow hover:brightness-105"
              >
                {lang === 'vi' ? 'Nộp bài & Chấm điểm' : 'Submit & Grade'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
