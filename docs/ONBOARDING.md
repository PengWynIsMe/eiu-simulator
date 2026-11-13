# Bắt đầu nhanh — dành cho người / agent mới vào dự án

Cập nhật: 2026-11-13. Đọc file này trước, rồi `AGENTS.md` (luật chung), rồi `docs/HANDOFF.md` (trạng thái mới nhất).

## 1. Dự án là gì

**CampusSim EIU** — web 3D low-poly mô phỏng khuôn viên Trường Đại học Quốc tế Miền Đông (EIU).
Người xem xoay/zoom hoặc **điều khiển nhân vật đi bộ** quanh trường, rê chuột vào tòa nhà để xem tên.
Sau này: bấm tòa nhà → xem ngành học (chương trình, một ngày của sinh viên, nghề nghiệp).

- Link chạy thật: **https://pengwynisme.github.io/eiu-simulator/** (tự cập nhật mỗi lần push `main`, ~2 phút)
- Repo: https://github.com/PengWynIsMe/eiu-simulator (public)
- Chủ dự án: PengWynIsMe. Ngôn ngữ làm việc: **tiếng Việt**.

## 2. Đang ở đâu

| Đã xong | Nội dung |
| --- | --- |
| T01 | Khung dự án, hệ tọa độ, dữ liệu khung nền thật từ OpenStreetMap |
| T02 | Nền: mặt đất, đường, khối nhà, cây, trời, camera |
| T03 | Khu vực 1 (cổng chính → quảng trường) chi tiết: Block 3/4/5, hồ nước + 2 cầu mái xanh, nhà xe, cột cờ; hết nhấp nháy |
| T04 | Hover/click tòa nhà + **Chế độ góp ý** (ghi chú ngay trên mô hình) |
| T09 | **Chế độ đi bộ**: nhân vật, WASD/mũi tên, Shift chạy, camera bám sau, va chạm tường/hồ, cần ảo trên điện thoại |
| T06, T08 | (đồng nghiệp) B8–B11 + khu vực 2 chi tiết; panel thông tin tòa nhà có phòng theo tầng |
| T05, T10, T11 | Camera bay tới tòa; chi tiết tòa ở `src/data/building-details.json`; nhân vật robot CC0 có animation |
| T12 | **Vào trong Block 3**: sảnh + 3 tầng, thang máy, thẻ phòng (bản thử theo tour 360) |

**Việc tiếp theo** (chi tiết trong `docs/ROADMAP.md`):
1. **Đọc góp ý và sửa** — góp ý của nhóm nằm ở GitHub Issues nhãn `gop-y` (xem mục 5).
2. T05 camera bay tới tòa nhà khi bấm / nút quay về toàn cảnh.
3. T10 (đang làm) chuyển chi tiết tòa nhà sang `src/data/building-details.json` + ghi nguồn; còn lại của khu vực 2: dốc hầm nhà xe 2 tầng, cổng phụ.
4. T07 màn hình tải + tối ưu (bundle three.js ~1 MB).
5. Giai đoạn sau: nội dung ngành học thật của EIU, nội thất, multiplayer.

Còn thiếu thông tin từ người dùng: **ảnh cổng chính mới** (cổng trong tour/Street View là cổng cũ), **số tầng Block 6**.

## 3. Chạy trên máy

Cần Node 20.

```bash
git clone https://github.com/PengWynIsMe/eiu-simulator.git
cd eiu-simulator
npm ci
npm run dev          # mở http://localhost:5173
```

Trước khi báo xong bất kỳ việc gì:

```bash
npm run typecheck && npm run lint && npm run build
```

Thư mục `references/` (ảnh vệ tinh, ảnh tour 360°, sổ tay sinh viên) **không có trên GitHub** vì nặng và có bản quyền —
chỉ có các file ghi chú `.md`. Cần ảnh thì xin chủ dự án, hoặc xem nguồn trong `references/NGUON.md`.

## 4. Bản đồ tài liệu

| File | Để làm gì |
| --- | --- |
| `AGENTS.md` | **Luật chung**: tech stack khóa, cấu trúc thư mục, **hệ tọa độ**, ai sửa file nào, quy trình task, chạy nhiều agent song song |
| `docs/HANDOFF.md` | Trạng thái mới nhất, quyết định đã chốt, điều còn mở |
| `docs/ROADMAP.md` | Danh sách task và trạng thái |
| `docs/BRIEF.md` | Brief sản phẩm gốc + các điều chỉnh đã chốt (cuối file) |
| `docs/tasks/T*.md` | Brief từng task; `T*-bao-cao.md` là báo cáo khi agent làm xong |
| `docs/ASSETS.md`, `docs/ASSETS-REVIEW.md` | Cách thu thập tài liệu khuôn viên và đánh giá mức dựng từng tòa |
| `references/tour-360/GHI-CHU.md` | Ảnh 360° nào chụp ở đâu (người dùng đánh dấu) |
| `src/data/building-details.json` | (sau T10) Chi tiết tòa: tiêu đề phụ, đặc điểm, **phòng theo tầng**, **nguồn** — sửa nội dung panel ở đây |
| `src/data/campus.json` | Thông tin từng tòa (tên, số tầng, màu, khu vực, ghi chú nguồn) — **sửa dữ liệu ở đây** |
| `src/data/layout.json` | Khung nền tòa + đường sinh tự động từ OSM (`npm run layout`) — **không sửa tay** |

## 5. Góp ý trên mô hình — cách đọc và xử lý

- Người xem bật **"Chế độ góp ý"**, bấm vào tòa/mặt đất, ghi nội dung → bấm Lưu.
  - Trên link GitHub Pages: mở trang tạo **GitHub Issue** điền sẵn (tiêu đề `[Góp ý] ...`, nhãn `gop-y`, JSON ẩn trong body có `targetId`, tọa độ `point`, góc `camera`).
  - Khi chạy `npm run dev`: ghi thẳng vào `review/notes.json`.
- Đọc góp ý:

  ```bash
  gh issue list --repo PengWynIsMe/eiu-simulator --label gop-y --state open
  gh issue view <số> --repo PengWynIsMe/eiu-simulator
  ```

  cộng thêm `review/notes.json` và file trong `review/inbox/` (người không có tài khoản GitHub tải file gửi lại).
- Xử lý: gom theo `targetId` → sai dữ liệu (vị trí, số tầng, tên) sửa `src/data/campus.json`; sai hình dáng 3D giao agent làm `src/scene/`.
  Sửa xong: **đóng Issue kèm bình luận đã sửa gì** → ghim trên mô hình tự chuyển "đã sửa".

## 6. Cách nhóm làm việc với agent

- **Người (đồng nghiệp) push thẳng `main` cũng được**, nhưng nhớ: chạy 3 lệnh kiểm tra, **nội dung đặt trong `src/data/`** (không viết cứng trong component), ghi **nguồn** cho số liệu, và cập nhật `docs/HANDOFF.md` + `docs/ROADMAP.md`.

- **Claude (Claude Code)** = tech lead/điều phối: viết brief, giữ "hợp đồng" (`src/types`, `src/store`, `src/data`, config), review, gộp, commit, push.
- **Gemini (Antigravity)** = thợ code chính phần 3D (`src/scene/`) và giao diện (`src/ui/`).
- **Codex** = phụ thêm một luồng khi cần (đã làm chế độ đi bộ).
- Mỗi task một brief trong `docs/tasks/`; agent chỉ sửa đúng file brief cho phép, không cài thư viện, không tự commit.
- Chạy song song: mỗi luồng **một git worktree + nhánh riêng + nhóm file riêng** (xem `AGENTS.md` → "Chạy nhiều agent song song").
  Đợt T04a/T04b/T09 chạy 3 luồng cùng lúc, gộp không xung đột.

## 7. Bẫy hay gặp

- **Hệ tọa độ**: mét, gốc = tâm vòng xoay, **+X = Đông (cổng chính)**, **-Z = Bắc**. Khung nền `[x, z]` → shape `[x, -z]` rồi xoay `-π/2` quanh X.
- Không tự dời/xoay tòa nhà "cho đẹp" — khung nền OSM là sự thật; muốn đổi thì sửa dữ liệu và ghi lý do.
- Lớp mặt phẳng phải cách nhau ≥ 0.15 m (nếu không sẽ nhấp nháy — z-fighting).
- Không tạo object mới trong `useFrame`; cây/vật lặp lại dùng instancing.
- Bản đồ nền © OpenStreetMap contributors — **giữ dòng ghi công** ở góc màn hình.
- Ảnh trong `references/` chỉ để tham khảo khi dựng, **không** đưa vào app.
