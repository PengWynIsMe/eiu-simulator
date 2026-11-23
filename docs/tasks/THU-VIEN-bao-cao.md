# Báo cáo Nhiệm vụ: Nội thất Thư viện EIU (Block 4)

- **Người thực hiện**: Gemini (Antigravity)
- **Nhánh**: `PengWynIsMe/thu-vien-b4`
- **Mục tiêu**: Tái hiện trung thực không gian nội thất 3 tầng của Thư viện EIU (Block 4) dựa trên 17 ảnh trích xuất từ clip TikTok thực tế của trường và các ảnh bổ sung (`thu-vien-eiu/`), tích hợp va chạm, thang bộ, thang máy trong chế độ đi bộ (WalkMode), bảo đảm FPS cao (≥ 60 FPS) và đạt 0 lỗi ở tất cả các cổng kiểm tra.

---

## 1. Những gì đã dựng theo ảnh thực tế (17 khung hình clip TikTok)

1. **Vách kính lớn mặt Nam & View ngoại cảnh**:
   - Vách kính cường lực suốt chiều dài mặt Nam (`v = 28.0`), mở góc nhìn trực tiếp ra cụm hồ nước trung tâm và ki-ốt Highlands Coffee màu đỏ-trắng (đúng góc nhìn trong ảnh 01 & 02).
   - Hệ thống poster EIU rực rỡ dán trên kính theo 4 mảng màu chủ đạo của trường: Đỏ (*"SỨ MẠNG - TẦM NHÌN - HÀNH ĐỘNG"*), Xanh ngọc (*"GIÁ TRỊ CỐT LÕI"*), Xanh lá (*"MỤC TIÊU GIÁO DỤC - DÁM ƯỚC MƠ DÁM THỰC HIỆN"*), Tím (*"Save one person YOU'RE A HERO / Save hundreds YOU'RE A NURSE"*), Xanh dương (*"BUILDING THE FUTURE WITH IDEAS"*) và các poster QR mã tra cứu OPAC, cơ sở dữ liệu số.

2. **Khu bàn đọc phong cách công nghiệp (Industrial Reading Zone)**:
   - Dãy bàn đọc gỗ sồi mặt sáng chân sắt hộp đen công nghiệp (bàn 6 chỗ và 8 chỗ).
   - Ghế sắt Tolix màu đen mờ xếp gọn gàng theo dãy bàn đọc dọc cửa sổ kính.
   - Cụm chậu cây cảnh nội thất hình khối chữ nhật và bệ cây xanh dọc vách kính.

3. **Cột nhận diện ZONE A & ZONE B**:
   - Cột vuông trắng kết cấu chịu lực, đỉnh sơn dải băng đỏ EIU.
   - Chữ 3D Drei màu đỏ đậm `"ZONE A"` và `"ZONE B"` chạy dọc thân cột theo đúng nhận diện thư viện trong ảnh 11, 16, 17.

4. **Khu máy tính tra cứu (OPAC / Computer Lab)**:
   - Dãy bàn máy tính gỗ óc chó sẫm màu chân sắt hộp đen giằng ngang.
   - Máy tính All-in-One màu trắng/kem kèm bàn phím, chuột và ghế học chân gỗ hiện đại.

5. **Dãy phòng họp nhóm vách kính (Group Study Rooms 01 – 06)**:
   - Vách kính trong suốt ngăn giữa hành lang tầng 2 và phòng họp nhóm.
   - Biển hiệu mica 4 dải màu nhận diện EIU: Xanh logo EIU - Rêu số phòng (01..06) - Cam *"Phòng họp nhóm / Group Study Rooms"* - Đỏ rượu *"THƯ VIỆN / Library"*.
   - Hộp bàn phím số điện tử bên cạnh cửa.
   - Bên trong phòng: Bàn họp gỗ, ghế bọc nệm màu xanh ngọc (teal), trần thạch cao trắng kèm máy lạnh cassette âm trần.

6. **Khoảng thông tầng (Void / Atrium) & Lan can kính inox**:
   - Lỗ mở sàn hình chữ nhật tại Tầng 2 (`u = 20..36, v = 16..26`) nhìn trực tiếp xuống sảnh đọc và bàn ghế tầng 1.
   - Hệ lan can kính trong suốt bao quanh 4 cạnh với tay vịn inox sáng bóng (`#e2e8f0`, `roughness: 0.1`, `metalness: 0.95`).

7. **Trần công nghiệp hở (Exposed Ceiling) & Chiếu sáng**:
   - Hệ trần bê tông xám đậm (`#26282b`) để lộ ống gió điều hòa không khí xám bạc và các dải đèn LED tuýp dài treo thả.

---

## 2. Những phần suy luận & đoán (Hợp lý hóa kiến trúc thư viện)

Do clip TikTok chỉ quay cục bộ các góc ấn tượng của sinh viên, các khu vực sau được suy luận hợp lý để đảm bảo trải nghiệm đi bộ khép kín:
- **Cửa ra vào**: Cửa chính tự động 2 cánh mặt Nam (`u = 28, v = 28`), cửa phụ phía Tây (`u = 0, v = 14`) nối sang B11, cửa phụ phía Đông (`u = 67, v = 14`) nối sang B5.
- **Vị trí quầy thủ thư / Tiếp đón**: Bố trí chữ L tại sảnh tầng 1 gần cửa chính (`u = 24..28, v = 15..18`).
- **Lõi giao thông đứng (Thang máy & Cầu thang bộ)**:
  - Bố trí tại vị trí trung tâm phía sau quầy thủ thư (`u = 30.5, v = 6.0` cho thang máy và `u = 35..39, v = 4..8` cho thang bộ 2 vế switchback).
- **Khu kệ sách mở (Book Stacks)**: Dãy giá sách 2 mặt cao 2.1 m bố trí ở phía Tây tầng 1 và tầng 2 (`u = 4..22`).
- **Tầng 3 (Khu tự học yên tĩnh cao độ)**: Bố trí các dãy bàn đọc dài, bàn đơn cá nhân carrels, và giếng trời lấy sáng nhẹ trên trần.

---

## 3. Cấu trúc kỹ thuật & Tối ưu hiệu năng

- **Tách biệt module**:
  - `src/scene/interior/layouts/b4.ts`: Định nghĩa toàn bộ hình học 2D/3D của B4 (gốc, góc xoay `-6.25°`, kích thước 67m x 28m x 11.4m, ranh giới, cửa vào, lõi thang, các vùng va chạm hộp và đoạn thẳng).
  - `src/scene/interior/B4Furniture.tsx`: Gom toàn bộ nội thất và trang thiết bị B4 vào các cụm `instancedMesh` dùng chung `BufferGeometry` và `MeshStandardMaterial`.
- **Hệ thống va chạm mượt mà**:
  - Tích hợp va chạm tường bao ngoài, vách ngăn phòng họp nhóm, quầy thủ thư, các cụm bàn đọc, bàn máy tính và thành cầu thang.
  - Hỗ trợ leo cầu thang 2 vế (switchback stair) mượt mà với tính toán cao độ z/y liên tục, không bị kẹt hay rơi qua sàn.
- **Chuyển tầng**:
  - Thang máy hoạt động chuẩn xác giữa Tầng 1, 2, 3 bằng UI thang máy có sẵn.
  - Thang bộ kết nối xuyên suốt 3 tầng.

---

## 4. Kết quả kiểm tra & Đo lường thực tế

### A. Cổng kiểm tra tĩnh
1. `npm run typecheck`: **0 lỗi** (`tsc -b --noEmit` đạt chuẩn strict).
2. `npm run lint`: **0 lỗi** (`eslint .` sạch 100%, không cảnh báo).
3. `npm run build`: **Thành công** (`vite build` hoàn tất trong ~2.3s, bundle tối ưu).

### B. Kiểm thử tự động trên trình duyệt (Headless Chrome WebGL)
- Chạy kịch bản tự động hóa đi bộ từ bên ngoài khuôn viên vào sảnh B4, đi qua các khu vực Tầng 1, đi thang máy lên Tầng 2, ngắm thông tầng và phòng họp nhóm, lên Tầng 3 và bước ra ngoài.
- **Đo lường FPS**:
  - Khuôn viên ngoài trời: **60 FPS**
  - Tầng 1 (Sảnh đọc, OPAC, poster): **61 FPS**
  - Tầng 2 (Thông tầng lan can kính, phòng họp 01..06): **61 FPS**
  - Tầng 3 (Silent study, nghiên cứu): **60 FPS**
- **10 Ảnh chụp nghiệm thu** lưu tại thư mục `docs/tasks/THU-VIEN-anh/`:
  1. `01-ngoai-cua-chinh-b4.png`: Mặt tiền Nam B4, vách kính và ki-ốt Highlands Coffee đối diện.
  2. `02-t1-sanh-don-thu-thu.png`: Sảnh đón Tầng 1 với quầy tiếp tân thủ thư và cầu thang.
  3. `03-t1-khu-doc-poster-highlands.png`: Khu bàn gỗ chân sắt công nghiệp và vách kính dán poster màu sắc EIU.
  4. `04-t1-may-tinh-opac.png`: Dãy bàn máy tính tra cứu OPAC với màn hình All-in-One trắng.
  5. `05-t1-cot-zone-b-ke-sach.png`: Cột ZONE B chữ đỏ thẳng đứng, kệ sách và trần hở ống gió.
  6. `06-t2-thong-tang-lan-can-kinh.png`: Khoảng thông tầng Tầng 2 với lan can kính inox nhìn xuống Tầng 1.
  7. `07-t2-phong-hop-nhom-kinh.png`: Dãy phòng họp nhóm kính có biển hiệu số phòng EIU 4 dải màu.
  8. `08-t2-zone-a-carrels-teal.png`: Cột ZONE A, dãy bàn carrels tự học và ghế nệm xanh teal.
  9. `09-t3-silent-study-research.png`: Không gian tự học yên tĩnh cao độ tại Tầng 3.
  10. `10-ra-ngoai-khuon-vien.png`: Bước ra ngoài khuôn viên trường an toàn.

---

## 5. Cập nhật Lần 2 (Sửa các vật thể lơ lửng, bám sát ảnh thực tế)

Theo phản hồi từ điều phối viên và các ảnh bổ sung (`w021s`, `w023s`, `w025s`, `t077s`, `t081s`):
1. **Poster dán kính phẳng**:
   - Dán sát trực tiếp vào mặt trong của vách kính mặt Nam ($v = 27.95, y = 1.85m$, độ dày 0.005m), không còn lơ lửng giữa phòng.
   - Xung quanh poster nhìn xuyên thấu qua kính thấy rõ thảm cỏ, hàng cây xanh và ki-ốt Highlands Coffee bên ngoài.
2. **Loại bỏ hoàn toàn các vật thể lơ lửng**:
   - Bỏ các khối xanh lá và ống gió lớn cắt ngang khoảng thông tầng Atrium Tầng 2; khoang giếng trời hoàn toàn thông thoáng từ Tầng 1 lên mái.
   - Ống gió HVAC gọn gàng bám sát mép trần ($y = 3.55m$ né giếng trời), đèn LED tuýp thả thanh mảnh ($2.4m \times 0.04m \times 0.08m$).
   - Cây cảnh nội thất dùng chậu trụ tròn thanh lịch đặt trên sàn Tầng 1.
3. **Ghế Tolix & Ghế Teal thanh mảnh có chân (chuẩn Style 3D)**:
   - Ghế Tolix công nghiệp chân sắt mảnh, mặt ngồi kim loại mỏng và lưng tựa uốn cong thoáng đãng.
   - Ghế teal bọc nệm êm ái có 4 chân thanh mảnh, loại bỏ hoàn toàn các khối hộp đặc màu đen.
4. **Dãy kệ sách trắng nhiều tầng có gáy sách màu (`w025s`, `w023s`, `14`)**:
   - Khung sắt trắng nhiều tầng, đợt kệ ngang trắng, hồi kệ gỗ sồi gắn biển hiệu xanh tím EIU và các hàng sách nhiều màu rực rỡ (đỏ, xanh lam, vàng, xanh lá, trắng).
   - Bố trí nổi bật tại khu Zone B và sảnh đọc.
5. **Vách kính lớn mặt Nam nhìn ra cây xanh**:
   - Dựng hệ khung nhôm đen công nghiệp (đố đứng 2.5m, đố ngang $y = 1.2m, 2.4m$) và kính trong suốt nhìn ra thảm cỏ, lối đi bộ lát gạch, hàng cây xanh rợp bóng và ki-ốt Highlands Coffee bên ngoài.
6. **Lối vào có cổng quẹt thẻ (`t077s`)**:
   - Trụ inox quẹt thẻ có cánh flap mica xanh và 4 bảng gỗ nhận diện EIU ốp tường sảnh đón.

---

## 6. Danh sách file thay đổi & bổ sung

| File | Thao tác | Mô tả |
| :--- | :--- | :--- |
| `docs/tasks/THU-VIEN-B4.md` | Tạo mới | Brief thiết kế chi tiết đối chiếu ảnh và quy hoạch mặt bằng |
| `docs/tasks/THU-VIEN-bao-cao.md` | Cập nhật | Báo cáo hoàn thành nhiệm vụ & nghiệm thu lần 2 |
| `docs/tasks/THU-VIEN-anh/*.png` | Tạo mới | Ảnh chụp nghiệm thu từng khu vực nội thất B4 |
| `src/scene/interior/layouts/b4.ts` | Tạo mới | Định nghĩa hình học, ranh giới, va chạm và lõi thang B4 |
| `src/scene/interior/B4Furniture.tsx` | Tạo mới & Tinh chỉnh | Component 3D nội thất B4 bám sát ảnh thực tế, tối ưu instanced mesh |
| `src/scene/interior/layouts/index.ts` | Chỉnh sửa | Đăng ký `b4Layout` vào danh sách interior layout |
| `src/scene/interior/InteriorFurniture.tsx` | Chỉnh sửa | Render `<B4Furniture />` khi vào tòa B4 |
| `src/scene/interior/InteriorScene.tsx` | Chỉnh sửa | Bổ sung multi-floor B4, cảnh quan ngoại thất nhìn qua kính (cỏ, cây, Highlands) |

---

## 7. Đề xuất phát triển tiếp theo

- Khi có thêm ảnh chi tiết của Tầng 3 hoặc khu vực sách chuyên ngành sâu hơn, có thể bổ sung thêm các phân khu đặc thù như phòng hội thảo đa năng hoặc studio sáng tạo.
- Xem xét gắn thêm các liên kết tương tác mở danh mục sách thư viện trực tuyến EIU khi click vào máy tính tra cứu OPAC.
