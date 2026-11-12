# Lộ trình CampusSim — EIU

## Giai đoạn 0 — Nền móng tài liệu ✅

`AGENTS.md`, `CLAUDE.md`, `.agents/rules/campussim-gemini.md`, `docs/*`, thu thập tài liệu (`docs/ASSETS*.md`, `references/`).

## Giai đoạn 1 — Mô hình khuôn viên EIU (ưu tiên hiện tại)

Người dùng chốt 2026-11-12: **dựng mô hình trước, nội dung ngành học để sau.**
Cách làm: dựng **khu vực 1** (trục cổng chính → quảng trường) thật kỹ làm "lát cắt mẫu";
phần còn lại tạm là khối đúng khung nền, nâng cấp dần theo từng khu.

| Task | Người làm | Nội dung | Trạng thái |
| --- | --- | --- | --- |
| **T01** Khung dự án + hợp đồng | Claude | Vite/React/TS strict/Tailwind/R3F/ESLint; types; store; `campus.json` + `layout.json` (khung nền thật từ OSM); bản xem bố cục tạm | ✅ 2026-11-12 |
| **T02** Nền chung | Gemini | Mặt đất, đường có bề rộng thật, vòng xoay, ranh giới; `Building` dùng chung (đùn khung nền + mái chìa + màu); cây instancing; ánh sáng/bầu trời; `CameraRig` tĩnh có giới hạn | Brief: `docs/tasks/T02-nen-chung.md` |
| **T03** Khu vực 1 chi tiết | Gemini | Block 3/4/5/6 mức 2 (tầng, cửa sổ, lam, mảng kính), hồ nước + 2 cầu mái xanh, hành lang mái che, nhà xe sau Block 5, cổng (tạm) | Brief: `docs/tasks/T03-khu-vuc-1.md` |
| **T04** Hover/click + Chế độ góp ý | Claude (lưu trữ) + **2 Gemini song song**: T04a 3D (`scene/`), T04b giao diện (`ui/` + `App.tsx`) | Highlight, nhãn tên, `selectBuilding`; ghi chú ngay trên mô hình → `review/notes.json` + GitHub Issues | ✅ 2026-11-13 (gộp) |
| T05 Camera bay tới / quay về | Gemini | `CameraControls.setLookAt(..., true)` | Chưa |
| T06 Khu vực 2 (B8–B11, căn tin) | Gemini | Dùng lại `scene/kit/` từ T03 | Chờ người dùng đánh dấu `_tong-hop-2.jpg` |
| T07 Loading + tối ưu | Gemini → Claude | `useProgress`, chia nhỏ bundle (three.js ~1 MB), kiểm tra điện thoại | Chưa |
| T08 Panel thông tin tòa nhà | Gemini | Panel phải / bottom sheet: tên, chức năng, tầng | Chưa |
| **T09** Chế độ đi bộ | **Codex (gpt-6-luna, medium)** — luồng C | Nhân vật + camera bám sau, WASD/cần ảo, va chạm tòa nhà/hồ | ✅ 2026-11-13 (gộp) |

Thứ tự: T02 → T03 → (T04, T05) → T06 → T07. T08 làm song song được với T04–T06 (chỉ đụng `ui/`).

Sau mỗi task: Claude review → người dùng xem thử → commit → cập nhật `HANDOFF.md`.

## Giai đoạn 1.5 — Nội dung ngành + "chất game"

- Dữ liệu ngành thật của EIU (đề xuất: Kỹ thuật phần mềm, QTKD, Điều dưỡng) → panel ngành.
- Hộ chiếu ngành (đóng dấu tòa đã ghé), quiz "ngành nào hợp với bạn", NPC sinh viên, chế độ đi bộ.

## Giai đoạn 2+ — Tầm nhìn (chưa làm)

Nội thất (tour 360 có 142 ảnh bên trong B3, B4–5, B6, B8, B11) → Supabase → multiplayer/vào lớp → voice/video.
