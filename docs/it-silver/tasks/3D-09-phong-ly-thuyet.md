# 3D-09 — Phòng 206, 207, 208, 311.B8

Đọc: `docs/it-silver/PLAN-3D.md` (mục 1, 4), `data/silverWorld.types.txt`, `AGENTS.md` mục 5. Không thêm thư viện, không `any`, không tạo object trong `useFrame`. Không sửa JSON nội dung, `src/types/silver.ts`, `src/store/useSilverStore.ts`, `src/silver/**`, `src/ui/silver/**`. Không commit/push khi điều phối chưa bảo.

- Phụ thuộc: 3D-02, 3D-03; chủ dự án duyệt đợt 1
- Người làm: Antigravity (dựng theo số), ~4 giờ
- File được chạm: `src/scene/silver/rooms/**`, `src/data/classrooms.json`, `src/scene/interior/B8Furniture.tsx` (chỉ bỏ bàn ghế khối của bốn phòng), `src/scene/interior/layouts/b8.ts` (vật cản)

## Làm

1. Thêm 206, 207, 311.B8 từ `classrooms-b8.json`; 208.B8 theo PLAN-3D mục 3 (không có TV).
2. `TheoryRoom`: bàn học, ghế, bàn GV, bảng, khung TV từ dữ liệu, mỗi loại 1 `instancedMesh`, ≤ 10 draw call một phòng, chỉ mount phòng đang là sân khấu; phòng khác giữ bàn ghế khối. Khi phòng là sân khấu thì **không** vẽ bàn khối cùng phòng. Không đổi tường, cửa, kính.
3. Màu: bàn `#d4a373`, ghế `#334155` (STYLE-3D), bảng trắng; mặt ghế cao 0,45 m, có lưng.
4. Vật cản: cùng cách thụt 0,25 m; sinh từ dữ liệu cho mọi phòng B8.

## Tiêu chí

BFS như 3D-02 cho ba phòng (206 từ (83; −200,3), 207 từ (81,9; −177,4), 311 từ (30,6; −177,4)); 12 bạn ngồi đúng ghế; số draw call tầng 2/3 khi không chơi không tăng.

## Cách kiểm

Ảnh từ cửa, sau vai, từ bục cho từng phòng; đi một vòng.

## Cổng chung

`npm run typecheck && npm run lint && npm run build && npm run test:silver`. Báo cáo ngắn: file sửa, kết quả lệnh, ảnh, chỗ chưa chắc. Không bật dev server lâu hơn cần; tắt và đóng tab khi xong.
