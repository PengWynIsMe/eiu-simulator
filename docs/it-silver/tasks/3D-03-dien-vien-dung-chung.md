# 3D-03 — Thầy, TV, bạn học dùng chung

Đọc: `docs/it-silver/PLAN-3D.md` (mục 1, 4), `data/silverWorld.types.txt`, `AGENTS.md` mục 5. Không thêm thư viện, không `any`, không tạo object trong `useFrame`. Không sửa JSON nội dung, `src/types/silver.ts`, `src/store/useSilverStore.ts`, `src/silver/**`, `src/ui/silver/**`. Không commit/push khi điều phối chưa bảo.

- Phụ thuộc: 3D-00
- Người làm: Codex gpt-6.2-sol, ~3 giờ
- File được chạm: `src/scene/lesson/{Teacher,ProjectorScreen,slideCanvas,Lesson406}.tsx|ts`, `src/scene/npc/{ClassroomNpcs,classroomPlan,sitPose}.ts|tsx`, `src/silverWorld/lessonSignal.ts`, `src/scene/silver/frame.ts`

## Làm

1. `frame.ts`: `toWorld(frame,u,v)`, `yawOf(frame, du, dv) = atan2(wx, wz)` qua vector thế giới (không `localDirToYaw`; B8 ngược dấu). `localDirToYaw` giữ cho mã cũ.
2. `Teacher`, `ProjectorScreen`, `ClassroomNpcs` nhận `room: Classroom`, `getSignal: () => ClassSignal`, `subscribe`, `crowd`; không import `useLessonStore`. Điều kiện mount (tòa/tầng) do nơi gọi.
3. Đường thầy: bỏ `DETOUR_U` cứng; tuyến từ `teacherSpots` và, nếu đoạn thẳng cắt bàn GV, vòng phía sau cách bàn 0,7 m; với 406.B11 đường đi phải giống hiện tại.
4. TV: `drawSlide` nhận `{slide, cover}` thay `COVER` cứng; chữ theo ngôn ngữ đã giải ở signal; vẽ lại khi đổi slide, đổi ngôn ngữ, đổi cover. Kích thước/hướng theo `projectorScreen`.
5. Bạn học theo `npcSeats.slice(0,crowd)`, đường ra cửa theo `room.door`/`aisle`; cử chỉ dựa `mode`, `result`.
6. `lessonSignal.ts`: dịch `useLessonStore` sang `ClassSignal` (cover "Nhập môn lập trình / Buổi 1").
7. `Lesson406` gom lại từ các phần trên. Thêm `sitYOffset?` cho phòng, mặc định 0,40.

## Tiêu chí

- `grep useLessonStore` trong `scene/lesson`, `scene/npc` chỉ còn ở `Lesson406`/`Classroom406` (viền ghế).
- 406.B11 giống trước: vị trí thầy, TV, 18 bạn, draw call không tăng.

## Cách kiểm

So ảnh trước/sau ở cùng góc: trong lớp, slide 2, câu hỏi (giơ tay), tổng kết.

**Hồi quy nmlt-01 (bắt buộc):** 📚 → Bắt đầu → trước thang máy T4 B11 → vào 406 → ghế viền vàng → E ngồi → thầy chào → 2 slide đổi trên TV → câu hỏi sai rồi đúng → 2 bài code → tổng kết → cả lớp ra; Esc thu máy, Esc đứng dậy, ngồi lại tiếp; nút "Ngồi (E)" ở cảm ứng.

## Cổng chung

`npm run typecheck && npm run lint && npm run build && npm run test:silver`. Báo cáo ngắn: file sửa, kết quả lệnh, ảnh, chỗ chưa chắc. Không bật dev server lâu hơn cần; tắt và đóng tab khi xong.
