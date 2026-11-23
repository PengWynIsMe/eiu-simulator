export default {
  'loads the B8 classroom while preserving 406.B11': async ({ assert, load }) => {
    const data = await load('/src/data/index.ts');
    const b8 = data.getClassroom('406.B8');
    const b11 = data.getClassroom('406.B11');

    assert.ok(b8);
    assert.equal(b8.frame, 'b8');
    assert.equal(b8.seats.length, 32);
    assert.equal(b8.companionSeat, '406-r2-s6');
    assert.ok(!b8.npcSeats.includes(b8.companionSeat));
    assert.notEqual(b8.companionSeat, b8.playerSeat);
    assert.equal(b8.standPoint.u, 86.3);
    assert.equal(b8.standPoint.v, -205.0);
    assert.deepEqual(b8.ceilingLights, []);
    assert.deepEqual(b8.airConditioners, []);

    assert.ok(b11);
    assert.equal(b11.frame, 'b11');
    assert.equal(b11.seats.length, 40);
    assert.equal(b11.playerSeat, '406-r2-s6');

    // 3D-09: loads 206.B8, 207.B8, 311.B8
    const r206 = data.getClassroom('206.B8');
    assert.ok(r206);
    assert.equal(r206.frame, 'b8');
    assert.equal(r206.seats.length, 24);
    assert.equal(r206.playerSeat, '206-r2-s4');
    assert.equal(r206.companionSeat, '206-r2-s5');
    assert.equal(r206.standPoint.u, 87.0);
    assert.equal(r206.standPoint.v, -205.65);
    assert.equal(r206.npcSeats.length, 12);

    const r207 = data.getClassroom('207.B8');
    assert.ok(r207);
    assert.equal(r207.frame, 'b8');
    assert.equal(r207.seats.length, 24);
    assert.equal(r207.playerSeat, '207-r2-s3');
    assert.equal(r207.companionSeat, '207-r2-s2');
    assert.equal(r207.standPoint.u, 85.9);
    assert.equal(r207.standPoint.v, -172.95);
    assert.equal(r207.npcSeats.length, 12);

    const r311 = data.getClassroom('311.B8');
    assert.ok(r311);
    assert.equal(r311.frame, 'b8');
    assert.equal(r311.seats.length, 60);
    assert.equal(r311.playerSeat, '311-r4-s3');
    assert.equal(r311.companionSeat, '311-r4-s2');
    assert.equal(r311.standPoint.u, 21.7);
    assert.equal(r311.standPoint.v, -172.95);
    assert.equal(r311.npcSeats.length, 18);
  },

  'keeps B8 desk obstacles on floor four and allows the specified route': async ({ assert, load }) => {
    const { b8Layout: layout } = await load('/src/scene/interior/layouts/b8.ts');
    const floorTwoWalls = layout.getFloorWalls(2);
    const floorThreeWalls = layout.getFloorWalls(3);
    const floorFourWalls = layout.getFloorWalls(4);
    const classroomWalls = floorFourWalls.filter((wall) => wall.isRailing);

    assert.ok(classroomWalls.some((wall) => wall.u1 === 86.9
      && Math.abs(wall.v1 - -208.75) < 0.001
      && Math.abs(wall.v2 - -205.85) < 0.001
      && wall.thickness === 0.6));
    assert.ok(classroomWalls.some((wall) => wall.u1 === 89.8 && wall.thickness === 0.7));

    // Floor 2 has obstacles for 206, 207, 208 (161 + 9 + 9 + 1 = 180)
    assert.equal(floorTwoWalls.length, 180);
    // Floor 3 has obstacles for 311 (131 + 21 = 152)
    assert.equal(floorThreeWalls.length, 152);
    // Floor 4 has obstacles for 406 (155 + 9 = 164)
    assert.equal(floorFourWalls.length, 164);

    function testBFS(floor, start, goal, radius = 0.4) {
      const step = 0.1;
      const key = (u, v) => `${Math.round(u / step)},${Math.round(v / step)}`;
      const queue = [start];
      const visited = new Set([key(...start)]);
      while (queue.length > 0) {
        const [u, v] = queue.shift();
        if (Math.hypot(u - goal[0], v - goal[1]) <= 0.15) {
          return true;
        }
        for (const [du, dv] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
          const nextU = Number((u + du).toFixed(1));
          const nextV = Number((v + dv).toFixed(1));
          const nextKey = key(nextU, nextV);
          if (visited.has(nextKey)) continue;

          const prevWorld = layout.toWorld(u, v);
          const reqWorld = layout.toWorld(nextU, nextV);
          const resWorld = layout.resolvePosition(reqWorld[0], reqWorld[1], prevWorld[0], prevWorld[1], floor, radius);
          const [resU, resV] = layout.toLocal(resWorld[0], resWorld[1]);
          if (Math.abs(resU - nextU) > 0.015 || Math.abs(resV - nextV) > 0.015) continue;

          visited.add(nextKey);
          queue.push([nextU, nextV]);
        }
      }
      return false;
    }

    assert.equal(testBFS(4, [83.0, -200.3], [86.3, -205.0]), true, 'BFS 406.B8 từ cửa đến điểm đứng');
    assert.equal(testBFS(2, [83.0, -200.3], [87.0, -205.65]), true, 'BFS 206.B8 từ cửa (83; -200.3) đến standPoint');
    assert.equal(testBFS(2, [81.9, -177.4], [85.9, -172.95]), true, 'BFS 207.B8 từ cửa (81.9; -177.4) đến standPoint');
    assert.equal(testBFS(3, [30.6, -177.4], [21.7, -172.95]), true, 'BFS 311.B8 từ cửa (30.6; -177.4) đến standPoint');
    assert.equal(testBFS(2, [73.6, -200.3], [77.95, -205.1]), true, 'BFS 208.B8 từ cửa đến ghế người chơi');
    assert.equal(testBFS(2, [73.6, -200.3], [78.6, -204.2]), true, 'BFS 208.B8 từ cửa đến điểm đứng dậy');

    // Kiểm tra bàn chặn người đi xuyên qua
    const previous = layout.toWorld(86.3, -207.0);
    const requested = layout.toWorld(86.9, -207.0);
    const resolved = layout.resolvePosition(requested[0], requested[1], previous[0], previous[1], 4, 0.4);
    const [resolvedU] = layout.toLocal(resolved[0], resolved[1]);
    assert.ok(resolvedU < 86.9, 'bàn hàng 2 406.B8 phải chặn người đi xuyên qua');

    const prev206 = layout.toWorld(86.0, -207.7);
    const req206 = layout.toWorld(86.5, -207.7);
    const res206 = layout.resolvePosition(req206[0], req206[1], prev206[0], prev206[1], 2, 0.4);
    const [resU206] = layout.toLocal(res206[0], res206[1]);
    assert.ok(resU206 < 86.5, 'bàn 206.B8 phải chặn người đi xuyên qua');

    const prev208 = layout.toWorld(76.5, -205.1);
    const req208 = layout.toWorld(77.2, -205.1);
    const res208 = layout.resolvePosition(req208[0], req208[1], prev208[0], prev208[1], 2, 0.4);
    const [resU208] = layout.toLocal(res208[0], res208[1]);
    assert.ok(resU208 < 77.2, 'bàn 208.B8 phải chặn người đi xuyên qua');
  },
};
