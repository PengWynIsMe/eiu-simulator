import type { LocalizedText } from '../../types';
import type { SilverScreen } from '../../types/silver';

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

  // Tiêu đề màn hình
  screenRecap: { vi: 'Trước khi vào kỳ này', en: 'Before this term' },
  screenRegistration: { vi: 'Đăng ký môn học', en: 'Course registration' },
  screenWeek: { vi: 'Lịch tuần trải nghiệm', en: 'Experience week' },
  screenPlay: { vi: 'Cảnh truyện', en: 'Story scene' },
  screenTranscript: { vi: 'Bảng điểm Anh văn', en: 'English transcript' },
  screenMemory: { vi: 'Trang kỷ niệm', en: 'Memory page' },
  screenNotebook: { vi: 'Sổ kỷ niệm', en: 'Memory notebook' },

  // Tên nhân vật mặc định
  speakerPlayer: { vi: 'Bạn', en: 'You' },
  speakerThanh: { vi: 'Thành', en: 'Thanh' },
  speakerQuyen: { vi: 'Quyền', en: 'Quyen' },
  speakerHan: { vi: 'Han', en: 'Han' },
  speakerTeacher: { vi: 'Giảng viên', en: 'Lecturer' },
  speakerExaminer: { vi: 'Giám khảo', en: 'Examiner' },
  speakerGuide: { vi: 'Hướng dẫn', en: 'Guide' },
  speakerNarrator: { vi: 'Người dẫn', en: 'Narrator' },

  // Trợ năng
  progressStep: { vi: 'Tiến độ bước', en: 'Step progress' },
} as const satisfies Record<string, LocalizedText>;

/** Tiêu đề mặc định theo màn hình (dùng cho thanh trên của khung). */
export const SCREEN_TITLES: Record<Exclude<SilverScreen, 'closed'>, LocalizedText> = {
  home: ST.title,
  recap: ST.screenRecap,
  registration: ST.screenRegistration,
  week: ST.screenWeek,
  play: ST.screenPlay,
  transcript: ST.screenTranscript,
  memory: ST.screenMemory,
  notebook: ST.screenNotebook,
};
