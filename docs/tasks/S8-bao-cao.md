# S8 — Phố xá: báo cáo (luồng C, Wave 2)

## File tạo (chỉ trong `src/scene/street/`)

- `StreetProps.tsx` — component mặc định `StreetProps`, dựng 6 mesh một lần (`useMemo`), không `useFrame`, không shadow, `raycast` tắt (click xuống Ground).
- `streetLayout.ts` — hàm thuần `buildStreetLayout()` tính vị trí mọi vật (chạy được trong Node). Dùng `buildGrassMask` (S3) làm bộ lọc "đất trống", `getGroundHeight` cho y.
- `streetGeometry.ts` — geometry gộp sẵn (đèn, ghế, thùng, xe máy, biển) + texture chữ "EIU" vẽ canvas.

## Dòng gắn vào `Campus.tsx` (Claude gắn)

```tsx
import StreetProps from './street/StreetProps';
...
<FallingLeaves />
<StreetProps />   // trong nhánh ngoài trời, cạnh <Grass />
```

Không cần thêm gì ở nhánh `inInterior` (nhánh đó đã ẩn cả khuôn viên).

## Số lượng + draw call

| Vật | Số lượng | Draw call |
| --- | --- | --- |
| Đèn đường (cột + cần) | 83 | 1 |
| Đèn đường (chụp đèn, emissive 0.35) | 83 | 1 |
| Ghế đá | 17 (11 quanh vòng xoay r = 86, 6 trước căn tin) | 1 |
| Thùng rác | 9 (cạnh mỗi 2 ghế: 6; đầu cầu: 3) | 1 |
| Xe máy (thân/bánh, đỏ/đen) | 400 (trần): nhà xe căn tin 204, nhà xe B5 177, nhà xe 2 tầng 19; 202 đen / 198 đỏ | 1 |
| Biển "EIU" (panel + 2 trụ, 1 texture) | 1 tại (248, −40) | 1 |
| **Tổng** | | **6** (≤ 8) |

## Kiểm tra vị trí (script Node ngoài repo)

Script: `/private/tmp/claude-501/-Users-dinhtrananhminh-Project-eiu-simulator/d87b7cf3-9735-49ca-98f0-e7ad12364ccf/scratchpad/check.ts` (esbuild bundle rồi `node`; không nằm trong `src/`). Kiểm tra độc lập (không dùng lại mask): khoảng cách tới tim mọi đường (đúng bề rộng từng loại + vòng xoay), điểm trong đa giác tòa nhà / cách mép < 0.3 m, hồ, ranh giới trường.

Kết quả: lamps/benches/bins/bike/sign đều **0** vật trên đường, **0** trong tòa nhà (xe máy được phép trong nhà xe, vẫn kiểm các tòa khác), **0** trong hồ, **0** ngoài ranh giới. Cột đèn cách tim đường nội bộ gần nhất 4.20 m (ngoài bó vỉa 3.5 m).

## Cách làm

- Đèn: mỗi đường `internal`, cách 25 m, xen kẽ hai bên, lệch 4.2 m, cần vươn về phía lòng đường; bỏ nếu ngoài ranh giới / không phải đất trống / cách đèn khác < 14 m (đường chồng nhau).
- Xe máy: xếp trong hệ trục chính của từng nhà xe (`computePrincipalAxis`), cách 0.8 m, hàng cách 2.2 m, lệch yaw ±6°. Hàng đặt GIỮA các hàng cột chống của mái (đúng vị trí cột trong `ParkingStructures.tsx` / `ParkingShed.tsx`) nên không xuyên cột. Quá 400 chỗ thì thưa đều bằng băm cố định (ổn định giữa các lần tải).
- Nhà xe 2 tầng (`nha-xe-2-tang`): chỉ tầng trệt hở phía trước dốc hầm (u < 10 m, trước gờ dốc) — phần dưới sàn tầng trên là khối "hầm" đặc nên không đặt; tầng trên không có xe.
- Biển: một geometry (panel 3 × 1.2 chữ hai mặt + hai trụ), mặt biển vuông góc với đường nội bộ vào cổng, nhìn được từ cả hai hướng.

## Điểm chưa chắc

1. Ghế vòng xoay: 11/12 (thiếu 1 ở góc ~ −45°, bị đường nội bộ/đường 8 chiếm cả 3 thử bán kính 86/87.5/89). Sửa bằng cách đổi góc nếu muốn đủ 12.
2. Vị trí cột chống của nhà xe B5 lấy theo công thức trong `ParkingShed.tsx` (6 × 6, đã xoay) và quy về trục chính; sai số ~0.3 m. Cần nhìn thực tế xem xe có chạm cột không.
3. Chưa mở trình duyệt xem (không có công cụ trình duyệt trong luồng này). Cần kiểm: hướng cần đèn (về phía lòng đường), hướng ghế (quay vào tâm vòng xoay / ra phía lối đi trước căn tin), chữ biển EIU không bị ngược, xe máy nằm đúng trên nền nhà xe (nhà xe căn tin: footprint tòa lớn hơn polygon `layout.parking` nên một số xe ở y = 0.15 chứ không phải 0.3; sàn bê tông thật ở 0.16 nên khớp).
4. Không tránh cây (`Trees.tsx`) — có thể một vài cột đèn/ghế trùng thân cây.
5. Xe máy nhà xe căn tin/B5 dùng `getGroundHeight` nên nền 0.3 (bãi) hoặc 0.15 (ngoài polygon bãi nhưng trong footprint nhà xe): chênh ≤ 0.15 m, không đáng kể nhưng có thể thấy bánh lún nhẹ.
6. Chụp đèn dùng emissive hằng (0.35); chưa gắn với ban đêm/ban ngày vì không có hệ giờ trong luồng này.

## Kiểm tra lệnh

`npm run typecheck`, `npm run lint`, `npm run build`: sạch.
