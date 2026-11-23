# ND-02 — Năm 1 kỳ 1, Level 1

Đọc: `docs/it-silver/BRIEF.md`, `PLAN.md` mục B4, `HOP-DONG.md` mục 4, `data/silver.types.txt` phần 3. Kết quả là JSON đúng kiểu, **không code**. Mọi chuỗi có `vi` và `en` viết tự nhiên (không dịch máy từng chữ). Không bịa tên giảng viên, quy chế, đề thi, CLB; không dùng nội dung bản quyền. Ba bạn: **Thành** (Level 2, khác ngành), **Quyền** (Level 3, cùng KTPM), **Han** (nữ, Level 1, cùng lớp). Không phân giỏi/kém theo level. Người chơi không có giới tính, xưng "mình/bạn". Không lựa chọn sai ở `choice`. Đáp án nào cũng có giải thích.
Kiểm: khi có BE-06/BE-12 thì `npm run check:silver`; chưa có thì `node -e "JSON.parse(require('fs').readFileSync('<file>','utf8'))"` và tự đối chiếu kiểu. Phụ thuộc cứng: chỉ `data/silver.types.txt`. Ngoài phạm vi: code, kiểu, UI.

- File: `src/data/silver/chapters/1.1.json`
- Ai làm được: Claude viết; chủ dự án duyệt giọng

`ChapterContent` id `1.1`, `englishLevel: 1`, 10–13 phút.

| id cảnh | Bước |
|---|---|
| `1.1/greet-han` (b8) | gặp Han; cùng tập "Nice to meet you."; `choice` flag `1.1/han` (`practice`, `joke`); 1 `order` lời chào. **Giữ đúng id**, ND-03 dựa vào |
| `1.1/skills` (b8) | 1 nghe, 1 đọc rất ngắn (A1 tham khảo) |
| `1.1/philosophy` (b8) | tiết POLS 133 phòng lớn: 1 `slide` + 1 `question`, bám mô tả PDF tr.7–8 |
| `1.1/pe` (b8 hoặc sân) | giờ thể chất đầu tiên, có thể bỏ qua; `choice` flag `1.1/pe` (`run`, `rest`) |
| `1.1/midterm` | 2 câu ngắn |
| `1.1/final` | 4 bước: nghe, đọc, `order` viết, `choice` nói |
| `1.1/after` (closing) | Han, Thành gặp giờ nghỉ; nhắc flag `1.1/han` bằng `variants` |

Memory: ảnh lớp với Han, ảnh sân; câu theo `1.1/han`; hoạt động: giờ thể chất.

## Tiêu chí xong

Có giữa kỳ, cuối kỳ đủ bốn kỹ năng; không cảnh nào nói người chơi giỏi/kém; không quy đổi Level sang band; 10–13 phút.
