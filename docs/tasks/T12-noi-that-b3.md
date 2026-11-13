# T12 — Vào bên trong Block 3: sảnh, 3 tầng, thang máy, phòng học (bản thử theo tour 360)

- Người làm: **Gemini (Antigravity)**
- Worktree + nhánh: `t12-noi-that-b3`. `npm ci` trước; dev ở cổng **5174**.
- Phụ thuộc: **T05 và T11 đã gộp vào `main`** (T12 sửa `scene/walk/**` mà T11 đang làm). Claude giao khi hai luồng đó xong.
- Người dùng chốt 2026-11-14: **dựng theo ảnh tour 360**, chưa có sơ đồ thoát hiểm (sẽ bổ sung sau để chỉnh cho đúng).
  → Đây là **bản thử**: đúng tinh thần, đúng tên phòng, bố cục gần đúng; không cần chính xác từng mét.

## Mục tiêu (người dùng thấy gì)

1. Đang đi bộ, tới gần cửa chính Block 3 → hiện **"Nhấn E để vào Block 3"** (điện thoại: nút bấm). Vào → cảnh khuôn viên biến mất, nhân vật đứng trong **sảnh tầng 1**.
2. Đi lại trong tầng: sảnh kính, không gian chung, khu hội thảo, phòng họp, phòng học; tường chặn, không đi xuyên.
3. Tới **thang máy** → hiện bảng **Tầng 1 / 2 / 3** → chọn → màn hình tối nhẹ (fade) → nhân vật ra ở thang máy tầng đó.
4. Tới **cửa phòng** → thẻ thông tin phòng: mã + tên lấy từ dữ liệu (vd "104–105.B3 — Văn phòng Khoa QTKD & Honors Program"). Phòng mở cửa, đi vào xem được.
5. Tới **cửa chính** (tầng 1) → "Nhấn E để ra ngoài" → về khuôn viên, đứng ngay trước cửa Block 3.

## Đã có sẵn (Claude làm — KHÔNG sửa)

- `useWalkStore`: `interior` (`{ buildingId, floor } | null`), `enterInterior(buildingId)`, `setInteriorFloor(floor)`, `exitInterior()`.
  `exitWalkMode` / tắt đi bộ tự xóa `interior`.
- `Campus.tsx`: khi `interior !== null` → chỉ render `<InteriorScene/>` + `<WalkMode/>` (khuôn viên không render).
- Stub đã gắn sẵn: `src/scene/interior/InteriorScene.tsx`, `src/ui/interior/InteriorHud.tsx` (trong `App.tsx`).
- Dữ liệu phòng: `getBuildingDetail('b3')` → `floors[]` → `groups[].rooms[]` (`code`, `name`), `elevation`, `architecturalNote`. **Tên phòng lấy từ đây, không viết cứng.**
- `getBuilding('b3')`: `shape.outer` (khung nền chữ L, mét), `floors: 3`, `height`. `FLOOR_HEIGHT = 3.8`.

## Tài liệu tham khảo

- `references/tour-360/b3/` — **26 ảnh 360 bên trong Block 3**: `b3_0_*` = tầng 1 (17 ảnh), `b3_1_*` = tầng 2 (6), `b3_2_*` = tầng 3 (3).
  Xem nhanh: `_tang-1.jpg`, `_tang-2.jpg`, `_tang-3.jpg`. Mỗi ảnh có `-ngang.jpg` (4 hướng), `-tren.jpg`, `-duoi.jpg`.
- Menu của tour cho Block 3: Tầng 1 — Phòng Kết nối Cộng đồng, Khu vực hội thảo, Phòng họp, Phòng học Khoa QTKD; Tầng 2 — Hội trường, Phòng học Khoa QTKD; Tầng 3 — Phòng học Khoa QTKD.
- Thấy trong ảnh tầng 1: sảnh vách kính, không gian chung có bàn ghế + cây, khu hội thảo ghế xanh dương, phòng họp vách kính, hành lang ngoài có cột,
  **cầu thang nhiều màu**, phòng học lớn bàn dài, trần lộ kỹ thuật màu đen + đèn dải.
- Số liệu chính thức (`references/BAN-VE-TIM-DUOC.md`): hội trường 200.B3 ~1.065 m²; phòng chuẩn ~95 m²; lưới cột ~8 m.
- Cửa chính Block 3: mặt hướng về trục đường vào từ cổng (phía Bắc của B3, nhìn sang hồ nước) — xem ảnh 360 ngoài trời `campus_2`, `campus_3` (`references/tour-360/GHI-CHU.md`).

## Được sửa / tạo

- `src/scene/interior/**` (mới: cảnh nội thất, bố cục B3, tường, nội thất instancing...)
- `src/ui/interior/**` (gợi ý "Nhấn E", bảng chọn tầng, thẻ phòng, fade chuyển cảnh)
- `src/scene/walk/**` — chỉ để: (a) va chạm đọc **nguồn tường theo ngữ cảnh** (khuôn viên hoặc nội thất tầng hiện tại),
  (b) đặt vị trí nhân vật khi vào/ra/đổi tầng, (c) camera trong nhà (xem bẫy). Giữ nguyên điều khiển, animation của T09/T11.

## KHÔNG được sửa

`Campus.tsx`, `App.tsx`, `src/store/**`, `src/data/**`, `src/types/**`, `scene/CameraRig.tsx`, `kit/`, `zone1/`, `zone2/`, `ui/` ngoài `ui/interior/`.
Cần thêm trường dữ liệu (vd vị trí phòng) → đặt tạm trong `scene/interior/b3Layout.ts` (như `zone1/pondLayout.ts`) và ghi đề xuất chuyển sang `src/data/` trong báo cáo.

## Yêu cầu kỹ thuật

1. **Bố cục**: `scene/interior/b3Layout.ts` mô tả từng tầng bằng tọa độ **cùng hệ với khuôn viên** (bên trong `shape.outer` của B3):
   tường (đoạn thẳng + độ dày), cửa (khoảng trống trên tường), phòng (đa giác + `roomCode` khớp `getBuildingDetail('b3')`),
   thang máy, cầu thang (chỉ để nhìn), cửa chính. Bám theo khung chữ L; lưới cột ~8 m.
2. **Dựng hình**: sàn, tường cao `FLOOR_HEIGHT`, **không trần** (để camera nhìn được); vách kính trong suốt cho phòng họp/sảnh;
   bàn ghế, cây **instancing**; biển tên phòng nhỏ trên cửa (chữ từ dữ liệu). Mỗi tầng chỉ render tầng hiện tại. Ánh sáng trong nhà riêng (ấm, đủ sáng).
3. **Chuyển cảnh**: vào/ra/đổi tầng có fade ~0.4 s (lớp phủ DOM trong `ui/interior/`). Vị trí xuất hiện: vào → trong sảnh sau cửa chính; ra → ngoài cửa chính B3, quay mặt ra đường; đổi tầng → trước cửa thang máy.
4. **Phím**: `E` = tương tác (vào/ra/thang máy), `1/2/3` khi bảng thang máy mở; bỏ qua khi đang gõ trong ô nhập (như V/Esc). Điện thoại: nút bấm.
5. **Camera trong nhà**: không có trần nên đặt camera **cao hơn và chúc xuống nhiều hơn** ngoài trời (vd sau 6 m, cao 7 m); tường gần camera chắn tầm nhìn
   thì làm mờ (opacity) tường đó hoặc kéo camera lại gần — chọn cách đơn giản, ổn định.
6. Hiệu năng: nội thất một tầng < 80 draw call; không tạo object trong `useFrame`.

## Tiêu chí xong

- [ ] typecheck / lint / build sạch; console sạch
- [ ] Đi tới cửa Block 3 → "Nhấn E" → vào sảnh tầng 1; E ở cửa chính → ra đúng chỗ ngoài khuôn viên
- [ ] Không đi xuyên tường; vào được ít nhất 3 phòng tầng 1, thẻ phòng đúng mã + tên trong dữ liệu
- [ ] Thang máy: lên tầng 2 thấy Hội trường + phòng học; tầng 3 thấy phòng học; về tầng 1 được
- [ ] Esc / tắt đi bộ khi đang trong nhà → về toàn cảnh khuôn viên bình thường
- [ ] Điện thoại (DevTools cảm ứng): cần ảo + nút tương tác + bảng tầng dùng được
- [ ] Ảnh chụp mỗi tầng + 1 ảnh đặt cạnh ảnh 360 tương ứng để so tinh thần

## Báo cáo → `docs/tasks/T12-bao-cao.md` (file, kết quả 3 lệnh, kiểm tra tay, draw call, ảnh, chỗ đang đoán/chưa chắc, đề xuất)
