# Tin nhắn gửi đồng đội UI (dán nguyên văn)

Chào bạn, cảm ơn bạn đang làm UI. Chủ dự án bổ sung: màn **chơi** sẽ diễn ra trong khuôn viên 3D như buổi học 406.B11, nên bên mình làm lớp 3D. **Không màn nào của bạn bị bỏ, cứ làm tiếp đúng spec.** Chỉ thêm ba việc nhỏ:

1. Tạo `src/ui/silver/presentation.ts`: `export function useSilverPresentation(): { mode: 'overlay' | 'world' } { return { mode: 'overlay' }; }`. Trong `SilverLayer`: khi `mode === 'world'` và `screen === 'play'` thì trả `null`; khi `world` thì không gọi `exitWalkMode` và không chặn phím của trang.
2. Các bước (`Say`, `Choice`, `Slide`, `Question`, `Order`, `Code`) chỉ vẽ nội dung, lấp đầy thẻ cha; phần `fixed`, nền phủ, nút Tiếp/Bỏ qua/Thoát để ở `Play.tsx`. Bên mình sẽ đặt lại các bước này vào khung khác.
3. Home chừa chỗ cho một nút phụ (bên mình gắn "Chơi nhanh 2D"): một `<div data-silver-slot="home-extra" />` cạnh nút Sổ kỷ niệm.

Các màn chọn chương, lời dẫn, đăng ký, tuần, bảng điểm, sổ kỷ niệm: giữ nguyên, kiểm theo `UI-TU-KIEM.md` như cũ, bằng bản 2D. Không cần sửa dữ liệu giả hay hợp đồng. Nếu đã xong phần nào khác ba ý trên thì báo, bên mình tự sửa lúc ghép. Cảm ơn bạn!
