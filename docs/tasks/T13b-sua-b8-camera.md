# T13b — Sửa B8 theo tọa độ đo sẵn + camera trong nhà thấp sau vai

- Người làm: **Gemini (Antigravity)**
- Worktree + nhánh: `t13b-sua-b8`. `npm ci` trước; dev ở cổng **5174**.
- Phản hồi người dùng sau T13 (2026-11-14): *"sai nhiều vị trí, rồi thang bộ, sân trong dư cả phần kính, đặc biệt góc nhìn của model đang cao quá, khó nhìn và thao tác."*

## 1. Bố cục B8 — DỰNG ĐÚNG THEO BẢNG TỌA ĐỘ, KHÔNG TỰ ĐO LẠI

Claude đã đo sơ đồ thoát hiểm ra **mét**: `docs/tasks/T13b-b8-toa-do.json`.
- Khung B8: trục dài nghiêng **−13.1°**. `world[x, z] = u * ex + v * ev` (ex, ev có trong file).
  `u`: Tây → Đông (9.0 = tường Tây thân chính, 120.4 = tường Đông). `v`: Bắc → Nam (−210.2 = tường Bắc, −166.0 = tường Nam).
  Đã đối chiếu: khung khớp `getBuilding('b8').shape` (OSM), sân trong lệch < 2 m; tâm thang máy tầng 2 ≈ world (12.5, −196.3).
- `floor1`: tầng 1. `floor2Template`: tầng mẫu cho 2–4. Mỗi mục: `name`, `kind` (`room` | `stair` | `elevator` | `wc` | `corridor` | `courtyard`), `u0..u1`, `v0..v1`.
- **Viết lại `src/scene/interior/layouts/b8.ts` sinh từ bảng này** (import JSON hoặc chép số — không đổi số). Tường phòng = cạnh hình chữ nhật của phòng;
  cửa phòng mở ra hành lang phía sân trong; hành lang là khoảng trống đi được.
- **Tầng 3, 4 từ tầng mẫu** — chỉ đổi mã phòng và gộp ô (đo trên sơ đồ):
  - Bắc: tầng 3 = 320…302, tầng 4 = 420…402, **cùng ô** với 220…202.
  - Nam tầng 3: **311 = ô 221+219**, **309 = ô 217+215**, **307 = ô 213+211**, **305 = ô 209+207**, **303 = ô 205+203**, **301 = ô 201**.
  - Nam tầng 4: 419, 417, 415, 413 = ô 221, 219, 217, 215; **411 = ô 213+211**; 409, 407, 405, 403, 401 = ô 209, 207, 205, 203, 201.

## 2. Thang bộ / thang máy (người dùng xác nhận)

- **Đúng 1 thang máy mỗi tầng** — mục `THANG MÁY (duy nhất)`. Chỉ ở đây hiện "E – Thang máy".
- Tất cả mục `kind: "stair"` là **THANG BỘ** (Tây Bắc, Tây Nam, 2 đầu hành lang ngang giữa, lõi Đông) — dựng bậc thang để nhìn + chặn va chạm, **không** có bảng chọn tầng.
  Xóa mọi thang máy/thang khác không có trong bảng.

## 3. Sân trong — BỎ KÍNH

Ảnh thật (`references/toa-b8/IMG_3728`, `3729`, `3734`, `3735` ở repo chính): mép sân trong chỉ có **lan can inox thấp (~1.1 m) + viền sàn xanh dương**, phía trên là **lam che nắng**.
**Xóa toàn bộ vách kính quanh sân trong.** Tầng 1: sân có cây + bồn cây, đi vào được hoặc chặn bằng bồn cây (chọn đơn giản). Tầng 2–4: khoảng trống nhìn xuống, lan can chặn.

## 4. Camera trong nhà — thấp, sau vai, dễ điều khiển

Hiện tại: cách 5.2 m, cao 6 m, chúc ~50° → quá cao. Sửa trong `scene/walk/WalkMode.tsx`:
- Mặc định **sau vai**: cách nhân vật **4 m**, cao **2.2 m** trên sàn, nhìn vào đầu nhân vật (cao ~1.4 m). Con lăn: 2.5–7 m. Kéo chuột xoay như ngoài trời.
- **Tường chắn tầm nhìn**: tường nào cắt đoạn camera→nhân vật thì **mờ đi** (opacity ~0.2) hoặc kéo camera lại sát nhân vật — chọn cách ổn định.
  Tính bằng giao đoạn thẳng 2D với danh sách tường của tầng (không raycast nặng, không cấp phát trong `useFrame`).
- Phím **C**: bật/tắt góc nhìn từ trên xuống cả tầng (đã có `campussim:topdown-camera`) — ghi phím vào thẻ hướng dẫn HUD.
- Ngoài trời giữ nguyên (người dùng chỉ phàn nàn trong nhà).

## Được sửa / tạo

`src/scene/interior/**` (đặc biệt `layouts/b8.ts`), `src/ui/interior/**`, `src/scene/walk/WalkMode.tsx` (chỉ phần camera trong nhà).
**Không** đổi phần độ cao mặt đất ngoài trời (`groundHeight` — vừa gộp), `PlayerCharacter.tsx`, `Campus.tsx`, `App.tsx`, store, data. Không cài thư viện. Không commit/push.

## Tiêu chí xong

- [ ] typecheck / lint / build sạch; console sạch
- [ ] Ảnh nhìn từ trên **từng tầng B8 đặt cạnh sơ đồ** (`/Users/dinhtrananhminh/Project/eiu-simulator/references/toa-b8/so-do-1400/tang-1..4.jpg`) — phòng, thang bộ, thang máy, WC trùng vị trí
- [ ] Không còn kính quanh sân trong; có lan can + viền xanh
- [ ] Chỉ 1 thang máy/tầng hoạt động; thang bộ không mở bảng tầng
- [ ] Camera trong nhà sau vai, đi dọc hành lang thấy rõ cửa phòng 2 bên; tường không che nhân vật; phím C chuyển góc nhìn
- [ ] B3 vẫn vào/ra/thang máy được như trước

## Báo cáo → `docs/tasks/T13b-bao-cao.md`
