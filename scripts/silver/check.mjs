import { createServer } from 'vite';
import { readdir, readFile } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import process from 'node:process';

export function wordCount(value) {
  return value.trim() === '' ? 0 : value.trim().split(/\s+/).length;
}

export function checkConds(files) {
  const sceneIds = new Set();
  const choices = new Map();
  const conditions = [];
  const visitScene = scene => {
    if (scene && typeof scene.id === 'string') sceneIds.add(scene.id);
    for (const step of scene?.steps ?? []) {
      if (step.type === 'choice' && step.flag) choices.set(step.flag, new Set((step.options ?? []).map(option => option.id)));
    }
  };
  const visit = value => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(visit); return; }
    if (typeof value.id === 'string' && Array.isArray(value.steps)) visitScene(value);
    if (value.when && typeof value.when === 'object') conditions.push(value.when);
    for (const child of Object.values(value)) visit(child);
  };
  files.forEach(visit);
  const errors = [];
  for (const condition of conditions) {
    if (condition.seen && !sceneIds.has(condition.seen)) errors.push(`seen không tồn tại: ${condition.seen}`);
    if (condition.flag) {
      const options = choices.get(condition.flag.key);
      if (!options) errors.push(`flag không tồn tại: ${condition.flag.key}`);
      else if (!options.has(condition.flag.is)) errors.push(`option không tồn tại: ${condition.flag.key}=${condition.flag.is}`);
    }
  }
  return errors;
}

export function checkContentFileName(file, code) {
  const expected = `${code.toLowerCase().replace(' ', '-')}.json`;
  return file === expected ? undefined : `tên file không khớp mã ${code} (cần ${expected})`;
}

export function compareCurriculumCourse(course, source) {
  if (!source) return `${course.code}: thiếu trong ktpm.curriculum.json`;
  if (source.credits !== course.credits || source.lt !== course.lt || source.th !== course.th || `${source.year}.${source.semester}` !== course.pdfTerm) {
    return `${course.code}: curriculum mismatch (credits ${source.credits}/${course.credits}, LT ${source.lt}/${course.lt}, TH ${source.th}/${course.th}, kỳ ${source.year}.${source.semester}/${course.pdfTerm})`;
  }
  return undefined;
}

export function wordLimitViolation(value, limit) {
  return wordCount(value) > limit;
}

export function sessionWordCount(scene) {
  const collect = value => {
    if (!value || typeof value !== 'object') return [];
    if (Array.isArray(value)) return value.flatMap(collect);
    if (typeof value.vi === 'string' && typeof value.en === 'string') return [value.vi];
    return Object.values(value).flatMap(collect);
  };
  return collect(scene.steps).reduce((total, value) => total + wordCount(value), 0);
}

export function sessionWordLimitError(tier, slot, scene) {
  if (tier !== 'summary') return undefined;
  const limit = slot === 'lab' ? 200 : slot.startsWith('theory') ? 130 : undefined;
  if (limit === undefined || sessionWordCount(scene) <= limit) return undefined;
  return `vượt ${limit} từ trong buổi`;
}

export function identicalLocalizedTexts(value, path = '') {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap((item, index) => identicalLocalizedTexts(item, `${path}[${index}]`));
  return Object.entries(value).flatMap(([key, child]) => {
    if (key === 'passage') return [];
    if (key === 'vi' && typeof child === 'string' && typeof value.en === 'string') {
      return child === value.en && child.length > 20 ? [`${path}: vi trùng en`] : [];
    }
    if (key === 'en' && typeof value.vi === 'string') return [];
    return identicalLocalizedTexts(child, path ? `${path}.${key}` : key);
  });
}

if (process.argv[1]?.endsWith('/check.mjs')) {
const strict = process.argv.includes('--strict');
const root = process.cwd();
const server = await createServer({
  configFile: false,
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true },
  logLevel: 'error',
});
const rows = [];
const add = (level, message) => rows.push({ level, message });
const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const chapterDir = resolve(root, 'src/data/silver/chapters');
const contentDir = resolve(root, 'src/data/silver/content');

try {
  const [{ catalog }, { plan, termCodes }, { parseChapter, parseCourseContent }] = await Promise.all([
    server.ssrLoadModule('/src/data/silver/catalog.ts'),
    server.ssrLoadModule('/src/data/silver/plan.ts'),
    server.ssrLoadModule('/src/data/silver/validateContent.ts'),
  ]);
  const chapterFiles = (await readdir(chapterDir).catch(() => [])).filter(file => file.endsWith('.json'));
  const contentFiles = (await readdir(contentDir).catch(() => [])).filter(file => file.endsWith('.json'));
  const parsedFiles = [];
  const parsedCourses = new Set();

  for (const file of chapterFiles) {
    try {
      const value = await readJson(resolve(chapterDir, file));
      const chapter = parseChapter(value, `chapters/${file}`);
      if (basename(file, '.json') !== chapter.id) add('error', `${file}: tên file không khớp id ${chapter.id}`);
      parsedFiles.push(chapter);
      add('ok', `chapter ${file}`);
    } catch (error) {
      add('error', `${file}: ${error.message}`);
    }
  }

  for (const file of contentFiles) {
    try {
      const value = await readJson(resolve(contentDir, file));
      const code = value.code;
      const course = catalog.courses.find(item => item.code === code);
      if (!course) throw new Error(`mã không có trong catalog: ${code}`);
      const content = parseCourseContent(value, `content/${file}`, course);
      const fileError = checkContentFileName(file, code);
      if (fileError) add('error', `${file}: ${fileError}`);
      parsedCourses.add(content.code);
      parsedFiles.push(content);
      add('ok', `content ${file}`);
      validateText(content, course, add);
    } catch (error) {
      add('error', `${file}: ${error.message}`);
    }
  }

  for (const issue of checkConds(parsedFiles)) add('error', issue);
  for (const file of parsedFiles) {
    for (const issue of identicalLocalizedTexts(file)) add('warning', issue);
  }
  const totalCredits = plan.terms.reduce((sum, term) => sum + term.credits, 0);
  if (totalCredits !== 180) add('warning', `kế hoạch ${totalCredits} TC; kỳ vọng 180`);
  add('ok', `plan tổng ${totalCredits} TC`);

  const demo = plan.terms.find(term => term.term === '2.2');
  for (const code of demo ? termCodes(demo) : []) {
    if (!parsedCourses.has(code)) add(strict ? 'error' : 'warning', `2.2 thiếu nội dung ${code}`);
  }

  const curriculum = await readJson(resolve(root, 'src/data/majors/ktpm.curriculum.json'));
  const curriculumCourses = curriculum.years.flatMap(year => year.courses);
  const required = catalog.courses.filter(course => course.kind === 'required');
  for (const course of required) {
    const source = curriculumCourses.find(item => item.code === course.code);
    const mismatch = compareCurriculumCourse(course, source);
    if (mismatch) add('error', mismatch);
  }

  console.table(rows);
  process.exitCode = rows.some(row => row.level === 'error') ? 1 : 0;
} finally {
  await server.close();
}

function validateText(content, _course, addRow) {
  for (const session of content.sessions) {
    const error = sessionWordLimitError(content.tier, session.slot, session.scene);
    if (error) addRow('error', `${content.code}/${session.slot}: ${error}`);
  }
  for (const [field, localized] of [['summary', content.summary], ['closing', content.closing]]) {
    for (const language of ['vi', 'en']) if (wordLimitViolation(localized[language], 25)) addRow('error', `${content.code}/${field}.${language}: vượt 25 từ`);
  }
}
}
