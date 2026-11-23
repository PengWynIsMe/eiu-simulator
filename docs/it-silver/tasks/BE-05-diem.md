# BE-05 — Điểm bốn kỹ năng tất định

**Bối cảnh chung.** Repo web 3D (React 18, TypeScript strict, zustand, Vite; không server). Đang làm chế độ kể chuyện "IT Silver": chọn chương, chơi cảnh, đăng ký môn, sổ kỷ niệm. "BE" = logic thuần chạy trong trình duyệt. Đọc `docs/it-silver/HOP-DONG.md` và `docs/it-silver/data/silver.types.txt` trước. Không thêm thư viện. Không `any`, không `@ts-ignore`. `noUncheckedIndexedAccess` bật. Hàm trong `src/silver/` không chạm DOM, `window`, `Date.now()`, `Math.random()`.

- Phụ thuộc: BE-00
- File được chạm: `src/silver/grades.ts` (mới), test

## API

```ts
export function fnv1a(s: string): number;              // 32-bit không dấu, trên byte UTF-8
export function englishGrades(seed: string, level: 1 | 2 | 3 | 4 | 5): Transcript;
export function isPassing(t: Transcript): boolean;     // tối đa hai D
```

- FNV-1a: bắt đầu `0x811c9dc5`; mỗi byte: XOR rồi `Math.imul(h, 0x01000193) >>> 0`.
- Với `attempt` 0…19: điểm kỹ năng k = `'DCCCCBBBBA'[fnv1a(`${seed}|${level}|${k}|${attempt}`) % 10]`, k lần lượt `listening, reading, writing, speaking`. Nhận bộ đầu tiên có ≤ 2 D. Hết 20 lần → C C B B.
- Không phụ thuộc câu trả lời người chơi.

## Ví dụ

| Gọi | Ra (L R W S) |
|---|---|
| `fnv1a("")`, `fnv1a("a")`, và chuỗi ghép `["demo","1","listening","0"].join("\|")` | 2166136261, 3826002220, 1894222480 |
| seed `demo`, level 1…5 | `D C B C` · `C D C B` · `D B C C` · `C B D B` · `C C B B` |
| seed `eiu-1`, level 1…5 | `B C B C` · `A C C C` · `B B B C` · `B C C C` · `C C B C` |

Test thêm: 1000 seed `s0…s999` × 5 level đều `isPassing`.

## Cách kiểm

`npm ci` (nếu worktree mới) → `npm run typecheck && npm run lint && npm run build && npm run test:silver` (riêng BE-00 tạo lệnh cuối). Test viết ở `scripts/silver/tests/grades.test.mjs`, phủ hết ví dụ trên. Báo cáo: file đã sửa, kết quả bốn lệnh, điểm chưa chắc. Không commit/push khi điều phối chưa bảo.

## Ngoài phạm vi

UI, scene, nội dung, đổi kiểu trong `src/types/silver.ts`, file không liệt kê ở trên.
