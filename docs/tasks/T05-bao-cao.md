# Báo cáo T05 — Camera bay tới tòa nhà / bay về tổng quan + dọn cảnh báo console

- Người làm: **Gemini (Antigravity)**
- Nhánh: `t05-camera-bay`
- Cổng dev: `5174`

---

## 1. File đã sửa

1. `src/scene/CameraRig.tsx`:
   - Thêm hàm `computeBuildingCameraPose(building, viewport)`:
     - Tính kích thước cạnh dài khung nền `maxDim = Math.max(sizeX, sizeZ)` và chiều cao `height`.
     - Góc nhìn: từ phía cổng chính (+X) chếch lên 35° (`cos(35°) ≈ 0.819`, `sin(35°) ≈ 0.574`).
     - Khoảng cách `distance = Math.max(maxDim * 1.25 + 15, 45)` (ki-ốt nhỏ như Highlands, Fami Pizza đạt tối thiểu 45 m, không bị zoom sát).
     - Trên desktop: dời điểm nhìn sang trái theo trục screen-right (-Z) một khoảng ~20% distance (tối đa 35 m) để tòa nhà hiển thị ở vùng trống bên trái, không bị panel bên phải (rộng 400 px) che.
     - Trên điện thoại (`viewport.width < 768`): panel ở dưới đáy màn hình (`max-h-[58vh]`) → dời điểm nhìn lên bằng cách hạ camera & target xuống trong screen space (`vShift = 0.35 * distance`), giúp tòa nhà nằm trọn ở nửa trên màn hình. Đồng thời nhân hệ số khoảng cách theo tỷ lệ màn hình dọc để tòa nhà rộng không tràn mép trái/phải.
   - Thêm hiệu ứng `useEffect` theo dõi `selectedBuildingId`:
     - Có ID tòa nhà → gọi `controls.setLookAt(px, py, pz, tx, ty, tz, true)` bay mượt tới tòa.
     - `null` (vừa bấm "Về tổng quan" / đóng panel) → bay về `OVERVIEW_CAMERA` với chuyển động mượt.
     - Lần đầu app mount: không bay (đã khởi tạo tĩnh bằng `OVERVIEW_CAMERA` trong mount effect).
     - Đang ở chế độ góp ý (`reviewMode`): không bay (bấm tòa chỉ tạo draft).
     - Đang có `cameraRequest` từ ghi chú góp ý: `cameraRequest` thắng và được ưu tiên xử lý.
2. `src/scene/kit/geometryHelpers.ts`:
   - Thêm hàm `ensureNonIndexed<T extends BufferGeometry>(geo: T): BufferGeometry`.
   - `createExtrudedPolygon`: kiểm tra `geo.index ? geo.toNonIndexed() : geo` (do `ExtrudeGeometry` trong Three.js vốn đã non-indexed, gọi thẳng `toNonIndexed()` gây cảnh báo).
   - `addBox`, `addRotatedBox`, `addCylinder`: kiểm tra `index` trước khi gọi `toNonIndexed()`.
3. `src/scene/zone2/Zone2Walkways.tsx`:
   - Kiểm tra `rawRoof.index ? rawRoof.toNonIndexed() : rawRoof` và `rawPost.index ? rawPost.toNonIndexed() : rawPost`.

> **Tuân thủ phân quyền:** KHÔNG sửa bất kỳ file nào ngoài phạm vi brief cho phép (`src/scene/CameraRig.tsx`, `src/scene/kit/**`, `src/scene/zone2/**`). Không đụng `src/scene/walk/**`, `public/models/**`, `src/scene/Campus.tsx`, `src/App.tsx`, `src/ui/**`, `src/store/**`, `src/data/**`, `src/types/**`.

---

## 2. Kết quả cổng kiểm tra

- `npm run typecheck`: **0 lỗi** (`tsc -b --noEmit` thành công sạch).
- `npm run lint`: **0 lỗi** (`eslint .` thành công sạch).
- `npm run build`: **thành công** (`vite build` hoàn tất không có lỗi).
- Console trình duyệt: **hoàn toàn sạch**, cảnh báo `THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.` đã được dọn triệt để.

---

## 3. Kết quả kiểm tra trong trình duyệt (Chrome DevTools / Test Suite)

Tất cả kịch bản đã được chạy và kiểm tra tự động trên Chrome headless (`http://localhost:5174/`):

| Kịch bản kiểm tra | Kết quả thực tế | Đánh giá |
| --- | --- | --- |
| **Cảnh báo console lúc tải trang** | 0 lỗi, 0 cảnh báo (đặc biệt không có `toNonIndexed`) | ✅ ĐẠT |
| **Khởi tạo app ban đầu** | Camera ở đúng `OVERVIEW_CAMERA` `[380, 220, -20]`, target `[40, 0, -20]`, không tự bay lung tung | ✅ ĐẠT |
| **Bấm chọn Block 3 (`b3`)** | Camera bay mượt tới `pos: [277.5, 92.7, 14]`, `tgt: [152.4, 5.1, 14]`. Tòa nhà nằm ở vùng bên trái, panel thông tin 400 px bên phải mở ra không che tòa | ✅ ĐẠT |
| **Bấm chọn Block 11 (`b11`)** | Camera bay mượt tới `pos: [204.6, 121.2, -170.8]`, `tgt: [41.3, 6.8, -170.8]`. Thấy trọn vẹn tòa nhà dài 148 m, không bị che | ✅ ĐẠT |
| **Bấm chọn Highlands Coffee** | Camera bay mượt tới `pos: [182.9, 27.5, -73]`, `tgt: [146, 1.7, -73]`. Khoảng cách = **45 m** (đạt tiêu chí tối thiểu ~40 m, không zoom quá sát) | ✅ ĐẠT |
| **Bấm "Về tổng quan"** | `clearSelection()` kích hoạt, camera bay mượt về `OVERVIEW_CAMERA` `[380, 220, -20]`, target `[40, 0, -20]`, panel đóng lại | ✅ ĐẠT |
| **Giao diện di động (390×844)** | Bấm Block 3: camera căn góc `tgtY = 0.5`, đưa tòa nhà lên nửa trên màn hình (`NDC Y > 0`), không bị bottom sheet che | ✅ ĐẠT |
| **Chế độ góp ý (`reviewMode`)** | Bấm vào tòa nhà tạo draft ghi chú, camera **đứng yên không bay** | ✅ ĐẠT |
| **Bấm ghi chú trong panel góp ý** | `cameraRequest` được kích hoạt, camera bay chính xác đến tọa độ ghi chú | ✅ ĐẠT |

---

## 4. Chưa chắc / Rủi ro

- Không có rủi ro nào về mặt logic hoặc hợp đồng: các góc nhìn đều nằm trong `boundaryBox` (`[-450, 450]`), các file sửa hoàn toàn độc lập với luồng T11 (nhân vật CC0) đang chạy song song.

---

## 5. Đề xuất

- Không cần thay đổi hợp đồng store hay thêm thư viện. Sẵn sàng để Claude review và hợp nhất vào nhánh chính.
