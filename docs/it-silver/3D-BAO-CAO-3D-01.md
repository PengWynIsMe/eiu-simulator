# 3D-01 — WalkMode dùng Activity

Nhánh `PengWynIsMe/it-silver-3d-01`, từ `b1cddc2` của 3D-00. Các commit triển khai là `46608b4`, `3433a05`, `10f0052`, `2568adf` và `b727056`. Đã giữ hợp đồng trong `silverWorld.types.txt`.

## File sửa

- `src/main.tsx` khởi động `startLessonBridge(b11ToWorld)` trước khi render app.
- `src/scene/walk/WalkMode.tsx` và `PlayerCharacter.tsx` dùng Activity cho dịch chuyển, di chuyển khi tương tác, tư thế và camera. Dịch chuyển áp dụng một lần theo id, kể cả trước khi WalkMode mount. Camera talk/look quay trong 0,6 giây và giữ góc cho đến khi hoạt động kết thúc.
- `src/scene/walk/activityControl.ts` kiểm cùng tòa, cùng tầng và bán kính 1,2 m cho ghế hoặc 1,8 m cho talk/look. Escape thu máy rồi đứng dậy qua hai lần bấm riêng. Giữ phím không tự đứng dậy hay thoát đi bộ.
- `src/scene/interior/types.ts` và `src/ui/interior/InteriorHud.tsx` thêm điểm tương tác `activity`. Nút gọi `interact()`, lấy nhãn VI/EN từ Activity và nằm bên phải cần ảo ở viewport nhỏ.
- `src/silverWorld/lessonBridge.ts` đổi hướng dẫn khi người chơi vào khung phòng. Tầm ngồi đến từ WalkMode. `Tới lớp ngay` vẫn đổi hướng dẫn tại vị trí hiện tại. Kết thúc buổi khi đang ngồi đưa người chơi ra lối đi cạnh ghế.
- `scripts/silver/tests/activity.test.mjs` kiểm tầm ghế, tầm talk/look, phím Escape tự lặp, trạng thái khi vào phòng và vị trí khi kết thúc buổi.

## Cổng kiểm tra

| Lệnh | Kết quả |
| --- | --- |
| `npm ci` | Cài thành công. Npm báo 13 mục kiểm toán phụ thuộc, như 3D-00. |
| `npm run typecheck` | Đạt |
| `npm run lint` | Đạt |
| `npm run build` | Đạt |
| `npm run test:silver` | 73 ca đạt |
| `npm run check:silver -- --strict` | Đạt, còn 6 cảnh báo nội dung VI trùng EN của 3D-00 |
| So khớp hợp đồng kiểu và tìm phụ thuộc cũ trong WalkMode/PlayerCharacter | Hợp đồng giống bản đã duyệt. Tìm `406`, `useLessonStore`, `b11ToWorld` trong `src/scene/walk/*.tsx` cho 0 kết quả. |

## Chơi trên preview trong Orca

- Bàn phím và chuột. Bắt đầu ở sảnh thang máy tầng 4 B11, mở bảng bằng E, xuống tầng 3 rồi lên tầng 4. Đi vào 406 bằng phím di chuyển, bấm E khi còn xa và vẫn đứng. Đến ghế viền vàng, E mở lời chào. Chọn sai rồi đúng ở câu hỏi, giải hai bài code và đạt 3 sao. Xác nhận texture TV đổi giữa hai slide.
- Cảm ứng giả lập 360 × 800, `pointer: coarse`. Chọn tầng bằng nút thang máy và đi từ sảnh vào phòng qua cần ảo. Bấm **Ngồi (E)**, chơi đến tổng kết 3 sao. Nút nằm ngoài vùng cần ảo. Cần ảo được kiểm bằng sự kiện con trỏ cảm ứng trên trình duyệt máy tính.
- Escape lần đầu thu máy và giữ tư thế ngồi ở cao độ 0,40 m. Escape lần hai đặt nhân vật ở lối đi, cao độ 0 m. Bấm nút **Ngồi (E)** trên cả desktop và mobile mở lại đúng bài tập.
- Trên bản preview cuối, 18/18 bạn học đã ra cửa sau tổng kết. Bấm **Về khuôn viên** đặt người chơi đứng ở lối đi cạnh ghế, vẫn ở tầng 4. Console Orca không có lỗi hoặc cảnh báo trong các lượt kiểm.
- Ngoài buổi học, thử thang máy B11, leo cầu thang giữa phía Bắc B11 từ tầng 3 lên tầng 4 và B8 từ tầng 1 lên tầng 2. Ở B8, vế thứ hai đi được sát mép trong do tường tầng 1. Ngoài trời, kiểm phím C qua cả ba góc nhìn, cuộn để zoom và Shift để nới FOV khi chạy.
- Trên dev, dùng hai Activity `talk` và `look` tạm để kiểm nhân vật quay về đích, camera xoay rồi giữ cùng hướng, phím di chuyển bị khóa khi đang tương tác và hoạt động lại khi kết thúc. Ca này dùng dữ liệu thử vì luồng Silver 3D do 3D-05 nối sau.

Ảnh Orca lưu tại `/tmp/campussim-3d-01/` trên máy chạy task gồm `truoc-thang-may.png`, `ban-phim-ngoi.png`, `sat-man-hinh.png`, `dung-day.png`, `cam-ung-nut-ngoi.png`, `tong-ket-ban-phim.png`, `tong-ket-cam-ung.png`, `cau-thang-b11.png` và `cau-thang-b8.png`. Ảnh sát màn hình tạm ẩn lớp máy tính ảo bằng CSS chỉ lúc chụp để thấy camera 3D phía dưới.

Đã tắt preview và dev, đóng các tab Orca của worktree. Các commit nằm trên nhánh hiện tại, chờ điều phối ghép.
