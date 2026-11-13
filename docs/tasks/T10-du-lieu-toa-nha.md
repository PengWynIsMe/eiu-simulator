# T10 — Chuyển thông tin chi tiết tòa nhà từ giao diện sang dữ liệu + ghi nguồn

- Người làm: **Codex (gpt-6-luna, medium)**
- Worktree + nhánh riêng: `t10-du-lieu-toa-nha`. Chạy `npm ci` trước; dev ở cổng **5176**.
- Bối cảnh: commit `7436d2a` của đồng nghiệp thêm panel thông tin tòa nhà rất tốt, nhưng **~600 dòng nội dung** (danh sách phòng theo tầng của 19 công trình)
  nằm trong `src/ui/text.ts` (`BUILDING_SPECS` + các interface `BuildingDetailSpec`, `BuildingFloorSpec`, `FloorGroupSpec`, `FloorRoomEntry`).
  Quy tắc dự án (`AGENTS.md` mục 4–5): **nội dung nằm trong `src/data/`, đọc qua `src/data/index.ts`, có kiểm tra cấu trúc**. Và các con số cụ thể chưa có nguồn.

## Mục tiêu

1. Nội dung chuyển sang `src/data/building-details.json`, **giữ nguyên 100% chữ và thứ tự** (không sửa, không thêm, không bớt nội dung).
2. Mỗi tòa có trường **nguồn**; hiện tại tất cả là "chưa xác minh". Panel hiện nhãn đó để người xem biết.
3. Giao diện panel **trông y như cũ**, chỉ thêm dòng nguồn ở cuối.

## Được sửa / tạo

- `src/types/index.ts` — thêm kiểu (đặt tên tiếng Anh như các kiểu khác):
  ```ts
  export interface RoomEntry { code?: string; name: string }
  export interface RoomGroup { title?: string; rooms: RoomEntry[] }
  export interface BuildingFloorDetail { floorNumber: number; label: string; elevation: string; architecturalNote: string; groups: RoomGroup[] }
  export interface InfoSource { status: 'xac-minh' | 'chua-xac-minh'; label: string; url?: string }
  export interface BuildingDetail { subtitle: string; facts: string[]; floors?: BuildingFloorDetail[]; source: InfoSource }
  ```
- `src/data/building-details.json` (mới): `{ "<buildingId>": BuildingDetail, ... }` — đúng 19 id như `BUILDING_SPECS` hiện tại.
  Mọi tòa: `"source": { "status": "xac-minh", "label": "Số liệu thực tế — đồng nghiệp Hieuthao63d xác minh, 2026-11-13" }` (người dùng xác nhận).
- `src/data/index.ts` — nạp + kiểm tra file mới bằng các hàm trong `./validate` (như cách đang kiểm `campus.json`);
  báo lỗi nếu id không có trong `campus.buildings`. Xuất hàm mới: `getBuildingDetail(id: string): BuildingDetail | undefined`.
- `src/ui/BuildingPanel.tsx` — đọc qua `getBuildingDetail` thay cho `BUILDING_SPECS`. Cuối panel thêm dòng nguồn:
  `status === 'chua-xac-minh'` → nhãn vàng "Chưa xác minh" + `label`; `xac-minh` → nhãn xanh + `label` (+ link nếu có `url`).
- `src/ui/text.ts` — **xóa** `BUILDING_SPECS` và 4 interface kèm theo; **giữ** `TEXT`, `BUILDING_PANEL_TEXT`; thêm chuỗi cho dòng nguồn.

## KHÔNG được sửa

Mọi file khác (đặc biệt `src/scene/**`, `src/store/**`, `campus.json`, `layout.json`, `docs/**` — Claude cập nhật tài liệu). Không cài thư viện. Không commit/push.

## Cách đảm bảo "giữ nguyên nội dung"

Trước khi xóa `BUILDING_SPECS`: viết **script tạm** (đặt ngoài `src/`, ví dụ `scratch/compare.mjs`, không commit, xóa sau) so sánh
dữ liệu cũ và file JSON mới — bỏ qua trường `source` — phải trùng khớp tuyệt đối (so `JSON.stringify` theo từng id).
Gợi ý lấy dữ liệu cũ: build tạm hoặc chép mảng ra JSON trước bằng cách in từ trình duyệt; không cần thư viện mới. Ghi kết quả so sánh vào báo cáo.

## Tiêu chí xong

- [ ] `npm run typecheck`, `npm run lint`, `npm run build` sạch; console trình duyệt sạch
- [ ] Script so sánh: 19/19 tòa trùng khớp (ghi số liệu vào báo cáo), script đã xóa
- [ ] `grep -n "BUILDING_SPECS" -r src` không còn kết quả
- [ ] Bấm Block 3, Block 11, Căn tin: panel hiển thị như trước + dòng "Chưa xác minh"; tab tầng chuyển được
- [ ] Sửa thử 1 ký tự sai kiểu trong `building-details.json` (vd `floorNumber: "1"`) → app báo `Dữ liệu sai ở ...` rõ ràng; rồi hoàn tác

## Báo cáo → `docs/tasks/T10-bao-cao.md`

```
File đã sửa/tạo:
Kết quả typecheck / lint / build:
Kết quả so sánh nội dung (x/19):
Đã kiểm tra tay:
Chưa chắc / rủi ro:
Đề xuất:
```
