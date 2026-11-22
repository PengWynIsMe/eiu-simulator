# S3+S4 — Cỏ, gió, lá rơi + mặt đường thật (luồng C)

- Người làm: **Claude Sonnet #2** (agent nền) · Worktree/nhánh riêng · cổng dev **5175**
- Đọc trước: `AGENTS.md`, `docs/PLAN-GIAI-DOAN-2.md` (mục 5, 6). Không cài gói npm, không tải ảnh ngoài. Không commit.

## Mục tiêu

Khuôn viên "sống": cỏ phủ các bãi xanh lay theo gió, ngọn cây đung đưa, lá rơi lác đác quanh camera. Mặt đường nhìn gần có vân nhựa, vạch kẻ, vỉa hè gạch — vẫn giữ phong cách low-poly sáng sủa hiện tại.

## Được sửa / tạo

- `src/scene/Ground.tsx`, `src/scene/Trees.tsx`, `src/scene/trees/**` (gồm `SalixAlbaTrees.tsx`), `src/scene/Environment.tsx`
- `src/scene/nature/**` (mới), `src/scene/street/**` (mới — để dành Wave 2, Wave 1 chỉ cần tạo nếu tiện)

## KHÔNG được sửa

`src/scene/Campus.tsx` (ghi dòng cần thêm vào báo cáo), `src/scene/groundLevels.ts` (chỉ import), `src/scene/walk/**`, `src/scene/interior/**`, `src/scene/zone1/**`, `src/scene/zone2/**`, `src/store/**`, `src/data/**`, `src/types/**`, `src/ui/**`, config.

## Số liệu sẵn có

- Cao độ (m, `groundLevels.ts`): GROUND 0, **GRASS 0.15**, PARKING 0.3, ROUNDABOUT_GRASS 0.3, STREET 0.45, ROUNDABOUT_ROAD 0.45, INTERNAL 0.6, POND_RIM 0.75, FOOTWAY 0.75, BRIDGE 0.8.
- Bề rộng: ROAD_WIDTH 7 (nội bộ), STREET_LANE_WIDTH 3.5 / làn, FOOTWAY_WIDTH 2.5, ROUNDABOUT_ROAD_WIDTH 9.
- Dữ liệu: `campus.layout.roads` (kind `street|internal|footway|bridge`), `campus.layout.boundary`, `campus.layout.roundabout {center, radius 79.7}`, `campus.buildings[].shape.outer` (khung nền), `campus.layout.parking`.
- Hồ nước: `src/scene/zone1/pondLayout.ts` (chỉ import để loại cỏ khỏi mặt hồ).

## Việc 1 — Gió dùng chung `nature/wind.ts`

- Một uniform `{ value: 0 }` `windTime` dùng chung, một component `<WindClock/>` duy nhất cập nhật `windTime.value += dt` trong `useFrame`.
- Hàm `applyWind(material, { strength, heightFalloff })` dùng `material.onBeforeCompile` chèn vào vertex shader: dịch `transformed.xz` theo `sin(windTime*1.7 + worldPos.x*0.15 + worldPos.z*0.11)` nhân hệ số tăng theo độ cao đỉnh (gốc đứng yên). Hỗ trợ `instanceMatrix` (dùng `instanceMatrix * vec4(transformed,1.0)` để lấy vị trí thế giới cho pha).
- **Không** cập nhật ma trận instance trên CPU mỗi khung.

## Việc 2 — `nature/Grass.tsx`

- 1 `instancedMesh`, **≤ 40 000 ngọn**, ngọn = 3 tam giác chéo (hoặc 1 quad chữ V) cao 0.25–0.45 m, rộng 0.08 m, màu gradient gốc đậm → ngọn sáng (vertex color hoặc tính trong shader theo `uv.y`), `MeshLambertMaterial` / `MeshStandardMaterial` + `applyWind`.
- Mọc trong **bán kính 70 m quanh camera**, lưới cố định ô 0.6–0.8 m có jitter theo hash vị trí (không random lại mỗi lần) → khi camera di chuyển > 8 m thì dựng lại ma trận (không mỗi khung).
- Chỉ mọc ở bãi cỏ: trong `boundary`, **ngoài** mọi đường (khoảng cách tới tâm đường > nửa bề rộng + 0.5 m), ngoài khung nền tòa nhà, ngoài bãi xe, ngoài hồ, ngoài mặt đường vòng xoay (ROUNDABOUT_ROAD). Dùng lưới tra cứu (spatial hash) để kiểm nhanh.
- y = GRASS (0.15) hoặc ROUNDABOUT_GRASS (0.3) trong đảo vòng xoay.
- Ẩn khi `useWalkStore(s => s.interior) !== null` (thực ra Campus không render khi trong nhà — chỉ cần không lỗi).
- Nhìn từ trên cao (camera tổng quan > 150 m): giảm còn 10 000 ngọn hoặc ẩn — tùy FPS.

## Việc 3 — Cây lay gió

- `Trees.tsx` (instanced) và `trees/SalixAlbaTrees.tsx`: áp `applyWind` cho **vật liệu tán lá** (không áp cho thân). Biên độ nhỏ (≤ 0.15 m ở ngọn), liễu Salix rủ biên độ lớn hơn chút (0.25 m).

## Việc 4 — `nature/FallingLeaves.tsx`

- 1 `instancedMesh` ≤ **300** lá (quad 0.08 × 0.05, 2 màu xanh-vàng), rơi trong hộp 40 × 15 × 40 m quanh camera, tốc độ 0.4–0.8 m/s, xoay + đung đưa ngang. Lá chạm y = GRASS thì sinh lại trên cao. Toàn bộ chuyển động trong vertex shader theo `windTime` + offset mỗi instance (attribute) → CPU chỉ dời tâm hộp theo camera.

## Việc 5 — Mặt đường thật (`Ground.tsx`)

Texture sinh bằng **canvas lúc chạy** (`CanvasTexture`, 1024², `RepeatWrapping`, `anisotropy = renderer.capabilities.getMaxAnisotropy()`), tạo 1 lần trong `useMemo`:

| Mặt | Texture | Ghi chú |
| --- | --- | --- |
| Đường `street` + vòng xoay | nhựa đường xám đậm có hạt (noise 2 tầng) | vạch giữa **vàng đứt** (dài 3 m, hở 3 m, rộng 0.15 m), vạch mép **trắng liền** 0.15 m cách mép 0.3 m |
| Đường `internal` | nhựa xám nhạt hơn, hạt mịn | vạch giữa trắng đứt (2 m / 4 m) |
| `footway`, quanh hồ | gạch lát (ô 0.4 × 0.2 m so le, mạch nhạt) | |
| `bridge` | gạch đỏ terracotta | |
| Vỉa hè dọc đường `internal` | **bó vỉa** cao 0.15 m, rộng 0.2 m (khối xám nhạt) dọc 2 mép | chỉ trong bán kính dựng hiện có |

- Vạch kẻ: dùng UV dọc theo đường (u = quãng đường tích lũy, v = ngang) để texture chạy đúng chiều. Nếu geometry hiện tại không có UV dọc đường → dựng lại dải đường bằng quad nối điểm (giữ đúng cao độ + bề rộng hiện tại).
- Vạch là **một phần texture**, không phải mesh chồng lên (tránh z-fighting).
- Giữ nguyên tương tác hiện có trong `Ground.tsx` (click đặt ghim góp ý...).

## Việc 6 — `Environment.tsx` (nhỏ)

- Sương xa nhẹ (`fog` 250 → 900 m, màu khớp bầu trời) để cỏ/cây xa không cắt đột ngột. Không thêm đèn.

## Tiêu chí xong

- [ ] `npm run typecheck`, `npm run lint`, `npm run build` sạch.
- [ ] Tạm gắn `<WindClock/> <Grass/> <FallingLeaves/>` vào `Campus.tsx` **chỉ trong worktree** để thử; báo cáo ghi rõ dòng import + vị trí gắn.
- [ ] Đi bộ (phím V): cỏ quanh chân, lay nhẹ; cỏ không mọc trên đường/tòa/hồ; lá rơi; cây đung đưa.
- [ ] Nhìn sát đường: thấy hạt nhựa + vạch đúng chiều, không nhấp nháy.
- [ ] FPS trước/sau ghi trong báo cáo (đo bằng đếm khung hình 5 s ở cùng góc). Mục tiêu giảm ≤ 10%.

## Mẫu báo cáo

```
File đã sửa/tạo:
Dòng cần thêm vào Campus.tsx:
Kết quả typecheck / lint / build:
Đã kiểm tra tay (cách kiểm):
FPS trước / sau:
Chưa chắc / rủi ro:
Đề xuất:
```
