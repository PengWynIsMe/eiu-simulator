# Hợp đồng chung (kiểu, dữ liệu, API)

Nguồn kiểu duy nhất: `docs/it-silver/data/silver.types.txt` → chép **nguyên văn** thành `src/types/silver.ts` (task BE-00). Đã qua `tsc --strict` cùng ba file dữ liệu trong `docs/it-silver/data/`. Import từ `'../types/silver'`, không thêm vào `src/types/index.ts`.

## 1. Ai sở hữu file nào

| Nhóm | Được chạm | Không được chạm |
|---|---|---|
| BE | `src/types/silver.ts`, `src/silver/**`, `src/data/silver/*.ts`, `src/data/silver/*.json`, `src/store/useSilverStore.ts`, `scripts/silver/**`, `package.json` (chỉ BE-00, chỉ mục `scripts`) | `src/ui/**`, `src/scene/**`, `src/App.tsx`, `src/data/silver/content/**`, `src/data/silver/chapters/**` |
| UI | `src/ui/silver/**`, và đúng hai chỗ nối: `src/App.tsx` (1 import + 1 dòng JSX), `src/ui/TopBar.tsx` (1 nút) | mọi file của BE và ND, `src/ui/text.ts`, `src/scene/**`, mọi store |
| ND | `src/data/silver/content/**`, `src/data/silver/chapters/**` (JSON) | mọi file code |

Ngoại lệ duy nhất: nếu `src/types/silver.ts` chưa có trên main, UI được chép nguyên văn từ `data/silver.types.txt`; hai bên giống từng byte nên ghép không xung đột.
Muốn đổi kiểu hoặc API: ghi đề xuất trong báo cáo, không tự đổi.

## 2. Luồng dữ liệu

```
JSON (ND, BE) → loader + kiểm → logic thuần src/silver/** → useSilverStore (SilverApi)
                                                              ↑
src/ui/silver/** → adapter.ts → (lúc đầu) mock/useSilverMock ─┘ (khi ghép) đổi 1 dòng
```

- UI **chỉ** nói chuyện với `useSilver` xuất từ `src/ui/silver/adapter.ts`, kiểu `UseSilver`. Không import `src/silver`, `src/data/silver`, `src/store/useSilverStore`.
- Store trả dữ liệu đã tính xong (`RegistrationView`, `PlayView`…). UI không chấm bài, không kiểm tiên quyết, không áp `variants`.
- `SilverApi` là trạng thái + hành động. Selector trả về mảng/object mới mỗi lần sẽ gây vẽ lại vô hạn: chỉ chọn trường có sẵn.

## 3. Luồng trạng thái

`closed → home → (recap) → …`

- Chương không đăng ký (`entrance`, `1.1`): `home → play → (transcript) → memory → home`.
- Chương đăng ký (`2.2`): `home → recap (chỉ khi chưa xong chương trước) → registration → play (opening) → week ⇄ play (từng buổi) → play (thi, closing) → memory → home`.
- `exitRun` từ bất kỳ đâu trong chương → `home`, giữ `run`. `startChapter(id,'resume')` vào lại đúng item, bước 0. `restart` xóa `run` cũ của chương, giữ `flags`, `seen`, `notebook`.
- Chỉ có **một** `run` dở. Bắt đầu chương khác khi đang dở: UI hỏi xác nhận (UI-01), store thay `run`.

## 4. Quy ước tương tác

- `choice`: không đúng/sai. `answer(id)` → `feedback.kind='choice'`, `canContinue=true`. Có `flag` thì ghi `flags[flag]=id` **khi cảnh kết thúc**; thoát giữa chừng thì chưa ghi.
- `question`/`order`/`code`: `answer(...)` → `feedback.kind='graded'`. Sai: `retry()` xóa feedback để làm lại, hoặc `revealAnswer()` → `revealed=true, canContinue=true`, kèm `correctAnswer`. Đúng: `canContinue=true`. Không bao giờ kẹt, không trừ điểm.
- `say`/`slide`: `canContinue=true` ngay.
- `showHint()` chỉ tác dụng ở `code`; điền `play.hint`.
- `answer` cho `order`: id nối dấu phẩy, vd `"y,x,z"`. `correctAnswer` của `order` cũng là dạng này; `question` trả id; `code` trả chuỗi đầu trong `answers`.
- `seen` ghi khi đi hết bước cuối của cảnh. `skipItem` không ghi `seen`, không ghi `flags`.
- Điểm bốn kỹ năng là kết quả **nhân vật**, suy từ `seed` (không từ câu trả lời), luôn cùng kết quả khi xem lại.
- Từ ngữ `place`: mã phòng hoặc mã tòa; UI chỉ hiện nhãn, bản thử không bay camera.

## 5. Lưu

`localStorage['campussim.silver.v1']` = `SilverSave`. Hỏng JSON/sai version → chép chuỗi cũ sang `campussim.silver.v1.bak`, dùng bản mới, `saveWarning='corrupt'`. Bị chặn → chạy trong bộ nhớ, `saveWarning='blocked'`. Không lưu tên thật, email. Không gửi mạng.

## 6. Dữ liệu mẫu

- `data/courses.ktpm.json` (`SilverCatalog`), `data/plan.ktpm.json` (`GamePlan`): nội dung thật, BE chép sang `src/data/silver/`.
- `data/ui-fixture.json`: đủ 7 loại bước, mọi trạng thái môn, tuần, bảng điểm, sổ kỷ niệm. Dữ liệu giả cho UI; chữ trong đó **không** phải nội dung cuối.
