import { useMemo } from 'react';
import { BoxGeometry, BufferGeometry } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export default function ParkingShed() {
  const { roofGeo, postsGeo, floorGeo } = useMemo(() => {
    // Tọa độ trung tâm và hướng của nhà xe sau Block 5 (nha-xe-b5)
    // Footprint: [[152.6, -160.7], [180.8, -164.2], [186.9, -115.6], [158.7, -112.1]]
    const cx = (152.6 + 180.8 + 186.9 + 158.7) / 4;
    const cz = (-160.7 + -164.2 + -115.6 + -112.1) / 4;
    const len = 50.0; // chiều dài theo trục Bắc - Nam (hơi nghiêng ~7 độ)
    const wid = 29.0; // chiều rộng
    const angle = Math.atan2(-164.2 - -160.7, 180.8 - 152.6); // hướng xoay theo cạnh ngắn

    const roofs: BufferGeometry[] = [];
    const posts: BufferGeometry[] = [];
    const floors: BufferGeometry[] = [];

    const baseY = 0.3; // Nền bãi xe
    const slabH = 0.2;
    const postH = 3.2;
    const roofTopY = baseY + postH;

    // 1. Sàn bê tông nâng nhẹ
    const floor = new BoxGeometry(wid, slabH, len);
    floor.rotateY(-angle);
    floor.translate(cx, baseY + slabH / 2, cz);
    floors.push(floor);

    // 2. Mái tôn răng cưa (sawtooth) gồm 5 nhịp dốc nhấp nhô
    const numGables = 5;
    const gableW = wid / numGables;
    const pitchH = 0.8; // chiều cao chóp mái răng cưa

    for (let g = 0; g < numGables; g++) {
      const gx = -wid / 2 + (g + 0.5) * gableW;

      // Cánh mái dốc 1
      const slope1 = new BoxGeometry(gableW * 0.55, 0.08, len + 1.0);
      slope1.rotateZ(0.28);
      slope1.translate(gx - gableW * 0.22, roofTopY + pitchH / 2, 0);
      slope1.rotateY(-angle);
      slope1.translate(cx, 0, cz);
      roofs.push(slope1);

      // Cánh mái dốc 2
      const slope2 = new BoxGeometry(gableW * 0.55, 0.08, len + 1.0);
      slope2.rotateZ(-0.28);
      slope2.translate(gx + gableW * 0.22, roofTopY + pitchH / 2, 0);
      slope2.rotateY(-angle);
      slope2.translate(cx, 0, cz);
      roofs.push(slope2);
    }

    // 3. Hệ cột thép đỡ
    const rows = 6;
    const cols = numGables + 1;
    for (let r = 0; r < rows; r++) {
      const tz = -len / 2 + (r / (rows - 1)) * len;
      for (let c = 0; c < cols; c++) {
        const tx = -wid / 2 + (c / (cols - 1)) * wid;

        const post = new BoxGeometry(0.2, postH, 0.2);
        post.translate(tx, baseY + postH / 2, tz);
        post.rotateY(-angle);
        post.translate(cx, 0, cz);
        posts.push(post);
      }
    }

    const mergedRoof = BufferGeometryUtils.mergeGeometries(roofs);
    const mergedPosts = BufferGeometryUtils.mergeGeometries(posts);
    const mergedFloor = BufferGeometryUtils.mergeGeometries(floors);

    roofs.forEach((g) => g.dispose());
    posts.forEach((g) => g.dispose());
    floors.forEach((g) => g.dispose());

    return { roofGeo: mergedRoof, postsGeo: mergedPosts, floorGeo: mergedFloor };
  }, []);

  return (
    <group>
      {/* Sàn bê tông */}
      <mesh geometry={floorGeo} receiveShadow>
        <meshStandardMaterial color="#94a3b8" roughness={0.7} />
      </mesh>

      {/* Cột thép đỡ */}
      <mesh geometry={postsGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>

      {/* Mái tôn răng cưa xám bạc */}
      <mesh geometry={roofGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#949da6" metalness={0.3} roughness={0.5} flatShading />
      </mesh>
    </group>
  );
}
