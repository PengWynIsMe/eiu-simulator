# ND-05 — Môn để đổi: CSE 204, STAT 101

Đọc: `docs/it-silver/BRIEF.md`, `PLAN.md` mục B4, `HOP-DONG.md` mục 4, `data/silver.types.txt` phần 3. Kết quả là JSON đúng kiểu, **không code**. Mọi chuỗi có `vi` và `en` viết tự nhiên (không dịch máy từng chữ). Không bịa tên giảng viên, quy chế, đề thi, CLB; không dùng nội dung bản quyền. Ba bạn: **Thành** (Level 2, khác ngành), **Quyền** (Level 3, cùng KTPM), **Han** (nữ, Level 1, cùng lớp). Không phân giỏi/kém theo level. Người chơi không có giới tính, xưng "mình/bạn". Không lựa chọn sai ở `choice`. Đáp án nào cũng có giải thích.
Kiểm: khi có BE-06/BE-12 thì `npm run check:silver`; chưa có thì `node -e "JSON.parse(require('fs').readFileSync('<file>','utf8'))"` và tự đối chiếu kiểu. Phụ thuộc cứng: chỉ `data/silver.types.txt`. Ngoài phạm vi: code, kiểu, UI.

- File: `src/data/silver/content/cse-204.json`, `stat-101.json`
- Ai làm được: Codex/Antigravity; Claude duyệt

- CSE 204 Mạng máy tính (PDF tr.32): A = mô hình TCP/IP theo tầng (`order`), B = IP và subnet ý niệm (`question`), lab 2 phút = chọn thiết bị nối hai mạng LAN (`question` + `order`). Tổng 5 phút (1.5 + 1.5 + 2). Không lab máy thật.
- STAT 101 (tr.17): A = xác suất cơ bản (`question`), B = trung bình của biến ngẫu nhiên nhỏ (`question`). 3.5 phút.

Tiêu chí như ND-04. Hai môn này cho phép thử đổi môn, thêm môn và hai lab cùng tuần.
