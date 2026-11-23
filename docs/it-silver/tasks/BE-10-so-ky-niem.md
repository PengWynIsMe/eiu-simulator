# BE-10 — Sổ kỷ niệm

**Bối cảnh chung.** Repo web 3D (React 18, TypeScript strict, zustand, Vite; không server). Đang làm chế độ kể chuyện "IT Silver": chọn chương, chơi cảnh, đăng ký môn, sổ kỷ niệm. "BE" = logic thuần chạy trong trình duyệt. Đọc `docs/it-silver/HOP-DONG.md` và `docs/it-silver/data/silver.types.txt` trước. Không thêm thư viện. Không `any`, không `@ts-ignore`. `noUncheckedIndexedAccess` bật. Hàm trong `src/silver/` không chạm DOM, `window`, `Date.now()`, `Math.random()`.

- Phụ thuộc: BE-00 (`matchCond` chép lại logic là sai: import từ `src/silver/run.ts` nếu BE-08 đã có; nếu chưa, viết hàm nhận `match: (c: Cond) => boolean` làm tham số như dưới)
- File được chạm: `src/silver/notebook.ts` (mới), test

## API

```ts
export interface MemoryDeps { match: (c: Cond) => boolean; courseName: (code: string) => LocalizedText | undefined; }
export function makeMemoryView(ch: ChapterContent, courses: string[], old: NotebookEntry | undefined, d: MemoryDeps): MemoryView;
export function savedMemoryView(ch: ChapterContent, e: NotebookEntry, d: MemoryDeps): MemoryView;
export function upsertEntry(list: NotebookEntry[], e: NotebookEntry): NotebookEntry[];
```

- Ảnh/câu gợi ý: phần tử đầu tiên không `when` hoặc `when` khớp. `photoChoices`: mọi ảnh không `when` hoặc khớp, giữ thứ tự.
- `savedMemoryView` lấy theo id đã lưu (kể cả `when` không còn khớp); id không còn → phần tử cuối. `savedAt` = entry, `hasOld: true`.
- `upsertEntry` thay trang cùng `chapterId`, giữ vị trí; chưa có thì thêm cuối; không sửa mảng vào. Không tự tạo trang cho chương chưa chơi. Trang lưu id, không lưu chữ, nên đổi ngôn ngữ được.

## Ví dụ

Template photos `[ {id:'a',when:{flag…}}, {id:'b'} ]`: khớp → photo a, choices [a,b]; không khớp → photo b, choices [b]. Upsert 1.1 hai lần → một trang, dữ liệu mới. Mã môn không có tên → bỏ khỏi `courses`.

## Cách kiểm

`npm ci` (nếu worktree mới) → `npm run typecheck && npm run lint && npm run build && npm run test:silver` (riêng BE-00 tạo lệnh cuối). Test viết ở `scripts/silver/tests/notebook.test.mjs`, phủ hết ví dụ trên. Báo cáo: file đã sửa, kết quả bốn lệnh, điểm chưa chắc. Không commit/push khi điều phối chưa bảo.

## Ngoài phạm vi

UI, scene, nội dung, đổi kiểu trong `src/types/silver.ts`, file không liệt kê ở trên.
