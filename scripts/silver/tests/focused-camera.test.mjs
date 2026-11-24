export default {
  'focused camera: cao do mat nguoi choi 1.5m va mat nguoi noi 1.3m'({ assert, load }) {
    return load('/src/scene/walk/focusedCamera.ts').then(({ selectFocusedCameraPosition }) => {
      const playerPos = [20.0, 3.8, 10.0];
      const targetPos = [20.0, 3.8, 12.0];

      const result = selectFocusedCameraPosition({ playerPos, targetPos });

      // Camera ở mắt người chơi: cao 1.5 m so với sàn
      assert.equal(result.camPos[1], 3.8 + 1.5);
      // Điểm nhìn: vào mặt người nói, cao 1.3 m so với sàn người nói
      assert.equal(result.lookAt[1], 3.8 + 1.3);
      assert.equal(result.lookAt[0], 20.0);
      assert.equal(result.lookAt[2], 12.0);
    });
  },

  'focused camera: khoang cach >= 1.6m giu nguyen mat nguoi choi, < 1.6m lui toi 1.8m'({ assert, load }) {
    return load('/src/scene/walk/focusedCamera.ts').then(({ selectFocusedCameraPosition }) => {
      // Trường hợp 1: Người nói cách 2.0 m (>= 1.6 m)
      const p1 = [10.0, 0, 10.0];
      const t1 = [10.0, 0, 12.0];
      const r1 = selectFocusedCameraPosition({ playerPos: p1, targetPos: t1 });
      assert.equal(r1.camPos[0], 10.0);
      assert.equal(r1.camPos[2], 10.0);

      // Trường hợp 2: Người nói cách 1.0 m (< 1.6 m)
      const p2 = [10.0, 0, 11.0];
      const t2 = [10.0, 0, 12.0];
      const r2 = selectFocusedCameraPosition({ playerPos: p2, targetPos: t2 });
      const dist2 = Math.hypot(r2.camPos[0] - t2[0], r2.camPos[2] - t2[2]);
      // Lùi tối đa tới 1.8 m (nằm trong 1.6–2.0 m)
      assert.ok(dist2 >= 1.6 && dist2 <= 2.0, `dist ${dist2} outside 1.6-2.0m`);
      assert.equal(Math.round(dist2 * 10) / 10, 1.8);
    });
  },

  'focused camera: khong xuyen qua tuong hoac lan can khi lui'({ assert, load }) {
    return load('/src/scene/walk/focusedCamera.ts').then(({ selectFocusedCameraPosition }) => {
      // Người nói ở [10, 0, 12], người chơi ở [10, 0, 11] (cách 1.0m)
      // Hướng lùi là về phía z = 10.2 (đạt 1.8m tại z = 10.2)
      // Đặt một bức tường cắt ngang tại z = 10.5 (giữa 11 và 10.2)
      const playerPos = [10.0, 0, 11.0];
      const targetPos = [10.0, 0, 12.0];
      const wallLines = [{ x1: 8.0, z1: 10.5, x2: 12.0, z2: 10.5 }];

      const result = selectFocusedCameraPosition({ playerPos, targetPos, wallLines });
      // Không lùi qua tường tại z = 10.5, giữ nguyên tại z = 11.0
      assert.ok(result.camPos[2] >= 10.5, `camPos[2] ${result.camPos[2]} crossed wall at 10.5`);
      assert.equal(result.camPos[2], 11.0);
    });
  },

  'focused camera: doi doi tuong thi tinh lai toa do va diem nhin'({ assert, load }) {
    return load('/src/scene/walk/focusedCamera.ts').then(({ selectFocusedCameraPosition }) => {
      const playerPos = [10.0, 0, 10.0];
      const targetA = [10.0, 0, 13.0];
      const targetB = [14.0, 0, 10.0];

      const resA = selectFocusedCameraPosition({ playerPos, targetPos: targetA });
      const resB = selectFocusedCameraPosition({ playerPos, targetPos: targetB });

      // Đối tượng A: nhìn theo trục Z
      assert.equal(resA.lookAt[0], 10.0);
      assert.equal(resA.lookAt[2], 13.0);

      // Đối tượng B: nhìn theo trục X
      assert.equal(resB.lookAt[0], 14.0);
      assert.equal(resB.lookAt[2], 10.0);
      assert.notDeepEqual(resA.lookAt, resB.lookAt);
    });
  },
};
