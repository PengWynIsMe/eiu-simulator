export default {
  'navigates through outdoor, elevator, room door to target chair in 406.B8'({ assert, load }) {
    return load('/src/silverWorld/waypoint.ts').then(({ nextWaypoint, DEFAULT_B8_LAYOUT }) => {
      // Chair in 406.B8 (target from stages.json: CSE 103/lab-1)
      const target406B8 = {
        buildingId: 'b8',
        floor: 4,
        x: 37.95,
        z: -218.49,
        facing: [0.97, -0.23],
      };

      // 1. Player is outdoors at southern courtyard -> waypoint is South entrance of B8
      const outdoorPos = { x: 17.43, z: -158.06 };
      const wp1 = nextWaypoint(outdoorPos, null, target406B8);
      assert.equal(wp1.hint, 'door');
      assert.ok(Math.hypot(wp1.x - DEFAULT_B8_LAYOUT.entrances[0].x, wp1.z - DEFAULT_B8_LAYOUT.entrances[0].z) < 0.1);

      // 2. Player enters B8 on Floor 1 -> waypoint is elevator on Floor 1, destination floor: 4
      const floor1Pos = { x: 20.0, z: -180.0 };
      const wp2 = nextWaypoint(floor1Pos, { buildingId: 'b8', floor: 1 }, target406B8);
      assert.equal(wp2.hint, 'elevator');
      assert.equal(wp2.floor, 4);
      assert.ok(Math.hypot(wp2.x - DEFAULT_B8_LAYOUT.elevator.x, wp2.z - DEFAULT_B8_LAYOUT.elevator.z) < 0.1);

      // 3. Player arrives at Floor 4 lobby -> outside 406.B8, waypoint is room door
      const floor4LobbyPos = { x: DEFAULT_B8_LAYOUT.elevator.x, z: DEFAULT_B8_LAYOUT.elevator.z };
      const wp3 = nextWaypoint(floor4LobbyPos, { buildingId: 'b8', floor: 4 }, target406B8);
      assert.equal(wp3.hint, 'room');
      assert.ok(Math.hypot(wp3.x - 41.22, wp3.z - (-213.29)) < 0.1);

      // 4. Player steps inside room 406.B8 -> waypoint is chair (target)
      // Inside 406.B8: u ≈ 80, v ≈ -205 (world x ≈ 31.46, z ≈ -217.80)
      const insidePos = { x: 31.46, z: -217.80 };
      const wp4 = nextWaypoint(insidePos, { buildingId: 'b8', floor: 4 }, target406B8);
      assert.equal(wp4.hint, 'target');
      assert.equal(wp4.x, target406B8.x);
      assert.equal(wp4.z, target406B8.z);
    });
  },

  'supports custom layout parameter without importing scene'({ assert, load }) {
    return load('/src/silverWorld/waypoint.ts').then(({ nextWaypoint }) => {
      const customLayouts = {
        custom_b: {
          buildingId: 'custom_b',
          entrances: [{ x: 100, z: 200 }],
          elevator: { x: 110, z: 210 },
          exitDoor: { x: 102, z: 202 },
          rooms: [
            {
              code: 'R101',
              floor: 2,
              door: { x: 120, z: 220 },
              bounds: { minX: 118, maxX: 130, minZ: 218, maxZ: 230 },
            },
          ],
        },
      };

      const target = {
        buildingId: 'custom_b',
        floor: 2,
        x: 125,
        z: 225,
        facing: [0, 1],
      };

      // Outside -> door
      const wp1 = nextWaypoint({ x: 0, z: 0 }, null, target, customLayouts);
      assert.equal(wp1.hint, 'door');
      assert.equal(wp1.x, 100);
      assert.equal(wp1.z, 200);

      // Floor 1 -> elevator
      const wp2 = nextWaypoint({ x: 105, z: 205 }, { buildingId: 'custom_b', floor: 1 }, target, customLayouts);
      assert.equal(wp2.hint, 'elevator');
      assert.equal(wp2.floor, 2);

      // Floor 2 hallway -> room door
      const wp3 = nextWaypoint({ x: 110, z: 210 }, { buildingId: 'custom_b', floor: 2 }, target, customLayouts);
      assert.equal(wp3.hint, 'room');
      assert.equal(wp3.x, 120);

      // Inside room -> target
      const wp4 = nextWaypoint({ x: 122, z: 222 }, { buildingId: 'custom_b', floor: 2 }, target, customLayouts);
      assert.equal(wp4.hint, 'target');
      assert.equal(wp4.x, 125);
    });
  },
};
