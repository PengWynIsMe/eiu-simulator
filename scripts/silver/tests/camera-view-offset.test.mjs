import * as THREE from 'three';

const B8_EX = [0.97398, -0.22663];
const B8_EV = [0.22663, 0.97398];
function b8ToWorld(u, v) {
  return [u * B8_EX[0] + v * B8_EV[0], u * B8_EX[1] + v * B8_EV[1]];
}

const B11_EX = [0.985642036, -0.168848383];
const B11_EV = [0.168848383, 0.985642036];
function b11ToWorld(u, v) {
  return [u * B11_EX[0] + v * B11_EV[0], u * B11_EX[1] + v * B11_EV[1]];
}

function toWorld(frame, u, v) {
  return frame === 'b8' ? b8ToWorld(u, v) : b11ToWorld(u, v);
}

function normalize(v) {
  const len = Math.hypot(v[0], v[1]);
  return len > 0 ? [v[0] / len, v[1] / len] : [0, 1];
}

export default {
  'camera setViewOffset shifts center to left viewport midpoint'({ assert }) {
    const W = 1440;
    const H = 900;
    const rightCol = 400;
    const offset = rightCol / 2; // 200

    const cam = new THREE.PerspectiveCamera(50, W / H, 0.2, 400);
    cam.position.set(0, 1.5, 0);
    cam.lookAt(0, 1.5, -5);
    cam.setViewOffset(W, H, offset, 0, W, H);
    cam.updateMatrixWorld(true);

    // Target lookAt point (0, 1.5, -5) is centered in the camera optical axis
    const p = new THREE.Vector3(0, 1.5, -5).project(cam);
    const px = Math.round((p.x + 1) * 0.5 * W);
    const py = Math.round((1 - p.y) * 0.5 * H);

    // Midpoint of left viewport (0 to 1040) is exactly 520
    assert.equal(px, (W - rightCol) / 2);
    assert.equal(py, H / 2);
  },

  'sitting in 206.B8 with right column: offset brings teacher out from under right column'({ assert, load }) {
    return load('src/data/classrooms.json').then((classroomsMod) => {
      const classrooms = classroomsMod.default?.classrooms ?? classroomsMod.classrooms;
      const room = classrooms.find((r) => r.code === '206.B8');
      assert.ok(room, '206.B8 must exist');

      const playerSeat = room.seats.find((s) => s.id === room.playerSeat);
      const [seatX, seatZ] = toWorld(room.frame, playerSeat.u, playerSeat.v);
      const [du, dv] = room.studentFacing;
      const [targetX, targetZ] = toWorld(room.frame, playerSeat.u + du, playerSeat.v + dv);
      const f = normalize([targetX - seatX, targetZ - seatZ]);
      const r = [-f[1], f[0]];

      const eye = [seatX - 0.65 * f[0] + 0.15 * r[0], 1.55, seatZ - 0.65 * f[1] + 0.15 * r[1]];
      const tvPos = toWorld(room.frame, room.projectorScreen.u, room.projectorScreen.v);
      const look = [tvPos[0], 1.35, tvPos[1]];

      const lecturePos = toWorld(room.frame, room.teacherSpots.lecture.u, room.teacherSpots.lecture.v);
      const teacherHead = [lecturePos[0], 1.5, lecturePos[1]];

      const W = 1440;
      const H = 900;
      const rightCol = 400;

      // 1. Without offset: teacher is covered by right column (> 1040px)
      const camNoOffset = new THREE.PerspectiveCamera(50, W / H, 0.2, 400);
      camNoOffset.position.set(...eye);
      camNoOffset.lookAt(...look);
      camNoOffset.updateMatrixWorld(true);

      const pTeacherNoOffset = new THREE.Vector3(...teacherHead).project(camNoOffset);
      const xNoOffset = Math.round((pTeacherNoOffset.x + 1) * 0.5 * W);
      assert.ok(xNoOffset > W - rightCol, `Teacher at ${xNoOffset}px should be under right column without offset`);

      // 2. With offset 200px: teacher shifts left into the visible viewport (< 1040px)
      const camWithOffset = new THREE.PerspectiveCamera(50, W / H, 0.2, 400);
      camWithOffset.position.set(...eye);
      camWithOffset.lookAt(...look);
      camWithOffset.setViewOffset(W, H, rightCol / 2, 0, W, H);
      camWithOffset.updateMatrixWorld(true);

      const pTeacherWithOffset = new THREE.Vector3(...teacherHead).project(camWithOffset);
      const xWithOffset = Math.round((pTeacherWithOffset.x + 1) * 0.5 * W);
      assert.ok(xWithOffset < W - rightCol, `Teacher at ${xWithOffset}px should be visible in left viewport (< 1040px)`);
      assert.ok(xWithOffset > 520, `Teacher should be on right side of TV (> 520px)`);
    });
  },

  'both teacher and TV are visible in left viewport for all 4 rooms'({ assert, load }) {
    return load('src/data/classrooms.json').then((classroomsMod) => {
      const classrooms = classroomsMod.default?.classrooms ?? classroomsMod.classrooms;
      const W = 1440;
      const H = 900;
      const rightCol = 400;
      const visibleRightEdge = W - rightCol; // 1040

      for (const code of ['406.B8', '206.B8', '311.B8', '406.B11']) {
        const room = classrooms.find((r) => r.code === code);
        assert.ok(room, `${code} must exist`);

        const playerSeat = room.seats.find((s) => s.id === room.playerSeat);
        const [seatX, seatZ] = toWorld(room.frame, playerSeat.u, playerSeat.v);
        const [du, dv] = room.studentFacing;
        const [targetX, targetZ] = toWorld(room.frame, playerSeat.u + du, playerSeat.v + dv);
        const f = normalize([targetX - seatX, targetZ - seatZ]);
        const r = [-f[1], f[0]];

        const eye = [seatX - 0.65 * f[0] + 0.15 * r[0], 1.55, seatZ - 0.65 * f[1] + 0.15 * r[1]];
        const tvPos = toWorld(room.frame, room.projectorScreen.u, room.projectorScreen.v);
        const tvY = room.projectorScreen.bottom + room.projectorScreen.height / 2;
        const look = [tvPos[0], 1.35, tvPos[1]];

        const lecturePos = toWorld(room.frame, room.teacherSpots.lecture.u, room.teacherSpots.lecture.v);
        const teacherHead = [lecturePos[0], 1.5, lecturePos[1]];

        const cam = new THREE.PerspectiveCamera(50, W / H, 0.2, 400);
        cam.position.set(...eye);
        cam.lookAt(...look);
        cam.setViewOffset(W, H, rightCol / 2, 0, W, H);
        cam.updateMatrixWorld(true);

        const pTv = new THREE.Vector3(tvPos[0], tvY, tvPos[1]).project(cam);
        const pTeacher = new THREE.Vector3(...teacherHead).project(cam);

        const tvX = Math.round((pTv.x + 1) * 0.5 * W);
        const teacherX = Math.round((pTeacher.x + 1) * 0.5 * W);

        assert.equal(tvX, 520, `${code} TV X should be at 520px`);
        assert.ok(teacherX > 0 && teacherX < visibleRightEdge, `${code} Teacher at ${teacherX}px must be inside (0, ${visibleRightEdge})`);
      }
    });
  },
};
