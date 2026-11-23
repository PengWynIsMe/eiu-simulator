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

  // UI-02 — Play, Say, Choice, Slide
  next: { vi: 'Tiếp', en: 'Next' },
  finish: { vi: 'Xong cảnh', en: 'Finish scene' },
  skipScene: { vi: 'Bỏ qua cảnh', en: 'Skip scene' },
  sceneN: { vi: 'Cảnh {i}/{n}', en: 'Scene {i}/{n}' },
  stepN: { vi: 'Bước {i}/{n}', en: 'Step {i}/{n}' },
  confirmSkip: {
    vi: 'Bỏ qua cảnh này? Câu chuyện vẫn đi tiếp, nhưng các bạn sẽ không nhắc lại cảnh này.',
    en: 'Skip this scene? The story goes on, but your friends will not mention it later.',
  },
  confirmExit: {
    vi: 'Thoát về danh sách chương? Lần sau bạn bắt đầu lại từ đầu cảnh này.',
    en: 'Go back to the chapters? Next time you start from the beginning of this scene.',
  },
  tapReveal: { vi: 'Bấm để hiện hết', en: 'Tap to show all' },

  // UI-03 — Question, Order, Code
  retry: { vi: 'Thử lại', en: 'Try again' },
  reveal: { vi: 'Xem lời giải', en: 'Show answer' },
  correct: { vi: 'Đúng rồi', en: 'Correct' },
  wrong: { vi: 'Chưa đúng', en: 'Not yet' },
  revealed: { vi: 'Lời giải', en: 'Answer' },
  listen: { vi: 'Nghe', en: 'Listen' },
  listenAgain: { vi: 'Nghe lại', en: 'Listen again' },
  captions: { vi: 'Phụ đề', en: 'Captions' },
  noAudio: {
    vi: 'Máy không phát được giọng đọc hoặc đang tắt tiếng, nên phụ đề được bật.',
    en: 'No voice available or sound is off, so captions are on.',
  },
  simListen: { vi: 'Bài nghe mô phỏng ngắn', en: 'Short simulated listening' },
  check: { vi: 'Kiểm tra', en: 'Check' },
  up: { vi: 'Chuyển lên', en: 'Move up' },
  down: { vi: 'Chuyển xuống', en: 'Move down' },
  run: { vi: 'Chạy', en: 'Run' },
  output: { vi: 'Kết quả', en: 'Output' },
  hint: { vi: 'Gợi ý', en: 'Hint' },
  blank: { vi: 'Chỗ cần điền', en: 'Blank to fill in' },
  simCode: { vi: 'Mô phỏng, không chạy code thật', en: 'Simulated, no real code runs' },

  // UI-04 — Đăng ký môn & WeekGrid
  regTitle: { vi: 'Đăng ký môn', en: 'Course registration' },
  regHelp: {
    vi: 'Chọn {min}–{max} môn. Bộ gợi ý đã được chọn sẵn.',
    en: 'Choose {min}–{max} courses. The suggested set is already selected.',
  },
  credits: { vi: '{n} TC', en: '{n} credits' },
  hasLab: { vi: 'Có lab', en: 'Has lab' },
  core: { vi: 'Trọng tâm', en: 'Focus' },
  summaryTier: { vi: 'Tóm gọn', en: 'Short' },
  quick: { vi: 'Bản nhanh', en: 'Quick' },
  quickTip: {
    vi: 'Môn thứ 5 và 6 chơi bản nhanh, một buổi.',
    en: 'The 5th and 6th courses use a quick, one-session version.',
  },
  suggested: { vi: 'Trong lịch gợi ý', en: 'In the suggested plan' },
  others: { vi: 'Môn khác', en: 'Other courses' },
  unavailable: { vi: 'Chưa chọn được', en: 'Not available' },
  lockedCore: {
    vi: 'Môn trọng tâm của kỳ, không bỏ được',
    en: 'Focus course of this term, cannot be removed',
  },
  needPrereq: { vi: 'Cần học trước tiên quyết: {codes}', en: 'Prerequisite needed: {codes}' },
  needConfirm: { vi: 'Điều kiện chưa xác nhận', en: 'Requirement not confirmed yet' },
  noContent: { vi: 'Chưa có nội dung', en: 'No content yet' },
  alreadyDone: { vi: 'Đã học', en: 'Already taken' },
  tooFew: { vi: 'Chọn ít nhất {min} môn.', en: 'Choose at least {min} courses.' },
  tooMany: { vi: 'Nhiều nhất {max} môn.', en: 'At most {max} courses.' },
  longTerm: {
    vi: 'Kỳ này dài hơn 35 phút. Bạn vẫn chốt được và thoát giữa chừng.',
    en: 'This term takes over 35 minutes. You can still confirm and leave midway.',
  },
  totals: { vi: '{n} môn · {c} TC · ~{m} phút', en: '{n} courses · {c} credits · ~{m} min' },
  useSuggested: { vi: 'Dùng lại bộ gợi ý', en: 'Use suggested set' },
  confirmReg: { vi: 'Chốt đăng ký', en: 'Confirm' },
  week: { vi: 'Tuần dự kiến', en: 'Planned week' },
  slotNote: {
    vi: 'Ca học minh họa, mỗi ca 2 giờ.',
    en: 'Illustrative time slots, 2 hours each.',
  },
  days: { vi: 'T2 T3 T4 T5 T6 T7', en: 'Mon Tue Wed Thu Fri Sat' },
  slots: {
    vi: 'Sáng 1 · Sáng 2 · Chiều 1 · Chiều 2',
    en: 'Morning 1 · Morning 2 · Afternoon 1 · Afternoon 2',
  },
  theory: { vi: 'Lý thuyết', en: 'Theory' },
  lab: { vi: 'Lab', en: 'Lab' },
  project: { vi: 'Dự án', en: 'Project' },

  // Trạng thái buổi học (dùng chung trong WeekGrid & UI-05 Week)
  sDone: { vi: 'Đã học', en: 'Done' },
  sNow: { vi: 'Buổi kế', en: 'Next' },
  sLater: { vi: 'Chưa tới', en: 'Later' },

  // UI-05 — Tuần học
  weekTitle: { vi: 'Tuần học', en: 'Your week' },
  sessions: { vi: '{i}/{n} buổi', en: '{i}/{n} sessions' },
  nextSession: { vi: 'Buổi kế: {name}', en: 'Next: {name}' },
  enter: { vi: 'Vào buổi học', en: 'Go to class' },
  weekStart: {
    vi: 'Một tuần tiêu biểu, đại diện cho cả kỳ.',
    en: 'One typical week stands for the whole term.',
  },
  weekDone: {
    vi: 'Xong tuần học. Tiếp theo là cuối kỳ.',
    en: 'The week is done. Next: the end of term.',
  },
  toExam: { vi: 'Đến cuối kỳ', en: 'Go to end of term' },

  // UI-06 — Bảng điểm
  trTitle: { vi: 'Bảng điểm — Level {n}', en: 'Transcript — Level {n}' },
  listening: { vi: 'Nghe', en: 'Listening' },
  reading: { vi: 'Đọc', en: 'Reading' },
  writing: { vi: 'Viết', en: 'Writing' },
  speaking: { vi: 'Nói', en: 'Speaking' },
  passed: { vi: 'Qua Level {n}', en: 'Level {n} passed' },
  trNote: {
    vi: 'Kết quả của nhân vật trong câu chuyện, không đánh giá năng lực thật của bạn. Có tối đa hai điểm D là qua.',
    en: "This is the character's result in the story, not a measure of your own English. Up to two Ds is a pass.",
  },

  // Tiêu đề các màn chưa dựng xong (sẽ cập nhật đúng bảng ST ở UI-06..07)
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
  registration: ST.regTitle,
  week: ST.weekTitle,
  play: ST.screenPlay,
  transcript: ST.screenTranscript,
  memory: ST.screenMemory,
  notebook: ST.notebook,
};
