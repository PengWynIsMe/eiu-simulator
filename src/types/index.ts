// Hệ tọa độ: 1 đơn vị = 1 m, gốc = tâm vòng xoay, +X = Đông, -Z = Bắc, Y = lên trên.
// Vec2 là điểm trên mặt đất: [x, z].
export type Vec2 = [number, number];

export type BuildingKind = 'academic' | 'library' | 'admin' | 'canteen' | 'kiosk' | 'parking' | 'gate' | 'other';

/** Mức dựng: 1 = khối hộp đúng chỗ, 2 = nhận ra được, 3 = model GLB riêng. */
export type DetailLevel = 1 | 2 | 3;

/** Thông tin tòa nhà viết tay trong campus.json. */
export interface BuildingInfo {
  id: string;
  /** Khóa sang layout.json (vd "w602270479"). Không có thì phải có `footprint`. */
  osmId?: string;
  /** Khung nền nhập tay, dùng khi OSM không có tòa này. */
  footprint?: Vec2[];
  name: string;
  shortName: string;
  kind: BuildingKind;
  /** Khu vực dựng (1 = trục cổng chính → quảng trường). */
  zone: number;
  floors: number;
  color: string;
  detailLevel: DetailLevel;
  modelUrl?: string;
  majorIds: string[];
  notes?: string;
}

export interface Footprint {
  outer: Vec2[];
  holes: Vec2[][];
}

/** Tòa nhà đã ghép thông tin + hình học, dùng trong app. */
export interface Building extends BuildingInfo {
  shape: Footprint;
  center: Vec2;
  /** Chiều cao ước tính (m) = floors × FLOOR_HEIGHT. */
  height: number;
}

export type RoadKind = 'street' | 'internal' | 'footway' | 'bridge';

export interface Road {
  kind: RoadKind;
  name: string | null;
  lanes: number | null;
  points: Vec2[];
}

export interface Layout {
  roundabout: { center: Vec2; radius: number };
  boundary: Vec2[];
  roads: Road[];
  parking: Vec2[][];
}

export interface Campus {
  id: string;
  name: string;
  buildings: Building[];
  layout: Layout;
}

export interface Major {
  id: string;
  name: string;
  shortDescription: string;
  curriculum: { year: number; courses: Course[] }[];
  dayInLife: string[];
  skills: string[];
  careers: string[];
  source: { label: string; url?: string; updatedAt: string };
}

export interface Course {
  code?: string;
  name: string;
  credits?: number;
  description?: string;
}
