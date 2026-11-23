# 3D-07 — UI màn chơi trong 3D

Đọc: `docs/it-silver/PLAN-3D.md` (mục 1, 4), `data/silverWorld.types.txt`, `AGENTS.md` mục 5. Không thêm thư viện, không `any`, không tạo object trong `useFrame`. Không sửa JSON nội dung, `src/types/silver.ts`, `src/store/useSilverStore.ts`, `src/silver/**`, `src/ui/silver/**`. Không commit/push khi điều phối chưa bảo.

- Phụ thuộc: 3D-01, 3D-05, 3D-06
- Người làm: Codex gpt-6.2-sol, ~3 giờ
- File được chạm: `src/ui/silverWorld/**`, `src/App.tsx` (1 import + 1 dòng)

## Làm

1. `WorldLayer`: chỉ khi `useSilverStore.screen==='play'`. Phase `travel`/`near`: thẻ góc trái (nơi, chặng, la bàn, mét, "Tới nơi luôn", "Bỏ qua cảnh", Thoát) + nút E ở cảm ứng. `engaged`: view theo `play.step`: say/choice → `DialogueView`; slide → `SlideView compact` + TV; question → `QuestionView`; code → `DesktopView` + `CodeLabView`, `setScreenOpen(true)`; order → (đợt 1: danh sách ↑↓ tối thiểu; đợt 2 thay bằng bước của đồng đội).
2. Nút: Tiếp, Đứng dậy, Thử lại, Xem lời giải, Gợi ý (không sao). Chống bấm đúp đã có ở store.
3. Phím ưu tiên: ô nhập > máy (Esc thu) > hộp xác nhận > E/1–4/Enter > Esc đứng dậy > di chuyển. Phím chỉ bị chặn khi engaged. Không `aria-modal` khi đi lại.
4. Chuỗi song ngữ ở `src/ui/silverWorld/text.ts`, gồm `arriveNow` "Tới nơi luôn/Go there now", `goTo` "Tới: {place}/Go to: {place}", `upTo` "Lên tầng {n}/Go up to floor {n}", `downTo` "Xuống tầng {n}/Go down to floor {n}", `sit` "Ngồi/Sit", `talk` "Nói chuyện/Talk", `look` "Xem/Look", `standUp` "Đứng dậy/Stand up", `skip` "Bỏ qua cảnh/Skip scene", `exit` "Thoát/Exit", `dist` "{n} m".
5. Đợt 1 chưa có UI đồng đội: cửa vào dev `?silver3d=lab1` (chỉ `import.meta.env.DEV`) tự gọi `load`, `startChapter('2.2','restart')`, `confirmRecap`, `confirmRegistration`, bỏ qua opening, `playNext`. Xóa ở 3D-11.
6. Khi chỉ đường dùng `nextWaypoint`; la bàn theo Bắc bản đồ như cũ.

## Tiêu chí

- Lab 1 chơi trọn bằng nội dung thật: `say/slide/code`, câu Han đúng, sang Lab 2 vẫn ngồi (Lab 2 có `question`: chạy được).
- Đứng dậy giữa bài, đi một vòng, ngồi lại đúng bước. Đổi VI/EN giữa bài đổi cả TV.
- 360×740, 1440×900 không che nhau; console sạch.

## Cách kiểm

Chơi bằng chuột, chỉ bàn phím, cảm ứng giả lập. Ảnh ở 1440 và 360, VI và EN, cho: đi, ngồi, thoại, slide, code, kết quả sai.

## Cổng chung

`npm run typecheck && npm run lint && npm run build && npm run test:silver`. Báo cáo ngắn: file sửa, kết quả lệnh, ảnh, chỗ chưa chắc. Không bật dev server lâu hơn cần; tắt và đóng tab khi xong.
