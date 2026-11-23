import { useMemo } from 'react';
import { BoxGeometry, CylinderGeometry, BufferGeometry } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

interface ParkingShedProps {
  isHovered?: boolean;
  isSelected?: boolean;
}

/**
 * Nhà giữ xe máy mái răng cưa sau Block 5 (`nha-xe-b5`, ~50 m × 29 m).
 * Nâng cấp theo clip thực tế (t093s, t097s):
 * - Hệ nhịp mái đầu hồi tam giác răng cưa (sawtooth gables) màu trắng sáng (#f8fafc).
 * - Khung thép sơn trắng kem / xám sáng (#e2e8f0).
 * - Hàng rào song sắt màu trắng (white picket railing) cao 1.1m bao quanh mép bãi xe.
 * - Các hàng xe máy đậu san sát bên trong.
 * - Hàng cây dầu / sao đen cao vút thẳng đứng phía sau nhà xe.
 */
export default function ParkingShed({ isHovered, isSelected }: ParkingShedProps) {
  const emissiveColor = isSelected ? '#60a5fa' : isHovered ? '#38bdf8' : '#000000';
  const emissiveIntensity = isSelected ? 0.35 : isHovered ? 0.2 : 0;

  const {
    roofGeo,
    postsGeo,
    floorGeo,
    railGeo,
    bikesGeo,
    treesWoodGeo,
    treesLeavesGeo,
  } = useMemo(() => {
    // Tọa độ trung tâm và hướng của nhà xe sau Block 5 (nha-xe-b5)
    const cx = (152.6 + 180.8 + 186.9 + 158.7) / 4;
    const cz = (-160.7 + -164.2 + -115.6 + -112.1) / 4;
    const len = 50.0; // chiều dài theo trục Bắc - Nam
    const wid = 29.0; // chiều rộng
    const angle = Math.atan2(-164.2 - -160.7, 180.8 - 152.6); // hướng xoay theo cạnh ngắn

    const roofs: BufferGeometry[] = [];
    const posts: BufferGeometry[] = [];
    const floors: BufferGeometry[] = [];
    const rails: BufferGeometry[] = [];
    const bikes: BufferGeometry[] = [];
    const treeWoods: BufferGeometry[] = [];
    const treeLeaves: BufferGeometry[] = [];

    const baseY = 0.3; // Nền bãi xe
    const slabH = 0.2;
    const postH = 3.2;
    const roofTopY = baseY + postH;

    // 1. Sàn bê tông
    const floor = new BoxGeometry(wid, slabH, len);
    floor.rotateY(-angle);
    floor.translate(cx, baseY + slabH / 2, cz);
    floors.push(floor);

    // 2. Mái tôn răng cưa (sawtooth) gồm 5 nhịp dốc nhấp nhô màu trắng sáng
    const numGables = 5;
    const gableW = wid / numGables;
    const pitchH = 0.95; // chiều cao chóp mái răng cưa

    for (let g = 0; g < numGables; g++) {
      const gx = -wid / 2 + (g + 0.5) * gableW;

      // Cánh mái dốc 1
      const slope1 = new BoxGeometry(gableW * 0.56, 0.08, len + 1.2);
      slope1.rotateZ(0.32);
      slope1.translate(gx - gableW * 0.23, roofTopY + pitchH / 2, 0);
      slope1.rotateY(-angle);
      slope1.translate(cx, 0, cz);
      roofs.push(slope1);

      // Cánh mái dốc 2
      const slope2 = new BoxGeometry(gableW * 0.56, 0.08, len + 1.2);
      slope2.rotateZ(-0.32);
      slope2.translate(gx + gableW * 0.23, roofTopY + pitchH / 2, 0);
      slope2.rotateY(-angle);
      slope2.translate(cx, 0, cz);
      roofs.push(slope2);

      // Tấm diềm hồi tam giác đầu nhà xe (đầu Bắc và đầu Nam)
      for (const endZ of [-len / 2, len / 2]) {
        const gableEnd = new BoxGeometry(gableW * 0.95, pitchH * 0.9, 0.1);
        gableEnd.translate(gx, roofTopY + pitchH * 0.45, endZ);
        gableEnd.rotateY(-angle);
        gableEnd.translate(cx, 0, cz);
        roofs.push(gableEnd);
      }
    }

    // 3. Hệ cột thép đỡ sơn trắng kem / xám sáng
    const rows = 6;
    const cols = numGables + 1;
    for (let r = 0; r < rows; r++) {
      const tz = -len / 2 + (r / (rows - 1)) * len;
      for (let c = 0; c < cols; c++) {
        const tx = -wid / 2 + (c / (cols - 1)) * wid;

        const post = new BoxGeometry(0.18, postH, 0.18);
        post.translate(tx, baseY + postH / 2, tz);
        post.rotateY(-angle);
        post.translate(cx, 0, cz);
        posts.push(post);
      }
    }

    // 4. Hàng rào song sắt trắng (White picket fence / railing) bao quanh mép nhà xe (t097s)
    const railH = 1.15;
    // Cạnh Tây (mặt tiền nhìn ra đường nội bộ)
    const railW = wid * 0.5;
    const railL = len * 0.5;

    // Thanh giằng trên và dưới
    for (const ry of [baseY + slabH + 0.15, baseY + slabH + railH]) {
      // Cạnh Tây (-wid/2)
      const topRailW = new BoxGeometry(0.04, 0.05, len - 8.0); // chừa 8m cửa ra vào
      topRailW.translate(-railW + 0.1, ry, 0);
      topRailW.rotateY(-angle);
      topRailW.translate(cx, 0, cz);
      rails.push(topRailW);

      // Cạnh Đông (+wid/2)
      const topRailE = new BoxGeometry(0.04, 0.05, len);
      topRailE.translate(railW - 0.1, ry, 0);
      topRailE.rotateY(-angle);
      topRailE.translate(cx, 0, cz);
      rails.push(topRailE);

      // Cạnh Bắc (-len/2)
      const topRailN = new BoxGeometry(wid, 0.05, 0.04);
      topRailN.translate(0, ry, -railL + 0.1);
      topRailN.rotateY(-angle);
      topRailN.translate(cx, 0, cz);
      rails.push(topRailN);

      // Cạnh Nam (+len/2)
      const topRailS = new BoxGeometry(wid, 0.05, 0.04);
      topRailS.translate(0, ry, railL - 0.1);
      topRailS.rotateY(-angle);
      topRailS.translate(cx, 0, cz);
      rails.push(topRailS);
    }

    // Các song sắt đứng dọc mép Tây (khoảng cách 0.28m)
    for (let z = -railL + 1.0; z <= railL - 1.0; z += 0.28) {
      if (Math.abs(z) < 4.0) continue; // chừa lối ra vào xe
      const picket = new BoxGeometry(0.025, railH, 0.025);
      picket.translate(-railW + 0.1, baseY + slabH + railH * 0.5, z);
      picket.rotateY(-angle);
      picket.translate(cx, 0, cz);
      rails.push(picket);
    }

    // Các song sắt đứng dọc mép Đông
    for (let z = -railL + 0.5; z <= railL - 0.5; z += 0.45) {
      const picket = new BoxGeometry(0.025, railH, 0.025);
      picket.translate(railW - 0.1, baseY + slabH + railH * 0.5, z);
      picket.rotateY(-angle);
      picket.translate(cx, 0, cz);
      rails.push(picket);
    }

    // 5. Các hàng xe máy xếp dày đặc bên trong nhà xe (t093s, t097s)
    // 4 dãy xe máy dọc theo chiều dài
    const bikeRows = [-wid * 0.35, -wid * 0.12, wid * 0.12, wid * 0.35];
    for (const bx of bikeRows) {
      for (let bz = -len * 0.44; bz <= len * 0.44; bz += 0.95) {
        // Thân xe máy (đỏ / đen)
        const bikeBody = new BoxGeometry(0.42, 0.65, 1.45);
        bikeBody.translate(bx, baseY + slabH + 0.38, bz);
        bikeBody.rotateY(-angle);
        bikeBody.translate(cx, 0, cz);
        bikes.push(bikeBody);

        // Tay lái & gương
        const bikeHandle = new BoxGeometry(0.58, 0.04, 0.12);
        bikeHandle.translate(bx, baseY + slabH + 0.82, bz - 0.45);
        bikeHandle.rotateY(-angle);
        bikeHandle.translate(cx, 0, cz);
        bikes.push(bikeHandle);
      }
    }

    // 6. Hàng cây dầu / sao đen cao vút thẳng đứng phía sau nhà xe (t093s, t097s)
    // Dọc cạnh phía Đông (+wid/2)
    const treeStartX = railW + 4.5;
    for (let tz = -len * 0.45; tz <= len * 0.45; tz += 7.2) {
      const treeH = 9.5;
      const trunk = new CylinderGeometry(0.24, 0.32, treeH * 0.6, 6);
      trunk.translate(treeStartX, (treeH * 0.6) * 0.5, tz);
      trunk.rotateY(-angle);
      trunk.translate(cx, 0, cz);
      treeWoods.push(trunk);

      // Tán cây cao hình trụ chóp nhọn thẳng đứng
      const foliage = new CylinderGeometry(0.8, 1.8, treeH * 0.65, 8);
      foliage.translate(treeStartX, treeH * 0.7, tz);
      foliage.rotateY(-angle);
      foliage.translate(cx, 0, cz);
      treeLeaves.push(foliage);
    }

    const safe = (arrGeos: BufferGeometry[]) => (arrGeos.length > 0 ? BufferGeometryUtils.mergeGeometries(arrGeos) : null);

    const mergedRoof = safe(roofs);
    const mergedPosts = safe(posts);
    const mergedFloor = safe(floors);
    const mergedRail = safe(rails);
    const mergedBikes = safe(bikes);
    const mergedTreeWoods = safe(treeWoods);
    const mergedTreeLeaves = safe(treeLeaves);

    roofs.forEach((g) => g.dispose());
    posts.forEach((g) => g.dispose());
    floors.forEach((g) => g.dispose());
    rails.forEach((g) => g.dispose());
    bikes.forEach((g) => g.dispose());
    treeWoods.forEach((g) => g.dispose());
    treeLeaves.forEach((g) => g.dispose());

    return {
      roofGeo: mergedRoof,
      postsGeo: mergedPosts,
      floorGeo: mergedFloor,
      railGeo: mergedRail,
      bikesGeo: mergedBikes,
      treesWoodGeo: mergedTreeWoods,
      treesLeavesGeo: mergedTreeLeaves,
    };
  }, []);

  return (
    <group>
      {/* 1. Sàn bê tông */}
      {floorGeo && (
        <mesh geometry={floorGeo} receiveShadow>
          <meshStandardMaterial
            color="#cbd5e1"
            roughness={0.8}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity * 0.5}
          />
        </mesh>
      )}

      {/* 2. Cột thép đỡ màu xám sáng */}
      {postsGeo && (
        <mesh geometry={postsGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#64748b" roughness={0.6} />
        </mesh>
      )}

      {/* 3. Mái tôn răng cưa màu trắng sáng (#f8fafc) đặc trưng EIU */}
      {roofGeo && (
        <mesh geometry={roofGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color="#f8fafc"
            metalness={0.15}
            roughness={0.4}
            flatShading
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}

      {/* 4. Hàng rào song sắt trắng bao quanh mép bãi xe (t097s) */}
      {railGeo && (
        <mesh geometry={railGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
        </mesh>
      )}

      {/* 5. Các hàng xe máy sinh viên đậu bên trong */}
      {bikesGeo && (
        <mesh geometry={bikesGeo} castShadow>
          <meshStandardMaterial color="#991b1b" roughness={0.6} metalness={0.3} />
        </mesh>
      )}

      {/* 6. Thân hàng cây cao phía sau */}
      {treesWoodGeo && (
        <mesh geometry={treesWoodGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#5c4033" roughness={0.9} />
        </mesh>
      )}

      {/* 7. Tán hàng cây cao phía sau (t093s, t097s) */}
      {treesLeavesGeo && (
        <mesh geometry={treesLeavesGeo} castShadow>
          <meshStandardMaterial color="#365314" roughness={0.85} />
        </mesh>
      )}
    </group>
  );
}
