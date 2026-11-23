const CORE = 'CSE 103';
const SUGGESTED = [CORE, 'MATH 112', 'POLS 135', 'COMS 101'];

async function setup(load, termId = '2.2') {
  const [registration, { catalog }, { getTerm, plannedBefore }] = await Promise.all([
    load('/src/silver/registration.ts'),
    load('/src/data/silver/catalog.ts'),
    load('/src/data/silver/plan.ts'),
  ]);
  const term = getTerm(termId);
  const content = new Map([
    [CORE, { tier: 'core', minutes: 14.5 }],
    ['MATH 112', { tier: 'summary', minutes: 3.5 }],
    ['POLS 135', { tier: 'summary', minutes: 3.5 }],
    ['COMS 101', { tier: 'summary', minutes: 3.5 }],
    ['CSE 204', { tier: 'summary', minutes: 5 }],
    ['STAT 101', { tier: 'summary', minutes: 3.5 }],
  ]);
  const input = { term, catalog, plannedBefore: plannedBefore(termId), earlier: [], content, selected: registration.defaultSelection(term) };
  return { ...registration, getTerm, input };
}

const row = (view, code) => view.rows.find(item => item.code === code);
const selectedTiers = view => view.rows.filter(item => item.selected).map(({ code, tier }) => [code, tier]);
const totals = ({ credits, minutes, problem }) => [credits, minutes, problem];
const summary = minutes => ({ tier: 'summary', minutes });

export default {
  '2.2 default, added course, swap, too few and locked core match every example': async ({ assert, load }) => {
    const { input, buildRegistration, toggleSelection, MAX_COURSES, QUICK_MINUTES, FRAME_MINUTES } = await setup(load);
    assert.deepEqual(input.selected, SUGGESTED);
    assert.deepEqual([MAX_COURSES, QUICK_MINUTES, FRAME_MINUTES], [6, 2, 5.5]);

    const initial = buildRegistration(input);
    assert.deepEqual(totals(initial), [15, 31, null]);
    assert.equal(initial.chapterId, '2.2');
    assert.equal(initial.maxCourses, 6);
    assert.deepEqual(selectedTiers(initial), [
      [CORE, 'core'], ['MATH 112', 'summary'], ['POLS 135', 'summary'], ['COMS 101', 'summary'],
    ]);
    assert.equal(row(initial, 'CSE 204').tier, 'quick');
    assert.equal(row(initial, 'STAT 101').status.code, 'available');
    assert.deepEqual(initial.meetings[0], { code: CORE, kind: 'lab', day: 0, slot: 0, length: 2 });
    assert.equal(initial.meetings.length, 9);

    const added = toggleSelection(input, 'CSE 204');
    assert.deepEqual(added, [...SUGGESTED, 'CSE 204']);
    const addedView = buildRegistration({ ...input, selected: added });
    assert.deepEqual(totals(addedView), [19, 33, null]);
    assert.equal(row(addedView, 'CSE 204').tier, 'quick');

    const swapped = toggleSelection({ ...input, selected: added }, 'COMS 101');
    assert.deepEqual(swapped, [CORE, 'MATH 112', 'POLS 135', 'CSE 204']);
    const swappedView = buildRegistration({ ...input, selected: swapped });
    assert.deepEqual(totals(swappedView), [15, 32, null]);
    assert.equal(row(swappedView, 'CSE 204').tier, 'summary');
    assert.equal(row(swappedView, 'COMS 101').tier, 'quick');
    assert.deepEqual(new Set(swappedView.meetings.map(meeting => meeting.code)), new Set(swapped));

    const few = buildRegistration({ ...input, selected: [CORE, 'MATH 112'] });
    assert.deepEqual(totals(few), [8, 24, 'too-few']);
    assert.equal(few.meetings.length, 5);
    assert.equal(row(few, 'CSE 204').tier, 'summary');
    assert.equal(row(initial, CORE).locked, true);
    assert.deepEqual(toggleSelection(input, CORE), SUGGESTED);
    assert.deepEqual(input.selected, SUGGESTED);
  },

  'rows follow plan, elective group, then catalog content with unique codes and row-ranked selected tiers': async ({ assert, load }) => {
    const { input, buildRegistration } = await setup(load);
    input.content = new Map([
      ['STAT 101', summary(3.5)],
      ['CSE 204', summary(5)],
      ['WRT 122', summary(3.5)],
      ['CSE 100', summary(3.5)],
      ...input.content,
    ]);
    input.selected = ['CSE 204', 'COMS 101', 'POLS 135', 'MATH 112', CORE, 'CSE 204'];
    const view = buildRegistration(input);
    assert.deepEqual(view.rows.map(item => item.code), [
      ...SUGGESTED,
      'WRT 122', 'WRT 187', 'PHL 255', 'LNGS-J101', 'LNGS-J102', 'LNGS-J103',
      'LNGS-K101', 'LNGS-K102', 'LNGS-K103', 'MUSI 110', 'MUSI 203', 'MUSI 204', 'MUSI 205',
      'CSE 204', 'STAT 101',
    ]);
    assert.deepEqual(view.rows.filter(item => item.suggested).map(item => item.code), SUGGESTED);
    assert.deepEqual(selectedTiers(view), [
      [CORE, 'core'], ['MATH 112', 'summary'], ['POLS 135', 'summary'], ['COMS 101', 'summary'], ['CSE 204', 'quick'],
    ]);
    const { name, credits } = input.catalog.courses.find(course => course.code === 'CSE 204');
    assert.deepEqual(row(view, 'CSE 204'), {
      code: 'CSE 204', name, credits, lab: true, tier: 'quick', selected: true, locked: false,
      suggested: false, status: { code: 'available', missing: [] },
    });
    assert.equal(row(view, 'MATH 112').lab, false);
    assert.deepEqual(totals(view), [19, 33, null]);
  },

  'earlier omissions still satisfy prerequisites and can be picked again, while actual registrations are taken': async ({ assert, load }) => {
    const { input, getTerm, buildRegistration, toggleSelection } = await setup(load, '2.3');
    const earlier = { term: getTerm('2.2'), registered: [CORE, 'POLS 135', 'STAT 101'] };
    input.earlier = [earlier];
    for (const code of ['MATH 113', 'CSE 104', 'POLS 132', 'STAT 202', 'MATH 111']) input.content.set(code, summary(3.5));

    const view = buildRegistration(input);
    for (const code of ['MATH 112', 'COMS 101', 'MATH 113', 'STAT 202']) {
      assert.deepEqual(row(view, code).status, { code: 'available', missing: [] }, code);
    }
    for (const code of [CORE, 'POLS 135', 'STAT 101', 'MATH 111']) {
      assert.equal(row(view, code), undefined, code);
      assert.deepEqual(toggleSelection(input, code), input.selected, code);
    }
    assert.deepEqual(toggleSelection(input, 'MATH 112'), [...input.selected, 'MATH 112']);
    assert.deepEqual(toggleSelection(input, 'COMS 101'), [...input.selected, 'COMS 101']);
    const retained = buildRegistration({ ...input, selected: [...input.selected, 'STAT 101'] });
    assert.equal(row(retained, 'STAT 101').selected, true);
    assert.deepEqual(row(retained, 'STAT 101').status, { code: 'done', missing: [] });
  },

  'missing prerequisites and unresolved or unclear courses cannot be added': async ({ assert, load }) => {
    const { input, buildRegistration, toggleSelection } = await setup(load);
    input.plannedBefore = ['MATH 111'];
    input.selected = [];
    for (const code of ['MATH 113', 'CSW 436', 'UNIV 101']) input.content.set(code, summary(3.5));
    const view = buildRegistration(input);
    const blocked = [
      ['MATH 113', 'missing-prereq', ['MATH 112']],
      ['STAT 101', 'missing-prereq', ['MATH 103']],
      ['CSW 436', 'needs-confirmation', ['CSN 301']],
      ['UNIV 101', 'needs-confirmation', []],
    ];
    for (const [code, status, missing] of blocked) {
      assert.deepEqual(row(view, code).status, { code: status, missing });
      assert.deepEqual(toggleSelection(input, code), []);
    }
    assert.deepEqual(toggleSelection({ ...input, selected: ['MATH 112'] }, 'MATH 113'), ['MATH 112']);
    assert.deepEqual(toggleSelection(input, 'UNKNOWN'), []);
  },

  'no-content scheduled courses show the data issue and only selected core is kept with zero minutes': async ({ assert, load }) => {
    const { input, buildRegistration, toggleSelection } = await setup(load);
    input.content.delete('MATH 112');
    input.content.delete(CORE);
    input.plannedBefore = [];
    const view = buildRegistration(input);
    for (const code of [CORE, 'MATH 112', 'WRT 122']) {
      assert.deepEqual(row(view, code).status, { code: 'no-content', missing: [] }, code);
    }
    assert.deepEqual(selectedTiers(view), [[CORE, 'core'], ['POLS 135', 'summary'], ['COMS 101', 'summary']]);
    assert.deepEqual(totals(view), [11, 13, null]);
    assert.equal(row(view, CORE).locked, true);
    assert.equal(row(view, 'MATH 112').locked, false);
    assert.equal(view.meetings.some(meeting => meeting.code === CORE), true);
    assert.equal(view.meetings.some(meeting => meeting.code === 'MATH 112'), false);
    const cleaned = [CORE, 'POLS 135', 'COMS 101'];
    assert.deepEqual(toggleSelection(input, CORE), cleaned);
    assert.deepEqual(toggleSelection(input, 'MATH 112'), cleaned);
    assert.deepEqual(toggleSelection(input, 'WRT 122'), cleaned);
    assert.deepEqual(input.selected, SUGGESTED);
  },

  'six courses have meetings; adding a seventh is allowed and clears the timetable until removed': async ({ assert, load }) => {
    const { input, buildRegistration, toggleSelection } = await setup(load);
    input.content.set('CSE 206', summary(5));
    const six = { ...input, selected: [...input.selected, 'CSE 204', 'STAT 101'] };
    const view = buildRegistration(six);
    assert.deepEqual(totals(view), [23, 35, null]);
    assert.deepEqual(new Set(view.meetings.map(meeting => meeting.code)), new Set(six.selected));
    const seven = toggleSelection(six, 'CSE 206');
    assert.deepEqual(seven, [...six.selected, 'CSE 206']);
    const tooMany = { ...input, selected: seven };
    assert.deepEqual(totals(buildRegistration(tooMany)), [27, 37, 'too-many']);
    assert.deepEqual(buildRegistration(tooMany).meetings, []);
    assert.deepEqual(toggleSelection(tooMany, 'CSE 206'), six.selected);
  },

  'minimum follows shorter real terms and caps at three for 2.2': async ({ assert, load }) => {
    const { input, getTerm, buildRegistration, defaultSelection } = await setup(load);
    assert.equal(buildRegistration({ ...input, selected: SUGGESTED.slice(0, 3) }).problem, null);

    const term = getTerm('1.1');
    const first = { ...input, term, plannedBefore: [], selected: defaultSelection(term) };
    first.content.set('POLS 133', summary(3.5));
    assert.equal(buildRegistration(first).problem, null);
    assert.equal(buildRegistration({ ...first, selected: [] }).problem, 'too-few');

    const empty = getTerm('1.4');
    const view = buildRegistration({ ...first, term: empty, content: new Map(), selected: defaultSelection(empty) });
    assert.deepEqual(totals(view), [0, 6, null]);
    assert.deepEqual(view.meetings, []);
  },
};
