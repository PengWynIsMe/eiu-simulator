# ND-TRUYEN — báo cáo (ND-01, ND-02, ND-03, ND-06)

> **Đã duyệt 24/11/2026.**

Nhánh `PengWynIsMe/it-silver-nd-truyen` (từ `origin/main` = `b946e54`). Chưa push, chưa merge, không bật dev server. Nội dung đã được chủ dự án duyệt ngày 24/11/2026 (`CourseContent` có `status: "da-duyet"`). Bản đọc để duyệt không cần mở JSON: `docs/it-silver/KICH-BAN-TRUYEN.md` (sinh tự động từ chính các file JSON).

## File và commit

| Task | File | Phút (tổng `minutes`) | Commit |
|---|---|---|---|
| ND-01 | `src/data/silver/chapters/entrance.json` | 8,0 | `ND-01` |
| ND-02 | `src/data/silver/chapters/1.1.json` | 11,0 | `ND-02` |
| ND-03 | `src/data/silver/content/cse-103.json` | 14,5 (lab-1 3 · lab-2 3 · a 3 · b 3 · thi 2,5) | `ND-03` |
| ND-06 | `src/data/silver/chapters/2.2.json` | 3,0 (opening 1 · closing 1,5 · club 0,5) | `ND-06` |

Chỉ tạo các file JSON trên + báo cáo + bản đọc. Không chạm code, kiểu, UI, BE, `nmlt-01.json`.

## Lần sửa theo góp ý (vòng 2)

Đã sửa đúng ba điểm được giao, phần khác giữ nguyên từng chữ:
1. `2.2/closing`: bỏ câu `say` rủ làm chung của Quyền; lời rủ nay nằm gọn trong `choice` `after` (giữ id, flag `2.2/after`, các option). Câu “Nhóm mình ăn ý đấy” chuyển vào lời rủ.
2. `2.2/closing`: bỏ câu hỏi “Bạn thấy sao?” của Han ở câu mặc định và hai variants (không thêm bước; cảnh còn 4 bước).
3. `entrance/speaking`: thêm một câu dẫn của người dẫn truyện ở đầu cảnh (sang phòng khác, giáo viên hỏi riêng từng người). Tổng phút vẫn 8,0.

Đã chạy lại toàn bộ kiểm (JSON, `tsc --strict`, ngữ nghĩa, 23 kiểm tra Java): đều đạt.

## Giọng ba bạn (giữ nhất quán qua cả bốn file)

- **Han** (nữ, Level 1, cùng lớp): hay đùa, thừa nhận mình run, nói thẳng, hay rủ (“Đi!”, “Xong!”). Xưng mình/bạn.
- **Thành** (Level 2, khác ngành): lịch sự, điềm tĩnh, tò mò, nhớ chuyện cũ (“Xin lỗi, bạn cho mình hỏi…”).
- **Quyền** (Level 3, cùng KTPM): ít lời, khô, thực tế (“Mình lên lab trước. Chỗ đẹp hết rồi thì đừng trách.”). Rủ làm chung nhưng không dạy ai.
- Không cảnh nào xếp giỏi/kém theo level; người chơi xưng “mình/bạn”, không giới tính; giảng viên không xưng thầy/cô (không bịa tên).

## Flag và nơi chúng được nhắc lại

| Flag (giá trị) | Ghi ở | Dùng ở |
|---|---|---|
| `entrance/greet` (warm, brief) | `entrance/meet-thanh` | memory entrance (ảnh + 2 câu); `2.2/opening` (variants của Thành) |
| `1.1/han` (practice, joke) | `1.1/greet-han` | `1.1/after` (variants Han); memory 1.1 (3 câu); `2.2/closing` (variants Han); memory 2.2 |
| `1.1/pe` (run, rest) | `1.1/pe` | memory 1.1 (ảnh sân khi `run`) |
| `2.2/after` (plan, play) | `2.2/closing` | memory 2.2 |
| `2.2/club` (tech, art, sport) | `2.2/club` | memory 2.2 (ba ảnh CLB) |
| seen `1.1/greet-han` | — | `CSE 103/lab-1` (câu Han), memory 2.2 (2 câu kết hợp `seen` + flag) |

Chơi theo thứ tự thấy ≥ 4 chỗ nhắc lại (Thành ở 2.2, Han ở lab-1, Han ở 2.2/closing, sổ kỷ niệm). Vào thẳng 2.2 (không flag): mọi `variants` rơi về câu mặc định, vẫn tự nhiên.

## Bảng tiêu chí xong

| Tiêu chí | Kết quả |
|---|---|
| **ND-01** đủ bốn kỹ năng đúng hình thức (nghe 2 `question` listening, đọc 2 `question` reading, viết 1 `order` 4 câu, nói 2 `choice`) | **Đạt** |
| ND-01 hai lựa chọn → hai câu lưu bút khác nhau (`warm`, `brief` + 1 mặc định); 2 ảnh, 3 câu | **Đạt** |
| ND-01 Thành Level 2, Quyền Level 3, người chơi Level 1, không gắn với câu trả lời; câu Thành đúng nguyên văn VI/EN | **Đạt** |
| ND-01 7–9 phút | **Đạt** (8,0) |
| **ND-02** giữa kỳ (2 câu), cuối kỳ đủ bốn kỹ năng (nghe, đọc, `order` viết, `choice` nói) | **Đạt** |
| ND-02 id `1.1/greet-han` giữ đúng; `choice` flag `1.1/han` (practice, joke) + `order` lời chào | **Đạt** |
| ND-02 `1.1/philosophy` bám mô tả PDF tr.7–8, trung tính; không nói người chơi giỏi/kém; không quy đổi Level sang band | **Đạt** |
| ND-02 `englishLevel: 1`; 10–13 phút | **Đạt** (11,0) |
| **ND-03** 4 bài + thi, tổng 14,5 phút | **Đạt** |
| ND-03 hai câu Han đúng nguyên văn (VI + EN), đặt ngay sau bước code in lời chào; `seen 1.1/greet-han` | **Đạt** |
| ND-03 mọi code đã kiểm: biên dịch và chạy thật bằng JDK (xem dưới) | **Đạt** |
| ND-03 `exam` đúng 3 bước (đọc đầu ra, điền một dòng, tìm lỗi); `status: da-duyet`; `basis` ghi “mô phỏng ngắn” | **Đạt** |
| **ND-06** `scenes: []`, không `englishLevel`; `recap`, `2.2/opening`, `2.2/closing`, `2.2/club` đúng id/phút | **Đạt** |
| ND-06 vào thẳng (không flag) vẫn tự nhiên; chơi theo thứ tự ≥ 2 chỗ nhắc lại | **Đạt** |
| ND-06 mọi `when` trỏ tới flag/cảnh có thật | **Đạt** (script kiểm) |
| Chung: mọi chuỗi có `vi` và `en`; không bịa giảng viên/quy chế/CLB/phòng; JSON hợp lệ; đúng kiểu | **Đạt** |

## Cách đã kiểm (script tạm nằm ngoài repo)

1. **JSON hợp lệ:** `JSON.parse` bằng node cho cả bốn file.
2. **Kiểu:** chép `silver.types.txt` nguyên văn thành `silver.ts` (+ stub `LocalizedText`/`CourseBlock` từ `src/types/major.ts`), gán từng file vào `ChapterContent`/`CourseContent`, chạy `tsc --noEmit --strict` → không lỗi. (Worktree này chưa có `node_modules`, dùng `tsc` của worktree khác chỉ để chạy; không cài gì vào repo. `check:silver` chưa tồn tại trên main nên chưa chạy được.)
3. **Ngữ nghĩa:** id bước duy nhất trong từng cảnh; `answerId` ∈ options; `order.answer` là hoán vị của items và items đã xáo; mỗi `code.template` có đúng một `___`; mọi `Cond.seen` trỏ tới id cảnh có thật; mọi `Cond.flag` có `choice` ghi đúng khóa và đúng giá trị option; phần tử cuối của `photos`/`lines` không có `when`; mọi `LocalizedText` có đủ `vi`, `en` không rỗng; từ khóa cấm (“giỏi”, “kém”, “band”) không xuất hiện.
4. **Giải lại mọi câu hỏi:** đã tự giải toàn bộ `question`/`order` (nghe, đọc, viết, Triết, giữa kỳ, cuối kỳ, thi) và đối chiếu với `answerId`/`answer`.
5. **Java chạy thật** (máy có JDK, `openjdk 25.0.3`): 23 kiểm tra, **tất cả đạt**:
   - mọi `answers` của 5 bước `code` được thế vào `___`, `javac -Xlint:all` không cảnh báo, chạy, đầu ra **đúng từng ký tự** với `outputCorrect` (nhiều đáp án: `println`/`print`; `int`/`long`/`short`/`Integer`; sáu cách viết cộng dồn);
   - các đáp án sai thử (`xyz`, `5`, `>`, `x`) đều không cho đầu ra đúng, trừ `>` ở bài điều kiện (cho `Not yet`, đúng ý `outputWrong`) và `5` ở vòng lặp (in 5 dòng, `outputWrong` nói chưa phải 4);
   - mã trong slide và trong `question.code` biên dịch và in đúng đáp án đã đánh dấu (`4`, `Stamp`, `123`, `Stamp`); `exam/e3` đúng là lỗi biên dịch `incompatible types: int cannot be converted to boolean`.

## Giới hạn từ (PLAN B4 là khuôn môn *tóm gọn*; CSE 103 là môn trọng tâm nên chỉ tham chiếu)

`summary` 22 từ VI / 21 EN (≤ 25); `closing` 17 VI / 13 EN (≤ 25). Văn bản mỗi buổi CSE 103 khoảng 144–181 từ VI (gồm cả đáp án và giải thích). Môn tóm gọn không thuộc phạm vi các task này.

## Quyết định tôi tự chọn (chủ dự án hoặc người biết EIU nên rà)

1. **Đoạn nghe/đọc dùng tiếng Anh ở cả `vi` và `en`** (là thứ được thi); chỉ câu hỏi, đáp án, giải thích được dịch. Đáp án chọn đa số là số/ngày giờ nên không lộ đáp án qua bản dịch. “Thông báo thư viện”, Anna/Sam/Mai/Tom đều **hư cấu**, có ghi trong câu hỏi và bản đọc.
2. **Ngày kiểm tra đầu vào**: không mô tả quy trình thi thật (số phòng, thời lượng, ai canh thi) — người biết EIU rà chỗ “Giám thị” và phần nói “sang phòng khác”.
3. **Giờ thể chất (`1.1/pe`)** đặt `place: "b8"` vì chưa có mã địa điểm “sân”; lời dẫn chỉ nói “ngoài trời”, không khẳng định sân nào. Môn thể chất không có trong PDF nên không có nội dung môn.
4. **`1.1/philosophy`** chỉ lấy đúng ý mô tả tr.7–8 (triết học và vai trò, duy vật biện chứng gồm vật chất–ý thức, phép biện chứng, nhận thức; duy vật lịch sử). Không bình luận chính trị.
5. **Thành ở năm 2 kỳ 2** xuất hiện ở B8 chỉ như “gặp lại”; không nói ngành của Thành (spec chỉ ghi “khác ngành”).
6. **Bài code 3 (`>=`)** chỉ nhận `>=`. Với `visits = 3`, `==` cũng ra `Stamp` nhưng sai ý “từ 3 trở lên”, nên không liệt vào `answers`. Nếu BE chấm bằng đầu ra thay vì chuỗi thì cần biết điểm này.
7. **Sổ kỷ niệm 2.2**: `Cond` chỉ cho một flag, nên các câu kết hợp dùng `seen "1.1/greet-han"` + flag `2.2/after`. Hai câu theo `1.1/han` chỉ hiện khi `2.2/after` không có (ví dụ bỏ qua cảnh closing); thứ tự khớp từ trên xuống nên `2.2/after` được ưu tiên.
8. **Trạng thái:** `status` chỉ có ở `CourseContent` (nay `"da-duyet"` ở `cse-103.json`). `ChapterContent` không có trường trạng thái nên việc duyệt được ghi ở báo cáo và bản đọc.

## Điểm cần BE/UI biết (không tự xử lý)

- Mã địa điểm đã dùng: `b8`, `406.B8`. Không dùng mã nào khác.
- Giá trị `minutes` có số lẻ (1,5; 2,5; 0,5) — theo spec; `SceneContent.minutes` là `number`.
- Một số `choice` có `speaker: "examiner"`/`"han"`/`"quyen"`/`"thanh"` mang lời hỏi; `reply` là lời đáp của chính người đó.
- Các `code.outputWrong` là chuỗi chung cho mọi đáp án sai (kiểu mẫu `nmlt-01`: lỗi biên dịch giả hoặc nhận xét ngắn), không sinh theo đáp án người chơi.
- `npm run check:silver` chưa có trên main; nên chạy lại khi BE-06/BE-12 vào.

## Chưa làm / ngoài phạm vi

ND-04, ND-05 (môn tóm gọn, môn đổi), mọi code/kiểu/UI. Giọng ba bạn (Q15) đã được chủ dự án duyệt.
