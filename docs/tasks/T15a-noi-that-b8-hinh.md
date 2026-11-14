# T15a — Nội thất B8: cầu thang thật, vườn sân trong, bàn ghế đúng mật độ

- Người làm: **Gemini (Antigravity)** — song song với T15b (Codex: camera, robot, đi cầu thang).
- Worktree + nhánh: `t15a-noi-that-hinh`. `npm ci`; dev cổng **5174**.
- Phản hồi người dùng (2026-11-14): *"lệch cầu thang đi bộ; vườn ở giữa là vườn mở, đâu có kính; tỉ lệ có vẻ lớn so với thực tế, 1 phòng phải chứa khá nhiều người; cầu thang cà giựt."*
- Claude đã kiểm tra nguyên nhân (số liệu bên dưới) — **làm đúng số, không tự đoán**.

## Chỉ được sửa

`src/scene/interior/InteriorFurniture.tsx`, `src/scene/interior/InteriorScene.tsx`, `src/scene/interior/layouts/b8.ts`, `src/scene/interior/layouts/b3.ts`.
**Không** sửa `layouts/index.ts`, `layouts/b11.ts` (đồng nghiệp đang làm B11), `types.ts` (nếu bắt buộc thì ghi đề xuất), `scene/walk/**`, `ui/**` (T15b), store, data.

## 1. Cầu thang bộ — thang gấp 2 đoạn, nằm gọn trong ô thang

Hiện tại (`InteriorFurniture.tsx` ~dòng 312): mỗi thang là **1 dốc thẳng 14 bậc × 0.65 m = 9.1 m**, cao lên 3.8 m giữa khoảng trống → trông lệch và giật.
**Thay bằng** thang gấp khúc (2 đoạn song song + chiếu nghỉ), kích thước thật:
- Bậc: cao **0.158 m** (24 bậc / 3.8 m), sâu **0.28 m**. Mỗi đoạn **12 bậc** → dài 3.36 m. Bề rộng mỗi đoạn **1.3 m**, khe giữa 0.2 m → tổng rộng 2.8 m.
- Chiếu nghỉ giữa tầng: sâu **1.3 m**, ở cao độ **1.9 m**, đặt ở **đầu xa hành lang** của ô thang.
- Đoạn 1 bắt đầu ở **mép ô thang giáp hành lang**, đi lên tới chiếu nghỉ; đoạn 2 quay ngược về, lên tới 3.8 m.
- Đặt trong **đúng ô `kind: stair`** của bảng tọa độ (`docs/tasks/T13b-b8-toa-do.json`), canh giữa theo chiều rộng ô; trục đoạn thang **song song với cạnh dài của ô**.
  Ô Tây Bắc (u 9.0–13.1, v −210.2…−200.0): cạnh dài theo v → đoạn thang chạy theo v, giáp hành lang ở v = −200.0.
  Ô Tây Nam, 2 ô giữa: tương tự (giáp hành lang ở cạnh v gần sân trong). Lõi Đông (u 106.9–114.5, v −190.3…−184.8): cạnh dài theo u, giáp hành lang Đông ở u = 114.5.
- Lan can thang inox. Màu bậc: xám bê tông (B8 không dùng cầu thang nhiều màu).
- **`ColorfulStairs` (cầu thang màu của B3) đang hiện cả trong B8** — chỉ render khi `buildingId === 'b3'`. Tương tự `B3ElevatorBooth`, `AuditoriumStage`: chỉ cho B3.
- Không mặt phẳng nào trùng nhau: bậc thấp nhất cao hơn sàn **≥ 0.02 m**; chiếu nghỉ không chạm tường.

## 2. Sân trong — vườn mở (bỏ nền xanh đen)

Nền sân hiện màu xanh đen bóng → nhìn như kính. Ảnh thật `references/toa-b8/IMG_3711`, `IMG_3719` (repo chính): **lát gạch xám nhạt + bồn cây viền bê tông + cây lớn**.
- Sân (tọa độ trong bảng): viền **lối lát gạch rộng 1.5 m** sát mép sân, màu `#c9c4bb`.
- Bên trong: **bồn cây** chữ nhật viền bê tông cao 0.4 m, mặt cỏ/cây bụi `#6f9a5b`; mỗi sân 1 dải bồn dọc giữa, ngắt quãng mỗi ~12 m bằng lối đi ngang 1.5 m.
- **Cây lớn**: 1 cây mỗi ~12 m dọc bồn (tán rộng 6–8 m, cao 8–10 m) — sân Tây 3 cây, sân Đông 5 cây (như hiện tại, chỉ đặt vào bồn).
- **Tầng 2–4**: không vẽ nền sân ở cao độ tầng hiện tại. Vẽ **vườn ở cao độ mặt đất** (thấp hơn sàn tầng hiện tại `(floor − 1) × 3.8 m`) + 4 vách sân màu nâu sẫm từ mặt đất lên tới sàn tầng hiện tại (để thấy độ sâu). Lan can giữ nguyên.

## 3. Bàn ghế — đúng mật độ thật

Báo cáo CSVC chính thức (`references/BAN-VE-TIM-DUOC.md`): phòng **50–100 chỗ trung bình 88 m²**. Phòng thường B8 ≈ 9.2 × 10.2 m ≈ 94 m² → **48–56 chỗ**. Hiện chỉ 12–16 chỗ.
Mỗi phòng `kind: room` (trừ WC, thang, phòng kỹ thuật 102):
- **Bảng + bàn giáo viên** ở tường **Tây** (u nhỏ) của phòng: bảng rộng 3.5 m cao 1.2 m, mép dưới 0.9 m; bàn GV 1.4 × 0.7 m cách bảng 1.2 m.
- **Bàn đôi** 1.2 × 0.5 m, cao 0.75 m + 2 ghế 0.42 × 0.42 m. Hàng đầu cách tường Tây **2.4 m**, **bước hàng 0.9 m** theo u, tới khi còn cách tường Đông 0.6 m.
  Mỗi hàng: bàn đặt dọc theo v, **lối đi 0.7 m** giữa các bàn, cách 2 tường dọc 0.6 m; chừa **1.0 m** ở đầu phía cửa (phía hành lang).
  → Số chỗ tự sinh theo kích thước phòng (phòng gộp 311/309/307/305/303, 411 ~100–120 chỗ).
- Instancing (1 instancedMesh cho bàn, 1 cho ghế). Ghi số chỗ từng loại phòng vào báo cáo.

## 4. Cửa phòng

Mỗi phòng 1–2 cửa ra hành lang phía sân trong: rộng **1.0 m**, cao **2.2 m** (phần tường trên cửa vẫn có tới 3.8 m). Vị trí: gần 2 đầu tường phía hành lang (như ký hiệu cửa trên sơ đồ).

## Tiêu chí xong

- [ ] typecheck / lint / build sạch; console sạch; không nhấp nháy ở bậc thang và sàn (đi lại gần thang 10 giây)
- [ ] Ảnh từ trên mỗi tầng B8 cạnh sơ đồ `references/toa-b8/so-do-1400/` — thang nằm gọn trong ô thang, không thang lạ
- [ ] Sân trong tầng 1: gạch + bồn + cây; tầng 3 nhìn xuống thấy vườn ở dưới, có chiều sâu
- [ ] Số chỗ: phòng thường 48–56, phòng gộp ~100+
- [ ] B3 vẫn như cũ (cầu thang màu, thang máy, hội trường chỉ ở B3)

## Báo cáo → `docs/tasks/T15a-bao-cao.md`
