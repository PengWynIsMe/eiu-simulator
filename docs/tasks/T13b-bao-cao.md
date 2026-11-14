# Báo cáo hoàn thành Task T13b — Sửa B8 theo bảng tọa độ đo sẵn và hạ camera trong nhà

- Người thực hiện: **Gemini (Antigravity)**
- Worktree & Nhánh: `t13b-sua-b8` (không commit, không push, không cài thư viện)
- Cổng dev: **5174** (`npm run dev -- --port 5174 --strictPort`)
- Trạng thái: **Hoàn thành 100% toàn bộ tiêu chí brief T13b**

---

## 1. Tóm tắt kết quả đạt được

### 1.1. Bố cục B8 chuẩn hóa 100% theo bảng tọa độ đo sẵn (`T13b-b8-toa-do.json`)
- **Khung tọa độ toán học thực tế**:
  - Trục dài nghiêng đúng **−13.1°** (`axisAngleDeg: -13.1`).
  - Hệ vector cơ sở trực giao: `ex = [0.97398, -0.22663]` (hướng Tây → Đông) và `ev = [0.22663, 0.97398]` (hướng Bắc → Nam).
  - Công thức chuyển đổi 2 chiều tuyệt đối: `world[x, z] = u * ex + v * ev`.
  - Khung bao 6 đỉnh chuẩn hóa khớp từng centimet với footprint OpenStreetMap (`getBuilding('b8').shape`).
- **Tầng 1 (Trệt)**:
  - Dãy phòng học Bắc: `116.B8` (u: 13.9–31.8), `114.B8` (u: 31.8–50.8), Thang bộ giữa Bắc, dãy phòng lý thuyết `112–104.B8`, phòng kỹ thuật điện `102.B8` và `WC-1N` Đông Bắc.
  - Dãy phòng học Nam: `WC-1S` Tây Nam, Thang bộ Tây Nam, `111.B8` (u: 14.3–32.5), `109.B8` (u: 32.5–50.8), Thang bộ giữa Nam, dãy phòng `107–101.B8`.
  - 4 Cửa ra vào / thoát hiểm tầng trệt mở đúng vị trí các mũi tên trên sơ đồ thoát hiểm: Cửa Bắc (nhịp giữa), Cửa Nam (nhịp giữa), Cửa Đông (hành lang Đông) và Cửa Tây (sảnh mở Tây).
- **Tầng 2 (Tầng mẫu chuẩn)**:
  - Cánh Bắc: Thang bộ Tây Bắc, 10 phòng học lý thuyết số chẵn `220–202.B8`, Thang bộ giữa Bắc, `WC-2N` Đông Bắc.
  - Cánh Nam: `WC-2S` Tây Nam, Thang bộ Tây Nam, 11 phòng học lý thuyết số lẻ `221–201.B8`, Thang bộ giữa Nam.
  - Sân trong Tây nhỏ (`u ∈ [13.5, 50.0]`, `v ∈ [-197.0, -180.1]`) và Sân trong Đông lớn (`u ∈ [54.1, 114.9]`, `v ∈ [-196.5, -179.6]`).
- **Tầng 3**:
  - Cánh Bắc: Giữ nguyên 10 phòng `320–302.B8` cùng vị trí với Tầng 2.
  - Cánh Nam: Gộp chính xác 6 phòng theo số đo sơ đồ:
    - `311.B8` (gộp ô 221 + 219, u: 13.5–31.7)
    - `309.B8` (gộp ô 217 + 215, u: 31.7–50.0)
    - `307.B8` (gộp ô 213 + 211, u: 53.7–71.5)
    - `305.B8` (gộp ô 209 + 207, u: 71.5–90.1)
    - `303.B8` (gộp ô 205 + 203, u: 90.1–108.8)
    - `301.B8` (ô 201, u: 108.8–117.7)
- **Tầng 4**:
  - Cánh Bắc: Giữ nguyên 10 phòng `420–402.B8`.
  - Cánh Nam: 4 phòng Tây `419–413.B8` (ô 221–215), phòng học lớn `411.B8` (gộp ô 213 + 211, u: 53.7–71.5), 5 phòng Đông `409–401.B8` (ô 209–201).

---

### 1.2. Thang bộ & Thang máy chuẩn hóa theo xác nhận người dùng
- **Đúng 1 buồng thang máy duy nhất mỗi tầng**:
  - Đặt tại nhịp giữa cánh Đông (`u ∈ [55.1, 58.2]`, `v ∈ [-190.2, -186.5]`, tâm world `(12.5, -196.3)`).
  - Cửa mở hướng Tây ra hành lang giữa, bảng LED hiển thị số tầng hiện tại.
  - Chỉ duy nhất tại buồng thang máy này HUD mới hiện **"E – Thang máy Block 8 (Nhịp giữa)"** và mở modal chọn tầng (1–4).
- **Thang bộ**:
  - Toàn bộ các vị trí `kind: "stair"` (Thang bộ Tây Bắc, Thang bộ Tây Nam, 2 đầu hành lang ngang giữa Bắc & Nam, Lõi thang bộ Đông) là **THANG BỘ THUẦN TÚY**.
  - Có các bậc thang 3D nhìn thấy rõ ràng, có tường/vách che chắn chặn va chạm, **hoàn toàn không có bảng chọn tầng hay nút tương tác thang máy**.

---

### 1.3. Sân trong — Xóa sạch vách kính quanh sân, giữ lan can inox + viền xanh
- **Xóa toàn bộ vách kính quanh 2 sân trong** (khắc phục dứt điểm góp ý của người dùng về việc thừa kính).
- Thay bằng **lan can inox 3 thanh** cao chuẩn ~1.1 m (`metalness: 0.9, roughness: 0.15`) chạy dọc mép sàn 2 sân trong tầng 2–4.
- **Dải viền sàn màu xanh dương đặc trưng** (`#0284c7`, rộng 0.35 m) chạy dọc theo mép hành lang nhìn ra sân trong, đồng bộ với ảnh thực tế tại trường (`IMG_3728`, `IMG_3734`, `IMG_3735`).
- **Hệ lam che nắng** kim loại trên cao đón gió (y = 3.2m, 3.4m, 3.6m).
- **Tầng 1 trệt**: Mặt sân lát đá mở thoáng, bố trí 8 cụm bồn cây đá lớn với hàng cây vươn cao qua giếng trời lên các tầng trên.

---

### 1.4. Camera trong nhà — Sau vai thấp, chống kẹt tường, chuyển góc nhìn phím C
- **Góc nhìn sau vai thấp**:
  - Khoảng cách mặc định: **4 m** sau nhân vật.
  - Chiều cao camera: **2.2 m** trên mặt sàn (chúc nhẹ tự nhiên ~11°, không còn góc chúc 50° dốc đứng như trước).
  - Điểm nhìn target: Đầu nhân vật (cao **1.4 m** trên sàn).
  - Con lăn chuột điều chỉnh cự ly: **2.5 m – 7.0 m** (ngoài trời vẫn giữ 4–20 m).
- **Chống tường che khuất (Camera Obstruction / Spring-arm)**:
  - Thuật toán giao đoạn thẳng 2D giữa nhân vật và camera với danh sách tường đặc của tầng (`minT`), hoàn toàn không cấp phát đối tượng mới trong `useFrame`.
  - Khi nhân vật lùi sát tường hoặc đứng trong phòng hẹp, camera tự động thu sát về sau vai nhân vật (tối thiểu 1.2 m), tường luôn ở phía sau camera và không bao giờ che lấp nhân vật hay tầm nhìn.
- **Phím C chuyển đổi góc nhìn trên xuống (Top-down view)**:
  - Nhấn phím `C` (hoặc `c`) trong nhà: camera chuyển tức thì sang góc nhìn trực giao từ trên cao (~95 m).
  - Trục `camera.up` được định hướng chính xác theo `-B8_EV`: **Bắc hướng thẳng lên trên, Nam xuống dưới, Tây sang trái, Đông sang phải** — trùng khớp 100% với hướng của các bản sơ đồ thoát hiểm thực tế.
  - Nhấn `C` lần nữa: quay lại góc nhìn sau vai thông thường.
  - Thẻ HUD góc dưới trái hiển thị rõ ràng hướng dẫn phím: `C: Góc nhìn trên xuống · Kéo chuột: Xoay nhìn · Cuộn chuột: Thu phóng (2.5–7m)`.

---

## 2. Đối chiếu Ảnh chụp 3D nhìn từ trên với Sơ đồ thoát hiểm thực tế

Toàn bộ 4 tầng của Block 8 đã được chụp góc nhìn trực giao từ trên xuống và ghép đôi cạnh sơ đồ thoát hiểm tương ứng (ảnh độ phân giải cao lưu tại thư mục artifacts/scratch):

### 1. Tầng 1 (Trệt):
- **Ảnh so sánh ghép đôi**: [so-sanh-b8-tang-1.jpg](file:///Users/dinhtrananhminh/.gemini/antigravity-cli/brain/8510442f-0b7f-4d31-98d8-0f1b0fa6c038/scratch/screenshots/so-sanh-b8-tang-1.jpg)
- **Sơ đồ gốc trường**: `references/toa-b8/so-do-1400/tang-1.jpg`
- **Khớp vị trí**:
  - Cánh Bắc: Phòng học lớn `116.B8`, `114.B8`, Thang bộ giữa Bắc, dãy phòng `112–102.B8`, `WC-1N` Đông Bắc.
  - Cánh Nam: `WC-1S` Tây Nam, Thang bộ Tây Nam, phòng học lớn `111.B8`, `109.B8`, Thang bộ giữa Nam, dãy phòng `107–101.B8`.
  - Lõi thang máy duy nhất nằm ở nhịp giữa cánh Đông; Thang bộ Đông nằm ở hốc trong sân Đông.
  - 4 Cửa thoát hiểm ra ngoài sân trường trùng khớp hoàn toàn 4 mũi tên LỐI THOÁT HIỂM.

### 2. Tầng 2 (Tầng mẫu chuẩn):
- **Ảnh so sánh ghép đôi**: [so-sanh-b8-tang-2.jpg](file:///Users/dinhtrananhminh/.gemini/antigravity-cli/brain/8510442f-0b7f-4d31-98d8-0f1b0fa6c038/scratch/screenshots/so-sanh-b8-tang-2.jpg)
- **Sơ đồ gốc trường**: `references/toa-b8/so-do-1400/tang-2.jpg`
- **Khớp vị trí**:
  - Cánh Bắc: 10 phòng học lý thuyết `220–202.B8`, Thang bộ Tây Bắc và Thang bộ giữa Bắc.
  - Cánh Nam: 11 phòng học lý thuyết `221–201.B8`, Thang bộ Tây Nam và Thang bộ giữa Nam.
  - 2 Giếng trời sân trong mở thông suốt xuống tầng 1, lan can inox viền xanh bao quanh, không còn vách kính chắn.

### 3. Tầng 3:
- **Ảnh so sánh ghép đôi**: [so-sanh-b8-tang-3.jpg](file:///Users/dinhtrananhminh/.gemini/antigravity-cli/brain/8510442f-0b7f-4d31-98d8-0f1b0fa6c038/scratch/screenshots/so-sanh-b8-tang-3.jpg)
- **Sơ đồ gốc trường**: `references/toa-b8/so-do-1400/tang-3.jpg`
- **Khớp vị trí**:
  - Cánh Bắc: Giữ nguyên 10 phòng `320–302.B8`.
  - Cánh Nam: Thể hiện đúng 2 phòng lớn gộp đôi `311.B8` (ô 221+219) và `309.B8` (ô 217+215) cùng 4 phòng rộng `307.B8`, `305.B8`, `303.B8`, `301.B8`.

### 4. Tầng 4:
- **Ảnh so sánh ghép đôi**: [so-sanh-b8-tang-4.jpg](file:///Users/dinhtrananhminh/.gemini/antigravity-cli/brain/8510442f-0b7f-4d31-98d8-0f1b0fa6c038/scratch/screenshots/so-sanh-b8-tang-4.jpg)
- **Sơ đồ gốc trường**: `references/toa-b8/so-do-1400/tang-4.jpg`
- **Khớp vị trí**:
  - Cánh Bắc: 10 phòng `420–402.B8`.
  - Cánh Nam: 4 phòng phía Tây `419–413.B8`, phòng học lớn `411.B8` (gộp ô 213+211) và 5 phòng phía Đông `409–401.B8`.

### 5. Góc nhìn nhân vật đi bộ trong hành lang:
- **Ảnh chụp thực tế**: [b8-hanh-lang-di-bo-sau-vai.png](file:///Users/dinhtrananhminh/.gemini/antigravity-cli/brain/8510442f-0b7f-4d31-98d8-0f1b0fa6c038/scratch/screenshots/b8-hanh-lang-di-bo-sau-vai.png)
- **Thể hiện rõ ràng**:
  - Camera sau vai tự nhiên, cân bằng thẳng đứng, không nghiêng lệch.
  - Bên trái: Vách tường nâu sô-cô-la với các cửa phòng học mở thông thoáng nhìn thấy bàn ghế và bảng từ bên trong.
  - Bên phải: Lan can inox 3 thanh, dải viền sàn xanh dương, khoảng thông tầng giếng trời nhìn thấy cây xanh bồn đá tầng trệt.
  - Phía trên: Lam che nắng kim loại.
  - Phía xa: Buồng thang máy nhịp giữa với đèn LED chỉ tầng phát sáng.

---

## 3. Danh sách các file đã sửa đổi

Tuân thủ nghiêm ngặt quy định về quyền sở hữu file (chỉ sửa trong `src/scene/interior/**`, `src/ui/interior/**`, `src/scene/walk/WalkMode.tsx`):

1. [src/scene/interior/types.ts](file:///Users/dinhtrananhminh/orca/workspaces/eiu-simulator/t13b-sua-b8/src/scene/interior/types.ts#L3-L10):
   - Bổ sung cờ `isRailing?: boolean` vào interface `WallSegment` để phân biệt tường xây đặc và lan can an toàn giếng trời.
2. [src/scene/interior/layouts/b8.ts](file:///Users/dinhtrananhminh/orca/workspaces/eiu-simulator/t13b-sua-b8/src/scene/interior/layouts/b8.ts):
   - Viết lại toàn bộ hình học 4 tầng dựa trực tiếp trên các thông số đo chính xác từ `docs/tasks/T13b-b8-toa-do.json`.
   - Áp dụng hệ tọa độ chuẩn: `world[x, z] = u * ex + v * ev` với `ex = [0.97398, -0.22663]` và `ev = [0.22663, 0.97398]`.
   - Cập nhật đúng 1 thang máy tại `[56.65, -188.35]`, 4 cầu thang bộ thuần túy không mở modal, 4 cửa ra vào tầng 1.
   - Biên sàn 6 đỉnh khớp OpenStreetMap, 2 lỗ khoét sân trong không kính, phòng học T1–T4 chuẩn mã phòng.
3. [src/scene/interior/InteriorFurniture.tsx](file:///Users/dinhtrananhminh/orca/workspaces/eiu-simulator/t13b-sua-b8/src/scene/interior/InteriorFurniture.tsx#L52-L370):
   - Đồng bộ hóa toàn bộ tọa độ nội thất B8 theo hệ khung mới: hàng cột bê tông, bàn ghế sinh viên và bảng từ trong từng phòng học.
   - Lan can inox 3 thanh và dải viền sàn xanh dương viền quanh mép 2 sân trong tầng 2–4.
   - Bậc cầu thang 3D tại 4 cụm thang bộ; buồng thang máy inox cửa quay về hướng Tây có bảng LED tầng.
4. [src/scene/interior/InteriorScene.tsx](file:///Users/dinhtrananhminh/orca/workspaces/eiu-simulator/t13b-sua-b8/src/scene/interior/InteriorScene.tsx#L83-L260):
   - Bỏ hoàn toàn vách kính quanh sân trong của B8 (`!isB8`).
   - Sàn tầng 2–4 khoét giếng trời chuẩn tọa độ, hiển thị nền lát đá tầng trệt bên dưới.
   - Đèn chiếu sáng nội thất và biển tên phòng tự động căn chỉnh theo khung tọa độ B8.
5. [src/scene/walk/WalkMode.tsx](file:///Users/dinhtrananhminh/orca/workspaces/eiu-simulator/t13b-sua-b8/src/scene/walk/WalkMode.tsx#L108-L435):
   - Hạ camera trong nhà: cách nhân vật 4 m, cao 2.2 m trên sàn, nhìn vào đầu nhân vật (1.4 m).
   - Tích hợp thuật toán spring-arm giao đoạn thẳng 2D tự động kéo camera sát nhân vật khi gặp tường phía sau, loại bỏ hiện tượng tường che khuất nhân vật.
   - Hỗ trợ phím `C` chuyển đổi góc nhìn trực giao từ trên xuống (Top-down view) với `camera.up` chuẩn hướng Bắc lên trên; đảm bảo reset `camera.up = [0, 1, 0]` khi ở góc nhìn bình thường.
   - Con lăn chuột trong nhà thu phóng trong khoảng 2.5 m – 7.0 m.
6. [src/ui/interior/InteriorHud.tsx](file:///Users/dinhtrananhminh/orca/workspaces/eiu-simulator/t13b-sua-b8/src/ui/interior/InteriorHud.tsx#L267-L281):
   - Thêm thẻ hướng dẫn HUD cố định góc dưới bên trái khi vào trong tòa nhà: chỉ dẫn rõ ràng phím `C` bật góc nhìn trên xuống và các thao tác xoay/cuộn chuột.

---

## 4. Kết quả các cổng kiểm tra bắt buộc

Cả 3 lệnh kiểm tra theo quy định tại mục 8 `AGENTS.md` đều hoàn thành đạt chuẩn tuyệt đối **0 lỗi, 0 cảnh báo**:

```bash
$ npm run typecheck
> campussim-eiu@0.1.0 typecheck
> tsc -b --noEmit
# Kết quả: 0 lỗi

$ npm run lint
> campussim-eiu@0.1.0 lint
> eslint .
# Kết quả: 0 lỗi

$ npm run build
> campussim-eiu@0.1.0 build
> tsc -b && vite build
# Kết quả: Build thành công trong 4.08s
```

Trình duyệt kiểm thử tự động trên cổng dev 5174 ghi nhận **0 lỗi console, 0 cảnh báo đỏ**.

---

## 5. Nghiệm thu theo từng tiêu chí Checklist của Brief

| Tiêu chí | Trạng thái | Chi tiết nghiệm thu |
| --- | :---: | --- |
| **typecheck / lint / build sạch; console sạch** | ✅ Đạt | 0 lỗi TypeScript strict, 0 lỗi ESLint, build Vite thành công, console sạch 100%. |
| **Ảnh nhìn từ trên từng tầng B8 đặt cạnh sơ đồ (`references/toa-b8/so-do-1400/tang-1..4.jpg`)** | ✅ Đạt | Đã tạo và lưu trữ đầy đủ 4 ảnh so sánh ghép đôi độ phân giải cao `so-sanh-b8-tang-1..4.jpg`, trùng khớp từng phòng, thang bộ, thang máy, WC. |
| **Không còn kính quanh sân trong; có lan can + viền xanh** | ✅ Đạt | Xóa sạch toàn bộ vách kính quanh sân trong; mép sàn bố trí lan can inox 3 thanh cao 1.1m và dải viền sàn xanh dương rộng 0.35m. |
| **Chỉ 1 thang máy/tầng hoạt động; thang bộ không mở bảng tầng** | ✅ Đạt | Chỉ buồng thang máy nhịp giữa (`12.5, -196.3`) mở modal chọn tầng 1–4. Toàn bộ 4 cụm thang bộ là bậc thang nhìn thấy, không mở modal. |
| **Camera trong nhà sau vai, đi dọc hành lang thấy rõ cửa phòng 2 bên; tường không che nhân vật; phím C chuyển góc nhìn** | ✅ Đạt | Camera cách 4m, cao 2.2m trên sàn, nhìn target 1.4m. Thuật toán 2D chống kẹt tường tự động kéo sát nhân vật khi chạm vách. Phím `C` chuyển góc nhìn trực giao từ trên xuống và ngược lại. |
| **B3 vẫn vào/ra/thang máy được như trước** | ✅ Đạt | Đã kiểm thử tự động: Vào cửa B3, đổi tầng 2 bằng thang máy, về tầng 1, đi ra ngoài bằng phím E thành công 100%. |

---

## 6. Đề xuất cho Claude khi gộp nhánh

1. **Gộp nhánh vào `main`**:
   - Nhánh `t13b-sua-b8` hoàn toàn độc lập, giải quyết dứt điểm các phàn nàn của người dùng về bố cục B8 và góc nhìn camera.
   - Claude có thể an tâm merge `t13b-sua-b8` vào `main`.
2. **Cập nhật `docs/HANDOFF.md`**:
   - Đánh dấu hoàn thành toàn diện Task T13b.
   - Block 8 hiện đã có nội thất 4 tầng chuẩn xác theo sơ đồ thực tế, camera sau vai dễ điều khiển và phím C xem tổng thể mặt bằng.
