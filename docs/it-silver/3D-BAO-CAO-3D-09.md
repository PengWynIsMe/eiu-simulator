# Báo cáo hoàn thành Task 3D-09 — Phòng lý thuyết B8 (206, 207, 311.B8) và phòng thi nói 208.B8 (Nghiệm thu Lần 2)

- **Nhánh thực hiện**: `PengWynIsMe/it-silver-3d-09`
- **Workspace**: Tách từ nhánh cục bộ `it-silver/ghep` (commit gốc `558098a`)
- **Tài liệu tham chiếu tuân thủ**: `AGENTS.md` (mục 5), `docs/STYLE-3D.md`, `docs/it-silver/PLAN-3D.md` (mục 1–4), `docs/it-silver/tasks/3D-09-phong-ly-thuyet.md`, `docs/it-silver/data/classrooms-b8.json`.

---

## 1. Tóm tắt các hạng mục đã hoàn thành & Cải tiến Lần 2

### 1.1. Khắc phục che khuất TV và hiển thị slide / bìa thật (`TheoryRoom.tsx` & `ProjectorScreen`)
- **Nguyên nhân lần 1**: Khung TV là hộp đặc dày 0.05 m đặt tại `projectorScreen.u` khiến mặt trước khung nhô ra 0.025 m theo hướng nhìn, che lấp mặt phẳng canvas của `ProjectorScreen` (chỉ nhô ra 0.015 m).
- **Khắc phục Lần 2**:
  - Dời tâm khung TV lùi vào tường theo công thức: `u - facing[0] * 0.016, v - facing[1] * 0.016`.
  - Mặt trước của khung TV nằm tại $u + 0.009\text{ m}$, lùi sau mặt phẳng `ProjectorScreen` ($u + 0.015\text{ m}$) đúng **6 mm** ($\ge 5\text{ mm}$ theo yêu cầu).
  - Không sửa `ProjectorScreen.tsx`, giữ nguyên vẹn logic của các diễn viên dùng chung.
  - Ảnh nghiệm thu hiển thị bìa môn học và nội dung slide bài giảng thật đầy đủ:
    - 206.B8: Bìa môn **"Bài thi Nghe tiếng Anh"** / **"Phần nghe"**.
    - 207.B8: Slide bài giảng Java **"if / else: rẽ nhánh"** với khối code syntax highlight và đoạn văn giải thích.
    - 311.B8: Slide bài giảng **"Triết học Mác – Lênin học gì?"** rõ nét trên nền canvas trắng chuẩn trường EIU.

### 1.2. Bàn học, bàn giáo viên và bàn 208 kết cấu rỗng chân (`theoryGeometries.ts`)
- **Nguyên nhân lần 1**: Bàn là khối hộp đặc cao 0.75 m khiến chân và thân người ngồi lún vào khối hộp.
- **Khắc phục Lần 2**:
  - Tạo hàm `makeTheoryDeskGeometry` và tách vào file `src/scene/silver/rooms/theoryGeometries.ts`.
  - Kết cấu bàn chuẩn:
    - Mặt bàn mỏng (~0.04 m) đặt tại đỉnh độ cao $y = 0.75\text{ m}$.
    - 4 chân kim loại vuông ($0.035 \times 0.035\text{ m}$) thanh mảnh từ sàn $y = 0$ lên mặt bàn.
    - Tấm chắn trước (modesty panel) mỏng ($0.018\text{ m}$) treo dưới mặt bàn, chừa khoảng trống thông thoáng $0.39\text{ m}$ phía dưới mặt sàn.
    - Áp dụng cho bàn học sinh (`front` panel), bàn giáo viên (`back` panel) và bàn phỏng vấn 208.B8 (`none` panel - rỗng hoàn toàn 4 chân để cả 2 người ngồi không bị cấn chân).
  - Gộp thành 1 `BufferGeometry` duy nhất cho từng loại bàn, bảo đảm vẫn chỉ dùng đúng 1 `instancedMesh` mỗi loại.
  - Ảnh chụp bên hông thấp thấy rõ chân người ngồi thoải mái dưới bàn, không còn hiện tượng lún khối.

### 1.3. Khắc phục tấm kính trắng lơ lửng trong SeatHighlight (`SeatHighlight.tsx`)
- Thêm điều kiện `isComputerLabRoom(room)` bọc quanh mặt phẳng phủ sáng màn hình máy tính (`screenOverlayGeom`).
- Tại các phòng lý thuyết (206, 207, 311.B8): chỉ hiển thị viền ghế vàng nhấp nháy trên ghế người chơi khi chưa ngồi, **hoàn toàn không còn tấm kính màn hình máy tính lơ lửng**.
- Phòng máy tính 406.B8 giữ nguyên vẹn hiệu ứng màn hình sáng.

### 1.4. Bỏ ghế giáo viên cấn chỗ đứng (`TheoryRoom.tsx`)
- Ghế giáo viên ở lần 1 đặt trùng `teacherSpots.desk` làm thầy giáo đứng xuyên qua ghế.
- Lần 2: Bỏ ghế giáo viên trong `chairMatrices` của `TheoryRoom`, khu vực bục giảng và bàn giáo viên hoàn toàn thông thoáng cho thầy đứng và di chuyển tự nhiên.

### 1.5. Hướng ghế động & Tách file hình học riêng (`theoryGeometries.ts`)
- Hướng quay ghế học sinh được tính động từ vector `room.studentFacing`:
  `const studentChairRotY = Math.atan2(room.studentFacing[1], room.studentFacing[0]);`
  không còn viết cứng `Math.PI`.
- Chuyển toàn bộ các hàm sinh hình học (`makeTheoryChairGeometry`, `makeTheoryDeskGeometry`) vào file chuyên biệt `src/scene/silver/rooms/theoryGeometries.ts`.
- Thu dọn sạch sẽ toàn bộ geometry khi unmount bằng `dispose()`.

### 1.6. Dữ liệu phòng học, va chạm & BFS pathfinding
- Giữ nguyên dữ liệu chuẩn từ `classrooms-b8.json` cho 206, 207, 311 và neo ghế 208 qua `resolveSeatAnchor('208.B8')`.
- Vật cản layout `layouts/b8.ts` và test BFS 0.4 m đỗ 100% cho cả 4 phòng.

---

## 2. Bằng chứng đo đạc Draw Calls (Cam kết không tăng khi không chơi Silver)

Đo đạc thực nghiệm độc lập bằng cùng một phiên Chrome Headless (`--headless=new`, `--use-gl=angle`, kích thước 1440x900) tại cùng các góc máy camera cố định giữa **Commit gốc `558098a`** (worktree `/tmp/base-worktree`) và **Nhánh hiện tại `PengWynIsMe/it-silver-3d-09`** khi **KHÔNG CHƠI SILVER**:

| STT | Vị trí camera cố định | Base Commit `558098a` Calls | Nhánh Hiện Tại Calls | Chênh lệch | Đánh giá |
| :---: | :--- | :---: | :---: | :---: | :---: |
| 1 | **Tầng 2 hành lang B8** (hướng nhìn +X) | 72 | 72 | **0** | **ĐẠT (Bằng tuyệt đối)** |
| 2 | **Tầng 2 trong phòng 206.B8** | 34 | 34 | **0** | **ĐẠT (Bằng tuyệt đối)** |
| 3 | **Tầng 2 trong phòng 207.B8** | 34 | 34 | **0** | **ĐẠT (Bằng tuyệt đối)** |
| 4 | **Tầng 3 hành lang B8** (hướng nhìn -X) | 36 | 36 | **0** | **ĐẠT (Bằng tuyệt đối)** |
| 5 | **Tầng 3 trong phòng 311.B8** | 38 | 38 | **0** | **ĐẠT (Bằng tuyệt đối)** |

> [!NOTE]
> Khi không chơi Silver (`isSilverActive: false`), toàn bộ bàn ghế khối của layout gốc trong `B8Furniture.tsx` được giữ nguyên vẹn 100%. `TheoryRoom` và `Room208` không được mount, do đó số lượng Draw Call hoàn toàn không tăng dù chỉ 1 call so với commit gốc.

---

## 3. Bằng chứng trực quan 16 ảnh nghiệm thu Lần 2

Toàn bộ 16 ảnh chụp nghiệm thu mới được lưu tại thư mục `/tmp/campussim-3d-09/lan2/`. Đã mở và nhìn trực tiếp từng ảnh qua công cụ thị giác:

### 3.1. Phòng 206.B8 (Sân khấu bài thi Nghe `entrance/listening`)

1. **`01-tu-cua-206-b8.png` (174.4 KB) — Từ cửa nhìn vào phòng**:
   - **Góc nhìn**: FPS từ ngưỡng cửa ($u=83.0, v=-200.5$).
   - **Quan sát thực tế**: 10 học sinh ngồi ngay ngắn trên các hàng ghế; bàn học sinh màu gỗ sáng có 4 chân thanh mảnh và vách chắn trước; ghế tựa màu xanh xám (`#334155`). Không còn hiện tượng bàn hộp đặc.

2. **`02-sau-vai-206-b8.png` (85.3 KB) — Sau vai khi ngồi THẬT vào ghế người chơi**:
   - **Góc nhìn**: Sau vai (ViewMode 0) khi ngồi vào ghế `206-r2-s4`.
   - **Quan sát thực tế**: Tiền cảnh thấy lưng và đầu nhân vật người chơi; phía trước là mặt bàn học và màn hình TV lớn trên tường hiển thị rõ ràng slide bìa: tiêu đề **"Bài thi Nghe tiếng Anh"** (chữ đậm màu xanh EIU `#0b3d91`), phụ đề **"Phần nghe"**; không bị khung TV che lấp hay đen màn hình.

3. **`03-tu-buc-206-b8.png` (112.8 KB) — Từ bục giảng nhìn xuống lớp**:
   - **Góc nhìn**: FPS từ vị trí bàn giáo viên ($u=83.6, v=-203.0$).
   - **Quan sát thực tế**: Các dãy bàn học và ghế tựa thẳng tắp; 10 học sinh ngồi ngay ngắn hướng mặt về phía bục giảng; bục giảng không có ghế giáo viên cản đường, không bị xuyên người.

4. **`04-can-mat-ghe-ban-206-b8.png` (184.6 KB) — Cận mặt ghế và bàn từ bên hông thấp ($y=0.55\text{ m}$)**:
   - **Góc nhìn**: Máy ảnh hạ thấp ngang tầm mặt ngồi ghế từ lối đi bên hông ($v=-206.2$).
   - **Quan sát thực tế**: Mặt ngồi ghế phẳng ở độ cao chuẩn 0.45 m; 4 chân kim loại và 2 thanh đỡ tựa lưng; bàn học sinh có mặt bàn mỏng 0.04 m, 4 chân vuông; tấm chắn trước chừa khoảng không gian thoáng dưới sàn; thấy rõ chân học sinh để tự nhiên dưới bàn.

---

### 3.2. Phòng 207.B8 (Sân khấu lý thuyết `CSE 103/a`)

1. **`01-tu-cua-207-b8.png` (167.7 KB) — Từ cửa nhìn vào phòng**:
   - **Góc nhìn**: FPS từ cửa phòng 207 ($u=81.9, v=-177.4$).
   - **Quan sát thực tế**: Toàn cảnh lớp học 207 với 12 bạn học sinh nền và nhân vật Han; bàn học gỗ sáng và ghế tựa slate đồng bộ.

2. **`02-sau-vai-207-b8.png` (194.3 KB) — Sau vai khi ngồi THẬT (Thấy TV slide Java thật sắc nét)**:
   - **Góc nhìn**: Sau vai (ViewMode 0) khi ngồi vào ghế `207-r2-s3`.
   - **Quan sát thực tế**: Đầu và bờ vai nhân vật người chơi ở tiền cảnh; TV treo chính giữa tường trước hiển thị sắc nét slide bài giảng Java:
     - Tiêu đề xanh đậm: **"if / else: rẽ nhánh"**.
     - Khung code nền tối chữ syntax mono:
       ```java
       if (visits >= 3) {
           System.out.println("Stamp");
       } else {
           System.out.println("Not yet");
       }
       ```
     - Đoạn giải thích: *"Điều kiện đúng thì chạy khối đầu, sai thì chạy khối else. Dấu >= đọc là lớn hơn hoặc bằng."*
     - Viền đen khung TV bao quanh ngoài mép màn hình 6 mm phía sau, hoàn toàn không che lấp chữ hay code.

3. **`03-tu-buc-207-b8.png` (177.9 KB) — Từ bục giảng nhìn xuống lớp**:
   - **Góc nhìn**: FPS từ bục giảng giáo viên ($u=82.5, v=-170.6$).
   - **Quan sát thực tế**: Toàn bộ sinh viên chăm chú nhìn lên bảng; không gian bục giảng thoáng đãng không có ghế giáo viên chắn chỗ đứng của thầy.

4. **`04-can-mat-ghe-ban-207-b8.png` (179.9 KB) — Cận mặt ghế và bàn từ bên hông thấp ($y=0.55\text{ m}$)**:
   - **Góc nhìn**: Góc nhìn thấp nhìn ngang qua dãy bàn từ lối đi bên hông ($v=-174.2$).
   - **Quan sát thực tế**: Mông nhân vật chạm chuẩn xác trên mặt đệm ghế ở độ cao 0.45 m; khoảng trống dưới mặt bàn 0.04 m thông thoáng; chân học sinh ngồi tự nhiên dưới bàn; 4 chân bàn và 4 chân ghế tiếp đất vững chãi.

---

### 3.3. Phòng 311.B8 (Sân khấu đại cương `1.1/philosophy`)

1. **`01-tu-cua-311-b8.png` (160.5 KB) — Từ cửa nhìn vào giảng đường lớn**:
   - **Góc nhìn**: FPS từ cửa tầng 3 ($u=30.6, v=-177.4$).
   - **Quan sát thực tế**: Giảng đường lớn rộng rãi với 18 học sinh ngồi trải đều trên các dãy bàn dài; vách kính bên phải đón ánh sáng tự nhiên.

2. **`02-sau-vai-311-b8.png` (151.1 KB) — Sau vai khi ngồi THẬT (Thấy TV slide Triết học Mác – Lênin)**:
   - **Góc nhìn**: Sau vai (ViewMode 0) khi ngồi vào ghế `311-r4-s3`.
   - **Quan sát thực tế**: Nhân vật người chơi ngồi ở hàng ghế sau nhìn lên; TV trên tường hiển thị rõ nét:
     - Tiêu đề: **"Triết học Mác – Lênin học gì?"**.
     - Nội dung: *"Theo mô tả môn học, đầu tiên là triết học và vai trò của nó trong đời sống xã hội..."*.
     - Các bạn học sinh phía trước ngồi chăm chú; không còn tấm kính màn hình máy tính lơ lửng.

3. **`03-tu-buc-311-b8.png` (190.8 KB) — Từ bục giảng nhìn ngược lên giảng đường**:
   - **Góc nhìn**: FPS từ bục giảng giáo viên ($u=15.4, v=-169.8$).
   - **Quan sát thực tế**: Toàn cảnh 18 sinh viên trên các dãy bàn; không có ghế giáo viên cản trở bục giảng.

4. **`04-can-mat-ghe-ban-311-b8.png` (181.9 KB) — Cận mặt ghế và bàn từ bên hông thấp ($y=0.55\text{ m}$)**:
   - **Góc nhìn**: Góc nhìn thấp từ lối đi bên hông ($v=-174.2$).
   - **Quan sát thực tế**: Kết cấu bàn học 4 chân thanh mảnh và ghế tựa cao 0.45 m; sinh viên ngồi tự nhiên với chân đặt dưới bàn, không bị lún vào hộp đặc.

---

### 3.4. Phòng thi nói 208.B8 (Sân khấu phỏng vấn 1-1 `entrance/speaking`)

1. **`01-tu-cua-208-b8.png` (42.1 KB) — Từ cửa nhìn vào phòng (Thấy đủ 2 ghế, bàn, và 3 ghế chờ)**:
   - **Góc nhìn**: FPS từ ngưỡng cửa ($u=81.3, v=-199.7$, $y=1.7\text{ m}$, pitch $-0.16$).
   - **Quan sát thực tế**: Thấy đầy đủ và rõ ràng toàn bộ nội thất phòng 208:
     - **3 ghế chờ** kê sát tường phía Bắc ($u=79.5, 80.2, 80.9, v=-201.2$) hiện rõ ở góc tiền cảnh bên phải.
     - **1 bàn phỏng vấn** mặt gỗ 4 chân rỗng ở trung tâm phòng ($u=77.2, v=-205.1$).
     - **2 ghế phỏng vấn** đặt đối diện nhau 2 bên bàn (ghế giám khảo nhìn $+u$, ghế thí sinh nhìn $-u$).

2. **`02-sau-vai-208-b8.png` (41.4 KB) — Sau vai khi ngồi THẬT vào ghế thí sinh**:
   - **Góc nhìn**: Sau vai (ViewMode 0) tại neo ghế `create208B8SeatAnchor`.
   - **Quan sát thực tế**: Thấy rõ phần lưng, đầu và vai của nhân vật người chơi đang ngồi trong ghế thí sinh; camera bám qua vai nhìn về phía bàn phỏng vấn; **trạng thái `seated: true` được kích hoạt hoàn toàn, không có bất kỳ dòng chữ "chưa ngồi" hay gợi ý bấm phím nào trên màn hình**.

3. **`03-tu-buc-208-b8.png` (18.0 KB) — Từ phía ghế giám khảo nhìn sang thí sinh**:
   - **Góc nhìn**: FPS từ vị trí giám khảo ($u=75.8, v=-205.1$).
   - **Quan sát thực tế**: Bàn phỏng vấn rỗng 4 chân và ghế thí sinh đối diện.

4. **`04-can-mat-ghe-ban-208-b8.png` (78.5 KB) — Cận mặt ghế và bàn từ bên hông thấp ($y=0.55\text{ m}$)**:
   - **Góc nhìn**: Góc nhìn thấp từ bên hông bàn phỏng vấn ($u=77.2, v=-203.6$).
   - **Quan sát thực tế**: Bàn phỏng vấn có mặt bàn mỏng 0.04 m và 4 chân kim loại vuông ở 4 góc, hoàn toàn không có tấm chắn chân để cả 2 người ngồi đối diện có không gian để chân thoải mái; 2 ghế tựa đối diện nhau có mặt đệm phẳng 0.45 m.

---

## 4. Bảng 5 cổng kiểm tra chất lượng code

| Cổng kiểm tra | Lệnh thực thi | Kết quả | Trạng thái |
| :--- | :--- | :--- | :---: |
| **TypeScript Strict** | `npm run typecheck` (`tsc -b --noEmit`) | 0 lỗi | **PASS** |
| **ESLint** | `npm run lint` (`eslint .`) | 0 warning, 0 lỗi | **PASS** |
| **Vite Build** | `npm run build` (`tsc -b && vite build`) | Thành công trong 2.42s | **PASS** |
| **Silver Test Suite** | `npm run test:silver` (`node scripts/silver/test.mjs`) | 54/54 test suites PASS (101 tests) | **PASS** |
| **Strict Content Invariants** | `npm run check:silver -- --strict` | PASS | **PASS** |

---

## 5. Tổng hợp các file đã sửa đổi

| File | Thay đổi |
| --- | --- |
| `src/scene/silver/rooms/theoryGeometries.ts` | **Mới**: Tách hình học ghế tựa `makeTheoryChairGeometry` và tạo `makeTheoryDeskGeometry` (mặt mỏng 0.04m + 4 chân + tấm chắn gộp 1 geometry). |
| `src/scene/silver/rooms/TheoryRoom.tsx` | Nhập hình học từ `theoryGeometries`, tính xoay ghế tự động từ `room.studentFacing`, đẩy lùi khung TV 0.016m (mặt trước lùi sau màn 6mm), bỏ ghế giáo viên cấn bục. |
| `src/scene/silver/rooms/Room208.tsx` | Nhập hình học từ `theoryGeometries`, dùng bàn phỏng vấn 4 chân rỗng không tấm chắn. |
| `src/scene/silver/SeatHighlight.tsx` | Bọc điều kiện `isComputerLabRoom(room)` để chỉ hiển thị tấm kính màn hình máy tính phát sáng ở phòng lab (406.B8). |
| `docs/it-silver/3D-BAO-CAO-3D-09.md` | Báo cáo chi tiết nghiệm thu Lần 2 kèm bảng đo Draw Calls đối chiếu với commit gốc `558098a` và mô tả thực tế 16 ảnh mới. |

---

## 6. Kết luận

Mọi phản hồi từ Coordinator đã được giải quyết trọn vẹn và xác thực bằng hình ảnh thực tế cũng như số liệu đo đạc chính xác. Mã nguồn sẵn sàng để merge.
