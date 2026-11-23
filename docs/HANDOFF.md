# HANDOFF — bàn giao cho đồng nghiệp

## 🧩 NHÁNH TỔNG HỢP (2026-11-23) — `PengWynIsMe/tong-hop` (chưa push, chưa vào main)

Gộp 9 nhánh trong ngày từ main (24483be): fix-fp-nhay, ngành (n2 ⊃ n1 ⊃ kế hoạch, n3), tuyết rơi, phòng máy 406, an-ninh-mang (⊃ codex-phu), canteen-trong, thu-vien-b4, khuon-vien.
Báo cáo đầy đủ + danh sách chủ dự án thử: **`docs/tasks/TONG-HOP-bao-cao.md`**. Dev: `http://localhost:5180/`.
- Ngành thật vào tòa: b3=QTKD, b6=MMT, b8=Điện, b11=7 ngành (gom khoa). Mẫu `mau-*` đã xóa. Năm học 3 ngành khung ngắn suy bằng `scripts/ctdt/infer-years.mjs` (chạy sau `extract.mjs`).
- Một trạng thái ngôn ngữ (`useLangStore`), chuỗi tuyết nằm trong `UI_TEXT`. Tuyết **bật mặc định** (`?snow=0` tắt, `?snow=1` bật). TopBar một hàng icon trên điện thoại.
- Trùng lặp đã chọn: nội thất căn tin = canteen-trong; nhà xe căn tin + bậc hồ = codex-phu; mặt tiền/sân căn tin, Highlands, nhà xe B5, hành lang/vườn = khuon-vien.
- Việc kế: chủ dự án thử theo báo cáo → sửa → merge vào main. `npm run dev` có `window.__stores` / `window.__gl` để đo/kiểm.

---

## 📋 KẾ HOẠCH MỚI (2026-11-23) — Ngành học thật + song ngữ (nhánh `PengWynIsMe/nganh-ke-hoach`, chưa gộp main)

Kế hoạch `docs/PLAN-NGANH-SONG-NGU.md`; brief N1 (Codex), N2 (Antigravity), N3 (Claude Sonnet), NR (Codex review) trong `docs/tasks/N*.md`.
Việc tiếp theo: chủ dự án trả lời câu hỏi PLAN mục 11 → tạo 3 worktree từ nhánh kế hoạch → chạy N1/N2/N3 song song → Claude gộp N3 → N1 → N2 → NR.

## ⚡ ĐANG CHẠY (2026-11-23) — Giai đoạn 2 "Một buổi học ở EIU"

Kế hoạch: **`docs/PLAN-GIAI-DOAN-2.md`**. Đã trong `main` (chưa push): W0, S1/S2 nhân vật + NPC, S3/S4 cỏ/gió/đường, S5/S6/S9 máy ảo + UI buổi học + âm thanh, S7/S7b bạn học ngồi, S8 phố xá, T07 chia bundle.

| Việc | Ai | Trạng thái |
| --- | --- | --- |
| FIX-NC sửa ngoại cảnh (đường, dây leo, cây, hành lang) | Antigravity — Orca worktree `fix-ngoai-canh` | ✅ Xong (`docs/tasks/FIX-NC-ngoai-canh.md`), 8 commit, 8 ảnh kiểm chứng |
| T19 thang + cây B8 | Antigravity — Orca worktree `~/orca/workspaces/eiu-simulator/t19-thang-cay` (nhánh `t19-thang-cay`) | ✅ Xong (`docs/tasks/T19-bao-cao.md`) |
| L3 + L6 phòng 406 + thầy + màn chiếu | Claude Sonnet | ✅ trong main (`docs/tasks/L36-bao-cao.md`) |
| L4 ngồi + camera + đưa tới lớp (`WalkMode`) | Antigravity | ✅ Xong (`docs/tasks/L346-bao-cao.md`), đã test đủ luồng, chụp ảnh `docs/tasks/L346-anh/` |

### Trạng thái hiện tại
Giai đoạn 2 đã gộp vào `main` và push (2026-11-23): T19 + L4 từ nhánh `t19-thang-cay`, bỏ nút tạm "Ngồi vào chỗ" (giờ ngồi bằng E / nút mobile "Ngồi (E)").
Còn lại: chơi thử checklist `docs/PLAN-GIAI-DOAN-2.md` mục 8 trên điện thoại, đo FPS, nghe âm thanh, kiểm bảo vệ chào.

---

Cập nhật: 2026-11-14 ~01:10 (Claude). Chủ dự án (PengWynIsMe) đi ngủ, **đồng nghiệp tiếp quản**.
Mới vào? Đọc `docs/ONBOARDING.md` trước, rồi file này, rồi `AGENTS.md`.

- Link chạy thật: **https://pengwynisme.github.io/eiu-simulator/** (tự cập nhật ~2 phút sau mỗi push `main`)
- Repo: https://github.com/PengWynIsMe/eiu-simulator — chỉ có nhánh `main`, không còn worktree/nhánh dở dang.

## 1. Hiện trạng (đã chạy được)

| Tính năng | Cách dùng | Task |
| --- | --- | --- |
| Khuôn viên EIU 3D đúng bố cục (khung nền OSM), khu vực 1 + 2 chi tiết | xoay/zoom chuột | T01–T03, T06 (đồng nghiệp) |
| Hover/chọn tòa nhà → **camera bay tới** + **panel thông tin** (phòng theo tầng, nguồn đã xác minh) | bấm tòa; "Về tổng quan" | T04, T05, T08, T10 |
| **Chế độ góp ý** — ghim ghi chú lên mô hình → GitHub Issue (nhãn `gop-y`) | nút "Chế độ góp ý" | T04 |
| **Đi bộ** — nhân vật robot CC0 có animation, WASD/mũi tên, Shift chạy, camera bám sau, cần ảo trên điện thoại | nút "Đi bộ" / phím V, Esc thoát | T09, T11 |
| **Vào trong Block 3** — sảnh + 3 tầng, va chạm tường, thẻ phòng, thang máy chọn tầng | đi bộ tới cửa B3 (mặt Bắc, gần (183, 19)) → **E**; thang máy **E** rồi **1/2/3** | T12 |

Claude đã tự chơi thử T12 (2026-11-14): vào cửa ✅, sảnh có vách kính/quầy + thẻ "Sảnh chính" ✅, đi lạc vào 100.B3 → thẻ phòng đổi đúng ✅,
bảng thang máy → tầng 2 ra trước thang máy ✅, Esc trong nhà → về toàn cảnh ✅, console sạch ✅. typecheck/lint/build sạch.

## 1b. Mới (2026-11-14 chiều)

- Người dùng chụp **sơ đồ thoát hiểm 4 tầng B8** + ảnh hành lang/sân trong → `references/toa-b8/` (không lên git; danh mục `info.md`).
- Claude sửa **mã phòng B8** trong `building-details.json` theo sơ đồ (dữ liệu cũ lệch ở tầng 1, 3, 4).
- **T13 + T13b + T14 xong, đã push (2026-11-14 tối):** vào được B8 (4 tầng, dựng theo tọa độ Claude đo từ sơ đồ — `docs/tasks/T13b-b8-toa-do.json`),
  1 thang máy/tầng, thang bộ 2 đầu + giữa + lõi Đông, sân trong lan can (không kính); camera trong nhà sau vai + phím C nhìn từ trên;
  nhân vật ngoài trời bám độ cao mặt đất (`walk/groundHeight.ts`). Hệ nội thất dùng chung: `scene/interior/layouts/<id>.ts`.
- Bài học: lần đầu (T13) để agent tự đọc sơ đồ → sai vị trí. **Claude phải đo/chốt số trước khi giao** (ghi trong `CLAUDE.md`).
- Còn thiếu ảnh B8: trong phòng học, cầu thang, sảnh thang máy, lối vào tầng 1.

## 2. Lỗi / hạn chế đã biết (ưu tiên sửa trước)

1. ~~T12 — chưa đi bộ tới được thang máy~~ (T13 báo đã sửa; Claude chưa tự đi lại được — cần người thử). **T12 — chưa ai đi bộ tới được thang máy** trong lần thử (Claude mở bảng thang máy bằng sự kiện `campussim:open-elevator`). Cần đi tay kiểm:
   từ sảnh có đường tới thang máy không, nút "E – Thang máy" có hiện không. Vị trí: `ELEVATOR_SPAWN_LOCAL` trong `src/scene/interior/b3Layout.ts`.
2. **T12 — chưa kiểm cửa "Ra ngoài" bằng phím E** (chỉ kiểm Esc). Và chưa kiểm trên điện thoại thật.
3. **T12 — nội thất là bản thử theo ảnh tour 360**, bố cục gần đúng; sàn đang xám trơn, chưa có trần (cố ý, để camera nhìn được).
   Khi có **sơ đồ thoát hiểm 3 tầng B3** → chỉnh `b3Layout.ts` cho đúng.
4. **T12 — vị trí nhân vật lưu ở biến cấp module** (`WalkMode.tsx`: `globalPlayerPos`...) vì `Campus.tsx` gỡ/gắn lại `<WalkMode/>` khi vào/ra nhà.
   Chạy được nhưng nên chuyển sang store (`useWalkStore`) khi có dịp.
5. **Nhân vật là robot** (RobotExpressive, CC0) — chưa tải được nhân vật người. Có file `.glb` người (CC0, có Idle/Walking/Running) thì chỉ cần thay
   `public/models/` + cập nhật `CREDITS.md`, code `src/scene/walk/PlayerCharacter.tsx` giữ nguyên (kiểm tên clip + scale).
6. Bundle JS ~1.2 MB (cảnh báo > 500 kB khi build) — tối ưu ở T07.

## 3. Việc tiếp theo (xếp theo ưu tiên)

| # | Việc | Agent gợi ý | Ghi chú |
| --- | --- | --- | --- |
| 1 | **Đọc góp ý** của người test và sửa | Claude / người | `gh issue list --repo PengWynIsMe/eiu-simulator --label gop-y --state open` + `review/notes.json`. Sửa xong đóng Issue kèm bình luận |
| 2 | **Sửa lỗi 1–2 ở mục 2** (đường tới thang máy, cửa ra bằng E) | Gemini | Phạm vi: `src/scene/interior/**`, `src/ui/interior/**`, `src/scene/walk/**` |
| 3 | **T07 màn hình tải + tối ưu** (bundle, `useProgress`, thử điện thoại thật) | Gemini → Claude review | Chưa có brief — viết theo `docs/tasks/_TEMPLATE.md` |
| 4 | **Nội thất block khác** (B11: 39 ảnh 360, B8: 60 ảnh) theo mẫu T12 | Gemini | Tách bố cục mỗi block thành `scene/interior/<id>Layout.ts`; tổng quát hóa phần đang viết riêng cho B3 |
| 5 | Nội dung **ngành học** thật của EIU (panel ngành) | Claude + người | Đề xuất: Kỹ thuật phần mềm, QTKD, Điều dưỡng. Cần link chương trình đào tạo |

## 4. Đang chờ người cung cấp

- **Ảnh cổng chính mới** (vòm cung, xây sau 08/2025) — hiện dựng tạm theo vệ tinh.
- **Sơ đồ thoát hiểm** mỗi tầng (B3 trước), 3 số đo (dài phòng, rộng hành lang, cao tầng); nếu có iPhone Pro: quét Polycam sảnh + 1 phòng.
- **Số tầng Block 6**.
- (Tùy chọn) file `.glb` nhân vật người CC0.

## 5. Cách giao việc cho agent (đã dùng, chạy tốt)

- Mỗi việc một brief `docs/tasks/T<số>-<tên>.md` (mẫu `_TEMPLATE.md`): mục tiêu, file **được / không được** sửa, tiêu chí xong, mẫu báo cáo.
- Chạy song song: mỗi luồng **một worktree + nhánh riêng**, nhóm file không giao nhau, cổng dev riêng (5174, 5175, 5176). Orca:
  ```bash
  orca worktree create --name t13-xxx --branch t13-xxx --base-branch main --no-parent \
    --agent antigravity --prompt "Đọc docs/ONBOARDING.md, AGENTS.md, docs/HANDOFF.md, rồi làm docs/tasks/T13-xxx.md ..." --json
  # Codex: --agent codex --model gpt-6-luna --effort medium
  ```
- **Codex hay hiện màn hình hỏi cập nhật** khi mở → prompt không tới. Gửi phím Esc (`orca terminal send --terminal <handle> --text $'\x1b'`) rồi gửi lại prompt bằng `orca terminal send ... --enter --wait-submit 20`.
- Agent không giữ phím được trong trình duyệt → tự thử bằng `window.dispatchEvent(new KeyboardEvent('keydown', {key: 'w'}))` trong console.
- **Luôn tự chơi thử trước khi gộp**: báo cáo của agent có lúc ghi "đạt" mà chưa đúng (T12 vòng đầu: báo xong nhưng vào nhà thấy cảnh trống; ghi chú phòng tự bịa).
- Gộp: commit trong worktree → `git merge` vào `main` → typecheck/lint/build → push → `orca worktree rm --worktree path:<...> --force --delete-branch`.

## 6. Quyết định đã chốt (đừng hỏi lại)

- Ưu tiên mô hình trước, ngành học sau. EIU không có ngành Thiết kế đồ họa.
- Góp ý của nhóm đi qua **GitHub Issues** (repo public; đồng nghiệp là contributor). Máy chạy `npm run dev` thì ghi `review/notes.json`.
- Số liệu phòng trong `src/data/building-details.json` là **số liệu thực tế đã xác minh** (Hieuthao63d).
- Nội thất B3 dựng theo tour 360 trước; sơ đồ thoát hiểm bổ sung sau.
- B4, B5 = 3 tầng; B8–B11 = 4 tầng (mỗi block là 2 nhà A/B); cầu nằm trên mặt hồ, hồ cao ~0.6 m.
- Lịch sử chi tiết từng task: `docs/ROADMAP.md`, `docs/tasks/T*-bao-cao.md`, `git log`.
