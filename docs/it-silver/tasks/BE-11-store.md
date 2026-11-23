# BE-11 — Store nối tất cả

**Bối cảnh chung.** Repo web 3D (React 18, TypeScript strict, zustand, Vite; không server). Đang làm chế độ kể chuyện "IT Silver": chọn chương, chơi cảnh, đăng ký môn, sổ kỷ niệm. "BE" = logic thuần chạy trong trình duyệt. Đọc `docs/it-silver/HOP-DONG.md` và `docs/it-silver/data/silver.types.txt` trước. Không thêm thư viện. Không `any`, không `@ts-ignore`. `noUncheckedIndexedAccess` bật. Hàm trong `src/silver/` không chạm DOM, `window`, `Date.now()`, `Math.random()`.

- Phụ thuộc: BE-01 … BE-10
- File được chạm: `src/store/useSilverStore.ts` (mới), test

## Làm

`export const useSilverStore = create<SilverApi>()(…)` thỏa kiểu `UseSilver`. Theo đúng `HOP-DONG.md` mục 3, 4, 5. Không import `src/ui`, `src/scene`. Để test được: `export function createSilverStore(deps)` nhận `{ kv, makeSeed, now: () => string, loadChapter, loadCourseContent, contentCodes }`; `useSilverStore` là bản dùng thật (`localStorage` bọc try/catch, `crypto.randomUUID()`, `new Date().toISOString()`).

- `load()` gọi lại được, chỉ nạp một lần; nạp 3 chương demo; chương lỗi → `status:'error'` và ghi `console.error` một lần. Chưa có JSON chương → thẻ `coming-soon`. Danh sách thẻ: `entrance` + 20 kỳ của lịch; kỳ chưa có chương lấy tiêu đề `Năm {y} · Kỳ {n}` / `Year {y} · Term {n}` (`.4`: `Năm {y} · Kỳ hè` / `Year {y} · Summer term`), subtitle liệt kê mã `core`.
- `startChapter` → `recap` chỉ cho chương có kỳ đứng trước mà `doneChapters` không chứa `1.1` **và** id khác `entrance`,`1.1`; `restart` khi đã có trang sổ vẫn được.
- Vào 2.2: `registration` (lấy `registrations['2.2']` nếu có, không thì mặc định). `confirmRegistration` bỏ qua khi `problem !== null`.
- Sau `opening` của kỳ và sau mỗi buổi học: màn `week`; `current` = buổi của item kế; `done` = buổi trước đó. Item kế không có `meeting` → vào thẳng `play`.
- Kết thúc cảnh: ghi flags tạm + `seen`, `run.itemId` = item kế, `writeSave`. `writeSave` false → `saveWarning='blocked'`, vẫn chơi.
- `saveMemory`: `replace` upsert; `keep-old` giữ; cả hai đều thêm `doneChapters`, `run=null`, về `home`. Không có trang cũ thì `keep-old` như `replace`.
- `clearAll` về bản rỗng seed mới, `home`.

## Ca test (dùng chương/môn giả nhỏ trong test)

1. Chơi hết `entrance` giả → done, 1 trang sổ, `run` null. 2. Thoát giữa cảnh 2 rồi tạo store mới cùng kv → resume vào cảnh 2 bước 0. 3. Choice có flag rồi thoát trước cuối cảnh → flag chưa ghi. 4. Sai → `canContinue` false; retry; sai; reveal → true. 5. skipItem không ghi seen. 6. 2.2 vào thẳng → recap → registration mặc định → week có 9 buổi. 7. kv ném → chơi hết được, `blocked`. 8. transcript hai lần giống nhau. 9. Chơi lại 1.1, `keep-old` giữ ảnh cũ.

## Cách kiểm

`npm ci` (nếu worktree mới) → `npm run typecheck && npm run lint && npm run build && npm run test:silver` (riêng BE-00 tạo lệnh cuối). Test viết ở `scripts/silver/tests/store.test.mjs`, phủ hết ví dụ trên. Báo cáo: file đã sửa, kết quả bốn lệnh, điểm chưa chắc. Không commit/push khi điều phối chưa bảo.

## Ngoài phạm vi

UI, scene, nội dung, đổi kiểu trong `src/types/silver.ts`, file không liệt kê ở trên.
