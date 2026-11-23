# FIX-NC — Sửa ngoại cảnh theo nhận xét của chủ dự án sau khi test bản gộp

- Người làm: Antigravity (Gemini)
- Nhánh: `PengWynIsMe/fix-ngoai-canh`
- Phụ thuộc: `b90da88` (main mới nhất)

## Mục tiêu

Khắc phục 3 vấn đề ngoại cảnh còn tồn đọng sau bản test gộp:
1. Đường, vỉa hè, bãi đỗ xe không còn bị nhô cao 0.45–0.75m lơ lửng trên không; hạ sát mặt đất (chênh 2–4 cm) với `polygonOffset` chuẩn, bó vỉa 12–15 cm đúng thực tế, không có khe hở bóng tối dưới đường.
2. Dây leo tại hành lang mái che, giàn vòm qua đường và Highlands không còn là các khối hộp đặc thô ráp; chuyển thành dải rèm lá rủ mềm mỏng với texture lá alpha sinh từ Canvas, đa sắc xanh tự nhiên, instancing / gộp nhẹ nhàng.
3. Đồng bộ hệ cây toàn trường theo STYLE-3D với 3 loại cây rõ ràng (cây tán tròn lớn, cây thân cao hàng đường, cây bụi thấp tầng) dùng InstancedMesh, thay thế các cây hình nón và cây bưởi cọc tre lẻ tẻ; rải đều đẹp mắt quanh các block và dọc đường mà không đè vào nhà hay lòng đường, giữ/giảm draw call.

## Được sửa

- `src/scene/groundLevels.ts`
- `src/scene/Ground.tsx`
- `src/scene/walk/groundHeight.ts`
- `src/scene/street/roadGeometry.ts`
- `src/scene/nature/CampusGreenery.tsx`
- `src/scene/zone1/Kiosks.tsx`
- `src/scene/zone1/Bridges.tsx`
- `src/scene/zone1/ParkingShed.tsx`
- `src/scene/Trees.tsx`
- Các component cây / ngoại cảnh liên quan trong `src/scene/**`

## KHÔNG được sửa

- `src/store/**`, `src/data/**`, `src/types/**`, config gốc.

## Nguyên nhân tìm được

1. **Đường lơ lửng:**
   - Trong `src/scene/groundLevels.ts`, các lớp được gán cao độ chênh nhau bậc thang 0.15m: `GROUND=0`, `GRASS=0.15`, `PARKING=0.30`, `STREET=0.45`, `INTERNAL=0.60`, `FOOTWAY=0.75`.
   - Do các dải ruy băng đường và lối đi bộ là mặt phẳng 2D không có cạnh bên kéo xuống đất, khi đặt ở Y = 0.45–0.75 m chúng tạo cảm giác các tấm ván bay lơ lửng cách mặt cỏ tới 30–60 cm.
   - Bó vỉa đặt `baseY: INTERNAL (0.60)` cao quá mức.
2. **Cây dây leo xấu:**
   - Trong `CampusGreenery.tsx`, `Kiosks.tsx`, và `Bridges.tsx`, dây leo và rèm rủ được ghép bằng `BoxGeometry` đặc dày 0.12–0.65m với màu xanh đơn sắc, trông như các khối xốp đặc màu xanh.
3. **Cây không thống nhất:**
   - `ParkingShed.tsx` tự dựng cây hình nón (`CylinderGeometry(0.8, 1.8, ...)`).
   - `CampusGreenery.tsx` tự dựng vườn cây bưởi/hồng xiêm với cọc tre 3 chân và quả bưởi chi tiết lẻ tẻ.
   - `Trees.tsx` chỉ có 1 loại cây đơn điệu + Salix alba ở B11, nhiều khu vực sân trường giữa các block còn trống trơn.

## Kế hoạch thực hiện từng mục

- **Mục 1 (Commit 1):** Sửa cao độ các lớp mặt đất trong `groundLevels.ts`, `Ground.tsx`, `groundHeight.ts`, `Pond.tsx`, `PondTerraces.tsx`. Hạ các lớp sát đất (GROUND=0, GRASS=0.02, PARKING=0.03, STREET/ROUNDABOUT_ROAD=0.04, INTERNAL=0.04, FOOTWAY=0.06), bó vỉa cao 12cm từ mặt đường (baseY=0.04, height=0.12). Kiểm tra WalkMode và tuyết.
- **Mục 2 (Commit 2):** Thay thế dây leo dạng khối hộp ở `CampusGreenery.tsx`, `Kiosks.tsx`, `Bridges.tsx` bằng hệ thống dải rèm quad lá leo alpha sinh bằng CanvasTexture, nhiều dải mềm mại, gió lay nhẹ, màu sắc tự nhiên.
- **Mục 3 (Commit 3):** Xây dựng hệ cây chung 3 loại (tán tròn lớn, thân cao hàng đường, cây bụi) trong `Trees.tsx` bằng `InstancedMesh`. Thay thế cây nón ở `ParkingShed.tsx` và cây bưởi cọc tre ở `CampusGreenery.tsx`. Phân bố hợp lý toàn trường, không đè nhà/đường. Đo lường draw call & triangles.

## Tiêu chí xong

- [ ] `npm run typecheck` 0 lỗi
- [ ] `npm run lint` 0 lỗi
- [ ] `npm run build` thành công
- [ ] Mặt đường, bãi xe, vỉa hè sát đất, bó vỉa 12–15cm, không hở gầm
- [ ] Dây leo mỏng nhẹ, tự nhiên, không khối hộp
- [ ] Cây cối đồng bộ, phân bố đều quanh trường, không mọc trong nhà/đường
