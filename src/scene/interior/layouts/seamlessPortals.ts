import type { Vec2 } from '../../../types';
import { getLocalWalkYaw, toLocal as b4ToLocal, toWorld as b4ToWorld } from './b4';
import { b11ToLocal, b11ToWorld } from './b11';

export interface SeamlessPortalHit {
  readonly buildingId: 'b4' | 'b11';
  readonly spawnPos: Vec2;
  readonly overrideYaw?: number;
  readonly snapCamera?: boolean;
  readonly snapCameraDistance?: number;
}

type LocalAABB = readonly [minU: number, maxU: number, minV: number, maxV: number];

const B4_COLONNADE_COLUMNS_U: readonly number[] = [11.5, 19.2, 26.8, 34.4, 42.0, 49.6];
const B4_WEST_COLUMNS_V: readonly number[] = [0.3, 7.0, 14.0, 21.0, 27.7];
const B4_ATRIUM_COLUMNS_U: readonly number[] = [54.2, 62.5, 70.5, 76.8];

/**
 * Các khối tường kín, lõi WC/thang, vách kính, hàng cột, hồ nước trung tâm sảnh B4–B5,
 * rào gạch & bàn ghế tại hai sân pergola Bắc/Nam bên ngoài Block 4.
 */
const B4_EXTERIOR_COLLIDERS: readonly LocalAABB[] = [
  // Lõi Tây đặc tầng 1 lùi sâu vào trong (chừa hành lang Tây u = 0..3.4 & sảnh cửa Tây v = 12.2..15.8)
  [3.4, 11.5, 2.8, 12.2],
  [3.4, 11.5, 15.8, 24.8],
  [4.0, 11.5, 12.2, 15.8],

  // Phần thân kín tầng 1 khối Thư viện (u = 11.5..53.0)
  [11.5, 53.0, 3.2, 24.2],

  // Vách kính & bệ tường Nam v = 24.2..24.85 (chừa cửa Nam u = 46.2..48.4)
  [11.5, 46.2, 24.2, 24.85],
  [48.4, 53.5, 24.2, 24.85],

  // Vách kính & bệ tường Bắc v = 2.75..3.2 (chừa cửa Bắc u = 47.0..50.0)
  [11.5, 47.0, 2.75, 3.2],
  [50.0, 53.5, 2.75, 3.2],

  // Tường & vách kính Đông của Thư viện quay vào Sảnh B4–B5 (chừa cửa chính v = 12.2..15.8)
  [53.0, 53.55, 2.8, 12.2],
  [53.0, 53.55, 15.8, 24.8],

  // Hàng cột hành lang Tây (u = 0.0..0.6) & cột hành lang Nam / Bắc
  ...B4_WEST_COLUMNS_V.map((cv): LocalAABB => [0.0, 0.6, cv - 0.3, cv + 0.3]),
  ...B4_COLONNADE_COLUMNS_U.map((cu): LocalAABB => [cu - 0.3, cu + 0.3, 27.58, 28.22]),
  ...B4_COLONNADE_COLUMNS_U.map((cu): LocalAABB => [cu - 0.3, cu + 0.3, -0.22, 0.42]),

  // Hàng cột 3 tầng của Sảnh lớn B4–B5 & 2 cột sảnh đón Porte-cochère
  ...B4_ATRIUM_COLUMNS_U.map((cu): LocalAABB => [cu - 0.36, cu + 0.36, 0.04, 0.76]),
  ...B4_ATRIUM_COLUMNS_U.map((cu): LocalAABB => [cu - 0.36, cu + 0.36, 27.24, 27.96]),
  [53.84, 54.56, 8.84, 9.56],
  [53.84, 54.56, 18.44, 19.16],
  [76.44, 77.16, 8.84, 9.56],
  [76.44, 77.16, 18.44, 19.16],
  [56.5, 57.1, 31.1, 31.7],
  [61.2, 61.8, 31.1, 31.7],

  // Hồ nước trung tâm Sảnh B4–B5 kèm viền gạch mosaic xanh
  [59.8, 71.2, 7.8, 20.2],

  // Bàn lễ tân / bảo vệ góc Tây Nam Sảnh B4–B5 & bồn cây xanh phía Đông (giáp B5)
  [53.65, 54.55, 20.0, 22.65],
  [75.8, 77.5, 5.5, 22.5],

  // Rào gạch & bàn ghế Pergola phía Bắc (chừa lối đi giữa u = 26.8..29.2 ra Fami/B11)
  [12.0, 26.8, -6.0, -5.72],
  [29.2, 43.8, -6.0, -5.72],
  [12.0, 12.24, -5.72, -2.8],
  [43.56, 43.8, -5.72, -2.8],
  ...[14.5, 19.0, 23.5, 28.0, 32.5, 37.0, 41.3].map((tu): LocalAABB => [tu - 0.62, tu + 0.62, -3.62, -2.68]),

  // Rào gạch & bàn ghế 2 khoang Pergola phía Nam (chừa 2 lối xuống cầu sang Block 3)
  [14.4, 26.6, 33.72, 34.0],
  [14.4, 14.64, 30.8, 33.72],
  [26.36, 26.6, 30.8, 33.72],
  ...[16.5, 20.5, 24.5].map((tu): LocalAABB => [tu - 0.62, tu + 0.62, 30.68, 31.62]),

  [30.6, 43.8, 33.72, 34.0],
  [30.6, 30.84, 30.8, 33.72],
  [43.56, 43.8, 30.8, 33.72],
  ...[32.8, 37.2, 41.6].map((tu): LocalAABB => [tu - 0.62, tu + 0.62, 30.68, 31.62]),
];

/**
 * Hai cánh tường đặc của Block 5 nằm ngoài không gian Sảnh chung B4–B5 (`u = 67.0..77.5, v = 0..28.0`).
 * Nhờ tách riêng vùng rỗng này, người chơi đi xuyên qua giữa Block 4 và Block 5 tự do.
 */
const B5_SOLID_COLLIDERS: readonly LocalAABB[] = [
  [77.5, 98.45, 0.0, 43.0],
  [64.23, 77.5, 28.08, 43.0],
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function resolveCircleAABB(
  local: [number, number],
  box: LocalAABB,
  radius: number
): boolean {
  const [minU, maxU, minV, maxV] = box;
  const [u, v] = local;
  const cu = clamp(u, minU, maxU);
  const cv = clamp(v, minV, maxV);
  const du = u - cu;
  const dv = v - cv;
  const distSq = du * du + dv * dv;

  if (distSq >= radius * radius) return false;

  if (distSq > 1e-8) {
    const dist = Math.sqrt(distSq);
    local[0] = cu + (du / dist) * radius;
    local[1] = cv + (dv / dist) * radius;
    return true;
  }

  const left = u - minU;
  const right = maxU - u;
  const top = v - minV;
  const bottom = maxV - v;
  const minEdge = Math.min(left, right, top, bottom);

  if (minEdge === left) local[0] = minU - radius;
  else if (minEdge === right) local[0] = maxU + radius;
  else if (minEdge === top) local[1] = minV - radius;
  else local[1] = maxV + radius;
  return true;
}

/** Cao độ sàn thềm đá ngoài 6 cửa tầng trệt Block 11 (khớp `Block11Details.tsx`). */
export function getB11ExteriorFloorHeight(x: number, z: number): number | undefined {
  const [u, v] = b11ToLocal(x, z);
  if (u >= 27.9 && u <= 34.1 && v >= -103.5 && v <= -100.15) return 0.20;
  if (u >= 84.9 && u <= 91.1 && v >= -103.5 && v <= -100.15) return 0.20;
  if (u >= 54.7 && u <= 59.7 && v >= -150.4 && v <= -148.0) return 0.20;
  if (u >= 55.0 && u <= 59.4 && v >= -103.5 && v <= -100.9) return 0.20;
  if (u >= 121.5 && u <= 124.1 && v >= -127.9 && v <= -123.3) return 0.20;
  if (u >= -1.0 && u <= 1.4 && v >= -129.75 && v <= -123.25) return 0.20;
  return undefined;
}

/** Cao độ sàn hành lang 4 mặt, hai sân pergola (Bắc/Nam), lối đi B11 & Sảnh lớn B4–B5. */
export function getB4ExteriorFloorHeight(x: number, z: number): number | undefined {
  const [u, v] = b4ToLocal(x, z);
  if (u > 64.23 && v > 28.08) return undefined;

  // Sàn gỗ 2 sân pergola ngoài trời
  if (u >= 12.0 && u <= 43.8 && v >= -6.0 && v <= 0.0) return 0.16;
  if (u >= 14.4 && u <= 26.6 && v >= 28.0 && v <= 34.0) return 0.16;
  if (u >= 30.6 && u <= 43.8 && v >= 28.0 && v <= 34.0) return 0.16;

  // Sàn gạch sáng hành lang 4 mặt, Sảnh lớn B4–B5 & Porte-cochère
  if (u >= 0.0 && u <= 77.5 && v >= -0.5 && v <= 28.25) return 0.14;
  if (u >= 53.5 && u <= 64.2 && v > 28.25 && v <= 33.6) return 0.14;

  // Lối đi mái che nối cửa Tây sang hướng B11
  if (u >= -13.5 && u <= 0.0 && v >= 11.8 && v <= 16.2) return 0.12;

  // Vỉa hè & sân bê tông bao quanh
  if (u >= -3.2 && u <= 77.5 && v >= -9.0 && v <= 33.6) return 0.10;
  return undefined;
}

/**
 * Giải quyết va chạm ngoài trời cho Block 4, cho phép đi bộ tự do bao quanh đủ 4 mặt,
 * lên các sân pergola Bắc/Nam và đi xuyên Sảnh lớn B4–B5 quanh hồ nước trung tâm.
 */
export function resolveB4ExteriorCollision(
  x: number,
  z: number,
  radius: number,
  output: Vec2
): void {
  const [u, v] = b4ToLocal(x, z);
  if (u < -14.5 - radius || u > 79.0 + radius || v < -9.5 - radius || v > 36.0 + radius) {
    return;
  }

  const local: [number, number] = [u, v];
  let hit = false;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < B4_EXTERIOR_COLLIDERS.length; i++) {
      const box = B4_EXTERIOR_COLLIDERS[i];
      if (box && resolveCircleAABB(local, box, radius)) {
        hit = true;
      }
    }
  }

  if (hit) {
    const [wx, wz] = b4ToWorld(local[0], local[1]);
    output[0] = wx;
    output[1] = wz;
  }
}

/**
 * Giải quyết va chạm ngoài trời cho Block 5, khoét rỗng góc Tây Bắc (`u = 67.0..77.5, v = 0..28`)
 * để Sảnh lớn thông tầng B4–B5 nối thông hai tòa nhà hoàn toàn.
 */
export function resolveB5ExteriorCollision(
  x: number,
  z: number,
  radius: number,
  output: Vec2
): void {
  const [u, v] = b4ToLocal(x, z);
  if (u < 63.5 - radius || u > 99.5 + radius || v < -1.0 - radius || v > 44.0 + radius) {
    return;
  }

  const local: [number, number] = [u, v];
  let hit = false;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < B5_SOLID_COLLIDERS.length; i++) {
      const box = B5_SOLID_COLLIDERS[i];
      if (box && resolveCircleAABB(local, box, radius)) {
        hit = true;
      }
    }
  }

  if (hit) {
    const [wx, wz] = b4ToWorld(local[0], local[1]);
    output[0] = wx;
    output[1] = wz;
  }
}

/**
 * Kiểm tra tọa độ ngoài trời có đang nằm trong hành lang dẫn vào 6 cửa tầng trệt của Block 11
 * để bỏ qua tường bao OSM ngay trước ngưỡng cửa, giúp bước thẳng từ ngoài vào trong.
 */
export function isInB11ExteriorDoorPocket(x: number, z: number): boolean {
  const [u, v] = b11ToLocal(x, z);
  if (u >= 55.8 && u <= 58.6 && v >= -149.2 && v <= -147.6) return true;
  if (u >= 30.0 && u <= 32.0 && v >= -104.0 && v <= -102.3) return true;
  if (u >= 55.8 && u <= 58.6 && v >= -104.0 && v <= -102.3) return true;
  if (u >= 87.0 && u <= 89.0 && v >= -104.0 && v <= -102.3) return true;
  if (v >= -129.6 && v <= -123.4 && u >= 0.2 && u <= 1.9) return true;
  if (v >= -127.6 && v <= -123.9 && u >= 121.0 && u <= 122.7) return true;
  return false;
}

/** Phát hiện người chơi đang đi ngoài khuôn viên vừa chạm ngưỡng cửa mở vào B4 hoặc B11. */
export function checkSeamlessEnter(x: number, z: number): SeamlessPortalHit | null {
  // 1. Block 4 — Thư viện EIU
  const [b4u, b4v] = b4ToLocal(x, z);
  // Cửa chính phía Đông bên trong Sảnh lớn B4–B5 (u = 53.5, v = 12.2..15.8)
  if (b4v >= 12.0 && b4v <= 16.0 && b4u >= 52.5 && b4u <= 54.05) {
    return {
      buildingId: 'b4',
      spawnPos: b4ToWorld(61.1, 13.25),
      overrideYaw: getLocalWalkYaw(-1, 0),
      snapCamera: true,
    };
  }
  // Cửa phụ phía Nam ("Lối Vào Thư Viện EIU" u = 46.2..48.4)
  if (b4u >= 46.0 && b4u <= 48.6 && b4v <= 25.25 && b4v >= 23.8) {
    return {
      buildingId: 'b4',
      spawnPos: b4ToWorld(48.5, 25.8),
    };
  }
  // Cửa phụ phía Bắc (u = 47.0..50.0, v = 2.8)
  if (b4u >= 47.0 && b4u <= 50.0 && b4v >= 2.15 && b4v <= 3.6) {
    return {
      buildingId: 'b4',
      spawnPos: b4ToWorld(48.5, 2.2),
    };
  }
  // Cửa phụ phía Tây bên trong hành lang Tây (u = 3.4, v = 12.2..15.8)
  if (b4v >= 12.2 && b4v <= 15.8 && b4u >= 3.0 && b4u <= 4.6) {
    return {
      buildingId: 'b4',
      spawnPos: b4ToWorld(1.8, 14.0),
    };
  }

  // 2. Block 11 — 6 lối ra/vào tầng 1
  const [b11u, b11v] = b11ToLocal(x, z);
  if (b11u >= 55.6 && b11u <= 58.8 && b11v >= -148.45 && b11v <= -147.6) {
    return {
      buildingId: 'b11',
      spawnPos: b11ToWorld(clamp(b11u, 56.1, 58.3), -146.7),
    };
  }
  if (b11u >= 29.8 && b11u <= 32.2 && b11v <= -103.10 && b11v >= -104.0) {
    return {
      buildingId: 'b11',
      spawnPos: b11ToWorld(clamp(b11u, 30.2, 31.8), -104.9),
    };
  }
  if (b11u >= 55.6 && b11u <= 58.8 && b11v <= -103.10 && b11v >= -104.0) {
    return {
      buildingId: 'b11',
      spawnPos: b11ToWorld(clamp(b11u, 56.1, 58.3), -104.9),
    };
  }
  if (b11u >= 86.8 && b11u <= 89.2 && b11v <= -103.10 && b11v >= -104.0) {
    return {
      buildingId: 'b11',
      spawnPos: b11ToWorld(clamp(b11u, 87.2, 88.8), -104.9),
    };
  }
  if (b11v >= -130.0 && b11v <= -123.0 && b11u >= 1.00 && b11u <= 1.9) {
    return {
      buildingId: 'b11',
      spawnPos: b11ToWorld(2.8, clamp(b11v, -129.3, -123.7)),
    };
  }
  if (b11v >= -128.0 && b11v <= -123.5 && b11u <= 121.90 && b11u >= 121.0) {
    return {
      buildingId: 'b11',
      spawnPos: b11ToWorld(120.1, clamp(b11v, -127.3, -124.2)),
    };
  }

  return null;
}

/** Phát hiện người chơi đang đi ở Tầng 1 của B4 hoặc B11 vừa bước qua ngưỡng cửa ra ngoài. */
export function checkSeamlessExit(buildingId: string, x: number, z: number): SeamlessPortalHit | null {
  const id = buildingId.toLowerCase();

  if (id === 'b4') {
    const [u, v] = b4ToLocal(x, z);
    // Ra cửa chính Đông (u >= 66.45, v = 12.2..15.8) → bước thẳng vào Sảnh lớn B4–B5 đối diện hồ nước
    if (v >= 12.2 && v <= 15.8 && u >= 66.45) {
      return {
        buildingId: 'b4',
        spawnPos: b4ToWorld(56.0, 14.0),
        overrideYaw: getLocalWalkYaw(1, 0),
        snapCamera: true,
        snapCameraDistance: 4.0,
      };
    }
    if (u >= 47.0 && u <= 50.0 && v >= 27.55) {
      return {
        buildingId: 'b4',
        spawnPos: b4ToWorld(47.3, 26.2),
      };
    }
    if (u >= 47.0 && u <= 50.0 && v <= 0.45) {
      return {
        buildingId: 'b4',
        spawnPos: b4ToWorld(48.5, 1.2),
      };
    }
    if (v >= 12.2 && v <= 15.8 && u <= 0.45) {
      return {
        buildingId: 'b4',
        spawnPos: b4ToWorld(2.1, 14.0),
      };
    }
    return null;
  }

  if (id === 'b11') {
    const [u, v] = b11ToLocal(x, z);
    if (u >= 55.6 && u <= 58.8 && v <= -147.75) {
      return {
        buildingId: 'b11',
        spawnPos: b11ToWorld(clamp(u, 56.1, 58.3), -149.4),
      };
    }
    if (u >= 29.8 && u <= 32.2 && v >= -103.85) {
      return {
        buildingId: 'b11',
        spawnPos: b11ToWorld(clamp(u, 30.2, 31.8), -102.0),
      };
    }
    if (u >= 55.6 && u <= 58.8 && v >= -103.85) {
      return {
        buildingId: 'b11',
        spawnPos: b11ToWorld(clamp(u, 56.1, 58.3), -102.0),
      };
    }
    if (u >= 86.8 && u <= 89.2 && v >= -103.85) {
      return {
        buildingId: 'b11',
        spawnPos: b11ToWorld(clamp(u, 87.2, 88.8), -102.0),
      };
    }
    if (v >= -130.0 && v <= -123.0 && u <= 1.75) {
      return {
        buildingId: 'b11',
        spawnPos: b11ToWorld(-0.1, clamp(v, -129.3, -123.7)),
      };
    }
    if (v >= -128.0 && v <= -123.5 && u >= 121.15) {
      return {
        buildingId: 'b11',
        spawnPos: b11ToWorld(123.0, clamp(v, -127.3, -124.2)),
      };
    }
  }

  return null;
}
