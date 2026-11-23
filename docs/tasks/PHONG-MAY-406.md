# PHONG-MAY-406 — Bố trí lại phòng máy 406.B11 theo ảnh thật EIU

- **Mục tiêu**: Bố trí lại phòng máy 406.B11 theo 2 ảnh chụp thực tế của trường (`references/phong-may/phong-may-1.jpg` và `phong-may-2.jpg`), cập nhật hướng ngồi, dãy bàn ghế, máy tính, TV trình chiếu, bảng trắng, poster cửa sổ, trần dầm đen, đèn thả và máy lạnh cassette, đồng thời giữ nguyên toàn bộ kịch bản buổi học L4 và NPC.
- **Tài liệu tham khảo**:
  - Ảnh thật: `references/phong-may/phong-may-1.jpg`, `references/phong-may/phong-may-2.jpg`
  - Kế hoạch Giai đoạn 2: `docs/PLAN-GIAI-DOAN-2.md`
  - Nhiệm vụ trước đó: `docs/tasks/L346-phong-406-ngoi-thay.md`, `docs/tasks/L346-bao-cao.md`

---

## 1. So sánh chi tiết phòng hiện tại với ảnh thực tế

| Yếu tố | Phòng hiện tại (code cũ) | Ảnh thực tế EIU (phong-may-1 & 2) | Giải pháp thực hiện |
| :--- | :--- | :--- | :--- |
| **Hướng ngồi (Facing)** | Sinh viên quay mặt về hướng Tây (`studentFacing = [-1, 0]`). Bảng đặt ở tường Tây (`u = 87.42`). Cửa sổ phía Bắc nằm bên **tay phải**. | Sinh viên ngồi quay mặt về tường trước (phía Đông `+U`, `studentFacing = [1, 0]`). Cửa sổ với poster EIU nằm ở bên **tay trái** (tường Bắc ngoại cảnh `v = -148.1`). | Đổi `studentFacing` sang `[1, 0]` (hướng Đông). Chuyển toàn bộ khu vực giảng dạy (TV, bảng trắng, thầy giáo) sang tường Đông (`u ≈ 96.4`). |
| **Bảng & Thiết bị trình chiếu** | 1 bảng trắng dài (3.6 m) + 1 màn chiếu cuộn (2.0 × 1.5 m) + 1 máy chiếu treo trần có chùm sáng nón. | **1 TV lớn treo chính giữa tường trước** (~85 inch) hiển thị slide bài giảng EIU/code. **2 bảng trắng lớn** bố trí cân đối hai bên TV. Không có màn chiếu cuộn hay projector treo rườm rà. | Đưa TV lớn vào trung tâm tường trước gắn slide bài giảng tự động (`ProjectorScreen`), đặt 2 bảng trắng 2 bên TV, bỏ máy chiếu cuộn/chùm sáng thừa. |
| **Thùng máy PC (Dell Precision)** | Thùng máy đặt **dưới gầm bàn trên mặt sàn** (`y = 0`). | Thùng máy Dell Precision màu đen đặt **TRÊN BÀN**, xếp thành từng cặp 2 thùng đứng sát nhau giữa 2 chỗ ngồi. | Đưa `pcCase` lên mặt bàn (`y = 0.75 + 0.21 = 0.96 m`), ghép thành từng cặp đứng giữa các vị trí làm việc. |
| **Ghế ngồi sinh viên** | Ghế xoay văn phòng màu sẫm (`#2f3b4f`) với 1 trụ và chân sao 5 nhánh. | Ghế tựa bằng **gỗ sáng màu uốn cong**, khung chân kim loại mảnh màu sáng (chrome/bạc), **không có bánh xe** (chân cố định 4 điểm). | Cập nhật geometry ghế (`makeChairGeometry`): mặt ngồi + tựa lưng gỗ sáng (`#d4b896`), khung chân 4 điểm kim loại sáng (`#94a3b8`). |
| **Bàn làm việc sinh viên** | Bàn mặt gỗ tối/trung tính, vách ngăn đơn giản. | Bàn gỗ sáng màu (`#e2caa8`), mặt bàn rộng, xếp thành các dãy dài ngăn nắp hướng về phía bảng/TV. | Giữ kích thước tiêu chuẩn 1.0 m × 0.6 m × 0.75 m, màu gỗ sáng ấm đồng bộ với ghế. 4 dãy × 10 chỗ = 40 chỗ. |
| **Cửa sổ & Poster EIU** | Cửa sổ trơn, không có họa tiết thương hiệu. | Dãy cửa sổ kính khung đen lớn phía Bắc. Hàng kính phía trên dán chuỗi poster slogan thương hiệu EIU rực rỡ (tím, xanh lá, đỏ, cam, navy...). | Dựng hệ poster kính với texture canvas sắc nét: tím "Turning IDEAS into REALITY", xanh "Design FUTURE with EXCELLENCE", đỏ "CREATE, ENHANCE, and SUSTAIN", cam "Making it HAPPEN", navy "EIU TRƯỜNG ĐẠI HỌC QUỐC TẾ MIỀN ĐÔNG", đỏ "DESIGN IT and BUILD IT". |
| **Trần, Dầm & Chiếu sáng** | Trần phẳng kín cao 3.8 m, 6 đèn tấm âm trần (1.2 × 0.6 m). 2 điều hòa treo tường. | **Trần hở lộ dầm đen/xám đậm** (industrial style). **Đèn LED thanh dài treo thả** (pendant linear lights) bằng dây cáp. **Máy lạnh âm trần dạng cassette 4 hướng thổi** màu trắng. | Thêm hệ dầm trần đen, thanh đèn LED treo thả tại độ cao `y = 3.1 m` phát sáng trắng cool-white, 2 máy lạnh cassette 4 hướng gắn trần. |
| **Tường phòng** | Tường sơn trắng/be trơn. | Tường bê tông / sơn giả bê tông xám hiện đại. | Áp màu bê tông xám thanh lịch (`#a8a29e` / `#9ca3af`), tôn lên các mảng màu thương hiệu EIU. |

---

## 2. Kế hoạch bố trí không gian & tọa độ mới (Hệ B11)

- **Kích thước phòng 406.B11**:
  - `u`: từ `87.24` (tường Tây - giáp phòng 408) đến `96.61` (tường Đông - giáp phòng 404), chiều dài = 9.37 m.
  - `v`: từ `-148.1` (tường Bắc ngoại cảnh - cửa sổ) đến `-136.0` (tường Nam hành lang - cửa vào), chiều rộng = 12.1 m.
  - Cửa vào: `u = 89.44, v = -136.0` (ở góc Tây Nam của phòng).

- **Phân bố 4 dãy bàn (40 chỗ ngồi)**:
  - Học sinh ngồi quay mặt về hướng Đông (`+U`), nhìn về tường trước (`u ≈ 96.4`).
  - Dãy 1 (hàng đầu, gần TV nhất): Ghế `u = 93.6`, Bàn `deskU = 94.05`. Cách tường trước ~2.1 m.
  - Dãy 2 (chứa ghế người chơi `406-r2-s6`): Ghế `u = 91.8`, Bàn `deskU = 92.25`.
  - Dãy 3: Ghế `u = 90.0`, Bàn `deskU = 90.45`.
  - Dãy 4 (hàng cuối, gần cửa): Ghế `u = 88.2`, Bàn `deskU = 88.65`.

- **Phân bố chỗ ngồi dọc trục V (chiều rộng)**:
  - Khối Bắc (5 chỗ / dãy): `v = -147.0, -146.0, -145.0, -144.0, -143.0`.
  - Lối đi trung tâm (Central Aisle): từ `v = -142.5` đến `v = -141.5` (rộng 1.0 m, tâm tại `v = -142.0`, thẳng hàng với TV).
  - Khối Nam (5 chỗ / dãy): `v = -141.0, -140.0, -139.0, -138.0, -137.0`.

- **Tường trước (Phía Đông, `u = 96.45`)**:
  - TV trung tâm: `u = 96.45, v = -142.0`, kích thước 2.1 m × 1.2 m, hiển thị slide bài giảng.
  - Bảng trắng trái (phía Bắc): `u = 96.45, v = -144.8`, rộng 2.8 m × 1.2 m.
  - Bảng trắng phải (phía Nam): `u = 96.45, v = -139.2`, rộng 2.8 m × 1.2 m.
  - Bàn giáo viên: `u = 95.1, v = -140.0`.
  - Vị trí thầy giảng: `u = 95.0, v = -142.0` (đứng cạnh TV trình chiếu).

---

## 3. Kiến trúc kỹ thuật & Hiệu năng

1. **Giữ vững Instancing (≤ 15 draw calls cả phòng)**:
   - Toàn bộ 40 bàn SV: 1 `instancedMesh`.
   - Toàn bộ 40 ghế SV (mẫu gỗ chân kim loại): 1 `instancedMesh`.
   - Toàn bộ 40 màn hình: 1 `instancedMesh`.
   - Toàn bộ 40 mặt màn hình sáng: 1 `instancedMesh` (dùng chung canvas texture).
   - Toàn bộ 40 bàn phím + chuột: 1 `instancedMesh`.
   - Toàn bộ 40 case máy Dell Precision: 1 `instancedMesh` (đặt trên bàn).
   - Đèn LED treo thả: 1 `instancedMesh` (thanh đèn + cáp treo).
   - Dầm trần đen & điều hòa cassette: gom vào batch nội thất phụ (misc).
2. **Bảo tồn tính năng Buổi học L4 & NPC**:
   - `classrooms.json` cập nhật tọa độ ghế, `playerSeat` (`406-r2-s6` tại `u = 91.8, v = -141.0`), và 18 ghế `npcSeats`.
   - Khi ngồi vào ghế: Camera sau vai nhìn về phía TV và bảng trắng (`+U`), ngang tầm mắt. Phím Esc thoát máy ảo và đứng dậy ra lối đi an toàn không kẹt va chạm bàn.
   - Thầy giáo đứng giảng cạnh TV, phản ứng theo slide/câu hỏi đúng sai.
   - 18 NPC sinh viên ngồi đúng ghế, gõ phím, giơ tay hỏi bài.
3. **Va chạm**:
   - Khối va chạm bàn (`WallSegment` trong `FLOOR_4_DATA.walls`) tự động khớp theo `rowDeskUs` mới, đảm bảo người chơi di chuyển tự do trong các lối đi và không đi xuyên qua bàn.
