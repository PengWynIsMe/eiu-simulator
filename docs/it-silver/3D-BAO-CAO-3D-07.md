# Báo cáo hoàn thành Task 3D-07 — UI màn chơi trong 3D (World Layer)

- **Task**: 3D-07 (`docs/it-silver/tasks/3D-07-ui-world.md`)
- **Nhánh thực hiện**: `PengWynIsMe/it-silver-3d-07`
- **Môi trường & Cổng**: Node 20+, Vite dev server port **5197**
- **Trạng thái**: Hoàn thành 100% cả 6 mục của spec, vượt qua toàn bộ 5 cổng kiểm tra và bộ kiểm thử tự động CDP thực tế (Lab 1 → Lab 2, Esc, Đứng/Đi/Ngồi, Code sai/đúng, Question sai/đúng, Đổi VI/EN, Hồi quy 2D).

---

## 1. Danh sách file thay đổi & chức năng

### File tạo mới
1. **`src/ui/silverWorld/text.ts`**:
   - Từ điển chuỗi song ngữ VI/EN cho UI 3D theo đúng mục 4 của spec: `arriveNow`, `goTo`, `upTo`, `downTo`, `sit`, `talk`, `look`, `standUp`, `skip`, `exit`, `dist`, cùng các nhãn máy tính ảo, bài tập CodeLab, thẻ điều hướng và hộp thoại xác nhận.
2. **`src/ui/silverWorld/directorBridge.ts`**:
   - Quản lý vòng đời khởi động/dừng `startDirector` đồng bộ theo chế độ `presentation`.
   - Hàm type guard `isSubscribableSilver` kiểm tra runtime kiểu an toàn (không ép kiểu `as unknown as`, ném ngoại lệ rõ ràng nếu store không có hàm `subscribe`).
   - Xây dựng `layoutMap` từ hằng export `b8.ts` kết hợp `createRoomWaypoint(getClassroom(...), toLocal)`.
   - Triển khai cửa vào dev `?silver3d=lab1` (`initDevSilver3DLab1`) chỉ kích hoạt khi `import.meta.env.DEV`.
   - Hàm `isWorldActive` kiểm tra chặt chẽ điều kiện bật World: dev mode + query `?silver3d=lab1` + `screen === 'play'` + stage có sẵn (`isStageAvailable`).
3. **`src/ui/silverWorld/WorldNavigationCard.tsx`**:
   - Thẻ điều hướng nổi góc trên bên trái ở phase `travel`/`near`: hiển thị địa điểm đích, hành động chặng tới (`nextWaypoint`), kim la bàn chỉ hướng quay theo góc nhìn, khoảng cách mét, nút "Tới nơi luôn" (`arriveNow`), "Bỏ qua cảnh" (`skip`) và "Thoát" (`exit`). Hỗ trợ giao diện co giãn tốt trên màn hình mobile 360px.
4. **`src/ui/silverWorld/WorldOrder.tsx`**:
   - Banner định danh đầu màn hình (`WorldOrder`): hiển thị tên Lab, mã môn, số bước hiện tại (`Bước i/n`), nút điều khiển góc phải ("Bỏ qua cảnh", "Thoát", nút chuyển đổi ngôn ngữ VI/EN tức thì).
5. **`src/ui/silverWorld/WorldDesktop.tsx`**:
   - Tích hợp máy tính sinh viên ảo (`DesktopView` + `CodeLabView`).
   - Tự động mở khi vào bước code (`screenOpen: true`).
   - Cung cấp nút thu máy `– Thu máy` (hoặc phím `Esc`) và thanh nổi phía dưới màn hình để mở lại máy tính bất cứ lúc nào.
   - Kết nối trực tiếp API của store: `answer`, `retry`, `showHint`, `revealAnswer`. Tự động gọi `retry()` để dọn sạch lỗi cũ khi người chơi gõ code mới và ấn Chạy.
6. **`src/ui/silverWorld/WorldLayer.tsx`**:
   - Lớp UI 2D trung tâm của chế độ 3D World (kết nối `useSilverStore` và `useActivityStore`).
   - Hiển thị theo từng bước:
     + Khi ở phase `travel` / `near`: hiển thị `WorldNavigationCard`.
     + Khi `engaged`: hiển thị `DialogueView` (cho bước `say`/`choice`), `SlideView compact` (cho bước `slide`), `QuestionView` (cho bước `question`), `WorldDesktop` (cho bước `code`), danh sách sắp xếp (cho bước `order`).
   - Điều phối thứ tự ưu tiên phím: Ô nhập code > Máy tính ảo (Esc thu) > Hộp thoại xác nhận > Phím tắt (E, Enter, 1-4) > Esc đứng dậy > Phím di chuyển 3D (W, A, S, D).
   - Bảo đảm không tạo object mới trong hook chu kỳ và ngăn chặn xung đột sự kiện chuột (`pointer-events-auto` đúng nơi).
7. **`scripts/silver/tests/ui-world.test.mjs`**:
   - Test tự động kiểm thử toàn bộ luồng `nextWaypoint` ngoài trời → cửa → thang máy → phòng → ghế.
   - Kiểm thử an toàn kiểu `isSubscribableSilver`.
   - Kiểm thử điều kiện kích hoạt `isWorldActive`.
   - Kiểm thử bảo đảm `director` hoàn toàn không dịch chuyển người chơi khi ở chế độ 2D overlay.

### File chỉnh sửa có giới hạn (đúng phạm vi phân quyền)
8. **`src/ui/silver/presentation.ts`**:
   - Quy định chế độ hiển thị: mặc định luôn là `'overlay'` (giữ nguyên vẹn 100% chế độ 2D hiện tại). Chỉ trả về `'world'` khi dev có `?silver3d=lab1` và cảnh có stage khả dụng (`isStageAvailable`). Đảm bảo `WorldLayer` và `Play` 2D không bao giờ hiển thị chồng chéo.
9. **`src/App.tsx`**:
   - Thêm đúng 1 import `WorldLayer` và 1 dòng `<WorldLayer />` trong cây component.
10. **`src/main.tsx`**:
   - Khởi chạy `startDirector` an toàn bên cạnh `startLessonBridge`.

---

## 2. Kết quả 5 cổng kiểm tra chất lượng

Tất cả 5 cổng kiểm tra đều chạy thành công 100% với mã thoát 0:

```bash
$ npm run typecheck
> tsc -b --noEmit
# 0 lỗi, TypeScript strict hoàn toàn sạch sẽ, không any, không @ts-ignore.

$ npm run lint
> eslint .
# 0 lỗi lint.

$ npm run build
> tsc -b && vite build
# Build hoàn tất thành công trong 2.39s (dist/ đầy đủ).

$ npm run test:silver
> node scripts/silver/test.mjs
# Toàn bộ 39/39 bài test đậu (gồm toàn bộ test đạo diễn, activity, layout, waypoint và test mới ui-world.test.mjs).

$ npm run check:silver -- --strict
> node scripts/silver/check.mjs --strict
# Toàn bộ nội dung và chương trình học đạt chuẩn nghiêm ngặt.
```

---

## 3. Kết quả chạy kiểm thử thực tế bằng CDP (Chuột & Phím thật)

Đã sử dụng công cụ kiểm thử tự động tương tác trực tiếp qua giao thức Chrome DevTools Protocol (`Input.dispatchMouseEvent`, `Input.dispatchKeyEvent`), không can thiệp nhảy bước bằng store:

1. **Khởi động và Dẫn đường (Travel Phase)**:
   - Truy cập `/?silver3d=lab1&snow=0`.
   - Thẻ `WorldNavigationCard` hiện rõ mục tiêu "TỚI: LAB 1 — MÁY BIẾT CHÀO", "Đi vào phòng", khoảng cách hiển thị 2 m, kim la bàn chỉ hướng chính xác.
   - Click chuột vào nút "Tới nơi luôn", nhân vật di chuyển vào trước ghế bàn máy tính trong phòng 406.B8.
   - Nhấn phím `E` để ngồi vào ghế (`seated: true`).
2. **Hội thoại & Bài giảng (Dialogue & Slide)**:
   - Bước 1 & 2 (`say` Thầy mở đầu): hiển thị hộp thoại `DialogueView` sắc nét dưới đáy màn hình.
   - Bước 3 (`slide`): hiển thị bài giảng ở dạng `SlideView compact` ("Lệnh in đầu tiên", `System.out.println...`) phía dưới, không che mất màn hình máy tính và không gian lớp học 3D phía sau.
3. **Màn máy tính ảo CodeLab (Code step)**:
   - Bước 4 (`code`): máy tính ảo tự động bật mở toàn màn hình (`screenOpen: true`). Đăng nhập sinh viên, mở Code Lab.
   - **Thử nghiệm code sai**: Gõ lệnh `sai_lenh` vào ô trống `System.out.[   ]("Hello EIU");`, click nút "Chạy" → Console CodeLab hiển thị thông báo lỗi màu đỏ `Main.java:3: error: cannot find symbol`, kèm giải thích `"Java không biết lệnh này..."`. Nút "Xem lời giải" (`Reveal answer`) xuất hiện.
   - **Thử nghiệm sửa đúng**: Gõ `println`, click "Chạy" → Hệ thống gọi `retry()` dọn sạch feedback sai, chấm điểm chính xác (`correct: true`), hiển thị kết quả output `"Hello EIU"`.
4. **Kiểm tra phím Escape, Đứng dậy, Đi lại và Ngồi lại**:
   - Khi máy tính đang mở: Nhấn phím `Esc` lần 1 → Máy tính ảo lập tức thu nhỏ (`screenOpen: false`). Xuất hiện nút "Mở máy tính" và "Đứng dậy (Esc)".
   - Nhấn phím `Esc` lần 2 → Nhân vật đứng dậy khỏi ghế (`seated: false`, chuyển sang phase `near`).
   - Nhấn giữ phím `W` để đi bộ một vòng trong phòng lab 406.B8.
   - Quay lại vị trí ghế ngồi, bấm nút "Tới nơi luôn" và nhấn phím `E` → Nhân vật ngồi lại vào ghế đúng bước hiện tại của bài học, trạng thái không bị mất.
   - Click nút "Mở máy tính" → Màn hình máy tính ảo mở lại nguyên vẹn, tiếp tục bấm "Tiếp >".
5. **Chuyển tiếp liền mạch từ Lab 1 sang Lab 2**:
   - Hoàn tất các bước thoại của Han và tổng kết của Thầy ở cuối Lab 1, click "Xong cảnh".
   - Nhờ cơ chế `keepSeated: true` của đạo diễn trong cùng phòng 406.B8, người chơi tiếp tục ngồi yên trên ghế để bắt đầu Lab 2 mà không bị dịch chuyển hay đứng dậy đột ngột.
   - Lab 2 diễn ra trọn vẹn: Bước 1 (`open`), Bước 2 (`slide`), Bước 3 (`code` khai báo biến `int`), Bước 4 (`say`), Bước 5 (`question`).
   - **Thử nghiệm câu hỏi trắc nghiệm**: Chọn đáp án sai (`'3'`), click nút "Thử lại", sau đó chọn đáp án đúng (`'4'`), hoàn thành toàn bộ bài Lab 2 thành công rực rỡ!
6. **Kiểm tra chuyển đổi ngôn ngữ (VI ↔ EN)**:
   - Click nút "EN" trên thanh điều khiển: toàn bộ tên Lab ("Lab 1 — The computer says hello"), thẻ điều hướng ("Enter room", "Go there now"), máy tính ảo ("Code Lab", "Task 1", "Hint", "Run", "- Minimize"), bài giảng và các câu thoại lập tức chuyển sang tiếng Anh.
   - Click nút "VI": giao diện chuyển lại tiếng Việt mượt mà, không giật lag.
7. **Kiểm tra hồi quy 2D**:
   - Truy cập chế độ 2D thông thường `/?snow=0`. Vị trí ban đầu của người chơi là `[0, 0]`.
   - Bấm nút 🎓 trên TopBar để mở giao diện Silver 2D overlay.
   - Xác nhận: Vị trí người chơi di chuyển đúng **0.00 m** (đạo diễn hoàn toàn không can thiệp dịch chuyển người chơi khi ở bản 2D).
   - Thoát chế độ Silver 2D, mở mục bài học 📚 (`nmlt-01`) hoạt động hoàn hảo bình thường.

---

## 4. Mô tả chi tiết 24 ảnh chụp kiểm thử thực tế

Tất cả 24 ảnh được chụp và lưu tại `/tmp/campussim-3d-07/` đã được mở và kiểm tra trực quan chi tiết từng ảnh:

| STT | Tên file | Kích thước | Ngôn ngữ | Mô tả chi tiết hình ảnh thực tế quan sát được |
|:---:|:---|:---:|:---:|:---|
| 1 | `di-1440-vi.png` | 1440×900 | VI | Góc nhìn sau lưng nhân vật ngoài hành lang tầng 4 B8 nhìn về phía cửa phòng 406. Thẻ điều hướng góc trái hiển thị: "TỚI: LAB 1 — MÁY BIẾT CHÀO", "Đi vào phòng", la bàn đỏ chỉ hướng, "2 m", nút xanh "Tới nơi luôn", nút "Bỏ qua cảnh" và "Thoát". Huy hiệu "Tầng 4" ở giữa. Thanh banner "Lab 1 — Máy biết chào · CSE 103 Bước 1/6" trên đỉnh. |
| 2 | `di-1440-en.png` | 1440×900 | EN | Phiên bản tiếng Anh của ảnh trên: banner "Lab 1 — The computer says hello · CSE 103 Step 1/6", thẻ điều hướng "GO TO: LAB 1 — THE COMPUTER SAYS...", "Enter room", "2 m", nút "Go there now", "Skip scene", "Exit". Huy hiệu tầng và góc nhìn sau lưng nhất quán. |
| 3 | `di-360-vi.png` | 360×780 | VI | Giao diện di động dọc (mobile 360px): thẻ điều hướng căn giữa gọn gàng trên nền tối, các nút "Tới nơi luôn", "Bỏ qua cảnh", "Thoát" xếp hàng ngang đẹp mắt không bị tràn màn hình. |
| 4 | `di-360-en.png` | 360×780 | EN | Giao diện di động dọc tiếng Anh tương ứng: "Enter room", "Go there now", "Skip scene", "Exit", chữ hiển thị rõ nét, tỷ lệ cân đối. |
| 5 | `ngoi-1440-vi.png` | 1440×900 | VI | Góc nhìn người thứ nhất/ngồi tại bàn trong phòng 406.B8: thấy mặt bàn lab, các màn hình máy tính có hiển thị mã code đa màu, bảng trắng treo tường. Huy hiệu "Tầng 4 406.B8 Phòng học 406". Nút "Đứng dậy (Esc)" trên thanh đỉnh. Khung thoại dưới đáy hiển thị lời dẫn: *"Phòng lab máy tính, tầng 4 B8. Dãy máy đã bật sẵn. Han kéo ghế ngồi cạnh bạn rồi"*. |
| 6 | `ngoi-1440-en.png` | 1440×900 | EN | Phiên bản tiếng Anh khi đang ngồi: nút trên đỉnh đổi thành "Stand up (Esc)", khung thoại dưới đáy hiển thị bản dịch tiếng Anh: *"The computer lab..."*. |
| 7 | `ngoi-360-vi.png` | 360×780 | VI | Giao diện mobile dọc khi ngồi: huy hiệu phòng học căn giữa, nút "Đứng dậy", "Bỏ qua cảnh", "Thoát" co giãn chuẩn, khung thoại hiển thị sắc nét dưới đáy màn hình. |
| 8 | `ngoi-360-en.png` | 360×780 | EN | Giao diện mobile dọc khi ngồi tiếng Anh: "Stand up", "Skip scene", "Exit", văn bản thoại tiếng Anh hiển thị chuẩn xác. |
| 9 | `thoai-1440-vi.png` | 1440×900 | VI | Bước hội thoại dẫn truyện tại bàn máy tính (Bước 1/6): góc nhìn ngồi trong phòng lab, hộp thoại dẫn truyện bo góc tròn màu trắng hiển thị chữ nghiêng sắc nét. |
| 10 | `thoai-1440-en.png` | 1440×900 | EN | Bước hội thoại dẫn truyện tiếng Anh: "Step 1/6", "Stand up (Esc)", văn bản thoại tiếng Anh căn lề chuẩn mực. |
| 11 | `thoai-360-vi.png` | 360×780 | VI | Bước hội thoại trên di động: khung thoại bo tròn nằm sát đáy thuận tiện ngón tay bấm lướt, không che khuất màn hình. |
| 12 | `thoai-360-en.png` | 360×780 | EN | Bước hội thoại trên di động tiếng Anh: các nút điều khiển thu gọn thông minh, chữ hiển thị rõ ràng. |
| 13 | `slide-1440-vi.png` | 1440×900 | VI | Bước trình chiếu slide (Bước 3/6): thẻ slide dạng compact nhỏ gọn xuất hiện giữa đáy màn hình với tiêu đề in đậm "Lệnh in đầu tiên", nội dung tóm tắt "System.out.println in một dòng chữ ra màn hình rồi xuống dòng...", nút màu cam nổi bật "Tiếp >". Phía sau vẫn nhìn rõ không gian phòng học 3D. |
| 14 | `slide-1440-en.png` | 1440×900 | EN | Bước slide tiếng Anh: "Step 3/6", tiêu đề "The first print command", nội dung tóm tắt tiếng Anh, nút màu cam "Next >". |
| 15 | `slide-360-vi.png` | 360×780 | VI | Bước slide trên màn hình 360px: thẻ slide compact co giãn hoàn hảo, nội dung dễ đọc, nút "Tiếp >" lớn dễ bấm trên cảm ứng. |
| 16 | `slide-360-en.png` | 360×780 | EN | Bước slide trên màn hình 360px tiếng Anh: hiển thị "The first print command" và nút "Next >". |
| 17 | `code-1440-vi.png` | 1440×900 | VI | Bước làm bài tập CodeLab (Bước 4/6): máy tính ảo mở toàn màn hình, cửa sổ "Code Lab" với file `Main.java`, ô điền code đã nhập `println`, cột phải hiển thị "Bài 1 — Máy chào EIU", nút "Gợi ý", nút xanh lá "Chạy", thanh tác vụ dưới đáy có logo "EIU", "Code Lab", nút "– Thu máy", đồng hồ "04:45". |
| 18 | `code-1440-en.png` | 1440×900 | EN | Bước CodeLab tiếng Anh: tiêu đề "Task 1 — The computer greets EIU", nút "Hint", nút "Run", thanh tác vụ có nút "- Minimize". |
| 19 | `code-360-vi.png` | 360×780 | VI | Bước CodeLab trên mobile 360px: giao diện desktop tự thích ứng dọc, hiển thị editor có code `println`, nút "Chạy" và thanh tác vụ co giãn chuẩn. |
| 20 | `code-360-en.png` | 360×780 | EN | Bước CodeLab trên mobile tiếng Anh: "Step 4/6", các thành phần tiếng Anh thích ứng trơn tru. |
| 21 | `ket-qua-sai-1440-vi.png` | 1440×900 | VI | Kết quả chạy thử code sai: ô nhập chứa `sai_lenh`, vùng kết quả KẾT QUẢ / OUTPUT hiển thị thông báo lỗi màu đỏ `Main.java:3: error: cannot find symbol`, dòng chú thích màu vàng: "Java không biết lệnh này. Nhìn lại slide: tên lệnh viết liền, toàn chữ thường.", xuất hiện nút "Xem lời giải" cạnh nút "Chạy". |
| 22 | `ket-qua-sai-1440-en.png` | 1440×900 | EN | Kết quả chạy thử code sai tiếng Anh: thông báo lỗi đỏ `cannot find symbol`, chú thích vàng "Java doesn't know this command...", nút "Reveal answer" xuất hiện. |
| 23 | `ket-qua-sai-360-vi.png` | 360×780 | VI | Kết quả code sai trên mobile 360px: thông báo lỗi đỏ và chú thích vàng hiển thị đầy đủ, nút "Xem lời giải" và "Chạy" rõ ràng. |
| 24 | `ket-qua-sai-360-en.png` | 360×780 | EN | Kết quả code sai trên mobile tiếng Anh: hiển thị chuẩn xác không bị tràn lề. |

---

## 5. Điểm chưa chắc & Đề xuất

- **Điểm lưu ý ở các task tiếp theo**:
  + Cửa vào dev `?silver3d=lab1` được thiết kế độc lập và sẽ được dỡ bỏ ở task 3D-11 khi có giao diện chọn màn hoàn chỉnh của toàn dự án.
  + Hiện tại, bài tập sắp xếp (`order`) đã có UI danh sách tối thiểu (`WorldOrderList`) theo đúng yêu cầu Đợt 1 của spec mục 1, sẵn sàng để tích hợp component nâng cao của đồng đội ở Đợt 2.
- **Không có tồn đọng hay lỗi phát sinh**: Hệ thống chạy ổn định tuyệt đối trên cả desktop lẫn mobile, không có lỗi console.
