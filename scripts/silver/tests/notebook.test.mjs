const text = value => ({ vi: value, en: value });
const chapter = () => ({
  id: '1.1', title: text('title'), memory: {
    stamp: text('stamp'),
    photos: [
      { id: 'a', when: { flag: { key: 'f', is: 'yes' } }, caption: text('photo a') },
      { id: 'b', caption: text('photo b') },
    ],
    lines: [
      { id: 'x', when: { seen: 'seen' }, text: text('line x') },
      { id: 'y', text: text('line y') },
    ],
    activities: [text('activity')],
  },
});
const entry = (overrides = {}) => ({ chapterId: '1.1', photoId: 'a', lineId: 'x', courses: ['CSE 103', 'UNKNOWN'], savedAt: 'time', ...overrides });

export default {
  'photo suggestions follow conditions and preserve order': async ({ assert, load }) => {
    const { makeMemoryView } = await load('/src/silver/notebook.ts');
    const deps = { match: condition => condition.flag?.is === 'yes', courseName: () => undefined };
    const matched = makeMemoryView(chapter(), [], undefined, deps);
    assert.equal(matched.photo.id, 'a');
    assert.deepEqual(matched.photoChoices.map(photo => photo.id), ['a', 'b']);
    const unmatched = makeMemoryView(chapter(), [], undefined, { ...deps, match: () => false });
    assert.equal(unmatched.photo.id, 'b');
    assert.deepEqual(unmatched.photoChoices.map(photo => photo.id), ['b']);
  },
  'replay offers fresh suggestions while signaling an old page': async ({ assert, load }) => {
    const { makeMemoryView } = await load('/src/silver/notebook.ts');
    const view = makeMemoryView(chapter(), [], entry({ photoId: 'b', lineId: 'y' }), {
      match: condition => condition.flag?.is === 'yes' || condition.seen === 'seen',
      courseName: () => undefined,
    });
    assert.equal(view.photo.id, 'a');
    assert.equal(view.line.id, 'x');
    assert.equal(view.hasOld, true);
    assert.equal(view.savedAt, null);
  },
  'saved ids persist even after conditions change; vanished ids use fallback': async ({ assert, load }) => {
    const { savedMemoryView } = await load('/src/silver/notebook.ts');
    const oldEntry = entry();
    const deps = { match: () => false, courseName: code => code === 'CSE 103' ? text('Course') : undefined };
    const restored = savedMemoryView(chapter(), oldEntry, deps);
    assert.equal(restored.photo.id, 'a');
    assert.equal(restored.line.id, 'x');
    assert.equal(restored.hasOld, true);
    assert.equal(restored.savedAt, 'time');
    assert.deepEqual(restored.courses, [{ code: 'CSE 103', name: text('Course') }]);
    const removed = savedMemoryView(chapter(), entry({ photoId: 'gone', lineId: 'gone' }), deps);
    assert.equal(removed.photo.id, 'b');
    assert.equal(removed.line.id, 'y');
  },
  'upsert replaces in place, appends new chapter and never mutates input': async ({ assert, load }) => {
    const { upsertEntry } = await load('/src/silver/notebook.ts');
    const first = entry();
    const other = entry({ chapterId: 'entrance', photoId: 'entrance-photo' });
    const input = [first, other];
    const replacement = entry({ photoId: 'new', savedAt: 'later' });
    const updated = upsertEntry(input, replacement);
    assert.deepEqual(updated, [replacement, other]);
    assert.deepEqual(input, [first, other]);
    const appended = upsertEntry(input, entry({ chapterId: '2.2' }));
    assert.equal(appended.length, 3);
    assert.deepEqual(input, [first, other]);
  },
};
