import { create } from 'zustand';
import { getCourse, catalog } from '../data/silver/catalog';
import { availableContentCodes, loadChapter, loadCourseContent } from '../data/silver/content';
import { getTerm, plan, plannedBefore } from '../data/silver/plan';
import { englishGrades } from '../silver/grades';
import { makeMemoryView, savedMemoryView, upsertEntry } from '../silver/notebook';
import { buildRegistration, defaultSelection, toggleSelection, type RegistrationInput } from '../silver/registration';
import { buildChapterQueue, buildTermQueue, gradeStep, matchCond, resolveStep } from '../silver/run';
import { clearSave, emptySave, readSave, writeSave, type KeyValue } from '../silver/save';
import type {
  ChapterCard, ChapterContent, ChapterId, Cond, CourseContent, Meeting, PlanTerm,
  RegistrationView, RunItem, SilverApi, SilverSave, TermId, UseSilver,
} from '../types/silver';

interface SilverStoreDeps {
  kv: KeyValue | null;
  makeSeed: () => string;
  now: () => string;
  loadChapter: typeof loadChapter;
  loadCourseContent: typeof loadCourseContent;
  contentCodes: ReadonlySet<string> | Promise<ReadonlySet<string>>;
}

const chapterIds: ChapterId[] = ['entrance', '1.1', '2.2'];
const chapterScreens = { recap: null, registration: null, week: null, play: null, transcript: null, memory: null };
const entrancePlaceholder: ChapterCard = {
  id: 'entrance',
  title: { vi: 'Ngày kiểm tra đầu vào', en: 'Placement test day' },
  subtitle: { vi: 'Trước ngày nhập học', en: 'Before the first term' },
  minutes: 0,
  status: 'coming-soon',
};
const NEXT_CLICK_GAP_MS = 250;

function placeholder(term: PlanTerm): ChapterCard {
  const [year, number] = term.term.split('.');
  const core = term.core.join(', ');
  return {
    id: term.term,
    title: number === '4'
      ? { vi: `Năm ${year} · Kỳ hè`, en: `Year ${year} · Summer term` }
      : { vi: `Năm ${year} · Kỳ ${number}`, en: `Year ${year} · Term ${number}` },
    subtitle: { vi: core, en: core },
    minutes: 0,
    status: 'coming-soon',
  };
}

function selectedCodes(view: RegistrationView): string[] {
  return view.rows.filter(row => row.selected).map(row => row.code);
}

export function createSilverStore(deps: SilverStoreDeps): UseSilver {
  const chapters = new Map<ChapterId, ChapterContent | undefined>();
  const courses = new Map<string, CourseContent | undefined>();
  const content = new Map<string, { tier: CourseContent['tier']; minutes: number }>();
  const reportedLoadErrors = new Set<ChapterId>();
  let registrationDataFailed = false;
  let pendingLoad: Promise<void> | null = null;
  let save: SilverSave;
  let queue: RunItem[] = [];
  let itemIndex = 0;
  let meetings: Meeting[] = [];
  let pendingFlags: Record<string, string> = {};
  let nextClickAt = 0;

  return create<SilverApi>()((set, get) => {
    const restored = readSave(deps.kv, deps.makeSeed);
    save = restored.save;

    function persist() {
      if (!writeSave(deps.kv, save)) set({ saveWarning: 'blocked' });
    }

    function storyContext() {
      return { seen: new Set(save.seen), flags: save.flags };
    }

    function memoryDeps() {
      const context = storyContext();
      return { match: (condition: Cond) => matchCond(condition, context), courseName: (code: string) => getCourse(code)?.name };
    }

    function registrationInput(term: PlanTerm, selected: string[]): RegistrationInput {
      const earlier = plan.terms.slice(0, plan.terms.indexOf(term)).flatMap(previous => {
        const registered = save.registrations[previous.term];
        return registered ? [{ term: previous, registered }] : [];
      });
      return { term, selected, earlier, catalog, plannedBefore: plannedBefore(term.term), content };
    }

    function card(chapter: ChapterContent): ChapterCard {
      const term = chapter.id === 'entrance' ? undefined : getTerm(chapter.id);
      const minutes = term?.kind === 'registration'
        ? buildRegistration(registrationInput(term, defaultSelection(term))).minutes
        : buildChapterQueue(chapter).reduce((sum, item) => sum + item.minutes, 0);
      const status = save.run?.chapterId === chapter.id ? 'in-progress'
        : save.doneChapters.includes(chapter.id) ? 'done' : 'new';
      return { id: chapter.id, title: chapter.title, subtitle: chapter.subtitle, minutes, status };
    }

    function homeViews() {
      const entrance = chapters.get('entrance');
      const cards = [entrance ? card(entrance) : entrancePlaceholder];
      for (const term of plan.terms) {
        const chapter = chapters.get(term.term);
        cards.push(chapter ? card(chapter) : placeholder(term));
      }
      const viewDeps = memoryDeps();
      return {
        chapters: cards,
        resumeId: save.run && chapters.get(save.run.chapterId) ? save.run.chapterId : null,
        notebook: save.notebook.flatMap(entry => {
          const chapter = chapters.get(entry.chapterId);
          return chapter ? [savedMemoryView(chapter, entry, viewDeps)] : [];
        }),
      };
    }

    function reportLoadError(id: ChapterId, error: unknown) {
      if (reportedLoadErrors.has(id)) return;
      reportedLoadErrors.add(id);
      console.error(`IT Silver: ${id}`, error);
    }

    async function loadCourses() {
      try {
        const codes = await deps.contentCodes;
        const results = await Promise.all([...codes].map(async code => {
          if (courses.has(code) || !getCourse(code)) return true;
          try {
            const course = await deps.loadCourseContent(code);
            if (course && course.code !== code) throw new Error(`Nội dung sai mã môn ${code}`);
            courses.set(code, course);
            if (course) {
              const sessionMinutes = course.sessions.reduce((sum, session) => sum + session.scene.minutes, 0);
              content.set(code, { tier: course.tier, minutes: sessionMinutes + (course.exam?.minutes ?? 0) });
            }
            return true;
          } catch (error) {
            reportLoadError('2.2', error);
            return false;
          }
        }));
        return results.every(Boolean);
      } catch (error) {
        reportLoadError('2.2', error);
        return false;
      }
    }

    async function loadData() {
      const results = await Promise.all(chapterIds.map(async id => {
        if (chapters.has(id)) return true;
        try {
          const chapter = await deps.loadChapter(id);
          if (chapter && chapter.id !== id) throw new Error(`Nội dung sai mã chương ${id}`);
          chapters.set(id, chapter);
          return true;
        } catch (error) {
          reportLoadError(id, error);
          return false;
        }
      }));
      registrationDataFailed = !!chapters.get('2.2') && !await loadCourses();
      const run = save.run;
      if (run && (!chapterIds.includes(run.chapterId) || chapters.has(run.chapterId) && !chapters.get(run.chapterId))) {
        save = { ...save, run: null };
        persist();
      }
      set({ ...homeViews(), status: results.every(Boolean) && !registrationDataFailed ? 'ready' : 'error' });
    }

    function currentChapter() {
      return save.run ? chapters.get(save.run.chapterId) : undefined;
    }

    function weekView(chapterId: TermId) {
      const current = queue[itemIndex]?.meeting;
      const nextMeeting = queue.slice(itemIndex).find(item => item.meeting)?.meeting;
      const nextIndex = nextMeeting ? meetings.indexOf(nextMeeting) : meetings.length;
      return {
        chapterId,
        meetings: meetings.map((meeting, index) => ({ ...meeting, done: index < nextIndex, current: meeting === current })),
        names: Object.fromEntries(meetings.flatMap(({ code }) => {
          const name = getCourse(code)?.name;
          return name ? [[code, name]] : [];
        })),
      };
    }

    function showItem(chapter: ChapterContent, enterWeek: boolean) {
      const item = queue[itemIndex];
      if (!item) return;
      const week = chapter.id !== 'entrance' && meetings.length ? weekView(chapter.id) : null;
      if (item.kind === 'memory') {
        const old = save.notebook.find(entry => entry.chapterId === chapter.id);
        const memory = makeMemoryView(chapter, save.run?.courses ?? [], old, memoryDeps());
        set({ ...chapterScreens, screen: 'memory', memory });
      } else if (item.kind === 'transcript' && chapter.englishLevel !== undefined) {
        set({ ...chapterScreens, screen: 'transcript', transcript: englishGrades(save.seed, chapter.englishLevel) });
      } else if (enterWeek && week) {
        set({ ...chapterScreens, screen: 'week', week });
      } else {
        const step = item.scene?.steps[0];
        if (!item.scene || !step) return;
        set({
          ...chapterScreens, screen: 'play', week,
          play: {
            chapterId: chapter.id, itemIndex, itemCount: queue.length, item, stepIndex: 0,
            stepCount: item.scene.steps.length, step: resolveStep(step, storyContext()),
            attempts: 0, feedback: null, hint: null, canContinue: step.type === 'say' || step.type === 'slide',
          },
        });
      }
    }

    function beginQueue(chapter: ChapterContent, items: RunItem[], codes: string[], startAt?: string) {
      queue = items;
      itemIndex = Math.max(0, queue.findIndex(item => item.id === startAt));
      const item = queue[itemIndex];
      if (!item) return;
      save = { ...save, run: { chapterId: chapter.id, itemId: item.id, courses: codes } };
      persist();
      set(homeViews());
      showItem(chapter, startAt === undefined && item.meeting !== undefined);
    }

    function beginTerm(chapter: ChapterContent, view: RegistrationView, startAt?: string) {
      const rows = view.rows.filter(row => row.selected);
      const codes = rows.map(row => row.code);
      meetings = view.meetings;
      const loadedCourses = new Map([...courses].flatMap(([code, course]) => course ? [[code, course]] : []));
      beginQueue(chapter, buildTermQueue(chapter, rows, loadedCourses, meetings), codes, startAt);
    }

    function enterChapter(chapter: ChapterContent, resume: boolean) {
      const run = save.run;
      const term = chapter.id === 'entrance' ? undefined : getTerm(chapter.id);
      if (term?.kind !== 'registration') {
        beginQueue(chapter, buildChapterQueue(chapter), [], resume ? run?.itemId : undefined);
        return;
      }
      const confirmed = resume && run?.courses.length ? run.courses : undefined;
      const savedSelection = confirmed ?? save.registrations[term.term] ?? defaultSelection(term);
      const selected = [...new Set([...savedSelection, ...term.core])];
      const view = buildRegistration(registrationInput(term, selected));
      const codes = selectedCodes(view);
      if (confirmed && view.problem === null && confirmed.length === codes.length && confirmed.every(code => codes.includes(code))) {
        beginTerm(chapter, view, run?.itemId);
        return;
      }
      set({ ...chapterScreens, screen: 'registration', registration: view });
    }

    function resetPlay() {
      queue = [];
      itemIndex = 0;
      meetings = [];
      pendingFlags = {};
      nextClickAt = 0;
    }

    function leave(screen: 'home' | 'closed' | 'notebook') {
      resetPlay();
      set({ ...chapterScreens, screen });
    }

    function finishItem(completed: boolean) {
      const chapter = currentChapter();
      const run = save.run;
      const item = queue[itemIndex];
      const next = queue[itemIndex + 1];
      if (!chapter || !run || !item || !next) return;
      if (completed && item.scene) {
        const seen = save.seen.includes(item.scene.id) ? save.seen : [...save.seen, item.scene.id];
        save = { ...save, seen, flags: { ...save.flags, ...pendingFlags } };
      }
      pendingFlags = {};
      itemIndex += 1;
      save = { ...save, run: { ...run, itemId: next.id } };
      persist();
      showItem(chapter, next.meeting !== undefined && next.meeting !== item.meeting);
    }

    return {
      ...chapterScreens, status: 'loading', screen: 'closed', saveWarning: restored.warning,
      chapters: [], resumeId: null, notebook: [],
      load: () => {
        if (pendingLoad) return pendingLoad;
        if (get().status === 'ready') return Promise.resolve();
        pendingLoad = Promise.resolve().then(loadData).finally(() => { pendingLoad = null; });
        set({ status: 'loading' });
        return pendingLoad;
      },
      openHome: () => leave('home'),
      close: () => leave('closed'),
      openNotebook: () => leave('notebook'),
      startChapter: (id, mode) => {
        const chapter = chapters.get(id);
        if (get().status === 'loading' || !chapter || id === '2.2' && registrationDataFailed) return;
        const resume = mode === 'resume' && save.run?.chapterId === id;
        if (mode === 'resume' && !resume) return;
        resetPlay();
        if (!resume) {
          const item = buildChapterQueue(chapter)[0];
          if (!item) return;
          save = { ...save, run: { chapterId: id, itemId: item.id, courses: [] } };
          if (id !== 'entrance' && id !== '1.1' && !save.doneChapters.includes('1.1')) {
            persist();
            set({ ...homeViews(), ...chapterScreens, screen: 'recap', recap: { chapterId: id, text: chapter.recap } });
            return;
          }
          if (getTermForRegistration(id)) {
            persist();
            set(homeViews());
          }
        }
        enterChapter(chapter, resume);
      },
      confirmRecap: () => {
        const chapter = currentChapter();
        if (get().screen === 'recap' && chapter) enterChapter(chapter, false);
      },
      toggleCourse: code => {
        const { screen, registration } = get();
        if (screen !== 'registration' || !registration) return;
        const term = getTerm(registration.chapterId);
        if (!term) return;
        const input = registrationInput(term, selectedCodes(registration));
        const selected = toggleSelection(input, code);
        set({ registration: buildRegistration({ ...input, selected }) });
      },
      resetRegistration: () => {
        const { screen, registration } = get();
        if (screen !== 'registration' || !registration) return;
        const term = getTerm(registration.chapterId);
        if (term) set({ registration: buildRegistration(registrationInput(term, defaultSelection(term))) });
      },
      confirmRegistration: () => {
        const { screen, registration } = get();
        const chapter = currentChapter();
        if (screen !== 'registration' || !chapter || !registration || registration.problem !== null) return;
        const codes = selectedCodes(registration);
        save = { ...save, registrations: { ...save.registrations, [registration.chapterId]: codes } };
        beginTerm(chapter, registration);
      },
      openWeek: () => {
        const { screen, week, play } = get();
        if (screen === 'play' && week && play?.item.meeting) set({ screen: 'week' });
      },
      playNext: () => {
        const chapter = currentChapter();
        const { screen, play } = get();
        if (screen !== 'week' || !chapter) return;
        nextClickAt = 0;
        if (play) set({ screen: 'play' });
        else showItem(chapter, false);
      },
      answer: value => {
        const { screen, play } = get();
        if (screen !== 'play' || !play || play.feedback) return;
        const { step } = play;
        if (step.type === 'choice') {
          const option = step.options.find(option => option.id === value);
          if (!option) return;
          nextClickAt = 0;
          if (step.flag !== undefined) pendingFlags = { ...pendingFlags, [step.flag]: option.id };
          set({ play: { ...play, feedback: { kind: 'choice', optionId: option.id, reply: option.reply }, canContinue: true } });
        } else if (step.type === 'question' || step.type === 'order' || step.type === 'code') {
          nextClickAt = 0;
          const { correct, explain, output } = gradeStep(step, value);
          set({ play: { ...play, feedback: { kind: 'graded', correct, explain, output, revealed: false }, canContinue: correct, attempts: play.attempts + 1 } });
        }
      },
      retry: () => {
        const { screen, play } = get();
        const feedback = play?.feedback;
        if (screen === 'play' && play && feedback?.kind === 'graded' && !feedback.correct && !feedback.revealed) {
          set({ play: { ...play, feedback: null, canContinue: false } });
        }
      },
      revealAnswer: () => {
        const { screen, play } = get();
        const feedback = play?.feedback;
        if (screen !== 'play' || !play || feedback?.kind !== 'graded' || feedback.correct || feedback.revealed) return;
        const { step } = play;
        if (step.type === 'question' || step.type === 'order' || step.type === 'code') {
          const { correctAnswer } = gradeStep(step, '');
          set({ play: { ...play, feedback: { ...feedback, revealed: true, correctAnswer }, canContinue: true } });
        }
      },
      showHint: () => {
        const { screen, play } = get();
        if (screen === 'play' && play?.step.type === 'code' && !play.hint) set({ play: { ...play, hint: play.step.hint } });
      },
      nextStep: () => {
        const { screen, play } = get();
        const clickAt = performance.now();
        if (screen !== 'play' || !play?.canContinue || clickAt < nextClickAt) return;
        // The next step may also be a line of dialogue. Ignore a second click from the same burst.
        nextClickAt = clickAt + NEXT_CLICK_GAP_MS;
        const stepIndex = play.stepIndex + 1;
        const step = play.item.scene?.steps[stepIndex];
        if (step) {
          set({ play: {
            ...play, stepIndex, step: resolveStep(step, storyContext()), feedback: null,
            attempts: 0, hint: null, canContinue: step.type === 'say' || step.type === 'slide',
          } });
        } else {
          finishItem(true);
        }
      },
      skipItem: () => {
        if (get().screen === 'play') finishItem(false);
      },
      exitRun: () => leave('home'),
      confirmTranscript: () => {
        if (get().screen === 'transcript') finishItem(false);
      },
      pickPhoto: id => {
        const { screen, memory } = get();
        if (screen !== 'memory' || !memory || memory.photo.id === id) return;
        const photo = memory.photoChoices.find(photo => photo.id === id);
        if (photo) set({ memory: { ...memory, photo } });
      },
      saveMemory: mode => {
        const { screen, memory } = get();
        if (screen !== 'memory' || !memory || !save.run) return;
        const { chapterId, courses } = save.run;
        const notebook = mode === 'keep-old' && memory.hasOld ? save.notebook : upsertEntry(save.notebook, {
          chapterId, courses, photoId: memory.photo.id, lineId: memory.line.id, savedAt: deps.now(),
        });
        const doneChapters = save.doneChapters.includes(chapterId) ? save.doneChapters : [...save.doneChapters, chapterId];
        save = { ...save, notebook, doneChapters, run: null };
        persist();
        set(homeViews());
        leave('home');
      },
      clearAll: () => {
        clearSave(deps.kv);
        save = emptySave(deps.makeSeed());
        set({ ...homeViews(), saveWarning: get().saveWarning === 'blocked' ? 'blocked' : null });
        leave('home');
      },
    };
  });
}

function getTermForRegistration(id: ChapterId): boolean {
  return id !== 'entrance' && getTerm(id)?.kind === 'registration';
}

function browserStorage(): KeyValue | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export const useSilverStore = createSilverStore({
  kv: browserStorage(),
  makeSeed: () => globalThis.crypto.randomUUID(),
  now: () => new Date().toISOString(),
  loadChapter, loadCourseContent, contentCodes: availableContentCodes,
});
