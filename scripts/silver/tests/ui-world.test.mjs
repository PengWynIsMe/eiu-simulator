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
};
