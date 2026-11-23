# Báo cáo N1 — parser theo trang, còn sai lệch dữ liệu

## File đã tạo / sửa

- `scripts/ctdt/dump-text.mjs`, `scripts/ctdt/pdfkit-pages.swift`: dump từng trang thành `references/ctdt/text/<id>/pNN.txt`.
- `scripts/ctdt/extract.mjs`: parser layout BM08 theo HK và layout khung ngắn; ngày sinh dữ liệu dùng `--date`.
- `scripts/ctdt/check.mjs`: kiểm tra cấu trúc, nhóm tự chọn và so tổng tín chỉ trích với PDF.
- `scripts/ctdt/majors.config.json`, `overrides.json`, `README.md`; tám file curriculum được sinh ở `src/data/majors/`.
- `scripts/ctdt/package.json`, `package-lock.json`: pdfjs-dist riêng; không sửa package gốc.

## Cách chạy + công cụ PDF đã dùng

1. `node scripts/ctdt/dump-text.mjs`
2. `node scripts/ctdt/extract.mjs --date 2026-11-23`
3. `node scripts/ctdt/check.mjs`

Đã xem trực tiếp `qtkd/p01.txt`, `qtkd/p02.txt`, `qtkd/p07.txt`, `ktpm/p49.txt`, `ktpm/p53.txt`, cùng trang VI tương ứng của các bản BM08. PDFKit cho thứ tự đọc sạch hơn dump thử nghiệm tọa độ pdfjs-dist, nhất là QTKD; dòng bị dồn nhiều cột vẫn cần override. Dump/trích lại cùng ngày cho kết quả xác định.

## Bảng tóm tắt check.mjs (8 ngành)

| Ngành | TC trích / PDF | Môn năm 1/2/3/4 | Nhóm tự chọn | Chuyên ngành |
|---|---:|---:|---:|---:|
| ktpm | 178 / 180 | 8/9/8/3 | 6 | 0 |
| mmt | 193 / 180 | 6/9/9/11 | 7 | 3 |
| tdh | 180 / 186 | 11/14/10/5 | 2 | 2 |
| dien | 182 / 187 | 12/9/13/4 | 3 | 2 |
| cdt | 164 / 188 | 9/15/6/4 | 4 | 2 |
| dtvt | 56 / không ghi | 0/0/7/1 | 3 | 5 |
| cokhi | 166 / 186 | 20/6/11/8 | 3 | 3 |
| qtkd | 143 / 195 | 28/8/0/0 | 1 | 8 |

`check.mjs` **chưa đạt**: lệch lần lượt ktpm −2, mmt +13, tdh −6, dien −5, cdt −24, cokhi −20, qtkd −52 TC. DTVT không ghi tổng trên bản PDF. BSE mục IV ghi 180 còn bảng VI cộng 183; con số so ở đây là 180 theo quy tắc brief. Tên một số nhóm tự chọn/khối kiến thức và danh sách môn tự chọn BM08 chưa được tái dựng đủ chính xác.

## Đối chiếu tay 10 môn/ngành

Chưa thể xác nhận 10 môn ở mỗi ngành: hiện một số dòng bị ghép nhầm nội dung do PDFKit đọc ô nhiều cột theo thứ tự khác nhau. Đã phát hiện và thêm override sửa riêng ECE 300 của DTVT (trang 5); những mã/ngành còn lại cần rà trực tiếp trước khi dùng.

## Override đã dùng

`overrides.json` ghi lý do cho mã bị ngắt dòng ở QTKD/DTVT và sửa ECE 300 theo hàng nguồn. Cơ chế áp dụng `courses`, `drop`, `add` đã được nối vào extractor; chưa đủ override để bù các hàng bảng bị dồn.

## Mã môn ngoài chuẩn / dòng bị bỏ

Chưa thống kê đầy đủ. PDF có môn không mã / chỉ có chứng nhận GDTC, quốc phòng; extractor hiện không chuẩn hóa và phân loại hết các trường hợp này.

## Kết quả typecheck / lint / build

- `npm run typecheck`: đạt.
- `npm run lint`: đạt.
- `npm run build`: đạt.
- Dump từng trang, tái sinh curriculum cùng `--date`: đầu ra lặp lại giống hệt (`diff -r` rỗng).
- `node scripts/ctdt/check.mjs`: **chưa đạt** do sai lệch tín chỉ nêu trên.

## Chưa chắc / rủi ro

QTKD và COKHI có bảng khung bị dồn nhiều dòng; BM08 bắt được một phần môn theo HK nhưng chưa hoàn chỉnh môn bắt buộc/tự chọn và mapping `block`. Curriculum hiện tại là kết quả chẩn đoán parser, chưa an toàn để N2 dùng làm nguồn nội dung.

## Đề xuất

Tiếp tục thêm override theo hàng PDF cho QTKD trước, sau đó BSE và các bảng BM08; chỉ đánh dấu hoàn tất khi 10 môn/ngành khớp mã, VI/EN, tín chỉ, năm và `check.mjs` không còn lệch ngoài ngoại lệ BSE 180/183 đã nêu.
