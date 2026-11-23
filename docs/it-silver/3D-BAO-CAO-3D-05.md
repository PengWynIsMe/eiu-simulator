# Báo cáo 3D-05 — Đạo diễn Silver

Nhánh `PengWynIsMe/it-silver-3d-05`, bắt đầu từ `52f2d2e` (đã có 3D-00, 3D-01, 3D-02).
Các commit triển khai theo từng phần:
- `695dc11`: 3D-05: nạp và kiểm tra stages.json
- `656db28`: 3D-05: ánh xạ Classroom sang SeatAnchor và khai báo 208.B8
- `6cd4326`: 3D-05: tính waypoint chỉ đường đa chặng
- `ab72414`: 3D-05: chuyển PlayView sang ClassSignal
- `35affdc`: 3D-05: đạo diễn Silver nối useSilverStore với useActivityStore
- `16da8c5`: 3D-05: chuẩn hóa tọa độ waypoint và seatAnchor không chép hằng
- `3a3e6d8`: 3D-05: hoàn thiện đạo diễn với week, key RunItem.id và cảnh vắng
- `0368c06`: 3D-05: kết nối createSilverSignal với store và theo dõi tham chiếu feedback

## Chi tiết các sửa đổi theo phản hồi điều phối

### A. waypoint.ts — Chuẩn hóa số liệu và loại bỏ chép cứng
1. **Số liệu 406.B8 theo classrooms.json**:
   - `doorWorld`: `[35.51, -213.61]` (mét thế giới thực).
   - `bounds`: `u: 81.9..91.3, v: -210.15..-200.05`.
   - Test đã kiểm tra: điểm thật trong 406.B8 (`u=86.6, v=-205.1`) trả về `target`; điểm ở phòng bên cạnh cùng tầng (`u=80`, ngoài bounds) trả về `room` với cửa tại `[35.51, -213.61]`.
2. **Dựng danh sách phòng động từ Classroom**:
   - Hàm `createRoomWaypoint(room: Classroom, toLocal)` trích xuất `doorWorld`, `bounds`, `floor`, `frame` trực tiếp từ dữ liệu phòng. Khi các phòng 206, 207, 311 có dữ liệu trong classrooms thì hệ thống nhận diện và tính toán ngay lập tức.
   - Giữ nguyên nguyên tắc kiến trúc: `waypoint.ts` hoàn toàn không import `src/scene/**`.
3. **Loại bỏ bản chép cứng cửa / thang máy / EX / EV**:
   - Bố cục và hàm chuyển tọa độ `toWorld` được nhận trực tiếp từ caller hoặc từ các hằng số export chính thống của layouts (`B8_ENTRANCE_*`, `B8_ELEVATOR_POS_WORLD`).
   - Khi người chơi rời tòa nhà, hệ thống tính khoảng cách Euclid và chọn cửa ra gần nhất trong danh sách cửa thoát hiểm (`exits`).

### B. director.ts & stageContext.ts — Khóa Activity, tuần và cảnh vắng
1. **Chuyển tiếp giữa `play` và `week`**:
   - Khi người chơi mở lịch tuần (`screen === 'week'`) rồi quay lại `screen === 'play'` với cùng `item.id`, đạo diễn **không** gọi lại `activity.begin()`. Nhờ đó người chơi không bị teleport lại về cửa phòng hoặc mất trạng thái đang đứng/ngồi.
   - Khi chuyển từ `week` sang một item mới cùng ngày (`sameDay`) và ở khoảng cách gần (< 60 m, cùng tòa/tầng), áp dụng luật 60 m: `teleportTo = 'none'`. Khi sang item mới >= 60 m hoặc khác ngày, sử dụng `teleportTo = 'arrival'`.
2. **Xử lý phòng chưa có trong classrooms.json (cảnh vắng / lạ)**:
   - Dùng `isStageAvailable(stage, getClassroom)` để kiểm tra. Nếu phòng chưa có trong classrooms hoặc cảnh lạ: không gọi `begin()`, ghi log `console.warn` đúng 1 lần cho mỗi `sceneId`.
   - Nếu có activity Silver trước đó đang chạy thì tự động gọi `activity.end()`, đảm bảo không kẹt ở phòng trước. Tuyệt đối không gọi `end()` nếu activity hiện tại có nguồn `source === 'lesson'`.
3. **Khóa Activity theo hợp đồng**:
   - Khóa lưu trữ hoạt động được chuẩn hóa thành `silver:<RunItem.id>` theo đúng đặc tả hợp đồng (thay vì `silver:<sceneId>`).
4. **Hành vi `walkMode` khi ở `screen === 'week'`**:
   - Khi người chơi tắt `walkMode` trong khi đang ở màn hình lịch tuần `week`, hệ thống **không** gọi `exitRun()` (do người chơi chỉ đang tương tác với giao diện lịch 2D).
   - Chỉ khi tắt `walkMode` trong lúc `screen === 'play'`, hệ thống mới kích hoạt `exitRun()` để rời lượt chơi 3D.
5. **Kiểu dữ liệu và Store giả**:
   - `DirectorDeps` yêu cầu các store `silver` và `activity` có hợp đồng `getState` và `subscribe`, loại bỏ hoàn toàn các ép kiểu `as SubscribableSilverStore`.
   - Store giả trong test phản ánh đúng cấu trúc `playerPos` và `interior` của `useWalkStore`.

### C. silverSignal.ts — Theo dõi tham chiếu feedback và kết nối Store
1. **Hàm thuần `toClassSignal`**:
   - `toClassSignal(view, lang, result, isCourseEnd)` chuyển đổi thuần túy từ `PlayView` sang `ClassSignal`.
2. **Bộ tạo `createSilverSignal` kết nối Store**:
   - Nhận `silverStore`, `langStore`, và tùy chọn `opts.isCourseEnd`. Trả về `{ getSignal, subscribe, dispose }`.
   - Đảm bảo tính ổn định tham chiếu (referential stability): nếu trạng thái `play`, `lang`, và `feedback` không đổi, hàm trả về nguyên vẹn tham chiếu object `cachedSignal` trước đó, ngăn ngừa render thừa trong Three.js/R3F.
   - `result.id` chỉ tăng khi có tham chiếu `feedback` mới từ store. Nếu `feedback.kind === 'graded'` và `revealed === true`, `result.id` không tăng (không tính là kết quả làm bài mới).
   - Khi người chơi chuyển đổi ngôn ngữ trong `langStore`, tín hiệu cập nhật nội dung song ngữ ngay lập tức và phát thông báo tới các subscriber.

### D. seatAnchor.ts — Tách biệt phòng máy và xử lý ngoại lệ
1. **Phân biệt phòng máy tính và chuẩn hóa fallback**:
   - Nhận diện phòng máy tính dựa trên tập mã phòng máy hoặc từ khóa tên phòng (`room.name.includes('máy tính') || room.name.includes('thực hành')`), tránh kiểm tra tĩnh theo tiền tố mã phòng.
   - Điểm đứng `standPoint` fallback `{ u: 91.8, v: -142.0 }` chỉ áp dụng duy nhất cho phòng `406.B11`. Các phòng khác nếu thiếu `standPoint` sẽ ném lỗi rõ ràng `Room ... missing standPoint`.
2. **Khai báo ghế 208.B8**:
   - Nhận hàm `toWorld` được truyền từ caller, không chép cứng ma trận biến đổi tọa độ. Tọa độ ghế, điểm đứng, camera và góc nhìn được kiểm thử đối chiếu chính xác.

---

## File đã tạo và sửa

- `src/data/silver/stages.json`: Chép từ `docs/it-silver/data/stages.json`, đủ 32 cảnh.
- `src/data/silver/stages.ts`: Nạp và kiểm tra 32 cảnh (`sceneId` duy nhất, tọa độ hữu hạn, `sit` có phòng/ghế riêng, kiểm tra `seatId` khi phòng có trong `classrooms.json`, phòng chưa có ở đợt 1 coi như vắng).
- `src/silverWorld/seatAnchor.ts`: Chuyển đổi `Classroom` sang `SeatAnchor`, mắt cao 1.55, nhìn TV cao 1.35; `screenCamera` cho phòng máy; fallback standPoint chỉ cho 406.B11; khai báo riêng ghế cho 208.B8.
- `src/silverWorld/stageContext.ts`: Tạo `Activity` cho `useActivityStore` (key `silver:<RunItem.id>`, prompt song ngữ E, ghế từ `seatAnchor`).
- `src/silverWorld/director.ts`: `startDirector` kết nối `silver`, `activity`, `walk`:
  - `screen === 'play'`: không `begin` lại nếu cùng `item.id`.
  - Cảnh lạ / phòng vắng: không `begin`, warn 1 lần, kết thúc activity Silver cũ.
  - `teleportTo='none'` khi giữ ghế hoặc cùng ngày < 60 m; `'arrival'` khi sang ngày khác, vào chương hoặc xa >= 60 m.
  - Kết thúc khi về `closed|home`; tắt `walkMode` trong `play` gọi `exitRun()`; tắt `walkMode` trong `week` không thoát lượt.
- `src/silverWorld/waypoint.ts`: `nextWaypoint` dẫn đường đa chặng; tính toán phòng động từ `Classroom`; chọn cửa ra gần nhất khi rời tòa nhà; không import scene.
- `src/silverWorld/silverSignal.ts`: `toClassSignal` và `createSilverSignal` kết nối store, giữ tham chiếu ổn định, tăng `result.id` theo tham chiếu `feedback` mới, hỗ trợ cập nhật ngôn ngữ tức thời.
- Test:
  - `scripts/silver/tests/stages.test.mjs`: 2 ca kiểm nạp 32 cảnh và kiểm tra tính hợp lệ.
  - `scripts/silver/tests/seatAnchor.test.mjs`: 4 ca kiểm khớp 406.B11, 406.B8, ném lỗi khi thiếu standPoint, và ghế 208.B8.
  - `scripts/silver/tests/waypoint.test.mjs`: 2 ca kiểm dẫn đường đa chặng 406.B8 (target vs room door) và chọn cửa thoát gần nhất.
  - `scripts/silver/tests/silverSignal.test.mjs`: 2 ca kiểm ánh xạ bước và kết nối store với theo dõi tham chiếu feedback.
  - `scripts/silver/tests/director.test.mjs`: 5 ca kiểm giữ ghế, play-week-play deduplication, khoảng cách 60 m, cảnh vắng/lạ, và tắt walkMode.

---

## Bảng tiêu chí và kết quả

| Tiêu chí | Cách kiểm | Kết quả |
| --- | --- | --- |
| `stages.json` đủ 32 cảnh, `sceneId` duy nhất, tọa độ hữu hạn | `stages.test.mjs`: kiểm tra 32 phần tử, không trùng ID, tọa độ số thực hữu hạn | Đạt |
| Ràng buộc `sit` và kiểm tra `seatId` có thật trong phòng | `stages.test.mjs`: ném lỗi khi `sit` thiếu roomCode, ném lỗi khi `seatId` sai trong phòng có sẵn; bỏ qua kiểm tra ghế đối với phòng chưa nạp | Đạt |
| `seatAnchor.ts` khớp 406.B11 hiện tại ± 0.1 m | `seatAnchor.test.mjs`: đối chiếu tọa độ ghế, điểm đứng, mắt camera, TV, camera máy với `lessonBridge` | Đạt (sai số tối đa 0.05 m ≤ 0.1 m) |
| Camera máy tính chỉ có ở phòng máy | `seatAnchor.test.mjs`: 406.B11 và 406.B8 có `screenCamera`, phòng lý thuyết không có (`null`) | Đạt |
| StandPoint fallback chỉ áp dụng cho 406.B11 | `seatAnchor.test.mjs`: ném lỗi khi phòng khác thiếu `standPoint` | Đạt |
| Khai báo ghế phòng 208.B8 | `seatAnchor.test.mjs`: ghế (29.44, -217.43), mắt cao 1.55, nhìn giám khảo cao 1.15 | Đạt |
| 406.B8 doorWorld và bounds đúng số liệu | `waypoint.test.mjs`: doorWorld (35.51, -213.61), điểm trong phòng trả về target, u=80 trả về room door | Đạt |
| Rời tòa nhà chọn cửa ra gần nhất | `waypoint.test.mjs`: kiểm tra chọn đúng cửa Bắc / Nam tùy vị trí người chơi | Đạt |
| play → week → play cùng item không begin lại | `director.test.mjs`: chuyển play sang week rồi về play cùng item.id, số lần gọi `begin` giữ nguyên 1 | Đạt |
| Từ week sang item mới cùng ngày: luật 60 m | `director.test.mjs`: < 60 m dùng `teleportTo: 'none'`, >= 60 m dùng `teleportTo: 'arrival'` | Đạt |
| Khóa Activity là `silver:<RunItem.id>` | `director.test.mjs`: kiểm tra `act.id` bắt đầu bằng `silver:session:...` | Đạt |
| Cảnh lạ / phòng vắng: không begin, end activity Silver cũ | `director.test.mjs`: không gọi begin, warn 1 lần, kết thúc activity Silver trước đó | Đạt |
| Tắt `walkMode` trong `week` không gọi `exitRun` | `director.test.mjs`: tắt walkMode khi screen === 'week' không gọi exitRun; tắt trong play gọi exitRun | Đạt |
| `createSilverSignal`: giữ tham chiếu, theo dõi feedback | `silverSignal.test.mjs`: tham chiếu giữ nguyên khi state không đổi, result.id tăng theo feedback mới, revealed không tăng | Đạt |
| Không import scene trong waypoint và director | Kiểm tra import: `src/silverWorld/{waypoint,director,stageContext}.ts` không import từ `src/scene/**` | Đạt |
| Không vi phạm vùng cấm | Kiểm tra file thay đổi: không chạm vào `src/ui/**`, `src/scene/walk/**`, `src/store/useSilverStore.ts`, `src/silver/**`, `src/types/silver*.ts` | Đạt |

---

## Cổng kiểm tra

| Lệnh | Kết quả |
| --- | --- |
| `npm run typecheck` | Đạt (0 lỗi) |
| `npm run lint` | Đạt (0 lỗi) |
| `npm run build` | Đạt (Vite build thành công trong 2.7s) |
| `npm run test:silver` | Đạt (86 ca kiểm thử đạt, bao gồm toàn bộ các bài test mới và kiểm tra số liệu nghiêm ngặt) |
| `npm run check:silver -- --strict` | Đạt (0 lỗi, 6 cảnh báo vi trùng en từ dữ liệu nội dung có sẵn) |

---

## Ghi chú

- Không chạy background process hoặc dev server.
- Không mở thêm tab Orca trình duyệt.
- Mọi thay đổi đều được commit cục bộ trên nhánh `PengWynIsMe/it-silver-3d-05`, không push và không merge.
