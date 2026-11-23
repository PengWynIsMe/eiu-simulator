import { useLangStore } from '../store/useLangStore';
import type { Lang } from '../types';
import type { Feedback, PlayView, SpeakerId } from '../types/silver';
import type { ClassSignal } from '../types/silverWorld';

export interface SilverSignalOptions {
  lang?: Lang;
  isCourseEnd?: boolean;
  prevFeedback?: Feedback | null;
  prevResultId?: number;
}

function resolveLang(overrideLang?: Lang): Lang {
  if (overrideLang) return overrideLang;
  try {
    return useLangStore.getState().lang ?? 'vi';
  } catch {
    return 'vi';
  }
}

function isFeedbackDifferent(a: Feedback | null, b: Feedback | null): boolean {
  if (a === b) return false;
  if (!a || !b) return true;
  if (a.kind !== b.kind) return true;
  if (a.kind === 'choice' && b.kind === 'choice') {
    return a.optionId !== b.optionId;
  }
  if (a.kind === 'graded' && b.kind === 'graded') {
    return a.correct !== b.correct || a.revealed !== b.revealed || a.output !== b.output;
  }
  return false;
}

/**
 * Chuyển PlayView của IT Silver sang ClassSignal cho diễn viên (Teacher, TV, ClassroomNpcs).
 * - choice / say → talk
 * - slide → slide
 * - question / order → question
 * - code → exercise
 * - cảnh cuối của môn → end
 * - kết quả feedback đổi → result.id tăng
 * - văn bản theo useLangStore
 */
export function toClassSignal(
  view: PlayView,
  prevSignal?: ClassSignal | null,
  opts?: SilverSignalOptions,
): ClassSignal {
  const lang = resolveLang(opts?.lang);
  const step = view.step;
  const isEnd = opts?.isCourseEnd ?? (
    (view.item.kind === 'exam' && view.stepIndex === view.stepCount - 1 && view.canContinue)
    || view.item.id === 'summary'
  );

  let mode: ClassSignal['mode'];
  if (isEnd) {
    mode = 'end';
  } else if (step.type === 'say' || step.type === 'choice') {
    mode = 'talk';
  } else if (step.type === 'slide') {
    mode = 'slide';
  } else if (step.type === 'question' || step.type === 'order') {
    mode = 'question';
  } else if (step.type === 'code') {
    mode = 'exercise';
  } else {
    mode = 'idle';
  }

  const stepKey = `${view.item.id}:${view.stepIndex}:${step.id}`;

  let speaker: SpeakerId | null = null;
  if (step.type === 'say' || step.type === 'choice') {
    speaker = step.speaker ?? null;
  }

  let slide: ClassSignal['slide'] = null;
  if (step.type === 'slide') {
    slide = {
      title: step.title[lang],
      body: step.body[lang],
      code: step.code,
    };
  }

  const coverTitle = view.item.scene?.title[lang] ?? view.item.courseCode ?? 'CampusSim';
  const coverSubtitle = view.item.courseCode ?? view.chapterId;
  const cover = { title: coverTitle, subtitle: coverSubtitle };

  // Xử lý result và id tăng khi feedback đổi
  let result: ClassSignal['result'] = null;
  if (view.feedback) {
    const correct = view.feedback.kind === 'graded' ? view.feedback.correct : true;
    const prevId = prevSignal?.result?.id ?? opts?.prevResultId ?? 0;
    const prevFb = opts?.prevFeedback ?? null;
    const feedbackChanged = prevFb !== null
      ? isFeedbackDifferent(view.feedback, prevFb)
      : prevSignal?.result === null || prevSignal === undefined;

    const resultId = feedbackChanged ? prevId + 1 : (prevSignal?.result?.id ?? (prevId || 1));
    result = { id: resultId, correct };
  }

  return {
    mode,
    stepKey,
    speaker,
    slide,
    cover,
    result,
  };
}

export interface SilverSignalTracker {
  getSignal: () => ClassSignal;
  update: (view: PlayView | null, isCourseEnd?: boolean) => ClassSignal;
  reset: () => void;
}

const DEFAULT_IDLE_SIGNAL: ClassSignal = {
  mode: 'idle',
  stepKey: 'idle',
  speaker: null,
  slide: null,
  cover: { title: 'CampusSim', subtitle: '' },
  result: null,
};

/**
 * Tạo tracker giữ trạng thái tín hiệu cho buổi học Silver.
 * Tự động tăng result.id mỗi khi feedback đổi.
 */
export function createSilverSignalTracker(deps?: {
  getLang?: () => Lang;
}): SilverSignalTracker {
  let currentSignal: ClassSignal = DEFAULT_IDLE_SIGNAL;
  let lastFeedback: Feedback | null = null;
  let lastResultId = 0;

  return {
    getSignal: () => currentSignal,
    update: (view, isCourseEnd) => {
      if (!view) {
        currentSignal = DEFAULT_IDLE_SIGNAL;
        lastFeedback = null;
        return currentSignal;
      }

      const lang = deps?.getLang ? deps.getLang() : resolveLang();
      const feedbackChanged = isFeedbackDifferent(view.feedback, lastFeedback);
      if (view.feedback && feedbackChanged) {
        lastResultId++;
      }
      lastFeedback = view.feedback;

      const step = view.step;
      const isEnd = Boolean(
        isCourseEnd
        || (view.item.kind === 'exam' && view.stepIndex === view.stepCount - 1 && view.canContinue)
        || view.item.id === 'summary',
      );

      let mode: ClassSignal['mode'];
      if (isEnd) {
        mode = 'end';
      } else if (step.type === 'say' || step.type === 'choice') {
        mode = 'talk';
      } else if (step.type === 'slide') {
        mode = 'slide';
      } else if (step.type === 'question' || step.type === 'order') {
        mode = 'question';
      } else if (step.type === 'code') {
        mode = 'exercise';
      } else {
        mode = 'idle';
      }

      const stepKey = `${view.item.id}:${view.stepIndex}:${step.id}`;
      const speaker: SpeakerId | null = (step.type === 'say' || step.type === 'choice') ? step.speaker : null;
      const slide = step.type === 'slide' ? {
        title: step.title[lang],
        body: step.body[lang],
        code: step.code,
      } : null;

      const coverTitle = view.item.scene?.title[lang] ?? view.item.courseCode ?? 'CampusSim';
      const coverSubtitle = view.item.courseCode ?? view.chapterId;

      const result = view.feedback ? {
        id: lastResultId,
        correct: view.feedback.kind === 'graded' ? view.feedback.correct : true,
      } : null;

      currentSignal = {
        mode,
        stepKey,
        speaker,
        slide,
        cover: { title: coverTitle, subtitle: coverSubtitle },
        result,
      };

      return currentSignal;
    },
    reset: () => {
      currentSignal = DEFAULT_IDLE_SIGNAL;
      lastFeedback = null;
      lastResultId = 0;
    },
  };
}
