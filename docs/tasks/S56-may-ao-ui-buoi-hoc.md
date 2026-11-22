# S5+S6 — Máy tính ảo "EIU Desktop" + lớp UI buổi học (luồng D)

- Người làm: **Claude Sonnet #3** (agent nền) · Worktree/nhánh riêng · cổng dev **5176**
- Đọc trước: `AGENTS.md`, `docs/PLAN-GIAI-DOAN-2.md` (mục 3, 4). Không cài gói npm. Không commit.

## Mục tiêu

Toàn bộ buổi học `nmlt-01` chơi được **chỉ bằng UI 2D + store** (chưa cần phòng 3D): nhận lịch → (giả lập ngồi) → thầy chào → 2 slide → câu hỏi → máy ảo 2 bài Java → tổng kết. Đẹp, rõ, dùng được trên điện thoại.

## Được sửa / tạo

- `src/ui/desktop/**` (mới), `src/ui/lesson/**` (mới)
- `src/ui/text.ts` — **chỉ thêm** khóa mới (nhóm `// Buổi học`), không sửa khóa cũ
- `src/App.tsx` — **chỉ thêm** `<LessonLayer />` (1 import + 1 dòng JSX, sau `<InteriorHud />`)

## KHÔNG được sửa

`src/scene/**`, `src/store/**`, `src/data/**`, `src/types/**`, các file `ui/` cũ (trừ `text.ts`), config.

## Hợp đồng dùng được

```ts
import { useLessonStore, getCurrentStep, type LessonPhase } from '../../store/useLessonStore';
import { useWalkStore } from '../../store/useWalkStore';          // playerPos {x,z,y,floor}, playerSkin, setPlayerSkin
import { getLesson, getLessons, getClassroom } from '../../data'; // Lesson, Classroom (doorWorld cho la bàn)
import type { LessonStep, ExerciseStep, QuestionStep } from '../../types';
```

Store (đọc kỹ `src/store/useLessonStore.ts`, có chú thích):
- `phase`: `idle | goToClass | findSeat | dialogue | lecture | question | exercise | summary`
- `startLesson(id)`, `arriveAtClass()`, `sitDown(seatId)`, `standUp()`, `chooseOption(id)`, `submitExercise(exId, answer)`, `takeHint(exId)`, `nextSlide()`, `nextStep()`, `endLesson()`, `openDesktop()/closeDesktop()`
- `desktopOpen` tự bật ở bước `exercise`. `lastResult {correct, output, explain?}` của lần chọn/nộp gần nhất (dialogue: `explain` = câu thầy đáp lại, hiện ở bước kế).
- `stars` (3 → trừ 1 mỗi gợi ý, tối thiểu 1), `startedAt`, `finishedAt`.
- Console dev: `__lesson.getState().startLesson('nmlt-01')`. Kịch bản chạy thử đầy đủ đã kiểm (Claude) — store đúng.

## Việc 1 — `ui/lesson/LessonLayer.tsx` (gốc, gắn vào App)

Chọn component theo `phase`:

| phase | Hiện |
| --- | --- |
| `idle` | Nút nổi góc dưới-trái **"📚 Buổi học: Nhập môn lập trình"** → mở thẻ lịch (môn, giờ `lesson.time`, phòng, thầy, 5 phút) + nút **"Bắt đầu"** → `startLesson('nmlt-01')`. Ẩn nút khi `reviewMode`. |
| `goToClass` | `LessonHud`: thẻ nhỏ góc trên-trái "08:00 · Nhập môn lập trình · 406.B11" + **la bàn**: mũi tên xoay theo hướng từ `playerPos` → `classroom.doorWorld` (so với hướng camera: không có hướng camera trong store → mũi tên theo hướng Bắc bản đồ, ghi chữ khoảng cách "còn 23 m"). Nút **"Tới lớp ngay"** (dev + người chơi vội): gọi `arriveAtClass()`. |
| `findSeat` | HUD: "Tìm ghế có viền sáng và bấm E để ngồi". Tạm thời (đến khi luồng A làm ghế 3D) có nút **"Ngồi vào chỗ"** → `sitDown(classroom.playerSeat)`. |
| `dialogue` | `DialogueBox` |
| `lecture` | `SlideViewer` (bản 2D của màn chiếu) |
| `question` | `QuestionCard` |
| `exercise` | `EiuDesktop` (toàn màn hình) |
| `summary` | `LessonSummary` |

Mọi pha ≠ `idle`: nút nhỏ **"Thoát buổi học"** (xác nhận) → `endLesson()`. Phím **Esc** khi đang ở máy ảo → `closeDesktop()` (mở lại bằng nút "Mở máy tính").

## Việc 2 — `DialogueBox.tsx`, `SlideViewer.tsx`, `QuestionCard.tsx`

- **DialogueBox**: khung đáy màn hình, ảnh đại diện tròn (chữ cái đầu tên thầy, màu xanh EIU), tên `lesson.teacherName`, chữ chạy 30 ký tự/giây (bấm để hiện hết), rồi 2–3 nút lựa chọn → `chooseOption`. Nếu `lastResult?.explain` có (câu đáp lại của bước trước) → hiện bong bóng nhỏ phía trên 3 s.
- **SlideViewer**: thẻ lớn giữa màn hình kiểu slide: tiêu đề, khối code (dùng `CodeBlock` chung — Việc 4), đoạn giải thích. Chấm tròn chỉ số slide, nút **"Tiếp ›"** → `nextSlide()`.
- **QuestionCard**: thầy hỏi `prompt` + `CodeBlock` + 3 nút đáp án. Chọn → tô xanh/đỏ, hiện `lastResult.explain`. Đúng → nút **"Tiếp ›"** (`nextStep`); sai → được chọn lại.

## Việc 3 — Máy ảo `ui/desktop/`

- **`EiuDesktop.tsx`**: khung màn hình máy tính (viền đen bo góc, phủ ~92% màn hình, nền tối mờ phía sau), thanh tác vụ dưới (logo EIU chữ, đồng hồ thật `HH:MM`, tên SV).
  1. **Màn đăng nhập** (chỉ lần đầu trong buổi): ảnh nền gradient xanh, ô "Mã sinh viên" điền sẵn `EIU2026xxxx` (ngẫu nhiên 4 số), ô mật khẩu `••••••`, nút "Đăng nhập" (bấm là vào, hiệu ứng 0.6 s).
  2. **Desktop**: 3 icon — **Code Lab** (mở sẵn cửa sổ), **Bài giảng** (mở lại slide dạng cửa sổ, chỉ xem), **Thùng rác** (cửa sổ trống, vui).
- **`CodeLab.tsx`** (cửa sổ IDE giả, kiểu tối): tab tên `Main.java`, số dòng, code `step.template` tô màu bằng `CodeBlock`; chỗ `___` thay bằng **ô input** nhúng trong dòng (font mono, viền vàng nhấp nháy khi trống). Panel phải: `step.title`, `step.instruction`. Nút **▶ Chạy** (Enter cũng chạy) → `submitExercise(step.id, value)` → panel **Output** dưới: hiệu ứng "Đang biên dịch…" 0.5 s rồi gõ dần `lastResult.output` (xanh nếu đúng, đỏ nếu sai + `explain`). Nút **💡 Hỏi thầy** → `takeHint` → hiện gợi ý (ghi rõ "−1 ⭐"). Đúng → nút **"Bài tiếp ›" / "Nộp bài ›"** → `nextStep()`.
- Hiện số sao hiện tại ở góc cửa sổ.

## Việc 4 — `ui/desktop/CodeBlock.tsx` (tô màu Java tự viết)

Regex đơn giản, không thư viện: từ khóa (`public class static void int for if else return new`) tím, kiểu (`String System`) xanh ngọc, chuỗi `"..."` cam, số vàng, chú thích `//` xám. Trả về `<pre>` với `<span>`. Tách token cẩn thận để chuỗi chứa từ khóa không bị tô sai.

## Việc 5 — `LessonSummary.tsx`

Thẻ giữa màn hình: "Hoàn thành buổi học!", **sao** (`stars`, sao rỗng cho phần bị trừ), thời gian `finishedAt − startedAt` (mm:ss), số gợi ý, **con dấu** `lesson.passportStamp` (hình tròn viền đỏ, xoay −12°, hiệu ứng đóng dấu scale 1.6 → 1), câu thầy `step.text`. Nút "Về khuôn viên" → `endLesson()`.

## Thiết kế chung

- Tailwind, tông EIU: xanh dương đậm `#0b3d91` + vàng nhấn `#f5b700`, nền thẻ trắng bo góc 16 px, bóng mềm. Font hệ thống; code dùng `ui-monospace`.
- Chuỗi giao diện cố định vào `text.ts`; nội dung bài học **chỉ** lấy từ JSON qua `getLesson`.
- **Mobile (< 640 px)**: DialogueBox full chiều ngang, nút ≥ 44 px; máy ảo full màn hình, panel hướng dẫn chuyển lên trên code, bàn phím ảo không che ô input (cuộn tới ô khi focus).
- Mọi lớp UI có `pointer-events` đúng: không chặn kéo xoay canvas khi không cần.

## Tiêu chí xong

- [ ] `npm run typecheck`, `npm run lint`, `npm run build` sạch.
- [ ] Từ trang chủ, chỉ bấm chuột: Buổi học → Bắt đầu → Tới lớp ngay → Ngồi vào chỗ → chào → 2 slide → câu hỏi (thử sai rồi đúng) → bài 1 (thử `printf` sai, rồi `println`) → bài 2 (xin gợi ý, điền 5) → tổng kết 2 sao → Về khuôn viên.
- [ ] Thử chế độ thiết bị di động 390 × 844: làm hết được, không vỡ bố cục.
- [ ] Console không lỗi/warning đỏ.

## Mẫu báo cáo

```
File đã sửa/tạo:
Kết quả typecheck / lint / build:
Đã kiểm tra tay (cách kiểm, kèm đường dẫn ảnh chụp nếu có):
Chưa chắc / rủi ro:
Đề xuất (nếu cần đổi store):
```
