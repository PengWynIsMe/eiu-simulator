export default {
  'stageFiltering pure functions filter background models and exclude actor seats': async ({ assert, load }) => {
    const { getClassroom, characterConfig } = await load('/src/data/index.ts');
    const { getStage } = await load('/src/data/silver/stages.ts');
    const { buildClassroomPlan } = await load('/src/scene/npc/classroomPlan.ts');
    const {
      filterBackgroundModels,
      filterClassroomNpcSeats,
      createSafeClassroomForStage,
    } = await load('/src/scene/silver/stageFiltering.ts');

    const room = getClassroom('406.B8');
    assert.ok(room, 'Phòng 406.B8 phải tồn tại');

    // 1. Kiểm tra filterBackgroundModels:
    const filteredModels = filterBackgroundModels(characterConfig.roles.students, characterConfig.story);
    assert.equal(filteredModels.length, 5, 'Sau khi lọc 3 nhân vật truyện, còn đúng 5 model cho sinh viên nền');
    assert.ok(!filteredModels.some((m) => m.includes('character-female-c')), 'Model sinh viên nền không được chứa Han (female-c)');
    assert.ok(!filteredModels.some((m) => m.includes('character-male-e')), 'Model sinh viên nền không được chứa Thành (male-e)');
    assert.ok(!filteredModels.some((m) => m.includes('character-male-g')), 'Model sinh viên nền không được chứa Quyền (male-g)');
    assert.equal(characterConfig.roles.students.length, 8, 'roles.students gốc không bị mutate, vẫn giữ 8 model cho 406.B11');

    // 2. Kiểm tra cả 5 cảnh của 406.B8:
    // Cảnh 1: CSE 103/lab-1 (crowd 12, actors: teacher, han tại 406-r2-s6)
    const stageLab1 = getStage('CSE 103/lab-1');
    assert.ok(stageLab1, 'Stage CSE 103/lab-1 phải tồn tại');
    assert.equal(stageLab1.crowd, 12);
    const seatsLab1 = filterClassroomNpcSeats(room, stageLab1);
    assert.ok(!seatsLab1.includes(room.playerSeat), 'CSE 103/lab-1: seats không được chứa playerSeat');
    assert.ok(!seatsLab1.includes('406-r2-s6'), 'CSE 103/lab-1: seats không được chứa ghế của Han');
    const safeLab1 = createSafeClassroomForStage(room, stageLab1);
    const planLab1 = buildClassroomPlan(safeLab1, stageLab1.crowd);
    assert.equal(planLab1.length, 12, 'CSE 103/lab-1 có 12 bạn học nền');
    assert.ok(!planLab1.some((s) => s.seatId === room.playerSeat || s.seatId === '406-r2-s6'));

    // Cảnh 2: CSE 103/lab-2 (crowd 12, actors: teacher, han tại 406-r2-s6)
    const stageLab2 = getStage('CSE 103/lab-2');
    assert.ok(stageLab2, 'Stage CSE 103/lab-2 phải tồn tại');
    assert.equal(stageLab2.crowd, 12);
    const safeLab2 = createSafeClassroomForStage(room, stageLab2);
    const planLab2 = buildClassroomPlan(safeLab2, stageLab2.crowd);
    assert.equal(planLab2.length, 12, 'CSE 103/lab-2 có 12 bạn học nền');
    assert.ok(!planLab2.some((s) => s.seatId === room.playerSeat || s.seatId === '406-r2-s6'));

    // Cảnh 3: CSE 103/exam (crowd 12, actors: teacher, han tại 406-r2-s6)
    const stageExam = getStage('CSE 103/exam');
    assert.ok(stageExam, 'Stage CSE 103/exam phải tồn tại');
    assert.equal(stageExam.crowd, 12);
    const safeExam = createSafeClassroomForStage(room, stageExam);
    const planExam = buildClassroomPlan(safeExam, stageExam.crowd);
    assert.equal(planExam.length, 12, 'CSE 103/exam có 12 bạn học nền');
    assert.ok(!planExam.some((s) => s.seatId === room.playerSeat || s.seatId === '406-r2-s6'));

    // Cảnh 4: CSE 204/lab-1 (crowd 8, actors: teacher, quyen tại 406-r1-s2)
    const stage204 = getStage('CSE 204/lab-1');
    assert.ok(stage204, 'Stage CSE 204/lab-1 phải tồn tại');
    assert.equal(stage204.crowd, 8);
    const seats204 = filterClassroomNpcSeats(room, stage204);
    assert.ok(!seats204.includes(room.playerSeat), 'CSE 204/lab-1: seats không được chứa playerSeat');
    assert.ok(!seats204.includes('406-r1-s2'), 'CSE 204/lab-1: seats không được chứa ghế của Quyền');
    const safe204 = createSafeClassroomForStage(room, stage204);
    const plan204 = buildClassroomPlan(safe204, stage204.crowd);
    assert.equal(plan204.length, 8, 'CSE 204/lab-1 có 8 bạn học nền');
    assert.ok(!plan204.some((s) => s.seatId === room.playerSeat || s.seatId === '406-r1-s2'));

    // Cảnh 5: 2.2/closing (crowd 0, actors: han & quyen đứng spot, KHÔNG có teacher)
    const stageClosing = getStage('2.2/closing');
    assert.ok(stageClosing, 'Stage 2.2/closing phải tồn tại');
    assert.equal(stageClosing.crowd, 0);
    assert.equal(stageClosing.trigger, 'talk');
    assert.ok(!stageClosing.actors.some((a) => a.speaker === 'teacher'), '2.2/closing không có teacher');
    assert.ok(stageClosing.actors.every((a) => a.spot && !a.seatId), '2.2/closing diễn viên đứng ở spot, không ngồi ghế');
    const safeClosing = createSafeClassroomForStage(room, stageClosing);
    const planClosing = buildClassroomPlan(safeClosing, stageClosing.crowd);
    assert.equal(planClosing.length, 0, '2.2/closing crowd 0 có đúng 0 bạn học nền');
  },

  'SeatHighlight calculates exact world position for playerSeat and screen overlay': async ({ assert, load }) => {
    const { getClassroom } = await load('/src/data/index.ts');
    const { toWorld, yawOf } = await load('/src/scene/silver/frame.ts');

    const room = getClassroom('406.B8');
    assert.ok(room, 'Phòng 406.B8 phải tồn tại');

    const playerSeat = room.seats.find((s) => s.id === room.playerSeat);
    assert.ok(playerSeat, 'Phải tìm thấy ghế playerSeat trong 406.B8');
    assert.equal(room.playerSeat, '406-r2-s5');

    // Ghế người chơi tại u=86.48, v=-204.2
    const [seatX, seatZ] = toWorld(room.frame, playerSeat.u, playerSeat.v);
    assert.ok(Math.abs(seatX - 37.95) < 0.05, `Tọa độ ghế playerSeat X: ${seatX} ~ 37.95`);
    assert.ok(Math.abs(seatZ - (-218.49)) < 0.05, `Tọa độ ghế playerSeat Z: ${seatZ} ~ -218.49`);

    // Hướng nhìn sinh viên khi ngồi: studentFacing = [1, 0] (+u)
    const facingYaw = yawOf(room.frame, room.studentFacing[0], room.studentFacing[1]);
    const expectedYaw = Math.atan2(0.97398, -0.22663); // toWorld(frame, 1, 0)
    assert.ok(Math.abs(facingYaw - expectedYaw) < 1e-6, `Facing yaw: ${facingYaw}`);

    // Màn hình máy người chơi: bàn deskU = 86.9, v = -204.2, mặt màn hình hơi lùi về phía người chơi (-u)
    const screenOffsetU = -room.studentFacing[0] * 0.0195;
    const monitorCenterU = playerSeat.deskU + room.studentFacing[0] * 0.15;
    const screenLocalU = monitorCenterU + screenOffsetU;
    const [screenX, screenZ] = toWorld(room.frame, screenLocalU, playerSeat.v);

    // Màn hình cách ghế khoảng 0.5-0.6 m về phía trước (+u)
    assert.ok(screenX > seatX, 'Màn hình máy tính phải ở phía trước mặt ghế ngồi');
    assert.ok(Math.hypot(screenX - seatX, screenZ - seatZ) < 0.7, 'Màn hình cách ghế < 0.7 m');
  },
};
