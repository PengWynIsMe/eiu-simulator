import { getCurrentStep, useLessonStore } from '../store/useLessonStore';
import type { SpeakerId } from '../types/silver';
import type { ClassSignal } from '../types/silverWorld';

const COVER: { readonly title: string; readonly subtitle: string } = Object.freeze({
  title: 'Nhập môn lập trình',
  subtitle: 'Buổi 1',
});

let cachedState: unknown = null;
let cachedSignal: ClassSignal | null = null;
let resultCounter = 0;
let prevLastResult: unknown = null;
let cachedResult: ClassSignal['result'] = null;

/**
 * Trả về ClassSignal hiện tại từ useLessonStore.
 * Cache snapshot: cùng state của useLessonStore thì trả cùng một object tham chiếu,
 * tránh cấp phát object mới trong useFrame.
 */
export function getLessonSignal(): ClassSignal {
  const s = useLessonStore.getState();
  if (s === cachedState && cachedSignal) {
    return cachedSignal;
  }

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

  if (s.lastResult !== prevLastResult) {
    prevLastResult = s.lastResult;
    if (s.lastResult !== null) {
      resultCounter++;
      cachedResult = { id: resultCounter, correct: s.lastResult.correct };
    } else {
      cachedResult = null;
    }
  }

  cachedState = s;
  cachedSignal = {
    mode,
    stepKey,
    speaker,
    slide,
    cover: COVER,
    result: cachedResult,
  };

  return cachedSignal;
}

export function subscribeLessonSignal(listener: () => void): () => void {
  return useLessonStore.subscribe(() => {
    listener();
  });
}
