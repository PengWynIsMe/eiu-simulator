# Báo cáo BE (đợt test BE-00–02)

| Spec / tiêu chí | Test / kiểm chứng | Kết quả |
|---|---|---|
| BE-00 kiểu giống nguồn từng byte | `cmp docs/it-silver/data/silver.types.txt src/types/silver.ts` | Đạt |
| BE-00 test runner nạp TS và báo lỗi khi assert thất bại | smoke test gọi `ssrLoadModule`; runner có nhánh bắt lỗi và mã thoát khác 0 | Đạt |
| BE-01 nạp catalog, alias, mã không tồn tại, prerequisite, opens, tổng 140 TC/37 môn | `catalog.test.mjs` — catalog examples and totals | Đạt |
| BE-01 mã/alias trùng, LT+TH sai, opens sai, group không hợp lệ, mã prerequisite thiếu, chu trình | `catalog.test.mjs` — rejects broken catalog invariants | Đạt |
| BE-02 đủ tám đầu ra trạng thái | `prereq.test.mjs` — all eight prerequisite outcomes | Đạt |
| Kiểm định dự án | `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:silver` | Đạt cả bốn |

## Commit

Bổ sung test tại commit của đợt này. Không push. Không làm BE-03.

## BE-03 — Lịch game

| Tiêu chí / ví dụ | Test | Kết quả |
|---|---|---|
| Chép plan nguồn; 20 kỳ liên tục, official false, mã tồn tại, không trùng, core là tập con, default đúng nhóm, credits đúng, prerequisite đã học trước | `plan.test.mjs` validates plan invariants without hardcoding 180 | Đạt |
| termCodes 2.2, plannedBefore 2.2, tổng 180, kỳ 5.4 graduation | `plan.test.mjs` plan examples and totals | Đạt |
| Đẩy CSE 104 lên kỳ 2.1 báo CSE 104 và CSE 103 | `plan.test.mjs` validates plan invariants without hardcoding 180 | Đạt |
| parsePlan không ép tổng 180 | kiểm nhận plan bị đổi credits nhưng vẫn hợp lệ theo tổng môn; sai lệch từng kỳ bị phát hiện | Đạt |
| typecheck, lint, build, test:silver | Chạy đủ bốn lệnh | Đạt |

## BE-04 — Xếp tuần

| Tiêu chí / ví dụ | Test | Kết quả |
|---|---|---|
| Phân ca A và B khớp toàn bộ ngày/ca/thời lượng đã cho | `timetable.test.mjs` — A and B exact schedules | Đạt |
| Sáu lab: 18 buổi, không trùng, lab trọn khối, ngày theo thứ tự thử; kết quả tất định | `timetable.test.mjs` — C six labs allocation and repeat determinism | Đạt |
| CSW 400 là project 0.0×2; bảy lab báo hết ca | `timetable.test.mjs` — D project, E seven labs and course conversion | Đạt |
| Chuyển SilverCourse sang timetable course theo lt/th | cùng test D/E | Đạt |
| typecheck, lint, build, test:silver | Chạy đủ bốn lệnh | Đạt |

Ghi chú: spec nêu rõ 7 môn lab phải lỗi dù lịch 6 ngày × 2 khối có thể chứa hơn 6 lab; hiện thực áp giới hạn 6 lab để tuân theo ví dụ E.

## Điều chỉnh BE-04

| Tiêu chí | Test | Kết quả |
|---|---|---|
| Bỏ giới hạn lab cứng; bảy lab × hai lý thuyết hết ca theo thuật toán | `timetable.test.mjs` — D project, E seven labs and course conversion | Đạt |

## BE-05 — Điểm bốn kỹ năng

| Tiêu chí / ví dụ | Test | Kết quả |
|---|---|---|
| Ba vector FNV-1a mẫu, bao gồm chuỗi ghép | `grades.test.mjs` — FNV-1a known UTF-8 examples | Đạt |
| Năm bộ điểm seed demo và eiu-1 đúng theo thứ tự kỹ năng | `grades.test.mjs` — demo and eiu-1 grades by level | Đạt |
| Tối đa hai D; 1000 seed × 5 level đều qua | `grades.test.mjs` — passing threshold and 1000 deterministic seeds | Đạt |
| typecheck, lint, build, test:silver | Chạy đủ bốn lệnh | Đạt |

## BE-06 — Nạp và kiểm nội dung

| Tiêu chí / ví dụ | Test | Kết quả |
|---|---|---|
| Chapter/CourseContent hợp lệ và SceneContent fixture được kiểm | `content.test.mjs` — minimal valid chapter, content and fixture scene | Đạt |
| LocalizedText, phút > 0, cảnh/bước rỗng hoặc trùng id, điều kiện variants/photos/lines, quy tắc phần tử cuối | `content.test.mjs` — rejects malformed chapter, scenes, localization, ids and conditions | Đạt |
| Choice/question/order/code: số lựa chọn, đáp án, passage, hoán vị, placeholder duy nhất, answers không rỗng | `content.test.mjs` — rejects invalid choice question order and code steps | Đạt |
| Summary/core/project: slot, tổng phút, số buổi, exam và đối chiếu LT/TH khi có course | `content.test.mjs` — course tier slots counts exam and course lab rules | Đạt |
| Ánh xạ CSE/LNGS và thư mục nội dung rỗng; loader trả undefined, codes rỗng | `content.test.mjs` — content filename mapping and empty lazy loaders | Đạt |
| typecheck, lint, build, test:silver | Chạy đủ bốn lệnh | Đạt |

Không tạo dữ liệu nội dung thật; test sử dụng fixture tổng hợp và fixture UI có sẵn.

## BE-06 review corrections

| Yêu cầu rà soát | Kiểm chứng | Kết quả |
|---|---|---|
| Áp quy tắc lab/project cho cả summary và core; summary project 4–8 phút | `content.test.mjs` regression: summary lab, project durations and course lesson rules | Đạt |
| Core project nhiều buổi, cộng phút exam vào tổng; exam 3 bước chấm điểm; id cảnh duy nhất gồm exam | `content.test.mjs` regression: project core multi sessions and exam minutes and ids | Đạt |
| Speaker thuộc SpeakerId; answers là chuỗi; mọi file loader chạy parser; test loader tương thích thư mục có/không nội dung | `content.test.mjs` regression tests và optional loaders test | Đạt |

## BE-08 — Lượt chơi

| Tiêu chí / ví dụ | Test | Kết quả |
|---|---|---|
| matchCond seen/flag; điều kiện kép AND; resolveStep chọn variant khớp đầu và bỏ variants; fixture s1 hai trạng thái | `run.test.mjs` — conditions require both seen and flag; variants select first match | Đạt |
| Chapter queue opening → scenes → closing → transcript tùy chọn → memory; transcript/memory 1 phút | `run.test.mjs` — chapter queue ordering and transcript memory durations | Đạt |
| Term queue opening, duyệt meetings theo thứ tự và cảnh theo file, id/session metadata, exam theo regs, trailing scenes/closing/memory | `run.test.mjs` — term queue meets in meeting order, quick lab/theory/project and exams in registration order | Đạt |
| Quick chọn lab khi có lab, theoryA khi không lab, project khi project | cùng test term queue | Đạt |
| gradeStep question/order/code đúng sai, đáp án chuẩn, trim phân biệt hoa thường, output chỉ code | `run.test.mjs` — grading rules for every step type and both outcomes | Đạt |
| typecheck, lint, build, test:silver | Chạy đủ bốn lệnh | Đạt |

## BE-08 correction — code answers

| Tiêu chí | Test | Kết quả |
|---|---|---|
| Accept any configured answer after trim, retain first as canonical answer, case-sensitive | `run.test.mjs` — grading rules for every step type and both outcomes; two answers (`println`, `print`) | Đạt |

## BE-09 — Lưu cục bộ

| Tiêu chí / ví dụ | Test | Kết quả |
|---|---|---|
| SAVE_KEY, emptySave/read absent exact shape; parseSave round trip | `save.test.mjs` — empty save exact fields; parses round trip and sanitizes array entries and invalid run | Đạt |
| JSON sai, version sai, thiếu seed trả null; sanitize flags/seen/registrations/doneChapters/notebook; run sai thành null | `save.test.mjs` — rejects missing seed and wrong version; validates every saved field | Đạt |
| Corrupt data backed up `.bak`, warning corrupt; null kv/get exception blocked; backup set exception handled | `save.test.mjs` — read handles corrupt backup, null storage and thrown get/set | Đạt |
| write catches errors/kv null; clear removes main key but preserves backup | `save.test.mjs` — write catches storage failures; clear preserves backup | Đạt |
| typecheck, lint, build, test:silver | Chạy đủ bốn lệnh | Đạt |

## BE-10 — Sổ kỷ niệm

| Tiêu chí / ví dụ | Test | Kết quả |
|---|---|---|
| Ảnh gợi ý chọn phần tử đầu tiên không điều kiện/khớp; choices lọc điều kiện và giữ thứ tự | `notebook.test.mjs` — photo suggestions follow conditions and preserve order | Đạt |
| Khôi phục ảnh/dòng theo id đã lưu dù when không khớp; id mất dùng phần tử cuối; savedAt/hasOld | `notebook.test.mjs` — saved ids persist even after conditions change; vanished ids use fallback | Đạt |
| Upsert cùng chapter thay đúng vị trí; trang mới thêm cuối; mảng đầu vào bất biến | `notebook.test.mjs` — upsert replaces in place, appends new chapter and never mutates input | Đạt |
| Tên môn không tồn tại bị bỏ qua | `notebook.test.mjs` — saved ids persist even after conditions change; vanished ids use fallback | Đạt |
| typecheck, lint, build, test:silver | Chạy đủ bốn lệnh | Đạt |

## BE-10 correction — replay suggestions

| Tiêu chí | Test | Kết quả |
|---|---|---|
| makeMemoryView dùng gợi ý theo điều kiện hiện tại, `old` chỉ bật hasOld, savedAt null; savedMemoryView tiếp tục khôi phục entry | `notebook.test.mjs` — replay offers fresh suggestions while signaling an old page | Đạt |
| typecheck, lint, build, test:silver | Chạy đủ bốn lệnh | Đạt |

## BE-07 — Đăng ký môn

| Tiêu chí | Kiểm chứng | Kết quả |
|---|---|---|
| Ví dụ 2.2 trong brief với catalog và lịch thật, khóa môn trọng tâm, làm tròn phút | `registration.test.mjs` | Mặc định 15 TC / 31 phút; thêm CSE 204: 19 TC / 33 phút; đổi COMS 101 lấy CSE 204: 15 TC / 32 phút; chỉ CSE 103 và MATH 112: 8 TC / 24 phút, `too-few` |
| Thứ tự hàng, bỏ trùng, tín chỉ và lab, tier theo thứ tự hàng và tier dự kiến của môn chưa chọn | `registration.test.mjs` | Đạt |
| `done` và `taken`, chọn lại môn đã bỏ, thiếu tiên quyết, chờ xác nhận, thiếu nội dung | `registration.test.mjs` | Đạt |
| Số môn tối thiểu theo lịch, mốc sáu môn, thêm môn thứ bảy và ẩn lịch khi quá sáu | `registration.test.mjs` | Đạt |
| Thử với nội dung đã duyệt | Đọc và kiểm sáu JSON ở worktree loach và pompano bằng parser hiện hành | Mặc định, thêm và đổi môn đều khớp ví dụ, lần lượt có 9, 12 và 10 buổi |
| `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:silver` | Bốn lệnh kiểm, gồm 7 ca mới | Đạt |

BE-07 dùng `RegistrationView` và `CourseStatus` hiện hành. Kết quả trả `chapterId` từ `term.term` và dùng mã `needs-confirmation` cho “chờ xác nhận”. Hàng trong lịch thiếu nội dung hiện `no-content`. Khi đã có ba môn ngoài core được chọn, hàng chưa chọn hiện tier dự kiến `quick` theo quy tắc thêm cuối, còn các môn đã chọn luôn được xếp tier theo thứ tự hàng.

## BE-11 — Store nối các luồng chơi

| Tiêu chí | Kiểm chứng | Kết quả |
|---|---|---|
| 1–3. Hoàn tất đầu vào, mở lại cảnh thứ hai ở bước 0, thoát giữa cảnh giữ cờ chưa lưu | `store.test.mjs` ca 1–3 | Đạt |
| 4–5. Sai, thử lại, xem đáp án, gợi ý code và bỏ qua cảnh | `store.test.mjs` ca 4–5 | Đạt. Bỏ cảnh giữ checkpoint kế tiếp và bỏ cờ tạm |
| 6. Vào thẳng 2.2, lời dẫn, đăng ký mặc định, tuần, thi và sổ | `store.test.mjs` ca 6 | Đạt. Lịch 9 buổi. Hai cảnh lab cùng buổi dùng chung một thẻ |
| 7–9. Kho lưu ném lỗi, bảng điểm tất định, chơi lại và giữ trang cũ | `store.test.mjs` ca 7–9 | Đạt. Chơi lại gợi ý ảnh và dòng mới theo trạng thái hiện tại |
| Checkpoint cũ trỏ tới chương, item hoặc môn đã mất | Hai ca hồi phục trong `store.test.mjs` | Đạt. Xóa checkpoint nếu chương đã mất, về item đầu nếu item đã mất, mở lại đăng ký nếu danh sách môn thay đổi |
| Bấm nhanh Tiếp hoặc trả lời, chuyển chương khi đang dở, nhiều cờ trong một cảnh | Các ca tương tác trong `store.test.mjs` | Đạt. Hai lần Tiếp cách nhau dưới 250 ms chỉ tiến một bước nếu chưa trả lời bước mới. Câu trả lời thứ hai trong cùng bước giữ nguyên feedback |
| Nạp song song, lỗi lặp, hồi phục và giữ cache | Hai ca lỗi nạp trong `store.test.mjs` | Đạt. Cùng promise khi đang nạp, chỉ thử lại phần lỗi, một log mỗi chương, tiếp tục dùng được chương lành qua API. UI giữ màn lỗi toàn cục theo hợp đồng |
| Thiếu nội dung và tham chiếu ổn định cho selector | Các ca nội dung thiếu và selector trong `store.test.mjs` | Đạt. Chương thiếu hiện `coming-soon`. Môn thiếu theo quy tắc BE-07 `no-content`; hàng core vẫn khóa và hàng ngoài core bị loại khỏi lựa chọn mặc định |
| Nội dung thật, đi lần lượt `entrance → 1.1 → 2.2` | Script ngoài repo đọc và kiểm 3 JSON chương và 6 JSON môn từ `pompano` (`65aa678`) và `loach` (`bf18a9b`), đưa qua deps của `createSilverStore` | Đạt. Lần lượt 18, 25 và 46 bước chơi. Level 1 cho B/C/B/C với seed `eiu-1`. 2.2 vào đăng ký ngay, có 9 buổi và thi CSE 103. Lưu 27 cảnh, 5 cờ, 3 trang sổ, `run=null` |
| Nội dung thật, vào thẳng `2.2` | Chạy luồng thứ hai với cùng dữ liệu, kho lưu mới | Đạt. Có lời dẫn, mặc định 15 tín chỉ và 31 phút, 9 buổi, 46 bước và thi CSE 103. Lưu 14 cảnh, 2 cờ, 1 trang sổ, `run=null` |
| Bốn lệnh kiểm | `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:silver` | Đạt cả bốn, 58 ca Silver gồm 18 ca mới |

Các file BE-11 gồm `src/store/useSilverStore.ts`, `scripts/silver/tests/store.test.mjs` và báo cáo này. `SilverApi` và `UseSilver` giữ nguyên theo hợp đồng. Trước khi chốt đăng ký, checkpoint trỏ tới item mở đầu và danh sách môn rỗng. Khi tiếp tục checkpoint này, store mở đăng ký với danh sách đã lưu hoặc mặc định. Nội dung thật chỉ được đọc từ hai worktree để kiểm bằng Vite SSR middleware. Kiểm thử giao diện tích hợp nằm ở bước ghép UI.

## BE-12 — Kiểm dữ liệu

| Mục / tiêu chí | Test / kết quả | Trạng thái |
|---|---|---|
| Parse catalog/plan, in tổng kế hoạch; khác 180 chỉ cảnh báo | `check:silver` in tổng 180 TC | Đạt |
| Parse mọi chapter/content; file khớp id/code; mã content có trong catalog, parse kèm SilverCourse để kiểm lab | chạy trên JSON chép tạm từ pompano/loach: 3 chapter, 6 course; tất cả được nhận | Đạt |
| Cond.seen/flag/is tham chiếu scene, choice flag, option thật | `check.test.mjs` valid refs và từng trường seen/flag/is sai | Đạt |
| Giới hạn từ theory/lab/summary/closing và cảnh báo VI=EN dài | `check.test.mjs` wordCount + biên 130/200/25; nội dung duyệt chạy strict không báo lỗi | Đạt |
| Thiếu môn kỳ 2.2 cảnh báo mặc định, --strict thành lỗi | `check.test.mjs` chạy cả chế độ thường và strict trên 4 môn thiếu | Đạt |
| Đối chiếu 37 required với curriculum: mã, TC, LT/TH, năm.kỳ | script không phát hiện chênh lệch nào | Đạt |
| Nội dung đã duyệt từ pompano/loach với `check:silver --strict` | exit 0; 3 chương + 6 môn parsed; dọn tệp tạm, `git status` chỉ còn file task đang sửa | Đạt |
| typecheck, lint, build, test:silver | Tất cả lệnh exit 0 | Đạt |

Khi workspace không có nội dung, checker báo 4 cảnh báo thiếu nội dung kỳ 2.2 và exit 0; `--strict` đổi các cảnh báo này thành lỗi và exit 1.
