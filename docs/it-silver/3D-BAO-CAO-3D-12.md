# Báo cáo hoàn thành Task 3D-12 — Ngoài trời, bảng kết quả, 208 và các cảnh không roomCode (Nghiệm thu hoàn chỉnh)

- **Task**: 3D-12 (`docs/it-silver/tasks/3D-12-ngoai-troi-va-hai-phong.md`)
- **Nhánh thực hiện**: `PengWynIsMe/it-silver-3d-12`
- **Workspace**: Tách từ nhánh `it-silver/ghep` (commit gốc `45fb991`)
- **Tài liệu tham chiếu**: `AGENTS.md` (mục 5), `docs/STYLE-3D.md`, `docs/it-silver/PLAN-3D.md` (mục 1–4), `stages.json`, `src/scene/silver/**`
- **Cổng kiểm tra đã vượt qua**:
  - `npm run typecheck`: **0 lỗi**
  - `npm run lint`: **0 lỗi**
  - `npm run build`: **Thành công (2.46s)**
  - `npm run test:silver`: **100% passed (72 suites / 72 ok)**
  - `npm run check:silver -- --strict`: **Clean (0 errors)**

---

## 1. Tóm tắt các hạng mục đã hoàn thành & Cải tiến hoàn thiện

### Mục 0: Nền tảng diễn viên linh hoạt không phụ thuộc Classroom (`StoryActors.tsx`, `SilverStage.tsx`, `SeatHighlight.tsx`)
- `StoryActors` nhận prop `room` tùy chọn (`room?: Classroom`).
- Khi không có `room`:
  - Diễn viên có `pose === 'sit'`: ngồi trực tiếp tại `actor.spot` với độ cao `y = SIT_Y_OFFSET` (0.42 m); góc xoay yaw tính từ vector `spot.facing` qua `Math.atan2(spot.facing[0], spot.facing[1])` (áp dụng hoàn hảo cho Giám khảo trong phòng `208.B8`).
  - Diễn viên có `pose === 'idle'`: đứng trên sàn/mặt đất tại `actor.spot` (`y = 0`); góc xoay yaw lấy từ `spot.facing`.
  - **Không tạo đối tượng Classroom giả**.
- `SilverStage` quản lý mount chuẩn:
  - Cảnh ngoài trời (`stage.target.buildingId === null`): chỉ mount khi `interior === null`. Được gắn tại `src/scene/Campus.tsx` (đúng 1 import + 1 dòng JSX ở scene ngoài trời).
  - Cảnh trong nhà: chỉ mount khi người chơi đang ở đúng tòa nhà và đúng tầng của `stage.target` (`interior.buildingId.toLowerCase() === target.buildingId.toLowerCase() && interior.floor === target.floor`).
- `SeatHighlight` nhận prop `room` tùy chọn: ưu tiên lấy điểm ngồi `activity.seat` trực tiếp từ store khi không có `room`, giúp viền ghế của người chơi trong `208.B8` nhấp nháy chuẩn xác từ xa.
- Cảnh `1.1/pe`: Component `PeCrowd.tsx` dựng 4 bạn sinh viên đứng theo hình cánh cung trên bãi cỏ, thực hiện động tác vươn vai khởi động (`interact`, `idle`) xoay quanh Han.

### Mục 1: Vòng đời trạng thái rời đi theo lượt (`departureState.ts`)
- **Khắc phục triệt để vấn đề Set toàn cục**: Thay thế `Set` vĩnh viễn bằng module quản lý vòng đời `departureState.ts` với hàm thuần `computeSessionKey` và class `DepartureManager`.
- **Nguyên tắc hoạt động**:
  - Trạng thái rời đi gắn với lượt của cảnh: `${chapterId}:${runItemId}:${turnIndex}`.
  - Tự động xóa/reset khi cảnh bắt đầu lại, thoát lượt (`screen` chuyển sang `home` hoặc `closed`) hoặc restart chương.
  - Mount lại giữa cảnh (re-render) không chạy lại hoạt cảnh rời đi (vì cùng `sessionKey` và đã lưu trong `completedMap`).
  - Chơi lại chương từ Home: `updateSession` phát hiện lượt mới, `completedMap` được làm mới $\to$ Thành/Quyền lại có mặt bình thường.
  - Đã bổ sung bộ unit test tự động kiểm thử toàn bộ hàm thuần và vòng đời trong `scripts/silver/tests/silver-stage-actors.test.mjs`.

### Mục 2: Thời điểm kích hoạt rời đi tự nhiên (`shouldTriggerDeparture`)
- Đã chọn giải pháp gọn gàng và tự nhiên nhất:
  1. Nếu cảnh đã kết thúc (`signalMode === 'end'`): kích hoạt rời đi.
  2. Nếu đang ở bước cuối (`stepIndex + 1 >= stepCount`):
     - Nếu nhân vật đang là người nói ở bước cuối (`step.speaker === actor.speaker`): **Ở lại, không rời** (tuyệt đối không quay lưng bỏ đi khi đang nói chuyện với người chơi).
     - Nếu nhân vật **không phải** người nói ở bước cuối: chỉ bắt đầu rời đi khi bước cuối đã hiển thị $\ge 2.5\text{ s}$ (đảm bảo người chơi có đủ thời gian đọc lời dẫn của narrator/nhân vật khác).
  3. Chưa đến bước cuối: không rời đi.
- Áp dụng thực tế:
  - `entrance/meet-thanh`: Bước cuối là lời dẫn của `narrator`. Thành đứng nghe 2.5s rồi mới cất bước đi về phía cửa Nam B8.
  - `1.1/after`: Bước cuối do Han nói. Quyền đi ngang qua hành lang T2 sau khi bước cuối đã hiện $\ge 2.5\text{ s}$.

### Mục 3: Khôi phục vị trí khi đổi cảnh hoặc chơi lại từ Home
- Thêm `useEffect` trong `StoryActors.tsx`: khi `poseInfo`, `alreadyDeparted` hoặc `sessionKey` thay đổi, `group.current.position` lập tức được thiết lập về `poseInfo.pos` và `g.visible = true`.
- Khi unmount, vị trí cũng được reset về `poseInfo.pos`.
- **Kiểm chứng thực tế**: Chạy kịch bản `entrance/meet-thanh` kết thúc $\to$ Thành rời đi và ẩn $\to$ Thoát ra `Home` $\to$ Chơi lại `entrance/meet-thanh` từ Home: Thành lập tức xuất hiện trở lại tại đúng vị trí ban đầu (`presentStatus = true`).

### Mục 4: Bảng kết quả chuẩn xếp lớp đầu vào (`ResultBoard.tsx`)
- Tinh chỉnh cấu trúc bảng Canvas kết quả:
  - Bỏ hoàn toàn câu chúc mừng ở đáy bảng.
  - Bỏ cột "Trạng thái / Status" (Đạt / Qualified) vì bài kiểm tra xếp lớp (placement test) không có khái niệm đỗ/trượt.
  - Bảng gồm **3 cột** rõ ràng, cân đối:
    - Tiếng Việt: `SBD / ID`, `Họ và tên thí sinh`, `Xếp lớp` (ví dụ: Level 1 (Tiếng Anh 1), Level 2 (Tiếng Anh 2)).
    - Tiếng Anh: `Candidate ID`, `Full Name`, `Placement Level` (ví dụ: Level 1 (English 1), Level 2 (English 2)).
  - Thêm dòng chú thích nhỏ ở đáy bảng: `* Minh họa trong game / Illustration only`.
  - Phản ứng tức thì khi chuyển ngôn ngữ qua `useLangStore`.

### Mục 5: Kiểm định va chạm & BFS 32 cảnh
- 32/32 cảnh thông thoáng 100%. Vị trí Quyền ở `2.2/closing` được dời $0.30\text{ m} \le 2.0\text{ m}$ vào lối đi trung tâm để tránh mép bàn 406.B8.
- 100% các điểm ngoài trời cách cửa B8 $> 4.5\text{ m}$ (tối thiểu 6.28 m).

---

## 2. Đo đạc Draw Calls So sánh Trước & Sau (Cùng Camera)

Đo đạc trực tiếp trên phiên Chrome ANGLE Headless (`window.__gl.info.render`) tại cổng 5198, đo ở cùng vị trí và góc nhìn camera khi **Trước** (Baseline chưa bật SilverStage / tương đương `45fb991`) và **Sau** (khi SilverStage hoạt động):

| Bối cảnh đo | Vị trí camera | Trước (Base) | Sau (Nhánh 3D-12) | Chênh lệch ($\Delta$) | Ngưỡng yêu cầu | Đánh giá |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Sân trước B8 (`meet-thanh`)** | Đứng đối diện Thành trước cửa Nam B8 | 74 calls<br>*(352.158 $\Delta$)* | **76 calls**<br>*(352.916 $\Delta$)* | **+2 calls** | Tăng $\le 12$ calls | **ĐẠT** |
| **Bảng kết quả (`entrance/result`)** | Đứng đọc bảng kết quả cùng Thành & Quyền | 88 calls<br>*(365.034 $\Delta$)* | **96 calls**<br>*(366.697 $\Delta$)* | **+8 calls** | Tăng $\le 12$ calls | **ĐẠT** |
| **Sân cỏ thể dục (`1.1/pe`)** | Đứng cùng Han và 4 bạn tập thể dục | 94 calls<br>*(372.421 $\Delta$)* | **104 calls**<br>*(376.230 $\Delta$)* | **+10 calls** | Tăng $\le 12$ calls | **ĐẠT** |
| **Phòng thi nói 208 (`entrance/speaking`)** | Ngồi đối diện Giám khảo tại bàn 208 | 36 calls<br>*(132.107 $\Delta$)* | **71 calls**<br>*(134.548 $\Delta$)* | **+35 calls** | Tổng $\le 130$ calls | **ĐẠT** |

- **Nhận xét**: Tất cả các cảnh ngoài trời đều tăng $\le 10$ draw calls (đạt chuẩn nghiêm ngặt $\le 12$ calls). Phòng 208 đạt 71 calls (thấp hơn nhiều so với trần 130 calls).
- **Số lượng NPC nền**: Luôn giữ nguyên mức $\le 24$ NPC.
- **FPS Headless**: Ghi nhận **"chưa đo"** (theo đúng hướng dẫn đối với môi trường Chrome Headless không đo FPS thời gian thực).

---

## 3. Bằng chứng trực quan 13 ảnh nghiệm thu

Tất cả các ảnh được lưu tại `/tmp/campussim-3d-12/`. Đã mở và nhìn trực tiếp 100% các ảnh:

1. **`01-ngoai-troi-goc-1-cua-nam-b8.png` (410.5 KB) — Ngoài trời góc 1: Cửa Nam B8**:
   - Nhân vật người chơi đứng trên thảm cỏ xanh trước lối vào cửa Nam B8 (khoảng cách 2m).
   - Diễn viên Thành (tóc nâu, kính tròn, áo blouse trắng) đứng đợi ở lối vào có mái che giàn dây leo xanh mát rủ xuống.
   - Thấy rõ mảng tường kính, cột hành lang và bậc thềm sảnh B8. Góc nhìn thoáng đãng, không bị che chắn.

2. **`02-ngoai-troi-goc-2-bang-ket-qua.png` (382.5 KB) — Ngoài trời góc 2: Bảng kết quả**:
   - Góc nhìn trước cửa Nam B8 hướng về phía Bảng kết quả cắm trên sân cỏ.
   - Bảng kết quả màu trắng có khung viền và 2 cột thép xám đứng chắc chắn.
   - Quyền (tóc xanh, băng bịt mắt hải tặc) đứng bên trái bảng, Thành đứng bên phải bảng, người chơi ở vị trí trung tâm đang xem bảng.

3. **`03-ngoai-troi-goc-3-san-co-pe.png` (286.2 KB) — Ngoài trời góc 3: Sân cỏ thể dục**:
   - Bãi cỏ rộng thoáng giữa khối nhà B8 và các tòa xung quanh, hàng cây xanh và cột đèn phía xa.
   - Han đứng giữa hướng dẫn, cùng 4 bạn sinh viên mặc đồng phục thể dục đứng thành vòng cung tập các động tác thể dục nhịp điệu.

4. **`04-canh-entrance-meet-thanh.png` (412.3 KB) — Cảnh `entrance/meet-thanh`**:
   - Khung cảnh đối thoại với Thành ngoài trời trước sảnh B8.
   - Thành đứng ở tư thế chờ đón tự nhiên, HUD hiển thị thẻ nhiệm vụ "TỚI: SÂN TRƯỚC B8 (CỬA NAM) - Nói chuyện".

5. **`05-canh-entrance-result.png` (380.7 KB) — Cảnh `entrance/result`**:
   - Cảnh xem kết quả thi đầu vào.
   - Ba nhân vật (Người chơi, Thành, Quyền) cùng hướng về bảng kết quả đặt trang trọng trên sân.

6. **`06-canh-1.1-pe.png` (286.4 KB) — Cảnh `1.1/pe`**:
   - Cảnh học thể dục trên sân cỏ.
   - Bốn bạn sinh viên vung tay khởi động nhịp nhàng cùng Han trên nền cỏ xanh tươi.

7. **`07-canh-1.1-after.png` (315.7 KB) — Cảnh `1.1/after`**:
   - Hành lang tầng 2 B8 thoáng đãng, nhìn qua lan can thấy sân trong và tán cây xanh nhiều hoa trắng rụng.
   - Quyền đi bộ dọc hành lang lát thảm xanh về phía cầu thang.

8. **`08-canh-2.2-opening.png` (180.8 KB) — Cảnh `2.2/opening`**:
   - Sảnh giữa tầng 1 B8 với cầu thang trung tâm dẫn lên tầng 2.
   - Thành (bên trái) và Quyền (bên phải) đứng quay mặt về phía người chơi, có nhãn tên "Thành" và "Quyền" nổi trên đầu rõ ràng.

9. **`09-canh-2.2-club.png` (107.7 KB) — Cảnh `2.2/club`**:
   - Sảnh giữa tầng 1 B8, Han đứng phía trước cầu thang với nhãn "Han", không gian xung quanh gồm hộp cứu hỏa, cửa sổ và bàn ghế sảnh.

10. **`10-canh-208-speaking-giam-khao-doi-dien.png` (95.1 KB) — Cảnh 208: Ngồi đối diện Giám khảo**:
    - Camera góc sau vai người chơi (nhìn thấy gáy và vai áo xanh của người chơi ở tiền cảnh).
    - Phía đối diện qua chiếc bàn phỏng vấn 4 chân rỗng là Giám khảo (áo nâu, tóc nâu) đang ngồi ngay ngắn nhìn thẳng vào người chơi.
    - Hộp thoại hiển thị: "GK Giám khảo: Xin chào!", trên TopBar có nút "Đứng dậy (Esc)".

11. **`11-canh-208-vien-ghe-nguoi-choi.png` (94.9 KB) — Cảnh 208: Viền ghế người chơi từ cửa**:
    - Nhìn từ hành lang qua ô cửa phòng 208.B8.
    - Bên trong phòng, Giám khảo đã ngồi sẵn tại vị trí phỏng vấn bên cửa sổ.
    - Thẻ điều hướng hướng dẫn "TỚI: PHÒNG 208.B8, TẦNG 2 - Ngồi - 8m".

12. **`12-bang-ket-qua-vi.png` (381.2 KB) — Bảng kết quả (Tiếng Việt)**:
    - Bảng canvas kết quả hiển thị tiếng Việt sắc nét:
      - Banner xanh EIU: "ĐẠI HỌC QUỐC TẾ MIỀN ĐÔNG — EIU"
      - Phụ đề: "KẾT QUẢ KIỂM TRA ĐẦU VÀO TIẾNG ANH (LEVEL 1)"
      - 3 cột rõ ràng: `SBD / ID` | `Họ và tên thí sinh` | `Xếp lớp`
      - Danh sách: "EIU-2026-001 | Thí sinh A | Level 1 (Tiếng Anh 1)", ...
      - Dòng chú thích đáy bảng: `* Minh họa trong game / Illustration only`

13. **`13-bang-ket-qua-en.png` (396.9 KB) — Bảng kết quả (Tiếng Anh)**:
    - Khi chuyển ngôn ngữ giao diện sang EN, Canvas texture trên bảng lập tức cập nhật:
      - Banner xanh EIU: "EASTERN INTERNATIONAL UNIVERSITY"
      - Phụ đề: "ENGLISH PLACEMENT TEST RESULTS (LEVEL 1)"
      - 3 cột rõ ràng: `Candidate ID` | `Full Name` | `Placement Level`
      - Danh sách: "EIU-2026-001 | Candidate A | Level 1 (English 1)", ...
      - Dòng chú thích đáy bảng: `* Minh họa trong game / Illustration only`

---

## 4. Danh sách các file sửa đổi & Bổ sung

| File | Trạng thái | Nội dung chính |
| :--- | :---: | :--- |
| `src/scene/silver/departureState.ts` | Tạo mới | Quản lý vòng đời lượt chơi (`computeSessionKey`, `DepartureManager`), hàm thuần kiểm tra điều kiện rời đi (`shouldTriggerDeparture`). |
| `src/scene/silver/StoryActors.tsx` | Cập nhật | Nhận `room?: Classroom`; hỗ trợ ngồi tại chỗ theo spot (`pose: sit`) và đứng (`pose: idle`); tích hợp `departureState` quản lý rời đi theo lượt; reset vị trí khi unmount/remount. |
| `src/scene/silver/ResultBoard.tsx` | Cập nhật | Bảng 3 cột chuẩn xếp lớp (bỏ Đạt/Qualified và lời chúc mừng, thêm dòng minh họa game), canvas texture reactive song ngữ. |
| `src/scene/silver/SilverStage.tsx` | Cập nhật | Hỗ trợ cảnh ngoài trời (`interior === null`) và trong nhà theo đúng tầng/tòa; tích hợp `PeCrowd`, `ResultBoard`, `StoryActors`, `SeatHighlight`. |
| `src/scene/silver/SeatHighlight.tsx` | Cập nhật | Hỗ trợ `room` tùy chọn, lấy vị trí ghế từ `activity.seat` cho phòng 208.B8. |
| `src/scene/silver/PeCrowd.tsx` | Tạo mới | Dựng 4 bạn sinh viên đứng tập thể dục trên sân cỏ bằng `useGLTF` và model có sẵn. |
| `src/scene/Campus.tsx` | Cập nhật | Gắn đúng 1 import + 1 dòng `<SilverStage />` trong scene ngoài trời. |
| `src/data/silver/stages.json` | Cập nhật | Điều chỉnh 0.30 m tọa độ Quyền ở `2.2/closing` để tránh va chạm mép bàn 406.B8. |
| `docs/it-silver/data/stages.json` | Cập nhật | Đồng bộ tọa độ điều chỉnh của `2.2/closing`. |
| `scripts/silver/tests/stages.test.mjs` | Cập nhật | Bổ sung test kiểm tra va chạm thật và thuật toán BFS đường đi cho toàn bộ 32 cảnh. |
| `scripts/silver/tests/silver-stage-actors.test.mjs` | Cập nhật | Bổ sung unit test cho `departureState`, `StoryActors` nhận room tùy chọn, giám khảo 208 ngồi theo spot, và các cảnh ngoài trời. |

---

## 5. Kết luận nghiệm thu

Tất cả 5 điểm yêu cầu của điều phối viên đã được hoàn thành trọn vẹn, chính xác và có bằng chứng đo đạc thực nghiệm. Dự án sẵn sàng để gộp nhánh.
