# Báo cáo N1 — chưa đạt tiêu chí trích xuất

## File đã tạo

- `scripts/ctdt/package.json`, `package-lock.json`: cài riêng `pdfjs-dist@4.10.38`, không thay package gốc.
- `scripts/ctdt/majors.config.json`, `overrides.json`, `extract.mjs`, `check.mjs`, `README.md`.
- Tám `src/data/majors/*.curriculum.json` được script sinh để kiểm tra pipeline; **không dùng làm dữ liệu hoàn chỉnh**.

## Cách chạy + công cụ PDF đã dùng

`node scripts/ctdt/extract.mjs --date 2026-11-23`; parser dùng pdfjs-dist và nhóm text theo tọa độ x/y. Chạy lại cùng ngày cho kết quả byte-identical (`diff -r` rỗng).

## Bảng tóm tắt check.mjs (8 ngành)

| Ngành | TC trích / tổng PDF | Môn năm 1/2/3/4 | Nhóm tự chọn | Chuyên ngành |
|---|---:|---:|---:|---:|
| ktpm | 0 / chưa có | 0/0/0/0 | 0 | 0 |
| mmt | 0 / chưa có | 0/0/0/0 | 0 | 3 |
| tdh | 0 / chưa có | 0/0/0/0 | 0 | 2 |
| dien | 0 / chưa có | 0/0/0/0 | 0 | 2 |
| cdt | 0 / chưa có | 0/0/0/0 | 0 | 2 |
| dtvt | 3 / chưa có | 1/0/0/0 | 0 | 5 |
| cokhi | 2 / chưa có | 0/0/0/1 | 0 | 3 |
| qtkd | 127 / chưa có | 11/8/4/9 | 0 | 8 |

`check.mjs` thoát khác 0 cho cả tám ngành vì chưa có tổng tín chỉ hoặc nhóm tự chọn. Các kết quả này phản ánh **pipeline thử nghiệm dở dang**, không phải bản dữ liệu bàn giao.

## Đối chiếu tay 10 môn/ngành

Chưa thực hiện: đầu ra parser không đủ ổn định để chọn 10 môn/ngành nhằm xác nhận.

## Override đã dùng

Khai báo 8 mã bị tách dòng trong `overrides.json`; hiện extractor chưa áp dụng các override vào việc tái dựng tên/mã, do đó không tính là đã sửa được dữ liệu.

## Mã môn ngoài chuẩn / dòng bị bỏ

Chưa thống kê đáng tin cậy. Các dòng thể chất/quốc phòng chưa được lọc và ghi nhận đầy đủ.

## Kết quả typecheck / lint / build

- `npm run typecheck`: đạt.
- `npm run lint`: đạt.
- `npm run build`: đạt.
- Tái sinh cùng `--date`: `diff -r` rỗng.
- `node scripts/ctdt/check.mjs`: **không đạt**, do thiếu tổng tín chỉ/nhóm tự chọn.

## Chưa chắc / rủi ro

Parser hiện chỉ gom văn bản gần nhau quanh mã môn, chưa dựng đúng cột, ranh giới bảng và quan hệ kế hoạch môn của BM08; nhiều dòng bị thiếu hoặc ghép sai tên. Chưa có đối chiếu tay. Không dùng tám JSON hiện tại cho app hoặc N2.

## Đề xuất

Tiếp tục bằng parser theo vùng/cột cho từng layout PDF, khai thác bảng VI và danh sách tự chọn riêng từng BM08, rồi đối chiếu thủ công trước khi thay các JSON thử nghiệm. Không cần đổi schema; chưa đề xuất thêm thư viện.
