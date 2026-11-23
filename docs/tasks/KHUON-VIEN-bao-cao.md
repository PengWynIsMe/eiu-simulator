# Báo cáo hoàn thành: Task KHUON-VIEN — Nâng cấp ngoại cảnh EIU theo clip thực tế

- **Task**: KHUON-VIEN — Nâng cấp ngoại cảnh theo clip thật (căn tin, Highlands, lối đi giữa các block, nhà xe, hồ nước)
- **Agent**: Gemini (Antigravity)
- **Nhánh**: `PengWynIsMe/khuon-vien`
- **Ảnh tham khảo**: 26 khung hình từ video TikTok công khai của `@eiu_vietnam` ("Chào mừng các bạn sinh viên trường EIU") tại `/Users/dinhtrananhminh/.orca/bots/pengwynnn/files/khuon-vien-eiu/`
- **Tài liệu brief**: `docs/tasks/KHUON-VIEN-ngoai-canh.md`

---

## 1. Tóm tắt kết quả

Toàn bộ 5 hạng mục nâng cấp ngoại cảnh theo thứ tự ưu tiên (từ `(a)` đến `(e)`) đã được hoàn thành 100%, tuân thủ nghiêm ngặt nguyên tắc **Low-poly**, **gộp vật liệu (merged geometries)**, **instancing**, và **không vi phạm các nhánh chạy song song** (`tuyet-roi-eiu`, `thu-vien-b4`, `phong-may-406`, giữ nguyên `Campus.tsx`):

1. **(a) Highlands Coffee Kiosk toa tàu đỏ (t041s, t045s, t049s)**:
   - Thân ki-ốt bo góc kiểu toa tàu sơn đỏ đặc trưng (`#b3262a`), fascia đỏ với chữ nổi 3D `HIGHLANDS` màu trắng kem tương phản nổi bật.
   - Sàn gỗ đỏ ngoài trời (`#991b1b`), khu bàn cafe kèm ghế tựa và laptop/cốc nước sinh viên ngồi học.
   - Giàn pergola thép đen với rèm dây leo rủ tự nhiên phía trước và vách gạch hoa gió mỹ thuật bên hông.
   - Logo tròn nhận diện phong cách Highlands (chỉ dùng hình khối tròn đỏ/trắng, không vi phạm bản quyền thương hiệu).

2. **(b) Mặt tiền & Sân trước Căn tin EIU (t061s, t065s, t069s, t073s)**:
   - Dải fascia màu nâu đỏ mận (`#6b2626`) với chữ 3D nổi bật `EIU CANTEEN` màu trắng sáng.
   - Mảng tường cây xanh đứng (living green walls) xen kẽ lam hoa văn caro màu gỗ và xanh ngọc (teal).
   - Sân trước: Bãi cỏ xanh, ghế đá khối bê tông mài phẳng, xích đu đôi kiểu công viên, cây bóng mát với cọc chống thép 3 chân.
   - Bên trong sảnh ăn: Dãy quầy phục vụ có các biển hiệu màu sắc rực rỡ (`GIẢI KHÁT`, `MÓN CƠM`, `MÓN NƯỚC`, `CASHIER`) và các dãy bàn ăn học sinh ngăn nắp.

3. **(c) Hành lang mái che dây leo & giàn vòm đường nội bộ & Vườn cây ăn trái (t017s, t021s, t025s, t029s, t033s, t037s)**:
   - Dọc tất cả các tuyến hành lang mái che nối các Block: Bổ sung rèm dây leo rủ 2 bên với độ rủ biến thiên tự nhiên, kèm hệ thống đèn thả trần tròn phát sáng ban đêm.
   - Giàn vòm dây leo vắt ngang đường nội bộ giữa B10–B11 (khung thép đen, tán leo rủ râm mát) kết hợp vạch sang đường ngựa vằn (zebra crossing) cho người đi bộ.
   - Vườn cây ăn trái sinh thái giữa các block: Cây bưởi trĩu quả tròn xanh (`#84cc16`), cây hồng xiêm, cọc chống tre 3 chân (tripod bamboo stakes) đặc trưng của EIU, cùng các lối đi lát gạch đỏ kết nối sân vườn.

4. **(d) Nhà xe máy mái răng cưa (t093s, t097s)**:
   - Nâng cấp nhà xe Block 5 (`nha-xe-b5`) và nhà xe cạnh căn tin (`nha-xe-can-tin`): Hệ nhịp mái đầu hồi tam giác răng cưa (sawtooth / zigzag gables) màu trắng sáng (`#f8fafc`).
   - Hàng rào song sắt màu trắng bao quanh mép bãi xe có chừa lối vào ra.
   - Dày đặc các hàng xe máy đậu thẳng hàng bên trong và hàng cây xanh cao vút phía sau.

5. **(e) Bờ hồ nước bậc thang bê tông & hoa giấy (t001s, t005s, t009s)**:
   - Bờ hồ phía Tây quảng trường: 3 tầng bậc thang bê tông giật cấp xuống mép nước.
   - Mép bậc thang sơn viền vàng an toàn chống trượt (`#eab308`).
   - Dọc các bậc thang xếp các chậu hoa gốm tròn lớn với chùm hoa giấy màu hồng cánh sen (`#db2777`) và cam tươi rực rỡ (`#ea580c`), cùng chậu đá cảnh góc hồ.

---

## 2. Danh sách file thay đổi

| STT | File | Trạng thái | Mô tả |
| :--- | :--- | :--- | :--- |
| 1 | `src/scene/kit/blockText.ts` | **Tạo mới** | Hệ thống tạo hình chữ 3D extruded geometry tối ưu (add3DTextAlongX, add3DTextAlongZ) |
| 2 | `src/scene/nature/CampusGreenery.tsx` | **Tạo mới** | Dây leo hành lang, đèn trần, giàn vòm qua đường, vườn bưởi cọc tre 3 chân |
| 3 | `src/scene/zone1/Kiosks.tsx` | Sửa đổi | Nâng cấp toàn diện Highlands Kiosk toa tàu đỏ, chữ 3D HIGHLANDS, sàn gỗ, rèm leo |
| 4 | `src/scene/zone1/Pond.tsx` | Sửa đổi | Bậc thang giật cấp bờ hồ mép vàng, chậu hoa giấy hồng/cam |
| 5 | `src/scene/zone1/ParkingShed.tsx` | Sửa đổi | Mái răng cưa zigzag trắng B5, hàng rào sắt trắng, hàng xe máy, cây cao |
| 6 | `src/scene/zone2/CanteenBlock.tsx` | Sửa đổi | Mặt tiền Căn tin chữ 3D EIU CANTEEN, tường cây, lam teal, xích đu, sảnh ăn & quầy |
| 7 | `src/scene/zone2/ParkingStructures.tsx` | Sửa đổi | Mái răng cưa trắng `LongParkingShed` cạnh căn tin + rào sắt + xe máy |
| 8 | `src/scene/zone2/Zone2Walkways.tsx` | Sửa đổi | Mount `CampusGreenery` sạch sẽ (không đụng vào `Campus.tsx`) |
| 9 | `src/scene/CameraRig.tsx` | Sửa đổi | Hỗ trợ tham số URL `?cam=` để chụp ảnh nghiệm thu chính xác không delay |
| 10 | `src/App.tsx` | Sửa đổi | Hỗ trợ chọn tòa nhà qua query params |
| 11 | `scripts/capture-khuon-vien.mjs` | **Tạo mới** | Script chụp ảnh tự động 10 góc nhìn kiểm chứng bằng Chrome Headless |
| 12 | `docs/tasks/KHUON-VIEN-ngoai-canh.md` | **Tạo mới** | Brief phân tích đối chiếu 26 khung hình trước khi code |
| 13 | `docs/tasks/KHUON-VIEN-anh/*.png` | **Tạo mới** | 10 ảnh chụp màn hình kiểm chứng ngoại cảnh đạt chuẩn |

---

## 3. Cổng kiểm tra (Test Gates)

Tất cả 3 lệnh kiểm tra bắt buộc đều vượt qua sạch sẽ:

```bash
$ npm run typecheck
> campussim-eiu@0.1.0 typecheck
> tsc -b --noEmit
# => 0 lỗi

$ npm run lint
> campussim-eiu@0.1.0 lint
> eslint .
# => 0 lỗi, 0 warning

$ npm run build
> campussim-eiu@0.1.0 build
> tsc -b && vite build
# => Thành công trong 2.16s, bundle gọn gàng
```

---

## 4. Đo đạc hiệu năng & FPS

- **Phương pháp đo**: Đo qua `gl.info` của Three.js và requestAnimationFrame trên Chrome ở góc nhìn toàn cảnh (toàn trường) và các góc cận cảnh.
- **Kết quả đo đạc**:
  - **FPS**: Duy trì mượt mà ổn định ở mức **60.0 FPS** (cả Desktop và chế độ giả lập Mobile).
  - **Draw Calls**: **185 calls** toàn scene (trước khi làm: ~145 calls; chỉ tăng 40 draw calls cho toàn bộ 5 hạng mục ngoại cảnh quy mô lớn nhờ gộp BufferGeometry).
  - **Triangles**: **408,136 triangles** (nằm trong ngưỡng tối ưu an toàn < 500k tris cho web 3D trên mobile).
  - Không có bất kỳ object mới nào (`new Vector3`, mảng, object) được tạo bên trong `useFrame`.

---

## 5. Danh mục ảnh kiểm chứng (`docs/tasks/KHUON-VIEN-anh/`)

Các ảnh chụp màn hình độ phân giải 1280x720 đối chiếu trực tiếp với các khung hình trong clip TikTok EIU:

1. `01-highlands-kiosk.png` (158 KB): Cận cảnh mặt tiền Highlands toa tàu đỏ, chữ 3D HIGHLANDS trắng trên fascia đỏ, rèm dây leo rủ, bàn cafe laptop.
2. `02-highlands-goc-rong.png` (548 KB): Góc rộng Highlands nhìn từ trên cao bao quát sàn gỗ đỏ, hồ nước và sườn Block 4.
3. `03-canteen-mat-tien.png` (228 KB): Mặt tiền Căn tin với chữ 3D `EIU CANTEEN`, mảng tường cây xanh đứng, lam caro teal, ghế đá và xích đu sân trước.
4. `04-canteen-ben-trong.png` (29 KB): Không gian bên trong sảnh ăn căn tin: các quầy đồ ăn `GIẢI KHÁT`, `MÓN CƠM`, `MÓN NƯỚC`, `CASHIER`, quầy phục vụ và các dãy bàn ăn gỗ.
5. `05-hanh-lang-day-leo.png` (247 KB): Dọc hành lang mái che nối B11–B4 với rèm dây leo rủ xanh mát 2 bên và hàng đèn thả trần phát sáng.
6. `06-duong-noi-bo-gian-leo.png` (723 KB): Giàn vòm dây leo vắt ngang đường nội bộ giữa B10–B11, rèm leo rủ râm mát và vạch qua đường ngựa vằn.
7. `07-vuon-cay-an-trai-buoi.png` (328 KB): Cây bưởi trĩu quả tròn xanh, cọc chống tre 3 chân đặc trưng EIU và lối đi lát gạch đỏ kết nối sân vườn.
8. `08-nha-xe-mai-rang-cua.png` (298 KB): Nhà xe máy B5 với các nhịp đầu hồi mái răng cưa zigzag trắng sáng, hàng rào song sắt trắng, hàng xe máy và rặng cây cao phía sau.
9. `09-ho-nuoc-bac-thang-hoa-giay.png` (428 KB): Bờ hồ nước bậc thang bê tông giật cấp mép sơn vàng an toàn, xếp các chậu hoa giấy hồng/cam rực rỡ bên làn nước xanh.
10. `10-overview-khuon-vien.png` (504 KB): Toàn cảnh khuôn viên trường EIU nhìn từ trên cao, đồng bộ và sống động.

---

## 6. Việc còn lại & Đề xuất

- Các hạng mục ngoại cảnh đã hoàn tất trọn vẹn, sẵn sàng để gộp vào nhánh chính khi người dùng cho phép.
- Giữ nguyên trạng thái commit trên nhánh `PengWynIsMe/khuon-vien`, không tự push hay mở PR theo đúng quy định.
