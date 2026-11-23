# Style 3D CampusSim EIU

Đối chiếu mã tại `24483be`. Dựng low-poly theo kích thước thật, ưu tiên các mảng phẳng, bóng dáng nhận diện và nhịp kiến trúc. Ngoại cảnh dùng khung nền OSM, thân nhà đùn, diềm mái, lam và dải cửa kính. Nội thất B3 sáng kiểu terrazzo, B8/B11 dùng tường nâu, dải bê tông kem và lan can inox. Phòng 406 đặc tả thiết bị bằng vài khối đơn giản cho mỗi món.

## Bảng màu và vật liệu

Các tên bên dưới là tên hiện có trong code. Giá trị ghi «trực tiếp» nằm tại thuộc tính JSX hoặc lệnh tạo texture. Cột vật liệu ghi roughness rồi metalness của `MeshStandardMaterial`. Dấu — là mặc định của Three.js hoặc vật liệu khác.

| Hạng mục | Giá trị và tên trong mã | Roughness / metalness |
| --- | --- | --- |
| Tường ngoài | `building.color` từ `campus.json`, mái `#8d9196`, đà `#e5e7eb`, lam `#d1d5db` trực tiếp trong `BlockFacade` | Đà 0.6 / 0, lam 0.5 / 0 |
| Tường trong | `wallColor` B3 `#f8fafc`, B8/B11 `#42322c`, `baseboardColor` B3 `#334155`, B8/B11 `#261e1b` | Tường 0.85 / 0, chân tường 0.5 / 0 |
| Sàn tầng | `floorColor` B3 `#f1f5f9`, B8/B11 `#cbd5e1`, lớp phủ hành lang B8 `b8-corr` dùng `#a3a8ad` | Sàn 0.45 / 0.05, hành lang 0.5 / 0.08 |
| Bê tông hồ và cầu | Thành hồ `#cbd5e1`, mặt cầu `#e2e8f0` trực tiếp trong `Pond` / `Bridges` | 0.6 / 0 |
| Gỗ và ghế | Bàn B3/B8 `#d4a373`, ghế B8 `#334155`, bàn 406 `#c8a67a`, ghế 406 `#2f3b4f` | Gỗ 0.6 / 0–0.08, ghế 406 0.7 / 0 |
| Thép và inox | Khung cầu `#1e293b`, khung nhà xe `#334155`, inox `#cbd5e1` ở thang máy B3/B11, `b8-rail` `#d8dde3` | Khung cầu 0.7 / 0, inox thang máy 0.2–0.22 / 0.85, lan can B8 0.3 / 0.35 |
| Kính | Mặt đứng `BlockFacade` `#1e293b`, `glassWallsGeo` trong nhà `#bae6fd` | Ngoài 0.2 / 0.4, trong 0.1 / 0.2 |
| Mặt đất, cỏ | `Ground` `#b2c9a6`, `#9ec08d`, cỏ vòng xoay `#91b681`, `base` / `tip` trong `Grass` `#4a7536` → `#a8d066`, `TREE_COLORS` trong `Trees` gồm `#38632a`, `#447532`, `#50853b`, `#335b24`, `#487d37` | Nền 0.9 / 0, tán 0.8 / 0 |
| Đường, lối bộ, bãi | Canvas `base` đường phố `#5d6168`, nội bộ `#7d8188`, vòng xoay `#62666d`, `footMap` `#cfc3b4`, bãi `#b9bcc0` trực tiếp trong `Ground` | Đường 0.85 / 0, bãi 0.9 / 0 |
| Nước | `Pond` mặt `#06b6d4`, đáy `#0284c7` | Mặt 0.12 / 0.15, đáy 0.7 / 0 |
| Màu nhận diện và điểm nhấn | Đỏ `#dc2626` cờ và PCCC, navy biển EIU `#0b3d6e`, xanh EIU trong brief T09 `#1d4f91`, xanh mái cầu `#1d70b8`, xanh BBI `#1d4ed8`, diềm xanh B8 `#2f7fc1` (`b8-blue`) | Mái cầu 0.45 / 0.25, biển dùng texture |

- Tái sử dụng geometry và vật liệu theo nhóm. Các batch hộp B8/B11 dùng `sharedGeos.box`, mặc định roughness 0.65, metalness 0.08. Hộp cùng vật liệu có thể dùng màu theo instance. Mảng tường, sàn và vật thể khác hình gộp theo vật liệu như `safeMerge` trong kit.
- Kính mặt đứng là mảng xanh đậm bóng đục. Kính nội thất là tấm mỏng `transparent`, opacity 0.35, dày 0.04 m ở B8 và 0.06 m ở B3/B11. Tách khung và ô kính. Vật liệu trong suốt của `ProjectorScreen` dùng `depthWrite={false}`. Áp dụng mẫu đó nếu các tấm kính mới cần nhìn xuyên qua nhiều mặt và kiểm tra thứ tự vẽ từ hai góc.
- Ngoài trời dùng hemisphere trắng / `#8fa382` cường độ 1 và một directional 1.6. Trong nhà dùng ambient `#f8fafc` 0.8, directional ấm `#fffbeb` 0.9 (B3) hoặc 1.05 (B8/B11), thêm hemisphere 0.85 cho B8/B11. `InteriorScene` dùng vài point light diện rộng cho sảnh, sân trong và hành lang, cường độ thường 0.55–0.75. Phòng 406 dùng ánh sáng tầng, tấm đèn `MeshBasicMaterial` `#fffdf0` và màn hình dùng texture code, cả hai `toneMapped={false}`.
- Đèn trang trí dùng emissive theo batch như chụp đèn S8 `#fff1c4` × 0.35 hoặc đèn ấm B8 `#fef08a` × 0.65. LED thang máy dùng emissive 1.2 và một point light tầm ngắn. Giữ shadow realtime theo hệ hiện có, ưu tiên không đổ bóng cho chi tiết lặp nhỏ.

## Ba mức chi tiết và ngân sách

| Mức | Hình học và phạm vi | Draw call và mốc tam giác |
| --- | --- | --- |
| Tham quan | Giữ khung nền, mái, dải cửa và tán cây đọc được từ xa. Cây chung dùng trụ 6 cạnh (24 tam giác) + icosahedron detail 1 (80 tam giác), 2 batch. | T03 giới hạn thêm < 60 call cho khu 1, báo cáo từng đo 66 call cả cảnh. T19 đo mốc 145 call / 279.198 tam giác ở góc tổng quan baseline. |
| Đi bộ và tương tác | Thêm tay vịn, lỗ cửa, vật dụng và dấu nhận diện nhìn gần. Giữ hình cơ bản ít cạnh, ví dụ hộp 12 tam giác, trụ kín 8 cạnh 32 tam giác. NPC dừng mixer từ 60 m, ẩn từ 120 m. | S8 thêm ≤ 8 call (thực tế 6). T12 đặt < 80 call/tầng B3, T13 đặt < 100 call/tầng B8. |
| Cảnh điểm nhấn | Dành chi tiết cho phần tương tác, ví dụ 406 dùng bàn ba hộp (36 tam giác/bàn), ghế và máy tính ghép khối, màn hình vẽ canvas. Giới hạn 18 sinh viên + 1 thầy. | ≤ 15 call cho 406 theo kế hoạch, 8 batch đồ và khoảng 12–14 call theo L346. |

Repo hiện có giới hạn draw call theo hạng mục và mốc tam giác đo được, chưa chốt trần tam giác tổng quát cho mỗi mức. Dùng các mốc trên khi so trước/sau cùng góc, ghi `renderer.info.render.triangles`, `renderer.info.render.calls` và FPS, mục tiêu laptop ≥ 50 FPS. Bản thử T19 với Salix toàn trường tăng lên 1.939.814 tam giác dù số call giảm, vì vậy chỉ dùng Salix ở các sân đã dựng. Instancing giảm call, số tam giác vẫn nhân theo số instance. Mảng tĩnh tạo một lần khi khởi tạo, không tạo object hoặc gọi React setState trong `useFrame`. Giữ `dpr={[1, 2]}`.

## Tỷ lệ, mặt đất và va chạm

- 1 đơn vị = 1 m, +X Đông, −Z Bắc, Y lên. Dùng `FLOOR_HEIGHT = 3.8` m và footprint OSM làm chuẩn. Nhân vật Kenney dùng GLB 0.671 × scale 2 ≈ 1.34 m, gốc tại chân, khởi tạo clip `idle`. Camera và bán kính va chạm là thông số riêng.
- Cửa phòng B8 ví dụ rộng 1 m theo `getFloorDoors`, chừa đúng khoảng trong dữ liệu tường. Vách kính B8 cao 1.5 m, tâm tại y = 1.7 m. Bàn SV 406 rộng 1 × sâu 0.60 × cao 0.75 m, ghế ngồi y = 0.45 m, mặt ghế 0.45 × 0.45 m. Dùng các kích thước này làm mẫu khi thiếu bản đo.
- Các cao độ trong `groundLevels.ts` gồm `GROUND` 0, `GRASS` 0.15, `PARKING` / `ROUNDABOUT_GRASS` 0.30, `STREET` / `ROUNDABOUT_ROAD` 0.45, `INTERNAL` 0.60, `FOOTWAY` / `POND_RIM` 0.75, `BRIDGE` 0.80 m. Dùng khoảng tách 0.15 m cho các lớp đất chồng nhau, giữ `polygonOffset` âm theo thứ tự lớp của `Ground`. Với lớp phủ mỏng nội thất áp dụng offset như B8 T18 (factor −1, units −2), tránh đặt hai mặt đồng phẳng.
- Ngoài trời lấy y từ `getGroundHeight`, `resolvePosition` chặn ranh giới, footprint tòa và lòng hồ, chừa lối cầu. Trong nhà lấy va chạm từ layout tầng (đoạn tường, cửa hở, footprint đồ lớn), dùng bề mặt bậc và chiếu nghỉ của `stairs.ts` cho độ cao. Phần đồ họa đặt thêm cần dùng cùng kích thước với hình va chạm khi nó được đưa vào luồng đi bộ.

## Chữ, biển và HUD

- Mẫu biển EIU S8 là tấm 3 × 1.2 m trên hai trụ, hai mặt đọc được. `createSignTexture` vẽ 768 × 307, nền `#0b3d6e`, khung và chữ `#f2f6fa`, Arial → Helvetica → sans-serif, tiêu đề đậm 150 px và dòng phụ 600 / 34 px. Dùng màu sRGB cho canvas texture. Mã phòng/đèn thang dùng chữ nhỏ theo mặt phẳng, như `Text` ở `B8Furniture`.
- HUD dùng chữ Việt trong `ui/text.ts`, font sans của Tailwind, nền slate hoặc trắng mờ, góc `rounded-lg`, chữ cần tương phản khi phủ cảnh. Với biển mới có hai tên, giữ nội dung ở dạng `{ vi, en }` để dàn hai dòng. Biển EIU hiện dùng tên tiếng Anh, mã phòng và tên sách giữ nguyên theo vật thật.

## Chênh lệch đang có trong repo

- Màu nhận diện hiện nằm ở nhiều file. xanh lịch sử T09, xanh biển S8, xanh mái cầu và xanh BBI nằm ở các nơi khác nhau. Đỏ cờ và PCCC trùng hex tình cờ. Chưa có bảng hằng toàn cục hay schema song ngữ cho biển.
- B3/B8/B11 lặp định nghĩa vật liệu, kính nội thất có độ dày khác nhau và chưa đặt `depthWrite={false}` trong `InteriorScene`. Màu kính ngoài B6 (`#1e3a4c`, 0.18 / 0.6) khác kit B3/B4/B5. Tấm đèn 406 dùng basic, đèn B8/B11 dùng emissive.
- `characters.json` ghi radius 0.35 m, `WalkMode` dùng `PLAYER_RADIUS = 0.4`. `pondLayout`, `groundHeight`, `WalkMode` và `Bridges` còn lặp dữ liệu hồ hoặc cầu. `BRIDGE` 0.80 m khớp tâm sàn dày 0.12 m, mặt thực tế ở 0.86 m.
- Render nội thất vẫn thêm kết cấu tầng khác làm phông ở B8/B11 qua giếng trời. Các số draw call T12/T13 mô tả phiên bản tại thời điểm báo cáo.

Đối chiếu với [AGENTS](../AGENTS.md), [Giai đoạn 2](PLAN-GIAI-DOAN-2.md), brief và báo cáo [T02](tasks/T02-nen-chung.md) / [báo cáo](tasks/T02-bao-cao.md), [T03](tasks/T03-khu-vuc-1.md) / [báo cáo](tasks/T03-bao-cao.md), [T12](tasks/T12-noi-that-b3.md) / [báo cáo](tasks/T12-bao-cao.md), [T13](tasks/T13-noi-that-b8.md) / [báo cáo](tasks/T13-bao-cao.md), [S8](tasks/S8-bao-cao.md), [L346](tasks/L346-phong-406-ngoi-thay.md) / [báo cáo](tasks/L346-bao-cao.md) và [T19](tasks/T19-bao-cao.md). T06 được đối chiếu qua [ROADMAP](ROADMAP.md) và commit `7436d2a`.
