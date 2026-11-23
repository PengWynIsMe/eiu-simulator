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
  makeScreenFaceGeometry,
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
 * Nội thất phòng 406.B11 theo `classrooms.json`: 40 bộ bàn/ghế/màn hình/bàn phím/case, bàn GV, bảng, máy chiếu,
 * đèn tấm, điều hòa. 8 instancedMesh = 8 draw call. Group xoay B11_ROTATION_Y nên con dùng thẳng (u, y, v).
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
      built.unit.dispose();
      built.codeTex.dispose();
    };
  }, [built]);

  if (!built) return null;
  const { plan } = built;
  return (
    <group rotation-y={B11_ROTATION_Y}>
      <Batch matrices={plan.desks} geometry={built.desk}>
        <meshStandardMaterial color="#c8a67a" roughness={0.6} />
      </Batch>
      <Batch matrices={plan.chairs} geometry={built.chair}>
        <meshStandardMaterial color="#2f3b4f" roughness={0.7} />
      </Batch>
      <Batch matrices={plan.monitors} geometry={built.monitor}>
        <meshStandardMaterial color="#111827" roughness={0.5} />
      </Batch>
      <Batch matrices={plan.faces} geometry={built.face} colors={built.faceColors}>
        <meshBasicMaterial map={built.codeTex} toneMapped={false} />
      </Batch>
      <Batch matrices={plan.keyboards} geometry={built.keyboard}>
        <meshStandardMaterial color="#1f2937" roughness={0.6} />
      </Batch>
      <Batch matrices={plan.cases} geometry={built.pcCase}>
        <meshStandardMaterial color="#374151" roughness={0.55} />
      </Batch>
      <Batch matrices={plan.lights} geometry={built.unit}>
        <meshBasicMaterial color="#fffdf0" toneMapped={false} />
      </Batch>
      <Batch matrices={built.miscMatrices} geometry={built.unit} colors={built.miscColors}>
        <meshStandardMaterial roughness={0.6} />
      </Batch>
      {phase === 'findSeat' && playerSeat && (
        <PlayerSeatHighlight u={playerSeat.u} v={playerSeat.v} />
      )}
    </group>
  );
}
