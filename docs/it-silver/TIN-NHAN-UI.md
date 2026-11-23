# Việc của agent máy đồng đội

Cứ làm tiếp UI theo `BAT-DAU-UI.md`, không màn nào bị bỏ. Phần chơi sẽ diễn ra trong lớp học 3D như buổi 406.B11 (`PLAN-3D.md`). Việc chia theo mục 6 của plan đó.

## A. Làm ngay

**A1. UI-00 → UI-08** trên nhánh `it-silver/ui`, bản 2D, dữ liệu giả. Thêm ba việc nhỏ:
1. Tạo `src/ui/silver/presentation.ts`: `export function useSilverPresentation(): { mode: 'overlay' | 'world' } { return { mode: 'overlay' }; }`. Trong `SilverLayer`: khi `mode === 'world'` và `screen === 'play'` thì trả `null`; khi `world` thì không gọi `exitWalkMode` và không chặn phím của trang.
2. Các bước (`Say`, `Choice`, `Slide`, `Question`, `Order`, `Code`) chỉ vẽ nội dung, lấp đầy thẻ cha; `fixed`, nền phủ, nút Tiếp/Bỏ qua/Thoát ở `Play.tsx`.
3. Home chừa `<div data-silver-slot="home-extra" />` cạnh nút Sổ kỷ niệm.

**A2. 3D-06** (`tasks/3D-06-view-dung-chung.md`) trên nhánh **riêng** `it-silver/view` từ `origin/main`. Chỉ task này được sửa `src/ui/lesson/**` và `src/ui/desktop/**`; điều này thay lệnh cấm trong `BAT-DAU-UI.md` cho nhánh đó. Không trộn vào `it-silver/ui`. `test:silver` chưa có trên main thì bỏ qua lệnh đó, ghi trong báo cáo. Buổi Nhập môn lập trình phải giống y như trước.

## B. Chờ báo

3D-04 và 3D-07 cần lõi bên kia (3D-00, 01, 02, 03, 05). Chủ dự án báo tên nhánh lõi đã lên GitHub thì mới bắt đầu: tạo nhánh từ nhánh đó, mỗi task một nhánh. 3D-09 và 3D-12 chờ chủ dự án duyệt bản chơi thử đợt 1.
Không tự viết lõi thay (WalkMode, Teacher, ClassroomNpcs, store): thiếu gì thì báo.

## C. Trước khi push

Chạy `UI-TU-KIEM.md` (A1) hoặc phần "Cách kiểm" của task, tự sửa đến khi đạt. Chỉ push nhánh của mình, không merge vào main. Với các task này, push nhánh sau khi tự kiểm đạt là được phép. Gửi lại báo cáo, tên nhánh, mã commit.
