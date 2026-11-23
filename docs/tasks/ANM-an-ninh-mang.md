# ANM — Trung tâm An ninh mạng (B6) + Sảnh kính thông tầng

- Người làm: **Antigravity** (thợ code chính 3D & giao diện)
- Nhánh: `PengWynIsMe/an-ninh-mang`
- Phối hợp: **Codex** phụ trách phần Cầu thang sơn gáy sách (nhánh riêng); Antigravity chuẩn bị vị trí, ô thông tầng và tài liệu bàn giao tọa độ cho Codex.

---

## 1. Xác định vị trí các không gian theo dữ liệu

Đối chiếu ảnh trích từ clip TikTok "Walk at EIU" (@eiu_vietnam), `src/data/campus.json`, `src/data/building-details.json` và sơ đồ khuôn viên:

1. **Trung tâm An ninh mạng (Cyber Security Center)**:
   - **Vị trí thực tế**: Phòng **100.B6** (Tầng 1, Block 6 — Vườn ươm doanh nghiệp Becamex BBI).
   - **Căn cứ**:
     - `src/data/building-details.json` dòng 259–260: `"code": "100.B6", "name": "Trung tâm An ninh mạng (Sổ tay SV) & cụm Văn phòng Vườn ươm BBI"`.
     - `src/data/campus.json` dòng 56: `"notes": "Số tầng CHƯA CHẮC. Trung tâm An ninh mạng 100.B6. Nằm sau Block 3 (phía Nam), nối B3 bằng hành lang (hanh-lang-b3-b6)"`.
     - Biển phòng trong ảnh `06-trung-tam-an-ninh-mang.jpg` mang số **100** chuẩn phong cách EIU (3 dải màu: xanh lá trên cùng, cam ở giữa mang số 100, đỏ sẫm bên dưới).

2. **Sảnh kính thông tầng**:
   - **Vị trí**: **Sảnh trung tâm Block 6 (BBI)**.
   - **Căn cứ**:
     - `src/data/building-details.json` dòng 247: `"Trung tâm là sảnh kính thông với hành lang B3–B6, nổi bật mảng tường xanh dương và đường dốc kết nối."`
     - Dòng 254: `"Bố cục đặc trưng với sảnh dốc BBI ở giữa, hội trường phía Tây và dãy gian khởi nghiệp."`
     - Dòng 282: `"Tầng 2 dành cho hoạt động sinh viên và không gian mở tầng trên sảnh BBI."`
     - Trực quan: Trong ảnh `02-sanh-kinh-thong-tang.jpg`, sảnh có vách kính lớn hai đầu, hồ nước cạn bên trái, hàng cột chịu lực và cầu/hành lang tầng 2 nhìn xuống.

3. **Cầu thang sơn gáy sách**:
   - **Vị trí đề xuất**: **Sảnh trung tâm Block 6 (BBI)**, kết nối Tầng 1 lên Tầng 2 cạnh giếng trời.
   - **Căn cứ & Ghi chú ĐOÁN**:
     - Dữ liệu `building-details.json` không nêu tên riêng "Cầu thang gáy sách".
     - Tuy nhiên, các cuốn sách sơn trên gáy đều là sách kinh tế, quản trị và kỹ năng lãnh đạo: *Adam Smith, Global Logistics & Supply Chain, Own Your Future, Talk Like TED, Blue Ocean Shift, Thinking Fast and Slow, 7 thói quen hiệu quả...*.
     - Vườn ươm khởi nghiệp BBI (Block 6) hoặc Khoa Quản trị Kinh doanh (Block 3) là nơi phù hợp nhất. Đặt tại sảnh trung tâm Block 6 theo đúng chỉ đạo của đề bài ("đặt ở B6 nếu không có căn cứ nào tốt hơn").
     - Theo điều phối từ điều phối viên (`msg_15691fc829ce`), phần dựng chi tiết từng bậc gáy sách được chuyển giao cho **Codex**. Antigravity để sẵn ô thông tầng, sàn chờ và cung cấp bảng tọa độ chính xác.

---

## 2. Hệ tọa độ địa phương Block 6

- Gốc tọa độ `B6_ORIGIN`: `[173.8, 77.5]` (Góc Tây Bắc của khối Block 6).
- Trục U (rộng ~34.3 m): vector `[173.8, 77.5]` → `[207.9, 73.8]`, góc xoay `rotY ≈ 0.10808` rad (~6.19°). Chiều dương hướng sang Đông (về phía 100.B6).
- Trục V (dài ~47.7 m): vuông góc với trục U, chiều dương hướng về phía Nam.
- Chiều cao tầng: `FLOOR_HEIGHT = 3.8 m`. Số tầng: 2 tầng (tổng cao 7.6 m).

### Phân vùng chức năng Tầng 1:
- `u = 0.5 .. 9.8, v = 2.0 .. 41.0`: Hội trường sự kiện lớn P.102 (Cánh Tây).
- `u = 9.8 .. 18.2, v = 0.0 .. 47.7`: Sảnh kính thông tầng BBI (Central Atrium).
  - `u = 10.4 .. 12.4, v = 6.0 .. 22.0`: Hồ nước cạn sảnh (Reflecting Pool).
  - `u = 12.6 .. 17.8, v = 0.0 .. 47.7`: Tuyến đi bộ chính của sảnh.
  - `u = 10.2 .. 13.8, v = 25.0 .. 34.0`: Vị trí chờ Cầu thang sơn gáy sách (bàn giao cho Codex).
  - `u = 16.5, v = 38.0`: Buồng thang máy B6.
- `u = 18.2 .. 34.0, v = 1.0 .. 18.0`: **Phòng 100.B6 — Trung tâm An ninh mạng (Cyber Security Center)**.
- `u = 18.2 .. 34.0, v = 18.0 .. 41.0`: Không gian Khởi nghiệp BBI (P.101–P.109).

### Phân vùng chức năng Tầng 2:
- Khoảng thông tầng (Void): `u = 10.0 .. 16.2, v = 4.0 .. 19.0` (phía Bắc, nhìn xuống hồ nước) và `v = 23.0 .. 35.0` (phía Nam, nhìn xuống thang Codex).
- Cầu nối Đông–Tây Tầng 2: `u = 10.0 .. 18.2, v = 19.0 .. 23.0`.
- Lan can kính dọc biên lỗ thông tầng ngăn rơi.
- `u = 18.2 .. 34.0, v = 1.0 .. 18.0`: Văn phòng Đoàn Thanh niên – Hội Sinh viên 206.B6 & không gian làm việc.

---

## 3. Danh mục công việc

1. **Cho phép vào Block 6 ở chế độ đi bộ**:
   - Cửa Bắc (mặt tiếp giáp hành lang B3–B6): `u = 13.9, v = -1.2` (ngoài) ↔ `u = 13.9, v = 2.5` (trong).
   - Cửa Nam (mặt tiền đường phía Nam): `u = 13.9, v = 49.0` (ngoài) ↔ `u = 13.9, v = 45.0` (trong).
   - Thang máy 2 tầng có phím E đổi tầng.
2. **Dựng Trung tâm An ninh mạng (100.B6)**:
   - Vách kính trong suốt + cửa kính đôi tiếp giáp sảnh trung tâm.
   - Mảng tường xanh dương đậm (`#1b439c`) điểm nhấn.
   - Màn hình TV lớn hiển thị dashboard giám sát an ninh mạng / hệ thống bảo mật (canvas procedural).
   - Cụm bàn trắng + máy tính PC để bàn (màn hình, case, bàn phím, chuột) dựng bằng `instancedMesh`.
   - Ghế uốn gỗ sáng màu kiểu EIU.
   - Đèn LED thanh treo trần + điều hòa cassette trần.
   - Biển phòng song ngữ VI/EN `100.B6`.
3. **Dựng Sảnh kính thông tầng BBI**:
   - Vách kính cao 2 tầng 2 đầu Bắc và Nam lấy sáng tự nhiên.
   - Hồ nước cạn bên hông sảnh với viền đá bazan tối màu.
   - Hàng cột chịu lực cao 7.6 m.
   - Cầu nối và hành lang Tầng 2 với lan can kính inox nhìn xuống sảnh Tầng 1.
   - Banner treo thông tầng: "COMMUNITY / CỘNG ĐỒNG", "SUSTAINABILITY / BỀN VỮNG".
   - Chậu cây xanh văn phòng trang trí.
4. **Vị trí chờ cầu thang gáy sách (cho Codex)**:
   - Chừa khoảng sàn trống Tầng 1 và lỗ thông tầng Tầng 2 tại `u = 10.2 .. 13.8, v = 25.0 .. 34.0`.
   - Ghi tọa độ cụ thể vào báo cáo.
5. **Kiểm tra**:
   - `npm run typecheck`, `npm run lint`, `npm run build` sạch.
   - Chụp ảnh góc tham khảo vào `docs/tasks/ANM-anh/`.
