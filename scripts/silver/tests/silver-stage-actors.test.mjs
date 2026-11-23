export default {
  'SilverClassroomNpcs excludes playerSeat, companionSeat and story character models': async ({ assert, load }) => {
    const { getClassroom, characterConfig } = await load('/src/data/index.ts');
    const { buildClassroomPlan } = await load('/src/scene/npc/classroomPlan.ts');

    const room = getClassroom('406.B8');
    assert.ok(room, 'Phòng 406.B8 phải tồn tại');

    // 1. Kiểm tra loại bỏ companionSeat (Han) và playerSeat (người chơi) khỏi npcSeats
    const excludedSeats = new Set();
    if (room.playerSeat) excludedSeats.add(room.playerSeat);
    if (room.companionSeat) excludedSeats.add(room.companionSeat);

    const filteredNpcSeats = room.npcSeats.filter((seatId) => !excludedSeats.has(seatId));
    assert.ok(!filteredNpcSeats.includes(room.playerSeat), 'npcSeats không được chứa playerSeat');
    assert.ok(!filteredNpcSeats.includes(room.companionSeat), 'npcSeats không được chứa companionSeat');

    const safeRoom = {
      ...room,
      npcSeats: filteredNpcSeats,
    };
    const plan = buildClassroomPlan(safeRoom, 12);
    assert.equal(plan.length, 12, 'Phòng 406.B8 có đúng 12 bạn học nền');
    for (const student of plan) {
      assert.notEqual(student.seatId, room.playerSeat, `Bạn nền không được ngồi ghế playerSeat ${room.playerSeat}`);
      assert.notEqual(student.seatId, room.companionSeat, `Bạn nền không được ngồi ghế companionSeat ${room.companionSeat}`);
    }

    // 2. Kiểm tra lọc bỏ model của người trong truyện (Han: female-c, Thành: male-e, Quyền: male-g)
    const rawStudents = characterConfig.roles.students;
    const storyModels = new Set(Object.values(characterConfig.story ?? {}));
    const filteredModels = rawStudents.filter((url) => !storyModels.has(url));

    assert.equal(filteredModels.length, 5, 'Sau khi lọc 3 nhân vật truyện, còn đúng 5 model cho sinh viên nền');
    assert.ok(!filteredModels.some((m) => m.includes('character-female-c')), 'Model sinh viên nền không được chứa Han (female-c)');
    assert.ok(!filteredModels.some((m) => m.includes('character-male-e')), 'Model sinh viên nền không được chứa Thành (male-e)');
    assert.ok(!filteredModels.some((m) => m.includes('character-male-g')), 'Model sinh viên nền không được chứa Quyền (male-g)');

    // 3. Đảm bảo 406.B11 giữ nguyên bộ 8 model
    assert.equal(rawStudents.length, 8, 'roles.students gốc vẫn giữ 8 model cho 406.B11');
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
