import type { ChapterContent, Cond, MemoryView, NotebookEntry } from '../types/silver';
import type { LocalizedText } from '../types';

export interface MemoryDeps {
  match: (condition: Cond) => boolean;
  courseName: (code: string) => LocalizedText | undefined;
}

function fallback<T extends { id: string }>(items: T[]): T {
  const last = items.at(-1);
  if (!last) throw new Error('Memory template must include a fallback item');
  return last;
}

function visible<T extends { when?: Cond }>(item: T, deps: MemoryDeps): boolean {
  return item.when === undefined || deps.match(item.when);
}

function selectPhoto(chapter: ChapterContent, entry: NotebookEntry | undefined, deps: MemoryDeps) {
  const choices = chapter.memory.photos.filter(photo => visible(photo, deps));
  const selected = entry
    ? chapter.memory.photos.find(photo => photo.id === entry.photoId) ?? fallback(chapter.memory.photos)
    : choices[0] ?? fallback(chapter.memory.photos);
  return { selected, choices };
}

function selectLine(chapter: ChapterContent, entry: NotebookEntry | undefined, deps: MemoryDeps) {
  if (entry) return chapter.memory.lines.find(line => line.id === entry.lineId) ?? fallback(chapter.memory.lines);
  return chapter.memory.lines.find(line => visible(line, deps)) ?? fallback(chapter.memory.lines);
}

function createView(chapter: ChapterContent, entry: NotebookEntry | undefined, deps: MemoryDeps, saved: boolean, courseCodes = entry?.courses ?? []): MemoryView {
  const { selected: photo, choices } = selectPhoto(chapter, entry, deps);
  const line = selectLine(chapter, entry, deps);
  return {
    chapterId: chapter.id,
    title: chapter.title,
    stamp: chapter.memory.stamp,
    photo: { id: photo.id, caption: photo.caption },
    photoChoices: choices.map(item => ({ id: item.id, caption: item.caption })),
    line: { id: line.id, text: line.text },
    courses: courseCodes.flatMap(code => {
      const name = deps.courseName(code);
      return name === undefined ? [] : [{ code, name }];
    }),
    activities: chapter.memory.activities,
    hasOld: saved,
    savedAt: entry?.savedAt ?? null,
  };
}

export function makeMemoryView(chapter: ChapterContent, courses: string[], old: NotebookEntry | undefined, deps: MemoryDeps): MemoryView {
  return createView(chapter, undefined, deps, old !== undefined, courses);
}

export function savedMemoryView(chapter: ChapterContent, entry: NotebookEntry, deps: MemoryDeps): MemoryView {
  return createView(chapter, entry, deps, true);
}

export function upsertEntry(list: NotebookEntry[], entry: NotebookEntry): NotebookEntry[] {
  const index = list.findIndex(item => item.chapterId === entry.chapterId);
  if (index < 0) return [...list, entry];
  return list.map((item, itemIndex) => itemIndex === index ? entry : item);
}
