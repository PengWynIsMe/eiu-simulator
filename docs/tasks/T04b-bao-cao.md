# Báo cáo T04b — Chế độ góp ý (phần giao diện)

**Người làm:** Gemini (Antigravity) — luồng B  
**Worktree / Nhánh:** `t04b-giao-dien` (cổng dev: 5175)

---

### File đã sửa/tạo:
- `src/ui/text.ts`: Bổ sung toàn bộ chuỗi giao diện tiếng Việt cho TopBar, ReviewPanel (draft form, danh sách ghi chú, bộ lọc, thông báo trạng thái, lỗi, xác nhận xóa...).
- `src/ui/TopBar.tsx`: Thêm nút "Đi bộ" (`useWalkStore`, sáng màu xanh khi đang đi bộ), nút "Chế độ góp ý" (`useReviewStore`, viền + nhãn cam khi bật, badge hiển thị số lượng ghi chú đang mở `mo`).
- `src/ui/ReviewPanel.tsx` (mới): Dựng panel giao diện góp ý hoàn chỉnh gồm:
  - Header với tiêu đề, tổng số ghi chú, nút đóng.
  - Thanh công cụ thao tác: Tải lại (`load()`), Tải file ghi chú (`downloadNotesFile`), Nhập file ghi chú (`mergeNotesFile` + `replaceNotes`).
  - Dòng trạng thái lưu trữ (`statusDev` / `statusProd`) và thông báo lỗi `error` (nếu có).
  - Form draft: hiển thị tên vật thể (qua `getBuilding`), tọa độ làm tròn `[X, Y, Z]`, chọn loại góp ý (`REVIEW_CATEGORIES`), nội dung textarea, tên người góp ý (đồng bộ với store `author`), nút Lưu và Hủy.
  - Hướng dẫn trực quan khi chưa có draft.
  - Bộ lọc danh sách ghi chú: 3 tab "Đang mở", "Đã sửa", "Tất cả" kèm số lượng.
  - Thẻ ghi chú: loại góp ý, tên vật thể, trạng thái, nội dung, `resolution` (nếu có), người ghi, thời gian định dạng chuẩn tiếng Việt. Bấm vào thẻ gọi `selectNote(id)` và `requestCamera(note.camera)` để điều hướng camera.
  - Xử lý ghi chú từ GitHub (`source === 'github'`): hiển thị badge "GitHub", link "Mở trên GitHub", ẩn các nút đổi trạng thái/xóa cục bộ.
  - Thao tác ghi chú cục bộ: nút "Đã sửa" / "Mở lại" (`setNoteStatus`), nút "Xóa" (`deleteNote` kèm popup xác nhận).
  - Thiết kế responsive: Desktop là panel bên phải (`w-[410px]`); Mobile là bottom sheet (`max-h-[72vh]`, không che hết mô hình 3D, thanh cuộn độc lập).
- `src/App.tsx`: Gọi `useReviewStore.getState().load()` một lần khi mở app (`useEffect`), hiển thị `<ReviewPanel />` khi `reviewMode === true`, giữ nguyên dòng `<WalkHud />` của luồng C, lưu giữ trạng thái `reviewMode` trong `sessionStorage` để không bị đóng panel khi Vite reload.

---

### Kết quả typecheck / lint / build:
- `npm run typecheck` (`tsc -b --noEmit`): **0 lỗi**
- `npm run lint` (`eslint .`): **0 lỗi**
- `npm run build` (`vite build`): **Thành công**

---

### Đã kiểm tra tay (từng mục tiêu chí):
1. **`npm run dev` (cổng 5175):**
   - Bật nút "Chế độ góp ý": TopBar chuyển sang viền cam + nhãn "ĐANG BẬT", panel ReviewPanel mở ra.
   - Thử nghiệm draft giả (Block 3 `b3`, tọa độ `[150, 10, 40]`, camera pose): Form draft hiển thị chính xác tên `Block 3 — Tòa nhà Quản trị kinh doanh (b3)`.
   - Chọn loại "Sai hình dáng", điền nội dung "Tòa nhà Block 3 cần thêm cửa chính ở sảnh", tên "Minh Test" → Bấm "Lưu góp ý" → file `review/notes.json` được ghi đúng cấu trúc JSON với đầy đủ `id`, `createdAt`, `author`, `targetId`, `point`, `camera`, `category`, `text`, `status: "mo"`.
2. **Bộ lọc & Điều hướng camera:**
   - Bộ lọc tab: Đang mở (1), Đã sửa (0), Tất cả (1) lọc chính xác các thẻ ghi chú.
   - Bấm vào thẻ ghi chú: `selectedNoteId` được gán vào store, `cameraRequest` được đặt về đúng `{ position: [400, 250, 150], target: [100, 0, 0] }`.
   - Đổi trạng thái sang "Đã sửa": ghi chú chuyển sang trạng thái `da-sua`, badge chuyển màu xanh, file `review/notes.json` cập nhật `status: "da-sua"`.
3. **Nút "Đi bộ":**
   - Bấm nút "Đi bộ" trên TopBar: chuyển sang trạng thái hoạt động với màu xanh ngọc (`bg-emerald-600 ring-2 ring-emerald-400`), nhãn "Đang đi bộ". Bấm lại để tắt.
4. **`npm run build && npm run preview`:**
   - Dòng trạng thái hiển thị đúng thông điệp môi trường production: "Bấm Lưu sẽ mở GitHub để gửi góp ý — nhớ bấm Submit new issue. Không có tài khoản GitHub? Dùng Tải file ghi chú."
   - Bấm Lưu góp ý: `window.open` được kích hoạt với URL GitHub New Issue điền sẵn (`https://github.com/PengWynIsMe/eiu-simulator/issues/new?title=...&body=...&labels=gop-y`), đồng thời lưu bản ghi vào `localStorage`.
   - Nút Tải file ghi chú: tải file JSON có định dạng tên `gop-y-{author}-{timestamp}.json`.
   - Nút Nhập file: chọn file JSON và gộp thành công vào danh sách hiện tại.
5. **Chế độ điện thoại (Mobile viewport 375x667):**
   - Panel hiển thị dưới dạng bottom sheet bo tròn cạnh trên, có drag indicator, chiếm tối đa 72vh chiều cao màn hình, không che khuất phần trên của mô hình 3D, nội dung cuộn mượt mà.
6. **Dọn dẹp:**
   - Đã xóa biến debug `window.__review` khỏi `App.tsx`.
   - Đã reset nội dung `review/notes.json` về `[]`.

---

### Ảnh chụp màn hình (đường dẫn):
- Desktop: (ảnh lưu ngoài repo)
- Mobile bottom sheet: (ảnh lưu ngoài repo)

---

### Chưa chắc / rủi ro:
- Khi chạy `npm run dev`, plugin Vite ghi trực tiếp vào `review/notes.json` nằm trong thư mục dự án. Do Vite mặc định theo dõi toàn bộ thư mục root nên việc file này thay đổi sẽ kích hoạt sự kiện `[vite] page reload review/notes.json`. Luồng B đã chủ động dùng `sessionStorage` để giữ trạng thái `reviewMode`, tuy nhiên để trải nghiệm mượt mà không reload trang thì nên cấu hình Vite bỏ qua file này.

---

### Đề xuất:
- **Đề xuất cho Claude:** Trong file cấu hình Vite (`vite.config.ts`), bổ sung tùy chọn để Vite watcher bỏ qua thư mục `review/`:
  ```ts
  server: {
    watch: {
      ignored: ['**/review/**'],
    },
  },
  ```
  Điều này sẽ giúp Vite dev server không reload toàn trang khi lưu ghi chú vào `review/notes.json`.
