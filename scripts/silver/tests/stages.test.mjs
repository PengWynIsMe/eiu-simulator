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
};
