# 3D-01 — WalkMode biết Activity

Đọc: `docs/it-silver/PLAN-3D.md` (mục 1, 4), `data/silverWorld.types.txt`, `AGENTS.md` mục 5. Không thêm thư viện, không `any`, không tạo object trong `useFrame`. Không sửa JSON nội dung, `src/types/silver.ts`, `src/store/useSilverStore.ts`, `src/silver/**`, `src/ui/silver/**`. Không commit/push khi điều phối chưa bảo.

- Phụ thuộc: 3D-00
- Người làm: Codex gpt-6.2-sol, ~4 giờ
- File được chạm: `src/scene/walk/WalkMode.tsx`, `PlayerCharacter.tsx`, `src/scene/walk/activityControl.ts` (mới), `src/scene/interior/types.ts` (thêm `type: "activity"`), `src/ui/interior/InteriorHud.tsx` (chỉ xử lý `activity`), `src/main.tsx` hoặc `App.tsx` (một dòng khởi động bridge)

## Làm

1. Bỏ mọi chỗ viết cứng `406.B11`, `b11ToWorld(...)`, `useLessonStore` khỏi `WalkMode`/`PlayerCharacter`; đọc `useActivityStore` + `activityControl.ts`.
2. Áp dụng `teleport`: đặt vị trí/hướng, tòa, tầng (`useWalkStore.setState` `walkMode`, `interior`), một lần cho mỗi `id`, kể cả khi `WalkMode` chưa mount (giữ lối cấp module như hiện nay).
3. Ngồi: dùng `seat.spot`, `seat.camera`, `screenCamera` thay số cứng; tốc độ lerp cũ. Yaw = `atan2(facing.x, facing.z)`; nhân vật `rotation.y` cùng công thức.
4. `inRange`: ghế ≤ 1,2 m; talk/look ≤ 1,8 m; ghi chỉ khi đổi. E ưu tiên: activity inRange → cửa/thang máy. Interactive kiểu `activity` để nút InteriorHud cũng gọi `interact()` (không còn giả `interior-door`).
5. Talk/look ở phase `engaged`: khóa di chuyển, nhân vật quay về đích, camera quay mượt 0,6 s rồi giữ; hết engaged trả quyền điều khiển.
6. Esc: `screenOpen` → đóng máy; `seated` → `standUp`; còn lại để UI/WalkHud xử lý. Một nơi duy nhất.

## Không đổi

Va chạm, cầu thang, camera đi bộ, ba góc nhìn, zoom, FOV chạy, phím C.

## Tiêu chí

- `grep -n "406\|useLessonStore" src/scene/walk/*.tsx` không ra gì.
- Bấm chuột vào nút nhắc ghế ngồi được, không bị ra khỏi nhà.

## Cách kiểm

Hồi quy dưới, thử 2 lần; leo thang B8/B11, thang máy; điện thoại 360 (cần ảo, nút Ngồi). Ảnh: trước thang máy, ngồi, sát màn hình, đứng dậy.

**Hồi quy nmlt-01 (bắt buộc):** 📚 → Bắt đầu → trước thang máy T4 B11 → vào 406 → ghế viền vàng → E ngồi → thầy chào → 2 slide đổi trên TV → câu hỏi sai rồi đúng → 2 bài code → tổng kết → cả lớp ra; Esc thu máy, Esc đứng dậy, ngồi lại tiếp; nút "Ngồi (E)" ở cảm ứng.

## Cổng chung

`npm run typecheck && npm run lint && npm run build && npm run test:silver`. Báo cáo ngắn: file sửa, kết quả lệnh, ảnh, chỗ chưa chắc. Không bật dev server lâu hơn cần; tắt và đóng tab khi xong.
