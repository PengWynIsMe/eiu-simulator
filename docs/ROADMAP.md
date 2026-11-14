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
| **T05** Camera bay tới / quay về + dọn cảnh báo | Gemini | `CameraControls.setLookAt(..., true)` theo `selectedBuildingId`; sửa `toNonIndexed` | ✅ 2026-11-14 |
| T06 Khu vực 2 (B8–B11, căn tin) | Đồng nghiệp (Hieuthao63d) | `TwinWingBlock` cho B8–B11, Block 6 BBI, căn tin, nhà xe nhiều tầng, trạm điện, ki-ốt, hành lang khu vực 2 | ✅ phần lớn — commit `7436d2a` (2026-11-13); còn: lối dốc hầm nhà xe 2 tầng, cổng phụ chi tiết |
| T07 Loading + tối ưu | Gemini → Claude | `useProgress`, chia nhỏ bundle (three.js ~1 MB), kiểm tra điện thoại | Chưa |
| T08 Panel thông tin tòa nhà | Đồng nghiệp (Hieuthao63d) | Panel: cấu trúc, phòng theo từng tầng, Về tổng quan | ✅ commit `7436d2a` |
| **T10** Chi tiết tòa nhà → dữ liệu + nguồn | Codex (gpt-6-luna, medium) | Chuyển `BUILDING_SPECS` từ `ui/text.ts` sang `src/data/building-details.json`, thêm trường nguồn | ✅ 2026-11-13 (18/18 tòa trùng khớp) |
| **T11** Nhân vật người có animation | Codex (gpt-6-luna, medium) | Model CC0 low-poly, đứng/đi/chạy | ✅ 2026-11-14 (robot CC0 tạm — đổi nhân vật người khi có file .glb) |
| **T12** Vào Block 3: sảnh, 3 tầng, thang máy, phòng | Gemini | Bản thử nội thất theo tour 360 (chưa có sơ đồ thoát hiểm) | ✅ 2026-11-14 (bản thử; lỗi còn lại xem HANDOFF mục 2) |
| **T13** Nội thất dùng chung + vào B8 | Gemini | Bố cục theo sơ đồ thoát hiểm thật 4 tầng; tổng quát hóa hệ nội thất T12; sửa lỗi thang máy/cửa ra B3 | Đang làm — `docs/tasks/T13-noi-that-b8.md` |
| **T14** Độ cao mặt đất cho nhân vật | Codex (gpt-6-luna, medium) | `getGroundHeight(x,z)` theo layout; hết lún chân/lơ lửng | Đang làm — `docs/tasks/T14-do-cao-mat-dat.md` |
| **T09** Chế độ đi bộ | **Codex (gpt-6-luna, medium)** — luồng C | Nhân vật + camera bám sau, WASD/cần ảo, va chạm tòa nhà/hồ | ✅ 2026-11-13 (gộp) |

Thứ tự: T02 → T03 → (T04, T05) → T06 → T07. T08 làm song song được với T04–T06 (chỉ đụng `ui/`).

Sau mỗi task: Claude review → người dùng xem thử → commit → cập nhật `HANDOFF.md`.

## Giai đoạn 1.5 — Nội dung ngành + "chất game"

- Dữ liệu ngành thật của EIU (đề xuất: Kỹ thuật phần mềm, QTKD, Điều dưỡng) → panel ngành.
- Hộ chiếu ngành (đóng dấu tòa đã ghé), quiz "ngành nào hợp với bạn", NPC sinh viên, chế độ đi bộ.

## Giai đoạn 2+ — Tầm nhìn (chưa làm)

Nội thất (tour 360 có 142 ảnh bên trong B3, B4–5, B6, B8, B11) → Supabase → multiplayer/vào lớp → voice/video.
