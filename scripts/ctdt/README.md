# Trích xuất CTĐT

`node scripts/ctdt/extract.mjs [--date YYYY-MM-DD]` là lệnh dự kiến sinh curriculum từ PDF trong `references/ctdt/`.
PDF được đọc bằng `pdfjs-dist@4.10.38` (cài riêng ở thư mục này, không thêm dependency vào ứng dụng). `page.getTextContent()` giữ tọa độ từng mảnh chữ; script gom theo trục y và x để khôi phục thứ tự bảng. Giới hạn: bố cục PDF thay đổi hoặc chữ bị tách bất thường cần xử lý bằng `overrides.json`; không dùng OCR.

`node scripts/ctdt/check.mjs` kiểm tra cấu trúc dữ liệu và in bảng tóm tắt. Cấu hình ánh xạ file/ngành nằm ở `majors.config.json`.
