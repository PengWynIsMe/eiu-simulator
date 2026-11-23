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
    assert.ok(!floorTwoWalls.some((wall) => wall.u1 === 86.9 && Math.abs(wall.v1 - -208.75) < 0.001));
    assert.ok(!floorThreeWalls.some((wall) => wall.u1 === 86.9 && Math.abs(wall.v1 - -208.75) < 0.001));
    assert.equal(floorTwoWalls.length, 161);
    assert.equal(floorThreeWalls.length, 131);

    const step = 0.1;
    const start = [83.0, -200.3];
    const goal = [86.3, -205.0];
    const key = (u, v) => `${Math.round(u / step)},${Math.round(v / step)}`;
    const queue = [start];
    const visited = new Set([key(...start)]);
    let found = false;

    for (let head = 0; head < queue.length && !found; head += 1) {
      const [u, v] = queue[head];
      if (Math.abs(u - goal[0]) < 0.001 && Math.abs(v - goal[1]) < 0.001) {
        found = true;
        break;
      }

      for (const [du, dv] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
        const nextU = Number((u + du).toFixed(1));
        const nextV = Number((v + dv).toFixed(1));
        const nextKey = key(nextU, nextV);
        if (visited.has(nextKey)) continue;

        const previousWorld = layout.toWorld(u, v);
        const requestedWorld = layout.toWorld(nextU, nextV);
        const resolvedWorld = layout.resolvePosition(
          requestedWorld[0],
          requestedWorld[1],
          previousWorld[0],
          previousWorld[1],
          4,
          0.4,
        );
        const [resolvedU, resolvedV] = layout.toLocal(resolvedWorld[0], resolvedWorld[1]);
        if (Math.abs(resolvedU - nextU) > 0.015 || Math.abs(resolvedV - nextV) > 0.015) continue;

        visited.add(nextKey);
        queue.push([nextU, nextV]);
      }
    }

    assert.equal(found, true, 'đường BFS từ cửa đến điểm đứng dậy phải đi được');

    const previous = layout.toWorld(86.3, -207.0);
    const requested = layout.toWorld(86.9, -207.0);
    const resolved = layout.resolvePosition(requested[0], requested[1], previous[0], previous[1], 4, 0.4);
    const [resolvedU] = layout.toLocal(resolved[0], resolved[1]);
    assert.ok(resolvedU < 86.9, 'bàn hàng 2 phải chặn người đi xuyên qua');
  },
};
