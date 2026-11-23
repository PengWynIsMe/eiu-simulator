# Báo cáo STYLE + PROC

## Hạng mục

| Hạng mục | Thực hiện | Ảnh |
| --- | --- | --- |
| Style 3D | `docs/STYLE-3D.md` ghi bảng màu, vật liệu, kích thước, quy tắc dựng và các chênh lệch trong code. T06 được đối chiếu từ ROADMAP và commit `7436d2a`. Repo có trần draw call theo hạng mục và số đo tam giác, chưa có trần tam giác chung. Commit riêng `6bcf820`. | [STYLE-3D.md](../STYLE-3D.md) |
| Cầu thang gáy sách | `interior/BookStaircase.tsx` và hai module atlas/kích thước kèm theo. 20 bậc, một atlas canvas 512 × 1.024 dùng lại, sáu batch. Tường hồng đất, tay vịn inox, mảng kính lớn bên hông và ô kính phía sau chiếu nghỉ. | [01. Preview nội thất](PROC-anh/01-cau-thang-gay-sach.png) |
| Nhà xe mái răng cưa | Nâng cấp dãy dài `nha-xe-can-tin` (khoảng 121 × 13 m) theo ảnh t093s/t097s, giữ vị trí và lưới cột từ layout. Mười lăm nhịp trắng, 30 tấm mái và khung thép dùng hai batch. Sàn cao 0.325 m và các xe trong dãy dùng cùng cao độ. | [02. Mái răng cưa](PROC-anh/02-nha-xe-rang-cua.png) |
| Bậc hồ và chậu hoa | `PondTerraces` lấy vị trí từ ba hồ hiện có. Sáu dải, mỗi dải ba bậc bê tông mép vàng/xám, 22 chậu hoa giấy hồng/cam. Sáu batch dùng chung geometry, không thêm đèn realtime. | [03. Bậc hồ](PROC-anh/03-bac-ho-va-chau-hoa.png) |

Mái dài cạnh căn tin được chọn vì dáng dãy mái trong ảnh và kích thước trên layout khớp nhất. Ảnh gốc chỉ dùng để đối chiếu. Các PNG trong báo cáo là cảnh render. Màu và vật liệu mặt đất/cỏ dùng chung giữ nguyên.

## Gắn cầu thang vào B6 sau khi gộp

Cầu thang đã gỡ khỏi ngoại cảnh. Nhánh PROC chưa có nội thất B6. Ảnh 01 chụp component ở chiều cao 3.8 m trong cảnh nội thất dùng riêng để kiểm hình.

Đã đối chiếu `B6_CODEX_STAIRWELL_LOCAL` trong bản đang làm của `an-ninh-mang/src/scene/interior/layouts/b6.ts`. Ô chờ là `u = 10.2..13.8, v = 25..34`. Điểm tiếp cận tầng 1 là `(12, 25.5)`, chiếu nghỉ tầng 2 ở `(12, 33.5)`. Component đặt tâm cạnh đầu bậc và lên theo `−Z` cục bộ. Với phép đổi tọa độ của B6, có thể đặt:

```tsx
const [x, z] = b6Layout.toWorld(12, 26.6);
<BookStaircase position={[x, floorOneY, z]} rotationY={Math.PI - b6Layout.rotationY} height={3.8} />
```

Bậc rộng 2.5 m, sâu 0.31 m và cao 0.19 m tại `height={3.8}`. Chiếu nghỉ 1.05 m kết thúc tại `v ≈ 33.85`. Khi gộp cần nối chiếu nghỉ với sàn tầng 2 (ô thông tầng hiện kéo đến `v = 35`), chừa lỗ lan can phía lối ra và đăng ký bề mặt bậc/chiếu nghỉ cùng chuyển tầng trong layout B6. PROC cung cấp phần dựng hình. Luồng đi bộ nối tầng B6 sẽ cần kiểm trên bản gộp.

## Kiểm tra

- `npm run typecheck`, `npm run lint`, `npm run build` và `git diff --check` đều đạt.
- Orca Browser tại `http://localhost:5196/`. Đã mở cảnh desktop, kiểm vật liệu và chữ ở góc gần, raycast trúng một tấm của mái instanced. Kiểm hàm độ cao trả 0.35/0.55/0.75 m ở ba mặt bậc hồ và nhận diện vật cản tại chậu. Vùng chặn nước và lối qua cầu giữ theo layout cũ.
- Mobile giả lập 390 × 844 bật được Đi bộ, có cần ảo và nút đổi góc. Console trên trang tải mới không có lỗi đỏ. Chưa đo trên thiết bị thật.

Số đo sau khi gỡ cầu thang khỏi ngoại cảnh, trên Orca Browser 1.280 × 800, DPR 1. Mỗi mẫu đếm `requestAnimationFrame` trong 5 giây. Draw call và tam giác là số của toàn cảnh tại góc đo.

| Góc đo | FPS | Draw call | Tam giác |
| --- | ---: | ---: | ---: |
| Preview cầu thang trong nhà | 35.3 | 11 | 1.200 |
| Nhà xe | 37.7 | 88 | 366.331 |
| Bậc hồ | 46.0 | 67 | 230.303 |

Hai góc ngoài trời từng đạt 60 FPS ở lượt trước trên cùng máy. Lượt cuối dao động dưới mục tiêu laptop ≥ 50 FPS. Chưa có mẫu A/B trên máy ổn định để quy mức chênh cho từng chi tiết.
