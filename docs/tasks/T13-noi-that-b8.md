# T13 — Nội thất dùng chung + vào bên trong Block 8 (theo sơ đồ thoát hiểm thật)

- Người làm: **Gemini (Antigravity)**
- Worktree + nhánh: `t13-noi-that-b8`. `npm ci` trước; dev ở cổng **5174**.
- Khác T12: B8 có **sơ đồ thoát hiểm thật cả 4 tầng** → dựng **đúng bố cục** (không đoán).

## Mục tiêu

1. **Tổng quát hóa** hệ nội thất của T12 (đang viết cứng cho B3) thành **danh sách bố cục theo tòa nhà**, để thêm tòa mới chỉ cần thêm 1 file bố cục.
2. **Vào bên trong B8**: 4 tầng, 2 dãy phòng quanh 2 sân trong, hành lang mở có lan can, cầu thang, thang máy chọn tầng 1–4, thẻ phòng.
3. **B3 vẫn chạy như cũ**, đồng thời sửa 2 lỗi còn mở của T12 (xem mục "Sửa kèm").

## Tài liệu

- **Sơ đồ thoát hiểm** (đọc rõ từng mã phòng) — ảnh ở **thư mục repo chính** (không có trong worktree):
  `/Users/dinhtrananhminh/Project/eiu-simulator/references/toa-b8/` — `IMG_3726` (T1), `IMG_3727` (T2), `IMG_3730` (T3), `IMG_3731` (T4).
  Danh mục + hướng: `references/toa-b8/info.md` (cùng thư mục). Ảnh hành lang/sân trong để lấy màu và vật liệu.
- **Hướng sơ đồ (Claude đã đối chiếu):** sơ đồ **Bắc lên trên**. Trái = Tây (sân trong nhỏ, OSM x −29…7.7), phải = Đông (sân lớn, x 9…70).
  Dãy trên = **dãy Bắc, số chẵn**; dãy dưới = **dãy Nam, số lẻ**; phòng 101/102 ở **đầu Đông**. Trục dài nghiêng ~13°.
- Khung nền: `getBuilding('b8').shape.outer` + **`shape.holes` = 2 sân trong** (dùng để định vị chính xác: hành lang chạy dọc mép sân trong).
- Mã phòng đã cập nhật theo sơ đồ: `getBuildingDetail('b8')` (Claude sửa 2026-11-14).

## Bố cục từ sơ đồ (thứ tự Tây → Đông)

| Tầng | Dãy Bắc (chẵn) | Dãy Nam (lẻ) |
| --- | --- | --- |
| 1 | [thang] 116, 114 ‖ 112, 110, 108, 106, 104, 102, [WC] | [WC + thang] 111, 109 ‖ 107, 105, 103, 101 (phòng lớn) |
| 2 | [thang] 220, 218, 216, 214 ‖ 212, 210, 208, 206, 204, 202, [WC + thang] | [WC + thang] 221, 219, 217, 215 ‖ 213, 211, 209, 207, 205, 203, 201 |
| 3 | [thang] 320, 318, 316, 314 ‖ 312, 310, 308, 306, 304, 302, [WC + thang] | [WC + thang] 311, 309 (lớn) ‖ 307, 305, 303, 301 |
| 4 | [thang] 420, 418, 416, 414 ‖ 412, 410, 408, 406, 404, 402, [WC + thang] | [WC + thang] 419, 417, 415, 413 ‖ 411 (lớn), 409, 407, 405, 403, 401 |

`‖` = **hành lang ngang ở giữa** nối dãy Bắc–Nam, giữa 2 sân trong, có cầu thang ở 2 đầu.
**Thang máy**: cạnh hành lang ngang giữa, mép trái sân trong lớn (ký hiệu thang máy trên sơ đồ). Đầu Đông có **lõi cầu thang** trong sân lớn.
Hành lang của mỗi dãy chạy **dọc phía sân trong** (mở, có lan can); phòng nằm phía ngoài. Bề rộng phòng: **đo tỷ lệ trên ảnh sơ đồ**.

## Yêu cầu kỹ thuật

1. **Danh sách bố cục**: `src/scene/interior/layouts/` — mỗi tòa 1 file (`b3.ts` chuyển từ `b3Layout.ts`, `b8.ts` mới), cùng một kiểu `InteriorLayout`
   (gốc + góc xoay, `toWorld/toLocal`, số tầng, mỗi tầng: tường, vách kính, phòng (`code` khớp dữ liệu), cửa vào/ra (có thể nhiều), thang máy, cầu thang).
   `getInteriorLayout(buildingId)` + danh sách các tòa có nội thất. **Mọi hình học dựng qua `toWorld()`** (bài học T12: lật trục làm cảnh trống).
2. `WalkMode` (`scene/walk/**`): phát hiện tới gần **cửa của bất kỳ tòa nào có nội thất** → `enterInterior(id)`; va chạm/đổi tầng đọc layout của `interior.buildingId`.
3. `InteriorHud` (`ui/interior/**`): bỏ `'b3'` viết cứng → dùng `interior.buildingId` / tòa đang ở gần cửa; bảng thang máy theo số tầng của tòa (B8 có 4 tầng → phím 1–4).
   Tên tòa, tiêu đề phụ, phòng: `getBuilding(id)`, `getBuildingDetail(id)`.
4. **B8 — cửa vào**: 2 đầu hành lang ngang giữa (phía Bắc và phía Nam) + lối ra đầu Đông và đầu Tây theo mũi tên "LỐI THOÁT HIỂM" trên sơ đồ T1.
5. **B8 — vẻ ngoài trong nhà** (theo ảnh): tường nâu sẫm, trần sáng (không render trần), nền gạch xám, **viền sàn xanh dương** dọc mép lan can,
   lan can inox phía sân trong, lam che nắng trên hành lang mở. Sân trong: ở tầng 1 có cây + bồn cây; tầng 2–4 là khoảng trống nhìn xuống (lan can chặn).
   Phòng học: bàn ghế hàng lối instancing, bảng ở đầu phòng (chưa có ảnh trong phòng — dựng kiểu chung, ghi rõ trong báo cáo).
6. Hiệu năng: chỉ render tầng hiện tại; < 100 draw call/tầng; không tạo object trong `useFrame`.

## Sửa kèm (lỗi còn mở của T12, `docs/HANDOFF.md` mục 2)

- B3: **đi bộ tới được thang máy** từ sảnh (có lối đi, hiện "E – Thang máy").
- **Cửa "Ra ngoài" bằng phím E** hoạt động (B3 và B8), ra đúng trước cửa đã vào.
- Vị trí nhân vật đang lưu ở biến cấp module trong `WalkMode.tsx` — giữ nguyên được, nhưng đặt tên/ghi chú rõ.

## Được sửa / tạo

`src/scene/interior/**`, `src/ui/interior/**`, `src/scene/walk/**`.

## KHÔNG được sửa

`Campus.tsx`, `App.tsx`, `src/store/**`, `src/data/**`, `src/types/**`, `scene/CameraRig.tsx`, `kit/`, `zone1/`, `zone2/`, `ui/` ngoài `ui/interior/`.
Cần thêm vào store/data → đề xuất trong báo cáo. Không cài thư viện. Không commit/push.

## Tiêu chí xong

- [ ] typecheck / lint / build sạch; console sạch
- [ ] B3: vào → **đi bộ** tới thang máy → tầng 2 → về tầng 1 → **E** ra ngoài đúng chỗ
- [ ] B8: đi bộ tới cửa hành lang giữa → E → vào tầng 1; thẻ phòng đúng mã khi đứng trong 101, 116, 111
- [ ] B8: thang máy 1–4; tầng 4 đứng trong 411 thấy thẻ "411.B8"; nhìn xuống sân trong từ tầng 3 thấy cây ở tầng 1
- [ ] Ảnh chụp: mỗi tầng B8 nhìn từ trên + **đặt cạnh ảnh sơ đồ thoát hiểm tương ứng** để so bố cục
- [ ] Không còn chuỗi `'b3'` viết cứng trong `walk/` và `ui/interior/`

## Báo cáo → `docs/tasks/T13-bao-cao.md` (file, 3 lệnh, kiểm tra tay theo từng tiêu chí, draw call, ảnh, chỗ đang đoán, đề xuất)
