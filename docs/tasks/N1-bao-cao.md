# Báo cáo N1 — công thức kiểm tra đã sửa, dữ liệu còn lệch

## File thay đổi trong lượt này

- `scripts/ctdt/check.mjs`: phân rã common required, elective minimum, specialization required, specialization elective minimum và graduation. `ElectiveSlot` trên năm chỉ là tham chiếu, không cộng lần hai.
- `scripts/ctdt/extract.mjs`: giữ trạng thái học kỳ qua ranh giới trang BM08; nhận override cho môn chuyên ngành; hỗ trợ môn thêm thủ công.
- `scripts/ctdt/majors.config.json`: ánh xạ môn bắt buộc chuyên ngành BM08.
- `scripts/ctdt/overrides.json`: môn bắt buộc 8 chuyên ngành QTKD, nhóm tự chọn chuyên ngành, hai môn tốt nghiệp QTKD, PHYS 101 BEE và sửa tên đã xác minh.
- Tám `src/data/majors/*.curriculum.json` được sinh lại từ các file text trang.

## Công thức check

Theo từng chuyên ngành: **môn bắt buộc chung trong years + tối thiểu nhóm tự chọn chung + môn bắt buộc chuyên ngành + tối thiểu nhóm tự chọn của chuyên ngành + môn tốt nghiệp**. Tín chỉ elective slot không cộng lại khi đã có nhóm tương ứng. BSE chấp nhận tổng ghi ở mục IV là 180 hoặc bảng VI là 183; DTVT không có tổng công bố nên không bị chặn vì tổng.

## Kết quả phân rã

| Ngành | Môn bắt buộc chung | Tự chọn chung tối thiểu | Tốt nghiệp | Bắt buộc chuyên ngành | Tự chọn chuyên ngành | Tính ra / PDF |
|---|---:|---:|---:|---:|---:|---:|
| ktpm | 134 | 40 | 10 | 0 | 0 | 184 / 180 hoặc 183 |
| mmt | 126 | 32 | 10 | 8 | 0 hoặc 4 | 172 / 180 (từng chuyên ngành: 172, 180, 172) |
| tdh | 147 | 20 | 7 | 8 | 0 hoặc 8 | 182 / 186 (182, 190) |
| dien | 128 | 26 | 4 | 8 | 0 hoặc 8 | 166 / 187 (166, 174) |
| cdt | 144 | 20 | 7 | 4 | 0 | 175 / 188 (175, 175) |
| dtvt | 32 | 24 | 0 | 0 | 0 | 56 / không ghi |
| cokhi | 154 | 12 | 0 | 0 | 0 | 166 / 186 |
| qtkd | 139 | 4 | 12 | 20–28 | 16–24 | 199–203 / 195 |

Các tổng common hiện tại vẫn có course bị phân loại sai: khung QTKD còn đưa môn trong danh sách lựa chọn vào `years`; một số nhóm tự chọn common chưa được nhận diện. Vì vậy các số phân rã cho thấy **khối cần sửa**, không khẳng định dữ liệu hiện tại đã đúng. Lỗi không còn là do cộng elective slot trùng: các curriculum còn thiếu hoặc phân loại sai môn/nhóm, specialty elective BM08 chưa nối đủ, và một số bản khung chưa có specialization courses.

### Ngành còn lệch và khối cụ thể

- **QTKD**: các nhóm chuyên ngành đã được thêm tay từ mục 2.3.1–2.3.8 và nhóm 2.3.9 gán mức 16/20/24 TC theo chuyên ngành; hai môn BUS 450/496 (12 TC) vào khối tốt nghiệp. Kết quả vẫn thừa 4–8 TC theo nhánh, do parser chưa tách sạch môn common bắt buộc khỏi danh sách tự chọn và còn thiếu các nhóm common ở mục 1.3–1.6 / môn cơ sở ở trang 3–5. Y3 vẫn chưa đủ môn cơ sở ngành, Y4 hiện mới có hai môn tốt nghiệp.
- **BSE**: trạng thái HK liên trang đã khôi phục CSE 100, CSE 106, CSE 104, CSE 204 và CSW 303/304/306/405/480; các môn đã thấy được xếp đúng năm. Còn lệch +4 so với 180 và +1 so với tổng bảng VI 183; cần rà lại elective minimum/một dòng tín chỉ. CSN 302 trong PDF p.52 là **CSN 302**, nên không áp dụng đề xuất N2 đổi thành CSE 302.
- **MMT**: môn chuyên ngành đã tách khỏi `years`; ba nhánh hiện lần lượt thiếu 8, 0, 8 TC so với 180. Cần bổ sung các nhóm tự chọn chuyên ngành còn thiếu và rà 2 môn năm 1.
- **TDH**: ACE 303/306, MATH 112, PHYS 102 đã được đưa vào kế hoạch; specialist courses đã tách một phần. Nhánh tự động hóa còn thừa 4 TC, nhánh điều khiển thiếu 4 TC; cần gán lại nhóm tự chọn theo nhánh.
- **Điện**: thêm PHYS 101 ở HK1.1 và tách EE 401/402, EE 411/413; hai nhánh còn thiếu lần lượt 21 và 13 TC, phần tự chọn/chuyên ngành chưa đủ.
- **Cơ điện tử**: thêm MEC 402 và MEC 489 vào hai specialization; vẫn thiếu 13 TC ở mỗi nhánh, còn môn ranh giới trang và danh sách elective.
- **Cơ khí**: tổng phân rã thiếu 20 TC; cả ba `requiredCourses` chuyên ngành đang rỗng và có lỗi dính tên ME 440. Cần override tay các môn trang 3–4.
- **DTVT**: tổng PDF không ghi; JSON mới có 8 course plan rows, mất gần hết năm 1–2 và môn bắt buộc 5 chuyên ngành. ETE 349 đã tách đúng tên “Thiết kế hệ thống nhúng / Embedded System Design”; dòng “Lập trình điều khiển nhúng” trong PDF không thấy mã nên chưa tự gán mã.

## Đối chiếu tay 10 dòng/ngành

Đã so các hàng mẫu trực tiếp giữa curriculum và `references/ctdt/text/<id>/pNN.txt`, ưu tiên code, tên VI/EN, tín chỉ và năm/kỳ:

| Ngành | Kết quả mẫu / phát hiện |
|---|---|
| qtkd | 10 hàng đầu: code, VI/EN, TC khớp; 4 môn toán trong mẫu là lựa chọn nhưng đang bị đặt ở `years`. |
| ktpm | 10 hàng HK1–2: code, tên, TC, HK khớp sau khi giữ state liên trang; lỗi `CSW 482` và tên Anh `POLS 132` đã override. |
| mmt | 10 hàng kế hoạch: code, VI/EN, TC khớp; riêng `STAT 101` ở HK1.3 (không phải HK2.1 như N2 ghi), theo PDF p.48. |
| tdh | 10 hàng mẫu: code, tên, TC và học kỳ khớp; lỗi còn lại là specialty/elective assignment. |
| dien | Mẫu xác nhận thiếu PHYS 101 (đã thêm override); các hàng còn lại trong mẫu khớp code/tên/TC. |
| cdt | Mẫu xác nhận các môn; appendix IV viết `LAW 122`, bảng VI dùng `LAWS 122`; giữ mã theo bảng VI là nguồn brief yêu cầu. |
| dtvt | 10 hàng bảng chuyên ngành ở p.8 đã xem; parser chỉ giữ được 8 hàng, ETE 349 đã sửa, dòng kế tiếp chưa có mã rõ để nhập. |
| cokhi | 10 hàng đầu khớp code/tên/TC; phân năm vẫn là suy theo mã như quy tắc bản khung. |

Đây là spot-check thủ công, không thay cho việc rà hết các hàng. Các chỗ chưa khớp/phân loại sai được nêu ở bảng kết quả và chưa dùng làm dữ liệu hoàn tất.

## Override và điểm chưa chắc

Override tay gồm 8 danh sách môn bắt buộc chuyên ngành QTKD, mức tự chọn 2.3.9 theo PDF, BUS 450/496, PHYS 101 BEE, ECE 300/ETE 349 DTVT, và hiệu chỉnh tên `CSW 482`/`POLS 132`. Không tự đổi `CSN 302`: nguồn PDF hiển thị CSN, trái với một dòng trong báo cáo N2. MEE giữ `LAWS 122` theo bảng VI; appendix IV in `LAW 122`.

## Kiểm tra

- `node scripts/ctdt/dump-text.mjs`: đạt; sinh text từng trang vào `references/ctdt/text/` (bị ignore, PDF/text không được git add).
- Tái sinh cùng `--date 2026-11-23`: xác định, `diff -r` rỗng.
- `node scripts/ctdt/check.mjs`: **chưa đạt**; các lệch được liệt kê phía trên.
- Kết quả `typecheck`, `lint`, `build`: sẽ ghi sau lượt kiểm tra cuối.

## Kết luận / đề xuất

Đã sửa phép tính của checker và dùng checklist N2 để xử lý ranh giới trang cùng một số specialty rows. Vẫn còn ngành lệch ở các khối đã nêu; theo yêu cầu, dừng ở đây để chủ dự án quyết định có chuyển sang đọc PDF trực tiếp cho phần còn lại không.
