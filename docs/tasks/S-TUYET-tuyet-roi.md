# S-TUYET — Hiệu ứng "Tuyết rơi ở EIU" & Cảnh mở đầu điện ảnh

- Người làm: Antigravity (Gemini 3.8 Flash)
- Nhánh: `PengWynIsMe/tuyet-roi-eiu`
- Phụ thuộc: Giai đoạn 2 đã gộp (W0, S1-S9, T19, L346)

## 1. Mục tiêu

Tạo một "cú hích" truyền thông trực quan cho EIU: khung cảnh khuôn viên EIU phủ tuyết trắng trong mùa đông kỳ diệu, hiệu ứng tuyết rơi bay nhẹ theo gió bằng GPU mượt mà (≥30 FPS trên mobile, ~60 FPS trên desktop), kèm cảnh mở đầu điện ảnh (cinematic fly-through) bay qua cổng chính vào quảng trường tuyết trắng, có hỗ trợ song ngữ (Việt - Anh) và chia sẻ qua liên kết `?snow=1`.

## 2. Phạm vi & Yêu cầu kỹ thuật

1. **Hiệu ứng tuyết rơi (GPU Points + Shader):**
   - Hạt tuyết rơi và lắc lư nhẹ theo gió (`sin`/`cos` + `windTime`).
   - Tọa độ wrapping theo hình hộp bám theo vị trí camera (không sinh khắp toàn bộ bản đồ 2 km để tiết kiệm tài nguyên).
   - Tự động giảm số lượng hạt trên thiết bị di động (mobile ~1,800 hạt; desktop ~5,000 hạt).
   - 100% Three.js nguyên bản, không cài thêm bất kỳ thư viện npm nào.

2. **Cảm giác "phủ tuyết" tối ưu chi phí (Low-cost Winter Aesthetics):**
   - Bầu trời chuyển tông xanh xám lạnh mùa đông, sương mù mờ ảo ôm lấy khuôn viên trường.
   - Ánh sáng chuyển sang tông mát lạnh dịu nhẹ.
   - Mặt cỏ trường EIU và mặt đất xung quanh chuyển sang màu tuyết phủ trắng ngả lạnh.
   - Các mái chìa và nóc tòa nhà chuyển sang sắc trắng tuyết tích tụ.
   - Cây cối ngả màu tuyết sương giá.
   - Khi tắt chế độ tuyết, cảnh quan phục hồi 100% nguyên trạng ban đầu.

3. **Cảnh mở đầu kiểu điện ảnh (Cinematic Intro):**
   - Camera bay lướt chậm rãi, êm ái từ ngoài cổng chính (+X), lướt qua vòm cổng hướng vào quảng trường tròn trung tâm.
   - Giao diện overlay tối giản phong cách điện ảnh:
     - Tựa đề: "Tuyết rơi ở EIU" / "Snow at EIU".
     - Phụ đề giới thiệu khuôn viên mùa đông.
     - Nút "Vào tham quan" / "Explore Campus" và nút "Bỏ qua" / "Skip".
   - Sau khi kết thúc hoặc khi người dùng bấm vào tham quan / bỏ qua, camera chuyển mượt mà về góc nhìn tổng quan `OVERVIEW_CAMERA`, mở khóa các tương tác bình thường.

4. **Song ngữ & Hộp văn bản riêng (`src/ui/snowText.ts`):**
   - Hỗ trợ tiếng Việt (mặc định) và tiếng Anh.
   - Lưu trữ trong `src/ui/snowText.ts` theo cấu trúc `{ vi, en }`.
   - Tuyệt đối không sửa đổi `src/ui/text.ts` (để tránh xung đột với luồng đa ngôn ngữ chung của nhóm).

5. **Bật/Tắt & Liên kết chia sẻ (`?snow=1`):**
   - Nút bật/tắt tuyết trên `TopBar` (kèm nút đổi ngôn ngữ nhanh VI/EN).
   - Kiểm tra `window.location.search`: nếu có `?snow=1` thì tự động kích hoạt chế độ tuyết và chiếu cảnh mở đầu.
   - Nút sao chép liên kết chia sẻ cảnh tuyết để lan tỏa trên mạng xã hội.

6. **Không ảnh hưởng các luồng khác:**
   - Không đụng dữ liệu ngành `src/data/majors` hay panel ngành.
   - Không sửa file thuộc nhánh khác.

## 3. Được sửa / tạo mới

- Tạo mới:
  - `src/store/useSnowStore.ts`
  - `src/scene/snow/SnowParticles.tsx`
  - `src/scene/snow/SnowCinematicCamera.tsx`
  - `src/ui/snowText.ts`
  - `src/ui/snow/SnowIntroOverlay.tsx`
- Sửa đổi:
  - `src/App.tsx` (gắn overlay intro và khởi tạo param `?snow=1`)
  - `src/scene/Campus.tsx` (gắn hiệu ứng tuyết và camera intro)
  - `src/scene/Environment.tsx` (chuyển tông màu bầu trời/sương mù/ánh sáng khi có tuyết)
  - `src/scene/Ground.tsx` (mặt đất/mặt cỏ phủ tuyết)
  - `src/scene/Building.tsx` (mái nhà phủ tuyết)
  - `src/scene/Trees.tsx` (cây lá sương tuyết)
  - `src/ui/TopBar.tsx` (thêm nút Tuyết & nút chuyển ngôn ngữ tuyết)

## 4. KHÔNG được sửa

- `src/data/majors/**`, `src/ui/MajorPanel.tsx`
- `src/ui/text.ts`
- `src/data/building-details.json`
- `package.json`, cấu hình build

## 5. Tiêu chí hoàn thành (Checklist)

- [ ] `npm run typecheck` 0 lỗi.
- [ ] `npm run lint` 0 lỗi.
- [ ] `npm run build` thành công, bundle không tăng bất thường.
- [ ] Kiểm tra trên trình duyệt:
  - URL `?snow=1` mở thẳng vào cảnh cinematic intro, hạt tuyết bay mượt mà.
  - Nút "Vào tham quan" / "Bỏ qua" đưa về chế độ tương tác thông thường mượt mà.
  - Bật/tắt nút Tuyết trên TopBar chuyển đổi cảnh hè/tuyết trơn tru không lỗi.
  - Chuyển đổi ngôn ngữ VI ↔ EN hoạt động chính xác.
  - Đo FPS đạt chuẩn: desktop ~60 FPS, mobile ≥ 30 FPS.
  - Chụp ảnh màn hình lưu vào `docs/tasks/S-TUYET-anh/`.
- [ ] Viết báo cáo chi tiết vào `docs/tasks/S-TUYET-bao-cao.md`.
