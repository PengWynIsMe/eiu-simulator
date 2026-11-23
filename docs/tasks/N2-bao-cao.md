# Báo cáo hoàn thành Task N2 — Nội dung ngành song ngữ & Đối chiếu JSON N1

- Người thực hiện: **Antigravity**
- Nhánh: `PengWynIsMe/nganh-n2-noidung`
- Ngày hoàn thành: 2026-11-23

---

## File đã tạo

1. 8 file profile ngành song ngữ chuẩn kiểu `MajorProfile`:
   - `src/data/majors/ktpm.json` (Kỹ thuật phần mềm - BSE)
   - `src/data/majors/mmt.json` (Mạng máy tính & Truyền thông dữ liệu - CNDC)
   - `src/data/majors/tdh.json` (Kỹ thuật Điều khiển & Tự động hóa - ACE)
   - `src/data/majors/dien.json` (Kỹ thuật Điện - BEE)
   - `src/data/majors/cdt.json` (Kỹ thuật Cơ điện tử - MEE)
   - `src/data/majors/dtvt.json` (Kỹ thuật Điện tử – Viễn thông - DTVT)
   - `src/data/majors/cokhi.json` (Kỹ thuật Cơ khí - COKHI)
   - `src/data/majors/qtkd.json` (Quản trị kinh doanh - QTKD)
2. `docs/tasks/N2-doi-chieu.md`: Báo cáo đối chiếu chi tiết 8 ngành giữa JSON N1 và PDF gốc.
3. `docs/tasks/N2-bao-cao.md`: Báo cáo tổng kết task theo mẫu quy định.

---

## Nguồn từng ngành (trang PDF đã đọc)

- **ktpm** (`BSE.pdf`): Mục I–II tr. 2–6 (mục tiêu chung, CĐR ABET, chuẩn IELTS 6.0, vị trí việc làm); Mục VI tr. 49–53 (kế hoạch học tập 10 tuần/kỳ, mã môn, tín chỉ, tiên quyết).
- **mmt** (`CNDC.pdf`): Mục I–II tr. 2–6 (mục tiêu, CĐR, chuẩn IELTS 6.0, vị trí việc làm); Mục VI tr. 47–52 (kế hoạch đào tạo, 3 chuyên ngành: Quản trị mạng, An ninh mạng, IoT).
- **tdh** (`ACE.pdf`): Mục I–II tr. 2–7 (mục tiêu, CĐR, chuẩn ngoại ngữ, vị trí việc làm); Mục VI tr. 64–70 (kế hoạch đào tạo, 2 chuyên ngành: Tự động hóa công nghiệp, Hệ thống điều khiển).
- **dien** (`BEE.pdf`): Mục I–II tr. 2–7 (mục tiêu, CĐR, vị trí việc làm); Mục VI tr. 61–66 (kế hoạch đào tạo, 2 chuyên ngành: Hệ thống điện & lưới điện thông minh, Năng lượng tái tạo & điện tử công suất).
- **cdt** (`MEE.pdf`): Mục I–II tr. 2–7 (mục tiêu, CĐR, chuẩn IELTS 6.0, vị trí việc làm); Mục VI tr. 59–68 (kế hoạch đào tạo, 2 chuyên ngành: Robot, Hệ thống tích hợp).
- **dtvt** (`DTVT.pdf`): Khung CTĐT 9 trang (tr. 1–9), gồm khối đại cương, cơ sở ngành và 5 chuyên ngành: Xử lý tín hiệu & hình ảnh, Hệ thống viễn thông, Cao tần & anten, Thiết kế vi mạch, Hệ thống nhúng.
- **cokhi** (`COKHI.pdf`): Khung CTĐT 5 trang (tr. 1–5), gồm khối đại cương, cơ sở ngành và 3 chuyên ngành: Thiết kế cơ khí, Gia công chế tạo, Hệ thống năng lượng.
- **qtkd** (`QTKD.pdf`): Khung CTĐT 7 trang (tr. 1–7), gồm khối đại cương, cơ sở ngành và 8 chuyên ngành: Kế toán, Tài chính, QT nguồn nhân lực, Marketing, QT chuỗi cung ứng, QT nhà hàng – khách sạn, Khởi nghiệp, Phân tích kinh doanh.
- **Địa điểm thực tế**: Tra cứu từ `src/data/building-details.json` để đưa vào `dayInLife`: phòng máy CNTT 406.B11, FabLab 210.B11, Xưởng Shop FabLab trệt B11, PTN Công nghệ 4.0 104.B11, PTN Thủy lực 108.B11, PTN Năng lượng 308.B11, Phòng Thực Hành Chiếu Sáng 217.B11, Phòng Thực Hành PLC tầng 2 B11, Trung tâm An ninh mạng 100.B6, Văn phòng Khoa QTKD 104.B3, Hội trường lớn 200.B3, Thư viện B4, Căn tin, ki-ốt Highlands Coffee xe buýt đỏ.

---

## Tóm tắt đối chiếu (số lỗi cao / trung bình / thấp mỗi ngành)

| Ngành | Cao | Trung bình | Thấp | Tổng cộng | Đánh giá |
|---|:---:|:---:|:---:|:---:|---|
| **ktpm** | 8 | 1 | 2 | 11 | Sót 5 môn bắt buộc tại ranh giới trang (18 TC); sai mã CSE 302 thành CSN 302 |
| **mmt** | 5 | 1 | 1 | 7 | Sót 7 môn bắt buộc Năm 1; dồn toàn bộ môn chuyên ngành vào Year 4 |
| **tdh** | 4 | 1 | 1 | 6 | Sót ACE 303 và ACE 306 ở HK 3.1; rỗng requiredCourses ở 2 chuyên ngành |
| **dien** | 3 | 1 | 1 | 5 | Khá sạch; sót PHYS 101 ở HK 1.1; rỗng requiredCourses ở 2 chuyên ngành |
| **cdt** | 5 | 1 | 1 | 7 | Sót 3 môn HK 1.3 và 3 môn cơ sở/ngành ở Năm 3 & 4 (lệch -24 TC) |
| **dtvt** | 3 | 2 | 1 | 6 | **Tệ nhất**: Mất trắng toàn bộ Năm 1 và Năm 2 do lỗi dồn cột bảng PDF |
| **cokhi** | 2 | 2 | 1 | 5 | **Sạch nhất**: Dồn 20 môn vào Năm 1 do quy tắc suy mã 1xx; rỗng môn chuyên ngành |
| **qtkd** | 4 | 0 | 1 | 5 | **Tệ**: Mất trắng Năm 3 và Năm 4; Năm 1 lẫn cả môn ngoại ngữ tự chọn |
| **TỔNG CỘNG** | **34** | **9** | **9** | **52** | 34 lỗi mức cao cần ưu tiên sửa trong script N1 |

---

## Chỗ phải suy luận (bản khung, dayInLife)

1. **Ba bản khung ngắn (`dtvt`, `cokhi`, `qtkd`)**: Do không có mục I Mục tiêu chung và mục II Chuẩn đầu ra, nội dung `summary`, `skills`, `careers` được chắt lọc từ tên chuyên ngành và các khối môn cơ sở/chuyên sâu trong bảng môn. Giọng văn thận trọng, khách quan, hướng tới học sinh lớp 12 ("Sinh viên được trang bị...", không hứa hẹn lương hay tỷ lệ việc làm).
2. **"Một ngày của sinh viên" (`dayInLife`)**: Thiết kế 7 mốc giờ từ 07:30 đến 17:30, 100% sử dụng phòng/lab có thật trong `building-details.json`, môn học có trong CTĐT, phản ánh đúng học kỳ 10 tuần và chuẩn đầu ra tiếng Anh IELTS 6.0 của EIU.
3. **Môn highlight (`highlights`)**: Để đảm bảo loader của ứng dụng không bị crash khi kết nối với curriculum JSON của N1, 5 môn highlight của mỗi ngành đã được chọn lọc sao cho vừa là môn cốt lõi có thật trong PDF, vừa có mặt trong file curriculum trích xuất hiện tại của N1 (100% 40 mã môn đều khớp).

---

## Tên tiếng Anh đề xuất cần chủ dự án duyệt

- `dtvt`: *Bachelor of Electronics and Telecommunications Engineering* (hiện PDF không ghi tên tiếng Anh văn bằng).
- `cokhi`: *Bachelor of Mechanical Engineering* (hiện PDF không ghi tên tiếng Anh văn bằng).
- `qtkd`: *Bachelor of Business Administration* (hiện PDF không ghi tên tiếng Anh văn bằng).
- `tdh`: *Control and Automation Engineering* (tên CTĐT trong PDF là *Bachelor of Automation and Control Engineering*).

---

## Chưa chắc / rủi ro

1. **Chất lượng trích xuất của N1 hiện tại**: Toàn bộ 8 file curriculum JSON của N1 đều để trống `specializations[].requiredCourses` (`[]`), mất trắng Năm 1-2 của DTVT và mất trắng Năm 3-4 của QTKD. N1 cần nâng cấp parser để giải quyết triệt để 34 lỗi mức cao đã liệt kê trong `N2-doi-chieu.md`.
2. **Khôi phục môn highlight sau khi N1 sửa parser**: Hiện tại N2 đã điều chỉnh môn highlight về các môn N1 đã trích được. Sau khi N1 sửa parser và trích đầy đủ các môn đồ án / thực hành tiêu biểu (như `CSW 303, CSW 304, CSW 306` của KTPM hay `BUS 328, BUS 357` của QTKD), có thể cập nhật lại highlight để các môn này trở nên đặc sắc hơn nữa.

---

## Đề xuất (nếu cần đổi schema)

- **Không cần đổi schema**: Schema `MajorProfile` và `MajorCurriculum` hiện tại đã rất hoàn chỉnh và chặt chẽ.
- **Đề xuất kỹ thuật cho N1**:
  - Không reset biến trạng thái học kỳ (`year`, `semester`) theo từng trang riêng rẽ; cần duy trì trạng thái liên trang khi tiêu đề học kỳ nằm ở cuối trang trước.
  - Sử dụng phân tích tọa độ `x, y` (hoặc bóc tách theo dòng thông minh) cho các bản khung có bảng phức tạp như `DTVT.pdf` và `QTKD.pdf`.
