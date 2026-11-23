# PLAN-3D — IT Silver chơi trong khuôn viên, kiểu `nmlt-01`

Trạng thái: chủ dự án đã duyệt 24/11/2026. Bổ sung cho `PLAN.md`; chỗ nào trái nhau về màn chơi thì theo file này.

> Mỗi kỳ 1–2 môn có gameplay "(dạng style giống với cái có sẵn nhập môn lập trình ấy) nhưng sẽ dài từ 3-4 bài học và có thể có thi cuối kỳ". Đã chốt thêm: **"đi tới phòng, gặp bạn/thầy"**.

Lỗi của plan trước: biến cả trải nghiệm thành màn 2D, không đi lại, không lớp, không người. Dữ liệu, logic và nội dung đã làm **vẫn dùng được nguyên**; thiếu là lớp 3D đứng giữa store và người chơi.

Kèm theo: `data/classrooms-b8.json` (số đo 4 phòng), `data/stages.json` (32/32 cảnh của nội dung đã duyệt, đã đối chiếu id), `data/silverWorld.types.txt` (kiểu; `stages.json` đã qua `tsc --strict`), `TIN-NHAN-UI.md`, `tasks/3D-*.md`.

## 1. Chuẩn: `nmlt-01` đang chạy thế nào (đọc từ code)

| # | Người chơi thấy | Code |
|---|---|---|
| 1 | TopBar 📚 → thẻ lịch: môn, giờ, phòng, thầy, 5 phút, chọn nhân vật Nam/Nữ → Bắt đầu | `LessonHud.tsx` `LessonStarter` |
| 2 | Chuông reo. Tự bật đi bộ, đặt trước thang máy T4 B11, mặt hướng cửa 406 | `WalkMode.tsx` subscribe cấp module, `classrooms.json` `arrival` |
| 3 | Thẻ góc trái: môn, la bàn (Bắc bản đồ), số mét, "Lên tầng 4" nếu sai tầng. "Tới lớp ngay" chỉ **đổi pha**, không dời người | `LessonHud` |
| 4 | Đi WASD/cần ảo, va tường và dãy bàn; bước vào khung phòng → `findSeat` | `arriveAtClass`, `b11.ts` `addClassroom406Obstacles` |
| 5 | Ghế viền vàng nhấp nháy; cách ≤ 1,2 m hiện "Ngồi (E)" | `Classroom406` `PlayerSeatHighlight`, sự kiện `campussim:seat-prompt` |
| 6 | E: nhân vật ngồi (`sit`, +0,40 m), khóa đi lại, camera lướt ra sau vai cao 1,55 m nhìn màn hình và TV | `WalkMode` mục 4, `sitPose.ts` |
| 7 | Thầy đi từ bàn ra cạnh TV, quay về người chơi; hộp thoại dưới màn hình, chữ chạy; chọn câu đáp, thầy đáp bằng bong bóng 3 giây | `Teacher.tsx`, `DialogueBox`, `TeacherBubble` |
| 8 | Slide hiện trên TV 3D **và** thẻ 2D giữa màn; mỗi slide thầy chỉ tay | `ProjectorScreen`, `slideCanvas`, `SlideViewer` |
| 9 | Câu hỏi: thẻ giữa; 2 bạn giơ tay; đúng/sai tô màu, thầy gật/lắc | `QuestionCard`, `ClassroomNpcs` |
| 10 | Bài tập: camera sát màn hình, máy tính EIU toàn màn (đăng nhập → Code Lab), Chạy, output gõ dần, gợi ý trừ sao | `EiuDesktop`, `CodeLab` |
| 11 | Đúng: "ting", 3 bạn gần đó gật | `sfx`, `playUpper` |
| 12 | Tổng kết: sao, thời gian, con dấu; cả lớp đứng dậy lần lượt ra cửa | `LessonSummary`, `ClassroomNpcs` |
| 13 | Esc: thu máy → đứng dậy ra lối đi (bước giữ nguyên, ngồi lại chơi tiếp) → thoát đi bộ | `onEscapeCapture`, `standUp` |

Phụ: 18 bạn ngồi gõ phím; chỉ mount ở B11 tầng 4; 47 draw call khi ngồi 406 (đo headless). Không lưu giữa chừng; nội dung chỉ tiếng Việt.

Lệch giữa tài liệu cũ và code, đừng chép lại: ghế người chơi nay ở (91.8, −141.0), nhìn **+u** (Đông); màn chiếu nay là TV; không còn vệt sáng máy chiếu; báo cáo L346 ghi số cũ.
Nghi vấn lỗi có sẵn, 3D-01 sửa luôn: nhắc ghế được giả làm tương tác `interior-door`, nên **bấm chuột** vào nút InteriorHud gọi `exitInterior()` thay vì ngồi (phím E thì đúng).

### So sánh

| `nmlt-01` có | IT Silver hiện có | Thiếu, ai bù |
|---|---|---|
| Đi tới lớp, la bàn | không; `place` là chuỗi | `stages.json` + đạo diễn (3D-05) |
| Phòng thật, va chạm | 406.B8 dựng rồi, **chưa** có ghế/va chạm dữ liệu; phòng lý thuyết chỉ bàn ghế khối, không va chạm | 3D-02, 3D-09 |
| Ngồi, camera, đứng dậy | không | 3D-01 |
| Thầy phản ứng | không | 3D-03 |
| Slide trên TV | thẻ 2D | 3D-03, 3D-04 |
| Bạn học, giơ tay, hoan hô | tên trong thoại | 3D-03; Han/Quyền/Thành có chỗ thật |
| Máy tính EIU | màn Code 2D (đồng đội) | 3D-06 tách view dùng chung |
| Tan lớp | không | 3D-03 (`mode: 'end'`) |
| Nội dung 1 buổi, 5 phút | 4 bài + thi, 14,5 phút, song ngữ | **đã hơn** |
| — | chọn chương, đăng ký, tuần, sổ kỷ niệm, lưu, nhánh lời thoại | **đã hơn**, giữ |

## 2. Trải nghiệm từng phút

Ký hiệu: ▶ đi · E tương tác · 🪑 ngồi. "Tới nơi luôn" có ở mọi đoạn ▶: đưa thẳng tới sát đích, còn E do người chơi bấm.

### Luật chung

- **Chỉ đường** nhiều chặng: ngoài trời → cửa B8 gần nhất; sai tầng → thang máy và chữ "Lên/Xuống tầng n"; đúng tầng → cửa phòng; trong phòng → ghế viền vàng hoặc người có dấu "!" trên đầu. Thẻ góc trái: chặng, mét, la bàn, "Tới nơi luôn".
- **Bắt đầu cảnh** chỉ khi E (`sit`, `talk`, `look`). Trước đó không có lời thoại nào che màn.
- **Hội thoại** ở đáy màn, người đang nói quay mặt về người chơi, người chơi không di chuyển. `narrator`: dải chữ nghiêng ở đáy.
- **Camera**: ngồi = sau vai như nmlt-01; bài code = sát màn hình; đứng nói = góc hiện tại, quay mượt 0,6 s để cả hai trong khung; không cắt cảnh, trừ fade đổi ngày.
- **Đứng dậy**: Esc hoặc nút. Bài dừng ở bước đang làm, ngồi lại chơi tiếp. Hết cảnh mà cảnh kế **cùng phòng cùng ngày**: ngồi nguyên. Khác ngày: fade có tên thứ, xuất hiện ở cửa phòng.
- **Vào thẳng / tiếp tục**: xuất hiện ở `arrival` của cảnh kế (ngoài cửa phòng, 5–9 m tới ghế). Cảnh đầu chương mới có đoạn đi dài hơn.
- **Bỏ qua cảnh** vẫn có (dùng `skipItem`).

### Ngày kiểm tra (nội dung 8 phút → khoảng 10)

| Phút | Cảnh | Diễn biến |
|---|---|---|
| 0:00 | `meet-thanh` | Đứng sân trước cửa Nam B8. ▶ 7 m tới Thành (dấu "!"), E. Chọn lời đáp. Xong Thành đi vào cửa |
| 2:00 | `listening` | ▶ vào B8, thang máy, 206.B8 (T2, cánh Bắc phía nhà xe). 🪑 ghế viền vàng. Giám thị cạnh bảng, 10 bạn. Nghe: loa + phụ đề; tờ đề là thẻ 2D |
| 4:30 | `reading`, `writing` | Ngồi nguyên |
| 7:00 | `speaking` | Đứng dậy ▶ sang 208.B8 kế bên. 🪑 đối diện giám khảo, hai người, không NPC |
| 8:15 | `result` | Fade "Ít hôm sau" ra sân. ▶ 6 m tới bảng kết quả, E xem. Thành, Quyền đứng cạnh |
| 10:00 | sổ kỷ niệm | màn 2D |

### Năm 1 kỳ 1, Level 1 (12 → khoảng 14,5)

| Phút | Cảnh | Diễn biến |
|---|---|---|
| 0:00 | `greet-han` | Hành lang T2, ▶ vào 206.B8, 🪑 ghế trống cạnh Han |
| 2:30 | `skills` | Ngồi nguyên |
| 4:00 | `philosophy` | Fade. Cửa 311.B8 (T3, phòng lớn). 🪑, Han cạnh bên, thầy, TV, 18 bạn |
| 6:00 | `pe` | Fade ra sân cỏ cạnh B8. ▶ 4 m tới Han, E. Bốn bạn đứng. Bỏ qua được |
| 7:15 | `midterm`, `final` | Cửa 206.B8, 🪑 một lần. Bài nói: giám khảo đứng trước bàn |
| 11:30 | `after` | Đứng dậy ▶ hành lang T2: Han, rồi Thành; Quyền đi ngang vẫy tay |
| 13:00 | bảng điểm, sổ | màn 2D |

### Năm 2 kỳ 2 (31 → khoảng 35; bấm "Tới nơi luôn" hết ≈ 32–33)

| Phút | Cảnh | Diễn biến |
|---|---|---|
| 0:00 | recap, đăng ký | màn 2D; cảnh 3D đứng yên sau lưng |
| 2:00 | `opening` | Sảnh giữa T1 B8, ▶ 4 m tới Thành và Quyền, E. Quyền đi về thang máy |
| 3:30 | tuần | màn 2D → Vào buổi học |
| 4:00 | `lab-1`, `lab-2` | ▶ thang máy T4 → 406.B8 cửa Tây (~45 m, 10–15 s). Giảng viên ở bàn, 12 bạn, **Han ngồi cạnh**. 🪑 406-r2-s5. Thầy ra cạnh TV, slide trên TV, bài code mở máy EIU. Lab 2 ngồi nguyên |
| 11:30 | 4 ngày lý thuyết | Mỗi ngày: thẻ tuần → fade "Thứ Ba" → cửa 207.B8 → 🪑; hai môn cùng ngày ngồi nguyên, đổi bìa TV. Thứ Ba MATH/POLS · Tư CSE a/COMS · Năm MATH/POLS · Sáu CSE b/COMS |
| 28:00 | `exam` | Cửa 406.B8, 🪑 cùng ghế. Không gợi ý từ Han |
| 31:00 | `closing` | Đứng dậy, Han và Quyền ở lối giữa, E |
| 33:00 | `club` | Sảnh T1, gặp Han (phông cảnh) |
| 34:00 | sổ | màn 2D |

Thêm khoảng 4 phút: đi lại ≈ 3,2, ngồi/đứng ≈ 0,8. Vượt 35 thì cắt đoạn đi trước, **không** cắt nội dung. Con số trên màn đăng ký đổi sau khi đo thật (3D-14).

## 3. Phân loại và phòng

"Vừa đủ": chi tiết ở ghế, bàn, TV, người đang nói; phần còn lại giữ như cũ.

| Loại | Cảnh | Gồm |
|---|---|---|
| **Đầy đủ** | CSE 103: lab-1, lab-2, a, b, exam | ngồi, thầy đi và phản ứng, TV, Han, 12 bạn giơ tay/hoan hô, máy EIU, tan lớp |
| **Gọn** | entrance (6 cảnh), 1.1 (7 cảnh), MATH/POLS/COMS/STAT/CSE 204, `2.2/opening`, `2.2/closing` | dùng chung phòng và cơ chế; ≤ 10 bạn (311: 18), thầy chỉ đứng và quay mặt |
| **Phông** | `2.2/club`; recap, đăng ký, tuần, bảng điểm, sổ | 1 người hoặc không ai |

| Phòng | Dùng cho | Đã có | Còn thiếu |
|---|---|---|---|
| **406.B8** T4 Bắc | lab, thi, kết kỳ | 10 phòng máy instanced: 32 bàn/ghế/máy, TV, 2 bảng, bàn GV, biển | dữ liệu ghế, **va chạm bàn**, TV vẽ slide, viền ghế, người |
| **206.B8** T2 Bắc (phía nhà xe) | Anh văn, thi viết | tường, cửa, kính; bàn ghế khối | 24 chỗ thật, TV, bảng, va chạm |
| **208.B8** T2 Bắc | nói một-một | như trên | 1 bàn, 2 ghế, 3 ghế chờ |
| **207.B8** T2 Nam | mọi lý thuyết | như trên | 24 chỗ, TV, bảng, va chạm |
| **311.B8** T3 Nam (60 SV theo `building-details.json`) | Triết | như trên | 60 chỗ, TV lớn, va chạm |
| Sân cửa Nam, sân cỏ, sảnh T1, hành lang T2 | gặp người | có | bảng kết quả (1 mặt phẳng) |
| **B10** | — | không có nội thất | bản thử dùng B8, đúng ý chủ dự án |

Giả định: "B8 nửa phía nhà xe" = **cánh Bắc** (ghi chú trong `B8ComputerLabs.tsx`: "dãy nhìn ra nhà xe cạnh Căn tin"); lý thuyết = cánh Nam. Xem Q1.

Số đo ở `data/classrooms-b8.json`. Đã chạy BFS đường đi (bán kính 0,4 m, bàn bo tròn, **hai đầu dãy thụt 0,25 m**): từ cửa tới sát ghế người chơi đi được ở cả bốn phòng, điểm đứng dậy không kẹt. Lối giữa 406.B8 chỉ 0,6 m nên **không** dùng va chạm nguyên khối như B11; phải thụt đầu dãy.

208.B8 (u 72,5–81,9; v −210,2…−200; T2): bàn (77,2; −205,1) dài v 1,2 × 0,7; giám khảo (76,4; −205,1) nhìn +u; người chơi (77,95; −205,1) nhìn −u; ghế chờ (79,5; −201,2), (80,2; −201,2), (80,9; −201,2); đứng dậy (78,6; −204,2); camera mắt (79,0; 1,55; −204,9) nhìn (76,4; 1,15; −205,1). Xóa bàn ghế khối cũ của phòng.

Bẫy: `B8_ROTATION_Y = −0,2286` **ngược dấu** với `B11_ROTATION_Y` (B8 dùng `atan2(-EX[1], EX[0])`). Không dùng `localDirToYaw` cho B8; tính yaw = `atan2(wx, wz)` từ vector thế giới.

### Ngân sách (máy 16 GB)

≥ 50 FPS ở 1440×900, ≥ 30 ở điện thoại tầm trung; cảnh lab ≤ 130 draw call (nay 87 ở 406.B8, đo headless) và ≤ 350 k tam giác; 1 texture slide 1024×768 đang sống; ≤ 18 NPC có mixer trong phòng; chỉ mount phòng đang dùng; không thêm đèn, bóng; không tạo object trong `useFrame`. GLB dùng lại bộ Kenney, không tải thêm.

## 4. Kiến trúc

```
useSilverStore (BE, không đổi) ─ play.item.scene.id ─► stages.json
        ▲ answer/nextStep/…                               │
        │                                  silverDirector (src/silverWorld/director.ts)
   src/ui/silverWorld/**                                  │ begin(Activity) / end
        ▲                                                 ▼
        └─────────────── useActivityStore ◄── lessonBridge ◄── useLessonStore (nmlt-01, không đổi API)
                              ▲
        WalkMode · PlayerCharacter · InteriorHud  (chỉ biết Activity)

ClassSignal ◄─ lessonSignal() / silverSignal() ─► Teacher · ProjectorScreen · ClassroomNpcs
```

1. **Một cơ chế ngồi/đi/camera.** `useActivityStore` (kiểu trong `silverWorld.types.txt`) thay mọi chỗ viết cứng 406.B11 trong `WalkMode`, `PlayerCharacter`. `useLessonStore` giữ nguyên API; `lessonBridge` dịch `goToClass/findSeat/seatId/desktopOpen` sang Activity và ngược lại. nmlt-01 trở thành khách hàng thứ nhất.
2. **Một bộ diễn viên.** `Teacher`, `ProjectorScreen`, `ClassroomNpcs` nhận `room` + `getSignal()`; không import store nào. `Lesson406` = `ClassroomStage` với tín hiệu lesson.
3. **Ánh xạ** theo `SceneContent.id`, không theo `RunItem.place` (place phần lớn chỉ là `b8`). Thiếu cảnh: lùi về `overlay` cho riêng cảnh đó và báo `console.warn` một lần. Không sửa JSON nội dung.
4. **Store BE không đổi.** `SilverApi`, `SilverSave`, `RunItem` giữ nguyên. Director chỉ subscribe. Lưu/tiếp tục: BE đã lưu `itemId`; 3D không lưu vị trí, suy lại `arrival` từ item. Bước trong cảnh không lưu (giống hợp đồng hiện tại).
5. **Vào/ra.** `screen==='play'` và item đổi → `begin`. Đứng dậy: phase `near`, `play` không đổi. `screen` khác `play` → diễn viên vẫn đứng, người chơi không nhận phím. `screen==='closed'|'home'` → `end`. Người chơi tắt đi bộ giữa lượt → `exitRun()`. `walkMode` không bị thoát khi mở chế độ Silver ở `world`.
6. **Không chạy hai buổi một lúc.** Silver đang chạy thì ẩn 📚; nmlt-01 đang chạy thì ẩn 🎓 (đồng đội đã có điều kiện này).
7. **Lùi an toàn.** WebGL lỗi, tab ẩn hoặc người chơi chọn "Chơi nhanh 2D" → `mode: 'overlay'` = màn Play của đồng đội. Không làm lại.

| Thêm | Ở đâu |
|---|---|
| Kiểu mới | `src/types/silverWorld.ts` |
| `useActivityStore` | `src/store/useActivityStore.ts` |
| Bridge, director, chỉ đường, tín hiệu | `src/silverWorld/*.ts` (thuần, có test) |
| Cảnh 3D | `src/scene/silver/**`, sửa `src/scene/walk/**`, `lesson/**`, `npc/**` |
| Dữ liệu | `src/data/silver/stages.json`, `src/data/classrooms.json` (thêm 4 phòng) |
| UI 3D | `src/ui/silverWorld/**`, `src/ui/lesson/views/**` |
| `Classroom`: `frame: 'b11' \| 'b8'`, `companionSeat?`, `standPoint?` | `src/types/lesson.ts`, `src/data/phase2.ts` |

`LessonStep`/`ClassSignal` không gộp hai loại bước; UI chỉ dùng chung **view** trình bày.

## 5. UI đồng đội

Không có màn nào phải bỏ. Nhánh `it-silver/ui` chưa có trên origin lúc viết.

| Màn (task) | Kết luận | Lý do / việc |
|---|---|---|
| Khung, adapter, mock (UI-00) | **SỬA nhỏ** | thêm `presentation.ts` (một dòng `{mode:'overlay'}`); khi `world` không gọi `exitWalkMode`, không chặn phím ở màn play, nền trong suốt |
| Home, Recap (UI-01) | **GIỮ** | phủ lên cảnh 3D; thêm chỗ cho nút "Chơi nhanh 2D" (bên mình gắn lúc ghép) |
| Play, Say, Choice, Slide (UI-02) | **GIỮ** làm bản 2D; bước **SỬA** nhẹ | mỗi bước không tự `fixed`/che toàn màn, để đặt được vào khung khác |
| Question, Order, Code (UI-03) | **GIỮ** | `world` dùng lại Order, Question có nghe/đọc, Choice; Code dùng lại trong khung 2D, còn `world` dùng máy EIU |
| Đăng ký, Tuần, Bảng điểm, Sổ (UI-04…07) | **GIỮ** | đúng là màn 2D |
| Rà soát (UI-08) | **GIỮ** | kiểm bản 2D; 3D kiểm ở 3D-08, 3D-14 |

Màn chơi `world` (đồng đội làm, 3D-07): thoại đáy màn như `DialogueBox`; slide trên TV kèm thẻ nhỏ đáy màn có nút "Phóng to"; câu hỏi/sắp câu: thẻ giữa như `QuestionCard`; nghe/đọc = tờ giấy; code = máy EIU. Tách `DialogueBox`, `SlideViewer`, `QuestionCard`, `CodeLab`, `EiuDesktop` thành view + vỏ để hai bên dùng chung (3D-06). Tin nhắn: `TIN-NHAN-UI.md`.

## 6. Việc

**Đợt 1 — lát cắt nhỏ nhất chơi được (~22 giờ).** Vào 406.B8, gặp Han và giảng viên, ngồi, học Lab 1 thật.

| Thứ tự | Task | Giờ | Ai | Cần |
|---|---|---|---|---|
| 1 | `3D-00-activity-store.md` | 2 | Codex gpt-6.2-sol | gộp it-silver/be |
| 2 | `3D-01-walkmode-dung-chung.md` | 4 | gpt-6.2-sol | 00 |
| 2 | `3D-02-du-lieu-phong-b8.md` | 1,5 | gpt-6-luna | — |
| 2 | `3D-03-dien-vien-dung-chung.md` | 3 | gpt-6.2-sol | 00 |
| 3 | `3D-04-phong-406-b8.md` | 2,5 | **đồng đội** | 02, 03 |
| 3 | `3D-05-dao-dien.md` | 3 | gpt-6.2-sol | 00, 02 |
| 3 | `3D-06-view-dung-chung.md` | 2,5 | **đồng đội** | — |
| 4 | `3D-07-ui-world.md` | 3 | **đồng đội** | 01, 05, 06 |
| 5 | `3D-08-nghiem-thu-dot-1.md` | 1 | gpt-6.1-terra | tất cả |

**Chia việc (chủ dự án chốt):** đồng đội làm phần nhìn thấy: UI-00…08, 3D-04, 06, 07, 09, 12. Bên mình làm lõi: 3D-00, 01, 02, 03, 05, 10, 11, 13 và nghiệm thu 08, 14. 3D-06 làm ngay được (nhánh `it-silver/view` từ `origin/main`); 3D-04, 07, 09, 12 chờ bên mình báo lõi đã lên GitHub. Đợt 2, 3 chờ chủ dự án duyệt đợt 1.

Chạy song song tối đa 2 agent một lúc (máy 16 GB): {01}, {02 → 04}, {03}, {06} đụng file khác nhau. 01 và 03 sửa `walk/` và `lesson|npc/` riêng.

**Đợt 2 — trọn kỳ 2.2 (~11 giờ)**: `3D-09-phong-ly-thuyet.md` (4, **đồng đội**), `3D-10-tron-ky-2-2.md` (4, sol), `3D-11-ghep-ui-dong-doi.md` (3, sol).
**Đợt 3 — entrance và 1.1 (~9 giờ)**: `3D-12-ngoai-troi-va-hai-phong.md` (3, **đồng đội**), `3D-13-entrance-va-1-1.md` (3, sol), `3D-14-nghiem-thu-va-do.md` (3, terra).

Tổng khoảng 43 giờ agent, chưa kể duyệt. Mỗi task: 3 cổng + `test:silver`, rồi kiểm tay. Chủ dự án xem sau 3D-08 **trước khi** làm đợt 2.

## 7. Rủi ro

| Rủi ro | Giảm |
|---|---|
| Sửa `WalkMode` (1030 dòng) làm hỏng nmlt-01, cầu thang, camera | 3D-01 làm riêng; danh sách hồi quy nmlt-01 chạy trước/sau; không đổi va chạm hay camera đi bộ |
| Lối giữa 406.B8 hẹp, kẹt | số đo đã BFS; "Tới nơi luôn" cạnh ghế |
| NPC ngồi lệch ghế/xuyên bàn ở B8 (ghế 406.B8 là geometry khác) | 3D-04 chụp ảnh sát ghế; chỉnh `SIT_Y_OFFSET` **theo phòng**, không toàn cục |
| Draw call vượt | giảm `crowd` trong JSON, không sửa code |
| UI đồng đội về trễ | đợt 1 không cần (3D-06 dùng view sẵn; chỉ có `say/slide/code`), đợt 2 mới ghép |
| Người chơi lạc | "Tới nơi luôn" luôn có |
| Nói và đi lại chồng phím (Esc, E, 1–4) | một bảng ưu tiên phím ở 3D-07 |
| Nghe bằng giọng máy kém/không có | phụ đề tự bật, như UI-03 |
| Vào thẳng ra cảnh không có ánh sáng/âm | `arrival` nào cũng nằm trong `stages.json`, 3D-14 thử từng cảnh |
| Cảnh mở rộng tuần khác (môn đổi) | mọi môn có nội dung đã có stage; môn không có → overlay |

**Nội dung cần sửa: không dòng nào.** Hai chỗ cố ý lệch nhẹ: `place: "b8"` của bài thi CSE 103 và `2.2/closing` được cho diễn ra ở 406.B8 qua `stages.json`; câu "bước vào B8" của `2.2/opening` diễn ra ngay trong sảnh.

## 8. Cần chủ dự án

| # | Câu hỏi | Mặc định |
|---|---|---|
| Q1 | "Nửa phía nhà xe" = cánh Bắc (dãy số chẵn)? | Bắc học Anh văn, Nam lý thuyết |
| Q2 | Phòng lớn học Triết: 311.B8? Thi và Anh văn: 206.B8, nói: 208.B8, lý thuyết: 207.B8? | như đề xuất |
| Q3 | Thể chất ở đâu ngoài trời? | sân cỏ cạnh B8 |
| Q4 | Thành, Quyền: nam hay nữ, nhân vật nào? Han nữ. Giảng viên: thầy? | model Thành `male-e`, Quyền `male-g`, Han `female-c`, giảng viên `male-d`; lời văn vẫn trung tính |
| Q5 | Mỗi ngày mới đi từ cửa phòng (~10 s), hay ngồi sẵn? | từ cửa |
| Q6 | 2.2 khoảng 35 phút chấp nhận được? | được; đo rồi chỉnh |
| Q7 | Giữ bản 2D làm lựa chọn "Chơi nhanh 2D"? | giữ, ẩn trong Home |
| Q8 | Cho thấy tên trên đầu người trong truyện? | có, chỉ khi ≤ 6 m |
