# UI-03 — Câu hỏi, sắp câu, điền code

Đọc trước: `docs/it-silver/BAT-DAU-UI.md` (file được chạm, hình thức, mặc định), `HOP-DONG.md`, `data/silver.types.txt`. Dữ liệu qua `useSilver` từ `src/ui/silver/adapter.ts`. Wireframe là bố cục, không phải chữ cuối; chữ lấy trong bảng chuỗi (`text.ts`, hằng `ST`). Cách kiểm chung: chạy typecheck/lint/build, rồi mục 2–5 của `UI-TU-KIEM.md` cho màn này. Không chạm BE, scene, nội dung.

- Phụ thuộc: UI-02
- File: `steps/{Question,Order,Code}.tsx`

## Question

```
┌ (đọc) đoạn văn trong khung giấy cuộn được ─────────┐
│ (nghe) [▶ Nghe lại] [☑ Phụ đề]   Đây là mô phỏng   │
└────────────────────────────────────────────────────┘
 Câu hỏi?   (CodeBlock nếu có code)
 [1 · đáp án] [2 · đáp án] [3 · đáp án]
 ✕ Chưa đúng. Giải thích…      [Thử lại] [Xem lời giải]
```

- `listening`: dùng `speechSynthesis` nếu có (giọng `en-US`, tốc độ 0.9, đọc `passage.en`); chỉ đọc khi bấm, tắt khi rời bước hoặc khi `isMuted()`. Không có/đang tắt tiếng: tự bật phụ đề + dòng `noAudio`. Phụ đề mặc định tắt, bật được.
- Chọn → `answer(id)` ngay. Đúng: xanh ✓ + `explain`, khóa, `sfx.correct`. Sai: đỏ ✕ + `explain`, [Thử lại] = `retry`, [Xem lời giải] = `revealAnswer`, `sfx.wrong`. `revealed`: đáp án `correctAnswer` viền xanh ✓.

## Order

Danh sách dọc, mỗi dòng: số, câu, nút ↑ ↓ (44 px, có `aria-label`). Kéo thả bằng pointer là **tùy chọn**; nút ↑↓ bắt buộc. Thứ tự đầu theo `items`. [Kiểm tra] = `answer(ids.join(','))`. Sai/đúng/lời giải như Question; `revealed` xếp lại theo `correctAnswer`.

## Code

```
 Tiêu đề · hướng dẫn                         [💡 Gợi ý]
┌ nền #0f172a, số dòng, CodeSpans, ô nhập chỗ "___" ┐
└───────────────────────────────────────────────────┘
 [▶ Chạy]
 Kết quả: (pre đơn cách)  · mô phỏng, không chạy code thật
```

- Enter trong ô = Chạy; `autoCapitalize/autoCorrect/spellCheck` tắt; chữ ≥ 16 px trên cảm ứng; ô nhập cuộn vào giữa khi focus; phím trong ô không lan ra ngoài. Trống thì [Chạy] vô hiệu. Giữ khoảng trắng, cuộn ngang trong khung code, trang không tràn.
- [Gợi ý] = `showHint`, hiện `hint`. Sai: `output` đỏ + `explain` + Thử lại/Xem lời giải. `revealed`: điền `correctAnswer` vào ô.
- Không có sao, điểm, trừ điểm.

| Khóa | VI | EN |
|---|---|---|
| `retry` | Thử lại | Try again |
| `reveal` | Xem lời giải | Show answer |
| `correct` | Đúng rồi | Correct |
| `wrong` | Chưa đúng | Not yet |
| `revealed` | Lời giải | Answer |
| `listen` | Nghe | Listen |
| `listenAgain` | Nghe lại | Listen again |
| `captions` | Phụ đề | Captions |
| `noAudio` | Máy không phát được giọng đọc hoặc đang tắt tiếng, nên phụ đề được bật. | No voice available or sound is off, so captions are on. |
| `simListen` | Bài nghe mô phỏng ngắn | Short simulated listening |
| `check` | Kiểm tra | Check |
| `up` | Chuyển lên | Move up |
| `down` | Chuyển xuống | Move down |
| `run` | Chạy | Run |
| `output` | Kết quả | Output |
| `hint` | Gợi ý | Hint |
| `blank` | Chỗ cần điền | Blank to fill in |
| `simCode` | Mô phỏng, không chạy code thật | Simulated, no real code runs |

## Tiêu chí xong

- Mỗi loại đủ: chưa trả lời, sai, thử lại, sai lần hai, xem lời giải, đúng. Sau lời giải luôn [Tiếp] được.
- Phím 1–4 chọn ở Question (không khi đang ở ô nhập); Order làm được chỉ bằng bàn phím.
