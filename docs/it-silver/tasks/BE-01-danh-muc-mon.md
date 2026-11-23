# BE-01 — Danh mục môn

**Bối cảnh chung.** Repo web 3D (React 18, TypeScript strict, zustand, Vite; không server). Đang làm chế độ kể chuyện "IT Silver": chọn chương, chơi cảnh, đăng ký môn, sổ kỷ niệm. "BE" = logic thuần chạy trong trình duyệt. Đọc `docs/it-silver/HOP-DONG.md` và `docs/it-silver/data/silver.types.txt` trước. Không thêm thư viện. Không `any`, không `@ts-ignore`. `noUncheckedIndexedAccess` bật. Hàm trong `src/silver/` không chạm DOM, `window`, `Date.now()`, `Math.random()`.

- Phụ thuộc: BE-00
- File được chạm: `src/data/silver/courses.ktpm.json` (mới), `src/data/silver/catalog.ts` (mới), test

## API

```ts
export const catalog: SilverCatalog;
export function parseCatalog(v: unknown): SilverCatalog;      // ném DataError khi sai
export function getCourse(codeOrAlias: string): SilverCourse | undefined;
export function getGroup(id: string): SilverElectiveGroup | undefined;
```

Chép `docs/it-silver/data/courses.ktpm.json`. Dùng `obj/arr/str/num/oneOf/loc/fail` của `src/data/validate.ts`. `parseCatalog` kiểm: mã không trùng (kể cả alias); `lt + th === credits`; `mode 'none'` ⇔ `codes` rỗng, trừ `unclear` được rỗng; mọi mã trong `prereq.codes` phải tồn tại, trừ khi `mode === 'unresolved'`; `opens` đúng bằng chiều ngược của `prereq.codes`; `group.courses` tồn tại và môn đó có `group` tương ứng; không vòng lặp (báo chuỗi mã).

## Ví dụ

| Gọi | Ra |
|---|---|
| `getCourse('CSE 103').prereq` | `{mode:'all',codes:['CSE 100'],raw:'CSE 100'}` |
| `getCourse('CSE 302')?.code` | `'CSN 302'` |
| `getCourse('CSN 301')` | `undefined` |
| `getCourse('CSE 103').opens` | chứa `'CSE 104'` và `'CSW 333'` |
| tổng TC môn `required` | 140 (52/48/30/10 theo block), 37 môn |
| `parseCatalog` với A cần B, B cần A (hai môn giả hợp lệ) | ném lỗi có chữ `vòng lặp` |

## Tiêu chí xong

Nạp không lỗi; mọi ví dụ có test. Không sửa `src/data/majors/**`.

## Cách kiểm

`npm ci` (nếu worktree mới) → `npm run typecheck && npm run lint && npm run build && npm run test:silver` (riêng BE-00 tạo lệnh cuối). Test viết ở `scripts/silver/tests/catalog.test.mjs`, phủ hết ví dụ trên. Báo cáo: file đã sửa, kết quả bốn lệnh, điểm chưa chắc. Không commit/push khi điều phối chưa bảo.

## Ngoài phạm vi

UI, scene, nội dung, đổi kiểu trong `src/types/silver.ts`, file không liệt kê ở trên.
