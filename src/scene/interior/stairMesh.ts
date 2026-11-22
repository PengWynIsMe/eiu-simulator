import { Matrix4, Vector3 } from 'three';
import { FLOOR_HEIGHT } from '../../data';
import type { Vec2 } from '../../types';
import { createInstanceMatrix } from './InteriorFurniture';

const UP_VEC = new Vector3(0, 1, 0);

export function makeRampSlabMatrix(
  toWorld: (u: number, v: number) => Vec2,
  u1: number,
  v1: number,
  y1: number,
  u2: number,
  v2: number,
  y2: number,
  crossWidth: number,
  thickness: number
): Matrix4 {
  const [x1, z1] = toWorld(u1, v1);
  const [x2, z2] = toWorld(u2, v2);
  const a = new Vector3(x1, y1, z1);
  const b = new Vector3(x2, y2, z2);
  const dir = new Vector3().subVectors(b, a);
  const len = dir.length();
  if (len < 0.01) return new Matrix4().makeScale(0, 0, 0);
  dir.divideScalar(len);
  const cross = new Vector3().crossVectors(UP_VEC, dir).normalize();
  const normal = new Vector3().crossVectors(dir, cross).normalize();
  const mid = new Vector3().addVectors(a, b).multiplyScalar(0.5);
  return new Matrix4()
    .makeBasis(
      cross.multiplyScalar(crossWidth),
      normal.multiplyScalar(thickness),
      dir.multiplyScalar(len)
    )
    .setPosition(mid);
}

export function addSwitchbackFlight(
  toWorld: (u: number, v: number) => Vec2,
  treads: Matrix4[],
  soffits: Matrix4[],
  rails: Matrix4[],
  u1: number,
  v1: number,
  y1: number,
  u2: number,
  v2: number,
  y2: number,
  width: number,
  stepCount: number
): void {
  const du = u2 - u1;
  const dv = v2 - v1;
  const hLen = Math.hypot(du, dv);
  if (hLen < 0.2) return;
  const yaw = -Math.atan2(dv, du);
  const runPerStep = hLen / stepCount;
  const rise = y2 - y1;
  const risePerStep = rise / stepCount;
  const treadThickness = risePerStep + 0.015;

  for (let s = 0; s < stepCount; s++) {
    const u = u1 + du * ((s + 0.5) / stepCount);
    const v = v1 + dv * ((s + 0.5) / stepCount);
    const topY = y1 + rise * ((s + 1) / stepCount);
    treads.push(
      createInstanceMatrix(
        toWorld,
        u,
        v,
        topY - treadThickness * 0.5,
        yaw,
        runPerStep + 0.05,
        treadThickness,
        width
      )
    );
  }

  // Bản thang bê tông mặt dưới phẳng nghiêng (dày hơn độ sụt cổ bậc để mặt dưới gầm Vế 2 hoàn toàn mịn, không lộ sọc đen)
  const yMod = ((y1 % FLOOR_HEIGHT) + FLOOR_HEIGHT) % FLOOR_HEIGHT;
  const trimStart = yMod < 0.05 ? 0.35 / hLen : 0;
  soffits.push(
    makeRampSlabMatrix(
      toWorld,
      u1 + du * trimStart,
      v1 + dv * trimStart,
      y1 + rise * trimStart - 0.12,
      u2,
      v2,
      y2 - 0.12,
      width + 0.04,
      0.24
    )
  );

  // Tay vịn inox 3 thanh dọc hai bên vế thang + trụ đứng
  const perpU = -dv / hLen;
  const perpV = du / hLen;
  const railOffset = width * 0.47;
  for (const side of [-1, 1]) {
    const ox = perpU * railOffset * side;
    const oz = perpV * railOffset * side;
    for (const ry of [0.44, 0.74, 1.04]) {
      const thick = ry > 1.0 ? 0.05 : 0.028;
      rails.push(makeRampSlabMatrix(toWorld, u1 + ox, v1 + oz, y1 + ry, u2 + ox, v2 + oz, y2 + ry, thick, thick));
    }
    for (const t of [0.02, 0.34, 0.67, 0.98]) {
      const pu = u1 + du * t + ox;
      const pv = v1 + dv * t + oz;
      const py = y1 + rise * t;
      rails.push(createInstanceMatrix(toWorld, pu, pv, py + 0.52, 0, 0.04, 1.04, 0.04));
    }
  }
}
