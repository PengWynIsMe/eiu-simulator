// Hợp đồng chung "Cuộc sống IT Silver". Sửa file này phải báo điều phối (xem docs/it-silver/HOP-DONG.md).
import type { CourseBlock, LocalizedText } from './index';

// ---------- 1. Môn học (src/data/silver/courses.ktpm.json) ----------
export type TermId = `${1 | 2 | 3 | 4 | 5}.${1 | 2 | 3 | 4}`; // ".4" = kỳ hè
export type ChapterId = 'entrance' | TermId;
/** none: PDF để trống. all: cần đủ. unclear: PDF không rõ. unresolved: có mã không tồn tại. */
export type PrereqMode = 'none' | 'all' | 'unclear' | 'unresolved';

export interface SilverCourse {
  code: string;
  name: LocalizedText;
  credits: number;
  lt: number;
  th: number;
  kind: 'required' | 'elective';
  block: CourseBlock;
  group?: string;
  pdfTerm: string | null;
  aliases: string[];
  prereq: { mode: PrereqMode; codes: string[]; raw: string };
  /** "Học trước" và "song hành": PDF KTPM không có dòng nào nên luôn là []. Giữ riêng, không gộp với prereq. */
  prestudy: string[];
  coreq: string[];
  english: string | null;
  opens: string[];
  /** Trang PDF (số trang file). table = bảng quan hệ, desc = mô tả môn. */
  pdf: { table: number | null; desc: number };
  ltThUnclear?: boolean;
}
export interface SilverElectiveGroup {
  id: string;
  title: LocalizedText;
  minCredits: number;
  pdfSlots: string[];
  courses: string[];
}
export interface SilverCatalog {
  version: 1;
  majorId: string;
  source: string;
  courses: SilverCourse[];
  groups: SilverElectiveGroup[];
  specializationRule: { minCredits: number; completeOneOf: string[] };
}

// ---------- 2. Lịch game (src/data/silver/plan.ktpm.json) ----------
export interface PlanTerm {
  term: TermId;
  kind: 'english' | 'registration' | 'graduation';
  core: string[];
  courses: string[];
  electives: { group: string; default: string }[];
  credits: number;
}
export interface GamePlan {
  version: 1;
  majorId: string;
  /** Luôn false: lịch trải nghiệm, không phải thời khóa biểu chính thức EIU. */
  official: false;
  terms: PlanTerm[];
}

// ---------- 3. Nội dung ----------
export type SpeakerId = 'player' | 'thanh' | 'quyen' | 'han' | 'teacher' | 'examiner' | 'guide' | 'narrator';
/** Điều kiện đọc trạng thái đã lưu. Mọi trường có mặt đều phải đúng. */
export interface Cond {
  /** id cảnh/buổi đã chơi tới cuối (bỏ qua thì không tính). */
  seen?: string;
  /** Lựa chọn cũ: khóa flag và giá trị cần bằng. */
  flag?: { key: string; is: string };
}
export interface TextVariant {
  when: Cond;
  text: LocalizedText;
}
export interface Option {
  id: string;
  text: LocalizedText;
  /** Lời đáp sau khi chọn. */
  reply?: LocalizedText;
}
interface StepBase {
  /** Duy nhất trong một SceneContent. */
  id: string;
}
export interface SayStep extends StepBase {
  type: 'say';
  speaker: SpeakerId;
  text: LocalizedText;
  /** Phần tử đầu tiên khớp thắng; không khớp thì dùng text. */
  variants?: TextVariant[];
}
/** Lựa chọn không có đúng/sai. Nếu có flag thì ghi flags[flag] = id. */
export interface ChoiceStep extends StepBase {
  type: 'choice';
  speaker: SpeakerId;
  text: LocalizedText;
  options: Option[];
  flag?: string;
}
export interface SlideStep extends StepBase {
  type: 'slide';
  title: LocalizedText;
  body: LocalizedText;
  code?: string;
}
export interface QuestionStep extends StepBase {
  type: 'question';
  prompt: LocalizedText;
  /** Văn bản đọc hoặc lời thoại nghe. */
  passage?: LocalizedText;
  passageKind?: 'reading' | 'listening';
  code?: string;
  options: Option[];
  answerId: string;
  explainCorrect: LocalizedText;
  explainWrong: LocalizedText;
}
/** Sắp câu: người chơi xếp items theo thứ tự answer. */
export interface OrderStep extends StepBase {
  type: 'order';
  prompt: LocalizedText;
  items: { id: string; text: LocalizedText }[];
  answer: string[];
  explainCorrect: LocalizedText;
  explainWrong: LocalizedText;
}
/** Điền đúng 1 chỗ trống "___". Không chạy code thật. */
export interface CodeStep extends StepBase {
  type: 'code';
  title: LocalizedText;
  instruction: LocalizedText;
  template: string;
  answers: string[];
  outputCorrect: string;
  outputWrong: string;
  hint: LocalizedText;
  explainWrong: LocalizedText;
}
export type SilverStep = SayStep | ChoiceStep | SlideStep | QuestionStep | OrderStep | CodeStep;
export type GradedStep = QuestionStep | OrderStep | CodeStep;

export interface SceneContent {
  /** "1.1/greet-han" hoặc "CSE 103/lab-1". */
  id: string;
  title: LocalizedText;
  /** Mã phòng ("406.B8") hoặc mã tòa ("b8"). */
  place: string;
  minutes: number;
  steps: SilverStep[];
}
/** src/data/silver/chapters/<chapterId>.json */
export interface ChapterContent {
  version: 1;
  id: ChapterId;
  title: LocalizedText;
  subtitle: LocalizedText;
  /** Hiện khi vào thẳng mà chưa chơi các chương trước. */
  recap: LocalizedText;
  /** Chương không đăng ký môn: chơi opening → scenes → closing. Chương đăng ký: opening → các buổi theo tuần → closing. */
  opening: SceneContent[];
  scenes: SceneContent[];
  closing: SceneContent[];
  /** level 1–5 nếu kết thúc bằng bảng điểm. */
  englishLevel?: 1 | 2 | 3 | 4 | 5;
  memory: MemoryTemplate;
}
export type SessionKind = 'theoryA' | 'theoryB' | 'lab' | 'project';
export interface CourseSession {
  slot: SessionKind;
  scene: SceneContent;
}
/** src/data/silver/content/<ma-mon-viet-thuong>.json, vd cse-103.json */
export interface CourseContent {
  version: 1;
  code: string;
  tier: 'core' | 'summary';
  status: 'nhap' | 'da-duyet';
  /** Trang PDF dùng làm căn cứ + câu cho người chơi biết đây là mô phỏng. */
  basis: { pdfPages: string; note: LocalizedText };
  summary: LocalizedText;
  sessions: CourseSession[];
  /** Chỉ core. */
  exam?: SceneContent;
  /** Một câu kết môn, hiện ở cảnh cuối kỳ. */
  closing: LocalizedText;
}
export interface MemoryTemplate {
  stamp: LocalizedText;
  /** Phần tử đầu tiên khớp là mặc định gợi ý; phần tử cuối không có when. */
  photos: { id: string; when?: Cond; caption: LocalizedText }[];
  lines: { id: string; when?: Cond; text: LocalizedText }[];
  activities: LocalizedText[];
}

// ---------- 4. Logic ----------
export type CourseStatusCode = 'available' | 'done' | 'missing-prereq' | 'needs-confirmation' | 'no-content';
export interface CourseStatus {
  code: CourseStatusCode;
  missing: string[];
}
export interface Meeting {
  code: string;
  kind: SessionKind;
  /** 0 = thứ Hai … 5 = thứ Bảy. */
  day: 0 | 1 | 2 | 3 | 4 | 5;
  /** 0–1 = sáng, 2–3 = chiều. Mỗi ca 2 giờ, minh họa. */
  slot: 0 | 1 | 2 | 3;
  length: 1 | 2;
}
export type Grade = 'A' | 'B' | 'C' | 'D';
export interface Transcript {
  level: 1 | 2 | 3 | 4 | 5;
  listening: Grade;
  reading: Grade;
  writing: Grade;
  speaking: Grade;
}
export interface RunItem {
  id: string;
  kind: 'scene' | 'session' | 'exam' | 'transcript' | 'memory';
  /** Với scene/session/exam; transcript/memory không có. */
  scene?: SceneContent;
  courseCode?: string;
  meeting?: Meeting;
  minutes: number;
}

// ---------- 5. Lưu (localStorage "campussim.silver.v1") ----------
export interface NotebookEntry {
  chapterId: ChapterId;
  photoId: string;
  lineId: string;
  courses: string[];
  /** ISO. */
  savedAt: string;
}
export interface SavedRun {
  chapterId: ChapterId;
  /** Mã môn đã chốt (rỗng nếu chương không đăng ký). */
  courses: string[];
  /** id của RunItem sắp chơi. Vào lại thì chơi item này từ bước 0. */
  itemId: string;
}
export interface SilverSave {
  version: 1;
  seed: string;
  flags: Record<string, string>;
  seen: string[];
  registrations: Partial<Record<TermId, string[]>>;
  doneChapters: ChapterId[];
  run: SavedRun | null;
  notebook: NotebookEntry[];
}

// ---------- 6. API cho UI ----------
export type SilverScreen = 'closed' | 'home' | 'recap' | 'registration' | 'week' | 'play' | 'transcript' | 'memory' | 'notebook';
export interface ChapterCard {
  id: ChapterId;
  title: LocalizedText;
  subtitle: LocalizedText;
  minutes: number;
  status: 'coming-soon' | 'new' | 'in-progress' | 'done';
}
export interface RegistrationRow {
  code: string;
  name: LocalizedText;
  credits: number;
  lab: boolean;
  tier: 'core' | 'summary' | 'quick';
  selected: boolean;
  /** Môn trọng tâm: không bỏ được. */
  locked: boolean;
  suggested: boolean;
  status: CourseStatus;
}
export interface RegistrationView {
  chapterId: TermId;
  rows: RegistrationRow[];
  credits: number;
  minutes: number;
  maxCourses: number;
  /** 'too-few' | 'too-many' | null */
  problem: 'too-few' | 'too-many' | null;
  meetings: Meeting[];
}
export interface WeekView {
  chapterId: TermId;
  meetings: (Meeting & { done: boolean; current: boolean })[];
  names: Record<string, LocalizedText>;
}
export type Feedback =
  | { kind: 'choice'; optionId: string; reply?: LocalizedText }
  | { kind: 'graded'; correct: boolean; explain?: LocalizedText; output?: string; revealed: boolean; correctAnswer?: string };
export interface PlayView {
  chapterId: ChapterId;
  itemIndex: number;
  itemCount: number;
  item: RunItem;
  stepIndex: number;
  stepCount: number;
  /** Đã áp variants: với say, text là câu cuối cùng cần hiện. */
  step: SilverStep;
  feedback: Feedback | null;
  attempts: number;
  hint: LocalizedText | null;
  canContinue: boolean;
}
export interface MemoryView {
  chapterId: ChapterId;
  title: LocalizedText;
  stamp: LocalizedText;
  photo: { id: string; caption: LocalizedText };
  photoChoices: { id: string; caption: LocalizedText }[];
  line: { id: string; text: LocalizedText };
  courses: { code: string; name: LocalizedText }[];
  activities: LocalizedText[];
  /** Đã có trang cũ: hỏi giữ hay thay. */
  hasOld: boolean;
  savedAt: string | null;
}
export interface SilverApi {
  status: 'loading' | 'ready' | 'error';
  /** Có khi lưu hỏng / localStorage bị chặn: UI hiện dải báo, vẫn chơi được. */
  saveWarning: 'blocked' | 'corrupt' | null;
  screen: SilverScreen;
  chapters: ChapterCard[];
  resumeId: ChapterId | null;
  recap: { chapterId: ChapterId; text: LocalizedText } | null;
  registration: RegistrationView | null;
  week: WeekView | null;
  play: PlayView | null;
  transcript: Transcript | null;
  memory: MemoryView | null;
  notebook: MemoryView[];

  load: () => Promise<void>;
  openHome: () => void;
  close: () => void;
  openNotebook: () => void;
  /** resume chỉ có tác dụng nếu chương đó đang dở. */
  startChapter: (id: ChapterId, mode: 'resume' | 'restart') => void;
  confirmRecap: () => void;
  toggleCourse: (code: string) => void;
  resetRegistration: () => void;
  confirmRegistration: () => void;
  openWeek: () => void;
  /** Từ week → play. */
  playNext: () => void;
  /** choice/question: optionId. code: chuỗi điền. order: id nối bằng dấu phẩy. */
  answer: (value: string) => void;
  retry: () => void;
  revealAnswer: () => void;
  showHint: () => void;
  nextStep: () => void;
  /** Bỏ qua cảnh hiện tại; không ghi seen, không ghi flag. */
  skipItem: () => void;
  /** Về home, giữ chỗ ở đầu cảnh hiện tại. */
  exitRun: () => void;
  confirmTranscript: () => void;
  pickPhoto: (photoId: string) => void;
  saveMemory: (mode: 'keep-old' | 'replace') => void;
  clearAll: () => void;
}
export interface UseSilver {
  <T>(selector: (s: SilverApi) => T): T;
  getState: () => SilverApi;
}
