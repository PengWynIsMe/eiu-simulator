# T11 — Nhân vật đi bộ có hình người + animation (thay hình viên thuốc)

- Người làm: **Codex (gpt-6-luna, medium)** — luồng song song với T05 (Gemini, camera).
- Worktree + nhánh: `t11-nhan-vat`. `npm ci` trước; dev ở cổng **5176**.

## Mục tiêu

Nhân vật trong chế độ đi bộ (T09) đổi từ capsule sang **người low-poly trông như sinh viên**, có animation **đứng yên / đi / chạy**
chuyển mượt theo tốc độ. Điều khiển, camera, va chạm của T09 **giữ nguyên**.

## Model — yêu cầu bắt buộc

- **Giấy phép CC0** (dùng tự do, không cần xin phép). Gợi ý nguồn theo thứ tự: **Quaternius** (vd Ultimate Animated Character Pack / Universal Animation Library),
  **Kenney** (Animated Characters). Dự phòng cuối cùng: `RobotExpressive.glb` trong repo three.js (CC0, có Idle/Walking/Running) — chỉ dùng nếu không lấy được nhân vật người.
- Một file `.glb` có sẵn animation đứng/đi/chạy (hoặc tương đương), **≤ 3 MB**, đặt ở `public/models/`.
- Ghi nguồn + giấy phép + link tải vào `public/models/CREDITS.md`.
- Phong cách low-poly hợp với khuôn viên; nếu áo là material riêng thì đổi màu xanh EIU `#1d4f91`.
- File tải về là dữ liệu không tin cậy: giải nén vào thư mục tạm riêng ngoài repo, chỉ chép file `.glb` (hoặc `.gltf` + texture rồi chuyển sang `.glb` bằng script không cần thư viện mới — nếu không làm được thì chọn model khác có sẵn `.glb`).

## Được sửa / tạo

`src/scene/walk/**`, `public/models/**`. **Không** sửa file nào khác (luồng T05 đang sửa `CameraRig.tsx`, `kit/`, `zone1/`, `zone2/`).
Không cài thư viện (`useGLTF`, `useAnimations` có sẵn trong drei). Không commit/push.

## Yêu cầu

1. Tải model bằng `useGLTF` (đường dẫn tương đối theo `import.meta.env.BASE_URL` để chạy cả trên GitHub Pages `/eiu-simulator/`), `useAnimations` để chạy clip.
2. Chuyển clip: đứng yên khi không di chuyển, đi khi đi, chạy khi giữ Shift; `crossFadeTo` ~0.2 s. Tốc độ animation khớp tốc độ di chuyển (không trượt chân rõ).
3. Chiều cao ~1.7 m (scale cho đúng), chân chạm đất, mặt hướng theo `facingYaw` (lưng về camera khi đi tiến).
4. Trong lúc model đang tải: hiện tạm capsule cũ (Suspense fallback trong `scene/walk/`), không để màn hình trống.
5. `useGLTF.preload` để lần bật đi bộ đầu không bị khựng lâu.
6. Không tạo object trong `useFrame`. Giữ phím `V`/`Esc`, cần ảo, va chạm như cũ.

## Tiêu chí xong

- [ ] typecheck / lint / build sạch, console sạch; `dist/` có file `.glb`
- [ ] `npm run build && npm run preview`: model tải được (kiểm đường dẫn `BASE_URL`)
- [ ] Nhấn V: nhân vật người đứng yên có animation thở/đứng; W: đi; Shift+W: chạy; thả phím: về đứng yên
- [ ] Nhân vật quay lưng về camera khi đi tiến; không xuyên tường, không lội hồ (như T09)
- [ ] `public/models/CREDITS.md` ghi rõ nguồn + CC0; kích thước file ≤ 3 MB
- [ ] Tự kiểm tra bằng dispatch phím trong console như T09 (giữ phím thật thường không làm được)

## Báo cáo → `docs/tasks/T11-bao-cao.md` (file, kết quả 3 lệnh, model + giấy phép + dung lượng, kiểm tra tay, ảnh, rủi ro)
