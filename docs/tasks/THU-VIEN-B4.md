# THU-VIEN-B4 — Thiết kế & Dựng Nội thất Thư viện EIU (Block 4)

- Người làm: **Gemini (Antigravity)**
- Nhánh: `PengWynIsMe/thu-vien-b4`
- Mục tiêu: Người chơi ở chế độ đi bộ có thể bước vào Block 4 (Thư viện EIU), tham quan 3 tầng với không gian nội thất low-poly tối ưu, tái hiện chân thực các đặc trưng thấy trong 17 ảnh clip TikTok thực tế của trường: sảnh đọc mở vách kính lớn nhìn ra ki-ốt Highlands, poster màu sắc EIU, khu bàn gỗ chân sắt công nghiệp, khu máy tính tra cứu OPAC, cột ZONE A / ZONE B chữ đỏ, dãy phòng họp nhóm vách kính có biển số phòng chuẩn, khoảng thông tầng có lan can kính nhìn xuống, trần hở lộ ống gió và đèn tuýp LED.

---

## 1. Đối chiếu ảnh thực tế (17 khung hình) & Dữ liệu B4 hiện có

### A. Hiện trạng hình học & quy hoạch của Block 4
- **Dữ liệu OSM / `layout.json`**:
  - Tòa nhà là hình chữ nhật gần như hoàn hảo: dài **67.0 m**, rộng **28.0 m**.
  - Tọa độ 4 góc ngoài thế giới:
    - Góc Tây Bắc (NW): `[91.5, -97.4]`
    - Góc Đông Bắc (NE): `[158.1, -104.7]`
    - Góc Đông Nam (SE): `[161.2, -76.8]`
    - Góc Tây Nam (SW): `[94.5, -69.5]`
  - Góc nghiêng trục dài (Tây → Đông): **-6.25°** (rad: `-0.10912`), trùng khớp với hệ lưới quy hoạch của Block 3 liền kề (`-6.25°`).
  - Hướng mặt Nam (`v = 28.0`): Hướng thẳng ra cụm hồ nước trung tâm, ki-ốt Highlands Coffee (`x: 140..152, z: -68..-60`) và lối cầu sang Block 3.
  - Hướng mặt Đông (`u = 67.0`): Giáp Block 5 (Tòa nhà Hành chính).
  - Hướng mặt Tây/Tây Bắc (`u = 0.0`): Nối cầu đi bộ có mái che sang Block 11.
- **Số tầng**: 3 tầng, mỗi tầng cao `FLOOR_HEIGHT = 3.8 m` (tổng chiều cao 11.4 m, khớp `building-details.json`).

### B. Chi tiết nhận diện qua 17 ảnh TikTok công khai (`thu-vien-eiu/`)

| Nhóm ảnh | Chi tiết thấy được trong ảnh thật | Đối chiếu với mô hình 3D |
| :--- | :--- | :--- |
| **01 – 05** | **Sảnh đọc mở mặt Nam & Vách kính lớn**:<br>- Vách kính suốt nhìn ra ngoài thấy rõ ki-ốt **Highlands Coffee** màu đỏ-trắng và mái che pergola ngoài trời.<br>- Dán poster màu sắc EIU: Đỏ ("SỨ MẠNG", "TẦM NHÌN", "... HÀNH ĐỘNG"), Xanh ngọc ("GIÁ TRỊ CỐT LÕI"), Xanh lá ("MỤC TIÊU GIÁO DỤC", "dám ƯỚC MƠ dám THỰC HIỆN"), Tím ("Save one person YOU'RE A HERO / Save hundreds YOU'RE A NURSE"), Xanh dương ("Building the future WITH IDEAS").<br>- Poster QR mã tra cứu (LIBRARY OPAC, ONLINE DATABASES, WORKSHOP...).<br>- Bàn gỗ mặt sáng chân sắt hộp đen, ghế Tolix sắt đen.<br>- Chậu cây cảnh nội thất lớn dọc vách kính.<br>- Trần hở màu xám đen (`#26282b`), ống gió điều hòa xám bạc chữ nhật, đèn tuýp LED thả dài. | Bố trí dọc theo mặt Nam Tầng 1 (`v = 18..28`, `u = 12..56`). Render vách kính trong suốt nhìn ra ngoài, poster màu sắc và bảng chữ đơn giản song ngữ. Bàn ghế gỗ-sắt instanced. |
| **06 – 10** | **Khu máy tính tra cứu (OPAC / Computer Lab)**:<br>- Dãy bàn máy tính gỗ sẫm màu (óc chó/mahogany) chân sắt đen có thanh giằng hộp.<br>- Máy All-in-One màn hình trắng/kem, bàn phím và chuột trắng mỏng.<br>- Ghế ăn/ghế học kiểu DSW chân gỗ / chân sắt.<br>- Ánh sáng tự nhiên từ cửa sổ lớn kết hợp đèn tuýp treo thả trần hở. | Bố trí tại Tầng 1 phía Đông (`u = 46..64`, `v = 14..26`), gồm 3 dãy bàn đôi quay lưng/đối diện, máy tính instanced. |
| **11, 16, 17** | **Cột nhận diện ZONE A & ZONE B, Khu tự học Carrels**:<br>- Cột bê tông vuông màu trắng, đỉnh có dải băng đỏ.<br>- Trên thân cột sơn chữ nổi bật màu đỏ thẳng đứng: **"ZONE A"**, **"ZONE B"**.<br>- Bàn tự học cá nhân có vách ngăn (carrels) vách xám/trắng mang chữ C, E.<br>- Dãy bàn laminate xám chân quỳ + ghế nệm xanh ngọc (teal). | Bố trí lưới cột vuông 0.7m x 0.7m tại các trục `u = 16, 32, 48` và `v = 8, 20`. Gắn chữ 3D ZONE A / ZONE B lên mặt cột. |
| **12 – 14** | **Dãy phòng họp nhóm vách kính (Group Study Rooms)**:<br>- Vách kính và cửa kính khung nhôm xám đậm.<br>- Biển mica 4 dải màu chuẩn EIU gắn cạnh cửa: Xanh lá (logo EIU) - Xanh rêu (số phòng 03, 05, 06) - Cam ("Phòng họp nhóm / Group Study Rooms") - Đỏ rượu ("THƯ VIỆN / Library").<br>- Bàn phím số điện tử kiểm soát ra vào.<br>- Bên trong: bàn họp gỗ dài, ghế nệm teal, cửa sổ kính nhìn ra cây xanh, máy lạnh cassette âm trần trắng. | Bố trí dãy phòng họp 01 đến 06 ở Tầng 2 dọc tường Bắc (`u = 38..64`, `v = 0..8`). Tường kính nhìn xuyên thấu vào trong phòng. |
| **15 – 17** | **Khoảng thông tầng (Void / Atrium) & Lan can kính**:<br>- Lan can kính trong suốt có tay vịn tròn inox sáng bóng và pad kẹp inox.<br>- Từ tầng trên nhìn xuống được không gian sảnh đọc và bàn ghế tầng 1.<br>- Cửa gỗ thông phòng ở mảng tường xám phía sau. | Tạo lỗ mở sàn (floor hole) trên Tầng 2 (`u = 20..36`, `v = 16..26`) có lan can kính inox bao quanh 4 cạnh, nhìn xuống tầng 1. |

---

## 2. Đề xuất Mặt bằng từng tầng (Phần Thấy vs Phần Đoán)

Hệ trục tọa độ địa phương B4:
- Gốc `O [0, 0]` tại góc Tây Bắc `[91.5, -97.4]` (world).
- Trục `u`: Chạy dọc chiều dài từ Tây sang Đông (`0.0 → 67.0 m`).
- Trục `v`: Chạy dọc chiều sâu từ Bắc sang Nam (`0.0 → 28.0 m`).
- `u = 0`: Tường Tây; `u = 67`: Tường Đông; `v = 0`: Tường Bắc; `v = 28`: Tường Nam (mặt tiền hồ/Highlands).

```
                      TƯỜNG BẮC (v = 0, hướng sân nội bộ / trạm điện)
      u=0 ---------------------------------------------------------------- u=67
      |  [Đoán]                      [Đoán] Lõi Thang  [Thấy] Phòng họp nhóm   |
      |  Kệ sách tham khảo mở        Thang máy (u=30)  kính 01..06 (v=0..8)   |
      |  (u=4..22, v=2..12)          Thang bộ (u=34)                          |
      |                                                                        |
v=14  |  Cửa Tây (sang B11)          [Đoán] Sảnh đón   [Thấy] Khu máy tính    | Cửa Đông
(trục |                              Quầy thủ thư      tra cứu OPAC           | (sang B5)
giữa) |                              (u=24..28, v=15)  (u=46..64, v=14..26)   |
      |                                                                        |
      |  [Thấy] Bàn đọc gỗ-sắt       [Thấy] Cột ZONE   [Thấy] Bàn xám +       |
      |  (u=4..20, v=16..26)         A/B (u=32, v=20)  ghế teal carrels       |
      |                              [Đoán] Cửa chính                         |
      u=0 ---------------------------------------------------------------- u=67
                      TƯỜNG NAM (v = 28, vách kính suốt nhìn ra Hồ & Highlands)
```

### Chi tiết phân định:

#### Tầng 1 (Trệt — Sảnh đón, Tra cứu & Đọc mở)
- **THẤY TRONG ẢNH**:
  - Vách kính toàn phần mặt Nam (`v = 28`, `u = 4..64`) nhìn ra khuôn viên và Highlands Coffee.
  - Bộ poster EIU 4 màu sắc, poster QR tra cứu gắn trên kính.
  - Các dãy bàn đọc dài gỗ sồi + chân sắt đen + ghế Tolix đen.
  - Cột lớn "ZONE B" (đỏ/trắng) tại trục trung tâm.
  - Khu máy tính tra cứu OPAC: 3 dãy bàn gỗ sẫm, 18 bộ máy tính All-in-One trắng, ghế ăn hiện đại.
  - Bàn xám + ghế đệm xanh ngọc (teal).
  - Hệ trần công nghiệp màu đen lộ ống thông gió và đèn LED dài.
  - Cây xanh nội thất chậu chữ nhật và chậu tròn.
- **ĐOÁN (Hợp lý hóa theo công năng Thư viện EIU)**:
  - Cửa ra vào chính: Mặt Nam tại `u = 26..30, v = 28` (cửa kính tự động 2 cánh).
  - Cửa phụ hướng Tây (`u = 0, v = 14`) và cửa phụ hướng Đông (`u = 67, v = 14`).
  - Quầy thủ thư (Librarian Desk / Counter): `u = 24..28, v = 15..18`, quầy chữ L mặt gỗ đá trắng có máy tính thủ thư.
  - Vị trí lõi thang máy: `u = 30.5, v = 6.0` (tiếp cận thuận lợi từ sảnh chính).
  - Vị trí thang bộ 2 vế kết nối tầng 1-2-3: `u = 35.0..39.0, v = 4.0..8.0`.
  - Khu kệ sách tham khảo mở phía Tây: `u = 4..22, v = 2..12`.

#### Tầng 2 (Khu học tập, Phòng thảo luận nhóm & Kệ sách chuyên ngành)
- **THẤY TRONG ẢNH**:
  - Khoảng thông tầng (Void/Atrium) tại `u = 20..36, v = 16..26` có lan can inox kính cường lực nhìn xuống sảnh đọc tầng 1.
  - Cột lớn "ZONE A" (đỏ/trắng) trên tầng lửng.
  - Dãy phòng họp nhóm kính (Phòng 01, 02, 03, 04, 05, 06) dọc tường Bắc (`u = 38..64, v = 0..8`):
    - Vách kính trong suốt ngăn giữa các phòng và hành lang.
    - Biển hiệu mica EIU 4 dải màu cạnh cửa phòng.
    - Bàn phím số điện tử bên cạnh cửa.
    - Bàn họp dài gỗ sẫm + ghế nệm teal + trần thạch cao trắng có máy lạnh cassette âm trần.
  - Cụm bàn tự học yên tĩnh carrels Zone B.
- **ĐOÁN**:
  - Khu kệ sách chuyên ngành phía Tây (`u = 4..20, v = 4..24`): các dãy giá sách thư viện 2 mặt cao 2.1 m xếp song song cách nhau 1.5 m.
  - Lõi thang máy và thang bộ tại cùng vị trí trục đứng thẳng với Tầng 1.

#### Tầng 3 (Không gian Thư viện tầng 3 & Sảnh trên — Tự học yên tĩnh cao độ)
- **THẤY / SUY LUẬN TỪ ĐẶC TRƯNG B4**:
  - Trần phẳng có giếng trời lấy sáng (skylights) theo mô tả `building-details.json` ("ô giếng trời lấy sáng").
  - Phía trên là mái bằng bố trí 24 tấm pin năng lượng mặt trời (đã có ở mô hình ngoại thất).
- **ĐOÁN**:
  - Không gian đọc sách nghiên cứu cá nhân và học tập yên tĩnh (Silent Study Zone).
  - Bàn học lớn dài, bàn đọc đơn cá nhân dọc theo vách kính.
  - Kệ lưu trữ luận văn, tạp chí học thuật EIU.

---

## 3. Danh sách File và Phân quyền

### Được tạo / sửa:
1. `src/scene/interior/layouts/b4.ts` (MỚI): Toàn bộ cấu trúc hình học, phòng, tường, va chạm, cửa vào/ra, thang máy, thang bộ của Block 4.
2. `src/scene/interior/B4Furniture.tsx` (MỚI): Toàn bộ nội thất thư viện (bàn ghế gỗ-sắt, ghế Tolix, ghế teal, máy tính AIO, quầy thủ thư, poster màu sắc, cột ZONE A/B, biển phòng họp nhóm, trần hở ống gió + đèn LED, lan can kính thông tầng) sử dụng **instancedMesh** và vật liệu gộp tối ưu draw calls.
3. `src/scene/interior/layouts/index.ts`: Đăng ký `b4: b4Layout`.
4. `src/scene/interior/InteriorFurniture.tsx`: Gắn `<B4Furniture floor={floor} showUpperFloors={showUpperFloors} />`.
5. `src/scene/interior/InteriorScene.tsx`: Bổ sung tâm chiếu sáng & điểm đèn riêng cho B4 (giữ nguyên không đụng vào code sàn hay camera của branch khác).

### KHÔNG được sửa:
- `src/scene/walk/WalkMode.tsx` (branch khác đang sửa camera FPS).
- `src/scene/lesson/**` (phòng 406 và buổi học).
- `src/ui/**` ngoài `InteriorHud` nếu cần.
- `src/store/**`, `src/data/**`.

---

## 4. Kế hoạch Kiểm thử & Tiêu chí Nghiệm thu

- [ ] `npm run typecheck`: 0 lỗi.
- [ ] `npm run lint`: 0 lỗi.
- [ ] `npm run build`: Thành công không có lỗi đóng gói.
- [ ] Kiểm tra di chuyển:
  - Đi bộ từ ngoài sân tới cửa Nam B4 → hiện gợi ý bấm E vào Thư viện.
  - Bấm E vào sảnh tầng 1: thấy ngay sảnh đón, quầy thủ thư, vách kính nhìn ra ngoài thấy ki-ốt Highlands, poster màu sắc EIU, khu bàn gỗ chân sắt đen, khu máy tính OPAC, cột ZONE B.
  - Va chạm hoạt động tốt: không đi xuyên tường bao, tường phòng kính, hoặc các bàn đọc lớn.
  - Tới thang máy: bấm E hiện bảng 3 tầng, chọn tầng 2/3 di chuyển mượt mà.
  - Lên tầng 2: thấy dãy phòng họp nhóm kính 01..06, khoảng thông tầng có lan can kính nhìn xuống tầng 1, cột ZONE A, kệ sách.
  - Lên tầng 3: thấy không gian yên tĩnh và giếng trời lấy sáng.
  - Bấm E ở cửa ra: quay trở lại khuôn viên trường bình thường.
- [ ] Đo FPS: Duy trì 55–60 FPS ổn định trên trình duyệt.
- [ ] Chụp ảnh kiểm thử lưu vào `docs/tasks/THU-VIEN-anh/` để đối chiếu với ảnh gốc TikTok.
- [ ] Viết báo cáo hoàn thành tại `docs/tasks/THU-VIEN-bao-cao.md`.
