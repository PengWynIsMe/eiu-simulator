# TONG-HOP-2 — báo cáo gộp fix-noi-that + fix-ngoai-canh (2026-11-23)

Nhánh `PengWynIsMe/tong-hop-2` (từ main `b90da88`). Chưa push, chưa PR, chưa vào main. Dev: `http://localhost:5181/`.

## Đã làm
1. `git merge --no-ff PengWynIsMe/fix-noi-that` (cầu thang B3/B8/B11, 10 phòng máy T4 B8) → typecheck sạch.
2. `git merge --no-ff PengWynIsMe/fix-ngoai-canh` (đường/vỉa hè sát đất, dây leo rèm lá, 3 loại cây, bỏ cỏ trên mặt lát, near 0.35 + polygonOffset mặt đất ngoài trời, bỏ log depth) → typecheck sạch.
3. Cảnh mở đầu "Tuyết rơi ở EIU" chỉ tự chạy lần đầu trong phiên tab (`sessionStorage` khóa `eiu-snow-intro-seen`, bọc try/catch; `src/store/useSnowStore.ts`). Nút "Xem lại cảnh tuyết" vẫn mở lại; tuyết vẫn bật mặc định.

## Xung đột đã giải
**Không có xung đột văn bản**: git tự gộp `WalkMode.tsx` và `HANDOFF.md` (hai nhánh sửa vùng khác nhau, giữ cả hai ý). Đã kiểm tra: không còn `polygonOffset` cho sàn nội thất (`INTERIOR_FLOOR_POLYGON_OFFSET` không quay lại); polygonOffset còn lại chỉ ở mặt đất/ngoại cảnh (`Ground.tsx`, `ParkingStructures`, chi tiết B8) và prop tùy chọn của `B8Furniture`.

## Kết quả kiểm tra
- `npm run typecheck`, `npm run lint`, `npm run build`, `node scripts/ctdt/check.mjs`: đều sạch.
- Chụp bằng Chrome headless (swiftshader, 1280×720), xem ảnh: phòng máy T4 B8, hành lang dây leo (rèm lá rủ, không cỏ trên nền lát), đường/vỉa hè sát đất, tuyết rơi trước tòa nhà, sảnh B8/B3 trong nhà đều hiển thị bình thường, không z-fighting rõ.
- Cầu thang: đo bằng `layout.stepStairHeight` đi dọc thang tầng 1 → B3 lên 3.8 m, B8 lên 1.9 m (chiếu nghỉ), B11 lên 2.24 m (chiếu nghỉ): leo được.
- Cảnh mở đầu: lần tải đầu `isCinematicActive=true`; tải lại cùng tab → `false`, `isSnowing` vẫn `true`.
- renderer.info (frame hiện tại, headless):

| Góc | draw calls | triangles |
|---|---|---|
| Phòng máy 406.B8 (T4) | 87 | 251 501 |
| Hành lang dây leo | 122 | 350 024 |
| Đường sát đất (tầm mắt) | 104 | 320 600 |
| Tuyết trước tòa nhà | 107 | 250 947 |
| Toàn cảnh tuyết xa | 35 | 137 316 |
| B8 sảnh T1 / B11 / B3 trong nhà | 59 / 35 / 34 | 135k / 119k / 4k |

## CHO CHỦ DỰ ÁN THỬ
1. Vào B3, B8, B11 → đi lên cầu thang: chân bậc không bị chìm, không nhấp nháy, trời ngoài cửa sổ B8/B11 xanh.
2. B8 tầng 4: vào các phòng máy 402–420, kiểm tra bàn/máy/bảng/biển phòng; đổi VI/EN.
3. Hành lang mái che có dây leo: rèm lá, nền lát không có cỏ mọc xuyên.
4. Đường/vỉa hè: đi sát mặt đất, không lơ lửng, không nhấp nháy ở xa.
5. Cây (3 loại), lá rơi, tuyết trước tòa nhà; góc nhìn thứ nhất (phím C) không bị cắt cận.
6. Tải lại trang khi đang trong nhà: không còn cảnh tuyết mở đầu; nút "Xem lại cảnh tuyết" vẫn chạy.
7. Điện thoại: mượt không (near plane/depth mới).

## Vấn đề còn lại
- Chưa tự mô phỏng được đi bộ lên thang bằng phím trong headless (hướng nhìn không nhận qua sự kiện), nên thang chỉ kiểm bằng hàm độ cao; chủ dự án nên đi tay.
- Góc B3/B11 thang chụp chưa đúng khung; chưa so ảnh trước/sau.
- Số draw call đo ở headless/swiftshader, không đại diện FPS thật.
