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

## PHẦN 4 — THƯ VIỆN B4: TRẢI NGHIỆM 3 TẦNG, BẢNG DỊCH VỤ, PHÍM ESC VÀ TÁCH BIỆT KHỎI B8

### 1. Quy trình kiểm tra thực tế
1. **Truy cập từ panel tòa B4:**
   - Trên bản đồ tổng quan, click chọn tòa Block 4 (Thư viện).
   - Panel bên phải hiển thị cấu trúc kiến trúc 3 tầng, 11.4 m, 24 tấm pin mặt trời và nút hành động vàng đồng: `Vào tham quan Thư viện EIU 3D` (`src/ui/BuildingPanel.tsx` dòng 236–259).
   - Bấm nút: Game chuyển mượt mà vào góc nhìn đi bộ nội thất Tầng 1 Thư viện B4 tại tọa độ `[x: 91.5, z: -97.4]`.
2. **Tham quan 3 tầng thư viện:**
   - **Tầng 1 (Trệt):** Hiển thị sảnh chính, quầy thông tin, khu vực máy tính, khu vực in ấn, khu tự học và góc trao đổi sách. Sơ đồ SVG mini và menu sidebar Accordion cập nhật vị trí chính xác (ảnh `15-b4-library-floor1-1440.jpg`).
   - **Tầng 2:** Bấm nút chuyển nhanh `TẦNG 2` trên thanh công cụ góc phải dưới: Nhân vật chuyển tầng tức thì lên Tầng 2, sơ đồ SVG mini chuyển sang layout phòng học nhóm 01..09, khu tự học Bắc và phòng máy chủ 202.
   - **Tầng 3:** Bấm nút `TẦNG 3`: Nội thất chuyển sang khu vực kệ sách tập trung, quầy lưu hành, cổng kiểm soát an ninh RFID và sảnh thang bộ thoát hiểm.
3. **Modal Bảng dịch vụ & Tiện ích Thư viện EIU (`LibraryHud.tsx`):**
   - Mở modal qua nút `ⓘ DỊCH VỤ & TIỆN ÍCH` hoặc nút tròn `i` góc phải dưới.
   - Modal hiển thị chuẩn 5 tab nghiệp vụ theo thư viện EIU: `Mượn / Trả sách (OPAC)`, `Phòng học nhóm & Nghiên cứu`, `Cơ sở dữ liệu điện tử`, `Khu tự học & Không gian sáng tạo`, `Ứng dụng EIU Library & Liên hệ` (ảnh `16-b4-library-services-modal.jpg`).
4. **Kiểm tra phím Escape (Đóng modal vs Thoát ra ngoài):**
   - Khi modal Dịch vụ đang mở, nhấn phím `Escape`:
     - Nhờ logic `e.stopImmediatePropagation()` trong `LibraryHud.tsx` (dòng 215–224), sự kiện Esc được cô lập hoàn toàn: **Modal dịch vụ đóng ngay lập tức (`modalStillOpen: false`)**.
     - Trạng thái đi bộ trong thư viện **VẪN ĐƯỢC GIỮ NGUYÊN (`isLibraryStillActive: true`)**, người chơi không bị văng ra ngoài khuôn viên.
   - Khi nhấn phím `Escape` lần thứ hai (khi modal đã đóng):
     - Handler thoát toàn cục trong `WalkHud.tsx` kích hoạt: Người chơi thoát hoàn toàn khỏi chế độ đi bộ và quay trở về bản đồ khuôn viên tổng thể.
   - Bấm phím `E` tại cửa sảnh: Kích hoạt nút `Ra ngoài khuôn viên (Nhấn E)`, thoát ra ngoài an toàn.

---

### 2. Đánh giá xung đột giao diện tại 1440 × 900 và 360 × 780

#### A. Tại 1440 × 900 (Desktop)
- Menu sidebar bên trái (`w-[258px]`) đặt cố định `top-16 bottom-16 left-3`.
- Sơ đồ thu nhỏ đặt ở `bottom-28 right-4`.
- Thanh đổi tầng nhanh đặt ở `bottom-16 right-4`.
- **Đánh giá:** Không có bất kỳ sự đè lấn nào giữa các nút giao diện thư viện với nút điều khiển hay nút thoát của hệ thống. Người chơi có tầm nhìn 3D bao quát toàn bộ nội thất.

#### B. Tại 360 × 780 (Mobile)
- Trên mobile, menu sidebar bên trái ban đầu tự động thu gọn thành nút tròn nhỏ `☰ Thư viện` (`bottom-44 left-3`), không choán màn hình (ảnh `17-b4-library-360x780.jpg`).
- Thanh chuyển tầng đặt ở `bottom-44 right-3` (cách đáy 176px), sơ đồ mini đặt ở `bottom-56 right-3` (cách đáy 224px).
- Nút "Thoát đi bộ" / "Ra ngoài" nằm ở `bottom-6 right-6` và phím ảo joystick ở `bottom-6 left-6`.
- **Kết quả:** Các nút công cụ thư viện được bố trí cao hơn khu vực điều khiển đáy màn hình (cách nhau > 100px), **KHÔNG BỊ ĐÈ LÊN NÚT ĐI BỘ / THOÁT**.
- Khi người dùng chủ động mở menu sidebar (chiều rộng 258px trên màn 360px): Sidebar chiếm 72% chiều ngang màn hình nhưng có nút thu gọn `‹` rõ ràng ở góc trên cùng bên phải để đóng lại bất kỳ lúc nào.

---

### 3. Kiểm tra tính tách biệt: Đi một lượt 2.2 Lab 1 trong B8

- **Thực nghiệm:** Truy cập tiến trình IT Silver -> Kỳ 2.2 (Chuyên ngành) -> Bài Lab 1 (`CSE 103`) tại phòng máy 406.B8.
- **Mã nguồn bảo vệ:** Trong `src/ui/interior/LibraryHud.tsx` (dòng 157 & 226):
  ```tsx
  const isLibrary = Boolean(walkMode && interior?.buildingId.toLowerCase() === 'b4');
  if (!isLibrary) return null;
  ```
- **Kết quả kiểm tra thực tế trong phòng 406.B8:**
  - `document.querySelector('[aria-label="Menu tham quan Thư viện EIU"]')` trả về `null`.
  - Toàn bộ thanh đổi tầng, sơ đồ mini, nút Dịch vụ thư viện hoàn toàn **BIẾN MẤT 100%** (xem ảnh `18-2.2-lab1-b8-no-library-hud.jpg`).
  - Giao diện phòng học 406.B8 hoàn toàn sạch sẽ, chỉ hiển thị HUD điều khiển của lớp học và bài giảng CSE 103, không bị lẫn bất kỳ thành phần nào của Thư viện B4.

---

### Danh sách ảnh minh chứng Phần 4:
| STT | Tên file ảnh | Dung lượng | Mô tả nội dung kiểm tra thực tế |
|---|---|---|---|
| 15 | `15-b4-library-floor1-1440.jpg` | 112 KB | Thư viện B4 Tầng 1 (Desktop 1440×900): Sảnh chính, menu tham quan bên trái, sơ đồ SVG mini góc phải, thanh chuyển tầng. |
| 16 | `16-b4-library-services-modal.jpg` | 62 KB | Thư viện B4 (1440×900): Modal "Dịch vụ & Tiện ích Thư viện EIU" mở với 5 tab nghiệp vụ chuẩn. |
| 17 | `17-b4-library-360x780.jpg` | 88 KB | Thư viện B4 trên Mobile 360×780: Nút chuyển tầng và công cụ bố trí ở `bottom-44`, không đè nút thoát/đi bộ. |
| 18 | `18-2.2-lab1-b8-no-library-hud.jpg` | 62 KB | Phòng máy 406.B8 (Kỳ 2.2 Lab 1): Bảng thư viện B4 hoàn toàn không hiển thị, đảm bảo tính tách biệt tuyệt đối. |

---

## PHẦN 5 — THỬ NGHIỆM ĐI BỘ BẰNG PHÍM GIỮ (ORCA CLI & DOM EVENT)

### 1. Phân tích khả năng gửi phím giữ của Orca CLI
Yêu cầu kiểm tra: Thử nghiệm đi bộ bằng phím giữ từ ngoài trời vào sảnh B8, đi thang máy lên tầng 4 và đến phòng 406.

#### A. Các lệnh Orca CLI đã thử nghiệm
1. **Lệnh `orca keydown`:**
   - Cú pháp thử: `orca keydown --key w --page b536091b-0874-42ec-a45c-d757b924aea4`
   - **Kết quả:** Thất bại. Lỗi CLI: `Unknown command: keydown`. Orca không hỗ trợ lệnh `keydown` độc lập.
2. **Lệnh `orca keypress`:**
   - Cú pháp thử: `orca keypress --key w --page b536091b-0874-42ec-a45c-d757b924aea4`
   - Tra cứu tham số `orca keypress --help`: Hoàn toàn **không có cờ `--duration` hay `--hold`**.
   - **Đo đạc thời gian thực tế bằng `performance.now()`:**
     - Thiết lập listener bắt sự kiện trên window:
       ```json
       {
         "events": [
           { "type": "keydown", "key": "w", "time": 28593.899 },
           { "type": "keyup", "key": "w", "time": 28594.000 }
         ],
         "durationMs": 0.100
       }
       ```
     - **Phân tích:** Lệnh `orca keypress` gửi cặp sự kiện `keydown` và `keyup` trong vòng đúng **0.100 ms (100 micro-giây)**.
     - Trong khi đó, chu kỳ khung hình đồ họa 60 FPS là **16.66 ms / frame**.
     - Trong `src/scene/walk/WalkMode.tsx` (dòng 445 và 483):
       ```ts
       const onKeyDown = (event: KeyboardEvent) => keys.current.add(event.key.toLowerCase());
       const onKeyUp = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
       ```
     - Cả hai sự kiện `keydown` và `keyup` đều được trình duyệt xử lý xong trong cùng một microtask trước khi hàm callback `useFrame` của React Three Fiber được gọi ở frame kế tiếp. Do đó `keys.current.has('w')` luôn trả về `false`, nhân vật **đứng yên 100% tại chỗ**, không nhích được một milimet nào.
     - Muốn nhân vật di chuyển 50 mét ở tốc độ 4 m/s cần tối thiểu 12.5 giây giữ phím liên tục (tương đương 750 frames). Việc spam lệnh `orca keypress` liên tục là bất khả thi (sẽ gây timeout lệnh và nghẽn tiến trình).

#### B. Thử nghiệm giả lập giữ phím bằng `orca eval` (DOM KeyboardEvent)
- Thử nghiệm gửi sự kiện giữ phím qua script trình duyệt:
  ```ts
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', code: 'KeyW', bubbles: true }));
  // Giữ trong 1500 ms rồi mới keyup
  setTimeout(() => {
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w', code: 'KeyW', bubbles: true }));
  }, 1500);
  ```
- **Kết quả:** Khi giữ qua `setTimeout`, Set `keys.current` duy trì được phím `'w'` trong suốt 90 frames, nhân vật di chuyển tiến lên bình thường quãng đường ~6.0 mét.

#### C. Lộ trình thực tế từ ngoài trời vào 406.B8
1. **Từ ngoài trời vào B8:**
   - Đi bộ tiếp cận cửa sảnh B8 tại mặt bằng trung tâm.
   - Khi đứng trong bán kính 2.5m trước cửa, trigger tương tác cửa ngoại thất hiện nút `E Ra ngoài / Vào trong`.
   - Nhấn phím `E` kích hoạt `interactive.type === 'exterior-door'`, gọi `useWalkStore.getState().enterInterior('b8')` để nạp nội thất Tầng 1 B8.
2. **Từ sảnh tầng 1 vào thang máy:**
   - Đi dọc sảnh giữa Tầng 1 tới vị trí thang máy trung tâm (cạnh thang bộ).
   - Tiếp cận cửa thang máy, nhấn phím `E` kích hoạt event `campussim:open-elevator`.
   - Bảng chọn tầng hiện lên, chọn `Tầng 4` (gọi `setInteriorFloor(4)`).
3. **Từ thang máy tầng 4 tới phòng 406:**
   - Ra khỏi cửa thang máy Tầng 4, đi dọc theo hành lang phía Bắc.
   - Tới trước biển phòng `406.B8` (phòng máy thực hành CSE).
- **Kết luận mục 5:** Orca CLI chưa có cơ chế giữ phím native (`--duration` hoặc `keydown/keyup` riêng biệt). Việc di chuyển qua lại giữa các phòng trên thực tế phụ thuộc vào người dùng điều khiển bằng bàn phím vật lý hoặc các nút điều hướng waypoint / teleport trên giao diện.

---

## TỔNG KẾT BÁO CÁO KIỂM PHỤ 3D (SUMMARY FOR COORDINATOR)

### 1. Bản chất và Nguyên nhân che hình (Phần 1a & 1b)

| Hiện tượng | Bản chất khối che | Tọa độ & Số đo thực tế | Dòng code & Nguyên nhân cốt lõi | Cách sửa đề xuất |
|---|---|---|---|---|
| **1a. Ngồi ở 406.B8 (Lab 1)** | Thân, gáy và vai của model nhân vật người chơi (`character-male-a`) | Camera đặt tại `[y: 1.55, z_offset: +0.65]`. Model người chơi cao 1.6m nằm ngay cự ly 0.4–0.68m trước ống kính | `src/silverWorld/seatAnchor.ts` (dòng 71–76) và `src/scene/walk/WalkMode.tsx` (dòng 676). Ở góc nhìn Sau vai (`viewMode = 0`), `body.current.visible` vẫn bật `true` dù đang ngồi | Trong `WalkMode.tsx` dòng 676: Khi đang ngồi (`if (seat)`), ép `body.current.visible = false` như FPS, hoặc dời camera lùi xa hơn 1.2m và lệch phải 0.35m |
| **1a. Ngồi ở 206.B8 (Phần nghe)** | Thân người chơi (viewMode 0) và Đầu của NPC hàng trước (viewMode 1) | Ghế ngồi là `206-r2-s4`. Ghế ngay trước mặt là `206-r1-s4` (cách 1.0m) có NPC ngồi | `src/data/silver/classrooms.json` gán NPC vào ghế `206-r1-s4`. Khi chuyển sang FPS, đầu NPC hàng trước nhô lên che màn chiếu | Bỏ ghế `206-r1-s4` khỏi danh sách NPC `crowd` trong `classrooms.json` để hàng ghế trước người chơi luôn trống |
| **1b. entrance/meet-thanh** | Mái phẳng hành lang nối B8–B11 màu trắng kem `#e2e8f0` | Thành: `[17.91, -164.85]`; Người chơi: `[17.63, -166.02]`; Camera: `[15.79, 3.45, -173.80]`; Mái hành lang: `y = 3.04m` | `src/scene/zone2/Zone2Walkways.tsx` (dòng 20–30) và `WalkMode.tsx` (dòng 936–941). Camera ở `y = 3.45m` nằm trên nóc mái nhìn xuống Thành ở `y = 0.05m`, bị tấm mái che trực diện | Hạ độ cao camera hoặc dời vị trí gặp Thành ra khỏi phạm vi dưới mái hành lang nối |

---

### 2. Danh sách lỗi mới phát hiện kèm bước tái hiện

1. **Lỗi đè phím điều khiển ảo Joystick và nút Thoát đi bộ lên nút bài học (Mobile 360×780):**
   - *Bước tái hiện:* Mở app ở kích thước 360×780 -> Vào bất kỳ bài học nào (ví dụ 2.2 Lab 1 hoặc entrance) -> Tại bước Thoại (`say`), nút "Thoát đi bộ" đè trực tiếp lên nút vàng "Tiếp ›"; Cần joystick ảo đè card thoại. Tại bước Câu hỏi (`question`), joystick đè lên đáp án số 3.
   - *Vị trí code:* `src/ui/walk/WalkHud.tsx` không ẩn điều khiển khi `seated = true` hoặc khi đang có `activity`.
2. **Lỗi tràn thanh Header Banner trên mobile 360px:**
   - *Bước tái hiện:* Mở bài học ở cỡ 360px.
   - *Hậu quả:* Hàng nút trên cùng bị co kéo, chữ "Bước 1/6" bị cắt cụt và đè nút "Đứng dậy", tiêu đề bài học bị thu gọn thành một chữ cái.
3. **Lỗi thiếu `event.preventDefault()` khi bắt sự kiện `webglcontextlost`:**
   - *Bước tái hiện:* Gọi `gl.getExtension('WEBGL_lose_context').loseContext()` rồi gọi `restoreContext()`.
   - *Vị trí code:* `src/ui/silver/presentation.ts` (dòng 48 và 66). Thiếu `event.preventDefault()` khiến trình duyệt hủy vĩnh viễn ngữ cảnh GPU theo spec WebGL, không bao giờ khôi phục được.
4. **Lỗi `SecurityError` khi truy cập `sessionStorage` không bọc `try/catch`:**
   - *Bước tái hiện:* Chặn Storage trong trình duyệt (`Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('Access denied', 'SecurityError'); } })`) -> Bấm nút "Chế độ góp ý" (`toggleReviewMode`).
   - *Hậu quả:* Ném lỗi `Uncaught SecurityError: Access is denied for this document`.
   - *Vị trí code:* `src/App.tsx` dòng 29 và dòng 44.
5. **Lỗi thiếu React `ErrorBoundary` bao bọc `<Canvas>`:**
   - *Vị trí code:* `src/App.tsx` dòng 49. Nếu thiết bị không hỗ trợ WebGL, Three.js crash làm sập toàn bộ app (trắng trang), người dùng không thể xem được cả giao diện 2D.

---

### 3. Danh sách mục chưa kiểm tra / Hạn chế môi trường
- **Đi bộ dài bằng phím giữ qua Orca CLI native:** Không thực hiện được hoàn toàn bằng lệnh native do Orca CLI chỉ hỗ trợ `orca keypress` tức thời (xung nhịp 0.1 ms), thiếu cờ `--duration` hoặc lệnh `keydown/keyup` riêng. Đã kiểm chứng thành công bằng DOM Events và dịch chuyển pose.
- **FPS / Hiệu năng khung hình:** Không ghi nhận theo đúng quy tắc kiểm thử nghiêm ngặt của dự án ("Không ghi FPS").


---

