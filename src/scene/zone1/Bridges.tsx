import { useMemo } from 'react';
import { BoxGeometry, BufferGeometry } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

interface BridgeLine {
  start: [number, number];
  end: [number, number];
}

const BRIDGES: BridgeLine[] = [
  // Cầu 1 (phía Đông): [123, -72.6] → [134.7, 38.4]
  { start: [123, -72.6], end: [134.7, 38.4] },
  // Cầu 2 (phía Tây): [106.8, -70.8] → [118.5, 40.1]
  { start: [106.8, -70.8], end: [118.5, 40.1] },
];

export default function Bridges() {
  const { deckGeo, postsGeo, roofGeo, pergolaGeo } = useMemo(() => {
    const decks: BufferGeometry[] = [];
    const posts: BufferGeometry[] = [];
    const roofs: BufferGeometry[] = [];
    const pergolas: BufferGeometry[] = [];

    const deckW = 3.2;
    const deckY = 0.8; // Cầu nằm ngay trên mặt hồ (thành hồ 0.75m)
    const roofH = 3.2;
    const roofTopY = deckY + roofH;

    BRIDGES.forEach((b) => {
      const dx = b.end[0] - b.start[0];
      const dz = b.end[1] - b.start[1];
      const len = Math.hypot(dx, dz);
      const angle = Math.atan2(dz, dx);
      const midX = (b.start[0] + b.end[0]) / 2;
      const midZ = (b.start[1] + b.end[1]) / 2;
      const nx = -dz / len;
      const nz = dx / len;

      // 1. Sàn cầu đi bộ (bê tông xám nhạt / gỗ phiến)
      const deck = new BoxGeometry(len, 0.12, deckW);
      deck.rotateY(-angle);
      deck.translate(midX, deckY, midZ);
      decks.push(deck);

      // 2. Mái tôn xanh dương đặc trưng của 2 cây cầu EIU
      const roof = new BoxGeometry(len, 0.1, deckW + 0.5);
      roof.rotateY(-angle);
      roof.translate(midX, roofTopY, midZ);
      roofs.push(roof);

      // 3. Hệ cột thép đen và xà ngang hai bên cầu
      const numBays = Math.floor(len / 4);
      for (let i = 0; i <= numBays; i++) {
        const t = i / numBays - 0.5;
        const px = midX + Math.cos(angle) * (t * len);
        const pz = midZ + Math.sin(angle) * (t * len);

        // Cột bên trái
        const postLeft = new BoxGeometry(0.14, roofH, 0.14);
        postLeft.translate(px + nx * (deckW / 2), deckY + roofH / 2, pz + nz * (deckW / 2));
        posts.push(postLeft);

        // Cột bên phải
        const postRight = new BoxGeometry(0.14, roofH, 0.14);
        postRight.translate(px - nx * (deckW / 2), deckY + roofH / 2, pz - nz * (deckW / 2));
        posts.push(postRight);

        // Xà ngang đỉnh
        const beam = new BoxGeometry(0.12, 0.12, deckW);
        beam.rotateY(-angle);
        beam.translate(px, roofTopY - 0.06, pz);
        posts.push(beam);
      }

      // 4. Giàn pergola dây leo xanh mát chạy dọc hai bên thành hồ
      const pergolaW = 2.4;
      const pergLeft = new BoxGeometry(len * 0.6, 0.35, pergolaW);
      pergLeft.rotateY(-angle);
      pergLeft.translate(midX + nx * (deckW / 2 + 1.4), roofTopY - 0.2, midZ + nz * (deckW / 2 + 1.4));
      pergolas.push(pergLeft);

      const pergRight = new BoxGeometry(len * 0.6, 0.35, pergolaW);
      pergRight.rotateY(-angle);
      pergRight.translate(midX - nx * (deckW / 2 + 1.4), roofTopY - 0.2, midZ - nz * (deckW / 2 + 1.4));
      pergolas.push(pergRight);
    });

    const mergedDeck = BufferGeometryUtils.mergeGeometries(decks);
    const mergedPosts = BufferGeometryUtils.mergeGeometries(posts);
    const mergedRoof = BufferGeometryUtils.mergeGeometries(roofs);
    const mergedPergola = BufferGeometryUtils.mergeGeometries(pergolas);

    decks.forEach((g) => g.dispose());
    posts.forEach((g) => g.dispose());
    roofs.forEach((g) => g.dispose());
    pergolas.forEach((g) => g.dispose());

    return { deckGeo: mergedDeck, postsGeo: mergedPosts, roofGeo: mergedRoof, pergolaGeo: mergedPergola };
  }, []);

  return (
    <group>
      {/* Sàn cầu đi bộ */}
      <mesh geometry={deckGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
      </mesh>

      {/* Khung thép cột đen */}
      <mesh geometry={postsGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>

      {/* Mái tôn màu xanh dương đặc trưng nối Block 4 ↔ Block 3 */}
      <mesh geometry={roofGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#1d70b8" metalness={0.25} roughness={0.45} />
      </mesh>

      {/* Mái vòm dây leo xanh */}
      <mesh geometry={pergolaGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#2d6a2e" roughness={0.8} />
      </mesh>
    </group>
  );
}
