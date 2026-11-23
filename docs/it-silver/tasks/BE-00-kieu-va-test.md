# BE-00 — Kiểu chung và bộ chạy test

**Bối cảnh chung.** Repo web 3D (React 18, TypeScript strict, zustand, Vite; không server). Đang làm chế độ kể chuyện "IT Silver": chọn chương, chơi cảnh, đăng ký môn, sổ kỷ niệm. "BE" = logic thuần chạy trong trình duyệt. Đọc `docs/it-silver/HOP-DONG.md` và `docs/it-silver/data/silver.types.txt` trước. Không thêm thư viện. Không `any`, không `@ts-ignore`. `noUncheckedIndexedAccess` bật. Hàm trong `src/silver/` không chạm DOM, `window`, `Date.now()`, `Math.random()`.

- Phụ thuộc: không
- File được chạm: `src/types/silver.ts` (mới), `scripts/silver/test.mjs` (mới), `scripts/silver/tests/smoke.test.mjs` (mới), `package.json` (chỉ thêm 2 dòng trong `scripts`)

## Làm

1. `cp docs/it-silver/data/silver.types.txt src/types/silver.ts` — giống từng byte.
2. `package.json` → `"test:silver": "node scripts/silver/test.mjs"`, `"check:silver": "node scripts/silver/check.mjs"` (file check do BE-12 tạo).
3. `scripts/silver/test.mjs`: dùng Vite có sẵn để nạp TS (không cài vitest). Đã thử chạy được trong repo này:

```js
import { createServer } from 'vite';
import { readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir = new URL('./tests/', import.meta.url);
const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom', optimizeDeps: { noDiscovery: true }, logLevel: 'error' });
let failed = 0;
try {
  for (const file of (await readdir(dir)).filter((f) => f.endsWith('.test.mjs')).sort()) {
    const tests = (await import(new URL(file, dir).href)).default;
    for (const [name, fn] of Object.entries(tests)) {
      try { await fn({ assert, load: (p) => server.ssrLoadModule(p) }); console.log(`ok   ${file} ${name}`); }
      catch (e) { failed++; console.error(`FAIL ${file} ${name}\n${e.stack}`); }
    }
  }
} finally { await server.close(); }
process.exitCode = failed ? 1 : 0;
```

4. Mẫu test: `export default { 'ten': async ({ assert, load }) => { const m = await load('/src/data/validate.ts'); assert.equal(m.num(3, 'x'), 3); } };`

## Tiêu chí xong

- `cmp docs/it-silver/data/silver.types.txt src/types/silver.ts` không in gì.
- `npm run test:silver` in `ok`, thoát 0; cố ý sai một assert thì thoát 1 (thử rồi trả lại).

## Cách kiểm

`npm ci` (nếu worktree mới) → `npm run typecheck && npm run lint && npm run build && npm run test:silver` (riêng BE-00 tạo lệnh cuối). Test viết ở `scripts/silver/tests/smoke.test.mjs`, phủ hết ví dụ trên. Báo cáo: file đã sửa, kết quả bốn lệnh, điểm chưa chắc. Không commit/push khi điều phối chưa bảo.

## Ngoài phạm vi

UI, scene, nội dung, đổi kiểu trong `src/types/silver.ts`, file không liệt kê ở trên.
