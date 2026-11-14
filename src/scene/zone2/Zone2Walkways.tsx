import { useMemo } from 'react';
import { BoxGeometry, type BufferGeometry } from 'three';
import type { Vec2 } from '../../types';
import { safeMerge } from '../kit/geometryHelpers';
import Block11Details from './Block11Details';

const ZONE2_WALKWAYS: readonly { readonly points: readonly Vec2[]; readonly roofH: number; readonly width: number }[] = [
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
];

/**
 * Hệ thống hành lang mái che phủ dây leo xanh tại Khu vực 2 (nối B8–B11, B9–B10, B10–B11, B11–Nhà xe).
 */
export default function Zone2Walkways() {
  const { roofGeo, postGeo } = useMemo(() => {
    const roofs: BufferGeometry[] = [];
    const posts: BufferGeometry[] = [];

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
        const rawRoof = new BoxGeometry(len + 0.3, 0.2, path.width);
        const roofBox = rawRoof.index ? rawRoof.toNonIndexed() : rawRoof;
        roofBox.rotateY(-angle);
        roofBox.translate(midX, path.roofH, midZ);
        roofs.push(roofBox);

        const numPosts = Math.max(1, Math.floor(len / 5.0));
        const nx = -dz / len;
        const nz = dx / len;
        for (let i = 0; i <= numPosts; i++) {
          // Bỏ bớt cột giữa đoạn băng qua đường trục B10–B11 để xe lưu thông thông thoáng
          const t = i / numPosts;
          if (path.roofH > 3.2 && t > 0.22 && t < 0.78) continue;

          const px = a[0] + dx * t;
          const pz = a[1] + dz * t;
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
        }
      }
    }

    return {
      roofGeo: safeMerge(roofs),
      postGeo: safeMerge(posts),
    };
  }, []);

  return (
    <group>
      {roofGeo && (
        <mesh geometry={roofGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#365314" roughness={0.75} />
        </mesh>
      )}
      {postGeo && (
        <mesh geometry={postGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#334155" roughness={0.65} />
        </mesh>
      )}
      <Block11Details />
    </group>
  );
}
