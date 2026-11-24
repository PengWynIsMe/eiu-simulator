# Báo cáo hoàn thành Task 3D-13 — Entrance và 1.1 trong 3D (Hoàn thiện chuyển cảnh, Examiner, Gật đầu và Hồi quy)

- **Task**: 3D-13 (`docs/it-silver/tasks/3D-13-entrance-va-1-1.md`)
- **Nhánh thực hiện**: `PengWynIsMe/it-silver-3d-13`
- **Workspace**: Tách từ `it-silver/ghep 8c09b54` (chứa đầy đủ 3D-00..07, 09..12)
- **Tài liệu tham chiếu**: `AGENTS.md` (mục 5), `docs/STYLE-3D.md`, `docs/it-silver/PLAN-3D.md`, `stages.json`, `data/silverWorld.types.txt`
- **Cổng kiểm tra đã vượt qua**:
  - `npm run typecheck`: **0 lỗi**
  - `npm run lint`: **0 lỗi**
  - `npm run build`: **Thành công (2.40s)**
  - `npm run test:silver`: **100% passed (76 suites / 76 ok)**
  - `npm run check:silver -- --strict`: **Clean (0 errors, 180 TC hợp lệ)**

---

## 1. Tóm tắt các hạng mục kỹ thuật đã hoàn thành

### A. Tích hợp trọn vẹn 13 cảnh Entrance và 1.1 theo `stages.json`
Đã rà soát và kiểm tra kỹ thuật trên toàn bộ 13 cảnh thuộc hai chương `entrance` và `1.1`:
1. `entrance/meet-thanh`: Gặp Thành trước cửa Nam B8, Thành hướng dẫn vào phòng thi.
2. `entrance/hallway`: Đi bộ qua hành lang T2 B8 tới phòng 206.
3. `entrance/waiting`: Chờ vào phòng thi trong không gian phòng 206.
4. `entrance/listening`: Thi nghe tại phòng 206.B8, câu hỏi trắc nghiệm đồng đội dạng giấy thi, audio qua `speechSynthesis` và phụ đề.
5. `entrance/reading`: Thi đọc hiểu tại phòng 206.B8.
6. `entrance/writing`: Thi viết tại phòng 206.B8.
7. `entrance/speaking`: Phỏng vấn nói 1-1 đối diện Giám khảo tại phòng 208.B8.
8. `entrance/result`: Xem bảng kết quả xếp lớp ngoài trời cùng Thành và Quyền.
9. `1.1/first-day`: Ngày đầu nhập học tại tầng 2 B8.
10. `1.1/greet-han`: Ngồi cạnh Han trong phòng 206, đối thoại chào hỏi mở đầu.
11. `1.1/pe`: Giờ học thể chất ngoài sân cỏ cùng Han và nhóm sinh viên tập khởi động.
12. `1.1/after`: Quyền đi qua hành lang sau giờ học.
13. `1.1/final`: Bài thi cuối kỳ trong phòng 206.B8 với Giám khảo coi thi và Han ngồi cạnh.

### B. Giám khảo (Examiner) thay Giảng viên ở `1.1/final` và phòng 206
- Trong `src/scene/lesson/Teacher.tsx`: Mở rộng thuộc tính tùy chọn `modelUrl?: string`. Khi có `modelUrl`, render đúng model được chỉ định thay vì model mặc định của giảng viên (`characterConfig.roles.teacher`).
- Trong `src/scene/silver/SilverStage.tsx`:
  - Khắc phục cơ chế tìm kiếm nhân vật đứng bục giảng: khi cảnh có `examiner` (hoặc `teacher`) nhưng không có tọa độ `spot` trong phòng, `instructorActor` tự động nhận diện và chuyển giao vị trí bục giảng cho nhân vật đó.
  - Sử dụng model `characterConfig.story?.examiner` (`models/characters/character-female-d.glb`) thay cho `characterConfig.roles.teacher` tại bài thi cuối kỳ `1.1/final` cũng như các phòng thi 206.
- Trong `src/scene/silver/StoryActors.tsx`: Loại trừ giám khảo đứng bục giảng khỏi danh sách diễn viên phụ tự do để tránh tạo trùng model.

### C. Gật đầu khi lựa chọn đối thoại 1-1 (`playUpper('yes')`)
- Trong `src/scene/silver/StoryActors.tsx`:
  - Lắng nghe tín hiệu `signal.mode === 'talk'` phát ra khi người chơi chọn một nhánh đối thoại.
  - Khi `signal.speaker === actor.speaker`, nhân vật đối diện lập tức kích hoạt hoạt ảnh gật đầu `playUpper('yes')`.
  - Giúp phản hồi cử chỉ sinh động, chân thực, đúng phong cách tương tác một-một.

### D. Thẻ chuyển cảnh mờ dần ("Ít hôm sau" / "Giờ thể chất" / "Giữa kỳ") & Tối ưu WorldDayCard
- Tái cấu trúc `src/ui/silverWorld/WorldDayCard.tsx`:
  - Thống nhất cơ chế hiển thị Day Card (thẻ ngày học) và Scene Title Card (thẻ tiêu đề cảnh: "Ít hôm sau", "Giờ thể chất", "Trước cửa B8", "Ngồi cạnh Han",...).
  - Quản lý trạng thái qua `lastDayRef` và `lastSceneIdRef`.
  - Khắc phục triệt để lỗi thẻ ngày hiện lại khi mở/đóng lịch tuần (`screen === 'week'`): chỉ reset `lastDayRef` khi thoát hẳn về `home`, đóng màn hình (`closed`), hoặc đổi `chapterId`.
  - Tự động bỏ qua fade cảnh nếu người chơi tiếp tục ngồi trong cùng phòng (`isKeepSeated`).

### E. Giao diện bài thi trắc nghiệm dạng giấy thi & Đọc giọng nói
- Trong `src/ui/silverWorld/WorldLayer.tsx`: Thiết kế khung hiển thị thẻ bài tập/câu hỏi `question` và `order` theo phong cách tờ giấy thi (`border border-amber-200/80 bg-[#fffdfa] shadow-lg rounded-2xl`).
- Tích hợp phát giọng đọc câu hỏi qua `window.speechSynthesis` đi kèm phụ đề đồng bộ ngay trên thẻ bài thi trong không gian 3D.

### F. Bộ kiểm thử tự động `entrance-and-level1.test.mjs`
Xây dựng bộ test suite mới tại `scripts/silver/tests/entrance-and-level1.test.mjs` kiểm tra toàn diện:
1. Xác thực 13 cảnh của `entrance` và `1.1` có `target`, `camera`, `stepCount` và cấu hình trigger hợp lệ.
2. Kiểm tra lựa chọn chào hỏi ở `1.1/greet-han` ảnh hưởng đến lời thoại của Han ở môn CSE 103:
   - Nhánh chào bài bản ("Tập chào nhau") $\to$ Lời thoại Han: *"Hồi đó tập chào nhau chuyên nghiệp quá mà..."*.
   - Nhánh chào đùa ("Hù một cái") $\to$ Lời thoại Han: *"Hồi đó tính hù tui mà thành bạn thân..."*.
3. Kiểm tra Giám khảo coi thi ở `1.1/final` xuất hiện đúng model `female-d`.
4. Kiểm tra cử chỉ gật đầu (`talk` signal $\to$ `yes` upper animation) cho diễn viên đối thoại.

---

## 2. Kết quả kiểm tra chất lượng & Tiêu chuẩn

```bash
npm run typecheck                  # 0 errors
npm run lint                       # 0 errors
npm run build                      # 2.40s, 0 errors
npm run test:silver                # 76 suites passed, 237 tests passed
npm run check:silver -- --strict   # 180 test cases clean, 0 errors
```

- **Tài nguyên**: Không có cảnh nào vượt ngưỡng Draw Calls ($\le 12$ calls tăng thêm ở ngoài trời, $\le 75$ calls trong phòng).
- **Bộ nhớ & Performance**: Tuyệt đối không tạo `new Vector3`, mảng hay object rác trong vòng lặp `useFrame`.
- **FPS Headless**: Ghi nhận **"chưa đo"** (đúng quy định không báo cáo FPS ảo từ môi trường headless).

---

## 3. Bằng chứng trực quan 13 ảnh nghiệm thu

Tất cả 13 ảnh đã được xuất ra `/tmp/campussim-3d-13/` bằng Chrome ANGLE WebGL. Đã trực tiếp mở và kiểm tra từng ảnh:

1. **`01-topbar-schedule-open.png` (545 KB) — TopBar mở lịch học tuần**:
   - Giao diện góc trên bên phải hiển thị nút 📚 đang kích hoạt, mở bảng thẻ tuần.
   - Nút 🎓 hoàn toàn biến mất theo đúng điều kiện `silverClosed && !scheduleOpen`. Không có hiện tượng chồng chéo icon.
2. **`02-nmlt01-walk-to-seat.png` (191 KB) — Hồi quy NMLT-01: Đi bộ hành lang T4 B11**:
   - Nhân vật điều khiển bằng phím WASD di chuyển từ sảnh thang máy T4 tới cửa phòng thực hành 406.B11.
   - Thấy rõ biển số phòng 406 và khung cửa mở rộng.
3. **`03-nmlt01-seated-lesson.png` (153 KB) — Hồi quy NMLT-01: Ngồi vào bàn học**:
   - Nhân vật nhấn phím `E` ngồi vào vị trí ghế viền vàng. Thầy Nam đứng bục giảng chào cả lớp, TV hiển thị slide bài học.
4. **`04-nmlt01-code-desktop.png` (241 KB) — Hồi quy NMLT-01: Thực hành Code Desktop**:
   - Màn hình máy tính ảo EIU Virtual Desktop hiển thị trình soạn thảo code và bài tập lập trình C cơ bản.
5. **`05-nmlt01-summary.png` (167 KB) — Hồi quy NMLT-01: Bảng tổng kết tiết học**:
   - Thẻ tổng kết tiết học NMLT-01 hiện lên đầy đủ thông tin điểm kinh nghiệm, kỹ năng và hoàn thành bài học.
6. **`06-entrance-meet-thanh.png` (165 KB) — Entrance: Gặp Thành trước cửa Nam B8**:
   - Thẻ chuyển cảnh "Trước cửa B8" mờ dần. Thành (áo blouse trắng, kính tròn) đứng ở lối vào sảnh Nam B8 chờ hướng dẫn người chơi.
7. **`07-entrance-listening-paper.png` (188 KB) — Entrance: Thi nghe phòng 206.B8**:
   - Không gian phòng 206.B8 với TV phát đề, giám khảo đứng bàn giáo viên.
   - Thẻ đề thi trắc nghiệm dạng giấy thi màu kem ngà (`#fffdfa`) hiển thị câu hỏi trắc nghiệm tiếng Anh rõ ràng kèm nút chọn.
8. **`08-entrance-speaking-208.png` (111 KB) — Entrance: Thi nói 1-1 phòng 208.B8**:
   - Người chơi ngồi đối diện Giám khảo qua bàn phỏng vấn. Giám khảo gật đầu lắng nghe khi người chơi đưa ra câu trả lời.
9. **`09-entrance-result-board.png` (214 KB) — Entrance: Bảng kết quả xếp lớp ngoài trời**:
   - Bảng kết quả thi xếp lớp cắm trên bãi cỏ trước tòa B8. Thành và Quyền đứng hai bên cùng người chơi xem kết quả phân lớp Level 1.
10. **`10-level1-greet-han.png` (137 KB) — Level 1: Ngồi cạnh Han (Phòng 206)**:
    - Thẻ tiêu đề "Ngồi cạnh Han" hiển thị thanh lịch rồi mờ dần.
    - Nhân vật ngồi cạnh Han ở dãy bàn phòng 206, đối thoại chào hỏi ngày đầu tiên nhập học.
11. **`11-level1-pe.png` (286 KB) — Level 1: Giờ học thể chất ngoài sân cỏ**:
    - Sân cỏ thể thao ngoài trời với Han và nhóm 4 sinh viên đứng vòng cung khởi động các động tác thể dục.
12. **`12-level1-final-examiner.png` (198 KB) — Level 1: Bài thi cuối kỳ phòng 206.B8**:
    - Giám khảo (Examiner, model nữ `character-female-d`) đứng nghiêm túc trên bục giảng coi thi thay thế cho thầy giáo thường ngày.
    - Han ngồi ở dãy bàn bên cạnh tập trung làm bài thi.
13. **`13-scene-transition-card.png` (136 KB) — Thẻ chuyển cảnh Scene Title Fade**:
    - Hiệu ứng thẻ tiêu đề cảnh "Ít hôm sau" / "Giờ thể chất" xuất hiện trang trọng ở giữa màn hình rồi chuyển tiếp mượt mà vào cảnh mới.

---

## 4. Kết luận

Toàn bộ các yêu cầu của Task 3D-13 và phần còn lại của Task 3D-11 đã được hoàn thành 100%, tuân thủ tuyệt đối các nguyên tắc của `AGENTS.md`. Hệ thống sẵn sàng cho việc nghiệm thu và tích hợp.
