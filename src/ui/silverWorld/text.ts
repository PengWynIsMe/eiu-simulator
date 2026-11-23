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
  modeFast2D: { vi: 'Chơi nhanh 2D', en: 'Play 2D' },
  mode3D: { vi: 'Chơi 3D', en: 'Play 3D' },
} as const satisfies Record<string, LocalizedText>;
