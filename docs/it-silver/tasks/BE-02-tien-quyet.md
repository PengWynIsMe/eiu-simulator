# BE-02 — Kiểm tiên quyết

**Bối cảnh chung.** Repo web 3D (React 18, TypeScript strict, zustand, Vite; không server). Đang làm chế độ kể chuyện "IT Silver": chọn chương, chơi cảnh, đăng ký môn, sổ kỷ niệm. "BE" = logic thuần chạy trong trình duyệt. Đọc `docs/it-silver/HOP-DONG.md` và `docs/it-silver/data/silver.types.txt` trước. Không thêm thư viện. Không `any`, không `@ts-ignore`. `noUncheckedIndexedAccess` bật. Hàm trong `src/silver/` không chạm DOM, `window`, `Date.now()`, `Math.random()`.

- Phụ thuộc: BE-00
- File được chạm: `src/silver/prereq.ts` (mới), test

## API

```ts
export interface PrereqContext { done: ReadonlySet<string>; taken: ReadonlySet<string>; hasContent: ReadonlySet<string>; }
export function courseStatus(course: SilverCourse, ctx: PrereqContext): CourseStatus;
```

`done`: coi như đã học (xét tiên quyết). `taken`: thật sự đã học, không cho chọn lại. Thứ tự, gặp trước dừng:
1. `course.code ∈ taken` → `done`, missing `[]`.
2. `mode 'unresolved'`, hoặc `mode 'unclear'` với `codes` rỗng → `needs-confirmation`, missing = `codes`.
3. Có mã trong `codes` ∉ `done` (cả `all` và `unclear` đều cần đủ) → `missing-prereq`, missing giữ thứ tự `codes`.
4. `code ∉ hasContent` → `no-content`. 5. Còn lại `available`.

`prestudy`, `coreq`, `english` không chặn trong bản thử (luôn rỗng / đã đạt); có comment một dòng nói rõ.

## Ví dụ (C = `catalog`, hoặc object giả cùng kiểu)

| Môn | done | taken | hasContent | Ra |
|---|---|---|---|---|
| CSE 103 | CSE 100 | – | CSE 103 | available |
| CSE 103 | – | – | CSE 103 | missing-prereq [CSE 100] |
| CSW 309 | CSE 301 | – | CSW 309 | missing-prereq [CSW 303] |
| STAT 101 (unclear) | MATH 111 | – | STAT 101 | missing-prereq [MATH 103] |
| CSW 436 (unresolved) | mọi mã | – | CSW 436 | needs-confirmation [CSN 301] |
| UNIV 101 (unclear, rỗng) | – | – | UNIV 101 | needs-confirmation [] |
| CSE 100 | CSE 100 | CSE 100 | – | done |
| MATH 112 | MATH 111 | – | – | no-content |

## Tiêu chí xong

Tám ví dụ có test. Không đọc file JSON trong `prereq.ts`.

## Cách kiểm

`npm ci` (nếu worktree mới) → `npm run typecheck && npm run lint && npm run build && npm run test:silver` (riêng BE-00 tạo lệnh cuối). Test viết ở `scripts/silver/tests/prereq.test.mjs`, phủ hết ví dụ trên. Báo cáo: file đã sửa, kết quả bốn lệnh, điểm chưa chắc. Không commit/push khi điều phối chưa bảo.

## Ngoài phạm vi

UI, scene, nội dung, đổi kiểu trong `src/types/silver.ts`, file không liệt kê ở trên.
