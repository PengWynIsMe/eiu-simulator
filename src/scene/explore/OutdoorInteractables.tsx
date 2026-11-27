import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { NOTICE_BOARD_POS } from '../../data/explore';
import { useExploreStore } from '../../store/useExploreStore';
import { useWalkStore } from '../../store/useWalkStore';
import { getStreetLayout } from '../street/streetLayout';
import { getGroundHeight } from '../walk/groundHeight';

function createNoticeBoardTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#0b3d91';
    ctx.fillRect(14, 14, 484, 52);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 26px Arial, sans-serif';
    ctx.fillText('BẢNG TIN EIU · CAMPUS NEWS', 256, 48);

    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(22, 82, 220, 148);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(268, 82, 220, 148);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 17px Arial, sans-serif';
    ctx.fillText('Săn 10 điểm mốc EIU', 132, 118);
    ctx.fillText('Xe điện & Xe đạp', 378, 118);

    ctx.font = '14px Arial, sans-serif';
    ctx.fillText('Mở Bản đồ (M) để', 132, 152);
    ctx.fillText('xem đường dẫn vàng', 132, 174);
    ctx.fillText('Dùng nút góc phải', 378, 152);
    ctx.fillText('hoặc bấm E tại trạm', 378, 174);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export default function OutdoorInteractables() {
  const benches = useMemo(() => getStreetLayout().benches, []);
  const boardY = useMemo(() => getGroundHeight(NOTICE_BOARD_POS[0], NOTICE_BOARD_POS[1]), []);
  const boardTex = useMemo(() => createNoticeBoardTexture(), []);
  useEffect(() => () => boardTex.dispose(), [boardTex]);

  const checkTimer = useRef(0);

  useFrame((_, delta) => {
    checkTimer.current += Math.min(delta, 0.1);
    if (checkTimer.current < 0.2) return;
    checkTimer.current = 0;

    const ws = useWalkStore.getState();
    const es = useExploreStore.getState();
    if (!ws.walkMode || ws.interior || es.shuttleActive) {
      es.setNearbyBench(null);
      es.setNearbyNoticeBoard(false);
      return;
    }

    const px = ws.playerPos.x;
    const pz = ws.playerPos.z;

    let bestBench: number | null = null;
    let bestDist = 2.8;
    for (let i = 0; i < benches.length; i++) {
      const b = benches[i];
      if (!b) continue;
      const d = Math.hypot(px - b.x, pz - b.z);
      if (d < bestDist) {
        bestDist = d;
        bestBench = i;
      }
    }
    es.setNearbyBench(bestBench);

    const dBoard = Math.hypot(px - NOTICE_BOARD_POS[0], pz - NOTICE_BOARD_POS[1]);
    es.setNearbyNoticeBoard(dBoard <= 3.6);
  });

  return (
    <group position={[NOTICE_BOARD_POS[0], boardY, NOTICE_BOARD_POS[1]]} rotation={[0, -0.55, 0]}>
      {/* Hai trụ bảng tin */}
      <mesh position={[-1.05, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 2.3, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
      <mesh position={[1.05, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 2.3, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
      {/* Mái che nhỏ */}
      <mesh position={[0, 2.35, 0]} castShadow>
        <boxGeometry args={[2.55, 0.1, 0.45]} />
        <meshStandardMaterial color="#0b3d91" roughness={0.5} />
      </mesh>
      {/* Khung bảng */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[2.3, 1.25, 0.1]} />
        <meshStandardMaterial color="#475569" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.6, 0.055]}>
        <planeGeometry args={[2.1, 1.05]} />
        <meshStandardMaterial map={boardTex} roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.6, -0.055]} rotation-y={Math.PI}>
        <planeGeometry args={[2.1, 1.05]} />
        <meshStandardMaterial map={boardTex} roughness={0.45} />
      </mesh>
    </group>
  );
}
