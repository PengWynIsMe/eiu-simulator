# Báo cáo 3D-03 — Thầy, TV, bạn học dùng chung

Nhánh `PengWynIsMe/it-silver-3d-03`.
Các commit triển khai theo từng mục của spec:
- `0112472`: 3D-03: tạo frame.ts chuyển đổi tọa độ và yaw đa tòa nhà
- `f8fa3ca`: 3D-03: tạo lessonSignal dịch useLessonStore sang ClassSignal
- `f7fff40`: 3D-03: TV và slideCanvas nhận dữ liệu theo ClassSignal
- `1fb5a20`: 3D-03: tuyến thầy linh hoạt theo teacherSpots và kiểm thử so khớp 406.B11
- `2d84166`: 3D-03: bạn học theo crowd và đường ra cửa qua toWorld
- `5c2a7cf`: 3D-03: gom phòng 406.B11 từ các diễn viên dùng chung

## Đã làm

1. **`src/scene/silver/frame.ts`**:
   - Cung cấp `toWorld(frame, u, v)` chuyển đổi tọa độ địa phương sang thế giới cho cả B11 và B8.
   - Cung cấp `yawOf(frame, du, dv) = Math.atan2(wx, wz)` qua vector thế giới để xử lý đúng chiều xoay (B8 có `rotation.y` ngược dấu so với B11).
   - Cung cấp `rotationYOf(frame)` lấy góc xoay tòa nhà.
   - Giữ nguyên `localDirToYaw` trong `src/scene/npc/sitPose.ts` cho mã cũ.

2. **`src/silverWorld/lessonSignal.ts`**:
   - Dịch `useLessonStore` sang `ClassSignal` (`getLessonSignal`, `subscribeLessonSignal`, `createLessonSignal`).
   - Chuyển pha: `idle` / `goToClass` / `findSeat` → `idle`; `dialogue` → `talk`; `lecture` → `slide`; `question` → `question`; `exercise` → `exercise`; `summary` → `end`.
   - Bìa mặc định: `{ title: 'Nhập môn lập trình', subtitle: 'Buổi 1' }`.
   - Kết quả phản ứng (`result`): quản lý `id` tăng dần để các diễn viên nhận biết kết quả mới chính xác.

3. **`src/scene/lesson/slideCanvas.ts` & `src/scene/lesson/ProjectorScreen.tsx`**:
   - `drawSlide` nhận `{ slide, cover }` thay vì biến `COVER` cứng, vẽ lại khi slide, ngôn ngữ hoặc bìa thay đổi. Hỗ trợ chữ song ngữ đã giải trong signal.
   - `ProjectorScreen` nhận `room: Classroom`, `getSignal: () => ClassSignal`, `subscribe`, kích thước và góc quay chuẩn theo `room.projectorScreen`, không import `useLessonStore`.

4. **`src/scene/lesson/Teacher.tsx` & tuyến đường thầy**:
   - Bỏ hằng số `DETOUR_U = 95.8` cứng. Tuyến đi tính bằng `computeTeacherPlan(room)`: sử dụng thuật toán Liang-Barsky kiểm tra đoạn thẳng giữa `desk` và `lecture` có cắt bàn GV hay không.
   - Nếu cắt, vòng phía sau bàn khoảng cách 0.7 m (`DETOUR_DISTANCE = 0.7`). Đối với phòng 406.B11, các mốc tọa độ thế giới của `toLecture` và `toDesk` trùng khớp 100% với các điểm cũ (sai số < 1e-9).
   - Thầy nhận `room`, `getSignal`, `subscribe`, `crowd`, không import `useLessonStore`.

5. **`src/scene/npc/classroomPlan.ts` & `src/scene/npc/ClassroomNpcs.tsx`**:
   - `buildClassroomPlan` nhận `room` và `crowd` tùy chọn (`npcSeats.slice(0, crowd)`).
   - Tuyến đường ra cửa tính qua `room.door` và `aisle` chuyển đổi sang thế giới qua `toWorld(room.frame)`.
   - `ClassroomNpcs` nhận `room`, `getSignal`, `subscribe`, `crowd`, `sitYOffset` (mặc định 0.40). Cử chỉ giơ tay ở pha question, hoan hô khi đúng bài tập, gõ phím khi ngồi, và tuần tự đứng dậy ra cửa khi tổng kết (`end`).
   - Không import `useLessonStore`.

6. **`src/scene/lesson/Lesson406.tsx`**:
   - Gom `Classroom406`, `ProjectorScreen`, `Teacher`, `ClassroomNpcs` với tín hiệu từ `lessonSignal`.
   - Nhận prop `sitYOffset` (mặc định 0.40). Quản lý điều kiện mount dựa trên tầng 4 B11 qua `useWalkStore`.

## Bảng tiêu chí và kết quả

| Tiêu chí | Cách kiểm | Kết quả |
| --- | --- | --- |
| `grep useLessonStore` trong `scene/lesson`, `scene/npc` chỉ còn ở `Lesson406`/`Classroom406` (viền ghế) | `git grep "useLessonStore" src/scene/lesson/ src/scene/npc/` | **Đạt** (chỉ có ở Classroom406 và ghi chú chú thích) |
| 406.B11: Đường thầy khớp 100% giá trị cũ | Unit test `scripts/silver/tests/teacher-route.test.mjs` so sánh từng điểm cũ và mới | **Đạt** (sai số < 1e-9) |
| Tuyến thầy ở phòng 406.B8 tính toán chuẩn xác | Unit test `scripts/silver/tests/teacher-route.test.mjs` | **Đạt** |
| TV nhận `{ slide, cover }`, hướng và kích thước theo `projectorScreen` | Kiểm tra code, unit test và chạy headless browser | **Đạt** |
| Bạn học theo đám đông, đường ra cửa, cử chỉ theo mode/result | Kiểm tra code và luồng nmlt-01 trên headless browser | **Đạt** |
| Ảnh chụp TRƯỚC và SAU tại 4 góc theo spec: trong lớp, slide 2, câu hỏi (giơ tay), tổng kết | Chụp qua Chrome CDP headless trước khi sửa và sau khi sửa tại `/tmp/campussim-3d-03/{truoc,sau}/` | **Đạt** (hình ảnh và dung lượng file tương đồng hoàn toàn) |
| Hồi quy đầy đủ `nmlt-01` (bắt buộc) | Kịch bản tự động: Bắt đầu → trước thang máy T4 B11 → vào 406 → ghế viền vàng → E ngồi → thầy chào → 2 slide đổi trên TV → câu hỏi sai rồi đúng → 2 bài code → tổng kết 3 sao → Esc thu máy → Esc đứng dậy → ngồi lại tiếp | **Đạt** |
| Draw call không tăng khi ngồi 406.B11 | Đọc `window.__gl.info.render.calls` | **Đạt**: 113 draw call, 149.958 tam giác (ngân sách ≤ 130 call, ≤ 350k tam giác) |
| Console không có lỗi/warning đỏ | Theo dõi console browser trong suốt phiên | **Đạt** (0 lỗi) |
| Cổng chung kiểm tra mã nguồn | `npm run typecheck && npm run lint && npm run build && npm run test:silver && npm run check:silver -- --strict` | **Đạt** (0 lỗi, 75 unit test pass) |

## Ảnh chụp đối chứng

Bộ ảnh đối chứng được lưu tại `/tmp/campussim-3d-03/`:
- `01-trong-lop.png`:
  - Trước: `/tmp/campussim-3d-03/truoc/01-trong-lop.png` (169.1 KB)
  - Sau: `/tmp/campussim-3d-03/sau/01-trong-lop.png` (168.1 KB)
- `02-slide-2.png`:
  - Trước: `/tmp/campussim-3d-03/truoc/02-slide-2.png` (190.8 KB)
  - Sau: `/tmp/campussim-3d-03/sau/02-slide-2.png` (189.8 KB)
- `03-cau-hoi-gio-tay.png`:
  - Trước: `/tmp/campussim-3d-03/truoc/03-cau-hoi-gio-tay.png` (183.8 KB)
  - Sau: `/tmp/campussim-3d-03/sau/03-cau-hoi-gio-tay.png` (184.4 KB)
- `04-tong-ket.png`:
  - Trước: `/tmp/campussim-3d-03/truoc/04-tong-ket.png` (187.9 KB)
  - Sau: `/tmp/campussim-3d-03/sau/04-tong-ket.png` (187.8 KB)

## Tình trạng kết thúc

- Toàn bộ dev server và headless Chrome test đã được tắt, không chiếm dụng port nào.
- Nhánh hiện tại `PengWynIsMe/it-silver-3d-03` sạch, sẵn sàng để điều phối review và merge.
