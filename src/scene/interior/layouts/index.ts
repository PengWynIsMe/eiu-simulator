import type { InteriorLayout, InteractivePoint } from '../types';
import { b3Layout } from './b3';
import { b4Layout } from './b4';
import { b8Layout } from './b8';
import { b11Layout } from './b11';

export * from '../types';
export { b3Layout } from './b3';
export { b4Layout } from './b4';
export { b8Layout } from './b8';
export { b11Layout } from './b11';

const layouts: Record<string, InteriorLayout> = {
  b3: b3Layout,
  b4: b4Layout,
  b8: b8Layout,
  b11: b11Layout,
};

export function getInteriorLayout(buildingId: string): InteriorLayout | undefined {
  return layouts[buildingId.toLowerCase()];
}

export function getAllInteriorLayouts(): InteriorLayout[] {
  return Object.values(layouts);
}

export function getAvailableInteriors(): string[] {
  return Object.keys(layouts);
}

/**
 * Kiểm tra người chơi ở ngoài khuôn viên có đang đứng gần cửa vào của bất kỳ tòa nhà nào có nội thất không.
 */
export function getExteriorInteractive(worldX: number, worldZ: number): InteractivePoint | null {
  for (const layout of Object.values(layouts)) {
    const inter = layout.getNearInteractive(worldX, worldZ, null);
    if (inter) return inter;
  }
  return null;
}
