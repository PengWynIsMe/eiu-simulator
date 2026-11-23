import { getCurrentStep, useLessonStore } from '../store/useLessonStore';
import type { SpeakerId } from '../types/silver';
import type { ClassSignal } from '../types/silverWorld';

let resultCounter = 0;
let prevLastResult: unknown = null;

/**
 * Trả về ClassSignal hiện tại từ useLessonStore.
 * Dịch các pha của buổi học sang mode của diễn viên chung:
 * dialogue -> talk, lecture -> slide, question -> question, exercise -> exercise, summary -> end.
 */
export function getLessonSignal(): ClassSignal {
  const s = useLessonStore.getState();
  const step = getCurrentStep(s);

  let mode: ClassSignal['mode'] = 'idle';
  switch (s.phase) {
    case 'dialogue':
      mode = 'talk';
      break;
    case 'lecture':
      mode = 'slide';
      break;
    case 'question':
      mode = 'question';
      break;
    case 'exercise':
      mode = 'exercise';
      break;
    case 'summary':
      mode = 'end';
      break;
    default:
      mode = 'idle';
      break;
  }

  const stepKey = `${s.lessonId ?? 'lesson'}:${s.phase}:${s.stepIndex}:${s.slideIndex}`;

  let speaker: SpeakerId | null = null;
  if (step && 'speaker' in step) {
    if (step.speaker === 'teacher') speaker = 'teacher';
    else if (step.speaker === 'player') speaker = 'player';
  }

  let slide: ClassSignal['slide'] = null;
  if (s.phase === 'lecture' && step && step.type === 'lecture') {
    const raw = step.slides[s.slideIndex];
    if (raw) {
      slide = {
        title: raw.title,
        body: raw.body,
        ...(raw.code ? { code: raw.code } : {}),
      };
    }
  }

  const cover = { title: 'Nhập môn lập trình', subtitle: 'Buổi 1' };

  if (s.lastResult !== prevLastResult) {
    prevLastResult = s.lastResult;
    if (s.lastResult !== null) {
      resultCounter++;
    }
  }

  const result = s.lastResult !== null ? { id: resultCounter, correct: s.lastResult.correct } : null;

  return {
    mode,
    stepKey,
    speaker,
    slide,
    cover,
    result,
  };
}

export function subscribeLessonSignal(listener: () => void): () => void {
  return useLessonStore.subscribe(() => {
    listener();
  });
}

/**
 * Tạo bộ điều khiển ClassSignal từ useLessonStore cho các diễn viên chung.
 */
export function createLessonSignal(): {
  getSignal: () => ClassSignal;
  subscribe: (listener: () => void) => () => void;
} {
  return {
    getSignal: getLessonSignal,
    subscribe: subscribeLessonSignal,
  };
}

export const lessonSignal = createLessonSignal;
