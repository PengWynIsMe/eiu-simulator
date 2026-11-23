# NR — Review cuối đợt "Ngành học song ngữ" (N1 + N2 + N3 đã gộp)

- Người làm: **Codex** · chạy trên nhánh Claude đã gộp N3 → N1 → N2 (Claude báo tên nhánh / worktree) · dev cổng **5179**
- Đọc trước: `AGENTS.md`, `docs/PLAN-NGANH-SONG-NGU.md` (toàn bộ), 3 brief + 3 báo cáo `docs/tasks/N1-*`, `N2-*`, `N3-*`
- **Chỉ đọc và báo cáo.** Không sửa code / dữ liệu, không commit. Lỗi → ghi vào báo cáo kèm `file:dòng` và cách sửa đề xuất.

## Chuẩn bị

```bash
npm ci
mkdir -p references/ctdt && cp /Users/dinhtrananhminh/.orca/bots/pengwynnn/files/ctdt-eiu/*.pdf references/ctdt/
npm --prefix scripts/ctdt ci     # nếu N1 dùng package riêng (xem scripts/ctdt/README.md)
```

## Checklist

### A. Cổng kiểm tra
- [ ] `npm run typecheck` 0 lỗi · `npm run lint` 0 lỗi · `npm run build` thành công (ghi kích thước bundle trước/sau nếu thấy tăng > 50 KB gzip)
- [ ] `package.json` / `package-lock.json` gốc **không** đổi so với `main` (`git diff main -- package.json package-lock.json` rỗng)
- [ ] `git ls-files references` không có PDF; không có `node_modules` nào được track

### B. Dữ liệu đúng schema, đủ 8 ngành
- [ ] `src/data/majors/` có đúng **16 file**: `qtkd, ktpm, mmt, tdh, dien, cdt, dtvt, cokhi` × (`.json` + `.curriculum.json`); **không còn** `mau-*`
- [ ] `node scripts/ctdt/check.mjs` exit 0; dán bảng tóm tắt
- [ ] App mở không lỗi `Dữ liệu sai ở ...` (loader N3 là chuẩn cuối cùng)
- [ ] Chạy lại `node scripts/ctdt/extract.mjs --date <generatedAt hiện tại>` → `git diff src/data/majors/*.curriculum.json` rỗng
- [ ] `src/types/major.ts` khớp nguyên văn PLAN mục 3 (so tay hoặc diff)
- [ ] Số chuyên ngành: qtkd 8 · ktpm 0 (4 nhóm định hướng) · mmt 3 · tdh 2 · dien 2 · cdt 2 · dtvt 5 · cokhi 3
- [ ] `yearsInferred = true` đúng 3 ngành `qtkd, dtvt, cokhi`; 5 ngành BM08 = `false`
- [ ] Mỗi profile: `highlights` 3–5 (mã có trong curriculum), `skills` 4–6, `careers` 4–6, `dayInLife` 5–7, mọi `LocalizedText` đủ `vi` + `en`; `contentStatus = "chua-duyet"`
- [ ] Lấy mẫu **5 môn / ngành** so với PDF (mã, tên vi/en, TC, năm) — ghi x/40
- [ ] `docs/tasks/N2-doi-chieu.md`: lỗi mức **cao** đã được sửa (qua `overrides.json`) hoặc có lý do để lại

### C. Gán tòa nhà
- [ ] `campus.json`: `b3.majorIds = ["qtkd"]`; `b11.majorIds = ["ktpm","mmt","tdh","dien","cdt","dtvt","cokhi"]` (hoặc theo quyết định mới ghi trong PLAN mục 7); không còn khóa `majors`

### D. Ngôn ngữ
- [ ] `grep -rn "localStorage" src/store/useLangStore.ts` — mọi đọc/ghi nằm trong `try/catch`; giá trị lạ → `'vi'`
- [ ] Không có thư viện i18n; `t()` / `useT()` / `UI_TEXT` ở `src/ui/text.ts`; `UI_TEXT` có `satisfies Record<string, LocalizedText>`
- [ ] Chuỗi mới trong `src/ui/major/**`, `TopBar.tsx`, `BuildingPanel.tsx` đều qua `UI_TEXT` hoặc dữ liệu (tìm chữ tiếng Việt viết cứng trong JSX: `grep -nP "[À-ỹ]" src/ui/major src/ui/TopBar.tsx src/ui/BuildingPanel.tsx`)
- [ ] Trình duyệt: VI → EN → F5 giữ EN; xóa khóa → VI; `<html lang>` đổi

### E. Giao diện (Orca browser hoặc Chrome, `npm run dev -- --port 5179`)
- [ ] B11 → 7 chip gom 2 khoa (CNTT, Kỹ thuật); B3 → QTKD; tòa không ngành (Căn tin) → panel như cũ
- [ ] Mỗi ngành mở được 3 tab; Năm 1–4 đều có môn; chuyên ngành lọc đúng; ô tự chọn mở được
- [ ] QTKD/DTVT/COKHI có ghi chú "năm học suy từ mã môn"; chân panel có nguồn + nhãn "Chưa duyệt"
- [ ] 390×844: sheet thu/mở, chip + tab cuộn ngang, không tràn chữ (thử tên môn dài nhất)
- [ ] Console không đỏ; đi bộ / góp ý / buổi học vẫn mở được

### F. Quy tắc dự án
- [ ] `scene/` và `ui/` không import lẫn nhau; không `any`, không `@ts-ignore`; không `<Html>` drei cho panel
- [ ] Không file nào ngoài bảng quyền PLAN mục 9 bị sửa (`git diff --stat <nhánh-kế-hoạch>...HEAD`)

## Báo cáo → `docs/tasks/NR-bao-cao.md`

```
Nhánh / commit đã review:
A–F: đạt / không đạt từng mục (kèm output lệnh):
Lỗi chặn gộp (file:dòng, cách sửa):
Lỗi nên sửa sau:
Lấy mẫu PDF (x/40):
Nhận xét chung (rủi ro khi merge main):
```
