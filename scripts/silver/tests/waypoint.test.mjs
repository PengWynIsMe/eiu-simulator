export default {
  'navigates through outdoor, elevator, room door to target chair in 406.B8'({ assert, load }) {
    return Promise.all([
      load('/src/data/index.ts'),
      load('/src/scene/interior/layouts/b8.ts'),
      load('/src/silverWorld/waypoint.ts'),
    ]).then(([{ getClassroom }, b8Layout, { nextWaypoint, createRoomWaypoint }]) => {
      const room = getClassroom('406.B8');
      assert.ok(room);

      // Door world must match classrooms.json (35.51, -213.61)
      assert.equal(room.doorWorld[0], 35.51);
      assert.equal(room.doorWorld[1], -213.61);

      const roomWaypoint = createRoomWaypoint(room, b8Layout.toLocal);
      assert.equal(roomWaypoint.door.x, 35.51);
      assert.equal(roomWaypoint.door.z, -213.61);

      const b8WaypointLayout = {
        buildingId: 'b8',
        entrances: [
          { x: b8Layout.B8_ENTRANCE_SOUTH_OUTSIDE[0], z: b8Layout.B8_ENTRANCE_SOUTH_OUTSIDE[1] },
          { x: b8Layout.B8_ENTRANCE_NORTH_OUTSIDE[0], z: b8Layout.B8_ENTRANCE_NORTH_OUTSIDE[1] },
        ],
        elevator: { x: b8Layout.B8_ELEVATOR_POS_WORLD[0], z: b8Layout.B8_ELEVATOR_POS_WORLD[1] },
        exitDoors: [
          { x: b8Layout.B8_ENTRANCE_SOUTH_INSIDE[0], z: b8Layout.B8_ENTRANCE_SOUTH_INSIDE[1] },
          { x: b8Layout.B8_ENTRANCE_NORTH_INSIDE[0], z: b8Layout.B8_ENTRANCE_NORTH_INSIDE[1] },
        ],
        rooms: [roomWaypoint],
      };

      const layoutMap = { b8: b8WaypointLayout };

      // Chair in 406.B8 (target: u=86.48, v=-204.2 -> x=37.95, z=-218.49)
      const target406B8 = {
        buildingId: 'b8',
        floor: 4,
        x: 37.95,
        z: -218.49,
        facing: [0.97, -0.23],
      };

      // 1. Player is outdoors at southern courtyard -> waypoint is South entrance of B8
      const outdoorPos = { x: 17.43, z: -158.06 };
      const wp1 = nextWaypoint(outdoorPos, null, target406B8, layoutMap);
      assert.equal(wp1.hint, 'door');
      assert.equal(wp1.x, b8Layout.B8_ENTRANCE_SOUTH_OUTSIDE[0]);
      assert.equal(wp1.z, b8Layout.B8_ENTRANCE_SOUTH_OUTSIDE[1]);

      // 2. Player enters B8 on Floor 1 -> waypoint is elevator on Floor 1, destination floor: 4
      const floor1Pos = { x: 20.0, z: -180.0 };
      const wp2 = nextWaypoint(floor1Pos, { buildingId: 'b8', floor: 1 }, target406B8, layoutMap);
      assert.equal(wp2.hint, 'elevator');
      assert.equal(wp2.floor, 4);
      assert.equal(wp2.x, b8Layout.B8_ELEVATOR_POS_WORLD[0]);
      assert.equal(wp2.z, b8Layout.B8_ELEVATOR_POS_WORLD[1]);

      // 3. Player arrives at Floor 4 lobby -> outside room, waypoint is room doorWorld (35.51, -213.61)
      const floor4LobbyPos = { x: b8Layout.B8_ELEVATOR_POS_WORLD[0], z: b8Layout.B8_ELEVATOR_POS_WORLD[1] };
      const wp3 = nextWaypoint(floor4LobbyPos, { buildingId: 'b8', floor: 4 }, target406B8, layoutMap);
      assert.equal(wp3.hint, 'room');
      assert.equal(wp3.x, 35.51);
      assert.equal(wp3.z, -213.61);

      // 4. Point in neighboring room (u=80, v=-205 -> world x=31.46, z=-217.80) on same floor -> hint is 'room'
      const neighboringRoomPos = b8Layout.toWorld(80, -205);
      const wpNeighbor = nextWaypoint(neighboringRoomPos, { buildingId: 'b8', floor: 4 }, target406B8, layoutMap);
      assert.equal(wpNeighbor.hint, 'room');
      assert.equal(wpNeighbor.x, 35.51);
      assert.equal(wpNeighbor.z, -213.61);

      // 5. Point inside 406.B8 (u=86.48, v=-204.2) -> hint is 'target'
      const insidePos = { x: 37.95, z: -218.49 };
      const wp4 = nextWaypoint(insidePos, { buildingId: 'b8', floor: 4 }, target406B8, layoutMap);
      assert.equal(wp4.hint, 'target');
      assert.equal(wp4.x, target406B8.x);
      assert.equal(wp4.z, target406B8.z);
    });
  },

  'selects closest exit door when leaving building'({ assert, load }) {
    return Promise.all([
      load('/src/scene/interior/layouts/b8.ts'),
      load('/src/silverWorld/waypoint.ts'),
    ]).then(([b8Layout, { nextWaypoint }]) => {
      const b8WaypointLayout = {
        buildingId: 'b8',
        entrances: [
          { x: b8Layout.B8_ENTRANCE_SOUTH_OUTSIDE[0], z: b8Layout.B8_ENTRANCE_SOUTH_OUTSIDE[1] },
          { x: b8Layout.B8_ENTRANCE_NORTH_OUTSIDE[0], z: b8Layout.B8_ENTRANCE_NORTH_OUTSIDE[1] },
        ],
        elevator: { x: b8Layout.B8_ELEVATOR_POS_WORLD[0], z: b8Layout.B8_ELEVATOR_POS_WORLD[1] },
        exitDoors: [
          { x: b8Layout.B8_ENTRANCE_SOUTH_INSIDE[0], z: b8Layout.B8_ENTRANCE_SOUTH_INSIDE[1] },
          { x: b8Layout.B8_ENTRANCE_NORTH_INSIDE[0], z: b8Layout.B8_ENTRANCE_NORTH_INSIDE[1] },
        ],
      };

      const layoutMap = { b8: b8WaypointLayout };

      // Target is outdoors
      const outdoorTarget = {
        buildingId: null,
        floor: null,
        x: 0,
        z: -150,
        facing: [0, 1],
      };

      // Player near north door inside B8 -> picks north exit
      const nearNorth = { x: b8Layout.B8_ENTRANCE_NORTH_INSIDE[0] + 1, z: b8Layout.B8_ENTRANCE_NORTH_INSIDE[1] + 1 };
      const wpNorth = nextWaypoint(nearNorth, { buildingId: 'b8', floor: 1 }, outdoorTarget, layoutMap);
      assert.equal(wpNorth.hint, 'door');
      assert.equal(wpNorth.x, b8Layout.B8_ENTRANCE_NORTH_INSIDE[0]);
      assert.equal(wpNorth.z, b8Layout.B8_ENTRANCE_NORTH_INSIDE[1]);

      // Player near south door inside B8 -> picks south exit
      const nearSouth = { x: b8Layout.B8_ENTRANCE_SOUTH_INSIDE[0] + 1, z: b8Layout.B8_ENTRANCE_SOUTH_INSIDE[1] + 1 };
      const wpSouth = nextWaypoint(nearSouth, { buildingId: 'b8', floor: 1 }, outdoorTarget, layoutMap);
      assert.equal(wpSouth.hint, 'door');
      assert.equal(wpSouth.x, b8Layout.B8_ENTRANCE_SOUTH_INSIDE[0]);
      assert.equal(wpSouth.z, b8Layout.B8_ENTRANCE_SOUTH_INSIDE[1]);
    });
  },
};
