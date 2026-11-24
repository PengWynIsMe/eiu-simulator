export default {
  'focused camera: selects default over-the-shoulder right when no obstacles are present'({ assert, load }) {
    return load('/src/scene/walk/focusedCamera.ts').then(({ selectFocusedCameraPosition }) => {
      const playerPos = [10.0, 0, 10.0];
      const targetPos = [10.0, 0, 12.0]; // Đối diện cách 2m

      const result = selectFocusedCameraPosition({
        playerPos,
        targetPos,
        isInterior: false,
      });

      assert.equal(result.isClear, true);
      assert.equal(result.candidateName, 'ots_right');
      // Khoảng cách từ camera tới target nằm trong 1.8–3.0m
      const dist = Math.hypot(result.camPos[0] - targetPos[0], result.camPos[2] - targetPos[2]);
      assert.ok(dist >= 1.8 && dist <= 3.0, `dist ${dist} outside 1.8-3.0m`);
      // Cao độ camera nằm trong 1.5–1.7m
      assert.ok(result.camPos[1] >= 1.5 && result.camPos[1] <= 1.7, `height ${result.camPos[1]} outside 1.5-1.7m`);
    });
  },

  'focused camera: avoids willow tree obstruction in entrance/meet-thanh scenario'({ assert, load }) {
    return load('/src/scene/walk/focusedCamera.ts').then(({ selectFocusedCameraPosition, OUTDOOR_FOCUS_TREES }) => {
      // Tọa độ thực tế tại entrance/meet-thanh
      const playerPos = [17.63, 0, -166.01];
      const targetPos = [17.91, 0, -164.85]; // Thành

      const result = selectFocusedCameraPosition({
        playerPos,
        targetPos,
        isInterior: false,
        trees: OUTDOOR_FOCUS_TREES,
        canopyY: 3.04,
      });

      assert.equal(result.isClear, true);
      // Vị trí qua vai phải cũ bị cây tại [17.36, -167.78] cản,
      // thuật toán phải chuyển sang vị trí thông thoáng (profile hoặc ots_left hoặc frontal)
      assert.notEqual(result.candidateName, 'ots_right');
      assert.ok(result.candidateName.includes('profile') || result.candidateName.includes('ots_left') || result.candidateName.includes('frontal'));

      // Kiểm tra camera không nằm trong bán kính 1.8m của cây liễu
      for (const tree of OUTDOOR_FOCUS_TREES) {
        const dCam = Math.hypot(result.camPos[0] - tree.x, result.camPos[2] - tree.z);
        assert.ok(dCam > 1.8, `Camera at ${result.camPos} is inside tree at (${tree.x}, ${tree.z}), d=${dCam}`);
      }
    });
  },

  'focused camera: does not penetrate interior walls in building room/corridor'({ assert, load }) {
    return load('/src/scene/walk/focusedCamera.ts').then(({ selectFocusedCameraPosition, lineSegmentsIntersect }) => {
      const playerPos = [35.88, 0, -212.05];
      const targetPos = [40.77, 0, -213.08];

      // Tường hành lang chạy dọc hướng z = -211.2 (ngăn phía Bắc)
      const wallLines = [
        { p1x: 30.0, p1z: -211.2, p2x: 45.0, p2z: -211.2 },
      ];

      const result = selectFocusedCameraPosition({
        playerPos,
        targetPos,
        isInterior: true,
        wallLines,
        ceilingHeight: 3.2,
      });

      // Camera không được cắt tường
      for (const w of wallLines) {
        const cuts = lineSegmentsIntersect(
          result.camPos[0], result.camPos[2],
          targetPos[0], targetPos[2],
          w.p1x, w.p1z, w.p2x, w.p2z
        );
        assert.equal(cuts, false, 'Camera sightline must not cut interior wall');
      }
    });
  },

  'focused camera: avoids obstruction when third actor stands in the sightline'({ assert, load }) {
    return load('/src/scene/walk/focusedCamera.ts').then(({ selectFocusedCameraPosition }) => {
      const playerPos = [10.0, 0, 10.0];
      const targetPos = [10.0, 0, 13.0]; // Người nói T (hướng nhìn +Z, bên phải là -X)

      // Diễn viên thứ 3 đứng chếch bên phải người chơi (x: 9.67, z: 11.0), chặn góc nhìn qua vai phải
      const actors = [
        { speaker: 'quyen', x: 9.67, z: 11.0, radius: 0.4 },
      ];

      const result = selectFocusedCameraPosition({
        playerPos,
        targetPos,
        actors,
        isInterior: false,
      });

      assert.equal(result.isClear, true);
      // ots_right bị Quyền chắn, phải chuyển sang ots_left hoặc profile
      assert.notEqual(result.candidateName, 'ots_right');
    });
  },

  'focused camera: speaker face stays in center 60% of viewport'({ assert, load }) {
    return load('/src/scene/walk/focusedCamera.ts').then(({ selectFocusedCameraPosition }) => {
      const playerPos = [5.0, 0, 5.0];
      const targetPos = [5.0, 0, 7.2];

      const result = selectFocusedCameraPosition({
        playerPos,
        targetPos,
        isInterior: false,
      });

      const [cx, cy, cz] = result.camPos;
      const [lx, ly, lz] = result.lookAt;
      const [tx, ty, tz] = targetPos;
      const headTy = ty + 1.6;

      // Trục nhìn camera C -> LookAt
      const vLx = lx - cx;
      const vLy = ly - cy;
      const vLz = lz - cz;
      const lenL = Math.hypot(vLx, vLy, vLz);

      // Vector C -> Mặt người nói
      const vTx = tx - cx;
      const vTy = headTy - cy;
      const vTz = tz - cz;
      const lenT = Math.hypot(vTx, vTy, vTz);

      const dot = (vLx * vTx + vLy * vTy + vLz * vTz) / (lenL * lenT);
      const angleRad = Math.acos(Math.max(-1, Math.min(1, dot)));
      const maxCenterAngleRad = (13.5 * Math.PI) / 180; // 60% của 22.5 độ

      assert.ok(angleRad <= maxCenterAngleRad, `Speaker angle ${angleRad * 180 / Math.PI}° exceeds center 60% (13.5°)`);
    });
  },
};
