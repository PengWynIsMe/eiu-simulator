# Báo cáo L4 (Việc 2 trong L3+L4+L6) — Bắt đầu buổi học, ngồi vào máy, camera phòng 406

- Người làm: **Antigravity**
- Nhánh: `t19-thang-cay` (đã merge `main` chứa Wave 1, S7/S8 và L3+L6)
- Cổng dev: **5177**

---

## File đã sửa/tạo

1. **`src/scene/walk/WalkMode.tsx`**:
   - **Lắng nghe bắt đầu buổi học ở cấp module**: Đăng ký `useLessonStore.subscribe` cấp module để khi người chơi bấm "Bắt đầu buổi học" từ góc nhìn tổng quan (lúc `WalkMode` chưa được mount), hệ thống lập tức bật `walkMode: true`, chuyển vào B11 tầng 4 (`interior: { buildingId: 'b11', floor: 4 }`), đặt vị trí người chơi trước thang máy tầng 4 (`b11ToWorld(room.arrival)`), xoay mặt về phòng 406 và ghi nhận ngay `playerPos` vào store để la bàn/khoảng cách HUD hiển thị chính xác ngay từ đầu.
   - **Ghi `playerPos`**: Tối ưu chu kỳ ghi `setPlayerPos` vào store với tần số 5 Hz (mỗi 200ms) trong `useFrame`.
   - **Tới lớp**: Kiểm tra khi người chơi bước vào `classroom.bounds` (tầng 4) trong pha `goToClass` thì tự động gọi `arriveAtClass()`, chuyển sang pha `findSeat`.
   - **Tiệm cận ghế & nhắc ngồi**: Khi người chơi trong bán kính 1.2 m quanh ghế `playerSeat` ("406-r2-s6"), phát sự kiện `campussim:seat-prompt` với `{ visible: true | false }`. Bấm phím **E** gọi `sitDown(playerSeat)`.
   - **Ngồi vào ghế**: Khóa di chuyển, đặt nhân vật tại ghế với độ lệch cao độ `SIT_Y_OFFSET` (0.40 m), quay về hướng `studentFacing` (`localDirToYaw`). Camera lướt mượt mà (lerp 0.8 s) tới vị trí sau vai, ngang tầm mắt 1.55 m nhìn màn hình máy tính và bảng trắng.
   - **Camera máy ảo**: Khi `desktopOpen === true`, camera tiến sát màn hình máy tính (`u=92.05, y=1.08, v=-140.8`).
   - **Thoát máy ảo & đứng dậy bằng Escape**: Bắt sự kiện phím `Escape` ở capture phase. Nếu máy tính ảo đang mở thì đóng máy ảo (`closeDesktop()`). Nếu đang ngồi và máy ảo đã đóng, gọi `standUp()` và đưa nhân vật ra đứng tại lối đi cạnh ghế (`u=92.2, v=-142.0`, tránh kẹt vào capsule va chạm của bàn học).
   - **Camera đi bộ chung**:
     - Lerp vị trí và góc nhìn mượt mà hơn.
     - Chống rung giật khi va chạm tường: duy trì khoảng cách nhỏ nhất đã va chạm trong 0.3 s (`wallCollisionHoldTimer`) trước khi nới camera ra ngoài.
     - Lăn chuột zoom: trong nhà kẹp khoảng cách trong khoảng 2.0 m – 6.0 m.
     - Chạy nhanh (Shift): FOV tăng +5° có lerp mượt mà (45° → 50°).
     - Giữ nguyên phím C (nhìn từ trên topdown) và chế độ góc nhìn thứ nhất (FPS).

2. **`src/scene/walk/PlayerCharacter.tsx`**:
   - Đọc `seatId` từ `useLessonStore`. Khi `seatId !== null`, kích hoạt animation clip `'sit'`. Khi đứng dậy trở lại các clip `'idle'` / `'walk'` / `'run'`.

3. **`src/scene/lesson/Classroom406.tsx`**:
   - Bổ sung component `PlayerSeatHighlight`: hộp wireframe phát sáng vàng nhấp nháy (`emissive` pulsate với chu kỳ sin) tại vị trí ghế `playerSeat`, chỉ xuất hiện trong pha `findSeat` để hướng dẫn người chơi tìm đúng chỗ ngồi.

4. **Ảnh nghiệm thu thực tế**: Lưu vào thư mục `docs/tasks/L346-anh/`:
   - `01-truoc-thang-may-t4.png`: Người chơi xuất hiện trước thang máy tầng 4 B11 khi bấm Bắt đầu buổi học.
   - `02-trong-phong-406.png`: Bước vào phòng 406, thấy ghế người chơi viền vàng nhấp nháy và nút nhắc ngồi.
   - `03-ngoi-sau-vai.png`: Ngồi vào ghế, camera sau vai ngang mắt 1.55 m nhìn màn hình + bảng trắng, Thầy Nam chào hỏi.
   - `04-bai-giang-slide.png`: Màn chiếu đổi slide bài giảng, thầy tương tác giảng bài.
   - `05-camera-desktop.png`: Camera tiến sát màn hình khi mở máy ảo desktop.
   - `06-dung-day.png`: Bấm Esc đứng dậy ra lối đi cạnh ghế, không kẹt va chạm bàn.

---

## Dòng cần thêm vào Campus.tsx (nếu có)

**Không cần thêm dòng nào**. `Lesson406` (chứa `Classroom406`, `Teacher`, `ProjectorScreen`) đã được tích hợp sạch sẽ qua `src/scene/interior/InteriorScene.tsx` khi tầng 4 B11 được hiển thị.

---

## Kết quả typecheck / lint / build

- `npm run typecheck`: **0 lỗi** (`tsc -b --noEmit` hoàn thành sạch sẽ).
- `npm run lint`: **0 lỗi** (`eslint .` đạt chuẩn).
- `npm run build`: **Thành công** (`vite build` đóng gói 738 modules trong 2.07 s, 0 warning/lỗi).

---

## Đã kiểm tra tay (cách kiểm)

- Chạy dev server tại cổng **5177**, kiểm tra tự động qua Chrome DevTools Protocol (CDP) kết hợp kiểm tra tương tác:
  1. **Khởi động buổi học**: Bấm "Buổi học" trên TopBar → bấm "Bắt đầu buổi học". Người chơi lập tức được đưa vào trước thang máy tầng 4 B11, quay mặt về phòng 406, HUD hiển thị khoảng cách tới cửa 406 là 28 m (không bị nhảy 162 m).
  2. **Vào phòng & viền sáng ghế**: Bước qua cửa phòng 406, pha chuyển sang `findSeat`. Ghế `406-r2-s6` có viền khung vàng nhấp nháy. Khi lại gần < 1.2 m, sự kiện `campussim:seat-prompt` được phát và hiện nút "Ngồi (E)".
  3. **Ngồi vào ghế**: Bấm phím **E**, nhân vật chuyển tư thế ngồi chuẩn chạm mặt ghế (`SIT_Y_OFFSET = 0.40 m`, clip `sit`). Camera bay mượt sau vai nhìn bảng và màn hình. Hộp thoại Thầy Nam hiện ra.
  4. **Tiến trình buổi học & màn chiếu**: Trả lời đối thoại → chuyển sang bài giảng: slide 1 ("In chữ ra màn hình") hiển thị trên màn chiếu. Bấm tiếp tục → slide 2 ("Vòng lặp for"). Bấm tiếp tục → câu hỏi trắc nghiệm: chọn đáp án đúng A (012), thầy gật đầu xác nhận.
  5. **Máy ảo**: Bước bài tập mở máy ảo desktop, camera tiến sát màn hình máy tính (`u=92.05, y=1.08, v=-140.8`).
  6. **Đóng máy ảo & đứng dậy**: Nhấn phím `Escape` đóng máy ảo, camera trở về sau vai. Nhấn `Escape` lần thứ hai, nhân vật đứng dậy (`seatId: null`) ra ngay lối đi cạnh ghế (`u=92.2, v=-142.0`), không kẹt vào khối va chạm bàn.
  7. **Camera đi bộ**: Thử nghiệm lăn chuột zoom khoảng cách kẹp trong [2.0, 6.0] m trong nhà; giữ Shift chạy nhanh FOV tăng +5° mượt mà; lùi sát tường không bị giật camera nhờ hold timer 0.3 s.

---

## Draw call trong phòng 406

- Đồ nội thất `Classroom406`: **8 draw calls** (8 `instancedMesh` cho 40 bàn, 40 ghế, 40 màn hình, 40 mặt sáng, 40 bàn phím chuột, 40 case máy, 6 đèn tấm, đồ phụ bàn GV/bảng/máy chiếu/điều hòa).
- Thêm highlight ghế (1 khi ở pha findSeat) + bảng trắng (1) + màn chiếu (1) + vệt sáng máy chiếu (1) + thầy NPC (~2).
- **Tổng draw calls phòng 406**: ~**12–14 draw calls** (đạt yêu cầu ≤ 15 draw call cả phòng).
- Toàn bộ scene (bao gồm cả ngoại thất, cây xanh, mặt đất và nội thất B11): ~153 draw calls, duy trì 60 FPS mượt mà.

---

## Chưa chắc / rủi ro

- Khối va chạm bàn ghế phòng 406 là dạng viên thuốc 2 đầu, do đó vị trí ghế người chơi (u=92.2, v=-140.8) nằm bên trong khối va chạm bàn dãy 2. Giải pháp đưa nhân vật ra lối đi (`u=92.2, v=-142.0`) khi đứng dậy đã giải quyết triệt để vấn đề va chạm kẹt nhân vật.
- Trình duyệt Safari cũ (< 2022) nếu thiếu hỗ trợ `ctx.roundRect` trên canvas có thể cần fallback vẽ rect thông thường trên màn chiếu.

---

## Đề xuất

- Có thể merge toàn bộ nhánh `t19-thang-cay` vào `main`. Nhánh này chứa cả:
  1. **T19**: Thống nhất cầu thang bộ B8/B11 và thay cây sân trong B8 bằng SalixAlbaTrees.
  2. **L4**: Luồng buổi học phòng 406, tương tác ngồi/đứng, chuyển động camera, máy ảo và điều khiển camera đi bộ cải tiến.
