# Báo cáo hoàn thành Task T16 — B8 nội thất "như ảnh thật": đủ 4 tầng, cột kem, lam, lan can, sân vườn

- **Người thực hiện:** Antigravity (Gemini 4 Hydrogen)
- **Nhánh / Worktree:** `t16-b8-chi-tiet`
- **Ngày hoàn thành:** 18/11/2026
- **Trạng thái:** Hoàn tất, sẵn sàng cho Claude review và merge.

---

## 1. File đã sửa / tạo

1. `src/scene/interior/layouts/b8.ts`:
   - Export `B8_WEST_HOLE_UV` và `B8_EAST_HOLE_UV` theo bảng số mục A và cập nhật `getFloorHoles` dùng lại hai hằng số này.
   - Export `B8_PCCC_POINTS` (4 điểm tủ PCCC + kệ bình + sơ đồ thoát hiểm) và `B8_EXIT_SIGNS` (5 biển EXIT treo trần) theo bảng số mục D.
   - Không thay đổi danh sách phòng, tường hay logic va chạm hiện có.

2. `src/scene/interior/B8Furniture.tsx` (**tạo mới**):
   - Chuyển `B8Furniture` và `B8ElevatorBooth` từ `InteriorFurniture.tsx` sang `B8Furniture.tsx`, gom toàn bộ hình học lặp vào `InstancedBatch` theo từng vật liệu (tương tự `B11Furniture.tsx`).
   - Dựng kết cấu lặp 4 tầng (`f = 1..4`, ẩn tầng trên khi `!showUpperFloors`):
     - Cột vuông kem `#d6cec2` (`0.5 × 0.5 × 3.8 m`), dầm biên giếng trời (`cao 0.45 m, dày 0.3 m`), dầm ngang trần hành lang nối cột vào tường phòng (`rộng 0.3 m, cao 0.35 m`).
     - Lam che nắng trắng `#f1f3f4` có khung `0.05 m`, cao `0.9 m` (`y 2.45→3.35`), 6 lá nghiêng `35°` giữa các cặp cột trên 2 mép dài Bắc/Nam mỗi sân.
     - Đèn trần tròn `#fefce8` emissive nhẹ (`Ø0.2 × 0.06 m`), cách `3.0 m` dọc tim hành lang.
     - Thùng rác inox `#cbd5e1` (`metalness 0.8`, `Ø0.36 × 0.75 m`) cạnh mỗi cột thứ 2, lệch `0.5 m` về phía tường phòng.
   - Dựng chi tiết tầng 2–4: gờ bê tông chân lan can (`0.15 × 0.2 m` `#d6cec2`), lan can inox 4 thanh (`0.30 / 0.55 / 0.80 / 1.10 m`) + trụ `0.04 m` cách `≤ 1.8 m` (`#cbd5e1`, `metalness 0.9`), dải sàn xanh dương rộng `0.6 m` (`#2f7fc1`, `roughness 0.4`), lớp sàn hành lang mở bê tông mài (`#a3a8ad`), bỏ hẳn lan can 3 thanh và viền xanh cũ của T15a.
   - Dựng trang thiết bị hành lang mọi tầng (`B8_PCCC_POINTS` và `B8_EXIT_SIGNS`) và dải cửa sổ giả khung nhôm `#9ca3af` / kính `#9fb8c8` (`opacity 0.55`, `y 1.0→2.4`, đố đứng mỗi `~1.2 m`) trên các đoạn tường phòng giữa 2 cửa dài `≥ 3.0 m` từ `getFloorDoors`.
   - Dựng sân vườn tầng trệt tại `groundY = -(floor - 1) * FLOOR_HEIGHT`: nền lát đá `#a8abad`, gờ bồn đá tối `#3f3f46` (`cao 0.15 m, dày 0.15 m`), thảm lan ý `#2f5d34` (`cao 0.45 m`), hoa trắng `0.08 m` `#f8fafc` rải bằng PRNG cố định seed (`createSeededRng(202608)`), thân cây `Ø0.35 × 13.0 m` `#4a3a2e`, tán cây 3 khối `IcosahedronGeometry` (`Ø4–6 m` tại `y 9.5 / 11.5 / 13.0 m`, `#3f7d3a` / `#4f8f45`), giàn chống thép 4 chân `Ø0.08 m` (`#9ca3af`, `metalness 0.7`) từ cách gốc `1.2 m` chụm vào thân ở `3.0 m`.
   - Cầu thang bộ 2 vế được dựng lặp cho tầng `1–3` (ẩn tầng trên khi `!showUpperFloors`).

3. `src/scene/interior/InteriorFurniture.tsx`:
   - Import `B8Furniture` từ `./B8Furniture` và truyền `showUpperFloors={showUpperFloors}`; xóa phần code `B8Furniture` / `B8ElevatorBooth` cũ khỏi file.

4. `src/scene/interior/InteriorScene.tsx`:
   - Mở rộng khối nhiều tầng (`multiFloorB11`) cho cả `isB8` (`!isB11 && !isB8`) để dựng đầy đủ sàn, tường và lanh-tô cửa của các tầng còn lại (`otherF !== floor`, ẩn `otherF > floor` khi `isTopDown`).
   - Bổ sung nhánh mái chìa B8 trong khối `!isTopDown` (`roofY = (layout.floors + 1 - floor) * FLOOR_HEIGHT`, dày `0.34 m`, viền ngoài `u 8.0…121.4, v -211.2…-165.0`, 2 lỗ mái sân Tây `u 14.7…48.8, v -195.8…-181.3` và sân Đông `u 55.3…113.7, v -195.3…-180.8`).
   - Xóa khối "2c. Vách sân trong B8" cũ.

5. `docs/tasks/T16-anh/*.png` và `docs/tasks/T16-bao-cao.md`.

---

## 2. Kết quả kiểm tra (Gate Checks)

| Lệnh | Kết quả | Ghi chú |
| --- | --- | --- |
| `npm run typecheck` | **0 lỗi (PASSED)** | `tsc -b --noEmit` |
| `npm run lint` | **0 lỗi (PASSED)** | `eslint .` |
| `npm run build` | **Thành công (PASSED)** | `vite build` (`dist/assets/index-DKFLs7wh.js`, 2.23s) |

---

## 3. Kiểm tra trình duyệt & ảnh đính kèm

Đã kiểm tra trực tiếp trên Google Chrome headless (WebGL, `1440×900` và mobile `390×844`):
- **Console errors / warnings / page errors:** `0` (`CONSOLE_ERRORS: []`, `CONSOLE_WARNINGS: []`, `PAGE_ERRORS: []`).
- **Top-down tầng 2:** Nhìn rõ toàn bộ phòng học, bàn ghế, sân vườn; các tầng trên (`3–4`) và mái chìa ẩn hoàn toàn.
- **Hồi quy B11 và B3:** Cả B11 tầng 1 và B3 tầng 1 render bình thường, không bị ảnh hưởng.

Ảnh lưu tại `docs/tasks/T16-anh/`:
- `a-b8-t1-san-tay-nhin-len.png` — (a) Tầng 1 sân Tây nhìn lên (thấy đủ tầng 2–4, cột kem, lam trắng 6 lá nghiêng, lan can, cây cao tán 3 khối, mái chìa).
- `b-b8-t3-hanh-lang-bac.png` — (b) Tầng 3 hành lang mở Bắc nhìn dọc (thấy cột kem, dầm ngang, đèn trần tròn, lam có khung, lan can 4 thanh trên gờ bê tông, dải sàn xanh dương, cửa sổ giả hành lang, tủ PCCC + bình chữa cháy + sơ đồ thoát hiểm).
- `c-b8-t3-nhin-xuong-san-dong.png` — (c) Tầng 3 nhìn xuống sân Đông (thấy nền lát đá, bồn đá tối, thảm lan ý + hoa trắng, thân cây + giàn chống thép 4 chân, dãy đối diện).
- `d-b8-t2-topdown.png` — (d) Top-down tầng 2 (rõ phòng học, không bị tầng trên hay mái che).
- `e1-b11-t1.png` — (e) B11 tầng 1 bình thường.
- `e2-b3-t1.png` — (e) B3 tầng 1 bình thường.

---

## 4. Điểm lưu ý / sai khác nhỏ so với bảng số

- **Đèn trần tròn (`y = 3.59 m` thay vì `3.74 m`):** Do `InteriorScene.tsx` dựng bản sàn tầng trên dày `0.18 m` từ `dy + 3.62 m` tới `dy + 3.80 m` (`buildSlabGeometry(..., 0.18, dy - 0.18)`), nếu đặt đèn dày `0.06 m` ở tâm `y = 3.74 m` (`3.71→3.77 m`) thì đèn bị chìm hoàn toàn bên trong bản sàn và không nhìn thấy từ hành lang. Đã đặt tâm đèn ở `y = 3.59 m` (`3.56→3.62 m`) để áp sát mặt dưới trần thật và hiển thị rõ.
- **Tủ PCCC đầu Tây cánh Bắc `(14.6, -199.9)`:** Trên tầng 2–4, phòng đầu Tây (`220/320/420.B8`) bắt đầu từ `u = 13.1`, nên cửa Tây của phòng nằm ở `u = 13.7…14.7`, trùng vào vùng đặt sơ đồ thoát hiểm / tủ PCCC (`u = 13.8…14.6`). Hiện vẫn giữ đúng tọa độ trong bảng số mục D của brief và chưa tự ý dịch chuyển.
