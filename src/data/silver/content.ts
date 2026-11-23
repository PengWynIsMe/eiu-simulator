import type { ChapterContent, ChapterId, CourseContent } from '../../types/silver';

const chapters = import.meta.glob('./chapters/*.json', { import: 'default' });
const courseFiles = import.meta.glob('./content/*.json', { import: 'default' });

export function contentFileName(code: string): string {
  return code.toLowerCase().replace(' ', '-');
}

function codeFromFile(file: string): string {
  const name = file.split('/').at(-1)?.replace(/\.json$/, '') ?? '';
  if (name.startsWith('lngs-')) return name.toUpperCase();
  return name.replace('-', ' ').toUpperCase();
}

export const availableContentCodes: Promise<ReadonlySet<string>> = Promise.resolve(new Set(Object.keys(courseFiles).map(codeFromFile)));

export async function loadChapter(id: ChapterId): Promise<ChapterContent | undefined> {
  const loader = chapters[`./chapters/${id}.json`];
  return loader ? await loader() as ChapterContent : undefined;
}

export async function loadCourseContent(code: string): Promise<CourseContent | undefined> {
  const loader = courseFiles[`./content/${contentFileName(code)}.json`];
  return loader ? await loader() as CourseContent : undefined;
}
