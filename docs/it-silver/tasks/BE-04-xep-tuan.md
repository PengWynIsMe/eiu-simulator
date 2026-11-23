# BE-04 — Xếp tuần

**Bối cảnh chung.** Repo web 3D (React 18, TypeScript strict, zustand, Vite; không server). Đang làm chế độ kể chuyện "IT Silver": chọn chương, chơi cảnh, đăng ký môn, sổ kỷ niệm. "BE" = logic thuần chạy trong trình duyệt. Đọc `docs/it-silver/HOP-DONG.md` và `docs/it-silver/data/silver.types.txt` trước. Không thêm thư viện. Không `any`, không `@ts-ignore`. `noUncheckedIndexedAccess` bật. Hàm trong `src/silver/` không chạm DOM, `window`, `Date.now()`, `Math.random()`.

- Phụ thuộc: BE-00
- File được chạm: `src/silver/timetable.ts` (mới), test

## API

```ts
export interface TimetableCourse { code: string; core: boolean; lab: 'lab' | 'project' | null; theory: 0 | 2; }
export function buildTimetable(courses: TimetableCourse[]): Meeting[];   // ném Error nếu hết ca
export function toTimetableCourse(c: SilverCourse, core: boolean): TimetableCourse;
```

`toTimetableCourse`: `lt > 0, th > 0` → lab 'lab', theory 2; `th = 0` → null, 2; `lt = 0` → 'project', 0.

Thuật toán (phải đúng y để kết quả tất định). Ngày 0–5, ca 0–3.
1. Thứ tự môn: `core` trước, rồi còn lại; giữ thứ tự vào trong mỗi nhóm.
2. Xếp mọi buổi lab/project (length 2): thử `slot` 0 rồi 2; với mỗi slot thử ngày `0,2,4,1,3,5`; lấy chỗ đầu tiên trống cả hai ca.
3. Rồi theo thứ tự môn, xếp 2 buổi lý thuyết, từng buổi một (length 1): trong các ca trống chọn **điểm nhỏ nhất**:
   `(ngày đã có buổi môn này ? 1000 : 0) + (kề ngày đã có buổi môn này ? 100 : 0) + (ngày 5 ? 50 : 0) + tải(ngày)*10 + ngày + ca/10`. Tải = số ca đã dùng trong ngày.
4. Sắp theo `(day, slot)`; buổi lý thuyết sớm hơn của môn là `theoryA`, sau là `theoryB`.

## Ví dụ (mã kind ngày.ca×dài)

A. CSE 103(core, lab), MATH 112, POLS 135, COMS 101 (không lab):
`CSE103 lab 0.0×2; MATH112 A 1.0; POLS135 A 1.1; CSE103 A 2.0; COMS101 A 2.1; MATH112 B 3.0; POLS135 B 3.1; CSE103 B 4.0; COMS101 B 4.1`

B. CSE 103(core, lab), CSE 204(lab), POLS 135, COMS 101:
`CSE103 lab 0.0×2; CSE204 A 0.2; POLS135 A 1.0; COMS101 A 1.1; CSE204 lab 2.0×2; CSE103 A 3.0; POLS135 B 3.1; CSE204 B 4.0; COMS101 B 4.1; CSE103 B 5.0`

C. Sáu môn a–f đều lab, a là core: không ném lỗi, 18 buổi, không ca nào trùng; lab ở ngày a0 b2 c4 d1 e3 f5.
D. CSW 400 (project): `project 0.0×2`. E. Bảy môn lab → ném lỗi.

Bất biến test cho A–C: không trùng ca; lab nằm trọn một buổi; gọi hai lần ra giống nhau.

## Cách kiểm

`npm ci` (nếu worktree mới) → `npm run typecheck && npm run lint && npm run build && npm run test:silver` (riêng BE-00 tạo lệnh cuối). Test viết ở `scripts/silver/tests/timetable.test.mjs`, phủ hết ví dụ trên. Báo cáo: file đã sửa, kết quả bốn lệnh, điểm chưa chắc. Không commit/push khi điều phối chưa bảo.

## Ngoài phạm vi

UI, scene, nội dung, đổi kiểu trong `src/types/silver.ts`, file không liệt kê ở trên.
