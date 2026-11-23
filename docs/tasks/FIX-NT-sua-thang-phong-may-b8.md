# Brief FIX-NT: Sửa cầu thang B3/B8/B11 và Dựng hệ thống phòng máy tầng 4 Block 8

- **Mã task**: FIX-NT
- **Mục tiêu**:
  1. Khắc phục lỗi hiển thị cầu thang tại B3, B8, B11 bị giảm chất lượng thị giác / sai lệch sau khi gộp nhánh tổng hợp (`b90da88` vs `24483be`), khôi phục vẻ đẹp chuẩn T19 (`cc9bf03`) mà không ảnh hưởng tính năng mới hoặc cầu thang gáy sách B6.
  2. Dựng dãy phòng máy tính tầng 4 Block 8 (dãy cánh Bắc sát nhà xe cạnh căn tin) theo chuẩn thiết kế phòng mẫu 406.B11 (bàn gỗ sáng dài, màn hình Dell + case trên bàn, ghế gỗ, 2 bảng trắng + TV, trần hở + đèn LED, poster EIU trên cửa sổ, biển số phòng song ngữ theo `useLangStore`, gộp instanced mesh để giữ draw call thấp).

---

## 1. Phân tích nguyên nhân lỗi cầu thang sau khi gộp (Mục 1)

Qua so sánh mã nguồn và chụp ảnh trực quan 7 góc thang giữa bản `24483be` (trước gộp) và `b90da88` (main hiện tại):

1. **Nguyên nhân chính 1 — `INTERIOR_FLOOR_POLYGON_OFFSET = -1` trong `InteriorScene.tsx`**:
   - Được thêm vào trong commit `679c5c7` (`fix-fp-nhay`) với mục đích tránh z-fighting với nền toàn cục. Tuy nhiên khi vào trong nhà (`inInterior = true`), `<Ground />` ngoại cảnh đã bị tắt hoàn toàn (`Campus.tsx` line 29: `if (inInterior) return (<InteriorScene/><WalkMode/>)`).
   - Việc gán `polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1` cho `floorGeometry` khiến bề mặt sàn bị đẩy lên phía trước trong depth buffer. Hệ quả:
     - Mặt sàn nội thất đè lấn lên các bậc thang dưới cùng (bậc 1 ở y=0..0.19m) của B3, B8, B11, làm chân thang bị "chìm" hoặc mất nét bậc chân.
     - Mặt sàn đè lấn lên các lớp phủ sàn gạch hành lang (`b8-corr`, `b8-paving`), gây z-fighting và đường viền răng cưa tại các lối thông tầng.
2. **Nguyên nhân chính 2 — Sai lệch màu nền trời trong `InteriorScene.tsx`**:
   - Commit `4c5017b` (`canteen-trong`) sửa logic nền trời:
     `args={[isTwinWing || isCanteen ? '#c9e1e7' : isB4 ? '#8cc8f5' : '#0f172a']}`
   - Trước đó, B8 & B11 (`isTwinWing`) dùng màu xanh trời sáng trong `#8cc8f5`. Việc chuyển sang `#c9e1e7` (xám xanh mờ đục) làm ánh sáng gián tiếp và phông nền qua giếng trời buồng thang bị tối, đục và mất tương phản thị giác, khiến người xem cảm thấy cầu thang "không còn đẹp như trước".
3. **Cầu thang gáy sách B6 (`BookStaircase.tsx`)**:
   - Không bị ảnh hưởng bởi logic sàn của `InteriorScene` do nằm trong B6 riêng biệt, cần giữ nguyên vẹn.

---

## 2. Thiết kế hệ thống phòng máy tính tầng 4 Block 8 (Mục 2)

1. **Xác định dãy phòng gần nhà xe**:
   - Nhà xe cạnh Căn tin (`nha-xe-can-tin`) nằm ở phía Bắc của Block 8 (tọa độ Z = -242 .. -270 m).
   - Cánh Bắc của Block 8 (`v = -210.2 .. -200.0`) hướng trực diện ra nhà xe và đường Lê Duẩn.
   - Các phòng tầng 4 thuộc cánh Bắc gồm: **402.B8, 404.B8, 406.B8, 408.B8, 410.B8, 412.B8, 414.B8, 416.B8, 418.B8, 420.B8**.
   - Cánh Nam (hướng nội khu sân trong / B9) gồm các phòng học lý thuyết thường (401–419.B8), giữ nguyên cách dựng hiện có.
2. **Nội thất theo chuẩn phòng 406.B11**:
   - Tái sử dụng các hình học và tỉ lệ chuẩn từ `src/scene/lesson/classroom406Plan.ts`:
     - Bàn dài gỗ sáng màu (`WOOD_LIGHT = '#edd9bf'`), chân khung kim loại (`#cbd5e1`).
     - Màn hình Dell viền mỏng (`makeMonitorGeometry`) + màn sáng (`makeScreenFaceGeometry`) với texture code canvas.
     - Bàn phím chuột đen + Thùng máy Dell Precision đứng trên mặt bàn (`makeCaseGeometry`).
     - Ghế gỗ uốn cong 4 chân kim loại (`makeChairGeometry`).
     - Tường trước (tường Đông mỗi phòng): 2 bảng trắng khung nhôm + màn hình TV trung tâm.
     - Hệ dầm trần hở đen (`BEAM_BLACK = '#18181b'`) + Đèn LED thanh thả y = 3.15 m (`makePendantLightGeometry`).
     - Cửa sổ phía Bắc: Dãy poster thương hiệu EIU (`makePostersTexture`).
3. **Biển số phòng song ngữ EIU**:
   - Đặt trên tường hành lang bên ngoài cửa vào mỗi phòng máy.
   - Biển mica 3–4 dải màu chuẩn EIU (xanh lá `#15803d`, cam `#ea580c`, đỏ `#991b1b`).
   - Hiển thị mã phòng (vd: `406.B8`) và phụ đề song ngữ: `Phòng máy tính` / `Computer Lab`, tự động đổi theo `useLangStore`.
4. **Instanced Rendering & Budget**:
   - Tất cả các phòng máy cánh Bắc tầng 4 được gộp chung vào 1 tập hợp `InstancedMesh` duy nhất (1 batch cho bàn, 1 batch cho ghế, 1 batch cho màn hình, 1 batch cho case, 1 batch cho đèn...).
   - Đảm bảo số draw call tăng thêm ≤ 10 call khi ở tầng 4.
   - Khi ở tầng 1–3, hệ thống phòng máy tầng 4 không render.

---

## 3. Kế hoạch thực hiện & Cam kết chất lượng

- **Bước 1 (Mục 1)**:
  - Chỉnh sửa `src/scene/interior/InteriorScene.tsx`: loại bỏ `INTERIOR_FLOOR_POLYGON_OFFSET`, khôi phục màu nền trời `#8cc8f5` cho `isTwinWing`.
  - Chụp ảnh kiểm chứng góc thang B3, B8, B11.
  - Chạy `npm run typecheck`, `npm run lint`, `npm run build`.
  - Thực hiện Git commit riêng cho Mục 1: `fix(interior): phuc hoi mau nen troi va bo polygon offset san lam hong bac cau thang`.
- **Bước 2 (Mục 2)**:
  - Xây dựng component / helper dựng phòng máy tầng 4 B8 tích hợp vào `B8Furniture.tsx`.
  - Cập nhật biển hiệu song ngữ liên kết `useLangStore`.
  - Chụp ảnh kiểm chứng bên trong phòng máy và ngoài hành lang tầng 4.
  - Chạy `npm run typecheck`, `npm run lint`, `npm run build`.
  - Thực hiện Git commit riêng cho Mục 2: `feat(interior): them he thong phong may tinh tang 4 Block 8 theo chuan phong 406`.
- **Bước 3**: Dọn dẹp worktree tạm, dừng các tiến trình nền và báo cáo hoàn thành bằng tiếng Việt.
