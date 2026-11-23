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
