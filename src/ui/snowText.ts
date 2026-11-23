export type SnowLang = 'vi' | 'en';

export const SNOW_TEXT = {
  vi: {
    snowBtn: 'Tuyết rơi',
    snowBtnActive: 'Tắt tuyết',
    snowBtnTip: 'Bật/tắt hiệu ứng tuyết rơi & khuôn viên mùa đông',
    cinematicTitle: 'Tuyết rơi ở EIU',
    cinematicSubtitle: 'Khuôn viên Đại học Quốc tế Miền Đông trong làn tuyết trắng',
    enterCampus: 'Vào tham quan',
    skipIntro: 'Bỏ qua',
    replayIntro: 'Xem lại cảnh tuyết',
    shareSnow: 'Chia sẻ cảnh tuyết',
    shareCopied: 'Đã sao chép liên kết (?snow=1) vào bộ nhớ tạm!',
    langToggle: 'English',
    winterBadge: 'Mùa đông EIU',
  },
  en: {
    snowBtn: 'Snow',
    snowBtnActive: 'Stop snow',
    snowBtnTip: 'Toggle winter snow effect & cold aesthetics',
    cinematicTitle: 'Snow at EIU',
    cinematicSubtitle: 'Eastern International University campus in a magical winter snowfall',
    enterCampus: 'Explore Campus',
    skipIntro: 'Skip intro',
    replayIntro: 'Replay intro',
    shareSnow: 'Share snow view',
    shareCopied: 'Shareable link (?snow=1) copied to clipboard!',
    langToggle: 'Tiếng Việt',
    winterBadge: 'EIU Winter',
  },
} as const;
