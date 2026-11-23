import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BoxGeometry, CanvasTexture, Color, MeshStandardMaterial, SRGBColorSpace, type BufferGeometry, type InstancedMesh, type Matrix4 } from 'three';
import { getClassroom } from '../../data';
import { useLessonStore } from '../../store/useLessonStore';
import { B11_ROTATION_Y } from '../interior/layouts/b11';
import {
  buildClassroom406Plan,
  makeCaseGeometry,
  makeChairGeometry,
  makeDeskGeometry,
  makeKeyboardGeometry,
  makeMonitorGeometry,
  makePendantLightGeometry,
  makePostersGeometry,
  makeScreenFaceGeometry,
  WOOD_LIGHT,
  CHAIR_WOOD,
  BEAM_BLACK,
} from './classroom406Plan';

/** Texture code giả (dùng chung cho 40 màn) — vẽ 1 lần bằng canvas. */
function makeCodeTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 160;
  const g = c.getContext('2d');
  if (g) {
    g.fillStyle = '#0f172a';
    g.fillRect(0, 0, 256, 160);
    g.fillStyle = '#1e293b';
    g.fillRect(0, 0, 256, 12);
    const colors = ['#7dd3fc', '#a7f3d0', '#fde68a', '#fca5a5', '#c4b5fd'];
    for (let i = 0; i < 12; i++) {
      const indent = (i * 7) % 3 === 0 ? 0 : 18 + ((i * 5) % 2) * 18;
      const len = 40 + ((i * 53) % 130);
      g.fillStyle = colors[(i * 3) % colors.length] ?? '#7dd3fc';
      g.fillRect(12 + indent, 24 + i * 11, len, 5);
    }
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/** 7 poster slogan thương hiệu EIU trên cửa sổ phía Bắc — vẽ 1 lần bằng canvas. */
function makePostersTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 384;
  const g = c.getContext('2d');
  if (g) {
    const w = 1024 / 7;
    const posters = [
      { bg: '#581c87', title: 'EIU', lines: ['Turning IDEAS', 'into REALITY'] },
      { bg: '#15803d', title: 'EIU', lines: ['Design FUTURE', 'with EXCELLENCE'] },
      { bg: '#b91c1c', title: 'EIU', lines: ['CREATE, ENHANCE,', 'and SUSTAIN'] },
      { bg: '#ea580c', title: 'EIU', lines: ['Making it', 'HAPPEN'] },
      { bg: '#172554', title: 'EIU', lines: ['ĐẠI HỌC QUỐC TẾ', 'MIỀN ĐÔNG'] },
      { bg: '#b91c1c', title: 'EIU', lines: ['DESIGN IT', 'and BUILD IT'] },
      { bg: '#0284c7', title: 'EIU', lines: ['Applied AI', 'for Business'] },
    ];
    posters.forEach((p, idx) => {
      const x = idx * w;
      g.fillStyle = p.bg;
      g.fillRect(x + 2, 2, w - 4, 380);

      g.fillStyle = '#ffffff';
      g.font = 'bold 22px sans-serif';
      g.textAlign = 'center';
      g.fillText(p.title, x + w / 2, 50);

      g.fillStyle = 'rgba(255, 255, 255, 0.4)';
      g.fillRect(x + 16, 65, w - 32, 2);

      g.fillStyle = '#ffffff';
      g.font = 'bold 15px sans-serif';
      const startY = 140;
      p.lines.forEach((line, lIdx) => {
        g.fillText(line, x + w / 2, startY + lIdx * 30);
      });
    });
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

interface BatchProps {
  matrices: readonly Matrix4[];
  geometry: BufferGeometry;
  children: React.ReactNode;
  colors?: readonly Color[];
}

/** 1 instancedMesh = 1 draw call. Ma trận chỉ ghi 1 lần khi mount. */
function Batch({ matrices, geometry, children, colors }: BatchProps) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    matrices.forEach((mat, i) => m.setMatrixAt(i, mat));
    colors?.forEach((c, i) => m.setColorAt(i, c));
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [matrices, colors]);
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, matrices.length]} frustumCulled={false}>
      {children}
    </instancedMesh>
  );
}

/** Viền sáng nhấp nháy cho ghế người chơi trong pha findSeat. */
function PlayerSeatHighlight({ u, v }: { u: number; v: number }) {
  const matRef = useRef<MeshStandardMaterial>(null);
  useFrame((state) => {
    if (matRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 5) * 0.5 + 0.9;
      matRef.current.emissiveIntensity = pulse * 1.5;
    }
  });
  return (
    <group position={[u, 0, v]}>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.5, 0.08, 0.5]} />
        <meshStandardMaterial
          ref={matRef}
          color="#f5b700"
          emissive="#f5b700"
          emissiveIntensity={1.2}
          wireframe
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}

/**
 * Nội thất phòng 406.B11 theo ảnh thật EIU phong-may-1 và phong-may-2:
 * - 4 dãy bàn dài gỗ sáng màu hướng về phía tường Đông (TV + 2 bảng trắng).
 * - 40 ghế gỗ sáng uốn cong, chân kim loại mảnh cố định (không bánh xe).
 * - Màn hình Dell đen, bàn phím chuột đen, thùng máy Dell Precision đen đặt TRÊN bàn.
 * - Trần hở lộ dầm đen, đèn LED thanh dài treo thả, máy lạnh cassette 4 hướng.
 * - Dãy poster thương hiệu EIU trên kính cửa sổ phía Bắc.
 * - Toàn bộ gom trong ≤ 10 draw calls nhờ instancedMesh.
 */
export default function Classroom406() {
  const room = getClassroom('406.B11');
  const phase = useLessonStore((s) => s.phase);
  const playerSeat = room?.seats.find((s) => s.id === room.playerSeat);
  const built = useMemo(() => {
    if (!room) return null;
    const plan = buildClassroom406Plan(room);
    return {
      plan,
      desk: makeDeskGeometry(room),
      chair: makeChairGeometry(room),
      monitor: makeMonitorGeometry(),
      face: makeScreenFaceGeometry(),
      keyboard: makeKeyboardGeometry(),
      pcCase: makeCaseGeometry(),
      pendantLight: makePendantLightGeometry(),
      postersGeom: makePostersGeometry(),
      postersTex: makePostersTexture(),
      unit: new BoxGeometry(1, 1, 1),
      faceColors: plan.faceBrightness.map((b) => new Color(b, b, b)),
      miscColors: plan.misc.map((m) => new Color(m.color)),
      miscMatrices: plan.misc.map((m) => m.matrix),
      codeTex: makeCodeTexture(),
    };
  }, [room]);

  useEffect(() => {
    if (!built) return;
    return () => {
      built.desk.dispose();
      built.chair.dispose();
      built.monitor.dispose();
      built.face.dispose();
      built.keyboard.dispose();
      built.pcCase.dispose();
      built.pendantLight.dispose();
      built.postersGeom.dispose();
      built.postersTex.dispose();
      built.unit.dispose();
      built.codeTex.dispose();
    };
  }, [built]);

  if (!built) return null;
  const { plan } = built;
  return (
    <group rotation-y={B11_ROTATION_Y}>
      {/* 1. Bàn sinh viên gỗ sáng màu (be gỗ sồi) */}
      <Batch matrices={plan.desks} geometry={built.desk}>
        <meshStandardMaterial color={WOOD_LIGHT} roughness={0.45} />
      </Batch>

      {/* 2. Ghế gỗ uốn cong khung kim loại sáng (không bánh xe) */}
      <Batch matrices={plan.chairs} geometry={built.chair}>
        <meshStandardMaterial color={CHAIR_WOOD} roughness={0.5} />
      </Batch>

      {/* 3. Màn hình Dell đen */}
      <Batch matrices={plan.monitors} geometry={built.monitor}>
        <meshStandardMaterial color={BEAM_BLACK} roughness={0.5} />
      </Batch>

      {/* 4. Mặt màn hình sáng hiển thị code */}
      <Batch matrices={plan.faces} geometry={built.face} colors={built.faceColors}>
        <meshBasicMaterial map={built.codeTex} toneMapped={false} />
      </Batch>

      {/* 5. Bàn phím & chuột quang đen */}
      <Batch matrices={plan.keyboards} geometry={built.keyboard}>
        <meshStandardMaterial color="#1f2937" roughness={0.6} />
      </Batch>

      {/* 6. Thùng máy Dell Precision đen TRÊN BÀN */}
      <Batch matrices={plan.cases} geometry={built.pcCase}>
        <meshStandardMaterial color="#18181b" roughness={0.5} />
      </Batch>

      {/* 7. Đèn LED treo thả phát sáng trắng cool-white (emissive) */}
      <Batch matrices={plan.lights} geometry={built.pendantLight}>
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={2.5}
          roughness={0.2}
          toneMapped={false}
        />
      </Batch>

      {/* 8. Nội thất phụ: TV frame, 2 bảng trắng, bàn GV, dầm trần đen, điều hòa cassette, ốp tường bê tông */}
      <Batch matrices={built.miscMatrices} geometry={built.unit} colors={built.miscColors}>
        <meshStandardMaterial roughness={0.6} />
      </Batch>

      {/* 9. Chuỗi 7 poster thương hiệu EIU trên cửa sổ kính phía Bắc */}
      <mesh geometry={built.postersGeom}>
        <meshBasicMaterial map={built.postersTex} toneMapped={false} />
      </mesh>

      {/* 10. Viền sáng nhấp nháy cho ghế người chơi trong pha tìm chỗ */}
      {phase === 'findSeat' && playerSeat && (
        <PlayerSeatHighlight u={playerSeat.u} v={playerSeat.v} />
      )}
    </group>
  );
}
