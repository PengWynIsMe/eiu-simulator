# UI-01 — Chọn chương (home) và lời dẫn (recap)

Đọc trước: `docs/it-silver/BAT-DAU-UI.md` (file được chạm, hình thức, mặc định), `HOP-DONG.md`, `data/silver.types.txt`. Dữ liệu qua `useSilver` từ `src/ui/silver/adapter.ts`. Wireframe là bố cục, không phải chữ cuối; chữ lấy trong bảng chuỗi (`text.ts`, hằng `ST`). Cách kiểm chung: chạy typecheck/lint/build, rồi mục 2–5 của `UI-TU-KIEM.md` cho màn này. Không chạm BE, scene, nội dung.

- Phụ thuộc: UI-00
- File: `screens/Home.tsx`, `screens/Recap.tsx`

## Home

```
 Cuộc sống IT Silver                       [📖 Sổ kỷ niệm]
 (câu mô phỏng ST.sim, chữ phụ)
 ┌ Tiếp tục: Năm 1 · Kỳ 1 — Level 1 ───────── [Tiếp tục] ┐  ← khi resumeId
 └───────────────────────────────────────────────────────┘
 Trước nhập học
 ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
 │ ✓ Đã chơi     │ │ ◐ Đang dở     │ │ Sắp có        │
 │ Tiêu đề       │ │ …             │ │ (mờ)          │
 │ phụ đề        │ │               │ │               │
 │ ~8 phút       │ │ [Tiếp tục]    │ │               │
 │ [Chơi lại]    │ │ [Chơi lại]    │ │               │
 └───────────────┘ └───────────────┘ └───────────────┘
 Năm 1 … Năm 2 … (nhóm theo chữ số đầu của id)
 [Xóa toàn bộ tiến độ] (chữ phụ, cuối trang)
```

Lưới 1 cột (360), 2 (768), 3 (1440). `entrance` nhóm riêng; `X.Y` nhóm "Năm X".
- `new` → [Bắt đầu] = `startChapter(id,'restart')`. `in-progress` → [Tiếp tục] `'resume'` + [Chơi lại]. `done` → [Chơi lại]. `coming-soon` → thẻ không bấm, `aria-disabled`.
- Đang dở chương khác (`resumeId` ≠ id) mà bấm Bắt đầu/Chơi lại, hoặc Chơi lại chính chương dở: `ConfirmDialog` `confirmReplace`.
- Xóa: `ConfirmDialog` `confirmClear` → `clearAll`.
- empty: `nothing`.

## Recap

Thẻ giữa `max-w-xl`: tiêu đề `recapTitle`, `recap.text`, dòng `recapNote`, nút [Bắt đầu] = `confirmRecap`, phụ [Về danh sách chương] = `exitRun`.

| Khóa | VI | EN |
|---|---|---|
| `notebook` | Sổ kỷ niệm | Memory book |
| `continue` | Tiếp tục | Continue |
| `start` | Bắt đầu | Start |
| `replay` | Chơi lại | Play again |
| `done` | Đã chơi | Played |
| `inProgress` | Đang dở | In progress |
| `comingSoon` | Sắp có | Coming soon |
| `minutes` | ~{n} phút | ~{n} min |
| `yearN` | Năm {n} | Year {n} |
| `beforeYear` | Trước nhập học | Before enrolment |
| `continueLabel` | Tiếp tục: {title} | Continue: {title} |
| `confirmReplace` | Bạn đang chơi dở một chương. Bắt đầu chương này sẽ bỏ phần đang dở; sổ kỷ niệm vẫn còn. | You have a chapter in progress. Starting this one drops it; your memory book stays. |
| `clear` | Xóa toàn bộ tiến độ | Erase all progress |
| `confirmClear` | Xóa tiến độ, lựa chọn và sổ kỷ niệm trên máy này? Không lấy lại được. | Erase progress, choices and the memory book on this device? This cannot be undone. |
| `recapTitle` | Câu chuyện đến đây | The story so far |
| `recapNote` | Bạn vào thẳng chương này, nên các mốc trước được coi là đã qua. | You jumped straight in, so earlier milestones count as done. |

## Tiêu chí xong

- Đủ 4 trạng thái thẻ, hộp xác nhận hai trường hợp, empty; phím Tab đi hết thẻ; tiêu đề dài không vỡ lưới.
