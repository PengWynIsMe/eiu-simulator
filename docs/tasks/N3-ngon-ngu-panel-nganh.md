# N3 — Lớp ngôn ngữ VI/EN + panel ngành học (tab năm, chuyên ngành, bottom sheet mobile)

- Người làm: **Claude Sonnet** · worktree + nhánh `nganh-n3-ui`, **tạo từ `PengWynIsMe/nganh-ke-hoach`** · `npm ci` · dev **`npm run dev -- --port 5178`**
- Đọc trước: `AGENTS.md`, `docs/HANDOFF.md`, `docs/PLAN-NGANH-SONG-NGU.md` (**mục 2, 3, 4, 6, 9**). Không cài gói. Không commit.
- Chạy song song với N1 (trích môn) và N2 (nội dung). Dữ liệu thật chưa có → **dùng 2 ngành mẫu** do bạn tạo (mục "Dữ liệu mẫu").

## Mục tiêu

1. Nút **VI | EN** trên TopBar: đổi ngôn ngữ toàn bộ TopBar, nhãn panel tòa nhà và panel ngành; tải lại trang vẫn nhớ.
2. Bấm tòa nhà có ngành → panel có tab **Ngành học** (mặc định) | **Tòa nhà**; xem ngành: tổng quan, môn theo **Năm 1–4**, chuyên ngành, nhóm tự chọn.
3. Trên điện thoại panel là bottom sheet thu gọn / mở rộng được.

## Được sửa / tạo (ngoại lệ: bạn được viết phần hợp đồng của Claude vì PLAN đã chốt nguyên văn)

| File | Việc |
| --- | --- |
| `src/types/major.ts` (mới) | Chép **nguyên văn** khối TS ở PLAN mục 3 (gồm `note?` trong `ElectiveGroup`). Không đổi tên/thêm trường |
| `src/types/index.ts` | Xóa `interface Major` và `interface Course` cũ; thêm dòng `export type * from './major';` |
| `src/data/validate.ts` | **Chỉ thêm** `loc(v, path): LocalizedText` (cả `vi`, `en` là chuỗi khác rỗng) |
| `src/data/majors.ts` (mới) | Loader: glob + kiểm tra + ghép (mục "Loader") |
| `src/data/index.ts` | Chỉ phần ngành: xóa hàm `major()` + đọc `root.majors`; lấy `majors` từ `./majors`; giữ nguyên `majors`, `getMajor`, `getMajorsOfBuilding` |
| `src/data/campus.json` | Chỉ: xóa khóa `"majors": []`; `b11.majorIds = ["mau-a", "mau-b"]` (Claude đổi sang ngành thật khi gộp) |
| `src/data/majors/mau-a.json`, `mau-a.curriculum.json`, `mau-b.json`, `mau-b.curriculum.json` (mới) | Dữ liệu mẫu |
| `src/store/useLangStore.ts` (mới) | PLAN mục 4.1 |
| `src/ui/text.ts` | Thêm `t`, `useT`, `UI_TEXT` (PLAN mục 4.2). Giữ nguyên `TEXT`; `BUILDING_PANEL_TEXT` chuyển hết sang `UI_TEXT` rồi xóa |
| `src/ui/major/**` (mới) | Component panel ngành |
| `src/ui/BuildingPanel.tsx` | Tab Ngành học / Tòa nhà, thanh nắm bottom sheet, chuỗi qua `useT` |
| `src/ui/TopBar.tsx` | Nút VI/EN; chuỗi TopBar qua `useT` + `UI_TEXT` (khóa `TEXT` cũ giữ nguyên, không xóa) |
| `docs/tasks/N3-bao-cao.md` | Báo cáo |

## KHÔNG được sửa

`src/scene/**`, `src/ui/lesson/**`, `src/ui/desktop/**`, `src/ui/walk/**`, `src/ui/interior/**`, `src/ui/ReviewPanel.tsx`, `src/App.tsx`,
store khác (`useCampusStore`, `useWalkStore`, `useLessonStore`, `useReviewStore`), `src/data/majors/` ngoài 4 file `mau-*`,
`scripts/**`, `package.json`, config. Cần đổi thêm → ghi đề xuất trong báo cáo.

## Hợp đồng dùng được

```ts
import { getBuilding, getMajor, getMajorsOfBuilding, getBuildingDetail } from '../data';
import { useCampusStore } from '../store/useCampusStore';   // selectedBuildingId, selectedMajorId, selectMajor(id), clearSelection()
import { useLangStore } from '../store/useLangStore';       // lang, setLang, toggleLang  (bạn viết)
import { t, useT, UI_TEXT } from './text';                   // (bạn viết)
import type { Major, Course, ElectiveGroup, Lang, LocalizedText } from '../types';
```

`selectBuilding(id)` đã tự chọn `majorIds[0]` → panel ngành có sẵn `selectedMajorId`.

## Yêu cầu chi tiết

### 1. Loader `src/data/majors.ts`

```ts
const files = import.meta.glob<unknown>('./majors/*.json', { eager: true, import: 'default' });
// key dạng './majors/ktpm.json' và './majors/ktpm.curriculum.json'
```

- Tách theo đuôi `.curriculum.json`. Kiểm tra bằng `obj/arr/str/num/oneOf/optStr/fail` của `./validate` + `loc()`; đường dẫn lỗi dạng `majors/ktpm.highlights[2].code`.
- Làm đủ 9 điều kiện "Kiểm tra trong loader" ở PLAN mục 3. Trường optional: `undefined` thì bỏ, có thì phải đúng kiểu.
- Xuất `export const majors: Major[]` đã sắp (khoa `cntt` → `ky-thuat` → `kinh-te`, rồi `name.vi`, `localeCompare('vi')`).
- **Bẫy:** đường dẫn trong `import.meta.glob` phải là chuỗi cố định. `tsconfig` bật `noUncheckedIndexedAccess` → `arr[0]` có kiểu `T | undefined`.

### 2. Ngôn ngữ

- `useLangStore` đúng PLAN 4.1: khóa `campussim.lang`, đọc 1 lần lúc tạo store trong `try/catch`, giá trị lạ → `'vi'`; `setLang` ghi `try/catch` +
  `document.documentElement.lang = lang`. Mẫu `try/catch` có sẵn ở `src/ui/audio/sfx.ts`.
- `text.ts`:
  ```ts
  export function t(text: LocalizedText, lang: Lang, vars?: Record<string, string | number>): string {
    const s = text[lang] || text.vi;
    return vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s;
  }
  export function useT() {
    const lang = useLangStore((s) => s.lang);            // chọn giá trị nguyên thủy — zustand v5 trả object mới sẽ vẽ lại vô hạn
    return useCallback((text: LocalizedText, vars?: Record<string, string | number>) => t(text, lang, vars), [lang]);
  }
  export const UI_TEXT = { ... } as const satisfies Record<string, LocalizedText>;
  ```
- Khóa `UI_TEXT` tối thiểu: chuỗi TopBar đang dùng (tiêu đề app, Đi bộ…, Chế độ góp ý…, Buổi học), toàn bộ `BUILDING_PANEL_TEXT` cũ, và cho panel ngành:
  `majorsTab` ("Ngành học ({n})" / "Programs ({n})"), `buildingTab`, `overview`, `courses`, `specializations`, `yearN`, `commonTrack` ("Chung" / "Core"),
  `credits` ("{n} TC" / "{n} cr"), `totalCredits`, `programCode`, `highlights`, `skills`, `careers`, `dayInLife`, `illustrative` ("minh họa" / "illustrative"),
  `electiveSlot` ("Tự chọn: {group} — {n} TC"), `chooseCredits` ("Chọn ≥ {n} TC trong {m} môn"), `chooseCourses` ("Chọn {n} trong {m} môn"),
  `yearsInferredNote`, `source` ("Nguồn: {file} · CTĐT {year}"), `sourceNoYear`, `contentDraft` ("Chưa duyệt" / "Draft — not yet reviewed"),
  `facultyCntt`, `facultyKyThuat`, `facultyKinhTe`, `viOnlyNote` ("Building details are in Vietnamese only for now" — chỉ hiện khi `en`),
  `expandSheet`, `collapseSheet`, `langSwitch` (aria-label). Tên khóa có thể khác, miễn đủ ý.

### 3. Nút VI | EN (TopBar)

Hai nửa trong một viên thuốc: `VI` | `EN`, nửa đang chọn nền đậm, `aria-pressed`, `aria-label` = `UI_TEXT.langSwitch`. Hiện ở **mọi chế độ** (đi bộ, góp ý, buổi học).
Chiều cao bằng các nút TopBar khác; trên điện thoại không đẩy nút khác rớt dòng xấu (thử 360 px).

### 4. Panel (`BuildingPanel.tsx` + `src/ui/major/**`)

- Tòa có `getMajorsOfBuilding(id).length > 0` → 2 tab đầu panel: **Ngành học (n)** (mặc định) | **Tòa nhà** (nội dung cũ, không đổi bố cục).
  Tòa không có ngành → panel như cũ. Khi `lang = 'en'`, tab Tòa nhà hiện thêm `viOnlyNote` (dữ liệu tòa chỉ có tiếng Việt).
- **Chọn ngành**: chip, gọi `selectMajor(id)`. Ngành thuộc **≥ 2 khoa** → gom theo khoa với tiêu đề nhỏ. Chip cuộn ngang trên điện thoại.
- **Đầu ngành**: tên (to), văn bằng, khoa · tổng TC · mã ngành (nếu có). Rồi 3 tab con:
  1. **Tổng quan**: `summary`; môn core (⭐ + mã + tên lấy từ curriculum theo `code` + câu `why`); kỹ năng; nghề nghiệp; **Một ngày** = dòng thời gian `time` + chữ, có nhãn "minh họa".
  2. **Môn học**: tab `Năm 1..4`; dãy chip chuyên ngành `Chung` + từng chuyên ngành (chỉ khi có). Chọn chuyên ngành → thêm `requiredCourses` có `year` = năm đang xem
     (đánh dấu nhẹ tên chuyên ngành). Dòng môn: mã (font mono) · tên · TC; có `semester` → nhãn nhỏ "HK{n}". Ô `electiveSlots` = dòng viền đứt, bấm mở danh sách môn của nhóm
     + dòng điều kiện (`chooseCredits` / `chooseCourses`, + `note` nếu có). `yearsInferred` → ghi chú `yearsInferredNote` trên đầu tab. Môn có `yearSource: 'ma-mon'` trong BM08 → dấu `*` nhỏ.
  3. **Chuyên ngành** (ẩn khi `specializations` rỗng): mỗi chuyên ngành gập/mở: môn bắt buộc + các nhóm tự chọn. Nhóm tự chọn không thuộc chuyên ngành nào hiện ở cuối tab này
     dưới tiêu đề "Tự chọn khác" (ngành không có chuyên ngành → hiện các nhóm này ở cuối tab Môn học).
  - Chân: `source` (file + năm, `year` null → `sourceNoYear`) + nhãn vàng `contentDraft` khi `contentStatus === 'chua-duyet'`.
- State tạm (tab, năm, chuyên ngành lọc, nhóm đang mở, sheet mở rộng) = `useState`. **Đổi ngành → về tab Tổng quan, Năm 1, Chung.**
- Component ngắn, một việc (vd `MajorPicker`, `MajorHeader`, `MajorOverview`, `MajorCourses`, `CourseRow`, `ElectiveGroupList`, `MajorSpecializations`, `LangToggle`). Không context, không HOC.

### 5. Bottom sheet (điện thoại, < `md`)

- Panel hiện là `fixed inset-x-3 bottom-3 max-h-[58vh]` → thêm **thanh nắm** trên cùng (vạch ngang 36×4 px trong vùng bấm cao ≥ 32 px): chạm để đổi `58vh` ⇄ `88vh`
  (`aria-expanded`, `aria-label` theo `expandSheet`/`collapseSheet`). Không kéo thả, không thư viện. Desktop (`md:`) không có thanh nắm, giữ panel phải; có thể nới `md:w-[420px]`.
- Thanh tab con và chip: `overflow-x-auto`, không xuống dòng; nút cao ≥ 40 px. Nội dung cuộn trong panel, đầu panel đứng yên.

### Dữ liệu mẫu (đúng schema, chữ ghi rõ là mẫu)

- `mau-a` (`facultyId: "cntt"`, `source.kind: "bm08"`, `yearsInferred: false`): tên `{ "vi": "Ngành mẫu A (dữ liệu mẫu)", "en": "Sample Program A (sample data)" }`;
  mỗi năm 4–6 môn có `semester`; 2 chuyên ngành, mỗi chuyên ngành 2 môn bắt buộc (năm 3–4) + 1 nhóm tự chọn `minCredits: 8` 4 môn; 1 nhóm đại cương `minCredits: 4` 5 môn có slot năm 1;
  1 nhóm có `note`; 3 highlights; 4 skills, 4 careers, 6 mốc dayInLife; `contentStatus: "chua-duyet"`.
- `mau-b` (`facultyId: "ky-thuat"`, `source.kind: "khung"`, `source.year: null`, `yearsInferred: true`, mọi môn `yearSource: "ma-mon"`): không chuyên ngành, 2 nhóm tự chọn, 3 highlights.
- Mã môn mẫu dạng `MAU 101`… để không lẫn với mã thật. Tên vi/en đủ cả hai; 1 tên dài ~70 ký tự để thử xuống dòng.

## Bẫy cần tránh

- Đừng import `scene/` từ `ui/` (và ngược lại). Đừng thêm gì vào `useCampusStore`.
- Đừng viết cứng tên ngành / môn trong component — mọi thứ từ `getMajor()` / `UI_TEXT`.
- `useT()` trong component; ngoài component (hàm thuần) dùng `t(text, lang)`.
- `Major.curriculum` là dữ liệu tĩnh → tính danh sách môn theo năm bằng `useMemo` theo `[major, year, specId]`, không tính lại mỗi render nặng.
- Đổi ngôn ngữ **không** được reset tab / năm đang xem.
- Không dùng `<Html>` của drei, không đụng `<Canvas>`.

## Tiêu chí xong

- [ ] `npm run typecheck`, `npm run lint`, `npm run build` sạch
- [ ] Bấm B11 → tab Ngành học có 2 chip gom 2 khoa; đổi chip đổi nội dung; tab Tòa nhà vẫn y như trước
- [ ] `mau-a`: Năm 1–4 đúng môn; chọn chuyên ngành → thêm môn bắt buộc năm 3–4; mở ô tự chọn thấy "Chọn ≥ 8 TC trong 4 môn"; tab Chuyên ngành có 2 mục
- [ ] `mau-b`: có ghi chú năm suy từ mã; không có tab Chuyên ngành
- [ ] Bấm EN → TopBar + panel đổi tiếng Anh, tab/năm đang xem giữ nguyên; F5 vẫn EN; `localStorage.removeItem('campussim.lang')` + F5 → VI; `<html lang>` đổi theo
- [ ] Giả lập storage hỏng: trong console `Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked') } })` rồi đổi ngôn ngữ → không văng lỗi (thử trước khi tải lại; ghi cách đã thử)
- [ ] Sửa tạm `mau-a.json` (vd xóa `en` của `summary`, hoặc highlight mã không tồn tại) → app báo `Dữ liệu sai ở majors/mau-a...`; hoàn tác
- [ ] DevTools 390×844 và 360×740: sheet thu/mở, tab + chip cuộn ngang, chữ không tràn; console không đỏ
- [ ] Chế độ đi bộ / góp ý / buổi học vẫn chạy như cũ (nút VI/EN không che nút khác)
- [ ] Chụp 4 ảnh (desktop VI, desktop EN, mobile thu gọn, mobile mở rộng) → `docs/tasks/N3-anh/`

## Báo cáo → `docs/tasks/N3-bao-cao.md`

```
File đã sửa/tạo:
Kết quả typecheck / lint / build:
Đã kiểm tra tay (theo từng ô tiêu chí):
Khóa UI_TEXT đã thêm / chuỗi cũ đã chuyển:
Chưa chắc / rủi ro:
Đề xuất (đổi hợp đồng, chuỗi còn chưa song ngữ):
```
