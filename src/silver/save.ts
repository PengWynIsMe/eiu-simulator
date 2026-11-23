import type { ChapterId, NotebookEntry, SavedRun, SilverSave, SilverApi, TermId } from '../types/silver';

export const SAVE_KEY = 'campussim.silver.v1';

export interface KeyValue {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const chapterId = (value: unknown): value is ChapterId => value === 'entrance' || typeof value === 'string' && /^[1-5]\.[1-4]$/.test(value);
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const string = (value: unknown): value is string => typeof value === 'string';
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter(string) : [];

function parseNotebook(value: unknown): NotebookEntry | undefined {
  if (!isObject(value) || !chapterId(value.chapterId) || !string(value.photoId) || !string(value.lineId) || !string(value.savedAt)) return undefined;
  return { chapterId: value.chapterId, photoId: value.photoId, lineId: value.lineId, courses: strings(value.courses), savedAt: value.savedAt };
}

function parseRun(value: unknown): SavedRun | null {
  if (!isObject(value) || !chapterId(value.chapterId) || !string(value.itemId) || !Array.isArray(value.courses) || !value.courses.every(string)) return null;
  return { chapterId: value.chapterId, courses: value.courses, itemId: value.itemId };
}

export function emptySave(seed: string): SilverSave {
  return { version: 1, seed, flags: {}, seen: [], registrations: {}, doneChapters: [], run: null, notebook: [] };
}

export function parseSave(raw: string): SilverSave | null {
  let value: unknown;
  try {
    value = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  if (!isObject(value) || value.version !== 1 || !string(value.seed) || value.seed.length === 0) return null;

  const flags: Record<string, string> = {};
  if (isObject(value.flags)) {
    for (const [key, flag] of Object.entries(value.flags)) {
      if (string(flag)) flags[key] = flag;
    }
  }
  const registrations: Partial<Record<TermId, string[]>> = {};
  if (isObject(value.registrations)) {
    for (const [term, courses] of Object.entries(value.registrations)) {
      if (/^[1-5]\.[1-4]$/.test(term) && Array.isArray(courses)) registrations[term as TermId] = strings(courses);
    }
  }
  const doneChapters = Array.isArray(value.doneChapters) ? value.doneChapters.filter(chapterId) : [];
  const notebook = Array.isArray(value.notebook)
    ? value.notebook.map(parseNotebook).filter((entry): entry is NotebookEntry => entry !== undefined)
    : [];

  return {
    version: 1,
    seed: value.seed,
    flags,
    seen: strings(value.seen),
    registrations,
    doneChapters,
    run: value.run === null ? null : parseRun(value.run),
    notebook,
  };
}

export function readSave(kv: KeyValue | null, makeSeed: () => string): { save: SilverSave; warning: SilverApi['saveWarning'] } {
  if (kv === null) return { save: emptySave(makeSeed()), warning: 'blocked' };
  let raw: string | null;
  try {
    raw = kv.getItem(SAVE_KEY);
  } catch {
    return { save: emptySave(makeSeed()), warning: 'blocked' };
  }
  if (raw === null) return { save: emptySave(makeSeed()), warning: null };
  const save = parseSave(raw);
  if (save !== null) return { save, warning: null };
  try {
    kv.setItem(`${SAVE_KEY}.bak`, raw);
  } catch {
    return { save: emptySave(makeSeed()), warning: 'blocked' };
  }
  return { save: emptySave(makeSeed()), warning: 'corrupt' };
}

export function writeSave(kv: KeyValue | null, save: SilverSave): boolean {
  if (kv === null) return false;
  try {
    kv.setItem(SAVE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

export function clearSave(kv: KeyValue | null): void {
  if (kv === null) return;
  try {
    kv.removeItem(SAVE_KEY);
  } catch {
    // Storage can be unavailable; clearing is best effort.
  }
}
