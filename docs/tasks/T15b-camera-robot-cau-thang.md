# T15b — Góc nhìn thứ nhất, robot đúng 1.70 m, đi cầu thang bộ lên/xuống tầng, hết giật

- Người làm: **Codex (gpt-6-luna, medium)** — song song với T15a (Gemini: hình nội thất B8).
- Worktree + nhánh: `t15b-camera-cau-thang`. `npm ci`; dev cổng **5176**.

## Chỉ được sửa

`src/scene/walk/**` (WalkMode.tsx, PlayerCharacter.tsx...), `src/ui/interior/**`, `src/ui/walk/**`.
**Không** sửa `src/scene/interior/**` (T15a đang sửa + đồng nghiệp đang làm B11), store, data, App/Campus. Không cài thư viện. Không commit/push.

## 1. Robot đúng tỷ lệ — cao 1.70 m

Hiện `PlayerCharacter.tsx` dùng `MODEL_SCALE = 0.25` (armature 100×) → robot chỉ ~1.1–1.2 m, làm phòng trông to.
Sửa: sau khi model tải, đo **một lần** `Box3.setFromObject` ở tư thế đứng (Idle), tính `scale = 1.70 / chiều cao`, đặt chân ở y = 0. Capsule dự phòng giữ cao 1.70 m.

## 2. Ba góc nhìn — phím C xoay vòng

`sau vai` → `thứ nhất` → `từ trên xuống` → lại `sau vai`. Áp dụng **cả trong nhà và ngoài trời** (ngoài trời: `từ trên xuống` = góc cao hiện tại 8 m sau / 3.4 m cao).
- **Thứ nhất — kiểu game bắn súng (FPS)** (người dùng yêu cầu rõ):
  - Camera ở mắt nhân vật, cao **1.60 m** trên sàn/mặt đất; **ẩn model robot**.
  - **Pointer Lock**: bấm vào canvas → khóa chuột (`canvas.requestPointerLock()`); **di chuột (không cần giữ nút)** = xoay nhìn
    bằng `event.movementX/Y`. Độ nhạy ~0.0022 rad/px; pitch giới hạn ±80°. Không tạo object trong handler.
  - **Tâm ngắm** (dấu + nhỏ, trắng viền đen) ở giữa màn hình (DOM trong `ui/walk`), chỉ hiện ở góc thứ nhất.
  - **W A S D** đi theo hướng nhìn ngang (bỏ pitch), Shift chạy — như FPS.
  - **Esc**: lần 1 trình duyệt tự nhả khóa chuột (sự kiện `pointerlockchange`) → **không** thoát đi bộ;
    chỉ thoát đi bộ khi nhấn Esc **lúc không khóa chuột**. HUD nhắc: "Bấm vào màn hình để điều khiển bằng chuột · Esc: nhả chuột".
  - Phím E/Q (thang, cửa) vẫn dùng được khi đang khóa chuột.
  - Điện thoại (không có pointer lock): cần ảo bên trái để đi, **vuốt nửa phải màn hình** để nhìn; tâm ngắm vẫn hiện.
- **Sau vai** (trong nhà như T13b: 4 m sau, 2.2 m cao; ngoài trời như hiện tại).
- HUD (`ui/walk`, `ui/interior`) ghi rõ góc nhìn đang dùng + "C: đổi góc nhìn". Nút trên điện thoại để đổi góc.
- Phím C bỏ qua khi đang gõ trong ô nhập (như V/Esc).

## 3. Hết giật — độ chính xác chiều sâu

Hiện trong nhà `near = 0.1` nhưng `far` vẫn 2500 → tỉ lệ 25000:1, bậc thang và sàn chớp. Đặt theo chế độ:
- Trong nhà: `near 0.1`, `far 400`. Ngoài trời góc thứ nhất: `near 0.3`, `far 1500`. Ngoài trời sau vai / trên cao: `near 5`, `far 2500` (như cũ).
- `updateProjectionMatrix()` chỉ khi giá trị đổi; trả về near 5 / far 2500 khi thoát đi bộ (hiện đã làm cho near — làm thêm far).

## 4. Đi cầu thang bộ lên / xuống tầng

Ô thang bộ = phòng trong layout có `code` bắt đầu bằng **"Thang bộ"** (`layout.getFloorRooms(floor)` hoặc tương đương — đọc qua `getInteriorLayout(buildingId)`, không sửa layout).
- Nhân vật đứng **trong ô thang bộ** → HUD: **"E – Lên tầng N+1"** (nếu chưa phải tầng cao nhất) và **"Q – Xuống tầng N−1"** (nếu > 1). Điện thoại: 2 nút.
- Bấm → fade 0.3 s → `setInteriorFloor(N±1)` → nhân vật xuất hiện **trong ô thang cùng tên** ở tầng mới (tâm ô, quay mặt về phía hành lang).
  Nếu tầng mới không có ô cùng tên → ô thang bộ gần nhất.
- Thang máy giữ nguyên (bảng chọn tầng). Không có bảng chọn tầng ở thang bộ.
- Hiện tại khi đổi tầng `WalkMode` luôn đặt nhân vật ở cửa thang máy (`layout.elevator.spawnWorld`) — phân biệt: đổi tầng **bằng thang bộ** → đặt ở ô thang bộ.
  Gợi ý: phát `campussim:stair-move` (từ HUD) mang `{ stairCode, floor }`, WalkMode ghi nhớ lần đổi tầng kế tiếp là thang bộ.

## Tiêu chí xong

- [ ] typecheck / lint / build sạch; console sạch
- [ ] Robot đứng cạnh cửa phòng (cao 2.2 m) thấp hơn cửa rõ ràng; đo log chiều cao ≈ 1.70 m (xóa log sau)
- [ ] C xoay đủ 3 góc trong nhà và ngoài trời; góc thứ nhất: bấm canvas khóa chuột, di chuột (không giữ nút) xoay nhìn, có tâm ngắm, WASD đi theo hướng nhìn, Esc lần 1 chỉ nhả chuột
- [ ] B8: vào tầng 1 → tới thang bộ Tây Nam → E → tầng 2 đứng ở thang bộ Tây Nam → Q → về tầng 1; tầng 4 không có "Lên", tầng 1 không có "Xuống"
- [ ] Đứng sát bậc thang 10 giây xoay camera: không chớp
- [ ] B3 vẫn vào/ra/thang máy được

## Báo cáo → `docs/tasks/T15b-bao-cao.md`
