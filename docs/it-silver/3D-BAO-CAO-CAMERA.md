# BÁO CÁO SỬA CAMERA ĐỐI THOẠI, PHÒNG HỌC 206, WEBGL VÀ KIỂM THỬ THỰC NGHIỆM

- **Nhánh:** `it-silver-kiem-phu`
- **Người thực hiện:** Antigravity (Thợ code 3D & UI)
- **Cổng thử nghiệm:** `http://localhost:5199` (`npm run preview -- --port 5199 --strictPort`)
- **Thư mục ảnh:** `docs/it-silver/anh-3d/camera/` (toàn bộ ảnh đều ≤ 106 KB, chất lượng sắc nét, đúng thực tế kiểm thử trên bản build).

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

## 3. Đơn giản hóa camera đối thoại, ẩn thân người chơi và cơ chế quay mặt NPC

### Hiện trạng và các vấn đề phát hiện ở đợt kiểm tra trước
1. **Thuật toán camera cũ:** Thuật toán cũ sinh 10 vị trí ứng viên phức tạp (482 dòng code), dễ gây phán đoán sai góc nhìn ngoài trời (như lùi vào tán cây liễu trước cửa Nam B8) và làm mã nguồn cồng kềnh.
2. **Che khuất tầm nhìn:** Khi đối thoại ở cự ly gần hoặc góc hẹp, đầu/lưng nhân vật người chơi dễ chắn một phần mặt của nhân vật đối thoại.
3. **NPC không quay mặt trong cảnh `1.1/after` và `2.2/closing`:**
   - **Nguyên nhân cốt lõi:** Trong `StoryActors.tsx`, điều kiện quay cũ là `if (isFocused) { if (isMainSpeaker || dist <= 4.0) targetYaw = ... } else if (signal.speaker === actor.speaker) { targetYaw = ... }`.
   - Khi người chơi mới tới hoặc đang ở pha `arrival`, `isFocused` chưa bật. Đồng thời, bước mở đầu của cả 2 cảnh này có `speaker: "narrator"`, không trùng với `actor.speaker` ("han"). Do đó cả hai nhánh đều không kích hoạt, NPC giữ nguyên hướng mặc định `defaultYaw` (quay ngang hoặc quay lưng về người chơi).
4. **Cảnh bảng kết quả `entrance/result` bị mặt lưng đen:**
   - Trong `ResultBoard.tsx`, texture kết quả thi chỉ được vẽ ở mặt trước (`z = +0.005`), mặt sau chỉ có vật liệu màu xám tối. Khi bấm "Tới nơi luôn", người chơi đứng ở phía sau bảng nên chỉ thấy mặt sau đen sì, che mất Thành và Quyền đứng phía trước bảng.

### Giải pháp kỹ thuật đã triển khai

#### a) Đơn giản hóa triệt để camera đối thoại (`src/scene/walk/focusedCamera.ts`)
- Viết lại toàn bộ `focusedCamera.ts` thành module thuần toán học cực kỳ ngắn gọn (chỉ 76 dòng, < 80 dòng theo yêu cầu):
  - **Góc nhìn tự nhiên:** Đặt camera tại vị trí mắt người chơi (`playerPos.y + 1.5`), nhìn thẳng vào mặt người nói (`targetPos.y + 1.3`).
  - **Cự ly lý tưởng:** Nếu người chơi đứng quá gần người nói (< 1.6m), lùi nhẹ camera theo vector từ người nói tới người chơi đến khoảng cách 1.8m (trong khoảng 1.6–2m).
  - **Kiểm tra va chạm tường:** Hàm `findWallBetween` kiểm tra đoạn lùi camera có đâm xuyên qua tường nội thất hay không; nếu vướng tường thì giữ nguyên vị trí mắt an toàn của người chơi.
  - **Chuyển động mượt mà:** Lerp vị trí và tâm nhìn mượt mà trong 0.6s (`1 - Math.exp(-dt / 0.6)`).

#### b) Ẩn thân người chơi khi `focused` (`WalkMode.tsx`)
- Khi bắt đầu đối thoại (`focused = true`): Gán `body.current.visible = false` (tương tự như khi ngồi học). Người chơi nhìn trực tiếp bằng mắt của mình, hoàn toàn không có đầu, vai hay lưng che chắn người nói dù ở bất kỳ khoảng cách nào.
- Khi kết thúc đối thoại (`focused = false`): Phục hồi hiển thị thân người chơi `body.current.visible = viewMode.current !== 1`.

#### c) Sửa triệt để cơ chế quay mặt NPC (`StoryActors.tsx`)
- Bổ sung điều kiện trong `StoryActors.tsx`: Bất kể trạng thái `isFocused` hay chưa, người nói chính của cảnh (`isTalkTarget || signal.speaker === actor.speaker || dist <= 3.5`) luôn quay mặt về phía tọa độ thực tế của người chơi (`playerPos`).
- Nhờ đó, ngay từ bước thuyết minh mở đầu của người dẫn chuyện (`narrator`), Han và các bạn trong nhóm đã chủ động quay mặt chào đón người chơi, khắc phục triệt để lỗi không quay mặt ở `1.1/after` và `2.2/closing`.

#### d) Hiển thị kết quả 2 mặt cho bảng thông báo (`ResultBoard.tsx`)
- Áp dụng texture kết quả thi trên cả 2 mặt trước (`z = +0.005`) và mặt sau (`z = -0.005`, xoay mặt `rotation-y = Math.PI`), bảo đảm người chơi đứng ở phía trước hay phía sau bảng đều nhìn thấy rõ ràng danh sách trúng tuyển và kết quả xếp lớp.

#### e) Bộ unit test hoàn chỉnh (`scripts/silver/tests/focused-camera.test.mjs`)
- 4 ca kiểm thử chuyên biệt đạt 100% pass:
  1. Cao độ chuẩn mắt người chơi (1.5m) và mặt người nói (1.3m).
  2. Tự động lùi cự ly tới 1.8m khi người nói đứng quá gần (< 1.6m).
  3. Không lùi xuyên qua tường khi có vách ngăn cản phía sau.
  4. Đổi đối tượng đối thoại thì tự động tính lại điểm nhìn chính xác.

---

## 4. Kết quả kiểm tra thực nghiệm 7 cảnh đối thoại trên bản build thật

Kiểm tra trực tiếp trên bản build production (`npm run preview`, cổng 5199). Mỗi cảnh được chụp khi thẻ ngày đã tắt và nội dung chữ của nhân vật đã chạy xong.

| STT | Cảnh (Scene ID) | Tiêu đề trên màn hình | Nhân vật nói | Mô tả thực tế quan sát | Đánh giá | Ảnh minh chứng |
|:---:|:---|:---|:---|:---|:---:|:---|
| 1 | `entrance/arrival` | Trước cửa B8 (Bước 2/4) | **Thành** | Thấy rõ mặt Thành trực diện quay về phía người chơi, chữ chạy xong, không bị cây hay mái che cản. Thân người chơi ẩn hoàn toàn. | **ĐẠT** | `docs/it-silver/anh-3d/camera/01-meet-thanh.jpg` (106 KB) |
| 2 | `entrance/result` | Bảng kết quả (Bước 2/5) | **Quyền** | Bảng kết quả hiển thị thông tin rõ ở cả hai mặt. Quyền quay mặt nhìn thẳng vào người chơi trao đổi kết quả thi. | **ĐẠT** | `docs/it-silver/anh-3d/camera/02-result.jpg` (87 KB) |
| 3 | `1.1/practice` | Giờ thể chất (Bước 2/3) | **Han** | Không gian sân cỏ thoáng đãng ngoài trời. Han quay mặt đối diện người chơi giải thích môn thể chất. | **ĐẠT** | `docs/it-silver/anh-3d/camera/03-pe.jpg` (57 KB) |
| 4 | `1.1/after` | Giờ nghỉ sau thi (Bước 2/4) | **Han** | Hành lang tầng 2 B8. Han quay mặt trực tiếp về người chơi trò chuyện thoải mái, Thành đứng cạnh. Khắc phục lỗi Han không quay mặt. | **ĐẠT** | `docs/it-silver/anh-3d/camera/04-after.jpg` (86 KB) |
| 5 | `2.2/opening` | Ngày đầu kỳ (Bước 2/3) | **Thành** | Sảnh trệt B8. Thành quay mặt trực diện nói chuyện với người chơi, phía sau có Quyền. Góc nhìn thông thoáng, không bị che đầu. | **ĐẠT** | `docs/it-silver/anh-3d/camera/05-opening.jpg` (64 KB) |
| 6 | `2.2/closing` | So kết quả (Bước 2/4) | **Han** | Phòng máy 406.B8. Han quay mặt đối diện người chơi nói về kết quả thi cuối kỳ. Khắc phục triệt để lỗi không quay mặt trước đây. | **ĐẠT** | `docs/it-silver/anh-3d/camera/06-closing.jpg` (56 KB) |
| 7 | `2.2/club` | Đăng ký CLB (Bước 1/1) | **Han** | Sảnh trệt B8 cạnh bàn đăng ký CLB. Han quay mặt về người chơi, 3 tùy chọn câu lạc bộ hiển thị rõ ràng, dễ tương tác. | **ĐẠT** | `docs/it-silver/anh-3d/camera/07-club.jpg` (73 KB) |

*Tất cả 7 ảnh đều có dung lượng ≤ 106 KB (đáp ứng xuất sắc yêu cầu ≤ 150 KB), không còn ảnh thừa, không bị che khuất tầm nhìn.*

---

## 5. Xử lý mất ngữ cảnh WebGL và ErrorBoundary quanh Canvas

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

## 6. Kiểm nghiệm nghi vấn 2.2 Lab 2: Bài "Khai báo biến" nhập String

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

## 7. Đo đạc kích thước giao diện Thư viện B4 trên màn 360×780 thật

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

## 8. Tăng sáng phòng máy 406.B8 (Đã hoàn thành ở commit `277f097`)

- Chi tiết nguyên nhân, giải pháp và bộ ảnh đối chiếu trước - sau cùng góc nhìn được trình bày tại báo cáo độc lập:
  - Báo cáo: `docs/it-silver/3D-BAO-CAO-TANG-SANG-406.md`.
  - Thư mục ảnh: `docs/it-silver/anh-3d/tang-sang-406/` (gồm 8 ảnh before/after cho 4 góc nhìn).
  - Vị trí thầy giáo: Tọa độ đứng giảng bài `[41.23, 0, -221.71]`, cách bảng slide máy chiếu 3.8m về phía Tây Nam.

---

## 9. Kết quả các cổng kiểm tra bắt buộc

```bash
npm run typecheck             # PASS (0 lỗi)
npm run lint                  # PASS (0 lỗi)
npm run build                 # PASS (vite build production thành công)
npm run test:silver           # PASS (toàn bộ test suites đạt 100%)
npm run check:silver --strict # PASS (dữ liệu curriculum đạt chuẩn)
```
