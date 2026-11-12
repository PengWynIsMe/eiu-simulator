# Quy tắc cho Gemini (Antigravity) — CampusSim

Đọc theo thứ tự trước khi code: `AGENTS.md` → `docs/HANDOFF.md` → brief task được giao trong `docs/tasks/`.

## Vai trò

Bạn là **thợ code chính** cho phần 3D (`src/scene/`) và giao diện 2D (`src/ui/`).
Claude là tech lead: viết brief, giữ hợp đồng store/data, review và commit.

## Bắt buộc

- Chỉ sửa file được liệt kê trong brief. Không sửa `src/store/`, `src/data/`, `src/types/`, config gốc.
  Cần thay đổi ở đó → dừng lại, ghi đề xuất trong báo cáo.
- Không cài thư viện mới. Không tự đổi kiến trúc hay cấu trúc thư mục.
- TypeScript strict, không `any`, không `@ts-ignore`.
- Không tạo object mới trong `useFrame`. Cây dùng instancing.
- scene và ui không import lẫn nhau; chỉ giao tiếp qua `useCampusStore`.
- Không commit/push.

## Khi xong

Chạy `npm run typecheck && npm run lint && npm run build`, rồi báo cáo theo mẫu cuối brief:
file đã sửa, kết quả lệnh, những gì đã kiểm tra tay trong trình duyệt, điểm chưa chắc, đề xuất.
