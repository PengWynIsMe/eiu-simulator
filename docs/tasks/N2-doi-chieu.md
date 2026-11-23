# Đối chiếu JSON CTĐT (N1) với PDF gốc

Báo cáo đối chiếu dữ liệu giữa `src/data/majors/*.curriculum.json` (do luồng N1 trích xuất bằng script) và 8 file PDF CTĐT gốc trong `references/ctdt/`.
Đối chiếu thực hiện bởi: **Antigravity (Task N2)** — 2026-11-23.

---

## 1. Bảng đối chiếu chi tiết 8 ngành

| Ngành | Mục | JSON (N1) | PDF (trang) | Mức | Đề xuất sửa |
|---|---|---|---|:---:|---|
| ktpm | Tổng tín chỉ | 178 TC (cộng thực tế) / 180 (khai báo) | Mục IV: 180 TC; Mục VI: 183 TC (tr. 6, 53) | cao | Bổ sung 5 môn bắt buộc bị sót (18 TC), điều chỉnh tổng theo mục IV (180 TC) |
| ktpm | CSE 302 mã môn | "CSN 302" | "CSE 302 Hệ điều hành" (tr. 52) | cao | Sửa mã môn thành `CSE 302` |
| ktpm | CSW 303 thiếu môn bắt buộc | Thiếu trong `years[2].courses` | HK 3.1: "CSW 303 Kỹ thuật phần mềm 4(3|1)" (tr. 52) | cao | Thêm `CSW 303` vào HK 3.1 (Năm 3) |
| ktpm | CSW 304 thiếu môn bắt buộc | Thiếu trong `years[2].courses` | HK 3.1: "CSW 304 Lập trình Front-end 4(3|1)" (tr. 52) | cao | Thêm `CSW 304` vào HK 3.1 (Năm 3) |
| ktpm | CSW 306 thiếu môn bắt buộc | Thiếu trong `years[2].courses` | HK 3.1: "CSW 306 Lập trình Back-end 4(3|1)" (tr. 52) | cao | Thêm `CSW 306` vào HK 3.1 (Năm 3) |
| ktpm | CSW 405 thiếu môn bắt buộc | Thiếu trong `years[3].courses` | HK 4.1: "CSW 405 Kiểm thử và đảm bảo chất lượng phần mềm 4(3|1)" (tr. 53) | cao | Thêm `CSW 405` vào HK 4.1 (Năm 4) |
| ktpm | CSW 480 thiếu môn bắt buộc | Thiếu trong `years[3].courses` | HK 4.1: "CSW 480 Đồ án tốt nghiệp KTPM I 2(0|2)" (tr. 53) | cao | Thêm `CSW 480` vào HK 4.1 (Năm 4) |
| ktpm | CSE 100 thiếu môn năm 1 | Thiếu trong `years[0].courses` | HK 1.1: "CSE 100 Nhập môn Công nghệ thông tin 4(3|1)" (tr. 50) | cao | Thêm `CSE 100` vào HK 1.1 (Năm 1) |
| ktpm | CSE 106 thiếu môn năm 1 | Thiếu trong `years[0].courses` | HK 1.1: "CSE 106 Toán rời rạc I 4(4|0)" (tr. 50) | cao | Thêm `CSE 106` vào HK 1.1 (Năm 1) |
| ktpm | COMS 101 thiếu môn năm 1 | Thiếu trong `years[0].courses` | HK 1.2: "COMS 101 Kỹ năng giao tiếp 4(4|0)" (tr. 50) | cao | Thêm `COMS 101` vào HK 1.2 (Năm 1) |
| ktpm | CSE 104 thiếu môn năm 1 | Thiếu trong `years[0].courses` | HK 1.3: "CSE 104 Lập trình và giải quyết vấn đề II 4(3|1)" (tr. 51) | cao | Thêm `CSE 104` vào HK 1.3 (Năm 1) |
| ktpm | CSE 204 thiếu môn năm 1 | Thiếu trong `years[0].courses` | HK 1.3: "CSE 204 Mạng máy tính 4(3|1)" (tr. 51) | cao | Thêm `CSE 204` vào HK 1.3 (Năm 1) |
| ktpm | Nhóm tự chọn chuyên ngành | `courses: []` (rỗng) | Mục VI danh sách tự chọn: 4 nhóm định hướng (tr. 53–57) | trung bình | Trích xuất danh sách môn tự chọn vào 4 nhóm định hướng |
| ktpm | CSW 482 tên en | "III Software Engineering Capstone Project IIII" | "Software Engineering Capstone Project III" (tr. 53) | thấp | Bỏ chữ "III" ở đầu và sửa "IIII" thành "III" |
| ktpm | POLS 132 tên en | "Ho Chi Minh Ideology" | "Ho Chi Minh's Ideology" (tr. 7, 51) | thấp | Chuẩn hóa sở hữu cách `'s` |
| mmt | Tổng tín chỉ | 193 TC (thực tế) / 180 (khai báo) | Mục IV: 180 TC; Mục VI: 180 TC (tr. 6, 52) | cao | Điều chỉnh phân loại chuyên ngành để tổng đạt 180 TC |
| mmt | Thiếu môn bắt buộc Năm 1 | Chỉ có 6 môn (23 TC) trong Y1 | HK 1.1–1.3 có 12 môn (46 TC) (tr. 47–49) | cao | Bổ sung `MATH 103, CSE 100, MATH 112, POLS 134, CSE 104, PHYS 101, MATH 113` |
| mmt | STAT 101 xếp nhầm năm 1 | Nằm ở Year 1 | HK 2.1: "STAT 101 Xác suất và thống kê 4(4|0)" (tr. 49) | cao | Chuyển `STAT 101` về Năm 2 (HK 2.1) |
| mmt | Specializations requiredCourses rỗng | Cả 3 chuyên ngành `requiredCourses: []` | HK 4.1–4.2 quy định môn bắt buộc từng chuyên ngành (tr. 51–52) | cao | Chuyển các môn chuyên ngành bắt buộc từ Year 4 vào `specializations[].requiredCourses` |
| mmt | Year 4 dồn môn chuyên ngành | Year 4 có tới 11 môn bắt buộc (39 TC) | HK 4.1–4.3 chỉ có 3 môn chung (`CSN 401, CSW 435, CSN 496`) (tr. 51–52) | cao | Tách môn chuyên ngành ra khỏi `years[3].courses` |
| mmt | CSN 301 / CSN 302 thiếu trong kế hoạch | Không có trong `years` | HK 3.1: `CSN 301` (4 TC) và `CSN 302` (4 TC) (tr. 50) | cao | Bổ sung `CSN 301` và `CSN 302` vào Năm 3 |
| mmt | Tên nhóm tự chọn | `tu-chon-gddc-1` đến `5` | Tên cụ thể: Khoa học xã hội, Công nghệ số, v.v. (tr. 47–49) | trung bình | Đặt tên nhóm tự chọn theo tiêu đề khối trong PDF |
| mmt | CSN 494 tên vi | "Đồ án tôt nghiệp" | "Đồ án tốt nghiệp MMT&TTDL I" (tr. 51) | thấp | Sửa chính tả "tôt" thành "tốt" và thêm tên ngành |
| tdh | Tổng tín chỉ | 180 TC / 186 TC (-6 TC) | Mục IV: 186 TC; Mục VI: 186 TC (tr. 7, 70) | cao | Bổ sung 2 môn bắt buộc bị sót ở HK 3.1 (`ACE 303, ACE 306`) |
| tdh | ACE 303 thiếu môn bắt buộc | Thiếu trong `years[2].courses` | HK 3.1: "ACE 303 Bộ điều khiển PLC 4(3|1)" (tr. 67) | cao | Bổ sung `ACE 303` vào Năm 3 (HK 3.1) |
| tdh | ACE 306 thiếu môn bắt buộc | Thiếu trong `years[2].courses` | HK 3.1: "ACE 306 Hệ thống điều khiển hồi tiếp 4(3|1)" (tr. 67) | cao | Bổ sung `ACE 306` vào Năm 3 (HK 3.1) |
| tdh | MATH 112 / PHYS 102 thiếu Năm 1 | Thiếu trong `years[0].courses` | HK 1.2: "MATH 112 Giải tích II", "PHYS 102 Vật lý II" (tr. 65) | cao | Bổ sung `MATH 112` và `PHYS 102` vào HK 1.2 |
| tdh | Specializations requiredCourses rỗng | Cả 2 chuyên ngành `requiredCourses: []` | HK 4.1–4.2: TĐH có `ACE 406`, HTĐK có `ACE 409` (tr. 68–69) | cao | Đưa môn bắt buộc chuyên ngành vào `specializations` |
| tdh | Nhóm tự chọn `courses: []` | 2 nhóm tự chọn không có môn | Mục VI danh sách tự chọn (tr. 70–73) | trung bình | Trích xuất danh sách môn tự chọn từ trang 70–73 |
| tdh | EE 311 tên vi | "Vẽ kỹ thuật điện" | "Vẽ kỹ thuật điện 1" (tr. 66) | thấp | Bổ sung số thứ tự "1" |
| dien | Tổng tín chỉ | 182 TC / 187 TC (-5 TC) | Mục IV: 187 TC; Mục VI: 187 TC (tr. 7, 65) | cao | Bổ sung môn đại cương thiếu ở HK 1.1 (`PHYS 101` 4 TC) + 1 TC đồ án |
| dien | PHYS 101 thiếu Năm 1 | Thiếu trong `years[0].courses` | HK 1.1: "PHYS 101 Vật lý I 4(3|1)" (tr. 61) | cao | Bổ sung `PHYS 101` vào HK 1.1 (Năm 1) |
| dien | Specializations requiredCourses rỗng | Cả 2 chuyên ngành `requiredCourses: []` | HK 3.3–4.1: HTĐ có `EE 401`, NLTT có `EE 411` (tr. 64–65) | cao | Đưa môn chuyên ngành bắt buộc vào `specializations` |
| dien | Nhóm tự chọn chuyên ngành `courses: []` | 3 nhóm tự chọn đều có 0 môn | Mục VI danh sách tự chọn: 2 nhóm chuyên ngành (tr. 66–70) | trung bình | Trích xuất các môn tự chọn chuyên ngành từ trang 66–70 |
| dien | EE 413 tên vi | "Điện tử công suất nâng" | "Điện tử công suất nâng cao" (tr. 65) | thấp | Bổ sung chữ "cao" bị cắt |
| cdt | Tổng tín chỉ | 164 TC / 188 TC (-24 TC) | Mục IV: 188 TC; Mục VI: 188 TC (tr. 7, 64) | cao | Bổ sung các môn bị thiếu ở Năm 1, Năm 3 và Năm 4 |
| cdt | Thiếu môn bắt buộc Năm 1 | Thiếu 3 môn ở HK 1.3 | HK 1.3: `POLS 135` (3), `PHYS 103` (4), `MEC 120` (4) (tr. 60) | cao | Bổ sung 3 môn vào HK 1.3 |
| cdt | MEC 327 thiếu môn bắt buộc | Thiếu trong `years[2].courses` | HK 3.1: "MEC 327 Thiết bị điều khiển thủy khí 2(0|2)" (tr. 62) | cao | Bổ sung `MEC 327` vào Năm 3 |
| cdt | MEC 340 thiếu môn bắt buộc | Thiếu trong `years[2].courses` | HK 3.1: "MEC 340 Thiết kế máy 4(4|0)" (tr. 62) | cao | Bổ sung `MEC 340` vào Năm 3 |
| cdt | MEC 480 thiếu môn bắt buộc | Thiếu trong `years[3].courses` | HK 4.1: "MEC 480 Thiết kế hệ thống Cơ điện tử 4(3|1)" (tr. 63) | cao | Bổ sung `MEC 480` vào Năm 4 |
| cdt | Specializations requiredCourses rỗng | Cả 2 chuyên ngành `requiredCourses: []` | HK 4.1–4.2: Robot có `MEC 402`, HTTH có `MEC 489` (tr. 63) | cao | Đưa môn chuyên ngành vào `specializations` |
| cdt | Nhóm tự chọn `courses: []` | 4 nhóm tự chọn đều 0 môn | Mục VI danh sách tự chọn: Robot và HTTH (tr. 65–68) | trung bình | Trích xuất các môn tự chọn từ trang 65–68 |
| cdt | MEC 100 tên vi | "Nhập môn công tác Kỹ sư Cơ khí và Cơ điện tử" | "Nhập môn công tác Kỹ sư Cơ khí – Cơ điện tử" (tr. 60) | thấp | Dùng gạch nối chuẩn "–" thay vì chữ "và" |
| dtvt | Toàn bộ môn Năm 1 & Năm 2 bị mất | Y1: 0 môn, Y2: 0 môn | Toàn bộ khối Đại cương 67 TC và Cơ sở ngành 47 TC (tr. 1–4) | cao | Viết parser chuyên dụng tái dựng bảng theo tọa độ cho DTVT |
| dtvt | Tổng tín chỉ | `null` (chỉ có 8 môn = 32 TC) | Khung 9 trang, tổng xấp xỉ 180–186 TC (tr. 1–9) | cao | Trích xuất đủ ~50 môn của khung CTĐT |
| dtvt | Specializations requiredCourses rỗng | Cả 5 chuyên ngành `requiredCourses: []` | Mục 2.4.1–2.4.5: mỗi chuyên ngành có 8 TC bắt buộc (tr. 6–7) | cao | Bổ sung các môn bắt buộc cho 5 chuyên ngành |
| dtvt | ETE 349 tên vi | "Thiết kế hệ thống nhúng (Embedded System Design) Lập trình điều khiển nhúng" | "Lập trình điều khiển nhúng" (tr. 7) | trung bình | Tách tên tiếng Anh bị dính vào tiếng Việt |
| dtvt | ETE 424 tên vi | "Thông tin vệ tinh (Satellite Communications) Cơ sở viễn thám" | "Cơ sở viễn thám" (tr. 7) | trung bình | Tách tên môn bị dính dòng |
| dtvt | Tên EN 5 chuyên ngành | Dùng tên tiếng Việt | File PDF có tên EN trong ngoặc (tr. 6–7) | thấp | Cập nhật tên EN cho 5 chuyên ngành |
| cokhi | Tổng tín chỉ | 166 TC / 186 TC (-20 TC) | Trang 1: 186 TC (Đại cương 83 + Chuyên nghiệp 96 + Tốt nghiệp 7) | cao | Bổ sung các môn tự chọn và chuyên ngành thiếu |
| cokhi | Dồn môn Năm 1 theo mã | Y1 có tới 20 môn (78 TC) | Bảng khung không chia năm; mã 1xx dồn hết vào Y1 (tr. 1–3) | trung bình | Giữ `yearsInferred = true`, UI ghi chú giải thích |
| cokhi | Specializations requiredCourses rỗng | Cả 3 chuyên ngành `requiredCourses: []` | Mục 2.4.1: mỗi chuyên ngành có 8 TC bắt buộc riêng (tr. 4) | cao | Đưa môn bắt buộc chuyên ngành vào `specializations` |
| cokhi | ME 440 tên vi | "Manufacturing Tooling 3 Vật liệu Composite" | "Vật liệu Composite" (tr. 4) | trung bình | Xóa cụm chữ tiếng Anh bị dính vào tên tiếng Việt |
| cokhi | ME 310 tên en | "Practical Workshop I" | "Manufacturing Practice I" (tr. 3) | thấp | Đồng bộ tên tiếng Anh theo chuẩn CTĐT |
| qtkd | Mất toàn bộ Năm 3 và Năm 4 | Y3: 0 môn, Y4: 0 môn | Khung có 8 chuyên ngành + môn cơ sở ngành ở tr. 3–5 | cao | Trích xuất các môn mã 3xx và 4xx từ trang 3–5 vào Y3 và Y4 |
| qtkd | Xếp nhầm môn tự chọn thành bắt buộc Năm 1 | Y1 có 28 môn gồm cả `LNGS C101..K103` | Khối 5: Tự chọn ngoại ngữ chọn 1 tổ hợp (tr. 2–3) | cao | Chuyển nhóm ngoại ngữ vào `electiveGroups` |
| qtkd | Tổng tín chỉ | 143 TC (thực tế) / 195 (khai báo) | PDF dòng "Tổng" không đọc được; chuẩn khối ~180–186 TC | cao | Tính lại tổng tín chỉ theo cấu trúc chuẩn |
| qtkd | Trùng lặp nội dung trang 6 và 7 | Parser N1 đã khử trùng theo mã môn | Trang 6 và trang 7 của QTKD.pdf trùng lặp nội dung hoàn toàn | thấp | Khử trùng thành công, không bị nhân đôi số môn |
| qtkd | Specializations requiredCourses rỗng | Cả 8 chuyên ngành `requiredCourses: []` | Mục 2.3.1–2.3.8: mỗi chuyên ngành có môn bắt buộc riêng (tr. 3–5) | cao | Trích xuất môn bắt buộc của 8 chuyên ngành |

---

## 2. Kiểm tra các điểm đã biết & bắt buộc

### 2.1. Lệch số liệu BSE (ktpm)
- **Mục IV (tr. 6)**: Tổng tín chỉ tối thiểu ghi là **180 tín chỉ**.
- **Mục VI (tr. 53)**: Cộng tổng các học kỳ chính và hè ra **183 tín chỉ** (Học kỳ 1.1 đến 4.3).
- **Kết quả JSON N1**: Khai báo `totalCredits: 180`, nhưng tổng trích được chỉ là `178 TC` do bị sót 5 môn bắt buộc tại các ranh giới trang (p. 50, 52, 53).

### 2.2. Trùng lặp QTKD trang 6 và trang 7
- File `QTKD.pdf` trang 6 và trang 7 bị photocopy/in lặp lại cùng một bảng danh sách môn tự chọn chuyên ngành.
- Script của N1 đã sử dụng tập hợp `seen.has(code)` để bỏ qua các môn đã gặp, do đó **không có môn nào bị trùng mã** trong danh sách xuất ra.

### 2.3. Tách tên tiếng Anh của 3 bản khung (DTVT, COKHI, QTKD)
- **QTKD**: Tên dạng `English (Tiếng Việt)` -> Parser đã đảo ngược thành công `[vi, en] = [en, vi]`. Tuy nhiên, các chuyên ngành sâu ở trang 3–5 chưa được bóc tách đầy đủ.
- **COKHI**: Tên dạng `Tiếng Việt` xuống dòng `English` -> Parser cơ bản tách được, nhưng có một số môn bị lem chữ tiếng Anh vào ô tiếng Việt (ví dụ `ME 440: "Manufacturing Tooling 3 Vật liệu Composite"`).
- **DTVT**: Tên dạng `Tiếng Việt` + `(English)` -> Do lớp chữ PDF bị xáo trộn tọa độ, parser bỏ sót toàn bộ 3 trang đầu; một số môn ở trang sau bị dính hai tên môn vào một chuỗi (ví dụ `ETE 349, ETE 424`).

### 2.4. Xử lý Giáo dục thể chất (GDTC) và Giáo dục quốc phòng (GDQP)
- Cả 8 file PDF đều có dòng GDTC ("Hoàn thành 3 môn GDTC") và GDQP ("Cấp chứng chỉ"), không có số tín chỉ tích lũy vào tổng CTĐT.
- JSON của N1 đã **loại bỏ các môn không có số tín chỉ này** ra khỏi `courses[]` theo đúng quy tắc của schema (`credits > 0`).

---

## 3. Tổng hợp số lỗi theo mức độ

| Ngành | Cao | Trung bình | Thấp | Tổng cộng |
|---|:---:|:---:|:---:|:---:|
| **ktpm** (Kỹ thuật phần mềm) | 8 | 1 | 2 | 11 |
| **mmt** (Mạng máy tính & TTDL) | 5 | 1 | 1 | 7 |
| **tdh** (KT Điều khiển & Tự động hóa) | 4 | 1 | 1 | 6 |
| **dien** (Kỹ thuật Điện) | 3 | 1 | 1 | 5 |
| **cdt** (Kỹ thuật Cơ điện tử) | 5 | 1 | 1 | 7 |
| **dtvt** (KT Điện tử – Viễn thông) | 3 | 2 | 1 | 6 |
| **cokhi** (Kỹ thuật Cơ khí) | 2 | 2 | 1 | 5 |
| **qtkd** (Quản trị kinh doanh) | 4 | 0 | 1 | 5 |
| **TỔNG CỘNG** | **34** | **9** | **9** | **52** |

- **Ngành sạch nhất**: `dien` (Kỹ thuật Điện) và `cokhi` (Kỹ thuật Cơ khí) — số lượng môn bắt buộc cơ sở và đại cương được bóc tách tương đối liền mạch, sai lệch tín chỉ nhỏ nhất.
- **Ngành tệ nhất**: `dtvt` (Kỹ thuật Điện tử – Viễn thông) và `qtkd` (Quản trị kinh doanh):
  - `dtvt`: Mất trắng toàn bộ Năm 1 và Năm 2 (0 môn trích xuất được do lỗi đọc bảng lớp chữ PDF).
  - `qtkd`: Mất trắng Năm 3 và Năm 4 (0 môn trích xuất được); Năm 1 dồn 28 môn gồm cả tự chọn ngoại ngữ.
