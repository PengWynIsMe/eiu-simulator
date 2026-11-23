// Hợp đồng lớp 3D của IT Silver. Chỉ bổ sung, không đổi src/types/silver.ts. Xem docs/it-silver/PLAN-3D.md mục 4.
import type { LocalizedText, Vec2 } from './index';
import type { SpeakerId } from './silver';

/** full = kiểu nmlt-01; light = chung lớp, ít NPC; backdrop = chỉ phông cảnh. */
export type StageTier = 'full' | 'light' | 'backdrop';
/** sit: ngồi ghế; talk: lại gần một người; look: lại gần một vật; none: bắt đầu ngay. */
export type StageTrigger = 'sit' | 'talk' | 'look' | 'none';
export type Pose = 'sit' | 'idle';

/** Điểm thế giới + tầng. Ngoài trời: buildingId và floor đều null. */
export interface WorldSpot {
  buildingId: string | null;
  floor: number | null;
  x: number;
  z: number;
  /** Hướng nhìn [dx, dz] trong thế giới. Không lưu góc (B8 và B11 ngược dấu rotationY). */
  facing: Vec2;
}
export interface StageActor {
  speaker: SpeakerId;
  /** id ghế trong Classroom, hoặc điểm thế giới. Giáo viên có Classroom: bỏ trống, dùng teacherSpots. */
  seatId?: string;
  spot?: WorldSpot;
  pose: Pose;
}
/** Một cảnh nội dung đứng ở đâu. Khóa = SceneContent.id. src/data/silver/stages.json */
export interface StageSpec {
  sceneId: string;
  tier: StageTier;
  trigger: StageTrigger;
  place: LocalizedText;
  /** Mã phòng có trong classrooms.json, hoặc null (ngoài trời / hành lang). */
  roomCode: string | null;
  /** Nơi xuất hiện khi vào thẳng hoặc bấm "Tới nơi luôn" ở trạng thái chưa gần. */
  arrival: WorldSpot;
  /** Đích để la bàn chỉ và để kích hoạt (talk/look: bán kính 1.8 m; sit: ghế playerSeat, 1.2 m). */
  target: WorldSpot;
  actors: StageActor[];
  /** Số NPC nền tối đa (lấy từ đầu npcSeats). */
  crowd: number;
}

// ---- Hoạt động hiện hành: WalkMode chỉ biết cái này, không biết nmlt-01 hay Silver ----
export interface SeatAnchor {
  id: string;
  spot: WorldSpot;
  /** Điểm đứng khi rời ghế. */
  stand: WorldSpot;
  camera: { eye: [number, number, number]; look: [number, number, number] };
  /** Camera sát màn hình; null nếu ghế không có máy. */
  screenCamera: { eye: [number, number, number]; look: [number, number, number] } | null;
}
export type ActivityPhase = 'travel' | 'near' | 'engaged';
export interface Activity {
  /** "lesson:nmlt-01" hoặc "silver:<RunItem.id>". Đổi key = đổi đích. */
  key: string;
  source: 'lesson' | 'silver';
  trigger: StageTrigger;
  arrival: WorldSpot;
  target: WorldSpot;
  seat: SeatAnchor | null;
  /** Nhãn nút E, đã song ngữ. */
  prompt: LocalizedText;
}
export interface ActivityState {
  activity: Activity | null;
  phase: ActivityPhase;
  seated: boolean;
  screenOpen: boolean;
  /** Đang đứng trong tầm kích hoạt. WalkMode ghi, chỉ khi đổi. */
  inRange: boolean;
  /** Tăng mỗi lần cần đặt người chơi; WalkMode đọc một lần cho mỗi giá trị. */
  teleport: { id: number; spot: WorldSpot } | null;
  begin: (a: Activity, opts: { teleportTo: 'arrival' | 'target' | 'none'; keepSeated: boolean }) => void;
  setInRange: (v: boolean) => void;
  /** E: ngồi hoặc bắt chuyện, khi inRange. */
  interact: () => void;
  standUp: () => void;
  setScreenOpen: (open: boolean) => void;
  arriveNow: () => void;
  end: () => void;
}

// ---- Tín hiệu lớp học: Teacher / ProjectorScreen / ClassroomNpcs chỉ đọc cái này ----
export interface ClassSignal {
  mode: 'idle' | 'talk' | 'slide' | 'question' | 'exercise' | 'end';
  /** Đổi mỗi khi bước đổi. */
  stepKey: string;
  speaker: SpeakerId | null;
  slide: { title: string; body: string; code?: string } | null;
  /** Bìa khi không có slide. */
  cover: { title: string; subtitle: string };
  /** Đổi mỗi lần có kết quả mới; null = chưa có. */
  result: { id: number; correct: boolean } | null;
}

// ---- Cho UI (src/ui/silver/presentation.ts) ----
export interface SilverPresentation {
  /** overlay = màn 2D của đồng đội; world = lớp 3D đảm nhận màn play. */
  mode: 'overlay' | 'world';
}
