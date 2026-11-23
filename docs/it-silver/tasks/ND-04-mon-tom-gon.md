# ND-04 — MATH 112, POLS 135, COMS 101 (tóm gọn)

Đọc: `docs/it-silver/BRIEF.md`, `PLAN.md` mục B4, `HOP-DONG.md` mục 4, `data/silver.types.txt` phần 3. Kết quả là JSON đúng kiểu, **không code**. Mọi chuỗi có `vi` và `en` viết tự nhiên (không dịch máy từng chữ). Không bịa tên giảng viên, quy chế, đề thi, CLB; không dùng nội dung bản quyền. Ba bạn: **Thành** (Level 2, khác ngành), **Quyền** (Level 3, cùng KTPM), **Han** (nữ, Level 1, cùng lớp). Không phân giỏi/kém theo level. Người chơi không có giới tính, xưng "mình/bạn". Không lựa chọn sai ở `choice`. Đáp án nào cũng có giải thích.
Kiểm: khi có BE-06/BE-12 thì `npm run check:silver`; chưa có thì `node -e "JSON.parse(require('fs').readFileSync('<file>','utf8'))"` và tự đối chiếu kiểu. Phụ thuộc cứng: chỉ `data/silver.types.txt`. Ngoài phạm vi: code, kiểu, UI.

- File: `src/data/silver/content/math-112.json`, `pols-135.json`, `coms-101.json`
- Ai làm được: Codex/Antigravity theo khuôn; Claude duyệt. Có thể chia ba thợ, mỗi người một file

Mỗi file: `tier: summary`, `theoryA` + `theoryB`, không lab, tổng 3.5 phút (1.75 + 1.75), khuôn PLAN B4.

| Môn | PDF | A | B |
|---|---|---|---|
| MATH 112 Giải tích II | tr.15 | vector: cộng hai vector cụ thể, 1 `question` | dãy và chuỗi: nhận ra chuỗi hình học 1/2 + 1/4 + …, 1 `question` |
| POLS 135 CNXH khoa học | tr.8–9 | môn nghiên cứu gì (đối tượng), 1 `question` đọc hiểu | vấn đề gia đình / cơ cấu xã hội như một chủ đề thảo luận nhóm, 1 `choice` cách nhóm chia việc |
| COMS 101 Kỹ năng giao tiếp | tr.21 | nghe và phản hồi: 1 `choice` | mở đầu bài thuyết trình: 1 `order` |

Mỗi buổi phải có ít nhất một tương tác; ít nhất một trong ba môn có Han hoặc Quyền xuất hiện một câu. Nơi: `b8`. POLS 135: trung tính, bám mô tả PDF, không bình luận thêm.

## Tiêu chí xong

Ba file hợp lệ; ≤ 130 từ VI mỗi buổi; toán đã tự giải lại; `basis` đủ.
