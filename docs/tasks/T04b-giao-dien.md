# T04b — Chế độ góp ý (phần giao diện)

- Người làm: **Gemini (Antigravity) — luồng B**
- Worktree + nhánh riêng: `t04b-giao-dien` (chạy song song với luồng A `t04a-3d`)
- Đặc tả chung: `docs/tasks/T04-hover-click-gop-y.md` — đọc hết, nhưng **chỉ làm phần ghi dưới đây**.

## Phạm vi của bạn

Trong mục **B. Chế độ góp ý**: điểm **1** (TopBar), **3** (ReviewPanel), **5** (`load()` khi mở app).

1. `TopBar.tsx`: nút "Chế độ góp ý" (`toggleReviewMode`) + badge số ghi chú đang mở; khi bật có viền/nhãn cam.
2. `ReviewPanel.tsx` (mới): form draft (tên vật thể qua `getBuilding`, tọa độ, loại `REVIEW_CATEGORIES`, nội dung, tên người góp ý),
   danh sách ghi chú (lọc Đang mở / Đã sửa, nhãn GitHub + link "Mở trên GitHub", ẩn nút đổi trạng thái cho ghi chú GitHub),
   bấm dòng → `selectNote(id)` + `requestCamera(note.camera)`, nút Tải lại / Tải file / Nhập file, dòng trạng thái lưu, báo `error`.
   Desktop: panel phải; điện thoại: bottom sheet.
3. `App.tsx`: gọi `useReviewStore.getState().load()` một lần; gắn `<ReviewPanel/>` (chỉ hiện khi `reviewMode`).
4. `text.ts`: mọi chuỗi giao diện mới.

## Chỉ được sửa

`src/ui/**`, `src/App.tsx`. **Không** sửa `src/scene/**` (luồng A đang sửa), `src/data/**`, `src/types/**`, `src/store/**`, `scripts/**`, `vite.config.ts`, `review/**`.

## Thử khi chưa có phần 3D của luồng A

Luồng A đang làm việc bấm vào mô hình để tạo draft. Để thử panel, tạo draft giả từ console trình duyệt qua một dòng debug
(gắn `window.__review = useReviewStore` **tạm thời** trong `App.tsx`, xóa trước khi báo xong):
`__review.getState().setDraft({ targetId: 'b3', point: [150, 10, 40], camera: { position: [400, 250, 150], target: [100, 0, 0] } })`.

## Tiêu chí xong

- [ ] `npm run typecheck`, `npm run lint`, `npm run build` sạch; console sạch
- [ ] `npm run dev`: bật góp ý → draft giả → điền → Lưu → `review/notes.json` có ghi chú đúng
- [ ] Danh sách lọc được; bấm dòng → `cameraRequest` được đặt (kiểm qua console)
- [ ] `npm run build && npm run preview`: Lưu → mở tab GitHub "New issue" điền sẵn (**không** bấm Submit); Tải file / Nhập file chạy
- [ ] Chế độ điện thoại: panel thành bottom sheet, không che hết mô hình, cuộn được
- [ ] Đã xóa dòng debug `window.__review` và đưa `review/notes.json` về `[]`

## Báo cáo → `docs/tasks/T04b-bao-cao.md` (theo mẫu trong đặc tả chung)
