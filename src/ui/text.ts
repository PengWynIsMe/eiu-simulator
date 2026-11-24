import { useCallback } from 'react';
import type { Lang, LocalizedText } from '../types';
import { useLangStore } from '../store/useLangStore';

// Chuỗi giao diện tiếng Việt (TEXT cũ). Chuỗi MỚI phải song ngữ trong UI_TEXT bên dưới. Nội dung ngành học KHÔNG để ở đây (nằm trong campus.json).
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
  lessonNext: 'Tiếp ›',
  lessonYou: 'Bạn',
  lessonReopenDesktop: '🖥 Mở máy tính',
  lessonSlideLabel: 'Slide',
  lessonZoomSlide: 'Phóng to',
  lessonMinimizeSlide: 'Thu nhỏ',
  lessonLectureNotes: 'Ghi chú',

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

/** Lấy chuỗi theo ngôn ngữ; thiếu bản en thì dùng vi. vars thay {ten} trong chuỗi. */
export function t(text: LocalizedText, lang: Lang, vars?: Record<string, string | number>): string {
  const s = text[lang] || text.vi;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s;
}

/** Hook cho component: const tr = useT(); tr(UI_TEXT.close). Tự vẽ lại khi đổi ngôn ngữ. */
export function useT() {
  const lang = useLangStore((s) => s.lang); // giá trị nguyên thủy — tránh vẽ lại vô hạn
  return useCallback((text: LocalizedText, vars?: Record<string, string | number>) => t(text, lang, vars), [lang]);
}

/** Chuỗi giao diện song ngữ (TopBar, panel tòa nhà, panel ngành). */
export const UI_TEXT = {
  // TopBar
  appTitle: { vi: 'Khám phá EIU', en: 'Explore EIU' },
  walkBtn: { vi: 'Đi bộ', en: 'Walk' },
  walkBtnActive: { vi: 'Đang đi bộ', en: 'Walking' },
  walkBtnTip: { vi: 'Bật chế độ đi bộ tham quan', en: 'Turn on walking tour mode' },
  walkBtnActiveTip: { vi: 'Thoát chế độ đi bộ', en: 'Exit walking mode' },
  reviewBtn: { vi: 'Chế độ góp ý', en: 'Feedback mode' },
  reviewBadgeActive: { vi: 'Đang bật', en: 'On' },
  reviewBtnTip: { vi: 'Bật/tắt chế độ để lại ghi chú góp ý', en: 'Toggle feedback note mode' },
  lessonOpenBtn: { vi: '📚 Buổi học', en: '📚 Lessons' },
  // Tuyết rơi + cảnh mở đầu
  snowBtn: { vi: 'Tuyết rơi', en: 'Snow' },
  snowBtnActive: { vi: 'Tắt tuyết', en: 'Stop snow' },
  snowBtnTip: { vi: 'Bật/tắt hiệu ứng tuyết rơi & khuôn viên mùa đông', en: 'Toggle winter snow effect & cold aesthetics' },
  cinematicTitle: { vi: 'Tuyết rơi ở EIU', en: 'Snow at EIU' },
  cinematicSubtitle: {
    vi: 'Khuôn viên Đại học Quốc tế Miền Đông trong làn tuyết trắng',
    en: 'Eastern International University campus in a magical winter snowfall',
  },
  enterCampus: { vi: 'Vào tham quan', en: 'Explore Campus' },
  skipIntro: { vi: 'Bỏ qua', en: 'Skip intro' },
  replayIntro: { vi: 'Xem lại cảnh tuyết', en: 'Replay intro' },
  shareSnow: { vi: 'Chia sẻ cảnh tuyết', en: 'Share snow view' },
  shareCopied: { vi: 'Đã sao chép liên kết (?snow=1) vào bộ nhớ tạm!', en: 'Shareable link (?snow=1) copied to clipboard!' },
  winterBadge: { vi: 'Mùa đông EIU', en: 'EIU Winter' },
  langSwitch: { vi: 'Đổi ngôn ngữ (Tiếng Việt / English)', en: 'Switch language (Tiếng Việt / English)' },

  // Panel tòa nhà (chuyển từ BUILDING_PANEL_TEXT cũ)
  close: { vi: 'Đóng', en: 'Close' },
  backToOverview: { vi: 'Về tổng quan', en: 'Back to overview' },
  enterLibrary3d: { vi: 'Vào tham quan Thư viện EIU 3D', en: 'Explore EIU Library in 3D' },
  zonePrefix: { vi: 'Khu vực', en: 'Zone' },
  floorsUnit: { vi: 'tầng', en: 'floors' },
  heightPrefix: { vi: 'Cao', en: 'Height' },
  structureTitle: { vi: 'Cấu trúc kiến trúc', en: 'Architecture' },
  floorsTitle: { vi: 'Phân chia tầng & bố trí phòng', en: 'Floors & room layout' },
  genericHint: {
    vi: 'Chọn một tòa nhà hoặc dùng nút Về tổng quan để tiếp tục tham quan khuôn viên.',
    en: 'Select a building or use Back to overview to keep exploring the campus.',
  },
  verifiedSource: { vi: 'Nguồn đã xác minh', en: 'Verified source' },
  unverifiedSource: { vi: 'Chưa xác minh', en: 'Unverified' },
  floorN: { vi: 'Tầng {n}', en: 'Floor {n}' },
  viOnlyNote: { vi: 'Thông tin tòa nhà hiện chỉ có tiếng Việt', en: 'Building details are in Vietnamese only for now' },

  // Tab + panel ngành
  majorsTab: { vi: 'Ngành học ({n})', en: 'Programs ({n})' },
  buildingTab: { vi: 'Tòa nhà', en: 'Building' },
  overview: { vi: 'Tổng quan', en: 'Overview' },
  courses: { vi: 'Môn học', en: 'Courses' },
  specializations: { vi: 'Chuyên ngành', en: 'Specializations' },
  yearN: { vi: 'Năm {n}', en: 'Year {n}' },
  commonTrack: { vi: 'Chung', en: 'Core' },
  credits: { vi: '{n} TC', en: '{n} cr' },
  totalCredits: { vi: 'Tổng {n} TC', en: '{n} credits total' },
  programCode: { vi: 'Mã ngành {code}', en: 'Program code {code}' },
  highlights: { vi: 'Môn nổi bật', en: 'Key courses' },
  skills: { vi: 'Kỹ năng', en: 'Skills' },
  careers: { vi: 'Nghề nghiệp', en: 'Careers' },
  dayInLife: { vi: 'Một ngày của sinh viên', en: 'A day in the life' },
  illustrative: { vi: 'minh họa', en: 'illustrative' },
  semesterN: { vi: 'HK{n}', en: 'Sem {n}' },
  electiveSlot: { vi: 'Tự chọn: {group} — {n} TC', en: 'Elective: {group} — {n} cr' },
  chooseCredits: { vi: 'Chọn ≥ {n} TC trong {m} môn', en: 'Choose ≥ {n} cr from {m} courses' },
  chooseCourses: { vi: 'Chọn {n} trong {m} môn', en: 'Choose {n} of {m} courses' },
  otherElectives: { vi: 'Tự chọn khác', en: 'Other electives' },
  requiredCourses: { vi: 'Môn bắt buộc', en: 'Required courses' },
  electiveGroups: { vi: 'Nhóm tự chọn', en: 'Elective groups' },
  noCourses: { vi: 'Chưa có môn nào trong năm này', en: 'No courses listed for this year' },
  pickSpecHint: {
    vi: 'Năm này còn môn riêng của từng chuyên ngành — chọn một chuyên ngành ở trên để xem.',
    en: 'This year also has track-specific courses — pick a specialization above to see them.',
  },
  yearsInferredNote: {
    vi: 'Năm học suy từ mã môn (bản khung không chia theo năm)',
    en: 'Years are inferred from course codes (the framework does not split by year)',
  },
  yearFromCodeMark: { vi: '* năm suy từ mã môn', en: '* year inferred from course code' },
  source: { vi: 'Nguồn: {file} · CTĐT {year}', en: 'Source: {file} · Curriculum {year}' },
  sourceNoYear: { vi: 'Nguồn: {file} · khung CTĐT (chưa rõ năm)', en: 'Source: {file} · curriculum framework (year unknown)' },
  contentDraft: { vi: 'Chưa duyệt', en: 'Draft — not yet reviewed' },
  facultyCntt: { vi: 'Khoa Công nghệ thông tin', en: 'Faculty of Information Technology' },
  facultyKyThuat: { vi: 'Khoa Kỹ thuật', en: 'Faculty of Engineering' },
  facultyKinhTe: { vi: 'Khoa Kinh tế', en: 'Faculty of Business & Economics' },
  expandSheet: { vi: 'Mở rộng bảng thông tin', en: 'Expand panel' },
  collapseSheet: { vi: 'Thu gọn bảng thông tin', en: 'Collapse panel' },
  seeAll: { vi: 'Xem đủ', en: 'View all' },
  expand: { vi: 'Mở rộng', en: 'Expand' },
  collapse: { vi: 'Thu gọn', en: 'Collapse' },
} as const satisfies Record<string, LocalizedText>;
