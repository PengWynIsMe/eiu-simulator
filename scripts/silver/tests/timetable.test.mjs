const normalize = (meetings) => meetings.map(m => `${m.code.replaceAll(' ', '')} ${m.kind} ${m.day}.${m.slot}×${m.length}`).join('; ');
const checkInvariants = (assert, meetings) => {
  const occupied = new Set();
  for (const meeting of meetings) {
    for (let slot = meeting.slot; slot < meeting.slot + meeting.length; slot += 1) {
      const key = `${meeting.day}.${slot}`;
      assert.equal(occupied.has(key), false, `overlap ${key}`);
      occupied.add(key);
    }
    if (meeting.kind === 'lab' || meeting.kind === 'project') {
      assert.equal(meeting.length, 2);
      assert.equal(meeting.slot % 2, 0);
    }
  }
};

export default {
  'A and B exact schedules': async ({ assert, load }) => {
    const { buildTimetable } = await load('/src/silver/timetable.ts');
    const a = buildTimetable([
      { code: 'CSE103', core: true, lab: 'lab', theory: 2 },
      { code: 'MATH112', core: false, lab: null, theory: 2 },
      { code: 'POLS135', core: false, lab: null, theory: 2 },
      { code: 'COMS101', core: false, lab: null, theory: 2 },
    ]);
    assert.equal(normalize(a), 'CSE103 lab 0.0×2; MATH112 theoryA 1.0×1; POLS135 theoryA 1.1×1; CSE103 theoryA 2.0×1; COMS101 theoryA 2.1×1; MATH112 theoryB 3.0×1; POLS135 theoryB 3.1×1; CSE103 theoryB 4.0×1; COMS101 theoryB 4.1×1');
    const b = buildTimetable([
      { code: 'CSE103', core: true, lab: 'lab', theory: 2 },
      { code: 'CSE204', core: false, lab: 'lab', theory: 2 },
      { code: 'POLS135', core: false, lab: null, theory: 2 },
      { code: 'COMS101', core: false, lab: null, theory: 2 },
    ]);
    assert.equal(normalize(b), 'CSE103 lab 0.0×2; CSE204 theoryA 0.2×1; POLS135 theoryA 1.0×1; COMS101 theoryA 1.1×1; CSE204 lab 2.0×2; CSE103 theoryA 3.0×1; POLS135 theoryB 3.1×1; CSE204 theoryB 4.0×1; COMS101 theoryB 4.1×1; CSE103 theoryB 5.0×1');
    checkInvariants(assert, a);
    checkInvariants(assert, b);
    assert.deepEqual(buildTimetable([
      { code: 'CSE103', core: true, lab: 'lab', theory: 2 },
      { code: 'MATH112', core: false, lab: null, theory: 2 },
      { code: 'POLS135', core: false, lab: null, theory: 2 },
      { code: 'COMS101', core: false, lab: null, theory: 2 },
    ]), a);
  },
  'C six labs allocation and repeat determinism': async ({ assert, load }) => {
    const { buildTimetable } = await load('/src/silver/timetable.ts');
    const courses = ['a', 'b', 'c', 'd', 'e', 'f'].map((code, index) => ({ code, core: index === 0, lab: 'lab', theory: 2 }));
    const first = buildTimetable(courses);
    assert.equal(first.length, 18);
    assert.deepEqual(first.filter(m => m.kind === 'lab').map(m => [m.code, m.day, m.slot]).sort((a,b)=>a[0].localeCompare(b[0])), [['a',0,0],['b',2,0],['c',4,0],['d',1,0],['e',3,0],['f',5,0]]);
    checkInvariants(assert, first);
    assert.deepEqual(buildTimetable(courses), first);
  },
  'D project, E seven labs and course conversion': async ({ assert, load }) => {
    const { buildTimetable, toTimetableCourse } = await load('/src/silver/timetable.ts');
    assert.equal(normalize(buildTimetable([{ code: 'CSW400', core: true, lab: 'project', theory: 0 }])), 'CSW400 project 0.0×2');
    assert.throws(() => buildTimetable(Array.from({ length: 7 }, (_, i) => ({ code: `l${i}`, core: i === 0, lab: 'lab', theory: 0 }))), /Không còn ca/);
    const catalog = await load('/src/data/silver/catalog.ts');
    assert.deepEqual(toTimetableCourse(catalog.getCourse('CSE 103'), true), { code: 'CSE 103', core: true, lab: 'lab', theory: 2 });
    assert.deepEqual(toTimetableCourse(catalog.getCourse('POLS 133'), false), { code: 'POLS 133', core: false, lab: null, theory: 2 });
    assert.deepEqual(toTimetableCourse(catalog.getCourse('CSW 400'), false), { code: 'CSW 400', core: false, lab: 'project', theory: 0 });
  },
};
