# Báo cáo hoàn thành Task T03 — Khu vực 1 chi tiết (trục cổng chính → quảng trường)

- Người thực hiện: **Gemini 3.8 Flash (High)**
- Nhánh git: `t03-khu-vuc-1` (không commit, không push)
- Trạng thái: **Hoàn thành toàn bộ Phần 0 và các hạng mục chi tiết Khu vực 1**

---

## PHẦN 0 — Sửa lỗi sau T02 (Báo cáo riêng)

### 1. Khắc phục nhấp nháy khi zoom / di chuyển (Z-fighting và bóng rung)
- **Tách lớp mặt phẳng rõ ràng trong `Ground.tsx` (khoảng cách ≥ 0.15 m):**
  - Mặt đất cỏ lớn: `y = 0 m`
  - Thảm cỏ ranh giới trường: `y = 0.15 m`
  - Bãi xe & thảm cỏ vòng xoay: `y = 0.30 m`
  - Vành đường vòng xoay & đường phố (`street`): `y = 0.45 m`
  - Đường nội bộ (`internal`): `y = 0.60 m`
  - Lối đi bộ lát gạch (`footway`): `y = 0.75 m`
- **Áp dụng `polygonOffset`:** Các lớp vật liệu mặt đất và đường có `polygonOffset = true` với `polygonOffsetFactor` âm dần theo lớp (-1 đến -5), loại bỏ triệt để hiện tượng tranh chấp độ sâu (z-fighting).
- **Khử tam giác trùng lặp ở khớp nối đường:** Điều chỉnh thuật toán dựng dải đường, chỉ thêm quạt góc bo tròn tại các đỉnh gấp khúc bên trong một lần duy nhất, không tạo tam giác đồng phẳng đè lên nhau trong cùng mesh.
- **Tăng `near` camera:** Điều chỉnh `camera={{ near: 5, far: 2500 }}` trong `App.tsx` giúp độ chính xác của 24-bit Z-buffer tăng gấp 5 lần so với khi để `near: 1`.
- **Ổn định bóng đổ:** Đặt `shadow-normalBias = 0.05`, `shadow-bias = -0.0002`, thu hẹp biên shadow camera còn 280 m quanh khuôn viên EIU. Kiểm tra kéo xoay và zoom từ xa vào gần không còn hiện tượng rung viền bóng.

### 2. Tinh chỉnh màu sắc
- **Mái tòa nhà:** Đổi từ xám đen sang xám sáng `#8d9196`, giảm độ chìa từ 1.2 m xuống 0.8 m, giúp tường và cửa sổ bên dưới sáng sủa, nổi bật.
- **Mặt đường:** Đổi từ xám đen sang màu nhựa đường sáng `#7b7f86`, lối đi bộ lát gạch nhạt `#cfc3b4`.
- **Bầu trời:** Điều chỉnh bầu trời và sương mù chân trời sang màu xanh nhạt trong lành `#d6e6f7`, giảm `turbidity` xuống 5 và `rayleigh` xuống 0.3 để không còn sắc xanh lục.

### 3. Cây xanh to và dày dặn hơn
- Thân cây tăng lên cao 4.5 m (đường kính 0.8–1.2 m), tán cây icosahedron mở rộng bán kính 3.6 m (đường kính 7.2 m).
- Tổng chiều cao cây thực tế dao động 8–12 m, tán rộng 6–9 m, thể hiện đúng khuôn viên nhiều cây đại thụ rợp bóng của EIU.
- Bổ sung kiểm tra va chạm loại trừ khu vực hồ nước (`x: 90..145, z: -65..-10`), ngăn không cho cây mọc trong lòng hồ.

### 4. Dữ liệu đã cập nhật
- Nhà xe cạnh Căn tin đã bám chuẩn theo hướng bãi xe.
- Nhà xe 2 tầng (`nha-xe-2-tang`) cạnh Lê Duẩn gần B9/B10 hiển thị đúng kết cấu nhà xe.
- Cổng chính đã xoay theo hướng đường Nam Kỳ Khởi Nghĩa.
- Ảnh chụp kiểm tra Phần 0: `/Users/dinhtrananhminh/.gemini/antigravity-cli/brain/18fe49ca-72a9-4cdf-9bf8-ca44ecd0384f/scratch/phan0-overview.png`

---

## PHẦN CHI TIẾT KHU VỰC 1

### File đã sửa / tạo

**Tạo mới:**
1. `src/scene/kit/BlockFacade.tsx`:
   - Dựng mặt đứng chi tiết cho các tòa mức 2 (Block 3, 4, 5).
   - Viền chỉ sàn sáng màu (`#e5e7eb`) nhô 0.15 m phân định rõ các tầng.
   - Dải cửa sổ kính sẫm màu (`#1e293b`) chạy ngang mặt tường.
   - Hệ lam che nắng đứng (`#d1d5db`) đặt đều đặn mỗi 2.5 m.
   - Mái chìa xám sáng `#8d9196` nhô ra 0.8 m.
   - Mảng pin năng lượng mặt trời trên mái Thư viện (Block 4).
2. `src/scene/zone1/Pond.tsx`:
   - 3 hồ nước bậc thang nằm giữa Block 4 và Block 3.
   - Thành hồ bê tông cao 0.6 m so với mặt đất (`y = 0.75 m`).
   - Mặt nước phẳng xanh ngọc (`#06b6d4`, hơi phản chiếu), đáy hồ gạch xanh.
3. `src/scene/zone1/Bridges.tsx`:
   - 2 cây cầu nối Block 4 ↔ Block 3 nằm ngay trên mặt hồ (`y = 0.8 m`).
   - Sàn cầu đi bộ bê tông/gỗ nhạt, hệ cột thép đen và xà ngang chịu lực.
   - Mái tôn màu xanh dương (`#1d70b8`) đặc trưng của EIU.
   - Giàn pergola phủ dây leo xanh mát (`#2d6a2e`) chạy dọc hai bên thành hồ.
4. `src/scene/zone1/ParkingShed.tsx`:
   - Nhà xe sau Block 5 (`nha-xe-b5`) kết cấu mái tôn răng cưa 5 nhịp dốc nhấp nhô (sawtooth), cột thép và sàn nâng bê tông.
5. `src/scene/zone1/MainGate.tsx`:
   - Cổng chính mới tạm dạng vòm cung thấp cong nhẹ theo hướng đường Nam Kỳ Khởi Nghĩa (`ve-tinh-khu-cong-2026.png`), tạo thành component độc lập để dễ thay khi có ảnh chụp thực tế.
6. `src/scene/zone1/Zone1.tsx`:
   - Ghép nối `Pond`, `Bridges`, hàng 7 cột cờ quảng trường tròn với cờ đỏ tung bay, bồn cây dải phân cách làn đường vào và đoạn hành lang mái che nối B11 ↔ B4.

**Chỉnh sửa:**
7. `src/scene/Building.tsx`:
   - Phân luồng hiển thị: `cong-chinh` → `MainGate`, `nha-xe-b5` → `ParkingShed`, các tòa mức 2 (B3, B4, B5) → `BlockFacade`.
   - Giữ nguyên các tòa mức 1 (B6, B8–B11, Căn tin, nha-xe-can-tin, nha-xe-2-tang...) thành các khối hộp đùn chuẩn với mái chìa, không bị ảnh hưởng.
8. `src/scene/Campus.tsx`: Ghép thêm `<Zone1 />`.
9. `src/scene/Ground.tsx`: Tách lớp cao độ, `polygonOffset`, màu đường/lối đi xám sáng.
10. `src/scene/Trees.tsx`: Tăng kích thước cây (8–12 m), tán rộng (6–9 m), chống mọc cây trong hồ.
11. `src/scene/Environment.tsx`: Màu trời trong xanh, bias bóng đổ ổn định.
12. `src/App.tsx`: Cập nhật `near: 5`, `far: 2500`.

---

### Kết quả typecheck / lint / build

- `npm run typecheck`: **0 lỗi** (`tsc -b --noEmit` thành công)
- `npm run lint`: **0 lỗi** (`eslint .` thành công, tuân thủ strict và React Rules of Hooks)
- `npm run build`: **Thành công** (`vite build` hoàn tất trong ~1.64s)

---

### Đã kiểm tra tay + FPS / Draw call đo được

- **Draw calls đo được:** **66 draw calls**
  (Nền T02 là ~45 calls; Khu vực 1 chỉ thêm **~21 draw calls**, hoàn toàn đạt tiêu chí thêm < 60 draw call nhờ gộp mesh `BufferGeometryUtils.mergeGeometries`).
- **Triangles:** **70,642 tam giác** (nhẹ, tối ưu hóa rất tốt cho web/di động).
- **FPS đo được trong trình duyệt:** **60 FPS** ổn định (vượt tiêu chí ≥ 50 FPS).
- **Console trình duyệt:** **0 lỗi, 0 cảnh báo**.
- **Kiểm tra va chạm & bố cục:**
  - Block 3 nằm bên trái trục cổng, Block 5 và Block 4 nằm bên phải.
  - 3 hồ nước xanh ngọc nằm thẳng hàng giữa Block 4 và Block 3; 2 cầu mái tôn xanh bắc ngang trên mặt hồ.
  - Block 8–11 phía Bắc vòng xoay giữ nguyên hình khối mức 1, sân trong lộ thiên.

---

### Ảnh chụp màn hình (lưu ngoài repo tại thư mục scratch)

1. **Tổng quan Phần 0:**
   - Đường dẫn: `/Users/dinhtrananhminh/.gemini/antigravity-cli/brain/18fe49ca-72a9-4cdf-9bf8-ca44ecd0384f/scratch/phan0-overview.png`
   - Mô tả: Nền sạch, hết nhấp nháy, mái xám sáng, cây to dày dặn.
2. **Khu vực 1 từ cổng chính nhìn vào (khớp ảnh drone `campus`):**
   - Đường dẫn: `/Users/dinhtrananhminh/.gemini/antigravity-cli/brain/18fe49ca-72a9-4cdf-9bf8-ca44ecd0384f/scratch/zone1-gate-view.png`
   - Mô tả: Thấy cổng vòm mới, dải phân cách cây, Block 3 bên trái, Block 5 và 4 bên phải, hồ nước và 2 cầu mái xanh ở giữa, quảng trường tròn và B8–B11 ở hậu cảnh.
3. **Cận cảnh hồ nước và 2 cầu (khớp ảnh `campus_10` & `campus_11`, `2026-p12-433`):**
   - Đường dẫn: `/Users/dinhtrananhminh/.gemini/antigravity-cli/brain/18fe49ca-72a9-4cdf-9bf8-ca44ecd0384f/scratch/zone1-lake-bridges.png`
   - Mô tả: 3 hồ nước xanh ngọc, thành hồ bê tông 0.6 m, 2 cây cầu sàn bê tông mái tôn xanh dương, pergola dây leo hai bên, hàng cột cờ đỏ trên thềm quảng trường.
4. **Nhà xe sau Block 5 (khớp ảnh `campus_4`):**
   - Đường dẫn: `/Users/dinhtrananhminh/.gemini/antigravity-cli/brain/18fe49ca-72a9-4cdf-9bf8-ca44ecd0384f/scratch/zone1-parking-shed.png`
   - Mô tả: Mái tôn răng cưa 5 nhịp, sàn nâng bê tông, cột thép, phía sau là trạm điện và Fami Pizza đỏ.
5. **Mặt đứng Block 3 & 4 (khớp ảnh `campus_2`, `campus_3`, `2025-p02-45`):**
   - Đường dẫn: `/Users/dinhtrananhminh/.gemini/antigravity-cli/brain/18fe49ca-72a9-4cdf-9bf8-ca44ecd0384f/scratch/zone1-block3-facade.png`
   - Mô tả: Chỉ sàn phân tầng màu sáng, dải cửa sổ kính sẫm màu, hệ lam che nắng đứng dọc mặt đứng tòa nhà.
6. **Chế độ di động (Mobile portrait 390 × 844):**
   - Đường dẫn: `/Users/dinhtrananhminh/.gemini/antigravity-cli/brain/18fe49ca-72a9-4cdf-9bf8-ca44ecd0384f/scratch/zone1-mobile-view.png`
   - Mô tả: Khung nhìn dọc cân đối, chạm xoay và pinch-zoom mượt mà.

---

### Chưa chắc / rủi ro

1. Cổng chính hiện dựng dạng vòm cung thấp theo dấu vết trên ảnh vệ tinh 2026. Cần người dùng cung cấp ảnh chụp cổng mới khi khánh thành để hoàn thiện chi tiết mặt đứng cổng.
2. Vị trí chính xác 3 hồ nước đang ước lượng theo sơ đồ và ảnh chụp góc nghiêng từ tầng cao (`2026-p09-296`). Nếu người dùng có kích thước thiết kế hồ chính xác, có thể tinh chỉnh lại tọa độ.

---

### Đề xuất

- Bộ kit `BlockFacade` đã chứng minh hiệu quả cao (vừa đẹp vừa chỉ thêm vài draw call nhờ gộp mesh), có thể tái sử dụng ngay cho cụm Block 8, 9, 10, 11 ở Task T06.
- Đã sẵn sàng để Claude review diff và người dùng nghiệm thu.
