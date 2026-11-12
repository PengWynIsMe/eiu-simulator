import { useMemo } from 'react';
import { BoxGeometry, BufferGeometry } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Cổng chính mới dạng vòm cung thấp (tạm theo dấu vệ tinh ve-tinh-khu-cong-2026.png).
 * Được tách riêng vào file này để dễ dàng thay thế khi có hình ảnh thực tế của cổng mới.
 */
interface MainGateProps {
  isHovered?: boolean;
  isSelected?: boolean;
}

export default function MainGate({ isHovered, isSelected }: MainGateProps) {
  const emissiveColor = isSelected ? '#60a5fa' : isHovered ? '#38bdf8' : '#000000';
  const emissiveIntensity = isSelected ? 0.35 : isHovered ? 0.2 : 0;
  const { archGeo, pillarsGeo } = useMemo(() => {
    const archBoxes: BufferGeometry[] = [];
    const pillarBoxes: BufferGeometry[] = [];

    // Vòm cung cong nhẹ từ [254, -60] tới [275, 8] bao phủ 4 làn vào từ Nam Kỳ Khởi Nghĩa
    const startX = 254.0;
    const startZ = -59.7;
    const endX = 275.6;
    const endZ = 6.4;
    const numSegments = 16;
    const arcHeight = 6.2; // Độ cao cổng vòm ~6.2m
    const beamThickness = 0.9;
    const beamDepth = 2.4;

    const points: [number, number][] = [];
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      // Đường cong hình cung nhẹ nhô về phía Đông (Nam Kỳ Khởi Nghĩa)
      const curveOffset = Math.sin(t * Math.PI) * 4.5;
      const x = startX + (endX - startX) * t + curveOffset;
      const z = startZ + (endZ - startZ) * t;
      points.push([x, z]);
    }

    // Dựng xà vòm cung trên cao
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      if (!p1 || !p2) continue;

      const dx = p2[0] - p1[0];
      const dz = p2[1] - p1[1];
      const len = Math.hypot(dx, dz);
      const angle = Math.atan2(dz, dx);
      const midX = (p1[0] + p2[0]) / 2;
      const midZ = (p1[1] + p2[1]) / 2;

      const beam = new BoxGeometry(len + 0.1, beamThickness, beamDepth);
      beam.rotateY(-angle);
      beam.translate(midX, arcHeight, midZ);
      archBoxes.push(beam);
    }

    // Các trụ đỡ chính ở hai đầu và giữa các làn xe
    const pillarIndices = [0, 4, 8, 12, 16];
    pillarIndices.forEach((idx) => {
      const pt = points[idx];
      if (!pt) return;
      const pillar = new BoxGeometry(1.4, arcHeight, 1.8);
      pillar.translate(pt[0], arcHeight / 2, pt[1]);
      pillarBoxes.push(pillar);
    });

    const mergedArch = BufferGeometryUtils.mergeGeometries(archBoxes);
    const mergedPillars = BufferGeometryUtils.mergeGeometries(pillarBoxes);

    archBoxes.forEach((g) => g.dispose());
    pillarBoxes.forEach((g) => g.dispose());

    return { archGeo: mergedArch, pillarsGeo: mergedPillars };
  }, []);

  return (
    <group>
      {/* Các trụ cổng */}
      <mesh geometry={pillarsGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color="#64748b"
          roughness={0.7}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Vòm cung cổng màu sáng */}
      <mesh geometry={archGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color="#e2e8f0"
          roughness={0.5}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity * 0.7}
        />
      </mesh>
    </group>
  );
}
