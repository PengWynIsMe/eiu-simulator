import type { LocalizedText } from '../../types';

export interface McqQuestion {
  id: string;
  prompt: LocalizedText;
  options: LocalizedText[];
  correctIndex: number;
}

export interface PlacementSpeakingPrecisionQ {
  id: string;
  teacherPrompt: LocalizedText;
  options: {
    text: string;
    tier: 'wrong' | 'lv1' | 'lv2';
  }[];
}

export const PLACEMENT_READING_PASSAGE: LocalizedText = {
  vi: 'Đại học Quốc tế Miền Đông (EIU) tọa lạc tại Thành phố mới Bình Dương với khuôn viên xanh mát quanh quảng trường vòng xoay. Sinh viên năm nhất thường bắt đầu chương trình Tiếng Anh tổng quát tại Block 8 trước khi chuyển sang học chuyên ngành CNTT, Kỹ thuật tại Block 11 hoặc Kinh doanh tại Block 3. Thư viện Block 4 mở cửa hằng ngày phục vụ tự học và làm việc nhóm.',
  en: 'Eastern International University (EIU) is located in Binh Duong New City around a leafy central roundabout. First-year students usually attend Intensive English classes in Block 8 before advancing into IT and Engineering labs in Block 11 or Business courses in Block 3. Block 4 Library opens daily for individual and group study.',
};

export const PLACEMENT_READING_QUESTIONS: readonly McqQuestion[] = [
  {
    id: 'pr1',
    prompt: { vi: '1. Trường EIU tọa lạc ở đâu?', en: '1. Where is EIU located?' },
    options: [
      { vi: 'Thành phố mới Bình Dương', en: 'Binh Duong New City' },
      { vi: 'Đảo Phú Quốc', en: 'Phu Quoc Island' },
      { vi: 'Đà Lạt', en: 'Da Lat' },
      { vi: 'Hà Nội', en: 'Hanoi' },
    ],
    correctIndex: 0,
  },
  {
    id: 'pr2',
    prompt: { vi: '2. Sinh viên năm nhất thường học Tiếng Anh tại tòa nhà nào?', en: '2. Which building hosts freshman English classes?' },
    options: [
      { vi: 'Block 3', en: 'Block 3' },
      { vi: 'Block 8', en: 'Block 8' },
      { vi: 'Căn tin', en: 'Canteen' },
      { vi: 'Nhà xe', en: 'Parking Shed' },
    ],
    correctIndex: 1,
  },
  {
    id: 'pr3',
    prompt: { vi: '3. Khối ngành CNTT và Kỹ thuật chủ yếu học chuyên ngành ở đâu?', en: '3. Where do IT & Engineering majors study?' },
    options: [
      { vi: 'Block 5', en: 'Block 5' },
      { vi: 'Highlands Coffee', en: 'Highlands Coffee' },
      { vi: 'Block 11', en: 'Block 11' },
      { vi: 'Cổng chính', en: 'Main Gate' },
    ],
    correctIndex: 2,
  },
  {
    id: 'pr4',
    prompt: { vi: '4. Block 4 là công trình gì?', en: '4. What is Block 4?' },
    options: [
      { vi: 'Thư viện EIU', en: 'EIU Library' },
      { vi: 'Trạm điện', en: 'Power Station' },
      { vi: 'Phòng tập gym', en: 'Gymnasium' },
      { vi: 'Ký túc xá', en: 'Dormitory' },
    ],
    correctIndex: 0,
  },
  {
    id: 'pr5',
    prompt: { vi: '5. Khối ngành Kinh doanh đặt tại tòa nhà nào?', en: '5. Where is the Business faculty located?' },
    options: [
      { vi: 'Block 9', en: 'Block 9' },
      { vi: 'Block 3', en: 'Block 3' },
      { vi: 'Block 10', en: 'Block 10' },
      { vi: 'Block 8', en: 'Block 8' },
    ],
    correctIndex: 1,
  },
];

export const PLACEMENT_LISTENING_SCRIPT =
  'Hello freshers! Welcome to Eastern International University orientation. English Level 1 and Level 3 meet in the morning from 7:30 to 11:30 with a 30-minute break. Level 2 and Level 4 study in the afternoon from 12:30 to 4:30. Once you achieve IELTS 6.0 or finish Level 5, you can start your major courses!';

export const PLACEMENT_LISTENING_QUESTIONS: readonly McqQuestion[] = [
  {
    id: 'pl1',
    prompt: { vi: '1. Đoạn nghe chào đón đối tượng nào?', en: '1. Who does the announcement welcome?' },
    options: [
      { vi: 'Tân sinh viên EIU (Freshers)', en: 'EIU freshers' },
      { vi: 'Du khách nước ngoài', en: 'Foreign tourists' },
      { vi: 'Phụ huynh tốt nghiệp', en: 'Graduating parents' },
      { vi: 'Nhân viên bảo vệ', en: 'Security staff' },
    ],
    correctIndex: 0,
  },
  {
    id: 'pl2',
    prompt: { vi: '2. Lớp Tiếng Anh Level 1 và Level 3 học buổi nào?', en: '2. When do English Level 1 & Level 3 study?' },
    options: [
      { vi: 'Buổi tối (18:00–21:00)', en: 'Evening (18:00–21:00)' },
      { vi: 'Buổi sáng (7:30–11:30)', en: 'Morning (7:30–11:30)' },
      { vi: 'Cuối tuần', en: 'Weekends only' },
      { vi: 'Buổi trưa', en: 'Midnight' },
    ],
    correctIndex: 1,
  },
  {
    id: 'pl3',
    prompt: { vi: '3. Thời gian nghỉ giải lao (breaktime) giữa giờ là bao lâu?', en: '3. How long is the mid-session break?' },
    options: [
      { vi: '5 phút', en: '5 minutes' },
      { vi: '10 phút', en: '10 minutes' },
      { vi: '30 phút', en: '30 minutes' },
      { vi: '60 phút', en: '60 minutes' },
    ],
    correctIndex: 2,
  },
  {
    id: 'pl4',
    prompt: { vi: '4. Lớp Level 2 và Level 4 bắt đầu học lúc mấy giờ chiều?', en: '4. What time do Level 2 & 4 start in the afternoon?' },
    options: [
      { vi: '12:30', en: '12:30' },
      { vi: '15:00', en: '15:00' },
      { vi: '17:00', en: '17:00' },
      { vi: '08:00', en: '08:00' },
    ],
    correctIndex: 0,
  },
  {
    id: 'pl5',
    prompt: { vi: '5. Cần đạt điều kiện nào để học chuyên ngành?', en: '5. What lets you start your major courses?' },
    options: [
      { vi: 'Chỉ cần điền đơn', en: 'Only submitting a form' },
      { vi: 'Đạt IELTS 6.0 hoặc xong Level 5', en: 'IELTS 6.0 or finishing Level 5' },
      { vi: 'Tham gia 1 câu lạc bộ', en: 'Joining one club' },
      { vi: 'Không cần tiếng Anh', en: 'No English required' },
    ],
    correctIndex: 1,
  },
];

export const PLACEMENT_SPEAKING_WARMUP = {
  teacherSay: {
    vi: 'Chào em! Cô là giảng viên Tiếng Anh tại Block 8. Hôm nay là bài phỏng vấn Speaking đầu vào 1:1. Em cảm thấy thế nào trong ngày đầu tiên đến EIU?',
    en: 'Hi there! I am your English instructor in Block 8. Today is your 1-on-1 placement interview. How are you feeling on your first day at EIU?',
  },
  options: [
    { vi: 'Em rất hào hứng khám phá khuôn viên xanh của EIU và làm quen bạn mới ạ!', en: 'I am excited to explore EIU’s green campus and meet new friends!' },
    { vi: 'Em hơi hồi hộp một chút nhưng đã sẵn sàng học Tiếng Anh thật tốt.', en: 'A little nervous, yet ready to improve my English skills!' },
    { vi: 'Hôm nay trời mát và trường đẹp quá, em muốn tham quan Block 11 ngay!', en: 'The weather is nice and campus looks great—I cannot wait to see Block 11!' },
  ] as readonly LocalizedText[],
};

/** 2 câu hỏi Speaking phân cấp Level 1 vs Level 2 (5 lựa chọn: 3 sai, 1 đúng mức Lv1, 1 đúng mức Lv2). */
export const PLACEMENT_SPEAKING_QUESTIONS: readonly PlacementSpeakingPrecisionQ[] = [
  {
    id: 'ps1',
    teacherPrompt: {
      vi: 'Câu 1/2: "Why did you choose to study at EIU and what do you plan to improve this semester?" (Chọn câu trả lời thể hiện trình độ của bạn)',
      en: 'Q1/2: "Why did you choose to study at EIU and what do you plan to improve this semester?" (Pick the response that matches your fluency)',
    },
    options: [
      { text: 'I choose EIU because yesterday it rain very much near bus.', tier: 'wrong' },
      { text: 'EIU have many computer for playing game every night.', tier: 'wrong' },
      { text: 'Because yes, my major is book and sleep in library.', tier: 'wrong' },
      { text: 'I like EIU because it is a good university and I want to practice my English.', tier: 'lv1' },
      {
        text: 'I chose EIU for its international curriculum and hands-on labs, and I plan to sharpen my academic speaking and coding terminology this term.',
        tier: 'lv2',
      },
    ],
  },
  {
    id: 'ps2',
    teacherPrompt: {
      vi: 'Câu 2/2: "How do you manage your study time between English classes and university life?"',
      en: 'Q2/2: "How do you manage your study time between English classes and university life?"',
    },
    options: [
      { text: 'I am no studying, only eating noodle in canteen always.', tier: 'wrong' },
      { text: 'Time manage is when clock go fast to tomorrow.', tier: 'wrong' },
      { text: 'Because of schedule, I sleep at 7:30 morning in class.', tier: 'wrong' },
      { text: 'I check my schedule on my phone and review new words after class.', tier: 'lv1' },
      {
        text: 'I track my timetable via aao.eiu, complete Moodle tasks ahead of deadlines, and set aside 30 minutes daily to practice listening.',
        tier: 'lv2',
      },
    ],
  },
];

export interface EnglishSessionContent {
  level: 1 | 2 | 3 | 4 | 5;
  teacherName: string;
  title: LocalizedText;
  focusTopic: LocalizedText;
  greeting: {
    text: LocalizedText;
    options: { id: string; text: LocalizedText; reply: LocalizedText }[];
  };
  slides: readonly { title: LocalizedText; body: LocalizedText; code?: string }[];
  session1Text: LocalizedText;
  session2Text: LocalizedText;
  quickCheck: McqQuestion & { explainCorrect: LocalizedText; explainWrong: LocalizedText };
}

export const ENGLISH_LEVEL_LESSONS: readonly EnglishSessionContent[] = [
  {
    level: 1,
    teacherName: 'Ms. Sarah',
    title: { vi: 'Level 1 — Tiếng Anh Nền tảng (Foundation)', en: 'Level 1 — Foundation English' },
    focusTopic: { vi: 'Từ vựng khuôn viên, giao tiếp hằng ngày & thì hiện tại đơn', en: 'Campus vocabulary, everyday greetings & present simple' },
    greeting: {
      text: { vi: 'Good morning! Chào mừng lớp Level 1 (07:30–11:30). Hôm nay ta ôn từ vựng khuôn viên EIU và thì hiện tại đơn nhé!', en: 'Good morning Level 1! Today we review campus vocabulary and Present Simple.' },
      options: [
        { id: 'hi', text: { vi: 'Good morning Ms. Sarah! Em sẵn sàng rồi ạ.', en: 'Good morning Ms. Sarah! Ready!' }, reply: { vi: 'Tuyệt! Mời cả lớp nhìn lên màn chiếu nhé.', en: 'Awesome! Look at the projector screen.' } },
        { id: 'break', text: { vi: 'Cô ơi giữa giờ mình nghỉ breaktime 30 phút lúc nào ạ?', en: 'When is our 30-minute break?' }, reply: { vi: 'Từ 09:15 đến 09:45 nha, giờ ta xem slide đầu tiên trước!', en: 'From 09:15 to 09:45! Let us check slide 1 first.' } },
      ],
    },
    slides: [
      {
        title: { vi: 'Present Simple — Thì Hiện tại đơn', en: 'Present Simple Tense' },
        code: `I / You / We / They + V\nHe / She / It + V-s/es\nEx: She studies at EIU.`,
        body: {
          vi: 'Diễn tả thói quen học tập hằng ngày, thời khóa biểu cố định. Với He/She/It thêm -s hoặc -es.',
          en: 'Used for daily study habits & timetables. Add -s/-es for He/She/It.',
        },
      },
      {
        title: { vi: 'Lịch học Level 1 & Giao tiếp', en: 'Level 1 Shift & Greetings' },
        code: `07:30 – 11:30 (Break 09:15)\n"Where is Block 4 Library?"`,
        body: {
          vi: 'Buổi 1 học từ vựng hỏi đường quanh B8 – B4; Buổi 2 luyện phát âm IPA & viết 5–7 câu.',
          en: 'Session 1: campus directions; Session 2: IPA sounds & short paragraphs.',
        },
      },
    ],
    session1Text: {
      vi: 'Buổi 1 (07:30–11:30 · Nghỉ 30 phút 09:15–09:45): Làm quen cách giới thiệu bản thân, hỏi đường quanh Block 8 – Thư viện B4 – Căn tin.',
      en: 'Session 1 (07:30–11:30 · 30m break 09:15–09:45): Practice self-introductions and asking directions around Block 8, Library B4, and Canteen.',
    },
    session2Text: {
      vi: 'Buổi 2 (07:30–11:30 · Nghỉ 30 phút): Luyện phát âm chuẩn 44 âm IPA, viết đoạn văn ngắn 5–7 câu và chuẩn bị thi cuối kỳ Level 1.',
      en: 'Session 2 (07:30–11:30 · 30m break): Practice pronunciation, short paragraph writing, and review for the Level 1 final exam.',
    },
    quickCheck: {
      id: 'el1',
      prompt: { vi: 'Chọn câu đúng ngữ pháp:', en: 'Choose the grammatically correct sentence:' },
      options: [
        { vi: 'She study English in Block 8 every morning.', en: 'She study English in Block 8 every morning.' },
        { vi: 'She studies English in Block 8 every morning.', en: 'She studies English in Block 8 every morning.' },
        { vi: 'She studying English in Block 8 every morning.', en: 'She studying English in Block 8 every morning.' },
      ],
      correctIndex: 1,
      explainCorrect: { vi: 'Chính xác! Chủ ngữ "She" đi với "studies".', en: 'Exact! Singular "She" takes "studies".' },
      explainWrong: { vi: 'Nhớ chia động từ với chủ ngữ số ít "She" nhé.', en: 'Remember -es with "She".' },
    },
  },
  {
    level: 2,
    teacherName: 'Ms. Sarah',
    title: { vi: 'Level 2 — Tiếng Anh Sơ trung cấp (Elementary)', en: 'Level 2 — Elementary English' },
    focusTopic: { vi: 'Nghe hiểu đoạn hội thoại, mô tả sự kiện quá khứ & tương lai', en: 'Conversation listening, past events & future plans' },
    greeting: {
      text: { vi: 'Good afternoon Level 2 (12:30–16:30)! Hôm nay ta luyện thì Quá khứ đơn và kỹ năng nghe hội thoại học đường nhé.', en: 'Good afternoon Level 2 (12:30–16:30)! Today we cover Past Simple and campus dialogues.' },
      options: [
        { id: 'hi', text: { vi: 'Chào cô Sarah! Buổi chiều lớp mình học tới 4h30 đúng không ạ?', en: 'Hi Ms. Sarah! Class ends at 4:30 PM, right?' }, reply: { vi: 'Đúng rồi, có giải lao 30p lúc 14:15 nữa nha!', en: 'Yes, with a 30m break at 14:15!' } },
        { id: 'ready', text: { vi: 'Em đã chuẩn bị vở để ghi bài rồi ạ!', en: 'My notebook is ready!' }, reply: { vi: 'Tốt lắm! Xem slide ngữ pháp trên màn chiếu nhé.', en: 'Great! Look at the screen.' } },
      ],
    },
    slides: [
      {
        title: { vi: 'Past Simple — Thì Quá khứ đơn', en: 'Past Simple Tense' },
        code: `S + V-ed / V2\nEx: "Yesterday, our class visited Block 4 Library."`,
        body: {
          vi: 'Diễn tả hành động đã xảy ra và kết thúc trong quá khứ (yesterday, last week). Động từ có quy tắc thêm -ed.',
          en: 'Describes completed past actions (yesterday, last week). Regular verbs add -ed.',
        },
      },
      {
        title: { vi: 'Academic Email & Dialogue', en: 'Academic Email & Listening' },
        code: `Shift: 12:30 – 16:30 (Break 14:15 – 14:45)\n"Dear Lecturer, I would like to ask about..."`,
        body: {
          vi: 'Thực hành viết email lịch sự gửi giảng viên và bắt từ khóa khi nghe hội thoại.',
          en: 'Practice polite academic emails and listening keyword capture.',
        },
      },
    ],
    session1Text: {
      vi: 'Buổi 1 (12:30–16:30 · Nghỉ 30 phút 14:15–14:45): Luyện nghe tin tức học đường, chia sẻ trải nghiệm tuần đầu đại học.',
      en: 'Session 1 (12:30–16:30 · 30m break 14:15–14:45): Practice campus listening dialogues and sharing first-week experiences.',
    },
    session2Text: {
      vi: 'Buổi 2 (12:30–16:30 · Nghỉ 30 phút): Viết email học vụ gửi giảng viên và luyện phản xạ Speaking theo cặp.',
      en: 'Session 2 (12:30–16:30 · 30m break): Write polite academic emails and practice pair speaking fluency.',
    },
    quickCheck: {
      id: 'el2',
      prompt: { vi: 'Điền từ đúng: "Yesterday, our class ____ Block 4 Library."', en: 'Fill in the blank: "Yesterday, our class ____ Block 4 Library."' },
      options: [
        { vi: 'visit', en: 'visit' },
        { vi: 'visited', en: 'visited' },
        { vi: 'visiting', en: 'visiting' },
      ],
      correctIndex: 1,
      explainCorrect: { vi: 'Chính xác! "Yesterday" dùng Quá khứ đơn visited.', en: 'Correct! "Yesterday" requires visited.' },
      explainWrong: { vi: 'Chú ý dấu hiệu "Yesterday" ở đầu câu nhé.', en: 'Notice "Yesterday" at the start.' },
    },
  },
  {
    level: 3,
    teacherName: 'Ms. Sarah',
    title: { vi: 'Level 3 — Tiếng Anh Trung cấp (Pre-Intermediate)', en: 'Level 3 — Pre-Intermediate English' },
    focusTopic: { vi: 'Đọc hiểu bài báo ngắn, trình bày quan điểm cá nhân', en: 'Short article comprehension & expressing opinions' },
    greeting: {
      text: { vi: 'Chào buổi sáng lớp Level 3 (07:30–11:30)! Từ Level 3–4, bạn nào tự tin có thể đăng ký thi IELTS 6.0 sớm nhé!', en: 'Good morning Level 3 (07:30–11:30)! Confident Level 3–4 students can also challenge IELTS 6.0 early!' },
      options: [
        { id: 'hi', text: { vi: 'Dạ tuyệt quá cô! Hôm nay mình luyện Skimming & Scanning ạ?', en: 'Awesome! Are we practicing Skimming & Scanning today?' }, reply: { vi: 'Đúng rồi! Cùng nhìn lên slide nhé.', en: 'Yes! Let us review the techniques.' } },
        { id: 'ielts', text: { vi: 'Đạt IELTS 6.0 xong là được vào học chuyên ngành luôn phải không cô?', en: 'Once we hit IELTS 6.0 we enter major courses right away?' }, reply: { vi: 'Chuẩn luôn! Giờ mình vào bài đọc nhé.', en: 'Right away! Now onto reading.' } },
      ],
    },
    slides: [
      {
        title: { vi: 'IELTS Reading: Skimming & Scanning', en: 'IELTS Reading: Skimming & Scanning' },
        code: `Skim  -> Read title & topic sentences for main idea\nScan  -> Spot numbers, dates, proper nouns`,
        body: {
          vi: 'Đọc lướt nắm ý chính đoạn văn trong 60 giây, sau đó quét nhanh từ khóa để trả lời chính xác mà không dịch từng chữ.',
          en: 'Skim for gist in 60 seconds, then scan keywords to answer quickly without word-by-word translation.',
        },
      },
      {
        title: { vi: 'Vocabulary & Synonym Mapping', en: 'Vocabulary & Synonyms' },
        code: `rapid <-> fast / quick\nadvantage <-> benefit`,
        body: {
          vi: 'Nhận diện cặp từ đồng nghĩa — bí quyết ghi điểm cao ở phần Reading & Listening IELTS.',
          en: 'Spot paraphrased synonyms — the key to high IELTS Reading & Listening scores.',
        },
      },
    ],
    session1Text: {
      vi: 'Buổi 1 (07:30–11:30 · Nghỉ 30 phút): Bắt đầu làm quen cấu trúc bài đọc IELTS Passage và kỹ năng Skimming / Scanning.',
      en: 'Session 1 (07:30–11:30 · 30m break): Introduction to IELTS reading passages and skimming/scanning techniques.',
    },
    session2Text: {
      vi: 'Buổi 2 (07:30–11:30 · Nghỉ 30 phút): Thảo luận nhóm về công nghệ xanh, bảo vệ môi trường và thuyết trình 2 phút.',
      en: 'Session 2 (07:30–11:30 · 30m break): Group discussions on green technology and 2-minute mini-presentations.',
    },
    quickCheck: {
      id: 'el3',
      prompt: { vi: 'Từ đồng nghĩa với "rapid" là gì?', en: 'Which word is closest in meaning to "rapid"?' },
      options: [
        { vi: 'Slow', en: 'Slow' },
        { vi: 'Fast', en: 'Fast' },
        { vi: 'Quiet', en: 'Quiet' },
      ],
      correctIndex: 1,
      explainCorrect: { vi: 'Chính xác! Rapid = Fast (nhanh chóng).', en: 'Correct! Rapid = Fast.' },
      explainWrong: { vi: 'Rapid nghĩa là nhanh chóng (trái nghĩa với Slow).', en: 'Rapid means fast.' },
    },
  },
  {
    level: 4,
    teacherName: 'Ms. Sarah',
    title: { vi: 'Level 4 — Tiếng Anh Trung cao cấp (Intermediate)', en: 'Level 4 — Intermediate English' },
    focusTopic: { vi: 'Viết luận IELTS Task 2 cơ bản & phân tích biểu đồ', en: 'IELTS Task 2 essay structure & chart interpretation' },
    greeting: {
      text: { vi: 'Chào buổi chiều Level 4 (12:30–16:30)! Hôm nay ta luyện cấu trúc viết đoạn văn học thuật và từ nối Coherence.', en: 'Good afternoon Level 4 (12:30–16:30)! Today we cover academic paragraph cohesion.' },
      options: [
        { id: 'hi', text: { vi: 'Dạ em sẵn sàng luyện IELTS Writing Task 2 ạ!', en: 'Ready for IELTS Writing Task 2!' }, reply: { vi: 'Tuyệt vời! Xem cấu trúc PEEL trên màn chiếu nhé.', en: 'Awesome! Check the PEEL structure on screen.' } },
        { id: 'sp', text: { vi: 'Cô cho tụi em thêm mẹo Speaking Part 2 luôn nha cô.', en: 'Can we get Speaking Part 2 tips too?' }, reply: { vi: 'Chắc chắn rồi, bắt đầu ngay nào.', en: 'Certainly, let us begin.' } },
      ],
    },
    slides: [
      {
        title: { vi: 'Academic Paragraph Structure (PEEL)', en: 'PEEL Paragraph Structure' },
        code: `Point -> Explain -> Example -> Link\nConnectors: However, Therefore, Furthermore`,
        body: {
          vi: 'Mỗi đoạn thân bài IELTS Task 2 nên nêu rõ luận điểm, giải thích logic, kèm 1 ví dụ cụ thể và liên kết mạch lạc.',
          en: 'Every body paragraph needs a clear Point, Explanation, concrete Example, and cohesive Link.',
        },
      },
      {
        title: { vi: 'Contrast Linkers', en: 'Contrast Linkers' },
        code: `However, S + V.\nAlthough S + V, S + V.`,
        body: {
          vi: 'Dùng "However," đứng đầu câu (kèm dấu phẩy) để chuyển ý tương phản tự nhiên.',
          en: 'Place "However," at sentence start with a comma for smooth contrast.',
        },
      },
    ],
    session1Text: {
      vi: 'Buổi 1 (12:30–16:30 · Nghỉ 30 phút): Thực hành viết đoạn thân bài học thuật có luận điểm và ví dụ rõ ràng.',
      en: 'Session 1 (12:30–16:30 · 30m break): Draft structured academic body paragraphs with clear supporting examples.',
    },
    session2Text: {
      vi: 'Buổi 2 (12:30–16:30 · Nghỉ 30 phút): Luyện đề Listening nhiều giọng nói và phỏng vấn Speaking Part 2.',
      en: 'Session 2 (12:30–16:30 · 30m break): Multi-speaker academic listening and IELTS Speaking Part 2 cue cards.',
    },
    quickCheck: {
      id: 'el4',
      prompt: { vi: 'Từ nối chỉ sự tương phản phù hợp nhất ở đầu câu:', en: 'Best contrasting linker at the start of a sentence:' },
      options: [
        { vi: 'However,', en: 'However,' },
        { vi: 'Therefore,', en: 'Therefore,' },
        { vi: 'For instance,', en: 'For instance,' },
      ],
      correctIndex: 0,
      explainCorrect: { vi: 'Chính xác! However = Tuy nhiên (tương phản).', en: 'Correct! However signals contrast.' },
      explainWrong: { vi: 'Therefore chỉ kết quả, For instance chỉ ví dụ.', en: 'Therefore = result; For instance = example.' },
    },
  },
  {
    level: 5,
    teacherName: 'Ms. Sarah',
    title: { vi: 'Level 5 — Tiếng Anh Học thuật (IELTS 6.0+)', en: 'Level 5 — Academic IELTS 6.0+' },
    focusTopic: { vi: 'Hoàn thiện 4 kỹ năng IELTS 6.0 chuẩn đầu vào chuyên ngành', en: 'Full 4-skill IELTS 6.0 mastery for major study' },
    greeting: {
      text: { vi: 'Chào cả lớp Level 5 (Sáng 08:00–11:00 & Chiều 12:30–14:30)! Qua Level 5 này trường sẽ cấp chứng chỉ IELTS 6.0 luôn đấy!', en: 'Welcome Level 5 (08:00–11:00 & 12:30–14:30)! Passing Level 5 grants your IELTS 6.0 certification!' },
      options: [
        { id: 'hi', text: { vi: 'Cố gắng lấy chứng chỉ IELTS 6.0 để vào chuyên ngành IT nào!', en: 'Let us earn IELTS 6.0 for the IT Major!' }, reply: { vi: 'Quyết tâm rất cao! Xem slide tổng ôn ngay nhé.', en: 'Love the spirit! Let us review.' } },
        { id: 'ready', text: { vi: 'Lớp mình học 2 buổi sáng chiều luôn, bắt đầu thôi cô!', en: 'Two sessions today — let us start!' }, reply: { vi: 'Bắt đầu ngay nào!', en: 'Here we go!' } },
      ],
    },
    slides: [
      {
        title: { vi: 'IELTS 6.0 Academic Mastery', en: 'IELTS 6.0 Academic Mastery' },
        code: `AM: 08:00 – 11:00 (Break 09:15 – 09:45)\nPM: 12:30 – 14:30`,
        body: {
          vi: 'Level 5 kết hợp cường độ cao cả sáng và chiều: phân tích văn bản khoa học, tổng hợp lập luận và thuyết trình học thuật.',
          en: 'Level 5 pairs morning & afternoon sessions covering academic articles, synthesis essays, and oral defenses.',
        },
      },
      {
        title: { vi: 'Academic Terminology', en: 'Academic Terminology' },
        code: `sustainable development\nscalable architecture · empirical evidence`,
        body: {
          vi: 'Làm chủ vốn từ học thuật chuẩn bị sẵn sàng đọc giáo trình tiếng Anh khi bước vào CSE 100 và chuyên ngành IT.',
          en: 'Master academic collocations to read English IT textbooks from CSE 100 onward.',
        },
      },
    ],
    session1Text: {
      vi: 'Buổi 1 (Sáng 08:00–11:00 · Nghỉ 30p | Chiều 12:30–14:30): Luyện tập chuyên sâu Reading & Listening học thuật cường độ cao.',
      en: 'Session 1 (08:00–11:00 · 30m break | 12:30–14:30): Intensive academic Reading and Listening practice.',
    },
    session2Text: {
      vi: 'Buổi 2 (Sáng 08:00–11:00 · Nghỉ 30p | Chiều 12:30–14:30): Hoàn thiện bài viết học thuật & bảo vệ Speaking cuối khóa để nhận chuẩn IELTS 6.0.',
      en: 'Session 2 (08:00–11:00 · 30m break | 12:30–14:30): Final essay & Speaking defense to graduate the English program.',
    },
    quickCheck: {
      id: 'el5',
      prompt: { vi: '"Sustainable development" mang nghĩa gì?', en: 'What does "Sustainable development" mean?' },
      options: [
        { vi: 'Phát triển bền vững', en: 'Growth meeting present needs without compromising future generations' },
        { vi: 'Tăng trưởng tức thời', en: 'Short-term temporary profit' },
        { vi: 'Giảm chất lượng', en: 'Lowering quality' },
      ],
      correctIndex: 0,
      explainCorrect: { vi: 'Chuẩn! Sustainable development = Phát triển bền vững.', en: 'Correct! Sustainable development.' },
      explainWrong: { vi: 'Gợi ý: "Sustainable" nghĩa là bền vững.', en: 'Hint: Sustainable = long-lasting.' },
    },
  },
];

const READING_BANK: readonly McqQuestion[] = [
  {
    id: 'rb1',
    prompt: { vi: 'Tại EIU, các môn chuyên ngành CNTT được giảng dạy chủ yếu bằng ngôn ngữ nào?', en: 'At EIU, what language is mainly used in IT major courses?' },
    options: [
      { vi: 'Tiếng Anh', en: 'English' },
      { vi: 'Tiếng Pháp', en: 'French' },
      { vi: 'Tiếng Tây Ban Nha', en: 'Spanish' },
      { vi: 'Tiếng Đức', en: 'German' },
    ],
    correctIndex: 0,
  },
  {
    id: 'rb2',
    prompt: { vi: 'Sinh viên cần chứng chỉ tối thiểu bao nhiêu IELTS (hoặc xong Level 5) để vào chuyên ngành?', en: 'Minimum IELTS band (or Level 5 completion) to enter major study?' },
    options: [
      { vi: '4.0', en: '4.0' },
      { vi: '5.0', en: '5.0' },
      { vi: '6.0', en: '6.0' },
      { vi: '8.5', en: '8.5' },
    ],
    correctIndex: 2,
  },
  {
    id: 'rb3',
    prompt: { vi: 'Mỗi năm học tại EIU gồm mấy học kỳ tổng cộng (kể cả học kỳ hè không bắt buộc)?', en: 'How many total terms per academic year (including optional summer)?' },
    options: [
      { vi: '2 học kỳ', en: '2 terms' },
      { vi: '3 học kỳ', en: '3 terms' },
      { vi: '4 học kỳ (3 chính + 1 hè)', en: '4 terms (3 main + 1 summer)' },
      { vi: '6 học kỳ', en: '6 terms' },
    ],
    correctIndex: 2,
  },
  {
    id: 'rb4',
    prompt: { vi: 'Cổng thông tin nào dùng để xem thời khóa biểu và điểm số tại EIU?', en: 'Which portal shows timetable and grades at EIU?' },
    options: [
      { vi: 'aao.eiu', en: 'aao.eiu' },
      { vi: 'shopee.vn', en: 'shopee.vn' },
      { vi: 'netflix.com', en: 'netflix.com' },
      { vi: 'figma.com', en: 'figma.com' },
    ],
    correctIndex: 0,
  },
  {
    id: 'rb5',
    prompt: { vi: 'Hệ thống nào được giảng viên dùng để giao và thu bài tập?', en: 'Which platform do instructors use to assign homework?' },
    options: [
      { vi: 'Moodle', en: 'Moodle' },
      { vi: 'Paint', en: 'MS Paint' },
      { vi: 'Calculator', en: 'Calculator' },
      { vi: 'Notepad', en: 'Notepad' },
    ],
    correctIndex: 0,
  },
  {
    id: 'rb6',
    prompt: { vi: 'Phòng Lab thực hành máy tính tầng 4 trong bài học nằm ở đâu?', en: 'Where are the 4th-floor computer labs located?' },
    options: [
      { vi: 'Tầng 4 Block 8 & Block 11', en: '4th Floor of Block 8 & Block 11' },
      { vi: 'Tầng 1 Nhà xe', en: '1st Floor Parking Shed' },
      { vi: 'Giữa hồ nước Zone 1', en: 'Middle of Zone 1 Pond' },
      { vi: 'Cổng phụ', en: 'Rear Gate' },
    ],
    correctIndex: 0,
  },
  {
    id: 'rb7',
    prompt: { vi: 'Khu vực Căn tin và Nhà xe lớn nằm ở Zone nào?', en: 'Which zone houses the Canteen and main parking structures?' },
    options: [
      { vi: 'Zone 1', en: 'Zone 1' },
      { vi: 'Zone 2', en: 'Zone 2' },
      { vi: 'Ngoài khuôn viên', en: 'Outside campus' },
      { vi: 'Trên sân thượng B4', en: 'Block 4 rooftop' },
    ],
    correctIndex: 1,
  },
  {
    id: 'rb8',
    prompt: { vi: 'Khi thi kết thúc Level Tiếng Anh, nếu nhận bao nhiêu điểm D thì phải học lại?', en: 'How many D grades cause failing an English Level final exam?' },
    options: [
      { vi: 'Không bao giờ rớt', en: 'Never fail' },
      { vi: 'Từ 2 điểm D trở lên', en: '2 or more D grades' },
      { vi: 'Chỉ cần 1 điểm C', en: '1 C grade' },
      { vi: '1 điểm A', en: '1 A grade' },
    ],
    correctIndex: 1,
  },
  {
    id: 'rb9',
    prompt: { vi: 'Ai có thể đăng ký thi IELTS 6.0 sớm mà không cần học hết 5 level?', en: 'Who can apply for the IELTS 6.0 exam early before finishing Level 5?' },
    options: [
      { vi: 'Không ai cả', en: 'Nobody' },
      { vi: 'Sinh viên tự tin ở Level 3 hoặc 4 (hoặc bất kỳ khi nào sẵn sàng)', en: 'Confident students from Level 3–4 (or whenever ready)' },
      { vi: 'Chỉ sinh viên đã tốt nghiệp', en: 'Graduated students only' },
      { vi: 'Chỉ giảng viên', en: 'Teachers only' },
    ],
    correctIndex: 1,
  },
  {
    id: 'rb10',
    prompt: { vi: 'Lễ tốt nghiệp (Graduation) diễn ra vào thời điểm nào của lộ trình 5 năm?', en: 'When does the Graduation Ceremony take place in the 5-year timeline?' },
    options: [
      { vi: 'Kỳ 1 năm nhất', en: 'Year 1 Term 1' },
      { vi: 'Kỳ hè năm cuối (5.4)', en: 'Final Summer Term (5.4)' },
      { vi: 'Kỳ 2 năm hai', en: 'Year 2 Term 2' },
      { vi: 'Kỳ 1 năm ba', en: 'Year 3 Term 1' },
    ],
    correctIndex: 1,
  },
];

const LISTENING_BANK: readonly McqQuestion[] = [
  {
    id: 'lb1',
    prompt: { vi: 'Nghe: "Library Block 4 opens at 7:30 AM and closes at 9:00 PM." Thư viện đóng cửa lúc mấy giờ?', en: 'Listen: "Library Block 4 opens at 7:30 AM and closes at 9:00 PM." Closing time?' },
    options: [
      { vi: '7:30 AM', en: '7:30 AM' },
      { vi: '5:00 PM', en: '5:00 PM' },
      { vi: '9:00 PM', en: '9:00 PM' },
      { vi: '11:30 PM', en: '11:30 PM' },
    ],
    correctIndex: 2,
  },
  {
    id: 'lb2',
    prompt: { vi: 'Nghe: "CSE 100 introduces algorithms, hardware, and problem solving." Môn học nhắc đến là gì?', en: 'Listen: "CSE 100 introduces algorithms, hardware, and problem solving." Which course?' },
    options: [
      { vi: 'CSE 100 — Nhập môn CNTT', en: 'CSE 100 — Introduction to Computing' },
      { vi: 'POLS 133 — Triết học', en: 'POLS 133 — Philosophy' },
      { vi: 'MATH 103 — Đại số', en: 'MATH 103 — Linear Algebra' },
      { vi: 'LAWS 122 — Pháp luật', en: 'LAWS 122 — Law' },
    ],
    correctIndex: 0,
  },
  {
    id: 'lb3',
    prompt: { vi: 'Nghe: "Please submit your assignment on Moodle before Friday noon." Hạn nộp bài là khi nào?', en: 'Listen: "Please submit your assignment on Moodle before Friday noon." Deadline?' },
    options: [
      { vi: 'Trưa thứ Sáu', en: 'Friday noon' },
      { vi: 'Sáng thứ Hai', en: 'Monday morning' },
      { vi: 'Tối Chủ nhật', en: 'Sunday night' },
      { vi: 'Cuối tháng sau', en: 'Next month' },
    ],
    correctIndex: 0,
  },
  {
    id: 'lb4',
    prompt: { vi: 'Nghe: "Level 5 students study both morning and afternoon sessions." Level 5 học mấy buổi?', en: 'Listen: "Level 5 students study both morning and afternoon sessions." How many sessions?' },
    options: [
      { vi: '1 buổi tối', en: '1 evening session' },
      { vi: '2 buổi (sáng & chiều)', en: '2 sessions (morning & afternoon)' },
      { vi: 'Chỉ học thứ Bảy', en: 'Saturday only' },
      { vi: 'Tự học ở nhà', en: 'Self-study only' },
    ],
    correctIndex: 1,
  },
  {
    id: 'lb5',
    prompt: { vi: 'Nghe: "Take the campus shuttle near the Main Gate to reach Block 11 quickly." Trạm xe điện gần đâu?', en: 'Listen: "Take the campus shuttle near the Main Gate to reach Block 11 quickly." Shuttle pickup?' },
    options: [
      { vi: 'Gần Cổng chính', en: 'Near Main Gate' },
      { vi: 'Trong phòng thi', en: 'Inside exam room' },
      { vi: 'Trên mái Block 4', en: 'Block 4 roof' },
      { vi: 'Trong thang máy', en: 'Inside elevator' },
    ],
    correctIndex: 0,
  },
  {
    id: 'lb6',
    prompt: { vi: 'Nghe: "In Year 1 Term 2, students also take Political Economics alongside English." Môn đại cương nào đi kèm?', en: 'Listen: "In Year 1 Term 2, students also take Political Economics alongside English." Accompanying course?' },
    options: [
      { vi: 'Kinh tế chính trị Mác – Lênin', en: 'Political Economics' },
      { vi: 'Vật lý lượng tử', en: 'Quantum Physics' },
      { vi: 'Giải phẫu học', en: 'Anatomy' },
      { vi: 'Kế toán kiểm toán', en: 'Auditing' },
    ],
    correctIndex: 0,
  },
  {
    id: 'lb7',
    prompt: { vi: 'Nghe: "All lab sessions for 406.B8 require writing and testing real code." Phòng Lab làm gì?', en: 'Listen: "All lab sessions for 406.B8 require writing and testing real code." Lab activity?' },
    options: [
      { vi: 'Viết và chạy thử mã nguồn thực hành', en: 'Writing and testing real code' },
      { vi: 'Vẽ tranh sơn dầu', en: 'Oil painting' },
      { vi: 'Tập thể dục', en: 'Gym exercise' },
      { vi: 'Nấu ăn', en: 'Cooking' },
    ],
    correctIndex: 0,
  },
  {
    id: 'lb8',
    prompt: { vi: 'Nghe: "A minimum GPA and 180 credits are required for Software Engineering graduation." Cần bao nhiêu tín chỉ?', en: 'Listen: "180 credits are required for Software Engineering graduation." Required credits?' },
    options: [
      { vi: '90 tín chỉ', en: '90 credits' },
      { vi: '120 tín chỉ', en: '120 credits' },
      { vi: '180 tín chỉ', en: '180 credits' },
      { vi: '300 tín chỉ', en: '300 credits' },
    ],
    correctIndex: 2,
  },
  {
    id: 'lb9',
    prompt: { vi: 'Nghe: "Summer terms are optional, allowing students to lighten main semesters." Học kỳ hè có bắt buộc không?', en: 'Listen: "Summer terms are optional." Are summer terms mandatory?' },
    options: [
      { vi: 'Không bắt buộc', en: 'Optional (not mandatory)' },
      { vi: 'Bắt buộc 100%', en: 'Strictly mandatory' },
      { vi: 'Chỉ dành cho giáo viên', en: 'Teachers only' },
      { vi: 'Kéo dài 12 tháng', en: 'Lasts 12 months' },
    ],
    correctIndex: 0,
  },
  {
    id: 'lb10',
    prompt: { vi: 'Nghe: "You must pass prerequisite CSE 103 before enrolling in CSE 104." Môn tiên quyết của CSE 104 là gì?', en: 'Listen: "You must pass prerequisite CSE 103 before enrolling in CSE 104." Prerequisite?' },
    options: [
      { vi: 'CSE 103', en: 'CSE 103' },
      { vi: 'POLS 135', en: 'POLS 135' },
      { vi: 'CSW 482', en: 'CSW 482' },
      { vi: 'HIGH 101', en: 'HIGH 101' },
    ],
    correctIndex: 0,
  },
];

export const WRITING_PROMPTS_BANK: readonly LocalizedText[] = [
  { vi: 'Viết 1 đoạn ngắn (≥ 5 từ tiếng Anh) mô tả mục tiêu học tập của bạn tại EIU:', en: 'Write a short response (≥ 5 English words) describing your study goal at EIU:' },
  { vi: 'Viết 1 câu tiếng Anh ngắn về tòa nhà hoặc góc học tập bạn thích nhất ở trường:', en: 'Write a short English sentence about your favorite campus spot:' },
  { vi: 'Theo bạn, kỹ năng tiếng Anh giúp ích gì cho ngành Công nghệ thông tin?', en: 'How does English help your future IT career? (≥ 5 English words)' },
];

export const SPEAKING_PROMPTS_BANK: readonly { prompt: LocalizedText; options: { text: LocalizedText; grade: 'A' | 'B' | 'C' | 'D' }[] }[] = [
  {
    prompt: {
      vi: 'Giáo viên hỏi: "Can you tell me how you prepare before an English or IT exam?"',
      en: 'Examiner asks: "Can you tell me how you prepare before an English or IT exam?"',
    },
    options: [
      { text: { vi: 'I review lecture slides, complete Moodle practice tasks, and summarize key concepts clearly.', en: 'I review lecture slides, complete Moodle practice tasks, and summarize key concepts clearly.' }, grade: 'A' },
      { text: { vi: 'I study my notes and practice past questions with my classmates.', en: 'I study my notes and practice past questions with my classmates.' }, grade: 'B' },
      { text: { vi: 'I read book before test one day.', en: 'I read book before test one day.' }, grade: 'C' },
      { text: { vi: 'No prepare, I guess random answer.', en: 'No prepare, I guess random answer.' }, grade: 'D' },
    ],
  },
  {
    prompt: {
      vi: 'Giáo viên hỏi: "Describe why teamwork in Block 4 Library or Lab 406 is important."',
      en: 'Examiner asks: "Describe why teamwork in Block 4 Library or Lab 406 is important."',
    },
    options: [
      { text: { vi: 'Teamwork lets us divide complex coding modules, spot bugs faster, and communicate ideas clearly.', en: 'Teamwork lets us divide complex coding modules, spot bugs faster, and communicate ideas clearly.' }, grade: 'A' },
      { text: { vi: 'Working together helps students learn from each other and finish projects on time.', en: 'Working together helps students learn from each other and finish projects on time.' }, grade: 'B' },
      { text: { vi: 'Teamwork is good because friends help me.', en: 'Teamwork is good because friends help me.' }, grade: 'C' },
      { text: { vi: 'I do not talk with anyone in team.', en: 'I do not talk with anyone in team.' }, grade: 'D' },
    ],
  },
  {
    prompt: {
      vi: 'Giáo viên hỏi: "What career do you hope to pursue after graduating from EIU?"',
      en: 'Examiner asks: "What career do you hope to pursue after graduating from EIU?"',
    },
    options: [
      { text: { vi: 'I aim to become a full-stack software engineer building reliable cloud products with international teams.', en: 'I aim to become a full-stack software engineer building reliable cloud products with international teams.' }, grade: 'A' },
      { text: { vi: 'I want to work as a software developer at a technology company.', en: 'I want to work as a software developer at a technology company.' }, grade: 'B' },
      { text: { vi: 'I want job with computer.', en: 'I want job with computer.' }, grade: 'C' },
      { text: { vi: 'I have no idea and do not want to work.', en: 'I have no idea and do not want to work.' }, grade: 'D' },
    ],
  },
];

export function getExamDataset(mode: 'level' | 'ielts', level: number) {
  const rqCount = mode === 'ielts' ? 10 : 7;
  const lqCount = mode === 'ielts' ? 10 : 7;
  const wCount = mode === 'ielts' ? 3 : 2;
  const sCount = mode === 'ielts' ? 3 : 2;
  const shift = (level - 1) * 2;
  const fallbackR = READING_BANK[0];
  const fallbackL = LISTENING_BANK[0];
  if (!fallbackR || !fallbackL) throw new Error('Thiếu ngân hàng câu hỏi Tiếng Anh');
  const reading = Array.from({ length: rqCount }, (_, i) => READING_BANK[(i + shift) % READING_BANK.length] ?? fallbackR);
  const listening = Array.from({ length: lqCount }, (_, i) => LISTENING_BANK[(i + shift) % LISTENING_BANK.length] ?? fallbackL);
  const writing = WRITING_PROMPTS_BANK.slice(0, wCount);
  const speaking = SPEAKING_PROMPTS_BANK.slice(0, sCount);
  return { reading, listening, writing, speaking };
}

export const EXAM_LISTENING_SPEECH_TEXT =
  'Welcome to your EIU English assessment. Remember: Library Block 4 opens from 7:30 AM to 9:00 PM. ' +
  'Course CSE 100 introduces algorithms, hardware, and problem solving. Submit Moodle homework before Friday noon. ' +
  'Level 5 students study both morning and afternoon. Take the campus shuttle near Main Gate. ' +
  '180 credits are required for graduation, summer terms are optional, and CSE 103 is the prerequisite for CSE 104.';
