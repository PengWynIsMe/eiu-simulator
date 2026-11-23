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

export interface RoomEntry {
  code?: string;
  name: string;
}

export interface RoomGroup {
  title?: string;
  rooms: RoomEntry[];
}

export interface BuildingFloorDetail {
  floorNumber: number;
  label: string;
  elevation: string;
  architecturalNote: string;
  groups: RoomGroup[];
}

export interface InfoSource {
  status: 'xac-minh' | 'chua-xac-minh';
  label: string;
  url?: string;
}

export interface BuildingDetail {
  subtitle: string;
  facts: string[];
  floors?: BuildingFloorDetail[];
  source: InfoSource;
}

// ---- Góp ý trực tiếp trên mô hình (chế độ góp ý) ----

export type Vec3 = [number, number, number];

export type ReviewCategory = 'vi-tri' | 'hinh-dang' | 'mau' | 'so-tang' | 'thieu' | 'khac';

export type ReviewStatus = 'mo' | 'da-sua';

export interface ReviewNote {
  id: string;
  createdAt: string;
  author: string;
  /** id tòa nhà/vật thể được bấm; null = ghim trên mặt đất (vd "thiếu nhà xe ở đây"). */
  targetId: string | null;
  /** Điểm bấm trong thế giới 3D (mét). */
  point: Vec3;
  /** Góc camera lúc ghi, để dựng lại đúng góc nhìn. */
  camera: { position: Vec3; target: Vec3 };
  category: ReviewCategory;
  text: string;
  status: ReviewStatus;
  /** Claude ghi đã sửa gì khi chuyển sang 'da-sua'. */
  resolution?: string;
  /** 'github' = đọc từ GitHub Issue (chỉ đổi trạng thái trên GitHub); mặc định là ghi chú cục bộ. */
  source?: 'local' | 'github';
  issueUrl?: string;
}

export type * from './lesson';
export type * from './major';
