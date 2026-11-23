# ND-01 — Ngày kiểm tra đầu vào

Đọc: `docs/it-silver/BRIEF.md`, `PLAN.md` mục B4, `HOP-DONG.md` mục 4, `data/silver.types.txt` phần 3. Kết quả là JSON đúng kiểu, **không code**. Mọi chuỗi có `vi` và `en` viết tự nhiên (không dịch máy từng chữ). Không bịa tên giảng viên, quy chế, đề thi, CLB; không dùng nội dung bản quyền. Ba bạn: **Thành** (Level 2, khác ngành), **Quyền** (Level 3, cùng KTPM), **Han** (nữ, Level 1, cùng lớp). Không phân giỏi/kém theo level. Người chơi không có giới tính, xưng "mình/bạn". Không lựa chọn sai ở `choice`. Đáp án nào cũng có giải thích.
Kiểm: khi có BE-06/BE-12 thì `npm run check:silver`; chưa có thì `node -e "JSON.parse(require('fs').readFileSync('<file>','utf8'))"` và tự đối chiếu kiểu. Phụ thuộc cứng: chỉ `data/silver.types.txt`. Ngoài phạm vi: code, kiểu, UI.

- File: `src/data/silver/chapters/entrance.json`
- Ai làm được: Claude viết; người biết EIU rà chi tiết buổi thi

`ChapterContent` id `entrance`, 8 phút, không `englishLevel`.

| id cảnh | Nơi | Bước bắt buộc |
|---|---|---|
| `entrance/meet-thanh` | `b8` | narrator mở; Thành hỏi đường; `choice` flag `entrance/greet` (`warm`, `brief`); Thành tự giới thiệu |
| `entrance/listening` | `b8` | examiner nói rõ mô phỏng; 2 `question` `listening` về lịch học |
| `entrance/reading` | `b8` | 2 `question` `reading`: thông báo thư viện hư cấu ngắn |
| `entrance/writing` | `b8` | 1 `order` sắp 3–4 câu giới thiệu |
| `entrance/speaking` | `b8` | examiner hỏi tên, sở thích: 2 `choice` (không chấm) |
| `entrance/result` | `b8` | kết quả: người chơi Level 1, Thành 2, Quyền 3; Quyền xuất hiện; Thành: “Mình khác lớp rồi, nhưng giờ nghỉ vẫn gặp nhau nhé.” / "Different classes now, but let's still meet at break." |

`opening` = meet-thanh, `closing` = result, còn lại `scenes`. Kết quả không gắn với câu trả lời. Memory: 2 ảnh, 3 câu (một theo flag `warm`, một theo `brief`, một mặc định).

## Tiêu chí xong

Đủ bốn kỹ năng đúng hình thức; hai lựa chọn cho hai câu lưu bút khác nhau; Thành và Quyền đúng level; 7–9 phút theo tổng `minutes`.
