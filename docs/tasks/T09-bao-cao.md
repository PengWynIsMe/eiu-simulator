# Báo cáo T09 — Chế độ đi bộ

**File đã sửa/tạo:**
- `src/scene/walk/WalkMode.tsx` — nhân vật low-poly, WASD/mũi tên, Shift chạy, camera bám sau và xoay/zoom, va chạm ranh giới/tòa nhà/hồ/cầu.
- `src/ui/walk/WalkHud.tsx` — HUD desktop, cần cảm ứng và nút thoát; hotkey `V`/`Esc` được đặt ở component luôn mount để hoạt động từ chế độ tổng quan.
- `docs/tasks/T09-bao-cao.md` — báo cáo task.

**Kết quả npm ci / typecheck / lint / build:**
- `npm ci`: thành công; npm báo 13 lỗ hổng đã biết trong cây dependency hiện tại (2 low, 10 moderate, 1 high). Không chạy audit fix hay thêm thư viện.
- `npm run typecheck`: thành công, 0 lỗi.
- `npm run lint`: thành công, 0 lỗi.
- `npm run build`: thành công. Vite vẫn cảnh báo bundle JavaScript khoảng 1.07 MB vượt ngưỡng 500 kB; cảnh báo này có từ bundle Three.js và đã được HANDOFF ghi nhận.

**Đã kiểm tra tay (từng mục tiêu chí) + FPS:**
- Trình duyệt Chrome tại `http://localhost:5176/`: `V` chuyển vào walk mode, camera chuyển tới vị trí xuất phát và HUD hướng dẫn hiện ra.
- Chưa xác nhận được nhân vật hiển thị rõ: ảnh tại vị trí xuất phát bị cây lớn che gần hết khung hình. Cần kiểm tra lại vị trí/khoảng nhìn khi review.
- Chưa kiểm chứng WASD/mũi tên, Shift, kéo chuột, wheel, thoát `Esc`, va chạm tòa/ranh giới/hồ/cầu và joystick trên thiết bị cảm ứng. Thao tác giữ phím qua CUA bị timeout; chế độ mobile chưa được mở.
- Chưa kiểm tra console DevTools hoặc đo FPS; không có số đo FPS đáng tin cậy.

**Ảnh chụp màn hình (đường dẫn):**
- Không lưu được ảnh thành file trong workspace. Đã quan sát ảnh Chrome trực tiếp: walk mode/HUD hiện, nhưng cây che cảnh quanh nhân vật.

**Chưa chắc / rủi ro:**
- Vùng hồ dùng hình chữ nhật x=90..145, z=-65..-10 và hai hành lang cầu xấp xỉ 3 m quanh trục cầu. Đây là va chạm gần đúng, không phải hình học hồ/cầu được chia sẻ từ data.
- Vị trí xuất phát đúng brief `[245, 0, -28]`, nhưng cảnh bị cây che ở góc camera hiện tại.
- Chưa có kiểm chứng tương tác trong mobile và chưa đo mục tiêu ≥50 FPS.

**Đề xuất (cần gì từ luồng khác hoặc Claude):**
- Review trực quan vị trí xuất phát và camera; nếu cây che nhân vật, điều chỉnh điểm xuất phát hoặc cung cấp vùng trống chính xác trong phạm vi quyền sở hữu data/scene.
- Chạy lại checklist điều khiển, va chạm, mobile, console và FPS trong trình duyệt trước khi chấp nhận T09.

## Vòng sửa 1 — review của Claude

**Đã sửa:**
- Tách `cameraYaw` (chỉ thay đổi khi kéo chuột) khỏi `facingYaw` (nội suy theo hướng di chuyển). WASD/mũi tên lấy hướng từ `cameraYaw`, nên giữ D/A không thể ghi đè hướng strafe và làm camera quay vòng.
- Đổi hướng quay thân để nhân vật đi về phía trước, lưng hướng về camera bám sau.
- `V`/`Esc` bỏ qua hotkey khi event target nằm trong `input`, `textarea`, `select` hoặc `[contenteditable]`.
- Trạng thái kéo và tọa độ pointer dùng `useRef`; bỏ `dataset` trên canvas.

**Kiểm tra vòng sửa:**
- `npm run typecheck`: thành công.
- `npm run lint`: thành công.
- `npm run build`: thành công; còn cảnh báo bundle khoảng 1.07 MB vượt 500 kB.
- Chrome/DevTools Console: đã dispatch `V`, sau đó keydown `D` và keyup sau 2 giây. Walk mode và HUD xuất hiện; ảnh cho thấy nhân vật quay lưng về camera. Theo code, strafe chỉ đọc `cameraYaw`, không tự xoay camera. Chưa đo góc camera bằng instrumentation.
- Chưa hoàn tất dispatch `W`, `Shift+W`, va chạm Block 5 hoặc đo tốc độ tương đối; lần thao tác tiếp theo với DevTools bị timeout. Chưa kiểm tra ô ghi chú để xác nhận hotkey bị bỏ qua khi focus trong ô nhập.
