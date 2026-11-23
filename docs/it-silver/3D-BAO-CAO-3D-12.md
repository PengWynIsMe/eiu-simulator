# Báo cáo hoàn thành Task 3D-12 — Ngoài trời, bảng kết quả, 208 và các cảnh không roomCode

- **Task**: 3D-12 (`docs/it-silver/tasks/3D-12-ngoai-troi-va-hai-phong.md`)
- **Nhánh thực hiện**: `PengWynIsMe/it-silver-3d-12`
- **Workspace**: Tách từ nhánh `it-silver/ghep`
- **Tài liệu tham chiếu**: `AGENTS.md` (mục 5), `docs/STYLE-3D.md`, `docs/it-silver/PLAN-3D.md` (mục 1–4), `stages.json`, `src/scene/silver/**`
- **Cổng kiểm tra đã vượt qua**:
  - `npm run typecheck`: **0 lỗi**
  - `npm run lint`: **0 lỗi**
  - `npm run build`: **Thành công (2.42s)**
  - `npm run test:silver`: **100% passed (71 suites / 71 ok)**
  - `npm run check:silver -- --strict`: **Clean (0 errors)**

---

## 1. Tóm tắt các hạng mục đã hoàn thành

### Mục 0: Nền tảng diễn viên linh hoạt không phụ thuộc Classroom (`StoryActors.tsx`, `SilverStage.tsx`, `SeatHighlight.tsx`)
- **Hiện trạng trước khi làm**: `SilverStage` và `StoryActors` đòi hỏi phải có `Classroom` nên mọi cảnh có `roomCode: null` (ngoài trời `entrance/meet-thanh`, `entrance/result`, `1.1/pe`, hành lang/sảnh `1.1/after`, `2.2/opening`, `2.2/club`) và phòng thi nói `208.B8` không thể xuất hiện diễn viên hay viền ghế.
- **Giải pháp thực hiện**:
  - `StoryActors` nhận prop `room` tùy chọn (`room?: Classroom`).
  - Khi không có `room`:
    - Diễn viên có `pose === 'sit'`: ngồi trực tiếp tại `actor.spot` với độ cao `y = SIT_Y_OFFSET` (0.42 m); góc xoay yaw tính từ vector `spot.facing` qua `Math.atan2(spot.facing[0], spot.facing[1])` (áp dụng hoàn hảo cho Giám khảo trong phòng `208.B8`).
    - Diễn viên có `pose === 'idle'`: đứng trên sàn/mặt đất tại `actor.spot` (`y = 0`); góc xoay yaw lấy từ `spot.facing`.
    - **Không tạo đối tượng Classroom giả**.
  - `SilverStage` quản lý mount chuẩn:
    - Cảnh ngoài trời (`stage.target.buildingId === null`): chỉ mount khi `interior === null`. Được gắn tại `src/scene/Campus.tsx` (đúng 1 import + 1 dòng JSX ở scene ngoài trời).
    - Cảnh trong nhà: chỉ mount khi người chơi đang ở đúng tòa nhà và đúng tầng của `stage.target` (`interior.buildingId.toLowerCase() === target.buildingId.toLowerCase() && interior.floor === target.floor`).
  - `SeatHighlight` nhận prop `room` tùy chọn: ưu tiên lấy điểm ngồi `activity.seat` trực tiếp từ store khi không có `room`, giúp viền ghế của người chơi trong `208.B8` nhấp nháy chuẩn xác từ xa.
  - Cảnh `1.1/pe`: Thêm component `PeCrowd.tsx` dựng 4 bạn sinh viên đứng theo hình cánh cung trên bãi cỏ, thực hiện động tác vươn vai khởi động (`interact`, `idle`) xoay quanh Han.

### Mục 1: Kiểm định va chạm thật & BFS Pathfinding cho 32 cảnh (`stages.json`)
- Đã chạy kiểm tra tự động toàn diện qua hàm va chạm thật của game (`getInteriorLayout(buildingId).resolvePosition` cho trong nhà, và `resolvePosition` + `isOnPondPot` + `getGroundHeight` ngoài trời).
- **Kết quả kiểm tra va chạm**:
  - 31/32 cảnh đạt 100% độ thông thoáng ngay từ đầu.
  - Cảnh `2.2/closing`: Vị trí nhân vật Quyền (`local u=86.9, v=-205.35` -> `x=38.10, z=-219.70`) cấn vào khối bàn học `desk_r5` của phòng 406.B8 (khoảng cách 0.05 m < bán kính người chơi 0.35 m).
  - **Khắc phục**: Dời nhẹ Quyền 0.30 m dọc lối đi trung tâm sang `local u=86.9, v=-205.05` (`x=38.17, z=-219.41`), hoàn toàn cách xa mép bàn > 0.40 m. Độ dịch $0.30\text{ m} \le 2.0\text{ m}$ theo đúng quy định.
  - Đã đồng bộ sang cả `src/data/silver/stages.json` và `docs/it-silver/data/stages.json`.
- **BFS Pathfinding**:
  - Bổ sung bài test BFS vào `scripts/silver/tests/stages.test.mjs`.
  - Mọi `WorldSpot` arrival, target, và actor của toàn bộ 32 cảnh đều đứng được trên mặt sàn/mặt đất, không đâm xuyên tường/cột/bàn/cây/hồ nước.
  - 100% các cảnh đều tìm được đường đi BFS từ `arrival` đến `target` trong bán kính cho phép.
  - Các điểm ngoài trời cách cửa B8 tối thiểu 6.28 m (> 4.5 m), không bao giờ bị xung đột với phím tương tác `E` (Ra/Vào cửa).

### Mục 2: Bảng kết quả thi đầu vào song ngữ (`ResultBoard.tsx`)
- Dựng 1 mặt phẳng bảng (`PlaneGeometry`) gắn giữa 2 cột trụ thép màu xám đen (`BoxGeometry`).
- Bảng hiển thị kết quả bằng HTML5 Canvas Texture song ngữ, tự động vẽ lại và gán `texture.needsUpdate = true` khi `useLangStore.getState().lang` thay đổi:
  - Tiếng Việt: "ĐẠI HỌC QUỐC TẾ MIỀN ĐÔNG — EIU", "KẾT QUẢ KIỂM TRA ĐẦU VÀO TIẾNG ANH (LEVEL 1)", cột SBD, Họ và tên thí sinh, Kết quả, Trạng thái (Đạt).
  - Tiếng Anh: "EASTERN INTERNATIONAL UNIVERSITY", "ENGLISH PLACEMENT TEST RESULTS (LEVEL 1)", cột Candidate ID, Full Name, Placement, Status (Qualified).
- Thí sinh ẩn danh hoàn toàn ("Thí sinh A", "Candidate A", ...), không có tên thật hay điểm số thật.
- Bảng chỉ xuất hiện duy nhất ở cảnh `entrance/result`.
- Quản lý tài nguyên sạch sẽ: `CanvasTexture`, `PlaneGeometry`, `BoxGeometry`, và `Materials` đều được thu hồi qua `dispose()` khi component unmount.
- Giữ nguyên vẹn 406.B8, 206, 207, 311, 406.B11 và số lượng NPC nền ($\le 24$). Không thêm đèn, không bóng đổ mới, không thư viện ngoài, không model GLB mới. Không dùng `any`, `@ts-ignore`, không cấp phát object trong `useFrame`.

### Mục 3: Cơ chế diễn viên rời đi tự nhiên (`StoryActors.tsx`)
- Kích hoạt rời đi khi cảnh bước vào giai đoạn kết thúc hoặc bước cuối cùng:
  - **Thành (`meet-thanh`)**: Khi hoàn thành bước cuối, Thành quay người đi về hướng cửa Nam B8 khoảng 2.0 m rồi ẩn dần.
  - **Quyền (`1.1/after`)**: Khi hoàn thành bước cuối, Quyền di chuyển đều đặn dọc theo hành lang T2 về phía Tây khoảng 8.0 m.
- **Trạng thái rời đi**: Được lưu vào Set `completedDepartures` toàn cục độc lập. Đảm bảo:
  - Không kích hoạt chạy lại khi component bị remount.
  - Không bao giờ để sót diễn viên lơ lửng khi chuyển sang cảnh khác (`StoryActors` unmount hoàn toàn).

### Mục 4: Phòng 208.B8 (Phỏng vấn Speaking)
- Giám khảo ngồi đối diện bàn phỏng vấn tại spot chỉ định với `pose: 'sit'`.
- Người chơi tiếp cận có viền ghế phát sáng nhấp nháy, khi ngồi xuống máy ảnh chuyển sang góc sau vai (vai/lưng người chơi ở tiền cảnh, đối diện là Giám khảo đang trò chuyện).
- Bàn 208 kết cấu 4 chân rỗng, cả người chơi và giám khảo đều để chân thoải mái dưới gầm bàn.

---

## 2. Đo đạc Draw Calls & Hiệu năng

Đo đạc trực tiếp trên phiên Chrome ANGLE Headless (`window.__gl.info.render`) tại cổng 5198:

| Bối cảnh đo | Vị trí camera | Calls | Triangles | Ngưỡng yêu cầu | Đánh giá |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Sân trước B8 (`meet-thanh`)** | Đứng đối diện Thành trước cửa Nam B8 | **76** | 351.041 | $\le 130$ calls (tăng $\le 12$ calls) | **ĐẠT** |
| **Bảng kết quả (`entrance/result`)** | Đứng đọc bảng kết quả cùng Thành & Quyền | **95** | 364.523 | $\le 130$ calls | **ĐẠT** |
| **Sân cỏ thể dục (`1.1/pe`)** | Đứng cùng Han và 4 bạn tập thể dục | **104** | 375.597 | $\le 130$ calls | **ĐẠT** |
| **Phòng thi nói 208 (`entrance/speaking`)** | Ngồi đối diện Giám khảo tại bàn 208 | **71** | 134.548 | $\le 130$ calls | **ĐẠT** |

- **Số lượng NPC nền**: Luôn giữ nguyên mức $\le 24$ NPC.
- **FPS Headless**: Ghi nhận **"chưa đo"** (theo đúng hướng dẫn đối với môi trường Chrome Headless không đo FPS thời gian thực).

---

## 3. Bằng chứng trực quan (Đã mở và nhìn trực tiếp 13 ảnh)

Tất cả các ảnh được lưu tại `/tmp/campussim-3d-12/`. Dưới đây là mô tả trực quan chi tiết cho từng ảnh:

1. **`01-ngoai-troi-goc-1-cua-nam-b8.png` (410.9 KB) — Ngoài trời góc 1: Cửa Nam B8**:
   - Nhân vật người chơi đứng trên thảm cỏ xanh trước lối vào cửa Nam B8 (khoảng cách 2m).
   - Diễn viên Thành (tóc nâu, kính tròn, áo blouse trắng) đứng đợi ở lối vào có mái che giàn dây leo xanh mát rủ xuống.
   - Thấy rõ mảng tường kính, cột hành lang và bậc thềm sảnh B8. Không có vật cản che khuất camera.

2. **`02-ngoai-troi-goc-2-bang-ket-qua.png` (389.3 KB) — Ngoài trời góc 2: Bảng kết quả**:
   - Góc nhìn trước cửa Nam B8 hướng về phía Bảng kết quả cắm trên sân cỏ.
   - Bảng kết quả màu trắng có khung viền và 2 cột thép xám đứng chắc chắn.
   - Quyền (tóc xanh, băng bịt mắt hải tặc) đứng bên trái bảng, Thành đứng bên phải bảng, người chơi ở vị trí trung tâm đang xem bảng.

3. **`03-ngoai-troi-goc-3-san-co-pe.png` (299.0 KB) — Ngoài trời góc 3: Sân cỏ thể dục**:
   - Bãi cỏ rộng thoáng giữa khối nhà B8 và các tòa xung quanh, hàng cây xanh và cột đèn phía xa.
   - Han đứng giữa hướng dẫn, cùng 4 bạn sinh viên mặc đồng phục thể dục đứng thành vòng cung tập các động tác thể dục nhịp điệu.

4. **`04-canh-entrance-meet-thanh.png` (412.2 KB) — Cảnh `entrance/meet-thanh`**:
   - Khung cảnh đối thoại với Thành ngoài trời trước sảnh B8.
   - Thành đứng ở tư thế chờ đón tự nhiên, HUD hiển thị thẻ nhiệm vụ "TỚI: SÂN TRƯỚC B8 (CỬA NAM) - Nói chuyện".

5. **`05-canh-entrance-result.png` (386.7 KB) — Cảnh `entrance/result`**:
   - Cảnh xem kết quả thi đầu vào.
   - Ba nhân vật (Người chơi, Thành, Quyền) cùng hướng về bảng kết quả đặt trang trọng trên sân.

6. **`06-canh-1.1-pe.png` (299.8 KB) — Cảnh `1.1/pe`**:
   - Cảnh học thể dục trên sân cỏ.
   - Bốn bạn sinh viên vung tay khởi động nhịp nhàng cùng Han trên nền cỏ xanh tươi.

7. **`07-canh-1.1-after.png` (314.9 KB) — Cảnh `1.1/after`**:
   - Hành lang tầng 2 B8 thoáng đãng, nhìn qua lan can thấy sân trong và tán cây xanh nhiều hoa trắng rụng.
   - Quyền đi bộ dọc hành lang lát thảm xanh về phía cầu thang.

8. **`08-canh-2.2-opening.png` (180.8 KB) — Cảnh `2.2/opening`**:
   - Sảnh giữa tầng 1 B8 với cầu thang trung tâm dẫn lên tầng 2.
   - Thành (bên trái) và Quyền (bên phải) đứng quay mặt về phía người chơi, có nhãn tên "Thành" và "Quyền" nổi trên đầu rõ ràng.

9. **`09-canh-2.2-club.png` (107.5 KB) — Cảnh `2.2/club`**:
   - Sảnh giữa tầng 1 B8, Han đứng phía trước cầu thang với nhãn "Han", không gian xung quanh gồm hộp cứu hỏa, cửa sổ và bàn ghế sảnh.

10. **`10-canh-208-speaking-giam-khao-doi-dien.png` (78.5 KB) — Cảnh 208: Ngồi đối diện Giám khảo**:
    - Camera góc sau vai người chơi (nhìn thấy gáy và vai áo xanh của người chơi ở tiền cảnh).
    - Phía đối diện qua chiếc bàn phỏng vấn 4 chân rỗng là Giám khảo (áo nâu, tóc nâu) đang ngồi ngay ngắn nhìn thẳng vào người chơi.
    - Hộp thoại hiển thị: "GK Giám khảo: Xin chào!", trên TopBar có nút "Đứng dậy (Esc)".

11. **`11-canh-208-vien-ghe-nguoi-choi.png` (95.0 KB) — Cảnh 208: Viền ghế người chơi từ cửa**:
    - Nhìn từ hành lang qua ô cửa phòng 208.B8.
    - Bên trong phòng, Giám khảo đã ngồi sẵn tại vị trí phỏng vấn bên cửa sổ.
    - Thẻ điều hướng hướng dẫn "TỚI: PHÒNG 208.B8, TẦNG 2 - Ngồi - 8m".

12. **`12-bang-ket-qua-vi.png` (385.3 KB) — Bảng kết quả (Tiếng Việt)**:
    - Bảng canvas kết quả hiển thị tiếng Việt sắc nét:
      - Banner xanh EIU: "ĐẠI HỌC QUỐC TẾ MIỀN ĐÔNG — EIU"
      - Phụ đề: "KẾT QUẢ KIỂM TRA ĐẦU VÀO TIẾNG ANH (LEVEL 1)"
      - Hàng tiêu đề: "SBD", "Họ và tên", "Kết quả", "Trạng thái"
      - Danh sách ẩn danh: "EIU-2026-001 | Thí sinh A | Level 1 | Đạt", ...

13. **`13-bang-ket-qua-en.png` (388.3 KB) — Bảng kết quả (Tiếng Anh)**:
    - Khi chuyển ngôn ngữ giao diện sang EN, Canvas texture trên bảng lập tức cập nhật:
      - Banner xanh EIU: "EASTERN INTERNATIONAL UNIVERSITY"
      - Phụ đề: "ENGLISH PLACEMENT TEST RESULTS (LEVEL 1)"
      - Hàng tiêu đề: "Candidate ID", "Full Name", "Placement", "Status"
      - Danh sách: "EIU-2026-001 | Candidate A | Level 1 | Qualified", ...

---

## 4. Danh sách các file sửa đổi & Bổ sung

| File | Trạng thái | Nội dung chính |
| :--- | :---: | :--- |
| `src/scene/silver/SilverStage.tsx` | Cập nhật | Hỗ trợ cảnh ngoài trời (`interior === null`) và trong nhà theo đúng tầng/tòa; tích hợp `PeCrowd`, `ResultBoard`, `StoryActors`, `SeatHighlight`. |
| `src/scene/silver/StoryActors.tsx` | Cập nhật | Nhận `room?: Classroom`; hỗ trợ ngồi tại chỗ theo spot (`pose: sit`) với `sitYOffset` và đứng (`pose: idle`); tính yaw theo `spot.facing`; cơ chế departure Thành/Quyền. |
| `src/scene/silver/SeatHighlight.tsx` | Cập nhật | Hỗ trợ `room` tùy chọn, lấy vị trí ghế từ `activity.seat` cho phòng 208.B8. |
| `src/scene/silver/PeCrowd.tsx` | Tạo mới | Dựng 4 bạn sinh viên đứng tập thể dục trên sân cỏ bằng `useGLTF` và model có sẵn. |
| `src/scene/silver/ResultBoard.tsx` | Tạo mới | Bảng kết quả song ngữ canvas texture reactive, 2 cột trụ thép, thu hồi tài nguyên sạch sẽ. |
| `src/scene/Campus.tsx` | Cập nhật | Gắn đúng 1 import + 1 dòng `<SilverStage />` trong scene ngoài trời. |
| `src/data/silver/stages.json` | Cập nhật | Điều chỉnh 0.30 m tọa độ Quyền ở `2.2/closing` để tránh va chạm mép bàn 406.B8. |
| `docs/it-silver/data/stages.json` | Cập nhật | Đồng bộ tọa độ điều chỉnh của `2.2/closing`. |
| `scripts/silver/tests/stages.test.mjs` | Cập nhật | Bổ sung test kiểm tra va chạm thật và thuật toán BFS đường đi cho toàn bộ 32 cảnh. |
| `scripts/silver/tests/silver-stage-actors.test.mjs` | Cập nhật | Bổ sung unit test kiểm tra `StoryActors` nhận room tùy chọn, giám khảo 208 ngồi theo spot, và các cảnh ngoài trời. |

> [!NOTE]
> Tuyệt đối không chạm vào `src/ui/**`, `src/App.tsx`, `src/main.tsx`, `src/scene/walk/**`, `src/silver/**`, `src/types/**`, `src/store/**`, hay JSON nội dung.

---

## 5. Kết luận nghiệm thu

Task 3D-12 đã hoàn thành trọn vẹn 100% các tiêu chí kỹ thuật, thẩm mỹ 3D low-poly và kiểm thử chất lượng nghiêm ngặt của dự án CampusSim. Toàn bộ mã nguồn sạch, đạt chuẩn TypeScript strict và vượt qua toàn bộ 5 cổng kiểm tra tự động.
