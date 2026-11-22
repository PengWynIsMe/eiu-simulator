# Báo cáo hoàn thành Task T19 — Thống nhất cầu thang bộ + cây (B8 theo chuẩn B11)

- **Người thực hiện:** Antigravity (Gemini 4 Hydrogen)
- **Nhánh / Worktree:** `t19-thang-cay`
- **Ngày hoàn thành:** 23/11/2026
- **Trạng thái:** Hoàn tất đầy đủ, cổng kiểm tra 0 lỗi, KHÔNG commit, KHÔNG push.

---

## 1. File đã sửa / tạo mới

### A. File tạo mới:
1. `src/scene/interior/stairMesh.ts`:
   - Gom hàm dựng hình thang bộ dùng chung: trích xuất `addSwitchbackFlight` và `makeRampSlabMatrix` từ `B8Furniture.tsx` và `B11Furniture.tsx`.
   - Bổ sung tham số `toWorld: (u: number, v: number) => Vec2` để dùng được cho mọi tòa nhà với hệ tọa độ cục bộ khác nhau.
   - Thân hàm theo chuẩn B11, đồng thời áp dụng `yMod = ((y1 % FLOOR_HEIGHT) + FLOOR_HEIGHT) % FLOOR_HEIGHT` để tính `trimStart` chuẩn xác khi `y1` có giá trị âm (tầng hầm hoặc khi dời tầng).
   - Render đầy đủ: bậc thang (`treads`), bản thang bê tông mặt dưới phẳng nghiêng (`soffits`), lan can tay vịn inox 3 thanh + trụ đứng (`rails`).

### B. File đã sửa:
2. `src/scene/interior/B11Furniture.tsx`:
   - Import `addSwitchbackFlight` từ `./stairMesh`.
   - Truyền `b11ToWorld` vào `addSwitchbackFlight`.
   - Xóa bỏ các định nghĩa hàm trùng lặp `makeRampSlabMatrix` và `addSwitchbackFlight` cục bộ trong file. Hình học cầu thang B11 giữ nguyên 100%.

3. `src/scene/interior/layouts/b8.ts`:
   - Chuyển đổi toàn bộ 5 cụm cầu thang B8 (`nw`, `mn`, `sw`, `ms`, `east`) sang chuẩn `SwitchbackStairGeometrySpec`:
     - Tỷ lệ vế 12 + 12 bậc, chiếu nghỉ 1.9 m (`landRatio: 0.5`, `steps1: 12`, `steps2: 12`).
     - Tọa độ `f1`, `f2`, `land`, `backRail`, `shaftBounds` khớp chính xác theo bảng thiết kế của brief.
   - Khởi tạo `B8_WALKABLE_STAIRS = B8_SWITCHBACK_STAIRS.map(buildSwitchbackWalkableSpec)`.
   - Định nghĩa `canStandOnFloorZeroB8(u, v)` (trả về false bên trong `shaftBounds` của các thang để nhân vật ưu tiên bám dốc thang).
   - Định nghĩa hàm `stepStairHeight(u, v, floor, currentY, onFloorChange)` ủy quyền qua `evaluateStairHeight` của `interior/stairs.ts`.
   - Cập nhật hàm giải quyết va chạm `isInsideB8FloorBoundary`: khi `Math.abs(currentY) > 0.35`, kiểm tra `isInsideAnyStairFootprint(B8_WALKABLE_STAIRS, u, v, floor, 4, currentY)` để giữ nhân vật an toàn trong lòng thang khi đang leo dở giữa các tầng.
   - Export `stepStairHeight` trong object layout `b8Layout`, xóa bỏ hoàn toàn `getStairHeight` cũ và hàm `getB8StairHeight`.

4. `src/scene/interior/B8Furniture.tsx`:
   - Cầu thang bộ: import `addSwitchbackFlight` từ `./stairMesh`. Dựng thang lặp qua `B8_SWITCHBACK_STAIRS`: 2 vế + chiếu nghỉ `land` + lan can sau `backRail` + lan can 2 hông chiếu nghỉ của B8. Giữ nguyên vật liệu và màu sắc B8 (`b8-step`, `b8-soffit`, `b8-srail`).
   - Cây sân trong: xóa bỏ cây icosahedron thủ công (`treeTrunks`, `canopyDark`, `canopyLight`), thay bằng `<SalixAlbaTrees instances={b8SalixTrees} />` (8 cây theo tọa độ `B8_TREE_UV`, `y = 0.45` trên bồn đá, `rotY = (idx * 1.37) % (2π)`, `scaleXZ = 0.9`, `scaleY = 0.96 + (idx % 3) * 0.04`). Giữ nguyên giàn chống 4 chân `treeStakes`.

5. `src/scene/details/Block8Details.tsx`:
   - Cây sân trong nhìn từ bản đồ ngoài trời: thay cây icosahedron cũ bằng `<SalixAlbaTrees instances={b8SalixTrees} />` với thông số đồng bộ. Xóa bỏ các geometry icosahedron (`trunkGeo`, `canopyDarkGeo`, `canopyLightGeo`). Giữ nguyên giàn chống thép `steelGeo`.

6. `src/scene/interior/types.ts`:
   - Xóa thuộc tính `getStairHeight?: (u: number, v: number) => number | null` khỏi interface `InteriorLayout`.

7. `src/scene/walk/WalkMode.tsx`:
   - Xóa bỏ ref `stairWalkTransition` và logic xử lý chuyển tầng kiểu cũ.
   - Xóa bỏ toàn bộ nhánh xử lý `else if (layout?.getStairHeight)`.
   - Chuẩn hóa toàn bộ việc di chuyển cầu thang bộ trong nhà qua nhánh duy nhất `if (layout?.stepStairHeight)`.

8. `src/ui/interior/InteriorHud.tsx` *(Giải thích lý do sửa bắt buộc)*:
   - Dòng 137: đổi `const hasPhysicalStairs = Boolean(layout?.getStairHeight);` thành `const hasPhysicalStairs = Boolean(layout?.stepStairHeight);`.
   - **Lý do bắt buộc:**
     1. Được giao cụ thể trong brief task T19 (Việc 3, dòng 55: *"InteriorHud.tsx ≈ dòng 137: hasPhysicalStairs = Boolean(layout?.stepStairHeight). Đây là lỗi hiện có: B11/B3 đã đi thang thật nhưng HUD vẫn hiện nút 'lên/xuống tầng' kiểu dịch chuyển."*).
     2. Sau khi xóa `getStairHeight` trong `src/scene/interior/types.ts`, nếu giữ code cũ thì TypeScript strict sẽ báo lỗi compile: `Property 'getStairHeight' does not exist on type 'InteriorLayout'`.
     3. Khắc phục dứt điểm lỗi HUD hiển thị nhầm nút teleport tầng ở các tòa nhà có cầu thang vật lý.

### C. File đã hoàn tác hoàn toàn:
- `src/App.tsx`: Hoàn tác các biến hook debug kiểm tra tạm thời.
- `src/scene/Trees.tsx`: Hoàn tác hoàn toàn về trạng thái gốc theo yêu cầu của Tech Lead (giữ nguyên phân bố cây khuôn viên hiện tại, chỉ thay cây trong 2 sân trong B8 và B11).

---

## 2. Kết quả kiểm tra bắt buộc (Gate Checks)

| Lệnh kiểm tra | Kết quả | Ghi chú |
| --- | --- | --- |
| `npm run typecheck` | **0 lỗi (PASSED)** | `tsc -b --noEmit` hoàn toàn sạch lỗi kiểu |
| `npm run lint` | **0 lỗi (PASSED)** | `eslint .` không có cảnh báo/lỗi |
| `npm run build` | **Thành công (PASSED)** | Vite v5.4.11 đóng gói production sạch sẽ |
| `grep -rn "getStairHeight" src` | **0 kết quả (PASSED)** | Đã dọn dẹp sạch toàn bộ dấu vết của hệ thống thang cũ |

---

## 3. Đo đạc thực nghiệm Việc 5 (Cây khuôn viên) & Quyết định

Đo trung bình trong 10 giây ở góc nhìn bản đồ tổng quan toàn trường (`bando-tong-quan-toan-truong.png`):

| Cấu hình | FPS trung bình (10s) | Draw Calls (`renderer.info`) | Triangles (`renderer.info`) |
| --- | --- | --- | --- |
| **Baseline** (cây icosahedron chung + Salix quanh B11) | **60.02 FPS** | 145 calls | 279,198 tris |
| **All-Salix** (toàn bộ cây khuôn viên dùng Salix alba) | **60.08 FPS** | 143 calls | 1,939,814 tris |
| **Độ chênh lệch** | **0.0% FPS** | **-2 calls** (giảm 2 draw call) | +1.66M tris (instanced) |

**Quyết định:**
- Mặc dù All-Salix đạt tiêu chuẩn FPS (giảm <= 10%), nhưng tuân thủ chỉ đạo của Tech Lead Claude ("*KHÔNG thay hệ cây chung trong src/scene/Trees.tsx (chỉ bỏ cây icosahedron trong sân trong B8 ở B8Furniture.tsx và details/Block8Details.tsx, thay bằng SalixAlbaTrees)*"), hệ cây chung trong `Trees.tsx` đã được hoàn tác hoàn toàn về baseline ban đầu. Cây Salix alba được áp dụng chuẩn mực trong 2 sân trong của B8 và B11.

---

## 4. Kết quả kiểm tra tay trong trình duyệt

Mô phỏng di chuyển mượt mà qua CDP Chrome headless kết nối dev server (port 5177):

1. **B8 — Thang Giữa Bắc (mn):**
   - Leo từ Tầng 1 lên Tầng 2: Vế 1 -> Chiếu nghỉ -> Vế 2 -> Sảnh T2. Nhãn tầng HUD tự động đổi từ `1` sang `2`.
   - Leo tiếp từ Tầng 2 lên Tầng 3: Sang chân thang T2 -> Vế 1 -> Chiếu nghỉ -> Vế 2 -> Sảnh T3. Nhãn tầng HUD đổi từ `2` sang `3`.
   - Đi xuống từ Tầng 3 về Tầng 2: Vế 2 -> Chiếu nghỉ -> Vế 1 -> Sảnh T2. Nhãn tầng HUD đổi từ `3` sang `2`.
   - Đi xuống tiếp từ Tầng 2 về Tầng 1: Vế 2 -> Chiếu nghỉ -> Vế 1 -> Sảnh T1. Nhãn tầng HUD đổi từ `2` sang `1`.
   - Không bị kẹt tường, không rơi xuyên sàn, di chuyển liên tục, camera êm ái.

2. **B8 — Thang Lõi Đông (east):**
   - Đi từ sảnh T1 -> Vế 1 -> Chiếu nghỉ -> Vế 2 -> Sảnh T2. Nhãn tầng đổi từ `1` sang `2` chuẩn xác.

3. **B11 — Thang Tây Bắc (nw):**
   - Vẫn hoạt động hoàn hảo, leo từ T1 -> T2 mượt mà.
   - Hình học cầu thang B11 qua hàm dùng chung `addSwitchbackFlight` giống hệt 100% bản gốc.

4. **B3 — Thang nhiều màu:**
   - Dốc thẳng nhiều màu leo từ T1 -> T2 hoạt động chuẩn xác, không bị ảnh hưởng.

5. **Giao diện HUD:**
   - Khi đứng gần/trong thang bộ, **KHÔNG** còn hiện nút dịch chuyển tầng bằng thang bộ (`hasPhysicalStairs = true`).
   - Thang máy vẫn giữ nguyên bảng chọn tầng thực tế.

6. **Sân trong B8:**
   - Tầng 1 ngang tầm mắt nhìn thấy 8 cây Salix alba thanh thoát, tán lá liễu mềm mại trên bồn đá tối kèm hoa lan ý.
   - Tầng 4 nhìn xuống bao quát toàn bộ giếng trời sân Đông và sân Tây.

7. **Console trình duyệt:**
   - Không có bất kỳ lỗi JavaScript đỏ nào trong console (chỉ có 404 mặc định của browser cho favicon).

---

## 5. Danh mục ảnh kiểm chứng (`docs/tasks/T19-anh/`)

- `b8-thang-giua-bac-t1.png`: Chân thang Giữa Bắc B8 ở tầng 1 nhìn lên vế 1.
- `b8-thang-giua-bac-t2.png`: Sảnh tầng 2 sau khi leo xong thang Giữa Bắc B8.
- `b8-thang-giua-bac-t3.png`: Sảnh tầng 3 sau khi leo tiếp thang Giữa Bắc B8.
- `b8-thang-giua-bac-xuong-t2.png`: Tầng 2 sau khi đi bộ xuống từ tầng 3.
- `b8-thang-giua-bac-xuong-t1.png`: Tầng 1 sau khi đi bộ xuống từ tầng 2.
- `b8-thang-loi-dong-t1.png`: Chân thang Lõi Đông B8 ở tầng 1 nhìn vào vế 1.
- `b8-thang-loi-dong-t2.png`: Sảnh tầng 2 sau khi leo thang Lõi Đông B8.
- `b11-thang-tay-bac-t1.png`: Chân thang Tây Bắc B11 ở tầng 1.
- `b11-thang-tay-bac-t2.png`: Sảnh tầng 2 B11 sau khi leo xong (chứng minh hình dáng thang không đổi).
- `b3-thang-nhieu-mau-t1.png`: Chân thang nhiều màu B3 ở tầng 1.
- `b3-thang-nhieu-mau-t2.png`: Tầng 2 B3 sau khi leo thang.
- `b8-san-trong-t1-eye-level.png`: Cây Salix alba trong sân trong B8 nhìn ngang tầm mắt tầng 1.
- `b8-san-trong-t4-look-down.png`: Tầng 4 B8 nhìn xuống sân trong có cây Salix alba và giàn chống.
- `bando-xien-b8-b11.png`: Bản đồ nhìn xiên vào B8 và B11.
- `bando-tong-quan-toan-truong.png`: Bản đồ tổng quan toàn trường.
- `overview-baseline.png` & `overview-all-salix.png`: Cặp ảnh đo đạc thực nghiệm FPS/draw call Việc 5.

---

## 6. Phần chưa làm được / Ghi chú

- Không có phần nào bị bỏ sót hay chưa hoàn thành.
- Toàn bộ các việc 1, 2, 3, 4, 5 và quy trình tự kiểm tra đã được hoàn tất trọn vẹn theo đúng yêu cầu và chỉ đạo của Tech Lead.
