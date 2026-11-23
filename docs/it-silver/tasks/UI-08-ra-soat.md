# UI-08 — Rà soát và chốt

Đọc trước: `docs/it-silver/BAT-DAU-UI.md` (file được chạm, hình thức, mặc định), `HOP-DONG.md`, `data/silver.types.txt`. Dữ liệu qua `useSilver` từ `src/ui/silver/adapter.ts`. Wireframe là bố cục, không phải chữ cuối; chữ lấy trong bảng chuỗi (`text.ts`, hằng `ST`). Cách kiểm chung: chạy typecheck/lint/build, rồi mục 2–5 của `UI-TU-KIEM.md` cho màn này. Không chạm BE, scene, nội dung.

- Phụ thuộc: UI-00 … UI-07
- File: mọi file UI đã nêu, `docs/it-silver/ui-anh/**`, `docs/it-silver/UI-BAO-CAO.md`

## Làm

1. Chạy trọn `docs/it-silver/UI-TU-KIEM.md`, ghi lỗi, sửa, chạy lại. Ít nhất **hai vòng**: vòng cuối không còn lỗi mới.
2. Đo phút: chơi hai chương giả bằng chuột, ghi thời gian (chỉ tham khảo).
3. Đo chuyển màn Silver: bấm → vẽ < 100 ms trên máy dev; đóng Silver, FPS khuôn viên không giảm so với trước.
4. Viết `UI-BAO-CAO.md`, rebase, kiểm nhanh, push nhánh `it-silver/ui`.

## Tiêu chí xong

- Mọi ô của UI-TU-KIEM đạt; ảnh đủ; diff đúng phạm vi; adapter đang để mock; nhánh đã push, chưa merge.
