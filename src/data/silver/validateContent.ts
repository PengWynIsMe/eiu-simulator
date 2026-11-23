import type { ChapterContent, CourseContent, SceneContent, SilverCourse, SilverStep } from '../../types/silver';
import { arr, fail, loc, num, obj, oneOf, str } from '../validate';

function localized(value: unknown, path: string): void {
  loc(value, path);
}

function condition(value: unknown, path: string): void {
  const item = obj(value, path);
  if (item.seen === undefined && item.flag === undefined) fail(path, 'seen hoặc flag');
  if (item.seen !== undefined) str(item.seen, `${path}.seen`);
  if (item.flag !== undefined) {
    const flag = obj(item.flag, `${path}.flag`);
    str(flag.key, `${path}.flag.key`);
    str(flag.is, `${path}.flag.is`);
  }
}

function step(value: unknown, path: string): SilverStep {
  const item = obj(value, path);
  const type = oneOf(item.type, ['say', 'choice', 'slide', 'question', 'order', 'code'] as const, `${path}.type`);
  str(item.id, `${path}.id`);
  if (type === 'say') {
    str(item.speaker, `${path}.speaker`);
    localized(item.text, `${path}.text`);
    const variants = item.variants === undefined ? [] : arr(item.variants, `${path}.variants`);
    variants.forEach((value, index) => {
      const variant = obj(value, `${path}.variants[${index}]`);
      condition(variant.when, `${path}.variants[${index}].when`);
      localized(variant.text, `${path}.variants[${index}].text`);
    });
    return item as unknown as SilverStep;
  }
  if (type === 'choice' || type === 'question') {
    const options = arr(item.options, `${path}.options`);
    if (options.length < 2) fail(`${path}.options`, 'ít nhất 2 options');
    const ids = options.map((value, index) => {
      const option = obj(value, `${path}.options[${index}]`);
      const optionId = str(option.id, `${path}.options[${index}].id`);
      localized(option.text, `${path}.options[${index}].text`);
      if (option.reply !== undefined) localized(option.reply, `${path}.options[${index}].reply`);
      return optionId;
    });
    if (type === 'choice') {
      str(item.speaker, `${path}.speaker`);
      localized(item.text, `${path}.text`);
      if (item.flag !== undefined) str(item.flag, `${path}.flag`);
    } else {
      localized(item.prompt, `${path}.prompt`);
      const passage = item.passage !== undefined;
      const passageKind = item.passageKind !== undefined;
      if (passage !== passageKind) fail(path, 'passage và passageKind đi cùng nhau');
      if (passage) {
        localized(item.passage, `${path}.passage`);
        oneOf(item.passageKind, ['reading', 'listening'] as const, `${path}.passageKind`);
      }
      if (!ids.includes(str(item.answerId, `${path}.answerId`))) fail(`${path}.answerId`, 'id option có thật');
      localized(item.explainCorrect, `${path}.explainCorrect`);
      localized(item.explainWrong, `${path}.explainWrong`);
    }
    return item as unknown as SilverStep;
  }
  if (type === 'slide') {
    localized(item.title, `${path}.title`);
    localized(item.body, `${path}.body`);
    return item as unknown as SilverStep;
  }
  if (type === 'order') {
    localized(item.prompt, `${path}.prompt`);
    const items = arr(item.items, `${path}.items`);
    if (items.length < 3) fail(`${path}.items`, 'ít nhất 3 items');
    const ids = items.map((value, index) => {
      const current = obj(value, `${path}.items[${index}]`);
      const itemId = str(current.id, `${path}.items[${index}].id`);
      localized(current.text, `${path}.items[${index}].text`);
      return itemId;
    });
    const answer = arr(item.answer, `${path}.answer`).map((value, index) => str(value, `${path}.answer[${index}]`));
    if (answer.length !== ids.length || new Set(answer).size !== ids.length || answer.some(value => !ids.includes(value))) fail(`${path}.answer`, 'hoán vị id items');
    localized(item.explainCorrect, `${path}.explainCorrect`);
    localized(item.explainWrong, `${path}.explainWrong`);
    return item as unknown as SilverStep;
  }
  localized(item.title, `${path}.title`);
  localized(item.instruction, `${path}.instruction`);
  const template = str(item.template, `${path}.template`);
  if ((template.match(/___/g) ?? []).length !== 1) fail(`${path}.template`, 'đúng một ___');
  if (arr(item.answers, `${path}.answers`).length === 0) fail(`${path}.answers`, 'không rỗng');
  localized(item.hint, `${path}.hint`);
  localized(item.explainWrong, `${path}.explainWrong`);
  str(item.outputCorrect, `${path}.outputCorrect`);
  str(item.outputWrong, `${path}.outputWrong`);
  return item as unknown as SilverStep;
}

function scene(value: unknown, path: string): SceneContent {
  const item = obj(value, path);
  const steps = arr(item.steps, `${path}.steps`);
  if (steps.length === 0) fail(`${path}.steps`, 'ít nhất một bước');
  const parsed = steps.map((value, index) => step(value, `${path}.steps[${index}]`));
  const ids = parsed.map(current => current.id);
  if (new Set(ids).size !== ids.length) fail(`${path}.steps`, 'id bước duy nhất');
  const minutes = num(item.minutes, `${path}.minutes`);
  if (minutes <= 0) fail(`${path}.minutes`, 'minutes > 0');
  return {
    id: str(item.id, `${path}.id`),
    title: loc(item.title, `${path}.title`),
    place: str(item.place, `${path}.place`),
    minutes,
    steps: parsed,
  };
}

function scenes(values: unknown, path: string): SceneContent[] {
  const parsed = arr(values, path).map((value, index) => scene(value, `${path}[${index}]`));
  const ids = parsed.map(item => item.id);
  if (new Set(ids).size !== ids.length) fail(path, 'id cảnh duy nhất');
  return parsed;
}

function memory(value: unknown, path: string): ChapterContent['memory'] {
  const item = obj(value, path);
  const readOptions = (values: unknown, field: 'caption' | 'text'): { id: string; when?: { seen?: string; flag?: { key: string; is: string } }; caption?: ReturnType<typeof loc>; text?: ReturnType<typeof loc> }[] => {
    const options = arr(values, `${path}.${field === 'caption' ? 'photos' : 'lines'}`);
    return options.map((value, index) => {
      const entryPath = `${path}.${field === 'caption' ? 'photos' : 'lines'}[${index}]`;
      const entry = obj(value, entryPath);
      if (index === options.length - 1 && entry.when !== undefined) fail(`${entryPath}.when`, 'phần tử cuối không có when');
      if (index < options.length - 1 && entry.when === undefined) fail(`${entryPath}.when`, 'điều kiện cho lựa chọn trước cuối');
      if (entry.when !== undefined) condition(entry.when, `${entryPath}.when`);
      return { id: str(entry.id, `${entryPath}.id`), ...(entry.when === undefined ? {} : { when: entry.when as { seen?: string; flag?: { key: string; is: string } } }), [field]: loc(entry[field], `${entryPath}.${field}`) };
    });
  };
  const photos = readOptions(item.photos, 'caption') as ChapterContent['memory']['photos'];
  const lines = readOptions(item.lines, 'text') as ChapterContent['memory']['lines'];
  return { stamp: loc(item.stamp, `${path}.stamp`), photos, lines, activities: arr(item.activities, `${path}.activities`).map((value, index) => loc(value, `${path}.activities[${index}]`)) };
}

export function parseChapter(value: unknown, path: string): ChapterContent {
  const item = obj(value, path);
  const id = str(item.id, `${path}.id`) as ChapterContent['id'];
  if (id !== 'entrance' && !/^([1-5])\.([1-4])$/.test(id)) fail(`${path}.id`, 'ChapterId');
  if (item.version !== 1) fail(`${path}.version`, '1');
  const opening = scenes(item.opening, `${path}.opening`);
  const chapterScenes = scenes(item.scenes, `${path}.scenes`);
  const closing = scenes(item.closing, `${path}.closing`);
  const allSceneIds = [...opening, ...chapterScenes, ...closing].map(current => current.id);
  if (new Set(allSceneIds).size !== allSceneIds.length) fail(path, 'id cảnh duy nhất trong file');
  return {
    version: 1,
    id,
    title: loc(item.title, `${path}.title`),
    subtitle: loc(item.subtitle, `${path}.subtitle`),
    recap: loc(item.recap, `${path}.recap`),
    opening,
    scenes: chapterScenes,
    closing,
    ...(item.englishLevel === undefined ? {} : { englishLevel: (() => { if (![1, 2, 3, 4, 5].includes(item.englishLevel as number)) fail(`${path}.englishLevel`, '1–5'); return item.englishLevel as 1 | 2 | 3 | 4 | 5; })() }),
    memory: memory(item.memory, `${path}.memory`),
  };
}

export function parseCourseContent(value: unknown, path: string, course?: SilverCourse): CourseContent {
  const item = obj(value, path);
  const sessions = arr(item.sessions, `${path}.sessions`).map((value, index) => {
    const currentPath = `${path}.sessions[${index}]`;
    const current = obj(value, currentPath);
    return { slot: oneOf(current.slot, ['theoryA', 'theoryB', 'lab', 'project'] as const, `${currentPath}.slot`), scene: scene(current.scene, `${currentPath}.scene`) };
  });
  const code = str(item.code, `${path}.code`);
  const tier = oneOf(item.tier, ['core', 'summary'] as const, `${path}.tier`);
  const slots = sessions.map(session => session.slot);
  if (tier === 'summary') {
    if (slots.includes('project') || !slots.includes('theoryA') || !slots.includes('theoryB')) fail(`${path}.sessions`, 'summary có theoryA và theoryB, không exam/project');
    const minutes = sessions.reduce((total, session) => total + session.scene.minutes, 0);
    if (minutes < 3 || minutes > 6) fail(`${path}.sessions`, 'summary tổng 3–6 phút');
    if (item.exam !== undefined) fail(`${path}.exam`, 'summary không có exam');
  } else {
    const project = slots.includes('project');
    if (project ? slots.some(slot => slot !== 'project') : !slots.includes('theoryA') || !slots.includes('theoryB')) fail(`${path}.sessions`, 'core có theoryA/theoryB hoặc chỉ project');
    if (course) {
      const hasLab = slots.includes('lab');
      if ((course.lt > 0 && course.th > 0) !== hasLab) fail(`${path}.sessions`, 'lab phải khớp lt và th');
      if (course.lt === 0 && (slots.length !== 1 || slots[0] !== 'project')) fail(`${path}.sessions`, 'lt 0 chỉ có project');
    }
    const minutes = sessions.reduce((total, session) => total + session.scene.minutes, 0);
    const low = project ? 8 : 12;
    if (sessions.length < (project ? 1 : 3) || sessions.length > (project ? 5 : 5) || minutes < low || minutes > 16) fail(`${path}.sessions`, 'core 3–5 buổi/12–16 phút hoặc project 1–5 buổi/8–16 phút');
    if (item.exam !== undefined) {
      const exam = scene(item.exam, `${path}.exam`);
      const graded = exam.steps.filter(current => current.type === 'question' || current.type === 'order' || current.type === 'code');
      if (!project && (exam.steps.length !== 3 || graded.length !== 3)) fail(`${path}.exam.steps`, 'exam đúng 3 bước chấm điểm');
      if (project && (exam.steps.length < 1 || exam.steps.length > 5 || graded.length !== exam.steps.length)) fail(`${path}.exam.steps`, 'exam project 1–5 bước chấm điểm');
    } else if (!project) fail(`${path}.exam`, 'core bắt buộc có exam');
  }
  if (item.version !== 1) fail(`${path}.version`, '1');
  return {
    version: 1,
    code,
    tier,
    status: oneOf(item.status, ['nhap', 'da-duyet'] as const, `${path}.status`),
    basis: (() => { const basis = obj(item.basis, `${path}.basis`); return { pdfPages: str(basis.pdfPages, `${path}.basis.pdfPages`), note: loc(basis.note, `${path}.basis.note`) }; })(),
    summary: loc(item.summary, `${path}.summary`),
    sessions,
    ...(item.exam === undefined ? {} : { exam: scene(item.exam, `${path}.exam`) }),
    closing: loc(item.closing, `${path}.closing`),
  };
}
