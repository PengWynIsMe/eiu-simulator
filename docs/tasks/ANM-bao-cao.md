# BÁO CÁO TASK ANM — TRUNG TÂM AN NINH MẠNG (B6) & SẢNH KÍNH THÔNG TẦNG

- **Người thực hiện**: Gemini (Antigravity)
- **Nhánh**: `PengWynIsMe/an-ninh-mang`
- **Mã Task**: `task_fbc595d06630`
- **Ngày hoàn thành**: 2026-11-23

---

## 1. Tóm tắt công việc đã thực hiện

1. **Khảo sát dữ liệu thực tế & Viết Brief (`docs/tasks/ANM-an-ninh-mang.md`)**:
   - Đối chiếu clip công khai "Walk at EIU" (@eiu_vietnam) với cơ sở dữ liệu khuôn viên `building-details.json` và `campus.json`.
   - Xác định chính xác phòng **100.B6** là **"Trung tâm An ninh mạng & cụm Văn phòng Vườn ươm BBI"** (khớp với clip TikTok: vách kính, biển phòng EIU 3 màu xanh/đỏ, biển hợp tác ARIS Japan/サイバーセキュリティセンター).
   - Xác định không gian sảnh kính thông tầng cao nhiều tầng, có cột tròn, hồ nước cảnh quan và cầu nối tầng trên thuộc khối sảnh chính BBI (Block 6).
   - Nhận điều phối mới từ Điều phối viên (`msg_15691fc829ce`): **Bỏ phần cầu thang gáy sách chuyển giao cho Codex dựng trên nhánh riêng**, để lại vị trí thông tầng và thông số tọa độ chính xác để Codex đấu nối.

2. **Dựng bố cục mặt bằng Tòa B6 (`src/scene/interior/layouts/b6.ts`)**:
   - Dựng layout nội thất cho B6 dựa trên footprint OpenStreetMap chuẩn (`layout.json`, polygon `w602270478`):
     - Gốc tọa độ cục bộ B6: `[173.8, 77.5]`, góc xoay `0.10808157` rad.
     - Kích thước: rộng 34.3m (trục U, Tây - Đông) x dài 47.7m (trục V, Nam - Bắc).
     - Kết nối 2 cửa ra vào: Cửa Bắc (`v = 47.7, u = 13.9`) thông thẳng ra hành lang nối sang Block 3; Cửa Nam (`v = 0.0, u = 13.9`) mở ra lối đi bộ nội bộ.
     - Sảnh thông tầng trung tâm rộng lớn (`u = 9.86..17.90`, cao 7.6m qua 2 tầng) với sàn gạch xám bóng thanh lịch (`#475569`).
     - Tầng 2 có sàn hành lang chữ nhật bao quanh giếng trời thông tầng, cầu kính nối ngang và lan can kính cường lực.

3. **Dựng nội thất & trang thiết bị Trung tâm An ninh mạng 100.B6 (`src/scene/interior/B6Furniture.tsx`)**:
   - Mảng tường nhấn xanh dương đậm thương hiệu (`#174291`).
   - Màn hình TV trung tâm khổ lớn (3.6m x 2.0m) hiển thị dashboard giám sát an ninh mạng thời gian thực: bản đồ tấn công DDoS toàn cầu, tình trạng tường lửa Firewall, bộ phân tích mã độc và lưu lượng mạng EIU.
   - Bàn làm việc cụm màu trắng, hệ thống máy tính để bàn (màn hình, case PC, bàn phím, chuột) dựng bằng instancedMesh tối ưu hiệu năng.
   - Ghế xoay công thái học lưng gỗ cong chuẩn văn phòng công nghệ hiện đại.
   - Biển phòng 3 màu đặc trưng EIU (`100.B6 - TRUNG TÂM AN NINH MẠNG / CYBER SECURITY CENTER`), biển đối tác ARIS Japan bằng tiếng Nhật (`サイバーセキュリティセンター / in partnership with ARIS Japan`) và standee giới thiệu trung tâm.
   - Dàn đèn LED âm trần thanh dài chiếu sáng văn phòng.

4. **Dựng sảnh kính thông tầng BBI & Không gian cảnh quan**:
   - 4 cột tròn chịu lực cao 7.6m chạy suốt từ tầng 1 lên tầng 2.
   - Hồ nước cảnh quan trung tâm sảnh (`u = 11.0..16.8, v = 14.0..22.0`) với thành đá bazan sẫm, mặt nước xanh lam ngọc trong trẻo.
   - Bồn cây xanh cảnh quan hai bên hồ nước và chân cột.
   - Băng rôn thả dọc thông tầng ("COMMUNITY", "SUSTAINABILITY").
   - Thang máy B6 (buồng kính khung thép xám).
   - Lan can kính cường lực Tầng 2 nhìn trọn vẹn xuống sảnh tầng 1.

5. **Định hình vị trí và khoảng trống bàn giao cho Codex (Cầu thang gáy sách)**:
   - Khoét lỗ thông tầng sàn Tầng 2 tại khu vực `u = 10.2..13.8, v = 25.0..34.0`.
   - Đặt marker định vị và biển chỉ dẫn "RESERVED FOR CODEX / KHU VỰC CẦU THANG GÁY SÁCH" tại chân thang để Codex dễ dàng xác định hướng dựng.

6. **Hệ thống nhãn song ngữ VI/EN (`src/scene/interior/b6Text.ts`)**:
   - Toàn bộ chuỗi hiển thị (tên phòng, tên trung tâm, biển chỉ dẫn, băng rôn) đều được cấu trúc dạng từ điển `{ vi, en }` sẵn sàng cho lớp chuyển đổi ngôn ngữ.

---

## 2. Vị trí & Căn cứ xác định

| Không gian | Vị trí đề xuất | Tọa độ cục bộ B6 | Tọa độ World (X, Z) | Mức độ xác thực | Ghi chú / Căn cứ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Trung tâm An ninh mạng** | Phòng 100.B6 (Tầng 1) | `u = 17.9..32.0`<br>`v = 0.0..18.0` | `[188.0, 85.0]` | **Xác thực 100%** | Khớp chính xác `building-details.json` ("Trung tâm An ninh mạng & cụm Văn phòng Vườn ươm BBI") và clip TikTok. |
| **Sảnh kính thông tầng** | Sảnh chính B6 (Tầng 1-2) | `u = 9.86..17.9`<br>`v = 0.0..47.7` | `[187.0, 100.0]` | **Đoán có căn cứ vững chắc** | Khối B6 là Vườn ươm Doanh nghiệp BBI, không gian kiến trúc kính thông tầng, hồ nước và giếng trời đúng với phong cách vườn ươm khởi nghiệp EIU. |
| **Khu vực cầu thang Codex** | Giếng trời giao thông B6 | `u = 10.2..13.8`<br>`v = 25.0..34.0` | Chân: `[183.0, 104.1]`<br>Đỉnh: `[182.1, 112.0]` | **Bố trí hợp lý cho Codex** | Kết nối trực tiếp từ hồ nước cảnh quan Tầng 1 lên hành lang cầu kính Tầng 2, view nhìn bao quát sảnh kính và cây xanh. |

---

## 3. Thông số kỹ thuật bàn giao cho Codex (Cầu thang gáy sách)

Để Codex gắn cầu thang sơn gáy sách vào nhánh riêng:
- **Tòa nhà**: Block 6 (`b6`).
- **Tầng kết nối**: Tầng 1 (`y = 0.0`) lên Tầng 2 (`y = 3.8`).
- **Kích thước mặt bằng thang**: Rộng 3.6m x Dài 9.0m.
- **Tọa độ cục bộ**:
  - `u_min = 10.2`, `u_max = 13.8` (rộng 3.6m)
  - `v_min = 25.0`, `v_max = 34.0` (dài 9.0m)
- **Tọa độ World 4 góc**:
  - NW: `[181.2, 103.7]`
  - NE: `[184.8, 103.3]`
  - SE: `[183.8, 112.2]`
  - SW: `[180.3, 112.6]`
- **Hướng đi**: Đi từ phía Nam (`v = 25.0`, `y = 0.0`) hướng lên phía Bắc (`v = 34.0`, `y = 3.8`) dẫn vào hành lang Tầng 2.
- **Khoét sàn**: Sàn Tầng 2 trong `b6Layout` đã có sẵn void lỗ thủng bao quanh kích thước này, không bị cấn va chạm sàn.

---

## 4. Danh sách File đã tạo & Chỉnh sửa

### File tạo mới
1. `docs/tasks/ANM-an-ninh-mang.md`: Brief chi tiết nhiệm vụ và khảo sát thực tế.
2. `docs/tasks/ANM-bao-cao.md`: Báo cáo hoàn thành task.
3. `src/scene/interior/b6Text.ts`: Hệ thống chuỗi text song ngữ VI/EN cho B6.
4. `src/scene/interior/layouts/b6.ts`: Layout hình học 2 tầng, tường, cửa, giếng trời và va chạm của B6.
5. `src/scene/interior/B6Furniture.tsx`: Component nội thất chuyên biệt cho B6 (100.B6, TV dashboard, máy tính, hồ nước, cột thông tầng, lan can kính, marker Codex).
6. `docs/tasks/ANM-anh/*.png`: Bộ 7 ảnh chụp kiểm tra góc nhìn thực tế trong 3D.

### File chỉnh sửa
1. `src/scene/interior/layouts/index.ts`: Đăng ký `b6Layout` vào bộ nạp layout nội thất toàn trường.
2. `src/scene/interior/InteriorFurniture.tsx`: Gắn `<B6Furniture />` khi vào tòa `b6`.
3. `src/scene/interior/InteriorScene.tsx`: Kích hoạt chế độ render đa tầng (`isMultiFloor`) cho B6, màu sàn gạch xám sảnh (`#475569`), và cụm đèn rọi chuyên dụng cho sảnh kính.

---

## 5. Kết quả Cổng kiểm tra (Gate Checks)

```bash
npm run typecheck   # tsc --noEmit -> 0 errors
npm run lint        # eslint -> 0 errors, 0 warnings
npm run build       # vite build -> thành công trong 9.56s (dist/ 1.48 MB)
```

Tất cả 3 cổng kiểm tra đều sạch 100%.

---

## 6. Đo kiểm hiệu năng (FPS Benchmark) & Bộ ảnh chụp

- **Tỉ lệ khung hình (FPS)**: **60.3 FPS** (đo đạc thực tế 121 frames trong 2.007 giây bằng Headless Chrome Metal WebGL).
- **Bộ ảnh chụp đối chiếu góc nhìn trong thư mục `docs/tasks/ANM-anh/`**:
  - `01-ngoai-cua-bac-b6.png`: Cửa Bắc kết nối hành lang B3-B6.
  - `02-sanh-kinh-thong-tang-eiu.png`: Toàn cảnh sảnh kính thông tầng, 4 cột chịu lực và giếng trời tầng 2.
  - `03-ho-nuoc-canh-quan-sanh.png`: Hồ nước cảnh quan sảnh BBI với thành đá bazan sẫm và cây xanh.
  - `04-tv-dashboard-an-ninh-mang.png`: Màn hình TV Dashboard giám sát an ninh mạng phòng 100.B6.
  - `05-khu-vuc-thang-codex.png`: Khu vực chừa sẵn cho Codex dựng cầu thang gáy sách cùng biển chỉ dẫn.
  - `06-trung-tam-an-ninh-mang-eiu.png`: Cụm bàn làm việc, dàn PC và vách kính phòng 100.B6.
  - `07-tang-2-nhin-xuong-sanh.png`: Góc nhìn từ hành lang và cầu kính Tầng 2 nhìn xuống sảnh trệt.
