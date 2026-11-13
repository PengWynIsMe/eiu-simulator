# Bản vẽ / số liệu kiến trúc tìm được (đợt tìm 2026-11-13)

Mục tiêu: tìm mặt bằng từng block, từng phòng. Kết luận ngắn: **không có bản vẽ mặt bằng thi công công khai trên mạng**.
Tìm được: bản quy hoạch gốc + sơ đồ khối của đơn vị quy hoạch, và bảng số phòng/diện tích chính thức theo từng năm.

## 1. Quy hoạch gốc Surbana (Singapore), ~2009 — `quy-hoach-surbana-2009/`

- Nguồn: Scribd "Becamex International University Master Plan" (Final Report RV 2-2, Surbana International Consultants)
  https://www.scribd.com/document/17736506/Final-Report-RV-2-2-University-in-BinhDuong — ảnh trang tải 2026-11-13 (1064 px, chỉ đọc được bảng lớn).
- Báo Cần Thơ 14/08/2009 xác nhận: Surbana quy hoạch, 26 ha, 124.000 m² sàn, 3 giai đoạn.
- Đây là **bản đề xuất**, trường thật khác ở nhiều chỗ (vd tháp hành chính chưa xây). Dùng cho cấu trúc, không dùng cho vị trí.
- Trang hữu ích:
  - `p05` mặt bằng tổng có chú thích 33 hạng mục; `p13–p27` sơ đồ giao thông, đỗ xe, cứu hỏa, lối đi, cây xanh.
  - `p10` **bảng diện tích (Schedule of Accommodation)**: phòng học/studio 75 m², lab 200 m², giảng đường 120 chỗ 240 m², giảng đường 300 chỗ 900 m².
  - `p33` mặt bằng + mặt cắt khối hành chính, lưới cột **8 m**, rộng 34 m.
  - `p36–p37` **"Faculty Block"**: 2 thanh nhà song song + sân trong + cầu nối; mã màu giảng đường / phòng học / lab / thang-WC.
    Khớp với kiểu B8–B11 đang dựng.

## 2. Nhà thầu Becamex BCE — trang công trình EIU

https://becamexbce.com.vn/CONG-TRINH-TRUONG-DAI-HOC-QUOC-TE-MIEN-DONG-id-403

- 04/2010 xong 6 tòa: **4, 5, 8A, 8B, 11A, 11B**; 07/2010 xong **9A, 9B, 10A, 10B**.
  → Mỗi block 8–11 là **2 nhà A + B** (đúng mô hình hai cánh).

## 3. Trang "Cơ sở vật chất" cũ (Wayback 2012)

https://web.archive.org/web/20120729011536/http://www.eiu.edu.vn/about/c-co-so-vat-chat-33.aspx

- Giai đoạn 1: 10 tòa (4, 5, 8A, 8B, 9A, 9B, 10A, 10B, 11A, 11B), **68.592 m² sàn**, **210 phòng học** trong các tòa 8–11.
- Tòa 4, 5 ban đầu dùng cho quản lý, điều hành (ngoại ngữ, khảo thí, thư viện, CNTT).

## 4. Báo cáo công khai cơ sở vật chất (chính thức, có dấu) — `cong-khai/`

Nguồn: https://eiu.edu.vn/kham-pha/ve-chung-toi/cong-khai-giao-duc/ (mục 10 mỗi năm, Google Drive) + Wayback cho 2014–2015.

Năm 2023–2024 (`csvc-2023-2024.pdf`): sàn trụ sở chính 83.636 m², KTX 37.339 m².

| Loại | Số phòng | Tổng m² | TB m²/phòng |
| --- | --- | --- | --- |
| Hội trường > 200 chỗ (200.B3) | 1 | 1.065 | 1.065 |
| Giảng đường 100–200 chỗ | 30 | 5.106 | ~170 |
| Phòng học 50–100 chỗ | 46 | 4.033 | ~88 |
| Phòng học < 50 chỗ | 70 | 4.657 | ~67 |
| Thư viện | 1 | 2.496 | |
| Fablab / Phòng TN 4.0 | 1 + 1 | 794 + 794 | |
| Phòng thực hành máy tính | 4 | 380 | 95 |
| Phòng Skilllab | 2 | 380 | 190 |
| Nhà tập năng đa | 1 | 364 | |

Lab: 95 / 144 / 190 / 285 / 570 m². **Gợi ý: ~95 m² là một module phòng chuẩn** (190 = 2 module, 285 = 3).
Năm 2014–2015: 146 giảng đường / 16.840 m², 32 phòng ngoại ngữ / 2.482 m², 24 phòng TN / 7.371 m², hội trường 1.605 m².

## 5. BTIC — tòa hội nghị (phối cảnh) — `btic/`

https://btic.vn/project/dai-hoc-quoc-te-mien-dong-eiu-kien-truc/ — thiết kế cảnh quan "đồi trung tâm" + tòa hội nghị 1.500 chỗ, 18.000 m².
Ảnh `1_31-Photo.jpg` là phối cảnh (chưa rõ đã xây chưa). `z6158...jpg` là ảnh thật sân trong khối hai cánh — tốt cho mặt đứng.

## Chưa tìm được / hướng còn lại

- Mặt bằng thi công từng tầng: không công khai. Nguồn chắc nhất: **sơ đồ thoát hiểm dán ở mỗi tầng** (chụp tại trường).
- Tour 360 nội thất (B8 60 ảnh, B11 39, B3 26, B4–5 12, B6 5) — xem `docs/ASSETS-REVIEW.md`; dựng lại vị trí phòng từ đó được.
- Wayback "Báo cáo tự đánh giá EIU 2016" bị 404. Google Sites nội bộ `sites.google.com/eiu.edu.vn/...` cần tài khoản EIU.
