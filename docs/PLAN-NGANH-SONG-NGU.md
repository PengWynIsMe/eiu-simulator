# Kế hoạch: Ngành học thật của EIU + game song ngữ (Việt / Anh)

Viết: Claude (Opus), 2026-11-23. Nhánh kế hoạch: `PengWynIsMe/nganh-ke-hoach`.
Trạng thái: **kế hoạch + 4 brief đã viết, chưa có code.** Các luồng N1–N3 chạy song song từ nhánh này.

Brief: `docs/tasks/N1-trich-bang-mon.md` (Codex) · `docs/tasks/N2-noi-dung-doi-chieu.md` (Antigravity) ·
`docs/tasks/N3-ngon-ngu-panel-nganh.md` (Claude Sonnet) · `docs/tasks/NR-review-nganh.md` (Codex, review cuối).

---

## 0. Đã chốt (đừng hỏi lại)

| # | Quyết định | Nguồn |
| --- | --- | --- |
| 1 | Dữ liệu ngành lấy từ **8 CTĐT thật** (PDF trong `references/ctdt/`) | chủ dự án |
| 2 | Game **song ngữ**: tiếng Việt mặc định, tiếng Anh thứ hai, nút chuyển VI/EN; lưu lựa chọn | chủ dự án |
| 3 | Mọi chuỗi chữ **mới** có dạng `{ vi, en }` (`LocalizedText`) | chủ dự án |
| 4 | **Không thêm thư viện npm** vào app. Lớp ngôn ngữ tự viết (store Zustand + `t()`) | `AGENTS.md` mục 2 |
| 5 | **Tóm gọn**, không chép cả CTĐT (quy tắc ở mục 5) | chủ dự án |
| 6 | Chừa chỗ cho "kỷ niệm hành trình học" nhưng **KHÔNG làm bây giờ** (mục 8) | chủ dự án |

---

## 1. 8 file CTĐT — là ngành gì (Claude đã đọc lớp chữ PDF)

PDF gốc: `/Users/dinhtrananhminh/.orca/bots/pengwynnn/files/ctdt-eiu/`. Đã copy vào `references/ctdt/` (thư mục này **không lên git**
theo `.gitignore` — worktree khác phải tự copy, lệnh ở mục 9). Danh mục: `references/ctdt/README.md`.

| File | Loại | Trang | Ngành (VI) | Tên chương trình (EN) | Mã ngành Bộ | Khoa | Chuyên ngành | Tổng TC | `id` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `BSE.pdf` | BM08 đầy đủ, 2026 | 78 | **Kỹ thuật phần mềm** | Bachelor of Software Engineering | 7480103 | CNTT | Không có chuyên ngành; tự chọn theo 4 nhóm định hướng: Ứng dụng di động / Front-end / Back-end / Khác | 180 (mục IV) — **mục VI cộng ra 183**, N2 kiểm | `ktpm` |
| `CNDC.pdf` | BM08 đầy đủ, 2026 | 69 | **Mạng máy tính và Truyền thông dữ liệu** | Bachelor of Computer Networks and Data Communications | 7480102 | CNTT | Quản trị mạng MT & truyền thông · An ninh mạng · Internet of Things | 180 | `mmt` |
| `ACE.pdf` | BM08 đầy đủ, 2026 | 86 | **Kỹ thuật Điều khiển và Tự động hóa** | Bachelor of Automation and Control Engineering | 7520216 | Kỹ thuật | Tự động hóa công nghiệp · Hệ thống điều khiển | 186 | `tdh` |
| `BEE.pdf` | BM08 đầy đủ, 2026 | 84 | **Kỹ thuật Điện** | Bachelor of Electrical Engineering | 7520201 | Kỹ thuật | Hệ thống điện & lưới điện thông minh · Năng lượng tái tạo & điện tử công suất | 187 | `dien` |
| `MEE.pdf` | BM08 đầy đủ, 2026 | 86 | **Kỹ thuật Cơ điện tử** | Bachelor of Mechatronics Engineering | 7520114 | Kỹ thuật | Robot · Hệ thống tích hợp | 188 | `cdt` |
| `DTVT.pdf` | Khung ngắn, không ghi năm | 9 | **Kỹ thuật Điện tử – Viễn thông** | (chưa có tên EN trong file) | (không ghi) | Kỹ thuật | Xử lý tín hiệu & hình ảnh · Hệ thống viễn thông · Kỹ thuật cao tần & anten · Thiết kế vi mạch · Hệ thống nhúng | (không ghi tổng) | `dtvt` |
| `COKHI.pdf` | Khung ngắn, không ghi năm | 5 | **Kỹ thuật Cơ khí** | (chưa có tên EN trong file) | (không ghi) | Kỹ thuật | Thiết kế cơ khí · Gia công chế tạo · Hệ thống năng lượng | 186 | `cokhi` |
| `QTKD.pdf` | Khung ngắn, không ghi năm | 7 | **Quản trị kinh doanh** | (chưa có tên EN trong file) | (không ghi) | Kinh tế (BBS) | Kế toán · Tài chính · QT nguồn nhân lực · Marketing · QT chuỗi cung ứng · QT nhà hàng – khách sạn · Khởi nghiệp · Phân tích kinh doanh | (dòng "Tổng" không đọc được số) | `qtkd` |

Tên EN cho 3 bản khung (do N2 đề xuất, đánh dấu chưa duyệt): *Bachelor of Electronics and Telecommunications Engineering*, *Bachelor of Mechanical Engineering*, *Bachelor of Business Administration*.

### Trùng lặp? — **Không trùng ngành**, chỉ chung khối môn cơ sở

So mã môn ngoài khối đại cương (đếm bằng script, xấp xỉ):

| Cặp | Mã chung / mã riêng mỗi bên | Kết luận |
| --- | --- | --- |
| **DTVT ↔ BEE** | 17 / 69 vs 51 | **Khác ngành.** Chung khối cơ sở Khoa Kỹ thuật `ECE 100–300` (mạch điện, tín hiệu & hệ thống, kỹ thuật số, mạch điện tử). DTVT học `ETE` (viễn thông, vi mạch, nhúng, xử lý ảnh); BEE học `EE` (hệ thống điện, năng lượng tái tạo, điện tử công suất). |
| **COKHI ↔ MEE** | 15 / 44 vs 50 | **Khác ngành.** Chung khối cơ khí cơ sở `MEC 100–366`. COKHI đi sâu `ME` (thiết kế, gia công, nhiệt – năng lượng); MEE học thêm điện – điều khiển (`ECE`, `EE`, `ACE`), chuyên ngành Robot / Hệ thống tích hợp. |
| BEE ↔ ACE | 32 / 51 vs 46 | Gần nhau nhất (cùng `ECE` + `EE` + `MEC` robot) nhưng ACE có chuyên ngành điều khiển riêng. Khác ngành. |
| BSE ↔ CNDC | 22 / 97 vs 41 | Chung khối CNTT cơ sở (`CSE 100–302`). Khác ngành. |

→ Giữ đủ **8 ngành riêng**. Khi hiển thị, môn chung giữ **cùng mã** để sau này "hành trình" nhận ra môn đã học ở ngành khác.

---

## 2. Cấu trúc file dữ liệu

Theo đúng mẫu `campus.json` (viết tay) + `layout.json` (sinh tự động) đang có: **mỗi ngành 2 file**, để chạy lại script không đè chữ viết tay.

```
src/data/majors/
  ktpm.json                  # MajorProfile — viết tay (N2): tên, mô tả, môn core, kỹ năng, nghề, một ngày
  ktpm.curriculum.json       # MajorCurriculum — SINH bằng script (N1). Không sửa tay; sửa script rồi chạy lại
  mmt.json / mmt.curriculum.json
  ... (8 ngành: qtkd, ktpm, mmt, tdh, dien, cdt, dtvt, cokhi)
src/data/majors.ts           # nạp + kiểm tra + ghép 2 file mỗi ngành (N3 viết)
scripts/ctdt/                # script trích PDF → *.curriculum.json (N1 viết), package.json riêng
references/ctdt/             # 8 PDF (không lên git) + README.md (lên git)
```

- Loader dùng `import.meta.glob('./majors/*.json', { eager: true, import: 'default' })` → **thêm ngành = thêm 2 file JSON**, không sửa code.
- File `*.curriculum.json` → curriculum; file còn lại → profile. Tên file (bỏ đuôi) phải bằng `id`.
- Thiếu một trong hai file của một ngành → báo lỗi `Dữ liệu sai ở majors/<id>...` (giống `validate.ts`).
- `campus.json`: bỏ khóa `"majors": []` (ngành không còn nằm ở đây). `building.majorIds` giữ nguyên ý nghĩa (mục 7).
- Kích thước ước tính: 8 ngành × ~150 môn → ~150 KB JSON thô (~25 KB gzip). Nạp eager được; nếu sau này nặng mới tách lazy.

---

## 3. Schema TypeScript — `src/types/major.ts` (N3 tạo **đúng như dưới**, không đổi tên trường)

```ts
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
```

`src/types/index.ts`: **xóa** `Major` + `Course` cũ, thêm một dòng `export type * from './major';` (giống `lesson`).

### Kiểm tra trong loader (`src/data/majors.ts`, dùng hàm của `./validate`, thêm `loc()` cho `LocalizedText`)

1. `loc()`: object có `vi` và `en` đều là chuỗi khác rỗng.
2. Tên file = `id` (profile) = `majorId` (curriculum). Mỗi ngành đủ 2 file.
3. `years` đúng 4 phần tử, `year` lần lượt 1..4. `StudyYear` ∈ 1..4. `credits > 0`.
4. Mọi `ElectiveSlot.groupId`, `Specialization.electiveGroupIds[]` trỏ tới nhóm có thật; `ElectiveGroup.specializationId` trỏ tới chuyên ngành có thật.
5. Nhóm tự chọn có `minCredits` hoặc `minCourses`.
6. `highlights[].code` có trong curriculum. `highlights` 3–5 phần tử.
7. Không trùng `code` trong cùng một danh sách (một môn được phép xuất hiện ở nhiều nhóm khác nhau, vd `ETE 341`).
8. `campus.json` `majorIds` trỏ tới ngành có thật (kiểm tra hiện có, giữ nguyên).
9. Xuất `majors` đã sắp: theo `facultyId` (`cntt`, `ky-thuat`, `kinh-te`) rồi `name.vi`.

Hợp đồng `data/index.ts` **giữ nguyên tên**: `majors: Major[]`, `getMajor(id)`, `getMajorsOfBuilding(buildingId)` — chỉ đổi kiểu `Major` sang kiểu mới.

---

## 4. Lớp ngôn ngữ (không thư viện)

### 4.1 Store `src/store/useLangStore.ts` (mới)

```ts
interface LangState {
  lang: Lang;                    // mặc định 'vi'
  setLang: (lang: Lang) => void; // lưu localStorage + đặt document.documentElement.lang
  toggleLang: () => void;        // vi ⇄ en
}
```

- Khóa localStorage: `campussim.lang`. Đọc **một lần** khi tạo store, bọc `try/catch` (tab ẩn danh / chặn storage → ném lỗi);
  giá trị khác `'vi' | 'en'` → `'vi'`. Ghi cũng bọc `try/catch`, lỗi thì bỏ qua (vẫn đổi ngôn ngữ trong phiên). Mẫu sẵn: `src/ui/audio/sfx.ts`.
- Khi tạo store cũng đặt `document.documentElement.lang` theo giá trị đọc được.

### 4.2 `src/ui/text.ts` (mở rộng, không phá cái cũ)

```ts
import type { Lang, LocalizedText } from '../types';
import { useLangStore } from '../store/useLangStore';

/** Lấy chuỗi theo ngôn ngữ; thiếu bản en thì dùng vi. vars thay {ten} trong chuỗi. */
export function t(text: LocalizedText, lang: Lang, vars?: Record<string, string | number>): string;

/** Hook cho component: const tr = useT(); tr(UI_TEXT.majorsTab) — tự vẽ lại khi đổi ngôn ngữ. */
export function useT(): (text: LocalizedText, vars?: Record<string, string | number>) => string;

/** Chuỗi giao diện MỚI — song ngữ. */
export const UI_TEXT = {
  langToggle: { vi: 'EN', en: 'VI' },
  yearN: { vi: 'Năm {n}', en: 'Year {n}' },
  // ...
} as const satisfies Record<string, LocalizedText>;
```

- `TEXT` và `BUILDING_PANEL_TEXT` cũ (chỉ tiếng Việt) **giữ nguyên** để không vỡ các màn hình khác. Chuyển dần:
  N3 chuyển `TopBar` + `BuildingPanel` sang `UI_TEXT`; buổi học / máy ảo / góp ý chuyển ở task sau (N4, mục 10).
- Nội dung `building-details.json` hiện chỉ có tiếng Việt → khi `lang = 'en'` vẫn hiện tiếng Việt kèm một dòng nhỏ
  `UI_TEXT.viOnlyNote` ("Building details are in Vietnamese only for now").
- Quy tắc mới cho mọi agent (Claude ghi vào `AGENTS.md` mục 5.6 khi gộp): **chuỗi mới phải là `LocalizedText` trong `UI_TEXT` hoặc trong JSON dữ liệu.**

---

## 5. Quy tắc tóm gọn (N1, N2 làm theo)

**Lấy:** mã, tên vi/en, tín chỉ (+ LT/TH), khối kiến thức, năm/học kỳ, nhóm tự chọn + điều kiện "chọn N", chuyên ngành, tiên quyết (nếu chắc), tổng TC, mã ngành, năm ban hành.
**Bỏ:** mô tả từng môn ("Nội dung cần đạt được"), số giờ, PLO/ma trận IRM, phương pháp giảng dạy/đánh giá, tuyển sinh, đối sánh, lưu đồ, đề cương (Phụ lục V).

### 5.1 Xếp năm

| Loại PDF | Quy tắc | `yearSource` |
| --- | --- | --- |
| BM08 | Bảng mục **VI "Hướng dẫn thực hiện chương trình"**: nhãn học kỳ `x.y` → `year = x`, `semester = y`. Ô "Tự chọn ... N TC" → `ElectiveSlot`. Đối chiếu với **Phụ lục IV "Kế hoạch học tập chuẩn"** (nếu có). | `ke-hoach` |
| BM08, môn không có trong mục VI | Môn trong nhóm tự chọn → **không gán `year`**. Môn bắt buộc mà mục VI thiếu → quy tắc mã (dưới) + ghi vào báo cáo. | `ma-mon` |
| Khung ngắn (QTKD, DTVT, COKHI) | Số đầu của phần số trong mã: `1xx→1`, `2xx→2`, `3xx→3`, `4xx→4`, `0xx→1`, `≥5xx→4`. Mã không có số (`PED`) → 1. Dòng `--` "Tự chọn kỹ thuật*" → chỉ thành `ElectiveSlot` (không phải môn). `yearsInferred = true`. | `ma-mon` |
| Khung ngắn, ô tự chọn | Mỗi nhóm tự chọn **đại cương** → 1 slot ở năm suy từ mã môn **nhỏ nhất** trong nhóm. Nhóm chuyên ngành / kỹ thuật tự do → slot năm 4 (hoặc 3 nếu mọi mã nhóm là 3xx). | `ma-mon` |

Số trang mục VI / danh sách tự chọn / Phụ lục IV từng BM08 (Claude đã dò):

| File | Mục I–II (mục tiêu, vị trí việc làm, chuẩn đầu ra) | Mục IV.3 bảng môn | Mục VI kế hoạch theo HK | DS môn tự chọn | Phụ lục IV |
| --- | --- | --- | --- | --- | --- |
| BSE | tr. 2–6 | 7–48 | **49–53** | 53–57 | 75–76 |
| CNDC | 2–6 | 7–46 | **47–52** | 52–55 | 66–67 |
| ACE | 2–7 | 8–63 | **64–70** | 70–73 | 83–84 |
| BEE | 2–7 | 8–60 | **61–66** | 66–70 | 81–82 |
| MEE | 2–7 | 8–58 | **59–68** | trong mục VI | không đọc được chữ (có thể là ảnh) |

(Số trang là số thứ tự trang PDF, không phải số in trên trang — số in lệch 1–2. Ranh giới mục là ước lượng ±1 trang.)

Bẫy lớp chữ đã thấy: **QTKD trang 6 và 7 trùng nội dung** (khử trùng theo mã); bản khung xếp tên theo 3 kiểu khác nhau —
QTKD `English (Tiếng Việt)`, DTVT `Tiếng Việt` + `(English)`, COKHI `Tiếng Việt` xuống dòng `English`; mã môn có khi bị ngắt dòng (`MATH` / `111`).

### 5.2 Nội dung viết (N2)

| Trường | Độ dài | Lấy từ |
| --- | --- | --- |
| `summary` | 2–3 câu, ≤ 320 ký tự mỗi ngôn ngữ | BM08 mục I.1 Mục tiêu chung (viết lại dễ hiểu cho học sinh lớp 12, không văn hành chính) |
| `highlights` | 3–5 môn | môn đặc trưng ngành (không lấy chính trị, toán đại cương, thể chất); ưu tiên đồ án/thực hành |
| `skills` | 4–6 mục, ≤ 80 ký tự | BM08 mục II Chuẩn đầu ra (kỹ năng) |
| `careers` | 4–6 mục, ≤ 80 ký tự | BM08 mục I.4 Vị trí việc làm |
| `dayInLife` | 5–7 mốc | **minh họa**, chỉ dùng thứ có thật: môn trong bảng, phòng lab có trong `building-details.json` (FabLab, IIC, PTN Thủy lực B11...), thư viện B4, căn tin. Không bịa tên người, CLB, sự kiện |

Bản khung (QTKD, DTVT, COKHI) không có mục I/II → `contentBasis: 'bang-mon'`, viết từ bảng môn + tên chuyên ngành, giọng thận trọng.
Mọi profile để `contentStatus: 'chua-duyet'`; UI hiện nhãn vàng "Chưa duyệt" cho tới khi chủ dự án đọc.

---

## 6. Giao diện (N3)

- **TopBar**: nút chuyển `VI | EN` (2 nửa, nửa đang chọn tô đậm, `aria-pressed`), luôn hiện ở mọi chế độ.
- **BuildingPanel**: tòa có ngành → 2 tab đầu panel `Ngành học (n)` (mặc định) | `Tòa nhà` (nội dung cũ). Tòa không có ngành → như cũ.
- **Chọn ngành**: chip theo `majorIds` (dùng `selectedMajorId` / `selectMajor` của `useCampusStore`). Ngành thuộc ≥ 2 khoa → gom theo khoa, có tiêu đề nhỏ.
- **Một ngành** (`src/ui/major/**`): đầu = tên, văn bằng, khoa, tổng TC, mã ngành. 3 tab con:
  1. **Tổng quan**: summary · môn core (⭐) · kỹ năng · nghề nghiệp · một ngày (dòng thời gian, nhãn "minh họa").
  2. **Môn học**: tab `Năm 1..4`; chip chuyên ngành ("Chung" + từng chuyên ngành) → thêm môn bắt buộc của chuyên ngành đó vào năm tương ứng.
     Mỗi dòng: mã (mono) · tên · TC. Ô tự chọn = dòng viền đứt "Tự chọn: <nhóm> — 4 TC", bấm mở danh sách "Chọn ≥ 8 TC trong 7 môn".
     `yearsInferred` → ghi chú "Năm học suy từ mã môn (bản khung không chia theo năm)".
  3. **Chuyên ngành** (ẩn nếu không có): mỗi chuyên ngành = bắt buộc + nhóm tự chọn.
  Chân: "Nguồn: BSE.pdf · CTĐT 2026" + nhãn `contentStatus`.
- **Mobile**: panel đã là bottom sheet (`max-h-[58vh]`) → thêm thanh nắm trên cùng, chạm để mở rộng 58vh ⇄ 88vh (không kéo, không thư viện).
  Thanh tab cuộn ngang, nút cao ≥ 40 px.
- State tạm (tab, năm, chuyên ngành đang lọc, sheet mở rộng) = `useState` trong component. Không thêm vào store.

---

## 7. Gán ngành vào tòa nhà (`campus.json` → `majorIds`)

Theo **văn phòng khoa** đã xác minh trong `building-details.json`:

| Tòa | `majorIds` (thứ tự = thứ tự chip) | Căn cứ |
| --- | --- | --- |
| `b3` | `["qtkd"]` | 104–105.B3, 303.B3 Văn phòng Khoa QTKD |
| `b11` | `["ktpm", "mmt", "tdh", "dien", "cdt", "dtvt", "cokhi"]` | Khoa Kỹ thuật, CNTT & Điều dưỡng; FabLab, IIC, PTN điện/thủy lực/năng lượng |

Claude sửa `campus.json` **lúc gộp** (N3 chỉ gán ngành mẫu để thử). Đề xuất thêm chờ chủ dự án (mục 11).

---

## 8. Chừa chỗ cho "kỷ niệm hành trình học" — KHÔNG làm bây giờ

Đã chừa trong schema: khóa ổn định `major.id`, `specialization.id`, `ElectiveGroup.id`, `course.code`; `highlights` (môn core để "đóng dấu");
`year/semester` để vẽ tiến độ. Sau này (cần chủ dự án duyệt, có thể cần backend) sẽ là một kiểu **riêng**, không nhét vào dữ liệu ngành:

```ts
// CHỈ phác thảo — không tạo file, không thêm vào store ở đợt này.
interface JourneyRecord { majorId: string; specializationId?: string; completedCourseCodes: string[];
                          stamps: { code: string; at: string }[]; activities: { kind: string; at: string }[] }
```

Không thêm: tiến độ, tick môn đã học, lưu hành trình, đăng nhập.

---

## 9. Phân luồng + quyền sửa file (không giao nhau)

Mỗi luồng = 1 worktree + 1 nhánh, **tạo từ nhánh `PengWynIsMe/nganh-ke-hoach`** (để có brief). PDF không lên git → mỗi worktree chạy:
`mkdir -p references/ctdt && cp /Users/dinhtrananhminh/.orca/bots/pengwynnn/files/ctdt-eiu/*.pdf references/ctdt/`

| Luồng | Agent | Nhánh / cổng | Được sửa / tạo | KHÔNG được sửa |
| --- | --- | --- | --- | --- |
| **N1** | Codex | `nganh-n1-trich-mon` | `scripts/ctdt/**` (mới), `src/data/majors/*.curriculum.json` (8 file mới), `docs/tasks/N1-bao-cao.md` | mọi file khác (đặc biệt `package.json` gốc, `src/data/majors/<id>.json`) |
| **N2** | Antigravity | `nganh-n2-noi-dung` | `src/data/majors/<id>.json` (8 profile mới, **không** đuôi `.curriculum`), `docs/tasks/N2-doi-chieu.md`, `docs/tasks/N2-bao-cao.md` | `*.curriculum.json` (chỉ đọc), `scripts/**`, `src/**` khác |
| **N3** | Claude Sonnet | `nganh-n3-ui` / **5178** | `src/types/major.ts` (mới) + 1 dòng `src/types/index.ts` (xóa `Major`/`Course` cũ), `src/store/useLangStore.ts` (mới), `src/data/majors.ts` (mới), `src/data/index.ts` (chỉ phần ngành), `src/data/validate.ts` (chỉ thêm `loc()`), `src/data/majors/mau-a*.json` + `mau-b*.json` (4 file mẫu), `src/data/campus.json` (chỉ bỏ khóa `majors` + `majorIds` của `b11` = `["mau-a", "mau-b"]`), `src/ui/major/**` (mới), `src/ui/BuildingPanel.tsx`, `src/ui/TopBar.tsx`, `src/ui/text.ts`, `docs/tasks/N3-bao-cao.md`, `docs/tasks/N3-anh/` | `src/scene/**`, `src/ui/lesson/**`, `src/ui/desktop/**`, `src/ui/walk/**`, `src/ui/interior/**`, store khác, `package.json` |
| **NR** | Codex | trên nhánh đã gộp | chỉ `docs/tasks/NR-bao-cao.md` | mọi file khác |

N3 sửa `src/types|store|data` là **ngoại lệ** (bình thường của Claude), vì hợp đồng đã chốt nguyên văn ở mục 3–4 nên Sonnet chỉ chép + nối.
Điểm nối giữa luồng chỉ là **tên file trong `src/data/majors/`** — không ai sửa file của luồng khác.

### Thứ tự gộp (Claude)

1. N3 → nhánh kế hoạch (có loader + UI + mẫu).
2. N1 → thêm 8 `*.curriculum.json` (lúc này loader báo thiếu profile — bình thường, chưa chạy app).
3. N2 → thêm 8 profile. Xóa 4 file `mau-*.json`. Sửa `campus.json` `majorIds` theo mục 7.
4. `typecheck` / `lint` / `build` → giao **NR** (Codex) review → Claude tự mở trình duyệt chơi thử → chủ dự án duyệt → merge `main`.

N2 phần B (đối chiếu) cần JSON của N1: đọc **chỉ đọc** từ worktree N1 (coordinator báo đường dẫn), không copy vào nhánh N2.

---

## 10. Tiêu chí hoàn thành cả đợt

- [ ] 8 ngành đủ 2 file, loader không báo lỗi; `typecheck` / `lint` / `build` sạch.
- [ ] Bấm B11 → 7 chip ngành (gom 2 khoa); bấm B3 → QTKD. Mỗi ngành: tab Năm 1–4 có môn, tổng TC đúng PDF, chuyên ngành đúng số lượng mục 1.
- [ ] 3 ngành khung ngắn hiện ghi chú "năm học suy từ mã môn".
- [ ] Nút VI/EN đổi toàn bộ panel ngành + TopBar + nhãn panel tòa nhà; tải lại trang vẫn giữ ngôn ngữ; chặn localStorage vẫn chạy (mặc định VI).
- [ ] Chế độ điện thoại: bottom sheet mở rộng/thu gọn, tab cuộn ngang, đọc được.
- [ ] `docs/tasks/N2-doi-chieu.md` không còn sai lệch mức "cao" chưa xử lý.
- [ ] Chạy lại `node scripts/ctdt/extract.mjs` ra JSON giống hệt (trừ `generatedAt`).

Sau đợt này (chưa giao): **N4** chuyển nốt chuỗi buổi học / máy ảo / góp ý sang `UI_TEXT`; bài giảng `nmlt-01` song ngữ.

---

## 11. Câu hỏi chờ chủ dự án

1. **PDF có nên lên git không?** (~12 MB). Hiện theo quy tắc cũ: không lên git, các worktree copy từ thư mục bot. Nếu muốn agent máy khác chạy lại script → thêm ngoại lệ `.gitignore` cho `references/ctdt/*.pdf`.
2. **Năm ban hành 3 bản khung** (QTKD, DTVT, COKHI) không ghi trong file → để `year: null`, hiện "khung CTĐT (chưa rõ năm)". Có năm/khóa chính xác không?
3. **Gán thêm tòa?** Mặc định chỉ B3 + B11. Có muốn `mmt` hiện thêm ở **B6** (Trung tâm An ninh mạng 100.B6) hoặc `dien` ở **B8** (102.B8 Phòng Kỹ thuật điện)?
4. **Tên tiếng Anh** chính thức của QTKD / DTVT / COKHI (đang đề xuất ở mục 1).
5. B11 có 7 ngành → panel dài. Chấp nhận gom theo khoa, hay muốn tách ngành Kỹ thuật sang B9/B10 khi biết phòng thật?
