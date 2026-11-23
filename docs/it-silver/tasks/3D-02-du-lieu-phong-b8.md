# 3D-02 — Dữ liệu phòng B8 và va chạm

Đọc: `docs/it-silver/PLAN-3D.md` (mục 1, 4), `data/silverWorld.types.txt`, `AGENTS.md` mục 5. Không thêm thư viện, không `any`, không tạo object trong `useFrame`. Không sửa JSON nội dung, `src/types/silver.ts`, `src/store/useSilverStore.ts`, `src/silver/**`, `src/ui/silver/**`. Không commit/push khi điều phối chưa bảo.

- Phụ thuộc: không (dữ liệu trong `docs/it-silver/data/classrooms-b8.json`)
- Người làm: Codex gpt-6-luna, ~1,5 giờ
- File được chạm: `src/data/classrooms.json`, `src/types/lesson.ts`, `src/data/phase2.ts`, `src/scene/interior/layouts/b8.ts`, test

## Làm

1. Đợt này chỉ thêm **406.B8** (3D-09 thêm ba phòng còn lại). Sao nguyên số từ file; bổ sung trường loader bắt buộc: `projector {u,v,y:3.3,size}` (B8 lấy u giữa màn và lớp, không vẽ), `ceilingLights: []`, `airConditioners: []`.
2. Kiểu: `frame: 'b11' | 'b8'`, `companionSeat?: string`, `standPoint?: LocalPoint`; loader kiểm `companionSeat` là ghế thật, không thuộc `npcSeats`, khác `playerSeat`.
3. `layouts/b8.ts`: thêm vật cản cho phòng có dữ liệu, cách như `addClassroom406Obstacles` của `b11.ts`, `isRailing: true`, nhưng **hai đầu mỗi khối thụt 0,25 m**; bàn GV không thụt. Vì `TANG_4_WALLS` là mảng cố định, đẩy thêm vào đó.

## Ví dụ

Khối Bắc hàng `deskU 86.9` (v −208.8…−205.8, bàn dài 1.0, sâu 0.6): `v1 = −208.8 − 0.5 + 0.25 + 0.3 = −208.75`, `v2 = −205.8 + 0.5 − 0.25 − 0.3 = −205.85`, `thickness 0.6`.

## Tiêu chí

- Test nạp `classrooms`; `getClassroom('406.B8')` đủ 32 ghế; 406.B11 không đổi.
- Test BFS 0,1 m, bán kính 0,4, từ (83,0; −200,3) tới (86,3; −205,0) qua `resolvePosition`: tới được; bàn hàng 2 chặn được.
- Phòng B8 khác và tầng khác: số tường không đổi.

## Cách kiểm

Đi bộ trong 406.B8: từ cửa Tây vào lối giữa tới ghế, quanh hàng cuối, không kẹt, không xuyên bàn.

## Cổng chung

`npm run typecheck && npm run lint && npm run build && npm run test:silver`. Báo cáo ngắn: file sửa, kết quả lệnh, ảnh, chỗ chưa chắc. Không bật dev server lâu hơn cần; tắt và đóng tab khi xong.
