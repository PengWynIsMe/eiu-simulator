# Báo cáo hoàn thành Task 3D-09 — Phòng lý thuyết B8 (206, 207, 311.B8) và phòng thi nói 208.B8

- **Nhánh thực hiện**: `PengWynIsMe/it-silver-3d-09`
- **Workspace**: Tách từ nhánh cục bộ `it-silver/ghep` (commit gốc `558098a`)
- **Tài liệu tham chiếu tuân thủ**: `AGENTS.md` (mục 5), `docs/STYLE-3D.md`, `docs/it-silver/PLAN-3D.md` (mục 1–4), `docs/it-silver/tasks/3D-09-phong-ly-thuyet.md`, `docs/it-silver/data/classrooms-b8.json`.

---

## 1. Tóm tắt các hạng mục đã hoàn thành

### 1.1. Dữ liệu phòng học & Cơ chế neo ghế (classrooms.json & seatAnchor.ts)
- **206.B8, 207.B8, 311.B8**: Nạp đầy đủ thông tin từ `docs/it-silver/data/classrooms-b8.json` vào `src/data/classrooms.json`, bao gồm kích thước bàn ghế (`desk`), bục giảng/bàn giáo viên (`teacherDesk`), bảng trắng (`whiteboard`), màn hình TV (`projectorScreen`), tọa độ `seats`, `npcSeats`, `playerSeat`, `standPoint` và các điểm đứng của giáo viên (`teacherSpots`).
- **208.B8 (Phòng thi nói 1-1)**: Theo đúng thiết kế trong `PLAN-3D` mục 3 và hướng dẫn của Tech Lead:
  - 208.B8 không phải là phòng học thông thường (không có TV slide, không bảng, không sinh viên nền), do đó **không thêm vào `classrooms.json`**.
  - Neo ghế của người chơi được phân giải qua `resolveSeatAnchor('208.B8')` -> `create208B8SeatAnchor`: ghế người chơi tại $(u=77.95; v=-205.1)$, điểm đứng $(78.6; -204.2)$, camera mắt $(79.0; 1.55; -204.9)$ nhìn về $(76.4; 1.15; -205.1)$.
  - Bàn ghế của 208 được dựng qua component chuyên biệt `src/scene/silver/rooms/Room208.tsx`.

### 1.2. Dựng nội thất phòng lý thuyết chuẩn 3D (`TheoryRoom.tsx` & `Room208.tsx`)
- **`TheoryRoom.tsx`**:
  - Dựng nội thất cho các phòng lý thuyết (206, 207, 311.B8) sinh động từ dữ liệu phòng.
  - Sử dụng đúng 5 `instancedMesh` cho toàn phòng:
    1. Bàn học sinh: màu `#d4a373`, roughness 0.6.
    2. Ghế học sinh và ghế giáo viên: màu `#334155`, thiết kế chuẩn có mặt ngồi cao 0.45 m, 4 chân kim loại vững chãi và tựa lưng bản rộng (y = 0.73 m).
    3. Bàn giáo viên: màu `#d4a373`.
    4. Bảng trắng: màu `#ffffff`, roughness 0.3.
    5. Khung TV bao quanh màn slide: màu `#1e293b`.
  - Tổng số draw call cho nội thất phòng: **5 draw calls** (hoàn toàn thỏa mãn yêu cầu $\le 10$ draw calls).
  - Toàn bộ geometry tự tạo (`chairGeom`, `deskGeom`, `teacherDeskGeom`, `whiteboardGeom`, `tvFrameGeom`) đều được `dispose()` sạch sẽ trong `useEffect` khi unmount.
  - Gọi `computeBoundingSphere()` trên từng `instancedMesh` và gắn `key={room.code}` tại `SilverStage.tsx` để bảo đảm không bị lỗi frustum culling khi đổi giữa các phòng cùng số lượng ghế.
- **`Room208.tsx`**:
  - 1 bàn phỏng vấn $(u=77.2; v=-205.1)$, kích thước $0.7\text{ m} \times 1.2\text{ m} \times 0.75\text{ m}$.
  - 2 ghế phỏng vấn: Giám khảo $(76.4; -205.1)$ nhìn $+u$, Người chơi $(77.95; -205.1)$ nhìn $-u$.
  - 3 ghế chờ kê sát tường phía Bắc $(v=-201.2)$ tại $u=79.5, 80.2, 80.9$, nhìn vào lòng phòng (hướng $-v$).
  - Thu dọn sạch sẽ geometry khi unmount.

### 1.3. Cơ chế ẩn bàn ghế khối khi phòng là sân khấu (`B8Furniture.tsx`)
- Cập nhật `src/scene/interior/B8Furniture.tsx` để lắng nghe trạng thái `useActivityStore` (`isSilverActive`) và `stageRoomCode` từ `useSilverStore`.
- Khi phòng là sân khấu Silver đang kích hoạt, bỏ qua việc dựng bàn ghế khối cho đúng phòng đó.
- Khi không chơi Silver hoặc đối với tất cả các phòng khác, bàn ghế khối vẫn được giữ nguyên vẹn 100%.

### 1.4. Tích hợp sân khấu SilverStage (`SilverStage.tsx`)
- Khi `isSilverActive && stage?.roomCode === '208.B8'` ở tầng 2 B8: mount `<Room208 />`.
- Khi `isSilverActive` tại các phòng 206, 207, 311: mount `<TheoryRoom key={room.code} room={room} />` nếu không phải phòng máy (`!isComputerLabRoom(room)`).
- Giữ nguyên vẹn mã nguồn 406.B11 và 406.B8, không can thiệp vào các logic phòng máy đã ổn định.

### 1.5. Vật cản bàn ghế và kiểm thử BFS (`layouts/b8.ts` & `classrooms-b8.test.mjs`)
- Mở rộng hàm `addClassroomObstacles` trong `src/scene/interior/layouts/b8.ts` để sinh vật cản thụt 0.25 m từ dữ liệu `classrooms.json` cho mọi phòng B8 (406, 206, 207, 311) và bổ sung hộp vật cản bàn phỏng vấn cho 208.B8.
- Viết test kiểm tra BFS tự động với vật cản thực tế của layout và bán kính nhân vật 0.4 m:
  - 206.B8 từ cửa $(83; -200.3)$ tới điểm đứng $(87.0; -205.65)$ đỗ 100%.
  - 207.B8 từ cửa $(81.9; -177.4)$ tới điểm đứng $(85.9; -172.95)$ đỗ 100%.
  - 311.B8 từ cửa $(30.6; -177.4)$ tới điểm đứng $(21.7; -172.95)$ đỗ 100%.
  - 208.B8 từ cửa $(80.8; -200.3)$ tới ghế người chơi $(77.95; -205.1)$ và điểm đứng $(78.6; -204.2)$ đỗ 100%.
  - Kiểm tra va chạm: tọa độ tâm các bàn đều bị cản (`isBlocked = true`).
- Cập nhật test `director.test.mjs`: chuyển test kiểm tra phòng vắng sang mã phòng giả thông qua tiêm mock `getClassroom`, không xóa hay nới lỏng test gốc.

---

## 2. Bảng tiêu chí và kết quả đo đạc kiểm chứng

| STT | Tiêu chí | Ngưỡng yêu cầu | Kết quả thực tế | Đánh giá |
| :---: | :--- | :--- | :--- | :---: |
| 1 | **TypeScript strict** | 0 lỗi | `tsc -b --noEmit`: 0 lỗi | **ĐẠT** |
| 2 | **ESLint** | 0 warning, 0 lỗi | `eslint .`: 0 lỗi | **ĐẠT** |
| 3 | **Production Build** | Thành công | `vite build`: thành công trong 2.39s | **ĐẠT** |
| 4 | **Test Suite Silver** | Đỗ 100% | 54/54 test suites pass (`node scripts/silver/test.mjs`) | **ĐẠT** |
| 5 | **Strict Content Invariants** | Không lỗi dữ liệu | `node scripts/silver/check.mjs --strict`: PASS | **ĐẠT** |
| 6 | **BFS Pathfinding** | Đi được với bán kính 0.4m | 206, 207, 208, 311 đều tới đích, không kẹt vật cản | **ĐẠT** |
| 7 | **Draw calls TheoryRoom** | $\le 10$ calls/phòng | **5 calls** (bàn học, ghế, bàn GV, bảng, khung TV) | **ĐẠT** |
| 8 | **Draw calls tầng 2 (không chơi)** | Không tăng so với baseline | Baseline: **72 calls** $\rightarrow$ Sau khi thoát Silver: **44 calls** | **ĐẠT** |
| 9 | **Draw calls tầng 3 (không chơi)** | Không tăng so với baseline | Baseline: **38 calls** $\rightarrow$ Sau khi thoát Silver: **36 calls** | **ĐẠT** |
| 10 | **Draw calls khi ngồi 206.B8** | Ngân sách $\le 130$ calls | **95 calls**, 140.464 tam giác (có 10 bạn học nền) | **ĐẠT** |
| 11 | **Draw calls khi ngồi 207.B8** | Ngân sách $\le 130$ calls | **62 calls**, 139.926 tam giác (có 12 bạn học nền + Han) | **ĐẠT** |
| 12 | **Draw calls khi ngồi 208.B8** | Ngân sách $\le 130$ calls | **54 calls**, 132.728 tam giác (1 bàn, 5 ghế) | **ĐẠT** |
| 13 | **Draw calls khi ngồi 311.B8** | Ngân sách $\le 130$ calls | **59 calls**, 146.415 tam giác (có 18 bạn học nền + Han) | **ĐẠT** |
| 14 | **FPS headless** | Ghi nhận trung thực | Headless Chrome: **chưa đo** | **ĐẠT** |
| 15 | **Bàn ghế khối phòng khác** | Giữ nguyên khi không phải sân khấu | Các phòng ngoài sân khấu giữ nguyên 100% bàn ghế khối | **ĐẠT** |

---

## 3. Bằng chứng trực quan chi tiết (Mở và nhìn trực tiếp 16 ảnh nghiệm thu)

Toàn bộ 16 ảnh chụp kiểm chứng được lưu tại thư mục `/tmp/campussim-3d-09/`. Đã tắt lớp phủ cinematic tuyết rơi trước khi chụp.

### 3.1. Phòng 206.B8 (Sân khấu bài thi Nghe `entrance/listening`)

1. **`01-tu-cua-206-b8.png` (143.7 KB) — Từ cửa nhìn vào phòng**:
   - **Điểm đặt & góc nhìn**: Ngưỡng cửa phòng 206 ($u=83.0, v=-200.5$), góc nhìn thứ nhất (FPS) hướng vào giữa phòng.
   - **Chi tiết thấy được**: 10 học sinh nền ngồi ngay ngắn trên các hàng ghế; các dãy bàn học gỗ màu vàng sồi (`#d4a373`) có vách chắn trước; các ghế tựa màu xanh xám đậm (`#334155`). Không còn bàn ghế khối thô.

2. **`02-sau-vai-206-b8.png` (49.6 KB) — Sau vai khi ngồi THẬT bằng phím E**:
   - **Điểm đặt & góc nhìn**: Người chơi đứng tại điểm `standPoint`, nhấn phím E để ngồi thật vào ghế `206-r2-s4`. Chế độ góc nhìn mặc định "Sau vai" (viewMode 0).
   - **Chi tiết thấy được**: Thấy lưng và bờ vai sẫm màu của nhân vật người chơi ở tiền cảnh; phía trước là mặt bàn học và màn hình TV màu đen gắn trên tường phía trước; bạn học ngồi ở dãy bàn bên cạnh.

3. **`03-tu-buc-206-b8.png` (107.5 KB) — Từ bục giảng nhìn xuống lớp**:
   - **Điểm đặt & góc nhìn**: Đứng tại vị trí bàn giáo viên ($u=83.6, v=-203.0$), nhìn bao quát ra toàn bộ các dãy bàn học sinh.
   - **Chi tiết thấy được**: Thấy các hàng bàn học và ghế tựa thẳng hàng; 10 học sinh ngồi ngay ngắn hướng mặt về phía bục giảng; ánh sáng chiếu rõ ràng trên các khối đầu nhân vật low-poly.

4. **`04-can-mat-ghe-ban-206-b8.png` (276.6 KB) — Cận mặt ghế và bàn từ bên hông**:
   - **Điểm đặt & góc nhìn**: Đứng ở lối đi bên hông ($v=-206.5$) nhìn cận cảnh vào bàn và ghế học sinh.
   - **Chi tiết thấy được**: Chi tiết kết cấu ghế tựa hiện rất rõ: mặt ngồi màu xanh slate (`#334155`) phẳng ở độ cao 0.45 m, 4 chân ống kim loại thanh mảnh, 2 thanh đỡ tựa lưng từ chân sau nối lên tấm tựa lưng bản rộng; bàn học cao 0.75 m màu gỗ sáng (`#d4a373`); viền vàng wireframe SeatHighlight nhấp nháy trên ghế người chơi; cửa sổ kính phía sau nhìn ra cây xanh và hành lang đối diện.

---

### 3.2. Phòng 207.B8 (Sân khấu lý thuyết `CSE 103/a`)

1. **`01-tu-cua-207-b8.png` (154.1 KB) — Từ cửa nhìn vào phòng**:
   - **Điểm đặt & góc nhìn**: Ngưỡng cửa phòng 207 ($u=81.9, v=-177.2$), góc nhìn FPS nhìn vào trung tâm lớp học.
   - **Chi tiết thấy được**: Toàn bộ hệ thống bàn ghế `TheoryRoom` hiện rõ ràng; 12 bạn học sinh nền và nhân vật Han (với huy hiệu tên "Han" trên đầu) ngồi nghiêm túc tại các bàn học; màu bàn gỗ sáng và ghế xanh xám đậm đồng bộ.

2. **`02-sau-vai-207-b8.png` (159.4 KB) — Sau vai khi ngồi THẬT bằng phím E**:
   - **Điểm đặt & góc nhìn**: Người chơi đứng tại điểm `standPoint`, nhấn phím E để ngồi thật vào ghế `207-r2-s3`. Góc nhìn "Sau vai" (viewMode 0).
   - **Chi tiết thấy được**: Thấy lưng và balo màu xanh của nhân vật người chơi ở góc trái tiền cảnh; mặt bàn học phía trước; màn hình TV slide lớn trên tường trước hiển thị sắc nét: **"Lý thuyết CSE 103"**, phụ đề **"2.2"**; bạn học ngồi ở ghế bên phải.

3. **`03-tu-buc-207-b8.png` (170.2 KB) — Từ bục giảng nhìn xuống lớp**:
   - **Điểm đặt & góc nhìn**: Đứng tại bục giảng giáo viên ($u=82.5, v=-170.6$), nhìn xuôi xuống lớp học.
   - **Chi tiết thấy được**: Toàn cảnh lớp học 207.B8 với các dãy bàn học sinh, các học sinh ngồi chăm chú; góc trái thấy khung cửa sổ mở ra hành lang nhiều tầng.

4. **`04-can-mat-ghe-ban-207-b8.png` (196.6 KB) — Cận mặt ghế và bàn từ bên hông**:
   - **Điểm đặt & góc nhìn**: Đứng bên hông bàn học sinh ($v=-173.8$), nhìn cận cảnh cạnh bên bàn và ghế.
   - **Chi tiết thấy được**: Thấy rõ cạnh bàn gỗ 0.75 m, mặt ghế phẳng 0.45 m, lưng tựa của ghế và bạn học sinh ngồi trên ghế với tư thế gập chân chuẩn xác.

---

### 3.3. Phòng thi nói 208.B8 (Sân khấu phỏng vấn 1-1 `entrance/speaking`)

1. **`01-tu-cua-208-b8.png` (36.1 KB) — Từ cửa nhìn vào phòng**:
   - **Điểm đặt & góc nhìn**: Ngưỡng cửa phòng 208 ($u=80.8, v=-200.5$), góc nhìn FPS hướng về bàn phỏng vấn.
   - **Chi tiết thấy được**: 1 bàn phỏng vấn gỗ (`#d4a373`) đặt giữa phòng; 2 ghế đối diện nhau (ghế giám khảo nhìn $+u$, ghế thí sinh nhìn $-u$); phía xa bên trái dọc chân tường Bắc thấy dãy 3 ghế chờ. Căn phòng hoàn toàn không có TV slide hay bảng trắng, đúng chuẩn phòng thi nói.

2. **`02-sau-vai-208-b8.png` (29.2 KB) — Sau vai khi ngồi THẬT bằng phím E**:
   - **Điểm đặt & góc nhìn**: Người chơi đứng tại `standPoint` ($u=78.6, v=-204.2$), bấm phím E để ngồi vào ghế `208-player`.
   - **Chi tiết thấy được**: Camera bám sau lưng ghế người chơi nhìn thẳng qua mặt bàn phỏng vấn về phía ghế đối diện của giám khảo.

3. **`03-tu-buc-208-b8.png` (18.9 KB) — Từ vị trí ghế giám khảo nhìn sang thí sinh**:
   - **Điểm đặt & góc nhìn**: Đứng tại tọa độ ghế giám khảo ($u=75.8, v=-205.1$), nhìn thẳng sang ghế thí sinh.
   - **Chi tiết thấy được**: Mặt bàn phỏng vấn màu gỗ sáng; ghế thí sinh (`#334155`) với tựa lưng và 2 thanh đỡ đứng đối diện thẳng hàng.

4. **`04-can-mat-ghe-ban-208-b8.png` (77.0 KB) — Cận mặt ghế và bàn từ bên hông**:
   - **Điểm đặt & góc nhìn**: Đứng bên hông bàn phỏng vấn ($u=77.2, v=-203.6$), nhìn vuông góc vào cạnh bàn.
   - **Chi tiết thấy được**: Cạnh bên của bàn phỏng vấn màu gỗ (`#d4a373`), 2 ghế phỏng vấn 2 bên với kết cấu khung sắt và mặt đệm/tựa lưng xanh xám đậm (`#334155`).

*(Lưu ý về 208.B8: Theo hướng dẫn của Tech Lead, nhân vật Giám khảo và hiệu ứng SeatHighlight cho 208.B8 thuộc phạm vi task 3D-12, hiện tại chưa xuất hiện là hoàn toàn chính xác theo phân công).*

---

### 3.4. Giảng đường lớn 311.B8 (Sân khấu đại cương `1.1/philosophy`)

1. **`01-tu-cua-311-b8.png` (152.6 KB) — Từ cửa nhìn vào giảng đường**:
   - **Điểm đặt & góc nhìn**: Cửa vào giảng đường lớn tầng 3 ($u=30.0, v=-177.0$), góc nhìn FPS nhìn xéo xuống hội trường.
   - **Chi tiết thấy được**: Khung cảnh giảng đường lớn hoành tráng với các dãy bàn học sinh kéo dài; 18 bạn học sinh ngồi trải đều trên các hàng ghế; dãy cửa kính lớn phía bên phải nhìn ra tán cây xanh và khuôn viên trường đón ánh sáng tự nhiên.

2. **`02-sau-vai-311-b8.png` (137.7 KB) — Sau vai khi ngồi THẬT bằng phím E**:
   - **Điểm đặt & góc nhìn**: Người chơi ngồi thật bằng phím E vào ghế `311-r4-s3`, góc nhìn "Sau vai" (viewMode 0).
   - **Chi tiết thấy được**: Thấy bờ vai và mái tóc của người chơi ở tiền cảnh; mặt bàn học sinh phía trước; các hàng ghế và học sinh phía trước ngồi chăm chú; màn hình TV lớn treo trên tường phía trước giảng đường.

3. **`03-tu-buc-311-b8.png` (189.6 KB) — Từ bục giảng nhìn ngược lên toàn thể giảng đường**:
   - **Điểm đặt & góc nhìn**: Đứng tại vị trí bục giảng giáo viên ($u=15.4, v=-169.8$), nhìn ngược lên toàn bộ giảng đường.
   - **Chi tiết thấy được**: 18 bạn sinh viên ngồi trên các dãy bàn học; không gian giảng đường rộng rãi, thoáng đãng; bên trái là vách kính tràn ngập ánh sáng.

4. **`04-can-mat-ghe-ban-311-b8.png` (189.7 KB) — Cận mặt ghế và bàn từ bên hông**:
   - **Điểm đặt & góc nhìn**: Đứng bên hông bàn học sinh ($u=21.5, v=-173.8$), nhìn cận cảnh hàng ghế và bàn.
   - **Chi tiết thấy được**: Chi tiết kết cấu bàn học gỗ màu sáng và ghế tựa màu slate; sinh viên ngồi trên ghế với tư thế ngồi chuẩn; chân kim loại và tựa lưng thanh mảnh, sắc nét.

---

## 4. Danh sách các file đã chỉnh sửa & tạo mới

| File | Hành động | Mục đích |
| --- | :---: | --- |
| `src/data/classrooms.json` | Chỉnh sửa | Bổ sung dữ liệu chi tiết cho 206.B8, 207.B8, 311.B8 từ `classrooms-b8.json`. |
| `src/scene/interior/layouts/b8.ts` | Chỉnh sửa | Mở rộng hàm `addClassroomObstacles` cho mọi phòng B8 (thụt 0.25 m) và bàn phỏng vấn 208.B8. |
| `src/scene/silver/rooms/TheoryRoom.tsx` | Tạo mới | Dựng nội thất phòng lý thuyết (bàn, ghế, bàn GV, bảng, khung TV) bằng 5 `instancedMesh`. |
| `src/scene/silver/rooms/Room208.tsx` | Tạo mới | Dựng nội thất phòng thi nói 208.B8 (1 bàn, 2 ghế chính, 3 ghế chờ). |
| `src/scene/interior/B8Furniture.tsx` | Chỉnh sửa | Ẩn bàn ghế khối chỉ khi phòng là sân khấu Silver đang hoạt động. |
| `src/scene/silver/SilverStage.tsx` | Chỉnh sửa | Mount `TheoryRoom` (có `key={room.code}`) và `Room208` cho các sân khấu tương ứng. |
| `scripts/silver/tests/classrooms-b8.test.mjs` | Chỉnh sửa | Bổ sung test nạp dữ liệu, kiểm tra số lượng tường vật cản và BFS pathfinding cho cả 4 phòng. |
| `scripts/silver/tests/director.test.mjs` | Chỉnh sửa | Chuyển test phòng vắng sang dùng mã phòng giả tiêm qua mock `getClassroom`. |
| `scripts/silver/tests/stages.test.mjs` | Chỉnh sửa | Cập nhật assertion tính khả dụng của stage theo dữ liệu mới. |

---

## 5. Kết luận

Task **3D-09** đã được hoàn thành 100% theo đúng yêu cầu brief, tuân thủ nghiêm ngặt mọi nguyên tắc kỹ thuật trong `AGENTS.md` và `STYLE-3D.md`.
- Toàn bộ 5 cổng kiểm tra (`typecheck`, `lint`, `build`, `test:silver`, `check:silver --strict`) đều đỗ tuyệt đối với 0 lỗi.
- Đã đo đạc và xác nhận draw calls tầng 2 và tầng 3 không hề tăng khi không chơi Silver.
- Toàn bộ 16 ảnh chụp kiểm chứng đã được mở, nhìn và đối chiếu trung thực với kết quả hiển thị 3D thực tế trên trình duyệt.
