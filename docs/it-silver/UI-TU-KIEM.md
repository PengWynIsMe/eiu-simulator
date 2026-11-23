# UI tự kiểm trước khi push (bắt buộc)

Vòng lặp: **kiểm hết → ghi lỗi → sửa → kiểm lại từ đầu mục bị ảnh hưởng**. Chỉ push khi mọi ô đạt. Không tự đánh dấu đạt khi chưa nhìn màn thật.

## 1. Lệnh

- [ ] `npm run typecheck` 0 lỗi · `npm run lint` 0 lỗi · `npm run build` xong
- [ ] `npm run test:silver` đạt, nếu lệnh đã có trên main (chưa có: ghi "chưa có")
- [ ] `git diff --name-only origin/main...` chỉ gồm file ở `BAT-DAU-UI.md` mục 3
- [ ] `grep -rnE "mock/|fixture" src/ui/silver --include=*.ts --include=*.tsx` ngoài thư mục `mock/` chỉ ra một dòng, trong `adapter.ts`
- [ ] Không có `any`, `@ts-ignore`, `console.log`; không chữ tiếng Việt viết thẳng trong JSX (trừ `text.ts`, mock)

## 2. Chơi thử trọn luồng (chuột, rồi chỉ bàn phím)

- [ ] TopBar → Home → Ngày kiểm tra → chơi đủ 7 loại bước → sổ → Home
- [ ] Level 1 (đang dở) → Tiếp tục; rồi Chơi lại có hỏi xác nhận
- [ ] 2.2: recap → đăng ký: đổi một môn, thêm môn thứ 5, thứ 6, thử môn khóa, quá 6, quá ít, đặt lại → tuần → từng buổi → thi → sổ
- [ ] Trả lời sai → thử lại → sai → xem lời giải → đi tiếp được
- [ ] Bỏ qua cảnh; thoát giữa cảnh; vào lại đúng chỗ; Esc; tải lại trang
- [ ] Đổi VI↔EN ở mỗi màn: không mất trạng thái, không còn chữ ngôn ngữ kia (trừ ngoại lệ ghi ở spec)
- [ ] Đóng Silver: kéo camera, đi bộ, buổi học 406, góp ý vẫn chạy như cũ; phím WASD trong lớp Silver không làm nhân vật đi
- [ ] Bấm đúp nhanh mọi nút chính: không nhảy hai bước

## 3. Mọi trạng thái

Mỗi ô mở bằng `?silver=…&state=…`:

| Màn | Trạng thái phải xem |
|---|---|
| home | thường, empty, loading, error, blocked, corrupt, long |
| recap | thường, long |
| registration | thường, too-few, too-many (thao tác tay), empty, loading, error, long |
| week | đầu tuần, giữa, hết, empty, long |
| play | step 1…7; mỗi bước chấm: chưa trả lời, đúng, sai, đã xem lời giải; loading, error, long |
| transcript | thường, có 2 điểm D, loading/empty |
| memory | trang mới, old, long, loading/empty |
| notebook | empty, 1 trang, 20 trang (long), loading, error |

`state=long`: mọi nhãn dài gấp ba; không tràn, không che nút.

## 4. Ảnh

Chụp vào `docs/it-silver/ui-anh/<man>-<trangthai>-<vi|en>-<360|768|1440>.webp` (rộng ≤ 1440 px, mỗi ảnh ≤ 150 KB). Bắt buộc: 8 màn × trạng thái thường × VI/EN × 3 cỡ; play đủ 7 bước ở 360 và 1440, VI/EN; mỗi trạng thái khác ở mục 3 ít nhất một ảnh 360 VI. Chụp bằng công cụ trình duyệt của agent; không cài thư viện vào repo. Tự mở từng ảnh để xem.

## 5. So với spec

- [ ] Mở từng file `tasks/UI-0x`, đi qua từng dòng "Tiêu chí xong" và từng phần wireframe
- [ ] Chuỗi VI/EN giống bảng trong spec từng chữ
- [ ] Vùng chạm ≥ 44 px, tương phản ≥ 4.5:1, focus thấy rõ, zoom 200% không mất nút
- [ ] 360×740: nút chính luôn thấy; bàn phím ảo mở ở bước Code không che ô nhập
- [ ] `prefers-reduced-motion`: không chữ chạy dần, không fade
- [ ] Console sạch: 0 error, 0 warning mới (so với main khi chưa mở Silver)
- [ ] Nút TopBar ở 360 không làm thanh trên tràn hay xuống hàng

## 6. Thử ghép

- [ ] Trên main đã có `src/store/useSilverStore.ts`: đổi tạm `adapter.ts`, chạy typecheck, chơi một chương, rồi **trả lại mock** trước khi push. Chưa có: `const check: UseSilver = useSilver;` biên dịch được (đặt ở `adapter.ts`).

## 7. Mẫu `UI-BAO-CAO.md`

```
Nhánh / commit chốt:
Số vòng kiểm: … | Lỗi tự tìm và đã sửa: …
Lệnh: typecheck … lint … build … test:silver …
| Mục | Đạt/Chưa | Ảnh / ghi chú |
| 1 … 6, từng màn |
Chỗ lệch spec và lý do:
Mặc định đã dùng (mục 8):
Đề xuất đổi hợp đồng (nếu có):
Việc còn lại cho bên ghép: đổi adapter.ts
```
Có ô "Chưa" thì chưa push.
