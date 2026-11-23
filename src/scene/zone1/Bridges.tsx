import { useMemo } from 'react';
import { BoxGeometry, BufferGeometry, Float32BufferAttribute, DoubleSide } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BRIDGE } from '../groundLevels';
import { getOrCreateVineTexture, getOrCreateCanopyTexture, addVineCurtain, addCanopyQuad } from '../nature/vineTexture';

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
  const { deckGeo, postsGeo, roofGeo, pergolaCanopyGeo, pergolaVinesGeo } = useMemo(() => {
    const decks: BufferGeometry[] = [];
    const posts: BufferGeometry[] = [];
    const roofs: BufferGeometry[] = [];
    const pvPos: number[] = [];
    const pvNorm: number[] = [];
    const pvUvs: number[] = [];
    const pvInd: number[] = [];

    const pcPos: number[] = [];
    const pcNorm: number[] = [];
    const pcUvs: number[] = [];
    const pcInd: number[] = [];

    const deckW = 3.2;
    const deckY = BRIDGE; // Cầu nằm ngay trên mặt hồ (thành hồ 0.55m)
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

      // 4. Giàn pergola dây leo rủ hai bên thành hồ
      const pergolaW = 2.4;
      const pLen = len * 0.6;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const halfL = pLen * 0.5;
      const halfW = pergolaW * 0.5;

      for (const side of [1, -1]) {
        const sideOffset = (deckW / 2 + 1.4) * side;
        const cX = midX + nx * sideOffset;
        const cZ = midZ + nz * sideOffset;

        // 4 góc của nóc giàn
        const pFL: [number, number] = [cX - cosA * halfL + nx * halfW * side, cZ - sinA * halfL + nz * halfW * side];
        const pFR: [number, number] = [cX + cosA * halfL + nx * halfW * side, cZ + sinA * halfL + nz * halfW * side];
        const pBR: [number, number] = [cX + cosA * halfL - nx * halfW * side, cZ + sinA * halfL - nz * halfW * side];
        const pBL: [number, number] = [cX - cosA * halfL - nx * halfW * side, cZ - sinA * halfL - nz * halfW * side];

        // Mảng tán lá phủ nóc giàn
        addCanopyQuad(pcPos, pcNorm, pcUvs, pcInd, [pFL, pFR, pBR, pBL], roofTopY - 0.15);

        // Rèm dây leo buông rủ 2 bên mép dài
        const panels = 8;
        for (let k = 0; k < panels; k++) {
          const u0 = k / panels;
          const u1 = (k + 1) / panels;
          const pa: [number, number] = [pFL[0] + (pFR[0] - pFL[0]) * u0, pFL[1] + (pFR[1] - pFL[1]) * u0];
          const pb: [number, number] = [pFL[0] + (pFR[0] - pFL[0]) * u1, pFL[1] + (pFR[1] - pFL[1]) * u1];
          const drop = 0.85 + Math.sin(k * 2.3 + side) * 0.45;
          addVineCurtain(pvPos, pvNorm, pvUvs, pvInd, pa, pb, roofTopY - 0.15, drop, nx * side, nz * side, 0);
        }
      }
    });

    const mergedDeck = BufferGeometryUtils.mergeGeometries(decks);
    const mergedPosts = BufferGeometryUtils.mergeGeometries(posts);
    const mergedRoof = BufferGeometryUtils.mergeGeometries(roofs);

    const pergolaCanopyGeo = new BufferGeometry();
    pergolaCanopyGeo.setAttribute('position', new Float32BufferAttribute(pcPos, 3));
    pergolaCanopyGeo.setAttribute('normal', new Float32BufferAttribute(pcNorm, 3));
    pergolaCanopyGeo.setAttribute('uv', new Float32BufferAttribute(pcUvs, 2));
    pergolaCanopyGeo.setIndex(pcInd);

    const pergolaVinesGeo = new BufferGeometry();
    pergolaVinesGeo.setAttribute('position', new Float32BufferAttribute(pvPos, 3));
    pergolaVinesGeo.setAttribute('normal', new Float32BufferAttribute(pvNorm, 3));
    pergolaVinesGeo.setAttribute('uv', new Float32BufferAttribute(pvUvs, 2));
    pergolaVinesGeo.setIndex(pvInd);

    decks.forEach((g) => g.dispose());
    posts.forEach((g) => g.dispose());
    roofs.forEach((g) => g.dispose());

    return { deckGeo: mergedDeck, postsGeo: mergedPosts, roofGeo: mergedRoof, pergolaCanopyGeo, pergolaVinesGeo };
  }, []);

  const vineTexture = useMemo(() => getOrCreateVineTexture(), []);
  const canopyTexture = useMemo(() => getOrCreateCanopyTexture(), []);

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

      {/* Mái tán lá pergola bên thành hồ */}
      {pergolaCanopyGeo && (
        <mesh geometry={pergolaCanopyGeo} castShadow receiveShadow>
          <meshStandardMaterial
            map={canopyTexture ?? undefined}
            alphaTest={0.3}
            side={DoubleSide}
            roughness={0.85}
          />
        </mesh>
      )}

      {/* Rèm dây leo buông rủ hai bên giàn hồ */}
      {pergolaVinesGeo && (
        <mesh geometry={pergolaVinesGeo} castShadow>
          <meshStandardMaterial
            map={vineTexture ?? undefined}
            alphaTest={0.3}
            side={DoubleSide}
            roughness={0.85}
          />
        </mesh>
      )}
    </group>
  );
}
