# S12 — Báo cáo (luồng B: nhân vật Kenney + NPC ngoài trời)

## File đã sửa/tạo

Tạo:
- `src/scene/characters/CharacterModel.tsx` — `forwardRef`, handle `{ play(clip, timeScale?), playOnce(clip, then?), setPaused(bool) }`. `useGLTF` + `SkeletonUtils.clone`, mixer riêng, crossfade 0.2 s, mount phát `idle` ngay (không fade + `mixer.update(0)`) nên không lộ chữ T. Texture `magFilter = Nearest`. `castShadow` theo prop (chỉ player bật).
- `src/scene/npc/npcPlan.ts` — seed cố định; dựng 16 walker, 2 guard, 6 người đứng; hình học route (cộng dồn độ dài, `sampleRoute` ghi vào object có sẵn, không cấp phát).
- `src/scene/npc/lod.ts` — `applyLod` (>60 m đóng băng mixer, >120 m ẩn), `turnToward`.
- `src/scene/npc/CampusNpcs.tsx` — `WalkingNpc`, `GuardNpc`, `ChatNpc`, mỗi NPC một `useFrame` nhẹ.

Sửa:
- `src/scene/walk/PlayerCharacter.tsx` — dùng `CharacterModel` (`roles.player` / `roles.playerAlt` theo `playerSkin`), clip idle/walk/run theo ref `moving`/`running`; giữ nguyên props + `CapsuleFallback` (thu nhỏ 0.79 cho khớp 1.34 m). `useGLTF.preload` chỉ `roles.player`.
- `public/models/CREDITS.md` — bỏ mục robot.
- Xóa `public/models/RobotExpressive.glb` (không còn tham chiếu trong `src`).
- Tạm sửa `src/scene/Campus.tsx` (xem dưới).

Lưu ý môi trường: worktree được tạo từ commit không có các file giai đoạn 2 (chưa commit ở `main`). Tôi đã chép từ checkout chính vào worktree để chạy được: `src/data/**`, `src/store/**`, `src/types/**`, `public/models/characters/**`, `docs/PLAN-GIAI-DOAN-2.md`, `docs/tasks/S*.md`, `T19*.md`. Đây là bản sao nguyên văn, KHÔNG sửa. Khi gộp chỉ lấy các file nằm trong "Được sửa/tạo" ở trên.

## Dòng cần thêm vào Campus.tsx

```tsx
import CampusNpcs from './npc/CampusNpcs';
// ...trong nhánh ngoài trời, ngay sau <ReviewPins />:
<CampusNpcs />
```
Không đặt trong nhánh `inInterior` (component tự trả `null` khi `interior !== null`, nhưng đặt ngoài nhánh trong nhà cho khỏi mount). Hiện cả khi `walkMode=false`. Đã gắn tạm như vậy trong worktree.

## Kết quả typecheck / lint / build

Cả 3 sạch (build chỉ có cảnh báo chunk > 500 kB đã có từ trước, thuộc việc T07).

## Đã kiểm tra tay (cách kiểm)

Không có GPU/trình duyệt nên kiểm bằng đọc code + script Node đọc JSON chunk của GLB:
- `character-male-a.glb`: 32 clip đúng tên (`idle`, `walk`, `sprint`, `sit`, `emote-yes`, `emote-no`, `interact-right`, `pick-up`...), texture `Textures/colormap.png`, mesh min y = 0 (chân chạm đất, không cần offset), max y = 0.671 (x2.0 = 1.34 m).
- Hướng: theo glTF/Kenney model nhìn +Z. `WalkMode` đặt `body.rotation.y = -facingYaw + PI/2`, đúng quy ước +Z như robot cũ (robot cũng nhìn +Z) nên không cần xoay thêm. NPC dùng `yaw = atan2(hx, hz)`, cùng quy ước.
- Không tạo object trong `useFrame` (route sample, state sim đều tạo bằng `useMemo`); không setState trong `useFrame`; vector tạm không có.
- Số lượng theo kế hoạch: walker 16 (ring 3, `r12-8` 3, 10 route dài nhất còn lại 1/route), guard 2, đứng 6 = 24 (đúng ngân sách mục 5).

## FPS trước / sau

Chưa đo được (không có trình duyệt có GPU). Cần Claude đo bằng trình duyệt thật. Ước lượng tải: 24 NPC x 1 mixer (7 khớp) + 24 vòng `useFrame` nhẹ; `getGroundHeight` chỉ gọi mỗi 0.2 s/NPC và chỉ khi NPC đang hiện (<120 m).

## Chưa chắc / rủi ro

1. **Hướng +Z chưa nhìn bằng mắt**: nếu nhân vật đi lùi thì đổi một chỗ: thêm `rotation={[0, Math.PI, 0]}` cho `<group scale>` trong `CharacterModel`.
2. **Số "16 SV đi" gồm cả 1 lao công** (`roles.worker` đi trên `r2-0`) để giữ trần 24 NPC. Nếu muốn 16 SV + 1 lao công thì thành 25, vượt mục 5. Đổi bằng `count`/`slice` trong `buildWalkers` nếu Claude chấp nhận.
3. Tốc độ clip `walk`: `timeScale = speed / 1.2` là ước lượng; nếu chân trượt thì chỉnh hằng `WALK_CLIP_SPEED` (đầu `CampusNpcs.tsx`).
4. `playerPos` do luồng A ghi; chưa ghi thì (0,0) → NPC coi như không có người chơi (đúng yêu cầu). NPC cũng chỉ phản ứng khi `walkMode=true`.
5. LOD đóng băng mixer ở 60–120 m nhưng NPC vẫn trượt theo đường (tránh dồn cục khi quay lại). Camera tổng quan ở rất cao (>120 m) sẽ ẩn hết NPC, đúng LOD brief nhưng "nhìn từ trên vẫn thấy người" chỉ đúng khi camera < 120 m.
6. Điểm trong `npc-routes.json` chưa kiểm xuyên vật thể bằng mắt. Nghi ngờ: guard `guard-main-gate` (249, -28.5) và `group-plaza` (24, 70) nên xem có đứng trên bồn/cây không. NPC y lấy từ `getGroundHeight` (không biết bậc thang/cây).
7. Hai người trong nhóm đứng gật/lắc độc lập (timer riêng 8–15 s mỗi người), không phối hợp.
8. Khi `playerSkin` đổi, `CharacterModel` remount theo `key=url`; `WalkMode` đã bọc `Suspense` (CapsuleFallback) nên không crash.

## Đề xuất

- Gắn `<CampusNpcs/>` như trên và xem bằng mắt: chiều đi, trượt chân, bảo vệ chào.
- Giai đoạn S7 (NPC trong lớp) dùng lại `CharacterModel` + handle (`play('sit')`, `playOnce('raiseHand')`).
