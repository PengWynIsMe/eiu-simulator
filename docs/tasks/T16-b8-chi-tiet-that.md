# T16 — B8 nội thất "như ảnh thật": đủ 4 tầng, cột kem, lam, lan can, sân vườn

Người giao: Claude · Người làm: Antigravity (Gemini 4 Hydrogen) · Nhánh: `t16-b8-chi-tiet`

## Mục tiêu

Đứng trong B8 (sau vai hoặc góc nhìn thứ nhất) phải **giống ảnh thật**: nhìn lên thấy đủ tầng 2–4 quanh sân trong,
hàng cột kem, dầm biên, lam che nắng trắng có khung, lan can inox trên gờ bê tông, viền sàn xanh dương, trần trắng có đèn tròn,
sân vườn có cây cao với giàn chống thép và thảm lan ý. Tất cả **dựng theo bảng số dưới đây**, không tự đoán từ ảnh.

## Học theo B11 (bắt buộc đọc trước khi code)

B11 do đồng nghiệp làm là **mẫu chuẩn**. Đọc kỹ, chép cách làm (không import, không sửa file B11):

| Đọc | Học gì |
| --- | --- |
| `src/scene/interior/B11Furniture.tsx` dòng 288–520 | Vòng `for f = 1..4` với `dy = (f - floor) * FLOOR_HEIGHT` để dựng kết cấu **mọi tầng**; ẩn tầng trên khi `!showUpperFloors`. Gom ma trận theo **thùng vật liệu** (`creamColumns`, `whiteLouvers`, `steelParts`...) rồi render bằng `InstancedBatch`. |
| cùng file: `addFramedLouverBay`, `addRailingSegment`, `InstancedBatch` | Chép sang file B8 (đổi tên hàm nếu cần), dùng cho B8. |
| `src/scene/interior/InteriorScene.tsx` khối `multiFloorB11` (≈ dòng 246–372) | Dựng sàn + tường các tầng khác qua API `layout.getFloorBoundaryPts/getFloorHoles/getFloorWalls` + mái chìa. |

## File được sửa / tạo

- **Tạo** `src/scene/interior/B8Furniture.tsx`: chuyển toàn bộ `B8Furniture` + helper của nó từ `InteriorFurniture.tsx` sang đây (giống B11). `InteriorFurniture.tsx` chỉ còn import và truyền `showUpperFloors` cho B8 như B11.
- `src/scene/interior/layouts/b8.ts`: thêm **hằng số dữ liệu** ở mục "Bảng số" (export), không đổi phòng / tường / va chạm hiện có.
- `src/scene/interior/InteriorScene.tsx`: **chỉ** (a) cho khối nhiều tầng chạy cả B8 (`isB11` → `isB11 || isB8` ở phần sàn + tường các tầng khác; mái B8 làm nhánh riêng theo bảng), (b) xóa khối "2c. Vách sân trong B8" (không cần nữa khi đã có tầng dưới thật). Không đụng nhánh B11/B3 khác.
- `docs/tasks/T16-bao-cao.md` (báo cáo).

**KHÔNG sửa**: `B11Furniture.tsx`, `layouts/b11.ts`, `zone2/Block11Details.tsx`, `src/store`, `src/data`, `src/types`, `src/scene/walk/**`, `src/ui/**`, `package.json`. Không cài thêm thư viện. Không commit.

## Bảng số (tọa độ địa phương B8: u = Tây→Đông, v = Bắc→Nam, mét; `FLOOR_HEIGHT = 3.8`)

Hành lang mở chạy giữa tường phòng và mép giếng trời. Tường phòng: Bắc `v = -200.0`, Nam `v = -177.7`.

### A. Mép giếng trời (đã có trong `getFloorHoles`)

| Sân | u | v Bắc | v Nam | Ghi chú |
| --- | --- | --- | --- | --- |
| Tây | 13.5 → 50.0 | -197.0 | -180.1 | chữ nhật |
| Đông | 54.1 → 114.9 | -196.5 | -179.6 | khuyết thang máy (u 54.1–58.2, v -190.2…-186.5) và lõi thang Đông (u 106.9–114.9, v -190.3…-184.8) |

Export thành `B8_WEST_HOLE_UV`, `B8_EAST_HOLE_UV` (mảng `[u, v]` như B11) và cho `getFloorHoles` dùng lại.

### B. Kết cấu lặp **mọi tầng 1–4** (ảnh 3719, 3728, 3729, 3734)

| Chi tiết | Vị trí | Kích thước (m) | Màu |
| --- | --- | --- | --- |
| Cột vuông | Tây: u = 13.75, 22.75, 31.75, 40.75, 49.75 tại v = -197.25 và -179.85. Đông: u = 54.35 + i·7.5375 (i = 0…8) tại v = -196.75 và -179.35 | 0.5 × 0.5, cao 3.8 | kem `#d6cec2` |
| Dầm biên (mặt giếng trời) | chạy dọc 4 mép mỗi sân, sát mép lỗ | cao 0.45 (y 3.35→3.8), dày 0.3 | kem `#d6cec2` |
| Dầm ngang trần hành lang | tại mỗi u cột, nối từ cột sang tường phòng | rộng 0.3, cao 0.35 (y 3.45→3.8) | kem `#d6cec2` |
| Lam che nắng có khung | mỗi khoảng giữa 2 cột liền kề, trên 2 mép dài Bắc/Nam mỗi sân | tấm cao 0.9 (y 2.45→3.35), 6 lá nghiêng 35°, khung 0.05 | trắng `#f1f3f4` |
| Đèn trần tròn | dọc tim hành lang, cách 3.0 m: Tây v = -198.5 / -178.9, Đông v = -198.25 / -178.65 | trụ Ø0.2, cao 0.06, y = 3.74 | `#fefce8`, emissive nhẹ |
| Thùng rác inox | cạnh mỗi cột thứ 2, lệch 0.5 m về phía tường phòng | trụ Ø0.36, cao 0.75 | inox `#cbd5e1` metalness 0.8 |

Tầng 1 cũng có cột, dầm, lam, đèn (ảnh 3719: tầng trệt có lam phía trên cửa mở ra sân).

### C. Chỉ tầng 2–4

| Chi tiết | Vị trí | Kích thước (m) | Màu |
| --- | --- | --- | --- |
| Gờ bê tông chân lan can | trên mép lỗ | cao 0.15, rộng 0.2 | kem `#d6cec2` |
| Lan can inox | trên gờ, theo mép lỗ (cả đoạn khuyết thang máy / thang Đông) | trụ 0.04 cách 1.8 m, cao 1.1 tính từ sàn; 4 thanh ngang ở y 0.30 / 0.55 / 0.80 / 1.10 | `#cbd5e1` metalness 0.9 |
| Dải sàn xanh dương | sát gờ, phía hành lang | rộng 0.6, dày 0.01 (y 0.005) | `#2f7fc1` roughness 0.4 |
| Sàn hành lang mở | phần sàn giữa tường phòng và mép lỗ | — | bê tông mài `#a3a8ad` (nếu sàn chung không tách được thì bỏ qua) |

Lưu ý: code cũ T15a có lan can 3 thanh và viền xanh 0.35 m. **Thay hẳn** bằng bảng này, không để trùng.

### D. Trang thiết bị trên tường hành lang, mọi tầng (ảnh 3716, 3718)

Export `B8_PCCC_POINTS` và `B8_EXIT_SIGNS`.

| Chi tiết | Điểm đặt (u, v, mặt hướng) | Kích thước (m) |
| --- | --- | --- |
| Tủ PCCC đỏ `#dc2626` + bảng "PCCC" | (14.6, -199.9, hướng +v), (50.2, -199.9, +v), (15.0, -177.8, −v), (50.2, -177.8, −v) | 0.6 × 0.8 × 0.2, đáy y 1.0 |
| Kệ bình chữa cháy | ngay dưới-phải tủ, lệch u +0.7 | kệ đỏ 0.4 × 0.3 × 0.15 + 2 bình trụ Ø0.16 cao 0.5 |
| Sơ đồ thoát hiểm | lệch u −0.8 so với tủ, tâm y 1.5 | bảng trắng 0.6 × 0.45 × 0.02 |
| Biển EXIT xanh `#16a34a` emissive | treo giữa hành lang trước mỗi thang: (11.05, -198.5), (51.9, -198.5), (11.6, -178.9), (51.85, -178.9), (110.0, -188.0) | 0.4 × 0.15 × 0.03, y = 2.9, 2 dây treo Ø0.01 lên trần |

### E. Mặt tường phòng phía hành lang, mọi tầng (ảnh 3729, 3732)

Trên mỗi đoạn tường phòng giữa 2 cửa (`getFloorDoors`) dài ≥ 3.0 m, gắn một **dải cửa sổ giả** sát mặt tường phía hành lang (lồi 0.02):
khung nhôm `#9ca3af`, kính `#9fb8c8` opacity 0.55, y 1.0→2.4, cách 2 đầu đoạn 0.6 m, có đố đứng mỗi 1.2 m.
Không đổi tường / va chạm.

### F. Sân vườn tầng trệt (ảnh 3711, 3719)

Nền sân vẫn ở `groundY = -(floor - 1) * FLOOR_HEIGHT`. Giữ vị trí bồn và cây của T15a, chỉ đổi cách dựng:

| Chi tiết | Kích thước (m) | Màu |
| --- | --- | --- |
| Nền lát đá | phủ cả sân | `#a8abad` |
| Gờ bồn cây (thay viền bê tông 0.4 m) | cao 0.15, dày 0.15 | đá tối `#3f3f46` |
| Thảm lan ý trong bồn | cao 0.45 | `#2f5d34` |
| Hoa trắng | hộp 0.08, rải đều ~1 bông / 0.8 m² trong bồn (dùng hàm giả-ngẫu-nhiên cố định seed, KHÔNG dùng `Math.random`) | `#f8fafc` |
| Thân cây | Ø0.35, từ nền lên 13.0 m | `#4a3a2e` |
| Tán cây | 3 khối icosahedron chồng lệch nhau, mỗi khối Ø4–6, tâm y 9.5 / 11.5 / 13.0 so với nền sân | `#3f7d3a` / `#4f8f45` |
| Giàn chống thép 4 chân | 4 ống Ø0.08 từ nền (cách gốc 1.2 m, 4 hướng) chụm vào thân ở cao 3.0 m | `#9ca3af` metalness 0.7 |

### G. Mái chìa B8 (trong `InteriorScene`, nhánh B8 của khối nhiều tầng)

- Chỉ khi `!isTopDown`. Đặt ở `roofY = (layout.floors + 1 - floor) * FLOOR_HEIGHT`, dày 0.34.
- Viền ngoài = `getFloorBoundaryPts()` nới thêm 1.0 m mọi phía (dùng 4 góc u 8.0…121.4, v -211.2…-165.0 cho khối chính là đủ).
- Lỗ mái: sân Tây u 14.7…48.8, v -195.8…-181.3. Sân Đông u 55.3…113.7, v -195.3…-180.8 (thu vào 1.2 m so với lỗ sàn).

## Hiệu năng

Mọi chi tiết lặp dùng `instancedMesh` / `InstancedBatch`, gom theo vật liệu như B11. Không tạo mesh rời trong vòng lặp.
Mục tiêu: không tụt FPS rõ so với hiện tại.

## Tự kiểm tra (bắt buộc, ghi kết quả vào báo cáo)

1. `npm run typecheck`, `npm run lint`, `npm run build` đều sạch.
2. `npm run dev`, mở trình duyệt. Vào B8 nhanh bằng console:
   ```js
   const m = await import('/src/store/useWalkStore.ts');
   m.useWalkStore.getState().toggleWalkMode();
   setTimeout(() => m.useWalkStore.getState().enterInterior('b8'), 1500);
   // đổi tầng: m.useWalkStore.getState().setInteriorFloor(3)
   ```
   Phím C: sau vai → góc nhìn thứ nhất → từ trên xuống.
3. Chụp và đính kèm (lưu `docs/tasks/T16-anh/`): (a) tầng 1 sân Tây nhìn lên, (b) tầng 3 hành lang mở Bắc nhìn dọc,
   (c) tầng 3 nhìn xuống sân Đông, (d) top-down tầng 2, (e) B11 tầng 1 và B3 tầng 1 để chứng minh không hỏng.
4. Console không lỗi đỏ. Top-down vẫn nhìn rõ phòng (tầng trên + mái phải ẩn).

## Báo cáo

`docs/tasks/T16-bao-cao.md`: file đã sửa, kết quả lệnh, ảnh, những mục trong bảng chưa làm được và lý do.
