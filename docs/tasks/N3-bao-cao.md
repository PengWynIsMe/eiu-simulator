# N3 — Báo cáo

Nhánh `nganh-n3-ui` (Claude Sonnet, 2026-11-23). Dùng mặc định mục 11 của PLAN (không đụng PDF, `year: null` cho bản khung mẫu, chỉ gán B11).

## File đã sửa/tạo
- Mới: `src/types/major.ts` (chép nguyên văn PLAN mục 3), `src/data/majors.ts`, `src/data/majors/mau-{a,b}.json` + `mau-{a,b}.curriculum.json`, `src/store/useLangStore.ts`, `src/ui/major/*` (LangToggle, MajorPicker, MajorHeader, MajorView, MajorOverview, MajorCourses, CourseRow, ElectiveGroupList, MajorSpecializations, facultyText.ts), `docs/tasks/N3-anh/*`, báo cáo này.
- Sửa: `src/types/index.ts`, `src/data/validate.ts` (+`loc`), `src/data/index.ts`, `src/data/campus.json` (bỏ `majors`, `b11.majorIds = ["mau-a","mau-b"]`), `src/ui/text.ts`, `src/ui/BuildingPanel.tsx`, `src/ui/TopBar.tsx`.

## Kết quả typecheck / lint / build
Cả ba sạch (chạy lại sau lần sửa cuối).

## Đã kiểm tra tay (trình duyệt Orca, dev port 5178)
- B11 → tab "Ngành học (2)", 2 chip gom theo 2 khoa; đổi chip đổi nội dung. Tab "Tòa nhà" giữ nội dung cũ. ✔
- mau-a: Năm 1 có 5 môn + ô tự chọn đại cương; Năm 3 + chuyên ngành A1 thêm `MAU 341` (nhãn tên chuyên ngành); mở ô tự chọn thấy "Chọn ≥ 4 TC trong 5 môn"; tab Chuyên ngành có 2 mục + "Tự chọn khác". ✔
- mau-b: có ghi chú năm suy từ mã; không có tab Chuyên ngành. ✔
- EN: TopBar + panel + nhãn đổi; tab Chuyên ngành đang xem giữ nguyên; F5 vẫn EN; `<html lang>` đổi theo. ✔ (Chưa thử xóa `campussim.lang` + F5 → VI; mã đọc giá trị lạ/thiếu → `'vi'`.)
- Storage hỏng: `Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked')}})` rồi bấm VI → vẫn đổi sang VI, console không lỗi. ✔
- Loader báo lỗi: gọi `import('/src/data/majors.ts?t=…')` trong trang với file sửa tạm: xóa `summary.en` → `Dữ liệu sai ở majors/mau-a.summary.en: cần chuỗi khác rỗng`; `highlights[0].code` = `XXX 999` → `Dữ liệu sai ở majors/mau-a.highlights[0].code: cần mã môn có trong curriculum…`. Đã hoàn tác file. Lưu ý: khi nạp lúc mở app, lỗi làm trang trắng (giống hành vi cũ của DataError), console không in thông báo.
- 390×844 và 360×740: sheet thu/mở được, không tràn ngang (scrollWidth = 360), chip/tab cuộn ngang. ✔
- **Chưa thử** chế độ đi bộ / góp ý / buổi học (chỉ đổi chuỗi TopBar + thêm nút VI/EN, không đụng logic). Nút VI/EN không che nút khác ở 360 px (TopBar xuống 2 dòng như trước).
- Ảnh: `docs/tasks/N3-anh/` (desktop-vi, desktop-vi-courses, desktop-en, mobile-collapsed, mobile-expanded, mobile-360-expanded).

## Khóa UI_TEXT / chuỗi cũ đã chuyển
Toàn bộ `BUILDING_PANEL_TEXT` → `UI_TEXT` (đã xóa); thêm `floorN` ("Tầng {n}" trước đây viết cứng). TopBar: `appTitle, walkBtn*, reviewBtn*, reviewBadgeActive, lessonOpenBtn, langSwitch`. Panel ngành: `majorsTab, buildingTab, overview, courses, specializations, yearN, commonTrack, credits, totalCredits, programCode, highlights, skills, careers, dayInLife, illustrative, semesterN, electiveSlot, chooseCredits, chooseCourses, otherElectives, requiredCourses, electiveGroups, noCourses, yearsInferredNote, yearFromCodeMark, source, sourceNoYear, contentDraft, faculty*, viOnlyNote, expandSheet, collapseSheet`. `TEXT` cũ giữ nguyên (các khóa TopBar đã chuyển vẫn còn trong `TEXT`, chưa dùng).

## Chưa chắc / rủi ro
- Sheet mở rộng dùng `max-h-[min(88vh,calc(100dvh-8rem))]` thay vì 88vh trơn: với 88vh nút "Chế độ góp ý" (dòng 2 của TopBar) bị sheet che ở 390 px.
- Tên nút VI/EN: `aria-label` từng nửa là "Tiếng Việt"/"English"; `langSwitch` là nhãn của nhóm.
- Thanh cuộn ngang của chip hiện trên desktop (không ẩn).
- Chuỗi tab "Môn nổi bật" lấy tên môn từ curriculum; nếu highlight trỏ môn chỉ có trong nhóm tự chọn vẫn tìm được.

## Đề xuất
- N4: chuyển chuỗi buổi học / máy ảo / ReviewPanel sang `UI_TEXT`; xóa các khóa `TEXT` TopBar không còn dùng.
- Khi gộp: xóa `mau-*`, đặt `b11.majorIds` thật, thêm `b3` → `["qtkd"]`.
- `building-details.json` vẫn chỉ có tiếng Việt (đã có `viOnlyNote`).

## Cập nhật 2026-11-23 — chủ dự án chốt mục 11 PLAN
1. PDF không lên git. 3. B11 gom 7 ngành theo khoa là ổn. 4. QTKD/DTVT/COKHI: giữ `year: null` và tên tiếng Anh đề xuất.
2. Gán thêm ngành: **chưa sửa `campus.json` trong nhánh này** vì `mmt`, `dien` chưa tồn tại (N1/N2) và loader sẽ báo "Dữ liệu sai". Ánh xạ cần đặt lúc gộp (Claude làm):

| Tòa | `majorIds` |
| --- | --- |
| `b3` | `["qtkd"]` |
| `b6` | `["mmt"]` |
| `b8` | `["dien"]` |
| `b11` | `["ktpm", "mmt", "tdh", "dien", "cdt", "dtvt", "cokhi"]` (gom theo khoa) |

Sau khi gộp: kiểm tra panel B6/B8 chỉ có 1 chip (không gom khoa) và B11 có 7 chip.
