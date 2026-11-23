# Báo cáo nội dung môn IT Silver

Các môn ở trạng thái `nhap` để chủ dự án duyệt. Bản đọc VI/EN có đầy đủ lời thoại, slide, câu hỏi, lựa chọn, đáp án và phản hồi. [Kịch bản môn học](KICH-BAN-MON.md)

## ND-04 · Các môn tóm gọn

Ba file mới trong `src/data/silver/content/`. Số trang lấy theo thứ tự trang của BSE.pdf. Cột số từ tính theo khoảng trắng và gồm toàn bộ chữ hiển thị trong từng buổi, kể cả tên buổi, lựa chọn và phản hồi.

| File | Trang PDF | Phút A + B | Số từ VI A / B |
|---|---:|---:|---:|
| `math-112.json` | 15 | 1,75 + 1,75 | 94 / 128 |
| `pols-135.json` | 8–9 | 1,75 + 1,75 | 127 / 109 |
| `coms-101.json` | 21 | 1,75 + 1,75 | 101 / 114 |

### Tiêu chí xong

| Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|
| Ba JSON đúng kiểu, đủ VI/EN và ở trạng thái nháp | Đạt | Parse JSON và kiểm từng object theo `CourseContent` bằng TypeScript với `--strict` và `--noUncheckedIndexedAccess`. |
| Hai buổi tại B8, mỗi buổi có tương tác, đúng thời lượng và giới hạn chữ | Đạt | 3,5 phút mỗi môn. Từng buổi ≤ 130 từ VI, giới thiệu và lời kết ≤ 25 từ mỗi ngôn ngữ. |
| ID và tham chiếu hợp lệ | Đạt | Mã khớp danh mục, `b8` có trong dữ liệu khuôn viên, ID cảnh và ID bước duy nhất trong phạm vi tương ứng. Đáp án trỏ tới lựa chọn có thật, thứ tự là hoán vị đầy đủ của các mục. Các cảnh tự đủ ngữ cảnh khi vào thẳng kỳ 2.2. |
| Có Han hoặc Quyền, lựa chọn hội thoại đều có phản hồi | Đạt | Han mở bài vectơ và trao đổi về bài nói. Quyền hỏi cách chia việc nhóm. Mỗi nhánh hội thoại có lời đáp phù hợp với cách người chơi chọn. |
| Căn cứ PDF và giọng trung tính | Đạt | Đối chiếu trực tiếp trang 15, 8–9 và 21. `basis` ghi trang và chú thích mô phỏng ngắn ở cả hai ngôn ngữ. POLS 135 trình bày phạm vi học phần và cách thảo luận tài liệu. |
| Giải lại câu hỏi và kiểm bản đọc | Đạt | Đáp án và phản hồi đối chiếu bên dưới. Bản đọc sinh từ JSON và kiểm khớp từng dòng. |

### Đối chiếu câu hỏi

- **MATH 112 A** · `2 + (−3) = −1` và `−1 + 4 = 3`, nên tổng là `(−1, 3)`.
- **MATH 112 B** · `(1/4) ÷ (1/2) = (1/8) ÷ (1/4) = 1/2`. Mỗi số hạng bằng một nửa số trước. Hai hiệu đầu là `−1/4` và `−1/8`, nên dấu hiệu của chuỗi là công bội `1/2`.
- **POLS 135 A** · Đoạn đọc nêu cả dân chủ xã hội chủ nghĩa và cơ cấu xã hội. Buổi B chấp nhận cả chia đoạn để bao quát phần đọc và cùng đọc một đoạn để đối chiếu cách hiểu.
- **COMS 101 A** · Nhắc lại ý của Han giúp xác nhận mục tiêu. Hỏi chỗ khó theo dõi giúp tìm được đoạn chuyển sang ví dụ cần xem lại.
- **COMS 101 B** · Chào người nghe → nêu chủ đề áp phích → báo trước bố cục và ví dụ. Đây là trình tự nhóm đã thống nhất trong slide.

## ND-05 · Các môn để đổi hoặc thêm

Hai file mới trong `src/data/silver/content/`. CSE 204 dùng mô hình TCP/IP bốn tầng và một bài thực hành trên sơ đồ hai LAN.

| File | Trang PDF | Phút A + B + lab | Số từ VI A / B / lab |
|---|---:|---:|---:|
| `cse-204.json` | 32 | 1,5 + 1,5 + 2 | 119 / 83 / 128 |
| `stat-101.json` | 17 | 1,75 + 1,75 | 118 / 104 |

### Tiêu chí xong

| Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|
| Hai JSON đúng kiểu, đủ VI/EN và ở trạng thái nháp | Đạt | Parse JSON và kiểm hai file theo `CourseContent` bằng TypeScript strict. |
| Tương tác và thời lượng đúng từng môn | Đạt | CSE 204 có 2 buổi lý thuyết và 1 lab, tổng 5 phút. STAT 101 có 2 buổi lý thuyết, tổng 3,5 phút. Các buổi tại B8. |
| Đúng giới hạn chữ | Đạt | Từng buổi lý thuyết ≤ 130 từ VI. Lab có 128 từ VI (giới hạn 200). Giới thiệu và lời kết ≤ 25 từ mỗi ngôn ngữ. |
| Căn cứ PDF, mã và tham chiếu hợp lệ | Đạt | Đối chiếu trực tiếp trang 32 và 17. `basis` có chú thích mô phỏng ngắn. Mã khớp danh mục, ID cảnh, ID bước, ID đáp án và thứ tự đều hợp lệ. |
| Giải lại câu hỏi và kiểm bản đọc | Đạt | Kiểm cả đáp án đúng duy nhất và thứ tự xếp. Bản đọc khớp với hai file JSON. |
| Dữ liệu đủ để thử đổi, thêm và hai lab trong tuần 2.2 | Đạt | Theo lịch game, CSE 100 có trước 2.2. STAT 101 dùng mặc định Q5, cần cả MATH 111 và MATH 103, đều có trước 2.2. Thêm cả hai vào bốn môn gợi ý cho sáu môn và hai lab CSE 103, CSE 204. |

### Đối chiếu câu hỏi

- **CSE 204 A** · Từ phía gửi, dữ liệu đi từ ứng dụng xuống giao vận, Internet rồi liên kết.
- **CSE 204 B** · `192.0.2.10/24` và `192.0.2.30/24` đều thuộc `192.0.2.0/24`. Hai địa chỉ bắt đầu bằng `198.51.100` thuộc `198.51.100.0/24`.
- **CSE 204 lab** · Router là lựa chọn định tuyến giữa hai mạng con. Các thiết bị trung gian theo chiều A sang B là switch LAN A → router → switch LAN B.
- **STAT 101 A** · Có bốn thẻ xanh trong sáu thẻ đồng khả năng, nên xác suất là `4/(4+2) = 2/3`.
- **STAT 101 B** · Hai xác suất cộng thành 1. Trung bình theo trọng số là `0 × 3/4 + 4 × 1/4 = 1`.

## Kiểm tra trên nhánh nội dung

`npm run typecheck`, `npm run lint` và `npm run build` đều thoát 0 cho cả hai task. Nhánh từ `origin/main` chưa có `check:silver`, nên dùng script tạm ngoài repo để kiểm JSON, kiểu và tham chiếu, đối chiếu lại 10 đáp án có chấm và so khớp bản đọc. Các cảnh dùng tham chiếu bài tập nội bộ và mã tòa `b8`, độc lập với trạng thái đã lưu của chương.

Máy có JDK 25.0.3. Năm môn trong hai task dùng bài đọc, hội thoại, câu hỏi và sắp xếp, nên mục chạy Java không áp dụng. Việc chơi thử đổi/thêm môn và đo thời lượng thực tế chờ bản ghép BE/UI.
