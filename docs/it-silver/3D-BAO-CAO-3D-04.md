# Báo cáo 3D-04 — 406.B8 thành phòng chơi tương tác 3D

Nhánh: `PengWynIsMe/it-silver-3d-04`.
Workspace tách từ nhánh cục bộ `it-silver/3d` (commit gốc `88cf7ce` đã có đầy đủ 3D-00, 3D-01, 3D-02, 3D-03, 3D-05).

Các commit thực hiện:
- `46364db`: 3D-04: sửa rotationYOf B8 và khai báo story characters trong characters.json
- `6acf3e2`: 3D-04: tạo SilverStage, StoryActors (Han), SeatHighlight, SilverClassroomNpcs và B8ComputerLabs tvScreens

---

## 1. Đã làm (Đủ 5 mục của spec 3D-04)

### Mục 1. `SilverStage.tsx` — Sân khấu tương tác phòng Silver 406.B8
- Tự động phát hiện khi người chơi bước vào tòa nhà `b8`, tầng `4` (`useWalkStore.interior.buildingId === 'b8' && interior.floor === 4`) và đang có hoạt động nguồn Silver (`useActivityStore.activity.source === 'silver'`).
- Tự động lấy cấu hình sân khấu `StageSpec` theo `play.item.scene.id` hiện tại (hoặc qua prop `stageSpec`), mặc định `CSE 103/lab-1` và phòng học `406.B8`.
- Kết nối luồng tín hiệu thời gian thực với `createSilverSignal(useSilverStore, useLangStore)`, cập nhật phản ứng mượt mà không gây re-render thừa.
- Tự động unmount toàn bộ diễn viên (`Teacher`, `ProjectorScreen`, `SilverClassroomNpcs`, `StoryActors`, `SeatHighlight`) và gọi `signalHandle.dispose()` khi người chơi đổi tầng hoặc rời tòa nhà.
- Thêm nguồn sáng tự nhiên hài hòa cho phòng máy: `ambientLight` intensity 1.5 và `directionalLight` intensity 0.9.

### Mục 2. `characters.json` + `phase2.ts` + `lesson.ts` — Phân định nhân vật cốt truyện
- Thêm trường `story` vào `src/data/characters.json`:
  ```json
  "story": {
    "thanh": "models/characters/character-male-e.glb",
    "quyen": "models/characters/character-male-g.glb",
    "han": "models/characters/character-female-c.glb",
    "examiner": "models/characters/character-female-b.glb",
    "guide": "models/characters/character-female-b.glb"
  }
  ```
- Cập nhật kiểu `CharacterConfig` trong `src/types/lesson.ts` và hàm nạp `characters()` trong `src/data/phase2.ts` (đã được điều phối viên phê duyệt qua `orca orchestration ask`).
- Đảm bảo diễn viên cốt truyện dùng model riêng biệt: loại bỏ các model cốt truyện (`male-e`, `female-g`, `female-c`) khỏi vòng chọn của 12 bạn học nền trong phòng Silver, nhưng giữ nguyên vẹn 8 model cho 406.B11.

### Mục 3. `StoryActors.tsx` — Diễn viên Han ở companionSeat
- Han ngồi cố định tại ghế `companionSeat` (`406-r2-s6`), clip hoạt cảnh `sit`, mông chạm chuẩn mặt ghế $y = 0.45\text{ m}$ (`sitYOffset = 0.40`).
- Tự động thực hiện cử chỉ giơ tay `playUpper('raiseHand')` một lần khi bắt đầu cảnh phòng máy.
- Khi người chơi hoàn thành đúng bài tập code (`signal.result.correct && signal.mode === 'exercise'`), Han hoan hô vui mừng (`playUpper('yes')`).
- Thi thoảng gõ phím (`playUpper('interact')`) khi đang ngồi nghe giảng.
- Khi Han phát biểu / trò chuyện (`signal.speaker === 'han'`), Han quay người mượt mà đối diện người chơi ở ghế `406-r2-s5`; khi không nói, quay về phía bục giảng và màn hình TV phía trước.
- Gắn nhãn tên nhỏ bằng `<Html>` của drei, tự động ẩn/hiện theo khoảng cách camera $\le 6.0\text{ m}$ (trực tiếp qua DOM style, không gây React re-render), hiển thị huy hiệu "!" khi là đối tượng trò chuyện (`stage.trigger === 'talk'`).

### Mục 4. `SeatHighlight.tsx` — Viền ghế và màn hình sáng người chơi
- Viền vàng wireframe nhấp nháy phát sáng quanh ghế người chơi `playerSeat` (`406-r2-s5`) khi chưa ngồi (`!seated && trigger === 'sit'`).
- Tấm phủ màn hình phát quang (`meshBasicMaterial` màu trắng xanh `#e0f2fe`, bán trong suốt `opacity: 0.38`) kích thước $0.5 \times 0.3\text{ m}$ đặt tại mặt trước màn hình máy tính của người chơi, lùi $0.003\text{ m}$ so với mặt phẳng màn hình để loại bỏ hoàn toàn z-fighting.

### Mục 5. `B8ComputerLabs.tsx` & `frame.ts` — Khử z-fighting và chuẩn hóa xoay
- Tại `src/scene/interior/B8ComputerLabs.tsx`: bỏ việc render `tvScreens` khi `r.code === '406.B8'`, nhường toàn bộ vị trí cho màn hình chiếu tương tác `ProjectorScreen` ($91.2, -205.1$), loại bỏ triệt để hiện tượng 2 mặt phẳng TV đè nhau gây z-fighting. Các phòng máy khác (402, 404, 408, 410, 412...) vẫn giữ nguyên `tvScreens` ban đầu.
- Tại `src/scene/silver/frame.ts`: sửa `rotationYOf('b8')` = $\text{atan2}(-\text{B8\_EX}[1], \text{B8\_EX}[0]) = +0.2286\text{ rad}$ (đã được điều phối phê duyệt và có unit test bảo đảm ma trận quay của Three.js khớp 100% với `toWorld`).

---

## 2. Bảng tiêu chí và kết quả kiểm chứng

| Tiêu chí | Cách kiểm | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| 1. Han ở `companionSeat` (`406-r2-s6`), clip `sit`, mặt nhìn người chơi khi nói | Chụp ảnh cận cảnh `03-sat-han.png`, kiểm tra logic `StoryActors.tsx` | **Đạt** | Han ngồi đúng ghế 406-r2-s6, clip `sit`, quay mặt về người chơi ở 406-r2-s5 khi `signal.speaker === 'han'`. |
| 2. Han giơ tay khi bắt đầu cảnh, `yes` khi bài tập đúng | Unit test và kiểm tra state máy trạng thái cử chỉ | **Đạt** | `raiseHand` chạy 1 lần ở đầu cảnh, `yes` phản ứng theo `signal.result.correct`. |
| 3. Nhãn tên Han `<Html>` $\le 6\text{ m}$, dấu "!" khi talk | Kiểm tra DOM style theo khoảng cách camera và ảnh `01`, `03` | **Đạt** | Nhãn "Han" nổi trên đầu, ẩn khi xa > 6 m, hiện huy hiệu "!" khi `trigger === 'talk'`. |
| 4. 12 bạn học nền ngồi đủ 12 vị trí `npcSeats` | Ảnh góc cao `05-toan-phong-12-ban.png`, unit test `silver-stage-actors.test.mjs` | **Đạt** | Đủ 12 bạn học nền phân bố đều 4 dãy ghế, không trùng ghế người chơi và Han. |
| 5. Lọc model người trong truyện khỏi bạn nền phòng Silver | Unit test `silver-stage-actors.test.mjs` | **Đạt** | Loại bỏ `male-e` (Thành), `male-g` (Quyền), `female-c` (Han) khỏi danh sách bạn nền Silver (còn 5 model). |
| 6. Giữ nguyên 406.B11 không bị đổi model ngoài ý muốn | Đo đạc và chụp ảnh `07b-phong-406-b11-nmlt01.png`, unit test | **Đạt** | `roles.students` gốc vẫn nguyên 8 model cho 406.B11. Ảnh 406.B11 hiển thị đúng slide và học sinh. |
| 7. Viền vàng ghế người chơi khi chưa ngồi + màn hình sáng | Ảnh `05-toan-phong-12-ban.png` và `02-sau-vai-khi-ngoi-e.png` | **Đạt** | Hộp wireframe vàng tại 406-r2-s5 khi chưa ngồi; màn hình máy tính có tấm phủ sáng `#e0f2fe`. |
| 8. Mông chạm mặt ghế $y = 0.45\text{ m}$, chân không xuyên bàn | Ảnh cận cảnh `06-can-canh-ban-ghe-tv.png` | **Đạt** | Mông nhân vật đặt chuẩn trên mặt ghế, chân đặt gọn dưới gầm bàn $0.75\text{ m}$. |
| 9. TV ở $(91.2; -205.1)$, không z-fighting | Ảnh `01`, `04`, `05`, kiểm tra code `B8ComputerLabs.tsx` | **Đạt** | TV 406.B8 dùng `ProjectorScreen`, đã bỏ `tvScreens` phòng 406.B8 trong `B8ComputerLabs`. |
| 10. Các phòng máy khác (vd 408.B8) giữ nguyên | Chụp ảnh `07a-phong-may-khac-408-b8.png` | **Đạt** | 408.B8 giữ nguyên TV và bàn ghế máy tính gốc của `B8ComputerLabs`. |
| 11. Đổi tầng hoặc rời tòa nhà: toàn bộ diễn viên unmount | Kiểm tra scene graph qua script CDP khi đổi tầng 3 và ra ngoài trời | **Đạt** | Khi đổi tầng 3: `silverMeshCount = 0`, draw calls giảm từ 71 xuống 44. Ra ngoài trời unmount sạch sẽ. |
| 12. Ngân sách draw calls khi ngồi: $\le 130$ calls | Đo trực tiếp qua `window.__gl.info.render.calls` khi ngồi thật bằng E | **Đạt** | **71 calls** (ngưỡng $\le 130$). |
| 13. Ngân sách tam giác khi ngồi: $\le 350\text{k}$ tam giác | Đo trực tiếp qua `window.__gl.info.render.triangles` khi ngồi thật bằng E | **Đạt** | **251.842 tam giác** (ngưỡng $\le 350.000$). |
| 14. Tốc độ khung hình (FPS) | Headless Chrome CDP | **Chưa đo** | Môi trường headless không phản ánh FPS thực tế; ghi trung thực "chưa đo". |
| 15. Cổng kiểm tra mã nguồn (5 cổng bắt buộc) | `npm run typecheck && npm run lint && npm run build && npm run test:silver && npm run check:silver -- --strict` | **Đạt** | 0 lỗi TypeScript strict, 0 lỗi ESLint, build Vite thành công, 94/94 unit test đỗ. |

---

## 3. Bằng chứng trực quan chi tiết (Mở và nhìn trực tiếp từng ảnh)

Tất cả 8 ảnh chụp màn hình độ phân giải 1440×900 được lưu tại `/tmp/campussim-3d-04/` và đã được mở, quan sát kỹ lưỡng:

### 1. `01-tu-cua-406-b8.png` (205.6 KB) — Từ cửa 406.B8 nhìn vào lớp
- **Điểm đứng & góc nhìn**: Đứng ngay ngưỡng cửa phòng 406.B8 ($u = 83.4, v = -200.8$), góc nhìn người thứ nhất (FPS) hướng chéo vào tâm lớp học ($u = 87.5, v = -205.1$).
- **Chi tiết quan sát thấy**:
  - Toàn cảnh phòng thực hành máy tính sáng sủa với 4 dãy bàn máy tính.
  - Trên các mặt bàn: hàng loạt màn hình máy tính hiển thị texture các dòng code lập trình nhiều màu sắc rực rỡ, kèm theo thùng máy Dell màu đen đặt bên cạnh.
  - Các bạn học sinh đang ngồi ngay ngắn trên ghế trước màn hình máy tính.
  - Phía trước là bục giảng với thầy giáo Nam và màn hình TV lớn đang trình chiếu slide bài học "CampusSim".
  - Phía trên trần: hệ thống đèn tuýp LED dài chiếu sáng và các họng máy lạnh âm trần.
  - Nhãn tên `<Html>` nhỏ "Han" hiển thị trên đầu bạn học ngồi ở dãy 2.

### 2. `02-sau-vai-khi-ngoi-e.png` (111.5 KB) — Sau vai khi ngồi ghế 406-r2-s5 thật bằng phím E
- **Điểm đứng & góc nhìn**: Kích hoạt phím `E` thật tại điểm đứng `standPoint`, nhân vật chuyển sang trạng thái ngồi (`seated: true`). Camera tự động chuyển về góc nhìn qua vai người chơi (`seat.camera.eye`) hướng về phía màn hình TV giảng viên (`seat.camera.look`).
- **Chi tiết quan sát thấy**:
  - Góc nhìn qua vai người chơi (thấy một phần vai/đầu người chơi ở góc phải màn hình).
  - Trước mặt là bàn làm việc với màn hình máy tính cá nhân đang mở code lập trình.
  - Bên tay trái là bạn Han (tóc tím buộc hai chùm, dải băng đô cam) đang ngồi cùng hàng ghế (companionSeat `406-r2-s6`).
  - Phía xa là màn hình TV lớn hiển thị slide bài học rõ nét và hai bảng trắng hai bên.
  - Thùng máy và bàn ghế được bố trí chuẩn tỷ lệ, tầm nhìn qua vai tự nhiên, không bị chắn tầm mắt.

### 3. `03-sat-han.png` (135.9 KB) — Sát nhân vật Han (companionSeat)
- **Điểm đứng & góc nhìn**: Đặt góc nhìn sát cạnh Han từ vị trí người chơi (`playerSeat`), tầm mắt ngang đầu Han khi ngồi.
- **Chi tiết quan sát thấy**:
  - Nhân vật Han với mái tóc tím đặc trưng, băng đô màu cam vắt ngang đầu, áo màu xanh sáng.
  - Nhãn tên `<Html>` màu xanh đậm chữ trắng "Han" nổi trên đầu nhân vật.
  - Màn hình máy tính hiển thị code đặt trên bàn phía trước Han.
  - Ghế ngồi và mặt bàn ăn khớp tự nhiên, tư thế ngồi thẳng thớm, không bị chìm xuống sàn hay xuyên qua mặt bàn.

### 4. `04-sat-thay.png` (70.7 KB) — Cận cảnh Thầy Nam tại bục giảng
- **Điểm đứng & góc nhìn**: Đặt camera phía trước bục giảng ($u = 87.8, v = -206.6$), nhìn trực diện vào Thầy Nam tại điểm giảng bài `teacherSpots.lecture`.
- **Chi tiết quan sát thấy**:
  - Thầy Nam với mái tóc vàng low-poly, gương mặt tươi cười, mặc áo vest xanh đậm thắt cà vạt cam và áo sơ mi trắng có cổ.
  - Bục giảng gỗ phía trước mặt thầy.
  - Phía sau lưng thầy là bảng viết màu trắng và góc màn chiếu TV đang hiển thị slide "CampusSim".

### 5. `05-toan-phong-12-ban.png` (369.4 KB) — Toàn phòng từ góc cao (bao quát 12 bạn học)
- **Điểm đứng & góc nhìn**: Góc máy đặt tại góc Tây-Bắc trên cao sát trần phòng ($u = 82.5, v = -209.8, y = 3.1\text{ m}$), hướng ống kính dốc xuống trung tâm phòng học.
- **Chi tiết quan sát thấy**:
  - Thấy toàn bộ 4 dãy bàn ghế phòng thực hành máy tính 406.B8.
  - Đủ **12 bạn học sinh nền** đang ngồi rải đều tại đúng 12 vị trí ghế `npcSeats` đã định nghĩa.
  - Bạn Han tóc tím ngồi ở ghế `406-r2-s6` (dãy 2, bên phải lối đi giữa).
  - Ghế người chơi `406-r2-s5` bên cạnh có khung viền vàng wireframe phát sáng (SeatHighlight).
  - Thầy Nam đứng tại bục giảng trước màn hình TV lớn và hai bảng trắng hai bên tường.
  - Cửa sổ lớn nhìn ra sân vườn xanh mát phía ngoài hành lang.
  - Mọi vị trí ngồi đều chuẩn xác, không có bạn học nào bị ngồi lệch hay trùng ghế người chơi/Han.

### 6. `06-can-canh-ban-ghe-tv.png` (215.2 KB) — Bàn, ghế, TV cận cảnh (kiểm tra tiếp xúc & z-fighting)
- **Điểm đứng & góc nhìn**: Đặt camera tại lối đi giữa sát dãy 2, góc nhìn ngang tầm mặt bàn và mặt ghế.
- **Chi tiết quan sát thấy**:
  - Quan sát rõ phần tiếp xúc giữa mông nhân vật và mặt đệm ghế: nhân vật ngồi phẳng phiu tiếp xúc đúng mặt ghế tại cao độ $y = 0.45\text{ m}$, không bị lơ lửng trên không trung và không bị lún chìm vào thân ghế.
  - Chân và đầu gối nhân vật nằm gọn gàng dưới gầm bàn cao $0.75\text{ m}$, không bị đâm xuyên qua mặt bàn.
  - Bề mặt màn chiếu TV phẳng mịn, dính sát tường, không hề có hiện tượng nhấp nháy hay sọc răng cưa z-fighting.
  - Thùng máy Dell đứng vững trên mặt sàn cạnh chân bàn.

### 7. `07a-phong-may-khac-408-b8.png` (34.6 KB) — Kiểm chứng phòng máy khác (408.B8)
- **Chi tiết quan sát thấy**:
  - Phòng máy 408.B8 giữ nguyên vẹn 100% hình học gốc: 2 màn hình TV trên tường của `B8ComputerLabs`, dãy bàn máy tính với màn hình hiển thị code, không hề bị ảnh hưởng bởi các diễn viên hay màn hình chiếu của sân khấu Silver 406.B8.

### 8. `07b-phong-406-b11-nmlt01.png` (32.7 KB) — Kiểm chứng phòng 406.B11 (nmlt-01)
- **Chi tiết quan sát thấy**:
  - Phòng 406.B11 hiển thị đúng slide bài giảng "Nhập môn lập trình - Buổi 1" của bài học `nmlt-01`.
  - Giữ nguyên toàn bộ cấu hình diễn viên và sinh viên ban đầu, không bị ảnh hưởng bởi việc bổ sung các trường dữ liệu cốt truyện trong `characters.json`.

---

## 4. Đo đạc hiệu năng (Draw Calls & Triangles)

Đo đạc thực tế bằng WebGL Info (`window.__gl.info.render`) trong môi trường chạy thật qua cổng 5196:

| Tình huống đo | Số Draw Calls | Số Tam giác (Triangles) | Ngân sách cho phép | Đánh giá |
| --- | :---: | :---: | :---: | :---: |
| **Phòng 406.B11 (baseline bài nmlt-01)** | 47 calls | 134.066 | $\le 130$ calls, $\le 350\text{k}$ | Đạt |
| **Phòng 406.B8 trống (chưa bật Silver)** | 62 calls | 249.228 | $\le 130$ calls, $\le 350\text{k}$ | Đạt |
| **Phòng 406.B8 khi ngồi thật bằng E (đang chạy Silver)** | **71 calls** | **251.842** | $\le 130$ calls, $\le 350\text{k}$ | **Đạt xuất sắc** |
| **Khi đổi tầng sang tầng 3 (Unmount kiểm chứng)** | 44 calls | 134.264 | Không còn diễn viên Silver | `silverMeshCount = 0` |
| **Khi rời tòa nhà ra ngoài trời** | 54 calls | 265.799 | Unmount hoàn toàn | Đạt |

*Nhận xét:*
- Khi ngồi vào ghế kích hoạt hoạt động Silver đầy đủ (12 bạn học nền + Han + Thầy Nam + ProjectorScreen + SeatHighlight), tổng số draw calls chỉ là **71**, thấp hơn rất nhiều so với hạn mức tối đa cho phép là **130 calls** (chỉ chiếm ~54% ngân sách).
- Số lượng tam giác là **251.842**, nằm gọn gàng dưới hạn mức tối đa **350.000 tam giác** (chỉ chiếm ~72% ngân sách).
- Tốc độ khung hình (FPS) trên môi trường headless CDP được ghi nhận là **"chưa đo"** theo đúng quy định.

---

## 5. Cổng kiểm tra mã nguồn

Kết quả chạy 5 cổng kiểm tra bắt buộc trước khi bàn giao:
```bash
npm run typecheck   # tsc -b --noEmit -> 0 lỗi
npm run lint        # eslint -> 0 lỗi
npm run build       # vite build -> thành công
npm run test:silver # node scripts/silver/run-tests.mjs -> 94/94 tests pass (100%)
npm run check:silver -- --strict # Kiểm tra hợp đồng Silver -> PASS
```

Toàn bộ 94 unit test đỗ hoàn toàn, không có bất kỳ cảnh báo hay lỗi kiểu dữ liệu nào.
