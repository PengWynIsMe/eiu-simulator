import type {
  ChapterContent,
  Cond,
  CourseContent,
  GradedStep,
  Meeting,
  RunItem,
  SceneContent,
  SilverStep,
} from '../types/silver';
import type { LocalizedText } from '../types';

export interface StoryContext {
  seen: ReadonlySet<string>;
  flags: Readonly<Record<string, string>>;
}

export function matchCond(condition: Cond, context: StoryContext): boolean {
  if (condition.seen !== undefined && !context.seen.has(condition.seen)) return false;
  if (condition.flag !== undefined && context.flags[condition.flag.key] !== condition.flag.is) return false;
  return true;
}

export function resolveStep(step: SilverStep, context: StoryContext): SilverStep {
  if (step.type !== 'say' || step.variants === undefined) return step;
  const variant = step.variants.find(item => matchCond(item.when, context));
  const resolved = { ...step };
  delete resolved.variants;
  return variant ? { ...resolved, text: variant.text } : resolved;
}

function sceneItem(scene: SceneContent): RunItem {
  return { id: `scene:${scene.id}`, kind: 'scene', scene, minutes: scene.minutes };
}

function memoryItem(): RunItem {
  return { id: 'memory', kind: 'memory', minutes: 1 };
}

export function buildChapterQueue(chapter: ChapterContent): RunItem[] {
  const items = [...chapter.opening, ...chapter.scenes, ...chapter.closing].map(sceneItem);
  if (chapter.englishLevel !== undefined) items.push({ id: 'transcript', kind: 'transcript', minutes: 1 });
  items.push(memoryItem());
  return items;
}

function quickScenes(content: CourseContent): SceneContent[] {
  if (content.sessions.some(session => session.slot === 'project')) {
    return content.sessions.filter(session => session.slot === 'project').map(session => session.scene);
  }
  if (content.sessions.some(session => session.slot === 'lab')) {
    return content.sessions.filter(session => session.slot === 'lab').map(session => session.scene);
  }
  return content.sessions.filter(session => session.slot === 'theoryA').map(session => session.scene);
}

function sessionScenes(content: CourseContent, tier: 'core' | 'summary' | 'quick', meeting: Meeting): SceneContent[] {
  if (tier === 'quick') return quickScenes(content).filter(scene => content.sessions.some(session => session.scene === scene && session.slot === meeting.kind));
  return content.sessions.filter(session => session.slot === meeting.kind).map(session => session.scene);
}

function createSessionItem(
  scene: SceneContent,
  courseCode: string,
  meeting: Meeting,
  number: number,
): RunItem {
  return {
    id: `session:${courseCode}:${meeting.kind}:${number}`,
    kind: 'session',
    scene,
    courseCode,
    meeting,
    minutes: scene.minutes,
  };
}

export function buildTermQueue(
  chapter: ChapterContent,
  registrations: { code: string; tier: 'core' | 'summary' | 'quick' }[],
  contents: ReadonlyMap<string, CourseContent>,
  meetings: Meeting[],
): RunItem[] {
  const queue = chapter.opening.map(sceneItem);
  const sessionCounts = new Map<string, number>();

  for (const meeting of meetings) {
    for (const registration of registrations) {
      if (meeting.code !== registration.code) continue;
      const content = contents.get(registration.code);
      if (!content) continue;
      const selectedScenes = sessionScenes(content, registration.tier, meeting);
      for (const sessionScene of selectedScenes) {
        const key = `${registration.code}:${meeting.kind}`;
        const number = (sessionCounts.get(key) ?? 0) + 1;
        sessionCounts.set(key, number);
        queue.push(createSessionItem(sessionScene, registration.code, meeting, number));
      }
    }
  }

  for (const registration of registrations) {
    const content = contents.get(registration.code);
    if (registration.tier === 'core' && content?.exam) {
      queue.push({ id: `exam:${registration.code}`, kind: 'exam', scene: content.exam, courseCode: registration.code, minutes: content.exam.minutes });
    }
  }

  queue.push(...chapter.scenes.map(sceneItem), ...chapter.closing.map(sceneItem), memoryItem());
  return queue;
}

export function gradeStep(step: GradedStep, value: string): { correct: boolean; explain?: LocalizedText; output?: string; correctAnswer: string } {
  if (step.type === 'question') {
    const correct = value === step.answerId;
    return { correct, explain: correct ? step.explainCorrect : step.explainWrong, correctAnswer: step.answerId };
  }
  if (step.type === 'order') {
    const correctAnswer = step.answer.join(',');
    const correct = value === correctAnswer;
    return { correct, explain: correct ? step.explainCorrect : step.explainWrong, correctAnswer };
  }
  const correctAnswer = step.answers[0] ?? '';
  const correct = step.answers.some(answer => value.trim() === answer);
  if (correct) {
    return { correct, output: step.outputCorrect, correctAnswer };
  }
  return {
    correct,
    output: step.outputWrong,
    explain: step.explainWrong,
    correctAnswer,
  };
}
