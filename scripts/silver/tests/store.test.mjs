import { setTimeout as wait } from 'node:timers/promises';

const SAVE_KEY = 'campussim.silver.v1';
const text = value => ({ vi: value, en: value });
const say = id => ({ id, type: 'say', speaker: 'han', text: text(id) });
const choice = (id, flag) => ({
  id, type: 'choice', speaker: 'han', text: text(id), flag,
  options: [{ id: 'yes', text: text('yes'), reply: text('good') }, { id: 'no', text: text('no') }],
});
const question = {
  id: 'quiz', type: 'question', prompt: text('quiz'), options: choice('options').options,
  answerId: 'yes', explainCorrect: text('right'), explainWrong: text('wrong'),
};
const code = {
  id: 'code', type: 'code', title: text('code'), instruction: text('fill'), template: '___(1)',
  answers: ['println', 'print'], outputCorrect: '1', outputWrong: 'error',
  hint: text('print line'), explainWrong: text('try again'),
};
const scene = (id, steps = [say('start')]) => ({
  id, title: text(id), place: 'b8', minutes: 2, steps,
});

function chapter(id, changes = {}) {
  return {
    version: 1, id, title: text(id), subtitle: text('subtitle'), recap: text('earlier'),
    opening: [scene(`${id}/opening`)], scenes: [], closing: [],
    memory: {
      stamp: text('stamp'),
      photos: [
        { id: 'new', caption: text('new'), when: { flag: { key: 'tour', is: 'yes' } } },
        { id: 'default', caption: text('default') },
      ],
      lines: [
        { id: 'new-line', text: text('new line'), when: { flag: { key: 'tour', is: 'yes' } } },
        { id: 'default-line', text: text('default line') },
      ],
      activities: [text('activity')],
    },
    ...changes,
  };
}

function course(code, core = false) {
  const slots = core ? ['lab', 'lab', 'theoryA', 'theoryB'] : ['theoryA', 'theoryB'];
  return {
    version: 1, code, tier: core ? 'core' : 'summary', status: 'da-duyet',
    basis: { pdfPages: '1', note: text('simulation') }, summary: text(code),
    sessions: slots.map((slot, index) => ({ slot, scene: scene(`${code}/${index}`) })),
    ...(core ? { exam: scene(`${code}/exam`, [question]) } : {}),
    closing: text('done'),
  };
}

const defaultCodes = ['CSE 103', 'MATH 112', 'POLS 135', 'COMS 101'];
const testCourses = new Map(defaultCodes.map((code, index) => [code, course(code, index === 0)]));

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
}

async function setup(load, overrides = {}) {
  const { createSilverStore } = await load('/src/store/useSilverStore.ts');
  const fixtures = new Map([
    ['entrance', chapter('entrance', { scenes: [scene('entrance/second', [say('first'), say('second')])] })],
    ['1.1', chapter('1.1', { englishLevel: 1, opening: [scene('1.1/opening', [choice('tour', 'tour')])] })],
    ['2.2', chapter('2.2', { closing: [scene('2.2/closing')] })],
  ]);
  let seedNumber = 0;
  const deps = {
    kv: memoryStorage(), makeSeed: () => `test-${++seedNumber}`, now: () => '2026-11-24T01:00:00.000Z',
    loadChapter: async id => fixtures.get(id),
    loadCourseContent: async code => testCourses.get(code),
    contentCodes: new Set(testCourses.keys()),
    ...overrides,
  };
  const create = () => createSilverStore(deps).getState;
  return { create, kv: deps.kv, fixtures };
}

const read = kv => JSON.parse(kv.getItem(SAVE_KEY));
const write = (kv, updates) => kv.setItem(SAVE_KEY, JSON.stringify({
  version: 1, seed: 'previous', flags: {}, seen: [], registrations: {}, doneChapters: [], notebook: [], run: null,
  ...updates,
}));

async function start(create, id, mode = 'restart') {
  const state = create();
  await state().load();
  state().openHome();
  state().startChapter(id, mode);
  return state;
}

async function next(state) {
  state().nextStep();
  await wait(260);
}

export default {
  '1. finishes entrance and saves one page': async ({ assert, load }) => {
    const { create, kv } = await setup(load);
    const state = await start(create, 'entrance');
    assert.equal(state().chapters.length, 21);
    assert.equal(state().chapters[0].status, 'in-progress');
    assert.deepEqual(state().chapters.find(card => card.id === '1.4').title, { vi: 'Năm 1 · Kỳ hè', en: 'Year 1 · Summer term' });
    assert.deepEqual(state().chapters.find(card => card.id === '2.3').subtitle, text('CSE 104'));
    await next(state);
    await next(state);
    state().nextStep();
    assert.equal(state().screen, 'memory');
    state().saveMemory('keep-old');
    assert.equal(state().screen, 'home');
    assert.equal(state().chapters[0].status, 'done');
    assert.equal(state().resumeId, null);
    assert.equal(state().notebook.length, 1);
    assert.deepEqual(read(kv).doneChapters, ['entrance']);
    assert.deepEqual(read(kv).seen, ['entrance/opening', 'entrance/second']);
    assert.equal(read(kv).run, null);
  },
  '2. resumes the saved second scene at step zero after reopening': async ({ assert, load }) => {
    const { create, kv } = await setup(load);
    const state = await start(create, 'entrance');
    await next(state);
    state().nextStep();
    assert.equal(state().play.stepIndex, 1);
    state().exitRun();
    const reopened = await start(create, 'entrance', 'resume');
    assert.equal(reopened().play.item.id, 'scene:entrance/second');
    assert.equal(reopened().play.stepIndex, 0);
    assert.deepEqual(read(kv).seen, ['entrance/opening']);
  },
  '3. an unfinished choice does not save its flag': async ({ assert, load }) => {
    const { create, kv } = await setup(load);
    const state = await start(create, '1.1');
    state().answer('yes');
    assert.equal(state().play.feedback.reply.en, 'good');
    state().exitRun();
    assert.deepEqual(read(kv).flags, {});
    state().startChapter('1.1', 'resume');
    assert.equal(state().play.feedback, null);
  },
  '4. wrong answers block next until retry or reveal, and code has a hint': async ({ assert, load }) => {
    const { create, fixtures } = await setup(load);
    fixtures.set('entrance', chapter('entrance', { opening: [scene('graded', [question, code])] }));
    const state = await start(create, 'entrance');
    state().showHint();
    assert.equal(state().play.hint, null);
    state().answer('no');
    assert.equal(state().play.canContinue, false);
    state().nextStep();
    assert.equal(state().play.stepIndex, 0);
    state().retry();
    assert.equal(state().play.feedback, null);
    state().answer('no');
    state().revealAnswer();
    assert.deepEqual(state().play.feedback, {
      kind: 'graded', correct: false, explain: text('wrong'), output: undefined, revealed: true, correctAnswer: 'yes',
    });
    assert.equal(state().play.attempts, 2);
    assert.equal(state().play.canContinue, true);
    await next(state);
    state().showHint();
    assert.deepEqual(state().play.hint, code.hint);
    assert.equal(state().play.attempts, 0);
    state().answer(' print ');
    assert.equal(state().play.feedback.output, '1');
    assert.equal(state().play.canContinue, true);
  },
  '5. skipItem drops pending flags, does not mark seen and saves the next checkpoint': async ({ assert, load }) => {
    const { create, kv, fixtures } = await setup(load);
    fixtures.set('entrance', chapter('entrance', { opening: [scene('skip', [choice('tour', 'tour')]), scene('next')] }));
    const state = await start(create, 'entrance');
    state().answer('yes');
    state().skipItem();
    assert.equal(state().play.item.id, 'scene:next');
    assert.equal(read(kv).run.itemId, 'scene:next');
    state().nextStep();
    assert.deepEqual(read(kv).seen, ['next']);
    assert.deepEqual(read(kv).flags, {});
  },
  '6. direct 2.2 recaps, registers, and groups the 9 scheduled meetings': async ({ assert, load }) => {
    const { create, kv } = await setup(load);
    const state = await start(create, '2.2');
    assert.equal(state().screen, 'recap');
    state().confirmRecap();
    assert.equal(state().screen, 'registration');
    const defaults = state().registration;
    assert.deepEqual(defaults.rows.filter(row => row.selected).map(row => row.code), defaultCodes);
    state().toggleCourse('MATH 112');
    state().toggleCourse('POLS 135');
    assert.equal(state().registration.problem, 'too-few');
    state().confirmRegistration();
    assert.equal(state().screen, 'registration');
    state().resetRegistration();
    assert.deepEqual(state().registration, defaults);
    state().confirmRegistration();
    assert.deepEqual(read(kv).registrations['2.2'], defaultCodes);
    assert.equal(state().play.item.id, 'scene:2.2/opening');
    state().nextStep();
    assert.equal(state().screen, 'week');
    assert.equal(state().week.meetings.length, 9);
    assert.equal(state().week.meetings.filter(meeting => meeting.done).length, 0);
    assert.equal(state().week.meetings.find(meeting => meeting.current).kind, 'lab');
    state().playNext();
    assert.equal(state().play.item.id, 'session:CSE 103:lab:1');
    state().openWeek();
    assert.equal(state().screen, 'week');
    state().playNext();
    await next(state);
    assert.equal(state().play.item.id, 'session:CSE 103:lab:2');
    state().nextStep();
    assert.equal(state().screen, 'week');
    assert.equal(state().week.meetings.filter(meeting => meeting.done).length, 1);
    assert.equal(state().week.meetings.find(meeting => meeting.current).code, 'MATH 112');
    state().exitRun();
    const resumed = await start(create, '2.2', 'resume');
    assert.equal(resumed().play.item.id, 'session:MATH 112:theoryA:1');
    assert.equal(resumed().play.stepIndex, 0);
    for (let index = 0; index < 7; index += 1) {
      resumed().skipItem();
      assert.equal(resumed().screen, 'week');
      resumed().playNext();
    }
    resumed().skipItem();
    assert.equal(resumed().screen, 'play');
    assert.equal(resumed().play.item.kind, 'exam');
    resumed().skipItem();
    assert.equal(resumed().play.item.id, 'scene:2.2/closing');
    resumed().skipItem();
    assert.deepEqual(resumed().memory.courses.map(course => course.code), defaultCodes);
  },
  '7. storage exceptions leave a playable run, and clearAll resets it': async ({ assert, load }) => {
    const blocked = () => { throw new Error('blocked'); };
    const { create } = await setup(load, { kv: { getItem: blocked, setItem: blocked, removeItem: blocked } });
    const state = await start(create, 'entrance');
    state().skipItem();
    state().skipItem();
    state().saveMemory('replace');
    assert.equal(state().saveWarning, 'blocked');
    assert.equal(state().notebook.length, 1);
    state().clearAll();
    assert.equal(state().screen, 'home');
    assert.deepEqual(state().notebook, []);
    assert.equal(state().chapters[0].status, 'new');
    assert.equal(state().saveWarning, 'blocked');
  },
  '8. transcript is deterministic across store instances and reloads': async ({ assert, load }) => {
    const { create } = await setup(load);
    const state = await start(create, '1.1');
    state().skipItem();
    assert.equal(state().screen, 'transcript');
    const transcript = state().transcript;
    assert.equal(transcript.level, 1);
    state().exitRun();
    const reopened = await start(create, '1.1', 'resume');
    assert.deepEqual(reopened().transcript, transcript);
    reopened().confirmTranscript();
    assert.equal(reopened().screen, 'memory');
    reopened().saveMemory('replace');
    reopened().startChapter('2.2', 'restart');
    assert.equal(reopened().screen, 'registration');
  },
  '9. replay offers new suggestions but keep-old preserves the saved photo, line and date': async ({ assert, load }) => {
    const { create, kv } = await setup(load);
    const state = await start(create, '1.1');
    state().answer('no');
    state().nextStep();
    state().confirmTranscript();
    state().saveMemory('replace');
    const old = read(kv).notebook[0];
    assert.equal(old.photoId, 'default');
    state().startChapter('1.1', 'restart');
    state().answer('yes');
    state().nextStep();
    state().confirmTranscript();
    assert.equal(state().memory.hasOld, true);
    assert.equal(state().memory.savedAt, null);
    assert.equal(state().memory.photo.id, 'new');
    assert.equal(state().memory.line.id, 'new-line');
    state().pickPhoto('missing');
    assert.equal(state().memory.photo.id, 'new');
    state().pickPhoto('default');
    assert.equal(state().memory.photo.id, 'default');
    state().saveMemory('keep-old');
    assert.deepEqual(read(kv).notebook, [old]);
    assert.deepEqual(read(kv).doneChapters, ['1.1']);
    assert.equal(read(kv).run, null);
  },
  'recovery: a missing chapter removes its resume marker and a missing item falls back to the opening': async ({ assert, load }) => {
    const { create, kv, fixtures } = await setup(load);
    write(kv, { run: { chapterId: 'entrance', itemId: 'scene:removed', courses: [] } });
    const state = await start(create, 'entrance', 'resume');
    assert.equal(state().play.item.id, 'scene:entrance/opening');
    assert.equal(read(kv).run.itemId, 'scene:entrance/opening');
    fixtures.delete('entrance');
    const reopened = create();
    await reopened().load();
    assert.equal(reopened().status, 'ready');
    assert.equal(reopened().resumeId, null);
    assert.equal(reopened().chapters[0].status, 'coming-soon');
    assert.equal(read(kv).run, null);
  },
  'recovery: a removed registered course sends the player back to registration': async ({ assert, load }) => {
    const { create, kv } = await setup(load);
    write(kv, {
      run: { chapterId: '2.2', itemId: 'session:REMOVED:theoryA:1', courses: [...defaultCodes, 'REMOVED'] },
      registrations: { '2.2': [...defaultCodes, 'REMOVED'] },
    });
    const state = await start(create, '2.2', 'resume');
    assert.equal(state().screen, 'registration');
    assert.deepEqual(state().registration.rows.filter(row => row.selected).map(row => row.code), defaultCodes);
    state().confirmRegistration();
    assert.equal(state().play.item.id, 'scene:2.2/opening');
    assert.deepEqual(read(kv).run.courses, defaultCodes);
    assert.deepEqual(read(kv).registrations['2.2'], defaultCodes);
  },
  'quick next across event-loop turns and duplicate answers never consume another step or attempt': async ({ assert, load }) => {
    const { create, fixtures } = await setup(load);
    fixtures.set('entrance', chapter('entrance', { opening: [scene('rapid', [say('first'), say('second'), question])] }));
    const state = await start(create, 'entrance');
    state().nextStep();
    await wait(0);
    state().nextStep();
    assert.equal(state().play.stepIndex, 1);
    await wait(260);
    state().nextStep();
    assert.equal(state().play.stepIndex, 2);
    state().answer('no');
    state().answer('yes');
    assert.equal(state().play.attempts, 1);
    assert.equal(state().play.feedback.correct, false);
  },
  'switching chapters supersedes the saved run and discards unfinished flags': async ({ assert, load }) => {
    const { create, kv } = await setup(load);
    const state = await start(create, '1.1');
    state().answer('yes');
    state().startChapter('2.2', 'restart');
    assert.equal(state().screen, 'recap');
    assert.equal(state().resumeId, '2.2');
    assert.equal(read(kv).run.chapterId, '2.2');
    assert.deepEqual(read(kv).flags, {});
    state().exitRun();
    state().startChapter('1.1', 'resume');
    assert.equal(state().screen, 'home');
    state().startChapter('2.2', 'resume');
    assert.equal(state().screen, 'registration');
  },
  'chapter failure is global, preserves healthy chapters, logs once and retries only the failure': async ({ assert, load }) => {
    const calls = new Map();
    let fails = true;
    const { create } = await setup(load, {
      loadChapter: async id => {
        calls.set(id, (calls.get(id) ?? 0) + 1);
        if (id === '1.1' && fails) throw new Error('temporary failure');
        return chapter(id);
      },
    });
    const state = create();
    const logged = [];
    const original = console.error;
    console.error = (...args) => logged.push(args);
    try {
      const initial = state().load();
      assert.strictEqual(state().load(), initial);
      await initial;
      assert.equal(state().status, 'error');
      assert.equal(logged.length, 1);
      state().openHome();
      state().startChapter('entrance', 'restart');
      assert.equal(state().screen, 'play');
      state().exitRun();
      const failedRetry = state().load();
      assert.equal(state().status, 'loading');
      assert.strictEqual(state().load(), failedRetry);
      await failedRetry;
      assert.equal(state().status, 'error');
      assert.equal(logged.length, 1);
      fails = false;
      await state().load();
      assert.equal(state().status, 'ready');
      await state().load();
      assert.deepEqual(Object.fromEntries(calls), { entrance: 1, '1.1': 3, '2.2': 1 });
    } finally {
      console.error = original;
    }
  },
  'course load errors retry only the rejected course and log against 2.2 once': async ({ assert, load }) => {
    const calls = new Map();
    let failures = 2;
    const { create } = await setup(load, {
      loadCourseContent: async code => {
        calls.set(code, (calls.get(code) ?? 0) + 1);
        if (code === 'CSE 103' && failures-- > 0) throw new Error('course');
        return testCourses.get(code);
      },
    });
    const state = create();
    const logged = [];
    const original = console.error;
    console.error = (...args) => logged.push(args);
    try {
      await state().load();
      assert.equal(state().status, 'error');
      state().openHome();
      state().startChapter('2.2', 'restart');
      assert.equal(state().screen, 'home');
      await state().load();
      assert.equal(state().status, 'error');
      await state().load();
      assert.equal(state().status, 'ready');
      assert.equal(logged.length, 1);
      assert.match(logged[0][0], /2\.2/);
      assert.deepEqual(Object.fromEntries(calls), { 'CSE 103': 3, 'MATH 112': 1, 'POLS 135': 1, 'COMS 101': 1 });
    } finally {
      console.error = original;
    }
  },
  'missing course data is no-content, and missing chapter data is coming-soon': async ({ assert, load }) => {
    const { create, fixtures } = await setup(load, {
      contentCodes: Promise.resolve(new Set(['CSE 103', 'MATH 112'])),
      loadCourseContent: async code => code === 'MATH 112' ? testCourses.get(code) : undefined,
    });
    fixtures.delete('1.1');
    const state = await start(create, '2.2');
    assert.equal(state().status, 'ready');
    assert.equal(state().chapters[1].status, 'coming-soon');
    state().confirmRecap();
    const core = state().registration.rows.find(row => row.code === 'CSE 103');
    assert.equal(core.status.code, 'no-content');
    assert.equal(core.selected, true);
    assert.equal(core.locked, true);
    const missing = state().registration.rows.find(row => row.code === 'POLS 135');
    assert.equal(missing.status.code, 'no-content');
    assert.equal(missing.selected, false);
    assert.equal(state().registration.problem, 'too-few');
    state().confirmRegistration();
    assert.equal(state().screen, 'registration');
  },
  'multiple choice flags commit together and affect the next scene variant': async ({ assert, load }) => {
    const { create, kv, fixtures } = await setup(load);
    const variant = { ...say('variant'), variants: [{ when: { seen: 'choices', flag: { key: 'seat', is: 'no' } }, text: text('resolved') }] };
    fixtures.set('entrance', chapter('entrance', {
      opening: [scene('choices', [choice('tour', 'tour'), choice('seat', 'seat')])], scenes: [scene('after', [variant])],
    }));
    const state = await start(create, 'entrance');
    state().answer('yes');
    state().nextStep();
    state().answer('no');
    assert.deepEqual(read(kv).flags, {});
    state().nextStep();
    assert.deepEqual(read(kv).flags, { tour: 'yes', seat: 'no' });
    assert.deepEqual(read(kv).seen, ['choices']);
    assert.deepEqual(state().play.step.text, text('resolved'));
    assert.equal(state().play.step.variants, undefined);
  },
  'stored view selectors keep references across reads and unrelated changes': async ({ assert, load }) => {
    const { create } = await setup(load);
    const state = await start(create, '1.1');
    const { chapters, notebook, play } = state();
    for (let index = 0; index < 10; index += 1) {
      assert.strictEqual(state().chapters, chapters);
      assert.strictEqual(state().notebook, notebook);
      assert.strictEqual(state().play, play);
    }
    state().answer('yes');
    assert.strictEqual(state().chapters, chapters);
    assert.strictEqual(state().notebook, notebook);
    assert.strictEqual(state().play.step, play.step);
    assert.notStrictEqual(state().play, play);
  },
};
