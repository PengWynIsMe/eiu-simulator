# Báo cáo T11 — Nhân vật đi bộ

## File đã sửa / tạo

- `src/scene/walk/WalkMode.tsx` — thay mesh capsule bằng nhân vật GLB trong `Suspense`, giữ capsule làm fallback. Giữ nguyên input, camera và va chạm; điều chỉnh góc model để lưng hướng về camera khi đi tiến.
- `src/scene/walk/PlayerCharacter.tsx` — nạp và clone model, phát `Idle` / `Walking` / `Running` bằng `useAnimations`, chuyển clip với crossfade 0.2 giây. Dùng `useGLTF.preload`; scale 0.25 bù armature 100× của asset.
- `public/models/RobotExpressive.glb` — 463,988 bytes (khoảng 454 KB).
- `public/models/CREDITS.md` — nguồn, tác giả, CC0 1.0 và ngày tải.

## Model và giấy phép

RobotExpressive của Tomás Laulhé (Quaternius), chỉnh sửa bởi Don McCurdy; CC0 1.0. Nguồn: https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/RobotExpressive. Model có các clip `Idle`, `Walking`, `Running` và nằm dưới giới hạn 3 MB. Đã chọn model robot theo phương án CC0 dự phòng trong brief; asset người của Kenney không tải được từ itch.io trong môi trường này.

## Kiểm tra

- `npm ci` — thành công; npm báo 13 advisory trong cây dependency (2 low, 10 moderate, 1 high), không chạy audit fix.
- `npm run typecheck` — thành công, 0 lỗi.
- `npm run lint` — thành công, 0 lỗi.
- `npm run build` — thành công. Vite giữ cảnh báo bundle JS lớn hơn 500 kB (hiện trạng dự án).
- `dist/models/RobotExpressive.glb` có mặt sau build; preview tại `http://localhost:4176/` trả `200 OK`, `Content-Length: 463988`, `Content-Type: model/gltf-binary` cho `/models/RobotExpressive.glb`. Đường dẫn được tạo từ `import.meta.env.BASE_URL`.
- Orca browser: mở chế độ đi bộ trên dev và preview; dispatch W và Shift+W; quan sát nhân vật di chuyển, chạy clip tương ứng và quay lưng về camera khi tiến. Đã thử viewport mobile 390×844, HUD đi bộ vẫn hiện.
- Console không có lỗi đỏ. Có warning lặp `THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.` từ cảnh có sẵn (đã được ghi nhận trong HANDOFF, nằm ngoài phạm vi T11).

Ảnh chụp kiểm tra: `/var/folders/3w/fkvndtzj06gdn46fnkr4967c0000gn/T/orca-browser-screenshots/67239112-aec6-46a3-84e8-17a19d991ca4-screenshot.png` (ảnh dev sau khi dispatch W; đường dẫn screenshot Orca có thời hạn lưu).

## Điểm chưa chắc / rủi ro

- Nhân vật là robot low-poly theo lựa chọn dự phòng CC0, nên chưa đạt hình dáng sinh viên như mục tiêu ưu tiên của T11.
- Thời lượng bước chân của asset được chỉnh cố định (Walking 0.9×, Running 1.15×); cần người dùng xem thử cảm giác khớp chân khi di chuyển trên thiết bị thật.
- Warning geometry và cảnh báo bundle lớn vẫn còn từ code/cấu hình ngoài phạm vi được giao.

## Đề xuất

Người dùng xem thử tỷ lệ và animation; nếu muốn dáng sinh viên, có thể thay bằng asset người CC0 dạng GLB có đủ idle/walk/run khi tìm được bản tải trực tiếp, không cần thêm thư viện.
