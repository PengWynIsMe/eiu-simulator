# 3D-12 — Ngoài trời, bảng kết quả, 208, 311

Đọc: `docs/it-silver/PLAN-3D.md` (mục 1, 4), `data/silverWorld.types.txt`, `AGENTS.md` mục 5. Không thêm thư viện, không `any`, không tạo object trong `useFrame`. Không sửa JSON nội dung, `src/types/silver.ts`, `src/store/useSilverStore.ts`, `src/silver/**`, `src/ui/silver/**`. Không commit/push khi điều phối chưa bảo.

- Phụ thuộc: 3D-09
- Người làm: Codex gpt-6.1-terra, ~3 giờ
- File được chạm: `src/scene/silver/**`, `src/data/silver/stages.json` (chỉnh ± 2 m)

## Làm

1. Thử từng điểm `WorldSpot` ngoài trời bằng đi bộ: sân cửa Nam B8 (spawn (17,43; −158,06), Thành (17,91; −164,85), bảng (11,92; −164,99)), sân cỏ (−5,23; −154,84); đứng được, không trong cây, hồ, tường, cách cửa B8 > 4,5 m để E không tranh. Lệch thì dời ≤ 2 m trong `stages.json`.
2. Bảng kết quả: 1 mặt phẳng + khung, chữ vẽ canvas, song ngữ, chỉ hiện ở cảnh `entrance/result`. Không tên thật, không điểm thật.
3. Diễn viên ngoài trời: Thành đi vào cửa Nam sau `meet-thanh` (2 m rồi ẩn); Quyền đi ngang 8 m ở `1.1/after`; bốn bạn đứng ở sân cỏ, khởi động bằng clip có sẵn (`interact`, `idle`).
4. 208.B8: người chơi và giám khảo ngồi đối diện, camera như PLAN-3D mục 3.

## Tiêu chí

Ngoài trời ≥ 50 FPS khi đứng ở sân B8 (không thêm > 12 draw call); NPC nền vẫn ≤ 24.

## Cách kiểm

Ảnh ngoài trời 3 góc, 208, 311; đi bộ tự do vào từng điểm.

## Cổng chung

`npm run typecheck && npm run lint && npm run build && npm run test:silver`. Báo cáo ngắn: file sửa, kết quả lệnh, ảnh, chỗ chưa chắc. Không bật dev server lâu hơn cần; tắt và đóng tab khi xong.
