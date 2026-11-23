# 3D-10 — Trọn kỳ 2.2 trong 3D

Đọc: `docs/it-silver/PLAN-3D.md` (mục 1, 4), `data/silverWorld.types.txt`, `AGENTS.md` mục 5. Không thêm thư viện, không `any`, không tạo object trong `useFrame`. Không sửa JSON nội dung, `src/types/silver.ts`, `src/store/useSilverStore.ts`, `src/silver/**`, `src/ui/silver/**`. Không commit/push khi điều phối chưa bảo.

- Phụ thuộc: 3D-07, 3D-09
- Người làm: Codex gpt-6.2-sol, ~4 giờ
- File được chạm: `src/silverWorld/**`, `src/scene/silver/**`, `src/ui/silverWorld/**`, `src/data/silver/stages.json` (chỉnh tọa độ)

## Làm

1. Chạy hết 2.2 bằng nội dung thật: opening, 9 buổi, exam, closing, club; thẻ ngày khi đổi ngày (fade 0,6 s, tên thứ song ngữ từ `meeting.day`).
2. Diễn viên Quyền đi về thang máy khi `2.2/opening` xong (đi thẳng 4 m rồi ẩn); Thành, Han, Quyền theo `stages.json`.
3. Chế độ `exam`: không bong bóng gợi ý của Han, thầy không gật/lắc đến khi nộp.
4. Phòng lý thuyết: bìa TV = tên môn theo ngôn ngữ; đổi môn cùng ngày ngồi nguyên.
5. Mọi bước choice/order/nghe dùng view của đồng đội nếu 3D-11 xong, chưa thì bản tối thiểu.

## Tiêu chí

- Mặc định và hai biến thể (đổi sang CSE 204; thêm STAT 101) chơi trọn, không cảnh nào lùi về overlay; mỗi môn có tên hiện đúng.
- Vào thẳng từ từng item (dùng bản lưu giả) xuất hiện đúng cửa.
- Đo phút: bản đi bộ và bản "Tới nơi luôn", ghi báo cáo.

## Cách kiểm

Ảnh mỗi cảnh VI, 5 ảnh EN; `test:silver`; FPS ở lab và 207.

## Cổng chung

`npm run typecheck && npm run lint && npm run build && npm run test:silver`. Báo cáo ngắn: file sửa, kết quả lệnh, ảnh, chỗ chưa chắc. Không bật dev server lâu hơn cần; tắt và đóng tab khi xong.
