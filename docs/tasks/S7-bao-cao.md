# S7 — Báo cáo (luồng B Wave 2: bạn học trong phòng 406.B11)

## File tạo
- `src/scene/npc/sitPose.ts` — `SIT_Y_OFFSET`, `localDirToYaw(du, dv)`.
- `src/scene/npc/classroomPlan.ts` — dựng 18 `StudentSpec` từ `getClassroom('406.B11')`: vị trí ghế, đường ra cửa, thứ tự rời lớp, 2 bạn giơ tay, 3 bạn hoan hô; `samplePath` (không cấp phát).
- `src/scene/npc/ClassroomNpcs.tsx` — default export `ClassroomNpcs`, trả `null` khi không phải B11 tầng 4 (unmount → mixer không chạy).

## Dòng cần gắn (Claude gắn lại)
Tạm đã gắn trong worktree `src/scene/interior/InteriorScene.tsx`:
```tsx
import ClassroomNpcs from '../npc/ClassroomNpcs';
// ...ngay sau <InteriorFurniture ... />:
<ClassroomNpcs />
```
Cảnh nội thất vẽ sàn tầng đang đứng ở y = 0 (các tầng khác lệch `(otherF - floor) * FLOOR_HEIGHT`), nên NPC đặt y thẳng từ 0.

## SIT_Y_OFFSET = 0.40 (luồng A dùng cùng số)
Đo từ GLB (script Node ngoài `src/`): clip `sit` chỉ hạ node `root` y 0 → -0.15 (model) = -0.30 m sau scale 2.0. Đáy thân (mông) bind-pose ở 0.17625 → còn 0.02625 model = 0.0525 m trên gốc group. Mông ở 0.45 m ⇒ offset 0.45 − 0.0525 = 0.3975 ≈ **0.40**. Công thức: `group.position.y = sànY + SIT_Y_OFFSET`. Model nhìn +Z, clip sit không dịch x/z nên tâm cơ thể nằm đúng tâm ghế.

## Hướng
`localDirToYaw(du, dv) = atan2(du, dv) + B11_ROTATION_Y`. Script kiểm 5 hướng: lệch so với `atan2(wx, wz)` của `b11ToWorld(du, dv)` ≤ 1e-15. `studentFacing [-1,0]` → -1.4011 rad.

## Hành vi
- Mặc định ngồi (`sit`, y = SIT_Y_OFFSET), áo xoay vòng `roles.students[i % 8]`.
- `question` chưa có `lastResult`: 2 bạn cố định (vị trí 25% và 70% danh sách ghế) đứng ở khe sau ghế và phát `raiseHand`; có `lastResult` thì ngồi lại.
- Bài tập đúng: 3 bạn gần ghế người chơi nhất (không trùng người giơ tay) đứng lên phát `yes` 1 s rồi ngồi lại.
- `summary`: sau 2 s cả lớp đứng (`idle`) ở khe sau ghế; rồi lần lượt (0.8 s/bạn, ai gần cửa đi trước) `walk` 1.2 m/s theo khe sau ghế → lối giữa `aisle` (v giữa) → `door.u` → `door`; tới cửa thì ẩn. Rời `summary` (endLesson…) tất cả hiện lại ngồi.
- Không tạo object trong `useFrame` (chỉ ghi vào object `sim`/`sample` dựng sẵn).

## Kết quả lệnh
`npm run typecheck`, `npm run lint`, `npm run build` đều sạch (chỉ cảnh báo chunk > 500 kB cũ).

## Điểm chưa chắc / lệch brief
1. **`interact` (gõ phím mỗi 6–14 s) đang TẮT** (`TYPING_GESTURE = false` đầu `ClassroomNpcs.tsx`). Các clip Kenney (`interact-right`, `pick-up`, `emote-yes`) đều là tư thế đứng (chân thẳng, root không hạ) nên khi đang ngồi phải đứng bật dậy → 18 bạn liên tục nhấp nhô. Bật `true` để xem; muốn đẹp cần clip nửa người trên (layer chỉ xương arm/head) trong `CharacterModel` — ngoài phạm vi `npc/**`. Cùng lý do, bạn giơ tay / hoan hô là **đứng lên** ở khe sau ghế, không giơ tay trong khi ngồi.
2. `raiseHand` = `pick-up`, dài 0.33 s lặp → nhìn như vẫy/cúi nhấp nhô, chưa xem bằng mắt.
3. Chưa mở trình duyệt (không GPU): chưa xác nhận bằng mắt mông chạm ghế, chân không xuyên bàn, đường ra cửa không cắt ghế (khe sau lưng ghế rộng ~0.6 m, thân NPC ~0.4 m). `WALK_SPEED` 1.2 m/s là ước lượng như CampusNpcs.
4. Chân hạ y về 0 khi đứng lên là sàn tầng cục bộ; nếu luồng A thêm thảm/bệ nâng sàn phòng 406 thì cần cộng thêm.
