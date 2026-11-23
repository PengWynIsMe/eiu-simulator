# Báo cáo 3D-00 — Kho hoạt động dùng chung

3D-00 đã xong trên nhánh cục bộ `it-silver/3d`. Điều phối có thể giao 3D-01 từ nhánh này để khởi động `startLessonBridge(b11ToWorld)` và nối `WalkMode` với kho hoạt động.

## Bản gộp trước khi triển khai

Tạo nhánh từ `origin/main` tại `619aaf2`. Ba merge commit theo thứ tự đều thành công.

| Nhánh gộp | Merge commit | Kết quả |
| --- | --- | --- |
| `it-silver/be` | `210ac37` | Không xung đột |
| `PengWynIsMe/it-silver-nd-truyen` | `9bf027a` | Không xung đột |
| `it-silver/nd-mon` | `2aa677c` | Không xung đột |

`npm ci` thành công. Lần chạy đầu, `test:silver` có một ca lỗi do giả định dữ liệu thật của kỳ 2.2 còn thiếu. Commit `a63a724` cho ca đó chạy trong thư mục tạm có danh mục, kế hoạch và chương trình đào tạo. Ca kiểm vẫn yêu cầu cảnh báo và mã thoát 0 ở chế độ thường, lỗi và mã thoát 1 ở chế độ strict khi thiếu nội dung. Toàn bộ chuỗi lệnh đã đạt trước khi triển khai store.

## Tiêu chí và kết quả

| Tiêu chí | Cách kiểm | Kết quả |
| --- | --- | --- |
| Chép nguyên hợp đồng kiểu | `cmp docs/it-silver/data/silverWorld.types.txt src/types/silverWorld.ts` | Đạt |
| Đi → gần → tương tác → đứng → tương tác lại | Kiểm trạng thái, đích đứng, máy đóng, mất tầm và số thông báo Zustand | Đạt |
| Giữ ghế giữa hai hoạt động | `begin` với `keepSeated` khi đã ngồi giữ tư thế, xóa yêu cầu dịch chuyển và đặt lại tầm cùng trạng thái máy | Đạt |
| Hai lần `begin` liên tiếp | Kiểm thay đích, các chế độ `arrival`, `target`, `none` và id dịch chuyển tăng qua cả `end` | Đạt |
| `arriveNow` đặt cạnh đích | Kiểm `seat.stand`, điểm ngoài trời lùi 1,2 m và hướng về đích, người chơi vẫn cần tương tác | Đạt |
| Các trigger | Kiểm `sit`, `talk`, `look` qua tương tác, `none` bắt đầu ở `engaged` | Đạt |
| Dựng Activity từ phòng học | Dùng `b11ToWorld` thực tế, đối chiếu điểm đến, trục hướng, ghế, lối đi và hai camera với tọa độ của bản cũ | Đạt |
| Đồng bộ hai chiều | Đếm cập nhật riêng ở hai store cho tìm ghế, ngồi, đứng, mở/đóng máy và lệnh lặp. Kiểm dừng bridge, về idle và bảo toàn hoạt động Silver | Đạt |
| Hồi quy logic nmlt-01 | Chạy test với và không khởi động bridge, qua thoại, hai slide, câu hỏi sai rồi đúng, hai bài code, ngồi lại và tổng kết | Đạt |
| Hồi quy trình duyệt | Orca trên bản preview. Bắt đầu ở sảnh thang máy tầng 4 B11, dùng sự kiện kiểm tra vị trí sẵn có để đặt người cạnh ghế, bấm E, qua thoại, cả hai slide, câu hỏi, đăng nhập máy, chạy hai bài code, tổng kết 3 sao và về khuôn viên | Đạt |
| Kiểm cảm ứng và console | Viewport 360 × 800 có cần ảo, nút **Ngồi (E)** mở lời chào của thầy. Console Orca trống trên desktop và viewport cảm ứng | Đạt |
| Hành vi Esc theo từng lần bấm | Hai lần thử cho thấy một lần Esc khi mở máy vừa thu máy vừa đứng dậy. E ngồi lại mở đúng bài đang làm. Hai listener capture hiện có của `LessonLayer` và `WalkMode` cùng xử lý phím | Lỗi sẵn có, ngoài phạm vi 3D-00 |
| Giữ phạm vi và API | Diff so với `2aa677c` xác nhận API các store cũ, `src/types/silver.ts`, các thư mục UI của đồng đội và điểm khởi động app giữ nguyên. Tên chunk Vite giống bản gộp | Đạt |

## Kiểm tra lệnh

| Lệnh | Trước triển khai, sau sửa ca kiểm | Sau triển khai |
| --- | --- | --- |
| `npm run typecheck` | Đạt | Đạt |
| `npm run lint` | Đạt | Đạt |
| `npm run build` | Đạt | Đạt |
| `npm run test:silver` | Đạt | Đạt, thêm 6 ca 3D-00 |
| `npm run check:silver -- --strict` | Đạt | Đạt, vẫn có 6 cảnh báo VI trùng EN từ nội dung đã gộp |

`npm ci` báo 13 mục kiểm toán phụ thuộc. Preview đã tắt, cổng 5193 không còn listener và tab Orca đã đóng. Ảnh kiểm thử lưu ngoài repo tại `/tmp/campussim-3d-00/` trên máy chạy task gồm `desktop-ngoi.png`, `desktop-tong-ket.png` và `mobile-nut-ngoi.png`.

## Chi tiết bàn giao

- Commit `8cf2acb` thêm `src/types/silverWorld.ts`, `src/store/useActivityStore.ts`, `src/silverWorld/lessonBridge.ts` và `scripts/silver/tests/activity.test.mjs`.
- Bridge nhận phép đổi tọa độ từ bên gọi. Camera và điểm đứng khớp phòng 406.B11 hiện tại. Khi luồng cũ chuyển sang `findSeat`, bridge chuyển Activity sang `near`. Khi chuyển sang WalkMode dùng Activity ở 3D-01, phép đo khoảng cách ghế là nguồn cập nhật `inRange`.
- Mỗi yêu cầu dịch chuyển mới có id tăng dần. `begin` không dịch chuyển sẽ xóa yêu cầu cũ. `arriveNow` chỉ gửi vị trí, để thao tác E kích hoạt cảnh.
