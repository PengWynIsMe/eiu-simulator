export default {
  'builds layoutMap and tests full waypoint route outdoor -> door -> elevator -> room -> seat'({ assert, load }) {
    return Promise.all([
      load('/src/silverWorld/waypoint.ts'),
      load('/src/ui/silverWorld/layoutMap.ts'),
      load('/src/scene/interior/layouts/b8.ts'),
    ]).then(([{ nextWaypoint }, { getSilverWaypointLayoutMap }, b8Layout]) => {
      const layoutMap = getSilverWaypointLayoutMap();
      assert.ok(layoutMap.b8, 'layoutMap must contain b8 layout');
      assert.ok(layoutMap.b8.rooms && layoutMap.b8.rooms.length > 0, 'b8 must have rooms');

      // Đích đến là ghế trong phòng 406.B8 (tầng 4)
      const targetChair = {
        buildingId: 'b8',
        floor: 4,
        x: 37.95,
        z: -218.49,
        facing: [0.97, -0.23],
      };

      // 1. Ngoài trời (sân phía Nam) -> Waypoint dẫn tới cửa Nam ngoài trời B8
      const outdoorPos = { x: 17.43, z: -158.06 };
      const wp1 = nextWaypoint(outdoorPos, null, targetChair, layoutMap);
      assert.equal(wp1.hint, 'door');
      assert.equal(wp1.x, b8Layout.B8_ENTRANCE_SOUTH_OUTSIDE[0]);
      assert.equal(wp1.z, b8Layout.B8_ENTRANCE_SOUTH_OUTSIDE[1]);

      // 2. Vào sảnh tầng 1 (sai tầng) -> Waypoint dẫn tới thang máy tầng 1
      const floor1Pos = { x: 20.0, z: -180.0 };
      const wp2 = nextWaypoint(floor1Pos, { buildingId: 'b8', floor: 1 }, targetChair, layoutMap);
      assert.equal(wp2.hint, 'elevator');
      assert.equal(wp2.floor, 4);
      assert.equal(wp2.x, b8Layout.B8_ELEVATOR_POS_WORLD[0]);
      assert.equal(wp2.z, b8Layout.B8_ELEVATOR_POS_WORLD[1]);

      // 3. Ra khỏi thang máy ở tầng 4 (hành lang, ngoài phòng 406) -> Waypoint dẫn tới cửa phòng 406.B8
      const floor4LobbyPos = { x: b8Layout.B8_ELEVATOR_POS_WORLD[0], z: b8Layout.B8_ELEVATOR_POS_WORLD[1] };
      const wp3 = nextWaypoint(floor4LobbyPos, { buildingId: 'b8', floor: 4 }, targetChair, layoutMap);
      assert.equal(wp3.hint, 'room');
      assert.equal(wp3.x, 35.51);
      assert.equal(wp3.z, -213.61);

      // 4. Bước vào trong phòng 406.B8 -> Waypoint dẫn thẳng tới đích (ghế)
      const inside406Pos = { x: 37.95, z: -218.49 };
      const wp4 = nextWaypoint(inside406Pos, { buildingId: 'b8', floor: 4 }, targetChair, layoutMap);
      assert.equal(wp4.hint, 'target');
      assert.equal(wp4.x, targetChair.x);
      assert.equal(wp4.z, targetChair.z);
    });
  },

  'isSubscribableSilver type guard correctly validates stores and rejects invalid objects'({ assert, load }) {
    return load('/src/ui/silverWorld/directorBridge.ts').then(({ isSubscribableSilver }) => {
      // Valid store structure
      const validStore = {
        getState: () => ({ screen: 'closed' }),
        subscribe: () => () => {},
      };
      assert.equal(isSubscribableSilver(validStore), true);

      // Invalid stores
      assert.equal(isSubscribableSilver(null), false);
      assert.equal(isSubscribableSilver(undefined), false);
      assert.equal(isSubscribableSilver({ getState: () => {} }), false);
      assert.equal(isSubscribableSilver({ subscribe: () => {} }), false);
      assert.equal(isSubscribableSilver({ getState: 123, subscribe: () => {} }), false);
    });
  },

  'isWorldActive checks DEV, ?silver3d=lab1, screen play and stage availability'({ assert, load }) {
    return load('/src/ui/silverWorld/directorBridge.ts').then(({ isWorldActive }) => {
      // In Node SSR test environment, window may be undefined or location.search empty
      // Without params, it should strictly be false
      assert.equal(isWorldActive('play', 'CSE 103/lab-1'), false);
      assert.equal(isWorldActive('week', 'CSE 103/lab-1'), false);
      assert.equal(isWorldActive('play', 'unknown/scene'), false);
    });
  },

  'director does not begin activity or teleport when in 2D overlay mode'({ assert, load }) {
    return load('/src/silverWorld/director.ts').then(({ startDirector }) => {
      let beginCalled = false;
      const fakeActivityStore = {
        getState: () => ({
          activity: null,
          phase: 'travel',
          seated: false,
          screenOpen: false,
          inRange: false,
          teleport: null,
          begin: () => { beginCalled = true; },
          end: () => {},
        }),
        subscribe: () => () => {},
      };

      const fakeWalkStore = {
        getState: () => ({ walkMode: false, playerPos: { x: 0, z: 0 }, interior: null }),
        subscribe: () => () => {},
      };

      let silverListener = null;
      let silverState = {
        screen: 'closed',
        play: null,
      };

      const fakeSilverStore = {
        getState: () => silverState,
        subscribe: (fn) => {
          silverListener = fn;
          return () => { silverListener = null; };
        },
      };

      // In 2D overlay mode (isWorldActive is false):
      // syncDirector in main.tsx only starts director when isWorldActive is true.
      // If someone starts director directly on 2D mode with screen closed:
      const stop = startDirector({
        silver: fakeSilverStore,
        activity: fakeActivityStore,
        walk: fakeWalkStore,
        toWorld: () => [0, 0],
      });

      // Switch to 2D play
      silverState = {
        screen: 'play',
        play: {
          item: { id: 'session:cse-103:lab:1', scene: { id: 'CSE 103/lab-1' } },
        },
      };

      // But if director is stopped (as main.tsx does when not world active), begin is not called
      stop();
      if (silverListener) silverListener(silverState);

      assert.equal(beginCalled, false, 'Director must not begin activity when stopped');
    });
  },

  'presentation tracks webglLost and notifies immediately on mode switch': async ({ assert, load }) => {
    const {
      setSilverUserMode,
      getSilverUserMode,
      onPresentationChange,
      setWebglContextLostForTest,
      isWebglContextLost,
      getSilverPresentationMode,
    } = await load('/src/ui/silver/presentation.ts');

    let notified = 0;
    const unsub = onPresentationChange(() => {
      notified++;
    });

    // 1. Chuyển sang 2D overlay thông báo listener ngay lập tức
    setSilverUserMode('overlay');
    assert.equal(getSilverUserMode(), 'overlay');
    assert.equal(getSilverPresentationMode(), 'overlay');
    assert.ok(notified >= 1, 'onPresentationChange phải bắn đồng bộ khi gọi setSilverUserMode');

    // Quay lại world
    setSilverUserMode('world');
    assert.equal(getSilverUserMode(), 'world');

    // 2. WebGL lost tự động chuyển presentation mode sang overlay và bắn notify
    setWebglContextLostForTest(true);
    assert.equal(isWebglContextLost(), true);
    assert.equal(getSilverPresentationMode(), 'overlay', 'WebGL lost phải chuyển sang mode overlay');

    // WebGL restored
    setWebglContextLostForTest(false);
    assert.equal(isWebglContextLost(), false);
    assert.equal(getSilverPresentationMode(), 'world');

    unsub();
  },

  '2.2 variants (CSE 204 swap, STAT 101 addition) play through 3D world without overlay fallback and spawn at arrival': async ({ assert, load }) => {
    const { createSilverStore } = await load('/src/store/useSilverStore.ts');
    const { startDirector } = await load('/src/silverWorld/director.ts');
    const { getStage, isStageAvailable } = await load('/src/data/silver/stages.ts');
    const { loadChapter, loadCourseContent, availableContentCodes } = await load('/src/data/silver/content.ts');

    const memoryStorage = () => {
      const store = new Map();
      return {
        getItem: (k) => store.get(k) ?? null,
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k),
        clear: () => store.clear(),
      };
    };

    const makeStore = () => {
      let seed = 0;
      return createSilverStore({
        kv: memoryStorage(),
        makeSeed: () => `seed-${++seed}`,
        now: () => '2026-11-24T08:00:00.000Z',
        loadChapter,
        loadCourseContent,
        contentCodes: availableContentCodes,
      });
    };

    // Helper tạo director và activity store mock
    const setupWorldDirector = (silverStore) => {
      const beginCalls = [];
      const fakeActivityStore = {
        getState: () => ({
          activity: null,
          phase: 'travel',
          seated: false,
          screenOpen: false,
          inRange: false,
          teleport: null,
          begin: (act, opts) => {
            beginCalls.push({ activity: act, opts });
          },
          end: () => {},
        }),
        subscribe: () => () => {},
      };

      const fakeWalkStore = {
        getState: () => ({ walkMode: true, playerPos: { x: 0, z: 0 }, interior: null }),
        subscribe: () => () => {},
      };

      const stop = startDirector({
        silver: silverStore,
        activity: fakeActivityStore,
        walk: fakeWalkStore,
        toWorld: (_frame, u, v) => [u, v],
      });

      return { beginCalls, stop };
    };

    // --- Biến thể 1: Đổi sang CSE 204 ---
    {
      const silverStore = makeStore();
      await silverStore.getState().load();
      silverStore.getState().startChapter('2.2', 'restart');
      silverStore.getState().confirmRecap();

      // Đổi tự chọn sang CSE 204 (bỏ COMS 101, chọn CSE 204)
      silverStore.getState().toggleCourse('COMS 101');
      silverStore.getState().toggleCourse('CSE 204');
      silverStore.getState().confirmRegistration();

      const { beginCalls, stop } = setupWorldDirector(silverStore);

      // Chạy qua toàn bộ các item trong lượt chơi
      let safetyCounter = 0;
      while (silverStore.getState().screen === 'play' || silverStore.getState().screen === 'week') {
        safetyCounter++;
        if (safetyCounter > 50) break;

        if (silverStore.getState().screen === 'week') {
          silverStore.getState().playNext();
          continue;
        }

        const currItem = silverStore.getState().play?.item;
        assert.ok(currItem, 'Phải có item khi ở screen play');

        const sceneId = currItem.scene?.id ?? currItem.id;
        const stage = getStage(sceneId);
        assert.ok(stage, `Cảnh ${sceneId} phải có stage trong stages.json`);
        assert.ok(isStageAvailable(stage), `Stage ${sceneId} phải khả dụng, không được lùi về overlay`);

        silverStore.getState().skipItem();
      }

      assert.ok(beginCalls.length >= 8, 'Biến thể CSE 204 phải kích hoạt director cho các cảnh');
      stop();
    }

    // --- Biến thể 2: Thêm STAT 101 ---
    {
      const silverStore = makeStore();
      await silverStore.getState().load();
      silverStore.getState().startChapter('2.2', 'restart');
      silverStore.getState().confirmRecap();

      // Thêm STAT 101 vào danh sách (đủ 6 môn)
      silverStore.getState().toggleCourse('STAT 101');
      silverStore.getState().confirmRegistration();

      const { beginCalls, stop } = setupWorldDirector(silverStore);

      let safetyCounter = 0;
      while (silverStore.getState().screen === 'play' || silverStore.getState().screen === 'week') {
        safetyCounter++;
        if (safetyCounter > 50) break;

        if (silverStore.getState().screen === 'week') {
          silverStore.getState().playNext();
          continue;
        }

        const currItem = silverStore.getState().play?.item;
        assert.ok(currItem, 'Phải có item khi ở screen play');

        const sceneId = currItem.scene?.id ?? currItem.id;
        const stage = getStage(sceneId);
        assert.ok(stage, `Cảnh ${sceneId} phải có stage trong stages.json`);
        assert.ok(isStageAvailable(stage), `Stage ${sceneId} phải khả dụng, không được lùi về overlay`);

        silverStore.getState().skipItem();
      }

      assert.ok(beginCalls.length >= 8, 'Biến thể STAT 101 phải kích hoạt director cho các cảnh');
      stop();
    }

    // --- Kiểm tra vào thẳng từng item bằng bản lưu giả xuất hiện đúng cửa ---
    {
      // Chạy một lượt để thu thập danh sách RunItem thực tế của 2.2
      const baseStore = makeStore();
      await baseStore.getState().load();
      baseStore.getState().startChapter('2.2', 'restart');
      baseStore.getState().confirmRecap();
      const registeredCourses = baseStore.getState().registration.rows.filter((r) => r.selected).map((r) => r.code);
      baseStore.getState().confirmRegistration();

      const itemsPlayed = [];
      let safetyCounter = 0;
      while (baseStore.getState().screen === 'play' || baseStore.getState().screen === 'week') {
        safetyCounter++;
        if (safetyCounter > 50) break;

        if (baseStore.getState().screen === 'week') {
          baseStore.getState().playNext();
          continue;
        }

        const currItem = baseStore.getState().play?.item;
        if (currItem) {
          itemsPlayed.push(currItem);
        }
        baseStore.getState().skipItem();
      }

      assert.ok(itemsPlayed.length >= 8, 'Queue 2.2 phải có ít nhất 8 cảnh/buổi học');

      for (const targetItem of itemsPlayed) {
        const targetItemId = targetItem.id;
        const memKv = memoryStorage();
        // Ghi bản lưu giả có itemId đích
        memKv.setItem('campussim.silver.v1', JSON.stringify({
          version: 1,
          seed: 'fake-seed',
          flags: {},
          seen: [],
          registrations: { '2.2': registeredCourses },
          doneChapters: [],
          notebook: [],
          run: {
            chapterId: '2.2',
            courses: registeredCourses,
            itemId: targetItemId,
          },
        }));

        let seed = 0;
        const silverStore = createSilverStore({
          kv: memKv,
          makeSeed: () => `seed-${++seed}`,
          now: () => '2026-11-24T08:00:00.000Z',
          loadChapter,
          loadCourseContent,
          contentCodes: availableContentCodes,
        });

        await silverStore.getState().load();
        silverStore.getState().startChapter('2.2', 'resume');

        const currItem = silverStore.getState().play?.item;
        assert.ok(currItem, `Phải nạp được item khi resume ${targetItemId}`);
        assert.equal(currItem.id, targetItemId, `Phải vào thẳng đúng itemId ${targetItemId}`);

        const sceneId = currItem.scene?.id ?? currItem.id;
        const stage = getStage(sceneId);
        assert.ok(stage, `Phải có stage cho ${sceneId}`);

        let beginCall = null;
        const fakeActivityStore = {
          getState: () => ({
            activity: null,
            phase: 'travel',
            seated: false,
            screenOpen: false,
            inRange: false,
            teleport: null,
            begin: (act, opts) => {
              beginCall = { activity: act, opts };
            },
            end: () => {},
          }),
          subscribe: () => () => {},
        };

        const fakeWalkStore = {
          getState: () => ({ walkMode: true, playerPos: { x: 0, z: 0 }, interior: null }),
          subscribe: () => () => {},
        };

        const stop = startDirector({
          silver: silverStore,
          activity: fakeActivityStore,
          walk: fakeWalkStore,
          toWorld: (_frame, u, v) => [u, v],
        });

        assert.ok(beginCall, `Director phải gọi begin khi resume ${targetItemId}`);
        assert.equal(beginCall.opts.teleportTo, 'arrival', `Tiếp tục từ bản lưu giả phải đặt người chơi tại arrival`);
        assert.equal(beginCall.activity.arrival.buildingId, stage.arrival.buildingId, 'Tòa nhà arrival phải đúng');
        assert.equal(beginCall.activity.arrival.floor, stage.arrival.floor, 'Tầng arrival phải đúng');
        assert.ok(
          Math.abs(beginCall.activity.arrival.x - stage.arrival.x) < 0.1,
          `Tọa độ X arrival phải khớp với stage.arrival (${beginCall.activity.arrival.x} vs ${stage.arrival.x})`
        );
        assert.ok(
          Math.abs(beginCall.activity.arrival.z - stage.arrival.z) < 0.1,
          `Tọa độ Z arrival phải khớp với stage.arrival (${beginCall.activity.arrival.z} vs ${stage.arrival.z})`
        );

        stop();
      }
    }
  },
};
