# HANDOFF — trạng thái hiện tại

Cập nhật: 2026-11-12

- **Giai đoạn:** 1 — mô hình khuôn viên EIU. **T01 xong** (Claude).
- **Link test cho đồng nghiệp:** https://pengwynisme.github.io/eiu-simulator/ — GitHub Actions (`.github/workflows/deploy.yml`)
  tự build + đăng mỗi lần push `main`. Repo `PengWynIsMe/eiu-simulator` đang **public**. Khi merge T03 vào `main` nhớ giữ commit Pages (`base: './'`).
- **T02 xong** (Gemini), người dùng duyệt 2026-11-13, đã merge vào `main`. Lỗi còn lại (nhấp nháy, màu, cây) chuyển vào T03 "Phần 0".
- **Đang làm:** — (chờ góp ý của người dùng/đồng nghiệp qua chế độ góp ý). Lịch sử: **T03** — Gemini 3.8 Flash (High) qua Antigravity CLI (`agy`) trong Orca,
  terminal `term_acdc0de5-2180-4022-90d8-24c364fe53e8`, nhánh `t03-khu-vuc-1`.
- **Việc tiếp theo chính xác:** khi Gemini ghi xong `docs/tasks/T03-bao-cao.md` → Claude review + 3 cổng kiểm tra + xem trình duyệt
  → người dùng xem thử → commit + merge.
- **Người dùng trả lời đợt 2 (2026-11-12):** B4, B5 = 3 tầng; B8–B11 = 4 tầng; cầu nằm trên mặt hồ, hồ cao ~0.6 m;
  `nho-1` bỏ; `nho-2` = hành lang B3–B6; thêm nhà xe sau B5 → trạm điện → Fami Pizza; nhà xe cạnh Căn tin kéo dài tới gần cổng phụ;
  cổng sau = cổng phụ, ở cuối đường giữa B10 và B11. Đã cập nhật `campus.json`. Còn chưa rõ: số tầng B6; ảnh cổng mới.
- **Người dùng đã đánh dấu xong ảnh 2** (campus_13–25) → `references/tour-360/GHI-CHU.md`. Còn thiếu: `campus_21` (tòa hai bên), `campus_26`. Cổng mới vẫn chưa có ảnh.

## Đợt song song 3 luồng (từ commit T03) — ✅ XONG, đã gộp 2026-11-13

Gộp B → A → C vào `t03-khu-vuc-1` không xung đột; typecheck/lint/build sạch; Claude thử tay: góp ý bấm Block 3 → form đúng; nút Đi bộ → nhân vật; giữ D đi ngang không xoay camera (sau vòng sửa 1 của Codex).
Người dùng duyệt → **đã merge `main` + push 2026-11-13**, link Pages đã cập nhật (kiểm tra: bundle trùng, góp ý bản online đọc GitHub không lỗi). Worktree + nhánh 3 luồng đã xóa.

| Luồng | Agent | Nhánh / worktree | Brief | Cổng dev |
| --- | --- | --- | --- | --- |
| A | Gemini | `t04a-3d` | `docs/tasks/T04a-3d.md` | 5174 |
| B | Gemini | `t04b-giao-dien` | `docs/tasks/T04b-giao-dien.md` | 5175 |
| C | Codex gpt-6-luna medium | `t09-di-bo` | `docs/tasks/T09-di-bo.md` | 5176 |

File gắn kết (`Campus.tsx`, `App.tsx` dòng WalkHud) Claude đã gắn sẵn stub. Thứ tự gộp dự kiến: B → A → C.

## Chế độ góp ý (T04)

- Người dùng chọn 2026-11-13: máy chủ dự án (`npm run dev`) ghi `review/notes.json`; đồng nghiệp (contributor, có GitHub) trên bản Pages gửi thành **GitHub Issue** (tiêu đề `[Góp ý] ...`, nhãn `gop-y`, JSON ẩn trong body). App đọc Issue qua API công khai → ai cũng thấy ghim của nhau. Issue đóng = đã sửa. Dự phòng: tải file → `review/inbox/`.
- Claude đọc góp ý: `gh issue list --label gop-y --state open` + `review/notes.json` + `review/inbox/`. Sửa xong: đóng Issue kèm bình luận đã sửa gì.
- Claude đã làm phần lưu trữ (types, `src/data/reviewNotes.ts`, `src/store/useReviewStore.ts`, plugin `scripts/review-notes-plugin.mjs`) — chưa commit, nằm trên nhánh `t03-khu-vuc-1` (không đụng file của Gemini).
- Người dùng duyệt chạy song song 2026-11-13: sau T03, Claude tạo 2 worktree từ commit T03 — luồng A `t04a-3d` (`docs/tasks/T04a-3d.md`, chỉ `scene/`), luồng B `t04b-giao-dien` (`docs/tasks/T04b-giao-dien.md`, chỉ `ui/` + `App.tsx`) — mỗi luồng một Gemini. Hai luồng nói chuyện qua `useReviewStore` (`cameraRequest`).

## Trạng thái T01

- Code: Vite 5 + React 18 + TS strict + Tailwind 4.1 + R3F 8 + drei 9 + zustand 5 + ESLint 9. Phiên bản ghim cố định trong `package.json`.
- `npm run typecheck`, `npm run lint`, `npm run build` sạch; console trình duyệt sạch (kiểm 2026-11-12).
  Build có cảnh báo bundle > 500 kB (three.js) — để T07.
- Dữ liệu: `src/data/layout.json` sinh từ OSM (`npm run layout`): 13 tòa, 35 đường, 3 bãi xe, vòng xoay r ≈ 79.7 m.
  `src/data/campus.json`: thông tin viết tay; nhiều số tầng ghi "CHƯA CHẮC" trong `notes`; 4 công trình nhỏ chưa rõ là gì (`nho-1..4`).
- `src/scene/Campus.tsx` là **bản xem bố cục tạm** — T02 thay thế.
- **Chưa commit** — chờ người dùng cho phép.

## Thu thập tài liệu EIU

- Kết quả + danh sách cần bổ sung: `docs/ASSETS-REVIEW.md`. Nguồn: `references/NGUON.md`.
- Khu vực 1 đã gắn vị trí ảnh 360: `references/tour-360/GHI-CHU.md`.
- Cổng chính trong tour/Street View là **cổng cũ**; cổng mới (vòm cung, xây sau 08/2025) chưa có ảnh.

## Quyết định đã chốt

- Xem "Điều chỉnh đã chốt" trong `docs/BRIEF.md` (mục 1–9).
- Ưu tiên mô hình trước, ngành học sau. Khu vực 1 làm "lát cắt mẫu" mức 2; phần còn lại mức 1.

## Ghi chú mở

- OSM ghi B8–B11 là 3 tầng, tour có tầng 1–4 → đang dùng 4. Cần người dùng xác nhận số tầng các block.
- Cầu Block 4 ↔ Block 3 trong OSM có `layer=1` (bắc cao qua đường vào?) — cần xác nhận khi dựng T03.
