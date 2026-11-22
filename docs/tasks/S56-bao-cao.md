# Báo cáo S56 — Máy tính ảo + UI buổi học (luồng D)

File đã sửa/tạo:
- Mới: `src/ui/desktop/{tokenize.ts, CodeBlock.tsx, useTypewriter.ts, CodeLab.tsx, EiuDesktop.tsx}`
- Mới: `src/ui/lesson/{LessonLayer.tsx, LessonHud.tsx (gồm LessonStarter + la bàn), DialogueBox.tsx, SlideViewer.tsx, QuestionCard.tsx, LessonSummary.tsx, ExitButton.tsx, TeacherBubble.tsx}`
- Sửa: `src/ui/text.ts` (chỉ thêm nhóm `// Buổi học`, `// Tổng kết`, `// Máy ảo`), `src/App.tsx` (1 import + `<LessonLayer />` sau `<InteriorHud />`).
- Lưu ý: worktree này được tạo từ commit chưa có nền Giai đoạn 2 (chưa commit ở main). Để build được tôi COPY NGUYÊN VĂN (không sửa nội dung) từ checkout chính: `src/store/useLessonStore.ts`, `useWalkStore.ts`, `src/types/{index,lesson}.ts`, `src/data/{index.ts,phase2.ts,characters.json,classrooms.json,npc-routes.json,lessons/}`, `docs/PLAN-GIAI-DOAN-2.md`, brief S56. Các file này sẽ hiện trong diff nhưng là bản của Claude; khi gộp, bỏ qua/lấy bản main.

Kết quả typecheck / lint / build: cả ba sạch (build chỉ có cảnh báo chunk > 500 kB có sẵn từ trước).

Đã kiểm tra tay:
- Không có trình duyệt, nên rà luồng phase → component theo bảng brief (xem dưới) và đọc lại store.
- Tokenizer kiểm bằng script Node (esbuild) ngoài `src/`: chuỗi/chú thích chứa từ khóa (`"for \"int\" // x"`, `// for if`) không bị tô sai; `foreach`, `i3` không bị coi là từ khóa; số thực `3.5` đúng; chuỗi chưa đóng không làm hỏng; ghép lại token == nguyên văn.
- Luồng: idle (nút + thẻ lịch, ẩn khi reviewMode) → goToClass (HUD + la bàn + "Tới lớp ngay") → findSeat ("Ngồi vào chỗ") → dialogue (chữ chạy 30 ký tự/s, bấm để hiện hết, rồi 2 nút) → lecture (2 slide, "Tiếp ›") → question (sai tô đỏ cho chọn lại, đúng tô xanh + "Tiếp ›") → exercise (EiuDesktop: đăng nhập 0.6 s → Code Lab; ▶ Chạy/Enter → "Đang biên dịch…" 0.5 s → gõ dần output; 💡 Hỏi thầy −1 ⭐; đúng → "Bài tiếp ›"/"Nộp bài ›") → summary (sao, mm:ss, số gợi ý, con dấu đóng) → "Về khuôn viên".
- Esc ở máy ảo: listener pha capture + stopPropagation để WalkHud không thoát chế độ đi bộ; nút "Mở máy tính" hiện lại. EiuDesktop luôn mount suốt pha exercise (ẩn bằng `hidden`) nên giữ đăng nhập + code đang gõ.
- Mobile: máy ảo full màn hình dưới `sm`, panel hướng dẫn nằm trên code, nút cao >= 44 px, ô input `scrollIntoView` khi focus. Chưa thử thật ở 390 x 844.

Chưa chắc / rủi ro:
- Chưa chạy trong trình duyệt: cần Claude chơi thử thật (đặc biệt bố cục mobile, vị trí nút "Buổi học" nổi so với WalkHud/joystick ở góc dưới-trái, z-index so với InteriorHud).
- La bàn: mũi tên theo hướng Bắc bản đồ (không có hướng camera trong store), đúng như brief. Nếu người chơi ở tầng khác tầng phòng thì hiện thêm "Lên tầng 4".
- Câu thầy đáp lại ("reply" của bước dialogue) thực tế hiện ở bước KẾ TIẾP, tức là bước `lecture` trong nmlt-01, nên tôi làm `TeacherBubble` dùng chung cho cả DialogueBox lẫn SlideViewer (3 s).
- Gõ vào ô input trong máy ảo: `onKeyDown` stopPropagation để phím WASD không lọt xuống scene (nếu scene nghe phím ở window). Nếu scene nghe ở pha capture thì vẫn lọt, cần luồng A kiểm.
- Emoji trong chuỗi UI (📚 💡 ⭐ 🖥) theo brief; hiển thị phụ thuộc font hệ thống.

Đề xuất đổi store: không bắt buộc. Gợi ý nhỏ: (1) lưu `lastResult` kèm id bước để bong bóng của dialogue không phải đoán; (2) nếu muốn la bàn xoay theo hướng nhìn, thêm `playerYaw` vào `playerPos` hoặc `useWalkStore`.
