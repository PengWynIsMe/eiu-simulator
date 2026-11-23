# 3D-06 — Tách view buổi học

Đọc: `docs/it-silver/PLAN-3D.md` (mục 1, 4), `data/silverWorld.types.txt`, `AGENTS.md` mục 5. Không thêm thư viện, không `any`, không tạo object trong `useFrame`. Không sửa JSON nội dung, `src/types/silver.ts`, `src/store/useSilverStore.ts`, `src/silver/**`, `src/ui/silver/**`. Không commit/push khi điều phối chưa bảo.

- Phụ thuộc: không
- Người làm: Codex gpt-6.2-sol, ~2,5 giờ
- File được chạm: `src/ui/lesson/**`, `src/ui/desktop/**`

## Làm

Tách phần vẽ thành component nhận props, chuỗi là `string` đã giải ngôn ngữ; vỏ cũ giữ `useLessonStore` và truyền props:
- `views/DialogueView` (tên, màu ảnh, chữ, lựa chọn, `onChoose`, `onNext`), `views/SlideView` (tiêu đề, code, thân, chấm, `onNext`, `compact`), `views/QuestionView` (phía trên có `children` cho đoạn đọc/nghe, kết quả, `onRetry`, `onReveal`), `desktop/CodeLabView` (giá trị, chạy, output, gợi ý, `onNext`, `starsSlot?`), `desktop/DesktopView` (đăng nhập, cửa sổ, `labels`, `exitSlot`, `slides?`).
- View không import store (trừ ngôn ngữ) và không `fixed` (vỏ cũ giữ); chuỗi máy ảo qua prop `labels` để song ngữ.

## Tiêu chí

- nmlt-01 giống từng pixel (so ảnh); `grep useLessonStore src/ui/lesson/views src/ui/desktop/*View.tsx` trống.
- View chạy được bằng dữ liệu `docs/it-silver/data/ui-fixture.json` (bước s1, s2, s3, s4, s7) trong trang thử, xóa trang thử trước khi nộp.

## Cách kiểm

Ảnh 1440 và 360 cho từng view; phím Enter, Esc, 1–4 vẫn như cũ.

**Hồi quy nmlt-01 (bắt buộc):** 📚 → Bắt đầu → trước thang máy T4 B11 → vào 406 → ghế viền vàng → E ngồi → thầy chào → 2 slide đổi trên TV → câu hỏi sai rồi đúng → 2 bài code → tổng kết → cả lớp ra; Esc thu máy, Esc đứng dậy, ngồi lại tiếp; nút "Ngồi (E)" ở cảm ứng.

## Cổng chung

`npm run typecheck && npm run lint && npm run build && npm run test:silver`. Báo cáo ngắn: file sửa, kết quả lệnh, ảnh, chỗ chưa chắc. Không bật dev server lâu hơn cần; tắt và đóng tab khi xong.
