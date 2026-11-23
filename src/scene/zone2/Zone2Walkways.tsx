import { useMemo } from 'react';
import { BoxGeometry, type BufferGeometry } from 'three';
import type { Vec2 } from '../../types';
import { safeMerge } from '../kit/geometryHelpers';
import Block11Details from './Block11Details';
import CampusGreenery from '../nature/CampusGreenery';

export const ZONE2_WALKWAYS: readonly { readonly points: readonly Vec2[]; readonly roofH: number; readonly width: number }[] = [
  // Hành lang mái che B9 ↔ B10 (theo đường footway OSM)
  {
    points: [
      [-118.2, -124.8],
      [-115.9, -112.7],
      [-131.1, -109.8],
      [-129.5, -102.0],
    ],
    roofH: 3.0,
    width: 2.4,
  },
  // Hành lang mái che B8 ↔ B11 (theo đường footway OSM)
  {
    points: [
      [16.1, -174.2],
      [17.7, -165.1],
      [27.9, -166.4],
      [31.4, -155.7],
    ],
    roofH: 3.0,
    width: 2.4,
  },
  // Hành lang mái che B11 ↔ B10 băng ngang trục đường giữa (ghi nhận từ ảnh tour 360)
  {
    points: [
      [-51.8, -99.5],
      [-21.0, -104.5],
    ],
    roofH: 3.45,
    width: 2.6,
  },
  // Lối đi mái che từ đuôi B11 Đông sang khu nhà xe B5
  {
    points: [
      [100.7, -144.6],
      [153.7, -152.1],
    ],
    roofH: 3.0,
    width: 2.4,
  },
  // Hành lang mái che B11 ↔ B4 (theo ảnh t017s, walk-eiu/00)
  {
    points: [
      [43.0, -132.0],
      [92.0, -96.0],
    ],
    roofH: 3.0,
    width: 2.6,
  },
];

/**
 * Hệ thống hành lang mái che khung thép phẳng mỏng, thoáng sáng tại các trục kết nối.
 * Dựng theo ảnh thực tế t017s và walk-eiu/00:
 * - Sàn bê tông lát đá mài sáng màu cao ~8cm so với mặt cỏ.
 * - Khung cột thép hộp than đen + xà ngang liên kết thanh thoát.
 * - Mái phẳng mỏng với mặt trần ghi sáng hắt sáng tốt, không bị đen đặc khi nhìn từ dưới lên.
 */
export default function Zone2Walkways() {
  const { roofGeo, postGeo, plinthGeo } = useMemo(() => {
    const roofs: BufferGeometry[] = [];
    const posts: BufferGeometry[] = [];
    const plinths: BufferGeometry[] = [];

    for (const path of ZONE2_WALKWAYS) {
      for (let s = 0; s < path.points.length - 1; s++) {
        const a = path.points[s];
        const b = path.points[s + 1];
        if (!a || !b) continue;

        const dx = b[0] - a[0];
        const dz = b[1] - a[1];
        const len = Math.hypot(dx, dz);
        if (len < 0.5) continue;

        const angle = Math.atan2(dz, dx);
        const midX = (a[0] + b[0]) * 0.5;
        const midZ = (a[1] + b[1]) * 0.5;
        const nx = -dz / len;
        const nz = dx / len;

        // 1. Sàn lối đi bê tông mài sáng màu (nâng nhẹ 8cm trên mặt cỏ)
        const rawPlinth = new BoxGeometry(len + 0.1, 0.08, path.width);
        const plinthBox = rawPlinth.index ? rawPlinth.toNonIndexed() : rawPlinth;
        plinthBox.rotateY(-angle);
        plinthBox.translate(midX, 0.02 + 0.04, midZ);
        plinths.push(plinthBox);

        // 2. Mái phẳng mỏng khung thép (dày 0.08m, mặt trần sáng)
        const rawRoof = new BoxGeometry(len + 0.3, 0.08, path.width + 0.2);
        const roofBox = rawRoof.index ? rawRoof.toNonIndexed() : rawRoof;
        roofBox.rotateY(-angle);
        roofBox.translate(midX, path.roofH + 0.04, midZ);
        roofs.push(roofBox);

        // 3. Hệ xà thép dọc 2 mép mái
        for (const side of [-1, 1]) {
          const rawBeam = new BoxGeometry(len + 0.2, 0.08, 0.08);
          const beamGeo = rawBeam.index ? rawBeam.toNonIndexed() : rawBeam;
          beamGeo.rotateY(-angle);
          beamGeo.translate(
            midX + nx * (path.width * 0.45 * side),
            path.roofH - 0.04,
            midZ + nz * (path.width * 0.45 * side)
          );
          posts.push(beamGeo);
        }

        // 4. Hàng cột thép hộp vuông thanh mảnh 0.12m & xà ngang liên kết mỗi nhịp
        const numPosts = Math.max(1, Math.floor(len / 4.8));
        for (let i = 0; i <= numPosts; i++) {
          const t = i / numPosts;
          // Bỏ bớt cột giữa đoạn băng qua đường trục B10–B11 để xe lưu thông thông thoáng
          if (path.roofH > 3.2 && t > 0.22 && t < 0.78) continue;

          const px = a[0] + dx * t;
          const pz = a[1] + dz * t;

          // Cột 2 bên
          for (const side of [-1, 1]) {
            const rawPost = new BoxGeometry(0.12, path.roofH, 0.12);
            const pGeo = rawPost.index ? rawPost.toNonIndexed() : rawPost;
            pGeo.translate(
              px + nx * (path.width * 0.45 * side),
              path.roofH * 0.5,
              pz + nz * (path.width * 0.45 * side)
            );
            posts.push(pGeo);
          }

          // Xà ngang liên kết đỉnh giữa 2 cột
          const rawCrossBeam = new BoxGeometry(0.10, 0.10, path.width);
          const crossGeo = rawCrossBeam.index ? rawCrossBeam.toNonIndexed() : rawCrossBeam;
          crossGeo.rotateY(-angle);
          crossGeo.translate(px, path.roofH - 0.05, pz);
          posts.push(crossGeo);
        }
      }
    }

    return {
      roofGeo: safeMerge(roofs),
      postGeo: safeMerge(posts),
      plinthGeo: safeMerge(plinths),
    };
  }, []);

  return (
    <group>
      {/* Sàn lối đi bê tông sáng màu */}
      {plinthGeo && (
        <mesh geometry={plinthGeo} receiveShadow>
          <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
        </mesh>
      )}
      {/* Mái phẳng mỏng trần sáng thoáng */}
      {roofGeo && (
        <mesh geometry={roofGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#e2e8f0" roughness={0.55} />
        </mesh>
      )}
      {/* Khung cột và xà thép đen thanh thoát */}
      {postGeo && (
        <mesh geometry={postGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#1e293b" roughness={0.55} metalness={0.4} />
        </mesh>
      )}
      <Block11Details />
      <CampusGreenery />
    </group>
  );
}
