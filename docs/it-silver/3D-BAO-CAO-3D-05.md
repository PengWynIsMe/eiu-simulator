# Báo cáo 3D-05 — Đạo diễn Silver

Nhánh `PengWynIsMe/it-silver-3d-05`, bắt đầu từ `52f2d2e` (đã có 3D-00, 3D-01, 3D-02).
Các commit triển khai theo từng phần:
- `695dc11`: 3D-05: nạp và kiểm tra stages.json
- `656db28`: 3D-05: ánh xạ Classroom sang SeatAnchor và khai báo 208.B8
- `6cd4326`: 3D-05: tính waypoint chỉ đường đa chặng
- `ab72414`: 3D-05: chuyển PlayView sang ClassSignal
- `35affdc`: 3D-05: đạo diễn Silver nối useSilverStore với useActivityStore

## File đã tạo và sửa

- `src/data/silver/stages.json`: Chép từ `docs/it-silver/data/stages.json`, đủ 32 cảnh.
- `src/data/silver/stages.ts`: Nạp và kiểm tra 32 cảnh (`sceneId` duy nhất, tọa độ hữu hạn, `sit` có phòng/ghế riêng, kiểm tra `seatId` khi phòng có trong `classrooms.json`, phòng chưa có ở đợt 1 coi như vắng).
- `src/silverWorld/seatAnchor.ts`: Chuyển đổi `Classroom` sang `SeatAnchor` theo hướng nhìn f và vector phải r, mắt cao 1.55, nhìn TV cao 1.35; camera máy tính cho phòng thực hành máy (cao 1.08/1.05); điểm đứng `standPoint` (fallback 91.8, -142.0 cho 406.B11); khai báo riêng ghế, điểm đứng, camera cho 208.B8.
- `src/silverWorld/stageContext.ts`: Ghép `StageSpec` thành `Activity` cho `useActivityStore` (key `silver:<sceneId>`, prompt song ngữ E, ghế từ `seatAnchor`).
- `src/silverWorld/director.ts`: `startDirector` lắng nghe `useSilverStore`: chuyển `screen === 'play'` và item đổi thì gọi `begin`; giữ tư thế ngồi `keepSeated` khi cùng phòng, cùng ngày; xác định `teleportTo='none'` (< 60 m cùng tầng, không đổi ngày) và `'arrival'` khi vào chương/tiếp tục/đổi ngày/khác nơi; kết thúc khi về `closed|home`; thoát lượt `exitRun()` nếu người chơi tắt `walkMode` giữa chừng; cảnh báo 1 lần khi `sceneId` lạ.
- `src/silverWorld/waypoint.ts`: `nextWaypoint` chỉ đường đa chặng (ngoài trời → cửa tòa nhà; sai tầng → thang máy kèm tầng; đúng tầng → cửa phòng; trong phòng → ghế/đích), thuần logic không import scene.
- `src/silverWorld/silverSignal.ts`: Chuyển `PlayView` sang `ClassSignal` (choice/say → talk, slide → slide, question/order → question, code → exercise, cảnh cuối môn → end, `result.id` tăng khi feedback đổi, ngôn ngữ theo `useLangStore`).
- Test:
  - `scripts/silver/tests/stages.test.mjs`: 2 ca kiểm nạp 32 cảnh, kiểm tra tính hợp lệ và đợt vắng.
  - `scripts/silver/tests/seatAnchor.test.mjs`: 3 ca kiểm khớp 406.B11 ± 0.1 m, 406.B8 và 208.B8.
  - `scripts/silver/tests/waypoint.test.mjs`: 2 ca kiểm dẫn đường đa chặng và bố cục tùy biến.
  - `scripts/silver/tests/silverSignal.test.mjs`: 2 ca kiểm ánh xạ chế độ và tăng `result.id`.
  - `scripts/silver/tests/director.test.mjs`: 3 ca kiểm giữ ghế, dịch chuyển, tiếp tục từ Home, cảnh lạ và tắt đi bộ.

## Bảng tiêu chí và kết quả

| Tiêu chí | Cách kiểm | Kết quả |
| --- | --- | --- |
| `stages.json` đủ 32 cảnh, `sceneId` duy nhất, tọa độ hữu hạn | `stages.test.mjs`: kiểm tra 32 phần tử, không trùng ID, tọa độ số thực hữu hạn | Đạt |
| Ràng buộc `sit` và kiểm tra `seatId` có thật trong phòng | `stages.test.mjs`: kiểm tra ném lỗi khi `sit` thiếu roomCode, ném lỗi khi `seatId` sai trong phòng có sẵn; bỏ qua kiểm tra ghế đối với phòng chưa nạp (đợt 1 coi như vắng) | Đạt |
| `seatAnchor.ts` khớp 406.B11 hiện tại ± 0.1 m | `seatAnchor.test.mjs`: đối chiếu tọa độ ghế, điểm đứng, mắt camera, điểm nhìn TV, camera máy với `lessonBridge`/`b11ToWorld` | Đạt (sai số tối đa 0.05 m ≤ 0.1 m) |
| Camera máy tính chỉ có ở phòng máy | `seatAnchor.test.mjs`: 406.B11 và 406.B8 có `screenCamera`, phòng lý thuyết không có (`null`) | Đạt |
| Khai báo ghế phòng 208.B8 | `seatAnchor.test.mjs`: ghế (29.44, -217.43), mắt cao 1.55, nhìn giám khảo cao 1.15 | Đạt |
| CSE 103 lab-1 → lab-2: `keepSeated`, không teleport | `director.test.mjs`: cùng phòng 406.B8, cùng ngày học, đang ngồi → `keepSeated: true`, `teleportTo: 'none'` | Đạt |
| lab-2 → MATH 112 A (ngày khác): teleport `arrival` 207.B8, không ngồi | `director.test.mjs`: đổi ngày, khác phòng → `keepSeated: false`, `teleportTo: 'arrival'` (cửa 207.B8) | Đạt |
| Tiếp tục lượt ở CSE 103/a từ Home: teleport cửa 207.B8 | `director.test.mjs`: vào play từ Home → `teleportTo: 'arrival'` tại cửa 207.B8 | Đạt |
| Dẫn đường đa chặng tới 406.B8: ngoài trời → cửa Nam; T1 → thang máy T4; T4 → cửa phòng; trong phòng → ghế | `waypoint.test.mjs`: mô phỏng từng vị trí của người chơi và kiểm tra `hint` cùng tọa độ trả về | Đạt |
| `sceneId` lạ: không `begin`, `console.warn` một lần | `director.test.mjs`: chuyển vào item có `sceneId` không tồn tại, kiểm tra `activity.begin` không được gọi và `console.warn` chỉ phát đúng 1 lần | Đạt |
| Tắt `walkMode` giữa lượt → gọi `exitRun()` | `director.test.mjs`: chuyển `walkMode: false` khi đang `screen === 'play'` → kích hoạt `silver.exitRun()` | Đạt |
| `PlayView` → `ClassSignal`: ánh xạ đúng kiểu bước | `silverSignal.test.mjs`: say/choice → talk, slide → slide, question/order → question, code → exercise, end → end | Đạt |
| Đổi `feedback` → `result.id` tăng | `silverSignal.test.mjs`: gửi feedback mới qua tracker tăng ID từ 1 lên 2, 3; giữ nguyên khi không đổi; `feedback = null` thì `result = null` | Đạt |
| Không import scene trong waypoint và logic đạo diễn | Kiểm tra import: `src/silverWorld/{waypoint,director,stageContext}.ts` không import từ `src/scene/**` | Đạt |
| Không vi phạm vùng cấm | Kiểm tra `git diff --stat it-silver/3d..HEAD`: không sửa file ngoài phạm vi brief | Đạt |

## Cổng kiểm tra

| Lệnh | Kết quả |
| --- | --- |
| `npm run typecheck` | Đạt (0 lỗi) |
| `npm run lint` | Đạt (0 lỗi) |
| `npm run build` | Đạt (Vite build thành công) |
| `npm run test:silver` | Đạt (84 ca kiểm thử đạt, trong đó có 11 ca kiểm mới cho 3D-05) |
| `npm run check:silver -- --strict` | Đạt (0 lỗi, 6 cảnh báo vi trùng en từ dữ liệu nội dung sẵn có) |

## Ghi chú

- Không bật dev server lâu hơn mức cần thiết; preview server không chạy.
- Không mở thêm tab Orca trình duyệt.
- Mọi thay đổi đều được commit cục bộ trên nhánh `PengWynIsMe/it-silver-3d-05`, không push và không merge.
