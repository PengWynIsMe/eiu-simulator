# Báo cáo T10 — Dữ liệu chi tiết tòa nhà

**File đã sửa/tạo:**
- `src/types/index.ts`: thêm `RoomEntry`, `RoomGroup`, `BuildingFloorDetail`, `InfoSource`, `BuildingDetail`.
- `src/data/building-details.json`: chuyển dữ liệu từ `BUILDING_SPECS`, thêm nguồn đã xác minh theo cập nhật của chủ dự án.
- `src/data/index.ts`: kiểm tra cấu trúc dữ liệu, kiểm tra ID thuộc `campus.buildings`, xuất `getBuildingDetail`.
- `src/ui/BuildingPanel.tsx`: đọc dữ liệu qua `getBuildingDetail`, hiển thị trạng thái nguồn màu xanh/vàng và liên kết khi có URL.
- `src/ui/text.ts`: giữ `TEXT` và `BUILDING_PANEL_TEXT`, xóa `BUILDING_SPECS` cùng các interface cũ, thêm nhãn nguồn.

**Kết quả typecheck / lint / build:**
- `npm ci`: thành công; npm báo một số dependency deprecated và 13 vulnerability trong dependency hiện có. Không cài/nâng cấp thêm gói.
- `npm run typecheck`: đạt.
- `npm run lint`: đạt.
- `npm run build`: đạt; Vite vẫn cảnh báo bundle lớn hơn 500 kB.
- `rg -n "BUILDING_SPECS" src`: không còn kết quả.

**Kết quả so sánh nội dung (x/19):**
- So sánh `JSON.stringify` theo từng ID, bỏ qua trường `source`: **18/18 khớp tuyệt đối**. Script so sánh tạm đã xóa.
- Brief nêu 19 công trình nhưng `BUILDING_SPECS` tại nhánh và `campus.json` đều chỉ có 18 ID; JSON mới bao phủ đủ 18 ID, không có ID thiếu hoặc thừa. Không tạo nội dung thứ 19 khi không có dữ liệu nguồn.
- Cả 18 nguồn dùng đúng trạng thái `xac-minh` và nhãn: `Số liệu thực tế — đồng nghiệp Hieuthao63d xác minh, 2026-11-13`.

**Đã kiểm tra tay:**
- Dev server chạy tại `http://localhost:5176/`.
- Chọn Block 3 và Block 11: nội dung panel, nhãn nguồn xanh và danh sách tầng hiển thị; bấm tab Tầng 2 ở Block 3 cập nhật nội dung tầng.
- Dùng viewport di động 390×844: panel vẫn hiển thị và thao tác được.
- Tạm đổi `b3.floors[0].floorNumber` thành chuỗi: app báo `Dữ liệu sai ở building-details.b3.floors[0].floorNumber: cần số`; đã hoàn tác và tải lại app.
- Console có warning `THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.` từ scene; sau khi khôi phục dữ liệu không còn lỗi runtime.

**Chưa chắc / rủi ro:**
- Số lượng 19 trong brief không khớp với dữ liệu nguồn thực tế ở worktree (18). Cần chủ dự án chỉ ra ID thứ 19 nếu có.
- Không có URL nguồn cho các số liệu; nhãn nguồn theo xác nhận trực tiếp của chủ dự án.

**Đề xuất:**
- Xác nhận có công trình thứ 19 cần thêm hay chỉnh brief thành 18.
- Giữ nguyên warning Three.js hiện có để xử lý ở task scene phù hợp.
