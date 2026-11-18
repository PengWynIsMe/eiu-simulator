# Báo cáo hoàn thành Task T18 — B8 thang máy kiểu B11, kính nhìn vào phòng, hết chớp nền, cầu thang rộng sát tường

- **Người thực hiện:** Antigravity (Gemini 4 Hydrogen High)
- **Nhánh / Worktree:** `t16-b8-chi-tiet` (nối tiếp T16, T17)
- **Ngày hoàn thành:** 18/11/2026
- **Trạng thái:** Hoàn tất đầy đủ Việc 1–4, chưa commit/push.

---

## 1. File đã sửa

1. `src/scene/interior/B8Furniture.tsx`:
   - **Việc 1 — Sảnh thang máy kiểu B11 (`B8ElevatorBooth`):** dựng trên cả 4 tầng (`1–4`, ẩn tầng trên khi `!showUpperFloors`): khung đá marble kem be (`#d6c8b4`, `0.18 × 2.64 × 2.55`), 2 cánh cửa inox xước (`#cbd5e1`, `metalness 0.5, roughness 0.3`), khe giữa 2 cánh (`#475569`), bảng nút gọi có 2 nút tròn ▲▼ (`cylinderGeometry`), màn LED hiển thị số tầng từng booth bằng `<Text>` của `@react-three/drei`, kèm `pointLight` tại tầng đang đứng.
   - **Việc 2 — Ô cửa sổ kính thật:** xóa hẳn `windowFrames`/`windowGlass` giả của T16; trên mọi đoạn `wall.isGlass` của mỗi tầng (`f = 1..4`) dựng bệ tường dưới (`0 → 0.95`, dày `0.22`, `#42322c`), tường trên (`2.45 → 3.8`, dày `0.22`, `#42322c`), và khung nhôm `#9ca3af` (thanh ngang tại `0.95 / 2.45`, đố đứng mỗi `~1.2 m`).
   - **Việc 3 — Chống chớp nền:** `corridorFloor` đặt tâm `dy + 0.01` dày `0.02` (`polygonOffset -1/-2`); `blueEdgeTrim` đặt tâm `dy + 0.03` dày `0.02` (`polygonOffset -2/-4`); `courtyardPaving` đặt tâm `groundY + 0.02` dày `0.04` (`polygonOffset -1/-2`, nâng bồn/cây lên `groundY + 0.04`); chỉnh đầu/cuối vế thang (`dy → dy + 1.88` và `dy + 1.92 → dy + 3.78`) lệch `0.02 m >= 0.015 m` so với mặt chiếu nghỉ `1.9 m` và sàn trên `3.8 m`.
   - **Việc 4 — Cầu thang rộng sát tường:** dùng `st.flightW` và `landingDepth = max(1.3, st.flightW)` cho từng buồng thang; tay vịn đặt cách mép ngoài tối thiểu `0.05 m` (`Math.min(width * 0.47, width * 0.5 - 0.05)` và `railHalfW = landingW * 0.5 - 0.05`).

2. `src/scene/interior/layouts/b8.ts`:
   - **Việc 2:** trong `createFloorWalls`, tách mọi đoạn tường hành lang ↔ phòng học dài `≥ 3.0 m` thành `đặc 0.6 m + kính (isGlass: true, thickness: 0.1) + đặc 0.6 m` (giữ nguyên cửa mở và va chạm).
   - **Việc 4:** thêm `flightW` riêng cho từng phần tử `B8_STAIRS` và cập nhật `getB8StairHeight` theo `st.flightW` và `landingDepth = Math.max(B8_STAIR_LANDING_DEPTH, st.flightW)`.
   - **Kiểm tra độ dày tường buồng thang trong `getFloorWalls`:**
     - Giữa Bắc (`u 49.7→54.1`), Tây Nam (`u 9.7→13.5`), Giữa Nam (`u 50.0→53.7`), Lõi Đông (`v -190.3→-184.8`): các tường ngăn đều dày `0.2 m` → giữ nguyên `flightW` theo bảng (`2.00 / 1.70 / 1.65 / 2.55 m`).
     - **Tây Bắc (`u 9.0→13.1`):** tường bao ngoài phía Tây (`u = 9.0`) có `thickness = 0.3 m` (mặt trong nằm ở `u = 9.15`, thay vì `9.10` như tường `0.2 m`). Để mép ngoài vế thang cách mặt tường `≥ 0.05 m` (`u ≥ 9.20`), đã chỉnh `flightW` của thang Tây Bắc từ `1.85` xuống **`1.75 m`** (`u = 11.05 ± (0.1 + 1.75) = 9.20…12.90`).

3. `src/scene/interior/InteriorScene.tsx`:
   - **Việc 2:** bật render `wall.isGlass` cho cả `B8` (ở cả tầng hiện tại và khối nhiều tầng `multiFloorB11`) với chiều cao kính ô cửa sổ `1.5 m` (`y = 0.95 → 2.45`), dùng chung vật liệu kính trong suốt sẵn có.
   - **Việc 3:** thêm `shadow-bias={-0.0005}` và `shadow-normalBias={0.03}` vào `directionalLight`; tắt `b8CourtyardGroundGeometry` dư thừa vì `multiFloorB11` đã render bản sàn tầng 1 cho B8.

4. `src/scene/walk/WalkMode.tsx`:
   - **Việc 3:** đổi `near` của camera trong nhà từ `0.1` lên `0.2` (cả góc nhìn sau vai và FPS; ngoài trời giữ `OUTDOOR_CAMERA_NEAR = 5`).

5. `src/scene/details/Block8Details.tsx`:
   - **Việc 3:** nâng `GROUND_TOP` từ `0.19` lên `0.25 m` (đáy nền đá `0.21 m`, cách mặt trên sân `0.14 m` của `TwinWingBlock` là `0.07 m ≥ 0.05 m`), dời nhẹ dải xanh `blueTrimGeo` vào mép lỗ và bật `polygonOffset` cho `stoneGeo` & `blueTrimGeo`.

6. `src/ui/interior/InteriorHud.tsx`:
   - **Việc 1:** thiết kế lại bảng thang máy dùng chung cho mọi tòa (B3, B8, B11) theo kiểu bảng nút thang máy thật: nền thép tối, ô LED số tầng hiện tại + mũi tên `▲▼` ở trên, nút tròn `1..maxFloors` xếp dọc từ dưới lên, nút tầng hiện tại sáng viền xanh, giữ nguyên phím tắt `1..maxFloors` và `Esc`.
   - Sửa thêm: bắt `Escape` ở pha capture (`stopImmediatePropagation`) khi đang mở bảng thang máy để nhấn `Esc` chỉ đóng bảng chứ không thoát chế độ đi bộ.

---

## 2. Kết quả kiểm tra bắt buộc (Gate Checks)

| Lệnh | Kết quả | Ghi chú |
| --- | --- | --- |
| `npm run typecheck` | **0 lỗi (PASSED)** | `tsc -b --noEmit` |
| `npm run lint` | **0 lỗi (PASSED)** | `eslint .` |
| `npm run build` | **Thành công (PASSED)** | `vite build` (`dist/assets/index-59b1Dvhf.js`, 1.78s) |

---

## 3. So pixel chống chớp (trước / sau, cách nhau 0.5 s trên ảnh `1440×900`)

Ghi chú phương pháp: ảnh `(a)` và `(c)` chụp ở góc nhìn thứ nhất (FPS) để đứng yên hoàn toàn không có chuyển động thở của robot; ảnh `(b)` phần sau sửa đo ở FPS (trước sửa chụp ở sau vai nên phần lớn diff trước là do animation thở của robot ở giữa khung hình); ảnh `(d)` trên bản đồ đợi `CameraControls` ổn định sau khi bay (`3.5 s`).

| Vị trí | Trước (`exactDiff` / `visibleDiff`) | Sau (`exactDiff` / `visibleDiff`) | Ghi chú |
| --- | --- | --- | --- |
| **(a)** Hành lang mở tầng 3 nhìn dọc 40 m | `0` / `0` (FPS); `738` / `376` (sau vai) | **`0` / `0`** (FPS) | Hoàn toàn không chớp, nhìn rõ kính & bàn ghế |
| **(b)** Tầng 4 nhìn xuống sân Đông | `61,597` / `27,760` (sau vai, gồm robot thở) | **`0` / `0`** (FPS) | Hoàn toàn không chớp nền & bóng đổ sân |
| **(c)** Tầng 1 sân Tây ngang tầm mắt | `0` / `0` (FPS) | **`0` / `0`** (FPS) | Hoàn toàn ổn định |
| **(d)** Bản đồ nhìn xiên vào B8 từ xa | `951` / `179` (1.8s) | **`0` / `0`** (sau `3.5s` ổn định) | `near = 5`, khoảng cách lớp `0.07 m`, hết chớp |

---

## 4. Kiểm tra lại leo thang (T17) với `flightW` mới

Mô phỏng giữ phím `W/A/S/D` thật qua CDP:

- **Thang Giữa Bắc (`flightW = 2.00`, `landingDepth = 2.00`):**
  - Bắt đầu hành lang T1 `(52.90, -198.50)` `y = 0` → giữ `W` lên vế 1: `y = 0.307 → 0.770 → 1.192 → 1.614 → 1.880 → 1.899` (`floor = 1`) → giữ `A` sang vế 2 `(51.31, -204.55)` `y = 1.900` → giữ `S` lên T2: qua ngưỡng `y > 2.0` tự chuyển **`floor = 2`**, `y = -1.415 → -0.942 → -0.516 → -0.098 → 0.000`.
  - Đi xuống lại T1: từ T2 `(51.30, -197.61)` giữ `W` xuống vế 2: `y = -0.232 → -0.690 → -1.112 → -1.534 → -1.865` → giữ `D` sang vế 1 `y = -1.900` → giữ `S` qua ngưỡng `y < -2.0` tự chuyển **`floor = 1`**, `y = 1.701 → 1.290 → 0.865 → 0.439 → 0.057 → 0.000`.
- **Thang Lõi Đông (`flightW = 2.55`, `landingDepth = 2.55`):**
  - Bắt đầu `(115.60, -186.20)` `y = 0` → giữ `W` lên vế 1: `y = 0.133 → 0.535 → 0.959 → 1.430 → 1.829 → 1.900` → giữ `D` sang vế 2 `(109.42, -188.92)` `y = 1.900` → giữ `S` qua ngưỡng tự chuyển **`floor = 2`**, `y = -1.708 → -1.257 → -0.830 → -0.411 → -0.047 → 0.000`.
- **Console errors / warnings / page errors:** `0`.

---

## 5. Ảnh kiểm chứng (`docs/tasks/T18-anh/`)

- `thang-may-t1.png`, `thang-may-t3.png` — Sảnh thang máy B8 kiểu B11 ở tầng 1 (số LED `1`) và tầng 3 (số LED `3`), khung đá kem, 2 cánh inox, khe cửa, bảng nút tròn ▲▼.
- `hud-thang-may-b8.png`, `hud-thang-may-b3.png` — Bảng chọn tầng thang máy kiểu mới (thép tối, màn LED, nút tròn xếp dọc từ dưới lên) dùng chung cho cả B8 và B3.
- `hanh-lang-kinh-ban-ghe.png` — Hành lang B8 nhìn xuyên qua cửa sổ kính khung nhôm thấy bàn ghế bên trong phòng học.
- `thang-giua-bac-rong.png` — Thang Giữa Bắc rộng `flightW = 2.00` nhìn từ hành lang tầng 2, 2 vế sát 2 tường buồng thang.
- `before-*-1/2.png` và `after-*-1/2.png` — Cặp ảnh so pixel chống chớp của 4 vị trí `(a)–(d)`.
- `b11-t1.png`, `b3-t1.png` — B11 và B3 hoạt động bình thường.

---

## 6. Phần chưa làm được / Rủi ro

- Không có phần nào bị bỏ sót. Mọi mục Việc 1–4 đã hoàn tất và kiểm chứng đầy đủ.
