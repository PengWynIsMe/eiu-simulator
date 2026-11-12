# PROJECT BRIEF — CampusSim (Giai đoạn 1)

> Bản gốc do người dùng soạn. Những chỗ được chỉnh nằm ở mục **"Điều chỉnh đã chốt"** cuối file —
> khi mâu thuẫn, mục đó và `AGENTS.md` được ưu tiên.

## 1. Mục tiêu
Web 3D cho học sinh/sinh viên tham quan khuôn viên trường và tìm hiểu từng ngành học:
ngành đó học những môn gì, làm những gì, ra trường làm việc gì.
Giai đoạn 1: bản MỘT người chơi, chạy trên trình duyệt (desktop + điện thoại tầm trung).

Tầm nhìn sau này (CHƯA làm ở giai đoạn này): nhiều người cùng tham quan, vào lớp học,
học theo chương trình của ngành, có voice/video.

## 2. Tech stack (bắt buộc, không tự thêm thư viện lớn khác)
- React 18 + TypeScript (strict) + Vite
- @react-three/fiber, @react-three/drei (Three.js)
- Zustand (state toàn cục)
- Tailwind CSS (UI 2D phủ lên canvas 3D)
- Dữ liệu: file JSON tĩnh trong /src/data (sau này chuyển sang Supabase)
- Mô hình 3D: GLB (low-poly). Khi chưa có model thì dùng khối hình cơ bản làm placeholder.

## 3. Phạm vi giai đoạn 1
1. Khuôn viên 3D low-poly: mặt đất, đường đi, 4–6 tòa nhà placeholder, cây cối đơn giản.
2. Điều khiển camera:
   - Desktop: kéo chuột xoay, cuộn để zoom (có giới hạn góc/khoảng cách).
   - Mobile: chạm kéo/pinch zoom.
3. Hover vào tòa nhà: highlight + hiện tên khoa/ngành.
4. Click vào tòa nhà: camera bay mượt tới tòa nhà, mở panel bên phải hiển thị:
   - Tên ngành, mô tả ngắn
   - Danh sách môn học theo năm (Năm 1 → Năm 4)
   - "Một ngày của sinh viên ngành này"
   - Kỹ năng cần có, cơ hội nghề nghiệp
   - Nguồn dữ liệu + ngày cập nhật
5. Nút "Quay lại khuôn viên" đưa camera về vị trí tổng quan.
6. Màn hình loading khi tải model.
7. Responsive: trên mobile, panel thành bottom sheet.

## 4. NGOÀI phạm vi (không làm)
Đăng nhập, backend, multiplayer, chat, voice/video, gameplay chấm điểm, nhiều trường.

## 5. Cấu trúc thư mục
Xem `AGENTS.md` mục 3 (bản đã cập nhật).

## 6. Schema dữ liệu (src/types/index.ts)
```ts
export interface Campus {
  id: string;
  name: string;
  buildings: Building[];
}

export interface Building {
  id: string;
  name: string;
  position: [number, number, number];
  size: [number, number, number];   // dùng cho placeholder
  color: string;
  modelUrl?: string;                // GLB, nếu có
  majorIds: string[];
}

export interface Major {
  id: string;
  name: string;
  shortDescription: string;
  curriculum: { year: number; courses: Course[] }[];
  dayInLife: string[];              // các mốc trong ngày
  skills: string[];
  careers: string[];
  source: { label: string; url?: string; updatedAt: string };
}

export interface Course {
  code?: string;
  name: string;
  credits?: number;
  description?: string;
}
```
campus.json chứa { campus: Campus, majors: Major[] }. Tạo dữ liệu MẪU cho 3 ngành:
Công nghệ thông tin, Quản trị kinh doanh, Thiết kế đồ họa (ghi rõ "dữ liệu mẫu").

## 7. State (Zustand)
Xem hợp đồng store trong `AGENTS.md` mục 4.
Component 3D và UI chỉ giao tiếp qua store, không truyền props chéo.

## 8. Quy tắc cho agent
Xem `AGENTS.md` mục 5–9.

## 9. Tiêu chí hoàn thành
- `npm run dev` chạy không lỗi; `typecheck`, `lint`, `build` đều sạch.
- Click 3 tòa nhà mẫu → panel hiện đúng dữ liệu ngành tương ứng.
- Chạy mượt (~60fps desktop, ≥30fps điện thoại tầm trung).
- Thêm một ngành mới chỉ cần sửa campus.json.

---

## Điều chỉnh đã chốt (2026-11-12)

1. **Thêm `selectedMajorId` + `selectMajor()` vào store.** Schema cho phép một tòa nhà có nhiều ngành (`majorIds: string[]`),
   brief gốc chỉ có `selectedBuildingId` nên panel không biết hiển thị ngành nào. Tòa nhà nhiều ngành → panel có tab.
2. **Thêm `setHovered()` vào store** (brief gốc có state `hoveredBuildingId` nhưng thiếu action).
3. **Camera dùng `<CameraControls>` của drei thay vì `OrbitControls` + tự viết nội suy.** Nó có sẵn bay mượt
   (`setLookAt(..., true)`), giới hạn góc/khoảng cách, hỗ trợ cảm ứng/pinch. Vẫn nằm trong drei — không thêm thư viện.
   Code `CameraRig` ngắn hơn nhiều và ít bug hơn.
4. **Thêm `src/data/index.ts`** làm lớp duy nhất đọc `campus.json`. Lý do kỹ thuật: TypeScript suy kiểu JSON
   `[1, 0, 2]` thành `number[]` chứ không phải `[number, number, number]`, nên cần một chỗ kiểm tra/chuyển kiểu.
   Lợi ích phụ: sau này chuyển sang Supabase chỉ sửa file này. Có kiểm tra cơ bản (ví dụ `majorIds` trỏ tới ngành
   không tồn tại → báo lỗi rõ ràng ở console khi dev) để "thêm ngành chỉ cần sửa JSON" an toàn.
5. **Thêm `src/scene/Trees.tsx`** (instancing) và `src/ui/text.ts` (chuỗi giao diện tiếng Việt).
6. **Mobile không có hover** → chạm là chọn; nhãn tên hiện khi đang chọn.
8. **(T01) Schema tòa nhà đổi sang khung nền thật.** Thay `position`/`size` bằng khung nền đa giác lấy từ
   OpenStreetMap (`layout.json`, sinh bằng `npm run layout`), ghép với thông tin viết tay trong `campus.json`
   (`zone`, `floors`, `kind`, `detailLevel`). Hệ tọa độ: mét, gốc tại tâm vòng xoay — xem `AGENTS.md` mục 3.
9. **(2026-11-12) Ưu tiên dựng mô hình EIU trước, tạm gác nội dung ngành học.** `majors` đang để trống.
   EIU không có ngành Thiết kế đồ họa → khi làm lại phần ngành, dùng ngành thật của EIU.
7. **Thêm ESLint + script `typecheck`/`lint`** để có cổng kiểm tra tự động cho agent.
   Không thêm bộ test (Vitest/Playwright) ở giai đoạn 1 — app chủ yếu là hình ảnh, kiểm tra tay hiệu quả hơn.
