const validSave = () => ({ version: 1, seed: 'seed', flags: { f: 'yes' }, seen: ['a'], registrations: { '2.2': ['CSE 103'] }, doneChapters: ['1.1'], run: { chapterId: '2.2', courses: ['CSE 103'], itemId: 'scene:x' }, notebook: [{ chapterId: '1.1', photoId: 'p', lineId: 'l', courses: ['CSE 103'], savedAt: 'now' }] });

export default {
  'empty save exact fields': async ({ assert, load }) => {
    const m = await load('/src/silver/save.ts');
    assert.equal(m.SAVE_KEY, 'campussim.silver.v1');
    assert.deepEqual(m.readSave({ getItem: () => null, setItem: () => {}, removeItem: () => {} }, () => 'x'), { save: { version: 1, seed: 'x', flags: {}, seen: [], registrations: {}, doneChapters: [], run: null, notebook: [] }, warning: null });
  },
  'parses round trip and sanitizes array entries and invalid run': async ({ assert, load }) => {
    const m = await load('/src/silver/save.ts');
    const save = validSave();
    assert.deepEqual(m.parseSave(JSON.stringify(save)), save);
    save.seen = ['a', 3];
    save.doneChapters = ['1.1', 'invalid'];
    save.notebook.push(4);
    save.run = { chapterId: 'invalid', itemId: 3, courses: [] };
    const parsed = m.parseSave(JSON.stringify(save));
    assert.deepEqual(parsed.seen, ['a']);
    assert.deepEqual(parsed.doneChapters, ['1.1']);
    assert.equal(parsed.notebook.length, 1);
    assert.equal(parsed.run, null);
  },
  'rejects missing seed and wrong version; validates every saved field': async ({ assert, load }) => {
    const m = await load('/src/silver/save.ts');
    const seedMissing = validSave(); delete seedMissing.seed;
    assert.equal(m.parseSave(JSON.stringify(seedMissing)), null);
    const badVersion = validSave(); badVersion.version = 2;
    assert.equal(m.parseSave(JSON.stringify(badVersion)), null);
    assert.equal(m.parseSave('{oops'), null);
    const bad = validSave();
    bad.flags = { keep: 1 };
    bad.seen = 'not-array';
    bad.registrations = { '2.2': ['ok', 2], invalid: ['skip'] };
    bad.doneChapters = ['entrance', 'bad'];
    bad.notebook = [
      { chapterId: 'bad', photoId: 'p', lineId: 'l', courses: [], savedAt: 'x' },
      { chapterId: '1.1', photoId: 3, lineId: 'l', courses: [], savedAt: 'x' },
      { chapterId: '1.1', photoId: 'p', lineId: 'l', courses: [3], savedAt: 'x' },
      { chapterId: '1.1', photoId: 'p', lineId: 'l', courses: ['c'], savedAt: 'x' },
    ];
    bad.run = { chapterId: '1.1', courses: ['ok', 2], itemId: 'i' };
    const parsed = m.parseSave(JSON.stringify(bad));
    assert.deepEqual(parsed.flags, {});
    assert.deepEqual(parsed.seen, []);
    assert.deepEqual(parsed.registrations, { '2.2': ['ok'] });
    assert.deepEqual(parsed.doneChapters, ['entrance']);
    assert.deepEqual(parsed.notebook.map(entry => entry.savedAt), ['x', 'x']);
    assert.equal(parsed.run, null);
  },
  'read handles corrupt backup, null storage and thrown get/set': async ({ assert, load }) => {
    const m = await load('/src/silver/save.ts');
    const store = new Map([[m.SAVE_KEY, '{oops']]);
    const kv = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) };
    assert.deepEqual(m.readSave(kv, () => 'new'), { save: m.emptySave('new'), warning: 'corrupt' });
    assert.equal(store.get(`${m.SAVE_KEY}.bak`), '{oops');
    assert.equal(m.readSave(null, () => 'blocked').warning, 'blocked');
    assert.equal(m.readSave({ ...kv, getItem: () => { throw new Error('blocked'); } }, () => 'blocked').warning, 'blocked');
    assert.equal(m.readSave({ ...kv, setItem: () => { throw new Error('blocked'); } }, () => 'blocked').warning, 'blocked');
  },
  'write catches storage failures; clear preserves backup': async ({ assert, load }) => {
    const m = await load('/src/silver/save.ts');
    const store = new Map([[`${m.SAVE_KEY}.bak`, 'backup']]);
    const kv = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) };
    assert.equal(m.writeSave({ ...kv, setItem: () => { throw new Error('blocked'); } }, m.emptySave('x')), false);
    assert.equal(m.writeSave(null, m.emptySave('x')), false);
    assert.equal(m.writeSave(kv, m.emptySave('x')), true);
    m.clearSave(kv);
    assert.equal(store.has(m.SAVE_KEY), false);
    assert.equal(store.get(`${m.SAVE_KEY}.bak`), 'backup');
  },
};
