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

/**
 * Các khối tường, lõi WC/thang, vách kính lùi sâu tầng 1 & hệ cột tầng trệt bên ngoài Block 4.
 * Khớp trực tiếp hình học dựng trong `Block4Library.tsx` để người chơi đi tự do dưới hành lang cột
 * và bước thẳng tới các cửa kính (Lối Vào Thư Viện EIU, sảnh Atrium B4–B5, cửa Bắc, cửa Tây).
 */
const B4_EXTERIOR_COLLIDERS: readonly LocalAABB[] = [
  // Lõi Tây đặc (chừa hốc cửa Tây v = 12.2..15.8)
  [0.0, 11.5, 0.0, 12.2],
  [0.0, 11.5, 15.8, 28.0],
  [0.6, 11.5, 12.2, 15.8],
  // Phần thân kín tầng 1 lùi sau hành lang Nam (v = 24.8) & Bắc (v = 2.6)
  [11.5, 67.0, 3.2, 24.2],
  // Vách kính & bệ tường Nam v = 24.2..24.8 (chừa cửa Nam u = 46.2..48.4 & Atrium u = 58.2..62.8)
  [11.5, 46.2, 24.2, 24.8],
  [48.4, 58.2, 24.2, 24.8],
  [62.8, 67.0, 24.2, 24.8],
  // Vách kính & bệ tường Bắc v = 2.6..3.2 (chừa cửa Bắc u = 47.0..50.0)
  [11.5, 47.0, 2.6, 3.2],
  [50.0, 67.0, 2.6, 3.2],
  // Trụ tường nâu mận đầu Đông Bắc / Đông Nam (u = 49.6..54.0)
  [49.6, 54.0, 27.45, 28.0],
  [49.6, 54.0, 0.0, 0.55],
  // Hàng cột vuông kem hành lang Nam & Bắc
  ...B4_COLONNADE_COLUMNS_U.map((cu): LocalAABB => [cu - 0.3, cu + 0.3, 27.58, 28.22]),
  ...B4_COLONNADE_COLUMNS_U.map((cu): LocalAABB => [cu - 0.3, cu + 0.3, -0.22, 0.42]),
  // 2 cột sảnh đón Porte-cochère phía Đông Nam
  [58.0, 58.6, 31.1, 31.7],
  [61.9, 62.5, 31.1, 31.7],
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

  // Tâm nhân vật nằm hẳn bên trong AABB: đẩy ra cạnh gần nhất
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

/** Cao độ sàn hành lang cột, sảnh đón & vỉa hè ngoài Block 4. */
export function getB4ExteriorFloorHeight(x: number, z: number): number | undefined {
  const [u, v] = b4ToLocal(x, z);
  if (u >= 11.0 && u <= 67.0 && v >= 24.5 && v <= 28.35) return 0.14;
  if (u >= 11.0 && u <= 67.0 && v >= -0.25 && v <= 2.8) return 0.14;
  if (u >= 55.0 && u <= 64.2 && v >= 31.6 && v <= 33.6) return 0.14;
  if (u >= 11.0 && u <= 64.2 && v > 28.35 && v <= 31.6) return 0.10;
  return undefined;
}

/**
 * Giải quyết va chạm ngoài trời riêng cho Block 4, cho phép đi vào hành lang rìa lùi sâu
 * và lướt tự nhiên quanh hàng cột cho tới tận cửa kính.
 */
export function resolveB4ExteriorCollision(
  x: number,
  z: number,
  radius: number,
  output: Vec2
): void {
  const [u, v] = b4ToLocal(x, z);
  if (u < -radius - 1 || u > 67.0 + radius + 1 || v < -radius - 1 || v > 33.0 + radius + 1) {
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
 * Kiểm tra tọa độ ngoài trời có đang nằm trong hành lang dẫn vào 6 cửa tầng trệt của Block 11
 * để bỏ qua tường bao OSM ngay trước ngưỡng cửa, giúp bước thẳng từ ngoài vào trong.
 */
export function isInB11ExteriorDoorPocket(x: number, z: number): boolean {
  const [u, v] = b11ToLocal(x, z);
  // Cửa Bắc (hướng B8)
  if (u >= 55.8 && u <= 58.6 && v >= -149.2 && v <= -147.6) return true;
  // Cửa Nam Tây (103), Nam Giữa, Nam Đông (101)
  if (u >= 30.0 && u <= 32.0 && v >= -104.0 && v <= -102.3) return true;
  if (u >= 55.8 && u <= 58.6 && v >= -104.0 && v <= -102.3) return true;
  if (u >= 87.0 && u <= 89.0 && v >= -104.0 && v <= -102.3) return true;
  // Cửa Tây (hướng B10) & Cửa Đông (hướng Nhà xe / B4)
  if (v >= -129.6 && v <= -123.4 && u >= 0.2 && u <= 1.9) return true;
  if (v >= -127.6 && v <= -123.9 && u >= 121.0 && u <= 122.7) return true;
  return false;
}

/** Phát hiện người chơi đang đi ngoài khuôn viên vừa chạm ngưỡng cửa mở vào B4 hoặc B11. */
export function checkSeamlessEnter(x: number, z: number): SeamlessPortalHit | null {
  // 1. Block 4 — Thư viện EIU
  const [b4u, b4v] = b4ToLocal(x, z);
  if (b4u >= 46.0 && b4u <= 48.6 && b4v <= 25.25 && b4v >= 23.8) {
    return {
      buildingId: 'b4',
      spawnPos: b4ToWorld(48.5, 25.8),
    };
  }
  if (b4u >= 58.2 && b4u <= 62.8 && b4v <= 25.25 && b4v >= 23.8) {
    return {
      buildingId: 'b4',
      spawnPos: b4ToWorld(61.1, 13.25),
      overrideYaw: getLocalWalkYaw(-1, 0),
      snapCamera: true,
    };
  }
  if (b4u >= 47.0 && b4u <= 50.0 && b4v >= 2.15 && b4v <= 3.6) {
    return {
      buildingId: 'b4',
      spawnPos: b4ToWorld(48.5, 2.2),
    };
  }
  if (b4v >= 12.2 && b4v <= 15.8 && b4u >= -0.25 && b4u <= 1.2) {
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
    if (v >= 12.2 && v <= 15.8 && u >= 66.45) {
      return {
        buildingId: 'b4',
        spawnPos: b4ToWorld(60.5, 29.2),
        overrideYaw: getLocalWalkYaw(0, 1),
        snapCamera: true,
        snapCameraDistance: 3.6,
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
        spawnPos: b4ToWorld(-1.3, 14.0),
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
