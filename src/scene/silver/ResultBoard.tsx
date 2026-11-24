import { useEffect, useMemo } from 'react';
import {
  BoxGeometry,
  CanvasTexture,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from 'three';
import { useLangStore } from '../../store/useLangStore';
import type { StageSpec } from '../../types/silverWorld';

export interface ResultBoardProps {
  stage: StageSpec;
}

const BOARD_WIDTH = 2.2;
const BOARD_HEIGHT = 1.3;
const POST_WIDTH = 0.08;
const POST_HEIGHT = 2.1;
const BOARD_CENTER_Y = 1.4;

function drawResultCanvas(canvas: HTMLCanvasElement, lang: 'vi' | 'en'): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // 1. Nền bảng thông báo
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, w, h);

  // Viền ngoài bảng
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, w - 8, h - 8);

  // 2. Thanh tiêu đề xanh EIU navy (#0b3d6e)
  ctx.fillStyle = '#0b3d6e';
  ctx.fillRect(8, 8, w - 16, 110);

  // Tiêu đề trường
  ctx.fillStyle = '#f2f6fa';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const schoolTitle = lang === 'vi'
    ? 'ĐẠI HỌC QUỐC TẾ MIỀN ĐÔNG — EIU'
    : 'EASTERN INTERNATIONAL UNIVERSITY';
  ctx.fillText(schoolTitle, w / 2, 42);

  // Tiêu đề bảng điểm
  ctx.font = '600 24px sans-serif';
  ctx.fillStyle = '#fde047'; // Vàng nhấn
  const examTitle = lang === 'vi'
    ? 'KẾT QUẢ KIỂM TRA ĐẦU VÀO TIẾNG ANH (LEVEL 1)'
    : 'ENGLISH PLACEMENT TEST RESULTS (LEVEL 1)';
  ctx.fillText(examTitle, w / 2, 85);

  // 3. Tiêu đề các cột bảng (3 cột: SBD, Họ tên, Xếp lớp — không có đạt/trượt)
  const tableTop = 135;
  const colY = tableTop + 24;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(20, tableTop, w - 40, 42);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const headers = lang === 'vi'
    ? ['SBD / ID', 'Họ và tên thí sinh', 'Xếp lớp']
    : ['Candidate ID', 'Full Name', 'Placement Level'];

  const colX = [180, 512, 830];
  ctx.fillText(headers[0] ?? '', colX[0] ?? 180, colY);
  ctx.fillText(headers[1] ?? '', colX[1] ?? 512, colY);
  ctx.fillText(headers[2] ?? '', colX[2] ?? 830, colY);

  // 4. Danh sách thí sinh ẩn danh (không tên thật, không điểm thật)
  const rows = lang === 'vi'
    ? [
      { id: 'EIU-2026-001', name: 'Thí sinh A', result: 'Level 1 (Tiếng Anh 1)' },
      { id: 'EIU-2026-002', name: 'Thí sinh B', result: 'Level 1 (Tiếng Anh 1)' },
      { id: 'EIU-2026-003', name: 'Thí sinh C', result: 'Level 2 (Tiếng Anh 2)' },
      { id: 'EIU-2026-004', name: 'Thí sinh D', result: 'Level 1 (Tiếng Anh 1)' },
      { id: 'EIU-2026-005', name: 'Thí sinh E', result: 'Level 2 (Tiếng Anh 2)' },
      { id: 'EIU-2026-006', name: 'Thí sinh F', result: 'Level 1 (Tiếng Anh 1)' },
    ]
    : [
      { id: 'EIU-2026-001', name: 'Candidate A', result: 'Level 1 (English 1)' },
      { id: 'EIU-2026-002', name: 'Candidate B', result: 'Level 1 (English 1)' },
      { id: 'EIU-2026-003', name: 'Candidate C', result: 'Level 2 (English 2)' },
      { id: 'EIU-2026-004', name: 'Candidate D', result: 'Level 1 (English 1)' },
      { id: 'EIU-2026-005', name: 'Candidate E', result: 'Level 2 (English 2)' },
      { id: 'EIU-2026-006', name: 'Candidate F', result: 'Level 1 (English 1)' },
    ];

  let rowY = tableTop + 42;
  const rowH = 54;
  ctx.font = '500 18px sans-serif';

  rows.forEach((r, idx) => {
    // Dòng xen kẽ
    ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f1f5f9';
    ctx.fillRect(20, rowY, w - 40, rowH);

    // Kẻ viền dưới
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, rowY + rowH);
    ctx.lineTo(w - 20, rowY + rowH);
    ctx.stroke();

    const midY = rowY + rowH / 2;
    ctx.fillStyle = '#334155';
    ctx.fillText(r.id, colX[0] ?? 180, midY);
    ctx.fillText(r.name, colX[1] ?? 512, midY);

    ctx.fillStyle = '#0b3d6e';
    ctx.fillText(r.result, colX[2] ?? 830, midY);

    rowY += rowH;
  });

  // 5. Ghi chú minh họa đáy bảng (bỏ chúc mừng, thêm minh họa trong game)
  ctx.fillStyle = '#64748b';
  ctx.font = 'italic 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('* Minh họa trong game / Illustration only', w / 2, h - 35);
}

/**
 * Bảng kết quả thi ngoài trời (đặt tại sân trước B8 ở cảnh entrance/result):
 * - 1 mặt phẳng + khung hai cột thép
 * - Canvas texture song ngữ (VI / EN), vẽ lại khi đổi ngôn ngữ
 * - Dispose texture, geometries và materials khi unmount
 */
export default function ResultBoard({ stage }: ResultBoardProps) {
  const lang = useLangStore((s) => s.lang);

  // Tạo Canvas và CanvasTexture một lần cho suốt vòng đời của bảng
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 640;
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    return { canvas: c, texture: tex };
  }, []);

  // Vẽ lại canvas khi đổi ngôn ngữ (vi/en) và đánh dấu needsUpdate
  useEffect(() => {
    drawResultCanvas(canvas, lang);
    texture.needsUpdate = true;
  }, [canvas, texture, lang]);

  // Hủy texture khi unmount
  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  // Hình học bảng và khung
  const { boardGeom, postGeom, frameMat } = useMemo(() => {
    const bg = new PlaneGeometry(BOARD_WIDTH, BOARD_HEIGHT);
    const pg = new BoxGeometry(POST_WIDTH, POST_HEIGHT, POST_WIDTH);
    const fm = new MeshStandardMaterial({ color: '#334155', roughness: 0.6, metalness: 0.2 });
    return { boardGeom: bg, postGeom: pg, frameMat: fm };
  }, []);

  useEffect(() => {
    return () => {
      boardGeom.dispose();
      postGeom.dispose();
      frameMat.dispose();
    };
  }, [boardGeom, postGeom, frameMat]);

  // Vị trí và góc quay theo stage.target
  const targetX = stage.target.x;
  const targetZ = stage.target.z;
  const facingYaw = Math.atan2(stage.target.facing[0], stage.target.facing[1]);

  return (
    <group position={[targetX, 0, targetZ]} rotation={[0, facingYaw, 0]}>
      {/* 2 cột trụ thép bên hông */}
      <mesh geometry={postGeom} material={frameMat} position={[-BOARD_WIDTH / 2 - POST_WIDTH / 2, POST_HEIGHT / 2, 0]} />
      <mesh geometry={postGeom} material={frameMat} position={[BOARD_WIDTH / 2 + POST_WIDTH / 2, POST_HEIGHT / 2, 0]} />

      {/* Cả 2 mặt bảng thông báo đều hiển thị kết quả thi (chuẩn bảng ngoài trời 2 mặt) */}
      {/* Mặt trước (+Z) */}
      <mesh geometry={boardGeom} position={[0, BOARD_CENTER_Y, 0.005]}>
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>

      {/* Mặt sau (-Z) */}
      <mesh geometry={boardGeom} position={[0, BOARD_CENTER_Y, -0.005]} rotation={[0, Math.PI, 0]}>
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}
