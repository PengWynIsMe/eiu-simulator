import type { LocalizedText } from '../../types';

export const B4_TOUR_ORIGIN: readonly [number, number] = [91.5, -97.4];
export const B4_TOUR_ROT_Y = -0.10912;

const COS = Math.cos(B4_TOUR_ROT_Y);
const SIN = Math.sin(B4_TOUR_ROT_Y);

export function b4LocalToWorld(u: number, v: number): [number, number] {
  return [
    B4_TOUR_ORIGIN[0] + u * COS - v * SIN,
    B4_TOUR_ORIGIN[1] + u * SIN + v * COS,
  ];
}

export function b4WorldToLocal(x: number, z: number): [number, number] {
  const dx = x - B4_TOUR_ORIGIN[0];
  const dz = z - B4_TOUR_ORIGIN[1];
  return [
    dx * COS + dz * SIN,
    -dx * SIN + dz * COS,
  ];
}

export function b4WalkYaw(dirU: number, dirV: number): number {
  const p0 = b4LocalToWorld(0, 0);
  const p1 = b4LocalToWorld(dirU, dirV);
  return Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
}

export interface LibraryWaypoint {
  readonly id: string;
  readonly floor: 1 | 2 | 3;
  readonly title: LocalizedText;
  readonly banner: LocalizedText;
  readonly u: number;
  readonly v: number;
  readonly dirU: number;
  readonly dirV: number;
  readonly isLanding?: boolean;
}

export interface LibraryFloorMenu {
  readonly floor: 1 | 2 | 3;
  readonly label: LocalizedText;
  readonly landing: LibraryWaypoint;
  readonly spots: readonly LibraryWaypoint[];
}

export const LIBRARY_TOUR_FLOORS: readonly LibraryFloorMenu[] = [
  {
    floor: 1,
    label: { vi: 'TẦNG 1', en: 'FLOOR 1' },
    landing: {
      id: 'f1-main',
      floor: 1,
      isLanding: true,
      title: { vi: 'Sảnh chính & Cầu thang gáy sách', en: 'Main Lobby & Book Staircase' },
      banner: { vi: 'BẠN ĐANG ĐỨNG TẠI SẢNH CHÍNH TẦNG 1 THƯ VIỆN EIU', en: 'YOU ARE AT EIU LIBRARY FLOOR 1 MAIN LOBBY' },
      u: 64.2,
      v: 14.0,
      dirU: -1,
      dirV: 0,
    },
    spots: [
      {
        id: 'f1-info',
        floor: 1,
        title: { vi: '-- Quầy thông tin', en: '-- Information Desk' },
        banner: { vi: 'BẠN ĐANG ĐỨNG TẠI QUẦY THÔNG TIN', en: 'YOU ARE AT THE INFORMATION DESK' },
        u: 46.2,
        v: 14.0,
        dirU: -1,
        dirV: 0,
      },
      {
        id: 'f1-pc',
        floor: 1,
        title: { vi: '-- Khu vực máy tính', en: '-- Computer Area' },
        banner: { vi: 'BẠN ĐANG ĐỨNG TẠI KHU MÁY TÍNH', en: 'YOU ARE AT THE COMPUTER AREA' },
        u: 59.5,
        v: 19.6,
        dirU: 0,
        dirV: 1,
      },
      {
        id: 'f1-print',
        floor: 1,
        title: { vi: '-- Khu vực in ấn', en: '-- Printing Area' },
        banner: { vi: 'BẠN ĐANG ĐỨNG TẠI KHU IN ẤN', en: 'YOU ARE AT THE PRINTING AREA' },
        u: 49.0,
        v: 6.2,
        dirU: -1,
        dirV: -0.6,
      },
      {
        id: 'f1-study',
        floor: 1,
        title: { vi: '-- Khu tự học', en: '-- Self-Study Area' },
        banner: { vi: 'BẠN ĐANG ĐỨNG TẠI KHU TỰ HỌC', en: 'YOU ARE AT FLOOR 1 SELF-STUDY AREA' },
        u: 31.8,
        v: 6.2,
        dirU: 0.85,
        dirV: 0.7,
      },
      {
        id: 'f1-exchange',
        floor: 1,
        title: { vi: '-- Góc trao đổi sách', en: '-- Book Exchange Corner' },
        banner: { vi: 'BẠN ĐANG ĐỨNG TẠI KHU TRAO ĐỔI SÁCH', en: 'YOU ARE AT BOOK EXCHANGE CORNER' },
        u: 7.4,
        v: 5.6,
        dirU: 0.9,
        dirV: -0.35,
      },
    ],
  },
  {
    floor: 2,
    label: { vi: 'TẦNG 2', en: 'FLOOR 2' },
    landing: {
      id: 'f2-main',
      floor: 2,
      isLanding: true,
      title: { vi: 'Sảnh Tầng 2', en: 'Floor 2 Lobby' },
      banner: { vi: 'BẠN ĐANG ĐỨNG TẠI TẦNG 2 THƯ VIỆN EIU', en: 'YOU ARE ON FLOOR 2 OF EIU LIBRARY' },
      u: 50.5,
      v: 14.0,
      dirU: -1,
      dirV: 0,
    },
    spots: [
      {
        id: 'f2-multi',
        floor: 2,
        title: { vi: '-- Phòng đa năng', en: '-- Multipurpose Room' },
        banner: { vi: 'BẠN ĐANG ĐỨNG TRƯỚC DÃY PHÒNG HỌC NHÓM', en: 'YOU ARE AT GROUP STUDY & MULTIPURPOSE ROOMS' },
        u: 15.6,
        v: 20.6,
        dirU: 0.25,
        dirV: 1,
      },
      {
        id: 'f2-study',
        floor: 2,
        title: { vi: '-- Khu tự học', en: '-- Self-Study Area' },
        banner: { vi: 'BẠN ĐANG ĐỨNG TẠI KHU TỰ HỌC TẦNG 2', en: 'YOU ARE AT FLOOR 2 SELF-STUDY AREA' },
        u: 31.5,
        v: 9.2,
        dirU: -0.4,
        dirV: -1,
      },
    ],
  },
  {
    floor: 3,
    label: { vi: 'TẦNG 3', en: 'FLOOR 3' },
    landing: {
      id: 'f3-main',
      floor: 3,
      isLanding: true,
      title: { vi: 'Sảnh Tầng 3', en: 'Floor 3 Lobby' },
      banner: { vi: 'BẠN ĐANG ĐỨNG TẠI TẦNG 3 THƯ VIỆN EIU', en: 'YOU ARE ON FLOOR 3 OF EIU LIBRARY' },
      u: 49.0,
      v: 14.0,
      dirU: -1,
      dirV: 0,
    },
    spots: [
      {
        id: 'f3-shelves',
        floor: 3,
        title: { vi: '-- Khu kệ sách', en: '-- Bookshelf Area' },
        banner: { vi: 'BẠN ĐANG ĐỨNG TẠI KHU ĐỌC SÁCH', en: 'YOU ARE AT FLOOR 3 BOOKSHELVES' },
        u: 50.8,
        v: 9.4,
        dirU: 0.9,
        dirV: -0.45,
      },
      {
        id: 'f3-reading',
        floor: 3,
        title: { vi: '-- Góc đọc sách', en: '-- Reading Corner' },
        banner: { vi: 'BẠN ĐANG ĐỨNG TẠI GÓC ĐỌC SÁCH', en: 'YOU ARE AT FLOOR 3 READING CORNER' },
        u: 33.5,
        v: 7.2,
        dirU: 0,
        dirV: -1,
      },
      {
        id: 'f3-circ',
        floor: 3,
        title: { vi: '-- Quầy lưu hành', en: '-- Circulation Desk' },
        banner: { vi: 'BẠN ĐANG ĐỨNG TẠI QUẦY LƯU HÀNH', en: 'YOU ARE AT THE CIRCULATION DESK' },
        u: 41.4,
        v: 15.8,
        dirU: -1,
        dirV: -0.45,
      },
    ],
  },
];

export interface LibraryServiceTab {
  readonly id: string;
  readonly label: LocalizedText;
  readonly heading: LocalizedText;
  readonly summary: LocalizedText;
  readonly bullets: readonly LocalizedText[];
}

export const LIBRARY_SERVICES: readonly LibraryServiceTab[] = [
  {
    id: 'opac',
    label: { vi: 'Tra cứu tài liệu', en: 'Catalog & OPAC' },
    heading: { vi: 'Cổng tra cứu OPAC & Cơ sở dữ liệu số', en: 'OPAC Search & Digital Databases' },
    summary: {
      vi: 'Sinh viên tra cứu sách in theo phân loại DDC (000–999) và hàng nghìn tài liệu học thuật trực tuyến tại 48 máy tính Tầng 1 hoặc qua cổng lib.eiu.edu.vn.',
      en: 'Search print collections by DDC (000–999) and online academic databases on 48 Floor 1 PCs or at lib.eiu.edu.vn.',
    },
    bullets: [
      { vi: '48 máy All-in-One ở hai khu máy tính phía Bắc & Nam sảnh Tầng 1.', en: '48 All-in-One PCs across North & South computer zones on Floor 1.' },
      { vi: 'Truy cập IEEE, ScienceDirect, ProQuest và kho luận văn EIU.', en: 'Access IEEE, ScienceDirect, ProQuest, and EIU thesis repositories.' },
      { vi: 'Mã QR tra cứu nhanh dán trực tiếp trên vách kính mặt Nam.', en: 'Quick QR lookup posters mounted along the South glass facade.' },
    ],
  },
  {
    id: 'borrow',
    label: { vi: 'Mượn, trả, gia hạn tài liệu', en: 'Borrow, Return & Renew' },
    heading: { vi: 'Quầy Lưu hành Tầng 3 & Cổng an ninh RFID', en: 'Floor 3 Circulation Desk & RFID Gates' },
    summary: {
      vi: 'Mượn, trả và gia hạn giáo trình, sách tham khảo bằng thẻ sinh viên EIU tại Quầy lưu hành Tầng 3 (cạnh bức tường gỗ LIBRARY).',
      en: 'Borrow, return, and renew textbooks and reference materials with your EIU student ID at the Floor 3 Circulation Desk.',
    },
    bullets: [
      { vi: 'Quầy lưu hành Đông & Tây hỗ trợ kiểm tra tình trạng mượn sách.', en: 'East & West circulation counters assist with loans and renewals.' },
      { vi: 'Bàn tròn trước quầy trưng bày sách mới chọn lọc hàng tháng.', en: 'Round display table showcases curated new arrivals each month.' },
      { vi: 'Cổng kiểm soát RFID ở lối ra Tầng 3 bảo đảm an ninh tài liệu.', en: 'RFID security gates at the Floor 3 exit safeguard library holdings.' },
    ],
  },
  {
    id: 'support',
    label: { vi: 'Giải đáp thắc mắc', en: 'Ask a Librarian' },
    heading: { vi: 'Quầy Thông tin Tầng 1 & Góc trao đổi sách', en: 'Floor 1 Information Desk & Book Exchange' },
    summary: {
      vi: 'Thủ thư trực tiếp hướng dẫn tìm tài liệu, sử dụng dịch vụ in ấn, tủ gửi đồ 36 ngăn và tham gia Góc trao đổi sách cộng đồng.',
      en: 'Librarians help you locate materials, use printing & 36-cubby lockers, and share books at the Book Exchange Corner.',
    },
    bullets: [
      { vi: 'Quầy thông tin ngay sau cầu thang gáy sách Tầng 1.', en: 'Information Desk right past the grand book-spine staircase on Floor 1.' },
      { vi: 'Khu in ấn & tủ gửi đồ nằm sát cửa phụ phía Bắc Tầng 1.', en: 'Printing station & 36-cubby locker cabinet near the North Floor 1 door.' },
      { vi: 'Góc trao đổi sách ở góc Tây Bắc nối thẳng ra sân pergola ngoài trời.', en: 'Book Exchange Corner in the NW corner opening onto the pergola patio.' },
    ],
  },
  {
    id: 'rooms',
    label: { vi: 'Phòng học nhóm & Tự học', en: 'Group & Quiet Study' },
    heading: { vi: '9 Phòng học nhóm Tầng 2 & Góc đọc Tầng 3', en: 'Floor 2 Group Rooms & Floor 3 Study' },
    summary: {
      vi: 'Tầng 2 bố trí 8 phòng họp nhóm (01–08), 1 Phòng đa năng (09), dãy sofa xanh ngọc lượn sóng và Khu tự học cạnh cửa sổ.',
      en: 'Floor 2 offers 8 Group Study Rooms (01–08), Multipurpose Room 09, wavy teal lounge seating, and window-side self-study tables.',
    },
    bullets: [
      { vi: 'Mỗi phòng 01–08 có bàn họp 6 chỗ và bảng đặt phòng điện tử ngoài cửa.', en: 'Rooms 01–08 feature 6-seat meeting tables with digital door booking pads.' },
      { vi: 'Phòng 09 (Phòng đa năng) sức chứa gấp đôi phục vụ thảo luận lớn.', en: 'Room 09 (Multipurpose) doubles capacity for larger team workshops.' },
      { vi: 'Tầng 3 có 4 cụm ghế bành thư giãn và 2 bàn đọc cửa sổ yên tĩnh.', en: 'Floor 3 provides 4 lounge armchair alcoves and 2 quiet window reading tables.' },
    ],
  },
  {
    id: 'mobile',
    label: { vi: 'Ứng dụng di động', en: 'Mobile App' },
    heading: { vi: 'Ứng dụng EIU Library & Liên hệ', en: 'EIU Library Mobile App & Contact' },
    summary: {
      vi: 'Kết nối trực tuyến với Thư viện Trường Đại học Quốc tế Miền Đông mọi lúc trên web và ứng dụng EIU Library.',
      en: 'Stay connected with Eastern International University Library anytime via web portal and the EIU Library mobile app.',
    },
    bullets: [
      { vi: 'Địa chỉ: Đường Nam Kỳ Khởi Nghĩa, P. Hòa Phú, TP. Mới Bình Dương.', en: 'Address: Nam Ky Khoi Nghia St, Hoa Phu Ward, Binh Duong New City.' },
      { vi: 'Điện thoại: (+84) 274 222 1193 · Email: lib@eiu.edu.vn', en: 'Phone: (+84) 274 222 1193 · Email: lib@eiu.edu.vn' },
      { vi: 'Cổng thông tin thư viện chính thức: https://lib.eiu.edu.vn', en: 'Official library portal: https://lib.eiu.edu.vn' },
    ],
  },
];
