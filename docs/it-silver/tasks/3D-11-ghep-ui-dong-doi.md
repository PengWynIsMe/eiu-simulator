# 3D-11 — Ghép UI đồng đội

Đọc: `docs/it-silver/PLAN-3D.md` (mục 1, 4), `data/silverWorld.types.txt`, `AGENTS.md` mục 5. Không thêm thư viện, không `any`, không tạo object trong `useFrame`. Không sửa JSON nội dung, `src/types/silver.ts`, `src/store/useSilverStore.ts`, `src/silver/**`, `src/ui/silver/**`. Không commit/push khi điều phối chưa bảo.

- Phụ thuộc: nhánh `it-silver/ui` đã về, 3D-07
- Người làm: Codex gpt-6.2-sol, ~3 giờ
- File được chạm: `src/ui/silver/{adapter,presentation}.ts` (hai điểm nối), `src/ui/silverWorld/**`, `src/App.tsx`

## Làm

1. Gộp `origin/main` → `it-silver/be` → `it-silver/nd-*` → `it-silver/ui`; chạy `check:silver --strict`.
2. `adapter.ts`: xuất `useSilverStore`. `presentation.ts`: `world` mặc định; `overlay` khi người chơi chọn "Chơi nhanh 2D" (nhớ bằng `localStorage['campussim.silver.mode']`) hoặc canvas mất context.
3. `WorldLayer` dùng các bước Choice/Question/Order/nghe của đồng đội bên trong khung thẻ; gắn nút "Chơi nhanh 2D" vào `data-silver-slot="home-extra"`. Vào từ 🎓, không cần `?silver3d`; **xóa** cửa vào dev.
4. Kiểm nút TopBar: 🎓 ẩn khi nmlt-01 chạy và ngược lại.
5. Nếu UI chưa làm ba việc trong `TIN-NHAN-UI.md`: sửa tối thiểu tại chỗ, ghi báo cáo, không viết lại.

## Tiêu chí

Home → 2.2 → đăng ký → tuần → 3D → sổ, bằng chuột và bàn phím; cả hai `mode`; chuyển mode giữa chừng giữ đúng cảnh.

## Cách kiểm

`UI-TU-KIEM.md` mục 2 ở `overlay`; chơi trọn ở `world`; hồi quy dưới.

**Hồi quy nmlt-01 (bắt buộc):** 📚 → Bắt đầu → trước thang máy T4 B11 → vào 406 → ghế viền vàng → E ngồi → thầy chào → 2 slide đổi trên TV → câu hỏi sai rồi đúng → 2 bài code → tổng kết → cả lớp ra; Esc thu máy, Esc đứng dậy, ngồi lại tiếp; nút "Ngồi (E)" ở cảm ứng.

## Cổng chung

`npm run typecheck && npm run lint && npm run build && npm run test:silver`. Báo cáo ngắn: file sửa, kết quả lệnh, ảnh, chỗ chưa chắc. Không bật dev server lâu hơn cần; tắt và đóng tab khi xong.
