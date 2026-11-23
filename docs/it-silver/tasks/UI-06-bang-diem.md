# UI-06 — Bảng điểm

Đọc trước: `docs/it-silver/BAT-DAU-UI.md` (file được chạm, hình thức, mặc định), `HOP-DONG.md`, `data/silver.types.txt`. Dữ liệu qua `useSilver` từ `src/ui/silver/adapter.ts`. Wireframe là bố cục, không phải chữ cuối; chữ lấy trong bảng chuỗi (`text.ts`, hằng `ST`). Cách kiểm chung: chạy typecheck/lint/build, rồi mục 2–5 của `UI-TU-KIEM.md` cho màn này. Không chạm BE, scene, nội dung.

- Phụ thuộc: UI-00
- File: `screens/Transcript.tsx`

```
        Bảng điểm — Level 1
  ┌ Nghe  B ┐ ┌ Đọc  B ┐ ┌ Viết  C ┐ ┌ Nói  C ┐
              ✓ Qua Level 1
  Kết quả của nhân vật trong câu chuyện, không đánh giá
  năng lực thật của bạn. Tối đa hai điểm D là qua.
                                      [Tiếp tục]
```

Lưới 2×2 ở 360, 1×4 từ 768. Chữ điểm lớn: A emerald-700, B `#0b3d91`, C amber-700, D slate-600 (không đỏ, không coi là trượt). [Tiếp tục] = `confirmTranscript`. `transcript` null → `nothing`.

| Khóa | VI | EN |
|---|---|---|
| `trTitle` | Bảng điểm — Level {n} | Transcript — Level {n} |
| `listening` | Nghe | Listening |
| `reading` | Đọc | Reading |
| `writing` | Viết | Writing |
| `speaking` | Nói | Speaking |
| `passed` | Qua Level {n} | Level {n} passed |
| `trNote` | Kết quả của nhân vật trong câu chuyện, không đánh giá năng lực thật của bạn. Có tối đa hai điểm D là qua. | This is the character's result in the story, not a measure of your own English. Up to two Ds is a pass. |

## Tiêu chí xong

Thường, 2 điểm D, null; đọc màn hình đọc "Nghe: B".
