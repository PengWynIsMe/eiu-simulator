# Báo cáo TỔNG HỢP — nhánh `PengWynIsMe/tong-hop` (2026-11-23)

Nhánh tách từ `main` (24483be), gộp 9 nhánh trong ngày để chủ dự án test một lần. **Chưa push, chưa PR, chưa merge vào main.**
Dev server để sẵn: **http://localhost:5180/** (cổng cố định 5180, `npx vite --port 5180 --strictPort --host`).

## 1. Thứ tự gộp (`git merge --no-ff`, typecheck sau mỗi bước)

| # | Nhánh | Xung đột | Ghi chú |
| --- | --- | --- | --- |
| 1 | `fix-fp-nhay` | không | Xoay góc nhìn thứ nhất (`yaw += delta`; đã đối chiếu `forward = (cos yaw, sin yaw)` → rê phải = quay phải) + polygon offset sàn nội thất |
| 2 | `nganh-n2-noidung` (đã chứa kế hoạch + N1) | không | 8 ngành chuẩn hóa, `scripts/ctdt/` |
| 3 | `nganh-n3-ui` | không | `useLangStore`, `ui/text.ts`, panel ngành, loader, mau-a/mau-b |
| 4 | `tuyet-roi-eiu` | `ui/TopBar.tsx` | Giữ cả LangToggle + nút tuyết; viết lại ở bước ghép (mục 3) |
| 5 | `phong-may-406` | không | |
| 6 | `an-ninh-mang` (kèm `codex-phu`) | không | B6, sảnh BBI, `STYLE-3D.md`, cầu thang gáy sách, nhà xe căn tin, bậc hồ |
| 7 | `canteen-trong` | `InteriorScene.tsx`, `layouts/index.ts`, `WalkMode.tsx` | Giữ **cả** B6 và căn tin (`isB6`, `isCanteen`) |
| 8 | `thu-vien-b4` | `InteriorScene.tsx` | Giữ cả B4/B6/căn tin; `isMultiFloor` gồm B4; thêm `isB4` vào deps `useMemo` (hết cảnh báo lint) |
| 9 | `khuon-vien` (đến `2500b27`, chỉ đổi tài liệu) | `App.tsx`, `CameraRig.tsx`, `Pond.tsx`, `ParkingStructures.tsx` | Xem mục 2 |

## 2. Trùng lặp: chọn bản nào

| Hạng mục | Chọn | Bỏ | Lý do |
| --- | --- | --- | --- |
| Bên trong căn tin | `canteen-trong` (`CanteenFurniture` + layout đi bộ được, sáng, 16 call) | Phần "bên trong" trong `zone2/CanteenBlock.tsx` của khuon-vien (quầy, biển quầy, bàn ghế — 2 mesh) | Theo yêu cầu; hai bản chồng nhau khi nhìn qua kính ngoài trời. **Giữ** mặt tiền, fascia "EIU CANTEEN", tường cây, sân trước, xích đu của khuon-vien |
| Nhà xe mái răng cưa căn tin (`nha-xe-can-tin`) | codex-phu (`LongParkingShed` dùng `StaticInstances`, ít call) | Bản khuon-vien (hộp merge + rào + xe máy) | Điều phối chỉ đạo + ít draw call; mái 1 bộ, không chồng |
| Bậc hồ + chậu hoa | codex-phu (`PondTerraces.tsx`, `Pond.tsx` bản HEAD có tuyết đóng băng) | Bản `Pond.tsx` viết lại của khuon-vien (bậc, viền vàng, chậu, đài đá) | Theo chỉ đạo + đúng `STYLE-3D.md` (thành hồ `#cbd5e1`); chỉ có **một** bộ bậc |
| Nhà xe B5 (`ParkingShed.tsx`) | khuon-vien | — | codex-phu không đụng file này, không trùng. Mái trắng răng cưa, cùng ngôn ngữ với nhà xe căn tin |
| Debug URL `?cam=` / `?building=` của khuon-vien | Giữ, gộp với cảnh mở đầu: `minDistance/maxPolarAngle` theo `hasCustomCam` rồi `isCinematicActive` | — | Có `?cam=` hoặc `?building=` thì **không** chạy cảnh mở đầu (tránh giành camera) |

Vật thể chồng/trùng vị trí: ngoài các mục trên, rà footprint (point-in-polygon với `layout.json`) cho 11 ô vườn cây ăn trái của khuon-vien (`CampusGreenery`) → **4 ô nằm trong thân B11** (25,−120; 32,−124; 18,−116; 58,−150) → đã xóa. Rèm dây leo/đèn hành lang của `CampusGreenery` đặt thêm lên hành lang có sẵn, không có hành lang thứ hai. Chụp 5 góc (căn tin, nhà xe căn tin, nhà xe B5, hồ, tổng quan): không thấy hai mái / hai bộ bậc chồng nhau, không z-fighting.

## 3. Việc ghép a–f

- **a) Dữ liệu ngành.** Xóa `mau-a`, `mau-b`. `campus.json`: `b3=[qtkd]`, `b6=[mmt]`, `b8=[dien]`, `b11=[ktpm,mmt,tdh,dien,cdt,dtvt,cokhi]` (panel gom theo khoa: CNTT / Kỹ thuật). Loader mở được sau khi sửa **1 lỗi dữ liệu**: highlight `CSW 430` của `ktpm.json` không còn trong curriculum (bị bước chuẩn hóa a205177 loại) → thay bằng `CSW 304 Front-end Development`, viết lại câu "why". (`check.mjs` **không** kiểm highlight; loader mới bắt được — nên thêm vào `check.mjs` sau.)
- **b) Chia lại môn theo năm** — `scripts/ctdt/infer-years.mjs` (chạy sau `extract.mjs`, idempotent, ghi `year` + `yearSource:'ma-mon'`, `yearsInferred:true`; UI giữ ghi chú "Năm học suy từ mã môn"):
  - Quy tắc PLAN 5.1: số đầu của mã (1xx→1, 2xx→2, 3xx→3, 4xx→4, 0xx→1, ≥5xx→4).
  - Môn **chuyên ngành / tự chọn** trước đây không có `year` (QTKD: 0/50) → có năm theo mã ⇒ **QTKD năm 3 hết trống** khi chọn chuyên ngành (vd Kế toán: ACTG 335/360/381/382/383 ở năm 3).
  - Tinh chỉnh **duy nhất** ngoài quy tắc thuần: môn *đại cương* trùng mã với kế hoạch của 5 ngành BM08 → lấy năm trung vị ở đó (POLS 132/136, MATH 122… là năm 2) để năm 1 không dồn. Đây là suy luận của tôi, không phải số liệu PDF — chủ dự án duyệt hoặc bỏ dòng `refYears` trong script nếu muốn thuần theo mã.
  - Số môn chung theo năm (1/2/3/4): QTKD 28/6/0/2 → **20/12/2/2**; Cơ khí 21/8/14/4 → **12/15/16/4**; ĐTVT 22/10/8/4 → **14/18/8/4**.
  - Tab "Chung" năm 3 QTKD vẫn chỉ 2 môn (đúng dữ liệu: các môn 3xx của QTKD nằm trong chuyên ngành) → UI thêm dòng gợi ý "Năm này còn môn riêng của từng chuyên ngành — chọn một chuyên ngành ở trên" (`UI_TEXT.pickSpecHint`).
  - `node scripts/ctdt/check.mjs` exit 0; tổng tín chỉ không đổi; QTKD tài chính / chuỗi cung ứng / nhà hàng-KS vẫn 191/195 (ngoại lệ đã biết).
- **c) Một trạng thái ngôn ngữ.** `ui/snowText.ts` xóa; chuỗi tuyết/cảnh mở đầu chuyển vào `UI_TEXT`; `useSnowStore` bỏ `lang`; `SnowIntroOverlay` dùng đúng `<LangToggle/>` của TopBar (cùng `useLangStore`, lưu `localStorage`, `<html lang>`). `?lang=en|vi` trên URL (liên kết chia sẻ cũ của màn tuyết) vẫn được đọc, thắng giá trị đã lưu.
- **d) Tuyết mặc định BẬT.** `useSnowStore`: bật + chạy cảnh mở đầu khi vào trang; `?snow=0|false` tắt hẳn; `?snow=1` bật; nút TopBar "Tắt tuyết" ghi `?snow=0|1` vào URL.
- **e) HUD điện thoại.** `TopBar` viết lại: một hàng, từ `<sm` các nút chỉ còn icon vuông 32 px (nhãn ẩn nhưng có `aria-label`/`title`), huy hiệu số góp ý thành chấm góc, tiêu đề cắt `…` nếu hẹp; "Xem lại cảnh tuyết" chỉ từ `lg`. Đo 360×740: `scrollWidth = 360`, tiêu đề (đến x=122) không chạm cụm nút (từ x=139), cao 48 px ⇒ nút "Góc nhìn: … · C" của `WalkHud` (top-20) không còn bị đè. Desktop giữ nhãn như cũ. Thanh cuộn ngang của chip ngành đã ẩn.
- **f) Lệch style (`docs/STYLE-3D.md`)** — chỉ ghi, không sửa: (1) hai nhà xe răng cưa trắng dùng hai mã màu mái (`#f8fafc` B5 / `#f1f3f4` căn tin) và hai cách dựng (B5 hộp merge + cây/xe; căn tin `StaticInstances`) — nên thống nhất một kit; (2) màu bàn ghế mỗi phòng một kiểu: căn tin sàn terra `#dddcd2` + bàn gỗ nâu, B8 ghế `#334155`, 406 ghế `#2f3b4f`, B4 sàn thảm `#a8a29e`; (3) màu nhận diện (xanh BBI `#1d4ed8`, đỏ Highlands `#b3262a`, fascia căn tin `#6b2626`) vẫn rải nhiều file, STYLE-3D đã nêu chưa có bảng hằng; (4) biển chữ 3D khuon-vien (`kit/blockText.ts`, chữ khối) khác kiểu biển canvas EIU `createSignTexture` (nền `#0b3d6e`) — chưa đồng nhất, chưa song ngữ.

## 4. Kết quả review

- `npm run typecheck` ✅ · `npm run lint` ✅ (0 lỗi, 0 cảnh báo) · `npm run build` ✅ (index 627 kB / gzip 180 kB; r3f 528 kB; three 688 kB — không tăng đáng kể so với bước 1) · `node scripts/ctdt/check.mjs` exit 0.
- `package.json` / lockfile **không đổi** so với `main`; không PDF/ảnh ngoài vào repo (ảnh trong `docs/tasks/*-anh` là ảnh chụp màn hình của chính các nhánh).
- Duyệt tay trong Orca browser (cổng 5180), console không lỗi/cảnh báo:

| Kiểm | Kết quả |
| --- | --- |
| Trang chủ: tuyết + cảnh mở đầu (VI), "Vào tham quan" / "Bỏ qua" | ✅ |
| Chuyển VI/EN ở TopBar và ở màn mở đầu (cùng một pill), `<html lang>`, panel ngành sang EN | ✅ |
| Panel ngành B3 (QTKD), B6 (MMT), B8 (Điện), B11 (7 chip, 2 khoa) | ✅ B3/B6/B11 desktop, B8 mobile |
| QTKD → EN → Courses → Year 3: có gợi ý + chọn Accounting thấy ACTG 335/360/381/382/383 | ✅ |
| `?snow=0` tắt hẳn (không cảnh mở đầu, nút "Tuyết rơi" tắt) | ✅ |
| Vào B4 (đi bộ, `enterInterior`) | ✅ sảnh/cửa kính, 38 call |
| Vào B6 sảnh BBI, cầu thang gáy sách thấy ở cuối sảnh | ✅ (chưa leo thang bằng tay — xem mục 6) |
| Căn tin trong nhà (terra sáng, bàn ghế, 3 bảng màu) | ✅ 16 call |
| 406.B11: "Tới lớp ngay" → tìm ghế; ngồi (store) → thầy Nam chào, slide "Nhập môn lập trình" trên TV, 47 call | ✅ (ngồi bằng phím E chưa thử bằng tay, xem mục 6) |
| Góc nhìn thứ nhất xoay đúng chiều | ⚠️ đọc mã đúng; chưa thử Pointer Lock (không điều khiển được trong Orca browser) |
| Mobile 390 và 360: TopBar một hàng, không tràn ngang; chế độ đi bộ: nút "Góc nhìn" không bị đè; sheet ngành B8 | ✅ |

`renderer.info` (desktop 1280×800, `?snow=0` trừ khi ghi chú; mốc T19: 145 call / 279 198 tam giác góc tổng quan):

| Góc | Call | Tam giác |
| --- | --- | --- |
| Tổng quan mặc định (tuyết tắt) | 170 | 406 964 |
| Tổng quan, tuyết bật | 171 | 405 628 |
| Căn tin + nhà xe căn tin (từ trên) | 58 | 328 447 |
| Nhà xe B5 + hành lang | 87 | 346 446 |
| Mặt tiền căn tin | 42 | 276 869 |
| Hồ + 2 cầu | 79 | 259 038 |
| Trong B4 tầng 1 | 38 | 60 659 |
| Trong B6 sảnh | 50 | 9 051 |
| Trong căn tin | 16 | 8 391 |
| Ngồi trong 406.B11 | 47 | 135 548 |

Tổng quan tăng ≈ +25 call / +127 k tam giác so với mốc T19 (B6 + sảnh, kiosk, `CampusGreenery`, bậc hồ, mái nhà xe…). Chưa đo FPS (môi trường đo không đại diện GPU máy chủ dự án); mục tiêu ≥ 50 FPS laptop vẫn cần chủ dự án xác nhận.

Công cụ kiểm thêm (chỉ chạy ở `npm run dev`): `window.__stores` (campus/walk/lesson/snow/lang) và `window.__gl` trong `main.tsx` / `App.tsx` — để đo draw call và tạo tình huống bằng `eval`; `vite build` không chứa.

## 5. CHO CHỦ DỰ ÁN THỬ (http://localhost:5180/)

1. Mở trang: thấy tuyết + cảnh mở đầu. Bấm **EN / VI** (góc phải) — chữ đổi; bấm **Bỏ qua** hoặc **Vào tham quan**.
2. Thanh trên: **❄ Tắt tuyết** → hết tuyết; mở `?snow=0` thì không có tuyết ngay từ đầu.
3. Bấm tòa **Block 3** → panel QTKD; **Block 6** → Mạng máy tính; **Block 8** → Kỹ thuật Điện; **Block 11** → 7 ngành chia 2 khoa. Thử tab **Môn học**, chọn **Năm 3** + một chuyên ngành (QTKD → Kế toán).
4. Thu nhỏ trình duyệt ~390 px (hoặc mở bằng điện thoại cùng mạng: `http://<IP máy>:5180/`): thanh trên một hàng icon, không chồng chữ; bật **Đi bộ** → nút "Góc nhìn" không đè.
5. **Đi bộ** → tới Thư viện B4 (đường Đông) → **E** vào: đi xem sảnh/đọc sách.
6. Đi bộ tới B6 (cổng Bắc) → **E** vào sảnh BBI → lên **cầu thang gáy sách** (đi lên được không, có kẹt không).
7. Đi bộ tới **Căn tin** → **E** vào: sáng, bàn ghế terra, chạy mượt không.
8. **📚 Buổi học** → bắt đầu → "Tới lớp ngay"/đi theo la bàn tới **406.B11** → ghế viền sáng → **E** ngồi → thầy chào, slide trên TV, **Esc** đứng dậy.
9. Chế độ đi bộ: bấm **C** tới góc nhìn thứ nhất, click màn hình (khóa chuột) → rê chuột **sang phải thì nhìn sang phải**; bước đi theo hướng nhìn; nhìn sàn trong B3/B8/B11 không nhấp nháy.
10. Nhìn từ trên: nhà xe căn tin (một mái răng cưa), bờ hồ phía Tây (một bộ bậc + chậu hoa giấy), Highlands đỏ, tường cây mặt tiền căn tin.

## 6. Vấn đề còn lại

- **Chưa tự thử bằng tay** (cần người): leo cầu thang gáy sách B6 đến tầng trên; ngồi 406 bằng phím **E** thật (tôi ép `sitDown` qua store); xoay góc nhìn thứ nhất bằng Pointer Lock; điện thoại thật; FPS.
- Ngồi 406: "Tới lớp ngay" chỉ chuyển pha sang tìm ghế, **không** dịch chuyển người chơi tới phòng (đúng thiết kế L4: spawn trước thang máy tầng 4); khi đi thử tôi đụng tường ở hướng mặc định, nên người thử cứ đi theo la bàn trong HUD.
- Cảnh mở đầu chạy **mỗi lần vào trang** (tuyết mặc định bật). Nếu muốn chỉ lần đầu / nhớ "đã xem" bằng `sessionStorage` thì cần đổi nhỏ trong `useSnowStore`.
- `check.mjs` không kiểm `highlights[].code` có trong curriculum (lỗi CSW 430 chỉ lộ khi mở app); nên thêm.
- QTKD năm 2 "chung" còn các môn nhìn như tự chọn (STAT 202, PHL 255, MUSI 204/205, DANC 210/211) — do trích xuất bản khung; cần chủ dự án/N2 đối chiếu lại với `QTKD.pdf`.
- QTKD tài chính / chuỗi cung ứng / nhà hàng-KS: 191/195 TC (ngoại lệ đã biết).
- Tăng +25 draw call / +127 k tam giác so với mốc T19 ở góc tổng quan (nhà xe B5 của khuon-vien có cây + xe máy từng mảnh; nếu FPS thấp thì chuyển sang `StaticInstances` như nhà xe căn tin).
- Lệch style mục 3f chưa thống nhất.
- `TEXT` cũ trong `ui/text.ts` còn khóa TopBar không dùng (đề xuất N3 → N4 dọn).
