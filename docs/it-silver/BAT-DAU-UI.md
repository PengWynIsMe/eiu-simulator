# Bắt đầu làm UI "IT Silver"

Bạn là agent làm **toàn bộ UI** của chế độ kể chuyện này, từ dữ liệu giả, rồi tự kiểm, tự sửa, chốt và push một nhánh. Chỉ cần repo này. Bên kia chỉ ghép và chỉnh rất nhẹ, nên phải đúng ngay.

## 1. Đọc theo thứ tự

1. File này. 2. `HOP-DONG.md` (mục 1, 3, 4). 3. `data/silver.types.txt` phần 6. 4. `data/ui-fixture.json`. 5. Các task `tasks/UI-00` … `UI-08`. 6. `UI-TU-KIEM.md`.
Khi cần bối cảnh: `BRIEF.md` mục 3, 4, 7; `docs/STYLE-3D.md`; `AGENTS.md` mục 5. Nếu `AGENTS.md` hay `BRIEF.md` trái với bộ tài liệu này về phần UI Silver, theo bộ tài liệu này (chuỗi UI để ở `src/ui/silver/text.ts`).

## 2. Cài, chạy, nhánh

```bash
git fetch origin
git switch -c it-silver/ui origin/main
npm ci
npm run dev -- --port 5190
```

Node 20. Không thêm thư viện. `src/types/silver.ts` chưa có thì: `cp docs/it-silver/data/silver.types.txt src/types/silver.ts` (không sửa một byte).

## 3. File

Được chạm: `src/ui/silver/**` (mới); `src/App.tsx` (1 import + `{!isCinematicActive && <SilverLayer />}` sau `<LessonLayer />`); `src/ui/TopBar.tsx` (1 nút); ảnh kiểm ở `docs/it-silver/ui-anh/**`; báo cáo `docs/it-silver/UI-BAO-CAO.md`; bản chép `src/types/silver.ts` nếu chưa có.
**Không** chạm: `src/scene/**`, `src/store/**`, `src/data/**`, `src/silver/**`, `src/ui/text.ts`, `src/ui/lesson/**`, `src/ui/desktop/**`, `package.json`, `AGENTS.md`, các tài liệu khác. Cần đổi → ghi vào báo cáo và dùng cách trong phạm vi.

## 4. Cấu trúc và điểm nối

```
src/ui/silver/
  adapter.ts        // export { useSilverMock as useSilver } from './mock/useSilverMock';  ← điểm nối DUY NHẤT
  mock/             // useSilverMock.ts, fixture.json (chép từ docs), chỉ được import bởi adapter.ts
  text.ts           // ST: chuỗi song ngữ { vi, en }
  SilverLayer.tsx   // chọn màn theo screen
  parts/            // Panel, PrimaryButton, SecondaryButton, Avatar, Stepper, ConfirmDialog, WarningBar, WeekGrid
  screens/          // Home, Recap, Registration, Week, Play, Transcript, Memory, Notebook
  steps/            // Say, Choice, Slide, Question, Order, Code
```

Mọi component lấy dữ liệu qua `useSilver`. Khi ghép, bên kia đổi đúng dòng trong `adapter.ts` thành `export { useSilverStore as useSilver } from '../../store/useSilverStore';`. Vì vậy **không** nơi nào khác được biết dữ liệu là giả.

## 5. Hình thức chung (bắt buộc)

- Tái dùng màu và hình khối UI sẵn có: nền phủ `bg-slate-900/70 backdrop-blur-sm`; thẻ `rounded-2xl bg-white p-4 sm:p-6 shadow-2xl text-slate-800`; tiêu đề `font-bold text-[#0b3d91]`; nút chính `min-h-[44px] rounded-xl bg-[#f5b700] px-6 text-sm font-bold text-slate-900 hover:brightness-105`; nút phụ `min-h-[44px] rounded-xl border-2 border-[#0b3d91] px-4 text-sm font-medium text-[#0b3d91]`; đúng `border-emerald-500 bg-emerald-50 text-emerald-800`; sai `border-red-500 bg-red-50 text-red-800`; vô hiệu `opacity-50 cursor-not-allowed`. Chữ thân 15px/24px, phụ 13px.
- Tái dùng được ngay (chỉ import, không sửa): `useT` (`src/ui/text.ts`), `useLangStore`, `LangToggle` (`src/ui/major/`), `MuteButton` (`src/ui/lesson/`), `CodeBlock`, `CodeSpans`, `MONO` (`src/ui/desktop/CodeBlock.tsx`), `useTypewriter` (`src/ui/desktop/`), `sfx` (`src/ui/audio/sfx.ts`). Không tái dùng `DialogueBox`, `QuestionCard`, `SlideViewer`, `CodeLab`, `EiuDesktop`, `Avatar` vì chúng gắn chặt `useLessonStore`: xem để giữ cùng phong cách, viết bản trình bày mới. `MuteButton` hiện chỉ có nhãn tiếng Việt: chấp nhận, ghi trong báo cáo.
- Lớp Silver: `fixed inset-0 z-[60]`, `role="dialog" aria-modal="true"`, `h-[100dvh]`; bên trong cuộn được, trang không cuộn. Mở lớp: `useWalkStore.getState().exitWalkMode()`.
- Đáp ứng ba cỡ: **360×740**, **768×1024**, **1440×900**. Không tràn ngang. Ở 360, chân màn chứa nút chính luôn thấy (`sticky bottom-0`, cộng `env(safe-area-inset-bottom)`).
- Bàn phím: Tab theo thứ tự nhìn, có vòng focus `focus-visible:ring-2 ring-sky-400`; Enter/Space bấm; phím `1`–`4` chọn đáp án ở Choice/Question; Esc mở hộp xác nhận thoát (ở Home/Notebook: đóng). Trong lớp, `stopPropagation` sự kiện `keydown`/`keyup` ở pha capture của phần tử lớp để cảnh 3D không nhận phím; vẫn phải để React nhận (dùng listener trên `window` pha capture chỉ chặn khi `e.target` không nằm trong lớp, còn trong lớp thì `onKeyDown` React gọi `e.stopPropagation()`). Focus nhảy vào tiêu đề màn khi đổi màn, trả lại nút mở khi đóng.
- Không dùng màu làm tín hiệu duy nhất (kèm ✓ ✕ 🔒). Tôn trọng `prefers-reduced-motion`. Vùng phản hồi `aria-live="polite"`.
- Song ngữ: mọi chữ qua `useT()`; đổi ngôn ngữ giữa chừng không mất trạng thái. Bài Anh văn giữ tiếng Anh ở cả hai bản là đúng.
- Trạng thái tải/lỗi: theo từng task. Nút bấm hai lần nhanh không được nhảy hai bước.

## 6. Dữ liệu giả

`mock/useSilverMock.ts` = `create<SilverApi>()` đọc `mock/fixture.json` (chép từ `docs/it-silver/data/ui-fixture.json`). Đặc tả ở UI-00. Tham số địa chỉ chỉ có tác dụng với mock: `?silver=home|recap|registration|week|play|transcript|memory|notebook` mở thẳng màn; `&state=empty|loading|error|blocked|corrupt|old|long`; `&step=1..7` cho play; `&lang=en`.

## 7. Thứ tự và git

UI-00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08. Mỗi task một commit nhỏ: `UI-03: màn đăng ký môn`. Sau mỗi task chạy typecheck, lint, build. Xong hết: làm trọn `UI-TU-KIEM.md`; đạt hết mới:

```bash
git fetch origin && git rebase origin/main
npm ci && npm run typecheck && npm run lint && npm run build
git push -u origin it-silver/ui
```

Rebase xong phải chạy lại vòng kiểm nhanh. Không force-push sau khi đã báo chốt, không merge vào main, không mở PR vào main. Nhánh ghép: `it-silver/be` → `it-silver/nd` → `it-silver/ui`.

## 8. Chỗ không rõ → mặc định

| Chỗ | Mặc định |
|---|---|
| Ảnh nhân vật | vòng tròn chữ cái đầu: Thành `#0b3d91`, Quyền `#0f766e`, Han `#b45309`, giáo viên `#475569`, giám khảo `#334155`, hướng dẫn `#0369a1`, người chơi `#f5b700` chữ đen; `narrator` không có ảnh |
| Ảnh kỷ niệm | khung polaroid 4:3, nền gradient `#bae6fd → #0b3d91`, emoji 📷 và chú thích |
| Con dấu | vòng tròn viền đôi `#dc2626`, xoay −8° |
| Nền cảnh | cảnh 3D hiện có, mờ qua lớp phủ; không điều khiển camera |
| Hiệu ứng | chỉ fade 150 ms |
| Âm thanh | `sfx.correct/wrong/bell/key` sẵn có |
| Spec thiếu | chọn cách đơn giản nhất giống UI hiện có, ghi một dòng trong báo cáo. Không dừng chờ |
| Spec trái kiểu dữ liệu | theo kiểu dữ liệu, ghi báo cáo |
| Phần "Cần chủ dự án" trong spec | dùng mặc định kèm theo |

## 9. Lệnh mẫu chủ dự án dán cho đồng đội

```
Kéo main mới nhất của repo eiu-simulator. Đọc docs/it-silver/BAT-DAU-UI.md và làm theo đúng file đó: làm hết UI-00 đến UI-08 bằng dữ liệu giả trên nhánh it-silver/ui, tự kiểm theo docs/it-silver/UI-TU-KIEM.md, sai thì tự sửa và kiểm lại, đạt hết mới push nhánh. Không merge vào main, không sửa file ngoài danh sách cho phép, không dừng hỏi: chỗ không rõ dùng mặc định ở mục 8. Xong thì gửi lại docs/it-silver/UI-BAO-CAO.md và mã commit.
```
