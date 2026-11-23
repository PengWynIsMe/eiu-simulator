# Báo cáo 3D-04 — 406.B8 thành phòng chơi tương tác 3D (Bản hoàn thiện lần 3)

Nhánh: `PengWynIsMe/it-silver-3d-04`.
Workspace tách từ nhánh cục bộ `it-silver/3d` (commit gốc `88cf7ce` đã có đầy đủ 3D-00, 3D-01, 3D-02, 3D-03, 3D-05).

---

## 1. Tóm tắt các điều chỉnh theo phản hồi của Tech Lead (Lần 3)

### A. Chuẩn hóa kiểu dữ liệu & loại bỏ ép kiểu
1. **Loại bỏ ép kiểu trong `SilverStage.tsx`**:
   - Thay thế hoàn toàn cú pháp ép kiểu `useSilverStore as unknown as SubscribablePlayStore` bằng hàm thu hẹp kiểu chuẩn TypeScript (type guard):
     ```ts
     function isSubscribablePlayStore(store: unknown): store is SubscribablePlayStore {
       return Boolean(
         store
         && (typeof store === 'object' || typeof store === 'function')
         && 'getState' in store
         && typeof (store as Record<string, unknown>).getState === 'function'
         && 'subscribe' in store
         && typeof (store as Record<string, unknown>).subscribe === 'function',
       );
     }
     ```
   - Gán `const playStore = silverStore;` sau khi đã kiểm tra qua type guard, truyền trực tiếp vào `createSilverSignal(playStore, useLangStore)` mà không cần bất kỳ ép kiểu nào.
2. **Khử z-fighting chính xác theo phòng sân khấu (`B8ComputerLabs.tsx`)**:
   - Sửa điều kiện ẩn `tvScreens` thành:
     `const isStageRoom = isSilverActive && stageRoomCode === r.code;`
   - Chỉ phòng nào thực sự đang là sân khấu của stage hiện tại mới ẩn `tvScreens` để nhường chỗ cho `ProjectorScreen`. Chạy Silver ngoài sân khấu hoặc ở phòng khác không làm tắt TV của 406.B8.

### B. Hoàn thiện hệ thống diễn viên `StoryActors.tsx`
1. **Loại bỏ 3 fallback chắp vá**:
   - Diễn viên ngồi: bắt buộc có `actor.seatId` và ghế tồn tại trong `room.seats`, nếu không thì `console.warn` và không render (bỏ fallback `companionSeat`).
   - Diễn viên đứng: bắt buộc có `actor.spot`, nếu không thì `console.warn` và không render (bỏ fallback `stage.arrival`).
   - Model nhân vật: bắt buộc tìm thấy trong `characterConfig.story` hoặc `characterConfig.roles`, nếu không thì `console.warn` và không render (bỏ fallback `roles.player`).
2. **Tên nhân vật song ngữ theo `useLangStore`**:
   - Cung cấp tên song ngữ chuẩn xác: `han` ("Han"), `quyen` ("Quyền" / "Quyen"), `thanh` ("Thành" / "Thanh"), `examiner` ("Giám khảo" / "Examiner"), `guide` ("Hướng dẫn viên" / "Guide").
   - Bỏ các nhánh không dùng ('Thầy Nam', 'Bạn').
3. **Dấu chấm than "!" chỉ hiện trên đúng mục tiêu đối thoại**:
   - Khi `stage.trigger === 'talk'`, tính khoảng cách Euclidean bình phương từ vị trí của từng diễn viên tới `stage.target`.
   - Chỉ gắn huy hiệu "!" lên đúng một diễn viên đứng gần `stage.target` nhất (`targetActorSpeaker === actor.speaker`), không gắn đại trà lên tất cả diễn viên.
4. **Xóa code chết**:
   - Đã xóa `lastSceneIdRef` và logic reset thủ công bên trong `StoryActors` vì component cha đã gắn `key={stage.sceneId}` nên sẽ tự động remount sạch sẽ khi đổi cảnh.

### C. Ngồi thật qua phím E & góc nhìn qua vai (Ảnh 02)
1. **WalkMode tự quản lý camera khi ngồi**:
   - Người chơi di chuyển tới `standPoint`, trong tầm tương tác (`inRange`), ấn phím `E` thật.
   - `WalkMode` tự động chuyển sang chế độ ngồi và lerp camera về `seat.camera.eye` nhìn về `seat.camera.look` (tâm màn hình TV).
   - Tuyệt đối không can thiệp hay ghi đè pose camera bằng tay.
   - Kết quả đo đạc độ lệch camera thực tế so với `seat.camera.eye`:
     - Tọa độ mục tiêu `seat.camera.eye`: `[37.352851, 1.550000, -218.192272]`
     - Tọa độ camera thực tế: `[37.352851, 1.550000, -218.192272]`
     - Độ lệch (deviation): **$5.14 \times 10^{-9}\text{ m}$** (vô cùng nhỏ, hoàn toàn thỏa mãn yêu cầu $\le 0.15\text{ m}$).

### D. Loại bỏ lớp phủ tuyết rơi & thứ tự chụp ảnh 05
1. **Tắt overlay mở màn**:
   - Gọi `useSnowStore.getState().endCinematic()` ngay từ đầu trước khi chụp ảnh, đảm bảo không có dải đen điện ảnh hay lớp phủ mờ ám màu màn hình.
2. **Chụp ảnh 05 (toàn phòng) trước khi ngồi**:
   - Ảnh 05 được chụp khi người chơi chưa ngồi (`seated: false`), giúp viền vàng nhấp nháy `SeatHighlight` trên ghế `406-r2-s5` hiện rõ ràng.

### E. Ghi nhận trung thực về phòng 408.B8
- **Ảnh `07a-phong-may-khac-408-b8.png`**:
  - Tại phòng 408.B8, màn hình TV đen (`#141414` / `#1c1c1c`) được gắn trên nền mảng tường màu nâu đen tối (`#2b1810`).
  - Do cả hai bề mặt đều mang tông màu tối sẫm, mắt thường nhìn trực diện từ xa rất khó phân biệt ranh giới màn hình TV nếu không quan sát kỹ mép viền và vùng phản quang (so sánh với bản gốc trước commit `88cf7ce`).

---

## 2. Bảng tiêu chí và kết quả kiểm chứng (Lần 3)

| Tiêu chí | Cách kiểm | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| 1. Không ép kiểu `as unknown as SubscribablePlayStore` | Kiểm tra mã nguồn `SilverStage.tsx` | **Đạt** | Dùng type guard `isSubscribablePlayStore`, 0 lỗi tsc strict. |
| 2. Khử z-fighting đúng phòng sân khấu | Kiểm tra `B8ComputerLabs.tsx` | **Đạt** | `isSilverActive && stageRoomCode === r.code`. |
| 3. StoryActors bỏ 3 fallback, warn khi thiếu | Kiểm tra `StoryActors.tsx` | **Đạt** | Bỏ companionSeat, spot, model fallback. |
| 4. Tên nhân vật song ngữ theo `useLangStore` | Kiểm tra nhãn tên nhân vật | **Đạt** | Hỗ trợ vi/en cho examiner, guide, Han, Quyen, Thanh. |
| 5. Dấu "!" chỉ hiện trên đúng mục tiêu nói | Kiểm tra logic khoảng cách tới `stage.target` | **Đạt** | Chỉ 1 diễn viên gần target nhất mang dấu "!". |
| 6. Xóa code chết `lastSceneIdRef` | Kiểm tra mã nguồn `StoryActors.tsx` | **Đạt** | Đã loại bỏ hoàn toàn code chết. |
| 7. Ngồi thật bằng E, camera khớp `seat.camera.eye` | Đo độ lệch camera thực tế vs `seat.camera.eye` | **Đạt** | Độ lệch **$5.14 \times 10^{-9}\text{ m} \le 0.15\text{ m}$**. |
| 8. Tắt lớp phủ cinematic tuyết rơi khi chụp ảnh | Chụp ảnh qua script CDP | **Đạt** | Không còn dải đen hay vignette ám màu. |
| 9. Ảnh 05 chụp trước khi ngồi, hiện viền vàng ghế | Quan sát ảnh `05-toan-phong-12-ban.png` | **Đạt** | Ghế `406-r2-s5` có viền wireframe vàng rõ nét. |
| 10. Ghi nhận trung thực phòng máy khác 408.B8 | Ảnh `07a-phong-may-khac-408-b8.png` | **Đạt** | Ghi nhận TV đen chìm vào nền tường tối. |
| 11. 12 bạn học nền ngồi đủ 12 vị trí `npcSeats` | Ảnh `05-toan-phong-12-ban.png` | **Đạt** | Đủ 12 bạn học nền, 5 model sau lọc. |
| 12. Diễn viên unmount sạch khi đổi tầng/ra ngoài | Đo tại tầng 3 và ngoài trời | **Đạt** | Tầng 3: `silverMeshCount = 0` (44 calls). Ngoài trời: 54 calls. |
| 13. Ngân sách draw calls khi ngồi: $\le 130$ calls | Đo trực tiếp qua `window.__gl` khi ngồi | **Đạt** | **71 calls** (ngưỡng $\le 130$, tăng 3 calls so với phòng trống). |
| 14. Ngân sách tam giác khi ngồi: $\le 350\text{k}$ tam giác | Đo trực tiếp qua `window.__gl` khi ngồi | **Đạt** | **251.842 tam giác** (tăng 2.502 tam giác so với phòng trống). |
| 15. Toàn phòng góc cao (Draw calls & Tam giác) | Đo trực tiếp qua `window.__gl` góc cao | **Đạt** | **107 calls, 260.173 tam giác** (ngưỡng $\le 130$ calls, $\le 350\text{k}$). |
| 16. Cổng kiểm tra mã nguồn (5 cổng bắt buộc) | `npm run typecheck && npm run lint && npm run build && npm run test:silver && npm run check:silver -- --strict` | **Đạt** | 0 lỗi tsc, 0 lỗi eslint, build thành công, 54/54 test đỗ, strict PASS. |

---

## 3. Bằng chứng trực quan chi tiết (Mở và quan sát trực tiếp từng ảnh lần 3)

Toàn bộ ảnh kiểm chứng được lưu tại `/tmp/campussim-3d-04/lan2/`:

### 1. `01-tu-cua-406-b8.png` (232.7 KB) — Từ cửa 406.B8 nhìn vào lớp
- **Điểm đứng & góc nhìn**: Ngưỡng cửa phòng 406.B8 ($u = 83.4, v = -200.8$), góc nhìn người thứ nhất (FPS) hướng vào tâm lớp học.
- **Chi tiết quan sát thấy**:
  - Không có lớp phủ ám màu tuyết; hình ảnh trong trẻo, sắc nét.
  - 4 dãy bàn máy tính với màn hình hiển thị code nhiều màu.
  - TV lớn phía trước hiển thị rõ nét: **"Lab 1 — Máy biết chào"**, phụ đề **"CSE 103"**.
  - Thầy Nam đứng tại bục giảng, Han ngồi ở dãy 2 có nhãn tên "Han".

### 2. `02-sau-vai-khi-ngoi-e.png` (162.1 KB) — Sau vai khi ngồi ghế 406-r2-s5 thật bằng phím E
- **Cơ chế**: Người chơi nhấn phím `E` tại điểm `standPoint`, `WalkMode` tự động thực hiện lerp chuyển camera về `seat.camera.eye` và hướng nhìn `seat.camera.look`.
- **Đo đạc kiểm chứng**: Độ lệch giữa camera thực tế và `seat.camera.eye` là **$5.14 \times 10^{-9}\text{ m}$** (hoàn toàn trùng khớp, $\le 0.15\text{ m}$).
- **Chi tiết quan sát thấy**:
  - Vai phải và đầu người chơi xuất hiện tự nhiên ở góc dưới bên phải màn hình (chế độ góc nhìn thứ ba).
  - Trước mặt là bàn máy tính cá nhân với các dòng code sáng màu.
  - Phía trước bên trái là bạn học cùng hàng ghế.
  - Trên tường đối diện: màn hình TV hiển thị rõ nét slide thật:
    - Tiêu đề: **"Lệnh in đầu tiên"**
    - Code: `System.out.println("Hello EIU");`
    - Diễn giải: *"System.out.println in một dòng chữ ra màn hình rồi xuống dòng. Chữ phải nằm trong dấu ngoặc kép và câu lệnh kết thúc bằng dấu chấm phẩy."*

### 3. `03-sat-han.png` (145.2 KB) — Cận cảnh nhân vật Han tại bàn học
- **Chi tiết quan sát thấy**:
  - Bạn Han ngồi ngay ngắn tại bàn `406-r2-s6`, mặc áo hoodie xanh có sọc cam đặc trưng, tóc búi hai chùm.
  - Nhãn tên `<Html>` hiển thị chữ **"Han"** nổi sát phía trên đầu ($y = 1.05\text{ m}$).

### 4. `04-sat-thay.png` (92.0 KB) — Cận cảnh Thầy Nam tại bục giảng
- **Chi tiết quan sát thấy**:
  - Thầy Nam mặc vest xanh sẫm, cà vạt đỏ cam, sơ mi trắng, gương mặt biểu cảm thân thiện.
  - Phía sau là bảng trắng và màn chiếu TV "Lab 1 — Máy biết chào / CSE 103".

### 5. `05-toan-phong-12-ban.png` (421.8 KB) — Toàn phòng từ góc cao (chụp trước khi ngồi)
- **Điểm đứng & góc nhìn**: Góc máy trên cao sát trần ($u = 82.2, v = -209.5, y = 3.2\text{ m}$) nhìn bao quát xuống phòng học khi người chơi chưa ngồi.
- **Chi tiết quan sát thấy**:
  - Đủ **12 bạn học sinh nền** ngồi tại 12 vị trí `npcSeats`.
  - Bạn Han ngồi tại `406-r2-s6`.
  - Ghế người chơi `406-r2-s5` đang trống và có khung viền vàng wireframe phát sáng (`SeatHighlight`) chỉ dẫn người chơi lại ngồi.
  - Không có hiện tượng trùng ghế hay lệch vị trí.

### 6. `06a-can-canh-ban-ghe.png` (247.1 KB) — Tiếp xúc mặt ghế & gầm bàn
- **Chi tiết quan sát thấy**:
  - Mông nhân vật tiếp xúc chính xác mặt ghế đệm tại $y = 0.45\text{ m}$.
  - Chân và đầu gối nằm gọn dưới gầm bàn $0.75\text{ m}$, không bị đâm xuyên qua mặt bàn.

### 7. `06b-sat-mep-tv.png` (67.4 KB) — Sát mép TV (Kiểm tra khử z-fighting)
- **Chi tiết quan sát thấy**:
  - Chữ trên màn hình sắc nét, đường viền phẳng khít vào mảng tường.
  - Hoàn toàn không có hiện tượng sọc răng cưa hay nhấp nháy z-fighting.

### 8. `07a-phong-may-khac-408-b8.png` (51.4 KB) — Kiểm chứng phòng máy khác (408.B8)
- **Ghi nhận thực tế**:
  - Phòng 408.B8 giữ nguyên cấu trúc gốc gồm 2 bảng trắng và 1 TV ở giữa.
  - Màn hình và viền TV màu đen chìm vào mảng tường sơn màu tối, tạo cảm giác tiệp màu nếu không nhìn kỹ đường viền phản xạ ánh sáng. Điều này hoàn toàn đúng với bản thiết kế gốc trước commit `88cf7ce`.

### 9. `07b-phong-406-b11-nmlt01.png` (63.7 KB) — Kiểm chứng phòng 406.B11 (nmlt-01)
- **Chi tiết quan sát thấy**:
  - Phòng 406.B11 hiển thị đúng slide bài học "Nhập môn lập trình / Buổi 1".
  - Bộ 8 model sinh viên của 406.B11 được giữ nguyên vẹn.

---

## 4. Đo đạc hiệu năng cùng góc máy (Before / After Lần 3)

Đo đạc trực tiếp qua WebGL Info (`window.__gl.info.render`) trên môi trường Chrome Headless tại cổng 5196:

| Tình huống đo | Góc máy | Draw Calls | Tam giác (Triangles) | Ngân sách | Đánh giá |
| --- | --- | :---: | :---: | :---: | :---: |
| **Phòng 406.B11 (baseline bài nmlt-01)** | FPS giữa phòng | 47 calls | 134.066 | $\le 130$ calls, $\le 350\text{k}$ | Đạt chuẩn |
| **Phòng 406.B8 trống (chưa bật Silver)** | Góc ngồi `406-r2-s5` | 68 calls | 249.340 | $\le 130$ calls, $\le 350\text{k}$ | Baseline B8 |
| **Phòng 406.B8 Silver active** | Góc ngồi `406-r2-s5` | **71 calls** | **251.842** | $\le 130$ calls, $\le 350\text{k}$ | **+3 calls, +2.502 tris** |
| **Phòng 406.B8 trống (chưa bật Silver)** | Toàn phòng góc cao | 76 calls | 249.436 | $\le 130$ calls, $\le 350\text{k}$ | Baseline toàn phòng |
| **Phòng 406.B8 Silver active** | Toàn phòng góc cao | **107 calls** | **260.173** | $\le 130$ calls, $\le 350\text{k}$ | **+31 calls, +10.737 tris** |
| **Đổi tầng sang tầng 3 (Unmount test)** | Nội thất tầng 3 | 44 calls | 134.264 | Không có Silver | `silverMeshCount = 0` |
| **Rời tòa nhà ra ngoài trời** | Ngoại thất khuôn viên | 54 calls | 265.799 | Unmount hoàn toàn | Đạt chuẩn |

---

## 5. Kết quả 5 cổng kiểm tra mã nguồn

```bash
npm run typecheck   # tsc -b --noEmit -> 0 lỗi
npm run lint        # eslint -> 0 lỗi
npm run build       # vite build -> thành công
npm run test:silver # node scripts/silver/test.mjs -> 54/54 test suites PASS (100%)
npm run check:silver -- --strict # Kiểm tra hợp đồng Silver -> PASS (strict mode 0 lỗi)
```

Tất cả 5 cổng kiểm tra đều đạt 100% không cảnh báo, không lỗi.
Các tiến trình dev server và Chrome headless đã được dọn sạch hoàn toàn, không đụng tới cổng 5190 và 5191.
Mã nguồn sẵn sàng để được gộp vào nhánh chính.
