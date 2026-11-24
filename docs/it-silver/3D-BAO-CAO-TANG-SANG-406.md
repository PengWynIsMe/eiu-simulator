# Báo Cáo Kỹ Thuật: Tăng Sáng Phòng 406.B8 (Computer Lab)

## 1. Chẩn Đoán Nguyên Nhân Thật
Trước khi chỉnh sửa, phòng 406.B8 u tối và có tông màu nâu xỉn vì các nguyên nhân cấu trúc sau:
1. **Mảng ốp tường bị chìm trong tường đặc của tòa nhà:**
   - Trong `b8.ts`, tường ngăn giữa các phòng học nằm tại `r.maxU` và `r.minU` với độ dày `0.2 m` (nửa bề dày `0.10 m`). Tường hành lang tại `v = -200.0` dày `0.2 m` (mặt trong phòng tại `v = -200.10`).
   - `InteriorScene.tsx` tô toàn bộ tường kết cấu B8 bằng màu nâu sẫm `#42322c`.
   - Trong `B8ComputerLabs.tsx`, các mảng ốp `concreteSurfaces` trước đây đặt tại `r.maxU - 0.02` và `r.minU + 0.02` (bề dày chỉ `0.02 m`). Do đó các mảng này nằm lọt thỏm sâu bên trong bức tường nâu (chìm sâu `0.08 m`), Three.js render bề mặt tường nâu `#42322c` ra phía trước và che khuất hoàn toàn mảng ốp tường xám sáng.
2. **Khung TV và bảng trắng bị chìm:**
   - TV frame đặt tại `frontU = r.maxU - 0.05` cũng bị chìm một nửa trong khối tường ngăn dày `0.2 m`.
3. **Độ nhám vật liệu và ánh sáng nội bộ:**
   - Vật liệu tường cũ dùng `roughness={0.85}` làm triệt tiêu gần như toàn bộ tán xạ ánh sáng.
   - Phòng chỉ có `ambientLight intensity={0.4}` nội bộ, trong khi dầm trần đen công nghiệp hấp thụ ánh sáng.

---

## 2. Giải Pháp Thực Hiện (Nhẹ Nhất, 1 Draw Call, Không Đổi Màu Hành Lang)
1. **Đưa các mảng ốp tường ra mặt trong phòng (áp sát không z-fighting):**
   - Tường Đông (trước): đặt tại `u = r.maxU - 0.105`, dày `0.02 m`, mặt trước tại `u = r.maxU - 0.115` che trọn màu nâu sẫm.
   - Tường Tây (sau): đặt tại `u = r.minU + 0.105`, dày `0.02 m`, mặt trước tại `u = r.minU + 0.115`.
   - Tường Nam (hành lang): đặt tại `v = -200.11`, dày `0.02 m`, chừa chính xác 2 cửa ra vào và 2 lanh-tô cửa.
   - Tường Bắc (bậu cửa sổ): đặt tại `v = -210.12`, cao `0.85 m`.
   - Trần bê tông: đặt tại `y = 3.79 m`, phủ toàn bộ lòng phòng `roomWidth - 0.22 m`.
   - Toàn bộ các mảng tường ốp gom chung vào 1 draw call duy nhất (`batches.concreteSurfaces`).
2. **Khung TV và bảng trắng:**
   - TV frame chuyển ra `u = r.maxU - 0.13`, TV screen tại `u = r.maxU - 0.152`.
   - Bảng trắng khung nhôm chuyển ra `u = r.maxU - 0.14`, nổi đều đặn trên mặt tường bê tông xám sáng.
3. **Màu sắc và độ phản xạ:**
   - Đổi màu bê tông xám sang `#dcdbd6` (trắng xám bê tông sáng mộc), `roughness={0.6}` giúp ánh sáng tán xạ dịu nhẹ.
4. **Chiếu sáng nội bộ không bóng:**
   - Thêm 1 `pointLight` dịu nhẹ treo giữa trần mỗi phòng lab tại `y = 3.25 m`, `intensity={0.65}`, `distance={9.0 m}`, `decay={1.6}`, `color="#ffffff"`, `castShadow={false}`. Ánh sáng suy giảm nhanh trước khi tới mép hành lang, làm phòng sáng bừng mà **hoàn toàn không làm đổi màu hành lang, mặt ngoài, các phòng khác hay 406.B11**.

---

## 3. Bảng Ảnh Đối Chiếu Trước / Sau Cùng Góc Nhìn

| STT | Góc chụp | Ảnh Trước (Before) | Ảnh Sau (After) | Đánh giá độ sáng & màu sắc |
| :--- | :--- | :--- | :--- | :--- |
| **01** | **Ngồi 406.B8 (Bước Slide)** | `01-seated-406-b8-before.jpg` (55 KB) | `01-seated-406-b8-after.jpg` (121 KB) | Phòng sáng bừng, thấy rõ chi tiết bàn phím, case máy, màn hình, tường trắng xám sáng dịu. |
| **02** | **Cửa vào nhìn 406.B8** | `02-door-view-before.jpg` (50 KB) | `02-door-view-after.jpg` (137 KB) | Tường Đông, bảng trắng, TV và dãy bàn máy tính sáng rõ, không còn mảng tường nâu u tối. |
| **03** | **Hành lang tầng 4 B8** | `03-corridor-b8-before.jpg` (72 KB) | `03-corridor-b8-after.jpg` (121 KB) | **Bảo đảm không đổi màu**: Tường hành lang vẫn giữ nguyên màu nâu `#42322c`, gạch xám không bị cháy sáng. |
| **04** | **406.B11 (nmlt-01)** | `04-406-b11-before.jpg` (87 KB) | `04-406-b11-after.jpg` (83 KB) | **Bảo đảm không đổi màu**: Phòng 406.B11 giữ nguyên độ sáng và màu sắc chuẩn ban đầu. |

*Tất cả 8 file ảnh được lưu tại thư mục `docs/it-silver/anh-3d/tang-sang-406/` và nén dung lượng <= 150 KB.*

---

## 4. Báo Cáo Về Vị Trí Thầy Giáo Trong Ảnh Ngồi Bước Slide

- **Thực tế quan sát trong ảnh `01-seated-406-b8-after.jpg` có thấy thầy cạnh TV không?**
  - **KHÔNG THẤY.**
- **Tọa độ của thầy giáo trong thế giới 3D:**
  - Trong `classrooms.json` (phòng 406.B8): `teacherSpots.lecture` tại local `(u: 90.4, v: -206.6)`.
  - Tọa độ thế giới thực tế: `[41.23, 0, -221.71]`. Thầy đứng ở bục giảng bên trái TV (`[42.35, 1.35, -220.43]`).
- **Nguyên nhân chính xác vì sao không thấy thầy:**
  - Khi người chơi ở bước slide (`stepType: "slide"`), camera tự động chuyển sang chế độ cận cảnh màn hình `screenCamera`:
    - Vị trí mắt (`eye`): `[38.15, 1.08, -218.53]`
    - Điểm nhìn (`look`): `[38.59, 1.05, -218.63]`
    - Khoảng cách từ mắt tới màn hình chỉ là **0.45 m**.
  - Thầy giáo đứng ở bục giảng cách đó **4.4 m**, hoàn toàn nằm **NGOÀI KHUNG NHÌN** của `screenCamera` (bị vỏ viền màn hình máy tính và góc nhìn cận cảnh dí sát màn hình che khuất).
  - Khi đứng dậy hoặc ở góc nhìn `camera` thông thường của ghế ngồi (`eye: [37.35, 1.55, -218.19]`, `look: [42.35, 1.35, -220.43]`), góc nhìn bao quát toàn bộ bục giảng và TV thì vị trí đứng của thầy mới lọt vào trường nhìn của camera.
