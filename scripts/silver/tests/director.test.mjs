import { create } from 'zustand';

export default {
  'CSE 103 lab-1 to lab-2 preserves seated pose without teleport, then changes day to MATH 112 with teleport'({ assert, load }) {
    return Promise.all([
      load('/src/silverWorld/director.ts'),
      load('/src/types/silverWorld.ts'),
      load('/src/data/index.ts'),
    ]).then(([{ startDirector }, , { getClassroom }]) => {
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

      // Fake walk store
      const fakeWalkStore = create(() => ({
        walkMode: true,
        interior: { buildingId: 'b8', floor: 4 },
        playerPos: { x: 37.95, y: 0, z: -218.49, floor: 4 },
      }));

      // Fake silver store
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
        assert.equal(beginCalls[0].activity.key, 'silver:CSE 103/lab-1');
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
        assert.equal(beginCalls[1].activity.key, 'silver:CSE 103/lab-2');
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
        assert.equal(beginCalls[2].activity.key, 'silver:MATH 112/theory-a');
        assert.equal(beginCalls[2].opts.keepSeated, false);
        assert.equal(beginCalls[2].opts.teleportTo, 'arrival');
        // Teleport destination is arrival of 207.B8 (door)
        assert.equal(beginCalls[2].activity.arrival.buildingId, 'b8');
        assert.equal(beginCalls[2].activity.arrival.floor, 2);
        assert.equal(fakeActivityStore.getState().seated, false);

        // 4. Turning walkMode to false during play triggers silver.exitRun()
        assert.equal(exitRunCalled, false);
        fakeWalkStore.setState({ walkMode: false });
        assert.equal(exitRunCalled, true);
      } finally {
        stopDirector();
      }
    });
  },

  'resuming CSE 103/a from Home teleports to door of 207.B8'({ assert, load }) {
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

      const fakeWalkStore = create(() => ({
        walkMode: true,
        playerPos: { buildingId: null, floor: null, x: 0, z: 0 },
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
        const item103a = {
          id: 'session:cse-103:theoryA:1',
          kind: 'session',
          meeting: { code: 'CSE 103', kind: 'theoryA', day: 2, slot: 2, length: 1 },
          scene: { id: 'CSE 103/a', title: { vi: 'Điều kiện', en: 'Conditions' }, place: '207.B8', minutes: 45, steps: [] },
          minutes: 45,
        };

        // Resume from Home into Play
        fakeSilverStore.setState({
          screen: 'play',
          play: {
            chapterId: '2.2',
            itemIndex: 2,
            itemCount: 5,
            item: item103a,
            stepIndex: 0,
            stepCount: 4,
            step: { id: 's1', type: 'say', speaker: 'teacher', text: { vi: 'If', en: 'If' } },
            feedback: null,
            attempts: 0,
            hint: null,
            canContinue: true,
          },
        });

        assert.equal(beginCalls.length, 1);
        assert.equal(beginCalls[0].activity.key, 'silver:CSE 103/a');
        assert.equal(beginCalls[0].opts.teleportTo, 'arrival');
        assert.equal(beginCalls[0].opts.keepSeated, false);
        // Teleport to arrival of 207.B8
        assert.equal(beginCalls[0].activity.arrival.buildingId, 'b8');
        assert.equal(beginCalls[0].activity.arrival.floor, 2);
        assert.equal(beginCalls[0].activity.arrival.x, 39.22);
        assert.equal(beginCalls[0].activity.arrival.z, -192.81);
      } finally {
        stopDirector();
      }
    });
  },

  'unknown sceneId does not begin and warns once'({ assert, load }) {
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

      const fakeWalkStore = create(() => ({
        walkMode: true,
        playerPos: { buildingId: null, floor: null, x: 0, z: 0 },
      }));

      const fakeSilverStore = create(() => ({
        screen: 'home',
        play: null,
        exitRun: () => {},
      }));

      const warnings = [];
      const originalWarn = console.warn;
      console.warn = (...args) => warnings.push(args.join(' '));

      const stopDirector = startDirector({
        silver: fakeSilverStore,
        activity: fakeActivityStore,
        walk: fakeWalkStore,
        getClassroom,
      });

      try {
        const unknownItem = {
          id: 'unknown-item',
          kind: 'scene',
          scene: { id: 'nonexistent/scene-999', title: { vi: 'Lạ', en: 'Unknown' }, place: 'b8', minutes: 10, steps: [] },
          minutes: 10,
        };

        // First transition to unknown scene
        fakeSilverStore.setState({
          screen: 'play',
          play: {
            chapterId: '2.2',
            itemIndex: 0,
            itemCount: 1,
            item: unknownItem,
            stepIndex: 0,
            stepCount: 1,
            step: { id: 's1', type: 'say', speaker: 'narrator', text: { vi: '...', en: '...' } },
            feedback: null,
            attempts: 0,
            hint: null,
            canContinue: true,
          },
        });

        assert.equal(beginCalls.length, 0);
        assert.equal(warnings.length, 1);
        assert.ok(warnings[0].includes('nonexistent/scene-999'));

        // Second notification with same unknown scene -> no duplicate warning
        fakeSilverStore.setState({
          play: {
            chapterId: '2.2',
            itemIndex: 0,
            itemCount: 1,
            item: unknownItem,
            stepIndex: 1,
            stepCount: 2,
            step: { id: 's2', type: 'say', speaker: 'narrator', text: { vi: '...', en: '...' } },
            feedback: null,
            attempts: 0,
            hint: null,
            canContinue: true,
          },
        });

        assert.equal(beginCalls.length, 0);
        assert.equal(warnings.length, 1);
      } finally {
        console.warn = originalWarn;
        stopDirector();
      }
    });
  },
};
