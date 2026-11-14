# Báo cáo T14 — Nhân vật đi đúng độ cao mặt đất

## Đã làm

- Tạo `src/scene/groundLevels.ts` với cao độ các lớp mặt đất và độ rộng đường.
- Cập nhật `src/scene/Ground.tsx` để dùng các hằng số thay cho số cao độ/độ rộng viết tay; hình học, màu và thứ tự render được giữ nguyên.
- Tạo `src/scene/walk/groundHeight.ts` với `getGroundHeight(x, z)` và `dampHeight(current, target, dt)`. Hàm kiểm tra cầu, hồ, đường, vòng xoay, bãi xe và ranh giới; không tạo array/object trong mỗi lần gọi.
- Không sửa các file thuộc luồng T13.

## Điểm mẫu

Đã gọi trực tiếp `getGroundHeight` qua Vite SSR loader. Cao độ đối chiếu theo lớp mặt phủ tương ứng:

| Điểm (x, z) m | Cao độ | Lớp |
| --- | ---: | --- |
| (270, -22) | 0.60 m | Đường nội bộ, đoạn đường vào cổng |
| (270, -28) | 0.15 m | Cỏ trong ranh giới |
| (0, 0) | 0.30 m | Cỏ vòng xoay |
| (250, 0) | 0.60 m | Đường nội bộ |
| (124, -17) | 0.75 m | Hồ / thành hồ |
| (112, -15) | 0.80 m | Cầu |
| (140, -10) | 0.75 m | Hồ / thành hồ |
| (170, -140) | 0.30 m | Bãi đỗ xe |
| (400, 400) | 0.00 m | Ngoài ranh giới |
| (100, -150) | 0.15 m | Cỏ trong ranh giới |
| (30, -210) | 0.15 m | Cỏ trong ranh giới |
| (-200, 0) | 0.15 m | Cỏ trong ranh giới |

## Kiểm tra

- `npm ci`: hoàn tất. npm báo 13 advisory (2 low, 10 moderate, 1 high); không chạy audit fix hay thay dependency.
- `npm run typecheck`: đạt.
- `npm run lint`: đạt.
- `npm run build`: đạt. Vite còn cảnh báo bundle JS khoảng 1.25 MB, phù hợp ghi chú tối ưu T07 trong HANDOFF.
- Dev server: `npm run dev -- --port 5176 --strictPort` chạy tại `http://localhost:5176/`.
- Đã mở trang qua Orca browser; trang CampusSim hiển thị, console không có lỗi.
- Ảnh mặt đất sau đổi hằng số giữ cùng hình học và màu: chỉ các số tương ứng trong JSX được thay bằng hằng số cùng giá trị.

## Điểm cần lưu ý

- Tâm cỏ vòng xoay trả 0.30 m theo `Ground.tsx` (dù brief phần ví dụ mô tả khoảng 0.3 m).
- T14 chỉ cung cấp hàm dùng khi Claude nối vào `WalkMode.tsx`; không chỉnh file đang do T13 sửa.
- Không commit/push.
