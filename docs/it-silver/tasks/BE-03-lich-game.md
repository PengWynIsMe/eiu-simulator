# BE-03 — Lịch game

**Bối cảnh chung.** Repo web 3D (React 18, TypeScript strict, zustand, Vite; không server). Đang làm chế độ kể chuyện "IT Silver": chọn chương, chơi cảnh, đăng ký môn, sổ kỷ niệm. "BE" = logic thuần chạy trong trình duyệt. Đọc `docs/it-silver/HOP-DONG.md` và `docs/it-silver/data/silver.types.txt` trước. Không thêm thư viện. Không `any`, không `@ts-ignore`. `noUncheckedIndexedAccess` bật. Hàm trong `src/silver/` không chạm DOM, `window`, `Date.now()`, `Math.random()`.

- Phụ thuộc: BE-00, BE-01, BE-02
- File được chạm: `src/data/silver/plan.ktpm.json` (mới), `src/data/silver/plan.ts` (mới), test

## API

```ts
export const plan: GamePlan;
export function parsePlan(v: unknown, catalog: SilverCatalog): GamePlan;
export function getTerm(id: TermId): PlanTerm | undefined;
/** Mọi mã (courses + elective default) của các kỳ trước `term`, đúng thứ tự lịch. */
export function plannedBefore(term: TermId): string[];
/** courses rồi tới elective default. */
export function termCodes(t: PlanTerm): string[];
```

Chép `docs/it-silver/data/plan.ktpm.json`. `parsePlan` kiểm: `official === false`; đúng 20 kỳ `1.1 … 5.4` theo thứ tự, không thiếu; mã tồn tại; không môn nào xuất hiện hai lần; `core ⊆ termCodes`; default thuộc đúng `group`; `credits` đúng tổng; mọi tiên quyết của môn nằm trong `plannedBefore`. Tổng tín chỉ **không** bị ép 180 trong `parsePlan` (chỉ test).

## Ví dụ

- `termCodes(getTerm('2.2'))` → `['CSE 103','MATH 112','POLS 135','COMS 101']`
- `plannedBefore('2.2')` → `['POLS 133','MATH 103','LAWS 122','MATH 111','POLS 134','CSE 100','CSE 106']`
- tổng `credits` = 180; `getTerm('5.4').kind` = `'graduation'`
- đổi bản sao cho CSE 104 nằm ở 2.1 → ném lỗi có `CSE 104` và `CSE 103`

## Cách kiểm

`npm ci` (nếu worktree mới) → `npm run typecheck && npm run lint && npm run build && npm run test:silver` (riêng BE-00 tạo lệnh cuối). Test viết ở `scripts/silver/tests/plan.test.mjs`, phủ hết ví dụ trên. Báo cáo: file đã sửa, kết quả bốn lệnh, điểm chưa chắc. Không commit/push khi điều phối chưa bảo.

## Ngoài phạm vi

UI, scene, nội dung, đổi kiểu trong `src/types/silver.ts`, file không liệt kê ở trên.
