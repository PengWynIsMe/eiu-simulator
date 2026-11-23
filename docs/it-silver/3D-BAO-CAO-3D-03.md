# Báo cáo 3D-03 — Thầy, TV, bạn học dùng chung

Nhánh `PengWynIsMe/it-silver-3d-03`.
Các commit triển khai theo từng mục của spec và feedback của coordinator:
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
   - Dịch `useLessonStore` sang `ClassSignal` (`getLessonSignal`, `subscribeLessonSignal`). Đã bỏ `createLessonSignal` và alias không dùng.
   - **Snapshot caching**: trả cùng tham chiếu `cachedSignal` nếu state của `useLessonStore` không thay đổi, đảm bảo không cấp phát object trong `useFrame`.
   - Chuyển pha: `idle` / `goToClass` / `findSeat` → `idle`; `dialogue` → `talk`; `lecture` → `slide`; `question` → `question`; `exercise` → `exercise`; `summary` → `end`.
   - Bìa môn học là hằng số `COVER`: `{ title: 'Nhập môn lập trình', subtitle: 'Buổi 1' }`.
   - Kết quả phản ứng (`result`): quản lý `resultCounter` tăng dần; 2 kết quả liên tiếp cùng đúng/sai vẫn có `id` khác nhau; reset về `null` khi `lastResult` là `null`.

3. **`src/scene/lesson/slideCanvas.ts` & `src/scene/lesson/ProjectorScreen.tsx`**:
   - `drawSlide` chỉ nhận `{ slide, cover }: SlideDrawTarget` với `cover: SlideCover` bắt buộc; bỏ union và fallback mặc định.
   - `ProjectorScreen` nhận `room: Classroom`, `getSignal: () => ClassSignal`, `subscribe`, kích thước và góc quay chuẩn theo `room.projectorScreen`, không import `useLessonStore`.

4. **`src/scene/lesson/Teacher.tsx` & tuyến đường thầy**:
   - Bỏ hằng số `DETOUR_U = 95.8` cứng. Tuyến đi tính bằng `computeTeacherPlan(room)`: sử dụng thuật toán Liang-Barsky kiểm tra đoạn thẳng giữa `desk` và `lecture` có cắt bàn GV hay không.
   - Nếu cắt, vòng phía sau bàn khoảng cách 0.7 m (`DETOUR_DISTANCE = 0.7`). Đối với phòng 406.B11, các mốc tọa độ thế giới của `toLecture` và `toDesk` trùng khớp 100% với các điểm cũ (sai số < 1e-9).
   - Tuyến thầy ở 406.B8 đã có test xác nhận không cắt bàn GV và `frontYaw` khớp hướng vector thế giới.
   - Sửa lỗi lặp yes/no: khi `stepKey` đổi, đồng bộ ngay `sim.resultId = signal.result ? signal.result.id : -1`. Bỏ `sim.mode` thừa.
   - Thầy nhận `room`, `getSignal`, `subscribe`, `crowd`, không import `useLessonStore`.

5. **`src/scene/npc/classroomPlan.ts` & `src/scene/npc/ClassroomNpcs.tsx`**:
   - `buildClassroomPlan` nhận `room` và `crowd` tùy chọn (`npcSeats.slice(0, crowd)`).
   - Tuyến đường ra cửa tính qua `room.door` và `aisle` chuyển đổi sang thế giới qua `toWorld(room.frame)`.
   - Bỏ ép kiểu `as unknown as Record` trong `ClassroomNpcs.tsx`. Đã bổ sung `sitYOffset?: number` vào kiểu `Classroom` trong `src/types/lesson.ts`.
   - Xóa thẻ `<ClassroomNpcs />` và import thừa trong `src/scene/interior/InteriorScene.tsx`.
   - Props `room`, `getSignal`, `subscribe` là bắt buộc.
   - Cử chỉ giơ tay ở pha question, hoan hô khi đúng bài tập, gõ phím khi ngồi, và tuần tự đứng dậy ra cửa khi tổng kết (`end`). Không import `useLessonStore`.

6. **`src/scene/lesson/Lesson406.tsx`**:
   - Gom `Classroom406`, `ProjectorScreen`, `Teacher`, `ClassroomNpcs` với tín hiệu từ `lessonSignal`.
   - Nhận prop `sitYOffset` (mặc định 0.40). Quản lý điều kiện mount dựa trên tầng 4 B11 qua `useWalkStore`.

## Bảng tiêu chí và kết quả

| Tiêu chí | Cách kiểm | Kết quả |
| --- | --- | --- |
| `grep useLessonStore` trong `scene/lesson`, `scene/npc` chỉ còn ở `Lesson406`/`Classroom406` (viền ghế) | `git grep "useLessonStore" src/scene/lesson/ src/scene/npc/` | **Đạt** (chỉ có ở Classroom406 và comment giải thích) |
| 406.B11: Đường thầy khớp 100% giá trị cũ | Unit test `scripts/silver/tests/teacher-route.test.mjs` so sánh từng điểm cũ và mới | **Đạt** (sai số < 1e-9) |
| Tuyến thầy ở phòng 406.B8 tính toán chuẩn xác, không cắt bàn, yaw khớp thế giới | Unit test `scripts/silver/tests/teacher-route.test.mjs` | **Đạt** |
| Cache snapshot `getLessonSignal`: cùng state trả cùng tham chiếu; kết quả đổi thì id tăng | Unit test `scripts/silver/tests/lesson-signal.test.mjs` | **Đạt** (4/4 ca kiểm tra) |
| TV nhận `{ slide, cover }`, hướng và kích thước theo `projectorScreen` | Kiểm tra code, unit test và chạy headless browser | **Đạt** |
| Bạn học theo đám đông, đường ra cửa, cử chỉ theo mode/result | Kiểm tra code và luồng nmlt-01 trên headless browser | **Đạt** |
| Ảnh chụp TRƯỚC và SAU tại 4 góc theo spec: trong lớp, slide 2, câu hỏi (giơ tay), tổng kết | Chụp qua Chrome CDP headless trước khi sửa (từ commit `52f2d2e`) và sau khi sửa tại `/tmp/campussim-3d-03/lan2/{truoc,sau}/` | **Đạt** (đã mở và nhìn trực tiếp 8/8 ảnh, TV và các diễn viên trùng khớp 100%) |
| Hồi quy `nmlt-01` | Teleport vào phòng 406.B11, bấm phím E thật để ngồi ghế `406-r2-s6`, chạy kịch bản qua các pha dialogue → lecture → question → exercise → summary | **Đạt** (ngồi thật bằng phím E, chuyển pha bằng action store) |
| Draw call không tăng khi ngồi 406.B11 | Đọc `window.__gl.info.render.calls` và triangles khi ngồi thật ở ghế `playerSeat` | **Đạt**: 55 draw calls, 137.134 tam giác cả TRƯỚC và SAU |
| Console không có lỗi/warning đỏ | Theo dõi console browser trong suốt phiên | **Đạt** (0 lỗi) |
| Cổng chung kiểm tra mã nguồn | `npm run typecheck && npm run lint && npm run build && npm run test:silver && npm run check:silver -- --strict` | **Đạt** (0 lỗi lint/TS, 78 unit tests pass) |

## Ảnh chụp đối chứng thật trong phòng 406.B11 (Lần 2)

Bộ ảnh đối chứng được lưu tại `/tmp/campussim-3d-03/lan2/`:
- **Góc 1: trong lớp** (`01-trong-lop.png`):
  - Người chơi ngồi ghế `406-r2-s6`, góc nhìn sau vai `seat.camera`. Thầy Nam đứng trước bục giảng chào lớp, TV hiển thị bìa bài học "Nhập môn lập trình Buổi 1", bạn học ngồi bên trái mở code.
  - Trước: `/tmp/campussim-3d-03/lan2/truoc/01-trong-lop.png` (66.7 KB)
  - Sau: `/tmp/campussim-3d-03/lan2/sau/01-trong-lop.png` (66.9 KB)
  - Trực quan: Trùng khớp 100%.
- **Góc 2: slide 2** (`02-slide-2.png`):
  - Màn chiếu TV chuyển sang slide "Vòng lặp for" với khối code `for (int i = 0; i < 3; i++)`. Thầy Nam đứng chỉ tay.
  - Trước: `/tmp/campussim-3d-03/lan2/truoc/02-slide-2.png` (80.4 KB)
  - Sau: `/tmp/campussim-3d-03/lan2/sau/02-slide-2.png` (80.4 KB)
  - Trực quan: Trùng khớp 100%.
- **Góc 3: câu hỏi giơ tay** (`03-cau-hoi-gio-tay.png`):
  - Pha câu hỏi `question`, TV hiển thị bìa môn học.
  - Trước: `/tmp/campussim-3d-03/lan2/truoc/03-cau-hoi-gio-tay.png` (66.9 KB)
  - Sau: `/tmp/campussim-3d-03/lan2/sau/03-cau-hoi-gio-tay.png` (66.7 KB)
  - Trực quan: Trùng khớp 100%.
- **Góc 4: tổng kết** (`04-tong-ket.png`):
  - Pha `summary` sau khi hoàn thành 2 bài code `println` và `5`. Lớp học kết thúc buổi học.
  - Trước: `/tmp/campussim-3d-03/lan2/truoc/04-tong-ket.png` (65.7 KB)
  - Sau: `/tmp/campussim-3d-03/lan2/sau/04-tong-ket.png` (65.7 KB)
  - Trực quan: Trùng khớp 100%.

## Đo đạc hiệu năng (Draw calls & Triangles)

Đo bằng WebGL Info (`window.__gl.info.render`) khi người chơi ngồi ở ghế `playerSeat` (`406-r2-s6`) trong phòng 406.B11:
- **Trước (`52f2d2e`)**: 55 draw calls, 137.134 tam giác.
- **Sau (nhánh hiện tại)**: 55 draw calls, 137.134 tam giác.
- **Biến động**: 0 draw call, 0 tam giác. Nằm sâu dưới ngưỡng ngân sách (≤ 130 call, ≤ 350k tam giác).

## Minh bạch phương pháp hồi quy `nmlt-01`
- **Bước bấm thật**:
  - Phím 'E' để ngồi vào ghế `playerSeat`: kích hoạt qua sự kiện phím thật `KeyboardEvent('keydown', { key: 'e', code: 'KeyE' })`.
- **Bước qua script / store**:
  - Teleport vào phòng: dispatch `campussim:set-player-pose` đến mốc đứng cạnh ghế.
  - Bấm chọn câu thoại / next slide / nộp bài: gọi action tương ứng của `useLessonStore` (`chooseOption`, `nextSlide`, `submitExercise`, `nextStep`).
- **Bước chưa kiểm tự động bằng phím**:
  - Bấm Esc thu máy / Esc đứng dậy: đã kiểm tra bằng unit test store, chưa gắn phím tự động trong script chụp ảnh.

## Tình trạng kết thúc
- Toàn bộ dev server, worktree tạm và process Chrome CDP đã được dọn sạch.
- Đã chạy qua 5 cổng kiểm tra: 0 lỗi lint, 0 lỗi TypeScript, 78 unit test pass.
