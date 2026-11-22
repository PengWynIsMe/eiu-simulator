# L3+L4+L6 — Phòng máy 406.B11, ngồi vào máy, camera, thầy + màn chiếu (luồng A, Wave 2)

- Người làm: **Antigravity** · Nhánh `l346-phong-406` từ `main` (sau khi Claude gộp Wave 1) · cổng dev **5177**
- Đọc trước: `AGENTS.md`, `docs/PLAN-GIAI-DOAN-2.md` (mục 2, 3, 4, 5), `docs/tasks/S12-bao-cao.md` (cách dùng `CharacterModel`). Không cài gói. Không commit.

## Mục tiêu

Bấm "Bắt đầu buổi học" → người chơi đứng trước thang máy tầng 4 B11 → đi vào phòng 406 thấy phòng máy đầy đủ, thầy đứng giảng → tới ghế viền sáng bấm **E** → ngồi, camera nhìn màn hình → cả buổi học chạy (UI do luồng D đã làm) → thầy phản ứng, màn chiếu đổi slide.

## Được sửa / tạo

`src/scene/lesson/**` (mới), `src/scene/interior/**`, `src/scene/walk/WalkMode.tsx`, `src/scene/walk/groundHeight.ts`.

## KHÔNG được sửa

`src/scene/characters/**`, `src/scene/npc/**` (chỉ import), `src/scene/Campus.tsx` (ghi dòng cần thêm), `src/ui/**`, `src/store/**`, `src/data/**`, `src/types/**`, config.

## Hợp đồng

```ts
import { getClassroom, getLesson, characterConfig } from '../../data';            // getClassroom('406.B11')
import { useLessonStore, getCurrentStep } from '../../store/useLessonStore';
import { useWalkStore } from '../../store/useWalkStore';                           // setPlayerPos, interior, enterInterior, setInteriorFloor
import { b11ToWorld, B11_ROTATION_Y } from '../interior/layouts/b11';
import CharacterModel from '../characters/CharacterModel';                         // xem báo cáo S12 để biết props
```

Mọi số phòng nằm trong `src/data/classrooms.json` (u, v hệ B11; y từ sàn tầng 4). **Dựng đúng số, không tự đặt lại.**

## Việc 1 (L3) — `lesson/Classroom406.tsx`

Render khi `interior = {buildingId:'b11', floor:4}`. Mỗi loại đồ **1 `instancedMesh`** (≤ 15 draw call cả phòng):

| Đồ | Số | Hình (m) |
| --- | --- | --- |
| Bàn SV | 40 (tâm `(deskU, v)`) | mặt 1.0 (dọc v) × 0.6 (dọc u) × dày 0.04, cao 0.75, 4 chân hoặc 2 tấm hông |
| Ghế xoay | 40 (tại `(u, v)` ghế) | mặt ngồi 0.45 × 0.45 cao `chairSeatHeight` 0.45, lưng tựa 0.45 × 0.5, trụ + chân sao |
| Màn hình | 40 | 0.55 × 0.34 × 0.03 trên chân đế, đặt mép bàn phía bảng (`deskU − 0.18`), mặt quay về ghế (+u) |
| Mặt màn hình sáng | 40 | quad `MeshBasicMaterial` texture code giả (canvas, dùng chung), màn ghế người chơi sáng hơn |
| Bàn phím + chuột | 40 | 0.44 × 0.14 × 0.02 + 0.06 × 0.1 |
| Case máy | 40 | 0.2 × 0.42 × 0.45 dưới bàn |
| Bàn GV + màn hình | 1 | theo `teacherDesk` |
| Bảng trắng, màn chiếu | 1 + 1 | theo `whiteboard`, `projectorScreen` (áp tường Tây, mặt +u) |
| Máy chiếu | 1 | `projector` |
| Đèn tấm trần | 6 | 1.2 × 0.6, vật liệu tự phát sáng, cao = trần tầng |
| Điều hòa | 2 | 0.9 × 0.3 × 0.22 tại `airConditioners` |

- Đổi (u, v) → thế giới bằng `b11ToWorld`, xoay mọi đồ thêm `B11_ROTATION_Y`.
- **Va chạm**: bàn SV (theo dãy, mỗi dãy 2 khối liền: khối Bắc + khối Nam, chừa lối đi `aisle`) và bàn GV thành vật cản tầng 4 (thêm `WallSegment` vào `getFloorWalls(4)` của b11 hoặc lớp vật cản riêng trong WalkMode — chọn cách gọn, ghi lý do). Người chơi đi được giữa các dãy (khe ghế–bàn dãy sau ≥ 0.6 m).

## Việc 2 (L4) — Bắt đầu buổi học, ngồi, camera

1. **Ghi `playerPos`**: trong `WalkMode`, gọi `useWalkStore.getState().setPlayerPos({x, z, y, floor})` **tối đa 5 lần/giây**. Gỡ biến cấp module `globalPlayerPos/globalCameraYaw/globalFacingYaw` nếu làm được gọn (đọc lại từ store khi mount) — không bắt buộc.
2. **Bắt đầu**: khi `phase` chuyển `idle → goToClass`: bật đi bộ nếu chưa (`walkMode`), `enterInterior('b11')` rồi `setInteriorFloor(4)`, đặt người chơi tại `b11ToWorld(classroom.arrival)` (trước thang máy), quay mặt về phía phòng 406.
3. **Tới lớp**: khi người chơi vào trong `classroom.bounds` (tầng 4) và `phase === 'goToClass'` → `arriveAtClass()`.
4. **Ghế** — hợp đồng với UI (luồng D đã làm): khi người chơi vào/ra vùng 1.2 m quanh ghế, phát `window.dispatchEvent(new CustomEvent('campussim:seat-prompt', { detail: { visible: true | false } }))` (UI hiện nút "Ngồi (E)" trên mobile, nút đó phát phím `e`). Độ lệch y tư thế `sit`: dùng `SIT_Y_OFFSET` từ `src/scene/npc/sitPose.ts` (luồng B đo).
   Pha `findSeat` → ghế `playerSeat` có viền sáng nhấp nháy (mesh viền emissive). Người chơi < 1.2 m → nhắc "E – Ngồi" (dùng cơ chế nhắc tương tác hiện có của InteriorHud nếu có; nếu cần text mới → ghi đề xuất cho luồng D, tạm dùng sự kiện `window` như các điểm tương tác hiện có). **E** → `sitDown(playerSeat)`.
5. **Ngồi**: khóa di chuyển; đặt nhân vật tại ghế, quay về `studentFacing`, clip `sit` (kiểm độ cao để mông chạm mặt ghế 0.45 m). Camera bay mượt (0.8 s) tới **sau vai, ngang mắt 1.55 m, nhìn màn hình + bảng**. Khi `desktopOpen` → camera tiến sát màn hình (UI máy ảo phủ lên). **Esc** khi đang ngồi và không mở máy ảo → `standUp()`, nhân vật đứng dậy cạnh ghế (lối đi).
6. **Camera chung (đi bộ)**: (a) lerp vị trí/góc mượt hơn hiện tại, (b) va chạm tường không giật (giữ khoảng cách nhỏ nhất đã đạt trong 0.3 s rồi mới nới ra), (c) lăn chuột zoom khoảng cách 2–6 m (góc thứ ba), (d) chạy nhanh (Shift) FOV +5° có lerp. Không phá phím C (nhìn từ trên) và chế độ góc thứ nhất hiện có.

## Việc 3 (L6) — Thầy + màn chiếu

- `lesson/Teacher.tsx`: `CharacterModel` vai `roles.teacher`, đứng tại `teacherSpots.lecture`, mặt quay +u (về lớp). Luôn hiện ở phòng 406 (kể cả khi chưa bắt đầu buổi học — đứng ở `teacherSpots.desk`, clip `sit`? không cần: đứng `idle`).
  - `dialogue` / `summary`: quay mặt về người chơi (lerp), clip `interact` lặp 1 lần rồi `idle`.
  - `lecture`: đứng cạnh màn chiếu, clip `interact` mỗi lần `slideIndex` đổi.
  - `question` / `exercise`: theo `lastResult`: đúng → `yes`, sai → `no` (mỗi lần kết quả mới).
  - Tắt animation khi người chơi ở tầng khác.
- `lesson/ProjectorScreen.tsx`: texture canvas 1024 × 768 vẽ slide hiện tại (`getCurrentStep` → `lecture.slides[slideIndex]`): nền trắng, tiêu đề xanh `#0b3d91`, khối code nền tối chữ mono, đoạn body. Ngoài pha lecture: slide bìa "Nhập môn lập trình — Buổi 1". Cập nhật texture chỉ khi slide đổi (`texture.needsUpdate = true`), không mỗi khung. Thêm 1 vệt sáng mờ (cone trong suốt, additive) từ máy chiếu tới màn.
- Bạn học ngồi (18 NPC) do **luồng B** làm (`npc/ClassroomNpcs.tsx`) — đừng làm trùng; chỉ cần để chỗ trống đúng `npcSeats`.

## Tiêu chí xong

- [ ] `typecheck` / `lint` / `build` sạch.
- [ ] Từ toàn cảnh: Buổi học → Bắt đầu → đứng trước thang máy tầng 4 B11 → đi vào 406 (pha tự sang `findSeat`).
- [ ] Đếm 40 bàn/ghế/màn hình đúng 4 dãy × 10, lối đi giữa, không đi xuyên bàn. `renderer.info.render.calls` trong phòng ghi vào báo cáo.
- [ ] E ngồi → camera sau vai → máy ảo mở ở bước bài tập → Esc đứng dậy được.
- [ ] Màn chiếu đổi đúng 2 slide; thầy gật/lắc theo đúng/sai.
- [ ] Camera đi bộ: zoom lăn chuột, không xuyên tường, chạy nhanh FOV đổi nhẹ.

## Mẫu báo cáo — `docs/tasks/L346-bao-cao.md`

```
File đã sửa/tạo:
Dòng cần thêm vào Campus.tsx (nếu có):
Kết quả typecheck / lint / build:
Đã kiểm tra tay (cách kiểm):
Draw call trong phòng 406:
Chưa chắc / rủi ro:
Đề xuất:
```
