export default {
  'loads and validates 32 stages'({ assert, load }) {
    return load('/src/data/silver/stages.ts').then(({ stages, getStage, isStageAvailable }) => {
      assert.equal(stages.length, 32);

      const uniqueIds = new Set(stages.map((s) => s.sceneId));
      assert.equal(uniqueIds.size, 32);

      for (const s of stages) {
        assert.ok(Number.isFinite(s.arrival.x));
        assert.ok(Number.isFinite(s.arrival.z));
        assert.ok(Number.isFinite(s.target.x));
        assert.ok(Number.isFinite(s.target.z));
        if (s.trigger === 'sit') {
          assert.ok(s.roomCode !== null, `${s.sceneId} sit phải có roomCode`);
        }
      }

      // Check specific known stages
      const lab1 = getStage('CSE 103/lab-1');
      assert.ok(lab1);
      assert.equal(lab1.roomCode, '406.B8');
      assert.equal(lab1.tier, 'full');
      assert.equal(lab1.trigger, 'sit');
      assert.equal(isStageAvailable('CSE 103/lab-1'), true);

      const speaking = getStage('entrance/speaking');
      assert.ok(speaking);
      assert.equal(speaking.roomCode, '208.B8');
      assert.equal(isStageAvailable('entrance/speaking'), true);

      const outdoor = getStage('entrance/meet-thanh');
      assert.ok(outdoor);
      assert.equal(outdoor.roomCode, null);
      assert.equal(isStageAvailable('entrance/meet-thanh'), true);

      // 207.B8 is available in 3D-09
      const theory = getStage('CSE 103/a');
      assert.ok(theory);
      assert.equal(isStageAvailable('CSE 103/a'), true);
      assert.equal(isStageAvailable('CSE 103/a', () => undefined), false);
    });
  },

  'parseStages enforces validation rules'({ assert, load }) {
    return load('/src/data/silver/stages.ts').then(({ parseStages }) => {
      const validStage = {
        sceneId: 'test/scene-1',
        tier: 'light',
        trigger: 'talk',
        place: { vi: 'Phòng học', en: 'Room' },
        roomCode: null,
        arrival: { buildingId: null, floor: null, x: 10, z: 20, facing: [0, 1] },
        target: { buildingId: null, floor: null, x: 12, z: 22, facing: [0, -1] },
        actors: [{ speaker: 'han', pose: 'idle' }],
        crowd: 0,
      };

      // Rejects duplicate sceneId
      assert.throws(
        () => parseStages({
          version: 1,
          stages: [validStage, { ...validStage }],
        }),
        /sceneId duy nhất/,
      );

      // Rejects sit without roomCode
      assert.throws(
        () => parseStages({
          version: 1,
          stages: [{ ...validStage, trigger: 'sit', roomCode: null }],
        }),
        /sit phải có phòng hoặc ghế riêng/,
      );

      // Rejects non-finite coordinate
      assert.throws(
        () => parseStages({
          version: 1,
          stages: [{
            ...validStage,
            arrival: { ...validStage.arrival, x: Number.NaN },
          }],
        }),
        /cần số|tọa độ hữu hạn/,
      );

      // Rejects invalid seatId in an existing room
      const fakeRoom = {
        code: 'TEST.ROOM',
        seats: [{ id: 'seat-1' }],
      };
      assert.throws(
        () => parseStages(
          {
            version: 1,
            stages: [{
              ...validStage,
              roomCode: 'TEST.ROOM',
              actors: [{ speaker: 'han', seatId: 'non-existent-seat', pose: 'sit' }],
            }],
          },
          (code) => (code === 'TEST.ROOM' ? fakeRoom : undefined),
        ),
        /ghế non-existent-seat có thật/,
      );

      // Accepts seatId when room is absent (đợt 1 coi như vắng)
      const parsed = parseStages(
        {
          version: 1,
          stages: [{
            ...validStage,
            roomCode: 'ABSENT.ROOM',
            actors: [{ speaker: 'han', seatId: 'seat-xyz', pose: 'sit' }],
          }],
        },
        () => undefined,
      );
      assert.equal(parsed.stages.length, 1);
    });
  },

  'all 32 stages spots are walkable and targets reachable from arrival via BFS': async ({ assert, load }) => {
    const { stages } = await load('/src/data/silver/stages.ts');
    const b8Layout = await load('/src/scene/interior/layouts/b8.ts');
    const { campus } = await load('/src/data/index.ts');
    const { isPointInPond } = await load('/src/scene/zone1/pondLayout.ts');
    const { isOnPondPot } = await load('/src/scene/zone1/pondTerraceLayout.ts');

    function pointInPolygon(x, z, polygon) {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], zi = polygon[i][1];
        const xj = polygon[j][0], zj = polygon[j][1];
        const intersect = ((zi > z) !== (zj > z)) && (x < ((xj - xi) * (z - zi)) / (zj - zi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    }

    function distanceToSegment(x, z, a, b) {
      const dx = b[0] - a[0], dz = b[1] - a[1];
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
      return Math.hypot(x - (a[0] + t * dx), z - (a[1] + t * dz));
    }

    const BRIDGES = [
      { start: [100.8, -137.9], end: [100.8, -125.7] },
      { start: [73.5, -165.2], end: [61.3, -165.2] },
      { start: [100.8, -192.5], end: [100.8, -180.3] },
      { start: [128.1, -165.2], end: [140.3, -165.2] },
    ];

    function isOnBridge(x, z) {
      for (const bridge of BRIDGES) {
        if (distanceToSegment(x, z, bridge.start, bridge.end) <= 1.6) return true;
      }
      return false;
    }

    function isOutdoorWalkable(x, z, radius = 0.4) {
      if (!pointInPolygon(x, z, campus.layout.boundary)) return false;
      if (!isOnBridge(x, z) && isPointInPond(x, z, radius)) return false;
      if (isOnPondPot(x, z, radius)) return false;
      for (const building of campus.buildings) {
        if (pointInPolygon(x, z, building.shape.outer)) return false;
        const points = building.shape.outer;
        for (let i = 0; i < points.length; i += 1) {
          const a = points[i], b = points[(i + 1) % points.length];
          if (distanceToSegment(x, z, a, b) < radius) return false;
        }
      }
      return true;
    }

    function isIndoorWalkable(buildingId, floor, x, z, radius = 0.4) {
      if (buildingId.toLowerCase() === 'b8') {
        const res = b8Layout.resolveInteriorPosition(x, z, x, z, floor, radius);
        return Math.hypot(res[0] - x, res[1] - z) < 0.05;
      }
      return true;
    }

    function isSpotWalkable(spot, radius = 0.4) {
      if (spot.buildingId === null) return isOutdoorWalkable(spot.x, spot.z, radius);
      return isIndoorWalkable(spot.buildingId, spot.floor, spot.x, spot.z, radius);
    }

    // 1. Check all standing spots
    for (const s of stages) {
      assert.ok(isSpotWalkable(s.arrival), `${s.sceneId}: arrival (${s.arrival.x}, ${s.arrival.z}) phải đứng được`);
      if (s.trigger !== 'sit') {
        assert.ok(isSpotWalkable(s.target), `${s.sceneId}: target (${s.target.x}, ${s.target.z}) phải đứng được`);
      }
      for (const a of s.actors) {
        if (a.spot && a.pose !== 'sit') {
          assert.ok(isSpotWalkable(a.spot), `${s.sceneId}: actor ${a.speaker} spot (${a.spot.x}, ${a.spot.z}) phải đứng được`);
        }
      }
    }

    // 2. BFS reachable from arrival to target
    function bfsCanReach(stage) {
      const targetRadius = stage.trigger === 'sit' ? 1.2 : 1.8;
      if (stage.target.buildingId === null) {
        const startX = stage.arrival.x, startZ = stage.arrival.z;
        const tarX = stage.target.x, tarZ = stage.target.z;
        if (Math.hypot(startX - tarX, startZ - tarZ) <= targetRadius) return true;

        const step = 0.5;
        const queue = [[startX, startZ]];
        const visited = new Set();
        const toKey = (x, z) => `${Math.round(x / step)},${Math.round(z / step)}`;
        visited.add(toKey(startX, startZ));

        const DIRS = [
          [step, 0], [-step, 0], [0, step], [0, -step],
          [step * 0.707, step * 0.707], [-step * 0.707, step * 0.707],
          [step * 0.707, -step * 0.707], [-step * 0.707, -step * 0.707],
        ];

        let count = 0;
        while (queue.length > 0 && count < 10000) {
          count++;
          const [currX, currZ] = queue.shift();
          if (Math.hypot(currX - tarX, currZ - tarZ) <= targetRadius) return true;
          for (const [dx, dz] of DIRS) {
            const nx = currX + dx, nz = currZ + dz;
            const key = toKey(nx, nz);
            if (!visited.has(key)) {
              visited.add(key);
              if (isOutdoorWalkable(nx, nz)) queue.push([nx, nz]);
            }
          }
        }
        return false;
      }

      // Indoor B8: local grid
      const [startU, startV] = b8Layout.toLocal(stage.arrival.x, stage.arrival.z);
      const [tarU, tarV] = b8Layout.toLocal(stage.target.x, stage.target.z);
      const floor = stage.target.floor;
      if (Math.hypot(startU - tarU, startV - tarV) <= targetRadius) return true;

      const step = 0.15;
      const queue = [[startU, startV]];
      const visited = new Set();
      const toKey = (u, v) => `${Math.round(u / step)},${Math.round(v / step)}`;
      visited.add(toKey(startU, startV));

      const DIRS = [
        [step, 0], [-step, 0], [0, step], [0, -step],
        [step, step], [-step, step], [step, -step], [-step, -step],
      ];

      let count = 0;
      while (queue.length > 0 && count < 60000) {
        count++;
        const [currU, currV] = queue.shift();
        if (Math.hypot(currU - tarU, currV - tarV) <= targetRadius) return true;
        for (const [du, dv] of DIRS) {
          const nu = currU + du, nv = currV + dv;
          const key = toKey(nu, nv);
          if (!visited.has(key)) {
            visited.add(key);
            const [wx, wz] = b8Layout.toWorld(nu, nv);
            const res = b8Layout.resolveInteriorPosition(wx, wz, wx, wz, floor, 0.4);
            if (Math.hypot(res[0] - wx, res[1] - wz) < 0.05) {
              queue.push([nu, nv]);
            }
          }
        }
      }
      return false;
    }

    for (const s of stages) {
      assert.ok(bfsCanReach(s), `${s.sceneId}: không thể đi từ arrival tới target qua BFS`);
    }
  },
};
