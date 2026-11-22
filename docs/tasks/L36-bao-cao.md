File đã sửa/tạo:
- Mới: `src/scene/lesson/` — `Lesson406.tsx` (gom 3 phần, chỉ render khi B11 tầng 4), `Classroom406.tsx`, `classroom406Plan.ts` (ma trận + hình, thuần dữ liệu), `Teacher.tsx`, `ProjectorScreen.tsx`, `slideCanvas.ts`.
- Mới: `scripts/count-406.mjs` (đếm instance + draw call; `node scripts/count-406.mjs`, dùng esbuild của vite). Nằm ở `scripts/` (thư mục Claude) vì ngoài src — chuyển chỗ khác nếu muốn.
- Sửa `src/scene/interior/layouts/b11.ts`: import thêm `getClassroom`; một khối IIFE `addClassroom406Obstacles` ngay trước `getFloorWalls` (đẩy 8 WallSegment vào `FLOOR_4_DATA.walls`: 4 dãy × 2 khối + bàn GV). Dùng `isRailing: true` để InteriorScene không dựng thành tường thật và camera không coi là vật che; va chạm đi bộ vẫn áp dụng. Chọn chỗ này vì `resolveInteriorPosition` đã lặp qua `getFloorWalls`.
- Sửa `src/scene/interior/B11Furniture.tsx`: 1 dòng `if (u >= 87.24 && u <= 96.61) continue;` trong vòng lặp tầng 4 (u=89.4 là bàn/ghế/màn mặc định của 406). Hằng số cứng để khỏi thêm import (đỡ xung đột với Antigravity); trùng `bounds.minU/maxU` của classrooms.json.
- Sửa `src/scene/interior/InteriorScene.tsx`: 1 import + `<Lesson406 />` ngay dưới `<ClassroomNpcs />`.

Dòng cần thêm vào Campus.tsx: không.

Kết quả typecheck / lint / build: cả ba sạch.

Đã kiểm tra:
- `node scripts/count-406.mjs`: 40 bàn / 40 ghế / 40 màn hình / 40 mặt sáng / 40 bàn phím+chuột / 40 case, 4 dãy × 10, 6 đèn, 16 hộp phụ (bàn GV, bảng, máy chiếu, 2 điều hòa...), đúng 1 mặt sáng (ghế người chơi) sáng hơn.
- Mô phỏng `resolveInteriorPosition` (bán kính 0.35) bằng Node: đi được từ cửa (89.44, −136.6) qua khe giữa bàn GV và dãy 1, vào lối đi giữa, đi dọc lối đi tới tận 95.95, đi giữa dãy 1–2 (u 90.95) theo cả khối Nam; tới ghế người chơi từ lối đi đứng cách ghế 0.75 m (< 1.2 m).
- CHƯA mở trình duyệt thật (không có môi trường) — Claude cần xem bằng mắt: vị trí màn chiếu/bảng, hướng mặt màn hình, nội thất không chồng.

Draw call trong phòng 406:
- Classroom406 = 8 instancedMesh = 8 draw call (bàn, ghế, màn hình, mặt sáng, phím+chuột, case, đèn tấm, hộp phụ có instanceColor). Ước tính cả phòng: +1 mặt phẳng màn chiếu +1 cone máy chiếu +  thầy (vài mesh skinned) → ~ 10 + thầy, trong ngân sách 15 cho đồ nội thất (8 + 2). Chưa đo `renderer.info.render.calls` thực tế.
- Không thêm pointLight, không shadow, không tạo object trong useFrame.

Chưa chắc / rủi ro:
- Bảng trắng (v −143.85..−140.25) và màn chiếu (v −145.6..−143.6) chồng nhau 0.25 m theo v; để không z-fight, màn chiếu đặt u 87.462 (sát mặt trước bảng, bảng dày 0.04). Nên xem bằng mắt.
- Cửa phòng (u 88.49–90.39, v −136) gần ghế 406-r1-s10 (u 90.6, v −136.8): giữ đủ 40 chỗ; khe qua cửa còn ~0.2 m dư cho người chơi giữa bàn GV và bàn dãy 1 (hình học đúng số: 0.9 m khe, thân người 0.7 m). Có thể hơi chật khi đi bằng phím; nếu thấy khó, bỏ ghế r1-s10 (còn 39) như plan cho phép.
- Collision bàn là "viên thuốc" nên 2 đầu khối bo tròn; ghế người chơi (92.2) nằm trong vùng va chạm của bàn dãy 2 (đứng ngồi phải đặt vị trí trực tiếp, không đi bộ tới) — việc L4 khóa di chuyển khi ngồi là đủ, nhưng khi đứng dậy phải đặt người chơi ra lối đi.
- Teacher: trước buổi học đứng ở `teacherSpots.desk` (88.6, −139.2); khi vào học đi vòng phía tường Tây (u 87.95, tránh bàn GV) tới `teacherSpots.lecture`, phát clip khi đã đứng yên. Mặt thầy quay về ghế người chơi ở pha dialogue/summary, còn lại về +u. Chưa thử trong trình duyệt nên cử chỉ yes/no/interact chưa xác nhận bằng mắt; pending 1 phần tử — hai sự kiện sát nhau thì sự kiện sau ghi đè.
- Ghế người chơi `playerSeat` dùng cho hướng thầy nhìn; không có viền sáng (việc của L4).
- ProjectorScreen dùng `ctx.roundRect` (trình duyệt cũ < 2022 sẽ lỗi); cone cộng sáng opacity 0.05 — chỉnh theo mắt.

Đề xuất:
- Khi gộp: B11Furniture và b11.ts có thể xung đột nhẹ với nhánh Antigravity (chỉ 1 dòng + 1 khối thêm vào).
- Nếu muốn bỏ hằng số 87.24/96.61 trong B11Furniture, xuất `ROOM_406_U_RANGE` từ b11.ts.
