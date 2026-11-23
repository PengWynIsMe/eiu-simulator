// Kiểu cho Giai đoạn 2: nhân vật, phòng học, buổi học, NPC ngoài trời.
// Tọa độ phòng học là (u, v) hệ địa phương của tòa (frame), scene đổi sang thế giới.
import type { Vec2 } from './index';
import type { SpeakerId } from './silver';

// ---- Nhân vật (characters.json) ----

export type CharacterClip = 'idle' | 'walk' | 'run' | 'sit' | 'yes' | 'no' | 'interact' | 'raiseHand';

export interface CharacterConfig {
  /** Hệ số phóng model (model cao 0.671 đơn vị → 2.0 = 1.34 m). */
  scale: number;
  /** Chiều cao nhân vật sau khi phóng (m). */
  height: number;
  /** Bán kính va chạm (m). */
  radius: number;
  /** Độ cao mắt camera góc thứ nhất (m). */
  eyeHeight: number;
  /** Tên vai trò → tên clip trong GLB. */
  clips: Record<CharacterClip, string>;
  /** Đường dẫn GLB đã ghép BASE_URL, dùng thẳng cho useGLTF. */
  roles: {
    player: string;
    playerAlt: string;
    teacher: string;
    teacherAlt: string;
    guard: string;
    worker: string;
    students: string[];
  };
  story?: Partial<Record<SpeakerId, string>>;
}

// ---- Phòng học (classrooms.json) ----

/** Điểm (u, v) trong hệ địa phương của tòa. */
export interface LocalPoint {
  u: number;
  v: number;
}

export interface Seat extends LocalPoint {
  id: string;
  /** u của tâm bàn trước mặt ghế. */
  deskU: number;
}

export interface WallBoard extends LocalPoint {
  width: number;
  height: number;
  /** Mép dưới cách sàn (m). */
  bottom: number;
  /** Hướng mặt nhìn trong hệ (u, v). */
  facing: Vec2;
}

export interface Classroom {
  code: string;
  name: string;
  buildingId: string;
  floor: number;
  /** Hệ tọa độ địa phương của tòa nhà. */
  frame: 'b11' | 'b8';
  bounds: { minU: number; maxU: number; minV: number; maxV: number };
  door: LocalPoint;
  /** Cửa phòng phía hành lang, tọa độ thế giới — UI dùng cho la bàn. */
  doorWorld: Vec2;
  centerWorld: Vec2;
  /** Nơi người chơi xuất hiện khi bấm "Bắt đầu buổi học" (cùng tầng). */
  arrival: LocalPoint;
  /** Hướng sinh viên nhìn khi ngồi (về phía bảng). */
  studentFacing: Vec2;
  whiteboard: WallBoard;
  projectorScreen: WallBoard;
  projector: LocalPoint & { y: number; size: [number, number, number] };
  teacherDesk: LocalPoint & { width: number; depth: number; height: number; facing: Vec2 };
  teacherSpots: { lecture: LocalPoint; desk: LocalPoint };
  desk: { depth: number; width: number; height: number };
  chairSeatHeight: number;
  aisle: { minV: number; maxV: number };
  ceilingLights: LocalPoint[];
  airConditioners: (LocalPoint & { y: number })[];
  seats: Seat[];
  playerSeat: string;
  companionSeat?: string;
  standPoint?: LocalPoint;
  sitYOffset?: number;
  npcSeats: string[];
}

// ---- Buổi học (lessons/*.json) ----

export type Speaker = 'teacher' | 'player';

export interface DialogueOption {
  id: string;
  text: string;
  /** Câu thầy đáp lại sau khi chọn. */
  reply?: string;
}

export interface Slide {
  title: string;
  code?: string;
  body: string;
}

export interface DialogueStep {
  type: 'dialogue';
  id: string;
  speaker: Speaker;
  text: string;
  options: DialogueOption[];
}

export interface LectureStep {
  type: 'lecture';
  id: string;
  slides: Slide[];
}

export interface QuestionStep {
  type: 'question';
  id: string;
  speaker: Speaker;
  prompt: string;
  code?: string;
  options: DialogueOption[];
  answerId: string;
  explainCorrect: string;
  explainWrong: string;
}

export interface ExerciseStep {
  type: 'exercise';
  id: string;
  title: string;
  instruction: string;
  /** Code mẫu, chỗ trống ghi là "___" (đúng 1 chỗ). */
  template: string;
  /** Đáp án chấp nhận (so sánh sau khi bỏ khoảng trắng hai đầu). */
  answers: string[];
  outputCorrect: string;
  outputWrong: string;
  hint: string;
  explainWrong: string;
}

export interface SummaryStep {
  type: 'summary';
  id: string;
  speaker: Speaker;
  text: string;
}

export type LessonStep = DialogueStep | LectureStep | QuestionStep | ExerciseStep | SummaryStep;

export interface Lesson {
  id: string;
  course: string;
  title: string;
  time: string;
  roomCode: string;
  teacherName: string;
  durationMinutes: number;
  passportStamp: string;
  steps: LessonStep[];
}

// ---- NPC ngoài trời (npc-routes.json, sinh tự động) ----

export interface NpcRoute {
  id: string;
  kind: 'internal' | 'footway' | 'bridge';
  /** true = tuyến khép kín đi vòng; false = đi tới cuối rồi quay lại. */
  loop: boolean;
  /** Đi lệch sang phải theo hướng đi (m), như đi trên vỉa hè. */
  sideOffset: number;
  length: number;
  points: Vec2[];
}

export interface NpcStandPoint {
  id: string;
  position: Vec2;
  note: string;
}

export interface NpcRoutes {
  routes: NpcRoute[];
  guards: (NpcStandPoint & { facing: Vec2 })[];
  groups: (NpcStandPoint & { size: number })[];
}
