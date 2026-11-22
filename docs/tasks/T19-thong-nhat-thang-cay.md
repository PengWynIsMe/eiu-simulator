# T19 — Thống nhất cầu thang bộ + cây (B8 theo chuẩn B11)

Người giao: Claude · Người làm: Antigravity (Gemini 4 Hydrogen) · Nhánh: `main` (không commit, không push)

Đọc `AGENTS.md`. Không cài gói. **Không sửa** `src/store`, `src/data`, `src/types`, `package.json`, `kit/TwinWingBlock.tsx`,
`trees/SalixAlbaTrees.tsx`, `interior/stairs.ts` (chỉ được *dùng* 2 file này).

## Vì sao

Commit `cfef85f` (đồng nghiệp) thêm hệ cầu thang chung `interior/stairs.ts` (B11, B3) và cây `SalixAlbaTrees` (B11).
B8 vẫn dùng hệ riêng (`getStairHeight` + nhánh riêng trong `WalkMode`, cây icosahedron). Hai hệ song song → gom về **một**:

| Phần | Giữ (chuẩn) | Bỏ |
| --- | --- | --- |
| Logic đi thang | `stairs.ts`: `buildSwitchbackWalkableSpec`, `evaluateStairHeight`, `isInsideAnyStairFootprint`, `layout.stepStairHeight` | `getB8StairHeight`, `layout.getStairHeight`, nhánh `getStairHeight` + `stairWalkTransition` trong `WalkMode.tsx` |
| Hình thang | 1 hàm `addSwitchbackFlight` dùng chung | 2 bản chép trong `B8Furniture.tsx` và `B11Furniture.tsx` |
| Cây sân trong | `SalixAlbaTrees` (instanced, 2 draw call) | cây icosahedron B8 trong `B8Furniture.tsx` + `details/Block8Details.tsx` |

B3 (cầu thang nhiều màu thẳng) **giữ nguyên hình**, chỉ hưởng lợi từ các sửa chung.

---

## Việc 1 — Hàm vẽ vế thang dùng chung

1. Tạo `src/scene/interior/stairMesh.ts`: chuyển `addSwitchbackFlight` (bản có tham số `toWorld`, đang ở `B8Furniture.tsx` ≈ dòng 90) + `makeRampSlabMatrix` sang đây, export ra.
   Lấy phần thân theo bản B11 (`B11Furniture.tsx` ≈ dòng 74), sửa `trimStart` dùng `yMod` như bản B8 (đúng với `y1` âm).
2. `B8Furniture.tsx` và `B11Furniture.tsx` import từ `stairMesh.ts`, xóa bản chép. B11 truyền `b11ToWorld`. **Hình B11 không được đổi**: chụp B11 trước/sau ở cùng góc để so.

## Việc 2 — B8 chuyển sang `stairs.ts`

Trong `layouts/b8.ts` thay `B8_STAIRS`/`getB8StairHeight` bằng mảng `B8_SWITCHBACK_STAIRS: SwitchbackStairGeometrySpec[]`. Claude đã quy đổi đúng từ số hiện tại
(vế 12 + 12 bậc, chiếu nghỉ 1.9 m → `landRatio: 0.5`, `steps1: 12`, `steps2: 12`):

| id | label | f1 | f2 | width | land [cu, cv, sizeU, sizeV] | backRail | shaftBounds [minU, maxU, minV, maxV] |
| --- | --- | --- | --- | --- | --- | --- | --- |
| nw | Thang bộ Tây Bắc | [12.025, -200.0, 12.025, -203.36] | [10.075, -203.36, 10.075, -200.0] | 1.75 | [11.05, -204.235, 3.7, 1.75] | [9.25, -205.06, 12.85, -205.06] | [9.2, 12.9, -205.11, -200.0] |
| mn | Thang bộ giữa (Bắc) | [53.0, -200.0, 53.0, -203.36] | [50.8, -203.36, 50.8, -200.0] | 2.0 | [51.9, -204.36, 4.2, 2.0] | [49.85, -205.31, 53.95, -205.31] | [49.8, 54.0, -205.36, -200.0] |
| sw | Thang bộ Tây Nam | [12.55, -177.7, 12.55, -174.34] | [10.65, -174.34, 10.65, -177.7] | 1.7 | [11.6, -173.49, 3.6, 1.7] | [9.85, -172.69, 13.35, -172.69] | [9.8, 13.4, -177.7, -172.64] |
| ms | Thang bộ giữa (Nam) | [52.775, -177.7, 52.775, -174.34] | [50.925, -174.34, 50.925, -177.7] | 1.65 | [51.85, -173.515, 3.5, 1.65] | [50.15, -172.74, 53.55, -172.74] | [50.1, 53.6, -177.7, -172.69] |
| east | Lõi Đông | [114.5, -186.175, 111.14, -186.175] | [111.14, -188.925, 114.5, -188.925] | 2.55 | [109.865, -187.55, 2.55, 5.3] | [108.64, -190.15, 108.64, -184.95] | [108.59, 114.5, -190.2, -184.9] |

Mẫu làm theo: `layouts/b11.ts`:
- `B11_WALKABLE_STAIRS = ...map(buildSwitchbackWalkableSpec)` (≈ dòng 227) → `B8_WALKABLE_STAIRS`.
- `stepStairHeight` (≈ dòng 1015), số tầng B8 = 4; `canStandOnFloorZero` = **không** nằm trong `shaftBounds` của thang nào.
- `resolvePosition(..., currentY)`: khi `|currentY| > 0.35` mà không ở trên thang (`isInsideAnyStairFootprint`) thì chặn, giống B11 ≈ dòng 910–940.
- Export `stepStairHeight` trong object layout B8, bỏ `getStairHeight`.

`B8Furniture.tsx`: vẽ thang bằng vòng lặp trên `B8_SWITCHBACK_STAIRS` như B11 (≈ dòng 448–495): 2 vế + chiếu nghỉ `land` + lan can `backRail`.
Giữ màu/vật liệu B8 hiện tại (`b8-step`, `b8-soffit`, `b8-srail`) và giữ lan can 2 hông chiếu nghỉ của B8.

## Việc 3 — Dọn phần cũ

- `types.ts`: xóa `getStairHeight`.
- `WalkMode.tsx`: xóa nhánh `else if (layout?.getStairHeight)` và ref `stairWalkTransition` (cùng chỗ dùng nó ≈ dòng 259). Nhánh `stepStairHeight` giữ nguyên.
- `InteriorHud.tsx` ≈ dòng 137: `hasPhysicalStairs = Boolean(layout?.stepStairHeight)`. **Đây là lỗi hiện có**: B11/B3 đã đi thang thật nhưng HUD vẫn hiện nút "lên/xuống tầng" kiểu dịch chuyển.

## Việc 4 — Cây Salix alba cho sân trong B8

Thay cây icosahedron (thân 13 m + 3 khối tán + giàn chống giữ nguyên) bằng `<SalixAlbaTrees instances={...} />`, cùng thông số như B11:
`y = mặt nền đá sân (pavingTop / GROUND_TOP + bồn)`, `rotY = (idx * 1.37) % (2π)`, `scaleXZ = 0.9`, `scaleY = 0.96 + (idx % 3) * 0.04`. Vị trí: `B8_TREE_UV` (8 cây, không đổi).
- `B8Furniture.tsx` (trong nhà, theo `groundY` từng tầng như B11 dùng `groundOff`): xóa `treeTrunks`, `canopyDark`, `canopyLight`; **giữ** `treeStakes`.
- `details/Block8Details.tsx` (bản đồ): xóa `trunkGeo`, `canopyDarkGeo`, `canopyLightGeo`; giữ giàn chống.

## Việc 5 — Cây toàn khuôn viên: đo rồi chọn một kiểu

`Trees.tsx` đang để Salix **chỉ quanh B11**, còn lại là cây icosahedron → nhìn rời rạc. Thử cho **toàn bộ** cây khuôn viên dùng Salix
(bỏ `isNearBlock11Precinct`, giữ PRNG/vị trí), `scaleXZ`/`scaleY` như đồng nghiệp đang nhân (`* 0.82`, `* 0.84`).
Đo bằng `renderer.info` + FPS (trung bình 10 s, bản đồ tổng quan, nhìn xiên toàn trường), so với bản hiện tại:
- FPS giảm **≤ 10 %** → giữ Salix toàn khuôn viên.
- Giảm > 10 % → trả lại icosahedron cho **toàn bộ** khuôn viên (bỏ cả mảng Salix quanh B11), Salix chỉ còn trong 2 sân trong B8 + B11.
Ghi số đo vào báo cáo.

---

## Tự kiểm tra

1. `npm run typecheck`, `npm run lint`, `npm run build` sạch. `grep -rn getStairHeight src` không còn kết quả.
2. Trình duyệt, chụp vào `docs/tasks/T19-anh/`:
   - B8: leo thang **Giữa Bắc** 1 → 2 → 3 → 2 → 1 và **Lõi Đông** 1 → 2. Không kẹt, không rơi xuyên sàn, nhãn tầng trên HUD đổi đúng, **không** hiện nút dịch chuyển tầng.
   - B11: leo thang Tây Bắc 1 → 2 (vẫn chạy). Ảnh trước/sau cùng góc để chứng minh hình thang B11 không đổi.
   - B3: leo thang nhiều màu 1 → 2.
   - Sân trong B8: tầng 1 ngang tầm mắt, tầng 4 nhìn xuống. Bản đồ nhìn xiên vào B8 và B11 (cây cùng một kiểu).
   - Bản đồ tổng quan toàn trường (sau Việc 5).
3. Console không lỗi đỏ.

## Báo cáo

`docs/tasks/T19-bao-cao.md`: file đã sửa, kết quả lệnh, số đo FPS/draw call ở Việc 5 và lựa chọn, ảnh, phần chưa làm được và lý do.
