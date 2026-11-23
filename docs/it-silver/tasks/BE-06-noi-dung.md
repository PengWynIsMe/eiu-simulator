# BE-06 — Nạp và kiểm nội dung

**Bối cảnh chung.** Repo web 3D (React 18, TypeScript strict, zustand, Vite; không server). Đang làm chế độ kể chuyện "IT Silver": chọn chương, chơi cảnh, đăng ký môn, sổ kỷ niệm. "BE" = logic thuần chạy trong trình duyệt. Đọc `docs/it-silver/HOP-DONG.md` và `docs/it-silver/data/silver.types.txt` trước. Không thêm thư viện. Không `any`, không `@ts-ignore`. `noUncheckedIndexedAccess` bật. Hàm trong `src/silver/` không chạm DOM, `window`, `Date.now()`, `Math.random()`.

- Phụ thuộc: BE-00
- File được chạm: `src/data/silver/validateContent.ts`, `src/data/silver/content.ts` (mới), test

## API

```ts
// validateContent.ts — thuần, không import.meta
export function parseChapter(v: unknown, path: string): ChapterContent;
export function parseCourseContent(v: unknown, path: string, course?: SilverCourse): CourseContent;
// content.ts — nạp chậm
export function contentFileName(code: string): string;           // 'CSE 103' → 'cse-103'
export const availableContentCodes: Promise<ReadonlySet<string>>; // mã lấy từ tên file, so với catalog do nơi gọi đưa
export function loadChapter(id: ChapterId): Promise<ChapterContent | undefined>;
export function loadCourseContent(code: string): Promise<CourseContent | undefined>;
```

`content.ts` dùng `import.meta.glob('./chapters/*.json', { import: 'default' })` và `'./content/*.json'` (không `eager`). Thư mục rỗng hoặc chưa có → trả `undefined`/tập rỗng, không lỗi. Đổi ngược tên file → mã: thay `-` đầu tiên bằng dấu cách, viết hoa (`cse-103` → `CSE 103`; riêng tiền tố `lngs-` giữ dấu gạch: `lngs-j101` → `LNGS-J101`). Không import `catalog.ts`.

Luật kiểm (lỗi qua `fail(path, …)`):
- `loc()` cho mọi `LocalizedText`; id bước duy nhất trong cảnh; id cảnh duy nhất trong file; cảnh có ≥ 1 bước; `minutes > 0`.
- `choice`: ≥ 2 options. `question`: ≥ 2 options, `answerId` có thật, `passage` ⇔ `passageKind`. `order`: `answer` là hoán vị của id `items`, ≥ 3 items. `code`: `template` có đúng một `___`, `answers` không rỗng.
- `variants[].when`, `photos/lines[].when`: có ít nhất `seen` hoặc `flag`. Phần tử cuối của `photos`, `lines` **không** có `when`; phần tử trước đều có.
- `CourseContent`: có `theoryA` và `theoryB`; hoặc chỉ `project`. Có `course`: `th > 0 && lt > 0` ⇔ có `lab`; `lt === 0` ⇔ chỉ `project`. Nhiều cảnh cùng slot được phép.
- `summary`: tổng phút 3–6 (project: 4–8), không `exam`. `core`: 3–5 buổi, có `exam` đúng 3 bước loại `question`/`order`/`code`, tổng 12–16 phút (project core: 8–16, `exam` tùy chọn, 1–5 buổi).

## Ví dụ test

Một `ChapterContent` và một `CourseContent` hợp lệ tối thiểu viết ngay trong test; rồi mỗi luật một bản sao bị hỏng → ném lỗi có đúng đường dẫn (vd `steps[0].template`). `contentFileName('LNGS-J101') === 'lngs-j101'`. `SceneContent` trong `docs/it-silver/data/ui-fixture.json` (`playItem.scene`) kiểm hợp lệ.

## Cách kiểm

`npm ci` (nếu worktree mới) → `npm run typecheck && npm run lint && npm run build && npm run test:silver` (riêng BE-00 tạo lệnh cuối). Test viết ở `scripts/silver/tests/content.test.mjs`, phủ hết ví dụ trên. Báo cáo: file đã sửa, kết quả bốn lệnh, điểm chưa chắc. Không commit/push khi điều phối chưa bảo.

## Ngoài phạm vi

UI, scene, nội dung, đổi kiểu trong `src/types/silver.ts`, file không liệt kê ở trên.
