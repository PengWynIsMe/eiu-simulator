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
