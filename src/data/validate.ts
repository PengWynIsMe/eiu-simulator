// Hàm kiểm tra dữ liệu dùng chung: JSON sai thì báo lỗi rõ ràng ("Dữ liệu sai ở ...").
import type { Vec2 } from '../types';

export class DataError extends Error {}

export function fail(path: string, expected: string): never {
  throw new DataError(`Dữ liệu sai ở ${path}: cần ${expected}`);
}

export function obj(v: unknown, path: string): Record<string, unknown> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) fail(path, 'object');
  return v as Record<string, unknown>;
}

export function arr(v: unknown, path: string): unknown[] {
  if (!Array.isArray(v)) fail(path, 'mảng');
  return v;
}

export function str(v: unknown, path: string): string {
  if (typeof v !== 'string' || v === '') fail(path, 'chuỗi khác rỗng');
  return v;
}

export function num(v: unknown, path: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) fail(path, 'số');
  return v;
}

export function optStr(v: unknown, path: string): string | undefined {
  return v === undefined ? undefined : str(v, path);
}

export function vec2(v: unknown, path: string): Vec2 {
  const a = arr(v, path);
  if (a.length !== 2) fail(path, '[x, z]');
  return [num(a[0], `${path}[0]`), num(a[1], `${path}[1]`)];
}

export function polygon(v: unknown, path: string): Vec2[] {
  const pts = arr(v, path).map((p, i) => vec2(p, `${path}[${i}]`));
  if (pts.length < 3) fail(path, 'đa giác ≥ 3 điểm');
  return pts;
}

export function oneOf<T extends string>(v: unknown, options: readonly T[], path: string): T {
  const found = options.find((o) => o === v);
  if (found === undefined) fail(path, options.join(' | '));
  return found;
}
