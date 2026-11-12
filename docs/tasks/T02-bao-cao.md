# Báo cáo hoàn thành Task T02 — Nền chung của khuôn viên

- Người thực hiện: **Gemini 3.8 Flash (High)**
- Nhánh git: `t02-nen-chung` (không commit, không push)
- Trạng thái: **Hoàn thành toàn bộ tiêu chí brief T02**

---

### File đã sửa / tạo

**Tạo mới:**
1. `src/scene/Environment.tsx`: Hệ thống chiếu sáng nhiệt đới (`hemisphereLight` + `directionalLight` đổ bóng với shadow map 2048, bias mịn), bầu trời `<Sky>` dịu nhẹ và `<fog>` chuyển tiếp đường chân trời. Có hằng số `SHADOWS_ENABLED = true` để bật/tắt bóng tức thì.
2. `src/scene/Ground.tsx`:
   - Mặt đất cỏ lớn rộng 2400 m hòa vào sương mù chân trời.
   - Thảm cỏ trường học bên trong `layout.boundary` tông xanh tươi hơn.
   - Các tuyến đường dạng dải có bề rộng (`street` = 7 m × số làn mặc định 2 làn, `internal` = 7 m, `footway` = 2.5 m lát gạch), khớp nối tròn 8 cạnh tại các góc rẽ giúp mặt đường liền khối, không hở góc. Cắt tỉa đường ngoài bán kính 600 m tính từ tâm vòng xoay.
   - Vòng xoay trung tâm: vành đường 9 m quanh bán kính 79.7 m và bãi cỏ tròn trung tâm.
   - Bãi đỗ xe trải nhựa phẳng (`layout.parking`).
3. `src/scene/Building.tsx`:
   - Dựng khối 3D đùn từ khung nền OSM và `campus.json`, hỗ trợ đa giác có lỗ sân trong (B8–B11) với `flatShading`.
   - **Mái chìa**: Tấm mỏng 0.4 m màu xám đậm nhô ra 1.2 m quanh viền tường (thuật toán mở rộng đa giác đều theo pháp tuyến phân giác góc), giữ nguyên lỗ sân trong cho B8–B11.
   - Khối phụ / ki-ốt (`kiosk`, `other` như Highlands, Fami Pizza, Trạm điện, Hành lang B3–B6): khối thấp đơn giản, không mái chìa.
   - Cổng (`gate` Cổng chính, Cổng phụ): khối thấp tạm cao 4.2 m.
   - Nhà giữ xe (`parking` như Nhà xe sau B5, Nhà xe Căn tin): mô hình mái tôn phẳng mỏng đặt trên hệ cột kim loại chịu lực quanh chu vi, không tường bao.
4. `src/scene/Trees.tsx`: Cây xanh low-poly (thân trụ + tán icosahedron) dựng hoàn toàn bằng **InstancedMesh** (chính xác 1 draw call cho thân, 1 draw call cho tán cây). Vị trí sinh một lần bằng PRNG hạt giống cố định (`Mulberry32`), rải ~420 cây dọc hai bên đường nội bộ, quanh vòng xoay và viền ranh giới. Tự động kiểm tra va chạm tránh đè lên tòa nhà, đường đi, vòng xoay và bãi xe.
5. `src/scene/CameraRig.tsx`: Điều khiển camera với `<CameraControls makeDefault>`, xuất hằng số `OVERVIEW_CAMERA` (nhìn từ phía cổng chính +X vào quảng trường ở độ cao 220 m). Giới hạn `minDistance={30}`, `maxDistance={700}`, `maxPolarAngle={1.35}` (chống chui xuống đất) và đặt hộp ranh giới `setBoundary` trong phạm vi khuôn viên.

**Chỉnh sửa:**
6. `src/scene/Campus.tsx`: Viết lại gọn gàng, đóng vai trò ghép nối `<Environment/> <Ground/> <Trees/> {buildings.map → <BuildingView/>} <CameraRig/>`.
7. `src/App.tsx`: Kích hoạt `shadows` trên `<Canvas>`, thiết lập camera ban đầu đồng bộ với `OVERVIEW_CAMERA`.
8. `src/ui/text.ts`: Bỏ chuỗi `previewBadge`.
9. `src/ui/TopBar.tsx`: Gỡ bỏ nhãn "Bản xem bố cục tạm", giữ nguyên tiêu đề "Khám phá EIU" và dòng ghi công bản quyền OSM.

---

### Kết quả typecheck / lint / build

- `npm run typecheck`: **0 lỗi** (`tsc -b --noEmit` thành công)
- `npm run lint`: **0 lỗi** (`eslint .` thành công, TypeScript strict, không `any`, không `!`, không `@ts-ignore`)
- `npm run build`: **Thành công** (`vite build` hoàn tất trong ~1.7s)

---

### Đã kiểm tra tay (trong trình duyệt Chrome qua CDP tự động và thủ công)

1. **Console trình duyệt:** Đã kiểm tra qua Chrome DevTools Protocol, **0 lỗi đỏ (0 errors), 0 cảnh báo (0 warnings)**.
2. **Khớp ảnh tham chiếu:**
   - Đối chiếu ảnh vệ tinh `references/00-tong-quan/ve-tinh-core.png`:
     - Trục đường chính từ cổng chính (+X, đường Nam Kỳ Khởi Nghĩa) hướng thẳng vào vòng xoay trung tâm.
     - Block 3 (chữ L) nằm ở phía Nam (bên trái trục cổng), nối với Block 6 bằng hành lang mái che.
     - Block 5 (Hành chính) và Block 4 (Thư viện) nằm ở phía Bắc (bên phải trục cổng).
     - Khoảng trống hồ nước giữa Block 3 và Block 4 sẵn sàng cho T03 dựng cầu và hồ nước. Ki-ốt Highlands màu đỏ ở góc Thư viện phía hồ.
     - Phía sau Block 5 là nhà xe, trạm điện và Fami Pizza màu cam đỏ.
     - Phía Bắc vòng xoay là cụm Block 8, 9, 10, 11 đối xứng chữ H với các sân trong lộ thiên đúng khung nền OSM.
     - Nhà xe dài cạnh Căn tin kéo dài ra gần cổng phụ.
3. **Thao tác Desktop:**
   - Kéo chuột trái xoay góc nhìn mượt mà.
   - Cuộn chuột zoom gần/xa trong khoảng cách an toàn (min 30 m, max 700 m).
   - Góc ngẩng bị chặn ở `maxPolarAngle = 1.35`, không thể nhìn xuyên xuống lòng đất.
   - Bounding box giới hạn chuyển động không cho người dùng trôi dạt ra ngoài không gian vô tận.
4. **Thao tác Mobile:**
   - Thử nghiệm trên viewport 390 × 844 (iPhone 14) với touch emulation.
   - Chạm 1 ngón kéo xoay, pinch zoom 2 ngón hoạt động nhạy và mượt mà.
   - Giao diện 2D góc trên và chân trang co giãn responsive.
5. **Instancing:**
   - Thân cây và tán cây dùng 2 mesh `InstancedMesh` duy nhất với ma trận biến đổi vị trí/xoay/tỉ lệ và phân bổ 5 tông màu xanh lá tự nhiên.

---

### Ảnh chụp màn hình (đường dẫn lưu ngoài repo)

Các ảnh chụp màn hình được lưu trong thư mục scratch ngoài repo:
- Toàn cảnh Desktop từ cổng chính nhìn vào:
  `/Users/dinhtrananhminh/.gemini/antigravity-cli/brain/18fe49ca-72a9-4cdf-9bf8-ca44ecd0384f/scratch/desktop-overview.png`
- Sau khi xoay camera quan sát góc khác trên Desktop:
  `/Users/dinhtrananhminh/.gemini/antigravity-cli/brain/18fe49ca-72a9-4cdf-9bf8-ca44ecd0384f/scratch/desktop-rotated.png`
- Giao diện chế độ di động (Mobile portrait):
  `/Users/dinhtrananhminh/.gemini/antigravity-cli/brain/18fe49ca-72a9-4cdf-9bf8-ca44ecd0384f/scratch/mobile-overview.png`
- Thao tác chạm xoay góc nhìn trên Mobile:
  `/Users/dinhtrananhminh/.gemini/antigravity-cli/brain/18fe49ca-72a9-4cdf-9bf8-ca44ecd0384f/scratch/mobile-interacted.png`

---

### Chưa chắc / rủi ro

1. Số tầng của Block 6 hiện trong `campus.json` tạm để 2 tầng (chờ người dùng xác nhận lại như ghi trong `HANDOFF.md`).
2. Đường nối hành lang Block 11 ↔ Block 4 và Block 11 ↔ Block 10 (theo ảnh chụp 360 tour `campus_16..20`) sẽ được dựng chi tiết trong Task T03.
3. Chi tiết cổng chính (cổng vòm mới) và cổng phụ hiện đang là khối hình học tạm để giữ chỗ.

---

### Đề xuất (nếu cần đổi hợp đồng hoặc thêm thư viện)

- **Không cần thêm thư viện nào mới.** Toàn bộ thư viện hiện có (`three`, `@react-three/fiber`, `@react-three/drei`, `three/examples/jsm/utils/BufferGeometryUtils.js`) đáp ứng trọn vẹn và đạt hiệu năng cao.
- **Không cần đổi hợp đồng store/data.**
- Sẵn sàng bàn giao cho Claude review và người dùng kiểm tra để chuyển tiếp sang Task T03.
