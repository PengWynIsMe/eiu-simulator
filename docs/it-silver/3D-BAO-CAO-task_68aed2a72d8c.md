# Báo cáo 3D-02 — Dữ liệu phòng B8 và va chạm

Task hoàn tất trên nhánh `PengWynIsMe/it-silver-3d-02`.

## Đã làm

- Thêm nguyên dữ liệu 406.B8 từ `docs/it-silver/data/classrooms-b8.json`; chỉ bổ sung `projector`, `ceilingLights: []` và `airConditioners: []` theo yêu cầu. Phòng 406.B11 giữ nguyên.
- Cập nhật `Classroom.frame` thành `'b11' | 'b8'`, thêm `companionSeat?` và `standPoint?`; loader kiểm tra ghế đồng hành tồn tại, không nằm trong `npcSeats` và khác ghế người chơi.
- Thêm va chạm bàn cho các dãy ghế 406.B8 vào mảng tường cố định tầng 4. Hai đầu mỗi dãy thụt 0,25 m, bàn giảng viên giữ nguyên chiều dài; các đoạn đều có `isRailing: true`.
- Bổ sung test: 32 ghế 406.B8, bảo toàn dữ liệu/40 ghế 406.B11, ghế đồng hành hợp lệ, số tường tầng 2/3 giữ nguyên, ví dụ hình học hàng 2 và BFS 0,1 m từ cửa đến điểm đứng dậy qua `resolvePosition` (bán kính 0,4 m), kiểm tra va chạm tại bàn.

## Cổng kiểm tra

| Lệnh | Kết quả |
|---|---|
| `npm ci` | Đạt; npm báo 13 cảnh báo audit trong dependency tree và cảnh báo deprecated của một số package. |
| `npm run typecheck` | Đạt |
| `npm run lint` | Đạt |
| `npm run build` | Đạt |
| `npm run test:silver` | Đạt, gồm 2 test mới cho phòng B8 |
| `npm run check:silver -- --strict` | Đạt; còn 6 cảnh báo VI trùng EN từ dữ liệu nội dung hiện có. |

## Ghi chú

- `projector.u = 89.85` là trung điểm giữa màn (u 91.2) và hàng bàn trước lớp (deskU 88.5); `v` lấy theo tâm màn. Kích thước dùng cùng giá trị B11 vì trường là bắt buộc nhưng B8 chưa vẽ máy chiếu.
- Chưa kiểm tra đi bộ bằng trình duyệt: nội thất/bàn ghế B8 hiển thị thuộc phần dựng cảnh khác, hiện task này chỉ cung cấp dữ liệu và va chạm. BFS trên hàm va chạm thật đã đạt tiêu chí đường đi.
- Không bật dev server hoặc mở tab Orca.
