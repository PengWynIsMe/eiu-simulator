# Báo cáo Nhiệm vụ PHONG-MAY — Bố trí lại phòng máy 406.B11 theo ảnh thật

- **Người thực hiện**: Antigravity (Gemini)
- **Nhánh**: `PengWynIsMe/phong-may-406`
- **Ảnh tham khảo gốc**: `references/phong-may/phong-may-1.jpg`, `phong-may-2.jpg`, và `phong-may-3-video.jpg`
- **Ảnh chụp nghiệm thu thực tế**: `docs/tasks/PHONG-MAY-anh/`

---

## 1. File đã sửa / tạo

1. **`docs/tasks/PHONG-MAY-406.md`** (Mới): Brief phân tích và so sánh chi tiết các điểm khác biệt giữa hiện trạng và 2 ảnh chụp thực tế trước khi code.
2. **`src/data/classrooms.json`**:
   - Cập nhật `studentFacing: [1, 0]` (quay mặt về phía Đông).
   - Bố trí lại 4 dãy bàn ghế (40 chỗ ngồi) hướng về tường Đông: Dãy 1 (`u = 93.6`, `deskU = 94.05`), Dãy 2 (`u = 91.8`, `deskU = 92.25`), Dãy 3 (`u = 90.0`, `deskU = 90.45`), Dãy 4 (`u = 88.2`, `deskU = 88.65`).
   - Lối đi trung tâm rộng 1.0 m tại `v = -142.5` đến `v = -141.5` thẳng hàng với TV.
   - Chuyển toàn bộ khu vực giảng dạy sang tường Đông (`u ≈ 96.45`): TV trung tâm (`v = -142.0`), 2 bảng trắng hai bên (`v = -144.8` và `v = -139.2`), bàn giáo viên (`u = 95.1, v = -139.5`), vị trí thầy giảng (`u = 95.0, v = -142.8`).
   - Cập nhật ghế người chơi `playerSeat: "406-r2-s6"` (tại `u = 91.8, v = -141.0`) và 18 ghế `npcSeats`.
3. **`src/scene/lesson/classroom406Plan.ts`**:
   - `makeDeskGeometry`: Bàn gỗ sáng màu (`#dfcaa7`) có tấm che gối phía trước, chân khung kim loại sáng hai bên.
   - `makeChairGeometry`: Ghế tựa gỗ sáng uốn cong (`#d4b896`), khung 4 chân kim loại mảnh cố định, không bánh xe (khớp ảnh thật).
   - `makeMonitorGeometry` & `makeScreenFaceGeometry`: Màn hình Dell viền mỏng đen và mặt hiển thị code quay về phía -u (về phía sinh viên).
   - `makeCaseGeometry`: Thùng máy Dell Precision đen đặt **TRÊN BÀN**; tự động ghép cặp 2 thùng đứng sát nhau giữa 2 chỗ ngồi như ảnh thật.
   - `makePendantLightGeometry`: Đèn LED thanh dài treo thả dạng pendant bằng dây cáp từ dầm trần xuống `y = 3.15 m`, dải phát sáng trắng cool-white.
   - `makePostersGeometry`: Hệ 7 poster slogan thương hiệu EIU trên các ô kính cửa sổ phía Bắc (`v = -147.86`).
   - Bổ sung dầm trần đen lộ kết cấu (industrial exposed beams), 2 máy lạnh âm trần dạng cassette 4 hướng, TV viền mỏng và 2 bảng trắng lớn có khay bút, ốp tường bê tông xám hiện đại.
4. **`src/scene/lesson/Classroom406.tsx`**:
   - Sử dụng `makePostersTexture` vẽ 7 poster EIU sắc nét trên canvas texture.
   - Tích hợp `makePendantLightGeometry` và `makePostersGeometry`.
   - Giữ vững toàn bộ phòng trong **9 batch instancedMesh / mesh đơn** (draw calls ≤ 13).
5. **`src/scene/lesson/ProjectorScreen.tsx`**:
   - Gắn slide bài giảng lên màn hình TV chính giữa tường Đông (`u = 96.45, v = -142.0`), mặt quay về phía sinh viên (`rotateY(-Math.PI / 2)`).
   - Bỏ chùm sáng hình nón máy chiếu thừa.
6. **`src/scene/lesson/Teacher.tsx`**:
   - Đặt Thầy Nam tại bục giảng tường Đông cạnh TV, mặt quay về phía lớp (`frontYaw = localDirToYaw(-1, 0)`).
   - Cập nhật đường vòng tránh bàn giáo viên `DETOUR_U = 95.8`.
7. **`src/scene/npc/classroomPlan.ts`**:
   - Khi đứng dậy, NPC lùi ra sau lưng ghế (`seat.u - BACK_OFFSET_U`) rồi đi ra lối đi trung tâm `aisleV` và hướng ra cửa thoát hiểm `door`.
8. **`src/scene/walk/WalkMode.tsx`**:
   - Cập nhật camera khi ngồi vào ghế `406-r2-s6`: Camera sau vai ngang mắt `1.55 m` nhìn về phía TV và bảng trắng ở tường Đông (`tgtU = 96.4, tgtV = -142.0`).
   - Camera máy ảo desktop: tiến sát màn hình (`u = 92.0, tgtU = 92.45`).
   - Đứng dậy bằng Esc: nhân vật bước ra ngay lối đi trung tâm (`u = 91.8, v = -142.0`), không kẹt vào va chạm bàn.
9. **`scripts/capture-phong-may.mjs`** (Mới): Script tự động điều khiển kiểm tra qua CDP và chụp ảnh nghiệm thu.

---

## 2. Kết quả kiểm tra kỹ thuật (Typecheck / Lint / Build)

```bash
npm run typecheck   # tsc -b --noEmit -> 0 lỗi
npm run lint        # eslint . -> 0 lỗi
npm run build       # vite build -> thành công, 738 modules trong 2.31 s
```

---

## 3. Đo FPS và Draw Calls

| Chỉ số | Trước (L3+L4) | Sau (PHONG-MAY) | Nhận xét |
| :--- | :--- | :--- | :--- |
| **Draw calls phòng 406** | 12–14 | **11–13** | Đạt yêu cầu ≤ 15 draw calls (nhờ tối ưu instancedMesh và gộp dầm trần, điều hòa, bảng, TV vào misc batch). |
| **FPS trong phòng 406** | 60 FPS | **60 FPS** | Cực kỳ mượt mà, không giật lag. |
| **Tổng draw calls toàn scene** | ~153 | **~155** | Tương đương, dù đã thêm trần dầm đen, 8 đèn LED treo thả, 2 điều hòa cassette, 7 poster kính, TV và 2 bảng trắng. |

---

## 4. Kiểm tra chức năng tương tác (L4 Buổi học & NPC)

1. **Vào phòng & phát sáng ghế**: Người chơi bước qua cửa phòng 406, pha chuyển sang `findSeat`. Ghế `406-r2-s6` có khung wireframe vàng nhấp nháy nổi bật ngay đầu lối đi.
2. **Ngồi vào ghế bằng E**: Bấm phím **E**, nhân vật ngồi chuẩn vào ghế (clip `sit`, mông chạm mặt ghế 0.45 m). Camera lướt mượt mà sau vai ngang mắt nhìn thẳng về TV slide và 2 bảng trắng ở tường trước. Hộp thoại Thầy Nam chào hỏi xuất hiện.
3. **Màn hình TV slide**: Chuyển slide bài giảng ("Nhập môn lập trình - Buổi 1"), texture slide tự động cập nhật sắc nét trên TV lớn giữa 2 bảng trắng. Thầy Nam phản ứng tương tác theo bài giảng.
4. **18 NPC bạn học**: Ngồi đúng 18 ghế theo `npcSeats`, quay mặt về phía bảng/TV, gõ bàn phím, bạn học phía trước giơ tay hỏi bài đúng kịch bản.
5. **Máy ảo Desktop**: Chuyển bước bài tập, camera tiến sát màn hình máy tính mở giao diện thực hành code.
6. **Thoát máy ảo & đứng dậy bằng Esc**: Bấm Esc đóng máy ảo, bấm Esc lần 2 nhân vật đứng dậy ra lối đi trung tâm (`u = 91.8, v = -142.0`), di chuyển tự do, không kẹt va chạm bàn.

---

## 5. Danh mục ảnh nghiệm thu thực tế (`docs/tasks/PHONG-MAY-anh/`)

- `01-tong-quan-phong-406.png`: Tổng quan phòng 406 nhìn dọc lối đi trung tâm về tường trước (TV, 2 bảng trắng, bàn ghế gỗ sáng, PC trên bàn).
- `02-tuong-truoc-tv-bang-thay.png`: Cận cảnh tường trước với TV lớn phát slide bài giảng, 2 bảng trắng hai bên, Thầy Nam.
- `03-day-cua-so-poster-eiu.png`: Dãy cửa sổ kính khung nhôm đen phía Bắc với chuỗi 7 poster slogan thương hiệu EIU rực rỡ.
- `04-tran-dam-den-den-tha.png`: Trần hở lộ dầm đen kết cấu, thanh đèn LED treo thả phát sáng, máy lạnh âm trần cassette 4 hướng.
- `05-ngoi-sau-vai-hoc.png`: Góc nhìn sau vai khi ngồi vào máy: nhìn màn hình Dell hiển thị code, bàn phím, case máy, nhìn lên TV và bảng trắng.
- `06-bai-giang-slide-tv.png`: Màn hình TV chuyển slide bài giảng, Thầy Nam hướng dẫn.
- `07-may-ao-desktop.png`: Chế độ máy ảo desktop, camera tiến sát màn hình.
- `08-dung-day-khong-ket.png`: Nhấn Esc đứng dậy ra ngay lối đi trung tâm, không kẹt va chạm bàn.

---

## 6. So sánh trực quan với 2 ảnh thực tế

- **Ảnh `phong-may-1.jpg`**:
  - Dãy bàn dài gỗ sáng hướng về phía trước: ✅ Khớp.
  - Thùng máy Dell Precision đen đặt TRÊN bàn, đứng theo cặp: ✅ Khớp.
  - Trần dầm đen hở + đèn LED thanh dài treo thả: ✅ Khớp.
  - Điều hòa âm trần cassette: ✅ Khớp.
  - Tường trước có TV ở giữa + 2 bảng trắng 2 bên: ✅ Khớp.
- **Ảnh `phong-may-2.jpg`**:
  - Tường cửa sổ phía Bắc khung đen đón sáng tự nhiên: ✅ Khớp.
  - Hàng poster slogan EIU ("CREATE, ENHANCE, and SUSTAIN", "Making it HAPPEN", "EIU TRƯỜNG ĐẠI HỌC QUỐC TẾ MIỀN ĐÔNG", "DESIGN IT and BUILD IT", "Turning IDEAS into REALITY", "Design FUTURE with EXCELLENCE"): ✅ Đã tái hiện đầy đủ trên các ô kính phía Bắc.
  - Ghế ngồi gỗ sáng uốn cong, chân kim loại không bánh xe: ✅ Khớp.
- **Ảnh `phong-may-3-video.jpg` (nhìn thẳng tường trước)**:
  - Tường trước xám nhạt vân bê tông mộc: ✅ Khớp (`#abaaa5`).
  - 2 bảng trắng hai bên + TV lớn ở giữa cân đối: ✅ Khớp.
  - Trần xám bê tông lộ kết cấu bên trên các dầm đen + máy lạnh âm trần cassette: ✅ Đã bổ sung tấm trần bê tông xám `y = 3.79 m`, các dầm ngang chạy dọc và cassette điều hòa trắng ở giữa lối đi.
  - Ánh sáng tự nhiên và đèn LED treo tỏa sáng toàn phòng: ✅ Đạt chuẩn sáng rõ, không đổ bóng nặng.

---

## 7. Cập nhật tinh chỉnh màu sắc & ánh sáng theo ảnh thực tế (Follow-up)

1. **Tường xám nhạt vân bê tông**:
   - Khắc phục hiện tượng tường nâu đen tối màu do thừa hưởng vật liệu chung của tòa nhà.
   - Thêm lớp ốp tường bê tông xám nhạt hiện đại `CONCRETE_LIGHT_GRAY = '#abaaa5'` (trong dải `#9a9a96`–`#b5b4ae`) cho tường trước, tường sau, tường hành lang và bậu cửa sổ.
2. **Tăng cường ánh sáng nội thất**:
   - Bổ sung nguồn sáng nội thất riêng cho phòng 406.B11 tầng 4: `ambientLight` cường độ `1.5` màu trắng sáng `#ffffff` và `directionalLight` góc xiên trần `0.9` màu `#fffcf5`.
   - Dải đèn LED treo thả trần được cấu hình phát quang `emissive="#ffffff"`, `emissiveIntensity={2.5}` và `toneMapped={false}` tạo cảm giác bóng tuýp LED sáng rõ như ảnh thật mà không cần thêm shadow realtime.
3. **Bảng trắng sáng tinh khiết**:
   - Mặt bảng trắng chuyển sang màu `#ffffff` phẳng mịn, khung viền nhôm mảnh sáng `#cbd5e1`.
4. **Mặt bàn và ghế gỗ sáng hơn**:
   - Mặt bàn sinh viên chuyển sang màu be gỗ sồi `#edd9bf` với độ nhám `0.45`.
   - Ghế ngồi gỗ chuyển sang màu be sáng `#ebd8be` đồng bộ.
5. **Hiệu năng & Luồng buổi học**:
   - Giữ nguyên số lượng draw calls (11–13 calls) và tốc độ 60 FPS mượt mà.
   - Toàn bộ 8 ảnh nghiệm thu đã được chụp lại và cập nhật vào `docs/tasks/PHONG-MAY-anh/`.

