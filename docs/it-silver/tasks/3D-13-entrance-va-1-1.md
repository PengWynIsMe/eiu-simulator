# 3D-13 — Ngày kiểm tra và Level 1

Đọc: `docs/it-silver/PLAN-3D.md` (mục 1, 4), `data/silverWorld.types.txt`, `AGENTS.md` mục 5. Không thêm thư viện, không `any`, không tạo object trong `useFrame`. Không sửa JSON nội dung, `src/types/silver.ts`, `src/store/useSilverStore.ts`, `src/silver/**`, `src/ui/silver/**`. Không commit/push khi điều phối chưa bảo.

- Phụ thuộc: 3D-10, 3D-11, 3D-12
- Người làm: Codex gpt-6.2-sol, ~3 giờ
- File được chạm: `src/silverWorld/**`, `src/scene/silver/**`, `src/ui/silverWorld/**`, `stages.json`

## Làm

1. Nối hết `entrance` và `1.1` theo `stages.json`; nghe bằng `speechSynthesis` + phụ đề (dùng bước của đồng đội), tờ đề dạng giấy trong khung.
2. Fade "Ít hôm sau"/"Giờ thể chất"/"Giữa kỳ" giữa các cảnh, chữ từ `scene.title`; `examiner` thay `teacher` ở `1.1/final`.
3. `choice` nói một-một: người đối diện gật khi chọn.

## Tiêu chí

Chơi trọn hai chương (theo thứ tự và vào thẳng từng cảnh) không kẹt; lựa chọn `1.1/greet-han` đổi câu Han ở CSE 103.

## Cách kiểm

Đo phút; ảnh mỗi cảnh; hai lượt với lựa chọn khác nhau cho trang sổ khác nhau.

## Cổng chung

`npm run typecheck && npm run lint && npm run build && npm run test:silver`. Báo cáo ngắn: file sửa, kết quả lệnh, ảnh, chỗ chưa chắc. Không bật dev server lâu hơn cần; tắt và đóng tab khi xong.
