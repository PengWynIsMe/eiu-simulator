# 3D-08 — Nghiệm thu đợt 1

Đọc: `docs/it-silver/PLAN-3D.md` (mục 1, 4), `data/silverWorld.types.txt`, `AGENTS.md` mục 5. Không thêm thư viện, không `any`, không tạo object trong `useFrame`. Không sửa JSON nội dung, `src/types/silver.ts`, `src/store/useSilverStore.ts`, `src/silver/**`, `src/ui/silver/**`. Không commit/push khi điều phối chưa bảo.

- Phụ thuộc: 3D-00 … 3D-07
- Người làm: Codex gpt-6.1-terra, ~1 giờ (không sửa code; lỗi trả về task)
- File được chạm: `docs/it-silver/anh-3d/dot-1/**`, `docs/it-silver/3D-BAO-CAO.md`

## Kiểm

1. `?silver3d=lab1` từ trang mới: sảnh/hành lang → thang máy T4 → 406.B8 → Han ở cạnh → E ngồi → thầy ra cạnh TV → slide trên TV → code sai → xem gợi ý → đúng → Han nói → Lab 2 ngồi nguyên.
2. "Tới nơi luôn" từ: ngoài trời, T1, tầng sai, trong phòng.
3. Đứng dậy, thoát, vào lại (tiếp tục đúng cảnh), tải lại trang; tắt đi bộ giữa lượt.
4. Hồi quy nmlt-01 đầy đủ; leo thang, B3/B11/căn tin vào ra.
5. Đo: FPS, draw call, tam giác, bộ nhớ tab trước/sau 5 phút; thời gian từ bắt đầu tới ngồi (đi bộ và bấm nút).

## Tiêu chí

Đạt hết mục 1–4; ≥ 50 FPS laptop; không lỗi console. Ảnh 8 tấm VI + 3 tấm EN, mỗi ảnh ≤ 150 KB. Chủ dự án xem **trước** đợt 2.

## Cổng chung

`npm run typecheck && npm run lint && npm run build && npm run test:silver`. Báo cáo ngắn: file sửa, kết quả lệnh, ảnh, chỗ chưa chắc. Không bật dev server lâu hơn cần; tắt và đóng tab khi xong.
