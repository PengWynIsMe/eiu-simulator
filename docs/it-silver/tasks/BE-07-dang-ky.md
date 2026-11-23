# BE-07 — Đăng ký môn

**Bối cảnh chung.** Repo web 3D (React 18, TypeScript strict, zustand, Vite; không server). Đang làm chế độ kể chuyện "IT Silver": chọn chương, chơi cảnh, đăng ký môn, sổ kỷ niệm. "BE" = logic thuần chạy trong trình duyệt. Đọc `docs/it-silver/HOP-DONG.md` và `docs/it-silver/data/silver.types.txt` trước. Không thêm thư viện. Không `any`, không `@ts-ignore`. `noUncheckedIndexedAccess` bật. Hàm trong `src/silver/` không chạm DOM, `window`, `Date.now()`, `Math.random()`.

- Phụ thuộc: BE-01, 02, 03, 04
- File được chạm: `src/silver/registration.ts` (mới), test

## API

```ts
export interface RegistrationInput {
  term: PlanTerm; catalog: SilverCatalog;
  plannedBefore: string[];                                  // từ BE-03
  earlier: { term: PlanTerm; registered: string[] }[];       // các kỳ trước đã đăng ký thật
  content: ReadonlyMap<string, { tier: 'core' | 'summary'; minutes: number }>;
  selected: string[];
}
export const MAX_COURSES = 6; export const QUICK_MINUTES = 2; export const FRAME_MINUTES = 5.5;
export function defaultSelection(term: PlanTerm): string[];
export function toggleSelection(input: RegistrationInput, code: string): string[];
export function buildRegistration(input: RegistrationInput): RegistrationView;
```

- `done` (tiên quyết) = `plannedBefore` ∪ mọi `registered`. `taken` = mọi `registered` ∪ (`plannedBefore` trừ các mã mà kỳ `earlier` tương ứng có trong lịch nhưng không nằm trong `registered`).
- Hàng: môn của lịch kỳ này (`courses`, rồi default), rồi các môn cùng nhóm tự chọn của kỳ, rồi mọi môn có `content`, theo thứ tự catalog, bỏ trùng, bỏ môn `done` nếu không được chọn.
- `locked` = môn trong `core`. `suggested` = trong `termCodes`. `lab` = `th > 0`.
- Tier: `core` nếu thuộc `term.core`; trong các môn chọn không core, **ba** môn đầu theo thứ tự hàng là `summary`, sau đó `quick`. Môn chưa chọn: tier nó sẽ nhận nếu được thêm cuối cùng.
- `minutes` = làm tròn(FRAME + core/summary lấy `content.minutes` + quick × 2). Môn lịch không có content: tính 0 phút, trạng thái `no-content`, **không** được chọn (bỏ khỏi `selected`), trừ môn core (giữ, để lộ lỗi dữ liệu cho người soạn).
- `problem`: `too-few` nếu số chọn < `min(3, termCodes.length)`; `too-many` nếu > 6. `meetings` = `buildTimetable` khi ≤ 6, ngược lại `[]`.
- `toggleSelection`: không bỏ được core; không thêm môn khác `available`; được thêm quá 6 (để UI báo).

## Ví dụ (content: CSE 103 core 14.5; MATH 112, POLS 135, COMS 101 3.5; CSE 204 5; STAT 101 3.5)

| selected | credits | minutes | tier | problem |
|---|---|---|---|---|
| mặc định 2.2 | 15 | 31 (30.5 làm tròn) | core, 3 summary | null |
| + CSE 204 | 19 | 33 (32.5 làm tròn) | CSE 204 quick | null |
| đổi COMS 101 → CSE 204 | 15 | 32 | CSE 204 summary | null |
| CSE 103, MATH 112 | 8 | 24 (23.5 làm tròn) | | too-few |
| bỏ CSE 103 | không đổi | | | |

Thêm MATH 113 khi chỉ có MATH 111 xong → không đổi, hàng có `missing-prereq ['MATH 112']` (nếu content có MATH 113). Làm tròn bằng `Math.round`.

## Cách kiểm

`npm ci` (nếu worktree mới) → `npm run typecheck && npm run lint && npm run build && npm run test:silver` (riêng BE-00 tạo lệnh cuối). Test viết ở `scripts/silver/tests/registration.test.mjs`, phủ hết ví dụ trên. Báo cáo: file đã sửa, kết quả bốn lệnh, điểm chưa chắc. Không commit/push khi điều phối chưa bảo.

## Ngoài phạm vi

UI, scene, nội dung, đổi kiểu trong `src/types/silver.ts`, file không liệt kê ở trên.
