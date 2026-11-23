export default {
  'creates seat anchor for 406.B11 matching current coordinates within 0.1 m'({ assert, load }) {
    return Promise.all([
      load('/src/data/index.ts'),
      load('/src/scene/interior/layouts/b11.ts'),
      load('/src/silverWorld/seatAnchor.ts'),
    ]).then(([{ getClassroom }, { b11ToWorld }, { createSeatAnchor }]) => {
      const room = getClassroom('406.B11');
      assert.ok(room);

      const anchor = createSeatAnchor(room, undefined, b11ToWorld);
      assert.equal(anchor.id, room.playerSeat);
      assert.equal(anchor.spot.buildingId, 'b11');
      assert.equal(anchor.spot.floor, 4);

      // Compare with known coordinates from WalkMode / lessonBridge
      const expectedSeat = b11ToWorld(91.8, -141.0);
      assert.ok(Math.hypot(anchor.spot.x - expectedSeat[0], anchor.spot.z - expectedSeat[1]) <= 0.1);

      // Stand point fallback 91.8, -142.0
      const expectedStand = b11ToWorld(91.8, -142.0);
      assert.ok(Math.hypot(anchor.stand.x - expectedStand[0], anchor.stand.z - expectedStand[1]) <= 0.1);

      // Camera eye: seat - 0.65 f + 0.15 r, y = 1.55
      // In B11 du=1, dv=0 -> u = 91.8 - 0.65 = 91.15, v = -141.0 + 0.15 = -140.85
      const expectedEye = b11ToWorld(91.15, -140.85);
      assert.ok(Math.hypot(anchor.camera.eye[0] - expectedEye[0], anchor.camera.eye[2] - expectedEye[1]) <= 0.1);
      assert.equal(anchor.camera.eye[1], 1.55);

      // Camera look: TV center y = 1.35
      const expectedLook = b11ToWorld(room.projectorScreen.u, room.projectorScreen.v);
      assert.ok(Math.hypot(anchor.camera.look[0] - expectedLook[0], anchor.camera.look[2] - expectedLook[1]) <= 0.1);
      assert.equal(anchor.camera.look[1], 1.35);

      // Screen camera (computer lab)
      assert.ok(anchor.screenCamera);
      const expectedScreenEye = b11ToWorld(91.8 + 0.20, -141.0);
      assert.ok(Math.hypot(anchor.screenCamera.eye[0] - expectedScreenEye[0], anchor.screenCamera.eye[2] - expectedScreenEye[1]) <= 0.1);
      assert.equal(anchor.screenCamera.eye[1], 1.08);

      const expectedScreenLook = b11ToWorld(91.8 + 0.65, -141.0);
      assert.ok(Math.hypot(anchor.screenCamera.look[0] - expectedScreenLook[0], anchor.screenCamera.look[2] - expectedScreenLook[1]) <= 0.1);
      assert.equal(anchor.screenCamera.look[1], 1.05);
    });
  },

  'creates seat anchor for 406.B8 with custom standPoint'({ assert, load }) {
    return Promise.all([
      load('/src/data/index.ts'),
      load('/src/silverWorld/seatAnchor.ts'),
    ]).then(([{ getClassroom }, { createSeatAnchor, b8ToWorld }]) => {
      const room = getClassroom('406.B8');
      assert.ok(room);

      const anchor = createSeatAnchor(room);
      assert.equal(anchor.id, '406-r2-s5');
      assert.equal(anchor.spot.buildingId, 'b8');
      assert.equal(anchor.spot.floor, 4);

      // Stand point is room.standPoint (86.3, -205)
      const expectedStand = b8ToWorld(86.3, -205);
      assert.ok(Math.hypot(anchor.stand.x - expectedStand[0], anchor.stand.z - expectedStand[1]) <= 0.05);

      // 406.B8 is a computer lab
      assert.ok(anchor.screenCamera);
      assert.equal(anchor.screenCamera.eye[1], 1.08);
      assert.equal(anchor.screenCamera.look[1], 1.05);
    });
  },

  'provides declared 208.B8 seat anchor and skips screenCamera for non-lab'({ assert, load }) {
    return load('/src/silverWorld/seatAnchor.ts').then(({ SEAT_ANCHOR_208_B8, resolveSeatAnchor, createSeatAnchor }) => {
      assert.ok(SEAT_ANCHOR_208_B8);
      assert.equal(SEAT_ANCHOR_208_B8.spot.buildingId, 'b8');
      assert.equal(SEAT_ANCHOR_208_B8.spot.floor, 2);
      assert.ok(Math.abs(SEAT_ANCHOR_208_B8.spot.x - 29.44) < 0.05);
      assert.ok(Math.abs(SEAT_ANCHOR_208_B8.spot.z - (-217.43)) < 0.05);
      assert.equal(SEAT_ANCHOR_208_B8.camera.eye[1], 1.55);
      assert.equal(SEAT_ANCHOR_208_B8.camera.look[1], 1.15);
      assert.equal(SEAT_ANCHOR_208_B8.screenCamera, null);

      // resolveSeatAnchor handles 208.B8 directly
      const resolved = resolveSeatAnchor('208.B8', () => undefined);
      assert.equal(resolved, SEAT_ANCHOR_208_B8);

      // Non-lab room gets screenCamera = null
      const nonLabRoom = {
        code: '207.B8',
        name: 'Phòng lý thuyết 207.B8',
        buildingId: 'b8',
        floor: 2,
        frame: 'b8',
        seats: [{ id: 'seat-1', u: 50, v: -180 }],
        playerSeat: 'seat-1',
        studentFacing: [1, 0],
        projectorScreen: { u: 55, v: -180 },
      };
      const nonLabAnchor = createSeatAnchor(nonLabRoom);
      assert.equal(nonLabAnchor.screenCamera, null);
    });
  },
};
