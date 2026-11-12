# T09 — Chế độ đi bộ: nhân vật đi lại trong khuôn viên

- Người làm: **Codex (gpt-6-luna, medium) — luồng C**
- Worktree + nhánh riêng: `t09-di-bo` (song song với luồng A `t04a-3d`, luồng B `t04b-giao-dien` — đều là Gemini)
- Lý do: người dùng dùng touchpad, xoay/zoom camera khó xem chi tiết → muốn **điều khiển một nhân vật đi bộ**, camera bám sau lưng.

## Đọc trước

`AGENTS.md` (đặc biệt **Hệ tọa độ** và **Chạy nhiều agent song song**), `docs/HANDOFF.md`, `src/types/index.ts`, `src/data/index.ts`,
`src/store/useWalkStore.ts`, `src/scene/Campus.tsx` (đã gắn sẵn `<WalkMode/>`), `src/App.tsx` (đã gắn sẵn `<WalkHud/>`).

## Đã có sẵn (Claude làm — KHÔNG sửa)

- `useWalkStore`: `walkMode`, `toggleWalkMode()`, `exitWalkMode()`, `moveInput {x, y}`, `setMoveInput(x, y)`.
- `Campus.tsx`: khi `walkMode` → render `<WalkMode/>` **thay cho** `<CameraRig/>` (CameraControls tắt hẳn). Thoát → CameraRig gắn lại, tự về góc toàn cảnh.
- Nút bật/tắt "Đi bộ" trên TopBar do **luồng B** làm (gọi `toggleWalkMode`). Trong lúc chờ, thử bằng phím (xem dưới).
- Dữ liệu va chạm: `campus.buildings[i].shape.outer` (khung nền tòa, `[x, z]` mét), `campus.layout.boundary` (ranh giới trường).

## Chỉ được sửa / tạo

`src/scene/walk/**`, `src/ui/walk/**`. Không sửa file nào khác (kể cả `Campus.tsx`, `App.tsx`, `CameraRig.tsx`, `TopBar.tsx`, store, data).
Cần gì ngoài phạm vi → **đề xuất trong báo cáo**.

## Yêu cầu

### `src/scene/walk/WalkMode.tsx` (+ file phụ trong `scene/walk/` tùy ý)

1. **Nhân vật** low-poly đơn giản cao ~1.7 m (thân capsule/hộp + đầu cầu, áo màu xanh EIU `#1d4f91`), chân chạm mặt đất (y = 0.6 là mặt đường nội bộ; cỏ ~0.15 — chấp nhận đặt y cố định ~0.6).
   Có chuyển động đung đưa nhẹ khi đi (lắc thân hoặc nhún) cho sinh động; không cần animation xương.
2. **Điều khiển bàn phím**: `W/A/S/D` hoặc phím mũi tên = đi; `Shift` = chạy; tốc độ đi ~5 m/s, chạy ~12 m/s
   (khuôn viên rộng ~500 m — đi bộ thật 1.4 m/s quá chậm). Nhân vật quay mặt theo hướng di chuyển, xoay mượt.
3. **Điều khiển cần ảo**: đọc `useWalkStore((s) => s.moveInput)` (đọc qua `getState()` trong `useFrame` để không re-render).
4. **Camera bám sau lưng** (góc nhìn thứ ba): sau ~8 m, cao ~4 m, nhìn hơi chúc vào nhân vật; nội suy mượt (lerp/damp).
   Kéo chuột/vuốt ngang trên canvas = xoay camera quanh nhân vật; hướng "tiến" của W tính theo hướng camera.
   Con lăn/pinch = gần/xa trong khoảng 4–20 m. **Không** dùng CameraControls (đang tắt) — tự điều khiển `state.camera` trong `useFrame`.
5. **Va chạm**: không đi xuyên tòa nhà (điểm-trong-đa-giác với `shape.outer`, có bán kính nhân vật ~0.4 m → đẩy ra / trượt dọc tường),
   không ra khỏi `layout.boundary`. Hồ nước khu vực 1 (khoảng x 90..145, z -65..-10) chặn đi, **trừ** khi đứng trên cầu
   (2 đoạn `layout.roads` kind `bridge`, bề rộng ~3 m). Không cần va chạm cây.
6. **Điểm xuất phát**: trong cổng chính, khoảng `[245, 0, -28]`, mặt hướng vào quảng trường (hướng -X).
7. Phím tắt tạm cho đến khi có nút của luồng B: **`V`** = `toggleWalkMode()`; **`Esc`** = `exitWalkMode()`. Giữ cả hai phím này về sau.
8. Hiệu năng: **không tạo `new Vector3`/object trong `useFrame`** — tạo sẵn bằng `useMemo`/`useRef`. Gỡ listener bàn phím/chuột khi unmount.

### `src/ui/walk/WalkHud.tsx` (+ file phụ trong `ui/walk/`)

1. Chỉ hiện khi `walkMode`.
2. **Desktop**: thẻ nhỏ góc dưới trái: "W A S D / ↑↓←→: đi · Shift: chạy · Kéo chuột: xoay nhìn · Esc: thoát".
3. **Điện thoại / màn hình cảm ứng** (`pointer: coarse`): **cần điều khiển ảo** góc dưới trái (vòng tròn + núm kéo, Pointer Events),
   gọi `setMoveInput(x, y)` khi kéo, `setMoveInput(0, 0)` khi thả. Nút "Thoát đi bộ" góc dưới phải (`exitWalkMode`).
4. Tailwind, chữ tiếng Việt, không che mất nhân vật.

## Bẫy cần tránh

- Trục: **-Z là Bắc**, +X là Đông (cổng). `shape.outer` là `[x, z]`.
- Pointer drag xoay camera không được chặn thao tác của cần ảo (cần ảo nằm trong DOM, `stopPropagation`).
- Khi thoát đi bộ, phải `setMoveInput(0, 0)` để lần sau vào không tự chạy.
- Không cài thư viện (không thêm physics engine) — va chạm 2D tự viết là đủ.

## Tiêu chí xong

- [ ] `npm ci` (worktree mới), `npm run typecheck`, `npm run lint`, `npm run build` sạch; console sạch
- [ ] `npm run dev -- --port 5176`: nhấn `V` → nhân vật xuất hiện trong cổng, camera bám sau; `Esc` → về góc toàn cảnh
- [ ] Đi bằng WASD/mũi tên, Shift chạy; nhân vật không xuyên Block 3/4/5, không ra ngoài ranh giới, không lội hồ nhưng đi được trên 2 cầu
- [ ] Kéo chuột xoay camera quanh nhân vật; con lăn gần/xa
- [ ] Chế độ điện thoại (DevTools, cảm ứng): cần ảo điều khiển được, nút thoát chạy
- [ ] ≥ 50 FPS khi đi quanh khu vực 1 (ghi số đo)

## Báo cáo → `docs/tasks/T09-bao-cao.md`

```
File đã sửa/tạo:
Kết quả npm ci / typecheck / lint / build:
Đã kiểm tra tay (từng mục tiêu chí) + FPS:
Ảnh chụp màn hình (đường dẫn):
Chưa chắc / rủi ro:
Đề xuất (cần gì từ luồng khác hoặc Claude):
```
