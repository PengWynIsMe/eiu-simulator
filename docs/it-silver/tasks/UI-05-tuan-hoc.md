# UI-05 — Tuần học

Đọc trước: `docs/it-silver/BAT-DAU-UI.md` (file được chạm, hình thức, mặc định), `HOP-DONG.md`, `data/silver.types.txt`. Dữ liệu qua `useSilver` từ `src/ui/silver/adapter.ts`. Wireframe là bố cục, không phải chữ cuối; chữ lấy trong bảng chuỗi (`text.ts`, hằng `ST`). Cách kiểm chung: chạy typecheck/lint/build, rồi mục 2–5 của `UI-TU-KIEM.md` cho màn này. Không chạm BE, scene, nội dung.

- Phụ thuộc: UI-04
- File: `screens/Week.tsx`

```
 Tuần học — Năm 2 · Kỳ 2               3/9 buổi
 ┌ WeekGrid: ✓ xong · ▶ buổi kế (viền vàng) · chưa tới ┐
 └─────────────────────────────────────────────────────┘
 Buổi kế: Lập trình và giải quyết vấn đề I — Lý thuyết · T4, Sáng 1
                                        [Vào buổi học]
```

- Trạng thái ô từ `done`, `current`; kèm ✓ / ▶, không chỉ màu. Buổi đã qua không bấm lại được.
- [Vào buổi học] = `playNext`. Thoát = hộp `confirmExit` → `exitRun`.
- Đầu tuần: `weekStart`. Không có `current`: `weekDone` + nút `toExam` = `playNext`. `meetings` rỗng: `nothing`.
- Đổi màn vào đây: cuộn tới buổi kế (360).

| Khóa | VI | EN |
|---|---|---|
| `weekTitle` | Tuần học | Your week |
| `sessions` | {i}/{n} buổi | {i}/{n} sessions |
| `nextSession` | Buổi kế: {name} | Next: {name} |
| `enter` | Vào buổi học | Go to class |
| `weekStart` | Một tuần tiêu biểu, đại diện cho cả kỳ. | One typical week stands for the whole term. |
| `weekDone` | Xong tuần học. Tiếp theo là cuối kỳ. | The week is done. Next: the end of term. |
| `toExam` | Đến cuối kỳ | Go to end of term |
| `sDone` | Đã học | Done |
| `sNow` | Buổi kế | Next |
| `sLater` | Chưa tới | Later |

## Tiêu chí xong

- Đúng ba trạng thái tuần (đầu, giữa, hết) ở ba cỡ; `aria-label` mỗi ô đọc đủ môn, loại, ngày, ca, trạng thái.
