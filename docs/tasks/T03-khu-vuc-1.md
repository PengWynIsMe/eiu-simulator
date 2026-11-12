# T03 — Khu vực 1 chi tiết (trục cổng chính → quảng trường)

- Người làm: **Gemini (Antigravity)**
- Nhánh: `t03-khu-vuc-1`
- Phụ thuộc: T02 (đã commit). Code T02 hiện có: `Ground.tsx`, `Building.tsx`, `Trees.tsx`, `Environment.tsx`, `CameraRig.tsx` — đọc trước khi sửa.

## Mục tiêu

Khu vực 1 nhìn vào là nhận ra EIU: Block 3, 4, 5, 6 có tầng, cửa sổ, lam che, mảng kính sảnh/cầu thang;
hồ nước với 2 cầu mái tôn xanh nối Block 4 ↔ Block 3; hành lang mái che phủ dây leo; nhà xe sau Block 5; cổng chính (tạm).
Các mảnh dựng phải **dùng lại được** cho khu vực 2 (B8–B11) ở T06.

## Phần 0 — Sửa lỗi sau T02 (làm TRƯỚC, báo cáo riêng)

Người dùng + Claude review T02 thấy:

1. **Nhấp nháy khi zoom/di chuyển (z-fighting + bóng rung).** Nguyên nhân trong code T02:
   các lớp mặt phẳng `Ground.tsx` cách nhau chỉ 0.003–0.01 m (0.042 / 0.045 / 0.048 ...), camera `near: 1` nhìn từ 250 m.
   Sửa:
   - Tách lớp ≥ 0.15 m: đất 0 → cỏ trong ranh giới 0.15 → bãi xe 0.3 → cỏ vòng xoay 0.3 → đường phố 0.45 → đường nội bộ 0.6 → lối đi 0.75.
   - Thêm `polygonOffset` (`polygonOffsetFactor` âm dần theo lớp) cho vật liệu đường.
   - Các đoạn đường **cùng một mesh** chồng lên nhau ở chỗ nối → vẫn chớp: tắt `depthWrite` cho lớp đường hoặc nối đoạn liền mạch.
   - Camera `near` tăng lên 5 (hoặc động theo khoảng cách); `far` 2500.
   - Bóng: thu khung bóng về vùng khuôn viên, `shadow-normalBias` ~0.05, hoặc tắt bóng nếu vẫn rung — **ưu tiên không chớp hơn có bóng**.
   - Kiểm tra: zoom từ xa vào gần, kéo ngang qua đường giao nhau — không được chớp.
2. **Màu:** mái quá tối và che mất tường → mái xám sáng (~`#8d9196`), chìa ra ~0.8 m (không phải 1.2). Đường đổi xám nhựa sáng (~`#7b7f86`), lối đi lát gạch nhạt. Trời đang ngả xanh lá → xanh trời nhạt.
3. **Cây:** to hơn (cao 8–12 m, tán rộng 6–9 m), dày hơn quanh đường nội bộ và quảng trường — EIU rất nhiều cây to.
4. **Dữ liệu đã sửa (Claude):** nhà xe cạnh Căn tin giờ bám đúng hướng bãi xe; thêm `nha-xe-2-tang` (tầng trên + tầng hầm, cạnh Lê Duẩn gần B9/B10) —
   chỉ cần hiện đúng như các nhà xe khác, lối dốc xuống hầm làm ở T06.

## Phạm vi khu vực 1

Khung đỏ trong `references/00-tong-quan/khu-vuc-1-cong-chinh.png`. Lấy bằng `getBuildingsInZone(1)`:
`b3`, `b4`, `b5` (3 tầng, đã xác nhận), `b6`, `hanh-lang-b3-b6`, `nha-xe-b5`, `tram-dien`, `fami-pizza`, `highlands`, `cong-chinh`.
Đọc `notes` của từng tòa trong `src/data/campus.json` — có ghi ảnh tham khảo và chỗ nào là **ước lượng**.

## Ảnh tham khảo theo từng thứ

Vị trí từng ảnh 360 do người dùng ghi: `references/tour-360/GHI-CHU.md`. Mỗi ảnh có `-ngang.jpg` (4 hướng), `-tren.jpg`, `-duoi.jpg`.

| Thứ cần dựng | Ảnh chính |
| --- | --- |
| Block 3 | `campus_2`, `campus_3`, `campus_6`, `campus_7`, `campus_8` |
| Block 4 (Thư viện) | `campus_9`, `campus_11`, `campus_12` |
| Block 5 | `campus_1`, `campus_5`, `campus_6`, `campus_7` |
| Hồ nước + cầu | `campus_10`, `campus_11`, `handbook-anh/2026-p12-433.png`, `2026-p09-296.png`, `2025-p11-336.png` |
| Hành lang qua hồ (2 cầu) — đi bộ bên trong | `campus_13` (cầu phải), `campus_14`, `campus_15` (cầu trái) |
| Highlands (cạnh Block 4, phía hồ) | `campus_13` |
| Hành lang mái che dây leo B11 ↔ B4 (không có trên sơ đồ) | `campus_16`, `campus_17`, `campus_18`, `campus_20` — dựng đoạn gần B4; đoạn còn lại thuộc T06 |
| Cột cờ trên quảng trường tròn | `campus_14` |
| Nhà xe sau Block 5 | `campus_4` |
| Kiểu block chung (tường tím xám, kính, mái chìa) | `handbook-anh/2025-p02-45.png`, `campus_20`, `campus_24`–`26` |
| Cổng chính | **Chưa có ảnh cổng mới** — xem bên dưới |

## Tọa độ có sẵn (mét, hệ tọa độ trong `AGENTS.md`)

- Hai cầu (`layout.roads` kind `bridge`): `[123, -72.6] → [134.7, 38.4]` và `[106.8, -70.8] → [118.5, 40.1]`. Chạy Bắc–Nam từ Block 4 sang Block 3.
  **Người dùng xác nhận: cầu nằm ngay trên mặt hồ** (không bắc cao). Bỏ qua `layer=1` của OSM.
- Hồ nước: **thành hồ cao ~0.6 m so với mặt đất**, nằm dọc hai cầu giữa Block 4 và Block 3 — **không có trong OSM**,
  ước lượng theo ảnh + sơ đồ (3 hồ nối tiếp, cầu đi giữa). Nơi cầu cắt đường vào thì hồ ngắt, cầu thành lối đi có mái băng qua đường.
- Nhà xe sau Block 5 (`nha-xe-b5`): khung nền có sẵn. Thứ tự từ Block 5 đi về phía Bắc: **nhà xe → trạm điện → Fami Pizza**.
- Đường vào từ cổng: 4 làn song song tại x ≈ 274–280, z ≈ -54 → -3.
- Cổng chính (`cong-chinh`): khung tạm x 258→272, z -62→6.

## Được sửa / tạo

- `src/scene/kit/**` — mảnh dựng dùng lại, ví dụ: `BlockFacade` (tầng + cửa sổ + lam), `GlassCore` (mảng kính sảnh/cầu thang), `CoveredWalkway`, `RoofCanopy`.
- `src/scene/zone1/**` — `Pond.tsx`, `Bridges.tsx`, `ParkingShed.tsx`, `MainGate.tsx`, `Zone1.tsx` (ghép).
- `src/scene/Building.tsx` — cho phép tòa có `detailLevel === 2` dùng `kit/` (giữ tòa mức 1 như T02).
- `src/scene/Campus.tsx` — thêm `<Zone1/>`.

## KHÔNG được sửa

`src/data/**`, `src/types/**`, `src/store/**`, `scripts/**`, config gốc. Cần thêm trường dữ liệu (vd vị trí hồ) → **đề xuất trong báo cáo**.

## Yêu cầu chi tiết

1. **Mặt đứng block mức 2** (kit, dùng lại được cho B8–B11):
   - Chia tầng theo `floors` × `FLOOR_HEIGHT`; dải cửa sổ ngang mỗi tầng; lam che dọc/ngang trên hành lang ngoài.
   - Màu tường tím xám/nâu (`building.color`), viền sàn sáng hơn, mái chìa xám đậm.
   - Cửa sổ/lam dùng **instancing hoặc texture lặp tự vẽ bằng canvas** — không tạo hàng nghìn mesh riêng.
2. **Hồ nước + 2 cầu**: mặt nước xanh ngọc (vật liệu phẳng, có thể hơi phản chiếu), cầu sàn gỗ, cột đen, mái tôn xanh dương.
3. **Hành lang mái che**: khung đen, mái phủ màu xanh lá (dây leo), có tường bê tông đứng xen kẽ như ảnh.
4. **Nhà xe**: mái tôn răng cưa dài, cột thép, 1 tầng.
5. **Cổng chính — TẠM**: ảnh trong tour là **cổng cũ**, cổng mới chưa có ảnh. Dựng một khối đơn giản dạng **vòm cung thấp** (theo dấu vòng cung trên `references/diem-nhan/ve-tinh-khu-cong-2026.png`), để riêng trong `MainGate.tsx` cho dễ thay.
6. Thêm ít cây (dùng lại `Trees` instancing) và bồn cây dải phân cách trên đường vào như ảnh `campus`.

## Bẫy cần tránh

- Chi tiết nhiều → dễ tụt FPS. Mục tiêu khu vực 1 thêm **< 60 draw call**. Kiểm tra `renderer.info.render.calls` (log tạm, xóa trước khi báo xong).
- Khung nền B3 là chữ L, Block 4 lõm — mặt đứng phải bám theo từng cạnh của `shape.outer`, không giả định hình chữ nhật.
- Không đưa ảnh từ `references/` vào app (bản quyền EIU/iDTS) — chỉ nhìn để dựng.

## Tiêu chí xong

- [ ] `typecheck` / `lint` / `build` sạch, console sạch
- [ ] Đặt camera ở cổng nhìn vào: thấy Block 3 bên trái, Block 5 bên phải, quảng trường phía trước (khớp ảnh `campus`)
- [ ] Hồ + 2 cầu nằm giữa Block 4 và Block 3, khớp ảnh `campus_10`, `campus_11`
- [ ] Block 8–11 vẫn là khối mức 1, không bị ảnh hưởng
- [ ] ≥ 50 FPS desktop khi nhìn khu vực 1 (ghi số đo trong báo cáo)

## Mẫu báo cáo

```
File đã sửa/tạo:
Kết quả typecheck / lint / build:
Đã kiểm tra tay + FPS / draw call đo được:
Ảnh chụp màn hình (đường dẫn), mỗi ảnh ghi góc nhìn tương ứng ảnh 360 nào:
Chưa chắc / rủi ro:
Đề xuất:
```
