import { useMemo, useEffect } from 'react';
import {
  CanvasTexture,
  Matrix4,
  BoxGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
} from 'three';
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Text } from "@react-three/drei";
import BookStaircase from "./BookStaircase";
import StaticInstances, { type StaticInstance } from '../kit/StaticInstances';
import { FLOOR_HEIGHT } from '../../data';
import { b6Layout, toWorld } from './layouts/b6';
import { createInstanceMatrix } from './InteriorFurniture';
import { B6_TEXT } from './b6Text';

interface B6FurnitureProps {
  floor: number;
  showUpperFloors?: boolean;
}

const atriumFrames: StaticInstance[] = [
  ...[-4.1, -2.75, 2.75, 4.1].map(x => ({ position: [x, 3.8, 0] as [number, number, number], scale: [0.08, 7.6, 0.1] as [number, number, number] })),
  ...[3.8, 7.5].map(y => ({ position: [0, y, 0] as [number, number, number], scale: [8.2, 0.09, 0.1] as [number, number, number] })),
];
const atriumPanes: StaticInstance[] = [
  ...[-3.35, 3.35].map(x => ({ position: [x, 3.8, 0] as [number, number, number], scale: [1.5, 7.4, 1] as [number, number, number] })),
  { position: [0, 5.7, 0], scale: [5.3, 3.6, 1] },
];

/**
 * Sinh texture procedural cho Màn hình TV lớn giám sát An ninh mạng (phòng 100.B6)
 * Giống hệt bảng điều khiển "HỆ THỐNG BẢO MẬT / SECURITY SYSTEM" trong ảnh tham khảo 06.
 */
function createCyberDashboardTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 576;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new CanvasTexture(canvas);

  // Nền tối công nghệ cao
  ctx.fillStyle = '#061024';
  ctx.fillRect(0, 0, 1024, 576);

  // Khung viền và lưới radar
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 1004, 556);

  // Thanh tiêu đề phía trên
  ctx.fillStyle = '#0f2757';
  ctx.fillRect(12, 12, 1000, 56);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
  ctx.fillText('EIU CYBER SECURITY CENTER', 30, 48);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('HỆ THỐNG BẢO MẬT / SECURITY SYSTEM — MONITORING DASHBOARD', 370, 48);

  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(970, 40, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '14px Arial';
  ctx.fillText('ACTIVE', 915, 45);

  // Cột 1: Thông số tường lửa & mạng (trái)
  ctx.fillStyle = '#0b1938';
  ctx.fillRect(30, 85, 300, 460);
  ctx.strokeStyle = '#1d4ed8';
  ctx.strokeRect(30, 85, 300, 460);

  ctx.fillStyle = '#60a5fa';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('FIREWALL STATUS: ACTIVE', 45, 120);

  // Biểu đồ lưu lượng dạng sóng (traffic waveform)
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(45, 200);
  for (let x = 45; x < 310; x += 15) {
    const y = 190 + Math.sin(x * 0.08) * 22 + Math.cos(x * 0.15) * 12;
    ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px monospace';
  ctx.fillText('Traffic In:  1.42 Gbps', 45, 250);
  ctx.fillText('Traffic Out: 840 Mbps', 45, 275);
  ctx.fillText('Threat Level: SECURE [0]', 45, 300);
  ctx.fillText('DDoS Protection: ON', 45, 325);
  ctx.fillText('VPN Gateway: CONNECTED', 45, 350);
  ctx.fillText('Intrusion Prev: READY', 45, 375);

  // Thanh trạng thái pin/tải
  for (let b = 0; b < 6; b++) {
    ctx.fillStyle = b < 5 ? '#059669' : '#eab308';
    ctx.fillRect(45 + b * 42, 410, 36, 14);
  }
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Node Status: 6/6 Online', 45, 450);

  // Cột 2: Bảng dữ liệu sự kiện an ninh & đồ thị (giữa)
  ctx.fillStyle = '#0b1938';
  ctx.fillRect(350, 85, 640, 310);
  ctx.strokeStyle = '#1d4ed8';
  ctx.strokeRect(350, 85, 640, 310);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('REAL-TIME THREAT LOGS & ANOMALY DETECTION', 370, 120);

  // Hàng log mẫu
  const logs = [
    '[17:34:02] [SEC-200] TLS handshake verified: 10.20.14.88 (Tokyo Node)',
    '[17:34:08] [SYS-OK] Zero-day signature DB updated (v2026.11.23)',
    '[17:34:15] [AUTH-OK] Lab 100.B6 Workstation #12 login: sv_eiu_net',
    '[17:34:21] [RULE-443] Packet inspection passed — 0 malformed headers',
    '[17:34:30] [ARIS-SYNC] Partner tunnel latency: 42ms (Secure SG)',
    '[17:34:39] [HEURISTIC] Network entropy stable: 0.984 (Normal)',
  ];
  ctx.font = '13px monospace';
  logs.forEach((log, i) => {
    ctx.fillStyle = i === 2 ? '#38bdf8' : '#e2e8f0';
    ctx.fillText(log, 370, 160 + i * 28);
  });

  // Hàng dưới: Lưới giám sát máy chủ & cụm thiết bị lab
  ctx.fillStyle = '#0b1938';
  ctx.fillRect(350, 415, 640, 130);
  ctx.strokeStyle = '#1d4ed8';
  ctx.strokeRect(350, 415, 640, 130);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 15px Arial';
  ctx.fillText('LAB CLUSTERS & HARDWARE STATUS', 370, 442);

  const clusterNames = ['Cluster A (Core)', 'Cluster B (Lab)', 'Cluster C (Edge)', 'ARIS Cloud Node'];
  clusterNames.forEach((name, i) => {
    const x = 370 + i * 155;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, 458, 145, 68);
    ctx.strokeStyle = '#3b82f6';
    ctx.strokeRect(x, 458, 145, 68);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '12px Arial';
    ctx.fillText(name, x + 8, 480);
    ctx.fillStyle = '#22c55e';
    ctx.fillText('● 100% HEALTH', x + 8, 506);
  });

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Sinh texture biển hiệu song ngữ "Trung tâm An ninh mạng / Cyber Security Center"
 * và biển hợp tác ARIS Japan trên cửa kính
 */
function createEntranceBannerTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new CanvasTexture(canvas);

  // Nền xanh navy EIU
  ctx.fillStyle = '#102a5c';
  ctx.fillRect(0, 0, 1024, 160);

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 1016, 152);

  // Logo EIU + Tên trung tâm
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
  ctx.fillText('EIU  |  TRUNG TÂM AN NINH MẠNG', 40, 65);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
  ctx.fillText('CYBER SECURITY CENTER', 40, 110);

  // Dòng hợp tác quốc tế (như ảnh 06)
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '22px Arial, sans-serif';
  ctx.fillText('In partnership with ARIS Japan', 560, 65);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '20px "Meiryo", "MS Gothic", sans-serif';
  ctx.fillText('サイバーセキュリティセンター', 620, 110);

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Sinh texture banner treo thông tầng (COMMUNITY, SUSTAINABILITY)
 */
function createHangingBannerTexture(title: string, subtitle: string, bgColor: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new CanvasTexture(canvas);

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 256, 768);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 236, 748);

  // Chữ dọc lớn phong cách banner sảnh trường đại học EIU
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';

  // In từng chữ cái xoay dọc hoặc in chuỗi
  ctx.save();
  ctx.translate(128, 400);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(title, 0, 0);
  ctx.restore();

  ctx.font = 'bold 22px Arial';
  ctx.fillText(subtitle, 128, 700);

  ctx.fillStyle = '#f8fafc';
  ctx.fillText('EIU CAMPUS', 128, 60);

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function B6Furniture({ floor }: B6FurnitureProps) {
  // Texture Dashboard TV
  const dashboardTexture = useMemo(() => createCyberDashboardTexture(), []);
  const entranceBannerTexture = useMemo(() => createEntranceBannerTexture(), []);
  const bannerCommunityTexture = useMemo(
    () => createHangingBannerTexture(B6_TEXT.bannerCommunity.en, B6_TEXT.bannerCommunity.vi, '#15803d'),
    []
  );
  const bannerSustainabilityTexture = useMemo(
    () => createHangingBannerTexture(B6_TEXT.bannerSustainability.en, B6_TEXT.bannerSustainability.vi, '#9a3412'),
    []
  );

  useEffect(() => {
    return () => {
      dashboardTexture.dispose();
      entranceBannerTexture.dispose();
      bannerCommunityTexture.dispose();
      bannerSustainabilityTexture.dispose();
    };
  }, [dashboardTexture, entranceBannerTexture, bannerCommunityTexture, bannerSustainabilityTexture]);

  // ===========================================================================
  // 1. CỘT THÔNG TẦNG CAO 7.6m (INSTANCING)
  // ===========================================================================
  const columnMatrices = useMemo(() => {
    const matrices: Matrix4[] = [];
    const colVs = [6.0, 14.0, 22.0, 30.0, 38.0];
    const colUs = [10.0, 18.0];

    for (const u of colUs) {
      for (const v of colVs) {
        matrices.push(
          createInstanceMatrix(toWorld, u, v, FLOOR_HEIGHT, 0, 0.6, FLOOR_HEIGHT * 2, 0.6)
        );
      }
    }
    return matrices;
  }, []);

  // ===========================================================================
  // 2. PHÒNG 100.B6: BÀN TRẮNG CỤM, GHẾ UỐN GỖ, MÁY TÍNH ĐỂ BÀN (TẦNG 1)
  // ===========================================================================
  const { deskMatrices, chairMatrices, monitorMatrices, pcMatrices, lightMatrices } = useMemo(() => {
    const dMs: Matrix4[] = [];
    const cMs: Matrix4[] = [];
    const mMs: Matrix4[] = [];
    const pMs: Matrix4[] = [];
    const lMs: Matrix4[] = [];

    if (floor === 1) {
      // Cụm A: Bàn tròn / đa giác cộng tác trung tâm (u = 24.0, v = 9.0)
      const centerAU = 24.0;
      const centerAV = 9.0;
      const podCount = 6;
      for (let i = 0; i < podCount; i++) {
        const angle = (i * Math.PI * 2) / podCount;
        const du = Math.cos(angle) * 1.8;
        const dv = Math.sin(angle) * 1.8;
        const u = centerAU + du;
        const v = centerAV + dv;
        const yaw = angle + Math.PI / 2;

        // Bàn trắng
        dMs.push(createInstanceMatrix(toWorld, u, v, 0.38, yaw, 1.4, 0.74, 0.8));

        // Ghế gỗ
        const chairU = u + Math.cos(angle) * 0.9;
        const chairV = v + Math.sin(angle) * 0.9;
        cMs.push(createInstanceMatrix(toWorld, chairU, chairV, 0.44, angle + Math.PI, 0.48, 0.86, 0.48));

        // Máy tính để bàn
        const monU = u - Math.cos(angle) * 0.22;
        const monV = v - Math.sin(angle) * 0.22;
        mMs.push(createInstanceMatrix(toWorld, monU, monV, 0.98, angle, 0.58, 0.38, 0.08));

        // Case máy tính dưới chân bàn
        pMs.push(createInstanceMatrix(toWorld, u + Math.sin(angle) * 0.4, v - Math.cos(angle) * 0.4, 0.24, yaw, 0.2, 0.44, 0.46));
      }

      // Cụm B: Dãy bàn giám sát & an ninh mạng trực chiến (u = 29.5, v = 4.5 .. 15.5)
      for (let r = 0; r < 4; r++) {
        const v = 5.0 + r * 3.2;
        const u = 29.5;
        // Bàn đôi
        dMs.push(createInstanceMatrix(toWorld, u, v, 0.38, 0, 1.6, 0.74, 1.2));

        // 2 Ghế
        cMs.push(createInstanceMatrix(toWorld, u - 0.9, v - 0.3, 0.44, Math.PI / 2, 0.48, 0.86, 0.48));
        cMs.push(createInstanceMatrix(toWorld, u - 0.9, v + 0.3, 0.44, Math.PI / 2, 0.48, 0.86, 0.48));

        // 2 Màn hình giám sát kép
        mMs.push(createInstanceMatrix(toWorld, u + 0.4, v - 0.32, 0.98, -Math.PI / 2, 0.62, 0.4, 0.08));
        mMs.push(createInstanceMatrix(toWorld, u + 0.4, v + 0.32, 0.98, -Math.PI / 2, 0.62, 0.4, 0.08));

        // 2 Case máy
        pMs.push(createInstanceMatrix(toWorld, u + 0.4, v - 0.5, 0.24, 0, 0.2, 0.44, 0.46));
        pMs.push(createInstanceMatrix(toWorld, u + 0.4, v + 0.5, 0.24, 0, 0.2, 0.44, 0.46));
      }

      // Cụm C: Bàn thảo luận & thuyết trình cạnh vách kính (u = 20.5, v = 4.5 .. 15.5)
      for (let r = 0; r < 3; r++) {
        const v = 5.0 + r * 4.5;
        const u = 20.8;
        dMs.push(createInstanceMatrix(toWorld, u, v, 0.38, Math.PI / 2, 1.2, 0.74, 1.6));
        cMs.push(createInstanceMatrix(toWorld, u + 0.8, v - 0.4, 0.44, -Math.PI / 2, 0.48, 0.86, 0.48));
        cMs.push(createInstanceMatrix(toWorld, u + 0.8, v + 0.4, 0.44, -Math.PI / 2, 0.48, 0.86, 0.48));
        mMs.push(createInstanceMatrix(toWorld, u - 0.4, v, 0.98, Math.PI / 2, 0.58, 0.38, 0.08));
        pMs.push(createInstanceMatrix(toWorld, u - 0.4, v + 0.4, 0.24, 0, 0.2, 0.44, 0.46));
      }

      // Đèn LED thanh treo trần 100.B6 (như trong ảnh 06: các thanh đèn led dài treo song song & chéo nhẹ)
      for (let row = 0; row < 5; row++) {
        const v = 3.5 + row * 3.0;
        for (let col = 0; col < 3; col++) {
          const u = 21.0 + col * 5.0;
          lMs.push(createInstanceMatrix(toWorld, u, v, 3.4, 0.2, 3.2, 0.08, 0.15));
        }
      }
    }

    return {
      deskMatrices: dMs,
      chairMatrices: cMs,
      monitorMatrices: mMs,
      pcMatrices: pMs,
      lightMatrices: lMs,
    };
  }, [floor]);

  // ===========================================================================
  // 3. CHẬU CÂY CẢNH QUAN SẢNH & NỘI THẤT (TẦNG 1 & TẦNG 2)
  // ===========================================================================
  const plantMatrices = useMemo(() => {
    const matrices: Matrix4[] = [];

    if (floor === 1) {
      // Dọc viền hồ nước sảnh
      matrices.push(createInstanceMatrix(toWorld, 12.8, 6.2, 0.5, 0, 0.8, 1.4, 0.8));
      matrices.push(createInstanceMatrix(toWorld, 12.8, 13.5, 0.5, 0, 0.8, 1.4, 0.8));
      matrices.push(createInstanceMatrix(toWorld, 12.8, 21.5, 0.5, 0, 0.8, 1.4, 0.8));

      // Góc lối vào 100.B6
      matrices.push(createInstanceMatrix(toWorld, 17.5, 7.5, 0.5, 0, 0.7, 1.3, 0.7));
      matrices.push(createInstanceMatrix(toWorld, 17.5, 11.2, 0.5, 0, 0.7, 1.3, 0.7));

      // Trong phòng 100.B6
      matrices.push(createInstanceMatrix(toWorld, 33.2, 2.5, 0.5, 0, 0.8, 1.5, 0.8));
      matrices.push(createInstanceMatrix(toWorld, 33.2, 16.8, 0.5, 0, 0.8, 1.5, 0.8));
      matrices.push(createInstanceMatrix(toWorld, 19.0, 16.8, 0.5, 0, 0.8, 1.5, 0.8));
    } else if (floor === 2) {
      // Dọc lan can cầu nối & hành lang tầng 2
      matrices.push(createInstanceMatrix(toWorld, 16.8, 10.0, 0.5, 0, 0.7, 1.3, 0.7));
      matrices.push(createInstanceMatrix(toWorld, 16.8, 20.0, 0.5, 0, 0.7, 1.3, 0.7));
      matrices.push(createInstanceMatrix(toWorld, 16.8, 28.0, 0.5, 0, 0.7, 1.3, 0.7));
    }

    return matrices;
  }, [floor]);

  // ===========================================================================
  // 4. LAN CAN KÍNH TẦNG 2 QUANH Ô THÔNG TẦNG (TẦNG 2)
  // ===========================================================================
  const railingPostMatrices = useMemo(() => {
    const matrices: Matrix4[] = [];
    if (floor === 2) {
      // Cột inox lan can quanh North Void (u = 10.0..16.2, v = 4.0..19.0)
      for (let v = 4.0; v <= 19.0; v += 1.5) {
        matrices.push(createInstanceMatrix(toWorld, 10.0, v, 0.55, 0, 0.05, 1.1, 0.05));
        matrices.push(createInstanceMatrix(toWorld, 16.2, v, 0.55, 0, 0.05, 1.1, 0.05));
      }
      for (let u = 10.0; u <= 16.2; u += 1.5) {
        matrices.push(createInstanceMatrix(toWorld, u, 4.0, 0.55, 0, 0.05, 1.1, 0.05));
        matrices.push(createInstanceMatrix(toWorld, u, 19.0, 0.55, 0, 0.05, 1.1, 0.05));
      }

      // Cột inox lan can quanh South Void (u = 10.0..16.2, v = 23.0..35.0)
      for (let v = 23.0; v <= 35.0; v += 1.5) {
        matrices.push(createInstanceMatrix(toWorld, 10.0, v, 0.55, 0, 0.05, 1.1, 0.05));
        matrices.push(createInstanceMatrix(toWorld, 16.2, v, 0.55, 0, 0.05, 1.1, 0.05));
      }
      for (let u = 10.0; u <= 16.2; u += 1.5) {
        matrices.push(createInstanceMatrix(toWorld, u, 23.0, 0.55, 0, 0.05, 1.1, 0.05));
        matrices.push(createInstanceMatrix(toWorld, u, 35.0, 0.55, 0, 0.05, 1.1, 0.05));
      }
    }
    return matrices;
  }, [floor]);

  // Geometries dùng lại
  const colGeo = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const deskGeo = useMemo(() => {
    const top = new BoxGeometry(1, 0.08, 1); top.translate(0, 0.46, 0);
    const legs = [-0.43, 0.43].flatMap(x => [-0.43, 0.43].map(z => {
      const leg = new BoxGeometry(0.06, 0.92, 0.06); leg.translate(x, -0.04, z); return leg;
    }));
    const result = mergeGeometries([top, ...legs]); top.dispose(); legs.forEach(leg => leg.dispose()); return result;
  }, []);
  const chairGeo = useMemo(() => {
    const seat = new BoxGeometry(1, 0.12, 1); seat.translate(0, 0.02, 0);
    const back = new BoxGeometry(1, 0.8, 0.12); back.translate(0, 0.45, -0.44);
    const stem = new BoxGeometry(0.12, 0.5, 0.12); stem.translate(0, -0.27, 0);
    const base = new BoxGeometry(0.8, 0.05, 0.8); base.translate(0, -0.49, 0);
    const result = mergeGeometries([seat, back, stem, base]); [seat, back, stem, base].forEach(part => part.dispose()); return result;
  }, []);
  const monGeo = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const pcGeo = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const lightGeo = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const potGeo = useMemo(() => new CylinderGeometry(0.35, 0.25, 0.5, 10), []);
  const leafGeo = useMemo(() => new IcosahedronGeometry(0.55, 1), []);
  const postGeo = useMemo(() => new CylinderGeometry(0.025, 0.025, 1, 8), []);

  // Tọa độ thế giới của mảng tường xanh 100.B6
  const blueWallWorld = useMemo(() => toWorld(34.15, 9.5), []);
  const tvWorld = useMemo(() => toWorld(34.0, 9.5), []);
  const entranceBannerWorld = useMemo(() => toWorld(18.2, 9.4), []);

  return (
    <group key={`b6-furniture-f${floor}`}>
      {/* 1. Hàng cột chịu lực thông tầng */}
      {columnMatrices.length > 0 && (
        <instancedMesh
          args={[colGeo, undefined, columnMatrices.length]}
          castShadow
          receiveShadow
          onUpdate={(self) => {
            columnMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#f1f5f9" roughness={0.65} />
        </instancedMesh>
      )}

      {/* 2. Cụm bàn trắng 100.B6 */}
      {deskMatrices.length > 0 && (
        <instancedMesh
          args={[deskGeo, undefined, deskMatrices.length]}
          castShadow
          receiveShadow
          onUpdate={(self) => {
            deskMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#ffffff" roughness={0.35} />
        </instancedMesh>
      )}

      {/* 3. Ghế uốn gỗ sáng màu */}
      {chairMatrices.length > 0 && (
        <instancedMesh
          args={[chairGeo, undefined, chairMatrices.length]}
          castShadow
          receiveShadow
          onUpdate={(self) => {
            chairMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#2f3b4f" roughness={0.6} />
        </instancedMesh>
      )}

      {/* 4. Màn hình máy tính (khung đen viền phát sáng xanh) */}
      {monitorMatrices.length > 0 && (
        <instancedMesh
          args={[monGeo, undefined, monitorMatrices.length]}
          castShadow
          receiveShadow
          onUpdate={(self) => {
            monitorMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial
            color="#090d16"
            emissive="#1e3a8a"
            emissiveIntensity={0.25}
            roughness={0.25}
            metalness={0.7}
          />
        </instancedMesh>
      )}

      {/* 5. Case máy tính để bàn */}
      {pcMatrices.length > 0 && (
        <instancedMesh
          args={[pcGeo, undefined, pcMatrices.length]}
          castShadow
          receiveShadow
          onUpdate={(self) => {
            pcMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
        </instancedMesh>
      )}

      {/* 6. Đèn LED thanh treo trần */}
      {lightMatrices.length > 0 && (
        <instancedMesh
          args={[lightGeo, undefined, lightMatrices.length]}
          onUpdate={(self) => {
            lightMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial
            color="#ffffff"
            emissive="#f8fafc"
            emissiveIntensity={0.85}
            roughness={0.2}
          />
        </instancedMesh>
      )}

      {/* 7. Chậu cây xanh văn phòng */}
      {plantMatrices.length > 0 && (
        <>
          <instancedMesh
            args={[potGeo, undefined, plantMatrices.length]}
            castShadow
            receiveShadow
            onUpdate={(self) => {
              plantMatrices.forEach((m, i) => {
                const potM = m.clone().multiply(new Matrix4().makeTranslation(0, -0.3, 0));
                self.setMatrixAt(i, potM);
              });
              self.instanceMatrix.needsUpdate = true;
            }}
          >
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </instancedMesh>
          <instancedMesh
            args={[leafGeo, undefined, plantMatrices.length * 5]}
            castShadow
            receiveShadow
            onUpdate={(self) => {
              plantMatrices.forEach((m, i) => {
                for (let leaf = 0; leaf < 5; leaf++) {
                  const angle = leaf * Math.PI * 2 / 5;
                  const leafM = m.clone().multiply(new Matrix4().makeTranslation(Math.cos(angle) * 0.35, 0.55 + (leaf % 2) * 0.2, Math.sin(angle) * 0.35)).multiply(new Matrix4().makeScale(0.42, 0.75, 0.24));
                  self.setMatrixAt(i * 5 + leaf, leafM);
                }
              });
              self.instanceMatrix.needsUpdate = true;
            }}
          >
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </instancedMesh>
        </>
      )}

      {/* 8. Lan can inox tầng 2 */}
      {railingPostMatrices.length > 0 && (
        <instancedMesh
          args={[postGeo, undefined, railingPostMatrices.length]}
          onUpdate={(self) => {
            railingPostMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
        </instancedMesh>
      )}

      {/* =====================================================================
          9. RIÊNG TẦNG 1: TRUNG TÂM AN NINH MẠNG VÀ HỒ NƯỚC SẢNH
          ===================================================================== */}
      {floor === 1 && (
        <>
          {/* Mảng tường XANH DƯƠNG ĐẬM điểm nhấn (như ảnh 06) */}
          <mesh position={[blueWallWorld[0], 1.9, blueWallWorld[1]]} rotation-y={-b6Layout.rotationY - Math.PI / 2}>
            <boxGeometry args={[16.0, 3.8, 0.22]} />
            <meshStandardMaterial color="#174291" emissive="#174291" emissiveIntensity={0.2} roughness={0.55} />
          </mesh>

          {/* Màn hình TV lớn treo trên mảng tường xanh hiển thị Dashboard An ninh mạng */}
          <group position={[tvWorld[0], 2.0, tvWorld[1]]} rotation-y={-b6Layout.rotationY - Math.PI / 2}>
            {/* Khung viền TV đen mỏng */}
            <mesh position={[0, 0, 0.05]}>
              <boxGeometry args={[3.64, 2.04, 0.08]} />
              <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
            </mesh>
            {/* Mặt màn hình hiển thị Dashboard */}
            <mesh position={[0, 0, 0.1]}>
              <planeGeometry args={[3.6, 2.0]} />
              <meshBasicMaterial map={dashboardTexture} />
            </mesh>
          </group>

          {/* Biển hiệu vách kính lối vào 100.B6 (như ảnh 06: EIU | Trung tâm An ninh mạng | In partnership with ARIS Japan) */}
          <group position={[entranceBannerWorld[0], 3.2, entranceBannerWorld[1]]} rotation-y={-b6Layout.rotationY}>
            <mesh position={[0, 0, 0.04]}>
              <boxGeometry args={[3.2, 0.55, 0.06]} />
              <meshStandardMaterial color="#102a5c" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.08]}>
              <planeGeometry args={[3.1, 0.48]} />
              <meshBasicMaterial map={entranceBannerTexture} />
            </mesh>
          </group>

          {/* Biển số phòng 100 chuẩn EIU (3 dải màu: xanh lá, cam, đỏ sẫm) */}
          <group position={[toWorld(18.25, 7.8)[0], 1.8, toWorld(18.25, 7.8)[1]]} rotation-y={-b6Layout.rotationY}>
            <mesh position={[0, 0, 0.04]}>
              <boxGeometry args={[0.32, 0.52, 0.03]} />
              <meshStandardMaterial color="#166534" roughness={0.3} />
            </mesh>
            <mesh position={[0, -0.06, 0.05]}>
              <boxGeometry args={[0.3, 0.22, 0.02]} />
              <meshStandardMaterial color="#ea580c" roughness={0.3} />
            </mesh>
            <Text position={[0, -0.06, 0.065]} fontSize={0.12} color="white" anchorX="center" anchorY="middle">100</Text>
            <mesh position={[0, -0.19, 0.05]}>
              <boxGeometry args={[0.3, 0.11, 0.02]} />
              <meshStandardMaterial color="#991b1b" roughness={0.3} />
            </mesh>
          </group>

          {/* Standee / Roll-up Banner: CYBER SECURITY CENTER */}
          <group position={[toWorld(33.0, 14.5)[0], 1.0, toWorld(33.0, 14.5)[1]]} rotation-y={-b6Layout.rotationY - Math.PI / 4}>
            <mesh position={[0, -0.98, 0]}>
              <boxGeometry args={[0.9, 0.04, 0.35]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[0.85, 1.95]} />
              <meshStandardMaterial color="#ffffff" emissive="#1e3a8a" emissiveIntensity={0.15} />
            </mesh>
          </group>

          {/* Hồ nước cạn sảnh (Reflecting Pool) như ảnh 02 */}
          <group>
            {/* Gờ đá bazan bao quanh hồ nước (u = 10.4..12.4, v = 6.0..22.0) */}
            {(() => {
              const [p1x, p1z] = toWorld(11.4, 14.0);
              return (
                <group position={[p1x, 0.08, p1z]} rotation-y={-b6Layout.rotationY}>
                  {/* Lòng hồ lát đá tối màu */}
                  <mesh position={[0, -0.05, 0]}>
                    <boxGeometry args={[2.0, 0.06, 16.0]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.8} />
                  </mesh>
                  {/* Mặt nước hồ trong xanh phản chiếu nhẹ */}
                  <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
                    <planeGeometry args={[1.9, 15.9]} />
                    <meshStandardMaterial
                      color="#0284c7"
                      roughness={0.05}
                      metalness={0.3}
                      transparent
                      opacity={0.82}
                    />
                  </mesh>
                  {/* 4 Thành gờ đá bazan bao quanh */}
                  <mesh position={[-0.95, 0.06, 0]}>
                    <boxGeometry args={[0.16, 0.18, 16.0]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.85} />
                  </mesh>
                  <mesh position={[0.95, 0.06, 0]}>
                    <boxGeometry args={[0.16, 0.18, 16.0]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.85} />
                  </mesh>
                  <mesh position={[0, 0.06, -7.95]}>
                    <boxGeometry args={[2.0, 0.18, 0.16]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.85} />
                  </mesh>
                  <mesh position={[0, 0.06, 7.95]}>
                    <boxGeometry args={[2.0, 0.18, 0.16]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.85} />
                  </mesh>
                </group>
              );
            })()}
          </group>

        </>
      )}

      {/* =====================================================================
          10. BANNER TREO THÔNG TẦNG (COMMUNITY, SUSTAINABILITY) NHƯ ẢNH 02
          ===================================================================== */}
      <group>
        {/* Banner 1: COMMUNITY (u = 10.05, v = 11.5) */}
        {(() => {
          const [bx, bz] = toWorld(10.05, 11.5);
          return (
            <mesh position={[bx, 4.2, bz]} rotation-y={-b6Layout.rotationY + Math.PI / 2}>
              <planeGeometry args={[1.4, 4.0]} />
              <meshBasicMaterial map={bannerCommunityTexture} />
            </mesh>
          );
        })()}

        {/* Banner 2: SUSTAINABILITY (u = 10.05, v = 16.5) */}
        {(() => {
          const [bx, bz] = toWorld(10.05, 16.5);
          return (
            <mesh position={[bx, 4.2, bz]} rotation-y={-b6Layout.rotationY + Math.PI / 2}>
              <planeGeometry args={[1.4, 4.0]} />
              <meshBasicMaterial map={bannerSustainabilityTexture} />
            </mesh>
          );
        })()}
      </group>

      {/* Cầu thang nối xuyên giếng trời; cao độ theo tầng đang hiển thị. */}
      <BookStaircase position={[toWorld(12, 25.8)[0], floor === 1 ? 0 : -FLOOR_HEIGHT, toWorld(12, 25.8)[1]]} rotationY={Math.PI - b6Layout.rotationY} />
      <group position={[toWorld(12, 34)[0], floor === 1 ? 3.8 : 0, toWorld(12, 34)[1]]} rotation-y={-b6Layout.rotationY}>
        <mesh position={[0, -0.1, 0]}><boxGeometry args={[2.5, 0.2, 2.1]} /><meshStandardMaterial color="#64748b" roughness={0.68} /></mesh>
      </group>
      {floor === 1 && <group position={[toWorld(26.25, 9)[0], 0, toWorld(26.25, 9)[1]]} rotation-y={-b6Layout.rotationY}>
        <mesh position={[0, 0.012, 0]} rotation-x={-Math.PI / 2}><planeGeometry args={[16, 18]} /><meshStandardMaterial color="#cbd5e1" roughness={0.45} /></mesh>
        <mesh position={[0, 3.59, 0]}><boxGeometry args={[16, 0.08, 18]} /><meshBasicMaterial color="#f8fafc" /></mesh>
        {[-4, 3].map(x => <group key={x} position={[x, 3.52, 0]}><mesh><boxGeometry args={[1.1, 0.08, 1.1]} /><meshStandardMaterial color="#e2e8f0" /></mesh><mesh position={[0, -0.045, 0]}><boxGeometry args={[0.75, 0.02, 0.75]} /><meshStandardMaterial color="#94a3b8" /></mesh></group>)}
        <mesh position={[-2, 0.73, -6]}><cylinderGeometry args={[0.85, 0.85, 0.08, 24]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[-2, 0.36, -6]}><cylinderGeometry args={[0.07, 0.25, 0.72, 12]} /><meshStandardMaterial color="#cbd5e1" /></mesh>
      </group>}
      {/* Khung tối cho hai vách kính đầu sảnh. */}
      {[0.08, 47.62].map(v => <group key={v} position={[toWorld(14, v)[0], floor === 1 ? 0 : -3.8, toWorld(14, v)[1]]} rotation-y={-b6Layout.rotationY}>
        <StaticInstances items={atriumPanes}>
          <planeGeometry /><meshBasicMaterial color="#c9e4ee" transparent opacity={0.5} side={2} depthWrite={false} />
        </StaticInstances>
        <StaticInstances items={atriumFrames}>
          <boxGeometry /><meshStandardMaterial color="#334155" />
        </StaticInstances>
      </group>)}
      {/* Buồng thang máy B6 inox */}
      <B6ElevatorBooth />
    </group>
  );
}

/**
 * Buồng thang máy Block 6 (inox bóng, có đèn tầng & nút gọi)
 */
function B6ElevatorBooth() {
  const [worldX, worldZ] = b6Layout.elevator.posWorld;
  const yaw = -b6Layout.rotationY;

  return (
    <group position={[worldX, 0, worldZ]} rotation-y={yaw}>
      {/* Vách buồng thang máy inox */}
      <mesh position={[0, FLOOR_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, FLOOR_HEIGHT, 2.2]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Cửa thang máy 2 cánh inox sáng */}
      <mesh position={[-1.15, 1.25, 0]}>
        <boxGeometry args={[0.08, 2.5, 1.6]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Bảng LED chỉ tầng */}
      <mesh position={[-1.22, 2.7, 0]}>
        <boxGeometry args={[0.04, 0.28, 0.7]} />
        <meshStandardMaterial color="#020617" roughness={0.3} />
      </mesh>
      <mesh position={[-1.25, 2.7, 0]}>
        <boxGeometry args={[0.01, 0.16, 0.4]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={0.85}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}
