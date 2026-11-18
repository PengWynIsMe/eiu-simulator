# T18 — B8: thang máy kiểu B11, kính nhìn vào phòng, hết chớp nền

Người giao: Claude · Người làm: Antigravity (Gemini 4 Hydrogen High) · Nhánh: tiếp tục `t16-b8-chi-tiet` (đã có T16, T17)

Đọc `AGENTS.md`. Không commit, không push, không cài gói. **Không sửa** `B11Furniture.tsx`, `layouts/b11.ts`, `zone2/Block11Details.tsx`, `kit/TwinWingBlock.tsx`, `src/store`, `src/data`, `src/types`, `package.json`.

---

## Việc 1 — Sảnh thang máy B8 theo kiểu B11

Mẫu: `B11ElevatorBooth` trong `B11Furniture.tsx` (≈ dòng 784–830). Viết lại `B8ElevatorBooth` trong `B8Furniture.tsx`:

| Phần | Số liệu (tọa độ nhóm, như B11) |
| --- | --- |
| Khung đá marble kem be | box `0.18 × 2.64 × 2.55` tại `(0.04, 1.32, 0)`, `#d6c8b4` roughness 0.45 |
| 2 cánh cửa inox xước | mỗi cánh `0.05 × 2.34 × 0.98` tại `(-0.06, 1.2, ±0.52)`, `#cbd5e1` metalness **0.5** roughness 0.3 (không để 0.85: cảnh không có env map nên sẽ đen) |
| Khe giữa 2 cánh | box `0.06 × 2.34 × 0.02` tại `(-0.065, 1.2, 0)`, `#475569` |
| Bảng nút gọi | `0.04 × 0.34 × 0.14` tại `(-0.07, 1.25, 1.15)`, `#0f172a`; thêm 2 nút tròn (cylinder Ø0.04 dày 0.01) ▲ ở y 1.31, ▼ ở y 1.19, `#e2e8f0` emissive nhẹ |
| Màn LED báo tầng | nền `0.05 × 0.24 × 0.56` tại `(-0.08, 2.55, 0)`; chữ số tầng hiện tại bằng `<Text>` của drei (đã có trong dự án, kiểm tra `package.json` trước, nếu không có thì dùng ô màu như B11) |
| Đèn | `pointLight` như B11 |

Dựng booth **ở mọi tầng 1–4** (dùng `dy` như kết cấu T16, ẩn tầng trên khi `!showUpperFloors`). Số trên LED: tầng của booth đó.

**Bảng chọn tầng (HUD) `src/ui/interior/InteriorHud.tsx`:** khi mở thang máy (E), làm bảng giống bảng nút thang máy thật:
nền thép tối, nút tròn 1–4 xếp dọc từ dưới lên, nút tầng hiện tại sáng viền xanh, ô LED nhỏ phía trên hiện số tầng hiện tại + mũi tên ▲▼ khi đang di chuyển,
vẫn giữ phím tắt 1–4 và Esc như cũ. Chỉ đổi giao diện, không đổi logic chuyển tầng. Áp dụng chung mọi tòa (B3, B8, B11 dùng chung HUD này).

---

## Việc 2 — Vách kính nhìn vào phòng học (mẫu `addFrontCorridorWall` trong `layouts/b11.ts` ≈ dòng 253–300)

Ảnh thật B8 (3729, 3732): tường phòng phía hành lang màu nâu sẫm, có **dải cửa sổ kính khung nhôm** cao từ ~1.0 đến ~2.4 m.

1. `layouts/b8.ts`, hàm dựng tường phòng ↔ hành lang (đang cắt cửa theo `getFloorDoors`): mỗi đoạn tường giữa 2 cửa (hoặc giữa cửa và góc phòng) **dài ≥ 3.0 m** tách thành
   `đặc 0.6 m` + `kính (isGlass: true, thickness 0.1)` + `đặc 0.6 m`. Đoạn ngắn hơn giữ đặc. Không đổi vị trí cửa, không đổi va chạm (kính vẫn chặn đi như tường).
2. `B8Furniture.tsx`, mọi tầng (`dy`): trên mỗi đoạn kính vừa tạo, dựng thêm
   - bệ tường dưới: box cao 0.95 (y 0 → 0.95), dày 0.22, màu tường `#42322c`
   - tường trên: box y 2.45 → 3.8, dày 0.22, `#42322c`
   - khung nhôm `#9ca3af`: thanh ngang ở y 0.95 và 2.45 (0.05 × 0.05), đố đứng mỗi 1.2 m (0.04 × 1.5)
   → nhìn từ hành lang thấy đúng dải cửa sổ, nhìn qua kính thấy bàn ghế bên trong.
3. **Xóa** dải "cửa sổ giả" của T16 (`windowFrames`, `windowGlass`), không để trùng.
4. Kính dùng vật liệu kính sẵn có trong `InteriorScene` (nhánh `isGlass`). Kiểm tra cả tầng hiện tại và các tầng khác (khối nhiều tầng) đều ra kính.

---

## Việc 3 — Hết hiện tượng chớp chớp dưới nền

Nguyên nhân thường gặp là **z-fighting**: hai mặt phẳng quá sát nhau, GPU không phân biệt được mặt nào ở trước nên hai màu nháy xen kẽ. Ngoài ra còn có **shadow acne** (sọc bóng nhấp nháy). Claude đã tìm ra các chỗ nghi ngờ:

| Lớp | Hiện tại | Sửa thành |
| --- | --- | --- |
| Sàn bê tông hành lang mở `corridorFloor` (`B8Furniture.tsx` ≈ dòng 565) | dày 0.004, mặt trên cách sàn 4 mm | tâm `dy + 0.01`, dày 0.02 (mặt trên +0.02) |
| Dải xanh `blueEdgeTrim` (≈ dòng 552) | dày 0.01, mặt trên +0.01, đè lên lớp trên | tâm `dy + 0.03`, dày 0.02 (mặt trên +0.04) |
| Nền đá sân `courtyardPaving` (≈ dòng 622) | mặt trên `groundY + 0.02` | mặt trên `groundY + 0.04` |
| Chiếu nghỉ thang (≈ dòng 714) | mặt trên đúng 1.9, sát mặt bậc | giữ 1.9 nhưng mặt bậc cuối mỗi vế không trùng mặt chiếu nghỉ (lệch ≥ 0.015) |
| Vật liệu các lớp phủ sàn (3 dòng đầu) | — | thêm `polygonOffset`, `polygonOffsetFactor={-1}`, `polygonOffsetUnits={-2}` (dải xanh: `-2 / -4`) |
| Camera trong nhà (`WalkMode.tsx`) | `near = 0.1` | `near = 0.2` (cả sau vai và FPS; ngoài trời giữ nguyên) |
| Bóng đổ `directionalLight` trong `InteriorScene.tsx` | — | thêm `shadow-bias={-0.0005}` và `shadow-normalBias={0.03}` |
| `Block8Details.tsx` (bản đồ, camera near = 5) | nền đá mặt trên 0.19 | kiểm tra mặt dưới sân của `TwinWingBlock` / mặt đất. Khoảng cách giữa các lớp phải ≥ 0.05 m, nếu thiếu thì nâng nền đá của Block8Details (không sửa TwinWingBlock) |

**Cách kiểm tra (bắt buộc):** với mỗi vị trí dưới đây, đứng yên, chụp 2 ảnh cách nhau 0.5 s rồi so pixel (đếm số pixel khác nhau). Nếu còn chớp thì ẩn từng lớp để tìm nguồn, sửa, rồi chụp lại:
(a) hành lang mở tầng 3 nhìn dọc 40 m; (b) tầng 4 nhìn xuống sân Đông; (c) tầng 1 sân Tây ngang tầm mắt; (d) bản đồ nhìn xiên vào B8 từ xa.
Ghi số pixel khác nhau trước / sau vào báo cáo.

---

## Tự kiểm tra

1. `npm run typecheck`, `npm run lint`, `npm run build` sạch.
2. Trình duyệt, vào B8 qua console như T17. Chụp lưu `docs/tasks/T18-anh/`:
   thang máy tầng 1 và tầng 3, bảng chọn tầng HUD, hành lang nhìn qua kính thấy bàn ghế, ảnh so pixel trước/sau của 4 vị trí ở Việc 3,
   B11 và B3 vẫn bình thường (riêng bảng HUD thang máy B3 hiện kiểu mới).
3. Leo thang (T17) vẫn chạy: thử lại thang Giữa Bắc tầng 1 → 2 → 1.
4. Console không lỗi đỏ.

## Báo cáo

`docs/tasks/T18-bao-cao.md`: file đã sửa, kết quả lệnh, bảng pixel trước/sau, ảnh, phần chưa làm được và lý do.
