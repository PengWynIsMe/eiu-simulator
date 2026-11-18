# T17 — B8: thấy sân vườn từ bản đồ + nhân vật leo cầu thang thật + sửa HUD đè nhau

Người giao: Claude · Người làm: Antigravity (Gemini 4 Hydrogen High) · Nhánh: nối tiếp `t16-b8-chi-tiet` (đã có T16)

Đọc `AGENTS.md` trước. Không commit, không push, không cài gói.

---

## Việc 1 — Sân vườn B8 nhìn từ bản đồ (chưa vào đi bộ)

**Hiện tại:** B11 nhìn từ bản đồ thấy cây, bồn, lam trong sân. B8 chỉ thấy khi vào nội thất.
**Mẫu chuẩn:** `src/scene/zone2/Block11Details.tsx` (đồng nghiệp làm), được gắn trong `Zone2Walkways.tsx`. Đọc kỹ: gộp geometry theo vật liệu bằng `safeMerge`, `makeOrientedBox`, cách lấy cao độ nền.

**Làm:**
1. Trong `src/scene/interior/layouts/b8.ts` export dữ liệu dùng chung (chuyển từ `B8Furniture.tsx` ra, rồi cho `B8Furniture` import lại, không đổi giá trị):
   - `B8_PLANTERS` (8 bồn: `centerU, lenU, centerV, widthV`, đang ở `B8Furniture.tsx` ≈ dòng 507–514)
   - `B8_TREE_UV` (8 cây, ≈ dòng 545–553)
2. Tạo `src/scene/details/Block8Details.tsx` (ngoại thất, tọa độ thế giới = `toWorld(u, v)` của B8 vì `B8_ORIGIN = [0, 0]`). Gắn vào `src/scene/Campus.tsx` ngay sau `<Zone2Walkways />` (sửa đúng 2 dòng: import + thẻ).
   Dựng theo mẫu Block11Details:

| Chi tiết | Số liệu |
| --- | --- |
| Nền đá sân | phủ 2 lỗ sân `B8_WEST_HOLE_UV`, `B8_EAST_HOLE_UV`, dày 0.04, `#a8abad` |
| Bồn cây | theo `B8_PLANTERS`: gờ đá tối cao 0.15 `#3f3f46`, thảm lan ý cao 0.45 `#2f5d34`, hoa trắng hộp 0.08 rải PRNG seed cố định |
| Cây | theo `B8_TREE_UV`: thân Ø0.35 cao 13.0, 3 khối tán icosahedron như T16, giàn chống 4 chân |
| Lam trắng + dải xanh mép sàn | trên 2 mép dài Bắc/Nam mỗi sân, mỗi tầng 2–4: lam tấm cao 0.9 ở y = tầng·3.8 − 1.35; dải xanh `#2f7fc1` cao 0.14 ở mép sàn mỗi tầng 2–4 |

   **Cao độ nền:** lấy giống cách Block11Details làm cho B11 (đọc code, cùng một quy ước). Kiểm tra bằng mắt: gốc cây chạm nền sân, không lơ lửng, không chìm.
3. Hiệu năng: mọi phần gộp thành ≤ 10 mesh (mỗi vật liệu 1 mesh), như Block11Details.

---

## Việc 2 — Nhân vật đi bộ lên/xuống cầu thang bộ B8 (không teleport)

**Hiện tại:** đứng trong ô thang, bấm E/Q để đổi tầng (T15b). **Muốn:** đi thẳng lên bậc, nhân vật cao dần, lên tới tầng trên thì tự đổi tầng.
Giữ E/Q cho **thang máy**. Với thang bộ B8, bỏ gợi ý E/Q (giữ code cũ cho tòa khác nếu đang dùng chung).

### Dữ liệu (đã có trong `B8Furniture.tsx` ≈ dòng 584–598, chuyển sang `layouts/b8.ts` export `B8_STAIRS` + hằng số)

```
RISE = 3.8 / 24, TREAD = 0.28, FLIGHT_W = 1.3, GAP = 0.2, LANDING_DEPTH = 1.3
RUN = 12 * TREAD = 3.36           // chiều dài mỗi vế
B8_STAIRS = [
  { axis: 'v', corridorEdge: -200.0, dir: -1, centerCross: 11.05 },   // Tây Bắc
  { axis: 'v', corridorEdge: -200.0, dir: -1, centerCross: 51.9 },    // Giữa Bắc
  { axis: 'v', corridorEdge: -177.7, dir:  1, centerCross: 11.6 },    // Tây Nam
  { axis: 'v', corridorEdge: -177.7, dir:  1, centerCross: 51.85 },   // Giữa Nam
  { axis: 'u', corridorEdge: 114.5,  dir: -1, centerCross: -187.55 }, // Lõi Đông
]
```
Vế 1 (đi lên từ hành lang) ở phía `cross > 0`, vế 2 (quay về hành lang) ở phía `cross < 0`, chiếu nghỉ ở cuối (y 1.9). Thang có ở tầng 1–3 (tầng 4 không có vế đi lên).

### Hàm độ cao (viết trong `layouts/b8.ts`, export)

Với điểm (u, v):
- `main = isV ? v : u`, `crossC = isV ? u : v`
- `along = (main - corridorEdge) * dir`, `cross = crossC - centerCross`
- Ngoài ô thang nếu `along < 0 || along > RUN + LANDING_DEPTH || |cross| > FLIGHT_W + GAP/2` → trả `null`
- `along >= RUN` → `h = 1.9` (chiếu nghỉ)
- `cross >= 0` → `h = along / RUN * 1.9` (vế 1)
- `cross < 0` → `h = 1.9 + (RUN - along) / RUN * 1.9` (vế 2)

`h` là độ cao **so với sàn của tầng thang bắt đầu**. Dùng dốc liên tục, không cần nhảy từng bậc.

### Cập nhật trong `WalkMode.tsx` (mỗi frame, chỉ khi `interior.buildingId === 'b8'`)

Gọi `y` là `player.current[1]` (so với sàn tầng hiện tại `F`):
1. `h = stairHeight(u, v)`. Nếu `null` thì `y → 0` như cũ.
2. Hai ứng viên: `up = h` (chỉ khi `F <= 3`), `down = h - 3.8` (chỉ khi `F >= 2`). Chọn ứng viên **gần `y` nhất**. Cho `y` lerp nhanh về ứng viên đó (≈ `1 - exp(-20·dt)`).
3. Đổi tầng có **trễ** (hysteresis) để không nhấp nháy:
   - `y > 2.0` → `setInteriorFloor(F + 1)`, `y -= 3.8`
   - `y < -2.0` → `setInteriorFloor(F - 1)`, `y += 3.8`
   Khi đổi tầng kiểu này **không** dùng fade / teleport của T15b. Giữ nguyên vị trí (u, v) và hướng nhìn.
4. Camera sau vai, FPS và robot đều dùng `y` này (T15b đã đặt mắt ở `y + 1.6`). Nhân vật phải đứng trên mặt bậc, không xuyên bậc quá 0.1 m.

Thêm vào `src/scene/interior/types.ts` một trường **tùy chọn** `getStairHeight?: (u: number, v: number) => number | null` trên `InteriorLayout`, gán cho `b8Layout`. WalkMode gọi qua `layout.getStairHeight` (B11 / B3 chưa có thì bỏ qua). **Không sửa** `layouts/b11.ts`, `B11Furniture.tsx`.

---

## Việc 3 — HUD đè nhau

Trong nội thất, ở đáy màn hình có 2 dải hướng dẫn chồng lên nhau ("Đổi góc nhìn · Kéo chuột..." của `InteriorHud` và "… · C: đổi góc nhìn" của `WalkHud`).
Sửa: trong nội thất chỉ hiện **một** dải (gộp nội dung), không đè lên nút tương tác giữa màn hình. Sửa trong `src/ui/interior/InteriorHud.tsx` / `src/ui/walk/WalkHud.tsx`.

---

## File được sửa

`src/scene/interior/layouts/b8.ts`, `src/scene/interior/B8Furniture.tsx`, `src/scene/interior/types.ts` (chỉ thêm trường tùy chọn),
`src/scene/details/Block8Details.tsx` (mới), `src/scene/Campus.tsx` (2 dòng), `src/scene/walk/WalkMode.tsx`,
`src/ui/interior/InteriorHud.tsx`, `src/ui/walk/WalkHud.tsx`, `docs/tasks/T17-bao-cao.md`, `docs/tasks/T17-anh/`.

**KHÔNG sửa:** `B11Furniture.tsx`, `layouts/b11.ts`, `zone2/Block11Details.tsx`, `kit/TwinWingBlock.tsx`, `src/store`, `src/data`, `src/types`, `package.json`.

## Tự kiểm tra (bắt buộc)

1. `npm run typecheck`, `npm run lint`, `npm run build` sạch.
2. Trình duyệt (`npm run dev`), vào B8 nhanh qua console:
   ```js
   const m = await import('/src/store/useWalkStore.ts');
   m.useWalkStore.getState().toggleWalkMode();
   setTimeout(() => m.useWalkStore.getState().enterInterior('b8'), 1500);
   ```
3. Kiểm tra leo thang **bằng mô phỏng phím W/A/S/D** (giữ phím qua CDP / `keydown`–`keyup`): tầng 1 → đi lên thang Giữa Bắc → tới tầng 2 (HUD báo tầng 2) → đi xuống lại tầng 1. Ghi log `floor` + `y` theo thời gian vào báo cáo. Thử thêm thang Lõi Đông.
4. Ảnh lưu `docs/tasks/T17-anh/`: (a) bản đồ nhìn xiên thấy cây trong sân B8, cạnh B11 để so; (b) robot đứng giữa vế thang; (c) tới chiếu nghỉ; (d) HUD chỉ còn một dải; (e) B11 và B3 vẫn bình thường.
5. Console không lỗi đỏ.

## Báo cáo

`docs/tasks/T17-bao-cao.md`: file đã sửa, kết quả lệnh, log leo thang, ảnh, phần chưa làm được và lý do.

---

## Việc 4 (bổ sung) — Cầu thang B8 dùng kiểu dáng thang B11

Người dùng thích thang B11 của đồng nghiệp. **Chép kiểu dáng, giữ số đo B8.**

1. Chép `addSwitchbackFlight` + `makeRampSlabMatrix` + `makeTiltedBoxMatrix` từ `B11Furniture.tsx` (dòng ≈ 28–147) sang `B8Furniture.tsx`.
   Đổi `b11ToWorld` thành tham số `toWorld` truyền vào. Ghi chú đầu hàm: `// Chép từ B11Furniture.tsx (đồng nghiệp) — kiểu thang chữ U`. **Không sửa file B11.**
2. Thay phần dựng thang hiện tại của B8 (`// 4. Cầu thang bộ gấp 2 đoạn` trong `B8Furniture.tsx`) bằng 2 lần gọi `addSwitchbackFlight` cho mỗi buồng thang trong `B8_STAIRS`, mỗi tầng 1–3:
   - Vế 1: từ `along = 0` tới `along = RUN` ở `cross = +(GAP/2 + FLIGHT_W/2)`, y `dy → dy + 1.9`, rộng `FLIGHT_W`, 12 bậc.
   - Vế 2: từ `along = RUN` về `along = 0` ở `cross = -(GAP/2 + FLIGHT_W/2)`, y `dy + 1.9 → dy + 3.8`, rộng `FLIGHT_W`, 12 bậc.
   - Chiếu nghỉ giữ như cũ (`along RUN → RUN + LANDING_DEPTH`, mặt trên y 1.9) nhưng đổi sang màu đá đen như bậc.
   - Đổi (u, v) theo `axis` như hàm độ cao ở Việc 2.
3. Vật liệu giống B11: mặt bậc + chiếu nghỉ đá đen `#1e293b` (metalness 0.4, roughness 0.45), gầm thang bê tông như dầm trần, tay vịn inox như lan can B8 (metalness 0.35, roughness 0.3).
4. **Không đổi** RISE / RUN / chiếu nghỉ 1.9: hàm độ cao leo thang (Việc 2) phải khớp mặt bậc. Kiểm tra: robot đứng trên vế thang không xuyên bậc quá 0.1 m.
5. Ảnh thêm: (f) cận cảnh thang B8 sau khi đổi, (g) thang B11 cùng góc để so.
