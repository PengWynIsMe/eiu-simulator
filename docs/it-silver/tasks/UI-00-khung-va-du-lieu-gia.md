# UI-00 — Khung, dữ liệu giả, điểm nối

Đọc trước: `docs/it-silver/BAT-DAU-UI.md` (file được chạm, hình thức, mặc định), `HOP-DONG.md`, `data/silver.types.txt`. Dữ liệu qua `useSilver` từ `src/ui/silver/adapter.ts`. Wireframe là bố cục, không phải chữ cuối; chữ lấy trong bảng chuỗi (`text.ts`, hằng `ST`). Cách kiểm chung: chạy typecheck/lint/build, rồi mục 2–5 của `UI-TU-KIEM.md` cho màn này. Không chạm BE, scene, nội dung.

- Phụ thuộc: `src/types/silver.ts` (BE-00 hoặc bản chép)
- File: `src/ui/silver/{adapter.ts,text.ts,SilverLayer.tsx}`, `mock/**`, `parts/**`, `src/App.tsx`, `src/ui/TopBar.tsx`

## Làm

1. `adapter.ts`: `export { useSilverMock as useSilver } …`, kèm kiểm kiểu `const check: UseSilver = useSilverMock; void check;`.
2. Mock là máy trạng thái nhỏ, đủ để chơi thử; **không** chép luật BE:
   - Chương `entrance`, `1.1`: hàng đợi 2 item, mỗi item là bản sao `playItem` (đổi `id`, `scene.id`; bỏ `courseCode` và `meeting`, `kind:'scene'`). `1.1` xong → `transcript` → `memory`. `entrance` → `memory`.
   - `2.2`: `recap` → `registration` → `week` → mỗi buổi trong `meetings` chơi bước 1, 2, 4 của `playItem` (có `courseCode`, `meeting`) → quay `week` → hết tuần: item `exam` gồm bước 4, 6, 7 → `memory`.
   - `toggleCourse`: đảo `selected` khi `status.code==='available'` và không `locked`; tính lại `credits`, `problem` (<3, >6), `minutes` = 31 + 2×(số môn − 4). `meetings` giữ nguyên fixture.
   - `answer`: so thẳng `answerId` / `answer.join(',')` / `answers.includes(trim)`. Feedback, `retry`, `revealAnswer`, `showHint`, `nextStep` theo HOP-DONG mục 4. Bước `s1`: hiện `text`.
   - `home` ban đầu: `resumeId:'1.1'`. `load()` đợi 300 ms rồi `ready`. Lưu `run` giả vào `sessionStorage['silver.mock']` để thử thoát/vào lại.
   - Tham số địa chỉ của BAT-DAU-UI mục 6, đọc **một lần** trong mock, gồm `state`: `loading` (đứng yên ở loading), `error`, `empty` (mảng rỗng / view null), `blocked`/`corrupt` (`saveWarning`), `old` (`hasOld`), `long` (nhân ba mọi `LocalizedText`; notebook 20 trang).
3. `SilverLayer`: `screen==='closed'` → `null`. Còn lại vẽ lớp phủ + màn; gọi `load()` một lần khi mở. `status` loading/error vẽ chung ở đây. `saveWarning` → `WarningBar` trên cùng, đóng được.
4. TopBar: nút `BTN` giống nút Buổi học, đặt ngay sau nó; ẩn khi `reviewMode` hoặc buổi học không `idle`; icon 🎓, chữ từ `sm`. Gọi `openHome`, `exitWalkMode`.
5. `parts`: `Panel`, hai loại nút, `Avatar({speaker})`, `ConfirmDialog` (focus bị giữ trong hộp, Esc = hủy), `Stepper({index,count})`.

## Khung chung

```
┌──────────────────────────────────────────────┐
│ [‹ Thoát]  Tiêu đề màn            [VI|EN][🔊] │ ← thanh trên, cao 56
├──────────────────────────────────────────────┤
│ ⚠ dải báo (nếu saveWarning)               [×] │
│            nội dung cuộn, max-w-4xl           │
├──────────────────────────────────────────────┤
│ [phụ]                              [nút chính]│ ← chân, dính đáy
└──────────────────────────────────────────────┘
```

Loading: thẻ giữa, vòng xoay + chuỗi. Error: thẻ + nút Thử lại (`load`) và Đóng. View null ở một màn: thẻ "không có gì để hiện" + nút về Home.

| Khóa | VI | EN |
|---|---|---|
| `open` | IT Silver | IT Silver |
| `title` | Cuộc sống IT Silver | IT Silver Life |
| `exit` | Thoát | Exit |
| `close` | Đóng | Close |
| `back` | Quay lại | Back |
| `home` | Về danh sách chương | Back to chapters |
| `loading` | Đang mở… | Opening… |
| `error` | Không mở được dữ liệu. | Could not open the data. |
| `retryLoad` | Thử lại | Try again |
| `nothing` | Chưa có gì để hiện ở đây. | Nothing to show here yet. |
| `warnBlocked` | Trình duyệt không cho lưu. Bạn vẫn chơi được, nhưng tiến độ sẽ mất khi đóng trang. | Your browser blocks saving. You can still play, but progress is lost when you close the page. |
| `warnCorrupt` | Bản lưu cũ bị hỏng nên đã bắt đầu bản mới. | The old save was damaged, so a new one was started. |
| `cancel` | Hủy | Cancel |
| `ok` | Đồng ý | OK |
| `sim` | Mô phỏng ngắn, lịch đã được sắp xếp lại để kể chuyện. Không phải thời khóa biểu hay đề thi chính thức của EIU. | A short simulation with a rearranged schedule. Not an official EIU timetable or exam. |

## Tiêu chí xong

- Nút mở được lớp; Esc/Đóng trả về như cũ, phím WASD trong lớp không lọt ra ngoài.
- Cả 8 màn mở được bằng địa chỉ (tạm là khung có tiêu đề), đủ loading/error/blocked/corrupt.
- Đổi ngôn ngữ ngay trong lớp.
