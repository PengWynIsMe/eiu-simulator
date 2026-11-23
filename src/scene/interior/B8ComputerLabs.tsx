import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Text } from '@react-three/drei';
import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  InstancedMesh,
  Matrix4,
  PlaneGeometry,
  SRGBColorSpace,
} from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { getClassroom } from '../../data';
import { useLangStore } from '../../store/useLangStore';
import { toWorld, B8_ROTATION_Y } from './layouts/b8';
import { createInstanceMatrix } from './InteriorFurniture';
import {
  makeCaseGeometry,
  makeChairGeometry,
  makeDeskGeometry,
  makeKeyboardGeometry,
  makeMonitorGeometry,
  makePendantLightGeometry,
  makeScreenFaceGeometry,
} from '../lesson/classroom406Plan';

/** Danh sách 10 phòng học cánh Bắc tầng 4 Block 8 (dãy nhìn ra nhà xe cạnh Căn tin). */
export const B8_COMPUTER_LAB_ROOMS = [
  { code: '420.B8', minU: 13.1, maxU: 22.4 },
  { code: '418.B8', minU: 22.4, maxU: 31.6 },
  { code: '416.B8', minU: 31.6, maxU: 40.8 },
  { code: '414.B8', minU: 40.8, maxU: 49.7 },
  { code: '412.B8', minU: 54.1, maxU: 63.1 },
  { code: '410.B8', minU: 63.1, maxU: 72.5 },
  { code: '408.B8', minU: 72.5, maxU: 81.9 },
  { code: '406.B8', minU: 81.9, maxU: 91.3 },
  { code: '404.B8', minU: 91.3, maxU: 100.5 },
  { code: '402.B8', minU: 100.5, maxU: 109.7 },
] as const;

/** Texture code giả hiển thị trên 320 màn hình máy tính (vẽ 1 lần bằng canvas). */
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

/** Chuỗi 7 poster thương hiệu EIU trên cửa sổ phía Bắc nhìn ra nhà xe. */
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

/** Tạo cụm 7 poster đơn vị nằm trên mặt phẳng (U, Y) tại Z=0. */
function makeUnitPostersGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const pw = 0.95;
  const ph = 0.85;
  const gap = 0.12;
  const totalW = 7 * pw + 6 * gap;
  const startX = -totalW / 2 + pw / 2;

  for (let i = 0; i < 7; i++) {
    const plane = new PlaneGeometry(pw, ph);
    plane.translate(startX + i * (pw + gap), 0, 0);
    const uvs = plane.attributes.uv;
    if (uvs) {
      const u0 = i / 7;
      const u1 = (i + 1) / 7;
      for (let j = 0; j < uvs.count; j++) {
        const origU = uvs.getX(j);
        uvs.setX(j, u0 + origU * (u1 - u0));
      }
    }
    parts.push(plane);
  }
  const merged = BufferGeometryUtils.mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  return merged ?? new PlaneGeometry();
}

interface BatchProps {
  matrices: readonly Matrix4[];
  geometry: BufferGeometry;
  children: React.ReactNode;
}

/** 1 instancedMesh = 1 draw call. */
function Batch({ matrices, geometry, children }: BatchProps) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    matrices.forEach((mat, i) => m.setMatrixAt(i, mat));
    m.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, matrices.length]} frustumCulled={false}>
      {children}
    </instancedMesh>
  );
}

/**
 * Hệ thống 10 phòng máy tính tầng 4 Block 8 (dãy cánh Bắc sát nhà xe).
 * Dựng đồng bộ theo chuẩn phòng mẫu 406.B11:
 * - Bàn dài gỗ sáng sồi (#edd9bf), chân khung kim loại mảnh (#cbd5e1).
 * - Màn hình Dell viền mỏng (#18181b) + mặt màn hình hiển thị code (makeCodeTexture).
 * - Bàn phím & chuột quang (#1f2937).
 * - Thùng máy Dell Precision đứng TRÊN BÀN (#18181b) theo từng cặp.
 * - Ghế gỗ uốn cong chân kim loại (#ebd8be).
 * - Tường trước (tường Đông): TV lớn chính giữa + 2 bảng trắng hai bên + bàn GV.
 * - Trần hở: dầm đen công nghiệp (#18181b) + đèn LED thanh thả y = 3.15 m.
 * - Cửa sổ phía Bắc: chuỗi 7 poster thương hiệu EIU nhìn ra nhà xe.
 * - Tường hành lang: biển số phòng mica song ngữ (chuẩn EIU 3 dải màu) theo useLangStore.
 * Toàn bộ 320 máy tính và 10 phòng gộp chung vào ≤ 15 draw calls.
 */
export default function B8ComputerLabs() {
  const lang = useLangStore((s) => s.lang);
  const room406Data = getClassroom('406.B11');
  const roomSpec = useMemo(
    () =>
      room406Data ?? {
        desk: { depth: 0.6, width: 1.0, height: 0.75 },
        chairSeatHeight: 0.45,
      },
    [room406Data]
  );

  // 1. Tạo các hình học và texture
  const deskGeom = useMemo(() => makeDeskGeometry(roomSpec as never), [roomSpec]);
  const chairGeom = useMemo(() => makeChairGeometry(roomSpec as never), [roomSpec]);
  const monitorGeom = useMemo(() => makeMonitorGeometry(), []);
  const screenFaceGeom = useMemo(() => makeScreenFaceGeometry(), []);
  const keyboardGeom = useMemo(() => makeKeyboardGeometry(), []);
  const pcCaseGeom = useMemo(() => makeCaseGeometry(), []);
  const pendantLightGeom = useMemo(() => makePendantLightGeometry(), []);
  const unitBoxGeom = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const unitPostersGeom = useMemo(() => makeUnitPostersGeometry(), []);

  const codeTex = useMemo(() => makeCodeTexture(), []);
  const postersTex = useMemo(() => makePostersTexture(), []);

  useEffect(() => {
    return () => {
      deskGeom.dispose();
      chairGeom.dispose();
      monitorGeom.dispose();
      screenFaceGeom.dispose();
      keyboardGeom.dispose();
      pcCaseGeom.dispose();
      pendantLightGeom.dispose();
      unitBoxGeom.dispose();
      unitPostersGeom.dispose();
      codeTex.dispose();
      postersTex.dispose();
    };
  }, [
    deskGeom,
    chairGeom,
    monitorGeom,
    screenFaceGeom,
    keyboardGeom,
    pcCaseGeom,
    pendantLightGeom,
    unitBoxGeom,
    unitPostersGeom,
    codeTex,
    postersTex,
  ]);

  // 2. Tính toán ma trận InstancedMesh cho tất cả 10 phòng
  const batches = useMemo(() => {
    const desks: Matrix4[] = [];
    const chairs: Matrix4[] = [];
    const monitors: Matrix4[] = [];
    const faces: Matrix4[] = [];
    const keyboards: Matrix4[] = [];
    const cases: Matrix4[] = [];
    const lights: Matrix4[] = [];
    const beams: Matrix4[] = [];
    const tvFrames: Matrix4[] = [];
    const tvScreens: Matrix4[] = [];
    const whiteboards: Matrix4[] = [];
    const teacherDesks: Matrix4[] = [];
    const posters: Matrix4[] = [];

    // Tọa độ biển số phòng ngoài hành lang
    const signs: Array<{ code: string; worldX: number; worldZ: number; yaw: number }> = [];
    const signYaw = -B8_ROTATION_Y; // Mặt biển hướng thẳng ra hành lang (+v, hướng Nam)

    for (const r of B8_COMPUTER_LAB_ROOMS) {
      const vCenter = -205.1;
      const frontU = r.maxU - 0.05;

      // --- Biển phòng ngoài hành lang (gắn sát tường bên cạnh cửa phòng) ---
      const [signX, signZ] = toWorld(r.minU + 2.05, -199.94);
      signs.push({
        code: r.code,
        worldX: signX,
        worldZ: signZ,
        yaw: signYaw,
      });

      // --- Tường trước (Tường Đông): TV + 2 Bảng trắng + Bàn giáo viên ---
      // Khung TV & Màn hình TV
      tvFrames.push(createInstanceMatrix(toWorld, frontU, vCenter, 2.15, 0, 0.05, 1.3, 2.2));
      tvScreens.push(createInstanceMatrix(toWorld, frontU - 0.03, vCenter, 2.15, 0, 0.02, 1.2, 2.1));

      // 2 Bảng trắng hai bên TV
      whiteboards.push(createInstanceMatrix(toWorld, frontU, -207.8, 1.7, 0, 0.03, 1.2, 2.2));
      whiteboards.push(createInstanceMatrix(toWorld, frontU, -202.4, 1.7, 0, 0.03, 1.2, 2.2));

      // Bàn giáo viên & ghế & màn hình
      teacherDesks.push(createInstanceMatrix(toWorld, r.maxU - 1.5, -203.2, 0.375, 0, 0.7, 0.75, 1.4));
      chairs.push(createInstanceMatrix(toWorld, r.maxU - 0.95, -203.2, 0, 0, 1, 1, 1));
      monitors.push(createInstanceMatrix(toWorld, r.maxU - 1.4, -203.2, 0.75, 0, 1, 1, 1));

      // --- Dầm trần đen công nghiệp (trục V) ---
      beams.push(createInstanceMatrix(toWorld, r.minU + 2.6, vCenter, 3.65, 0, 0.32, 0.28, 9.6));
      beams.push(createInstanceMatrix(toWorld, r.minU + 6.6, vCenter, 3.65, 0, 0.32, 0.28, 9.6));

      // --- 4 Dãy bàn sinh viên (4 hàng × 8 chỗ = 32 máy/phòng) ---
      const rowUs = [r.maxU - 2.8, r.maxU - 4.4, r.maxU - 6.0, r.maxU - 7.6];
      // 2 khối ghế: 4 ghế khối Bắc (v = -208.8..-205.8) và 4 ghế khối Nam (v = -204.2..-201.2)
      const seatVs = [-208.8, -207.8, -206.8, -205.8, -204.2, -203.2, -202.2, -201.2];

      for (const ru of rowUs) {
        // Đèn LED thanh treo thả trên mỗi dãy bàn
        lights.push(createInstanceMatrix(toWorld, ru, -207.3, 3.15, 0, 1, 1, 1));
        lights.push(createInstanceMatrix(toWorld, ru, -202.7, 3.15, 0, 1, 1, 1));

        for (let col = 0; col < seatVs.length; col++) {
          const sv = seatVs[col];
          if (sv === undefined) continue;

          // Bàn học (gốc tại mặt sàn)
          desks.push(createInstanceMatrix(toWorld, ru, sv, 0, 0, 1, 1, 1));

          // Ghế học sinh đặt phía sau (-u), mặt hướng về phía bảng (+u)
          chairs.push(createInstanceMatrix(toWorld, ru - 0.42, sv, 0, 0, 1, 1, 1));

          // Màn hình Dell trên bàn (y = 0.75), mặt quay về phía ghế (-u)
          monitors.push(createInstanceMatrix(toWorld, ru + 0.15, sv, 0.75, 0, 1, 1, 1));

          // Mặt sáng màn hình hiển thị code
          faces.push(createInstanceMatrix(toWorld, ru + 0.15, sv, 0.75, 0, 1, 1, 1));

          // Bàn phím & chuột
          keyboards.push(createInstanceMatrix(toWorld, ru - 0.08, sv, 0.75, 0, 1, 1, 1));

          // Thùng máy Dell Precision đặt TRÊN BÀN (ghép đôi sát nhau giữa 2 vị trí ngồi)
          const colInBlock = col % 4;
          const caseVOffset = colInBlock === 0 || colInBlock === 2 ? 0.38 : -0.38;
          cases.push(createInstanceMatrix(toWorld, ru + 0.06, sv + caseVOffset, 0.75, 0, 1, 1, 1));
        }
      }

      // --- Cụm poster EIU trên cửa sổ kính hướng Bắc (nhìn ra nhà xe) ---
      const midU = (r.minU + r.maxU) * 0.5;
      posters.push(createInstanceMatrix(toWorld, midU, -210.12, 2.95, 0, 1, 1, 1));
    }

    return {
      desks,
      chairs,
      monitors,
      faces,
      keyboards,
      cases,
      lights,
      beams,
      tvFrames,
      tvScreens,
      whiteboards,
      teacherDesks,
      posters,
      signs,
    };
  }, []);

  return (
    <group>
      {/* 1. Bàn sinh viên gỗ sáng sồi */}
      <Batch matrices={batches.desks} geometry={deskGeom}>
        <meshStandardMaterial color="#edd9bf" roughness={0.45} />
      </Batch>

      {/* 2. Ghế gỗ uốn cong khung kim loại */}
      <Batch matrices={batches.chairs} geometry={chairGeom}>
        <meshStandardMaterial color="#ebd8be" roughness={0.5} />
      </Batch>

      {/* 3. Màn hình Dell đen */}
      <Batch matrices={batches.monitors} geometry={monitorGeom}>
        <meshStandardMaterial color="#18181b" roughness={0.5} />
      </Batch>

      {/* 4. Mặt sáng màn hình hiển thị code */}
      <Batch matrices={batches.faces} geometry={screenFaceGeom}>
        <meshBasicMaterial map={codeTex} toneMapped={false} />
      </Batch>

      {/* 5. Bàn phím & chuột quang */}
      <Batch matrices={batches.keyboards} geometry={keyboardGeom}>
        <meshStandardMaterial color="#1f2937" roughness={0.6} />
      </Batch>

      {/* 6. Thùng máy Dell Precision trên bàn */}
      <Batch matrices={batches.cases} geometry={pcCaseGeom}>
        <meshStandardMaterial color="#18181b" roughness={0.5} />
      </Batch>

      {/* 7. Đèn LED treo thả phát sáng */}
      <Batch matrices={batches.lights} geometry={pendantLightGeom}>
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={2.5}
          roughness={0.2}
          toneMapped={false}
        />
      </Batch>

      {/* 8. Dầm trần đen công nghiệp */}
      <Batch matrices={batches.beams} geometry={unitBoxGeom}>
        <meshStandardMaterial color="#18181b" roughness={0.8} />
      </Batch>

      {/* 9. Khung TV tường trước */}
      <Batch matrices={batches.tvFrames} geometry={unitBoxGeom}>
        <meshStandardMaterial color="#0f172a" roughness={0.3} />
      </Batch>

      {/* 10. Màn hình TV trung tâm */}
      <Batch matrices={batches.tvScreens} geometry={unitBoxGeom}>
        <meshStandardMaterial color="#1e3a8a" emissive="#1e3a8a" emissiveIntensity={0.6} roughness={0.2} />
      </Batch>

      {/* 11. Bảng trắng hai bên TV */}
      <Batch matrices={batches.whiteboards} geometry={unitBoxGeom}>
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </Batch>

      {/* 12. Bàn giáo viên */}
      <Batch matrices={batches.teacherDesks} geometry={unitBoxGeom}>
        <meshStandardMaterial color="#edd9bf" roughness={0.45} />
      </Batch>

      {/* 13. Poster thương hiệu EIU trên cửa sổ phía Bắc */}
      <Batch matrices={batches.posters} geometry={unitPostersGeom}>
        <meshBasicMaterial map={postersTex} side={DoubleSide} />
      </Batch>

      {/* 14. Biển số phòng mica 3 dải màu chuẩn EIU gắn tường hành lang (song ngữ tự động đổi theo useLangStore) */}
      {batches.signs.map((sign) => (
        <group key={sign.code} position={[sign.worldX, 1.9, sign.worldZ]} rotation-y={sign.yaw}>
          {/* Dải 1: Xanh lá EIU */}
          <mesh position={[0, 0.16, 0.02]}>
            <boxGeometry args={[0.38, 0.12, 0.02]} />
            <meshStandardMaterial color="#15803d" roughness={0.3} />
          </mesh>
          <Text position={[0, 0.16, 0.035]} fontSize={0.05} color="#ffffff" anchorX="center" anchorY="middle">
            EIU
          </Text>

          {/* Dải 2: Cam mang số phòng (vd 406.B8) */}
          <mesh position={[0, 0.04, 0.02]}>
            <boxGeometry args={[0.38, 0.12, 0.02]} />
            <meshStandardMaterial color="#ea580c" roughness={0.3} />
          </mesh>
          <Text position={[0, 0.04, 0.035]} fontSize={0.065} color="#ffffff" anchorX="center" anchorY="middle">
            {sign.code}
          </Text>

          {/* Dải 3: Xanh navy mang phụ đề song ngữ */}
          <mesh position={[0, -0.1, 0.02]}>
            <boxGeometry args={[0.38, 0.16, 0.02]} />
            <meshStandardMaterial color="#1e293b" roughness={0.3} />
          </mesh>
          <Text
            position={[0, -0.1, 0.035]}
            fontSize={0.032}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            textAlign="center"
          >
            {lang === 'vi' ? 'PHÒNG MÁY TÍNH\nComputer Lab' : 'COMPUTER LAB\nPhòng máy tính'}
          </Text>
        </group>
      ))}
    </group>
  );
}
