# Báo cáo task T04a — Hover/click + ghim góp ý (phần 3D)

- **Người thực hiện:** Gemini (Luồng A)
- **Nhánh / worktree:** `t04a-3d`
- **Cổng dev thử nghiệm:** 5174

---

## File đã sửa / tạo

1. **`src/scene/cameraUtils.ts` (mới):**
   - Helper trích xuất góc nhìn camera hiện tại (`CameraPose`: `position` và `target` lấy từ `CameraControls.getTarget()`), dùng chung an toàn giữa các component 3D, tái sử dụng vector tránh cấp phát bộ nhớ.

2. **`src/scene/CameraRig.tsx`:**
   - Theo dõi `cameraRequest` từ `useReviewStore`.
   - Khi có yêu cầu góc nhìn, gọi `controls.setLookAt(...position, ...target, true)` (chuyển động xoay mượt) rồi gọi `clearCameraRequest()`.

3. **`src/scene/Building.tsx`:**
   - Đăng ký sự kiện pointer: `onPointerOver` (sáng lên, con trỏ pointer, `setHovered`), `onPointerOut` (tắt sáng, khôi phục cursor), `onClick` (`e.stopPropagation()`, kiểm tra `e.delta > 4`).
   - Subscribe độc lập theo từng tòa nhà: `useCampusStore((s) => s.hoveredBuildingId === building.id)` và `selectedBuildingId === building.id`, đảm bảo không re-render toàn khuôn viên khi hover.
   - Nhãn `<Html>` (drei) nổi phía trên mái tòa nhà với tên viết tắt (`shortName`), chỉ hiển thị khi `isHovered || isSelected`.
   - Khi ở chế độ thường: click gọi `selectBuilding(id)`.
   - Khi ở chế độ góp ý: click gọi `setDraft({ targetId: building.id, point, camera })`.
   - Áp dụng hiệu ứng `emissive` sáng dịu khi hover và sáng rõ khi select cho cả thân tòa, mái và nhà xe.

4. **`src/scene/kit/BlockFacade.tsx`:**
   - Nhận props `isHovered` và `isSelected`.
   - Áp dụng hiệu ứng `emissive` lên thân tường và mái che cho các tòa mức 2 (Block 3, 4, 5).

5. **`src/scene/zone1/MainGate.tsx` & `src/scene/zone1/ParkingShed.tsx`:**
   - Nhận props `isHovered` và `isSelected`, phát sáng nhẹ đồng bộ khi rê chuột hoặc chọn cổng chính / nhà xe B5.

6. **`src/scene/Ground.tsx`:**
   - Bắt sự kiện click mặt đất: nếu `e.delta > 4` thì bỏ qua.
   - Khi chế độ góp ý bật: gọi `setDraft({ targetId: null, point: e.point, camera })` (`e.stopPropagation()`).
   - Khi chế độ thường: click ra đất gọi `clearSelection()`.

7. **`src/scene/ReviewPins.tsx`:**
   - Dựng ghim 3D gồm chân ghim nhọn (`cylinderGeometry`) và đầu tròn nổi bật (`sphereGeometry`).
   - Phân màu chuẩn theo đặc tả:
     - Đang chọn (`selectedNoteId === note.id`): vàng hổ phách (`#f59e0b`), phóng to scale, viền sáng.
     - Đang mở (`status === 'mo'`): đỏ cam (`#ef4444`).
     - Đã sửa (`status === 'da-sua'`): xanh ngọc (`#10b981`).
   - Nhãn số thứ tự `#{index + 1}` bằng `<Html>` trên đỉnh ghim.
   - Bấm ghim gọi `selectNote(note.id)` (`e.stopPropagation()`, bỏ qua drag `e.delta > 4`).
   - Render ghim tạm thời (`DraftPin`) màu cam nhấp nháy tại `draft.point` khi đang soạn góp ý.
   - Ghim chỉ hiển thị khi `reviewMode === true`. Hỗ trợ hiển thị ghim cho cả ghi chú cục bộ và ghi chú nguồn GitHub (`source === 'github'`).

---

## Kết quả typecheck / lint / build

- **`npm run typecheck`:** 0 lỗi (TypeScript 5.x strict).
- **`npm run lint`:** 0 lỗi (ESLint 9.x phẳng).
- **`npm run build`:** Thành công (Vite build sạch, xuất dist thành công).

---

## Đã kiểm tra tay (từng mục tiêu chí)

- [x] **`npm run typecheck`, `npm run lint`, `npm run build` sạch; console sạch:** Đã chạy và xác nhận 0 lỗi đỏ, console không phát sinh warning.
- [x] **Hover Block 3 → sáng + nhãn "Block 3"; hover tòa khác không làm render lại toàn bộ:** Mỗi `Building` chỉ subscribe đúng `s.hoveredBuildingId === building.id`, nhãn `<Html>` hiện đẹp phía trên mái.
- [x] **Góp ý bật: bấm tòa → draft có `targetId`, `point`, `camera` đúng; bấm đất → `targetId: null`; kéo xoay camera không tạo draft:** Đã kiểm tra logic raycast và xác nhận qua suite test Chrome CDP.
- [x] **Ghim hiện đúng chỗ, đúng màu; bấm ghim → `selectedNoteId` đổi:** Ghim hiển thị đầu tròn + chân nhọn cắm tại `note.point`, badge số thứ tự rõ ràng, click vào ghim cập nhật `selectedNoteId`.
- [x] **`requestCamera(pose)` từ console → camera bay mượt tới đúng góc:** `CameraRig` nhận `cameraRequest`, gọi `controls.setLookAt(px, py, pz, tx, ty, tz, true)` và dọn dẹp bằng `clearCameraRequest()`.
- [x] **Đã xóa dòng debug `window.__review` và đưa `review/notes.json` về `[]`:** File `review/notes.json` đã được dọn sạch về `[]`, code không còn sót biến debug window.

---

## Ảnh chụp màn hình (đường dẫn)

Đã chụp tự động qua Chrome headless CDP trong quá trình kiểm thử:
- Ghim nháp tạm thời (Draft Pin): `/tmp/campussim-test/draft-b3-pin.png`
- Ghim đã lưu trên Block 3: `/tmp/campussim-test/submitted-b3-pin.png`
- Ghim khi đang được chọn (vàng hổ phách + phóng to): `/tmp/campussim-test/selected-b3-pin.png`
- Hover Block 3 (sáng lên + nhãn): `/tmp/campussim-test/hover-b3.png`
- Click chọn Block 3: `/tmp/campussim-test/selected-b3.png`

---

## Chưa chắc / rủi ro

- Không có rủi ro kỹ thuật trong phạm vi 3D. Giao diện nhãn `<Html>` được đặt `pointerEvents: 'none'` để không cản trở tia raycast xuống tòa nhà bên dưới.

---

## Đề xuất

1. **Vite watcher:** Khi chạy `npm run dev`, nếu người dùng bấm "Lưu" ghi chú, file `review/notes.json` được ghi lại qua Vite middleware. Mặc định Vite watch toàn bộ root folder nên sẽ kích hoạt full-reload trang web.
   - *Đề xuất Claude thêm vào `vite.config.ts`:*
     ```ts
     server: {
       watch: {
         ignored: ['**/review/**'],
       },
     },
     ```
     giúp trải nghiệm lưu góp ý trên localhost mượt mà không bị reload trang.
