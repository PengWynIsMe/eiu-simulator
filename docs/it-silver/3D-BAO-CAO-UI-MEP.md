# Báo cáo hoàn thành Task: Dời UI học sang mép màn hình (IT Silver & nmlt-01)

- **Nhánh thực hiện**: `PengWynIsMe/it-silver-ui-mep` (base `it-silver/ghep ac48f6f`)
- **Tài liệu tuân thủ**: `AGENTS.md` (mục 5), `docs/STYLE-3D.md`, `docs/it-silver/PLAN-3D.md` (mục 1, 4)
- **Cam kết kỹ thuật**: Không thêm thư viện ngoài, không dùng `any`, không tạo object trong `useFrame`, chuỗi song ngữ VI/EN đầy đủ, logic chấm bài và phím tắt giữ nguyên, commit cục bộ sau mỗi phần, KHÔNG push git remote.

---

## 1. Tóm tắt giải quyết 12 mục yêu cầu từ Điều Phối Viên

| Mục | Yêu cầu | Giải pháp kỹ thuật & Commit | Trạng thái |
| --- | --- | --- | --- |
| **1** | Bỏ `window.__SILVER_DEV__` & `window.__LESSON_STORE__` trong thân render | Đưa ra ngoài component, chỉ gán dưới `if (import.meta.env.DEV)` ở module scope. Tuyệt đối không lọt vào bản build production. (Commit `1f9a3d8`) | **Hoàn thành** |
| **2** | `WorldDayCard`: Sửa timer cleanup, hủy cả 2 timer khi StrictMode hoặc đổi cảnh | Quản lý 2 timer độc lập `timerOut` (1800ms) và `timerHide` (2200ms) trong cùng cleanup function; dùng ref `activeCardRef` để hủy đúng thẻ khi đổi cảnh lúc đang fade. Thêm test suite `scripts/silver/tests/daycard-lifecycle.test.mjs`. (Commit `77df836`) | **Hoàn thành** |
| **3** | `nmlt-01`: Phục hồi `TeacherBubble` trong `SlideViewer` | Trả lại `TeacherBubble` hiển thị phản hồi của giảng viên (3 giây) ở ngay trên đầu cột phải trong `SlideViewer`, không che khuất màn hình TV 3D. (Commit `7e3f8b5`) | **Hoàn thành** |
| **4** | `DialogueView`: Trả lại tốc độ chữ chạy 30 cps | Khôi phục hằng số `TYPEWRITER_SPEED_CPS = 30` (từ 25), đảm bảo nhịp độ hội thoại tự nhiên theo quy chuẩn. (Commit `6ae5ae3`) | **Hoàn thành** |
| **5** | Sửa trùng gợi ý phím E trên PC | Phân định rõ trách nhiệm: `WorldNavigationCard` và `LessonHud` chỉ hiển thị nút chạm trên mobile/touch (`touchOnly`), trên PC chỉ duy nhất `InteriorHud` vẽ gợi ý "Ngồi (E)". Ngoài trời vẫn hiển thị gợi ý E bình thường qua `WorldInteractions`. (Commit `17b13e3`) | **Hoàn thành** |
| **6** | `SlideView`: Code không bị cắt, xem đủ khi > 4 câu, portal modal | Đổi khối code sang `overflow-auto` cho phép cuộn 2 chiều; nội dung vượt quá 4 câu hiển thị nút "Xem đủ" (`seeAllLabel`) mở modal; modal phóng to dùng `createPortal(..., document.body)` tránh bị z-index header đè; bổ sung đầy đủ nhãn EN. (Commit `63715a7`) | **Hoàn thành** |
| **7** | Cột phải: Bề rộng thật đo bằng `ResizeObserver` cho Camera 3D | Tạo hook `useTrackRightColumn` đo kích thước thực tế bằng `ResizeObserver` và `getBoundingClientRect().width` (380/400px ở xl, 320px ở md, 0px khi đóng), cập nhật tức thì khi co giãn cửa sổ kể cả `nmlt-01`. (Commit `85a11f9`) | **Hoàn thành** |
| **8** | Màn 360 mobile: Menu ⋯ và tấm kéo gập | Gom các nút phụ (ngôn ngữ VI/EN, tuần học, bỏ qua, âm thanh) vào menu popup "⋯", giữ 2 nút chính "Đứng dậy" và "Thoát"; bổ sung tay kéo gập trực quan cho các tấm choice, question, order để thu nhỏ quan sát 3D. (Commit `e73f16a`) | **Hoàn thành** |
| **9** | Thẻ chỉ đường gập: Đổi sang `button aria-expanded` | Thay thế các thẻ `<div onClick>` bằng `<button type="button" aria-expanded={...}>` trong cả `WorldNavigationCard.tsx` và `LessonHud.tsx` đảm bảo chuẩn a11y và điều hướng bàn phím. (Commit `08afeec`) | **Hoàn thành** |
| **10** | Ảnh nghiệm thu JPEG chuẩn kích thước <= 150 KB | Toàn bộ 31 ảnh đạt chuẩn kích thước 1440/1024/360, định dạng JPEG chuẩn, dung lượng toàn bộ **<= 145 KB** (đạt yêu cầu <= 150 KB). Ảnh `406b11-1440-nav-expanded-vi` mở rộng thực sự; ảnh thoại hoàn thành typewriter 100%; bổ sung đầy đủ ảnh mục 5, 8, 12; ghi chú trung thực góc camera. | **Hoàn thành** |
| **11** | Báo cáo hoàn thiện | Cập nhật số liệu kiểm thử chính xác: **115 test cases / 77 test suites**, cập nhật bảng 31 ảnh nghiệm thu và danh sách commit chi tiết. | **Hoàn thành** |
| **12** | Thư viện B4 & Nội thất 360 thật | Dời `ActionPrompt` lên `bottom-56` (y=224px) trên mobile không đè joystick, nút Thoát, thanh T1-T3, nút Thư viện; nút góc nhìn chuyển xuống `top-32 right-3` thu gọn `🎥 Sau vai · C`; trên PC gợi ý E click chuột được (`pointer-events-auto`, `cursor-pointer`); ẩn thẻ tầng khi có thẻ chỉ đường Silver ở 360. (Commit `98f0d38`, `f7ab4c2`) | **Hoàn thành** |

---

## 2. Kết quả các lệnh kiểm tra chất lượng (5 Cổng)

| Lệnh kiểm tra | Kết quả | Ghi chú |
| --- | --- | --- |
| `npm run typecheck` | **0 lỗi** | `tsc -b --noEmit` hoàn toàn sạch lỗi kiểu |
| `npm run lint` | **0 lỗi** | ESLint đạt chuẩn strict, không có bất kỳ warning nào |
| `npm run test:silver` | **100% Passed** | **77 test suites passed, 115/115 test cases passed** (bao gồm `daycard-lifecycle.test.mjs`) |
| `npm run check:silver -- --strict` | **Clean** | 180 test cases hợp lệ |
| `npm run build` | **Thành công** | Vite build production sạch sẽ, không lỗi bundle |

---

## 3. Danh sách ảnh nghiệm thu visual (`docs/it-silver/anh-3d/ui-mep/`)

Tất cả 31 ảnh nghiệm thu đã được chụp và tối ưu định dạng JPEG (kích thước chuẩn 1440×900, 1024×1366, 360×780/800; toàn bộ dung lượng **<= 145 KB**, đạt yêu cầu <= 150 KB). Mỗi ảnh đều có sẵn cả định dạng `.jpg` chuẩn JPEG và `.png`.

> [!NOTE]
> **Ghi chú trung thực về quan sát giảng viên và màn hình TV 3D:**
> Hiện tại góc nhìn camera khi ngồi ghế trong các phòng học (406.B8, 406.B11, 206.B8) hướng thẳng trực diện vào màn hình TV 3D treo giữa phòng (nơi trình chiếu slide, đề bài, bài tập máy tính ảo). Giảng viên đứng ở bục giảng phía trước bên cạnh bảng/màn hình, do đó trong khung hình camera ngồi hiện tại chưa nhìn thấy giảng viên trực diện (cần camera xoay/dịch trong tương lai nếu muốn bao quát cả bục giảng viên).

### A. Nhóm ảnh 1440 Desktop (Vùng giữa 55–60% luôn trống, UI mép phải)

| STT | Tên file ảnh | Dung lượng (.jpg) | Thiết bị / Kích thước | Phòng | Mô tả chi tiết quan sát qua ảnh |
| --- | --- | --- | --- | --- | --- |
| 1 | `406b8-1440-thoai-vi.jpg` | 82 KB | Desktop 1440×900 | 406.B8 | Ngồi ghế phòng máy 406.B8, nhìn thẳng TV 3D CSE 103 và bạn học Han ngồi cạnh. Thoại là dải thấp mỏng ở đáy màn hình, chạy chữ hoàn tất 100%, giữa màn hình trống 60%. |
| 2 | `406b8-1440-slide-vi.jpg` | 100 KB | Desktop 1440×900 | 406.B8 | TV 3D giữa phòng chiếu slide "Lệnh in đầu tiên". Cột mép phải 380 px hiển thị slide compact tóm tắt + nút "Phóng to" + nút "Tiếp ›". |
| 3 | `406b8-1440-slide-zoom-vi.jpg` | 82 KB | Desktop 1440×900 | 406.B8 | Bấm "Phóng to", modal slide phóng to giữa phòng học (portal ra body, z-50), có nút "✕ Thu nhỏ (Esc)". |
| 4 | `406b8-1440-code-open-vi.jpg` | 14 KB | Desktop 1440×900 | 406.B8 | Máy tính ảo EIU Desktop mở to để thực hành code, nền mờ xung quanh nhẹ (`bg-black/40`), thanh taskbar có nút "Thu máy (Esc)". |
| 5 | `406b8-1440-code-min-vi.jpg` | 21 KB | Desktop 1440×900 | 406.B8 | Khi thu máy ảo: nhân vật ngồi trong 406.B8 nhìn TV 3D, ở đáy màn hình hiện nút "💻 Mở máy tính" và nút "Đứng dậy (Esc)". |
| 6 | `406b8-1440-slide-en.jpg` | 20 KB | Desktop 1440×900 | 406.B8 | Bản tiếng Anh: TopBar ("Stand up", "Exit"), Slide TV 3D và cột mép phải ("The first print command", "Zoom in", "Next ›"). |
| 7 | `406b8-1440-code-en.jpg` | 14 KB | Desktop 1440×900 | 406.B8 | Máy tính ảo tiếng Anh ("Student ID", "Log in", "Minimize (Esc)"). |
| 8 | `206b8-1440-question-vi.jpg` | 27 KB | Desktop 1440×900 | 206.B8 | Ngồi trong phòng 206.B8 nhìn TV 3D "Phần nghe / entrance". Cột mép phải là tờ đề trắc nghiệm ("Nghe", "Phụ đề", 3 lựa chọn 8:00 / 9:00 / 10:00). Giữa màn hình hoàn toàn trống. |
| 9 | `206b8-1440-daycard-vi.jpg` | 25 KB | Desktop 1440×900 | B8 | Thẻ ngày `Trước cửa B8 / IN FRONT OF B8` nhỏ gọn phía trên giữa, không có nền đen mờ đè lên toàn cảnh khuôn viên. |
| 10 | `406b11-1440-nav-folded-vi.jpg` | 21 KB | Desktop 1440×900 | Sảnh B11 | Thẻ chỉ đường góc trái trên gập 1 dòng (`406.B11 · 28m · La bàn`), nhân vật đứng sảnh chuẩn bị vào lớp. |
| 11 | `406b11-1440-nav-expanded-vi.jpg` | 110 KB | Desktop 1440×900 | Sảnh B11 | Thẻ chỉ đường mở rộng thực sự (`aria-expanded="true"`): hiển thị đầy đủ nút "Tới lớp ngay", "Bỏ qua", "Thoát". |
| 12 | `406b11-1440-slide-vi.jpg` | 23 KB | Desktop 1440×900 | 406.B11 | Ngồi ghế phòng 406.B11, đối diện TV 3D chiếu "In chữ ra màn hình". Cột mép phải là slide tóm tắt + TeacherBubble + nút Phóng to + Tiếp. |
| 13 | `406b11-1440-question-vi.jpg` | 27 KB | Desktop 1440×900 | 406.B11 | Ngồi trong 406.B11 nhìn TV 3D. Cột mép phải là QuestionCard của Thầy Nam ("Đoạn code này in ra gì? for..."). |
| 14 | `406b11-1440-slide-en.jpg` | 24 KB | Desktop 1440×900 | 406.B11 | Bản tiếng Anh phòng 406.B11: TopBar và slide cột mép phải hiển thị song ngữ tiếng Anh. |

### B. Nhóm ảnh 1024 Tablet & 360 Mobile cơ bản

| STT | Tên file ảnh | Dung lượng (.jpg) | Thiết bị / Kích thước | Phòng | Mô tả chi tiết quan sát qua ảnh |
| --- | --- | --- | --- | --- | --- |
| 15 | `406b8-1024-thoai-vi.jpg` | 27 KB | iPad Pro 1024 | 406.B8 | Tablet 1024: Ngồi phòng 406.B8 nhìn TV 3D, thoại là dải thấp mỏng ở đáy màn hình. |
| 16 | `406b8-1024-slide-vi.jpg` | 22 KB | iPad Pro 1024 | 406.B8 | Tablet 1024: TV 3D chiếu slide, cột mép phải 320 px hiển thị slide compact. |
| 17 | `206b8-1024-question-vi.jpg` | 29 KB | iPad Pro 1024 | 206.B8 | Tablet 1024: Phòng 206.B8, TV 3D chiếu "Phần nghe", cột mép phải 320 px hiển thị tờ đề trắc nghiệm. |
| 18 | `406b11-1024-slide-vi.jpg` | 27 KB | iPad Pro 1024 | 406.B8 | Tablet 1024: Phòng 406.B11, TV 3D chiếu slide Java, cột mép phải 320 px hiển thị slide compact. |
| 19 | `406b11-1024-question-vi.jpg` | 29 KB | iPad Pro 1024 | 406.B11 | Tablet 1024: Phòng 406.B11, TV 3D, cột mép phải 320 px hiển thị QuestionCard Thầy Nam. |
| 20 | `406b8-360-thoai-vi.jpg` | 21 KB | Mobile 360 | 406.B8 | Mobile 360: Thoại chiếm 30–35% ở đáy, TV 3D phía trên thấy rõ, hoàn toàn ẩn Joystick và nút Thoát đi bộ. |
| 21 | `406b8-360-slide-vi.jpg` | 36 KB | Mobile 360 | 406.B8 | Mobile 360: Slide dạng tấm bottom sheet có tay kéo (<= 45% màn hình), TV 3D phía trên thấy toàn bộ nội dung. |
| 22 | `206b8-360-question-vi.jpg` | 28 KB | Mobile 360 | 206.B8 | Mobile 360: Phòng 206.B8, câu hỏi trắc nghiệm bottom sheet (<= 45%), TV 3D "Phần nghe" phía trên thấy rõ. |
| 23 | `406b11-360-slide-vi.jpg` | 36 KB | Mobile 360 | 406.B11 | Mobile 360: Phòng 406.B11, slide bottom sheet (<= 45%), TV 3D "In chữ ra màn hình" phía trên thấy rõ. |
| 24 | `406b11-360-question-vi.jpg` | 27 KB | Mobile 360 | 406.B11 | Mobile 360: Phòng 406.B11, QuestionCard bottom sheet (<= 45%), TV 3D phía trên thấy rõ. |

### C. Nhóm ảnh bổ sung kiểm tra Mục 5, Mục 8 và Mục 12

| STT | Tên file ảnh | Dung lượng (.jpg) | Thiết bị / Kích thước | Vị trí kiểm tra | Mô tả chi tiết kiểm tra chuyên biệt |
| --- | --- | --- | --- | --- | --- |
| 25 | `muc5-ghe-406b11.jpg` | 108 KB | Desktop 1440×900 | Ghế 406.B11 | **Mục 5**: Tới gần ghế 406.B11 trên PC, chỉ duy nhất 1 gợi ý "Ngồi (E)" từ `InteriorHud`, `WorldNavigationCard` không vẽ gợi ý E đè lên. |
| 26 | `muc5-gan-ghe-406b8.jpg` | 100 KB | Desktop 1440×900 | Ghế 406.B8 | **Mục 5**: Tới gần ghế 406.B8 trên PC, duy nhất 1 gợi ý "Ngồi (E)", không bị vẽ lặp. |
| 27 | `muc5-gan-thanh.jpg` | 108 KB | Desktop 1440×900 | Ngoài trời B8 | **Mục 5**: Tới gần nhân vật Thành ngoài trời, hiển thị duy nhất 1 gợi ý "Nói chuyện (E)" từ `WorldInteractions`. |
| 28 | `muc8-360-menu-3cham.jpg` | 24 KB | Mobile 360×780 | 406.B8 | **Mục 8**: Màn hình 360 mobile, menu "⋯" mở ra danh sách nút phụ (Ngôn ngữ, Tuần học, Bỏ qua, Âm thanh) gọn gàng, giữ 2 nút chính "Đứng dậy" và "Thoát". |
| 29 | `muc8-360-tam-gap.jpg` | 26 KB | Mobile 360×780 | 206.B8 | **Mục 8**: Màn hình 360 mobile, tấm trắc nghiệm có tay kéo gập xuống, mở rộng tầm nhìn 3D lên TV và lớp học. |
| 30 | `b4-library-360-layout.jpg` | 42 KB | Mobile 360×780 | Thư viện B4 | **Mục 12**: Thư viện B4 ở 360 thật: `ActionPrompt` dời lên `bottom-56` (y=224px), nằm trên thanh chọn tầng T1–T3 (y=176..210px), nút Thư viện (y=176..208px), joystick (y=24..152px) và nút Thoát đi bộ (y=28..72px). Nút góc nhìn `top-32 right-3` thu gọn `🎥 Sau vai · C`. |
| 31 | `canteen-360-layout.jpg` | 34 KB | Mobile 360×780 | Căn tin | **Mục 12**: Khu căn tin ở 360 thật: `ActionPrompt` ở `bottom-56` hiển thị tách biệt hoàn toàn với joystick và nút thoát đi bộ. |

---

## 4. Danh sách commit cục bộ (nhánh `PengWynIsMe/it-silver-ui-mep`)

Toàn bộ các thay đổi được chia nhỏ và commit cục bộ theo quy chuẩn, không đẩy lên remote:

1. `ab37b48`: `feat(ui): them ActionPrompt dung chung va store be rong cot phai cho camera (B5 & D)`
2. `5889780`: `feat(silverWorld): doi UI hoc sang mep man hinh, 4 goc an toan va the chi duong gap duoc (Phan A & B)`
3. `e2384b2`: `feat(lesson): ap dung UI mep man hinh, the chi duong gap va slide compact cho nmlt-01 (Phan C)`
4. `f9d5800`: `fix(lesson): dat nut he thong duoi TopBar o top-16`
5. `e9e267f`: `fix(slide): role alertdialog de Esc chi dong modal phong to ma khong lam dung day`
6. `8a7a1df`: `chore(silverWorld): expose window.__SILVER_DEV__ for testing and verification`
7. `1f9a3d8`: `refactor(ui): dua window.__SILVER_DEV__ va window.__LESSON_STORE__ ra ngoai component duoi import.meta.env.DEV (Muc 1)`
8. `77df836`: `fix(silverWorld): sua WorldDayCard timer cleanup va huy timerHide khi StrictMode hoac doi canh (Muc 2)`
9. `7e3f8b5`: `fix(lesson): tra lai TeacherBubble trong SlideViewer tren cot phai khong che TV (Muc 3)`
10. `6ae5ae3`: `fix(lesson): tra lai toc do chu chay 30 cps trong DialogueView (Muc 4)`
11. `17b13e3`: `fix(ui): sua trung goi y E tren PC bang touchOnly cho WorldNavigationCard va LessonHud (Muc 5)`
12. `63715a7`: `fix(slide): sua SlideView overflow code, xem du khi qua 4 cau, portal modal va nhan EN (Muc 6)`
13. `85a11f9`: `feat(ui): do be rong cot phai thuc te bang ResizeObserver va update cho camera 3D (Muc 7)`
14. `e73f16a`: `feat(ui): gom nut phu header 360 vao menu 3 cham va them tay keo gap cho choice, question, order (Muc 8)`
15. `08afeec`: `fix(ui): doi the chi duong gap tu div sang button aria-expanded trong WorldNavigationCard va LessonHud (Muc 9)`
16. `98f0d38`: `fix(ui): doi goi y E sang bottom-56 tren mobile, click duoc tren PC, va thu gon nut goc nhin (Muc 12)`
17. `f7ab4c2`: `fix(ui): tinh chinh vi tri nut goc nhin top-32 va an the tang tren mobile khi co the chi duong (Muc 12)`

---

## 5. Kết luận & Đề xuất tiếp theo

- Đã giải quyết triệt để toàn bộ 12 mục yêu cầu từ điều phối viên.
- Toàn bộ 5 cổng kiểm tra chất lượng đạt 100% (0 lỗi TypeScript, 0 lỗi lint, 77 test suites / 115 test cases passed, build production thành công).
- Hệ thống UI mới giải phóng hoàn toàn vùng trung tâm 55–60% màn hình, mang lại trải nghiệm tham quan không gian 3D và lớp học trực quan, tối ưu trên cả desktop lớn (1440), tablet (1024) và điện thoại di động (360).
- Biến trạng thái bề rộng cột phải (`rightColumnWidth`) sẵn sàng phục vụ cho camera điều chỉnh tâm nhìn trong lượt tiếp theo.
