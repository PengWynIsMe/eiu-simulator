# Brief KHUON-VIEN: Nâng cấp ngoại cảnh theo clip thực tế

- Người làm: **Antigravity (Gemini)**
- Nhánh: `PengWynIsMe/khuon-vien`
- Căn cứ: 26 khung hình trích từ video TikTok chính thức của EIU (@eiu_vietnam "Chào mừng các bạn sinh viên trường EIU") tại `/Users/dinhtrananhminh/.orca/bots/pengwynnn/files/khuon-vien-eiu/`
- Tránh xung đột: KHÔNG đụng vật liệu mặt đất/cỏ/mái chung (nhánh `tuyet-roi-eiu`), không đụng `thu-vien-b4`, `phong-may-406`, `Campus.tsx`.

---

## 1. Đối chiếu hiện trạng trong game và hình ảnh clip thực tế

| STT | Khu vực / Đối tượng | Tọa độ thế giới (x, z) | Hiện trạng trong game | Thực tế clip tham khảo | Kế hoạch nâng cấp chi tiết |
|---|---|---|---|---|---|
| **(a)** | **Highlands Coffee** (`highlands`) | `[146.0, -64.0]` (cạnh hồ nước, trước Block 4) | Ki-ốt xe buýt có bánh xe, patio xi măng xám, dù che tròn đơn giản | Toa tàu/container cố định bo tròn góc, nửa dưới đỏ thẫm (#a81d22), nửa trên trắng kem; chữ nổi 3D "HIGHLANDS" trắng trên nóc; cửa kính panorama thấy quầy bar; sàn gỗ đỏ nâng cao; bàn ghế cafe nan sắt tối; rèm dây leo rủ; vách gạch hoa gió | Viết lại `HighlandsKiosk` trong `src/scene/zone1/Kiosks.tsx`: hình khối toa tàu bo góc hiện đại, sàn gỗ decking nâu đỏ, chữ HIGHLANDS 3D, quầy bar & menu board bên trong, bàn ghế ngoài trời, rèm dây leo rủ từ mái hiên. |
| **(b)** | **Căn tin EIU** (`can-tin`) | `[116.9, -247.5]` (Khu vực 2, trục Nam) | Khối nhà 1 tầng, tường nâu nhạt, vách kính đơn giản, vài bàn ngoài hiên | Khối thấp mái bằng có viền parapet nâu đỏ + chữ 3D "EIU CANTEEN" / "CANTEEN" trắng; mảng tường cây xanh đứng (living wall) xen lam caro gỗ-teal; sân cỏ phía trước có xích đu, ghế đá khối, cây râm có trụ chống 3 chân; bên trong sảnh ăn rộng với dãy quầy ăn uống có biển đèn (GIẢI KHÁT, MÓN CƠM, MÓN NƯỚC, CASHIER) và dãy bàn ăn | Nâng cấp `CanteenBlock` trong `src/scene/zone2/CanteenBlock.tsx`: biển hiệu chữ nổi CANTEEN, mảng tường cây leo xanh đứng, lam caro trang trí, sân cỏ trước với xích đu và ghế đá khối, hàng quầy đồ ăn nội bộ và cụm bàn ghế ăn instanced. |
| **(c)** | **Hành lang mái che & Giàn dây leo** | Nối B11 ↔ B4, B8 ↔ B11, B9 ↔ B10, đường giữa B10-B11 | Mái hộp trơn màu xanh lá (#365314), cột thép thưa, không có dây leo rủ, không có giàn leo qua đường | Khung thép đen, mái phẳng tối, hai bên buông rèm dây leo xanh rủ mềm mại; có giàn thép vòm dây leo rủ bắc ngang đường nội bộ (t037s); vườn giữa các block có cây ăn quả (bưởi trĩu quả tròn xanh) và cọc chống tre 3-4 chân | Cải tiến `Zone2Walkways.tsx` và `Zone1.tsx`: thêm rèm dây leo rủ mềm buông xuống hai bên hành lang; dựng cổng giàn dây leo vòm xanh vắt ngang đường trục B10-B11; thêm cụm cây ăn quả có quả bưởi và cọc chống tre 3 chân tại các khoảng sân vườn giữa block. |
| **(d)** | **Nhà xe máy mái răng cưa** | Sau B5 (`nha-xe-b5`) và cạnh Căn tin (`nha-xe-can-tin`) | Mái răng cưa xám bạc tối, cột đơn giản, không có hàng rào, trống trơn bên trong | Kết cấu nhịp mái đầu hồi răng cưa tam giác màu trắng sáng (#f1f5f9), khung thép trắng, hàng rào song sắt trắng cao 1.1m bao quanh; bên trong dày đặc hàng xe máy; sau lưng là hàng cây cao | Nâng cấp `ParkingShed.tsx` và `ParkingStructures.tsx`: đổi sang tông màu trắng sáng đồng bộ, thêm hệ lan can song sắt bảo vệ màu trắng, đặt các hàng xe máy đậu san sát (instanced), thêm hàng cây dầu/sao cao phía sau. |
| **(e)** | **Bờ hồ nước & Bậc thang hoa giấy** | `[88..140, -13..+13]` (sân giữa B4–B3 & quảng trường) | Thành hồ hình hộp bê tông phẳng 0.6m, mặt nước phẳng | Bờ hồ phía quảng trường có bậc thang bê tông giật cấp xuống mép nước, mép bậc có vạch sơn vàng nổi bật; dọc thành bậc xếp các chậu hoa giấy (bougainvillea) tròn màu đen với hoa hồng cánh sen / cam rực rỡ; cây lớn râm mát | Nâng cấp `Pond.tsx` trong `src/scene/zone1/`: thêm bậc thang bê tông giật cấp phía Tây, thêm viền sơn vàng mép bậc, thêm các hàng chậu hoa giấy bougainvillea nở hoa hồng/cam tươi tắn. |

---

## 2. Thứ tự triển khai chi tiết

1. **Bước 1 (Ưu tiên a)**: Hoàn thiện `HighlandsKiosk` trong `src/scene/zone1/Kiosks.tsx`
   - Dựng thân toa tàu bo góc (streamlined kiosk) tỉ lệ ~7.5m × 3.6m × 3.4m, phối màu đỏ Highlands (#a81d22) & trắng kem (#f8fafc).
   - Chữ nổi 3D "HIGHLANDS" trên mái.
   - Sàn gỗ đỏ ngoài trời (decking) nâng 0.2m với ván gỗ nâu đỏ.
   - Khu bàn ghế cafe nan kim loại ngoài trời + vách gạch hoa gió.
   - Giàn treo rèm dây leo rủ từ mái hiên.
   - Quầy phục vụ nội bộ với menu board sáng và máy pha cafe.

2. **Bước 2 (Ưu tiên b)**: Nâng cấp `CanteenBlock` trong `src/scene/zone2/CanteenBlock.tsx`
   - Dải fascia màu đỏ mận nâu (#6b2626) có chữ nổi 3D "EIU CANTEEN" màu trắng.
   - Các mảng tường cây xanh đứng (living vertical garden) xen kẽ lam hoa gió caro màu gỗ/teal.
   - Sân trước căn tin: bãi cỏ nâng nhẹ, ghế đá khối bê tông, cây bóng mát có giàn chống thép 3 chân, xích đu đôi kiểu công viên trường học.
   - Khu ăn uống bên trong: dãy quầy phục vụ có biển hiệu (GIẢI KHÁT, MÓN CƠM, MÓN NƯỚC, CASHIER) và hệ bàn ghế ăn instanced ngăn nắp.

3. **Bước 3 (Ưu tiên c)**: Nâng cấp Hành lang mái che & Giàn dây leo qua đường & Vườn cây
   - Thêm rèm dây leo buông rủ (hanging vines) bằng các dải hình học so le màu xanh lá tươi (#4d7c0f, #3f6212) dọc hai bên các hành lang trong `Zone2Walkways.tsx` và `Zone1.tsx`.
   - Bổ sung giàn vòm dây leo vắt ngang đường nội bộ (Overhead Vine Pergola Arch) tại trục đường giữa B10–B11 (đúng vị trí trong ảnh t037s).
   - Thêm cụm cây ăn quả (bưởi trĩu quả tròn xanh, sapoche) có cọc chống tre 3 chân trong vườn giữa các block.

4. **Bước 4 (Ưu tiên d)**: Nâng cấp Nhà xe mái răng cưa
   - Trong `ParkingShed.tsx` (nhà xe B5) và `ParkingStructures.tsx` (nhà xe căn tin):
   - Đổi vật liệu mái sang tông trắng sáng (#f8fafc) với viền hồi tam giác rõ nét.
   - Thêm hệ hàng rào song sắt trắng (white picket railings) cao 1.1m bao quanh chu vi bãi xe.
   - Bố trí các hàng xe máy đậu ngăn nắp bằng instanced meshes.
   - Bố trí hàng cây xanh cao phía sau nhà xe tạo chiều sâu phối cảnh.

5. **Bước 5 (Ưu tiên e)**: Bờ hồ bậc thang & Chậu hoa giấy quanh hồ
   - Trong `Pond.tsx`:
   - Thêm các bậc thang bê tông giật cấp phía Tây hồ hướng về phía quảng trường tròn.
   - Thêm vạch sơn vàng an toàn chạy dọc mép các bậc thang.
   - Bố trí các chậu hoa giấy tròn (bougainvillea) màu hồng rực rỡ và cam dọc theo mép bậc và quanh thành hồ.

6. **Bước 6: Kiểm tra, đo FPS & Chụp ảnh đối chiếu**
   - Chạy `npm run typecheck`, `npm run lint`, `npm run build` đảm bảo 0 lỗi.
   - Chụp ảnh phối cảnh thực tế trong game tại 5 khu vực vào thư mục `docs/tasks/KHUON-VIEN-anh/`.
   - Đo FPS trước và sau khi nâng cấp, ghi nhận số lượng draw call và triangle.
