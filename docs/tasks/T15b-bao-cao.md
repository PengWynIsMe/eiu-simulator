# Báo cáo T15b — camera FPS và cầu thang bộ

## Đã sửa

- `src/scene/walk/PlayerCharacter.tsx`: đo `Box3` một lần khi model tải ở trạng thái Idle, scale chiều cao model về 1.70 m và đặt chân tại y = 0; capsule dự phòng cao xấp xỉ 1.70 m.
- `src/scene/walk/WalkMode.tsx`: phím C xoay vòng sau vai → FPS → trên xuống ở cả trong/ngoài nhà. FPS đặt camera ngang tầm mắt 1.60 m, ẩn robot, hỗ trợ pointer lock với độ nhạy 0.0022 và pitch giới hạn ±80°. Trên cảm ứng, vuốt nửa phải để nhìn. Điều chỉnh near/far theo chế độ; khi thoát đi bộ phục hồi near 5 / far 2500. Chuyển tầng từ thang bộ tìm ô cùng tên, nếu thiếu thì chọn ô gần nhất và hướng nhân vật về hành lang gần nhất.
- `src/ui/walk/WalkHud.tsx`: tâm ngắm FPS, HUD nêu góc nhìn và thao tác chuột, nút đổi góc cho điện thoại. Esc khi đang khóa chuột không thoát đi bộ; Esc lần kế tiếp khi đã nhả thì thoát.
- `src/ui/interior/InteriorHud.tsx`: nút E lên / Q xuống tầng khi đứng trong ô thang bộ; fade tầng hiện có vẫn dùng chung. Đổi tầng bằng thang máy xóa trạng thái chuyển cầu thang.

## Kiểm tra

- `npm ci` — hoàn tất; npm báo 13 lỗ hổng dependency (2 low, 10 moderate, 1 high). Không chạy audit fix hay cài thêm gói.
- `npm run typecheck` — đạt.
- `npm run lint` — đạt, không warning.
- `npm run build` — đạt; Vite vẫn cảnh báo bundle JavaScript lớn hơn 500 kB (khoảng 1.29 MB), là cảnh báo bundle hiện hữu.
- Dev server `npm run dev -- --port 5176 --strictPort` chạy được. Mở trang bằng trình duyệt Orca, bật chế độ đi bộ và xác nhận C đổi HUD sang FPS. Kiểm tra viewport 390 × 844: cần ảo, nút đổi góc và nút thoát hiện đúng. Console không có lỗi đỏ.

## Chưa xác nhận bằng thao tác thật

- Click chuột qua Orca trên canvas không khóa pointer (`document.pointerLockElement` vẫn `null`), nên chưa xác nhận được xoay bằng chuột thật và chuỗi Esc nhả khóa rồi thoát. Không có lỗi console được ghi nhận.
- Chưa đi bộ thủ công trong B8 để xác nhận hành trình tầng 1 → thang bộ → tầng 2 → tầng 1, cũng chưa kiểm biên tầng 1/4 và giữ camera 10 giây sát bậc thang. Chưa kiểm lại luồng vào/ra và thang máy B3.
- Chưa xác nhận trực quan chiều cao robot sau scale 1.70 m; không giữ log đo trong code.

## Phạm vi và đề xuất

- Chỉ sửa các file scene/walk và HUD được brief cho phép; không sửa `src/scene/interior/**`, `layouts/b11.ts`, store, data, App/Campus; không commit/push.
- Cần kiểm tra pointer lock trên trình duyệt thật và đi thử checklist nội thất trước khi gộp.
