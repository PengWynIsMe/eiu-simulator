# 3D-00 — Kho hoạt động dùng chung

Đọc: `docs/it-silver/PLAN-3D.md` (mục 1, 4), `data/silverWorld.types.txt`, `AGENTS.md` mục 5. Không thêm thư viện, không `any`, không tạo object trong `useFrame`. Không sửa JSON nội dung, `src/types/silver.ts`, `src/store/useSilverStore.ts`, `src/silver/**`, `src/ui/silver/**`. Không commit/push khi điều phối chưa bảo.

- Phụ thuộc: nhánh it-silver/be đã gộp
- Người làm: Codex gpt-6.2-sol, ~2 giờ
- File được chạm: `src/types/silverWorld.ts`, `src/store/useActivityStore.ts`, `src/silverWorld/lessonBridge.ts`, `scripts/silver/tests/activity.test.mjs`

## Làm

1. Chép nguyên văn `data/silverWorld.types.txt` → `src/types/silverWorld.ts`.
2. `useActivityStore`: zustand, thuần, không DOM. `begin`: đặt activity, `inRange=false`, `screenOpen=false`; `keepSeated` và đang ngồi → `seated=true`, `phase='engaged'`, không teleport; ngược lại `seated=false`, `phase='travel'` (`trigger:'none'` → `engaged`), teleport theo `teleportTo`. `arriveNow`: teleport tới điểm đứng cách target (ghế: `seat.stand`; không ghế: lùi 1,2 m theo `facing`, quay về đích); **không** tự kích hoạt. `setInRange(true)`: `travel`→`near`; false: `near`→`travel` trừ khi engaged. `interact`: chỉ khi `inRange` và `near`; có ghế → `seated`; `engaged`. `standUp`: `seated=false`, `screenOpen=false`, `phase='near'`, teleport `seat.stand`. `end`: về null. Ghi trạng thái như cũ → không phát sự kiện.
3. `lessonBridge.ts`: `startLessonBridge()` trả hàm hủy. Khi `useLessonStore` `goToClass`: dựng Activity từ `getClassroom(lesson.roomCode)` (dùng hàm nhận tham số `toWorld`, không import scene); `findSeat`/`sitDown`/`standUp`/`openDesktop` đồng bộ hai chiều, không vòng lặp. `phase` về `idle` → `end`.

## Tiêu chí

- Test: hành trình travel→near→engaged→standUp→near→engaged; keepSeated; arriveNow không tự ngồi; hai `begin` liên tiếp; bridge đồng bộ và không lặp (đếm số lần set).
- Chưa sửa hành vi nào của app.

## Cách kiểm

Test; chơi thử chưa đổi gì.

## Cổng chung

`npm run typecheck && npm run lint && npm run build && npm run test:silver`. Báo cáo ngắn: file sửa, kết quả lệnh, ảnh, chỗ chưa chắc. Không bật dev server lâu hơn cần; tắt và đóng tab khi xong.
