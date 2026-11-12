# Đánh giá tài liệu khuôn viên EIU

## Vòng 2 (2026-11-12) — Tour 360° "Khám phá EIU"

Nguồn: https://demo.eiu.vn/KhamPhaEIU/index.htm (3DVista, bản quyền EIU, làm bởi iDTS). **Chỉ dùng tham khảo để dựng, không đưa ảnh vào app.**

Tour có **168 ảnh 360°**:

| Nhóm | Số ảnh | Tầng có ảnh | Đã tải về |
| --- | --- | --- | --- |
| Khuôn viên ngoài trời (`campus`, `campus_1..26`) | 26 | — | ✅ `references/tour-360/` (mỗi điểm: dải ngang 4 hướng + nhìn lên + nhìn xuống) |
| `campus` = **ảnh drone trên cao** ngay trên cổng chính | 1 | — | ✅ |
| Block 8 | 60 | tầng 1–4 | Chưa — để giai đoạn nội thất |
| Block 11 | 39 | tầng 1–4 | Chưa |
| Block 3 | 26 | tầng 1–3 (phòng QTKD, hội thảo, hội trường...) | Chưa |
| Block 4–5 | 12 | tầng 1 | Chưa |
| Block 6 | 5 | tầng 1 | Chưa |

Danh sách đầy đủ + id: `references/tour-360/danh-sach-panorama.json`. Xem nhanh: `_tong-hop-1.jpg`, `_tong-hop-2.jpg`.

**Thấy rõ từ 26 ảnh ngoài trời:**
- Cổng chính: mái bằng lớn, 2 chòi bảo vệ, cổng trượt — dựng được mức 2.
- Kiểu kiến trúc chung: block 3–5 tầng, tường tím xám/nâu, mảng kính lớn ở sảnh/cầu thang, mái bằng chìa rộng, hành lang ngoài có lam che.
- **Hành lang mái che phủ dây leo** nối các block, có tường bê tông đứng xen giữa — đặc trưng rất "EIU".
- Hồ nước + cầu gỗ có mái tôn xanh, bể nước nông vuông có mái khung đen.
- Khu ngồi ngoài trời mái khung đen, sàn gỗ (gần căn tin/quán).
- Nhà xe mái răng cưa dài.
- Đường nội bộ 2 làn có dải phân cách trồng cây, vạch kẻ vàng ở bó vỉa, đèn đường cột xanh dương.

**⚠️ Cổng chính trong tour là cổng CŨ** (tour làm ~08/2023; người dùng xác nhận đã có cổng mới).
- Street View 08/2025 (`diem-nhan/streetview-cong-moi-250.png`, `-290.png`) vẫn thấy cổng dầm ngang mái bằng.
- Vệ tinh 2026 (`diem-nhan/ve-tinh-khu-cong-2026.png`) thấy một **kết cấu hình vòng cung** sát Nam Kỳ Khởi Nghĩa, nền đất còn đang thi công → nhiều khả năng là cổng mới, xây sau 08/2025.
- Không tìm được ảnh cổng mới trên mạng → **cần người dùng chụp** (xem danh sách cuối file). Tạm thời dựng mức 1 theo dấu vòng cung trên vệ tinh.

**Nâng mức sau vòng 2:** mọi block giảng đường + cổng + hành lang mái che + hồ nước + nhà xe → **mức 2**.
Mức 3 (model riêng) giờ **khả thi** cho cổng chính và cụm hồ nước + cầu (đủ ảnh nhiều phía).

**Cần người dùng bổ sung cho cổng mới:** 1 ảnh chính diện từ bên kia đường Nam Kỳ Khởi Nghĩa (thấy trọn cổng),
1 ảnh chéo 45°, 1 ảnh từ trong sân nhìn ra, ước lượng chiều cao/bề rộng (so với người hoặc xe), chữ/logo trên cổng.

**Việc còn lại:** ảnh 360 chưa ghi tên tòa (chỉ ghi "Khuôn Viên Trường"). Cần gắn `campus_N` → đang đứng ở đâu / nhìn thấy tòa nào.
Người dùng (biết trường) xem `_tong-hop-*.jpg` và ghi lại sẽ nhanh hơn Claude đoán.

---

## Vòng 1

Ngày: 2026-11-12. Người đánh giá: Claude. Tiêu chí: `docs/ASSETS.md` mục 4–5.

## Tài liệu đã có (trong `references/`)

| File | Nguồn | Giá trị |
| --- | --- | --- |
| `00-tong-quan/so-do-handbook-2026.png` + `-chu-thich.png` | Sổ tay sinh viên 2026–2027, trang 6 | **Sơ đồ chính thức**: 15 điểm có tên, chức năng, đường bao, vòng xoay, hồ nước |
| `00-tong-quan/ve-tinh-core.png`, `-east.png`, `-north.png` | Google Maps vệ tinh (thước 50 m) | Hình dáng thật, tỷ lệ, mái, hướng |
| `handbook-anh/*.png` (17 ảnh) | Ảnh trong sổ tay 2025 & 2026 | Mặt đứng block giảng đường (B10), hồ nước + cầu, đường vòng, căn tin, Highlands, thư viện bên trong |
| `nganh-hoc/handbook-2026-khoa.png` | Sổ tay 2026, trang 8–9 | Danh sách khoa, ngành, phòng văn phòng khoa |
| `diem-nhan/streetview-cong-nkkn.png` | Street View 08/2025 | Chỉ thấy từ ngoài hàng rào — ít giá trị |

Địa chỉ: 81 Nam Kỳ Khởi Nghĩa, phường Bình Dương, TP.HCM. Tọa độ ≈ 11.0527, 106.6665.

## Bố cục tổng thể

- Khuôn viên hình **tam giác**, bao bởi 3 đường: **Lê Duẩn** (tây/bắc), **Nam Kỳ Khởi Nghĩa** (đông — cổng chính), **Hữu Nghị** (nam).
- Sơ đồ sổ tay **xoay khác hướng thật**: trên sơ đồ, Nam Kỳ Khởi Nghĩa nằm ở dưới; ngoài thực tế nó ở phía đông.
  Khi dựng sẽ theo ảnh vệ tinh, dùng sơ đồ để gắn tên.
- Trung tâm là **quảng trường tròn lớn** (bãi cỏ + đường vòng), các trục đường tỏa ra.
- Cụm 4 block giảng đường dài song song (B8–B11) ở phía bắc vòng xoay; thư viện (B4), B3, B5, hồ nước + cầu ở phía đông, gần cổng.
- Nhà giữ xe mái dài dọc Nam Kỳ Khởi Nghĩa; dãy nhà xưởng AMC/Aspire dọc đường Hữu Nghị.

## Chấm từng điểm

Điểm theo thứ tự A–H (A vị trí, B mặt bằng, C chiều cao, D khối/mái, E màu, F mặt đứng, G nhận diện, H chức năng/ngành).

| # | Tên | A B C D E F G H | Mức dựng được | Ghi chú |
| --- | --- | --- | --- | --- |
| 10 | Block 10 — Trung tâm ngoại ngữ | 2 2 2 2 2 2 1 2 | **2** | Ảnh rõ: 5 tầng, tường tím xám, khối cầu thang kính giữa, mái bằng chìa |
| 8 | Block 8 — Phòng học đa năng | 2 2 1 2 1 1 0 2 | **2*** | Cùng kiểu kiến trúc B10 (thấy trong ảnh xa + vệ tinh) |
| 9 | Block 9 | 2 2 1 2 1 1 0 1 | **2*** | Như trên; chưa rõ chức năng |
| 11 | Block 11 — Văn phòng khoa, phòng thí nghiệm | 2 2 1 2 1 1 0 2 | **2*** | **Quan trọng nhất**: văn phòng khoa CNTT (414), Kỹ thuật (416), Sức khỏe (306), IIC, FabLab, STEM-Lab |
| 3 | Block 3 — Quản trị kinh doanh | 2 2 1 1 0 0 0 2 | **1** | Văn phòng khoa QTKD (105.B3); gần phòng tuyển sinh. Thiếu ảnh |
| 4 | Block 4 — Thư viện | 2 2 0 2 0 0 1 2 | **1** | Mái có pin mặt trời (vệ tinh); chỉ có ảnh bên trong |
| 5 | Block 5 — Hành chính | 2 1 0 1 0 0 0 2 | **1** | Văn phòng khoa GDĐC (205.B5) |
| 6 | Block 6 — Vườn ươm BBI | 2 1 0 1 0 0 0 2 | **1** | Trung tâm An ninh mạng (100.B6) |
| 1 | Căn tin EIU (Food City) | 2 2 1 1 1 0 1 2 | **1** | Có ảnh bên trong; thiếu ảnh ngoài |
| 13 | Highlands Coffee | 2 1 2 2 2 2 2 2 | **2** | Ki-ốt hình **xe buýt đỏ** — điểm nhấn vui, nên làm |
| 7, 12 | Fami Pizza, Family Mart | 2 1 1 0 0 0 0 2 | **1** | Ki-ốt nhỏ, có thể gộp làm khối nhỏ có biển |
| 2 | Nhà giữ xe (nhiều cụm) | 2 2 2 2 1 1 0 2 | **2** | Mái tôn dài 1 tầng — dễ dựng |
| 14, 15 | AMC, Aspire | 2 2 1 2 1 0 0 2 | **1** | Nhà xưởng dọc Hữu Nghị; ưu tiên thấp |
| — | Hồ nước + cầu gỗ + giàn dây leo | 2 2 2 2 2 2 2 — | **2** | Ảnh rất rõ — **điểm nhận diện số 1 của EIU**, nên dựng kỹ |
| — | Quảng trường tròn + đường vòng | 2 2 — 2 2 — 2 — | **2** | Rõ từ vệ tinh + ảnh |
| — | Cổng chính (mái vòm cung, phía Nam Kỳ Khởi Nghĩa) | 2 1 0 1 0 0 1 — | **1** | Chỉ thấy hình cung từ vệ tinh |

`2*` = dựng mức 2 bằng cách **giả định cùng kiểu kiến trúc với B10**. Cần 1 ảnh mỗi block để xác nhận.

**Tổng kết:** với tài liệu hiện có, **dựng được toàn bộ bố cục ở mức 1**, và **mức 2 cho cụm giảng đường + hồ nước + quảng trường + Highlands + nhà xe**.
Đủ để bắt đầu giai đoạn 1. Chưa tòa nào đủ mức 3.

## ⚠️ Phát hiện quan trọng về ngành học

Brief đang dùng 3 ngành mẫu: CNTT, QTKD, **Thiết kế đồ họa**. Theo sổ tay 2026–2027, **EIU không có ngành Thiết kế đồ họa**. Các khoa hiện có:

- **Quản trị kinh doanh** (Becamex Business School): ngành QTKD (8 chuyên ngành), ngành Kinh tế — văn phòng B3
- **Công nghệ thông tin** (CIT): Kỹ thuật phần mềm, Mạng máy tính & truyền thông dữ liệu — văn phòng B11
- **Kỹ thuật**: Kỹ thuật Điện, Điều khiển & Tự động hóa, Cơ điện tử, Điện tử viễn thông, Cơ khí — văn phòng B11
- **Khoa học sức khỏe**: Điều dưỡng — văn phòng B11
- **Giáo dục đại cương** — văn phòng B5

→ Đề xuất đổi 3 ngành mẫu thành **Kỹ thuật phần mềm, Quản trị kinh doanh, Điều dưỡng** (3 khoa khác nhau, có không khí khác hẳn nhau).

## Cần người dùng bổ sung (theo thứ tự ưu tiên)

1. **Chốt danh sách ngành** muốn đưa vào + link/PDF **chương trình đào tạo** của từng ngành (trang tuyển sinh eiu.edu.vn).
2. **Ảnh bên trong khuôn viên** (Street View không vào được). Mỗi tòa 1 ảnh chính diện + 1 ảnh chéo:
   Block 11, Block 3, Thư viện (B4), Căn tin, cổng chính (chụp từ trong ra và từ ngoài vào).
3. **1 ảnh xa thấy được B8 / B9 / B11** để xác nhận cùng kiểu với B10.
4. **Số tầng** của B3, B4, B5, B6, B11 (hỏi bạn bè/sinh viên là nhanh nhất).
5. **Video flycam** trên YouTube "EIU Channel" hoặc fanpage (tôi không tìm thấy qua tìm kiếm) — chụp màn hình + ghi mốc thời gian.
6. Sinh viên ngành X **học chủ yếu ở block nào** (văn phòng khoa ở B11 chưa chắc là nơi học).
7. (Giai đoạn sau) ảnh 1 phòng học lý thuyết, 1 phòng máy, 1 phòng thực hành điều dưỡng.
