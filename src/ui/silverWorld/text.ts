import type { LocalizedText } from '../../types';

export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => (key in vars ? String(vars[key]) : `{${key}}`));
}

export const ST_W = {
  arriveNow: { vi: 'Tới nơi luôn', en: 'Go there now' },
  goTo: { vi: 'Tới: {place}', en: 'Go to: {place}' },
  upTo: { vi: 'Lên tầng {n}', en: 'Go up to floor {n}' },
  downTo: { vi: 'Xuống tầng {n}', en: 'Go down to floor {n}' },
  sit: { vi: 'Ngồi', en: 'Sit' },
  talk: { vi: 'Nói chuyện', en: 'Talk' },
  look: { vi: 'Xem', en: 'Look' },
  standUp: { vi: 'Đứng dậy', en: 'Stand up' },
  skip: { vi: 'Bỏ qua cảnh', en: 'Skip scene' },
  exit: { vi: 'Thoát', en: 'Exit' },
  dist: { vi: '{n} m', en: '{n} m' },

  // Nhãn phụ cho giao diện 3D
  openComputer: { vi: 'Mở máy tính', en: 'Open computer' },
  minimizeComputer: { vi: 'Thu máy', en: 'Minimize' },
  doorHint: { vi: 'Đi vào tòa nhà', en: 'Enter building' },
  roomHint: { vi: 'Đi vào phòng', en: 'Enter room' },
  next: { vi: 'Tiếp ›', en: 'Next ›' },
  finish: { vi: 'Xong cảnh', en: 'Finish scene' },
  retry: { vi: 'Thử lại', en: 'Try again' },
  reveal: { vi: 'Xem lời giải', en: 'Reveal answer' },
  hint: { vi: 'Gợi ý', en: 'Hint' },
  check: { vi: 'Kiểm tra', en: 'Check' },
  run: { vi: 'Chạy', en: 'Run' },
  correct: { vi: 'Chính xác!', en: 'Correct!' },
  wrong: { vi: 'Chưa đúng', en: 'Not quite' },
  confirmSkipTitle: { vi: 'Bỏ qua cảnh', en: 'Skip scene' },
  confirmSkipBody: {
    vi: 'Bạn có chắc muốn bỏ qua cảnh này?',
    en: 'Are you sure you want to skip this scene?',
  },
  confirmExitTitle: { vi: 'Thoát', en: 'Exit' },
  confirmExitBody: {
    vi: 'Bạn có chắc muốn thoát về trang chủ? Tiến trình cảnh hiện tại sẽ không được lưu.',
    en: 'Are you sure you want to return to chapters? Current scene progress will not be saved.',
  },
  cancel: { vi: 'Hủy', en: 'Cancel' },
  confirm: { vi: 'Đồng ý', en: 'Confirm' },
  stepN: { vi: 'Bước {i}/{n}', en: 'Step {i}/{n}' },
  sceneN: { vi: 'Cảnh {i}/{n}', en: 'Scene {i}/{n}' },

  // Nhãn màn hình Desktop và CodeLab theo ngôn ngữ đang chọn
  loginStudentId: { vi: 'Mã số sinh viên', en: 'Student ID' },
  loginPassword: { vi: 'Mật khẩu', en: 'Password' },
  loginBtn: { vi: 'Đăng nhập', en: 'Log in' },
  loggingIn: { vi: 'Đang vào…', en: 'Logging in…' },
  studentName: { vi: 'Sinh viên EIU', en: 'EIU Student' },
  slidesApp: { vi: 'Bài giảng', en: 'Slides' },
  trashApp: { vi: 'Thùng rác', en: 'Trash' },
  trashEmpty: { vi: 'Thùng rác trống', en: 'Trash is empty' },
  noLecture: { vi: 'Chưa có slide', en: 'No slides' },
  close: { vi: 'Đóng', en: 'Close' },
  hideTip: { vi: 'Thu máy (Esc)', en: 'Minimize (Esc)' },
  blankLabel: { vi: 'Điền code', en: 'Fill code' },
  outputTitle: { vi: 'Kết quả', en: 'Output' },
  compiling: { vi: 'Đang chạy…', en: 'Running…' },
  outputEmpty: { vi: 'Chưa chạy lệnh', en: 'No output yet' },
  zoomSlide: { vi: 'Phóng to', en: 'Zoom in' },
  minimizeSlide: { vi: 'Thu nhỏ', en: 'Minimize' },
  lectureNotes: { vi: 'Ghi chú', en: 'Notes' },
  collapseNav: { vi: 'Thu gọn', en: 'Collapse' },
  expandNav: { vi: 'Mở rộng', en: 'Expand' },
} as const satisfies Record<string, LocalizedText>;
