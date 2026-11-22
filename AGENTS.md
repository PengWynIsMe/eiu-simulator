# AGENTS.md — CampusSim

File này là **nguồn sự thật** cho mọi agent (Claude, Gemini/Antigravity, Codex).
Mới vào dự án (người hoặc agent trên máy khác)? Đọc `docs/ONBOARDING.md` trước.
Đọc file này trước, rồi đọc `docs/HANDOFF.md` để biết đang ở đâu, rồi đọc brief của task được giao trong `docs/tasks/`.

- Brief sản phẩm gốc + các điều chỉnh đã chốt: `docs/BRIEF.md`
- Lộ trình và danh sách task: `docs/ROADMAP.md`
- Trạng thái hiện tại / việc tiếp theo: `docs/HANDOFF.md`

---

## 1. Dự án là gì

Web 3D low-poly cho học sinh/sinh viên tham quan khuôn viên trường, click vào tòa nhà để xem ngành học:
học môn gì theo năm, một ngày của sinh viên, kỹ năng, nghề nghiệp.
Giai đoạn 1: **một người chơi, chạy trên trình duyệt, không backend.**

Nguyên tắc số 1: **đơn giản, chạy mượt, dễ thêm ngành mới.** Không over-engineer.

## 2. Tech stack (khóa — không tự thêm thư viện)

| Phần | Dùng |
| --- | --- |
| Khung | React 18 + TypeScript strict + Vite |
| 3D | three, @react-three/fiber, @react-three/drei |
| State | zustand |
| UI 2D | Tailwind CSS |
| Dữ liệu | JSON tĩnh trong `src/data/` |
| Model | GLB low-poly trong `public/models/`; chưa có thì dùng khối hộp placeholder |

Muốn thêm thư viện → ghi đề xuất vào báo cáo task, **chờ người dùng đồng ý**. Không tự cài.

## 3. Cấu trúc thư mục

```
src/
  main.tsx
  App.tsx              # ghép <Canvas> (scene) + lớp UI 2D phủ lên
  scene/               # CHỈ code 3D (chạy bên trong <Canvas>)
    Campus.tsx         # gom mọi thứ trong scene
    Ground.tsx         # mặt đất + đường đi
    Building.tsx       # 1 tòa nhà (placeholder hộp hoặc GLB)
    Trees.tsx          # cây, bắt buộc dùng instancing
    CameraRig.tsx      # điều khiển camera, bay tới tòa nhà / quay về
    kit/               # mảnh dựng dùng lại: thân block, mái chìa, lam che, hành lang mái che, cầu...
    zone1/             # chi tiết riêng khu vực 1 (cổng, hồ nước + cầu, nhà xe...)
  ui/                  # CHỈ code 2D (DOM + Tailwind, nằm ngoài <Canvas>)
    TopBar.tsx
    MajorPanel.tsx     # panel phải (desktop) / bottom sheet (mobile)
    Loading.tsx
    text.ts            # chuỗi giao diện tiếng Việt (nút, tiêu đề cố định)
  store/
    useCampusStore.ts  # zustand: hover / chọn tòa nhà / chọn ngành
  data/
    campus.json        # thông tin viết tay: tên, khu vực, số tầng, màu, mức dựng, ngành
    layout.json        # hình học SINH TỰ ĐỘNG từ OpenStreetMap — không sửa tay
    index.ts           # nạp + kiểm tra + ghép 2 file trên, xuất dữ liệu đã có kiểu + hàm tra cứu
  types/
    index.ts           # Campus, Building, Layout, Road, Major, Course, Vec2
scripts/
  osm-to-layout.mjs    # `npm run layout`: tải OSM → src/data/layout.json
public/
  models/              # file .glb
references/            # ảnh/sơ đồ tham khảo (ảnh không lên git) — xem docs/ASSETS.md
```

### Hệ tọa độ (bắt buộc dùng thống nhất)

- **1 đơn vị = 1 mét.** Gốc `[0, 0, 0]` = **tâm vòng xoay** (quảng trường tròn, bán kính ≈ 80 m).
- **+X = Đông** (phía cổng chính, đường Nam Kỳ Khởi Nghĩa), **-Z = Bắc** (phía B8–B11, đường Lê Duẩn), **Y = lên trên**.
- `Vec2 = [x, z]` là điểm trên mặt đất. Chiều cao tòa = `floors × FLOOR_HEIGHT` (3.8 m).
- Khung nền tòa (`building.shape`) lấy từ OSM, đã đúng tỷ lệ — **không tự đặt lại vị trí/kích thước tòa nhà**.

## 4. Kiến trúc (luồng dữ liệu một chiều)

```
campus.json ──► data/index.ts ──► (scene đọc danh sách tòa nhà)
                    │
                    └────────────► (ui đọc nội dung ngành theo id)

scene/Building ──hover/click──► store ◄──đọc── ui/MajorPanel
scene/CameraRig ◄──đọc selectedBuildingId── store ◄──clearSelection── ui (nút Quay lại)
```

- **scene và ui KHÔNG import lẫn nhau.** Chúng chỉ nói chuyện qua `store` (và cùng đọc `data`).
- Store chỉ giữ **id** (chuỗi), không giữ object dữ liệu. Muốn lấy dữ liệu thì tra bằng hàm trong `data/index.ts`.
- Nội dung ngành học **chỉ** nằm trong `campus.json`. Không viết cứng tên ngành/môn học trong component.

### Hợp đồng store (do Claude sở hữu — muốn đổi phải đề xuất)

```ts
hoveredBuildingId: string | null
selectedBuildingId: string | null
selectedMajorId: string | null        // 1 tòa nhà có thể có nhiều ngành
setHovered(id: string | null): void
selectBuilding(id: string): void      // đồng thời chọn ngành đầu tiên của tòa nhà
selectMajor(id: string): void         // đổi tab ngành trong panel
clearSelection(): void                // về tổng quan
```

### Hợp đồng data (`src/data/index.ts`)

```ts
FLOOR_HEIGHT: number                  // 3.8 m
campus: Campus                        // campus.buildings, campus.layout (roads, boundary, roundabout, parking)
majors: Major[]
getBuilding(id: string): Building | undefined
getMajor(id: string): Major | undefined
getMajorsOfBuilding(buildingId: string): Major[]
getBuildingsInZone(zone: number): Building[]
getBuildingDetail(id: string): BuildingDetail | undefined   // (từ T10) phòng theo tầng + nguồn, từ building-details.json
```

`Building` = thông tin trong `campus.json` + `shape` (`outer`, `holes`), `center: Vec2`, `height` (m).
JSON sai cấu trúc → app báo lỗi rõ ràng ngay khi mở (`Dữ liệu sai ở ...`).

## 5. Quy tắc code

1. TypeScript strict, **không `any`**, không `@ts-ignore`. Dùng `unknown` + thu hẹp kiểu nếu cần.
2. Component 3D trong `scene/`, 2D trong `ui/`. Không trộn. Không dùng `<Html>` của drei để làm panel lớn — `<Html>` chỉ cho nhãn nhỏ (tên tòa nhà khi hover).
3. **Hiệu năng:**
   - Không tạo object mới (`new Vector3`, mảng, object) bên trong `useFrame` — tạo sẵn bằng `useMemo`/`useRef` bên ngoài.
   - Cây và vật trang trí lặp lại dùng instancing (`<Instances>` của drei hoặc `instancedMesh`).
   - Tái sử dụng geometry/material khi có thể. Không bật shadow realtime cho mọi thứ; ưu tiên ánh sáng đơn giản.
   - `<Canvas dpr={[1, 2]}>` để điện thoại không render quá nặng.
4. Không setState của React trong `useFrame`. Hover/click dùng event của R3F (`onPointerOver`, `onPointerOut`, `onClick`) và gọi action của store.
5. Mobile không có hover: chạm = chọn. Nhãn tên phải hiện được cả khi tòa nhà đang được chọn.
6. Text giao diện bằng tiếng Việt, đặt trong `ui/text.ts`.
7. Component ngắn, một việc. Không tạo abstraction "để sau dùng" (không HOC, không factory, không context riêng).
8. Không đụng file ngoài phần được giao trong brief task.

## 6. Phân vai & quyền sở hữu file

| Agent | Vai trò | Sở hữu |
| --- | --- | --- |
| **Claude** (Claude Code) | Tech lead / điều phối: viết brief task, dựng nền, giữ hợp đồng, review, chạy kiểm tra, commit | `AGENTS.md`, `CLAUDE.md`, `docs/**`, config gốc (`package.json`, `vite.config.ts`, `tsconfig*.json`, `tailwind`/`eslint` config), `src/types/**`, `src/store/**`, `src/data/**`, `src/main.tsx`, `scripts/**` |
| **Gemini** (Antigravity) | **Thợ code chính** cho 3D và giao diện | `src/scene/**`, `src/ui/**`, `src/App.tsx`, `public/models/**`, `src/index.css` |
| Codex (tùy chọn) | Reviewer độc lập khi cần ý kiến thứ hai | Không sửa code, chỉ báo cáo |
| **Claude Sonnet** (agent nền, từ 2026-11-23) | Thợ code song song với Gemini trong Giai đoạn 2, mỗi agent một worktree | **Chỉ** các thư mục ghi trong brief luồng (`docs/PLAN-GIAI-DOAN-2.md` mục 6), không giao với Gemini |

- Cần đổi file không thuộc quyền mình (vd Gemini cần thêm action vào store) → **dừng, ghi đề xuất trong báo cáo**, Claude sẽ sửa hợp đồng rồi giao lại.
- Mỗi lúc tối đa **1 agent code trên cùng một nhóm file**.

### Chạy nhiều agent song song

- Mỗi luồng = **một git worktree + một nhánh riêng** (Orca: `orca worktree create --agent ...`), thư mục cạnh repo chính.
- Mỗi luồng có **danh sách file được sửa riêng, không giao nhau** (ghi trong brief luồng). Tối đa **2–3 luồng** cùng lúc.
- Worktree mới: chạy `npm ci` trước; `npm run dev -- --port <cổng riêng>` (luồng A 5174, luồng B 5175...).
- Cần sửa file của luồng khác hoặc file của Claude → **dừng, ghi đề xuất trong báo cáo**, không tự sửa.
- Hai luồng cần nói chuyện với nhau → qua store (Claude thêm action trước khi giao), không import chéo.
- Claude gộp các nhánh theo thứ tự, chạy lại 3 cổng kiểm tra trên bản đã gộp, rồi mới merge `main`.

## 7. Quy trình một task

1. Claude viết brief `docs/tasks/TNN-ten-task.md` theo `docs/tasks/_TEMPLATE.md` và cập nhật `docs/HANDOFF.md`.
2. Agent được giao đọc `AGENTS.md` → `HANDOFF.md` → brief, rồi code **chỉ trong phạm vi brief**.
3. Agent tự chạy kiểm tra (mục 8) và **báo cáo** theo mẫu cuối brief: file đã sửa, kết quả lệnh kiểm tra, điểm chưa chắc, đề xuất.
4. Claude review diff + chạy lại kiểm tra + mở trình duyệt xem thật → sửa nhỏ hoặc trả lại agent.
5. Người dùng xem thử → đồng ý → Claude commit (chỉ khi người dùng cho phép).

Task nhỏ (1–2 file, chỉ chỉnh giao diện) có thể bỏ brief dài, chỉ cần 3–5 dòng trong `HANDOFF.md`.

## 8. Cổng kiểm tra (bắt buộc trước khi báo xong)

```bash
npm run typecheck   # tsc --noEmit, phải 0 lỗi
npm run lint        # eslint, phải 0 lỗi
npm run build       # vite build, phải thành công
```

Thêm kiểm tra thủ công trong trình duyệt (`npm run dev`) theo checklist của brief:
mở DevTools console không có lỗi/warning đỏ; thử chế độ thiết bị di động (Chrome DevTools → Toggle device toolbar).

## 9. Git

- Nhánh mặc định `main`. Mỗi task một nhánh: `tNN-ten-ngan` (vd `t02-scene-placeholder`).
- Agent **không tự commit/push/merge**. Claude commit sau khi người dùng duyệt.
- Không commit `node_modules/`, `dist/`, file `.env`.

## 10. Bàn giao

`docs/HANDOFF.md` luôn phải trả lời được 3 câu: **đang ở task nào, ai đang làm, việc tiếp theo chính xác là gì.**
Cập nhật nó mỗi khi xong/chuyển task, để đổi agent hoặc đổi tài khoản vẫn làm tiếp được.
