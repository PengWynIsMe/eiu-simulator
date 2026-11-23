# Báo cáo kiểm UI — IT Silver (`it-silver/ui`)

- **Nhánh / commit chốt:** `it-silver/ui` (xem mã commit cuối trong báo cáo bàn giao)
- **Số vòng kiểm:** 2 vòng chính (+ chạy lại E2E sau khi chỉnh thanh đáy `Memory` ở 360px)
- **Lỗi tự tìm và đã sửa:**
  1. Liên kết mở thẳng `?silver=…` ở tab mới bị màn mở đầu tuyết (`SnowIntroOverlay`) che mất lớp Silver → bổ sung `endCinematic()` trong `mock/useSilverMock.ts` khi có tham số `?silver=`.
  2. Phím `1–4` ở `Choice.tsx` và `Question.tsx` không kích hoạt khi focus nằm trong lớp phủ (do `SilverLayer` chặn nổi bọt ở `#root` trước `window`) → gắn listener vào `[data-silver-overlay="true"]`, bỏ qua khi đang mở `[role="alertdialog"]` hoặc đang focus `<input>`/`<textarea>`.
  3. Khe hở 16–24 px dưới thanh dính đáy ở `360px`/`768px`/`1440px` làm thẻ bên dưới lọt qua và ở `Memory.tsx` (`hasOld=true`) che một phần câu hỏi giữ trang → bỏ `pb` của `<main>`, phủ nền đặc `bg-white` sát đáy cho footer của `Play`, `Registration`, `Week`, và đưa câu hỏi `memAsk` vào trong thanh đáy của `Memory`.
  4. Ký tự `▶` bị hệ điều hành vẽ thành emoji xanh → đổi sang SVG tam giác đơn sắc ở `Question.tsx`, `Code.tsx`, `WeekGrid.tsx`, `Week.tsx`.
  5. `adapter.ts` ban đầu có 2 dòng khớp `mock/` → gộp còn đúng 1 dòng `import { useSilverMock } from './mock/useSilverMock';` + `export { useSilverMock as useSilver };`.
- **Lệnh:**
  - `npm run typecheck`: 0 lỗi
  - `npm run lint`: 0 lỗi
  - `npm run build`: thành công (`tsc -b && vite build`)
  - `npm run test:silver`: chưa có trên `origin/main` (bỏ qua theo `docs/it-silver/TIN-NHAN-UI.md`)

## Bảng kiểm theo `docs/it-silver/UI-TU-KIEM.md`

| Mục | Đạt/Chưa | Ảnh / ghi chú |
|---|---|---|
| 1. Lệnh & quy tắc code | Đạt | `git diff --name-only origin/main...` chỉ gồm `src/types/silver.ts`, `src/ui/silver/**`, `src/App.tsx`, `src/ui/TopBar.tsx`, `docs/it-silver/ui-anh/**`, `docs/it-silver/UI-BAO-CAO.md`; chỉ 1 dòng `mock/` ngoài `mock/` nằm ở `adapter.ts`; 0 `any` / `@ts-ignore` / `console.log`. |
| 2. Chơi thử trọn luồng (chuột + bàn phím) | Đạt | Đã chạy qua TopBar → Home → `entrance`/`1.1` (7 bước + thử lại + xem lời giải) → Memory → Notebook; `1.1` Tiếp tục + xác nhận Chơi lại; `2.2` Recap → Đăng ký → Tuần 9 buổi → Thi → Kỷ niệm → Esc giữ chỗ; WASD không lọt ra WalkMode; bấm đúp `[Tiếp]` chỉ qua 1 bước; đổi VI↔EN không mất trạng thái. |
| 3. Mọi trạng thái (`?silver=…&state=…`) | Đạt | `blocked`, `corrupt`, `loading`, `error`, `empty`, `old`, `long` (chữ ×3 + 20 trang sổ); thao tác tay `too-few` ở Registration. Không tràn ngang ở `360×740`, `768×1024`, `1440×900` và zoom 200% (`720×450`). |
| 4. Bộ ảnh `.webp` (`docs/it-silver/ui-anh/`) | Đạt | Đủ **111** ảnh `.webp` (≤ 1440 px, lớn nhất 48.0 KB ≤ 150 KB) gồm 8 màn × VI/EN × 3 cỡ, Play 7 bước ở 360 & 1440 VI/EN, và các trạng thái ở mục 3. |
| 5. So spec, A11y, hiệu năng, Console | Đạt | 0 console error/pageerror; `prefers-reduced-motion` tắt chạy chữ & fade; focus nhảy tiêu đề khi đổi màn & trả nút mở khi đóng; mở Silver trên dev: DOM `6.1 ms`, rAF (CPU WebGL) `18.0 ms` (< 100 ms); FPS khuôn viên trước `2` / sau `3` (không giảm); TopBar 360 cao `32 px` 1 hàng. |
| 6. Thử ghép | Đạt | `src/store/useSilverStore.ts` chưa có trên `origin/main`; kiểm kiểu `const check: UseSilver = useSilverMock;` biên dịch sạch trong `adapter.ts` và giữ nguyên trỏ về mock. |
| A1 (`TIN-NHAN-UI.md`) | Đạt | Đã tạo `src/ui/silver/presentation.ts` (`mode: 'overlay'`), tách `<Panel>` về `Play.tsx` để 6 bước chỉ vẽ nội dung lấp đầy thẻ cha, và thêm `<div data-silver-slot="home-extra" />` cạnh nút Sổ kỷ niệm ở `Home.tsx`. |

- **Chỗ lệch spec và lý do:**
  - `MuteButton` tái dùng từ `src/ui/lesson/MuteButton.tsx` chỉ có nhãn tiếng Việt (theo `BAT-DAU-UI.md` mục 5 chấp nhận giữ nguyên).
  - Trong `ui-fixture.json`, kỳ `2.2` chỉ có 6 môn `status.code === 'available'` với `maxCourses = 6`, nên khi bấm tay trên mock đạt tối đa `6/6` (nhánh hiển thị lỗi `too-many` vẫn có sẵn trong `Registration.tsx` khi store BE cấp ≥ 7 môn hoặc hạ `maxCourses`); `transcript` trong `ui-fixture.json` mang điểm `B/B/C/C` nên chưa chụp riêng ca có 2 điểm `D` trên mock (màu điểm `D` `text-slate-600` không đỏ đã kiểm trong `Transcript.tsx`).
- **Mặc định đã dùng (`BAT-DAU-UI.md` mục 8):**
  - Avatar vòng tròn chữ cái đầu + bảng màu quy ước (`narrator` không avatar); ảnh kỷ niệm polaroid 4:3 gradient `#bae6fd → #0b3d91` + 📷; con dấu viền đôi `#dc2626` xoay −8°; fade 150 ms; âm thanh `sfx`; 6 màu nền môn học ở `WeekGrid`.
- **Đề xuất đổi hợp đồng:** Không.
- **Việc còn lại cho bên ghép:** Đổi dòng `import` trong `src/ui/silver/adapter.ts` sang `useSilverStore` từ `../../store/useSilverStore`.
