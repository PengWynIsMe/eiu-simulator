# Báo cáo hoàn thành Task 3D-10 — Trọn kỳ 2.2 trong 3D

- **Task**: 3D-10 (`docs/it-silver/tasks/3D-10-tron-ky-2-2.md`)
- **Nhánh**: `PengWynIsMe/it-silver-3d-10`
- **Môi trường & Cổng kiểm tra**: Node 20+, Chrome Headless, cổng **5198**
- **Trạng thái**: Hoàn thành 100% tất cả các mục A, B, C, D của đặc tả.

---

## 1. Danh sách file thay đổi & chức năng

### File tạo mới
1. **`src/ui/silverWorld/WorldDayCard.tsx`**:
   - Thẻ ngày nổi bật với hiệu ứng chuyển đổi mờ dần 0,6 s (`fade 0,6 s`, `transition-opacity duration-[600ms]`).
   - Hiển thị tên thứ song ngữ chuẩn từ `meeting.day` (ví dụ: `Thứ Ba` / `TUESDAY`, `Thứ Hai` / `MONDAY`).
   - Chỉ xuất hiện khi có sự thay đổi ngày học (`meeting.day` khác ngày trước đó); hai môn học cùng ngày sẽ không kích hoạt lại thẻ ngày.
   - Tự động mờ dần và ẩn sau 1,8 giây (0,6 s fade in → 0,6 s hiển thị → 0,6 s fade out).
2. **`docs/it-silver/3D-BAO-CAO-3D-10.md`**:
   - Báo cáo kết quả thực hiện, đối chiếu đặc tả, mô tả ảnh chụp thực tế và đo thời gian.

### File chỉnh sửa
3. **`src/scene/silver/departureState.ts`**:
   - Sửa lỗi A.1: Bỏ side effect `updateSession` ra khỏi `useMemo` của component.
   - Thêm cơ chế nghe store dùng chung `subscribeToStore(store)` có thể hủy đăng ký (`unsubscribe`), chạy liên tục ở cấp ứng dụng.
   - Cung cấp `useDepartureSessionKey()` sử dụng `useSyncExternalStore` để component đọc `sessionKey` một cách thuần túy, phản ứng mượt mà mà không có side effect.
4. **`src/scene/silver/StoryActors.tsx`**:
   - Dùng hook `useDepartureSessionKey()`, loại bỏ việc gọi `updateSession` trong `useMemo`.
   - Bổ sung cấu hình rời đi cho diễn viên Quyền sau cảnh `2.2/opening`: đi thẳng 4 m theo hướng Bắc dọc hành lang về phía thang máy B8 rồi ẩn (`key: '2.2/opening:quyen'`, `dir: [-0.22663, -0.97398]`, `maxDist: 4.0`, `speed: 1.4`).
   - Bổ sung quy tắc cho chế độ `exam` (`CSE 103/exam`): diễn viên Han ngồi yên làm bài, không giơ tay gợi ý (`raiseHand`) và không thực hiện cử chỉ báo đáp án (`yes`).
5. **`src/scene/lesson/Teacher.tsx`**:
   - Bổ sung kiểm tra chế độ `exam` (`signal.stepKey.includes('exam')`): thầy giáo quan sát lớp học, không gật (`yes`) hoặc lắc đầu (`no`) sau từng câu hỏi/bài tập cho đến khi nộp bài kết thúc (`signal.mode === 'end'`).
6. **`src/silverWorld/silverSignal.ts`**:
   - Sửa bìa TV phòng lý thuyết (`isTheory`): TV hiển thị tên môn học theo ngôn ngữ đang chọn (tra từ `getCourse(courseCode).name[lang]`, ví dụ: "Giải tích II" / "Calculus 2") thay vì tên cảnh chi tiết.
   - Các phòng khác (lab 406.B8) vẫn giữ tên cảnh bài tập theo hợp đồng cũ.
7. **`src/ui/silver/presentation.ts`**:
   - Sửa lỗi A.2: Snapshot `useSyncExternalStore` nay bao gồm `{ userMode, webglLost }`, đảm bảo component tự động re-render ngay khi ngữ cảnh WebGL bị mất hoặc phục hồi.
   - Bổ sung hàm `attachWebglCanvas(canvas)` và lắng nghe sự kiện `webglcontextlost` / `webglcontextrestored` ở pha capture trên `window` (do sự kiện không bubble).
   - Xuất hàm `onPresentationChange(listener)` để đồng bộ director ngay tức thì khi chuyển chế độ 2D/3D.
8. **`src/ui/silverWorld/directorBridge.ts`**:
   - Sửa lỗi A.3: `isWorldActive` trở thành hàm kiểm tra thuần túy (pure check), không bật `walkMode` như một side effect ngầm; loại bỏ tham số `_sceneId` thừa.
9. **`src/ui/silverWorld/WorldLayer.tsx`**:
   - Nhúng `<WorldDayCard />` vào lớp UI 3D world.
10. **`src/main.tsx`**:
    - Tách hành động bật `walkMode` khi vào màn play ở chế độ 3D world vào nơi gọi `syncDirector`.
    - Kết nối `departureManager.subscribeToStore(silverStore)`.
    - Kết nối `onPresentationChange(syncDirector)`: khi đổi chế độ 2D/3D, director đồng bộ dừng/bắt đầu ngay lập tức mà không cần chờ `silverStore` thay đổi.
    - Lộ `silver` và `activity` trong `window.__stores` ở chế độ DEV để hỗ trợ kiểm thử.
11. **`src/App.tsx`**:
    - Gọi `attachWebglCanvas(gl.domElement)` trong callback `onCreated` của `<Canvas>`.
12. **`scripts/silver/tests/silver-stage-actors.test.mjs`**:
    - Bổ sung bài kiểm thử vòng đời `departureManager.subscribeToStore`: meet-thanh xong → cảnh khác → exitRun → startChapter restart → Thành có mặt lại đầy đủ; mount lại giữa cảnh không chạy lại hoạt cảnh rời đi.
13. **`scripts/silver/tests/ui-world.test.mjs`**:
    - Kiểm thử chuyển đổi chế độ và mất ngữ cảnh WebGL cập nhật snapshot ngay lập tức.
    - Kiểm thử Tiêu chí D: Chạy trọn vẹn 2 biến thể của kỳ 2.2 (đổi tự chọn sang CSE 204; thêm môn thứ 6 STAT 101) trong chế độ 3D World mà không cảnh nào bị lùi về overlay.
    - Kiểm thử vào thẳng từng item bằng bản lưu giả xuất hiện chính xác tại cửa/arrival của stage tương ứng.

---

## 2. Kết quả các lệnh kiểm tra

Tất cả 5 cổng kiểm tra chất lượng đạt kết quả 100% thành công:

```bash
$ npm run typecheck
> tsc -b --noEmit
# Kết quả: 0 lỗi. TypeScript strict tuân thủ nghiêm ngặt, không any, không @ts-ignore.

$ npm run lint
> eslint .
# Kết quả: 0 lỗi lint.

$ npm run build
> tsc -b && vite build
# Kết quả: Build production thành công trong 2.4s (thư mục dist/ hoàn chỉnh).

$ npm run test:silver
> node scripts/silver/test.mjs
# Kết quả: Toàn bộ 62/62 bài test vượt qua thành công (100% OK).

$ npm run check:silver -- --strict
> node scripts/silver/check.mjs --strict
# Kết quả: Toàn bộ nội dung, mã môn, 32/32 cảnh và kế hoạch 180 TC đạt chuẩn strict.
```

---

## 3. Kiểm tra trình duyệt thực tế & Mô tả ảnh chụp

Đã chạy kiểm thử headless Chrome trên cổng độc lập **5198** (không đụng 5190 hay 5197), chụp và kiểm tra 4 ảnh tại `/tmp/campussim-3d-10/`:

1. **`01-day-card-vi.png` (Thẻ ngày VI)**:
   - Thẻ nổi bật chính giữa màn hình với nền xanh navy đậm bo tròn 16px, icon lịch 📅, dòng chữ lớn **"Thứ Hai"** và phụ đề phụ **"MONDAY"**.
   - Phía sau là hành lang B8 và thẻ chỉ đường bên trái ("Tới: Phòng máy 406.B8, Tầng 4").
2. **`02-day-card-en.png` (Thẻ ngày EN)**:
   - Thẻ ngày xuất hiện mượt mà khi chuyển ngày sang môn MATH 112 (Thứ Ba).
   - Dòng chữ tiếng Anh **"Tuesday"** nổi bật phía trên, phụ đề tiếng Việt **"THỨ BA"** bên dưới.
   - Thanh điều khiển trên đã chuyển sang ngôn ngữ tiếng Anh ("Adding two vectors · MATH 112 · Step 1/3", nút "Your week", "Skip scene", "Exit").
   - Phía sau nhìn rõ cửa phòng 207.B8 tầng 2 cùng các bạn sinh viên bên trong phòng.
3. **`03-tv-cover-theory.png` (Bìa TV phòng lý thuyết 207.B8)**:
   - Màn hình TV áp tường lớn ở đầu phòng 207.B8 hiển thị rõ ràng tên môn học bằng tiếng Việt: **"Giải tích II"** kèm mã môn **"MATH 112"** ở góc dưới.
   - Người chơi và sinh viên (kèm Han ngồi gần đó) đang hướng về phía TV. Bìa TV không còn hiển thị tên cảnh chi tiết mà thể hiện đúng tên môn học theo ngôn ngữ.
4. **`04-exam-cse103.png` (Kỳ thi CSE 103/exam trong 406.B8)**:
   - Tiêu đề trên thanh: "Thi cuối môn (mô phỏng) · CSE 103 · Bước 1/3".
   - Nhân vật đứng trước máy tính trong phòng 406.B8 tầng 4.
   - Han ngồi ở hàng ghế bên phải (máy tính 406-r2-s6), chăm chú nhìn màn hình, hoàn toàn không có bong bóng gợi ý hay cử chỉ gật đầu báo đáp án.
   - Thầy giáo đứng quan sát trung lập, không gật/lắc đầu trước khi bài thi được nộp.
5. **Hiệu năng**:
   - Tốc độ khung hình (FPS) đo được tại phòng máy 406.B8 và phòng lý thuyết 207.B8 ổn định ở mức **60 FPS**.

---

## 4. Đo thời gian (Bản đi bộ vs Bản "Tới nơi luôn")

Theo tổng hợp nội dung thời lượng môn học của Kỳ 2.2:
- **Thời lượng nội dung**: Opening (2m) + Lab 1 (4m) + Lab 2 (3.5m) + 4 ngày lý thuyết (16.5m) + Exam (2.5m) + Closing (2m) + Club (1m) ≈ **31,5 phút**.
- **Bản đi bộ (WASD tự đi)**:
  - Đi bộ qua các chặng: sảnh T1 (4 m) + thang máy lên T4 vào 406.B8 (~45 m) + 4 lượt hành lang T2 vào 207.B8 (~60 m) + đi tới phòng thi 406.B8 (~35 m) + di chuyển tan lớp và sảnh T1.
  - Tổng thời gian đi lại: ≈ 3,2 phút.
  - Thời gian tương tác ngồi/đứng dậy: ≈ 0,8 phút.
  - **Tổng thời gian bản đi bộ**: **≈ 35,5 phút**.
- **Bản "Tới nơi luôn" (Bấm nút ArriveNow)**:
  - Bỏ qua các đoạn đi bộ dài, dịch chuyển thẳng tới trước cửa/ghế của cảnh (chỉ mất ~1–2 giây chuyển cảnh thay vì 20–30 giây đi bộ).
  - Thời gian đi lại giảm xuống: ≈ 0,8 phút.
  - **Tổng thời gian bản "Tới nơi luôn"**: **≈ 32,3 phút**.

---

## 5. Kết luận & Đề xuất

- Tất cả các yêu cầu từ bugfix A.1, A.2, A.3 đến spec B, C, D đều đã được triển khai trọn vẹn, có bài kiểm thử tự động bảo vệ và kiểm tra thực tế trong trình duyệt.
- Không sửa bất kỳ file nào ngoài phạm vi cho phép (không chạm `src/silver/**`, `TopBar.tsx`, `LessonHud.tsx`, `types`, JSON nội dung hay `Lesson406`).
- Đã tắt dev server và đóng trình duyệt Chrome. Sẵn sàng báo cáo hoàn tất task.
