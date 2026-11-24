export default {
  'focused camera: cao do mat nguoi choi 1.05m va diem nhin 0.87m'({ assert, load }) {
    return load('/src/scene/walk/focusedCamera.ts').then(({ selectFocusedCameraPosition }) => {
      const playerPos = [20.0, 3.8, 10.0];
      const targetPos = [20.0, 3.8, 12.0];

      const result = selectFocusedCameraPosition({ playerPos, targetPos });

      // Camera ở mắt người chơi: cao 1.05 m so với sàn người chơi
      assert.equal(Math.round(result.camPos[1] * 100) / 100, 3.8 + 1.05);
      // Điểm nhìn: cao 0.87 m so với sàn người nói để tâm mặt ở 35-45% chiều cao màn
      assert.equal(Math.round(result.lookAt[1] * 100) / 100, 3.8 + 0.87);
      assert.equal(result.lookAt[0], 20.0);
      assert.equal(result.lookAt[2], 12.0);
    });
  },

  'focused camera: khoang cach chuan 2.2m (trong khoang 2.0-2.4m)'({ assert, load }) {
    return load('/src/scene/walk/focusedCamera.ts').then(({ selectFocusedCameraPosition }) => {
      const p1 = [10.0, 0, 10.0];
      const t1 = [10.0, 0, 12.0];
      const r1 = selectFocusedCameraPosition({ playerPos: p1, targetPos: t1 });
      const dist = Math.hypot(r1.camPos[0] - t1[0], r1.camPos[2] - t1[2]);
      assert.ok(dist >= 2.0 && dist <= 2.4, `dist ${dist} outside 2.0-2.4m`);
      assert.equal(Math.round(dist * 10) / 10, 2.2);
    });
  },

  'focused camera: khong xuyen qua tuong hoac lan can (dung kieu WallLine p1/p2)'({ assert, load }) {
    return load('/src/scene/walk/focusedCamera.ts').then(({ selectFocusedCameraPosition }) => {
      // Người nói ở [10, 0, 12], người chơi ở [10, 0, 10]
      // Đặt một bức tường bao quanh phía sau người chơi z <= 10.5
      // Và các góc khác bị chặn chỉ còn một phía thông
      const playerPos = [10.0, 0, 11.0];
      const targetPos = [10.0, 0, 12.0];
      // Tường chắn ở góc 0 độ (tại z = 10.5, chắn tia từ [10, 0, 9.8] tới [10, 0, 12])
      const wallLines = [{ p1x: 8.0, p1z: 10.5, p2x: 12.0, p2z: 10.5 }];

      const result = selectFocusedCameraPosition({ playerPos, targetPos, wallLines });
      // Góc 0 độ bị tường cản, camera tự xoay sang góc thông khác hoặc không cắt tường
      let cutsWall = false;
      const ccw = (ax, az, bx, bz, cx, cz) => (cz - az) * (bx - ax) > (bz - az) * (cx - ax);
      const intersects = (x1, z1, x2, z2, x3, z3, x4, z4) =>
        ccw(x1, z1, x3, z3, x4, z4) !== ccw(x2, z2, x3, z3, x4, z4) &&
        ccw(x1, z1, x2, z2, x3, z3) !== ccw(x1, z1, x2, z2, x4, z4);

      for (const w of wallLines) {
        if (intersects(result.camPos[0], result.camPos[2], targetPos[0], targetPos[2], w.p1x, w.p1z, w.p2x, w.p2z)) {
          cutsWall = true;
        }
      }
      assert.equal(cutsWall, false, 'Camera position cuts through wall');
    });
  },

  'focused camera: xoay quanh nguoi noi theo tung 20 do khi co vat can 3D'({ assert, load }) {
    return load('/src/scene/walk/focusedCamera.ts').then(({ selectFocusedCameraPosition }) => {
      const playerPos = [10.0, 0, 7.8];
      const targetPos = [10.0, 0, 10.0];

      // Giả lập vật cản ở góc 0° (thẳng hàng giữa playerPos và targetPos)
      const isObstacleBetween = (from) => {
        // Nếu góc nhìn gần trục X = 10 (góc 0 độ), coi như bị cột/cây che
        return Math.abs(from[0] - 10.0) < 0.2;
      };

      const result = selectFocusedCameraPosition({ playerPos, targetPos, isObstacleBetween });
      // Camera phải xoay khỏi X = 10 sang góc 20 độ đầu tiên thông suốt
      assert.ok(Math.abs(result.camPos[0] - 10.0) > 0.5, `camPos X was not rotated: ${result.camPos[0]}`);
      const dist = Math.hypot(result.camPos[0] - targetPos[0], result.camPos[2] - targetPos[2]);
      assert.ok(dist >= 2.0 && dist <= 2.4, `dist ${dist} outside 2.0-2.4m`);
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
