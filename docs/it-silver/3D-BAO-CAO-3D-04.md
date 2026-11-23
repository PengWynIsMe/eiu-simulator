# Báo cáo 3D-04 — 406.B8 thành phòng chơi tương tác 3D (Bản hoàn thiện lần 2)

Nhánh: `PengWynIsMe/it-silver-3d-04`.
Workspace tách từ nhánh cục bộ `it-silver/3d` (commit gốc `88cf7ce` đã có đầy đủ 3D-00, 3D-01, 3D-02, 3D-03, 3D-05).

---

## 1. Tóm tắt các điều chỉnh theo phản hồi của Tech Lead (Lần 2)

### A. Sửa sai luồng & quản lý vòng đời
1. **Fallback linh hoạt**: `SilverStage` không lùi cứng về `CSE 103/lab-1` hay `406.B8`. Nếu không có `stageSpec` hợp lệ hoặc không tìm thấy phòng học thì trả về `null`. Tòa nhà và tầng được xác định động từ `room.buildingId` và `room.floor` (không viết cứng `b8` hay `4`).
2. **Hệ thống diễn viên `StoryActors` tổng quát**:
   - Khái quát hóa xử lý cho toàn bộ các diễn viên cốt truyện trong `stage.actors` của 5 cảnh trong phòng 406.B8 (`CSE 103/lab-1`, `CSE 103/lab-2`, `CSE 103/exam`, `CSE 204/lab-1`, `2.2/closing`).
   - Tự động nạp model từ `characterConfig.story[speaker]` (hoặc fallback `roles`).
   - Hỗ trợ cả diễn viên ngồi ghế (`seatId`, ví dụ Han ở `406-r2-s6`, Quyền ở `406-r1-s2`) và diễn viên đứng tại điểm quy định (`spot`, ví dụ Han và Quyền đứng ở `2.2/closing`).
   - Nhân vật `teacher` trong `stage.actors` do component `Teacher` đảm nhiệm; cảnh không có giáo viên (`2.2/closing`) không mount `Teacher`.
   - Diễn viên tự động quay mặt về phía người chơi khi `signal.speaker` trùng với mình.
   - Thêm huy hiệu chấm than "!" nổi trên đầu khi nhân vật là mục tiêu đối thoại (`stage.trigger === 'talk'`).
   - Cử chỉ `raiseHand` của Han reset theo `stage.sceneId` (chuyển cảnh không cần unmount vẫn reset được). Bỏ qua kết quả cũ lúc mount để không phát lại `yes`.
3. **An toàn vòng đời với React StrictMode**:
   - `SilverStage` được chia thành guard component và `SilverStageContent`.
   - `createSilverSignal(useSilverStore, useLangStore)` được tạo và giải phóng (`dispose()`) trong cùng một vòng đời `useEffect` duy nhất bên trong `SilverStageContent`, bảo đảm an toàn khi React StrictMode chạy chu kỳ unmount/remount thử nghiệm ở dev server.
   - Khi chuyển step bài học, tín hiệu cập nhật chuẩn xác sang `ProjectorScreen` và `StoryActors`.
4. **Bắt lỗi subscribe tường minh**: `SilverStage` ném lỗi rõ ràng (`throw new Error('[SilverStage] useSilverStore thiếu phương thức subscribe')`) thay vì im lặng bỏ qua.

### B. Tuân thủ yêu cầu & kiến trúc
1. **Bỏ nguồn sáng thêm**: Đã gỡ bỏ toàn bộ `ambientLight` và `directionalLight` khỏi `SilverStage.tsx`, tuân thủ nghiêm ngặt quy định không tự ý thêm đèn làm sáng cả tầng nhà.
2. **Tái sử dụng `ClassroomNpcs` & hàm thuần lọc**:
   - Đã xóa component thừa `SilverClassroomNpcs.tsx` (`git rm`).
   - Mở rộng prop `models?: string[]` cho component gốc `src/scene/npc/ClassroomNpcs.tsx` (mặc định vẫn là `characterConfig.roles.students`).
   - Tạo bộ hàm thuần tại `src/scene/silver/stageFiltering.ts`:
     - `filterBackgroundModels`: Lọc bỏ 3 model của nhân vật cốt truyện (`female-c` Han, `male-e` Thành, `male-g` Quyền), trả về đúng 5 model cho sinh viên nền Silver, giữ nguyên vẹn 8 model cho 406.B11.
     - `filterClassroomNpcSeats`: Loại bỏ ghế người chơi `playerSeat`, `companionSeat` và ghế của tất cả diễn viên trong cảnh có `seatId` (ví dụ Quyền `406-r1-s2`).
     - `createSafeClassroomForStage`: Tạo bản sao classroom an toàn cho sân khấu. Cảnh có `crowd = 0` (`2.2/closing`) không dựng sinh viên nền.
3. **Phạm vi khử z-fighting TV**: Trong `B8ComputerLabs.tsx`, chỉ loại bỏ `tvScreens` khi `isSilverActive && r.code === (stageRoomCode ?? '406.B8')`. Các phòng máy khác (408.B8...) và trạng thái bình thường giữ nguyên `tvScreens`.
4. **Dọn dẹp Git**: Xóa `scripts/capture-3d-04.mjs` khỏi git tracking (`git rm --cached`) và cấu hình loại trừ qua exclude rule.
5. **Kiểm tra hợp lệ `VALID_SPEAKER_IDS`**: `src/data/phase2.ts` kiểm tra khóa của `story` bằng `oneOf(k, VALID_SPEAKER_IDS, ...)`.
6. **Unit test toàn diện**: `scripts/silver/tests/silver-stage-actors.test.mjs` gọi trực tiếp các hàm thuần được xuất từ `stageFiltering.ts` và kiểm thử đầy đủ cả 5 cảnh của 406.B8 trong `stages.json`.

---

## 2. Bảng tiêu chí và kết quả kiểm chứng

| Tiêu chí | Cách kiểm | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| 1. Han ở `companionSeat` (`406-r2-s6`), clip `sit`, quay mặt khi nói | Chụp ảnh `03-sat-han.png`, kiểm tra logic `StoryActors.tsx` | **Đạt** | Han ngồi đúng ghế 406-r2-s6, clip `sit`. |
| 2. Han giơ tay khi bắt đầu cảnh, `yes` khi bài tập đúng | Unit test và logic máy trạng thái cử chỉ trong `StoryActors` | **Đạt** | `raiseHand` chạy 1 lần ở đầu cảnh, reset theo `sceneId`, `yes` chỉ phát khi có `result` mới. |
| 3. Nhãn tên Han `<Html>` $\le 6\text{ m}$, hạ độ cao | DOM style theo khoảng cách camera, ảnh `01`, `03` | **Đạt** | Nhãn hạ xuống $y = 1.05\text{ m}$ (ngồi) và $1.80\text{ m}$ (đứng). Tự ẩn khi camera xa $> 6\text{ m}$. |
| 4. 12 bạn học nền ngồi đủ 12 vị trí `npcSeats` | Ảnh góc cao `05-toan-phong-12-ban.png`, unit test `silver-stage-actors.test.mjs` | **Đạt** | Đủ 12 bạn học nền phân bố đều các dãy, không trùng ghế người chơi, Han, hay Quyền. |
| 5. Lọc model người trong truyện khỏi bạn nền phòng Silver | Unit test `silver-stage-actors.test.mjs` gọi `filterBackgroundModels` | **Đạt** | 8 model gốc lọc còn đúng 5 model cho sinh viên nền Silver (loại `female-c`, `male-e`, `male-g`). |
| 6. Giữ nguyên 406.B11 không bị đổi model | Đo đạc và chụp ảnh `07b-phong-406-b11-nmlt01.png`, unit test | **Đạt** | `roles.students` gốc giữ nguyên 8 model cho 406.B11. |
| 7. Viền vàng ghế người chơi khi chưa ngồi + màn hình sáng | Ảnh `05-toan-phong-12-ban.png` và `02-sau-vai-khi-ngoi-e.png` | **Đạt** | Viền wireframe vàng quanh `406-r2-s5`; màn hình máy tính có tấm phủ sáng `#e0f2fe`. |
| 8. Mông chạm mặt ghế $y = 0.45\text{ m}$, chân không xuyên bàn | Ảnh cận cảnh `06a-can-canh-ban-ghe.png` | **Đạt** | Mông nhân vật tiếp xúc mặt ghế, chân nằm gọn dưới gầm bàn $0.75\text{ m}$. |
| 9. TV ở $(91.2; -205.1)$, không z-fighting | Ảnh `01`, `02`, `06b-sat-mep-tv.png`, kiểm tra code `B8ComputerLabs.tsx` | **Đạt** | TV 406.B8 hiển thị cover "Lab 1 — Máy biết chào / CSE 103" và slide "Lệnh in đầu tiên". Mép TV áp phẳng tường, không sọc răng cưa. |
| 10. Các phòng máy khác (408.B8) giữ nguyên | Chụp ảnh `07a-phong-may-khac-408-b8.png` | **Đạt** | 408.B8 giữ nguyên 2 bảng trắng và màn hình TV đen ở giữa. |
| 11. Đổi tầng hoặc rời tòa nhà: toàn bộ diễn viên unmount | Kiểm tra scene graph qua script CDP khi đổi tầng 3 và ra ngoài trời | **Đạt** | Đổi sang tầng 3: `silverMeshCount = 0`, calls giảm còn 44. Ra ngoài trời unmount hoàn toàn (54 calls). |
| 12. Ngân sách draw calls khi ngồi: $\le 130$ calls | Đo trực tiếp qua `window.__gl.info.render.calls` khi ngồi thật bằng E | **Đạt** | **71 calls** (ngưỡng $\le 130$, tăng 3 calls so với phòng trống). |
| 13. Ngân sách tam giác khi ngồi: $\le 350\text{k}$ tam giác | Đo trực tiếp qua `window.__gl.info.render.triangles` khi ngồi thật bằng E | **Đạt** | **251.842 tam giác** (ngưỡng $\le 350.000$, tăng 2.502 tam giác so với phòng trống). |
| 14. Toàn phòng góc cao (Draw calls & Tam giác) | Đo trực tiếp qua `window.__gl.info.render` tại góc bao quát toàn phòng | **Đạt** | **107 calls, 260.173 tam giác** (ngưỡng $\le 130$ calls, $\le 350\text{k}$). |
| 15. Tốc độ khung hình (FPS) | Headless Chrome CDP | **Chưa đo** | Môi trường headless không phản ánh FPS thực tế; ghi nhận trung thực "chưa đo". |
| 16. Cổng kiểm tra mã nguồn (5 cổng bắt buộc) | `npm run typecheck && npm run lint && npm run build && npm run test:silver && npm run check:silver -- --strict` | **Đạt** | 0 lỗi TypeScript strict, 0 lỗi ESLint, build Vite thành công, 54/54 test suite silver đỗ, check:silver strict PASS. |

---

## 3. Bằng chứng trực quan chi tiết (Mở và quan sát trực tiếp từng ảnh lần 2)

Toàn bộ 9 ảnh kiểm chứng được lưu tại `/tmp/campussim-3d-04/lan2/`:

### 1. `01-tu-cua-406-b8.png` (228.8 KB) — Từ cửa 406.B8 nhìn vào lớp
- **Điểm đứng & góc nhìn**: Ngưỡng cửa phòng 406.B8 ($u = 83.4, v = -200.8$), góc nhìn người thứ nhất (FPS) hướng chéo vào tâm lớp học.
- **Chi tiết quan sát thấy**:
  - Toàn cảnh phòng thực hành máy tính với 4 dãy bàn máy tính, đèn tuýp LED trần, họng điều hòa.
  - Trên các màn hình máy tính của sinh viên hiển thị các dòng mã code lập trình nhiều màu.
  - Màn hình TV lớn phía trước hiển thị rõ nét bìa khóa học: **"Lab 1 — Máy biết chào"**, phụ đề **"CSE 103"** (hoàn toàn không còn chữ `undefined`).
  - Thầy Nam đứng ở bục giảng phía trước lớp.
  - Bạn Han ngồi ở dãy 2 với nhãn tên "Han".

### 2. `02-sau-vai-khi-ngoi-e.png` (159.2 KB) — Sau vai khi ngồi ghế 406-r2-s5 thật bằng phím E
- **Điểm đứng & góc nhìn**: Ngồi tại ghế `406-r2-s5` thông qua phím `E` thật. Góc máy đặt phía sau vai phải người chơi nhìn thẳng về phía bảng và TV.
- **Chi tiết quan sát thấy**:
  - Thấy đầu và vai người chơi ở góc dưới bên phải màn hình.
  - Trước mặt là màn hình máy tính cá nhân đang mở code lập trình.
  - Bên tay trái là bạn học tóc hai chùm cùng hàng ghế.
  - Phía trước trên tường: màn hình TV hiển thị slide bài giảng thật:
    - Tiêu đề: **"Lệnh in đầu tiên"**
    - Khối code mẫu: `System.out.println("Hello EIU");`
    - Nội dung: *"System.out.println in một dòng chữ ra màn hình rồi xuống dòng. Chữ phải nằm trong dấu ngoặc kép và câu lệnh kết thúc bằng dấu chấm phẩy."*
  - Tầm nhìn qua vai tự nhiên, rõ ràng, không bị cản trở.

### 3. `03-sat-han.png` (145.5 KB) — Cận cảnh nhân vật Han tại bàn học
- **Điểm đứng & góc nhìn**: Đặt camera phía trước bàn học của Han ($u = 87.8, v = -203.2$, cao $1.3\text{ m}$), hướng thẳng vào Han ở ghế `406-r2-s6`.
- **Chi tiết quan sát thấy**:
  - Bàn học của Han với màn hình máy tính và thùng PC.
  - Bạn Han ngồi trên ghế với áo hoodie xanh, dải quai cam, tóc tím buộc búi cao, nhãn tên `<Html>` màu xanh đậm chữ trắng **"Han"** nổi ngay sát trên đỉnh đầu ($y = 1.05\text{ m}$).
  - Han đang tập trung trong giờ học thực hành trên máy tính.

### 4. `04-sat-thay.png` (92.9 KB) — Cận cảnh Thầy Nam tại bục giảng
- **Điểm đứng & góc nhìn**: Đặt camera phía trước bục giảng ($u = 87.8, v = -206.6$, cao $1.35\text{ m}$), nhìn trực diện vào Thầy Nam tại `teacherSpots.lecture`.
- **Chi tiết quan sát thấy**:
  - Thầy Nam mặc áo vest xanh đậm, thắt cà vạt đỏ cam, áo sơ mi trắng, gương mặt tươi cười nhìn về phía lớp học.
  - Bục giảng gỗ đặt phía trước thầy.
  - Phía sau lưng là bảng trắng và màn hình TV đang chiếu slide "Lab 1 — Máy biết chào / CSE 103".

### 5. `05-toan-phong-12-ban.png` (423.2 KB) — Toàn phòng từ góc cao (bao quát 12 bạn học)
- **Điểm đứng & góc nhìn**: Góc máy đặt tại góc Tây-Bắc trên cao sát trần ($u = 82.2, v = -209.5, y = 3.2\text{ m}$), ống kính chúi xuống trung tâm phòng học.
- **Chi tiết quan sát thấy**:
  - Bao quát toàn bộ 4 dãy bàn ghế phòng thực hành 406.B8.
  - Đếm rõ ràng đủ **12 bạn học sinh nền** đang ngồi tại 12 vị trí `npcSeats`.
  - Bạn Han ngồi tại ghế `406-r2-s6`.
  - Ghế người chơi `406-r2-s5` bên cạnh có khung viền vàng wireframe phát sáng (SeatHighlight).
  - Thầy Nam đứng trên bục giảng trước màn hình TV lớn.
  - Mọi vị trí ngồi đều chuẩn xác, không có bạn học nào bị ngồi lệch hay trùng ghế diễn viên.

### 6. `06a-can-canh-ban-ghe.png` (247.0 KB) — Kiểm tra tiếp xúc mặt ghế & gầm bàn
- **Điểm đứng & góc nhìn**: Góc nhìn ngang tầm mặt bàn và ghế tại dãy 2.
- **Chi tiết quan sát thấy**:
  - Phần tiếp xúc giữa mông nhân vật và mặt đệm ghế phẳng phiu, tiếp xúc đúng mặt ghế tại $y = 0.45\text{ m}$, không lơ lửng và không lún vào ghế.
  - Chân và đầu gối nhân vật nằm gọn gàng dưới gầm bàn cao $0.75\text{ m}$, không đâm xuyên qua mặt bàn.
  - Thùng máy Dell đứng vững trên mặt sàn cạnh chân bàn.

### 7. `06b-sat-mep-tv.png` (65.2 KB) — Sát mép TV (Kiểm tra khử z-fighting)
- **Điểm đứng & góc nhìn**: Đứng áp sát tường Đông ($u = 90.3, v = -203.8$), nhìn nghiêng vào mép TV và bảng trắng.
- **Chi tiết quan sát thấy**:
  - Mép màn chiếu TV hiển thị chữ "Lab 1 — Máy biết chào / CSE 103".
  - Mép khung viền và mặt phẳng áp sát tường hoàn toàn phẳng mịn, đường viền sắc nét, không hề có hiện tượng sọc răng cưa hay nhấp nháy z-fighting.
  - Bên cạnh là bảng trắng với khung viền nhôm và máng đựng bút.

### 8. `07a-phong-may-khac-408-b8.png` (51.3 KB) — Kiểm chứng phòng máy khác (408.B8)
- **Chi tiết quan sát thấy**:
  - Phòng máy 408.B8 giữ nguyên hình học gốc: hai bảng trắng hai bên và ở giữa là khung viền cùng màn hình TV đen của `B8ComputerLabs`.
  - Xác nhận việc loại bỏ `tvScreens` chỉ áp dụng cho phòng 406.B8 khi đang chạy Silver, không làm ảnh hưởng đến các phòng máy khác.

### 9. `07b-phong-406-b11-nmlt01.png` (47.9 KB) — Kiểm chứng phòng 406.B11 (nmlt-01)
- **Chi tiết quan sát thấy**:
  - Phòng 406.B11 hiển thị đúng slide bài giảng "Nhập môn lập trình / Buổi 1" của bài học `nmlt-01`.
  - Sinh viên và diễn viên giữ nguyên cấu hình ban đầu, chứng minh bộ 8 model học sinh của 406.B11 hoàn toàn không bị ảnh hưởng.

---

## 4. Đo đạc hiệu năng cùng góc máy (Before / After)

Đo đạc trực tiếp qua WebGL Info (`window.__gl.info.render`) trên môi trường Chrome Headless tại cổng 5196 từ các góc máy giống hệt nhau:

| Tình huống đo | Góc máy | Draw Calls | Tam giác (Triangles) | Ngân sách | Đánh giá |
| --- | --- | :---: | :---: | :---: | :---: |
| **Phòng 406.B11 (baseline bài nmlt-01)** | FPS giữa phòng | 47 calls | 134.066 | $\le 130$ calls, $\le 350\text{k}$ | Đạt chuẩn |
| **Phòng 406.B8 trống (chưa bật Silver)** | Góc ngồi `406-r2-s5` | 68 calls | 249.340 | $\le 130$ calls, $\le 350\text{k}$ | Baseline B8 |
| **Phòng 406.B8 Silver active** | Góc ngồi `406-r2-s5` | **71 calls** | **251.842** | $\le 130$ calls, $\le 350\text{k}$ | **+3 calls, +2.502 tris** |
| **Phòng 406.B8 trống (chưa bật Silver)** | Toàn phòng góc cao | 76 calls | 249.436 | $\le 130$ calls, $\le 350\text{k}$ | Baseline toàn phòng |
| **Phòng 406.B8 Silver active** | Toàn phòng góc cao | **107 calls** | **260.173** | $\le 130$ calls, $\le 350\text{k}$ | **+31 calls, +10.737 tris** |
| **Đổi tầng sang tầng 3 (Unmount test)** | Nội thất tầng 3 | 44 calls | 134.264 | Không có Silver | `silverMeshCount = 0` |
| **Rời tòa nhà ra ngoài trời** | Ngoại thất khuôn viên | 54 calls | 265.799 | Unmount hoàn toàn | Đạt chuẩn |

*Nhận xét:*
- Khi ở góc nhìn ngồi học (góc nhìn chính của người chơi), hoạt động Silver chỉ tăng thêm **3 draw calls** (từ 68 lên 71) và **2.502 tam giác**, hoàn toàn nằm gọn trong ngân sách cho phép ($\le 130$ calls, $\le 350\text{k}$ tam giác).
- Ở góc nhìn toàn phòng bao quát tất cả 14 nhân vật (12 sinh viên nền + Han + Thầy Nam) cùng màn hình TV, số draw calls cao nhất ghi nhận được là **107 calls** và **260.173 tam giác**, vẫn thấp hơn ngưỡng giới hạn 130 calls.
- Khi người chơi đổi tầng hoặc ra ngoài trời, toàn bộ diễn viên unmount sạch sẽ (`silverMeshCount = 0`).

---

## 5. Kết quả 5 cổng kiểm tra mã nguồn

```bash
npm run typecheck   # tsc -b --noEmit -> 0 lỗi
npm run lint        # eslint -> 0 lỗi
npm run build       # vite build -> thành công trong 626ms
npm run test:silver # node scripts/silver/test.mjs -> 54/54 test suites PASS (100%)
npm run check:silver -- --strict # Kiểm tra hợp đồng Silver -> PASS (strict mode 0 lỗi)
```

Tất cả 5 cổng kiểm tra đều đạt 100% với 0 cảnh báo và 0 lỗi.
