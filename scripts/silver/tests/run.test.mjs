const text = { vi: 'Đúng', en: 'Correct' };
const scene = (id, steps = []) => ({ id, title: text, place: '406', minutes: 3, steps });
const chapter = (overrides = {}) => ({ id: '2.2', opening: [], scenes: [], closing: [], englishLevel: undefined, ...overrides });
const course = (code, sessions, exam) => ({ code, sessions, ...(exam ? { exam } : {}) });

export default {
  'conditions require both seen and flag; variants select first match': async ({ assert, load }) => {
    const { matchCond, resolveStep } = await load('/src/silver/run.ts');
    assert.equal(matchCond({ seen: '1.1/greet-han' }, { seen: new Set(), flags: {} }), false);
    const cond = { flag: { key: '2.2/seat', is: 'front' } };
    assert.equal(matchCond(cond, { seen: new Set(), flags: { '2.2/seat': 'front' } }), true);
    assert.equal(matchCond({ seen: 'seen', ...cond }, { seen: new Set(), flags: { '2.2/seat': 'front' } }), false);
    const step = { id: 's', type: 'say', speaker: 'han', text: { vi: 'base', en: 'base' }, variants: [{ when: { seen: 'once' }, text: { vi: 'Hồi đó tập chào nhau…', en: 'Then we practiced greetings…' } }, { when: { flag: cond.flag }, text: { vi: 'Chào bạn, mình là Han…', en: 'Hi, I am Han…' } }] };
    const first = resolveStep(step, { seen: new Set(), flags: { '2.2/seat': 'front' } });
    assert.equal(first.text.vi, 'Chào bạn, mình là Han…');
    assert.equal('variants' in first, false);
    assert.equal(resolveStep(step, { seen: new Set(['once']), flags: {} }).text.vi, 'Hồi đó tập chào nhau…');
    const fixture = (await import('../../../docs/it-silver/data/ui-fixture.json', { with: { type: 'json' } })).default;
    const fixtureStep = fixture.playItem.scene.steps[0];
    assert.match(resolveStep(fixtureStep, { seen: new Set(), flags: {} }).text.vi, /Chào bạn, mình là Han/);
    assert.match(resolveStep(fixtureStep, { seen: new Set([fixtureStep.variants[0].when.seen]), flags: {} }).text.vi, /Hồi đó tập chào nhau/);
  },
  'chapter queue ordering and transcript memory durations': async ({ assert, load }) => {
    const { buildChapterQueue } = await load('/src/silver/run.ts');
    const result = buildChapterQueue(chapter({ opening: [scene('open')], scenes: [scene('middle')], closing: [scene('close')], englishLevel: 2 }));
    assert.deepEqual(result.map(item => item.id), ['scene:open', 'scene:middle', 'scene:close', 'transcript', 'memory']);
    assert.equal(result.at(-2).minutes, 1);
    assert.equal(result.at(-1).minutes, 1);
  },
  'term queue meets in meeting order, quick lab/theory/project and exams in registration order': async ({ assert, load }) => {
    const { buildTermQueue } = await load('/src/silver/run.ts');
    const c103 = course('CSE 103', [
      { slot: 'lab', scene: scene('lab-1') }, { slot: 'lab', scene: scene('lab-2') },
      { slot: 'theoryA', scene: scene('a') }, { slot: 'theoryB', scene: scene('b') },
    ], scene('exam'));
    const math = course('MATH 112', [{ slot: 'theoryA', scene: scene('ma') }, { slot: 'theoryB', scene: scene('mb') }]);
    const pols = course('POLS 135', [{ slot: 'theoryA', scene: scene('pa') }, { slot: 'theoryB', scene: scene('pb') }]);
    const coms = course('COMS 101', [{ slot: 'theoryA', scene: scene('ca') }, { slot: 'theoryB', scene: scene('cb') }]);
    const registrations = [{ code: 'CSE 103', tier: 'core' }, { code: 'MATH 112', tier: 'summary' }, { code: 'POLS 135', tier: 'summary' }, { code: 'COMS 101', tier: 'summary' }];
    const meetings = [
      ['CSE 103', 'lab'], ['MATH 112', 'theoryA'], ['POLS 135', 'theoryA'], ['CSE 103', 'theoryA'], ['COMS 101', 'theoryA'],
      ['MATH 112', 'theoryB'], ['POLS 135', 'theoryB'], ['CSE 103', 'theoryB'], ['COMS 101', 'theoryB'],
    ].map(([code, kind], day) => ({ code, kind, day: day % 6, slot: 0, length: kind === 'lab' ? 2 : 1 }));
    const result = buildTermQueue(chapter(), registrations, new Map([['CSE 103', c103], ['MATH 112', math], ['POLS 135', pols], ['COMS 101', coms]]), meetings);
    assert.deepEqual(result.map(item => item.scene?.id ?? item.id), ['lab-1', 'lab-2', 'ma', 'pa', 'a', 'ca', 'mb', 'pb', 'b', 'cb', 'exam', 'memory']);
    assert.equal(result.at(-1).minutes, 1);
    const quickLab = buildTermQueue(chapter(), [{ code: 'CSE 204', tier: 'quick' }], new Map([['CSE 204', course('CSE 204', [{ slot: 'lab', scene: scene('qlab') }, { slot: 'theoryA', scene: scene('qa') }, { slot: 'theoryB', scene: scene('qb') }])]]), [{ ...meetings[0], code: 'CSE 204' }]);
    assert.deepEqual(quickLab.filter(item => item.kind === 'session').map(item => item.scene.id), ['qlab']);
    const quickTheory = buildTermQueue(chapter(), [{ code: 'MATH 112', tier: 'quick' }], new Map([['MATH 112', math]]), meetings.filter(item => item.code === 'MATH 112'));
    assert.deepEqual(quickTheory.filter(item => item.kind === 'session').map(item => item.scene.id), ['ma']);
    const quickProject = buildTermQueue(chapter(), [{ code: 'CSW 400', tier: 'quick' }], new Map([['CSW 400', course('CSW 400', [{ slot: 'project', scene: scene('project') }])]]), [{ ...meetings[0], code: 'CSW 400', kind: 'project' }]);
    assert.deepEqual(quickProject.filter(item => item.kind === 'session').map(item => item.scene.id), ['project']);
    const examQueue = buildTermQueue(chapter(), [{ code: 'CSE 204', tier: 'core' }, { code: 'CSE 103', tier: 'core' }], new Map([
      ['CSE 204', course('CSE 204', [], scene('exam-204'))],
      ['CSE 103', c103],
    ]), []);
    assert.deepEqual(examQueue.filter(item => item.kind === 'exam').map(item => item.id), ['exam:CSE 204', 'exam:CSE 103']);
  },
  'grading rules for every step type and both outcomes': async ({ assert, load }) => {
    const { gradeStep } = await load('/src/silver/run.ts');
    const question = { type: 'question', answerId: 'a', explainCorrect: text, explainWrong: { vi: 'Sai', en: 'Wrong' } };
    assert.equal(gradeStep(question, 'a').correct, true);
    assert.deepEqual(gradeStep(question, 'b'), { correct: false, explain: question.explainWrong, correctAnswer: 'a' });
    const order = { type: 'order', answer: ['y', 'x', 'z'], explainCorrect: text, explainWrong: question.explainWrong };
    assert.deepEqual(gradeStep(order, 'y,x,z'), { correct: true, explain: text, correctAnswer: 'y,x,z' });
    assert.deepEqual(gradeStep(order, 'x,y,z'), { correct: false, explain: question.explainWrong, correctAnswer: 'y,x,z' });
    const code = { type: 'code', answers: ['println', 'print'], outputCorrect: 'Hello EIU', outputWrong: 'error', explainWrong: question.explainWrong };
    assert.deepEqual(gradeStep(code, ' print '), { correct: true, output: 'Hello EIU', correctAnswer: 'println' });
    assert.deepEqual(gradeStep(code, 'Print'), { correct: false, output: 'error', explain: question.explainWrong, correctAnswer: 'println' });
  },
};
