import { create } from 'zustand';

export default {
  'CSE 103 lab-1 to lab-2 preserves seated pose, changing day clears seated and teleports to arrival'({ assert, load }) {
    return Promise.all([
      load('/src/silverWorld/director.ts'),
      load('/src/data/index.ts'),
      load('/src/scene/interior/layouts/b8.ts'),
    ]).then(([{ startDirector }, { getClassroom }, b8Layout]) => {
      // Fake activity store
      let beginCalls = [];
      let seatedState = false;
      const fakeActivityStore = create((set) => ({
        activity: null,
        phase: 'travel',
        seated: false,
        teleport: null,
        begin: (act, opts) => {
          beginCalls.push({ activity: act, opts });
          if (opts.keepSeated && seatedState) {
            set({ activity: act, seated: true, phase: 'engaged' });
          } else {
            set({
              activity: act,
              seated: false,
              phase: act.trigger === 'none' ? 'engaged' : 'travel',
              teleport: opts.teleportTo === 'arrival' ? { id: 1, spot: act.arrival } : null,
            });
          }
        },
        end: () => set({ activity: null, seated: false, phase: 'travel' }),
      }));

      // Fake walk store with real shape: playerPos { x, z, y, floor } and interior
      const fakeWalkStore = create(() => ({
        walkMode: true,
        interior: { buildingId: 'b8', floor: 4 },
        playerPos: { x: 37.95, z: -218.49, y: 0, floor: 4 },
      }));

      // Fake silver store
      let exitRunCalled = false;
      const fakeSilverStore = create((set) => ({
        screen: 'home',
        play: null,
        exitRun: () => { exitRunCalled = true; set({ screen: 'home' }); },
      }));

      // Mock 207.B8 classroom
      const mock207B8 = {
        code: '207.B8',
        name: 'Phòng lý thuyết 207.B8',
        buildingId: 'b8',
        floor: 2,
        frame: 'b8',
        bounds: { minU: 80.8, maxU: 90.1, minV: -177.7, maxV: -166 },
        door: { u: 81.9, v: -177.7 },
        doorWorld: [39.5, -191.64],
        centerWorld: [44.28, -186.74],
        arrival: { u: 81.9, v: -178.9 },
        studentFacing: [-1, 0],
        whiteboard: { u: 80.88, v: -174.6, width: 2.2, height: 1.2, bottom: 1, facing: [1, 0] },
        projectorScreen: { u: 80.9, v: -172.2, width: 2, height: 1.2, bottom: 1.25, facing: [1, 0] },
        teacherDesk: { u: 82.5, v: -170.6, width: 1.4, depth: 0.7, height: 0.75, facing: [1, 0] },
        teacherSpots: { lecture: { u: 81.8, v: -174.6 }, desk: { u: 81.7, v: -170.6 } },
        desk: { depth: 0.5, width: 0.9, height: 0.75 },
        chairSeatHeight: 0.45,
        aisle: { minV: -173.65, maxV: -172.25 },
        seats: [{ id: '207-r2-s3', u: 85.9, v: -174.1, deskU: 85.4 }],
        playerSeat: '207-r2-s3',
        companionSeat: '207-r2-s2',
        standPoint: { u: 85.9, v: -172.95 },
        npcSeats: ['207-r1-s1'],
      };

      const getRoom = (code) => {
        if (code === '207.B8') return mock207B8;
        return getClassroom(code);
      };

      const stopDirector = startDirector({
        silver: fakeSilverStore,
        activity: fakeActivityStore,
        walk: fakeWalkStore,
        getClassroom: getRoom,
        toWorld: (_frame, u, v) => b8Layout.toWorld(u, v),
      });

      try {
        // 1. Enter chapter 2.2, lab-1 begins in 406.B8
        const lab1Item = {
          id: 'session:cse-103:lab:1',
          kind: 'session',
          meeting: { code: 'CSE 103', kind: 'lab', day: 1, slot: 2, length: 1 },
          scene: { id: 'CSE 103/lab-1', title: { vi: 'Lab 1', en: 'Lab 1' }, place: '406.B8', minutes: 45, steps: [] },
          minutes: 45,
        };

        fakeSilverStore.setState({
          screen: 'play',
          play: {
            chapterId: '2.2',
            itemIndex: 0,
            itemCount: 4,
            item: lab1Item,
            stepIndex: 0,
            stepCount: 5,
            step: { id: 's1', type: 'say', speaker: 'teacher', text: { vi: 'Hi', en: 'Hi' } },
            feedback: null,
            attempts: 0,
            hint: null,
            canContinue: true,
          },
        });

        assert.equal(beginCalls.length, 1);
        // Key Activity format: silver:<RunItem.id>
        assert.equal(beginCalls[0].activity.key, 'silver:session:cse-103:lab:1');
        assert.equal(beginCalls[0].opts.teleportTo, 'arrival');
        assert.equal(beginCalls[0].opts.keepSeated, false);

        // Player interacts and sits down
        seatedState = true;
        fakeActivityStore.setState({ seated: true, phase: 'engaged' });

        // 2. Next item: CSE 103 lab-2 (same room 406.B8, same meeting day)
        const lab2Item = {
          id: 'session:cse-103:lab:2',
          kind: 'session',
          meeting: { code: 'CSE 103', kind: 'lab', day: 1, slot: 3, length: 1 },
          scene: { id: 'CSE 103/lab-2', title: { vi: 'Lab 2', en: 'Lab 2' }, place: '406.B8', minutes: 45, steps: [] },
          minutes: 45,
        };

        fakeSilverStore.setState({
          play: {
            chapterId: '2.2',
            itemIndex: 1,
            itemCount: 4,
            item: lab2Item,
            stepIndex: 0,
            stepCount: 5,
            step: { id: 's2', type: 'say', speaker: 'teacher', text: { vi: 'Hi 2', en: 'Hi 2' } },
            feedback: null,
            attempts: 0,
            hint: null,
            canContinue: true,
          },
        });

        assert.equal(beginCalls.length, 2);
        assert.equal(beginCalls[1].activity.key, 'silver:session:cse-103:lab:2');
        assert.equal(beginCalls[1].opts.keepSeated, true);
        assert.equal(beginCalls[1].opts.teleportTo, 'none');

        // 3. Next item: MATH 112 A on different day (day: 2) in 207.B8
        const mathItem = {
          id: 'session:math-112:theoryA:1',
          kind: 'session',
          meeting: { code: 'MATH 112', kind: 'theoryA', day: 2, slot: 0, length: 1 },
          scene: { id: 'MATH 112/theory-a', title: { vi: 'Toán', en: 'Math' }, place: '207.B8', minutes: 45, steps: [] },
          minutes: 45,
        };

        fakeSilverStore.setState({
          play: {
            chapterId: '2.2',
            itemIndex: 2,
            itemCount: 4,
            item: mathItem,
            stepIndex: 0,
            stepCount: 5,
            step: { id: 's3', type: 'say', speaker: 'teacher', text: { vi: 'Math', en: 'Math' } },
            feedback: null,
            attempts: 0,
            hint: null,
            canContinue: true,
          },
        });

        assert.equal(beginCalls.length, 3);
        assert.equal(beginCalls[2].activity.key, 'silver:session:math-112:theoryA:1');
        assert.equal(beginCalls[2].opts.keepSeated, false);
        assert.equal(beginCalls[2].opts.teleportTo, 'arrival');
        assert.equal(beginCalls[2].activity.arrival.buildingId, 'b8');
        assert.equal(beginCalls[2].activity.arrival.floor, 2);

        // 4. Turning walkMode to false during play triggers silver.exitRun()
        assert.equal(exitRunCalled, false);
        fakeWalkStore.setState({ walkMode: false });
        assert.equal(exitRunCalled, true);
      } finally {
        stopDirector();
      }
    });
  },

  'play to week and back to same item does NOT call begin again'({ assert, load }) {
    return Promise.all([
      load('/src/silverWorld/director.ts'),
      load('/src/data/index.ts'),
    ]).then(([{ startDirector }, { getClassroom }]) => {
      let beginCalls = [];
      const fakeActivityStore = create(() => ({
        activity: null,
        seated: true,
        screenOpen: true,
        begin: (act, opts) => beginCalls.push({ activity: act, opts }),
        end: () => {},
      }));

      const fakeWalkStore = create(() => ({
        walkMode: true,
        interior: { buildingId: 'b8', floor: 4 },
        playerPos: { x: 37.95, z: -218.49, y: 0, floor: 4 },
      }));

      let exitRunCalled = false;
      const fakeSilverStore = create((set) => ({
        screen: 'home',
        play: null,
        exitRun: () => { exitRunCalled = true; set({ screen: 'home' }); },
      }));

      const stopDirector = startDirector({
        silver: fakeSilverStore,
        activity: fakeActivityStore,
        walk: fakeWalkStore,
        getClassroom,
      });

      try {
        const item1 = {
          id: 'session:cse-103:lab:1',
          kind: 'session',
          meeting: { code: 'CSE 103', kind: 'lab', day: 1, slot: 2, length: 1 },
          scene: { id: 'CSE 103/lab-1', title: { vi: 'Lab 1', en: 'Lab 1' }, place: '406.B8', minutes: 45, steps: [] },
          minutes: 45,
        };

        const playView = {
          chapterId: '2.2',
          itemIndex: 0,
          itemCount: 4,
          item: item1,
          stepIndex: 0,
          stepCount: 5,
          step: { id: 's1', type: 'say', speaker: 'teacher', text: { vi: 'Hi', en: 'Hi' } },
          feedback: null,
          attempts: 0,
          hint: null,
          canContinue: true,
        };

        // 1. Enter play
        fakeSilverStore.setState({ screen: 'play', play: playView });
        assert.equal(beginCalls.length, 1);

        // 2. Player opens schedule (play -> week)
        fakeSilverStore.setState({ screen: 'week' });
        // In week, turning off walkMode does NOT exit run
        fakeWalkStore.setState({ walkMode: false });
        assert.equal(exitRunCalled, false);
        fakeWalkStore.setState({ walkMode: true });

        // 3. Return from week to play with the SAME item: MUST NOT begin again!
        fakeSilverStore.setState({ screen: 'play', play: playView });
        assert.equal(beginCalls.length, 1); // Still 1, did not call begin again!
      } finally {
        stopDirector();
      }
    });
  },

  'from week to NEW item on same day within 60 m uses teleportTo none, >= 60 m uses arrival'({ assert, load }) {
    return Promise.all([
      load('/src/silverWorld/director.ts'),
      load('/src/data/index.ts'),
    ]).then(([{ startDirector }, { getClassroom }]) => {
      let beginCalls = [];
      const fakeActivityStore = create(() => ({
        activity: null,
        seated: false,
        begin: (act, opts) => beginCalls.push({ activity: act, opts }),
        end: () => {},
      }));

      // Player in B8 floor 4, 10 m away from arrival (arrival: x=35.88, z=-212.05)
      const fakeWalkStore = create(() => ({
        walkMode: true,
        interior: { buildingId: 'b8', floor: 4 },
        playerPos: { x: 35.88 + 5, z: -212.05 + 5, y: 0, floor: 4 },
      }));

      const fakeSilverStore = create(() => ({
        screen: 'home',
        play: null,
        exitRun: () => {},
      }));

      const stopDirector = startDirector({
        silver: fakeSilverStore,
        activity: fakeActivityStore,
        walk: fakeWalkStore,
        getClassroom,
      });

      try {
        const item0 = {
          id: 'session:cse-103:theory:1',
          kind: 'session',
          meeting: { code: 'CSE 103', kind: 'theory', day: 1, slot: 1, length: 1 },
          scene: { id: 'CSE 103/lab-1', title: { vi: 'Theory 1', en: 'Theory 1' }, place: '406.B8', minutes: 45, steps: [] },
          minutes: 45,
        };

        const item1 = {
          id: 'session:cse-103:lab:1',
          kind: 'session',
          meeting: { code: 'CSE 103', kind: 'lab', day: 1, slot: 2, length: 1 },
          scene: { id: 'CSE 103/lab-1', title: { vi: 'Lab 1', en: 'Lab 1' }, place: '406.B8', minutes: 45, steps: [] },
          minutes: 45,
        };

        // 1. Player starts playing item0 on day 1
        fakeSilverStore.setState({
          screen: 'play',
          play: {
            chapterId: '2.2',
            itemIndex: 0,
            itemCount: 3,
            item: item0,
            stepIndex: 0,
            stepCount: 2,
            step: { id: 's0', type: 'say', speaker: 'teacher', text: { vi: '...', en: '...' } },
            feedback: null,
            attempts: 0,
            hint: null,
            canContinue: true,
          },
        });
        assert.equal(beginCalls.length, 1);

        // 2. Open schedule (play -> week)
        fakeSilverStore.setState({ screen: 'week' });

        // 3. Transition from week to new item1 on same day (day 1, close by < 60 m) -> teleportTo: 'none'
        fakeSilverStore.setState({
          screen: 'play',
          play: {
            chapterId: '2.2',
            itemIndex: 1,
            itemCount: 3,
            item: item1,
            stepIndex: 0,
            stepCount: 2,
            step: { id: 's1', type: 'say', speaker: 'teacher', text: { vi: '...', en: '...' } },
            feedback: null,
            attempts: 0,
            hint: null,
            canContinue: true,
          },
        });
        assert.equal(beginCalls.length, 2);
        assert.equal(beginCalls[1].opts.teleportTo, 'none');

        // 4. Transition to week again
        fakeSilverStore.setState({ screen: 'week' });

        // Move player far away (> 60 m away)
        fakeWalkStore.setState({
          playerPos: { x: 35.88 + 70, z: -212.05, y: 0, floor: 4 },
        });

        // 5. Transition to new item2 on same day -> distance >= 60 m -> teleportTo: 'arrival'
        const item2 = {
          id: 'session:cse-103:lab:2',
          kind: 'session',
          meeting: { code: 'CSE 103', kind: 'lab', day: 1, slot: 3, length: 1 },
          scene: { id: 'CSE 103/lab-2', title: { vi: 'Lab 2', en: 'Lab 2' }, place: '406.B8', minutes: 45, steps: [] },
          minutes: 45,
        };

        fakeSilverStore.setState({
          screen: 'play',
          play: {
            chapterId: '2.2',
            itemIndex: 2,
            itemCount: 3,
            item: item2,
            stepIndex: 0,
            stepCount: 2,
            step: { id: 's2', type: 'say', speaker: 'teacher', text: { vi: '...', en: '...' } },
            feedback: null,
            attempts: 0,
            hint: null,
            canContinue: true,
          },
        });
        assert.equal(beginCalls.length, 3);
        assert.equal(beginCalls[2].opts.teleportTo, 'arrival');
      } finally {
        stopDirector();
      }
    });
  },

  'keepSeated is false when in same room but different day'({ assert, load }) {
    return Promise.all([
      load('/src/silverWorld/director.ts'),
      load('/src/data/index.ts'),
    ]).then(([{ startDirector }, { getClassroom }]) => {
      let beginCalls = [];
      const fakeActivityStore = create(() => ({
        activity: null,
        seated: true,
        begin: (act, opts) => beginCalls.push({ activity: act, opts }),
        end: () => {},
      }));

      const fakeWalkStore = create(() => ({
        walkMode: true,
        interior: { buildingId: 'b8', floor: 4 },
        playerPos: { x: 37.95, z: -218.49, y: 0, floor: 4 },
      }));

      const fakeSilverStore = create(() => ({
        screen: 'home',
        play: null,
        exitRun: () => {},
      }));

      const stopDirector = startDirector({
        silver: fakeSilverStore,
        activity: fakeActivityStore,
        walk: fakeWalkStore,
        getClassroom,
      });

      try {
        const itemDay1 = {
          id: 'session:cse-103:lab:1',
          kind: 'session',
          meeting: { code: 'CSE 103', kind: 'lab', day: 1, slot: 2, length: 1 },
          scene: { id: 'CSE 103/lab-1', title: { vi: 'Lab 1', en: 'Lab 1' }, place: '406.B8', minutes: 45, steps: [] },
          minutes: 45,
        };

        fakeSilverStore.setState({
          screen: 'play',
          play: {
            chapterId: '2.2',
            itemIndex: 0,
            itemCount: 2,
            item: itemDay1,
            stepIndex: 0,
            stepCount: 2,
            step: { id: 's1', type: 'say', speaker: 'teacher', text: { vi: '...', en: '...' } },
            feedback: null,
            attempts: 0,
            hint: null,
            canContinue: true,
          },
        });

        // Next item in SAME room (406.B8) but DIFFERENT day (day: 3, e.g. CSE 204 lab-1)
        const itemDay3 = {
          id: 'session:cse-204:lab:1',
          kind: 'session',
          meeting: { code: 'CSE 204', kind: 'lab', day: 3, slot: 2, length: 1 },
          scene: { id: 'CSE 204/lab-1', title: { vi: 'Lab 204', en: 'Lab 204' }, place: '406.B8', minutes: 45, steps: [] },
          minutes: 45,
        };

        fakeSilverStore.setState({
          play: {
            chapterId: '2.2',
            itemIndex: 1,
            itemCount: 2,
            item: itemDay3,
            stepIndex: 0,
            stepCount: 2,
            step: { id: 's2', type: 'say', speaker: 'teacher', text: { vi: '...', en: '...' } },
            feedback: null,
            attempts: 0,
            hint: null,
            canContinue: true,
          },
        });

        assert.equal(beginCalls.length, 2);
        // keepSeated MUST be false because day changed!
        assert.equal(beginCalls[1].opts.keepSeated, false);
      } finally {
        stopDirector();
      }
    });
  },

  'absent room treated as strange scene: does not begin, warns once, and ends old silver activity'({ assert, load }) {
    return Promise.all([
      load('/src/silverWorld/director.ts'),
      load('/src/data/index.ts'),
    ]).then(([{ startDirector }, { getClassroom }]) => {
      let beginCalls = [];
      let endCalled = false;
      const fakeActivityStore = create((set) => ({
        activity: { source: 'silver', key: 'silver:old-item' },
        seated: false,
        begin: (act, opts) => beginCalls.push({ activity: act, opts }),
        end: () => { endCalled = true; set({ activity: null }); },
      }));

      const fakeWalkStore = create(() => ({
        walkMode: true,
        interior: null,
        playerPos: { x: 0, z: 0, y: 0, floor: null },
      }));

      const fakeSilverStore = create(() => ({
        screen: 'home',
        play: null,
        exitRun: () => {},
      }));

      const warnings = [];
      const originalWarn = console.warn;
      console.warn = (...args) => warnings.push(args.join(' '));

      // Room 207.B8 is NOT provided by getClassroom in đợt 1
      const stopDirector = startDirector({
        silver: fakeSilverStore,
        activity: fakeActivityStore,
        walk: fakeWalkStore,
        getClassroom, // standard classrooms without 207.B8
      });

      try {
        const itemAbsentRoom = {
          id: 'session:cse-103:theoryA:1',
          kind: 'session',
          meeting: { code: 'CSE 103', kind: 'theoryA', day: 2, slot: 2, length: 1 },
          scene: { id: 'CSE 103/a', title: { vi: 'Điều kiện', en: 'Conditions' }, place: '207.B8', minutes: 45, steps: [] },
          minutes: 45,
        };

        fakeSilverStore.setState({
          screen: 'play',
          play: {
            chapterId: '2.2',
            itemIndex: 0,
            itemCount: 1,
            item: itemAbsentRoom,
            stepIndex: 0,
            stepCount: 2,
            step: { id: 's1', type: 'say', speaker: 'teacher', text: { vi: '...', en: '...' } },
            feedback: null,
            attempts: 0,
            hint: null,
            canContinue: true,
          },
        });

        // Does not call begin
        assert.equal(beginCalls.length, 0);
        // Warns once
        assert.equal(warnings.length, 1);
        assert.ok(warnings[0].includes('CSE 103/a'));
        // Ended old silver activity so player isn't stuck
        assert.equal(endCalled, true);
        assert.equal(fakeActivityStore.getState().activity, null);

        // Next step in same absent item -> no duplicate warning
        fakeSilverStore.setState({
          play: {
            chapterId: '2.2',
            itemIndex: 0,
            itemCount: 1,
            item: itemAbsentRoom,
            stepIndex: 1,
            stepCount: 2,
            step: { id: 's2', type: 'say', speaker: 'teacher', text: { vi: '...', en: '...' } },
            feedback: null,
            attempts: 0,
            hint: null,
            canContinue: true,
          },
        });
        assert.equal(warnings.length, 1);
      } finally {
        console.warn = originalWarn;
        stopDirector();
      }
    });
  },
};
