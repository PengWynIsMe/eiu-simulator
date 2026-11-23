# Báo cáo FIX-FP-NHAY

## Nguyên nhân và thay đổi

1. **Góc nhìn thứ nhất đảo ngang:** xử lý vuốt cảm ứng và `movementX` của Pointer Lock đều trừ delta khỏi `cameraYaw`. Do đó rê trái làm yaw tăng và camera nhìn sang phải. Đổi cả hai phép tính sang cộng delta. Vector tiến của WASD được tính từ cùng `cameraYaw`, nên hướng đi tiếp tục theo hướng nhìn. Nhánh kéo camera góc nhìn thứ ba giữ nguyên.
2. **Mặt sàn nhấp nháy:** mặt trên của sàn nội thất tầng hiện tại nằm tại `y=0`, đồng phẳng với mặt đất toàn cục (`GROUND = 0`). Vật liệu sàn nhận polygon offset qua hằng `INTERIOR_FLOOR_POLYGON_OFFSET = -1`, để ưu tiên sàn nội thất tại vùng chồng lấn. Áp dụng chung cho sàn B3, B8 và B11 trong `InteriorScene.tsx`. Các lớp đường, bãi xe, vòng xoay và lối đi trong `Ground.tsx` đã có cao độ tách riêng (chênh từ 0.15 m) và offset cho đường; không cần thay đổi.

## File đã sửa

- `src/scene/walk/WalkMode.tsx` — chiều ngang nhìn FPS bằng chuột và vuốt cảm ứng.
- `src/scene/interior/InteriorScene.tsx` — polygon offset cho sàn nội thất để xử lý trùng với mặt đất tại `y=0`.

## Kiểm tra

- `npm ci` — hoàn tất; npm báo 13 lỗ hổng dependency (2 low, 10 moderate, 1 high). Không chạy audit fix.
- `npm run typecheck` — đạt.
- `npm run lint` — đạt.
- `npm run build` — đạt; Vite build thành công.
- Đã khởi động dev server ở cổng 5176. Chưa thể thử tương tác trực tiếp trên browser: Orca/CUA không liệt kê browser hoặc tab khả dụng trong phiên này. Vì vậy chưa xác nhận thực tế rê chuột, vuốt cảm ứng, WASD, camera góc nhìn thứ ba, hay hiện tượng nhấp nháy khi bay quanh nội/ngoại thất B3/B8/B11.
- Không chụp được ảnh trước/sau vì không có browser khả dụng để tái hiện và chụp hiện tượng.

## Còn lại

Cần mở bản dev trong browser, thử Pointer Lock và mô phỏng cảm ứng; kiểm tra góc nhìn thứ ba/WASD và bay camera qua khuôn viên cùng nội thất B3/B8/B11 để xác nhận hết nhấp nháy.
