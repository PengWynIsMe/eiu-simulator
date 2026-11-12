# T04 — Hover/click tòa nhà + Chế độ góp ý — ĐẶC TẢ CHUNG

> **Chia 2 luồng chạy song song**, mỗi luồng một worktree + nhánh riêng:
> - **T04a — phần 3D** (`docs/tasks/T04a-3d.md`): chỉ sửa `src/scene/**`.
> - **T04b — phần giao diện** (`docs/tasks/T04b-giao-dien.md`): chỉ sửa `src/ui/**` + `src/App.tsx`.
> File này là đặc tả chung cho cả hai; mỗi luồng chỉ làm phần được giao trong file luồng của mình.

- Phụ thuộc: T03 xong.

## Mục tiêu

1. Rê chuột (hoặc chạm) vào tòa nhà / cổng / nhà xe → sáng lên + hiện tên.
2. Nút **"Chế độ góp ý"**: bật lên thì bấm vào vật thể hoặc mặt đất để để lại ghi chú (sai vị trí, sai hình dáng, thiếu công trình...).
   Ghi chú hiện thành ghim trên mô hình. Claude đọc ghi chú để sửa — **thay cho việc chụp ảnh rồi khoanh vùng**.

## Đã có sẵn (Claude làm — KHÔNG sửa)

- Kiểu: `ReviewNote`, `ReviewCategory`, `Vec3` trong `src/types/index.ts`.
- `src/store/useReviewStore.ts`:
  `reviewMode`, `toggleReviewMode()`, `notes`, `loaded`, `error`, `load()`, `draft`, `setDraft(draft | null)`,
  `submitDraft(category, text)`, `setNoteStatus(id, status)`, `deleteNote(id)`, `replaceNotes(notes)`,
  `selectedNoteId`, `selectNote(id | null)`, `author`, `setAuthor(name)`,
  `cameraRequest`, `requestCamera(pose)`, `clearCameraRequest()` ("hộp thư" để UI bảo camera bay tới một góc).
  `ReviewDraft = { targetId: string | null; point: Vec3; camera: { position: Vec3; target: Vec3 } }`.
- `src/data/reviewNotes.ts`: `REVIEW_CATEGORIES` (id + nhãn tiếng Việt), `canWriteRepoFile`, `downloadNotesFile(notes, author)`, `mergeNotesFile(file, notes)`.
- Lưu trữ tự động: khi `npm run dev` → ghi thẳng `review/notes.json` (plugin Vite); bản GitHub Pages → lưu trong trình duyệt.
- `useCampusStore`: `hoveredBuildingId`, `setHovered`, `selectedBuildingId`, `selectBuilding`, `clearSelection`.

## Được sửa / tạo

- `src/scene/Building.tsx` (gắn sự kiện), `src/scene/Ground.tsx` (bấm mặt đất), `src/scene/ReviewPins.tsx` (mới), `src/scene/Campus.tsx`
- `src/ui/ReviewPanel.tsx` (mới), `src/ui/TopBar.tsx`, `src/ui/text.ts`, `src/App.tsx`

## KHÔNG được sửa

`src/data/**`, `src/types/**`, `src/store/**`, `scripts/**`, `vite.config.ts`, `review/**`. Cần thêm gì → đề xuất trong báo cáo.

## Yêu cầu chi tiết

### A. Hover / click (mọi chế độ)

1. `onPointerOver` → `setHovered(id)`, `onPointerOut` → `setHovered(null)`; con trỏ thành bàn tay (`document.body.style.cursor`).
2. Tòa đang hover/chọn: sáng lên (emissive nhẹ hoặc viền), nhãn `shortName` nổi phía trên bằng `<Html>` của drei (chỉ dùng `<Html>` cho nhãn nhỏ).
3. Mỗi `Building` chỉ subscribe đúng phần của nó: `useCampusStore((s) => s.hoveredBuildingId === building.id)` — **không** để hover một tòa làm render lại cả trường.
4. Chế độ thường: click → `selectBuilding(id)` (camera bay tới làm ở T05). `e.stopPropagation()` để click tòa không xuyên xuống đất.
5. Điện thoại không có hover: chạm = chọn, nhãn hiện khi đang chọn.

### B. Chế độ góp ý

1. **TopBar**: nút bật/tắt "Chế độ góp ý" + số ghi chú đang mở (badge). Khi bật, có viền/nhãn màu cam cho biết đang ở chế độ góp ý.
2. **Bấm khi đang bật** (thay cho select):
   - Bấm tòa/vật thể → `setDraft({ targetId: building.id, point: e.point, camera })`.
   - Bấm mặt đất → `setDraft({ targetId: null, point: e.point, camera })`.
   - `camera.position` = vị trí camera hiện tại; `camera.target` = điểm nhìn của `CameraControls` (lấy qua `useThree((s) => s.controls)` rồi `getTarget(vec)` — controls là `CameraControls` của drei, đặt `makeDefault`).
   - Kéo xoay camera **không** được tính là bấm (dùng `e.delta` > ~4 px thì bỏ qua).
3. **ReviewPanel** (bên phải desktop, bottom sheet trên điện thoại):
   - Có draft: hiện tên vật thể (`getBuilding(targetId)?.name`, hoặc "Ghim trên mặt đất"), tọa độ làm tròn; chọn loại (`REVIEW_CATEGORIES`), ô nội dung, ô "Tên người góp ý" (`author`/`setAuthor`); nút Lưu (`submitDraft`) / Hủy (`setDraft(null)`).
   - Danh sách ghi chú: lọc Đang mở / Đã sửa; mỗi dòng: loại, vật thể, nội dung, người ghi, thời gian; `resolution` nếu Claude đã ghi.
     Bấm một dòng → `selectNote(id)` + `requestCamera(note.camera)` (UI nằm ngoài Canvas nên **không** gọi controls trực tiếp;
     `CameraRig` nhận `cameraRequest`, gọi `controls.setLookAt(...position, ...target, true)` rồi `clearCameraRequest()`).
   - Nút "Đã sửa" / "Mở lại" (`setNoteStatus`), "Xóa" (hỏi xác nhận).
   - Dòng trạng thái: nếu `canWriteRepoFile` → "Đang lưu thẳng vào review/notes.json";
     ngược lại → "Bấm Lưu sẽ mở GitHub để gửi góp ý — nhớ bấm **Submit new issue**. Không có tài khoản GitHub? Dùng Tải file ghi chú".
   - **Góp ý dùng chung qua GitHub Issues** (store đã lo phần dữ liệu): ghi chú có `source === 'github'` là của cả nhóm, đọc từ Issue.
     Hiện nhãn "GitHub" + link **"Mở trên GitHub"** (`issueUrl`); **ẩn** nút Đã sửa/Mở lại/Xóa cho loại này (đổi trạng thái bằng cách đóng/mở Issue).
   - Nút **"Tải lại"** → `load()` (lấy góp ý mới của mọi người).
   - Nút "Tải file ghi chú" (`downloadNotesFile`) và "Nhập file ghi chú" (input file → `mergeNotesFile` → `replaceNotes`).
   - `error` khác null → hiện thông báo đỏ.
4. **ReviewPins**: mỗi ghi chú một ghim nhỏ tại `note.point` (cột mảnh + đầu tròn; đỏ = đang mở, xanh = đã sửa, vàng = đang chọn) + số thứ tự bằng `<Html>`.
   Bấm ghim → `selectNote(id)`. Ghim chỉ hiện khi bật chế độ góp ý. Dùng instancing nếu > 50 ghim.
5. `App.tsx`: gọi `useReviewStore.getState().load()` một lần khi mở app (`useEffect`).

## Bẫy cần tránh

- Bấm trúng ghim/tòa rồi xuyên xuống đất → luôn `e.stopPropagation()`.
- Không đọc/ghi `review/notes.json` trực tiếp — chỉ dùng action của store.
- Không tạo object trong `useFrame`. Nhãn `<Html>` chỉ cho tòa đang hover/chọn và ghim (không gắn sẵn cho mọi tòa).

## Tiêu chí xong

- [ ] `typecheck` / `lint` / `build` sạch, console sạch
- [ ] `npm run dev`: bật góp ý → bấm Block 3 → ghi "thử" → Lưu → **file `review/notes.json` có ghi chú đó** (đúng `targetId: "b3"`, có `point`, `camera`)
- [ ] Bấm mặt đất → ghim có `targetId: null`
- [ ] Bấm dòng ghi chú → camera bay về đúng góc lúc ghi
- [ ] `npm run build && npm run preview`: Lưu ghi chú → mở tab GitHub "New issue" đã điền sẵn (KHÔNG bấm Submit khi test);
      ghi chú vẫn lưu trong trình duyệt; "Tải file ghi chú" ra file JSON, "Nhập file" gộp lại được
- [ ] Chế độ điện thoại (DevTools): chạm ghi chú được, panel thành bottom sheet
- [ ] Xóa hết ghi chú thử trước khi báo xong (`review/notes.json` về `[]`)

## Mẫu báo cáo → `docs/tasks/T04-bao-cao.md`

```
File đã sửa/tạo:
Kết quả typecheck / lint / build:
Đã kiểm tra tay (từng mục tiêu chí):
Ảnh chụp màn hình (đường dẫn):
Chưa chắc / rủi ro:
Đề xuất:
```
