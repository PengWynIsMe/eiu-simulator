// Ngành học + song ngữ. Mọi chuỗi hiển thị cho người chơi là LocalizedText.
export type Lang = 'vi' | 'en';

export interface LocalizedText {
  vi: string;
  en: string;
}

export type FacultyId = 'cntt' | 'ky-thuat' | 'kinh-te';
export type StudyYear = 1 | 2 | 3 | 4;

/** Khối kiến thức theo CTĐT (suy từ tiêu đề mục: "đại cương", "cơ sở ngành", ...). */
export type CourseBlock = 'dai-cuong' | 'co-so-nganh' | 'nganh' | 'chuyen-nganh' | 'bo-tro' | 'tot-nghiep';

export interface Course {
  /** "CSE 103": chữ hoa + 1 dấu cách + số. Mã lạ giữ nguyên: "LNGS-C101", "PED", "MET 100". Là KHÓA ổn định (dùng cho hành trình sau này). */
  code: string;
  name: LocalizedText;
  /** Tổng tín chỉ. "4(3,1)" → 4. */
  credits: number;
  /** Tín chỉ lý thuyết / thực hành nếu PDF có. "4(3,1)" → lt 3, th 1. */
  lt?: number;
  th?: number;
  block: CourseBlock;
  /** Năm học gợi ý. Không có với môn tự chọn chưa xếp năm. */
  year?: StudyYear;
  /** Học kỳ trong năm theo CTĐT (EIU: HK 1–3 chính + HK 4 hè/thực tập). Chỉ có ở BM08. */
  semester?: number;
  /** 'ke-hoach' = lấy từ kế hoạch học tập của PDF; 'ma-mon' = SUY từ mã môn (bản khung). */
  yearSource?: 'ke-hoach' | 'ma-mon';
  /** Mã môn tiên quyết, chỉ khi trích chắc chắn. */
  prerequisites?: string[];
}

/** "Chọn N trong M": N = minCredits (TC) hoặc minCourses (môn); M = courses.length. Phải có ít nhất một trong hai. */
export interface ElectiveGroup {
  /** kebab-case ASCII, duy nhất trong ngành: "dc-xa-hoi", "cn-robot". */
  id: string;
  title: LocalizedText;
  minCredits?: number;
  minCourses?: number;
  /** Nhóm thuộc một chuyên ngành → id chuyên ngành. */
  specializationId?: string;
  /** Điều kiện lạ không diễn tả được bằng min*: "16/20/24 TC tùy chuyên ngành", "hoàn thành ít nhất 1 trong nhóm 1–3". */
  note?: LocalizedText;
  courses: Course[];
}

/** Ô "Tự chọn ... N TC" nằm trong kế hoạch một năm. */
export interface ElectiveSlot {
  groupId: string;
  credits: number;
  semester?: number;
}

export interface YearPlan {
  year: StudyYear;
  /** Môn BẮT BUỘC chung của năm (không gồm môn bắt buộc riêng chuyên ngành). */
  courses: Course[];
  electiveSlots: ElectiveSlot[];
}

export interface Specialization {
  /** kebab-case ASCII, duy nhất trong ngành: "an-ninh-mang". */
  id: string;
  name: LocalizedText;
  requiredCourses: Course[];
  electiveGroupIds: string[];
}

export interface CurriculumSource {
  /** Tên file trong references/ctdt/, vd "BSE.pdf". */
  file: string;
  kind: 'bm08' | 'khung';
  /** Năm ban hành ghi trên bìa; bản khung không ghi → null. */
  year: number | null;
  /** Trang đã dùng, vd "49–56, 75". */
  pages?: string;
}

/** <id>.curriculum.json — SINH bằng scripts/ctdt (N1). */
export interface MajorCurriculum {
  majorId: string;
  programCode: string | null;
  totalCredits: number | null;
  /** true = bản khung không chia năm → mọi `year` đều suy từ mã môn. UI phải ghi chú. */
  yearsInferred: boolean;
  /** Đủ 4 phần tử, year 1 → 4. */
  years: YearPlan[];
  electiveGroups: ElectiveGroup[];
  specializations: Specialization[];
  source: CurriculumSource;
  /** Ngày chạy script, "YYYY-MM-DD". */
  generatedAt: string;
}

export interface Highlight {
  /** Mã môn, PHẢI có trong curriculum (years / specializations / electiveGroups). */
  code: string;
  /** 1 câu: vì sao môn này đáng nhớ. */
  why: LocalizedText;
}

export interface DayMoment {
  /** "07:30" */
  time: string;
  text: LocalizedText;
}

/** <id>.json — viết tay (N2). */
export interface MajorProfile {
  id: string;
  facultyId: FacultyId;
  name: LocalizedText;
  /** Tên văn bằng: "Cử nhân Kỹ thuật phần mềm" / "Bachelor of Software Engineering". */
  degree: LocalizedText;
  /** 2–3 câu. */
  summary: LocalizedText;
  /** 3–5 môn core nổi bật (dùng lại cho "kỷ niệm hành trình"). */
  highlights: Highlight[];
  skills: LocalizedText[];
  careers: LocalizedText[];
  /** "Một ngày của sinh viên" — MINH HỌA, 5–7 mốc. */
  dayInLife: DayMoment[];
  /** 'bm08' = viết từ mục tiêu/chuẩn đầu ra/vị trí việc làm của BM08; 'bang-mon' = bản khung, suy từ bảng môn. */
  contentBasis: 'bm08' | 'bang-mon';
  /** Chủ dự án duyệt nội dung xong mới đổi 'da-duyet'. */
  contentStatus: 'chua-duyet' | 'da-duyet';
  /** "YYYY-MM-DD" */
  updatedAt: string;
}

/** Ngành đã ghép, dùng trong app. */
export interface Major extends MajorProfile {
  curriculum: MajorCurriculum;
}
