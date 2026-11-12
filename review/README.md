# Góp ý trên mô hình

- `notes.json` — ghi chú tạo trên máy chủ dự án (`npm run dev`, bật "Chế độ góp ý"). App tự ghi vào file này.
- `inbox/` — file ghi chú đồng nghiệp tải về từ link GitHub Pages ("Tải file ghi chú") rồi gửi lại. Bỏ file vào đây.

Claude đọc cả hai, gom theo vật thể, sửa, rồi đổi `status` sang `da-sua` kèm `resolution`.
