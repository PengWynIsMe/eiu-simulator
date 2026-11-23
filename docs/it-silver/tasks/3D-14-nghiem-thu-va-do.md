# 3D-14 — Nghiệm thu trọn bản thử

Đọc: `docs/it-silver/PLAN-3D.md` (mục 1, 4), `data/silverWorld.types.txt`, `AGENTS.md` mục 5. Không thêm thư viện, không `any`, không tạo object trong `useFrame`. Không sửa JSON nội dung, `src/types/silver.ts`, `src/store/useSilverStore.ts`, `src/silver/**`, `src/ui/silver/**`. Không commit/push khi điều phối chưa bảo.

- Phụ thuộc: 3D-13
- Người làm: Codex gpt-6.1-terra, ~3 giờ
- File được chạm: `docs/it-silver/anh-3d/**`, `docs/it-silver/3D-BAO-CAO.md`

## Kiểm

1. Ba chương trọn vẹn: theo thứ tự, vào thẳng 2.2, tiếp tục giữa chừng, thoát rồi vào lại, "Tới nơi luôn" hết, bản 2D.
2. VI và EN; chuột/bàn phím/cảm ứng; 360, 768, 1440; `prefers-reduced-motion`; localStorage bị chặn.
3. Mọi cảnh trong `stages.json` (32): xuất hiện đúng, E chạy, đứng dậy được, không kẹt.
4. Hồi quy nmlt-01, đi bộ, góp ý, tuyết.
5. Đo phút từng chương (đề xuất số mới cho màn đăng ký), FPS, draw call, tam giác, bộ nhớ, thời gian tải đầu.

## Tiêu chí

Tiêu chí BRIEF mục 8 + PLAN C6; bảng đạt/chưa; lỗi trả về task. Ảnh ≤ 150 KB, không quá 60 tấm.

## Cổng chung

`npm run typecheck && npm run lint && npm run build && npm run test:silver`. Báo cáo ngắn: file sửa, kết quả lệnh, ảnh, chỗ chưa chắc. Không bật dev server lâu hơn cần; tắt và đóng tab khi xong.
