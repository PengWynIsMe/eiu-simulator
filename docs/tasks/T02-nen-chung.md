# T02 — Nền chung của khuôn viên

- Người làm: **Gemini (Antigravity)**
- Nhánh: `t02-nen-chung`
- Phụ thuộc: T01 (xong)

## Mục tiêu

Thay "bản xem bố cục tạm" bằng nền khuôn viên thật: mặt đất, đường có bề rộng, vòng xoay, mọi tòa nhà hiện
thành khối đúng khung nền với mái chìa và màu tường EIU, có cây, có trời, camera xoay/zoom mượt trên desktop và điện thoại.
Chưa cần chi tiết cửa sổ/hồ nước/cầu (để T03).

## Đọc trước

1. `AGENTS.md` — đặc biệt mục 3 **Hệ tọa độ** và mục 4 hợp đồng data/store.
2. `src/data/index.ts`, `src/types/index.ts` — dữ liệu dùng được.
3. `src/scene/Campus.tsx` hiện tại — bản tạm, có sẵn cách đùn khung nền (`toShapePoints` + `ExtrudeGeometry`, xoay -90° quanh X). **Giữ cách đổi tọa độ này.**
4. Ảnh tham khảo: `references/00-tong-quan/ve-tinh-*.png`, `references/tour-360/_tong-hop-*.jpg`, `references/handbook-anh/`.

## Được sửa / tạo

- `src/scene/Campus.tsx` (viết lại, chỉ còn vai trò ghép các phần)
- `src/scene/Ground.tsx`, `src/scene/Building.tsx`, `src/scene/Trees.tsx`, `src/scene/CameraRig.tsx`, `src/scene/Environment.tsx` (ánh sáng + trời)
- `src/App.tsx` (chỉnh `<Canvas>` nếu cần), `src/ui/TopBar.tsx`, `src/ui/text.ts`

## KHÔNG được sửa

`src/data/**`, `src/types/**`, `src/store/**`, `scripts/**`, `package.json`, config gốc. Không cài thư viện.

## Dùng được từ hợp đồng

- `campus.buildings` (mỗi tòa có `shape.outer`, `shape.holes`, `center`, `height`, `floors`, `color`, `zone`, `kind`, `detailLevel`)
- `campus.layout.roads` (`kind`: `street` | `internal` | `footway` | `bridge`, `lanes`, `points`), `layout.boundary`, `layout.roundabout`, `layout.parking`
- `FLOOR_HEIGHT`

## Yêu cầu chi tiết

1. **Ground.tsx**
   - Mặt đất cỏ lớn (~1000 m), màu cỏ nhạt; bên trong `layout.boundary` một tông cỏ khác một chút.
   - Đường thành **dải có bề rộng** (không phải `Line`): `street` = 7 m × số làn (mặc định 2 làn), `internal` = 7 m, `footway` = 2.5 m màu lát gạch. Bỏ qua `bridge` (T03 dựng).
     Gợi ý: mỗi đoạn [p0, p1] là một hộp mỏng xoay theo hướng đoạn, hoặc tự dựng `BufferGeometry` dải. Gộp vào ít mesh nhất có thể.
   - Vòng xoay: vành đường rộng 9 m quanh `layout.roundabout.radius`, bên trong là bãi cỏ tròn.
   - Bó vỉa vạch vàng đen là chi tiết đẹp nhưng **không bắt buộc**.
2. **Building.tsx** — một tòa từ `Building`:
   - Đùn khung nền (có lỗ sân trong cho B8–B11) cao `height`, màu `color`, `flatShading`.
   - **Mái chìa**: một tấm mỏng (~0.4 m) đặt trên đỉnh, rộng hơn khung nền ~1.2 m mỗi phía, màu xám đậm. Cách đơn giản: đùn cùng shape nhưng phóng to nhẹ quanh `center`; chấp nhận sai lệch nhỏ với khung nền lõm.
   - Vạch ngang mỗi tầng (đường chỉ tầng) là điểm cộng, không bắt buộc.
   - `kind === 'other' | 'kiosk'` → khối thấp đơn giản, không mái chìa.
   - `kind === 'parking'` → mái tôn mỏng trên cột (không tường), cao ~3 m.
   - `kind === 'gate'` → khối thấp tạm (cổng chi tiết làm ở T03).
   - **Chưa** gắn hover/click (T04).
3. **Trees.tsx** — cây low-poly (thân trụ + tán cầu/icosahedron), **bắt buộc instancing** (`<Instances>` của drei hoặc `instancedMesh`).
   Rải ~300–600 cây: dọc hai bên đường nội bộ và quanh ranh giới, tránh nằm đè tòa nhà/đường (kiểm tra khoảng cách tới đoạn đường và điểm trong khung nền). Vị trí sinh **một lần** bằng hạt giống cố định (không `Math.random()` mỗi render).
4. **Environment.tsx** — `hemisphereLight` + `directionalLight` chiếu xiên kiểu nắng nhiệt đới; màu trời xanh nhạt (có thể dùng `<Sky>` của drei). Bóng đổ: nếu bật thì chỉ một đèn, shadow map ≤ 2048, và tắt được dễ dàng.
5. **CameraRig.tsx** — `<CameraControls makeDefault>` của drei:
   - Góc nhìn ban đầu: từ phía cổng chính (phía +X) nhìn vào quảng trường, trên cao ~250 m. Đặt hằng số `OVERVIEW` để T05 dùng lại.
   - Giới hạn: `minDistance` 30, `maxDistance` 700, `maxPolarAngle` ≈ 1.35 (không chui xuống đất), giới hạn vùng di chuyển quanh khuôn viên (`setBoundary` hoặc tương đương).
   - Chạm kéo / pinch zoom trên điện thoại hoạt động.
6. **Campus.tsx** chỉ ghép: `<Environment/> <Ground/> <Trees/> {buildings.map → <Building/>} <CameraRig/>`.
7. `TopBar`: bỏ nhãn "Bản xem bố cục tạm" (giữ dòng ghi công OpenStreetMap — **bắt buộc theo giấy phép**).

## Bẫy cần tránh

- **Trục Z**: -Z là Bắc. Footprint `[x, z]` → shape `[x, -z]` rồi xoay `rotation-x={-Math.PI/2}`. Sai chỗ này là cả trường bị lật gương.
- Không tạo `new Vector3`/mảng trong `useFrame`. Hình học tạo trong `useMemo`.
- Đừng tự dời/xoay tòa nhà "cho đẹp" — khung nền OSM là sự thật.
- Đường phố bao ngoài (Lê Duẩn, Nam Kỳ Khởi Nghĩa, Hữu Nghị) kéo dài rất xa: cắt bớt phần ngoài ~600 m tính từ gốc.

## Tiêu chí xong

- [ ] `npm run typecheck`, `npm run lint`, `npm run build` đều sạch
- [ ] Console trình duyệt không lỗi/warning đỏ
- [ ] Nhìn từ trên cao khớp ảnh vệ tinh `references/00-tong-quan/ve-tinh-core.png` (B3 hình chữ L phía Nam trục cổng, Block 4–5 phía Bắc trục, B8–B11 chữ H phía Bắc vòng xoay)
- [ ] Desktop: kéo xoay, cuộn zoom, không chui xuống đất, không bay quá xa
- [ ] Chế độ thiết bị di động (DevTools): chạm kéo + pinch zoom được; mượt
- [ ] Cây dùng instancing (1 draw call cho thân, 1 cho tán)

## Mẫu báo cáo (điền khi xong)

```
File đã sửa/tạo:
Kết quả typecheck / lint / build:
Đã kiểm tra tay:
Ảnh chụp màn hình (đường dẫn):
Chưa chắc / rủi ro:
Đề xuất (nếu cần đổi hợp đồng hoặc thêm thư viện):
```
