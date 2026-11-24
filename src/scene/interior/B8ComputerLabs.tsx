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
import { getStage } from '../../data/silver/stages';
import { useActivityStore } from '../../store/useActivityStore';
import { useLangStore } from '../../store/useLangStore';
import { useSilverStore } from '../../store/useSilverStore';
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
  WOOD_LIGHT,
  CHAIR_WOOD,
  METAL_FRAME,
  BEAM_BLACK,
  WHITEBOARD_SURFACE,
  TV_FRAME,
  AC_WHITE,
  AC_GRILL,
  WINDOW_GLASS_BLUE,
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

  if (matrices.length === 0) return null;

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, matrices.length]} frustumCulled={false}>
      {children}
    </instancedMesh>
  );
}

/**
 * Hệ thống 10 phòng máy tính tầng 4 Block 8 (dãy cánh Bắc sát nhà xe).
 * Dựng đồng bộ theo chuẩn phòng mẫu 406.B11 hoàn thiện trên main:
 * - Tường xám nhạt vân bê tông mộc (#abaaa5) cho tường trước, tường sau, tường hành lang và bậu cửa sổ.
 * - Trần bê tông xám nhạt (#abaaa5) phẳng sạch + 2 máy lạnh cassette âm trần 4 hướng (#f8fafc + #64748b).
 * - Bàn dài gỗ sáng sồi (#edd9bf), chân khung kim loại mảnh (#cbd5e1).
 * - Ghế gỗ uốn cong sồi (#ebd8be) chân kim loại cố định.
 * - Màn hình Dell viền mỏng (#18181b) + mặt màn hình hiển thị code (makeCodeTexture).
 * - Bàn phím & chuột quang (#1f2937).
 * - Thùng máy Dell Precision đứng TRÊN BÀN (#18181b) theo từng cặp.
 * - Tường trước (tường Đông): TV lớn trung tâm + 2 bảng trắng sáng khung nhôm + bàn GV gỗ sồi sáng.
 * - Hệ dầm trần đen công nghiệp (#18181b) + đèn LED thanh thả y = 3.15 m phát sáng trắng (emissive).
 * - Cửa sổ phía Bắc: chuỗi 7 poster thương hiệu EIU nhìn ra nhà xe + kính xanh sáng đón nắng.
 * - Tường hành lang: biển số phòng mica song ngữ (chuẩn EIU 3 dải màu) theo useLangStore.
 * - Ambient sáng tự nhiên làm bừng sáng toàn bộ không gian phòng máy.
 * Toàn bộ 320 máy tính và 10 phòng gộp chung vào ≤ 18 draw calls.
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

  // 1. Tạo các hình học và texture dùng lại từ 406
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

  // Đọc trạng thái hoạt động Silver để chỉ bỏ tvScreens khi phòng đang là sân khấu
  const isSilverActive = useActivityStore((s) => s.activity?.source === 'silver');
  const stageRoomCode = useSilverStore((s) => {
    const item = s.play?.item;
    return item?.scene?.id ? getStage(item.scene.id)?.roomCode : null;
  });

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
    const concreteSurfaces: Matrix4[] = []; // Trần và 4 mảng tường ốp bê tông xám nhạt #abaaa5
    const acCases: Matrix4[] = []; // Vỏ ngoài máy lạnh cassette trắng #f8fafc
    const acGrilles: Matrix4[] = []; // Lưới hút gió cassette xám chìm #64748b
    const tvFrames: Matrix4[] = []; // Khung viền TV đen
    const tvScreens: Matrix4[] = []; // Màn hình TV slide
    const whiteboards: Matrix4[] = []; // Mặt bảng trắng tinh khiết
    const metalFrames: Matrix4[] = []; // Khung nhôm bảng trắng, máng bút, chân bàn GV, đố cửa sổ
    const teacherDesks: Matrix4[] = []; // Mặt bàn giáo viên gỗ sồi sáng
    const windowGlass: Matrix4[] = []; // Kính đón sáng xanh nhạt phía Bắc
    const posters: Matrix4[] = [];

    // Tọa độ biển số phòng ngoài hành lang
    const signs: Array<{ code: string; worldX: number; worldZ: number; yaw: number }> = [];
    const signYaw = -B8_ROTATION_Y; // Mặt biển hướng thẳng ra hành lang (+v, hướng Nam)

    for (const r of B8_COMPUTER_LAB_ROOMS) {
      const vCenter = -205.1;
      const roomDepth = 10.1; // từ v = -210.15 đến -200.05
      const roomWidth = r.maxU - r.minU;
      const roomMidU = (r.minU + r.maxU) * 0.5;

      // --- Biển phòng ngoài hành lang (gắn sát tường bên cạnh cửa phòng) ---
      const [signX, signZ] = toWorld(r.minU + 2.05, -199.94);
      signs.push({
        code: r.code,
        worldX: signX,
        worldZ: signZ,
        yaw: signYaw,
      });

      // --- 1. ỐP TƯỜNG & TRẦN BÊ TÔNG XÁM SÁNG THEO CHUẨN PHÒNG LAB ---
      // Tường ngăn B8 dày 0.2 m (tâm r.maxU và r.minU) -> mép trong phòng ở r.maxU - 0.10 và r.minU + 0.10
      // Tường hành lang dày 0.2 m (tâm v = -200.0) -> mép trong phòng ở v = -200.10
      // Đặt các mảng ốp áp sát mặt trong để che hoàn toàn tường nâu #42322c mà không bị chìm hay z-fighting

      // A. Trần bê tông xám nhạt (y = 3.79 m, phủ toàn bộ phòng)
      concreteSurfaces.push(
        createInstanceMatrix(toWorld, roomMidU, vCenter, 3.79, 0, roomWidth - 0.22, 0.02, roomDepth)
      );

      // B. Tường trước (Tường Đông, u = r.maxU): Ốp bê tông trắng xám sáng che tường nâu
      concreteSurfaces.push(
        createInstanceMatrix(toWorld, r.maxU - 0.105, vCenter, 1.89, 0, 0.02, 3.78, roomDepth)
      );

      // C. Tường sau (Tây, u = r.minU): Ốp bê tông trắng xám sáng che tường nâu
      concreteSurfaces.push(
        createInstanceMatrix(toWorld, r.minU + 0.105, vCenter, 1.89, 0, 0.02, 3.78, roomDepth)
      );

      // D. Tường hành lang phía Nam (v = -200.11): Ốp bê tông trắng xám sáng trong phòng, chừa cửa
      // Đoạn Tây cửa 1 (u = r.minU + 0.1 .. r.minU + 0.6)
      concreteSurfaces.push(
        createInstanceMatrix(toWorld, r.minU + 0.35, -200.11, 1.89, 0, 0.5, 3.78, 0.02)
      );
      // Đoạn giữa 2 cửa (u = r.minU + 1.6 .. r.maxU - 1.6)
      const midWallLen = Math.max(0.1, roomWidth - 3.2);
      concreteSurfaces.push(
        createInstanceMatrix(toWorld, roomMidU, -200.11, 1.89, 0, midWallLen, 3.78, 0.02)
      );
      // Đoạn Đông cửa 2 (u = r.maxU - 0.6 .. r.maxU - 0.1)
      concreteSurfaces.push(
        createInstanceMatrix(toWorld, r.maxU - 0.35, -200.11, 1.89, 0, 0.5, 3.78, 0.02)
      );
      // Lanh-tô trên 2 cửa (y = 2.4 .. 3.78, cao 1.38, tâm 3.09)
      concreteSurfaces.push(
        createInstanceMatrix(toWorld, r.minU + 1.1, -200.11, 3.09, 0, 1.0, 1.38, 0.02)
      );
      concreteSurfaces.push(
        createInstanceMatrix(toWorld, r.maxU - 1.1, -200.11, 3.09, 0, 1.0, 1.38, 0.02)
      );

      // E. Tường Bắc dưới bậu cửa sổ (v = -210.12, cao 0.85 m, tâm 0.425)
      concreteSurfaces.push(
        createInstanceMatrix(toWorld, roomMidU, -210.12, 0.425, 0, roomWidth - 0.22, 0.85, 0.06)
      );

      // --- 2. MÁY LẠNH ÂM TRẦN CASSETTE 4 HƯỚNG THỔI (CEILING CASSETTE AC) ---
      // 2 máy lạnh mỗi phòng bố trí cân đối hai bên
      for (const acU of [r.minU + roomWidth * 0.33, r.minU + roomWidth * 0.67]) {
        // Vỏ ngoài cassette trắng AC_WHITE
        acCases.push(createInstanceMatrix(toWorld, acU, vCenter, 3.68, 0, 0.9, 0.18, 0.9));
        // Lưới hút gió vuông chìm ở giữa
        acGrilles.push(createInstanceMatrix(toWorld, acU, vCenter, 3.58, 0, 0.5, 0.02, 0.5));
      }

      // --- 3. TƯỜNG TRƯỚC (TƯỜNG ĐÔNG): TV + 2 BẢNG TRẮNG SÁNG KHUNG NHÔM + BÀN GV ---
      // Khung viền TV đen & Màn hình TV đặt trước mặt ốp tường Đông (u = r.maxU - 0.13)
      const frontTVU = r.maxU - 0.13;
      tvFrames.push(createInstanceMatrix(toWorld, frontTVU, vCenter, 2.15, 0, 0.04, 1.3, 2.2));
      // Chỉ bỏ tvScreens khi phòng đang là sân khấu Silver để tránh z-fighting với ProjectorScreen
      const isStageRoom = isSilverActive && stageRoomCode === r.code;
      if (!isStageRoom) {
        tvScreens.push(createInstanceMatrix(toWorld, frontTVU - 0.022, vCenter, 2.15, 0, 0.005, 1.2, 2.1));
      }

      // 2 Bảng trắng sáng hai bên TV (Left & Right Whiteboard)
      for (const wbV of [-207.8, -202.4]) {
        // Mặt bảng trắng tinh khiết
        whiteboards.push(createInstanceMatrix(toWorld, frontTVU - 0.015, wbV, 1.7, 0, 0.015, 1.2, 2.2));
        // Khung nhôm viền ngoài
        metalFrames.push(createInstanceMatrix(toWorld, frontTVU - 0.01, wbV, 1.7, 0, 0.02, 1.24, 2.24));
        // Máng đựng bút / khăn lau ở đáy bảng
        metalFrames.push(createInstanceMatrix(toWorld, frontTVU - 0.04, wbV, 1.08, 0, 0.06, 0.02, 2.1));
      }

      // Bàn giáo viên gỗ sồi sáng & khung chân kim loại
      teacherDesks.push(createInstanceMatrix(toWorld, r.maxU - 1.5, -203.2, 0.73, 0, 0.7, 0.04, 1.4));
      metalFrames.push(createInstanceMatrix(toWorld, r.maxU - 1.5, -203.2 + 0.67, 0.35, 0, 0.6, 0.7, 0.03));
      metalFrames.push(createInstanceMatrix(toWorld, r.maxU - 1.5, -203.2 - 0.67, 0.35, 0, 0.6, 0.7, 0.03));
      chairs.push(createInstanceMatrix(toWorld, r.maxU - 0.95, -203.2, 0, 0, 1, 1, 1));
      monitors.push(createInstanceMatrix(toWorld, r.maxU - 1.4, -203.2, 0.75, 0, 1, 1, 1));

      // --- 4. HỆ DẦM TRẦN ĐEN CÔNG NGHIỆP (INDUSTRIAL EXPOSED BLACK BEAMS) ---
      beams.push(createInstanceMatrix(toWorld, r.minU + 2.6, vCenter, 3.65, 0, 0.32, 0.28, 9.6));
      beams.push(createInstanceMatrix(toWorld, r.minU + 6.6, vCenter, 3.65, 0, 0.32, 0.28, 9.6));

      // --- 5. 4 DÃY BÀN SINH VIÊN (4 hàng × 8 chỗ = 32 máy/phòng) ---
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

          // Bàn học gỗ sáng sồi
          desks.push(createInstanceMatrix(toWorld, ru, sv, 0, 0, 1, 1, 1));

          // Ghế học sinh gỗ uốn cong chân kim loại
          chairs.push(createInstanceMatrix(toWorld, ru - 0.42, sv, 0, 0, 1, 1, 1));

          // Màn hình Dell trên bàn
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

      // --- 6. CỬA SỔ PHÍA BẮC & CHUỖI 7 POSTER EIU ---
      // Khung bậu cửa sổ, đố ngang và đố đứng
      metalFrames.push(createInstanceMatrix(toWorld, roomMidU, -210.15, 0.85, 0, roomWidth, 0.06, 0.06));
      metalFrames.push(createInstanceMatrix(toWorld, roomMidU, -210.15, 2.60, 0, roomWidth, 0.06, 0.06));
      metalFrames.push(createInstanceMatrix(toWorld, roomMidU, -210.15, 3.55, 0, roomWidth, 0.06, 0.06));
      // Kính cửa sổ xanh đón sáng tự nhiên
      windowGlass.push(createInstanceMatrix(toWorld, roomMidU, -210.16, 1.725, 0, roomWidth - 0.1, 1.68, 0.02));

      // Dãy poster slogan EIU
      posters.push(createInstanceMatrix(toWorld, roomMidU, -210.12, 2.95, 0, 1, 1, 1));
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
      concreteSurfaces,
      acCases,
      acGrilles,
      tvFrames,
      tvScreens,
      whiteboards,
      metalFrames,
      teacherDesks,
      windowGlass,
      posters,
      signs,
    };
  }, [isSilverActive, stageRoomCode]);

  return (
    <group>
      {/* Nguồn sáng ambient trắng nhẹ bổ trợ */}
      <ambientLight intensity={0.4} color="#ffffff" />

      {/* Đèn trần trung tâm dịu nhẹ chỉ bật ở phòng lab đang có hoạt cảnh Silver (tránh bật 10 đèn cùng lúc) */}
      {isSilverActive && stageRoomCode && (() => {
        const r = B8_COMPUTER_LAB_ROOMS.find((room) => room.code === stageRoomCode);
        if (!r) return null;
        const [lx, lz] = toWorld((r.minU + r.maxU) * 0.5, -205.1);
        return (
          <pointLight
            position={[lx, 3.25, lz]}
            intensity={0.65}
            distance={10.0}
            decay={1.6}
            color="#ffffff"
            castShadow={false}
          />
        );
      })()}

      {/* 1. Bàn sinh viên gỗ sáng sồi */}
      <Batch matrices={batches.desks} geometry={deskGeom}>
        <meshStandardMaterial color={WOOD_LIGHT} roughness={0.45} />
      </Batch>

      {/* 2. Ghế gỗ uốn cong khung kim loại sáng */}
      <Batch matrices={batches.chairs} geometry={chairGeom}>
        <meshStandardMaterial color={CHAIR_WOOD} roughness={0.5} />
      </Batch>

      {/* 3. Màn hình Dell đen */}
      <Batch matrices={batches.monitors} geometry={monitorGeom}>
        <meshStandardMaterial color={BEAM_BLACK} roughness={0.5} />
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
        <meshStandardMaterial color={BEAM_BLACK} roughness={0.5} />
      </Batch>

      {/* 7. Đèn LED treo thả phát sáng trắng cool-white (emissive) */}
      <Batch matrices={batches.lights} geometry={pendantLightGeom}>
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={3.0}
          roughness={0.2}
          toneMapped={false}
        />
      </Batch>

      {/* 8. Dầm trần đen công nghiệp */}
      <Batch matrices={batches.beams} geometry={unitBoxGeom}>
        <meshStandardMaterial color={BEAM_BLACK} roughness={0.8} />
      </Batch>

      {/* 9. Tường & trần bê tông trắng xám sáng (#dcdbd6) mộc chuẩn phòng lab */}
      <Batch matrices={batches.concreteSurfaces} geometry={unitBoxGeom}>
        <meshStandardMaterial color="#dcdbd6" roughness={0.6} />
      </Batch>

      {/* 10. Vỏ ngoài máy lạnh cassette 4 hướng màu trắng sạch */}
      <Batch matrices={batches.acCases} geometry={unitBoxGeom}>
        <meshStandardMaterial color={AC_WHITE} roughness={0.3} />
      </Batch>

      {/* 11. Lưới hút gió máy lạnh cassette xám chìm */}
      <Batch matrices={batches.acGrilles} geometry={unitBoxGeom}>
        <meshStandardMaterial color={AC_GRILL} roughness={0.6} />
      </Batch>

      {/* 12. Mặt bảng trắng sáng tinh khiết */}
      <Batch matrices={batches.whiteboards} geometry={unitBoxGeom}>
        <meshStandardMaterial color={WHITEBOARD_SURFACE} roughness={0.15} />
      </Batch>

      {/* 13. Khung nhôm bảng trắng, máng bút, chân bàn GV, đố cửa sổ */}
      <Batch matrices={batches.metalFrames} geometry={unitBoxGeom}>
        <meshStandardMaterial color={METAL_FRAME} roughness={0.3} metalness={0.25} />
      </Batch>

      {/* 14. Khung TV tường trước */}
      <Batch matrices={batches.tvFrames} geometry={unitBoxGeom}>
        <meshStandardMaterial color={TV_FRAME} roughness={0.3} />
      </Batch>

      {/* 15. Màn hình TV trung tâm */}
      <Batch matrices={batches.tvScreens} geometry={unitBoxGeom}>
        <meshStandardMaterial color="#1e3a8a" emissive="#1e3a8a" emissiveIntensity={0.6} roughness={0.2} />
      </Batch>

      {/* 16. Bàn giáo viên gỗ sáng sồi */}
      <Batch matrices={batches.teacherDesks} geometry={unitBoxGeom}>
        <meshStandardMaterial color={WOOD_LIGHT} roughness={0.45} />
      </Batch>

      {/* 17. Kính cửa sổ xanh đón sáng phía Bắc */}
      <Batch matrices={batches.windowGlass} geometry={unitBoxGeom}>
        <meshStandardMaterial color={WINDOW_GLASS_BLUE} roughness={0.1} metalness={0.1} transparent opacity={0.65} />
      </Batch>

      {/* 18. Poster thương hiệu EIU trên cửa sổ phía Bắc */}
      <Batch matrices={batches.posters} geometry={unitPostersGeom}>
        <meshBasicMaterial map={postersTex} side={DoubleSide} />
      </Batch>

      {/* 19. Biển số phòng mica 3 dải màu chuẩn EIU gắn tường hành lang (song ngữ tự động đổi theo useLangStore) */}
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
