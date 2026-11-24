export default {
  'rotationYOf rotates local (u, v) points to toWorld coordinates for both B11 and B8': async ({ assert, load }) => {
    const { toWorld, rotationYOf } = await load('/src/scene/silver/frame.ts');
    const { getClassroom } = await load('/src/data/index.ts');

    // Helper: quay điểm 2D (u, v) quanh trục Y góc theta theo Three.js:
    // x = u*cos(theta) + v*sin(theta)
    // z = -u*sin(theta) + v*cos(theta)
    const rotatePointY = (u, v, theta) => {
      const c = Math.cos(theta);
      const s = Math.sin(theta);
      return [u * c + v * s, -u * s + v * c];
    };

    // 1. Kiểm tra B8: TV 406.B8 tại (91.2, -205.1)
    const b8Room = getClassroom('406.B8');
    assert.ok(b8Room, 'Phòng 406.B8 phải tồn tại');
    const b8Sc = b8Room.projectorScreen;
    const b8RotY = rotationYOf('b8');
    const [b8ExpectedX, b8ExpectedZ] = toWorld('b8', b8Sc.u, b8Sc.v);

    const [b8ActualX, b8ActualZ] = rotatePointY(b8Sc.u, b8Sc.v, b8RotY);
    assert.ok(
      Math.abs(b8ActualX - b8ExpectedX) < 1e-3,
      `B8 TV x lệch: thực tế ${b8ActualX} vs toWorld ${b8ExpectedX}`,
    );
    assert.ok(
      Math.abs(b8ActualZ - b8ExpectedZ) < 1e-3,
      `B8 TV z lệch: thực tế ${b8ActualZ} vs toWorld ${b8ExpectedZ}`,
    );
    assert.ok(Math.abs(b8ActualX - 42.287) < 0.05, `B8 TV x phải xấp xỉ 42.29 (ra ${b8ActualX})`);
    assert.ok(Math.abs(b8ActualZ - (-220.43)) < 0.05, `B8 TV z phải xấp xỉ -220.43 (ra ${b8ActualZ})`);

    // 2. Kiểm tra B11: TV 406.B11
    const b11Room = getClassroom('406.B11');
    assert.ok(b11Room, 'Phòng 406.B11 phải tồn tại');
    const b11Sc = b11Room.projectorScreen;
    const b11RotY = rotationYOf('b11');
    const [b11ExpectedX, b11ExpectedZ] = toWorld('b11', b11Sc.u, b11Sc.v);

    const [b11ActualX, b11ActualZ] = rotatePointY(b11Sc.u, b11Sc.v, b11RotY);
    assert.ok(
      Math.abs(b11ActualX - b11ExpectedX) < 1e-3,
      `B11 TV x lệch: thực tế ${b11ActualX} vs toWorld ${b11ExpectedX}`,
    );
    assert.ok(
      Math.abs(b11ActualZ - b11ExpectedZ) < 1e-3,
      `B11 TV z lệch: thực tế ${b11ActualZ} vs toWorld ${b11ExpectedZ}`,
    );

    // 3. Kiểm tra vector pháp tuyến (normal) của TV 406.B8 trùng khớp hướng facing thế giới
    // PlaneGeometry mặc định có normal [0, 0, 1] (+z).
    // ProjectorScreen quay Y theo facingAngle = Math.atan2(facing[0], facing[1]):
    const facingAngle = Math.atan2(b8Sc.facing[0], b8Sc.facing[1]);
    // Sau 2 lần quay quanh Y: góc tổng = facingAngle + b8RotY
    const totalAngle = facingAngle + b8RotY;
    const [normalX, normalZ] = rotatePointY(0, 1, totalAngle);

    // Vector thế giới mong đợi: toWorld('b8', facing[0], facing[1]) chuẩn hóa
    const [expectedNx, expectedNz] = toWorld('b8', b8Sc.facing[0], b8Sc.facing[1]);
    const expectedLen = Math.hypot(expectedNx, expectedNz);
    const expectedNormX = expectedNx / expectedLen;
    const expectedNormZ = expectedNz / expectedLen;

    assert.ok(
      Math.abs(normalX - expectedNormX) < 1e-3,
      `TV 406.B8 normal X lệch: ${normalX} vs ${expectedNormX}`,
    );
    assert.ok(
      Math.abs(normalZ - expectedNormZ) < 1e-3,
      `TV 406.B8 normal Z lệch: ${normalZ} vs ${expectedNormZ}`,
    );
  },

  'characterConfig loads story characters and keeps student roles pool intact': async ({ assert, load }) => {
    const { characterConfig } = await load('/src/data/index.ts');
    assert.ok(characterConfig.story, 'characterConfig phải có trường story');
    assert.ok(characterConfig.story.thanh, 'story phải có thanh');
    assert.ok(characterConfig.story.quyen, 'story phải có quyen');
    assert.ok(characterConfig.story.han, 'story phải có han');
    assert.ok(characterConfig.story.examiner, 'story phải có examiner');
    assert.ok(characterConfig.story.guide, 'story phải có guide');

    assert.ok(characterConfig.story.han.includes('character-female-c'), 'han phải dùng character-female-c.glb');
    assert.ok(characterConfig.story.thanh.includes('character-male-e'), 'thanh phải dùng character-male-e.glb');
    assert.ok(characterConfig.story.quyen.includes('character-male-g'), 'quyen phải dùng character-male-g.glb');

    // Đảm bảo roles.students không bị thay đổi làm ảnh hưởng 406.B11
    assert.equal(characterConfig.roles.students.length, 8, 'roles.students vẫn phải đủ 8 model cho 406.B11');
  },
};
