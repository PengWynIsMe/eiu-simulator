# BÁO CÁO SỬA CAMERA, PHÒNG HỌC 206, WEBGL VÀ KIỂM THỬ THỰC NGHIỆM

- **Nhánh:** `it-silver-kiem-phu` (commit gốc `ac48f6f`)
- **Người thực hiện:** Antigravity (Thợ code 3D & UI)
- **Cổng thử nghiệm:** `http://localhost:5199` (`npm run preview -- --port 5199 --strictPort`)
- **Thư mục ảnh:** `docs/it-silver/anh-3d/camera/` (gồm 12 ảnh, tất cả đều ≤ 128 KB, tổng dung lượng nhẹ, đúng thực tế quan sát).

---

## 1. Ngồi học: Ẩn thân người chơi ở mọi góc nhìn (WalkMode.tsx)

### Hiện trạng trước sửa
- Khi ngồi vào ghế học ở 406.B8 (Lab 1) và 206.B8 (Phần nghe), camera đặt tại vị trí mắt/màn hình thì khối lưng/đầu của nhân vật người chơi (`PlayerCharacter`) che kín nửa dưới màn hình.
- Ở góc nhìn thứ nhất (FPS) hoặc góc nhìn sau vai, người chơi bị chính avatar của mình chắn tầm nhìn.

### Sửa đổi thực tế
- File `src/scene/walk/WalkMode.tsx`:
  - Dòng 676: Khi `seat` có giá trị (`if (seat)`), ép `body.current.visible = false` ở mọi góc nhìn để ẩn hoàn toàn thân người chơi khi ngồi vào bất kỳ ghế nào.
  - Dòng 800: Khi đứng dậy (`seat = null`), phục hồi `body.current.visible = viewMode.current !== 1` (góc nhìn FPS thì ẩn, góc nhìn sau vai/trên xuống thì hiện lại).
  - Không thay đổi `src/scene/walk/seatAnchor.ts`. Giữ nguyên vẹn cấu trúc và logic bài học `nmlt-01` (406.B11).
- **Commit:** `b201cf6` - `fix(walk): an than nguoi choi khi ngoi hoc o moi goc nhin`.

### Kết quả kiểm tra
- Tại 406.B8 (Lab 1) khi ngồi: Màn hình máy tính và không gian phòng lab hoàn toàn thông thoáng, không còn khối đen che chắn.
  - Ảnh minh chứng sau vai: `08-406-b8-seated-fixed.jpg` (44 KB).
  - Ảnh minh chứng FPS: `08b-406-b8-seated-fps.jpg` (44 KB).
- Tại 206.B8 khi đứng dậy (bấm Esc): Nhân vật người chơi hiện lại đầy đủ ngay lập tức ở góc nhìn thứ ba.
  - Ảnh minh chứng: `09c-206-b8-stand-up-body-visible.jpg` (90 KB).

---

## 2. Phòng học 206.B8: Ghế trước mặt người chơi không che TV (classrooms.json)

### Hiện trạng trước sửa
- Người chơi ngồi tại ghế `206-r2-s4` (hàng 2, ghế 4). Ngay trước mặt ở hàng 1 là ghế `206-r1-s4` có một NPC ngồi học.
- Đầu của NPC này che khuất trực tiếp màn hình TV treo tường phía trước khi xem bài giảng hoặc góc nhìn FPS.

### Sửa đổi thực tế
- File `src/data/classrooms.json`:
  - Thay đổi ghế trong danh sách `npcSeats` của phòng `206.B8`: chuyển ghế NPC từ `206-r1-s4` (ngay trước mặt người chơi) sang `206-r1-s2` (sát vách bên trái phòng học).
  - Giữ nguyên số lượng `npcSeats.length = 12` để đảm bảo tương thích 100% với toàn bộ test suite (`classrooms-b8.test.mjs` pass 12/12 ghế).
- **Commit:** `8d28692` - `fix(classrooms): chuyen npc tu ghe 206-r1-s4 sang 206-r1-s2 phong 206.B8`.

### Kết quả kiểm tra
- Người chơi ngồi tại `206-r2-s4`, ghế `206-r1-s4` phía trước hoàn toàn trống.
- Màn hình TV trên tường phía trước hoàn toàn không bị che khuất bởi đầu NPC ở cả hai góc nhìn (sau vai và FPS).
  - Ảnh minh chứng góc nhìn ngồi: `09-206-b8-seated-clear.jpg` (40 KB).
  - Ảnh minh chứng góc nhìn FPS: `09-206-b8-fps-clear-tv.jpg` (40 KB).

---

## 3. Camera đối thoại ngoài trời (meet-thanh, result, after, club)

### Hiện trạng trước sửa
- Khi bắt đầu đối thoại ngoài trời (`focused` có giá trị), camera đứng xa và cao (`py + 2.4m`, cự ly > 4.5m), bị hệ mái hiên đón (canopy) của B8 che khuất toàn bộ tầm nhìn xuống nhân vật Thành và người chơi.

### Sửa đổi thực tế
- File `src/scene/walk/WalkMode.tsx` (dòng 691–709):
  - Khi có đối thoại `focused`:
    - Cự ly camera đặt tại vị trí Two-shot gần: `cx = px - fx * 2.0 + rx * 1.2`, `cz = pz - fz * 2.0 + rz * 1.2` (cự ly thực tế ~2.33m).
    - Cao độ mắt người: `cy = py + 1.7m` (thấp hơn mép dưới mái che 3.04m tới 1.34m, hoàn toàn nằm dưới mái).
    - Điểm nhìn `lookAt`: hướng vào trọng tâm cuộc trò chuyện giữa người chơi và nhân vật (`lx = px * 0.3 + x * 0.7`, `lz = pz * 0.3 + z * 0.7`, `ly = py + 1.4m`).
    - Dùng `camera.position.lerp(targetCamPos.current, 0.1)` và `currentLookAt.current.lerp(targetLookAt.current, 0.1)` để chuyển camera mượt mà.
  - Khi thoát đối thoại (`focused = null`): Camera tự động lerp trả về góc nhìn ngoài trời bình thường.
  - Giữ nguyên vị trí của Thành (`x: 17.91, z: -164.85`), không dời vị trí nhân vật.
- **Commit:** `367f168` - `fix(walk): camera doi thoai focused lai gan 3m cao mat 1.7m khong bi mai che`.

### Kết quả kiểm tra 4 cảnh đối thoại
1. **`entrance/meet-thanh` (Gặp Thành ở sân trước B8):**
   - Camera cận cảnh ~2.3m, cao 1.7m, thấy rõ cả Thành và người chơi trong khung hình, không bị mái hiên che.
   - Ảnh minh chứng: `01-meet-thanh-after.jpg` (125 KB).
2. **`entrance/result` (Bảng kết quả thi tiếng Anh ngoài trời):**
   - Camera nhìn thấy Thành, Quyền, người chơi và bảng kết quả dán trước B8, góc nhìn thông thoáng.
   - Ảnh minh chứng: `02-result-after.jpg` (45 KB).
3. **`1.1/after` (Giờ nghỉ sau buổi thi — Gặp Han ở hành lang tầng 2 B8):**
   - Camera bố trí ngang tầm mắt, thấy rõ Han và người chơi nói chuyện ở hành lang, không bị trần/dầm che.
   - Ảnh minh chứng: `03-after-han-corridor.jpg` (77 KB).
4. **`2.2/club` (Ngày đầu kỳ — Sảnh giữa tầng 1 B8):**
   - Camera quay cận Thành, Quyền và người chơi ở sảnh trệt, bố cục rõ ràng, camera chuyển mượt khi thoát.
   - Ảnh minh chứng: `04-club-hall-after.jpg` (59 KB).

---

## 4. Xử lý mất ngữ cảnh WebGL và ErrorBoundary quanh Canvas

### Hiện trạng trước sửa
- Khi GPU mất context (`webglcontextlost`), nếu không gọi `event.preventDefault()`, WebGL sẽ bị hủy vĩnh viễn và không bao giờ kích hoạt `webglcontextrestored`.
- Nếu `sessionStorage` bị chặn (chế độ ẩn danh, iframe bảo mật), `sessionStorage.getItem` / `setItem` ném ngoại lệ làm sập ứng dụng.
- Khi WebGL không khởi tạo được hoặc crash, `<Canvas>` làm trắng toàn bộ trang web kể cả lớp giao diện 2D.

### Sửa đổi thực tế
- File `src/ui/silver/presentation.ts`:
  - Thêm `e.preventDefault()` trong listener sự kiện `webglcontextlost` trên canvas và `window`.
  - Lắng nghe sự kiện `webglcontextrestored`: cập nhật `webglLost = false` và gọi `notify()` để tự động kích hoạt render lại 3D.
- File `src/App.tsx`:
  - Bọc khối `try/catch` an toàn cho các lệnh truy cập `sessionStorage`.
  - Thêm class `WebglErrorBoundary` bọc quanh component `<Canvas shadows ...>`. Khi WebGL gặp lỗi nghiêm trọng, ErrorBoundary bắt lỗi và hiển thị thông báo song ngữ (VI/EN) trang nhã, không làm sập ứng dụng và giữ nguyên toàn bộ giao diện 2D, TopBar và các lớp chức năng khác.
- **Commit:** `346f44b` - `fix(app): preventDefault webglcontextlost va WebglErrorBoundary quanh Canvas`.

---

## 5. Kiểm nghiệm nghi vấn 2.2 Lab 2: Bài "Khai báo biến" nhập String

### Quy trình kiểm thử
- Môi trường: Bản build production chạy trên `npm run preview -- --port 5199 --strictPort`.
- Thao tác: Vào chương trình Năm 2 · Kỳ 2, mở bài tập "Khai báo biến", nhập đoạn code có từ khóa `String` sai cú pháp/kiểu và nhấn nút "Chạy" (Compile).
- Thực hiện lặp lại: **5 lần liên tiếp**.

### Kết quả đo đạc
- **Tab hoàn toàn KHÔNG TREO** trong cả 5 lần thử nghiệm.
- Trình biên dịch giả lập trong game phản hồi ổn định sau khoảng **550ms** (mô phỏng thời gian build), hiển thị chính xác bảng thông báo lỗi biên dịch mẫu (`cannot find symbol`) kèm giải thích gợi ý sửa lỗi.
- Giao diện nút bấm và trình soạn thảo vẫn nhận tương tác gõ phím bình thường, không gây rò rỉ bộ nhớ hay blocking main thread.
- Ảnh minh chứng: `05-lab2-string-test.jpg` (65 KB).

---

## 6. Đo đạc kích thước giao diện Thư viện B4 trên màn 360×780 thật

### Phương pháp đo đạc
- Sử dụng lệnh chuẩn CDP của Orca Browser: `orca viewport --width 360 --height 780 --mobile --page <id>`.
- Đo đạc chính xác tọa độ bounding box (`getBoundingClientRect()`) của các phần tử cố định trên màn hình:
  - Thanh chọn tầng (`floorBar`): `top: 570px`, `bottom: 604px`, `height: 34px`.
  - Nút "Thoát đi bộ" (`exitBtn`): `top: 704px`, `bottom: 752px`, `height: 48px`.
  - Bản đồ mini (`minimap`): `left: 272px`, `right: 344px`, `top: 60px`, `bottom: 132px`, `width: 72px`.
  - Menu sidebar khi mở (`sidebar`): `left: 72px`, `right: 330px`, `width: 258px`.

### Kết luận đo đạc
1. **Thanh chọn tầng và Nút thoát đi bộ:**
   - Khoảng cách hở giữa cạnh dưới thanh chọn tầng (`570px - 604px`) và cạnh trên nút thoát (`704px - 752px`) là **100px**.
   - **Hoàn toàn KHÔNG ĐÈ LÊN NHAU** trên màn hình 360×780 thật.
   - Ảnh minh chứng: `06-b4-library-360x780-real.jpg` (55 KB).
2. **Khi mở menu sidebar thư viện:**
   - Chiều rộng sidebar là 258px, chiếm **71.6%** chiều ngang màn hình 360px.
   - Bảng sidebar chồng lấn lên sơ đồ mini ở góc trên bên phải (phạm vi chồng lấn ngang 58px, từ x = 272px đến x = 330px).
   - Ảnh minh chứng: `07-b4-library-360x780-sidebar-open.jpg` (37 KB).

---

## 7. Nguyên nhân phòng 406.B8 tường đen hơn phòng 406.B11

*(Chỉ tìm nguyên nhân và đề xuất, không sửa code theo đúng yêu cầu)*

### Phân tích mã nguồn
1. **Phòng 406.B11 (`src/scene/lesson/Lesson406.tsx`, dòng 24–25):**
   ```tsx
   <ambientLight intensity={1.5} color="#ffffff" />
   <directionalLight position={[92.0, 3.7, -142.0]} intensity={0.9} color="#fffcf5" />
   ```
   - Phòng 406.B11 có nguồn sáng môi trường cường độ cao (1.5) kết hợp đèn định hướng (directional light 0.9) chiếu thẳng từ hướng cửa sổ vào tường, giúp các mảng tường bê tông nhận ánh sáng trực tiếp và tán xạ sáng đều.
2. **Phòng 406.B8 (`src/scene/interior/B8ComputerLabs.tsx`, dòng 173):**
   ```tsx
   <ambientLight intensity={0.4} color="#ffffff" />
   ```
   - Phòng 406.B8 chỉ có một `ambientLight` cường độ rất thấp (0.4, thấp hơn gần 4 lần so với 406.B11).
   - Trong phòng 406.B8 **hoàn toàn không có directionalLight** để chiếu sáng nội thất.
   - Các thanh đèn trần chỉ dùng vật liệu phát quang giả lập (`emissive`), không sinh ra quang thông chiếu sáng lên các bề mặt xung quanh trong Three.js chuẩn.
   - Vật liệu tường trong B8 có độ nhám cao (`roughness = 0.85`), khi thiếu nguồn sáng chiếu trực tiếp sẽ hấp thụ hầu hết ánh sáng yếu ớt, dẫn đến hiện tượng tường bị tối sầm như ám đen.

### Đề xuất xử lý
- Trong file `src/scene/interior/B8ComputerLabs.tsx`:
  - Nâng `ambientLight intensity` từ `0.4` lên `1.2 – 1.4`.
  - Bổ sung một `directionalLight` góc nghiêng nhẹ từ trần hoặc cửa sổ (`intensity ~ 0.7`) để tạo độ chuyển bóng và độ sáng tự nhiên đồng bộ với phòng 406.B11.

---

## 8. Danh mục ảnh minh chứng thực tế

Toàn bộ ảnh được lưu tại `docs/it-silver/anh-3d/camera/`, dung lượng đều ≤ 128 KB, tổng cộng 12 ảnh:

| Tên file ảnh | Dung lượng | Mô tả nội dung thực tế trong ảnh |
|---|---|---|
| `01-meet-thanh-after.jpg` | 125 KB | Sân trước B8: camera đối thoại cự ly ~2.3m, cao 1.7m, nhìn thấy Thành và người chơi rõ ràng dưới mái hiên. |
| `02-result-after.jpg` | 45 KB | Sân trước B8: xem bảng kết quả thi, nhìn thấy Thành, Quyền, người chơi và bảng kết quả ngoài trời. |
| `03-after-han-corridor.jpg` | 77 KB | Hành lang tầng 2 B8: giờ nghỉ sau buổi thi, camera cận cảnh nhìn thấy Han và người chơi, không bị trần che. |
| `04-club-hall-after.jpg` | 59 KB | Sảnh giữa tầng 1 B8: đối thoại đầu kỳ, camera cận cảnh nhìn thấy Thành, Quyền và người chơi. |
| `05-lab2-string-test.jpg` | 65 KB | 2.2 Lab 2: màn hình bài tập "Khai báo biến" nhập String, trình biên dịch báo lỗi 550ms, tab mượt mà. |
| `06-b4-library-360x780-real.jpg` | 55 KB | Màn 360×780 thật: thanh chọn tầng (y: 570–604) hở 100px so với nút Thoát đi bộ (y: 704–752), không đè nhau. |
| `07-b4-library-360x780-sidebar-open.jpg` | 37 KB | Màn 360×780 thật: mở menu sidebar thư viện (rộng 258px), che 71.6% màn hình và chồng lên minimap 58px. |
| `08-406-b8-seated-fixed.jpg` | 44 KB | 406.B8 Lab 1: ngồi vào ghế góc nhìn sau vai, thân người chơi đã ẩn hoàn toàn, màn hình máy tính thông thoáng. |
| `08b-406-b8-seated-fps.jpg` | 44 KB | 406.B8 Lab 1: ngồi vào ghế góc nhìn FPS, tầm nhìn thẳng không có khối đen che khuất. |
| `09-206-b8-seated-clear.jpg` | 40 KB | 206.B8 Phần nghe: ngồi vào ghế sau vai, nhìn rõ bàn học và không gian phòng. |
| `09-206-b8-fps-clear-tv.jpg` | 40 KB | 206.B8 góc nhìn FPS: ghế 206-r1-s4 trước mặt đã trống, màn hình TV trên tường hoàn toàn không bị đầu NPC che. |
| `09c-206-b8-stand-up-body-visible.jpg` | 90 KB | 206.B8 đứng dậy (Esc): góc nhìn thứ ba, thân người chơi hiện lại đầy đủ bình thường. |

---

## 9. Kết quả các cổng kiểm tra bắt buộc

```bash
npm run typecheck            # PASS (0 lỗi)
npm run lint                 # PASS (0 lỗi)
npm run build                # PASS (vite build production thành công)
npm run test:silver          # PASS (toàn bộ 26/26 test suites đạt 100%)
npm run check:silver --strict # PASS (nội dung và dữ liệu curriculum đạt chuẩn)
```
