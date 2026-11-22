# Wave 2 — S7 (luồng B), S8 (luồng C), S9 (luồng D)

Chạy **sau khi Claude gộp Wave 1** vào `main`. Mỗi luồng giữ đúng phạm vi file như Wave 1 (`docs/PLAN-GIAI-DOAN-2.md` mục 6), worktree mới từ `main`. Không cài gói, không commit. Báo cáo vào `docs/tasks/S7-bao-cao.md`, `S8-bao-cao.md`, `S9-bao-cao.md`.

---

## S7 — Bạn học trong phòng 406 (Sonnet #1, `src/scene/npc/**`)

- `npc/ClassroomNpcs.tsx`: render khi `interior = {b11, floor 4}`. 18 SV tại `classroom.npcSeats` (`getClassroom('406.B11')`), vị trí ghế `b11ToWorld(u, v)` (import từ `../interior/layouts/b11`, chỉ đọc), quay về `studentFacing` + `B11_ROTATION_Y`, clip `sit`, mông chạm mặt ghế 0.45 m (cùng độ lệch y mà luồng A dùng cho người chơi — đọc `L346-bao-cao.md` nếu đã có, không thì tự đo và ghi lại).
- Sống động (theo `useLessonStore`):
  - Mặc định: mỗi bạn 6–14 s phát `interact` một lần (như gõ phím / dùng chuột), lệch pha.
  - `phase === 'question'`: 2 bạn cố định giơ tay (`raiseHand`) tới khi có `lastResult`.
  - `lastResult.correct === true` ở bài tập: 3 bạn gần người chơi `yes`.
  - `phase === 'summary'`: sau 2 s cả lớp đứng dậy (`idle`), lần lượt đi (`walk`) theo lối giữa (`aisle`) ra cửa `classroom.door`, tới cửa thì ẩn.
- Kiểu áo xoay vòng `roles.students`. Mixer chỉ chạy khi người chơi ở tầng 4. Không tạo object trong `useFrame`.
- Ghi dòng gắn vào `InteriorScene`/`Campus.tsx` trong báo cáo (Claude gắn).

## S8 — Phố xá (Sonnet #2, `src/scene/street/**`)

`street/StreetProps.tsx`, tất cả **instanced**, tổng thêm ≤ 8 draw call:

| Vật | Đặt ở đâu | Hình |
| --- | --- | --- |
| Đèn đường | dọc đường `internal` trong ranh trường, mỗi 25 m, lệch ra lề 4.2 m (ngoài bó vỉa), xen kẽ 2 bên | cột 6 m Ø0.12 xám đậm + cần vươn 1 m + chụp đèn (emissive nhẹ ban ngày) |
| Ghế đá | 12 cái quanh mép quảng trường tròn (bán kính 86 m, đều góc, quay vào tâm) + 6 cái trước căn tin | 1.6 × 0.45 × 0.45, đá xám |
| Thùng rác | cạnh mỗi 2 ghế đá + đầu mỗi cầu | 0.4 × 0.4 × 0.8, xanh lá + nắp vàng |
| Xe máy đậu | trong `campus.layout.parking` và các nhà xe (`nha-xe-*` trong campus.buildings): xếp hàng cách 0.8 m, hàng cách 2.2 m, ≤ 400 chiếc, 2 kiểu màu (đỏ/đen), lệch góc ±6° | khối thấp: thân 1.8 × 0.6 × 0.7 + 2 bánh (hình trụ dẹt) |
| Biển "EIU" | 1 bảng tên cạnh cổng chính phía trong, gần `[248, -40]` | 3 × 1.2, chữ vẽ bằng canvas |

- Không đặt vật lên đường/tòa nhà (dùng lại hàm lọc của S3). Bỏ vật nào trùng va chạm người chơi? Không cần va chạm.
- Ghi dòng gắn vào `Campus.tsx`.

## S9 — Nối luồng + điện thoại + âm thanh (Sonnet #3, `src/ui/**` + `src/App.tsx` 1 dòng)

1. Thêm nút **"Buổi học"** vào `TopBar` (cạnh nút Đi bộ) mở cùng thẻ lịch của `LessonLayer`; bỏ nút nổi góc dưới-trái nếu trùng.
2. Pha `findSeat`: bỏ nút tạm "Ngồi vào chỗ" **chỉ khi** luồng A đã có ghế 3D (kiểm `docs/tasks/L346-bao-cao.md` trên `main`; chưa có thì giữ).
3. Nút mobile **"Ngồi"** (khi gần ghế) nếu luồng A phát sự kiện nhắc tương tác — đọc báo cáo L346; khớp cơ chế với InteriorHud.
4. Âm thanh bằng **Web Audio API tự sinh** (không file): tiếng gõ phím ngắn khi gõ vào ô code, "ting" khi đúng, "bụp" trầm khi sai, chuông 2 nốt khi bắt đầu/tan học. Nút 🔇 bật/tắt (lưu `localStorage`, bọc try/catch). Chỉ tạo `AudioContext` sau lần bấm đầu tiên của người dùng.
5. Rà toàn bộ UI buổi học ở 390 × 844 và 768 × 1024; sửa chỗ vỡ.
6. Thêm chọn nhân vật người chơi (nam/nữ) trong thẻ lịch → `setPlayerSkin('player' | 'playerAlt')`.
