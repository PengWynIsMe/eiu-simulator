import { campus, getBuilding } from './index';
import type { LocalizedText, Vec2 } from '../types';

export type PoiCategory = 'academic' | 'facility' | 'landmark';

export interface CampusPoi {
  id: string;
  buildingId?: string;
  zone: 1 | 2;
  category: PoiCategory;
  pos: Vec2;
  title: LocalizedText;
  subtitle: LocalizedText;
  description: LocalizedText;
  facts: LocalizedText[];
  color: string;
}

export interface QuizQuestion {
  id: string;
  question: LocalizedText;
  options: LocalizedText[];
  correctIndex: number;
  explanation: LocalizedText;
}

export interface ShuttleNarrationStop {
  tStart: number;
  tEnd: number;
  landmarkId: string;
  title: LocalizedText;
  text: LocalizedText;
}

export interface NoticeItem {
  id: string;
  tag: LocalizedText;
  title: LocalizedText;
  body: LocalizedText;
}

export type BikeStyleId = 'city' | 'sport' | 'classic' | 'ebike';

export interface BikeStyleSpec {
  id: BikeStyleId;
  name: LocalizedText;
  desc: LocalizedText;
}

export interface BikeColorSpec {
  hex: string;
  name: LocalizedText;
}

export const CAMPUS_POIS: readonly CampusPoi[] = [
  {
    id: 'poi-gate',
    buildingId: 'cong-chinh',
    zone: 1,
    category: 'landmark',
    pos: [244, -28],
    title: { vi: 'Cổng chính EIU', en: 'EIU Main Gate' },
    subtitle: { vi: 'Đường Nam Kỳ Khởi Nghĩa · Bình Dương', en: 'Nam Ky Khoi Nghia Blvd · Binh Duong' },
    description: {
      vi: 'Cổng chào vòm cung rộng lớn dẫn thẳng từ đại lộ Nam Kỳ Khởi Nghĩa vào trục quảng trường trung tâm của Trường Đại học Quốc tế Miền Đông.',
      en: 'The signature arched main entrance welcoming students from Nam Ky Khoi Nghia Boulevard straight into EIU’s central plaza.',
    },
    facts: [
      { vi: '4 làn đường kết nối thẳng vào vòng xoay trung tâm', en: '4-lane boulevard leading directly to the central roundabout' },
      { vi: 'Có trạm xe điện tham quan ngay trục đường chính', en: 'Campus electric shuttle pickup nearby on the main avenue' },
    ],
    color: '#0ea5e9',
  },
  {
    id: 'poi-pond',
    zone: 1,
    category: 'landmark',
    pos: [130, -18],
    title: { vi: 'Hồ cảnh quan & Cầu đôi Zone 1', en: 'Zone 1 Pond & Twin Bridges' },
    subtitle: { vi: 'Không gian xanh giữa Block 3 và Block 4', en: 'Scenic water feature between Block 3 & Block 4' },
    description: {
      vi: 'Hồ nước xanh ngọc trải dài dọc trục cảnh quan với hai cây cầu đi bộ bắc ngang, nối liền khu Thư viện B4 với Khoa QTKD B3.',
      en: 'A serene turquoise pond spanned by twin pedestrian bridges linking Block 4 Library and Block 3 School of Business.',
    },
    facts: [
      { vi: 'Hai cây cầu có thể đi bộ qua lại giữa B3 và B4', en: 'Two walkable pedestrian bridges connect B3 and B4' },
      { vi: 'Điểm check-in quen thuộc của sinh viên EIU mỗi buổi chiều', en: 'Favorite sunset check-in spot for EIU students' },
    ],
    color: '#06b6d4',
  },
  {
    id: 'poi-b4',
    buildingId: 'b4',
    zone: 1,
    category: 'facility',
    pos: [125, -56],
    title: { vi: 'Thư viện EIU (Block 4)', en: 'EIU Library (Block 4)' },
    subtitle: { vi: 'Trung tâm học liệu 3 tầng · Mái pin mặt trời', en: '3-story Learning Commons · Solar roof' },
    description: {
      vi: 'Thư viện hiện đại với hàng nghìn đầu sách chuyên ngành, không gian tự học nhóm, góc đọc yên tĩnh và cầu thang sách đặc trưng.',
      en: 'Modern 3-story library featuring collaborative study zones, quiet reading halls, and the iconic book staircase.',
    },
    facts: [
      { vi: 'Có thể bước thẳng vào khám phá nội thất 3 tầng bên trong', en: 'Walk straight inside to explore all 3 interior floors' },
      { vi: 'Mái tích hợp hệ thống điện mặt trời xanh', en: 'Equipped with rooftop solar panels for clean campus energy' },
    ],
    color: '#6366f1',
  },
  {
    id: 'poi-highlands',
    buildingId: 'highlands',
    zone: 1,
    category: 'facility',
    pos: [146, -54],
    title: { vi: 'Highlands Coffee (Ki-ốt xe buýt)', en: 'Highlands Coffee Kiosk' },
    subtitle: { vi: 'Góc cà phê & gặp gỡ bên hồ nước', en: 'Lakeside coffee hangout spot' },
    description: {
      vi: 'Ki-ốt hình xe buýt đỏ nổi bật nằm ngay đầu Đông Thư viện B4 hướng ra hồ nước — điểm hẹn chạy deadline và trò chuyện của sinh viên.',
      en: 'The iconic red bus-shaped coffee kiosk overlooking the pond right outside Block 4 Library.',
    },
    facts: [
      { vi: 'Nằm giữa Thư viện B4, Tòa Hành chính B5 và hồ cảnh quan', en: 'Positioned between Block 4, Admin B5, and the lakeside promenade' },
    ],
    color: '#ef4444',
  },
  {
    id: 'poi-b5',
    buildingId: 'b5',
    zone: 1,
    category: 'facility',
    pos: [168, -50],
    title: { vi: 'Tòa nhà Hành chính (Block 5)', en: 'Administration Building (Block 5)' },
    subtitle: { vi: 'Hội trường · Tuyển sinh · Công tác sinh viên', en: 'Main Hall · Admissions · Student Affairs' },
    description: {
      vi: 'Trung tâm điều hành và đón tiếp của EIU, nơi tổ chức các hội thảo, định hướng tân sinh viên và giải quyết thủ tục học vụ.',
      en: 'Central administration hub hosting student orientation, academic advising, and campus events.',
    },
    facts: [
      { vi: 'Gồm 3 tầng với không gian tiền sảnh mở rộng rãi', en: '3-story building with an open ceremonial atrium' },
    ],
    color: '#3b82f6',
  },
  {
    id: 'poi-b3',
    buildingId: 'b3',
    zone: 1,
    category: 'academic',
    pos: [146, 26],
    title: { vi: 'Khoa Quản trị Kinh doanh (Block 3)', en: 'School of Business (Block 3)' },
    subtitle: { vi: 'Văn phòng khoa QTKD · Giảng đường', en: 'Business Faculty Office · Lecture Halls' },
    description: {
      vi: 'Ngôi nhà của sinh viên khối ngành Kinh tế & Quản trị kinh doanh với các phòng học tương tác, phòng mô phỏng và sân vườn phía Nam.',
      en: 'Home to EIU’s Business Administration programs with interactive lecture halls and collaboration spaces.',
    },
    facts: [
      { vi: 'Nối với Vườn ươm doanh nghiệp BBI (Block 6) qua hành lang có mái che', en: 'Connected to Block 6 BBI Incubator via a covered walkway' },
    ],
    color: '#8b5cf6',
  },
  {
    id: 'poi-roundabout',
    zone: 1,
    category: 'landmark',
    pos: [72, 0],
    title: { vi: 'Quảng trường Vòng xoay trung tâm', en: 'Central Roundabout Plaza' },
    subtitle: { vi: 'Tâm tọa độ khuôn viên · Bán kính ≈ 80 m', en: 'Campus heart · ~80 m radius plaza' },
    description: {
      vi: 'Quảng trường vòng xoay rợp bóng cây xanh kết nối Khu vực 1 (Hành chính – Thư viện) với Khu vực 2 (Giảng đường & Phòng Lab).',
      en: 'Tree-lined central roundabout connecting Zone 1 (Admin & Library) with Zone 2 (Academic Blocks & Labs).',
    },
    facts: [
      { vi: 'Xung quanh vòng xoay có ghế đá nghỉ chân và thảm hoa cảnh quan', en: 'Surrounded by stone benches and blooming flower borders' },
    ],
    color: '#f59e0b',
  },
  {
    id: 'poi-b11',
    buildingId: 'b11',
    zone: 2,
    category: 'academic',
    pos: [36, -106],
    title: { vi: 'Block 11 — Khoa CNTT & Kỹ thuật', en: 'Block 11 — CIT & Engineering' },
    subtitle: { vi: 'KTPM · Mạng máy tính · Tự động hóa · Cơ điện tử', en: 'Software Eng · Networking · Automation · Mechatronics' },
    description: {
      vi: 'Tòa nhà học thuật 4 tầng quy tụ hầu hết các ngành Công nghệ thông tin và Kỹ thuật cùng hệ thống phòng Lab thực hành chuyên sâu.',
      en: '4-story academic hub housing IT and Engineering faculties along with specialized hands-on laboratories.',
    },
    facts: [
      { vi: 'Có thể đi thẳng vào tầng 1–4, lên phòng Lab 406 tham gia buổi học thực tế', en: 'Step inside floors 1–4 or join an interactive class in Lab 406' },
    ],
    color: '#10b981',
  },
  {
    id: 'poi-b8',
    buildingId: 'b8',
    zone: 2,
    category: 'academic',
    pos: [0, -155],
    title: { vi: 'Block 8 — Khu Phòng học Đa năng', en: 'Block 8 — Multi-purpose Classrooms' },
    subtitle: { vi: '4 tầng · Giảng đường lớn & Lab máy tính', en: '4 floors · Lecture Halls & Computer Labs' },
    description: {
      vi: 'Tòa nhà giảng đường quy mô lớn nằm phía Bắc khuôn viên gần đường Lê Duẩn, phục vụ các lớp lý thuyết và thực hành máy tính.',
      en: 'Large 4-story lecture and computer lab building on the northern side near Le Duan Street.',
    },
    facts: [
      { vi: 'Nội thất 4 tầng có cầu thang bộ và thang máy tham quan trực tiếp', en: 'Full 4-floor walkable interior with stairs and elevator' },
    ],
    color: '#14b8a6',
  },
  {
    id: 'poi-canteen',
    buildingId: 'can-tin',
    zone: 2,
    category: 'facility',
    pos: [115, -225],
    title: { vi: 'Căn tin EIU', en: 'EIU Campus Canteen' },
    subtitle: { vi: 'Khu ẩm thực & Nghỉ trưa sinh viên', en: 'Student Dining & Hangout Hall' },
    description: {
      vi: 'Không gian rộng rãi thoáng mát phục vụ bữa sáng, cơm trưa, đồ uống và khu vực nghỉ ngơi sau giờ học.',
      en: 'Spacious campus dining hall serving breakfast, lunch, snacks, and drinks between classes.',
    },
    facts: [
      { vi: 'Liền kề nhà giữ xe rộng phía Đông Bắc khuôn viên', en: 'Adjacent to the large northeastern campus parking shed' },
    ],
    color: '#f97316',
  },
];

export const CAMPUS_QUIZ: readonly QuizQuestion[] = [
  {
    id: 'q-b11',
    question: {
      vi: 'Tòa nhà nào tập trung các ngành Công nghệ thông tin và Kỹ thuật tại EIU?',
      en: 'Which building serves as the main hub for IT and Engineering programs at EIU?',
    },
    options: [
      { vi: 'Block 11 (Khu văn phòng khoa & phòng thí nghiệm)', en: 'Block 11 (Faculty Offices & Laboratories)' },
      { vi: 'Block 5 (Tòa nhà Hành chính)', en: 'Block 5 (Administration Building)' },
      { vi: 'Highlands Coffee', en: 'Highlands Coffee Kiosk' },
      { vi: 'Nhà giữ xe 2 tầng', en: '2-Story Parking Structure' },
    ],
    correctIndex: 0,
    explanation: {
      vi: 'Block 11 là trung tâm của Khoa CNTT (KTPM, MMT) và Khoa Kỹ thuật (Tự động hóa, Điện, Cơ điện tử, ĐTVT, Cơ khí).',
      en: 'Block 11 houses the School of Computing & IT and the School of Engineering.',
    },
  },
  {
    id: 'q-b4',
    question: {
      vi: 'Điểm đặc biệt trên mái của Thư viện EIU (Block 4) là gì?',
      en: 'What eco-friendly feature is installed on the roof of EIU Library (Block 4)?',
    },
    options: [
      { vi: 'Sân bay trực thăng', en: 'Helipad' },
      { vi: 'Hệ thống tấm pin năng lượng mặt trời', en: 'Solar panel array' },
      { vi: 'Đài quan sát thiên văn', en: 'Astronomical dome' },
      { vi: 'Hồ bơi vô cực', en: 'Infinity pool' },
    ],
    correctIndex: 1,
    explanation: {
      vi: 'Mái Thư viện Block 4 được lắp đặt hệ thống pin mặt trời cung cấp năng lượng sạch cho khuôn viên trường.',
      en: 'Block 4 Library’s roof features solar panels contributing clean energy to the campus.',
    },
  },
  {
    id: 'q-b3',
    question: {
      vi: 'Khoa Quản trị Kinh doanh (QTKD) đặt văn phòng chính tại tòa nào?',
      en: 'Where is the School of Business Administration primarily located?',
    },
    options: [
      { vi: 'Block 3 (nối cầu sang Thư viện Block 4)', en: 'Block 3 (linked by bridges to Block 4 Library)' },
      { vi: 'Block 10 (Trung tâm ngoại ngữ)', en: 'Block 10 (Language Center)' },
      { vi: 'Căn tin EIU', en: 'EIU Canteen' },
      { vi: 'Trạm điện', en: 'Power Substation' },
    ],
    correctIndex: 0,
    explanation: {
      vi: 'Block 3 nằm phía Nam hồ cảnh quan Zone 1, nối với Block 4 bằng hai cây cầu đi bộ.',
      en: 'Block 3 sits south of the Zone 1 pond and connects to Block 4 via two pedestrian bridges.',
    },
  },
  {
    id: 'q-zone1',
    question: {
      vi: 'Trục trung tâm đón khách từ Cổng chính (Nam Kỳ Khởi Nghĩa) dẫn thẳng tới công trình nào?',
      en: 'What landmark lies at the heart of the boulevard from EIU’s Main Gate?',
    },
    options: [
      { vi: 'Cổng phụ Lê Duẩn', en: 'Rear Gate on Le Duan St' },
      { vi: 'Quảng trường Vòng xoay trung tâm (bán kính ≈ 80 m)', en: 'Central Roundabout Plaza (~80 m radius)' },
      { vi: 'Nhà xe Căn tin', en: 'Canteen Parking Shed' },
      { vi: 'Block 9', en: 'Block 9' },
    ],
    correctIndex: 1,
    explanation: {
      vi: 'Đại lộ từ Cổng chính đi qua khu Zone 1 và dẫn thẳng tới Quảng trường Vòng xoay trung tâm.',
      en: 'The main avenue leads from the East gate through Zone 1 straight into the Central Roundabout Plaza.',
    },
  },
  {
    id: 'q-explore',
    question: {
      vi: 'Ki-ốt hình xe buýt đỏ nổi tiếng nằm cạnh Thư viện Block 4 và hồ nước là gì?',
      en: 'What is the famous red bus-shaped kiosk next to Block 4 Library and the pond?',
    },
    options: [
      { vi: 'Fami Pizza', en: 'Fami Pizza' },
      { vi: 'Trạm xe buýt công cộng', en: 'Public Bus Stop' },
      { vi: 'Highlands Coffee', en: 'Highlands Coffee' },
      { vi: 'Phòng y tế', en: 'Campus Clinic' },
    ],
    correctIndex: 2,
    explanation: {
      vi: 'Highlands Coffee ki-ốt xe buýt đỏ hướng thẳng ra hồ cảnh quan Zone 1 — điểm hẹn quen thuộc của sinh viên.',
      en: 'The red bus-shaped Highlands Coffee kiosk overlooks the Zone 1 pond.',
    },
  },
];

/** Vòng tuyến xe điện tham quan kín bám theo hệ thống đường nội bộ thực tế trong layout.json. */
export const SHUTTLE_WAYPOINTS: readonly Vec2[] = [
  [216.7, 2.1],
  [173.8, 6.4],
  [152.2, 8.3],
  [152.2, 22.9],
  [146.3, 30.5],
  [110, 35],
  [68.5, 39.3],
  [40, 69],
  [0, 79.7],
  [-56, 56],
  [-79.7, 0],
  [-65, -46],
  [-26, -75],
  [-42, -145],
  [-58.9, -215.7],
  [-7, -227.7],
  [62.7, -244.8],
  [79, -233.1],
  [86.8, -199],
  [106.3, -190.9],
  [165.5, -200.9],
  [175.5, -195.6],
  [188.5, -185.5],
  [192.3, -167.9],
  [202, -105],
  [210.9, -45.7],
  [212.4, -30.6],
  [214.4, -15.8],
];

export const SHUTTLE_STOP_POS: Vec2 = [214, -22];

export const SHUTTLE_NARRATIONS: readonly ShuttleNarrationStop[] = [
  {
    tStart: 0.0,
    tEnd: 0.17,
    landmarkId: 'poi-b3',
    title: { vi: 'Block 3 & Hồ cảnh quan Zone 1', en: 'Block 3 & Zone 1 Pond' },
    text: {
      vi: 'Bên trái là Block 3 (Khoa QTKD) và hai cây cầu đi bộ bắc qua hồ nước xanh ngọc dẫn sang Thư viện Block 4.',
      en: 'On our side stands Block 3 (School of Business) linked by twin pedestrian bridges across the pond to Block 4 Library.',
    },
  },
  {
    tStart: 0.17,
    tEnd: 0.36,
    landmarkId: 'poi-roundabout',
    title: { vi: 'Quảng trường Vòng xoay trung tâm', en: 'Central Roundabout Plaza' },
    text: {
      vi: 'Xe đang lăn bánh quanh quảng trường vòng xoay rợp bóng cây — điểm giao nhau giữa tất cả các phân khu học thuật.',
      en: 'Cruising around the lush central roundabout connecting every academic zone on campus.',
    },
  },
  {
    tStart: 0.36,
    tEnd: 0.54,
    landmarkId: 'poi-b11',
    title: { vi: 'Đại lộ Học thuật: Block 10 & Block 11', en: 'Academic Avenue: Block 10 & 11' },
    text: {
      vi: 'Khu vực 2 sôi động với Block 10 (Trung tâm Ngoại ngữ) và Block 11 (Khoa CNTT & Kỹ thuật với hệ thống Lab hiện đại).',
      en: 'Entering Zone 2 past Block 10 (Language Center) and Block 11 (IT & Engineering Labs).',
    },
  },
  {
    tStart: 0.54,
    tEnd: 0.72,
    landmarkId: 'poi-b8',
    title: { vi: 'Cổng phụ Lê Duẩn & Block 8', en: 'Rear Gate & Block 8 Hall' },
    text: {
      vi: 'Phía Bắc giáp đường Lê Duẩn là Nhà giữ xe 2 tầng, Block 8 đa năng và Căn tin EIU rộng rãi phía trước.',
      en: 'Along the northern avenue sit the 2-story parking garage, Block 8 lecture halls, and EIU Canteen ahead.',
    },
  },
  {
    tStart: 0.72,
    tEnd: 0.88,
    landmarkId: 'poi-canteen',
    title: { vi: 'Căn tin & Nhà xe phía Đông', en: 'Campus Canteen & East Avenue' },
    text: {
      vi: 'Qua khu Căn tin và đại lộ phía Đông rợp bóng cây, xe rẽ về phía Thư viện Block 4 và Tòa Hành chính Block 5.',
      en: 'Passing the Campus Canteen and eastern boulevard back toward Block 4 Library and Block 5 Admin.',
    },
  },
  {
    tStart: 0.88,
    tEnd: 1.0,
    landmarkId: 'poi-gate',
    title: { vi: 'Block 5 Hành chính & Cổng chính EIU', en: 'Block 5 Admin & EIU Main Gate' },
    text: {
      vi: 'Phía trước là Trục Cổng chính rộng mở cùng Thư viện B4, Highlands Coffee và Tòa Hành chính Block 5.',
      en: 'Approaching the grand Main Gate corridor beside Block 4 Library, Highlands Coffee, and Block 5 Admin.',
    },
  },
];

export const NOTICE_BOARD_POS: Vec2 = [58, -60];

export const CAMPUS_NOTICES: readonly NoticeItem[] = [
  {
    id: 'notice-welcome',
    tag: { vi: 'Khám phá', en: 'Discovery' },
    title: { vi: 'Săn trọn 10 điểm mốc EIU', en: 'Discover all 10 EIU Landmarks' },
    body: {
      vi: 'Mở Bản đồ (phím M) để xem vị trí toàn trường, bật vạch chỉ đường màu vàng hoặc lên xe điện đi một vòng tham quan.',
      en: 'Open the Map (M) to explore all buildings, turn on the yellow guide path, or hop on the electric shuttle.',
    },
  },
  {
    id: 'notice-b11',
    tag: { vi: 'Học thuật', en: 'Academics' },
    title: { vi: 'Trải nghiệm tiết học tại Lab 406.B11', en: 'Join an Interactive Class in Lab 406.B11' },
    body: {
      vi: 'Bạn có thể đi bộ thẳng vào sảnh Block 11 hoặc chọn "Buổi học" trên thanh trên cùng để thử lập trình cùng giảng viên.',
      en: 'Walk right inside Block 11 or click "Lessons" in the top bar to try a live coding session.',
    },
  },
  {
    id: 'notice-library',
    tag: { vi: 'Thư viện', en: 'Library' },
    title: { vi: 'Tham quan Thư viện 3 tầng Block 4', en: 'Explore the 3-Story Block 4 Library' },
    body: {
      vi: 'Băng qua cầu gỗ hồ Zone 1 hoặc ghé Highlands Coffee ngay trước sảnh Thư viện B4 để tham quan cầu thang sách 3D.',
      en: 'Cross the Zone 1 bridges or stop by Highlands Coffee right outside Block 4 to tour the 3D book staircase.',
    },
  },
  {
    id: 'notice-bike',
    tag: { vi: 'Tiện ích', en: 'Campus Life' },
    title: { vi: 'Đạp xe & Chụp ảnh kỷ niệm', en: 'Campus Bike & Photo Mode' },
    body: {
      vi: 'Dùng cụm nút góc phải dưới để đổi sang Xe đạp khuôn viên, bật góc nhìn Drone toàn cảnh hoặc chụp ảnh lưu niệm PNG.',
      en: 'Use the bottom-right controls to ride a campus bike, toggle Drone view, or snap a PNG campus photo.',
    },
  },
];

export const BIKE_STYLES: readonly BikeStyleSpec[] = [
  {
    id: 'city',
    name: { vi: 'Xe đạp thành phố', en: 'City Cruiser' },
    desc: { vi: 'Có giỏ trước tiện lợi, dáng ngồi thẳng thoải mái', en: 'Front basket & upright relaxed posture' },
  },
  {
    id: 'sport',
    name: { vi: 'Xe thể thao địa hình', en: 'Campus Sport' },
    desc: { vi: 'Khung gọn nhẹ, linh hoạt trên mọi cung đường', en: 'Sleek athletic frame for brisk rides' },
  },
  {
    id: 'classic',
    name: { vi: 'Xe cổ điển sinh viên', en: 'Retro Classic' },
    desc: { vi: 'Phong cách thanh lịch có baga sau chở đồ', en: 'Vintage frame with rear luggage rack' },
  },
  {
    id: 'ebike',
    name: { vi: 'Xe đạp trợ lực xanh', en: 'Eco E-Bike' },
    desc: { vi: 'Thiết kế hiện đại kèm hộp pin thân thiện môi trường', en: 'Modern commuter frame with battery pack' },
  },
];

export const BIKE_COLORS: readonly BikeColorSpec[] = [
  { hex: '#0ea5e9', name: { vi: 'Xanh EIU', en: 'EIU Sky' } },
  { hex: '#0f766e', name: { vi: 'Xanh ngọc', en: 'Teal' } },
  { hex: '#ef4444', name: { vi: 'Đỏ năng động', en: 'Crimson' } },
  { hex: '#f59e0b', name: { vi: 'Vàng nắng', en: 'Amber' } },
  { hex: '#6366f1', name: { vi: 'Tím Indigo', en: 'Indigo' } },
  { hex: '#334155', name: { vi: 'Xám Titan', en: 'Slate' } },
];

const poiById = new Map(CAMPUS_POIS.map((p) => [p.id, p]));

export function getPoi(id: string): CampusPoi | undefined {
  return poiById.get(id);
}

export function getPoiByBuilding(buildingId: string): CampusPoi | undefined {
  return CAMPUS_POIS.find((p) => p.buildingId === buildingId);
}

/**
 * Trả tọa độ an toàn ngoài trời (không nằm bên trong khung tường tòa nhà)
 * dùng cho dẫn đường vạch vàng & dịch chuyển tới bất kỳ tòa nhà nào.
 */
export function getSafeBuildingSpot(buildingId: string): Vec2 {
  const linkedPoi = getPoiByBuilding(buildingId);
  if (linkedPoi) return [linkedPoi.pos[0], linkedPoi.pos[1]];

  const b = getBuilding(buildingId);
  if (!b) return [244, -28];

  const [cx, cz] = b.center;
  const [rcx, rcz] = campus.layout.roundabout.center;
  const dx = rcx - cx;
  const dz = rcz - cz;
  const dist = Math.hypot(dx, dz) || 1;
  const ux = dx / dist;
  const uz = dz / dist;

  let maxProj = 0;
  for (const [px, pz] of b.shape.outer) {
    const proj = (px - cx) * ux + (pz - cz) * uz;
    if (proj > maxProj) maxProj = proj;
  }
  const offset = maxProj + 5.5;
  return [cx + ux * offset, cz + uz * offset];
}
