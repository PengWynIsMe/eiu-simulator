import type { LocalizedText } from '../../types';
import type { SilverScreen } from '../../types/silver';

/** Thay thế `{key}` trong chuỗi mẫu bằng giá trị truyền vào. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => (key in vars ? String(vars[key]) : `{${key}}`));
}

/** Chuỗi song ngữ cố định của chế độ kể chuyện IT Silver (ST). */
export const ST = {
  // UI-00 — Khung chung & điều hướng
  open: { vi: 'IT Silver', en: 'IT Silver' },
  title: { vi: 'Cuộc sống IT Silver', en: 'IT Silver Life' },
  exit: { vi: 'Thoát', en: 'Exit' },
  close: { vi: 'Đóng', en: 'Close' },
  back: { vi: 'Quay lại', en: 'Back' },
  home: { vi: 'Về danh sách chương', en: 'Back to chapters' },
  loading: { vi: 'Đang mở…', en: 'Opening…' },
  error: { vi: 'Không mở được dữ liệu.', en: 'Could not open the data.' },
  retryLoad: { vi: 'Thử lại', en: 'Try again' },
  nothing: { vi: 'Chưa có gì để hiện ở đây.', en: 'Nothing to show here yet.' },
  warnBlocked: {
    vi: 'Trình duyệt không cho lưu. Bạn vẫn chơi được, nhưng tiến độ sẽ mất khi đóng trang.',
    en: 'Your browser blocks saving. You can still play, but progress is lost when you close the page.',
  },
  warnCorrupt: {
    vi: 'Bản lưu cũ bị hỏng nên đã bắt đầu bản mới.',
    en: 'The old save was damaged, so a new one was started.',
  },
  cancel: { vi: 'Hủy', en: 'Cancel' },
  ok: { vi: 'Đồng ý', en: 'OK' },
  sim: {
    vi: 'Mô phỏng ngắn, lịch đã được sắp xếp lại để kể chuyện. Không phải thời khóa biểu hay đề thi chính thức của EIU.',
    en: 'A short simulation with a rearranged schedule. Not an official EIU timetable or exam.',
  },

  // UI-01 — Home & Recap
  notebook: { vi: 'Sổ kỷ niệm', en: 'Memory book' },
  continue: { vi: 'Tiếp tục', en: 'Continue' },
  start: { vi: 'Bắt đầu', en: 'Start' },
  replay: { vi: 'Chơi lại', en: 'Play again' },
  done: { vi: 'Đã chơi', en: 'Played' },
  inProgress: { vi: 'Đang dở', en: 'In progress' },
  comingSoon: { vi: 'Sắp có', en: 'Coming soon' },
  minutes: { vi: '~{n} phút', en: '~{n} min' },
  yearN: { vi: 'Năm {n}', en: 'Year {n}' },
  beforeYear: { vi: 'Trước nhập học', en: 'Before enrolment' },
  continueLabel: { vi: 'Tiếp tục: {title}', en: 'Continue: {title}' },
  confirmReplace: {
    vi: 'Bạn đang chơi dở một chương. Bắt đầu chương này sẽ bỏ phần đang dở; sổ kỷ niệm vẫn còn.',
    en: 'You have a chapter in progress. Starting this one drops it; your memory book stays.',
  },
  clear: { vi: 'Xóa toàn bộ tiến độ', en: 'Erase all progress' },
  confirmClear: {
    vi: 'Xóa tiến độ, lựa chọn và sổ kỷ niệm trên máy này? Không lấy lại được.',
    en: 'Erase progress, choices and the memory book on this device? This cannot be undone.',
  },
  recapTitle: { vi: 'Câu chuyện đến đây', en: 'The story so far' },
  recapNote: {
    vi: 'Bạn vào thẳng chương này, nên các mốc trước được coi là đã qua.',
    en: 'You jumped straight in, so earlier milestones count as done.',
  },

  // Tiêu đề các màn chưa dựng xong (sẽ cập nhật đúng bảng ST ở UI-02..07)
  screenRegistration: { vi: 'Đăng ký môn', en: 'Course registration' },
  screenWeek: { vi: 'Tuần học', en: 'Your week' },
  screenPlay: { vi: 'Cảnh truyện', en: 'Story scene' },
  screenTranscript: { vi: 'Bảng điểm', en: 'Transcript' },
  screenMemory: { vi: 'Trang kỷ niệm', en: 'Memory page' },

  // Tên nhân vật (UI-02)
  speakerPlayer: { vi: 'Bạn', en: 'You' },
  speakerThanh: { vi: 'Thành', en: 'Thành' },
  speakerQuyen: { vi: 'Quyền', en: 'Quyền' },
  speakerHan: { vi: 'Han', en: 'Han' },
  speakerTeacher: { vi: 'Giáo viên', en: 'Teacher' },
  speakerExaminer: { vi: 'Giám khảo', en: 'Examiner' },
  speakerGuide: { vi: 'Hướng dẫn', en: 'Guide' },
  speakerNarrator: { vi: '', en: '' },

  // Trợ năng
  progressStep: { vi: 'Tiến độ bước', en: 'Step progress' },
} as const satisfies Record<string, LocalizedText>;

/** Tiêu đề mặc định theo màn hình (dùng cho thanh trên của khung). */
export const SCREEN_TITLES: Record<Exclude<SilverScreen, 'closed'>, LocalizedText> = {
  home: ST.title,
  recap: ST.recapTitle,
  registration: ST.screenRegistration,
  week: ST.screenWeek,
  play: ST.screenPlay,
  transcript: ST.screenTranscript,
  memory: ST.screenMemory,
  notebook: ST.notebook,
};
