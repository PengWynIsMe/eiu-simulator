# Báo cáo CANTEEN-TRONG

- Đã thêm nội thất căn tin theo footprint OSM, lối vào/ra E, kết cấu mái và đèn, năm quầy có biển Việt/Anh, khu bàn ghế instancing và va chạm với biên, quầy, cụm bàn. Mặt tiền và sân không sửa.
- Sửa vòng lặp thông báo đồng bộ khi vào nội thất trong WalkMode; lỗi này gây tràn stack khi đặt vị trí người chơi.
- typecheck, lint, build: đạt. Trình duyệt Orca: vào và ra bằng E thành công; kiểm tra hàm va chạm quầy trả về vị trí trước; console không báo lỗi. Ảnh desktop tại CANTEEN-TRONG-anh/noi-that.png.
- FPS đo bằng requestAnimationFrame trong trình duyệt Orca trên máy này: khoảng 35 FPS trong 2 giây, cảnh đứng yên; không đại diện điện thoại thật. Chế độ giả lập 390×844 hiển thị cảnh và điều khiển, nhưng các thanh UI phía trên có chồng lấn; cần kiểm trên điện thoại thật và kiểm đi lại đầy đủ.
- Bố trí quầy, bàn và cửa là giả định theo ảnh, chưa có sơ đồ đo. Chưa kiểm va chạm bằng thao tác đi bộ ở mọi cụm bàn; cần người dùng xem hình và đối chiếu vị trí thực tế.
