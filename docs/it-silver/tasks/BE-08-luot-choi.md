# BE-08 — Lượt chơi

**Bối cảnh chung.** Repo web 3D (React 18, TypeScript strict, zustand, Vite; không server). Đang làm chế độ kể chuyện "IT Silver": chọn chương, chơi cảnh, đăng ký môn, sổ kỷ niệm. "BE" = logic thuần chạy trong trình duyệt. Đọc `docs/it-silver/HOP-DONG.md` và `docs/it-silver/data/silver.types.txt` trước. Không thêm thư viện. Không `any`, không `@ts-ignore`. `noUncheckedIndexedAccess` bật. Hàm trong `src/silver/` không chạm DOM, `window`, `Date.now()`, `Math.random()`.

- Phụ thuộc: BE-00, BE-04
- File được chạm: `src/silver/run.ts` (mới), test

## API

```ts
export interface StoryContext { seen: ReadonlySet<string>; flags: Readonly<Record<string, string>>; }
export function matchCond(c: Cond, ctx: StoryContext): boolean;
export function resolveStep(step: SilverStep, ctx: StoryContext): SilverStep;      // áp variants cho say, bỏ trường variants
export function buildChapterQueue(ch: ChapterContent): RunItem[];
export function buildTermQueue(ch: ChapterContent, regs: { code: string; tier: 'core' | 'summary' | 'quick' }[], contents: ReadonlyMap<string, CourseContent>, meetings: Meeting[]): RunItem[];
export function gradeStep(step: GradedStep, value: string): { correct: boolean; explain?: LocalizedText; output?: string; correctAnswer: string };
```

- Chương thường: opening + scenes + closing (`scene:<scene.id>`), rồi `transcript` nếu có `englishLevel`, rồi `memory`.
- Kỳ đăng ký: opening; rồi duyệt `meetings` theo thứ tự: với mỗi buổi, thêm mọi cảnh của môn có `slot === meeting.kind` (thứ tự trong file), id `session:<code>:<kind>:<n>`, kèm `courseCode`, `meeting`. `quick`: môn có lab chỉ lấy cảnh `lab`; không lab chỉ `theoryA`; project lấy project. Rồi `exam:<code>` cho môn core có exam (thứ tự regs); rồi `scenes`, `closing`, `memory`. `memory.minutes = 1`, `transcript.minutes = 1`.
- `gradeStep`: question so `answerId`; order so `answer.join(',')`; code so `trim()`, phân biệt hoa thường. `output` chỉ có ở code. Đúng: `explainCorrect` (code không có explain). Sai: `explainWrong`.

## Ví dụ

- `matchCond({seen:'1.1/greet-han'}, {seen:∅, flags:{}})` → false. `{flag:{key:'2.2/seat',is:'front'}}` với flags `{'2.2/seat':'front'}` → true. Có cả hai trường: phải đúng cả hai.
- `resolveStep` bước `s1` của `ui-fixture.json`: chưa seen → câu "Chào bạn, mình là Han…"; đã seen → "Hồi đó tập chào nhau…".
- Tuần A của BE-04, CSE 103 có lab-1, lab-2, A, B + exam → item: lab-1, lab-2, MATH A, POLS A, CSE A, COMS A, MATH B, POLS B, CSE B, COMS B, exam, memory (chương không cảnh).
- Thêm CSE 204 tier quick: đúng một nhóm item `lab` của CSE 204.
- `gradeStep(s7,' println ')` đúng, output `Hello EIU`; `gradeStep(s6,'x,y,z')` sai, correctAnswer `y,x,z`.

## Cách kiểm

`npm ci` (nếu worktree mới) → `npm run typecheck && npm run lint && npm run build && npm run test:silver` (riêng BE-00 tạo lệnh cuối). Test viết ở `scripts/silver/tests/run.test.mjs`, phủ hết ví dụ trên. Báo cáo: file đã sửa, kết quả bốn lệnh, điểm chưa chắc. Không commit/push khi điều phối chưa bảo.

## Ngoài phạm vi

UI, scene, nội dung, đổi kiểu trong `src/types/silver.ts`, file không liệt kê ở trên.
