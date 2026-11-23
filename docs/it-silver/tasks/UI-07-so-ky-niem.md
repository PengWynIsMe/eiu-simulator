# UI-07 — Trang kỷ niệm và sổ

Đọc trước: `docs/it-silver/BAT-DAU-UI.md` (file được chạm, hình thức, mặc định), `HOP-DONG.md`, `data/silver.types.txt`. Dữ liệu qua `useSilver` từ `src/ui/silver/adapter.ts`. Wireframe là bố cục, không phải chữ cuối; chữ lấy trong bảng chuỗi (`text.ts`, hằng `ST`). Cách kiểm chung: chạy typecheck/lint/build, rồi mục 2–5 của `UI-TU-KIEM.md` cho màn này. Không chạm BE, scene, nội dung.

- Phụ thuộc: UI-00
- File: `screens/Memory.tsx`, `screens/Notebook.tsx`, `parts/MemoryPage.tsx`

## MemoryPage (dùng chung)

```
┌──────────────────────────────────────────┐
│ ┌─────────────┐   Năm 1 · Kỳ 1 — Level 1 │
│ │ ảnh 4:3     │   "câu lưu bút"          │
│ │ chú thích   │   Môn: POLS 133 …        │
│ └─────────────┘   Hoạt động: …           │
│                              (con dấu ◎) │
└──────────────────────────────────────────┘
```

360: xếp dọc. Màu giấy `#fffbeb`, viền `#e7d9b5`. `photoChoices.length > 1` và đang ở màn Memory: hàng chọn ảnh (radio) = `pickPhoto`.

## Memory (cuối chương)

Tiêu đề `memTitle`. `hasOld=false`: [Lưu vào sổ] = `saveMemory('replace')`. `hasOld=true`: hai nút [Giữ trang cũ] = `'keep-old'`, [Thay bằng trang mới] = `'replace'`, kèm `memAsk`. Esc/Thoát = hộp `memExit` → `exitRun`.

## Notebook

1440: hai trang một hàng; nhỏ hơn: một cột. Trên cùng `nbCount`. Chương chưa chơi **không** tạo trang giả. empty: hình 📖 + `nbEmpty` + nút về chương. Ngày `savedAt` theo ngôn ngữ (`vi-VN`/`en-GB`). [Thoát] = `openHome`.

| Khóa | VI | EN |
|---|---|---|
| `memTitle` | Trang kỷ niệm | Memory page |
| `saveMem` | Lưu vào sổ | Save to book |
| `keepOld` | Giữ trang cũ | Keep old page |
| `replaceMem` | Thay bằng trang mới | Use new page |
| `memAsk` | Chương này đã có một trang. Bạn muốn giữ trang nào? | This chapter already has a page. Which one do you want to keep? |
| `memExit` | Thoát mà chưa lưu trang này? Vào lại chương bạn sẽ thấy trang này lần nữa. | Leave without saving? You will see this page again when you resume. |
| `pickPhoto` | Chọn ảnh giữ lại | Choose a photo to keep |
| `memCourses` | Môn | Courses |
| `memActs` | Hoạt động | Activities |
| `nbTitle` | Sổ kỷ niệm | Memory book |
| `nbCount` | {n} trang | {n} pages |
| `nbEmpty` | Chưa có trang nào. Chơi xong một chương, trang đầu tiên sẽ ở đây. | No pages yet. Finish a chapter and your first page will appear here. |
| `savedOn` | Lưu ngày {d} | Saved {d} |

Cần chủ dự án (không chặn): ảnh kỷ niệm thật. Mặc định: khung gradient + 📷.

## Tiêu chí xong

Trang mới, trang cũ, chọn ảnh, sổ rỗng, 1 trang, 20 trang; đổi ngôn ngữ thì chữ trong trang đổi theo; không môn/hoạt động thì ẩn nhãn.
