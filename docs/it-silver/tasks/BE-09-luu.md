# BE-09 — Lưu cục bộ

**Bối cảnh chung.** Repo web 3D (React 18, TypeScript strict, zustand, Vite; không server). Đang làm chế độ kể chuyện "IT Silver": chọn chương, chơi cảnh, đăng ký môn, sổ kỷ niệm. "BE" = logic thuần chạy trong trình duyệt. Đọc `docs/it-silver/HOP-DONG.md` và `docs/it-silver/data/silver.types.txt` trước. Không thêm thư viện. Không `any`, không `@ts-ignore`. `noUncheckedIndexedAccess` bật. Hàm trong `src/silver/` không chạm DOM, `window`, `Date.now()`, `Math.random()`.

- Phụ thuộc: BE-00
- File được chạm: `src/silver/save.ts` (mới), test

## API

```ts
export const SAVE_KEY = 'campussim.silver.v1';
export interface KeyValue { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void; }
export function emptySave(seed: string): SilverSave;
export function parseSave(raw: string): SilverSave | null;        // null khi hỏng
export function readSave(kv: KeyValue | null, makeSeed: () => string): { save: SilverSave; warning: SilverApi['saveWarning'] };
export function writeSave(kv: KeyValue | null, save: SilverSave): boolean;
export function clearSave(kv: KeyValue | null): void;
```

- Không truy cập `localStorage` trực tiếp (BE-11 đưa vào). `kv === null` hoặc `getItem` ném → `blocked`. `writeSave` bắt lỗi, trả `false`.
- `parseSave`: kiểm kiểu từng trường, bỏ phần tử sai trong mảng (`seen`, `doneChapters`, `notebook`), sai `version` hoặc thiếu `seed` → null. `run` sai → `run: null`.
- Hỏng: `setItem(SAVE_KEY + '.bak', raw)` rồi trả bản rỗng, `corrupt`. Chưa có: bản rỗng, `null`, chưa ghi.
- `clearSave` xóa khóa chính, không xóa `.bak`.

## Ví dụ

- kv rỗng, seed 'x' → `{version:1, seed:'x', flags:{}, seen:[], registrations:{}, doneChapters:[], run:null, notebook:[]}`, warning null.
- raw `'{oops'` → warning 'corrupt', `.bak` = `'{oops'`.
- `parseSave(JSON.stringify(save))` deepEqual save với bản có đủ trường. `seen:['a', 3]` → `['a']`.
- kv ném ở setItem → `writeSave` false.

## Cách kiểm

`npm ci` (nếu worktree mới) → `npm run typecheck && npm run lint && npm run build && npm run test:silver` (riêng BE-00 tạo lệnh cuối). Test viết ở `scripts/silver/tests/save.test.mjs`, phủ hết ví dụ trên. Báo cáo: file đã sửa, kết quả bốn lệnh, điểm chưa chắc. Không commit/push khi điều phối chưa bảo.

## Ngoài phạm vi

UI, scene, nội dung, đổi kiểu trong `src/types/silver.ts`, file không liệt kê ở trên.
