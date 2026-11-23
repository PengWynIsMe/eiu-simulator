# UI-04 — Đăng ký môn

Đọc trước: `docs/it-silver/BAT-DAU-UI.md` (file được chạm, hình thức, mặc định), `HOP-DONG.md`, `data/silver.types.txt`. Dữ liệu qua `useSilver` từ `src/ui/silver/adapter.ts`. Wireframe là bố cục, không phải chữ cuối; chữ lấy trong bảng chuỗi (`text.ts`, hằng `ST`). Cách kiểm chung: chạy typecheck/lint/build, rồi mục 2–5 của `UI-TU-KIEM.md` cho màn này. Không chạm BE, scene, nội dung.

- Phụ thuộc: UI-00
- File: `screens/Registration.tsx`, `parts/WeekGrid.tsx`

```
 Đăng ký môn — Năm 2 · Kỳ 2
 Chọn 3–6 môn. Bộ gợi ý đã chọn sẵn.
 ┌ Danh sách ───────────────────┐ ┌ Tuần dự kiến ────────┐
 │ ☑🔒 CSE 103  Lập trình…      │ │ WeekGrid (đọc)        │
 │     4 TC · Có lab · Trọng tâm│ │                       │
 │ ☑ MATH 112  Giải tích II     │ │ 4 môn · 15 TC · ~31 ph│
 │ ☐ CSE 204 … · Bản nhanh      │ │ ⚠ quá 35 phút…        │
 │ 🔒 MATH 113 — cần MATH 112   │ └───────────────────────┘
 └──────────────────────────────┘
 [Dùng lại bộ gợi ý]                    [Chốt đăng ký]
```

1440: hai cột 3:2. 768: hai cột 1:1. 360: một cột, tóm tắt "4 môn · 15 TC · ~31 phút" dính trên chân, WeekGrid thu gọn trong `<details>`.
- Hàng là `label` + checkbox thật. Thứ tự giữ nguyên như dữ liệu; chia nhóm: trong lịch (`suggested`), môn khác chọn được, chưa chọn được.
- `locked`: checkbox vô hiệu, 🔒 + `lockedCore`. `status.code`: `missing-prereq` → `needPrereq` với mã thiếu; `needs-confirmation` → `needConfirm`; `no-content` → `noContent`; `done` → `alreadyDone`. Đều vô hiệu, chữ lý do luôn hiện (không chỉ tooltip).
- Tier: `core` nhãn vàng, `summary` xanh nhạt, `quick` xám + giải thích `quickTip`.
- `problem` → dòng đỏ nêu rõ, [Chốt] vô hiệu. `minutes > 35` → nhắc vàng, không chặn. Thay đổi tổng đọc qua `aria-live`.
- [Chốt] = `confirmRegistration`; [Dùng lại bộ gợi ý] = `resetRegistration`; Thoát = hộp `confirmExit`.
- Dòng chữ phụ: `slotNote`. empty (`rows` rỗng): `nothing`.

## WeekGrid

Props: `meetings`, `names`, tùy chọn `done/current`. Bảng `<table>` 6 cột × 4 hàng (hàng: Sáng 1, Sáng 2, Chiều 1, Chiều 2); lab chiếm 2 hàng (`rowSpan`). Ô: mã môn + Lý thuyết/Lab/Dự án. Màu nền theo thứ tự môn xuất hiện: `#dbeafe #dcfce7 #fef3c7 #fce7f3 #ede9fe #e2e8f0`. Ở 360 đổi thành danh sách theo ngày (ngày trống bỏ). Không tính lại lịch.

| Khóa | VI | EN |
|---|---|---|
| `regTitle` | Đăng ký môn | Course registration |
| `regHelp` | Chọn {min}–{max} môn. Bộ gợi ý đã được chọn sẵn. | Choose {min}–{max} courses. The suggested set is already selected. |
| `credits` | {n} TC | {n} credits |
| `hasLab` | Có lab | Has lab |
| `core` | Trọng tâm | Focus |
| `summaryTier` | Tóm gọn | Short |
| `quick` | Bản nhanh | Quick |
| `quickTip` | Môn thứ 5 và 6 chơi bản nhanh, một buổi. | The 5th and 6th courses use a quick, one-session version. |
| `suggested` | Trong lịch gợi ý | In the suggested plan |
| `others` | Môn khác | Other courses |
| `unavailable` | Chưa chọn được | Not available |
| `lockedCore` | Môn trọng tâm của kỳ, không bỏ được | Focus course of this term, cannot be removed |
| `needPrereq` | Cần học trước tiên quyết: {codes} | Prerequisite needed: {codes} |
| `needConfirm` | Điều kiện chưa xác nhận | Requirement not confirmed yet |
| `noContent` | Chưa có nội dung | No content yet |
| `alreadyDone` | Đã học | Already taken |
| `tooFew` | Chọn ít nhất {min} môn. | Choose at least {min} courses. |
| `tooMany` | Nhiều nhất {max} môn. | At most {max} courses. |
| `longTerm` | Kỳ này dài hơn 35 phút. Bạn vẫn chốt được và thoát giữa chừng. | This term takes over 35 minutes. You can still confirm and leave midway. |
| `totals` | {n} môn · {c} TC · ~{m} phút | {n} courses · {c} credits · ~{m} min |
| `useSuggested` | Dùng lại bộ gợi ý | Use suggested set |
| `confirmReg` | Chốt đăng ký | Confirm |
| `week` | Tuần dự kiến | Planned week |
| `slotNote` | Ca học minh họa, mỗi ca 2 giờ. | Illustrative time slots, 2 hours each. |
| `days` | T2 T3 T4 T5 T6 T7 | Mon Tue Wed Thu Fri Sat |
| `slots` | Sáng 1 · Sáng 2 · Chiều 1 · Chiều 2 | Morning 1 · Morning 2 · Afternoon 1 · Afternoon 2 |
| `theory` | Lý thuyết | Theory |
| `lab` | Lab | Lab |
| `project` | Dự án | Project |

`min`: 3; `max`: `maxCourses`. `days`, `slots` tách theo dấu cách / ` · `, hoặc để mảng.

Cần chủ dự án (không chặn): bộ màu môn. Mặc định: sáu màu trên.

## Tiêu chí xong

- Đủ năm trạng thái môn và hai `problem`; đổi/thêm/đặt lại cập nhật tổng; lab hiện đúng 2 ca; 360 không tràn.
