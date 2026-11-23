import { useEffect, useMemo, useRef } from 'react';
import {
  BoxGeometry,
  CanvasTexture,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  type Mesh,
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

  // 3. Tiêu đề các cột bảng
  const tableTop = 135;
  const colY = tableTop + 24;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(20, tableTop, w - 40, 42);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const headers = lang === 'vi'
    ? ['SBD', 'Họ và tên', 'Kết quả', 'Trạng thái']
    : ['Candidate ID', 'Full Name', 'Placement', 'Status'];

  const colX = [120, 370, 680, 890];
  ctx.fillText(headers[0] ?? '', colX[0] ?? 120, colY);
  ctx.fillText(headers[1] ?? '', colX[1] ?? 370, colY);
  ctx.fillText(headers[2] ?? '', colX[2] ?? 680, colY);
  ctx.fillText(headers[3] ?? '', colX[3] ?? 890, colY);

  // 4. Danh sách thí sinh ẩn danh (không tên thật, không điểm thật)
  const rows = lang === 'vi'
    ? [
      { id: 'EIU-2026-001', name: 'Thí sinh A', result: 'Level 1', status: 'Đạt' },
      { id: 'EIU-2026-002', name: 'Thí sinh B', result: 'Level 1', status: 'Đạt' },
      { id: 'EIU-2026-003', name: 'Thí sinh C', result: 'Level 1', status: 'Đạt' },
      { id: 'EIU-2026-004', name: 'Thí sinh D', result: 'Level 1', status: 'Đạt' },
      { id: 'EIU-2026-005', name: 'Thí sinh E', result: 'Level 1', status: 'Đạt' },
      { id: 'EIU-2026-006', name: 'Thí sinh F', result: 'Level 1', status: 'Đạt' },
    ]
    : [
      { id: 'EIU-2026-001', name: 'Candidate A', result: 'Level 1', status: 'Qualified' },
      { id: 'EIU-2026-002', name: 'Candidate B', result: 'Level 1', status: 'Qualified' },
      { id: 'EIU-2026-003', name: 'Candidate C', result: 'Level 1', status: 'Qualified' },
      { id: 'EIU-2026-004', name: 'Candidate D', result: 'Level 1', status: 'Qualified' },
      { id: 'EIU-2026-005', name: 'Candidate E', result: 'Level 1', status: 'Qualified' },
      { id: 'EIU-2026-006', name: 'Candidate F', result: 'Level 1', status: 'Qualified' },
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
    ctx.fillText(r.id, colX[0] ?? 120, midY);
    ctx.fillText(r.name, colX[1] ?? 370, midY);

    ctx.fillStyle = '#0b3d6e';
    ctx.fillText(r.result, colX[2] ?? 680, midY);

    ctx.fillStyle = '#16a34a'; // Xanh lá đạt
    ctx.fillText(r.status, colX[3] ?? 890, midY);

    rowY += rowH;
  });

  // 5. Lời chúc mừng ở đáy bảng
  ctx.fillStyle = '#64748b';
  ctx.font = 'italic 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const footerText = lang === 'vi'
    ? 'Chúc mừng các tân sinh viên đã hoàn thành xuất sắc đợt kiểm tra đầu vào!'
    : 'Congratulations to all new students on completing the placement exam!';
  ctx.fillText(footerText, w / 2, h - 35);
}

/**
 * Bảng kết quả thi ngoài trời (đặt tại sân trước B8 ở cảnh entrance/result):
 * - 1 mặt phẳng + khung hai cột thép
 * - Canvas texture song ngữ (VI / EN), vẽ lại khi đổi ngôn ngữ
 * - Dispose texture, geometries và materials khi unmount
 */
export default function ResultBoard({ stage }: ResultBoardProps) {
  const lang = useLangStore((s) => s.lang);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<CanvasTexture | null>(null);
  const meshRef = useRef<Mesh>(null);

  // Tạo và cập nhật CanvasTexture song ngữ
  useEffect(() => {
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 640;
      canvasRef.current = canvas;
    }

    drawResultCanvas(canvas, lang);

    let tex = textureRef.current;
    if (!tex) {
      tex = new CanvasTexture(canvas);
      tex.colorSpace = SRGBColorSpace;
      textureRef.current = tex;
    } else {
      tex.needsUpdate = true;
    }

    return () => {
      // Cleanup texture khi component unmount
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
      canvasRef.current = null;
    };
  }, [lang]);

  // Hình học bảng và khung
  const { boardGeom, postGeom, frameMat, backMat } = useMemo(() => {
    const bg = new PlaneGeometry(BOARD_WIDTH, BOARD_HEIGHT);
    const pg = new BoxGeometry(POST_WIDTH, POST_HEIGHT, POST_WIDTH);
    const fm = new MeshStandardMaterial({ color: '#334155', roughness: 0.6, metalness: 0.2 });
    const bm = new MeshStandardMaterial({ color: '#475569', roughness: 0.7, metalness: 0.1 });
    return { boardGeom: bg, postGeom: pg, frameMat: fm, backMat: bm };
  }, []);

  useEffect(() => {
    return () => {
      boardGeom.dispose();
      postGeom.dispose();
      frameMat.dispose();
      backMat.dispose();
    };
  }, [boardGeom, postGeom, frameMat, backMat]);

  // Vị trí và góc quay theo stage.target
  const targetX = stage.target.x;
  const targetZ = stage.target.z;
  const facingYaw = Math.atan2(stage.target.facing[0], stage.target.facing[1]);

  return (
    <group position={[targetX, 0, targetZ]} rotation={[0, facingYaw, 0]}>
      {/* 2 cột trụ thép bên hông */}
      <mesh geometry={postGeom} material={frameMat} position={[-BOARD_WIDTH / 2 - POST_WIDTH / 2, POST_HEIGHT / 2, 0]} />
      <mesh geometry={postGeom} material={frameMat} position={[BOARD_WIDTH / 2 + POST_WIDTH / 2, POST_HEIGHT / 2, 0]} />

      {/* Mặt lưng bảng */}
      <mesh geometry={boardGeom} material={backMat} position={[0, BOARD_CENTER_Y, -0.01]} rotation={[0, Math.PI, 0]} />

      {/* Mặt trước vẽ kết quả qua canvas */}
      {textureRef.current && (
        <mesh ref={meshRef} geometry={boardGeom} position={[0, BOARD_CENTER_Y, 0.005]}>
          <meshBasicMaterial map={textureRef.current} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
