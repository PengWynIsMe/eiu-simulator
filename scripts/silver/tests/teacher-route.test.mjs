export default {
  'teacher route in 406.B11 matches existing hardcoded waypoints exactly': async ({ assert, load }) => {
    const { getClassroom } = await load('/src/data/index.ts');
    const { b11ToWorld } = await load('/src/scene/interior/layouts/b11.ts');
    const { localDirToYaw } = await load('/src/scene/npc/sitPose.ts');
    const { computeTeacherPlan } = await load('/src/scene/lesson/Teacher.tsx');

    const room = getClassroom('406.B11');
    assert.ok(room, 'Phòng 406.B11 phải tồn tại');

    const plan = computeTeacherPlan(room);

    // Cách tính cũ với DETOUR_U = 95.8 cứng
    const DETOUR_U = 95.8;
    const oldDesk = room.teacherSpots.desk;
    const oldLecture = room.teacherSpots.lecture;
    const oldLectureW = b11ToWorld(oldLecture.u, oldLecture.v);
    const oldDeskW = b11ToWorld(oldDesk.u, oldDesk.v);

    const expectedToLecture = [
      b11ToWorld(DETOUR_U, oldDesk.v),
      b11ToWorld(DETOUR_U, oldLecture.v),
      oldLectureW,
    ];
    const expectedToDesk = [
      b11ToWorld(DETOUR_U, oldLecture.v),
      b11ToWorld(DETOUR_U, oldDesk.v),
      oldDeskW,
    ];
    const expectedFrontYaw = localDirToYaw(-1, 0);

    assert.equal(plan.toLecture.length, expectedToLecture.length, 'Số điểm toLecture phải bằng 3');
    for (let i = 0; i < expectedToLecture.length; i++) {
      const actual = plan.toLecture[i];
      const expected = expectedToLecture[i];
      assert.ok(Math.abs(actual[0] - expected[0]) < 1e-9, `toLecture[${i}].x lệch: ${actual[0]} vs ${expected[0]}`);
      assert.ok(Math.abs(actual[1] - expected[1]) < 1e-9, `toLecture[${i}].z lệch: ${actual[1]} vs ${expected[1]}`);
    }

    assert.equal(plan.toDesk.length, expectedToDesk.length, 'Số điểm toDesk phải bằng 3');
    for (let i = 0; i < expectedToDesk.length; i++) {
      const actual = plan.toDesk[i];
      const expected = expectedToDesk[i];
      assert.ok(Math.abs(actual[0] - expected[0]) < 1e-9, `toDesk[${i}].x lệch: ${actual[0]} vs ${expected[0]}`);
      assert.ok(Math.abs(actual[1] - expected[1]) < 1e-9, `toDesk[${i}].z lệch: ${actual[1]} vs ${expected[1]}`);
    }

    assert.ok(Math.abs(plan.frontYaw - expectedFrontYaw) < 1e-9, `frontYaw lệch: ${plan.frontYaw} vs ${expectedFrontYaw}`);
  },

  'teacher route in 406.B8 is computed cleanly': async ({ assert, load }) => {
    const { getClassroom } = await load('/src/data/index.ts');
    const { computeTeacherPlan } = await load('/src/scene/lesson/Teacher.tsx');

    const room = getClassroom('406.B8');
    assert.ok(room, 'Phòng 406.B8 phải tồn tại');

    const plan = computeTeacherPlan(room);
    assert.ok(plan.toLecture.length >= 1, 'toLecture phải có điểm');
    assert.ok(plan.toDesk.length >= 1, 'toDesk phải có điểm');
    assert.ok(Number.isFinite(plan.frontYaw), 'frontYaw phải là số hữu hạn');
  },
};
