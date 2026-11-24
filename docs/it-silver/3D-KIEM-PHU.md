# Báo cáo Kiểm phụ 3D Game CampusSim (EIU Simulator)

**Nhánh:** `PengWynIsMe/it-silver-kiem-phu` (gốc commit `ac48f6f`, gộp `b4-library`)  
**Môi trường thử nghiệm:** Orca Desktop Browser, Preview port 5199 (`vite preview --port 5199 --strictPort`)  
**Quy tắc tuân thủ:** Không sửa đổi file mã nguồn trong `src/`, không push nhánh, commit cục bộ sau mỗi phần kiểm tra, toàn bộ ảnh kích thước ≤ 150 KB.

---

## Phần 1 — Nguyên nhân che hình (Phân tích chi tiết & Dẫn chứng số liệu)

### 1a. Ngồi ở 406.B8 và 206.B8: Khối tối lớn che nửa dưới màn hình

#### 1. Hiện tượng quan sát thực tế
- Khi nhân vật ngồi (`seat`) tại phòng học **206.B8** (kịch bản *entrance/listening* - Phần nghe) và phòng máy **406.B8** (kịch bản *2.2 Lab 1* - Môn CSE 103), ở góc nhìn mặc định **Sau vai** (`viewMode = 0`), một khối hình học tối màu khổng lồ chiếm trọn từ nửa dưới đến tâm màn hình, che khuất gần như toàn bộ bàn học, màn hình máy tính và tầm nhìn về phía bảng/màn chiếu.
- Khi nhấn phím `C` chuyển sang góc nhìn **Thứ nhất (FPS)** (`viewMode = 1`), khối tối khổng lồ này lập tức biến mất hoàn toàn. Tầm nhìn mở ra thông thoáng về phía bàn, máy tính và bảng.

#### 2. Kết quả đo đạc tọa độ và Raycast thực nghiệm

##### Tại phòng học 206.B8 (Tầng 2 B8 — Ghế `206-r2-s4`):
- **Tọa độ ghế học sinh (`seat.spot`):** `[x: 38.390, y: 0.400, z: -218.896]`
- **Hướng nhìn học sinh (`seat.spot.facing`):** `[-0.974, 0.227]` (hướng về phía màn chiếu ở `u = 82`)
- **Tọa độ Camera (`camera.position`):** `[x: 38.990, y: 1.550, z: -219.189]`
- **Hướng nhìn Camera (`camera.dir`):** `[-0.988, -0.035, 0.148]`
- **Tọa độ nhân vật người chơi (`playerPos`):** `[x: 38.390, y: 0.400, z: -218.896]`
- **Vật thể gần nhất trước Camera (Raycast / Distance traverse):**
  1. `head-mesh` (`character-male-a_1` — Model của người chơi): khoảng cách **0.68 m** tới tâm camera, tâm đầu tại `[x: 38.40, y: 1.41, z: -218.90]`, Bounding Box `Y: 1.09 m → 1.74 m`.
  2. `body-mesh` (`character-male-a_1` — Thân của người chơi): khoảng cách **0.99 m**, Bounding Box `Y: 0.40 m → 1.14 m`.

##### Tại phòng máy 406.B8 (Tầng 4 B8 — Ghế `406-r2-s5`):
- **Tọa độ ghế học sinh (`seat.spot`):** `[x: 37.952, y: 0.400, z: -218.486]`
- **Hướng nhìn học sinh (`seat.spot.facing`):** `[0.974, -0.227]`
- **Tọa độ Camera (`camera.position`):** `[x: 37.353, y: 1.550, z: -218.192]`
- **Hướng nhìn Camera (`camera.dir`):** `[0.912, -0.037, -0.409]`
- **Vật thể gần nhất trước Camera:**
  1. `head-mesh` (`character-male-a_1`): khoảng cách **0.68 m**, tâm đầu tại `[x: 37.95, y: 1.41, z: -218.48]`.
  2. `body-mesh` (`character-male-a_1`): khoảng cách **0.99 m**, tâm thân tại `[x: 37.90, y: 0.77, z: -218.47]`.

#### 3. Bằng chứng thực nghiệm (Proof of Cause)
- Khi thực thi lệnh ẩn model nhân vật người chơi (`character-male-a`: `body-mesh` và `head-mesh`) trong khi vẫn giữ nguyên vị trí Camera ở góc nhìn `viewMode = 0`, khối đen lập tức biến mất hoàn toàn và toàn bộ bàn máy tính, màn hình máy tính hiển thị rõ ràng (xem ảnh `09-406-b8-player-hidden-proof.jpg`).
- Kết luận: **Khối tối lớn che nửa dưới màn hình chính là phần đầu, gáy, vai và lưng của chính nhân vật người chơi (`character-male-a`)**.

#### 4. So sánh với 406.B11 (nmlt-01)
- Ở buổi học `nmlt-01` tại **406.B11**, khi bắt đầu bài giảng, giao diện câu thoại mở ra và góc nhìn mặc định khi vào lớp là **Góc nhìn thứ nhất (FPS - viewMode = 1)** (hiển thị rõ chữ *"Góc nhìn: Thứ nhất (FPS)"* trên HUD). Vì ở viewMode 1, `WalkMode.tsx` tự động ẩn mesh nhân vật (`body.current.visible = false`), nên người chơi nhìn thấy phòng máy tính, màn hình máy tính và thầy Nam rất rõ ràng, không hề có khối đen cản trở.

#### 5. Phân tích nguyên nhân gốc rễ trong mã nguồn
1. **Thiết lập Camera trong `src/silverWorld/seatAnchor.ts` (dòng 71–76):**
   ```ts
   // Mắt = ghế - 0.65 f + 0.15 r, cao 1.55
   const eye: [number, number, number] = [
     seatX - 0.65 * f[0] + 0.15 * r[0],
     1.55,
     seatZ - 0.65 * f[1] + 0.15 * r[1],
   ];
   ```
   Camera chỉ đặt lùi sau tâm ghế đúng **0.65 m** và lệch phải chỉ **0.15 m** ở độ cao `y = 1.55 m`. Trong khi đó, nhân vật Kenney character model có chiều cao 1.6 m, bán kính thân ~0.3 m. Khoảng cách từ thấu kính camera đến mặt sau của đầu người chơi chỉ là ~0.4–0.68 m. Với góc nhìn trường `fov = 45°`, toàn bộ đầu và vai của nhân vật choán hết 50–70% khung hình phía trước.
2. **Logic hiển thị nhân vật trong `src/scene/walk/WalkMode.tsx` (dòng 675–679):**
   ```ts
   if (body.current) {
     body.current.visible = viewMode.current !== 1;
     body.current.position.set(x, SIT_Y_OFFSET, z);
     body.current.rotation.y = Math.atan2(facing[0], facing[1]);
   }
   ```
   Khi nhân vật ngồi vào ghế (`if (seat)`), mã nguồn vẫn giữ `body.current.visible = true` nếu đang ở góc nhìn sau vai (`viewMode.current !== 1`). Do đó, model người chơi vẫn được render đè ngay trước ống kính camera.
3. **Vấn đề hàng ghế trước tại 206.B8:**
   Ngoài phần đầu của người chơi ở viewMode 0, tại 206.B8 khi chuyển sang viewMode 1, người chơi ngồi ở hàng 2 (`206-r2-s4`), nhìn về hướng `-u`. Ngay trước mặt (cách 1 m ở `u = 86.0`) là ghế `206-r1-s4` có một NPC học sinh ngồi (`crowd` trong `classrooms.json` chỉ định `206-r1-s4`). Vì khoảng cách hàng ghế sát nhau (1 m), đầu của NPC hàng trước cũng nhô lên che một phần góc nhìn màn chiếu.

#### 6. Đề xuất cách sửa
1. **Sửa trong `src/scene/walk/WalkMode.tsx` (dòng 676):**
   Khi người chơi đang ngồi trong ghế (`if (seat)`), **bắt buộc ẩn nhân vật của người chơi**:
   ```ts
   if (body.current) {
     body.current.visible = false; // Luôn ẩn thân người chơi khi ngồi để tránh che khuất camera bàn học
     body.current.position.set(x, SIT_Y_OFFSET, z);
     body.current.rotation.y = Math.atan2(facing[0], facing[1]);
   }
   ```
   *(Hoặc nếu muốn giữ góc nhìn sau vai: trong `seatAnchor.ts`, dời camera lùi xa hơn `eye: ghế - 1.2 * f + 0.35 * r, cao 1.65` và điều chỉnh target nhìn cao hơn).*
2. **Đối với 206.B8:** Trong danh sách `crowd` của `src/data/classrooms.json` tại phòng `206.B8`, bỏ ghế `206-r1-s4` ra khỏi danh sách xếp NPC ngồi, để vị trí ngay trước mặt người chơi được thông thoáng.

---

### 1b. entrance/meet-thanh: Mái/sàn trắng che, không thấy Thành

#### 1. Hiện tượng quan sát thực tế
- Khi bắt đầu kịch bản *entrance* (*Ngày kiểm tra đầu vào*), người chơi xuất hiện trước cửa B8 (*entrance/meet-thanh*).
- Bấm nút **"Tới nơi luôn"** rồi bấm **"Nói chuyện (E)"**, một khối phẳng màu trắng xám khổng lồ che toàn bộ nửa dưới và giữa màn hình (xem ảnh `01-meet-thanh.jpg`). Người chơi và nhân vật Thành bị che khuất hoàn toàn bên dưới tấm phẳng này, chỉ nhìn thấy bức tường kính B8 và các thanh lam xám phía trên xa.

#### 2. Kết quả đo đạc tọa độ và Phân tích hình học
- **Cấu hình stage trong `src/data/silver/stages.json`:**
  - `arrival`: `[x: 17.43, z: -158.06]`, facing: `[-0.23, -0.97]` (nhìn về hướng Bắc)
  - `target` (Thành): `[x: 17.91, z: -164.85]`, facing: `[0.23, 0.97]` (nhìn về hướng Nam)
- **Tọa độ sau khi "Tới nơi luôn":**
  - Người chơi đứng tại: `[x: 17.63, y: 0.05, z: -166.02]`
  - Thành đứng tại: `[x: 17.91, y: 0.05, z: -164.85]` (cách người chơi 1.2 m về phía Nam)
- **Vị trí và hướng Camera ngoài trời khi đối thoại (`WalkMode.tsx`):**
  - Camera ngoài trời đặt lùi sau nhân vật 8 m (`player.current - forward * 8`):
    - `camera.position`: `[x: 15.79, y: 3.45, z: -173.80]`
    - `camera.dir`: `[0.230, -0.220, 0.950]` (nhìn chếch xuống từ độ cao `y = 3.45 m` về phía `[17.91, 1.35, -164.85]`).
- **Phát hiện vật cản che chắn:**
  - Trong `src/scene/zone2/Zone2Walkways.tsx` (dòng 20–30):
    ```ts
    // Hành lang mái che B8 ↔ B11 (theo đường footway OSM)
    {
      points: [
        [16.1, -174.2],
        [17.7, -165.1],
        [27.9, -166.4],
        [31.4, -155.7],
      ],
      roofH: 3.0,
      width: 2.4,
    },
    ```
  - Hành lang mái che nối B8 và B11 có đoạn chạy từ `[16.1, -174.2]` đến `[17.7, -165.1]`.
  - Mái hành lang này có độ cao `roofH = 3.0 m` (+ chiều dày 0.08 m thành `y = 3.04 m`), bề rộng 2.6 m, màu sơn trắng xám kem `#e2e8f0`.
  - **Camera đang ở tọa độ `z = -173.80`, độ cao `y = 3.45 m`**, nằm ngay phía trên nóc mái hành lang (chỉ cách mặt trên của mái 41 cm)!
  - Trong khi đó, **Thành và người chơi đang đứng ở `z = -164.85` đến `-166.02` ở mặt đất (`y = 0.05 m`)**, tức là nằm ngay dưới đầu kia của mái hành lang.
  - Khi camera ở `y = 3.45 m` nhìn xiên xuống nhân vật ở `y = 1.35 m`, **toàn bộ tấm mái phẳng của hành lang nối B8–B11 nằm trực diện chắn ngang giữa camera và nhân vật**. Camera thực chất đang nhìn lướt trên bề mặt mái hành lang, khiến tấm mái màu trắng `#e2e8f0` choán kín toàn bộ khung hình.

#### 3. Đề xuất cách sửa
1. **Điều chỉnh vị trí đứng và điểm hẹn Thành trong `src/data/silver/stages.json`:**
   - Dời điểm hẹn Thành và arrival ra khỏi phạm vi dưới mái che của hành lang `[16.1, -174.2] -> [17.7, -165.1]`, hoặc quay hướng đối thoại để camera không bị lùi vào nóc hành lang:
     - Ví dụ: đặt Thành ở `[x: 21.0, z: -160.0]` trên khoảng sân rộng thoáng trước cửa B8, hướng nhìn Tây Bắc; hoặc khi vào đối thoại `focused`, chuyển camera xuống độ cao mắt người đi bộ dưới mái hành lang (`y = 1.6 m`), thay vì để camera lùi tự do lên cao `y = 3.45 m` ngoài trời.
2. **Kiểm tra va chạm camera ngoài trời (`WalkMode.tsx`):**
   - Hiện tại camera ngoài trời chưa raycast kiểm tra các vật cản như mái hành lang `Zone2Walkways`, chỉ nội thất mới có tường kiểm tra. Cần bổ sung camera collision hoặc hạ thấp camera khi đối thoại nhân vật NPC ngoài trời.

---

### Danh sách ảnh minh chứng Phần 1 (Lưu tại `docs/it-silver/anh-3d/kiem-phu/`):
| STT | Tên file ảnh | Dung lượng | Mô tả nội dung kiểm tra thực tế |
|---|---|---|---|
| 1 | `01-meet-thanh.jpg` | 98 KB | Cảnh *entrance/meet-thanh* sau khi bấm "Tới nơi luôn" và E: Mái hành lang trắng `#e2e8f0` che toàn bộ nửa dưới và giữa màn hình, che khuất Thành. |
| 2 | `02-206-b8-seated-view0.jpg` | 72 KB | Cảnh phòng 206.B8 ngồi ở viewMode 0 (Sau vai): Khối tối của thân và đầu người chơi che nửa dưới màn hình. |
| 3 | `03-206-b8-seated-view1-fps.jpg` | 89 KB | Cảnh phòng 206.B8 bấm C chuyển góc nhìn: Thân người chơi biến mất, nhưng đầu NPC hàng trước (`206-r1-s4`) nhô lên trong tầm nhìn. |
| 4 | `04-406-b11-seated-fps.jpg` | 131 KB | Cảnh phòng 406.B11 (`nmlt-01`) góc nhìn FPS: Không bị che, thấy rõ bàn, màn hình máy tính, thầy Nam và slide. |
| 5 | `05-406-b11-seated-sauvai.jpg` | 130 KB | Cảnh phòng 406.B11 (`nmlt-01`) góc nhìn Sau vai: Góc nhìn hiển thị đầy đủ lớp học. |
| 6 | `06-406-b8-seated-view0.jpg` | 79 KB | Cảnh phòng 406.B8 (*2.2 Lab 1*) góc nhìn Sau vai: Khối tối thân người chơi che nửa dưới màn hình trước màn máy tính. |
| 7 | `07-406-b8-seated-view1.jpg` | 98 KB | Cảnh phòng 406.B8 (*2.2 Lab 1*) góc nhìn FPS: Khối tối biến mất, màn hình máy tính, bàn học và bạn học Han hiển thị rõ ràng. |
| 8 | `08-406-b8-seated-view0-sauvai.jpg` | 79 KB | Cảnh phòng 406.B8 chu kỳ phím C quay lại Sau vai: Khối đen lại xuất hiện che màn hình. |
| 9 | `09-406-b8-player-hidden-proof.jpg` | 98 KB | Bằng chứng thực nghiệm tại 406.B8 góc nhìn Sau vai: Khi ẩn mesh `character-male-a`, khối tối biến mất hoàn toàn, chứng minh 100% khối tối là người chơi. |

---

## Phần 2 — Cỡ màn hình & Xung đột giao diện (360×780, 768×1024, 1440×900)

Đã kiểm tra giả lập hiển thị 3 kích thước màn hình theo yêu cầu:
1. **360 × 780 (Mobile Portrait)**
2. **768 × 1024 (Tablet Portrait)**
3. **1440 × 900 (Desktop Landscape)**

Kiểm tra tại 4 trạng thái cốt lõi: Lúc ngồi (`seated`), Thoại (`say`), Câu hỏi (`question`), Máy ảo/Code (`code`).

### 1. Phân tích xung đột & Đè giao diện ("Cái gì đè cái gì")

#### A. Cỡ màn hình 360 × 780 (Mobile — Bị lỗi đè nghiêm trọng nhất)
1. **Xung đột nút đi bộ ảo và nút điều hướng học tập:**
   - Khi ở trạng thái ngồi (`seated = true`) trong lớp học hoặc đang thoại/trả lời câu hỏi:
     - `WalkHud.tsx` vẫn render cần điều khiển ảo (Virtual Joystick `group "Cần điều khiển đi bộ"`) ở góc dưới bên trái (`bottom-6 left-6 z-50`).
     - `WalkHud.tsx` vẫn render nút **"Thoát đi bộ"** ở góc dưới bên phải (`bottom-6 right-6 z-50`).
   - **Hậu quả:**
     - **Ở bước Thoại (`say`):** Vòng tròn cần joystick đè thẳng lên card nội dung văn bản bên trái. Nút **"Thoát đi bộ"** màu đen đè **TRỰC DIỆN LÊN NÚT VÀNG "Tiếp ›"**, người dùng không thể bấm "Tiếp ›" bằng ngón tay bình thường (xem ảnh `10-360x780-seated-say.jpg`).
     - **Ở bước Câu hỏi (`question`):** Vòng tròn joystick đè đè trọn lên lựa chọn đáp án số 3 (`3 · 10:00`), khiến sinh viên bấm chọn đáp án 3 sẽ bị nhận nhầm thành cử chỉ di chuyển. Nút "Thoát đi bộ" đè lên góc phải card câu hỏi (xem ảnh `12-360x780-question.jpg`).
     - **Ở bước Code (`code`):** Giao diện máy tính ảo EIU Desktop mở lên toàn màn hình, nhưng Joystick ảo và nút "Thoát đi bộ" vẫn nổi lên đè thanh Taskbar / nút Start EIU của máy tính ảo (xem ảnh `11-360x780-code.jpg`).
2. **Tràn thanh tiêu đề (Top Header Banner Overflow):**
   - Hàng tiêu đề trên cùng gom toàn bộ: Tên bài học + Bước x/y + Nút "Đứng dậy" + Nút "Tuần học" + Nút "Bỏ qua cảnh" + Nút "Thoát" + Chuyển ngữ "VI/EN" + Nút âm thanh "🔊".
   - Bề rộng 360 px không đủ chứa hàng nút này:
     - Nhãn "Bước 1/6" và nút "Đứng dậy" bị co kéo đè lên nhau, chữ "Bước" bị cắt cụt mép trái màn hình.
     - Tiêu đề dài ("Lab 1 — Máy biết chào") bị rút ngắn thành `"L..."`.
3. **Nút đổi góc nhìn lơ lửng (`Góc nhìn: Sau vai · C`):**
   - Nút `fixed right-6 top-20` hiển thị trên mobile chiếm không gian phía trên màn hình, che khuất một phần slide bài giảng hoặc cửa sổ đăng nhập máy ảo.

#### B. Cỡ màn hình 768 × 1024 (Tablet Portrait)
- Card câu hỏi, thoại và code hiển thị đầy đủ, cân đối ở giữa màn hình (xem ảnh `13-768x1024-question.jpg`).
- Vì trình duyệt nhận diện `pointer: fine`, joystick ảo và nút "Thoát đi bộ" không xuất hiện.
- Thanh tiêu đề trên cùng đủ độ rộng để trải ngang toàn bộ các nút chức năng mà không bị chồng lấn.
- Điểm tồn tại duy nhất: Ở góc nhìn Sau vai (`viewMode = 0`), khối người chơi vẫn che nửa bên trái nền 3D phía sau card câu hỏi.

#### C. Cỡ màn hình 1440 × 900 (Desktop Landscape)
- Tỉ lệ hiển thị chuẩn nhất, không có hiện tượng UI 2D đè lên nhau (xem ảnh `14-1440x900-question.jpg`).
- Thanh công cụ trên cùng rộng rãi, card câu hỏi đặt gọn gàng ở nửa dưới màn hình, người chơi quan sát được cả bảng trình chiếu và thầy cô/bạn học bên cạnh.

---

### 2. Đề xuất khắc phục xung đột giao diện Mobile
1. Trong `src/ui/walk/WalkHud.tsx`:
   - Ẩn toàn bộ Joystick và nút "Thoát đi bộ" khi người chơi đang ngồi hoặc đang trong bài học/Silver run:
     ```tsx
     const isSeated = useActivityStore((s) => s.seated);
     const hasActivity = Boolean(useActivityStore((s) => s.activity));
     if (isSeated || hasActivity) return null; // Ẩn điều khiển đi bộ khi đang làm bài hoặc đang ngồi
     ```
2. Trong thanh banner bài học (`src/ui/silver/parts/` hoặc `SilverLayer.tsx`):
   - Trên màn hình hẹp (`< 640px`), gom các nút phụ ("Tuần học", "Bỏ qua cảnh", "VI/EN") vào một menu dropdown 3 chấm (kebab menu) để tránh vỡ layout hàng ngang.

---

### Danh sách ảnh minh chứng Phần 2:
| STT | Tên file ảnh | Dung lượng | Mô tả nội dung kiểm tra thực tế |
|---|---|---|---|
| 10 | `10-360x780-seated-say.jpg` | 45 KB | Màn hình 360×780 (Mobile): Nút "Thoát đi bộ" đè trực tiếp lên nút vàng "Tiếp ›"; Cần joystick ảo đè card thoại. |
| 11 | `11-360x780-code.jpg` | 44 KB | Màn hình 360×780 (Mobile): Ở màn hình máy ảo Code, cần joystick và nút thoát đi bộ vẫn nổi lên đè thanh taskbar. |
| 12 | `12-360x780-question.jpg` | 48 KB | Màn hình 360×780 (Mobile): Cần joystick ảo đè lên đáp án 3 (`3 · 10:00`); Header trên cùng bị tràn đè nút. |
| 13 | `13-768x1024-question.jpg` | 71 KB | Màn hình 768×1024 (Tablet): Giao diện câu hỏi hiển thị đầy đủ, không bị đè nút. |
| 14 | `14-1440x900-question.jpg` | 95 KB | Màn hình 1440×900 (Desktop): Giao diện chuẩn, thoáng đãng, cân đối. |

---

## PHẦN 3 — WEBGL MẤT NGỮ CẢNH, KHÔNG CÓ WEBGL, STORAGE BỊ CHẶN & PREFERS-REDUCED-MOTION

### 1. WebGL mất ngữ cảnh (`WEBGL_lose_context`) và Không có WebGL

#### A. WebGL mất ngữ cảnh qua extension `WEBGL_lose_context`
- **Cách thức thực nghiệm:**
  - Lấy ngữ cảnh WebGL qua `gl = window.__gl.getContext()`.
  - Lấy extension chuẩn `ext = gl.getExtension('WEBGL_lose_context')`.
  - Kích hoạt `ext.loseContext()`.
- **Kết quả quan sát & Phân tích kỹ thuật:**
  1. `gl.isContextLost()` chuyển ngay sang `true`.
  2. Sự kiện `webglcontextlost` được phát và bắt thành công bởi `attachWebglCanvas` trong `src/ui/silver/presentation.ts` (dòng 48–51) cũng như listener trên `window` (dòng 66–72). Biến cờ `webglLost` chuyển thành `true`.
  3. `useSilverPresentation().mode` tự động chuyển từ `'world'` sang `'overlay'` (2D).
  4. Three.js / R3F ngừng vẽ nhưng **không gây lỗi đỏ console** (console error bắt được: `[]`).
- **Phát hiện thiếu sót kỹ thuật (Bug khôi phục ngữ cảnh):**
  - Trong `src/ui/silver/presentation.ts` (dòng 48–51 và 66–72):
    ```ts
    const onLost = () => {
      webglLost = true;
      notify();
    };
    canvas.addEventListener('webglcontextlost', onLost);
    ```
  - **Lỗi:** Listener bắt sự kiện `webglcontextlost` **KHÔNG gọi `event.preventDefault()`**.
  - **Hậu quả:** Theo đặc tả chính thức của Khronos WebGL Specification:
    > *"If the webglcontextlost event is not cancelled by calling preventDefault(), the default action is that the context will NOT be restored."*
    Do thiếu `event.preventDefault()`, trình duyệt tự động hủy bỏ vĩnh viễn ngữ cảnh đồ họa. Khi gọi `ext.restoreContext()`, ngữ cảnh không bao giờ có thể tự khôi phục lại được, canvas 3D bị vô hiệu hóa hoàn toàn cho đến khi người dùng F5 tải lại trang.
  - **Đề xuất sửa:**
    ```ts
    const onLost = (event: Event) => {
      event.preventDefault(); // Cho phép WebGL tự khôi phục ngữ cảnh khi GPU sẵn sàng
      webglLost = true;
      notify();
    };
    ```

#### B. Môi trường không có WebGL (No WebGL Support)
- **Kiểm tra kiến trúc:**
  - Trong `src/App.tsx` (dòng 49–67), component `<Canvas>` của `@react-three/fiber` được đặt trực tiếp trong JSX mà **không có bất kỳ `<ErrorBoundary>` nào bao bọc**.
- **Hậu quả khi WebGL bị vô hiệu hóa / không hỗ trợ:**
  - Nếu trình duyệt không hỗ trợ WebGL hoặc GPU bị blacklist, Three.js `WebGLRenderer` sẽ ném ngoại lệ nghiêm trọng:
    `Error: THREE.WebGLRenderer: A WebGL context could not be created.`
  - Do không có React ErrorBoundary bắt lỗi, lỗi này sẽ làm sập toàn bộ cây component React của trang web (trắng trang hoàn toàn), ngăn cản người dùng sử dụng cả chế độ 2D overlay lẫn xem thông tin giới thiệu trường.
- **Đề xuất sửa:** Bọc `<Canvas>` trong một `CanvasErrorBoundary` có giao diện fallback 2D (ví dụ hiển thị chế độ 2D sơ đồ hoặc dải cảnh báo nâng cấp trình duyệt).

---

### 2. LocalStorage và SessionStorage bị chặn (Chế độ riêng tư nghiêm ngặt)

#### A. Kiểm tra `localStorage`
- **Thực nghiệm:** Thiết lập `Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Access denied', 'SecurityError'); } })`.
- **Kết quả:**
  - `src/store/useSilverStore.ts` (dòng 454–460): Hàm `browserStorage()` có khối `try/catch` bắt an toàn, fallback về `kv = null`. Hệ thống chuyển sang lưu trữ tạm trong bộ nhớ (in-memory) và hiển thị cảnh báo `saveWarning = 'blocked'`. Game vẫn chơi và hoàn thành bài học bình thường mà không bị gián đoạn.
  - `src/store/useLangStore.ts` (dòng 6–16, 34–42): Bọc `try/catch` đầy đủ. Chuyển đổi ngôn ngữ VI ↔ EN hoạt động trơn tru trong phiên hiện tại, console không có lỗi.
  - `src/ui/audio/sfx.ts` và `src/data/reviewNotes.ts`: Đều có `try/catch` bọc an toàn.

#### B. Phát hiện lỗi nghiêm trọng với `sessionStorage` trong `src/App.tsx`
- **Mã nguồn:** Trong `src/App.tsx` (dòng 29 và dòng 44):
  ```tsx
  // Dòng 29 (useEffect khi mount):
  const savedReviewMode = sessionStorage.getItem('campussim.reviewMode');

  // Dòng 44 (useEffect khi reviewMode thay đổi):
  sessionStorage.setItem('campussim.reviewMode', String(reviewMode));
  ```
- **Lỗi:** Hai lệnh gọi `sessionStorage` này **hoàn toàn KHÔNG có khối `try/catch`**.
- **Bằng chứng thực nghiệm:**
  - Khi chặn Storage và người dùng tương tác với nút "Chế độ góp ý" (`toggleReviewMode`), trình duyệt lập tức ném lỗi không bắt được:
    `Uncaught SecurityError: Access is denied for this document` (bắt được qua listener `window.onerror`).
  - Khi người dùng tải lại trang trong môi trường chặn Storage hoàn toàn, `sessionStorage.getItem` tại dòng 29 sẽ ném ngoại lệ làm gián đoạn chuỗi khởi tạo của `useEffect` trong `App.tsx`.
- **Đề xuất sửa:** Bọc `sessionStorage` trong `App.tsx` bằng `try/catch`:
  ```tsx
  try {
    const saved = sessionStorage.getItem('campussim.reviewMode');
    if (saved === 'true' && !useReviewStore.getState().reviewMode) {
      useReviewStore.getState().toggleReviewMode();
    }
  } catch {
    /* bỏ qua lỗi storage bị chặn */
  }
  ```

---

### 3. Kiểm tra `prefers-reduced-motion`

- **Hiện trạng hỗ trợ:**
  - Được cài đặt tại `src/ui/silver/steps/Say.tsx` (dòng 23–37) và `src/ui/silver/steps/Code.tsx` (dòng 27–30):
    ```tsx
    const [reducedMotion] = useState(() =>
      typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
    );
    const { shown, done, skip } = useTypewriter(fullText, 30, true);
    const isImmediate = reducedMotion || langSwitched;
    const displayText = isImmediate ? fullText : shown;
    ```
- **Kết quả thực nghiệm:**
  - Khi hệ điều hành hoặc trình duyệt bật chế độ giảm chuyển động (`prefers-reduced-motion: reduce`), biến `isImmediate` luôn là `true`.
  - Hiệu ứng máy đánh chữ (typewriter) gõ từng ký tự bị tắt hoàn toàn: Toàn bộ câu thoại được hiển thị ngay lập tức 100%, không bị chớp hay trễ nhịp. Console hoàn toàn sạch (0 lỗi).
- **Hạn chế còn tồn tại:**
  - Hiệu ứng tuyết rơi (`SnowIntroOverlay` và hạt tuyết 3D `SnowFall`) cùng chuyển động bay lượn của camera (`CameraRig.tsx`) chưa kiểm tra cờ `prefers-reduced-motion`, vẫn thực hiện hoạt ảnh bay lượn và xoay vòng bình thường.

---

