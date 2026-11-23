import type { Lang } from '../types';
import type { Feedback, PlayView, SpeakerId } from '../types/silver';
import type { ClassSignal } from '../types/silverWorld';

export const DEFAULT_IDLE_SIGNAL: ClassSignal = {
  mode: 'idle',
  stepKey: 'idle',
  speaker: null,
  slide: null,
  cover: { title: 'CampusSim', subtitle: '' },
  result: null,
};

/**
 * Hàm thuần dịch PlayView sang ClassSignal cho diễn viên 3D.
 * - choice / say → talk
 * - slide → slide
 * - question / order → question
 * - code → exercise
 * - isCourseEnd → end
 * - văn bản theo lang truyền vào
 */
export function toClassSignal(
  view: PlayView | null,
  lang: Lang,
  result: ClassSignal['result'],
  isCourseEnd?: boolean,
): ClassSignal {
  if (!view) {
    return DEFAULT_IDLE_SIGNAL;
  }

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
  const speaker: SpeakerId | null = (step.type === 'say' || step.type === 'choice') ? (step.speaker ?? null) : null;
  const slide = step.type === 'slide' ? {
    title: step.title[lang],
    body: step.body[lang],
    code: step.code,
  } : null;

  const coverTitle = view.item.scene?.title[lang] ?? view.item.courseCode ?? 'CampusSim';
  const coverSubtitle = view.item.courseCode ?? view.chapterId;

  return {
    mode,
    stepKey,
    speaker,
    slide,
    cover: { title: coverTitle, subtitle: coverSubtitle },
    result,
  };
}

export interface SilverSignalHandle {
  getSignal: () => ClassSignal;
  subscribe: (listener: (signal: ClassSignal) => void) => () => void;
  dispose: () => void;
}

export interface SubscribableLangStore {
  getState: () => { lang: Lang };
  subscribe: (listener: (state: { lang: Lang }, prev: { lang: Lang }) => void) => () => void;
}

export interface SubscribablePlayStore {
  getState: () => { play: PlayView | null };
  subscribe: (listener: (state: { play: PlayView | null }, prev: { play: PlayView | null }) => void) => () => void;
}

/**
 * Nối silver store và lang store để cung cấp { getSignal, subscribe, dispose } cho diễn viên 3D.
 * - getSignal trả cùng tham chiếu khi state không đổi (gọi mỗi khung hình trong useFrame).
 * - Đổi ngôn ngữ cập nhật tín hiệu và báo listener.
 * - result.id tăng theo tham chiếu feedback mới của store (thử lại rồi trả lời y hệt vẫn ra id mới).
 * - revealed (mở đáp án) không tính là kết quả mới.
 */
export function createSilverSignal(
  silverStore: SubscribablePlayStore,
  langStore: SubscribableLangStore,
  opts?: { isCourseEnd?: (view: PlayView) => boolean },
): SilverSignalHandle {
  const listeners = new Set<(signal: ClassSignal) => void>();

  let lastFeedbackRef: Feedback | null = null;
  let lastResultId = 0;
  let lastResult: ClassSignal['result'] = null;
  let lastPlayRef: PlayView | null = null;
  let lastLang: Lang = langStore.getState().lang;

  const initialPlay = silverStore.getState().play;
  let cachedSignal: ClassSignal = toClassSignal(
    initialPlay,
    lastLang,
    null,
    initialPlay && opts?.isCourseEnd ? opts.isCourseEnd(initialPlay) : undefined,
  );

  const update = () => {
    const play = silverStore.getState().play;
    const lang = langStore.getState().lang;
    const feedback = play?.feedback ?? null;

    // result.id tăng theo tham chiếu feedback mới
    if (!feedback) {
      lastFeedbackRef = null;
      lastResult = null;
    } else if (feedback !== lastFeedbackRef) {
      if (feedback.kind === 'graded' && feedback.revealed) {
        // revealed không tính là kết quả mới
        if (!lastResult) {
          lastResult = { id: lastResultId, correct: feedback.correct };
        }
      } else {
        lastResultId++;
        const correct = feedback.kind === 'graded' ? feedback.correct : true;
        lastResult = { id: lastResultId, correct };
      }
      lastFeedbackRef = feedback;
    }

    const isEnd = play && opts?.isCourseEnd ? opts.isCourseEnd(play) : undefined;
    const newSignal = toClassSignal(play, lang, lastResult, isEnd);

    // So sánh tham chiếu state để giữ nguyên cachedSignal nếu không đổi
    if (
      play === lastPlayRef
      && lang === lastLang
      && newSignal.mode === cachedSignal.mode
      && newSignal.stepKey === cachedSignal.stepKey
      && newSignal.result?.id === cachedSignal.result?.id
      && newSignal.result?.correct === cachedSignal.result?.correct
    ) {
      return;
    }

    lastPlayRef = play;
    lastLang = lang;
    cachedSignal = newSignal;

    for (const listener of listeners) {
      listener(cachedSignal);
    }
  };

  const unsubSilver = silverStore.subscribe(() => update());
  const unsubLang = langStore.subscribe(() => update());

  // Khởi động đồng bộ lần đầu nếu đã có feedback
  update();

  return {
    getSignal: () => cachedSignal,
    subscribe: (listener: (signal: ClassSignal) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose: () => {
      unsubSilver();
      unsubLang();
      listeners.clear();
    },
  };
}
