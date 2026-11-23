const tuple = transcript => [transcript.listening, transcript.reading, transcript.writing, transcript.speaking].join(' ');

export default {
  'FNV-1a known UTF-8 examples': async ({ assert, load }) => {
    const { fnv1a } = await load('/src/silver/grades.ts');
    assert.equal(fnv1a(''), 2166136261);
    assert.equal(fnv1a('a'), 3826002220);
    assert.equal(fnv1a(['demo', '1', 'listening', '0'].join('|')), 1894222480);
  },
  'demo and eiu-1 grades by level': async ({ assert, load }) => {
    const { englishGrades } = await load('/src/silver/grades.ts');
    assert.deepEqual([1, 2, 3, 4, 5].map(level => tuple(englishGrades('demo', level))), ['D C B C', 'C D C B', 'D B C C', 'C B D B', 'C C B B']);
    assert.deepEqual([1, 2, 3, 4, 5].map(level => tuple(englishGrades('eiu-1', level))), ['B C B C', 'A C C C', 'B B B C', 'B C C C', 'C C B C']);
  },
  'passing threshold and 1000 deterministic seeds': async ({ assert, load }) => {
    const { englishGrades, isPassing } = await load('/src/silver/grades.ts');
    assert.equal(isPassing({ level: 1, listening: 'D', reading: 'D', writing: 'C', speaking: 'B' }), true);
    assert.equal(isPassing({ level: 1, listening: 'D', reading: 'D', writing: 'D', speaking: 'B' }), false);
    for (let seed = 0; seed < 1000; seed += 1) {
      for (let level = 1; level <= 5; level += 1) {
        assert.equal(isPassing(englishGrades(`s${seed}`, level)), true);
      }
    }
  },
};
