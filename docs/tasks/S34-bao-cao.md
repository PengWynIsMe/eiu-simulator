# Báo cáo S34 — Cỏ, gió, lá rơi + mặt đường thật (luồng C)

```
File đã sửa/tạo:
  Mới:
    src/scene/nature/wind.ts            windTime (uniform chung) + applyWind(material, {strength, heightFalloff, distanceFade?, upNormal?})
    src/scene/nature/WindClock.tsx      <WindClock/>: windTime.value += dt trong useFrame
    src/scene/nature/grassMask.ts       lưới bit 0.5 m "chỗ nào mọc cỏ được" (thuần, không phụ thuộc React/three)
    src/scene/nature/Grass.tsx          <Grass/>: 1 instancedMesh <= 40 000 ngọn
    src/scene/nature/FallingLeaves.tsx  <FallingLeaves/>: 300 lá, chuyển động trong vertex shader
    src/scene/street/roadTextures.ts    texture canvas 1024²: nhựa đường (+vạch), gạch lát so le
    src/scene/street/roadGeometry.ts    dải đường có UV dọc theo đường (góc vát), vành vòng xoay có UV, bó vỉa
  Sửa:
    src/scene/Ground.tsx                mặt đường texture + vạch + bó vỉa; giữ nguyên click/ghim góp ý, cao độ, bề rộng
    src/scene/Trees.tsx                 applyWind cho vật liệu TÁN (thân không đổi), biên độ 0.15 m
    src/scene/trees/SalixAlbaTrees.tsx  applyWind cho foliageMat (vỏ không đổi), biên độ 0.25 m
    src/scene/Environment.tsx           fog 250 -> 900 m (cùng màu nền/trời #d6e6f7)
    src/scene/Campus.tsx                CHỈ ĐỂ THỬ (xem dưới) — Claude gắn lại khi gộp

Dòng cần thêm vào Campus.tsx (đã gắn tạm trong worktree này, ngay sau <Trees />):
  import WindClock from './nature/WindClock';
  import Grass from './nature/Grass';
  import FallingLeaves from './nature/FallingLeaves';
  ...
  <Trees />
  <WindClock />
  <Grass />
  <FallingLeaves />
  (Grass và FallingLeaves tự ẩn khi camera cao hơn 150 m / 60 m. Cả 3 phải nằm trong nhánh ngoài trời, không nằm trong nhánh interior.)

Kết quả typecheck / lint / build: cả 3 sạch (0 lỗi). Build chỉ còn cảnh báo chunk > 500 kB có từ trước.

Đã kiểm tra tay (cách kiểm):
  KHÔNG mở được trình duyệt có GPU, nên chưa thấy bằng mắt. Đã kiểm bằng:
  - Script Node (đặt ngoài src, bundle bằng esbuild có sẵn) chạy đúng thuật toán lọc vị trí cỏ trên dữ liệu thật,
    bán kính 70 m, lưới 0.7 m, đếm số ngọn và số ngọn "vi phạm" (trong tòa / bãi xe / hồ / cách tim đường < nửa bề rộng / vành vòng xoay):
      tâm vòng xoay   31 428 ngọn, 0 vi phạm
      quảng trường    27 142 ngọn, 0 vi phạm
      sân hồ (120,-10) 15 369 ngọn, 0 vi phạm
      Block 11        12 863 ngọn, 0 vi phạm
      cổng (236,-20)  14 755 ngọn, 7 "vi phạm" ; biên (300,300) 12 484 ngọn, 26 "vi phạm"
        -> cả 33 điểm này chỉ là ngọn nằm sát RANH GIỚI trường lệch < 0.35 m so với tâm ô lưới 0.5 m (không phải đường/tòa/hồ).
    Số ngọn lớn nhất 31 428 <= 40 000. Mask dựng 1 lần ~25 ms.
  - Dải đường: 164 tam giác internal, 0 tam giác quay mặt xuống (mặt hướng +Y); bó vỉa ~8 300 tam giác.
  - Rà shader: chèn sau `#include <begin_vertex>`, `#include <common>` (khai uniform), `#include <normal_fragment_maps>` (cỏ, Lambert three 0.170 có chunk này).
  - Không tạo object trong useFrame (Grass ghi thẳng vào Float32Array của instanceMatrix/instanceColor; FallingLeaves chỉ `center.set`; WindClock chỉ cộng số).

FPS trước / sau: CHƯA ĐO (không có GPU). Ước lượng tải thêm: cỏ tối đa ~31 000 ngọn x 3 tam giác = ~94 000 tam giác, 1 draw call;
  lá 300 quad, 1 draw call; bó vỉa 1 draw call; thêm ~3 draw call đường. Cần Claude đo ở cùng góc đi bộ.

Chưa chắc / rủi ro:
  1. Fog 250 -> 900 m: camera tổng quan có thể cách khuôn viên 300–900 m nên cả khuôn viên bị phủ sương nhạt. Cần xem thật; nếu mờ quá nâng near lên ~600.
  2. Cỏ trong vùng zone1/zone2 có sàn/lát riêng (sân hồ, vỉa quanh hồ, bậc thềm, sàn lát trong zone1/zone2) mà Ground không biết:
     tôi chỉ loại hồ (isPointInPond, đệm 1.2 m), tòa, bãi xe, đường. Nếu thấy cỏ xuyên qua sàn lát/bồn cây thì cần thêm vùng cấm
     (grassMask nhận `isBlocked(x,z)` — thêm hàm là xong, không cần sửa thuật toán).
  3. Bó vỉa: dựng thành đoạn 1.5 m, bỏ đoạn rơi vào chỗ giao đường/vành vòng xoay/đường phố/lối đi bộ/cầu. Ở chỗ cua gấp có thể có khe nhỏ. Cần nhìn thật.
  4. Gió ở cây: bóng đổ (shadow depth pass) KHÔNG lay theo cây (vật liệu depth mặc định) — lệch tối đa 0.15–0.25 m, mắt thường khó thấy.
  5. Texture: ~6 canvas 1024² (3 bề rộng đường phố + vòng xoay + nội bộ + gạch) ~ 30–40 MB VRAM kể cả mipmap. Có thể giảm (ví dụ hạ 512² cho vòng xoay) nếu máy yếu.
  6. Vạch giữa đường phố 3–4 làn: vàng đứt ở chính giữa nếu số làn chẵn, các vạch ngăn làn khác trắng đứt. Đường phố 1 chiều không có tim riêng nếu làn lẻ (vạch toàn trắng).
  7. Cầu (bridge) không dựng trong Ground (zone1/Bridges.tsx của zone1), nên chưa áp gạch đỏ; `createBrickTexture('#b5654a', aniso)` dùng được ngay khi luồng khác muốn.
     Tương tự "lối quanh hồ" nằm trong zone1 — chưa áp gạch.
  8. Cỏ y = GRASS (0.15) hoặc ROUNDABOUT_GRASS (0.3) bên trong đảo vòng xoay, chọn theo bán kính trong 75.2 m.

Đề xuất:
  - Gộp: thêm 3 import + 3 thẻ vào Campus.tsx như trên rồi chơi thử phím V ở sân hồ / quảng trường / sát đường nội bộ.
  - Nếu FPS giảm > 10%: giảm SPACING cỏ 0.7 -> 0.85 (còn ~21 000 ngọn) trong Grass.tsx.
  - Wave 2 (street/): `street/roadGeometry.ts` đã có sẵn dải đường + bó vỉa để gắn thêm cột đèn/vạch qua đường.
```
