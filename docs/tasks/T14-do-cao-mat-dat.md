# T14 — Nhân vật đi đúng độ cao mặt đất (hết lún chân / lơ lửng)

- Người làm: **Codex (gpt-6-luna, medium)** — chạy song song với T13 (Gemini, nội thất B8).
- Worktree + nhánh: `t14-do-cao-mat-dat`. `npm ci` trước; dev ở cổng **5176**.

## Vấn đề (người dùng báo: "nhân vật di chuyển hơi bị chạm địa hình")

`WalkMode.tsx` đặt nhân vật **cố định y = 0.6**, nhưng mặt đất có nhiều lớp cao khác nhau (để chống nhấp nháy — T03):
đất ngoài 0, cỏ trong trường 0.15, bãi xe 0.3, cỏ vòng xoay 0.3, đường phố + vành vòng xoay 0.45, đường nội bộ 0.6, lối đi bộ 0.75,
thành hồ ~0.75, mặt cầu ~0.8 (`zone1/Pond.tsx`, `zone1/Bridges.tsx`, `zone1/pondLayout.ts`).
→ Trên lối đi chân **lún** 15 cm; trên cỏ **lơ lửng** 45 cm.

## Mục tiêu

Hàm thuần `getGroundHeight(x, z): number` trả độ cao mặt đất thật tại một điểm ngoài trời, dựa trên **dữ liệu layout** (không raycast — nhanh, ổn định).
Claude sẽ nối hàm này vào `WalkMode` khi gộp (file đó đang do luồng T13 sửa).

## Được sửa / tạo

- `src/scene/groundLevels.ts` (mới): hằng số độ cao từng lớp (`GROUND`, `GRASS`, `PARKING`, `STREET`, `INTERNAL`, `FOOTWAY`, `POND_RIM`, `BRIDGE` ...) + bề rộng đường.
- `src/scene/Ground.tsx`: **chỉ** thay các số độ cao/bề rộng viết tay bằng hằng số từ `groundLevels.ts` (hình ảnh không đổi).
- `src/scene/walk/groundHeight.ts` (mới): `getGroundHeight(x, z)` + `dampHeight(current, target, dt)` (nội suy mượt khi bước lên/xuống lề).
  Thứ tự ưu tiên lớp **cao nhất phủ lên** như `Ground.tsx` vẽ: trên cầu → mặt cầu; trong hồ (ngoài cầu) → thành hồ; lối đi; đường nội bộ;
  đường phố / vành vòng xoay; bãi xe; cỏ vòng xoay; cỏ trong ranh giới; ngoài cùng → 0.
  Khoảng cách điểm–đoạn đường dùng bề rộng giống `Ground.tsx`. Cache dữ liệu đoạn đường một lần (không tạo mảng mỗi lần gọi).

## KHÔNG được sửa

`src/scene/walk/WalkMode.tsx`, `PlayerCharacter.tsx` (T13 đang sửa), `src/scene/interior/**`, `src/ui/**`, `src/store/**`, `src/data/**`, `zone1/`, `zone2/`, `kit/`.
Không cài thư viện. Không commit/push.

## Tự kiểm tra (không cần WalkMode)

Script tạm (xóa sau, không commit) hoặc gọi trong console dev: in `getGroundHeight` tại các điểm mẫu và đối chiếu lớp đúng:
- cổng chính trên đường vào ≈ (270, −28) → đường nội bộ/phố; dải phân cách cỏ trên trục vào; tâm vòng xoay (0, 0) → cỏ vòng xoay;
- trên 2 cầu (vd giữa đoạn `[123,−72.6]→[134.7,38.4]`) → mặt cầu; giữa hồ ngoài cầu → thành hồ; bãi xe sau B5 (≈ 170, −140) → bãi xe;
- ngoài ranh giới (vd (400, 400)) → 0.
Ghi bảng kết quả vào báo cáo. Mở app xem `Ground.tsx` vẫn y như cũ (so ảnh trước/sau).

## Tiêu chí xong

- [ ] typecheck / lint / build sạch; console sạch; mặt đất nhìn y như trước
- [ ] Bảng ≥ 10 điểm mẫu đúng lớp
- [ ] Hàm không cấp phát mảng/object mỗi lần gọi (gọi 60 lần/giây)

## Báo cáo → `docs/tasks/T14-bao-cao.md`
