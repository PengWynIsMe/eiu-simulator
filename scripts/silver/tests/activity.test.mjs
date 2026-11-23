const spot = (x, z, facing = [1, 0]) => ({ x, z, facing, buildingId: 'b8', floor: 4 });
const seat = {
  id: 'r2-s5',
  spot: spot(10, 20),
  stand: spot(10, 19),
  camera: { eye: [9.35, 1.55, 20.15], look: [15, 1.35, 20] },
  screenCamera: { eye: [10.2, 1.08, 20], look: [10.65, 1.05, 20] },
};
const activity = {
  key: 'silver:lab-1',
  source: 'silver',
  trigger: 'sit',
  arrival: spot(3, 18),
  target: seat.spot,
  seat,
  prompt: { vi: 'Ngồi (E)', en: 'Sit (E)' },
};
const walk = { teleportTo: 'none', keepSeated: false };
const travel = { ...walk, teleportTo: 'arrival' };

async function loadActivity(load) {
  const { useActivityStore } = await load('/src/store/useActivityStore.ts');
  useActivityStore.getState().end();
  return useActivityStore;
}

async function loadLesson(load) {
  // Module cũ đăng ký __lesson lên window khi Vite chạy ở chế độ dev.
  const previousWindow = globalThis.window;
  globalThis.window = {};
  try {
    const { useLessonStore, getCurrentStep } = await load('/src/store/useLessonStore.ts');
    useLessonStore.getState().endLesson();
    return { useLessonStore, getCurrentStep };
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
}

export default {
  'walk, approach, sit, close the desktop on standing and sit again without redundant updates': async ({ assert, load }) => {
    const store = await loadActivity(load);
    const actions = store.getState();
    let writes = 0;
    const stop = store.subscribe(() => { writes++; });
    try {
      actions.setInRange(true);
      actions.setScreenOpen(true);
      actions.arriveNow();
      actions.end();
      assert.equal(writes, 0);

      actions.begin(activity, travel);
      const arrival = store.getState().teleport;
      assert.equal(arrival.spot, activity.arrival);
      assert.equal(store.getState().phase, 'travel');
      actions.interact();
      actions.setInRange(false);
      assert.equal(writes, 1);

      actions.setInRange(true);
      actions.setInRange(true);
      assert.equal(store.getState().phase, 'near');
      assert.equal(writes, 2);
      actions.setInRange(false);
      assert.equal(store.getState().phase, 'travel');
      actions.setInRange(true);
      actions.interact();
      actions.interact();
      assert.equal(store.getState().phase, 'engaged');
      assert.equal(store.getState().seated, true);
      assert.equal(writes, 5);

      actions.setInRange(false);
      assert.equal(store.getState().phase, 'engaged');
      actions.setInRange(true);
      actions.setScreenOpen(true);
      actions.setScreenOpen(true);
      actions.standUp();
      actions.standUp();
      const standing = store.getState();
      assert.equal(standing.phase, 'near');
      assert.equal(standing.seated, false);
      assert.equal(standing.screenOpen, false);
      assert.equal(standing.teleport.spot, seat.stand);
      assert.ok(standing.teleport.id > arrival.id);
      assert.equal(writes, 9);

      actions.interact();
      assert.equal(store.getState().phase, 'engaged');
      assert.equal(store.getState().seated, true);
      actions.end();
      actions.end();
      assert.equal(store.getState().activity, null);
      assert.equal(store.getState().teleport, null);
      assert.equal(writes, 11);
    } finally {
      stop();
    }
  },
  'consecutive begin calls replace the destination and keepSeated preserves the pose without teleporting': async ({ assert, load }) => {
    const store = await loadActivity(load);
    const actions = store.getState();
    const next = { ...activity, key: 'silver:lab-2', arrival: spot(12, 20), target: spot(14, 20) };
    actions.begin(activity, travel);
    const first = store.getState().teleport;
    actions.begin(next, { ...walk, teleportTo: 'target', keepSeated: true });
    const second = store.getState();
    assert.equal(second.activity, next);
    assert.equal(second.teleport.spot, next.target);
    assert.ok(second.teleport.id > first.id);
    assert.equal(second.phase, 'travel');
    assert.equal(second.seated, false);

    actions.begin(activity, travel);
    actions.setInRange(true);
    actions.interact();
    actions.setScreenOpen(true);
    actions.begin(next, { ...travel, keepSeated: true });
    const kept = store.getState();
    assert.equal(kept.activity, next);
    assert.equal(kept.phase, 'engaged');
    assert.equal(kept.seated, true);
    assert.equal(kept.inRange, false);
    assert.equal(kept.screenOpen, false);
    assert.equal(kept.teleport, null);

    actions.end();
    actions.begin(next, travel);
    assert.ok(store.getState().teleport.id > second.teleport.id);
    actions.begin(next, walk);
    const unchanged = store.getState();
    actions.begin(next, walk);
    assert.equal(store.getState(), unchanged);
  },
  'arriveNow uses the safe standing point or steps 1.2 m back facing the target': async ({ assert, load }) => {
    const store = await loadActivity(load);
    const actions = store.getState();
    actions.begin(activity, walk);
    actions.arriveNow();
    const standing = store.getState();
    assert.equal(standing.teleport.spot, seat.stand);
    assert.equal(standing.phase, 'travel');
    assert.equal(standing.inRange, false);
    assert.equal(standing.seated, false);

    const target = { ...spot(3, 5, [0, -2]), buildingId: null, floor: null };
    actions.begin({ ...activity, seat: null, trigger: 'talk', target }, walk);
    actions.arriveNow();
    const nearby = store.getState();
    assert.deepEqual(nearby.teleport.spot, { ...target, z: 6.2, facing: [0, -1] });
    assert.ok(nearby.teleport.id > standing.teleport.id);
    assert.equal(nearby.phase, 'travel');
    actions.setInRange(true);
    actions.interact();
    assert.equal(store.getState().phase, 'engaged');
    assert.equal(store.getState().seated, false);
    const unchanged = store.getState();
    actions.standUp();
    assert.equal(store.getState(), unchanged);
  },
  'look engages only by interaction, none engages at begin': async ({ assert, load }) => {
    const store = await loadActivity(load);
    const actions = store.getState();
    actions.begin({ ...activity, trigger: 'look', seat: null }, walk);
    assert.equal(store.getState().phase, 'travel');
    actions.setInRange(true);
    actions.interact();
    assert.equal(store.getState().phase, 'engaged');
    assert.equal(store.getState().seated, false);

    const immediate = { ...activity, trigger: 'none', seat: null };
    actions.begin(immediate, travel);
    const started = store.getState();
    assert.equal(started.phase, 'engaged');
    assert.equal(started.inRange, false);
    assert.equal(started.seated, false);
    assert.equal(started.teleport.spot, immediate.arrival);
  },
  'bridge maps B11 coordinates and mirrors arrival, seat and desktop once in each direction': async ({ assert, load }) => {
    const store = await loadActivity(load);
    const { useLessonStore } = await loadLesson(load);
    const { startLessonBridge } = await load('/src/silverWorld/lessonBridge.ts');
    const { b11ToWorld } = await load('/src/scene/interior/layouts/b11.ts');
    const { getClassroom } = await load('/src/data/index.ts');
    let lessonWrites = 0;
    let activityWrites = 0;
    const stopLesson = useLessonStore.subscribe(() => { lessonWrites++; });
    const stopActivity = store.subscribe(() => { activityWrites++; });
    const stopBridge = startLessonBridge(b11ToWorld);
    const lesson = useLessonStore.getState();
    const actions = store.getState();
    const writes = (l, a) => assert.deepEqual([lessonWrites, activityWrites], [l, a]);
    const checkPoint = (actual, expected) => {
      actual.forEach((value, i) => assert.ok(Math.abs(value - expected[i]) < 1e-8));
    };
    const cameraPoint = (u, v, y) => {
      const [x, z] = b11ToWorld(u, v);
      return [x, y, z];
    };
    try {
      lesson.startLesson('nmlt-01');
      writes(1, 1);
      const start = store.getState();
      const room = getClassroom('406.B11');
      const lessonSeat = start.activity.seat;
      assert.equal(start.activity.key, 'lesson:nmlt-01');
      assert.equal(start.activity.source, 'lesson');
      assert.equal(start.activity.trigger, 'sit');
      assert.equal(start.teleport.spot, start.activity.arrival);
      assert.equal(start.activity.arrival.buildingId, room.buildingId);
      assert.equal(start.activity.arrival.floor, room.floor);
      assert.equal(lessonSeat.id, room.playerSeat);
      assert.equal(start.activity.target, lessonSeat.spot);
      const arrival = b11ToWorld(room.arrival.u, room.arrival.v);
      const door = b11ToWorld(room.door.u, room.door.v);
      const doorDistance = Math.hypot(door[0] - arrival[0], door[1] - arrival[1]);
      checkPoint([start.activity.arrival.x, start.activity.arrival.z], arrival);
      checkPoint(start.activity.arrival.facing, door.map((value, i) => (value - arrival[i]) / doorDistance));
      checkPoint([lessonSeat.spot.x, lessonSeat.spot.z], b11ToWorld(91.8, -141));
      checkPoint([lessonSeat.stand.x, lessonSeat.stand.z], b11ToWorld(91.8, -142));
      checkPoint(lessonSeat.spot.facing, b11ToWorld(1, 0));
      checkPoint(lessonSeat.camera.eye, cameraPoint(91.15, -140.85, 1.55));
      checkPoint(lessonSeat.camera.look, cameraPoint(96.4, -142, 1.35));
      checkPoint(lessonSeat.screenCamera.eye, cameraPoint(92, -141, 1.08));
      checkPoint(lessonSeat.screenCamera.look, cameraPoint(92.45, -141, 1.05));

      lesson.arriveAtClass();
      assert.equal(store.getState().phase, 'travel');
      assert.equal(store.getState().inRange, false);
      actions.interact();
      assert.equal(useLessonStore.getState().seatId, null);
      writes(2, 1);
      actions.setInRange(true);
      assert.equal(store.getState().phase, 'near');
      writes(2, 2);
      lesson.sitDown(lessonSeat.id);
      assert.equal(store.getState().seated, true);
      writes(4, 3); // Lesson ghi seatId rồi mới chuyển tới bước đang học.
      lesson.openDesktop();
      assert.equal(store.getState().screenOpen, true);
      writes(5, 4);
      lesson.openDesktop();
      writes(6, 4);
      actions.setScreenOpen(false);
      assert.equal(useLessonStore.getState().desktopOpen, false);
      writes(7, 5);
      lesson.standUp();
      assert.equal(store.getState().seated, false);
      writes(8, 6);
      actions.interact();
      assert.equal(useLessonStore.getState().seatId, lessonSeat.id);
      writes(10, 7);
      actions.setScreenOpen(true);
      assert.equal(useLessonStore.getState().desktopOpen, true);
      writes(11, 8);
      actions.standUp();
      assert.equal(useLessonStore.getState().seatId, null);
      assert.equal(useLessonStore.getState().desktopOpen, false);
      writes(12, 9);
      lesson.endLesson();
      assert.equal(store.getState().activity, null);
      writes(13, 10);

      lesson.startLesson('nmlt-01');
      actions.setInRange(true);
      assert.equal(useLessonStore.getState().phase, 'findSeat');
      writes(15, 12);
      actions.begin(activity, walk);
      lesson.endLesson();
      assert.equal(store.getState().activity, activity);
      writes(16, 13);

      stopBridge();
      lesson.startLesson('nmlt-01');
      assert.equal(store.getState().activity, activity);
      writes(17, 13);
    } finally {
      stopBridge();
      stopActivity();
      stopLesson();
      lesson.endLesson();
      actions.end();
    }
  },
  'entering the lesson room updates the HUD without bringing a distant seat into range': async ({ assert, load }) => {
    const store = await loadActivity(load);
    const { useLessonStore } = await loadLesson(load);
    const { useWalkStore } = await load('/src/store/useWalkStore.ts');
    const { startLessonBridge } = await load('/src/silverWorld/lessonBridge.ts');
    const { b11ToWorld } = await load('/src/scene/interior/layouts/b11.ts');
    const { getClassroom } = await load('/src/data/index.ts');
    const lesson = useLessonStore.getState();
    const walk = useWalkStore.getState();
    const stop = startLessonBridge(b11ToWorld);
    const room = getClassroom('406.B11');
    const [x, z] = b11ToWorld(room.bounds.minU + 0.5, room.bounds.maxV - 0.5);
    try {
      lesson.startLesson('nmlt-01');
      walk.enterInterior(room.buildingId);
      walk.setPlayerPos({ x, z, y: 0, floor: 1 });
      assert.equal(useLessonStore.getState().phase, 'goToClass');
      walk.setInteriorFloor(room.floor);
      walk.setPlayerPos({ x, z, y: 0, floor: room.floor });
      assert.equal(useLessonStore.getState().phase, 'findSeat');
      assert.equal(store.getState().inRange, false);
      store.getState().interact();
      assert.equal(useLessonStore.getState().seatId, null);
    } finally {
      lesson.endLesson();
      walk.exitInterior();
      walk.setPlayerPos(walk.playerPos);
      stop();
    }
  },
  'nmlt-01 plays through both slides, question, code, pause and summary with and without the bridge': async ({ assert, load }) => {
    const store = await loadActivity(load);
    const { useLessonStore, getCurrentStep } = await loadLesson(load);
    const { startLessonBridge } = await load('/src/silverWorld/lessonBridge.ts');
    const { getClassroom } = await load('/src/data/index.ts');
    const lesson = useLessonStore.getState();
    const phase = () => useLessonStore.getState().phase;
    const step = () => getCurrentStep(useLessonStore.getState());
    for (const useBridge of [false, true]) {
      const stop = useBridge ? startLessonBridge((u, v) => [u, v]) : undefined;
      try {
        lesson.startLesson('nmlt-01');
        assert.equal(phase(), 'goToClass');
        lesson.arriveAtClass();
        assert.equal(phase(), 'findSeat');
        if (useBridge) store.getState().setInRange(true);
        lesson.sitDown(getClassroom('406.B11').playerSeat);
        assert.equal(phase(), 'dialogue');
        lesson.chooseOption(step().options[0].id);
        assert.equal(phase(), 'lecture');
        assert.equal(useLessonStore.getState().slideIndex, 0);
        lesson.nextSlide();
        assert.equal(useLessonStore.getState().slideIndex, 1);
        lesson.nextSlide();
        assert.equal(phase(), 'question');
        lesson.chooseOption(step().options.find(option => option.id !== step().answerId).id);
        assert.equal(useLessonStore.getState().lastResult.correct, false);
        lesson.chooseOption(step().answerId);
        assert.equal(useLessonStore.getState().lastResult.correct, true);
        lesson.nextStep();
        assert.equal(useLessonStore.getState().desktopOpen, true);
        assert.equal(store.getState().screenOpen, useBridge);

        lesson.closeDesktop();
        lesson.standUp();
        assert.equal(phase(), 'findSeat');
        lesson.sitDown(getClassroom('406.B11').playerSeat);
        assert.equal(phase(), 'exercise');
        assert.equal(useLessonStore.getState().desktopOpen, true);
        assert.equal(store.getState().screenOpen, useBridge);
        for (const id of ['ex-println', 'ex-for']) {
          assert.equal(step().id, id);
          lesson.submitExercise(id, step().answers[0]);
          assert.equal(useLessonStore.getState().lastResult.correct, true);
          lesson.nextStep();
        }
        assert.equal(phase(), 'summary');
        assert.equal(useLessonStore.getState().desktopOpen, false);
        assert.equal(store.getState().screenOpen, false);
        lesson.standUp();
        assert.equal(phase(), 'summary');
        lesson.endLesson();
        assert.equal(phase(), 'idle');
        assert.equal(store.getState().activity, null);
      } finally {
        stop?.();
        lesson.endLesson();
        store.getState().end();
      }
    }
  },
};
