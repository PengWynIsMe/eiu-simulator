import { create } from 'zustand';
import type { LocalizedText } from '../../../types';
import type {
  ChapterCard,
  ChapterId,
  Feedback,
  Meeting,
  MemoryView,
  PlayView,
  RegistrationRow,
  RegistrationView,
  RunItem,
  SilverApi,
  SilverScreen,
  SilverStep,
  Transcript,
  WeekView,
} from '../../../types/silver';
import { useLangStore } from '../../../store/useLangStore';
import rawFixture from './fixture.json';

interface MockFixture {
  chapters: ChapterCard[];
  recap: { chapterId: ChapterId; text: LocalizedText };
  registration: RegistrationView;
  week: WeekView;
  playItem: RunItem;
  transcript: Transcript;
  memory: MemoryView;
  notebook: MemoryView[];
}

interface MockSession {
  chapterId: ChapterId;
  courses: string[];
  itemIndex: number;
  phase: 'recap' | 'registration' | 'week' | 'play' | 'transcript' | 'memory';
  doneMeetings: number;
}

const STORAGE_KEY = 'silver.mock';

const VALID_SCREENS: ReadonlySet<string> = new Set([
  'home',
  'recap',
  'registration',
  'week',
  'play',
  'transcript',
  'memory',
  'notebook',
]);

type MockStateParam = 'loading' | 'error' | 'empty' | 'blocked' | 'corrupt' | 'old' | 'long' | null;

interface UrlParams {
  silver: SilverScreen | null;
  state: MockStateParam;
  step: number | null;
}

function readUrlParamsOnce(): UrlParams {
  if (typeof window === 'undefined') return { silver: null, state: null, step: null };
  const params = new URLSearchParams(window.location.search);
  const langParam = params.get('lang');
  if (langParam === 'en' || langParam === 'vi') {
    useLangStore.getState().setLang(langParam);
  }
  const silverRaw = params.get('silver');
  const silver = silverRaw && VALID_SCREENS.has(silverRaw) ? (silverRaw as SilverScreen) : null;
  const stateRaw = params.get('state');
  const validStates: ReadonlySet<string> = new Set(['loading', 'error', 'empty', 'blocked', 'corrupt', 'old', 'long']);
  const state = stateRaw && validStates.has(stateRaw) ? (stateRaw as MockStateParam) : null;
  const stepRaw = params.get('step');
  const parsedStep = stepRaw ? Number.parseInt(stepRaw, 10) : Number.NaN;
  const step = Number.isFinite(parsedStep) && parsedStep >= 1 ? parsedStep : null;
  return { silver, state, step };
}

const URL_PARAMS = readUrlParamsOnce();

function isLocalizedText(value: unknown): value is LocalizedText {
  return (
    typeof value === 'object' &&
    value !== null &&
    'vi' in value &&
    'en' in value &&
    typeof (value as { vi: unknown }).vi === 'string' &&
    typeof (value as { en: unknown }).en === 'string' &&
    Object.keys(value).length === 2
  );
}

function tripleLocalized<T>(value: T): T {
  if (isLocalizedText(value)) {
    return {
      vi: `${value.vi} ${value.vi} ${value.vi}`,
      en: `${value.en} ${value.en} ${value.en}`,
    } as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => tripleLocalized(item)) as T;
  }
  if (typeof value === 'object' && value !== null) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = tripleLocalized(v);
    }
    return out as T;
  }
  return value;
}

function cloneFixture(): MockFixture {
  const copy = JSON.parse(JSON.stringify(rawFixture)) as MockFixture;
  if (URL_PARAMS.state === 'long') {
    const tripled = tripleLocalized(copy);
    const sample = tripled.notebook[0];
    if (sample) {
      tripled.notebook = Array.from({ length: 20 }, (_, i) => ({
        ...sample,
        chapterId: (`${Math.floor(i / 3) + 1}.${(i % 3) + 1}` as ChapterId),
        savedAt: new Date(Date.now() - i * 86_400_000).toISOString(),
      }));
    }
    return tripled;
  }
  return copy;
}

function readSession(): MockSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MockSession>;
    if (typeof parsed.chapterId !== 'string') return null;
    return {
      chapterId: parsed.chapterId as ChapterId,
      courses: Array.isArray(parsed.courses) ? parsed.courses : [],
      itemIndex: typeof parsed.itemIndex === 'number' ? parsed.itemIndex : 0,
      phase: parsed.phase ?? 'play',
      doneMeetings: typeof parsed.doneMeetings === 'number' ? parsed.doneMeetings : 0,
    };
  } catch {
    return null;
  }
}

function writeSession(session: MockSession | null): void {
  try {
    if (!session) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  } catch {
    // Bỏ qua khi bộ nhớ trình duyệt bị chặn.
  }
}

function buildSceneItems(baseItem: RunItem, chapterId: ChapterId): RunItem[] {
  const baseScene = baseItem.scene;
  if (!baseScene) return [];
  return [1, 2].map((n) => ({
    id: `${chapterId}:scene-${n}`,
    kind: 'scene',
    minutes: baseItem.minutes,
    scene: {
      ...baseScene,
      id: `${chapterId}/scene-${n}`,
      title:
        n === 1
          ? baseScene.title
          : {
              vi: `${baseScene.title.vi} (phần 2)`,
              en: `${baseScene.title.en} (part 2)`,
            },
      steps: baseScene.steps.map((s) => ({ ...s })),
    },
  }));
}

function buildMeetingPlayItem(baseItem: RunItem, meeting: Meeting, index: number): RunItem {
  const baseScene = baseItem.scene;
  const allSteps = baseScene?.steps ?? [];
  const chosenSteps = [allSteps[0], allSteps[1], allSteps[3]].filter((s): s is SilverStep => Boolean(s));
  return {
    id: `session:${meeting.code}:${meeting.kind}:${index}`,
    kind: 'session',
    courseCode: meeting.code,
    meeting,
    minutes: 3,
    scene: baseScene
      ? {
          ...baseScene,
          id: `${meeting.code}/${meeting.kind}-${index}`,
          steps: chosenSteps,
        }
      : undefined,
  };
}

function buildExamPlayItem(baseItem: RunItem): RunItem {
  const baseScene = baseItem.scene;
  const allSteps = baseScene?.steps ?? [];
  const chosenSteps = [allSteps[3], allSteps[5], allSteps[6]].filter((s): s is SilverStep => Boolean(s));
  return {
    id: 'exam:2.2',
    kind: 'exam',
    minutes: 5,
    scene: baseScene
      ? {
          ...baseScene,
          id: '2.2/exam',
          title: { vi: 'Kiểm tra cuối kỳ', en: 'Final Exam' },
          steps: chosenSteps,
        }
      : undefined,
  };
}

function makePlayView(chapterId: ChapterId, queue: RunItem[], itemIndex: number, stepIndex: number): PlayView {
  const item = queue[itemIndex] ?? queue[0];
  if (!item) {
    throw new Error('Dữ liệu mock thiếu RunItem');
  }
  const steps = item.scene?.steps ?? [];
  const clampedStep = Math.max(0, Math.min(stepIndex, Math.max(0, steps.length - 1)));
  const step = steps[clampedStep];
  if (!step) {
    throw new Error('Dữ liệu mock thiếu SilverStep');
  }
  return {
    chapterId,
    itemIndex,
    itemCount: queue.length,
    item,
    stepIndex: clampedStep,
    stepCount: steps.length,
    step,
    feedback: null,
    attempts: 0,
    hint: null,
    canContinue: step.type === 'say' || step.type === 'slide',
  };
}

function recalcRegistration(rows: RegistrationRow[], maxCourses: number, meetings: Meeting[]): RegistrationView {
  const selectedRows = rows.filter((r) => r.selected);
  const credits = selectedRows.reduce((acc, r) => acc + r.credits, 0);
  const count = selectedRows.length;
  const problem = count < 3 ? 'too-few' : count > maxCourses ? 'too-many' : null;
  const minutes = Math.max(10, 31 + 2 * (count - 4));
  return {
    chapterId: '2.2',
    rows,
    credits,
    minutes,
    maxCourses,
    problem,
    meetings,
  };
}

function createInitialData() {
  const fixture = cloneFixture();
  const isEmpty = URL_PARAMS.state === 'empty';
  const saved = isEmpty ? null : readSession();

  const initialChapters: ChapterCard[] = isEmpty ? [] : fixture.chapters;
  const initialNotebook: MemoryView[] = isEmpty ? [] : fixture.notebook;
  const initialMemory: MemoryView | null = isEmpty
    ? null
    : URL_PARAMS.state === 'old'
      ? { ...fixture.memory, hasOld: true, savedAt: '2026-11-23T08:00:00.000Z' }
      : fixture.memory;

  const initialPlaySteps = fixture.playItem.scene?.steps ?? [];
  const requestedStepIdx = URL_PARAMS.step ? Math.min(Math.max(0, URL_PARAMS.step - 1), Math.max(0, initialPlaySteps.length - 1)) : 0;
  const initialPlay: PlayView | null = isEmpty
    ? null
    : makePlayView('2.2', [fixture.playItem], 0, requestedStepIdx);

  const initialReg = isEmpty ? null : fixture.registration;
  const initialWeek = isEmpty ? null : fixture.week;
  const initialRecap = isEmpty ? null : fixture.recap;
  const initialTranscript = isEmpty ? null : fixture.transcript;

  const saveWarning: SilverApi['saveWarning'] =
    URL_PARAMS.state === 'blocked' ? 'blocked' : URL_PARAMS.state === 'corrupt' ? 'corrupt' : null;

  const initialScreen: SilverScreen = URL_PARAMS.silver ?? 'closed';
  const resumeId: ChapterId | null = isEmpty ? null : (saved?.chapterId ?? '1.1');

  return {
    fixture,
    saveWarning,
    initialScreen,
    initialChapters,
    resumeId,
    initialRecap,
    initialReg,
    initialWeek,
    initialPlay,
    initialTranscript,
    initialMemory,
    initialNotebook,
    saved,
  };
}

const INIT = createInitialData();
let activeQueue: RunItem[] = INIT.initialPlay ? [INIT.initialPlay.item] : [];
let activeChapter: ChapterId = INIT.saved?.chapterId ?? '1.1';
let activeCourses: string[] =
  INIT.saved?.courses ?? INIT.fixture.registration.rows.filter((r) => r.selected).map((r) => r.code);
let doneMeetings = INIT.saved?.doneMeetings ?? 0;
let initialFixtureRegRows = JSON.parse(JSON.stringify(INIT.fixture.registration.rows)) as RegistrationRow[];
let loadTimer: ReturnType<typeof setTimeout> | null = null;

function buildWeekView(doneCount: number): WeekView {
  const meetings = INIT.fixture.week.meetings.map((m, idx) => ({
    ...m,
    done: idx < doneCount,
    current: idx === doneCount,
  }));
  return {
    chapterId: '2.2',
    meetings,
    names: INIT.fixture.week.names,
  };
}

export const useSilverMock = create<SilverApi>((set, get) => ({
  status: URL_PARAMS.state === 'error' ? 'error' : 'loading',
  saveWarning: INIT.saveWarning,
  screen: INIT.initialScreen,
  chapters: INIT.initialChapters,
  resumeId: INIT.resumeId,
  recap: INIT.initialRecap,
  registration: INIT.initialReg,
  week: INIT.initialWeek,
  play: INIT.initialPlay,
  transcript: INIT.initialTranscript,
  memory: INIT.initialMemory,
  notebook: INIT.initialNotebook,

  load: async () => {
    if (loadTimer) {
      clearTimeout(loadTimer);
      loadTimer = null;
    }
    set({ status: 'loading' });
    await new Promise<void>((resolve) => {
      loadTimer = setTimeout(resolve, 300);
    });
    if (URL_PARAMS.state === 'loading') return;
    if (URL_PARAMS.state === 'error') {
      set({ status: 'error' });
      return;
    }
    set({ status: 'ready' });
  },

  openHome: () => {
    set((s) => ({
      screen: 'home',
      chapters: s.chapters,
    }));
  },

  close: () => {
    set({ screen: 'closed' });
  },

  openNotebook: () => {
    set({ screen: 'notebook' });
  },

  startChapter: (id, mode) => {
    const s = get();
    const card = s.chapters.find((c) => c.id === id);
    if (card?.status === 'coming-soon') return;

    const existing = mode === 'resume' ? readSession() : null;
    if (mode === 'restart') {
      writeSession(null);
      doneMeetings = 0;
    }

    activeChapter = id;

    if (id === '2.2') {
      if (existing && existing.chapterId === '2.2') {
        activeCourses = existing.courses;
        doneMeetings = existing.doneMeetings;
        if (existing.phase === 'week') {
          set({
            screen: 'week',
            week: buildWeekView(doneMeetings),
            resumeId: '2.2',
          });
          return;
        }
        if (existing.phase === 'registration') {
          set({
            screen: 'registration',
            registration: INIT.fixture.registration,
            resumeId: '2.2',
          });
          return;
        }
      }
      writeSession({
        chapterId: '2.2',
        courses: activeCourses,
        itemIndex: 0,
        phase: 'recap',
        doneMeetings: 0,
      });
      set({
        screen: 'recap',
        recap: INIT.fixture.recap,
        resumeId: '2.2',
      });
      return;
    }

    const queue = buildSceneItems(INIT.fixture.playItem, id);
    activeQueue = queue;
    const resumeIdx =
      existing && existing.chapterId === id ? Math.min(existing.itemIndex, Math.max(0, queue.length - 1)) : 0;

    writeSession({
      chapterId: id,
      courses: [],
      itemIndex: resumeIdx,
      phase: 'play',
      doneMeetings: 0,
    });

    set({
      screen: 'play',
      play: makePlayView(id, queue, resumeIdx, 0),
      resumeId: id,
    });
  },

  confirmRecap: () => {
    writeSession({
      chapterId: activeChapter,
      courses: activeCourses,
      itemIndex: 0,
      phase: 'registration',
      doneMeetings: 0,
    });
    set({
      screen: 'registration',
      registration: recalcRegistration(
        JSON.parse(JSON.stringify(initialFixtureRegRows)) as RegistrationRow[],
        INIT.fixture.registration.maxCourses,
        INIT.fixture.registration.meetings,
      ),
    });
  },

  toggleCourse: (code) => {
    const reg = get().registration;
    if (!reg) return;
    const rows = reg.rows.map((row) => {
      if (row.code !== code) return row;
      if (row.locked || row.status.code !== 'available') return row;
      return { ...row, selected: !row.selected };
    });
    const nextReg = recalcRegistration(rows, reg.maxCourses, reg.meetings);
    activeCourses = rows.filter((r) => r.selected).map((r) => r.code);
    set({ registration: nextReg });
  },

  resetRegistration: () => {
    const reg = get().registration;
    if (!reg) return;
    const rows = JSON.parse(JSON.stringify(initialFixtureRegRows)) as RegistrationRow[];
    activeCourses = rows.filter((r) => r.selected).map((r) => r.code);
    set({ registration: recalcRegistration(rows, reg.maxCourses, reg.meetings) });
  },

  confirmRegistration: () => {
    const reg = get().registration;
    if (reg?.problem) return;
    doneMeetings = 0;
    writeSession({
      chapterId: '2.2',
      courses: activeCourses,
      itemIndex: 0,
      phase: 'week',
      doneMeetings: 0,
    });
    set({
      screen: 'week',
      week: buildWeekView(0),
    });
  },

  openWeek: () => {
    set({
      screen: 'week',
      week: buildWeekView(doneMeetings),
    });
  },

  playNext: () => {
    const meetings = INIT.fixture.week.meetings;
    const currentMeeting = meetings[doneMeetings];
    if (currentMeeting) {
      const item = buildMeetingPlayItem(INIT.fixture.playItem, currentMeeting, doneMeetings);
      activeQueue = [item];
      writeSession({
        chapterId: '2.2',
        courses: activeCourses,
        itemIndex: doneMeetings,
        phase: 'play',
        doneMeetings,
      });
      set({
        screen: 'play',
        play: makePlayView('2.2', activeQueue, 0, 0),
      });
      return;
    }

    const examItem = buildExamPlayItem(INIT.fixture.playItem);
    activeQueue = [examItem];
    writeSession({
      chapterId: '2.2',
      courses: activeCourses,
      itemIndex: meetings.length,
      phase: 'play',
      doneMeetings,
    });
    set({
      screen: 'play',
      play: makePlayView('2.2', activeQueue, 0, 0),
    });
  },

  answer: (value) => {
    const play = get().play;
    if (!play) return;
    const step = play.step;

    if (step.type === 'choice') {
      const opt = step.options.find((o) => o.id === value);
      const feedback: Feedback = { kind: 'choice', optionId: value, reply: opt?.reply };
      set({
        play: {
          ...play,
          feedback,
          canContinue: true,
        },
      });
      return;
    }

    if (step.type === 'question') {
      const correct = value === step.answerId;
      const feedback: Feedback = {
        kind: 'graded',
        correct,
        explain: correct ? step.explainCorrect : step.explainWrong,
        revealed: false,
      };
      set({
        play: {
          ...play,
          feedback,
          attempts: play.attempts + 1,
          canContinue: correct,
        },
      });
      return;
    }

    if (step.type === 'order') {
      const correct = value === step.answer.join(',');
      const feedback: Feedback = {
        kind: 'graded',
        correct,
        explain: correct ? step.explainCorrect : step.explainWrong,
        revealed: false,
      };
      set({
        play: {
          ...play,
          feedback,
          attempts: play.attempts + 1,
          canContinue: correct,
        },
      });
      return;
    }

    if (step.type === 'code') {
      const trimmed = value.trim();
      const correct = step.answers.includes(trimmed);
      const feedback: Feedback = {
        kind: 'graded',
        correct,
        output: correct ? step.outputCorrect : step.outputWrong,
        explain: correct ? undefined : step.explainWrong,
        revealed: false,
      };
      set({
        play: {
          ...play,
          feedback,
          attempts: play.attempts + 1,
          canContinue: correct,
        },
      });
    }
  },

  retry: () => {
    const play = get().play;
    if (!play) return;
    set({
      play: {
        ...play,
        feedback: null,
        canContinue: false,
      },
    });
  },

  revealAnswer: () => {
    const play = get().play;
    if (!play) return;
    const step = play.step;
    let correctAnswer = '';
    let explain: LocalizedText | undefined;
    if (step.type === 'question') {
      correctAnswer = step.answerId;
      explain = step.explainCorrect;
    } else if (step.type === 'order') {
      correctAnswer = step.answer.join(',');
      explain = step.explainCorrect;
    } else if (step.type === 'code') {
      correctAnswer = step.answers[0] ?? '';
      explain = step.hint;
    }
    const prevExplain = play.feedback?.kind === 'graded' ? play.feedback.explain : undefined;
    set({
      play: {
        ...play,
        feedback: {
          kind: 'graded',
          correct: false,
          revealed: true,
          correctAnswer,
          output: step.type === 'code' ? step.outputCorrect : undefined,
          explain: explain ?? prevExplain,
        },
        canContinue: true,
      },
    });
  },

  showHint: () => {
    const play = get().play;
    if (!play || play.step.type !== 'code') return;
    set({
      play: {
        ...play,
        hint: play.step.hint,
      },
    });
  },

  nextStep: () => {
    const play = get().play;
    if (!play || !play.canContinue) return;
    const nextIdx = play.stepIndex + 1;
    if (nextIdx < play.stepCount) {
      set({
        play: makePlayView(play.chapterId, activeQueue, play.itemIndex, nextIdx),
      });
      return;
    }
    get().skipItem();
  },

  skipItem: () => {
    const play = get().play;
    if (!play) return;

    if (play.chapterId === '2.2') {
      if (play.item.kind === 'session') {
        doneMeetings = Math.min(INIT.fixture.week.meetings.length, doneMeetings + 1);
        writeSession({
          chapterId: '2.2',
          courses: activeCourses,
          itemIndex: doneMeetings,
          phase: 'week',
          doneMeetings,
        });
        set({
          screen: 'week',
          week: buildWeekView(doneMeetings),
        });
        return;
      }
      set({
        screen: 'memory',
        memory: {
          ...INIT.fixture.memory,
          chapterId: '2.2',
          title: { vi: 'Năm 2 · Kỳ 2 — Vào chuyên ngành', en: 'Year 2 · Term 2 — Into the major' },
          stamp: { vi: 'CHUYÊN NGÀNH', en: 'MAJOR START' },
          hasOld: URL_PARAMS.state === 'old',
        },
      });
      return;
    }

    const nextItemIdx = play.itemIndex + 1;
    if (nextItemIdx < activeQueue.length) {
      writeSession({
        chapterId: play.chapterId,
        courses: [],
        itemIndex: nextItemIdx,
        phase: 'play',
        doneMeetings: 0,
      });
      set({
        play: makePlayView(play.chapterId, activeQueue, nextItemIdx, 0),
      });
      return;
    }

    if (play.chapterId === '1.1') {
      writeSession({
        chapterId: '1.1',
        courses: [],
        itemIndex: play.itemIndex,
        phase: 'transcript',
        doneMeetings: 0,
      });
      set({
        screen: 'transcript',
        transcript: INIT.fixture.transcript,
      });
      return;
    }

    set({
      screen: 'memory',
      memory: {
        ...INIT.fixture.memory,
        chapterId: play.chapterId,
        hasOld: URL_PARAMS.state === 'old',
      },
    });
  },

  exitRun: () => {
    const s = get();
    const chId = s.play?.chapterId ?? s.week?.chapterId ?? s.registration?.chapterId ?? s.recap?.chapterId ?? activeChapter;
    set({
      screen: 'home',
      resumeId: chId,
    });
  },

  confirmTranscript: () => {
    writeSession({
      chapterId: '1.1',
      courses: [],
      itemIndex: 0,
      phase: 'memory',
      doneMeetings: 0,
    });
    set({
      screen: 'memory',
      memory: {
        ...INIT.fixture.memory,
        chapterId: '1.1',
        hasOld: URL_PARAMS.state === 'old' || get().notebook.some((n) => n.chapterId === '1.1'),
      },
    });
  },

  pickPhoto: (photoId) => {
    const mem = get().memory;
    if (!mem) return;
    const found = mem.photoChoices.find((p) => p.id === photoId);
    if (!found) return;
    set({
      memory: {
        ...mem,
        photo: found,
      },
    });
  },

  saveMemory: (mode) => {
    const s = get();
    const mem = s.memory;
    if (!mem) {
      set({ screen: 'home', resumeId: null });
      return;
    }
    const nowIso = new Date().toISOString();
    let nextNotebook = [...s.notebook];
    if (mode === 'replace' || !s.notebook.some((n) => n.chapterId === mem.chapterId)) {
      const savedEntry: MemoryView = {
        ...mem,
        hasOld: true,
        savedAt: nowIso,
      };
      const idx = nextNotebook.findIndex((n) => n.chapterId === mem.chapterId);
      if (idx >= 0) {
        nextNotebook[idx] = savedEntry;
      } else {
        nextNotebook = [savedEntry, ...nextNotebook];
      }
    }

    const nextChapters = s.chapters.map((c) =>
      c.id === mem.chapterId ? { ...c, status: 'done' as const } : c,
    );
    writeSession(null);
    doneMeetings = 0;

    set({
      screen: 'home',
      chapters: nextChapters,
      notebook: nextNotebook,
      resumeId: null,
    });
  },

  clearAll: () => {
    writeSession(null);
    doneMeetings = 0;
    initialFixtureRegRows = JSON.parse(JSON.stringify(INIT.fixture.registration.rows)) as RegistrationRow[];
    set((s) => ({
      chapters: s.chapters.map((c) =>
        c.status === 'coming-soon' ? c : { ...c, status: 'new' as const },
      ),
      notebook: [],
      resumeId: null,
    }));
  },
}));
