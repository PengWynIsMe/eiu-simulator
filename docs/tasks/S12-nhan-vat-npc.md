# S1+S2 — Nhân vật Kenney + NPC ngoài trời (luồng B)

- Người làm: **Claude Sonnet #1** (agent nền) · Worktree/nhánh riêng · cổng dev **5174**
- Đọc trước: `AGENTS.md`, `docs/PLAN-GIAI-DOAN-2.md` (mục 1, 4, 5, 6). Không cài gói npm. Không commit.

## Mục tiêu

Robot biến mất; người chơi là nhân vật Kenney chibi cao 1.34 m có đi/chạy/đứng. Ngoài khuôn viên có sinh viên đi lại, 2 bảo vệ đứng cổng chào người chơi, 3 nhóm SV đứng nói chuyện.

## Được sửa / tạo

- `src/scene/characters/**` (mới)
- `src/scene/npc/**` (mới)
- `src/scene/walk/PlayerCharacter.tsx`
- Xóa `public/models/RobotExpressive.glb` + dòng robot trong `public/models/CREDITS.md`

## KHÔNG được sửa

`src/scene/walk/WalkMode.tsx`, `src/scene/interior/**`, `src/scene/Campus.tsx` (ghi dòng cần thêm vào báo cáo — Claude gắn), `src/store/**`, `src/data/**`, `src/types/**`, `src/ui/**`, config.

## Dùng được từ hợp đồng

```ts
import { characterConfig, npcRoutes } from '../../data';   // characterConfig.roles.*, .scale (2.0), .clips, .radius
import { useWalkStore } from '../../store/useWalkStore';                     // getState().playerPos {x,z,y,floor}, walkMode, interior, playerSkin
```
- `characterConfig.roles.player` … là URL đã ghép BASE_URL → dùng thẳng cho `useGLTF`.
- `characterConfig.clips`: `idle→'idle'`, `walk→'walk'`, `run→'sprint'`, `sit`, `yes→'emote-yes'`, `no`, `interact→'interact-right'`, `raiseHand→'pick-up'`.
- Độ cao mặt đất ngoài trời: `getGroundHeight(x, z)` ở `src/scene/walk/groundHeight.ts` (chỉ import, không sửa).
- `playerPos` hiện **chưa được ghi** (luồng A sẽ ghi). Tạm thời: NPC cần vị trí người chơi thì đọc `useWalkStore.getState().playerPos`; nếu bằng (0,0) coi như không có người chơi gần.

## Việc 1 — `characters/CharacterModel.tsx` (dùng chung cho player + mọi NPC)

```tsx
<CharacterModel url={...} clip="walk" timeScale={1} />   // group cha lo vị trí/hướng
```
- `useGLTF(url)` + **`SkeletonUtils.clone(scene)`** (`three/examples/jsm/utils/SkeletonUtils.js`) để nhiều NPC dùng chung 1 file. `useAnimations(animations, ref)`.
- `scale = characterConfig.scale`. Model nhìn về +Z (kiểm tra; ghi vào báo cáo).
- Khi `clip` đổi: `fadeOut(0.2)` clip cũ, `reset().fadeIn(0.2).play()` clip mới. Clip mặc định **`idle`** ngay khi mount (tư thế gốc là chữ T).
- Texture `Textures/colormap.png` nằm cạnh GLB (đã copy) → GLTFLoader tự nạp. Đặt `texture.colorSpace = SRGBColorSpace` nếu màu nhợt, `magFilter = NearestFilter` để giữ khối sắc nét.
- `castShadow` chỉ cho player.
- `useGLTF.preload` chỉ cho `roles.player`.

## Việc 2 — Thay robot trong `PlayerCharacter.tsx`

- Giữ nguyên props/hợp đồng hiện tại với `WalkMode` (đọc file trước). Thay model robot bằng `CharacterModel` với `roles.player` hoặc `roles.playerAlt` theo `useWalkStore(s => s.playerSkin)`.
- Ánh xạ trạng thái cũ: Idle→`idle`, Walking→`walk`, Running→`run`. Nếu PlayerCharacter có offset/scale riêng cho robot (1.70 m) → đổi theo cao 1.34 m. Chân phải chạm đất.
- Xóa `RobotExpressive.glb` khi không còn chỗ nào dùng (`grep -rn RobotExpressive src`).

## Việc 3 — `npc/CampusNpcs.tsx` (ngoài trời)

Render khi **không ở trong nhà** (`useWalkStore(s => s.interior) === null`). Hiện cả khi không đi bộ (nhìn từ trên vẫn thấy người).

| Loại | Số lượng | Hành vi |
| --- | --- | --- |
| SV đi bộ | **16** | Rải trên `npcRoutes.routes` (ưu tiên route dài; `roundabout-ring` 3 người, `r12-8` 3 người, còn lại 1/route). Vị trí bắt đầu ngẫu nhiên có seed cố định. Tốc độ 1.1–1.5 m/s, clip `walk`. `loop=false` → tới cuối quay đầu. Lệch phải `sideOffset` m theo hướng đi. y = `getGroundHeight`. Quay mặt theo hướng đi (lerp góc, không giật). |
| Bảo vệ | **2** | `npcRoutes.guards`: đứng `idle`, nhìn theo `facing`. Người chơi < 4 m → quay mặt về người chơi + phát `yes` 1 lần (hết 8 s mới chào lại). |
| Nhóm đứng | **3 × 2 người** | `npcRoutes.groups`: 2 người cách nhau 1.1 m quay mặt vào nhau, `idle`, thỉnh thoảng (8–15 s) một người phát `yes`/`no`. |

- Né người chơi: SV đi bộ dừng (clip `idle`) khi người chơi ở trước mặt < 1.2 m, đi tiếp khi tránh ra.
- Kiểu áo: chia đều `roles.students`; bảo vệ `roles.guard`; thêm 1 `roles.worker` đi trên `r2-0`.
- **LOD (bắt buộc)**: khoảng cách tới camera > 60 m → không cập nhật mixer (`mixer.update` bỏ qua / `timeScale=0`); > 120 m → `visible=false`. Không tạo object trong `useFrame` (vector tạm tạo bằng `useMemo` ngoài).
- Một `useFrame` chung cho cả đám NPC (vòng lặp mảng) tốt hơn 24 `useFrame` riêng; tùy bạn, miễn mượt.

## Bẫy

- `useGLTF` cùng URL trả về **cùng một scene** → phải clone bằng SkeletonUtils, không dùng `scene.clone()` (hỏng skinning).
- `useAnimations` gắn vào ref của group clone, không gắn vào scene gốc.
- Đừng dùng `<Html>` cho tên NPC.
- `npc-routes.json` là file sinh tự động, không sửa. Điểm nào trông sai (đi xuyên vật thể) → ghi vào báo cáo.

## Tiêu chí xong

- [ ] `npm run typecheck`, `npm run lint`, `npm run build` sạch.
- [ ] Tạm gắn `<CampusNpcs/>` vào `Campus.tsx` **chỉ trong worktree của bạn** để thử; báo cáo ghi rõ dòng import + vị trí gắn (Claude sẽ gắn lại khi gộp).
- [ ] Đi bộ: nhân vật Kenney đi/chạy/đứng đúng clip, chân chạm đất, không chữ T.
- [ ] Đếm được 16 SV đi, 2 bảo vệ, 6 người đứng; bảo vệ chào khi lại gần.
- [ ] FPS trước/sau (DevTools → Performance monitor hoặc `r3f-perf` KHÔNG được cài — dùng `renderer.info` / đếm khung hình) ghi vào báo cáo.

## Mẫu báo cáo

```
File đã sửa/tạo:
Dòng cần thêm vào Campus.tsx:
Kết quả typecheck / lint / build:
Đã kiểm tra tay (cách kiểm):
FPS trước / sau:
Chưa chắc / rủi ro:
Đề xuất:
```
