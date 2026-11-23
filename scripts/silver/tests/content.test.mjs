const text = { vi: 'VI', en: 'EN' };
const say = (id = 's1') => ({ id, type: 'say', speaker: 'han', text });
const question = id => ({ id, type: 'question', prompt: text, options: [{ id: 'yes', text }, { id: 'no', text }], answerId: 'yes', explainCorrect: text, explainWrong: text });
const scene = (id, steps = [say()]) => ({ id, title: text, place: '406.B8', minutes: 1, steps });
const chapter = () => ({ version: 1, id: 'entrance', title: text, subtitle: text, recap: text, opening: [], scenes: [scene('one')], closing: [], memory: { stamp: text, photos: [{ id: 'photo', caption: text }], lines: [{ id: 'line', text }], activities: [text] } });
const courseContent = () => ({ version: 1, code: 'CSE 103', tier: 'summary', status: 'nhap', basis: { pdfPages: '1', note: text }, summary: text, sessions: [{ slot: 'theoryA', scene: { ...scene('a'), minutes: 2 } }, { slot: 'theoryB', scene: { ...scene('b'), minutes: 2 } }], closing: text });

export default {
  'minimal valid chapter, content and fixture scene': async ({ assert, load }) => {
    const { parseChapter, parseCourseContent } = await load('/src/data/silver/validateContent.ts');
    assert.equal(parseChapter(chapter(), 'ch').id, 'entrance');
    assert.equal(parseCourseContent(courseContent(), 'course').code, 'CSE 103');
    const fixture = (await import('../../../docs/it-silver/data/ui-fixture.json', { with: { type: 'json' } })).default;
    const fixtureCourse = courseContent(); fixtureCourse.sessions[0].scene = fixture.playItem.scene; fixtureCourse.sessions[0].scene.minutes = 2;
    assert.doesNotThrow(() => parseCourseContent(fixtureCourse, 'fixture.scene'));
  },
  'rejects malformed chapter, scenes, localization, ids and conditions': async ({ assert, load }) => {
    const { parseChapter } = await load('/src/data/silver/validateContent.ts');
    const reject = (mutate, path) => { const data = chapter(); mutate(data); assert.throws(() => parseChapter(data, 'chapter'), new RegExp(path.replace(/[.[\]]/g, '\\$&'))); };
    reject(data => { data.title = { vi: '' }; }, 'chapter.title.vi');
    reject(data => { data.scenes[0].steps = []; }, 'chapter.scenes[0].steps');
    reject(data => { data.scenes[0].minutes = 0; }, 'chapter.scenes[0].minutes');
    reject(data => { data.scenes.push(scene('two')); data.scenes[0].id = 'two'; }, 'chapter.scenes');
    reject(data => { data.scenes[0].steps.push(say()); }, 'chapter.scenes[0].steps');
    reject(data => { data.scenes[0].steps[0].variants = [{ when: {}, text }]; }, 'chapter.scenes[0].steps[0].variants[0].when');
    reject(data => { data.memory.photos = [{ id: 'a', when: { seen: 'x' }, caption: text }, { id: 'b', when: { seen: 'y' }, caption: text }]; }, 'chapter.memory.photos[1].when');
    reject(data => { data.memory.lines = [{ id: 'a', when: { seen: 'x' }, text }, { id: 'b', when: { flag: { key: 'f', is: 'x' } }, text }]; }, 'chapter.memory.lines[1].when');
  },
  'rejects invalid choice question order and code steps': async ({ assert, load }) => {
    const { parseChapter } = await load('/src/data/silver/validateContent.ts');
    const rejectStep = (stepValue, path) => { const data = chapter(); data.scenes[0].steps = [stepValue]; assert.throws(() => parseChapter(data, 'chapter'), new RegExp(path)); };
    rejectStep({ id: 'c', type: 'choice', speaker: 'han', text, options: [{ id: 'x', text }] }, 'options');
    rejectStep({ ...question('q'), answerId: 'missing' }, 'answerId');
    rejectStep({ ...question('q'), passage: text }, 'passage');
    rejectStep({ id: 'o', type: 'order', prompt: text, items: [{ id: 'a', text }, { id: 'b', text }], answer: ['a', 'b'], explainCorrect: text, explainWrong: text }, 'items');
    rejectStep({ id: 'o', type: 'order', prompt: text, items: [{ id: 'a', text }, { id: 'b', text }, { id: 'c', text }], answer: ['a', 'b', 'b'], explainCorrect: text, explainWrong: text }, 'answer');
    rejectStep({ id: 'code', type: 'code', title: text, instruction: text, template: '___ ___', answers: ['x'], outputCorrect: 'ok', outputWrong: 'no', hint: text, explainWrong: text }, 'template');
    rejectStep({ id: 'code', type: 'code', title: text, instruction: text, template: '___', answers: [], outputCorrect: 'ok', outputWrong: 'no', hint: text, explainWrong: text }, 'answers');
  },
  'course tier slots counts exam and course lab rules': async ({ assert, load }) => {
    const { parseCourseContent } = await load('/src/data/silver/validateContent.ts');
    const invalid = (mutate, path, tier = 'summary') => { const data = courseContent(); data.tier = tier; mutate(data); assert.throws(() => parseCourseContent(data, 'course'), new RegExp(path)); };
    invalid(data => { data.sessions[1].scene.minutes = 0; }, 'sessions');
    invalid(data => { data.exam = scene('exam'); }, 'exam');
    invalid(data => { data.sessions = [{ slot: 'project', scene: scene('p', [question('q')]) }]; }, 'sessions');
    const validCore = courseContent(); validCore.tier = 'core'; validCore.sessions = ['theoryA', 'theoryB', 'lab'].map(slot => ({ slot, scene: { ...scene(slot, [say('s1'), say('s2'), say('s3'), say('s4')]), minutes: 4 } })); validCore.exam = scene('exam', [question('q1'), question('q2'), question('q3')]);
    assert.doesNotThrow(() => parseCourseContent(validCore, 'course', { lt: 3, th: 1 }));
    assert.throws(() => parseCourseContent(validCore, 'course', { lt: 3, th: 0 }), /lab/);
    assert.throws(() => parseCourseContent(validCore, 'course', { lt: 0, th: 4 }), /lab|project/);
  },
  'content filename mapping and empty lazy loaders': async ({ assert, load }) => {
    const m = await load('/src/data/silver/content.ts');
    assert.equal(m.contentFileName('CSE 103'), 'cse-103');
    assert.equal(m.contentFileName('LNGS-J101'), 'lngs-j101');
    assert.deepEqual([...await m.availableContentCodes], []);
    assert.equal(await m.loadChapter('entrance'), undefined);
    assert.equal(await m.loadCourseContent('CSE 103'), undefined);
  },
};
