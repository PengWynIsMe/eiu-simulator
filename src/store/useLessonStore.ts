import { create } from 'zustand';
import { getLesson } from '../data';
import type { LessonStep } from '../types';

/**
 * Pha của buổi học. Scene đọc để điều khiển thầy / màn chiếu / ghế; UI đọc để hiện hộp thoại / máy ảo.
 * idle → goToClass (bấm Bắt đầu) → findSeat (vào tới phòng) → [ngồi] → pha theo bước hiện tại → summary.
 */
export type LessonPhase = 'idle' | 'goToClass' | 'findSeat' | 'dialogue' | 'lecture' | 'question' | 'exercise' | 'summary';

export interface LessonResult {
  correct: boolean;
  /** Output hiện ở cửa sổ máy ảo (bài tập) hoặc rỗng (câu hỏi / hội thoại). */
  output: string;
  /** Lời thầy nói sau khi chọn / nộp. */
  explain?: string;
}

interface LessonState {
  lessonId: string | null;
  phase: LessonPhase;
  stepIndex: number;
  slideIndex: number;
  seatId: string | null;
  /** true = đang nhìn màn hình máy ảo. Tự bật khi tới bước bài tập, tự tắt khi rời. */
  desktopOpen: boolean;
  /** 3 sao, mỗi lần xin gợi ý trừ 1 (tối thiểu 1). */
  stars: number;
  hintsUsed: number;
  startedAt: number | null;
  finishedAt: number | null;
  /** id bước → id lựa chọn / câu trả lời cuối cùng. */
  answers: Record<string, string>;
  /** Kết quả lần chọn / nộp gần nhất của bước hiện tại; null khi sang bước mới. */
  lastResult: LessonResult | null;
  /** Bắt đầu buổi học. Scene thấy phase = 'goToClass' thì đưa người chơi tới `classroom.arrival`. */
  startLesson: (id: string) => void;
  /** Scene gọi khi người chơi bước vào phòng học. */
  arriveAtClass: () => void;
  sitDown: (seatId: string) => void;
  standUp: () => void;
  openDesktop: () => void;
  closeDesktop: () => void;
  /** Chọn đáp án ở bước dialogue (đi tiếp luôn) hoặc question (ghi lastResult; đúng mới đi tiếp bằng nextStep). */
  chooseOption: (optionId: string) => void;
  /** Nộp bài tập: ghi lastResult. Đúng thì UI hiện nút "Tiếp" gọi nextStep. */
  submitExercise: (exerciseId: string, answer: string) => void;
  /** Xin gợi ý bài tập hiện tại (trừ sao). Trả về chuỗi gợi ý. */
  takeHint: (exerciseId: string) => string;
  /** Slide tiếp theo; hết slide thì sang bước sau. */
  nextSlide: () => void;
  nextStep: () => void;
  /** Thoát / kết thúc, về idle. */
  endLesson: () => void;
}

/** Bước hiện tại của buổi học (hoặc undefined). Dùng được cả trong scene lẫn ui. */
export function getCurrentStep(state: Pick<LessonState, 'lessonId' | 'stepIndex'>): LessonStep | undefined {
  return state.lessonId ? getLesson(state.lessonId)?.steps[state.stepIndex] : undefined;
}

const phaseOf = (step: LessonStep | undefined): LessonPhase => step?.type ?? 'summary';

const initial = {
  lessonId: null,
  phase: 'idle' as LessonPhase,
  stepIndex: 0,
  slideIndex: 0,
  seatId: null,
  desktopOpen: false,
  stars: 3,
  hintsUsed: 0,
  startedAt: null,
  finishedAt: null,
  answers: {},
  lastResult: null,
};

export const useLessonStore = create<LessonState>()((set, get) => {
  /** Chuyển tới bước `index`, cập nhật pha + máy ảo. */
  const goToStep = (index: number) => {
    const s = get();
    const step = getCurrentStep({ lessonId: s.lessonId, stepIndex: index });
    const phase = phaseOf(step);
    set({
      stepIndex: index,
      slideIndex: 0,
      lastResult: null,
      phase,
      desktopOpen: phase === 'exercise',
      finishedAt: phase === 'summary' ? Date.now() : null,
    });
  };

  return {
    ...initial,
    startLesson: (id) => {
      if (!getLesson(id)) return;
      set({ ...initial, lessonId: id, phase: 'goToClass', startedAt: Date.now() });
    },
    arriveAtClass: () => {
      if (get().phase === 'goToClass') set({ phase: 'findSeat' });
    },
    sitDown: (seatId) => {
      const s = get();
      if (!s.lessonId || s.seatId) return;
      set({ seatId });
      goToStep(s.stepIndex);
    },
    standUp: () => {
      const s = get();
      if (!s.seatId) return;
      set({ seatId: null, desktopOpen: false, phase: s.phase === 'summary' ? 'summary' : 'findSeat' });
    },
    openDesktop: () => set({ desktopOpen: true }),
    closeDesktop: () => set({ desktopOpen: false }),
    chooseOption: (optionId) => {
      const s = get();
      const step = getCurrentStep(s);
      if (!step) return;
      const answers = { ...s.answers, [step.id]: optionId };
      if (step.type === 'dialogue') {
        const reply = step.options.find((o) => o.id === optionId)?.reply;
        set({ answers });
        goToStep(s.stepIndex + 1);
        // Câu thầy đáp lại hiện ở bước mới (UI đọc lastResult.explain nếu có).
        if (reply) set({ lastResult: { correct: true, output: '', explain: reply } });
      } else if (step.type === 'question') {
        const correct = optionId === step.answerId;
        set({ answers, lastResult: { correct, output: '', explain: correct ? step.explainCorrect : step.explainWrong } });
      }
    },
    submitExercise: (exerciseId, answer) => {
      const s = get();
      const step = getCurrentStep(s);
      if (step?.type !== 'exercise' || step.id !== exerciseId) return;
      const value = answer.trim();
      const correct = step.answers.includes(value);
      set({
        answers: { ...s.answers, [step.id]: value },
        lastResult: correct
          ? { correct, output: step.outputCorrect }
          : { correct, output: step.outputWrong, explain: step.explainWrong },
      });
    },
    takeHint: (exerciseId) => {
      const s = get();
      const step = getCurrentStep(s);
      if (step?.type !== 'exercise' || step.id !== exerciseId) return '';
      set({ hintsUsed: s.hintsUsed + 1, stars: Math.max(1, s.stars - 1) });
      return step.hint;
    },
    nextSlide: () => {
      const s = get();
      const step = getCurrentStep(s);
      if (step?.type === 'lecture' && s.slideIndex < step.slides.length - 1) set({ slideIndex: s.slideIndex + 1 });
      else goToStep(s.stepIndex + 1);
    },
    nextStep: () => {
      const s = get();
      const lesson = s.lessonId ? getLesson(s.lessonId) : undefined;
      if (!lesson) return;
      goToStep(Math.min(s.stepIndex + 1, lesson.steps.length - 1));
    },
    endLesson: () => set({ ...initial }),
  };
});

// Thử luồng buổi học trong console khi dev: __lesson.getState().startLesson('nmlt-01')
if (import.meta.env.DEV) {
  (window as unknown as { __lesson: typeof useLessonStore }).__lesson = useLessonStore;
}
