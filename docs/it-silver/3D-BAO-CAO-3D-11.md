# Báo cáo hoàn thành Task 3D-11 — Ghép UI đồng đội và Hồi quy NMLT-01

- **Task**: 3D-11 (`docs/it-silver/tasks/3D-11-ghep-ui-dong-doi.md`)
- **Nhánh thực hiện**: `PengWynIsMe/it-silver-3d-13`
- **Tài liệu tham chiếu**: `AGENTS.md`, `docs/it-silver/PLAN-3D.md`, `docs/it-silver/tasks/3D-11-ghep-ui-dong-doi.md`
- **Cổng kiểm tra đã vượt qua**:
  - `npm run typecheck`: **0 lỗi**
  - `npm run lint`: **0 lỗi**
  - `npm run build`: **Thành công**
  - `npm run test:silver`: **100% passed (76 suites / 76 ok)**
  - `npm run check:silver -- --strict`: **Clean (0 errors, 180 TC hợp lệ)**

---

## 1. Tóm tắt các hạng mục đã hoàn thành

### A. Ghép UI đồng đội & Chế độ hiển thị
- Tích hợp liền mạch hai chế độ hiển thị:
  - `world`: Chế độ 3D mặc định, tương tác trong không gian ảo qua `WorldLayer`.
  - `overlay`: Chế độ chơi nhanh 2D (lưu trạng thái qua `localStorage['campussim.silver.mode']`) hoặc tự động kích hoạt khi Canvas WebGL mất context.
- Các bước tương tác (`choice`, `question`, `order`, nghe audio `speechSynthesis` và phụ đề) được hiển thị dạng thẻ nổi trong khung 3D.
- Gắn nút "Chơi nhanh 2D" vào vị trí hợp đồng `data-silver-slot="home-extra"`. Truy cập trực tiếp từ nút 🎓, đã gỡ bỏ hoàn toàn cửa vào dev.

### B. Sửa lỗi TopBar: Không hiện chồng nút 🎓 và 📚
- **Hiện tượng**: Khi đang xem lịch học tuần (bấm nút 📚 mở bảng lịch học), nút 🎓 vẫn có thể xuất hiện cạnh bên gây chật chội và bấm nhầm.
- **Khắc phục**: Trong `src/ui/TopBar.tsx`, cập nhật điều kiện hiển thị nút 🎓:
  `lessonIdle && silverClosed && !reviewMode && !scheduleOpen`
- Khi người chơi mở lịch học (`scheduleOpen === true`) hoặc đang ở trong luồng học, nút 🎓 tự động ẩn. Nút 📚 và 🎓 không bao giờ hiện đè hoặc chen chúc nhau trên giao diện.

### C. Hồi quy NMLT-01 bằng phím thật (Đi bộ tới ghế)
Đã kiểm thử toàn bộ luồng học thực hành NMLT-01 bằng điều khiển bàn phím thực (WASD + phím chức năng E/Esc, tuyệt đối không dùng nút "Tới lớp ngay"):
1. Bấm nút 📚 trên TopBar $\to$ Mở lịch học $\to$ Bấm "Bắt đầu học".
2. Xuất hiện tại sảnh thang máy T4 B11 $\to$ Dùng phím WASD điều khiển nhân vật đi dọc hành lang vào phòng 406.B11.
3. Đến vị trí ghế ngồi viền vàng nhấp nháy $\to$ Nhấn phím `E` để ngồi vào bàn học.
4. Thầy Nam chào cả lớp, bắt đầu tiết giảng.
5. Hai slide bài giảng trình chiếu luân phiên trên màn hình TV treo tường.
6. Hoàn thành câu hỏi trắc nghiệm tương tác trên TV.
7. Mở máy tính bàn thực hành 2 bài code ảo trên EIU Virtual Desktop.
8. Hoàn thành bài thực hành $\to$ Nhấn Esc để thu máy tính, xem tổng kết tiết học NMLT-01.

---

## 2. Bằng chứng kiểm tra

Ảnh chụp kiểm thử tự động từ Chrome Headless (ANGLE WebGL):
- `01-topbar-schedule-open.png`: Giao diện TopBar khi mở bảng lịch học tuần, nút 📚 sáng, nút 🎓 ẩn hoàn toàn, không bị chồng đè.
- `02-nmlt01-walk-to-seat.png`: Nhân vật tiếp cận cửa phòng 406.B11 ở tầng 4.
- `03-nmlt01-seated-lesson.png`: Nhân vật ngồi vào bàn (phím E), Thầy Nam bắt đầu giảng bài và slide chiếu trên TV.
- `04-nmlt01-code-desktop.png`: Giao diện EIU Virtual Desktop với bài tập code NMLT-01.
- `05-nmlt01-summary.png`: Bảng tổng kết tiết học NMLT-01 sau khi hoàn thành.
