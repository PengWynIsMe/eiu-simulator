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

### Kiểm tra trên nhánh nội dung

`npm run typecheck`, `npm run lint` và `npm run build` đều thoát 0. Nhánh từ `origin/main` chưa có `check:silver`, nên dùng kiểm tra JSON, kiểu và tham chiếu bằng script tạm ngoài repo. Máy có JDK 25.0.3. Phạm vi ND-04 gồm các bài đọc, hội thoại và bài tập không có đoạn Java cần chạy. Việc chơi thử và đo thời lượng thực tế chờ bản ghép với BE/UI.
