# T05 — Camera bay tới tòa nhà / bay về tổng quan + dọn cảnh báo console

- Người làm: **Gemini (Antigravity)** — luồng song song với T11 (Codex, nhân vật).
- Worktree + nhánh: `t05-camera-bay`. `npm ci` trước; dev ở cổng **5174**.

## Mục tiêu

1. Bấm một tòa nhà (chế độ thường) → camera **bay mượt** tới tòa đó, khung hình vừa đủ thấy trọn tòa, panel thông tin hiện bên phải không che tòa.
2. Bấm "Về tổng quan" / "Đóng" trên panel (đang gọi `clearSelection()`) → camera **bay về** `OVERVIEW_CAMERA`.
3. Hết cảnh báo console `THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`

## Được sửa

- `src/scene/CameraRig.tsx`
- `src/scene/kit/**`, `src/scene/zone1/**`, `src/scene/zone2/**` — **chỉ** để sửa cảnh báo `toNonIndexed` (không đổi hình dáng).

## KHÔNG được sửa

`src/scene/walk/**`, `public/models/**` (luồng T11 đang làm), `src/scene/Campus.tsx`, `src/App.tsx`, `src/ui/**`, `src/store/**`, `src/data/**`, `src/types/**`.
Cần gì ngoài phạm vi → đề xuất trong báo cáo.

## Yêu cầu

1. `CameraRig` theo dõi `useCampusStore((s) => s.selectedBuildingId)`:
   - Có id → lấy `getBuilding(id)` (`center: [x, z]`, `height`, `shape.outer` để biết kích thước) → `controls.setLookAt(..., true)`.
     Góc nhìn: từ phía cổng chính (+X) hơi chếch lên ~35°, khoảng cách tính theo cạnh dài khung nền (tòa nhỏ như ki-ốt không zoom quá sát: tối thiểu ~40 m).
     Dời điểm nhìn sang trái một chút trên desktop để tòa không bị panel (rộng ~400 px, bên phải) che. Điện thoại: panel ở dưới → dời điểm nhìn lên.
   - `null` (vừa bỏ chọn) → bay về `OVERVIEW_CAMERA`. **Không** bay khi app mới mở (lần đầu đã đặt sẵn).
2. Giữ nguyên xử lý `cameraRequest` (bay tới góc của ghi chú góp ý) — nếu cả hai cùng xảy ra, `cameraRequest` thắng.
3. Đang ở chế độ góp ý (`useReviewStore` → `reviewMode`): bấm tòa tạo draft, **không** bay (giữ như hiện tại).
4. Cảnh báo `toNonIndexed`: geometry nào đã non-indexed (vd sau `mergeGeometries` hoặc đã gọi trước đó) thì không gọi lại; kiểm `geo.index` trước khi gọi.
   Nguồn đã thấy: `kit/geometryHelpers.ts` (dòng ~95, 111, 129, 149), `zone2/Zone2Walkways.tsx` (dòng ~71, 87).

## Tiêu chí xong

- [ ] typecheck / lint / build sạch; **console không còn cảnh báo `toNonIndexed`**
- [ ] Bấm Block 3, Block 11, Highlands → bay mượt, thấy trọn tòa, không bị panel che; "Về tổng quan" → bay về toàn cảnh
- [ ] Chế độ góp ý: bấm tòa vẫn tạo draft, camera không bay
- [ ] Bấm ghi chú trong panel góp ý → vẫn bay về góc ghi chú
- [ ] Mô hình nhìn y như trước (so ảnh trước/sau một góc toàn cảnh)

## Báo cáo → `docs/tasks/T05-bao-cao.md` (file đã sửa, kết quả 3 lệnh, kiểm tra tay, ảnh, rủi ro, đề xuất)
