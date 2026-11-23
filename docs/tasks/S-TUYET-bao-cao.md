# Báo cáo hoàn thành Task S-TUYET — Hiệu ứng "Tuyết rơi ở EIU" & Cảnh mở đầu điện ảnh

- **Người thực hiện:** Antigravity (Gemini 3.8 Flash)
- **Nhánh:** `PengWynIsMe/tuyet-roi-eiu`
- **Ngày hoàn thành:** 23/11/2026
- **Trạng thái:** Hoàn tất đầy đủ, cổng kiểm tra 0 lỗi, commit trên nhánh cục bộ, KHÔNG push, KHÔNG mở PR, KHÔNG merge.

---

## 1. File đã sửa / tạo mới

### A. File tạo mới:
1. `src/store/useSnowStore.ts`:
   - Zustand store quản lý trạng thái tuyết rơi (`isSnowing`), cảnh mở đầu điện ảnh (`isCinematicActive`), ngôn ngữ giao diện (`lang`: `'vi'` | `'en'`).
   - Tự động phát hiện query parameter `?snow=1` (hoặc `?snow=true`) từ URL khi nạp trang để bật thẳng cảnh tuyết.
   - Hỗ trợ đổi ngôn ngữ nhanh `toggleLang` và đồng bộ URL `?lang=en`.
2. `src/ui/snowText.ts`:
   - Từ điển song ngữ `{ vi, en }` riêng biệt cho task tuyết, độc lập 100% với `src/ui/text.ts` (không gây xung đột với luồng đa ngôn ngữ chung của nhóm).
3. `src/scene/snow/SnowParticles.tsx`:
   - Hiệu ứng tuyết rơi toàn khuôn viên bằng Three.js `Points` + GPU Vertex/Fragment Shaders.
   - Wrapping hạt tuyết trong hộp bám theo vị trí camera (`160m × 65m × 160m`), không render thừa ngoài tầm nhìn.
   - Tự động tối ưu số lượng hạt theo nền tảng: desktop ~4,800 hạt, mobile ~1,800 hạt.
   - Hạt đung đưa nhẹ theo gió ngang và nhiễu loạn tự nhiên, kích thước co giãn theo khoảng cách, làm mờ êm dịu gần kính camera.
4. `src/scene/snow/SnowCinematicCamera.tsx`:
   - Camera bay lướt mở đầu điện ảnh dài 14s dùng đường cong spline 3D (`CatmullRomCurve3`).
   - Lộ trình: từ ngoài cổng chính (đường Nam Kỳ Khởi Nghĩa) -> lướt qua vòm Cổng chính -> bay dọc đại lộ trung tâm qua hồ nước -> vút lên cao nhìn toàn cảnh quảng trường tròn và các khối nhà B3-B11.
   - Hỗ trợ phím Escape / Space / Enter để bỏ qua; khi kết thúc hoặc bấm "Vào tham quan", camera chuyển mượt mà về `OVERVIEW_CAMERA`.
5. `src/ui/snow/SnowIntroOverlay.tsx`:
   - Giao diện mở đầu phong cách điện ảnh (cinematic overlay): vignette viền tối nghệ thuật, thẻ kính mờ tuyết trắng, tiêu đề song ngữ, nút "Vào tham quan", nút "Bỏ qua", nút đổi ngôn ngữ VI/EN, và nút "Chia sẻ cảnh tuyết" (tự chép link `?snow=1` vào clipboard).
6. `docs/tasks/S-TUYET-tuyet-roi.md`: Brief kỹ thuật của task.
7. `docs/tasks/S-TUYET-anh/`: Bộ 7 ảnh chụp màn hình kiểm thử thực tế.

### B. File đã chỉnh sửa:
1. `src/App.tsx`:
   - Tích hợp `<SnowIntroOverlay />`.
   - Ẩn các HUD thường khi đang xem cảnh mở đầu điện ảnh (`isCinematicActive`), tạo trải nghiệm liền mạch không vướng víu.
2. `src/scene/Campus.tsx`:
   - Gắn `<SnowParticles />` và `<SnowCinematicCamera />`.
3. `src/scene/Environment.tsx`:
   - Chuyển tông lạnh mùa đông khi `isSnowing`: bầu trời xanh xám băng giá (`#cbd8e6`), sương mù mùa đông bao phủ khuôn viên (`#cbd8e6`, near: 140m, far: 750m), ánh sáng xiên góc thấp và dịu mát (`#f8fafc`).
4. `src/scene/Ground.tsx`:
   - Mặt cỏ bên trong khuôn viên trường phủ tuyết trắng tinh khôi (`#edf4fa`), bãi cỏ vòng xoay (`#edf2f7`), đồng cỏ bên ngoài (`#dce5ee`), bó vỉa hè đọng tuyết (`#dbe0e6`).
5. `src/scene/nature/Grass.tsx`:
   - Khi tuyết rơi: ẩn các ngọn cỏ nhỏ vì đã bị lớp tuyết dày vùi lấp. Giúp tiết kiệm ngay 40,000 instanced vertices, tối ưu cực lớn cho điện thoại.
6. `src/scene/nature/FallingLeaves.tsx`:
   - Tự động ẩn lá rơi mùa thu khi mùa đông tuyết rơi kích hoạt.
7. `src/scene/Building.tsx`:
   - Mái che các tòa nhà mức 1 và nhà xe phủ tuyết trắng (`#f8fafc`, `#eef2f6`).
8. `src/scene/kit/BlockFacade.tsx`:
   - Nóc mái Block 3/4/5/6 và các đường chỉ sàn phân tầng chuyển sang màu trắng tuyết (`#f8fafc`, `#f1f5f9`).
9. `src/scene/kit/TwinWingBlock.tsx`:
   - Nóc mái các khối B8, B9, B10, B11 phủ tuyết trắng (`#f8fafc`), bồn cây sân trong phủ sương tuyết (`#8da592`).
10. `src/scene/zone1/Pond.tsx`:
    - Mặt nước hồ chuyển sang mặt hồ đóng băng mùa đông màu lam băng giá (`#93c5fd`), thành hồ bê tông phủ tuyết (`#e2e8f0`).
11. `src/scene/Trees.tsx`:
    - Tán cây xanh quanh trường tự động hòa sắc ngả sương giá/tuyết (`#e2eef8`, 55% lerp) qua instanced color, không tốn thêm bất kỳ draw call nào.
12. `src/scene/CameraRig.tsx`:
    - Cho phép góc quay ngang tầm mắt (`maxPolarAngle: 1.52` và `minDistance: 5`) khi chạy cinematic intro.
13. `src/ui/TopBar.tsx`:
    - Thêm nút bật/tắt tuyết `[❄️ Tuyết rơi]` / `[❄️ Tắt tuyết]`.
    - Khi ở chế độ tuyết: hiển thị thêm nút `[🎬 Xem lại cảnh tuyết]` và nút chuyển ngôn ngữ nhanh `[🌐 English]` / `[🌐 Tiếng Việt]`.

---

## 2. Kết quả kiểm tra cổng bắt buộc (Gate Checks)

| Cổng kiểm tra | Lệnh | Kết quả |
| --- | --- | --- |
| TypeScript strict | `npm run typecheck` | **0 lỗi (PASSED)** |
| ESLint | `npm run lint` | **0 lỗi (PASSED)** |
| Production Build | `npm run build` | **Thành công (PASSED)**, bundle không vượt ngưỡng |

---

## 3. Đo đạc hiệu năng FPS thực nghiệm

Đo đạc thực tế qua Chrome Headless kết nối CDP trên bản Vite production preview:

| Chế độ đo | Viewport | Draw Calls | Thời gian 1 khung hình (avgMs) | FPS đo được | Đánh giá |
| --- | --- | --- | --- | --- | --- |
| **Desktop (Tuyết rơi)** | 1280 × 720 (DPR 1) | ~145 | **4.40 ms** | **~60 FPS** (giới hạn màn hình; không giới hạn đạt 227 FPS) | Cực mượt, vượt xa kỳ vọng |
| **Mobile (Tuyết rơi)** | 390 × 844 (DPR 2) | ~140 | **2.99 ms** | **~60 FPS** (vượt xa mức sàn ≥30 FPS) | Mượt mà trên điện thoại |

*Lý do hiệu năng rất cao:*
- Toàn bộ hạt tuyết xử lý 100% trên GPU vertex shader (chỉ 1 draw call duy nhất).
- Khi có tuyết, hệ thống tự ẩn cỏ 40,000 ngọn và lá mùa thu, bù trừ hoàn toàn chi phí hạt tuyết.
- Mái tuyết và màu cỏ được đổi trực tiếp qua thuộc tính vật liệu sẵn có, không sinh thêm bất kỳ hình học phụ nào.

---

## 4. Danh mục ảnh chụp màn hình (`docs/tasks/S-TUYET-anh/`)

1. `01-cinematic-cong-chinh.png`: Cảnh mở đầu từ ngoài Cổng chính (đường Nam Kỳ Khởi Nghĩa).
2. `02-cinematic-fly-through.png`: Camera lướt qua vòm Cổng chính vào đại lộ tuyết.
3. `03-cinematic-roundabout.png`: Góc máy trên cao hướng về quảng trường tuyết và các khối nhà.
4. `04-cinematic-mobile.png`: Giao diện mở đầu trên điện thoại di động (iPhone).
5. `05-overview-snow.png`: Toàn cảnh khuôn viên EIU phủ tuyết sau khi vào tham quan.
6. `06-overview-snow-en.png`: Giao diện tiếng Anh ("Snow at EIU" / "Stop snow").
7. `07-overview-summer.png`: Cảnh hè thông thường sau khi tắt tuyết (hoàn nguyên 100%).

---

## 5. Đề xuất về mặc định bật hay tắt tuyết

- **Đề xuất: Mặc định TẮT khi vào link gốc (`/`), nhưng BẬT khi có `?snow=1`.**
- **Lý do:**
  1. Giữ nguyên trải nghiệm khám phá học thuật và các buổi học tiêu chuẩn của trường EIU khi người dùng vào trang chủ.
  2. Dành riêng liên kết truyền thông `https://.../?snow=1` cho các chiến dịch marketing, mạng xã hội (Facebook, TikTok, Zalo) vào mùa giáng sinh/năm mới để người xem bấm vào là thấy ngay cảnh tuyết rơi và video mở đầu điện ảnh.
  3. Người dùng trên trang chủ vẫn có thể bấm nút `[❄️ Tuyết rơi]` trên TopBar bất kỳ lúc nào để ngắm cảnh tuyết.

---

## 6. Việc còn dở hoặc cần chủ dự án quyết định

1. **Hiệu ứng âm thanh mùa đông (Tùy chọn):** Hiện tại chưa gắn tiếng gió tuyết mùa đông (có thể tích hợp sound effect gió mùa đông nhẹ nếu chủ dự án muốn).
2. **Gộp chuỗi ngôn ngữ:** Task này tuân thủ nguyên tắc không sửa `src/ui/text.ts` mà để riêng trong `src/ui/snowText.ts`. Khi luồng i18n chung của nhóm hoàn tất, có thể gộp file này vào hệ thống ngôn ngữ chung.
