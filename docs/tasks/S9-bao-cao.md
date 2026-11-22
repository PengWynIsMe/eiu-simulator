# S9 — Báo cáo (luồng D, Wave 2)

typecheck / lint / build sạch. Không sửa scene/store/data/types/config, không cài gói, không commit. `App.tsx` không đổi.

## Đã làm
- **Nút "Buổi học" trong TopBar** (cạnh Đi bộ, cùng kiểu nút; chỉ hiện khi phase idle và không ở chế độ góp ý). Mở/đóng thẻ lịch qua store UI nhỏ `src/ui/lesson/lessonUi.ts` (`useLessonUi`). Nút nổi góc dưới-trái đã bỏ.
- **Thẻ lịch** (`LessonStarter` trong `LessonHud.tsx`): nằm dưới TopBar góc phải (mobile: full bề ngang trừ lề), có chọn nhân vật Nam/Nữ (`setPlayerSkin('player' | 'playerAlt')`) và nút 🔊/🔇.
- **Âm thanh** `src/ui/audio/sfx.ts` (Web Audio tự sinh): gõ phím (CodeLab `onChange`), "ting" đúng, "bụp" sai (chỉ cho bước question/exercise, nghe `useLessonStore.subscribe` trong `LessonLayer`), chuông 2 nốt khi vào `goToClass` và `summary`. `AudioContext` chỉ tạo ở `pointerdown`/`keydown` đầu tiên. Mute lưu `localStorage` (`campussim.muted`, try/catch). Nút `MuteButton` ở thẻ lịch và ở cột HUD buổi học (trên-trái) trong lúc học.
- **Chuẩn bị nút mobile "Ngồi (E)"**: xem hợp đồng bên dưới. Nút tạm "Ngồi vào chỗ" vẫn giữ (luồng A chưa xong).

## Hợp đồng sự kiện cho luồng A (ghế 3D)
- Luồng A phát: `window.dispatchEvent(new CustomEvent('campussim:seat-prompt', { detail: { visible: boolean } }))` — `true` khi người chơi đứng gần ghế có thể ngồi, `false` khi rời xa / đã ngồi.
- UI (`LessonHud`, pha `findSeat`, chỉ thiết bị cảm ứng `pointer:coarse`) hiện nút "Ngồi (E)" ở dưới-phải; bấm phát `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }))`. Luồng A cần nghe phím `e` (như InteriorHud).
- Khi luồng A xong: xóa nút tạm "Ngồi vào chỗ" trong `LessonHud.tsx` (khối `findSeat`) cùng chuỗi `TEXT.lessonSitDown` nếu không còn dùng.

## Chưa làm / lưu ý
- Mục 5 (rà 390×844 và 768×1024): chỉ rà bằng đọc code (thẻ lịch đã responsive, nút tối thiểu 44 px), CHƯA mở trình duyệt kiểm tra thật. Claude nên chơi thử ở hai cỡ này.
- Thẻ lịch không tự đóng khi bấm Đi bộ; nếu gây vướng thì đóng thẻ khi `walkMode` đổi.
- Chưa nghe thử âm thanh trong trình duyệt (âm lượng đặt thấp 0.04–0.25).
