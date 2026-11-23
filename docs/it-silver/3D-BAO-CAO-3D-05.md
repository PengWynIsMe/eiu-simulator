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
- `bd05fd3`: 3D-05: bắt buộc walk và toWorld trong DirectorDeps và báo lỗi rõ khi sit thiếu ghế
- `3f6e3cf`: 3D-05: khôi phục test tiếp tục 207.B8 và cảnh lạ, thêm test giữ activity lesson và kiểm ghế sit

## Chi tiết các sửa đổi theo phản hồi điều phối

### 1. Bắt buộc walk và toWorld, báo lỗi rõ khi sit thiếu ghế
- **Hợp đồng `DirectorDeps`**:
  ```ts
  export interface DirectorDeps {
    silver: SubscribableSilverStore;
    activity: SubscribableActivityStore;
    walk: SubscribableWalkStore;                                    // BẮT BUỘC
    toWorld: (frame: 'b11' | 'b8', u: number, v: number) => Vec2;  // BẮT BUỘC
    getClassroom?: (code: string) => Classroom | undefined;
  }
  ```
  - `walk` và `toWorld` là hai tham số bắt buộc khi gọi `startDirector({ silver, activity, walk, toWorld, getClassroom })`.
  - Nhờ đó, đạo diễn luôn có quyền truy cập `walk.getState()` để tính toán luật khoảng cách 60 m (`teleportTo = 'none'`), luôn có `toWorld` để dựng ghế cho cảnh ngồi (`trigger: 'sit'`), và luôn lắng nghe `walk.subscribe` để tự động kích hoạt `exitRun()` khi người chơi tắt `walkMode` giữa lúc chơi 3D.
- **Hợp đồng `StageContextOptions` và xử lý cảnh ngồi thiếu ghế**:
  - `toWorld` trong `StageContextOptions` là bắt buộc, loại bỏ hoàn toàn nhánh kiểm tra điều kiện `&& opts?.toWorld`.
  - Khi cảnh có `trigger === 'sit'`, nếu `resolveSeatAnchor` không dựng được ghế (do phòng chưa có hoặc thiếu danh sách ghế), hệ thống ném ngoại lệ rõ ràng:
    `throw new Error('[StageContext] Không dựng được ghế cho cảnh sit: <sceneId> (phòng: <roomCode>)')`.
    Tuyệt đối không để `seat = null` âm thầm khiến người chơi bấm E đi thẳng vào trạng thái tương tác mà không ngồi vào ghế.

### 2. Khôi phục và mở rộng bộ kiểm thử đạo diễn (`director.test.mjs`)
Đã khôi phục đầy đủ 2 ca kiểm thử từ spec gốc và bổ sung các ca kiểm thử theo yêu cầu mới:
1. **Tiếp tục `CSE 103/a` từ Home**:
   - Khởi tạo từ `screen === 'home'`, chuyển vào `screen === 'play'` với item `CSE 103/a` (phòng 207.B8, tầng 2 B8).
   - Kiểm tra `teleportTo === 'arrival'` tại đúng cửa phòng 207.B8: tọa độ `[39.22, -192.81]`.
   - Khóa activity tạo đúng chuẩn hợp đồng: `silver:<RunItem.id>` (`silver:session:cse-103:theoryA:1`).
   - Kiểm tra ghế `activity.seat !== null`, đúng phòng 207.B8 tầng 2.
2. **Cảnh lạ hoàn toàn (sceneId không có trong `stages.json`)**:
   - Với scene lạ không khai báo trong stages (vd `nonexistent/scene-999`), kiểm tra không gọi `begin()`, ghi log `console.warn` đúng 1 lần duy nhất, không phát cảnh báo lặp lại ở các bước sau.
3. **Cảnh lạ/vắng KHÔNG kết thúc activity nguồn lesson**:
   - Nếu đang có một activity nguồn bài học (`source === 'lesson'`), khi kích hoạt cảnh lạ hoặc phòng vắng, đạo diễn không gọi `activity.end()`, giữ nguyên vẹn activity bài học đang diễn ra.
4. **Kiểm tra `activity.seat` khác null cho tất cả cảnh sit**:
   - Toàn bộ các cảnh có `trigger === 'sit'` (Lab 1, Lab 2, CSE 103/a, MATH 112 A) đều được kiểm thử xác nhận `activity.seat !== null`.
5. **Kiểm tra ném lỗi khi sit thiếu ghế**:
   - Kiểm thử `createStageActivity` ném lỗi rõ ràng khi gặp cảnh sit thiếu ghế hoặc phòng không tồn tại.

### A. waypoint.ts — Chuẩn hóa số liệu và loại bỏ chép cứng
1. **Số liệu 406.B8 theo classrooms.json**:
   - `doorWorld`: `[35.51, -213.61]` (mét thế giới thực).
   - `bounds`: `u: 81.9..91.3, v: -210.15..-200.05`.
   - Test đã kiểm tra: điểm thật trong 406.B8 (`u=86.6, v=-205.1`) trả về `target`; điểm ở phòng bên cạnh cùng tầng (`u=80`, ngoài bounds) trả về `room` với cửa tại `[35.51, -213.61]`.
2. **Dựng danh sách phòng động từ Classroom**:
   - Hàm `createRoomWaypoint(room: Classroom, toLocal)` trích xuất `doorWorld`, `bounds`, `floor`, `frame` trực tiếp từ dữ liệu phòng.
   - `waypoint.ts` hoàn toàn không import `src/scene/**`.
3. **Loại bỏ bản chép cứng cửa / thang máy / EX / EV**:
   - Bố cục và hàm chuyển tọa độ `toWorld` nhận từ caller / export layouts.
   - Khi người chơi rời tòa nhà, hệ thống tính khoảng cách Euclid và chọn cửa ra gần nhất trong danh sách cửa thoát hiểm (`exits`).

### B. director.ts & stageContext.ts — Khóa Activity, tuần và cảnh vắng
1. **Chuyển tiếp giữa `play` và `week`**:
   - Chuyển `play → week → play` cùng `item.id`: không gọi lại `activity.begin()`.
   - Chuyển từ `week` sang item mới cùng ngày (< 60 m): `teleportTo = 'none'`; xa >= 60 m hoặc khác ngày: `teleportTo = 'arrival'`.
2. **Xử lý phòng chưa có trong classrooms.json (cảnh vắng / lạ)**:
   - Dùng `isStageAvailable(stage, getClassroom)`. Nếu phòng chưa có hoặc cảnh lạ: không gọi `begin()`, warn đúng 1 lần mỗi `sceneId`.
   - Nếu có activity Silver cũ thì gọi `end()`. Tuyệt đối không gọi `end()` nếu activity hiện tại có nguồn `source === 'lesson'`.
3. **Khóa Activity theo hợp đồng**:
   - Chuẩn hóa thành `silver:<RunItem.id>`.
4. **Hành vi `walkMode` khi ở `screen === 'week'`**:
   - Tắt `walkMode` trong `week` không gọi `exitRun()`. Chỉ tắt trong `play` mới gọi `exitRun()`.

### C. silverSignal.ts — Theo dõi tham chiếu feedback và kết nối Store
1. **Hàm thuần `toClassSignal`**:
   - Chuyển đổi thuần túy từ `PlayView` sang `ClassSignal`.
2. **Bộ tạo `createSilverSignal` kết nối Store**:
   - Đảm bảo tính ổn định tham chiếu (referential stability).
   - `result.id` chỉ tăng khi có tham chiếu `feedback` mới từ store. Nếu `revealed === true`, `result.id` không tăng.
   - Cập nhật ngôn ngữ tức thời khi `langStore` thay đổi.

### D. seatAnchor.ts — Tách biệt phòng máy và xử lý ngoại lệ
1. **Phân biệt phòng máy tính và chuẩn hóa fallback**:
   - Nhận diện phòng máy tính dựa trên tập mã phòng máy hoặc từ khóa tên phòng (`máy tính`, `thực hành`).
   - Điểm đứng `standPoint` fallback `{ u: 91.8, v: -142.0 }` chỉ áp dụng duy nhất cho phòng `406.B11`. Các phòng khác thiếu `standPoint` ném lỗi rõ ràng.
2. **Khai báo ghế 208.B8**:
   - Nhận hàm `toWorld` được truyền từ caller, không chép cứng ma trận biến đổi tọa độ.

---

## File đã tạo và sửa

- `src/data/silver/stages.json`: Chép từ `docs/it-silver/data/stages.json`, đủ 32 cảnh.
- `src/data/silver/stages.ts`: Nạp và kiểm tra 32 cảnh.
- `src/silverWorld/seatAnchor.ts`: Chuyển đổi `Classroom` sang `SeatAnchor`, mắt 1.55, TV 1.35; `screenCamera` cho phòng máy; fallback standPoint chỉ cho 406.B11; khai báo riêng ghế cho 208.B8.
- `src/silverWorld/stageContext.ts`: Tạo `Activity` cho `useActivityStore` (key `silver:<RunItem.id>`, prompt song ngữ E, ghế từ `seatAnchor`, bắt buộc `toWorld`, ném lỗi rõ khi sit thiếu ghế).
- `src/silverWorld/director.ts`: `startDirector` kết nối `silver`, `activity`, `walk`, `toWorld`:
  - `walk` và `toWorld` bắt buộc trong `DirectorDeps`.
  - `screen === 'play'`: không `begin` lại nếu cùng `item.id`.
  - Cảnh lạ / phòng vắng: không `begin`, warn 1 lần, kết thúc activity Silver cũ (không kết thúc activity lesson).
  - `teleportTo='none'` khi giữ ghế hoặc cùng ngày < 60 m; `'arrival'` khi sang ngày khác, vào chương hoặc xa >= 60 m.
  - Kết thúc khi về `closed|home`; tắt `walkMode` trong `play` gọi `exitRun()`; tắt `walkMode` trong `week` không thoát lượt.
- `src/silverWorld/waypoint.ts`: `nextWaypoint` dẫn đường đa chặng; tính toán phòng động từ `Classroom`; chọn cửa ra gần nhất khi rời tòa nhà; không import scene.
- `src/silverWorld/silverSignal.ts`: `toClassSignal` và `createSilverSignal` kết nối store, giữ tham chiếu ổn định, tăng `result.id` theo feedback mới.
- Test:
  - `scripts/silver/tests/stages.test.mjs`: 2 ca kiểm.
  - `scripts/silver/tests/seatAnchor.test.mjs`: 4 ca kiểm.
  - `scripts/silver/tests/waypoint.test.mjs`: 2 ca kiểm.
  - `scripts/silver/tests/silverSignal.test.mjs`: 2 ca kiểm.
  - `scripts/silver/tests/director.test.mjs`: 9 ca kiểm đầy đủ tất cả tình huống theo spec.

---

## Bảng tiêu chí và kết quả

| Tiêu chí | Cách kiểm | Kết quả |
| --- | --- | --- |
| `walk` và `toWorld` bắt buộc trong `DirectorDeps` | TypeScript compiler + kiểm tra định nghĩa interface | Đạt |
| Cảnh sit không dựng được ghế ném lỗi rõ | `director.test.mjs`: kiểm tra `createStageActivity` ném lỗi khi sit thiếu ghế | Đạt |
| Tiếp tục CSE 103/a từ Home teleport cửa 207.B8 | `director.test.mjs`: kiểm tra teleport arrival 207.B8 (39.22, -192.81), key `silver:<RunItem.id>`, `seat !== null` | Đạt |
| Cảnh lạ ngoài stages.json không begin, warn 1 lần | `director.test.mjs`: kiểm tra `beginCalls.length === 0` và warn đúng 1 lần | Đạt |
| Cảnh lạ/vắng không kết thúc activity nguồn lesson | `director.test.mjs`: kiểm tra activity lesson giữ nguyên khi cảnh lạ xảy ra | Đạt |
| Tất cả cảnh sit kiểm tra `activity.seat !== null` | `director.test.mjs`: kiểm tra seat tồn tại trên các cảnh lab-1, lab-2, 103/a, math-112 | Đạt |
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
| `npm run build` | Đạt (Vite build thành công trong 2.3s) |
| `npm run test:silver` | Đạt (90 ca kiểm thử đạt 100%) |
| `npm run check:silver -- --strict` | Đạt (0 lỗi, 6 cảnh báo vi trùng en từ dữ liệu nội dung có sẵn) |

---

## Ghi chú

- Không chạy background process hoặc dev server.
- Không mở thêm tab Orca trình duyệt.
- Mọi thay đổi đều được commit cục bộ trên nhánh `PengWynIsMe/it-silver-3d-05`, không push và không merge.
