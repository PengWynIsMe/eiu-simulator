# TNN — <Tên task>

- Người làm: <Gemini | Claude>
- Nhánh: `tNN-ten-ngan`
- Phụ thuộc: <task phải xong trước>

## Mục tiêu

<1–3 câu: người dùng thấy gì khi task xong.>

## Được sửa

- `src/...`

## KHÔNG được sửa

- `src/store/**`, `src/data/**`, `src/types/**`, config gốc (trừ khi brief ghi khác)

## Dùng được từ hợp đồng

<action/selector của store, hàm của data/index.ts mà task này dùng.>

## Yêu cầu chi tiết

1. ...

## Bẫy cần tránh

- ...

## Tiêu chí xong

- [ ] `npm run typecheck` 0 lỗi
- [ ] `npm run lint` 0 lỗi
- [ ] `npm run build` thành công
- [ ] Kiểm tra tay: ...

## Mẫu báo cáo (agent điền khi xong)

```
File đã sửa/tạo:
Kết quả typecheck / lint / build:
Đã kiểm tra tay:
Chưa chắc / rủi ro:
Đề xuất (nếu cần đổi hợp đồng hoặc thêm thư viện):
```
