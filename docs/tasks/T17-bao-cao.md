# Báo cáo hoàn thành Task T17 — B8 sân vườn nhìn từ bản đồ, leo cầu thang thật, gộp HUD, thang kiểu B11

- **Người thực hiện:** Antigravity (Gemini 4 Hydrogen High)
- **Nhánh / Worktree:** `t16-b8-chi-tiet` (nối tiếp T16)
- **Ngày hoàn thành:** 18/11/2026
- **Trạng thái:** Hoàn tất đầy đủ Việc 1–4, chưa commit/push.

---

## 1. File đã sửa / tạo

1. `src/scene/interior/layouts/b8.ts`:
   - Export `B8_PLANTERS`, `B8_TREE_UV` (dùng chung giữa `B8Furniture.tsx` và `Block8Details.tsx`, giữ nguyên số liệu T16 và giữ nguyên `u: 16.2` cho `B8_PCCC_POINTS`).
   - Export hằng số thang (`B8_STAIR_RISE`, `B8_STAIR_TREAD`, `B8_STAIR_FLIGHT_W`, `B8_STAIR_GAP`, `B8_STAIR_LANDING_DEPTH`, `B8_STAIR_RUN`), danh sách 5 buồng thang `B8_STAIRS`, và hàm `getB8StairHeight(u, v)` tính mặt dốc liên tục cho vế 1 (`0 → 1.9 m`), chiếu nghỉ (`1.9 m`), vế 2 (`1.9 → 3.8 m`).
   - Gắn `getStairHeight: getB8StairHeight` vào `b8Layout`.

2. `src/scene/interior/types.ts`:
   - Thêm trường tùy chọn `getStairHeight?: (u: number, v: number) => number | null` vào `InteriorLayout`.

3. `src/scene/details/Block8Details.tsx` (**tạo mới**):
   - Dựng ngoại thất sân vườn B8 nhìn từ bản đồ theo mẫu `Block11Details.tsx` (10 mesh gộp `safeMerge`, mặt nền trên ở `0.19 m` khớp quy ước B11):
     - Nền đá `#a8abad` dày `0.04 m` phủ đúng 2 đa giác lỗ `B8_WEST_HOLE_UV` và `B8_EAST_HOLE_UV`.
     - 8 bồn cây theo `B8_PLANTERS`: gờ đá tối `#3f3f46` cao `0.15 m`, thảm lan ý `#2f5d34` cao `0.45 m`, hoa trắng hộp `0.08 m` `#f8fafc` rải PRNG cố định seed `202608`.
     - 8 cây theo `B8_TREE_UV`: thân `Ø0.35` cao `13.0 m`, 3 khối tán icosahedron, giàn chống thép 4 chân `Ø0.08`.
     - Lam trắng khung 4 lá cao `0.9 m` ở `y = fl * 3.8 - 1.35` và dải xanh `#2f7fc1` cao `0.14 m` ở mép sàn mỗi tầng `2–4` trên 2 mép dài Bắc/Nam mỗi sân.
   - Lưu ý: dùng `B8_WORLD_YAW = Math.atan2(-B8_EX[1], B8_EX[0])` (`+0.2286 rad`) khớp với `toWorld(u, v)` của B8.

4. `src/scene/Campus.tsx`:
   - Thêm đúng 2 dòng: import `Block8Details` và gắn `<Block8Details />` ngay sau `<Zone2Walkways />`.

5. `src/scene/walk/WalkMode.tsx`:
   - Khi `layout?.getStairHeight` tồn tại (B8), mỗi frame lấy `h = layout.getStairHeight(u, v)`, chọn ứng viên gần `player.current[1]` nhất giữa `up = h` (`F <= 3`) và `down = h - 3.8` (`F >= 2`), lerp mượt (`1 - exp(-20 * dt)`).
   - Chặn bước nhảy ngang qua vế / xuyên gầm (`|targetY - y| > 1.2` hoặc `|y| > 1.2` khi bước khỏi vùng thang).
   - Đổi tầng tự động có trễ (`y > 2.0 → F + 1, y -= 3.8`; `y < -2.0 → F - 1, y += 3.8`), bỏ qua teleport và fade đen (`stairWalkTransition` + event `campussim:stair-walk-floor`).

6. `src/ui/interior/InteriorHud.tsx` & `src/ui/walk/WalkHud.tsx`:
   - Gộp dải hướng dẫn đáy màn hình thành **một dải duy nhất** trong `WalkHud.tsx` (xóa dải trùng ở `InteriorHud.tsx`), không đè lên nút `[E]` giữa đáy màn hình.
   - Với tòa có `layout?.getStairHeight` (B8), bỏ gợi ý và phím tắt nhảy tầng `E/Q` của thang bộ; giữ nguyên `E` cho thang máy và giữ `E/Q` cho B11/B3.
   - Khi nhận `campussim:stair-walk-floor`, bỏ qua màn đen fade `250 ms` và giữ thẻ phòng mượt.

7. `src/scene/interior/B8Furniture.tsx` (Việc 4 bổ sung + dùng chung hằng số):
   - Import `B8_PLANTERS`, `B8_TREE_UV`, `B8_STAIRS` và các hằng số thang từ `layouts/b8.ts`.
   - Chép `makeTiltedBoxMatrix`, `makeRampSlabMatrix`, `addSwitchbackFlight` từ `B11Furniture.tsx` (tham số hóa `toWorld`, giữ ghi chú nguồn ở đầu hàm) — không sửa file B11.
   - Dựng toàn bộ 5 buồng thang tầng `1–3` theo kiểu chữ U B11 giữ nguyên số đo B8 (`RUN = 3.36 m`, `FLIGHT_W = 1.3 m`, `GAP = 0.2 m`, `LANDING_DEPTH = 1.3 m`, chiếu nghỉ `1.9 m`), mặt bậc + chiếu nghỉ đá đen `#1e293b` (`metalness 0.4, roughness 0.45`), gầm thang `#d6cec2` (`roughness 0.78`), tay vịn inox `#d8dde3` (`metalness 0.35, roughness 0.3`).
   - Giữ nguyên chỉnh sửa T16 của Claude (`metalness={0.35}` cho lan can và thùng rác).

8. `docs/tasks/T17-anh/*.png` và `docs/tasks/T17-bao-cao.md`.

---

## 2. Kết quả kiểm tra (Gate Checks)

| Lệnh | Kết quả | Ghi chú |
| --- | --- | --- |
| `npm run typecheck` | **0 lỗi (PASSED)** | `tsc -b --noEmit` |
| `npm run lint` | **0 lỗi (PASSED)** | `eslint .` |
| `npm run build` | **Thành công (PASSED)** | `vite build` (`dist/assets/index-CVVtBfB3.js`, 1.87s) |

---

## 3. Log kiểm tra leo thang bằng phím W/A/S/D trên trình duyệt

Chạy bằng Google Chrome headless (WebGL, `1440×900`) qua CDP (`Input.dispatchKeyEvent` `keyDown`/`keyUp`):

### A. Thang Giữa Bắc (Tầng 1 → Tầng 2 → Tầng 1)

| Pha giữ phím | Thời điểm (ms) | `floor` | `(u, v)` | `y` (m) | Thẻ HUD |
| --- | --- | --- | --- | --- | --- |
| Bắt đầu hành lang | 0 | 1 | `(52.65, -198.50)` | `0.000` | — |
| Giữ `W` (vế 1 lên) | 455 | 1 | `(52.65, -200.74)` | `0.305` | `Tầng 1 (Trệt)` |
| Giữ `W` (giữa vế 1) | 760 | 1 | `(52.65, -202.32)` | `1.191` | `Tầng 1 (Trệt)` |
| Giữ `W` (chiếu nghỉ) | 1258 | 1 | `(52.64, -204.64)` | `1.899` | `Tầng 1 (Trệt)` |
| Giữ `A` (sang vế 2) | 283 | 1 | `(51.30, -204.63)` | `1.900` | `Tầng 1 (Trệt)` |
| Giữ `S` (vế 2 lên T2) | 303 | 1 | `(51.30, -203.13)` | `1.960` | `Tầng 1 (Trệt)` |
| Giữ `S` (qua ngưỡng `y > 2.0`) | 455 | **2** | `(51.30, -202.37)` | `-1.457` | **`Tầng 2`** |
| Giữ `S` (ra hành lang T2) | 1218 | 2 | `(51.30, -198.52)` | `0.000` | — |
| Giữ `W` (từ T2 xuống vế 2) | 611 | 2 | `(51.29, -200.84)` | `-0.363` | `Tầng 2` |
| Giữ `W` (tới chiếu nghỉ) | 1220 | 2 | `(51.29, -203.83)` | `-1.882` | `Tầng 2` |
| Giữ `D` (sang vế 1) | 286 | 2 | `(52.71, -203.83)` | `-1.900` | `Tầng 2` |
| Giữ `S` (xuống T1) | 153 | 2 | `(52.71, -203.07)` | `-1.982` | `Tầng 2` |
| Giữ `S` (qua ngưỡng `y < -2.0`) | 305 | **1** | `(52.71, -202.32)` | `1.429` | **`Tầng 1 (Trệt)`** |
| Giữ `S` (về hành lang T1) | 1066 | 1 | `(52.70, -198.47)` | `0.000` | — |

### B. Thang Lõi Đông (Tầng 1 → Tầng 2)

| Pha giữ phím | Thời điểm (ms) | `floor` | `(u, v)` | `y` (m) | Thẻ HUD |
| --- | --- | --- | --- | --- | --- |
| Bắt đầu cửa thang Đông | 0 | 1 | `(115.60, -186.80)` | `0.000` | — |
| Giữ `W` (vế 1 lên) | 609 | 1 | `(112.51, -186.79)` | `1.006` | `Tầng 1 (Trệt)` |
| Giữ `W` (tới chiếu nghỉ) | 1217 | 1 | `(109.84, -186.78)` | `1.899` | `Tầng 1 (Trệt)` |
| Giữ `D` (sang vế 2) | 323 | 1 | `(109.84, -188.36)` | `1.900` | `Tầng 1 (Trệt)` |
| Giữ `S` (qua ngưỡng lên T2) | 455 | **2** | `(112.09, -188.35)` | `-1.480` | **`Tầng 2`** |
| Giữ `S` (ra hành lang T2) | 1213 | 2 | `(115.91, -188.33)` | `0.000` | — |

- **Console errors / warnings / page errors:** `0` (`CONSOLE_ERRORS: []`, `CONSOLE_WARNINGS: []`, `PAGE_ERRORS: []`).

---

## 4. Ảnh kiểm chứng (`docs/tasks/T17-anh/`)

- `a-ban-do-b8-b11.png` — (a) Góc nhìn xiên ngoài bản đồ: thấy rõ cây, bồn, lam trắng, dải xanh trong sân B8 đặt cạnh B11.
- `b-leo-thang-giua-ve.png` — (b) Robot đứng giữa vế thang B8 (`y = 1.191 m`), chân chạm mặt bậc đá đen, không xuyên bậc.
- `c-chieu-nghi.png` — (c) Robot tới chiếu nghỉ (`y = 1.899 m`), lan can 3 thanh kiểu B11.
- `d-hud-mot-dai.png` — (d) HUD đáy màn hình chỉ còn một dải gọn gàng, không chồng lên nút `[E] Thang máy Block 8 (Nhịp giữa)`.
- `e1-b11.png` & `e2-b3.png` — (e) B11 và B3 vẫn hiển thị và hoạt động bình thường.
- `f-thang-b8-kieu-b11.png` — (f) Cận cảnh buồng thang B8 kiểu chữ U B11 (bậc đá đen, gầm bê tông phẳng nghiêng, tay vịn inox 3 thanh liên tục).
- `g-thang-b11-so-sanh.png` — (g) Buồng thang Giữa Bắc của B11 cùng góc để đối chiếu.

---

## 5. Phần chưa làm được / Lưu ý

- Không có phần nào bị bỏ sót. Mọi mục từ Việc 1 đến Việc 4 đã hoàn tất và kiểm chứng trên trình duyệt.
- Lưu ý nhỏ: trên B8 tầng 1 khi đi vào buồng `Thang bộ giữa (Bắc)`, vì cửa ra ngoài phía Bắc (`B8_ENTRANCE_NORTH_INSIDE`) nằm ở `(52.8, -199.0)` với bán kính `3.5 m`, nút `[E] Ra ngoài (Cửa Bắc — Nhịp giữa)` vẫn hiện ở chân cầu thang như thiết kế cũ của `layouts/b8.ts` (nhưng không đè lên dải HUD mới).
