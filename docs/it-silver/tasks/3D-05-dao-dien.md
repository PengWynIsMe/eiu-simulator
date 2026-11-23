# 3D-05 — Đạo diễn Silver

Đọc: `docs/it-silver/PLAN-3D.md` (mục 1, 4), `data/silverWorld.types.txt`, `AGENTS.md` mục 5. Không thêm thư viện, không `any`, không tạo object trong `useFrame`. Không sửa JSON nội dung, `src/types/silver.ts`, `src/store/useSilverStore.ts`, `src/silver/**`, `src/ui/silver/**`. Không commit/push khi điều phối chưa bảo.

- Phụ thuộc: 3D-00, 3D-02
- Người làm: Codex gpt-6.2-sol, ~3 giờ
- File được chạm: `src/data/silver/stages.json`, `src/data/silver/stages.ts`, `src/silverWorld/{director,waypoint,silverSignal,seatAnchor,stageContext}.ts`, test

## Làm

1. `stages.json` chép từ docs; `stages.ts` kiểm: `sceneId` duy nhất, `roomCode` có thật hoặc null, `seatId` có thật, `sit` phải có phòng hoặc ghế riêng (208.B8 khai ghế tại `seatAnchor`), tọa độ hữu hạn. Phòng chưa có trong `classrooms.json` (đợt 1) → stage đó coi như vắng.
2. `seatAnchor.ts`: từ `Classroom` → `SeatAnchor`. Với hướng nhìn f và vector phải r (thế giới): mắt = ghế − 0,65 f + 0,15 r, cao 1,55; nhìn = tâm TV theo phương ngang, cao 1,35 (r lấy chiều +v khi f = +u, B11). Máy: mắt = ghế + 0,20 f cao 1,08; nhìn = ghế + 0,65 f cao 1,05; chỉ phòng máy. `stand` = `standPoint`. Phải khớp 406.B11 hiện tại ± 0,1 m (nếu `standPoint` thiếu: 91.8, −142.0 — số đang dùng trong `WalkMode`).
3. `director.ts`: `startDirector({ silver, activity })` nghe `useSilverStore`: `screen==='play'` và `play.item.id` đổi → `begin`. `teleportTo='none'` khi cùng tòa/tầng và cách `arrival` < 60 m và **không** đổi ngày; `'arrival'` khi vào chương/tiếp tục/đổi ngày/khác nơi; `keepSeated` khi cùng phòng, cùng `meeting.day` (hoặc cùng không có meeting) và đang ngồi. `screen` khác play/week/… theo PLAN-3D mục 4.5. `useWalkStore.walkMode` về false giữa lượt → `exitRun()`.
4. `waypoint.ts`: `nextWaypoint(pos, interior, target)` → `{ x, z, hint: 'door'|'elevator'|'room'|'target', floor?: number }`; dùng tham số bố cục truyền vào, không import scene.
5. `silverSignal.ts`: `PlayView` → `ClassSignal` (choice/say → talk; slide; question/order → question; code → exercise; cảnh cuối của môn → end; kết quả `feedback` đổi → `result.id` tăng). Văn bản theo `useLangStore`.

## Ví dụ

- CSE 103 lab-1 → lab-2: `keepSeated`, không teleport. lab-2 → MATH 112 A (ngày khác): teleport `arrival` 207.B8, không ngồi.
- Tiếp tục lượt ở `CSE 103/a` từ Home: teleport cửa 207.B8.
- Người ngoài trời tới cảnh 406.B8: waypoint cửa Nam B8; vào T1: thang máy, `floor: 4`; đúng tầng: cửa phòng; trong phòng: ghế.
- `sceneId` lạ: không `begin`, `console.warn` một lần.

## Tiêu chí

Mỗi ví dụ có test, dùng store giả. Không sửa store BE.

## Cách kiểm

Test; sau 3D-07 kiểm lại bằng chơi thử.

## Cổng chung

`npm run typecheck && npm run lint && npm run build && npm run test:silver`. Báo cáo ngắn: file sửa, kết quả lệnh, ảnh, chỗ chưa chắc. Không bật dev server lâu hơn cần; tắt và đóng tab khi xong.
