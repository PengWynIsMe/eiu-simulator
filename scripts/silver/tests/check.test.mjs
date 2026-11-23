import { spawnSync } from 'node:child_process';
import { wordCount, checkConds, checkContentFileName, compareCurriculumCourse, wordLimitViolation } from '../check.mjs';

export default {
  'word count splits on whitespace': async ({ assert }) => {
    assert.equal(wordCount('  one\ttwo\nthree  '), 3);
    assert.equal(wordCount('  '), 0);
  },
  'condition references validate scene flag and option ids': async ({ assert }) => {
    const valid = [{ id: 'scene-a', steps: [{ type: 'choice', flag: 'seat', options: [{ id: 'front' }] }] }, { when: { seen: 'scene-a', flag: { key: 'seat', is: 'front' } } }];
    assert.deepEqual(checkConds(valid), []);
    assert.deepEqual(checkConds([{ when: { seen: 'missing' } }]), ['seen không tồn tại: missing']);
    assert.deepEqual(checkConds([{ when: { flag: { key: 'missing', is: 'x' } } }]), ['flag không tồn tại: missing']);
    assert.deepEqual(checkConds([{ id: 's', steps: [{ type: 'choice', flag: 'f', options: [{ id: 'yes' }] }] }, { when: { flag: { key: 'f', is: 'no' } } }]), ['option không tồn tại: f=no']);
  },
  'content identity, curriculum fields and word thresholds': async ({ assert }) => {
    assert.equal(checkContentFileName('cse-103.json', 'CSE 103'), undefined);
    assert.match(checkContentFileName('wrong.json', 'CSE 103'), /CSE 103/);
    const expected = { code: 'CSE 103', credits: 4, lt: 3, th: 1, pdfTerm: '2.2' };
    assert.equal(compareCurriculumCourse(expected, { credits: 4, lt: 3, th: 1, year: 2, semester: 2 }), undefined);
    assert.match(compareCurriculumCourse(expected, { credits: 5, lt: 3, th: 1, year: 2, semester: 2 }), /CSE 103.*credits/);
    assert.equal(wordLimitViolation('a '.repeat(130), 130), false);
    assert.equal(wordLimitViolation('a '.repeat(131), 130), true);
    assert.equal(wordLimitViolation('a '.repeat(200), 200), false);
    assert.equal(wordLimitViolation('a '.repeat(201), 200), true);
    assert.equal(wordLimitViolation('a '.repeat(26), 25), true);
  },
  'normal mode warns for absent demo content and strict mode fails': async ({ assert }) => {
    const normal = spawnSync('node', ['scripts/silver/check.mjs'], { encoding: 'utf8' });
    const strict = spawnSync('node', ['scripts/silver/check.mjs', '--strict'], { encoding: 'utf8' });
    assert.equal(normal.status, 0);
    assert.match(normal.stdout, /2\.2 thiếu nội dung/);
    assert.equal(strict.status, 1);
    assert.match(strict.stdout, /2\.2 thiếu nội dung/);
  },
};
