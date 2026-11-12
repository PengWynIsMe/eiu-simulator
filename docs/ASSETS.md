# Thu thập tài liệu khuôn viên EIU & tiêu chí đánh giá

Người dùng gom tài liệu → bỏ vào `references/` → Claude chấm từng tòa theo tiêu chí dưới đây
→ ghi kết quả vào `docs/ASSETS-REVIEW.md` → quyết định mức dựng cho từng tòa.

## 1. Nguồn nên tìm (theo thứ tự giá trị)

| Nguồn | Cho ta cái gì | Cách lấy |
| --- | --- | --- |
| **Google Maps vệ tinh** | Vị trí, hình dáng mặt bằng, kích thước (có thước tỷ lệ), đường nội bộ | Chụp màn hình nhìn thẳng từ trên, giữ thước tỷ lệ góc dưới |
| **Video flycam / drone** (YouTube, fanpage trường, video tuyển sinh) | Mái, chiều cao tương đối, bố cục tổng thể — **nguồn quý nhất** | Tạm dừng video, chụp màn hình các khung nhìn chéo từ trên cao; ghi link + mốc thời gian |
| **Sơ đồ khuôn viên chính thức** | Tên tòa, chức năng, khoa nào ở đâu | Website trường, brochure tuyển sinh (PDF), bảng chỉ dẫn |
| **Google Street View / ảnh 360** | Mặt đứng nhìn từ đường | Chụp màn hình |
| **Ảnh tự chụp** | Mặt đứng, màu sắc, chi tiết | Mỗi tòa: 1 ảnh chính diện + 1 ảnh chéo 45°, ban ngày, thấy trọn tòa |
| **Ảnh trên fanpage / báo chí** | Bổ sung góc thiếu, sự kiện, không khí | Lưu kèm link nguồn |
| **Chương trình đào tạo (PDF/web)** | Dữ liệu ngành: môn theo năm, tín chỉ | Link chính thức + ngày truy cập |

Ảnh/video của người khác chỉ dùng **làm tham khảo để dựng model**, không đưa thẳng vào app.

## 2. Cách bỏ tài liệu vào

```
references/
  00-tong-quan/        # ảnh vệ tinh, sơ đồ, ảnh flycam toàn cảnh
  toa-<ma>/            # mỗi tòa một thư mục, vd toa-A, toa-thu-vien
    info.md            # điền theo mẫu mục 3
    *.jpg / *.png
  diem-nhan/           # cổng, sân, đài phun nước, căng tin, bãi xe...
  phong-hoc/           # (giai đoạn sau) mỗi LOẠI phòng một thư mục con
  nganh-hoc/           # link/PDF chương trình đào tạo
  NGUON.md             # danh sách link nguồn (video kèm mốc thời gian)
```

Đặt tên ảnh gợi ý góc chụp: `mat-chinh.jpg`, `cheo-dong-nam.jpg`, `flycam-0132.png` (0132 = phút 1:32).

## 3. Mẫu `info.md` cho mỗi tòa

```
Tên gọi chính thức:
Tên gọi quen của sinh viên:
Chức năng: (giảng đường / thư viện / ký túc xá / hành chính / ...)
Khoa / ngành ở đây:
Số tầng:
Kích thước ước lượng (dài x rộng, m):
Màu chủ đạo:
Kiểu mái:
Điểm nhận diện:
Ghi chú / chưa chắc:
```

Không biết thì để trống. **Không đoán** — ô trống giúp tôi biết chỗ nào cần tìm thêm.

## 4. Tiêu chí chấm từng tòa

Mỗi tiêu chí chấm 0 / 1 / 2 (0 = không có thông tin, 1 = có nhưng mơ hồ, 2 = rõ ràng).

| # | Tiêu chí | Lấy từ đâu |
| --- | --- | --- |
| A | Vị trí trên bản đồ | Vệ tinh, sơ đồ |
| B | Hình dáng mặt bằng + kích thước | Vệ tinh có thước tỷ lệ |
| C | Chiều cao / số tầng | Ảnh chụp, flycam, info.md |
| D | Hình khối + kiểu mái | Flycam, ảnh chéo |
| E | Màu sắc + vật liệu (sơn, kính, gạch) | Ảnh ban ngày |
| F | Chi tiết mặt đứng (nhịp cửa sổ, sảnh, ban công) | Ảnh chính diện |
| G | Điểm nhận diện (logo, tháp, mái che đặc trưng) | Ảnh, flycam |
| H | Chức năng + khoa/ngành | Sơ đồ, website |

## 5. Quy ra mức dựng

| Mức | Điều kiện | Kết quả trong app |
| --- | --- | --- |
| **0 — Chưa dựng** | A = 0 | Bỏ qua hoặc để trống |
| **1 — Khối đúng bố cục** | A, B ≥ 1 và C ≥ 1 | Hộp màu đúng vị trí, tỷ lệ |
| **2 — Nhận ra được** | Mức 1 + D, E ≥ 1 + F hoặc G ≥ 1 | Khối + mái + cửa sổ + màu giống thật (Gemini dựng bằng hình cơ bản trong code) |
| **3 — Model riêng (GLB)** | Mức 2 + D, F, G đều = 2 + có ảnh ≥ 3 phía | Đủ tài liệu để dựng model Blender; chỉ áp dụng cho 1–2 tòa biểu tượng |

Tòa có H = 0 vẫn dựng được hình, nhưng chưa gắn ngành học (không click mở panel được).
