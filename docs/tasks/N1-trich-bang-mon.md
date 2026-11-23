# N1 — Script trích bảng môn từ 8 PDF CTĐT → `*.curriculum.json`

- Người làm: **Codex** · worktree + nhánh `nganh-n1-trich-mon`, **tạo từ `PengWynIsMe/nganh-ke-hoach`** · không cần dev server
- Đọc trước: `AGENTS.md`, `docs/PLAN-NGANH-SONG-NGU.md` (**mục 1, 2, 3, 5** — schema và quy tắc xếp năm là hợp đồng, làm đúng nguyên văn)
- Chạy song song với N2 (nội dung) và N3 (giao diện). Không commit, không push.

## Mục tiêu

Một lệnh `node scripts/ctdt/extract.mjs` đọc 8 PDF trong `references/ctdt/` và ghi ra **8 file** `src/data/majors/<id>.curriculum.json`
đúng kiểu `MajorCurriculum` (PLAN mục 3). Chạy lại bao nhiêu lần cũng ra cùng kết quả (trừ `generatedAt`). Lỗi trích thì sửa bằng
file override, **không sửa tay JSON đầu ra**.

## Chuẩn bị

```bash
npm ci                                   # cho 3 cổng kiểm tra của app
mkdir -p references/ctdt && cp /Users/dinhtrananhminh/.orca/bots/pengwynnn/files/ctdt-eiu/*.pdf references/ctdt/
```

PDF có lớp chữ (không cần OCR). `references/**` không lên git — đừng `git add` PDF.

## Công cụ đọc PDF (máy này KHÔNG có poppler/pdftotext, mutool, pypdf, PyMuPDF)

**Cách chính — `pdfjs-dist` trong package riêng của script, KHÔNG đụng `package.json` gốc của app:**

```bash
mkdir -p scripts/ctdt
cd scripts/ctdt && npm init -y >/dev/null && npm install --save-exact pdfjs-dist@4.10.38 && cd -
# → scripts/ctdt/package.json + package-lock.json (commit được), scripts/ctdt/node_modules/ (đã bị .gitignore "node_modules/" bỏ qua)
```

- Trong script: `import { getDocument } from './node_modules/pdfjs-dist/legacy/build/pdf.mjs'` (bản legacy chạy trên Node 20; máy có Node 20.20).
  Hoặc đặt `"type": "module"` trong `scripts/ctdt/package.json` rồi `import ... from 'pdfjs-dist/legacy/build/pdf.mjs'` khi chạy với `cwd` là `scripts/ctdt`.
  Chọn một cách, ghi vào `scripts/ctdt/README.md`.
- `page.getTextContent()` trả `items[]` có `str` và `transform` (`transform[4]` = x, `transform[5]` = y). **Lớp chữ bị xáo thứ tự** (xem bẫy)
  → phải dựng lại bảng theo **tọa độ**: gom item thành dòng theo y (sai số ~2 pt), sắp theo x, chia cột theo x của tiêu đề
  `STT | Mã MH | Tên MH | Số tín chỉ` (bản khung) hoặc `HK | Mã MH | Tên môn học | Số tín chỉ | tiên quyết | song hành` (BM08 mục VI).
- Thêm script npm gốc? **Không.** Chạy trực tiếp `node scripts/ctdt/extract.mjs`.

**Dự phòng (không cài gì, chỉ macOS):** Swift + PDFKit có sẵn (`/usr/bin/swift`). Claude đã dùng để đọc thử:

```swift
// swift pdf-text.swift <in.pdf> <out.txt>  — chỉ ra chữ theo thứ tự lớp chữ, KHÔNG có tọa độ
import Foundation; import PDFKit
let a = CommandLine.arguments; let d = PDFDocument(url: URL(fileURLWithPath: a[1]))!
var s = ""; for i in 0..<d.pageCount { s += "\n=====PAGE \(i+1)=====\n" + (d.page(at: i)?.string ?? "") }
try! s.write(toFile: a[2], atomically: true, encoding: .utf8)
```

Dùng để dò/đối chiếu nhanh. Nếu `npm install` bị chặn mạng thì dừng và báo coordinator (đừng tự viết parser PDF từ đầu).

## Được sửa / tạo

- `scripts/ctdt/**` (mới): `package.json`, `package-lock.json`, `extract.mjs`, `check.mjs`, `majors.config.json`, `overrides.json`, `README.md` (cách chạy, công cụ, giới hạn). Tách thêm module `.mjs` nếu cần.
- `src/data/majors/<id>.curriculum.json` — 8 file: `qtkd, ktpm, mmt, tdh, dien, cdt, dtvt, cokhi`.
- `docs/tasks/N1-bao-cao.md`.

## KHÔNG được sửa

`package.json` / `package-lock.json` gốc, `src/data/majors/<id>.json` (profile của N2), `src/types/**`, `src/data/*.ts`, `src/ui/**`, `src/scene/**`, mọi file khác.

## Ánh xạ file → ngành (`scripts/ctdt/majors.config.json`, Claude đã xác định)

| `id` | File | `kind` | `year` | `programCode` | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| `ktpm` | `BSE.pdf` | `bm08` | 2026 | `7480103` | Không có chuyên ngành; tự chọn = 4 nhóm "Định hướng" (Ứng dụng di động / Front-end / Back-end / Tự chọn khác) → 4 `ElectiveGroup`, `specializations: []`, `note` ghi "hoàn thành ít nhất một trong nhóm 1–3" |
| `mmt` | `CNDC.pdf` | `bm08` | 2026 | `7480102` | 3 chuyên ngành: Quản trị mạng MT & truyền thông · An ninh mạng · Internet of Things |
| `tdh` | `ACE.pdf` | `bm08` | 2026 | `7520216` | 2: Tự động hóa công nghiệp · Hệ thống điều khiển |
| `dien` | `BEE.pdf` | `bm08` | 2026 | `7520201` | 2: Hệ thống điện & lưới điện thông minh · Năng lượng tái tạo & điện tử công suất |
| `cdt` | `MEE.pdf` | `bm08` | 2026 | `7520114` | 2: Robot · Hệ thống tích hợp. Không thấy chữ "Phụ lục IV" → dùng mục VI |
| `dtvt` | `DTVT.pdf` | `khung` | `null` | `null` | 5: Xử lý tín hiệu & hình ảnh · Hệ thống viễn thông · Kỹ thuật cao tần & anten · Thiết kế vi mạch · Hệ thống nhúng; + "Tự chọn kỹ thuật tự do" |
| `cokhi` | `COKHI.pdf` | `khung` | `null` | `null` | 3: Thiết kế cơ khí · Gia công chế tạo · Hệ thống năng lượng |
| `qtkd` | `QTKD.pdf` | `khung` | `null` | `null` | 8: Kế toán · Tài chính · QT nguồn nhân lực · Marketing · QT chuỗi cung ứng · QT nhà hàng – khách sạn · Khởi nghiệp · Phân tích kinh doanh |

Id chuyên ngành / nhóm tự chọn: kebab-case ASCII bỏ dấu, ngắn (`an-ninh-mang`, `iot`, `robot`, `dc-xa-hoi`, `dc-ngon-ngu`...). Tự đặt, ghi vào config.

## Yêu cầu chi tiết

1. **Nguồn bảng cho BM08** (số trang PDF Claude đã dò — PLAN mục 5.1): **mục VI** cho môn bắt buộc + năm/học kỳ + ô tự chọn + tiên quyết;
   **danh sách môn tự chọn** ngay sau mục VI cho `electiveGroups`; mục IV.3 dùng để lấy **khối kiến thức** (`block`) và tổng TC. Bỏ qua cột mô tả môn.
2. **Bản khung**: một bảng duy nhất, chia mục `1.x` / `2.x` / `3.`. Tiêu đề mục → `block`: "đại cương" → `dai-cuong`, "cơ sở ngành" → `co-so-nganh`,
   "Kiến thức ngành" → `nganh`, "chuyên ngành" → `chuyen-nganh`, "bổ trợ" → `bo-tro`, "tốt nghiệp"/"Khóa luận" → `tot-nghiep`.
   "tự chọn tối thiểu N tín chỉ" → `ElectiveGroup.minCredits = N`; "chọn tối thiểu K môn" → `minCourses`. Điều kiện lạ → `note` (vi + en).
3. **Xếp năm**: đúng bảng PLAN mục 5.1 (BM08 theo `HK x.y`; khung theo chữ số đầu của mã; `yearSource`; `yearsInferred`).
4. **Tên song ngữ**: tách `vi` / `en` theo kiểu từng file (bẫy dưới). Thiếu một bản → điền bằng `overrides.json` và ghi vào báo cáo; **không để trống, không tự dịch máy hàng loạt**.
   Chuẩn hóa khoảng trắng, bỏ xuống dòng giữa tên; giữ nguyên chính tả gốc (sửa lỗi gõ rõ ràng như "Interner of Things" qua override, ghi lại).
5. **Mã môn**: chuẩn `^[A-Z]{2,5} \d{3}[A-Z]?$` (ghép `MATH` + `111` bị ngắt dòng). Mã ngoài chuẩn (`LNGS-C101`, `PED`) giữ nguyên, liệt kê trong báo cáo.
6. **Tín chỉ**: `4(3,1)`, `4 (3|1)`, `4 (3, 1)` → `credits 4, lt 3, th 1`. Dòng tổng nhóm (vd `47(43,4)`) không phải môn.
7. **Khử trùng**: QTKD trang 6 = trang 7 → mỗi `code` một lần trong cùng danh sách. Một môn được ở nhiều nhóm khác nhau.
8. **Môn bắt buộc chuyên ngành** vào `specializations[].requiredCourses` (có `year` nếu biết), **không** vào `years[].courses`.
9. **`overrides.json`**: `{ "<id>": { "courses": { "<code>": { ...trường cần sửa } }, "drop": ["<code>"], "add": [...] } }` (hoặc dạng gọn hơn, ghi README).
   Mỗi override có trường `"why"` ngắn. Mục tiêu: càng ít override càng tốt, nhưng **đúng hơn nhanh**.
10. **Đầu ra ổn định**: thứ tự khóa theo thứ tự trong schema, mảng giữ thứ tự xuất hiện trong PDF, `JSON.stringify(x, null, 2)` + xuống dòng cuối.
    `generatedAt` lấy từ `--date YYYY-MM-DD` (mặc định hôm nay). `source.pages` ghi trang đã dùng.
11. **`check.mjs`** (không cần TypeScript): kiểm mọi quy tắc PLAN mục 3 "Kiểm tra trong loader" áp dụng cho curriculum (2–7),
    **và** cho profile `<id>.json` nếu file có mặt (N2 sẽ dùng lại — đọc từ worktree của bạn). In bảng tóm tắt mỗi ngành:
    `tổng TC trích được (bắt buộc + min tự chọn) | tổng TC trong PDF | số môn bắt buộc năm 1/2/3/4 | số nhóm tự chọn | số chuyên ngành`. Exit code ≠ 0 khi sai.

## Bẫy cần tránh

- **Lớp chữ bị xáo**: ở DTVT, một dòng chữ có thể là `"1 POLS 132 2 POLS 133 3 POLS 134 Tư tưởng Hồ Chí Minh"` rồi các cột tín chỉ dồn cuối trang.
  Đọc theo thứ tự chuỗi là **sai**. Dựng theo tọa độ x/y.
- Ba kiểu tên: QTKD `Philosophy of Marxism and Leninism (Triết học Mác-Lênin)` (Anh trước); DTVT `Tư tưởng Hồ Chí Minh` + `(Ho Chi Minh's Ideology)`;
  COKHI `Tư tưởng Hồ Chí Minh` xuống dòng `Ho Chi Minh's Ideology`. BM08 mục VI: tên Việt rồi tên Anh trên các dòng kế tiếp trong cùng ô.
- BM08 có **bảng lặp tiêu đề** mỗi trang (`HK Mã MH Tên Môn học ...`) và số trang in ở đầu trang — bỏ.
- Dòng "Giáo dục thể chất" / "Giáo dục quốc phòng" không có tín chỉ số ("Hoàn thành 3 môn GDTC", "Cấp chứng chỉ") → `credits` không có số:
  **bỏ khỏi danh sách môn**, ghi trong báo cáo (schema bắt buộc `credits > 0`).
- BSE: mục IV ghi tổng 180, bảng mục VI cộng ra 183 → **không tự sửa**, ghi cả hai vào báo cáo; `totalCredits` = số ở mục IV.
- Đừng thêm thư viện thứ hai (pdf-parse, pdf2json...). Một `pdfjs-dist` là đủ.

## Tiêu chí xong

- [ ] `node scripts/ctdt/extract.mjs` tạo đủ 8 file; copy ra thư mục tạm, chạy lần 2 cùng `--date` → `diff -r` rỗng (file chưa commit nên đừng dùng `git diff`)
- [ ] `node scripts/ctdt/check.mjs` exit 0, in bảng tóm tắt 8 ngành (dán vào báo cáo)
- [ ] Số chuyên ngành khớp bảng ánh xạ trên; tổng TC khớp PDF (hoặc giải thích lệch)
- [ ] Tự đối chiếu tay **10 môn ngẫu nhiên mỗi ngành** với PDF (mã, tên vi/en, TC, năm) — ghi kết quả
- [ ] `git status` không có PDF, không có `node_modules`, `package.json` gốc không đổi
- [ ] `npm run typecheck`, `npm run lint` (có lint `scripts/**/*.mjs`), `npm run build` sạch

## Báo cáo → `docs/tasks/N1-bao-cao.md`

```
File đã tạo:
Cách chạy + công cụ PDF đã dùng:
Bảng tóm tắt check.mjs (8 ngành):
Đối chiếu tay 10 môn/ngành (đúng x/10, lỗi gì):
Override đã dùng (số lượng + lý do chính):
Mã môn ngoài chuẩn / dòng bị bỏ:
Kết quả typecheck / lint / build:
Chưa chắc / rủi ro (ngành nào trích kém nhất):
Đề xuất (nếu cần đổi schema):
```
