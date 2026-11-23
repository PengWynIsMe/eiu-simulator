# UI-02 — Chơi cảnh: khung, thoại, lựa chọn, slide

Đọc trước: `docs/it-silver/BAT-DAU-UI.md` (file được chạm, hình thức, mặc định), `HOP-DONG.md`, `data/silver.types.txt`. Dữ liệu qua `useSilver` từ `src/ui/silver/adapter.ts`. Wireframe là bố cục, không phải chữ cuối; chữ lấy trong bảng chuỗi (`text.ts`, hằng `ST`). Cách kiểm chung: chạy typecheck/lint/build, rồi mục 2–5 của `UI-TU-KIEM.md` cho màn này. Không chạm BE, scene, nội dung.

- Phụ thuộc: UI-00
- File: `screens/Play.tsx`, `steps/{Say,Choice,Slide}.tsx`

## Khung Play

```
[‹ Thoát]  Chương trình đầu tiên            [VI|EN][🔊]
 📍 406.B8 · CSE 103        Cảnh 3/12   ●●●○○○○ bước 3/7
┌──────────────────────────────────────────────────────┐
│                 vùng bước (giữa)                      │
└──────────────────────────────────────────────────────┘
[Bỏ qua cảnh]                                 [Tiếp ›]
```

- Dòng thông tin: `item.scene.place`, `item.courseCode` (nếu có), `itemIndex+1/itemCount`, `stepIndex+1/stepCount`. Ở 360 tách hai dòng; >8 bước dùng thanh thay chấm.
- [Tiếp ›] = `nextStep`, vô hiệu khi `!canContinue`. [Bỏ qua cảnh] = hộp `confirmSkip` → `skipItem`. [Thoát]/Esc = hộp `confirmExit` → `exitRun`.
- Đổi `item.id`: fade 150 ms, focus vào tiêu đề. Đổi bước: focus vào nội dung bước. Vùng bước phải nhận `key` = `item.id + step.id` để xóa trạng thái cục bộ.
- `play` null khi đang nạp → loading của UI-00.

## Say

Thẻ đáy màn, `max-w-3xl`: Avatar + tên + chữ chạy dần (`useTypewriter`, 30 ký tự/giây; reduced-motion: hiện hết). Bấm thẻ = hiện hết. [Tiếp] khi chữ chưa hết: lần bấm đầu chỉ hiện hết chữ. `narrator`: không ảnh, chữ nghiêng, giữa. Đổi ngôn ngữ: hiện hết chữ bản mới.

## Choice

Như Say + danh sách nút (dọc ở 360, hàng từ `sm` khi ≤ 2 lựa chọn). Chọn → `answer(id)`: nút chọn nền `#0b3d91` chữ trắng ✓, nút khác mờ; `reply` hiện thành lời của người nói; không đổi lại được. Không dùng màu đúng/sai.

## Slide

Thẻ giữa `max-w-2xl`: tiêu đề, `CodeBlock` nếu có `code`, thân chữ.

Tên người: player Bạn/You, thanh Thành, quyen Quyền, han Han (hai ngôn ngữ như nhau), teacher Giáo viên/Teacher, examiner Giám khảo/Examiner, guide Hướng dẫn/Guide, narrator rỗng.

| Khóa | VI | EN |
|---|---|---|
| `next` | Tiếp | Next |
| `finish` | Xong cảnh | Finish scene |
| `skipScene` | Bỏ qua cảnh | Skip scene |
| `sceneN` | Cảnh {i}/{n} | Scene {i}/{n} |
| `stepN` | Bước {i}/{n} | Step {i}/{n} |
| `confirmSkip` | Bỏ qua cảnh này? Câu chuyện vẫn đi tiếp, nhưng các bạn sẽ không nhắc lại cảnh này. | Skip this scene? The story goes on, but your friends will not mention it later. |
| `confirmExit` | Thoát về danh sách chương? Lần sau bạn bắt đầu lại từ đầu cảnh này. | Go back to the chapters? Next time you start from the beginning of this scene. |
| `tapReveal` | Bấm để hiện hết | Tap to show all |

`finish` thay `next` ở bước cuối cảnh.

## Tiêu chí xong

- Chơi hết một item bằng chuột và chỉ bằng bàn phím; bấm đúp [Tiếp] không nhảy hai bước (khóa nút tới khi `step.id` đổi).
- Chữ dài gấp ba: thẻ cuộn trong, nút vẫn thấy.
