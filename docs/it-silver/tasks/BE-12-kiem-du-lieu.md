# BE-12 — Script kiểm dữ liệu

**Bối cảnh chung.** Repo web 3D (React 18, TypeScript strict, zustand, Vite; không server). Đang làm chế độ kể chuyện "IT Silver": chọn chương, chơi cảnh, đăng ký môn, sổ kỷ niệm. "BE" = logic thuần chạy trong trình duyệt. Đọc `docs/it-silver/HOP-DONG.md` và `docs/it-silver/data/silver.types.txt` trước. Không thêm thư viện. Không `any`, không `@ts-ignore`. `noUncheckedIndexedAccess` bật. Hàm trong `src/silver/` không chạm DOM, `window`, `Date.now()`, `Math.random()`.

- Phụ thuộc: BE-01, 03, 06
- File được chạm: `scripts/silver/check.mjs` (mới), test

## Làm

Nạp TS bằng Vite như `scripts/silver/test.mjs`. In bảng, thoát 1 khi có lỗi. Kiểm:
1. `catalog`, `plan` parse được. Tổng TC kế hoạch in ra; khác 180 là **cảnh báo**.
2. Mọi `src/data/silver/chapters/*.json` và `content/*.json` parse được; tên file khớp `id`/`code`; mã có trong catalog.
3. Mọi `Cond.seen` trỏ tới id cảnh có thật trong bất kỳ file nào; mọi `Cond.flag` trỏ tới một `choice.flag` có thật và `is` là id option có thật.
4. Giới hạn chữ (đếm theo khoảng trắng, `vi`): theory ≤ 130, lab ≤ 200 (môn summary) → lỗi. `summary`, `closing` ≤ 25 từ mỗi ngôn ngữ → lỗi. `vi === en` và dài hơn 20 ký tự → cảnh báo.
5. Với mỗi kỳ demo (`2.2`): mọi môn trong `termCodes` có content → nếu thiếu: cảnh báo (cho tới khi ND xong), thêm cờ `--strict` biến cảnh báo thành lỗi.
6. So 37 môn bắt buộc với `src/data/majors/ktpm.curriculum.json`: mã, tín chỉ, LT/TH, năm.kỳ phải trùng; khác → lỗi.

## Ví dụ

Chạy khi chưa có nội dung: thoát 0, in 4 cảnh báo thiếu. Sửa tạm tín chỉ một môn trong JSON → thoát 1, nêu mã (trả lại sau khi thử). `--strict` khi thiếu nội dung → thoát 1.
Xuất hàm thuần `wordCount(s)`, `checkConds(files)` để test.

## Cách kiểm

`npm ci` (nếu worktree mới) → `npm run typecheck && npm run lint && npm run build && npm run test:silver` (riêng BE-00 tạo lệnh cuối). Test viết ở `scripts/silver/tests/check.test.mjs`, phủ hết ví dụ trên. Báo cáo: file đã sửa, kết quả bốn lệnh, điểm chưa chắc. Không commit/push khi điều phối chưa bảo.

## Ngoài phạm vi

UI, scene, nội dung, đổi kiểu trong `src/types/silver.ts`, file không liệt kê ở trên.
