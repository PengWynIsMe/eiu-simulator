# Trích xuất CTĐT

Chạy hai bước: `node scripts/ctdt/dump-text.mjs` ghi từng trang vào `references/ctdt/text/<id>/pNN.txt`, sau đó `node scripts/ctdt/extract.mjs [--date YYYY-MM-DD]` sinh curriculum. Dump dùng PDFKit có sẵn trên macOS; đã so sánh thử với dump tọa độ pdfjs-dist và dùng PDFKit vì thứ tự đọc tiếng Việt/Anh trong QTKD rõ hơn. `pdfjs-dist@4.10.38` vẫn được giữ riêng ở đây cho thao tác phân tích tọa độ, không thêm dependency vào ứng dụng. Không dùng OCR.

Parser theo từng dòng/layout; các hàng bị dồn do bảng nhiều cột cần bổ sung override rõ ràng. Luôn xem `node scripts/ctdt/check.mjs`: tổng môn bắt buộc + tự chọn tối thiểu phải khớp tổng CTĐT ghi trong PDF (BSE có sai khác 180 ở mục IV và 183 ở mục VI, cần nêu rõ).

`node scripts/ctdt/check.mjs` kiểm tra cấu trúc dữ liệu và in bảng tóm tắt. Cấu hình ánh xạ file/ngành nằm ở `majors.config.json`.
