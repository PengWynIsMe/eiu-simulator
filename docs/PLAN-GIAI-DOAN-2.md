# Kế hoạch Giai đoạn 2 — "Một buổi học ở EIU" + khuôn viên sống động

Viết: Claude, 2026-11-23. Trạng thái: **đã chốt hướng, chờ người dùng bấm "chạy Wave 1".**
Mục tiêu phiên này: dùng hết ~5 giờ quota **song song 4 luồng** (1 Antigravity + 3 Claude Sonnet chạy nền), Claude điều phối + nghiệm thu.

---

## 0. Đã chốt (đừng hỏi lại)

| # | Quyết định | Nguồn |
| --- | --- | --- |
| 1 | Buổi học **Nhập môn lập trình — Java**, dài **~5 phút** | người dùng 2026-11-23 |
| 2 | Phòng: **406.B11** (tầng 4, "Phòng Máy tính CNTT") | `layouts/b11.ts` |
| 3 | Nhân vật: **Kenney Mini Characters 2.0** (CC0) — kiểu chibi khối, gần gũi | người dùng chọn "B" |
| 4 | Không backend, không AI chat, không chạy code thật. Bài tập chấm theo đáp án định sẵn | `AGENTS.md` mục 1 |
| 5 | Không thêm thư viện npm. Nhân vật/texture là file tĩnh trong `public/` | `AGENTS.md` mục 2 |
| 6 | Thêm: thầy cô, bạn học, **bảo vệ**, sinh viên đi lại, gió + cỏ + lá rơi, mặt đường thật hơn, nâng cấp camera | người dùng 2026-11-23 |

---

## 1. Tài nguyên nhân vật (Claude đã tải + kiểm tra)

Gói `kenney_mini-characters_2.0.zip` (opengameart.org, 4 MB, License.txt = CC0). Mỗi nhân vật 1 file GLB **~250 KB**, 1 texture `colormap` nhúng sẵn.
**Mọi nhân vật dùng chung 1 bộ xương 7 khớp** (`root, leg-left, leg-right, torso, arm-left, arm-right, head`) và **cùng 32 clip**:

`static, idle, walk, sprint, jump, fall, crouch, sit, drive, die, pick-up, emote-yes, emote-no, holding-right, holding-left, holding-both, …, interact-right, interact-left, wheelchair-*`

Clip dùng: `idle`, `walk`, `sprint`, `sit`, `emote-yes`, `emote-no`, `interact-right` (chỉ bảng / gõ phím), `pick-up` (giơ tay).

### Kích thước (đo từ đỉnh lưới)

| Đo | Đơn vị model | × **2.0** (chốt) |
| --- | --- | --- |
| Cao (chân → đỉnh đầu) | 0.671 | **1.34 m** |
| Rộng đầu | 0.453 | 0.91 m |
| Rộng thân (tay buông) | ~0.44 | ~0.88 m |
| Tư thế gốc | **chữ T** (tay ngang) — chỉ thấy khi không chạy clip; luôn phát `idle` khi khởi tạo | |

Hằng số: `CHARACTER_SCALE = 2.0`, bán kính va chạm `0.35 m`, mắt camera góc thứ nhất `1.55 m` (cao hơn màn hình máy tính 1.2 m).

### Vai → file (copy vào `public/models/characters/`)

| Vai | File | Nhận dạng |
| --- | --- | --- |
| Người chơi (mặc định) | `character-male-a.glb` | tóc đen, áo trắng |
| Người chơi (lựa chọn 2) | `character-female-a.glb` | |
| Thầy (Nhập môn lập trình) | `character-male-d.glb` | vest tối, cà vạt |
| Cô (dự phòng / văn phòng khoa) | `character-female-d.glb` | vest tím |
| **Bảo vệ** | `character-male-c.glb` | mũ kepi xanh kiểu bảo vệ |
| Lao công / kỹ thuật | `character-worker.glb` | mũ bảo hộ vàng |
| Sinh viên | `male-b, male-e, male-f, male-g, female-b, female-c, female-e, female-f` | 8 kiểu |

Không dùng: robot, zombie, alien, knight, raider, soldier, vũ khí. `RobotExpressive.glb` xóa khỏi `public/models/` khi nhân vật mới chạy.
Tổng tải nếu nạp cả 14 file: ~3.5 MB → **nạp chậm** (chỉ nạp file của vai đang xuất hiện).

---

## 2. Số liệu phòng 406.B11 (Claude chốt — agent dựng đúng số, không tự đoán)

Hệ tọa độ: `u, v` của `layouts/b11.ts` (đổi sang thế giới bằng `b11ToWorld`). Tầng 4, sàn cao như layout hiện tại.
Phòng = ô `makeUniformBays` thứ 3 cánh Bắc: **u 87.24 → 96.61 (9.37 m), v −148.1 (tường ngoài, cửa sổ) → −136.0 (tường hành lang)**, sâu 12.1 m.
Chưa có ảnh trong phòng → **bố cục chuẩn phòng máy**, sửa khi có ảnh tour 360.

| Vật | Vị trí (u, v) | Kích thước (m) | Ghi chú |
| --- | --- | --- | --- |
| Bảng trắng | tâm (87.42, −142.05), áp tường Tây | dài 3.6 × cao 1.2, mép dưới 0.9 | mặt nhìn về +u |
| Màn chiếu | tâm (87.45, −144.6) | 2.0 × 1.5, mép dưới 1.1 | hiện slide bài giảng |
| Máy chiếu trần | (91.0, −144.6), cao 3.3 | 0.4 × 0.3 × 0.15 | chĩa về màn chiếu |
| Bàn giáo viên | tâm (88.6, −140.0), xoay mặt về +u | 1.4 × 0.7, cao 0.75 | 1 màn hình + bàn phím |
| Vị trí đứng thầy | (88.2, −142.0) giảng; (88.6, −139.2) ngồi bàn | | |
| 4 dãy bàn SV | ghế ở **u = 90.6 / 92.2 / 93.8 / 95.4** | bàn sâu 0.6, cao 0.75; tâm bàn = u ghế − 0.45 | SV nhìn về −u (bảng) |
| Ghế mỗi dãy, khối Bắc | **v = −147.3, −146.3, −145.3, −144.3, −143.3** | khoảng cách 1.0 m | |
| Lối đi giữa | v −142.8 → −141.3 (1.5 m) | | |
| Ghế mỗi dãy, khối Nam | **v = −140.8, −139.8, −138.8, −137.8, −136.8** | | |
| Tổng | **40 chỗ**, mỗi chỗ 1 màn hình + bàn phím + chuột + case dưới bàn | | ghế cao 0.45 |
| **Ghế người chơi** | dãy 2, `u = 92.2, v = −140.8` (ghế sát lối đi) | | `seatId = "406-r2-s6"` |
| NPC sinh viên | 18 ghế (chọn sẵn trong `classrooms.json`), để trống quanh ghế người chơi 1 ô | | |
| Đèn | 6 tấm đèn trần tự phát sáng, lưới 2 × 3 | | không thêm `pointLight` |
| Điều hòa | 2 cái tường Bắc, cao 2.6 | | |

Cửa phòng giữ như layout B11 hiện tại. Nếu cửa trùng ghế ở v = −136.8 → bỏ ghế đó (còn 39 chỗ), không dời cửa.

---

## 3. Kịch bản buổi học `nmlt-01` (~5 phút)

| Phút | Bước | Nội dung |
| --- | --- | --- |
| 0:00 | Nhận lịch | HUD: "08:00 · Nhập môn lập trình · 406.B11" + la bàn chỉ hướng. Nút "Bắt đầu buổi học" đưa người chơi ra trước thang máy tầng 4 B11 (bỏ qua đoạn đi bộ dài) |
| 0:30 | Ngồi vào máy | Ghế `406-r2-s6` viền sáng → **E** (mobile: nút "Ngồi") → clip `sit`, camera hạ xuống sau vai rồi chuyển nhìn màn hình |
| 0:45 | Thầy chào | "Chào cả lớp! Hôm nay ta viết chương trình Java đầu tiên." → chọn "Dạ chào thầy!" / "Em sẵn sàng rồi ạ!" |
| 1:00 | Slide 1 | `System.out.println("Hello EIU");` — in một dòng chữ ra màn hình |
| 1:30 | Slide 2 | Vòng lặp `for (int i = 0; i < 3; i++)` — làm một việc nhiều lần |
| 2:00 | Câu hỏi | `for (int i = 0; i < 3; i++) System.out.print(i);` in ra gì? → `012` ✅ / `123` / `0123` |
| 2:45 | Bài 1 (máy ảo) | Điền: `System.out.______("Hello EIU");` → đáp án `println` → Chạy → Output `Hello EIU` |
| 3:45 | Bài 2 (máy ảo) | Điền: `for (int i = 0; i < ___; i++) System.out.println("EIU");` → đáp án `5` → Output 5 dòng EIU. Nút "Hỏi thầy" = gợi ý (−1 sao) |
| 4:30 | Tổng kết | Sao (0–3), thời gian, đóng dấu "Hộ chiếu ngành CNTT". Thầy `emote-yes`, SV đứng dậy (`idle` → `walk` ra cửa) |

Sai: thầy phản hồi giải thích ngắn (trong JSON), cho làm lại. Không bao giờ kẹt.

---

## 4. Hợp đồng mới (Claude code trong Wave 0 — các luồng chỉ *dùng*)

### 4.1 Dữ liệu (`src/data/`)

| File | Nội dung |
| --- | --- |
| `characters.json` | `roles: { player, teacher, guard, worker, students[] }` → đường dẫn GLB; `scale: 2.0`, `eyeHeight: 1.55`, `radius: 0.35` |
| `classrooms.json` | phòng `406.B11`: số liệu mục 2 (bảng, màn chiếu, bàn GV, `seats[{id,u,v,yaw}]`, `npcSeats[]`, `playerSeat`) |
| `lessons/nmlt-01.json` | các bước mục 3 (dialogue / lecture / question / exercise / summary) |
| `npc-routes.json` | đường đi NPC ngoài trời: Claude **sinh từ `layout.json`** (đường `internal` + `footway` + cầu), mỗi tuyến là polyline khép kín; điểm đứng bảo vệ ở cổng chính + cổng phụ; 3 nhóm SV đứng tán gẫu (quảng trường, căn tin, sảnh B11) |

Hàm thêm trong `data/index.ts`: `getLesson(id)`, `getClassroom(code)`, `characterConfig`, `npcRoutes`.

### 4.2 Store mới `src/store/useLessonStore.ts`

```ts
type LessonPhase = 'idle' | 'goToClass' | 'findSeat' | 'seated' | 'dialogue'
                 | 'lecture' | 'question' | 'exercise' | 'summary';
lessonId: string | null;  phase: LessonPhase;  stepIndex: number;
seatId: string | null;    desktopOpen: boolean; slideIndex: number;
stars: number;            hintsUsed: number;    startedAt: number | null;
answers: Record<string, string>;
lastResult: { correct: boolean; output: string; explain?: string } | null;
startLesson(id): void;     endLesson(): void;
sitDown(seatId): void;     standUp(): void;
openDesktop(): void;       closeDesktop(): void;
chooseOption(optionId): void;            // hội thoại + trắc nghiệm
submitExercise(exId, answer): void;      // ghi lastResult
useHint(exId): string;  nextStep(): void;
```

Scene đọc `phase/stepIndex/slideIndex` để điều khiển thầy + màn chiếu; UI đọc để hiện hộp thoại / máy ảo.
**Kiểm thử không cần 3D**: `window.__lesson = useLessonStore` chỉ khi `import.meta.env.DEV`.

### 4.3 Thêm vào `useWalkStore`

```ts
playerPos: { x: number; z: number; y: number; floor: number | null };  // cập nhật tối đa 5 lần/giây (không mỗi khung hình)
setPlayerPos(p): void;
playerSkin: 'male-a' | 'female-a';  setPlayerSkin(s): void;
```

Dùng cho: la bàn chỉ đường (UI), NPC quay đầu nhìn người chơi, bảo vệ chào khi lại gần. Đồng thời gỡ biến cấp module `globalPlayerPos` trong `WalkMode.tsx` (lỗi tồn đọng HANDOFF mục 2.4).

---

## 5. Ngân sách hiệu năng (bắt buộc mọi luồng)

| Hạng mục | Giới hạn |
| --- | --- |
| NPC ngoài trời | ≤ **24** cùng lúc (16 đi bộ, 2 bảo vệ, 6 nhóm đứng). Cập nhật animation chỉ khi cách camera < 60 m; > 120 m ẩn hẳn |
| NPC trong phòng học | ≤ 19 (18 SV + 1 thầy); chỉ render khi người chơi ở tầng 4 B11 |
| Cỏ | 1 `instancedMesh`, ≤ **40 000** ngọn, chỉ trong bán kính 70 m quanh camera (dời lưới theo camera) |
| Lá rơi | 1 `instancedMesh` ≤ 300 lá, quanh camera |
| Gió | **trong vertex shader** (`onBeforeCompile`), một uniform `uTime` dùng chung — không cập nhật ma trận cây trên CPU |
| Mặt đường | texture **sinh bằng canvas** lúc chạy (nhựa đường, vạch, gạch vỉa hè), 1024², `RepeatWrapping`; không tải ảnh ngoài |
| Nội thất 406 | ≤ 15 draw call cho cả phòng (mỗi loại đồ 1 instancedMesh) |
| Chung | FPS laptop ≥ 50, không tạo object trong `useFrame`, không shadow realtime mới |

---

## 6. Phân luồng + quyền sửa file (không giao nhau)

| Luồng | Agent | Chạy ở | Được sửa | KHÔNG được sửa |
| --- | --- | --- | --- | --- |
| **W0** | **Claude** | `main` | `src/data/**`, `src/store/**`, `src/types/**`, `public/models/characters/**` (copy file), `vite.config.ts`, `docs/**`, `AGENTS.md` | `scene/`, `ui/` |
| **A** | **Antigravity** (Gemini Hydrogen) | `main` (như T19) | `src/scene/interior/**`, `src/scene/walk/WalkMode.tsx`, `src/scene/walk/groundHeight.ts`, `src/scene/lesson/**` (mới) | `characters/`, `npc/`, `nature/`, `Ground.tsx`, `ui/` |
| **B** | **Sonnet #1** (nền, worktree `s1-characters`) | cổng 5174 | `src/scene/characters/**` (mới), `src/scene/walk/PlayerCharacter.tsx`, `src/scene/npc/**` (mới) | `WalkMode.tsx`, `interior/` |
| **C** | **Sonnet #2** (nền, worktree `s2-nature`) | cổng 5175 | `src/scene/Ground.tsx`, `src/scene/Trees.tsx`, `src/scene/trees/**`, `src/scene/Environment.tsx`, `src/scene/nature/**` (mới), `src/scene/street/**` (mới) | `interior/`, `walk/`, `zone*/` |
| **D** | **Sonnet #3** (nền, worktree `s3-ui`) | cổng 5176 | `src/ui/desktop/**`, `src/ui/lesson/**` (mới), `src/ui/text.ts` (chỉ thêm khóa mới), `src/App.tsx` (chỉ gắn 2 component) | `scene/` |

Điểm nối duy nhất giữa các luồng là `Campus.tsx` (gắn `<CampusNpcs/>`, `<Grass/>`, `<StreetProps/>`…): **chỉ Claude sửa khi gộp** (mỗi luồng ghi trong báo cáo dòng cần thêm).
Sonnet làm `scene/`/`ui/` là **ngoại lệ người dùng cho phép 2026-11-23** — Claude cập nhật bảng phân quyền trong `AGENTS.md`.

---

## 7. Lịch chạy (~5 giờ)

```
giờ  0:00 ─ W0 Claude: hợp đồng + data + copy model (≈30')
     0:15 ─ A  Antigravity: T19 (đã có brief) ───────────────┐
     0:30 ─ B, C, D Sonnet: Wave 1 (song song, chạy nền) ────┤
     2:00 ─ Claude gộp Wave 1 (B → C → D → A), chơi thử, sửa nhỏ
     2:30 ─ Wave 2: A (L3+L4+L6), B (NPC lớp học), C (phố xá), D (nối luồng)
     4:00 ─ Claude gộp Wave 2, chơi trọn buổi học
     4:30 ─ T07 tối ưu bundle (Claude: vite manualChunks; lazy trong Campus.tsx), HANDOFF, chờ duyệt commit
```

### Wave 1

| Task | Luồng | Việc | Xong khi |
| --- | --- | --- | --- |
| **T19** | A | Thống nhất thang + cây B8 (brief có sẵn) | brief T19 đạt |
| **S1** Nhân vật | B | `characters/CharacterModel.tsx`: nạp GLB theo vai (`useGLTF` + `SkeletonUtils.clone` để dùng 1 file cho nhiều NPC), `useAnimations`, đổi clip có crossfade 0.2 s. Thay robot trong `PlayerCharacter.tsx` (idle/walk/sprint theo tốc độ như hiện tại). Xóa `RobotExpressive.glb` | Đi bộ bằng nhân vật Kenney, đúng cao 1.34 m, chân chạm đất, không chữ T |
| **S2** NPC ngoài trời | B | `npc/CampusNpcs.tsx`: 16 SV đi theo `npc-routes.json` (tốc độ 1.1–1.5 m/s, lệch pha), 2 **bảo vệ** đứng cổng (quay mặt + `emote-yes` khi người chơi < 4 m), 3 nhóm 2 SV đứng `idle` quay vào nhau. Né người chơi: dừng khi người chơi chắn < 1 m. LOD theo mục 5 | Đi bộ thấy người qua lại tự nhiên, FPS giữ ≥ 50 |
| **S3** Thiên nhiên + gió | C | `nature/Grass.tsx` (cỏ instanced, gió shader, không mọc trên đường/tòa nhà/hồ — dùng `layout.json`), gió lắc ngọn cây cho `Trees.tsx` + `SalixAlbaTrees.tsx`, `nature/FallingLeaves.tsx`. Bầu trời: sương nhẹ xa | Cỏ + cây lay nhẹ, lá rơi quanh nhân vật |
| **S4** Mặt đường thật | C | `Ground.tsx`: texture canvas nhựa đường có hạt + vạch kẻ giữa đường `street` (vàng đứt) và mép (trắng), vỉa hè gạch, bó vỉa cao 0.15 m, cầu/footway gạch đỏ; vòng xoay có vạch. Giữ cao độ hiện tại (`groundLevels.ts`) | Nhìn sát mặt đường thấy vân + vạch, không nhấp nháy (z-fighting) |
| **S5** Máy tính ảo | D | `ui/desktop/EiuDesktop.tsx`: khung màn hình máy, màn đăng nhập (mã SV giả, bấm là vào), desktop 3 icon (Code Lab, Bài giảng, Thùng rác), `CodeLab.tsx`: soạn code có tô màu cú pháp Java đơn giản (tự viết, regex từ khóa), ô điền chỗ trống, nút **Chạy** → cửa sổ Output (gõ chữ dần). Chỉ đọc/ghi qua `useLessonStore` | Bằng console `__lesson`, làm trọn bài 1 + 2, đúng/sai hiện đúng |
| **S6** Lớp UI buổi học | D | `ui/lesson/LessonHud.tsx` (lịch + la bàn từ `playerPos`), `DialogueBox.tsx` (tên người nói, chữ chạy, 2–3 lựa chọn), `QuestionCard.tsx`, `LessonSummary.tsx` (sao, thời gian, dấu hộ chiếu). Mobile: hộp thoại đáy màn hình, nút to | Chạy hết `nmlt-01` chỉ bằng UI + store |

### Wave 2 (sau khi gộp Wave 1)

| Task | Luồng | Việc | Xong khi |
| --- | --- | --- | --- |
| **L3** Phòng 406 | A | `lesson/Classroom406.tsx`: dựng đúng bảng mục 2 bằng instancing (bàn, ghế, màn hình, bàn phím, case, bảng, màn chiếu, máy chiếu, đèn tấm, điều hòa). Va chạm bàn (thêm vào tường/vật cản của tầng 4) | Đếm đúng 40 chỗ, ≤ 15 draw call, đi lại không xuyên bàn |
| **L4** Ngồi + camera | A | Điểm tương tác `seat` (E / nút mobile), đặt nhân vật vào ghế + clip `sit`, camera: (1) mượt hơn (lerp vị trí + góc), (2) va chạm tường không giật, (3) lăn chuột zoom 2–6 m, (4) chạy nhanh tăng FOV 5°, (5) ngồi → camera nhìn màn hình → `openDesktop()`. Esc đứng dậy | Ngồi/đứng không kẹt, camera không xuyên tường |
| **L6** Thầy + màn chiếu | A | Thầy NPC ở vị trí giảng: `interact-right` khi giảng slide, `emote-yes/no` theo kết quả, quay về người chơi khi nói. Màn chiếu hiện slide (texture canvas từ chữ trong JSON) theo `slideIndex` | Màn chiếu đổi đúng slide, thầy phản ứng đúng |
| **S7** NPC trong lớp | B | `npc/ClassroomNpcs.tsx`: 18 SV ngồi `npcSeats` (clip `sit`, thỉnh thoảng `interact-right` như gõ phím, 1–2 bạn giơ tay `pick-up` khi có câu hỏi), màn hình NPC sáng texture code giả dùng chung. Tan lớp: đứng dậy đi ra cửa | Lớp đông, sống động, FPS ≥ 50 |
| **S8** Phố xá | C | `street/StreetProps.tsx` (instanced): đèn đường dọc đường nội bộ (25 m/cột), ghế đá quảng trường + căn tin, thùng rác, xe máy đậu ở nhà xe (2 kiểu, instanced), biển báo cổng | Khuôn viên đỡ trống, ≤ 8 draw call thêm |
| **S9** Nối luồng | D | Nút "Bắt đầu buổi học" ở TopBar/WalkHud, mobile layout máy ảo, âm thanh nhẹ bằng Web Audio (bíp gõ phím, chuông ra chơi — tự sinh, không file) | Từ màn hình đầu → tổng kết không cần console |

### Claude trong lúc các luồng chạy
- W0 (mục 4) + viết brief ngắn (`docs/tasks/S1..S9`, `L3/L4/L6`) theo mẫu "bảng số + tiêu chí".
- Sinh `npc-routes.json` bằng script nhỏ trong `scripts/` từ `layout.json`.
- Gộp theo thứ tự **B → C → D → A** (A ở `main` nên gộp cuối, tránh đè), chạy 3 cổng kiểm tra trên bản gộp, **tự chơi bằng trình duyệt Orca** theo checklist mục 8.

---

## 8. Checklist nghiệm thu cuối phiên

- [ ] Mở trang: tải xong, console không đỏ, không còn robot.
- [ ] Đi bộ từ cổng: bảo vệ chào, SV đi lại, cỏ + cây lay, lá rơi, đường có vạch.
- [ ] "Bắt đầu buổi học" → trước thang máy tầng 4 B11 → la bàn chỉ 406.
- [ ] Vào 406: 40 chỗ, 18 bạn ngồi, thầy ở bảng, màn chiếu sáng.
- [ ] E ngồi → thầy chào → 2 slide → câu hỏi → máy ảo 2 bài → tổng kết (≈ 5 phút).
- [ ] Chọn sai mọi lần vẫn đi tiếp được; Esc thoát bất cứ lúc nào.
- [ ] Chế độ điện thoại (DevTools): hộp thoại + máy ảo dùng được, FPS chấp nhận được.
- [ ] `typecheck` / `lint` / `build` sạch.

## 9. Rủi ro

| Rủi ro | Cách giữ |
| --- | --- |
| Gộp xung đột vì nhiều luồng | Bảng quyền file mục 6; `Campus.tsx` chỉ Claude sửa |
| Sonnet báo "đạt" mà chưa đúng | Claude tự chơi thử trước khi gộp (bài học T12) |
| Cỏ/NPC làm tụt FPS | Ngân sách mục 5; luồng phải in FPS trước/sau trong báo cáo |
| Antigravity đứt tài khoản | Luồng A chuyển cho Sonnet #4 (cùng phạm vi file) |
| Hết quota giữa chừng | Ưu tiên giữ: S1 → S5/S6 → L3/L4 → L6 → S2/S7 → S3/S4 → S8/S9. Mỗi task tự đứng được, dừng ở đâu cũng chạy |

## 10. Cố ý chưa làm

- Biên dịch / chạy Java thật trong trình duyệt (rất nặng).
- Thầy cô trả lời bằng AI (cần server + key).
- Nhiều người chơi cùng lớp (cần backend realtime).
- Nội thất phòng khác ngoài 406, các môn khác (Điều dưỡng, FabLab) → Giai đoạn 2b dùng lại khung này.
