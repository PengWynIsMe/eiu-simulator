// Chuỗi giao diện tiếng Việt. Nội dung ngành học KHÔNG để ở đây (nằm trong campus.json).
export const TEXT = {
  appTitle: 'Khám phá EIU',
  osmCredit: 'Bản đồ nền © OpenStreetMap contributors',

  // TopBar
  walkBtn: 'Đi bộ',
  walkBtnActive: 'Đang đi bộ',
  walkBtnTip: 'Bật chế độ đi bộ tham quan',
  walkBtnActiveTip: 'Thoát chế độ đi bộ',
  reviewBtn: 'Chế độ góp ý',
  reviewBadgeActive: 'Đang bật',
  reviewBtnTip: 'Bật/tắt chế độ để lại ghi chú góp ý',

  // ReviewPanel
  reviewTitle: 'Chế độ góp ý',
  reviewSubtitle: 'Ghi chú và phản hồi về mô hình 3D',
  reviewPrompt: 'Bấm vào tòa nhà, công trình hoặc mặt đất trong mô hình 3D để tạo ghim góp ý.',
  closeReview: 'Đóng chế độ góp ý',

  // Draft form
  draftTitle: 'Tạo góp ý mới',
  targetLabel: 'Vật thể:',
  groundPin: 'Ghim trên mặt đất',
  coordsLabel: 'Tọa độ:',
  categoryLabel: 'Loại góp ý:',
  contentLabel: 'Nội dung góp ý:',
  contentPlaceholder: 'Mô tả chi tiết điểm cần sửa (ví dụ: thiếu cửa sổ, sai màu, lệch vị trí, sai số tầng)...',
  authorLabel: 'Tên người góp ý:',
  authorPlaceholder: 'Nhập tên của bạn...',
  saveDraftBtn: 'Lưu góp ý',
  cancelDraftBtn: 'Hủy',

  // Filters & Tabs
  filterOpen: 'Đang mở',
  filterResolved: 'Đã sửa',
  filterAll: 'Tất cả',
  noNotes: 'Chưa có ghi chú nào.',
  noFilteredNotes: 'Không có ghi chú nào trong mục này.',

  // Note Card
  statusOpen: 'Đang mở',
  statusResolved: 'Đã sửa',
  authorPrefix: 'Người ghi:',
  timePrefix: 'Lúc:',
  resolutionPrefix: 'Đã sửa:',
  markResolved: 'Đã sửa',
  reopen: 'Mở lại',
  delete: 'Xóa',
  confirmDelete: 'Bạn có chắc muốn xóa ghi chú này?',
  githubBadge: 'GitHub',
  openOnGithub: 'Mở trên GitHub',

  // Actions
  reload: 'Tải lại',
  downloadFile: 'Tải file ghi chú',
  importFile: 'Nhập file',
  importSuccess: 'Đã nhập và gộp file ghi chú thành công!',
  importError: 'Không thể đọc file ghi chú. Vui lòng kiểm tra định dạng file JSON.',

  // Storage status messages
  statusDev: 'Đang lưu thẳng vào review/notes.json',
  statusProd: 'Bấm Lưu sẽ mở GitHub để gửi góp ý — nhớ bấm Submit new issue. Không có tài khoản GitHub? Dùng Tải file ghi chú.',
  errorPrefix: 'Lỗi',

  // Buổi học
  lessonOpenBtn: '📚 Buổi học',
  lessonTimePrefix: 'Giờ học',
  lessonRoomPrefix: 'Phòng',
  lessonTeacherPrefix: 'Giảng viên',
  lessonDurationUnit: 'phút',
  lessonStart: 'Bắt đầu',
  lessonCancel: 'Để sau',
  lessonExit: 'Thoát buổi học',
  lessonExitConfirm: 'Thoát buổi học?',
  lessonExitYes: 'Thoát',
  lessonExitNo: 'Ở lại',
  lessonArriveNow: 'Tới lớp ngay',
  lessonDistanceLeft: 'còn',
  lessonGoToFloor: 'Lên tầng',
  lessonFindSeatHint: 'Tìm ghế có viền sáng và bấm E để ngồi',
  lessonSitDown: 'Ngồi vào chỗ',
  lessonNext: 'Tiếp ›',
  lessonYou: 'Bạn',
  lessonReopenDesktop: '🖥 Mở máy tính',
  lessonSlideLabel: 'Slide',

  // Tổng kết
  summaryTitle: 'Hoàn thành buổi học!',
  summaryTime: 'Thời gian',
  summaryHints: 'Số gợi ý',
  summaryBack: 'Về khuôn viên',

  // Máy ảo
  desktopLoginStudentId: 'Mã sinh viên',
  desktopLoginPassword: 'Mật khẩu',
  desktopLoginBtn: 'Đăng nhập',
  desktopLoggingIn: 'Đang đăng nhập…',
  desktopStudentName: 'Sinh viên EIU',
  desktopCodeLab: 'Code Lab',
  desktopSlides: 'Bài giảng',
  desktopTrash: 'Thùng rác',
  desktopTrashEmpty: 'Thùng rác trống. Cứ yên tâm, không có bài nào bị vứt đi!',
  desktopNoLecture: 'Không có bài giảng.',
  desktopMinimize: 'Thu nhỏ',
  desktopClose: 'Đóng',
  desktopHideTip: 'Esc: thu máy tính lại',
  codeRun: '▶ Chạy',
  codeCompiling: 'Đang biên dịch…',
  codeOutput: 'Output',
  codeOutputEmpty: 'Bấm Chạy để xem kết quả.',
  codeHint: '💡 Hỏi thầy',
  codeHintCost: '−1 ⭐',
  codeNextExercise: 'Bài tiếp ›',
  codeSubmit: 'Nộp bài ›',
  codeBlankLabel: 'Chỗ trống cần điền',
} as const;


export const BUILDING_PANEL_TEXT = {
  close: 'Đóng',
  backToOverview: 'Về tổng quan',
  zonePrefix: 'Khu vực',
  floorsUnit: 'tầng',
  heightPrefix: 'Cao',
  structureTitle: 'Cấu trúc kiến trúc',
  floorsTitle: 'Phân chia tầng & bố trí phòng',
  genericHint: 'Chọn một tòa nhà hoặc dùng nút Về tổng quan để tiếp tục tham quan khuôn viên.',
  verifiedSource: 'Nguồn đã xác minh',
  unverifiedSource: 'Chưa xác minh',
} as const;
