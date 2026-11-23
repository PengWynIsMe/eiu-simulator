# N2 — Nội dung ngành song ngữ (mô tả, kỹ năng, nghề nghiệp, một ngày) + đối chiếu JSON của N1 với PDF

- Người làm: **Antigravity** · worktree + nhánh `nganh-n2-noi-dung`, **tạo từ `PengWynIsMe/nganh-ke-hoach`** · không cần dev server
- Đọc trước: `AGENTS.md`, `docs/PLAN-NGANH-SONG-NGU.md` (**mục 1, 3 (`MajorProfile`), 5.2, 8**), `src/data/building-details.json` (để biết phòng/lab có thật)
- Chạy song song với N1 (script trích môn) và N3 (giao diện). **Phần A làm ngay; phần B làm khi N1 báo xong.** Không commit, không push.

## Mục tiêu

8 file `src/data/majors/<id>.json` đúng kiểu `MajorProfile` (PLAN mục 3), viết **tiếng Việt + tiếng Anh**, dựa trên phần mục tiêu /
chuẩn đầu ra / vị trí việc làm của CTĐT thật. Và một báo cáo đối chiếu: bảng môn N1 trích ra có khớp PDF không.

## Chuẩn bị

```bash
mkdir -p references/ctdt && cp /Users/dinhtrananhminh/.orca/bots/pengwynnn/files/ctdt-eiu/*.pdf references/ctdt/
```

Đọc PDF trực tiếp, hoặc dump chữ bằng Swift + PDFKit có sẵn trên máy (đoạn `pdf-text.swift` trong `docs/tasks/N1-trich-bang-mon.md`,
ghi file ra **ngoài repo**, vd `/tmp/ctdt/BSE.txt`). Không cài thư viện. `references/**` không lên git.

## Được sửa / tạo

- `src/data/majors/qtkd.json`, `ktpm.json`, `mmt.json`, `tdh.json`, `dien.json`, `cdt.json`, `dtvt.json`, `cokhi.json` (mới — **không** có đuôi `.curriculum`)
- `docs/tasks/N2-doi-chieu.md` (mới), `docs/tasks/N2-bao-cao.md` (mới)

## KHÔNG được sửa

`src/data/majors/*.curriculum.json` (của N1 — chỉ đọc, kể cả khi thấy sai: ghi vào báo cáo đối chiếu), `scripts/**`, `src/types/**`,
`src/data/*.ts`, `campus.json`, `src/ui/**`, `src/scene/**`, mọi file khác.

## Bảng ngành (Claude đã xác định — PLAN mục 1)

| `id` | File | `facultyId` | `contentBasis` | Lấy nội dung từ (số trang PDF) |
| --- | --- | --- | --- | --- |
| `ktpm` | `BSE.pdf` — Kỹ thuật phần mềm | `cntt` | `bm08` | mục I–II tr. 2–6; kế hoạch mục VI tr. 49–53 |
| `mmt` | `CNDC.pdf` — Mạng máy tính & Truyền thông dữ liệu | `cntt` | `bm08` | tr. 2–6; mục VI tr. 47–52 |
| `tdh` | `ACE.pdf` — KT Điều khiển & Tự động hóa | `ky-thuat` | `bm08` | tr. 2–7; mục VI tr. 64–70 |
| `dien` | `BEE.pdf` — Kỹ thuật Điện | `ky-thuat` | `bm08` | tr. 2–7; mục VI tr. 61–66 |
| `cdt` | `MEE.pdf` — KT Cơ điện tử | `ky-thuat` | `bm08` | tr. 2–7; mục VI tr. 59–68 |
| `dtvt` | `DTVT.pdf` — KT Điện tử – Viễn thông (khung 9 tr.) | `ky-thuat` | `bang-mon` | chỉ có bảng môn + tên 5 chuyên ngành |
| `cokhi` | `COKHI.pdf` — KT Cơ khí (khung 5 tr.) | `ky-thuat` | `bang-mon` | bảng môn + 3 chuyên ngành |
| `qtkd` | `QTKD.pdf` — Quản trị kinh doanh (khung 7 tr.) | `kinh-te` | `bang-mon` | bảng môn + 8 chuyên ngành |

`degree.en` cho bản khung (file không ghi tên Anh) — dùng đề xuất PLAN mục 1: *Bachelor of Electronics and Telecommunications Engineering*,
*Bachelor of Mechanical Engineering*, *Bachelor of Business Administration*; ghi trong báo cáo là "đề xuất, chờ chủ dự án".

## Phần A — Viết 8 profile (làm ngay)

Mẫu khung (chữ trong ngoặc nhọn là chỗ điền; giữ đúng thứ tự khóa):

```json
{
  "id": "ktpm",
  "facultyId": "cntt",
  "name": { "vi": "Kỹ thuật phần mềm", "en": "Software Engineering" },
  "degree": { "vi": "Cử nhân Kỹ thuật phần mềm", "en": "Bachelor of Software Engineering" },
  "summary": { "vi": "{2–3 câu}", "en": "{2–3 sentences}" },
  "highlights": [
    { "code": "{MÃ 123}", "why": { "vi": "{1 câu}", "en": "{1 sentence}" } }
  ],
  "skills": [ { "vi": "{…}", "en": "{…}" } ],
  "careers": [ { "vi": "{…}", "en": "{…}" } ],
  "dayInLife": [ { "time": "07:30", "text": { "vi": "{…}", "en": "{…}" } } ],
  "contentBasis": "bm08",
  "contentStatus": "chua-duyet",
  "updatedAt": "2026-11-23"
}
```

Quy tắc (PLAN mục 5.2):

| Trường | Số lượng / độ dài | Lấy từ | Lưu ý |
| --- | --- | --- | --- |
| `summary` | 2–3 câu, ≤ 320 ký tự mỗi ngôn ngữ | mục I.1 Mục tiêu chung | Viết lại cho **học sinh lớp 12** đọc hiểu: học gì, làm ra cái gì. Bỏ văn hành chính ("phẩm chất chính trị, đạo đức tốt…") |
| `highlights` | **3–5** | bảng môn | Môn **đặc trưng ngành**, ưu tiên đồ án / thực hành / môn có sản phẩm. Không lấy chính trị, toán – lý đại cương, thể chất, tiếng Anh. `code` viết đúng dạng `CSE 103` (chữ hoa, 1 dấu cách) |
| `skills` | 4–6, ≤ 80 ký tự | mục II Chuẩn đầu ra (phần kỹ năng) | Cụ thể, động từ đầu câu ("Thiết kế và lập trình PLC…"), không chép PLO |
| `careers` | 4–6, ≤ 80 ký tự | mục I.4 Vị trí việc làm | Tên vị trí + 3–6 chữ mô tả |
| `dayInLife` | 5–7 mốc, giờ tăng dần | **minh họa** | Chỉ dùng thứ có thật: môn có trong bảng (đúng năm), phòng/lab có trong `building-details.json` (vd 406.B11 phòng máy CNTT, FabLab 210.B11, PTN Công nghệ 4.0 104.B11, PTN Thủy lực 108.B11, phòng thực hành điện B11, Trung tâm An ninh mạng 100.B6, Văn phòng Khoa QTKD B3, Thư viện B4, Căn tin). Học kỳ chính 10 tuần (mục VI); có chuẩn tiếng Anh đầu ra (vd KTPM: IELTS 6.0). Ngôn ngữ giảng dạy chỉ ghi nếu PDF nói rõ. **Không** bịa tên người, CLB, sự kiện, số liệu |

- Bản khung (`bang-mon`): không có mục I/II → viết từ tên ngành + chuyên ngành + bảng môn, giọng thận trọng ("Sinh viên học…", không hứa hẹn lương/tỷ lệ việc làm).
- Tiếng Anh: tự nhiên như trang tuyển sinh, không dịch từng chữ. Tên môn trong câu dùng đúng tên trong PDF.
- Không viết hoa toàn bộ, không emoji, không dấu "…" kéo dài. Một mục = một ý.
- `contentStatus` luôn `"chua-duyet"`. `updatedAt` = ngày bạn viết.

## Phần B — Đối chiếu JSON của N1 với PDF (khi N1 báo xong)

Coordinator sẽ báo đường dẫn worktree N1 (dạng `~/orca/workspaces/eiu-simulator/<tên>`). **Chỉ đọc** từ đó, không copy file vào nhánh N2.

1. Chạy `node <worktree-N1>/scripts/ctdt/check.mjs` với profile của bạn (xem README của N1 cách trỏ thư mục) → sửa profile tới khi
   `highlights[].code` đều có trong curriculum. Lỗi thuộc curriculum → ghi vào đối chiếu, không sửa.
2. Với **mỗi ngành**, so `<id>.curriculum.json` với PDF:
   - tổng TC, số chuyên ngành + tên, số nhóm tự chọn + `minCredits`;
   - **toàn bộ môn năm 1** + **10 môn ngẫu nhiên năm 2–4** (mã, tên vi, tên en, TC, năm/học kỳ);
   - mọi môn bắt buộc chuyên ngành của 1 chuyên ngành bất kỳ;
   - bản khung: năm suy từ mã có hợp lý không (chỉ ghi khi lệch rõ, vd đồ án tốt nghiệp ra năm 1).
3. Đã biết, phải kiểm: **BSE tổng 180 (mục IV) vs 183 (cộng mục VI)**; **QTKD trang 6 và 7 trùng** (không được ra môn trùng);
   tên tiếng Anh của DTVT/COKHI/QTKD tách đúng chưa; GDTC/GDQP bị bỏ có ghi lại không.

`docs/tasks/N2-doi-chieu.md`:

```
| Ngành | Mục | JSON (N1) | PDF (trang) | Mức | Đề xuất sửa |
|  ktpm | CSE 203 tên en | "Object Oriented Programing" | "Object-Oriented Programming" (tr. 50) | thấp | override tên |
```

Mức: **cao** = sai mã / sai tín chỉ / thiếu hoặc thừa môn bắt buộc / sai năm > 1; **trung bình** = sai học kỳ, sai nhóm tự chọn, tên en sai nghĩa;
**thấp** = chính tả, khoảng trắng. Cuối file: tổng số lỗi theo mức + "ngành sạch nhất / tệ nhất".

## Tiêu chí xong

- [ ] 8 file profile, JSON hợp lệ (`node -e "JSON.parse(require('fs').readFileSync('<file>','utf8'))"` cho từng file)
- [ ] Mỗi chuỗi có đủ `vi` và `en`, khác rỗng; số lượng mỗi trường đúng bảng quy tắc
- [ ] `check.mjs` của N1 chạy với profile của bạn: không lỗi phía profile
- [ ] `docs/tasks/N2-doi-chieu.md` đủ 8 ngành
- [ ] `git status`: chỉ có 8 profile + 2 file docs; không có PDF, không có `*.curriculum.json`

## Báo cáo → `docs/tasks/N2-bao-cao.md`

```
File đã tạo:
Nguồn từng ngành (trang PDF đã đọc):
Tóm tắt đối chiếu (số lỗi cao / trung bình / thấp mỗi ngành):
Chỗ phải suy luận (bản khung, dayInLife):
Tên tiếng Anh đề xuất cần chủ dự án duyệt:
Chưa chắc / rủi ro:
Đề xuất (nếu cần đổi schema):
```
