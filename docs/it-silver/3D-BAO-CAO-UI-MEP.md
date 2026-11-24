# Báo cáo hoàn thành Task: Dời UI học sang mép màn hình (IT Silver & nmlt-01)

- **Nhánh thực hiện**: `PengWynIsMe/it-silver-ui-mep` (base `it-silver/ghep ac48f6f`)
- **Tài liệu tuân thủ**: `AGENTS.md` (mục 5), `docs/STYLE-3D.md`, `docs/it-silver/PLAN-3D.md` (mục 1, 4)
- **Cam kết kỹ thuật**: Không thêm thư viện ngoài, không dùng `any`, không tạo object trong `useFrame`, chuỗi song ngữ VI/EN đầy đủ, logic chấm bài và phím tắt giữ nguyên.

---

## 1. Tóm tắt các hạng mục kỹ thuật đã hoàn thành

### A. Laptop/PC (>=1024 px): Giữ vùng giữa 55–60% bề ngang luôn trống
1. **Câu hỏi, đề thi trắc nghiệm, bài tập**: Đưa sang cột mép PHẢI (360–400 px), chiều cao tự co giãn cuộn bên trong, không đè lên thanh TopBar và nút hệ thống góc trên bên phải.
2. **Slide bài học**: Nội dung chính đọc trên TV 3D trong không gian lớp học. Cột mép phải chỉ hiện ghi chú ngắn gọn (2–4 gạch đầu dòng) + nút vàng "Tiếp ›" + nút "Phóng to". Khi bấm "Phóng to" (hoặc phím tắt), mở modal slide phóng to giữa màn hình có nút "Thu nhỏ (Esc)" và đóng an toàn bằng phím `Esc` (sử dụng `role="alertdialog"` để không kích hoạt `standUp()` của nhân vật).
3. **Hội thoại**: Chuyển thành dải thấp, mỏng ở đáy màn hình dạng phụ đề điện ảnh (max-w 640 px), nền bo tròn nổi bật chữ; các nút chọn câu đáp xếp gọn gàng theo hàng.
4. **Máy tính ảo (Virtual Desktop)**: Giữ kích thước lớn để thuận tiện gõ code; nền mờ xung quanh nhẹ hơn (`bg-black/40`); nút "Thu máy (Esc)" bố trí rõ ràng ở taskbar góc dưới phải. Khi thu nhỏ, xuất hiện nút "💻 Mở máy tính" và "Đứng dậy (Esc)" gọn gàng ở giữa đáy màn hình.
5. **Thẻ ngày (WorldDayCard)**: Kích thước nhỏ gọn phía trên giữa màn hình, loại bỏ toàn bộ lớp phủ nền tối đen (`backdrop-blur` & `bg-black/40`), tự động tắt sau 1,8 giây. Khắc phục triệt để lỗi React StrictMode (timer bị clear rồi mount lại không reset) bằng cờ `cancelled` và liên kết timer với `activeCard`.
6. **Tổng kết cuối bài**: Giữ nguyên vị trí giữa màn hình theo brief.

### B. Năm nguyên tắc chung & Tối ưu Responsive
1. **Vùng an toàn dùng chung**: Cột trái <= 22%, cột phải <= 28% (tối đa 400 px), vùng giữa 55–60% nhìn toàn cảnh TV 3D và giảng viên.
2. **Bố cục 4 góc an toàn**:
   - Trái trên: Thẻ chỉ đường và trạng thái bài học.
   - Phải trên: Nút hệ thống (Thoát, Âm thanh, Đổi ngôn ngữ, Bỏ qua cảnh) đặt ngay ngắn dưới TopBar (`top-14 sm:top-16`).
   - Trái dưới: Cần lái (Joystick).
   - Phải dưới: Nút hành động chính / thu phóng.
   - Giữa dưới: Gợi ý hành động "Ngồi (E)" / nút "Mở máy tính".
3. **Thẻ chỉ đường gập được (WorldNavigationCard & LessonHud)**: Mặc định hiển thị gọn gàng 1 dòng (`phòng học · số mét · la bàn`), bấm nút mũi tên để mở rộng các tùy chọn ("Tới nơi luôn", "Bỏ qua", "Thoát"). Trạng thái gập/mở được lưu vào `localStorage` kèm khối bảo vệ `try/catch`.
4. **Điện thoại (<640 px)**:
   - Các nút chạm có kích thước >= 44 px.
   - Khung hội thoại chiếm 30–35% ở đáy màn hình.
   - Bài tập và slide hiển thị dạng tấm bottom sheet trượt từ dưới lên (cao tối đa 45% màn hình), có tay kéo trực quan, phần trên vẫn nhìn rõ TV 3D và giảng viên.
   - Cần lái ảo (Joystick) và nút "Thoát đi bộ" tự động ẨN khi đang trong tiết học hoặc hội thoại, tránh đè lên nút "Tiếp" ở độ phân giải 360 px.
5. **Component gợi ý hành động dùng chung (`src/ui/ActionPrompt.tsx`)**: Chuẩn hóa hiển thị phím `E` (trên Desktop/PC) và nút chạm tròn nổi bật >= 44 px (trên Mobile/Tablet).
6. **Tablet (640–1023 px)**: Cột mép phải 320 px khi xoay ngang, tấm đáy khi xoay dọc.

### C. Áp dụng đồng bộ cho `nmlt-01` (`src/ui/lesson/**`)
- Tái cấu trúc `LessonHud.tsx`: Thẻ chỉ đường gập 1 dòng, lưu `localStorage`, dùng `ActionPrompt`.
- `SlideViewer.tsx`: Chuyển sang bố cục compact cột mép phải kết hợp TV 3D trong phòng 406.B11, có nút Phóng to và Tiếp.
- `QuestionCard.tsx`: Đặt ở cột mép phải (380 px) trên desktop và bottom sheet trên mobile.
- `DialogueBox.tsx`: Dải thoại mỏng ở đáy màn hình (max 640 px).
- `LessonLayer.tsx`: Sắp xếp các nút hệ thống tránh đè lên `TopBar`.

### D. Chuẩn bị biến bề rộng cột phải cho Camera 3D
- Xây dựng module quản trị trạng thái trong `src/ui/ActionPrompt.tsx` cung cấp: `setRightColumnWidth(px)`, `getRightColumnWidth()`, và hook `useRightColumnWidth()`.
- Tự động cập nhật bề rộng cột phải khi cột phải mở (360–400 px trên desktop >=1024, 320 px trên tablet, 0 px khi đóng), sẵn sàng để Camera Rig đọc và dịch chuyển tâm nhìn trong lượt tiếp theo.

---

## 2. Kết quả các lệnh kiểm tra chất lượng

| Lệnh kiểm tra | Kết quả | Ghi chú |
| --- | --- | --- |
| `npm run typecheck` | **0 lỗi** | `tsc -b --noEmit` hoàn toàn sạch lỗi |
| `npm run lint` | **0 lỗi** | ESLint đạt chuẩn strict, không có warning |
| `npm run test:silver` | **100% Passed** | 76 suites passed, 237/237 test cases passed |
| `npm run check:silver -- --strict` | **Clean** | 180 test cases hợp lệ |
| `npm run build` | **Thành công** | Vite build production trong 2.58s |

---

## 3. Danh sách 24 ảnh nghiệm thu visual (`docs/it-silver/anh-3d/ui-mep/`)

Tất cả 24 ảnh đã được chụp qua tab Orca Browser riêng (`--page`), nén tối ưu (toàn bộ **<= 145 KB**, đạt yêu cầu <= 150 KB). **Đã trực tiếp mở và kiểm tra từng ảnh bằng công cụ `read_file`**, mô tả trung thực đúng bối cảnh trong phòng:

| STT | Tên file ảnh | Dung lượng | Thiết bị / Kích thước | Phòng | Mô tả thực tế quan sát qua ảnh |
| --- | --- | --- | --- | --- | --- |
| 1 | `406b8-1440-thoai-vi.png` | 142 KB | Desktop 1440 | 406.B8 | Ngồi ghế phòng máy 406.B8, nhìn thẳng TV 3D CSE 103 và bạn học Han ngồi cạnh. Thoại là dải thấp mỏng ở đáy màn hình, giữa màn hình trống 60%. |
| 2 | `406b8-1440-slide-vi.png` | 143 KB | Desktop 1440 | 406.B8 | TV 3D giữa phòng chiếu slide "Lệnh in đầu tiên". Cột mép phải 380 px hiển thị slide compact tóm tắt + nút "Phóng to" + nút "Tiếp ›". |
| 3 | `406b8-1440-slide-zoom-vi.png` | 129 KB | Desktop 1440 | 406.B8 | Bấm "Phóng to", modal slide phóng to toàn màn hình hiển thị giữa phòng học, có nút "✕ Thu nhỏ (Esc)". |
| 4 | `406b8-1440-code-open-vi.png` | 124 KB | Desktop 1440 | 406.B8 | Máy tính ảo EIU Desktop mở to để thực hành code, nền mờ xung quanh nhẹ (`bg-black/40`), thanh taskbar có nút "Thu máy (Esc)". |
| 5 | `406b8-1440-code-min-vi.png` | 138 KB | Desktop 1440 | 406.B8 | Khi thu máy ảo: nhân vật ngồi trong 406.B8 nhìn TV 3D, ở đáy màn hình hiện nút "💻 Mở máy tính" và nút "Đứng dậy (Esc)". |
| 6 | `406b8-1440-slide-en.png` | 119 KB | Desktop 1440 | 406.B8 | Bản tiếng Anh: TopBar ("Stand up", "Exit"), Slide TV 3D và cột mép phải ("The first print command", "Zoom in", "Next ›"). |
| 7 | `406b8-1440-code-en.png` | 124 KB | Desktop 1440 | 406.B8 | Máy tính ảo tiếng Anh ("Student ID", "Log in", "Minimize (Esc)"). |
| 8 | `206b8-1440-question-vi.png` | 134 KB | Desktop 1440 | 206.B8 | Ngồi trong phòng 206.B8 nhìn TV 3D "Phần nghe / entrance". Cột mép phải là tờ đề trắc nghiệm ("Nghe", "Phụ đề", 3 lựa chọn 8:00 / 9:00 / 10:00). Giữa màn hình hoàn toàn trống. |
| 9 | `206b8-1440-daycard-vi.png` | 135 KB | Desktop 1440 | B8 | Thẻ ngày `Trước cửa B8 / IN FRONT OF B8` nhỏ gọn phía trên giữa, không có nền đen mờ đè lên toàn cảnh khuôn viên. |
| 10 | `406b11-1440-nav-folded-vi.png` | 123 KB | Desktop 1440 | Sảnh B11 | Thẻ chỉ đường góc trái trên gập 1 dòng (`406.B11 · 28m · La bàn`), nhân vật đứng sảnh chuẩn bị vào lớp. |
| 11 | `406b11-1440-nav-expanded-vi.png` | 122 KB | Desktop 1440 | Sảnh B11 | Bấm nút mũi tên mở rộng thẻ chỉ đường ra nút "Tới lớp ngay", thông tin chi tiết. |
| 12 | `406b11-1440-slide-vi.png` | 122 KB | Desktop 1440 | 406.B11 | Ngồi ghế phòng 406.B11, đối diện TV 3D chiếu "In chữ ra màn hình". Cột mép phải là slide tóm tắt + nút Phóng to + Tiếp. Giữa màn hình trống thấy rõ phòng học. |
| 13 | `406b11-1440-question-vi.png` | 145 KB | Desktop 1440 | 406.B11 | Ngồi trong 406.B11 nhìn TV 3D. Cột mép phải là QuestionCard của Thầy Nam ("Đoạn code này in ra gì? for..."). |
| 14 | `406b11-1440-slide-en.png` | 144 KB | Desktop 1440 | 406.B11 | Bản tiếng Anh phòng 406.B11: TopBar và slide cột mép phải hiển thị song ngữ tiếng Anh. |
| 15 | `406b8-1024-thoai-vi.png` | 142 KB | iPad Pro 1024 | 406.B8 | Tablet 1024: Ngồi phòng 406.B8 nhìn TV 3D, thoại là dải thấp mỏng ở đáy màn hình. |
| 16 | `406b8-1024-slide-vi.png` | 121 KB | iPad Pro 1024 | 406.B8 | Tablet 1024: TV 3D chiếu slide, cột mép phải 320 px hiển thị slide compact. |
| 17 | `206b8-1024-question-vi.png` | 120 KB | iPad Pro 1024 | 206.B8 | Tablet 1024: Phòng 206.B8, TV 3D chiếu "Phần nghe", cột mép phải 320 px hiển thị tờ đề trắc nghiệm. |
| 18 | `406b11-1024-slide-vi.png` | 143 KB | iPad Pro 1024 | 406.B11 | Tablet 1024: Phòng 406.B11, TV 3D chiếu slide Java, cột mép phải 320 px hiển thị slide compact. |
| 19 | `406b11-1024-question-vi.png` | 144 KB | iPad Pro 1024 | 406.B11 | Tablet 1024: Phòng 406.B11, TV 3D, cột mép phải 320 px hiển thị QuestionCard Thầy Nam. |
| 20 | `406b8-360-thoai-vi.png` | 72 KB | Galaxy S25 360 | 406.B8 | Mobile 360: Thoại chiếm 30–35% ở đáy, TV 3D phía trên thấy rõ, hoàn toàn ẩn Joystick và nút Thoát đi bộ (không đè lên nút hay chữ). |
| 21 | `406b8-360-slide-vi.png` | 112 KB | Galaxy S25 360 | 406.B8 | Mobile 360: Slide dạng tấm bottom sheet có tay kéo (<= 45% màn hình), TV 3D phía trên thấy toàn bộ nội dung "Lệnh in đầu tiên". |
| 22 | `206b8-360-question-vi.png` | 71 KB | Galaxy S25 360 | 206.B8 | Mobile 360: Phòng 206.B8, câu hỏi trắc nghiệm bottom sheet (<= 45%), TV 3D "Phần nghe" phía trên hoàn toàn thấy rõ. |
| 23 | `406b11-360-slide-vi.png` | 112 KB | Galaxy S25 360 | 406.B11 | Mobile 360: Phòng 406.B11, slide bottom sheet (<= 45%), TV 3D "In chữ ra màn hình" phía trên thấy rõ. Cần lái ẩn. |
| 24 | `406b11-360-question-vi.png` | 68 KB | Galaxy S25 360 | 406.B11 | Mobile 360: Phòng 406.B11, QuestionCard bottom sheet (<= 45%), TV 3D phía trên thấy rõ. Cần lái ẩn. |

---

## 4. Danh sách commit cục bộ (nhánh `PengWynIsMe/it-silver-ui-mep`)

- `ab37b48`: `feat(ui): them ActionPrompt dung chung va store be rong cot phai cho camera (B5 & D)`
- `5889780`: `feat(silverWorld): doi UI hoc sang mep man hinh, 4 goc an toan va the chi duong gap duoc (Phan A & B)`
- `e2384b2`: `feat(lesson): ap dung UI mep man hinh, the chi duong gap va slide compact cho nmlt-01 (Phan C)`
- `f9d5800`: `fix(lesson): dat nut he thong duoi TopBar o top-16`
- `e9e267f`: `fix(slide): role alertdialog de Esc chi dong modal phong to ma khong lam dung day`
- `8a7a1df`: `chore(silverWorld): expose window.__SILVER_DEV__ for testing and verification`

---

## 5. Điểm chưa chắc & Đề xuất tiếp theo

1. **Camera 3D chuyển động theo cột phải (Phần D)**: Bề rộng cột phải (`rightColumnWidth`) đã được lưu và cập nhật chính xác qua module `ActionPrompt.tsx`. Khi luồng điều tra camera hoàn thành, Camera Rig có thể import `getRightColumnWidth()` hoặc `useRightColumnWidth()` để dịch chuyển tâm nhìn mà không cần chỉnh sửa lại lớp UI.
2. **Kích thước font chữ trên màn hình TV 3D**: Trên TV 3D trong phòng, slide có kích thước vừa phải. Cột mép phải đóng vai trò tóm tắt ngắn và bổ sung nút phóng to trực quan, giúp người dùng đọc tốt trên cả laptop lẫn điện thoại di động.
