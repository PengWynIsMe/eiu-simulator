// Chuỗi giao diện tiếng Việt. Nội dung ngành học KHÔNG để ở đây (nằm trong campus.json).
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
} as const;

export interface FloorRoomEntry {
  readonly code?: string;
  readonly name: string;
}

export interface FloorGroupSpec {
  readonly title?: string;
  readonly rooms: readonly FloorRoomEntry[];
}

export interface BuildingFloorSpec {
  readonly floorNumber: number;
  readonly label: string;
  readonly elevation: string;
  readonly architecturalNote: string;
  readonly groups: readonly FloorGroupSpec[];
}

export interface BuildingDetailSpec {
  readonly subtitle: string;
  readonly facts: readonly string[];
  readonly floors?: readonly BuildingFloorSpec[];
}

export const BUILDING_SPECS: Readonly<Record<string, BuildingDetailSpec>> = {
  b3: {
    subtitle: 'Trường Kinh tế Becamex & Hợp tác Quốc tế',
    facts: [
      'Khối nhà chữ L gồm 3 tầng (cao 11,4 m) nằm ở góc Đông Nam khu vực 1.',
      'Giữa tầng 2 và tầng 3 có khoảng thông tầng cho Hội trường lớn 200.B3 sức chứa 544 chỗ.',
      'Kết nối trực tiếp qua hành lang mái che sang sảnh trung tâm Block 6 (Vườn ươm BBI).',
    ],
    floors: [
      {
        floorNumber: 1,
        label: 'Tầng 1 (Trệt)',
        elevation: '0,0 – 3,8 m',
        architecturalNote: 'Tập trung văn phòng khoa, phòng họp VIP và các phòng học lý thuyết.',
        groups: [
          {
            rooms: [
              { code: '104–105.B3', name: 'Văn phòng Khoa Quản trị Kinh doanh (QTKD) & Honors Program' },
              { code: '102–103.B3', name: 'Cụm Phòng học Lý thuyết' },
              { code: '101.B3 / P.106', name: 'Phòng họp & khu làm việc hành chính' },
              { code: '100.B3', name: 'Phòng VIP' },
              { code: 'P.107', name: 'Phòng học' },
              { code: '108–110.B3', name: 'Văn phòng OCE (Hợp tác Doanh nghiệp & Quốc tế)' },
            ],
          },
        ],
      },
      {
        floorNumber: 2,
        label: 'Tầng 2',
        elevation: '3,8 – 7,6 m',
        architecturalNote: 'Không gian Hội trường lớn và hệ thống 4 giảng đường bậc thang.',
        groups: [
          {
            rooms: [
              { code: '200.B3', name: 'Hội trường lớn EIU (sức chứa 544 sinh viên)' },
              { code: '201–204.B3', name: 'Giảng đường 1 đến Giảng đường 4' },
              { code: '205.B3', name: 'Phòng chức năng & khu WC, Kho' },
            ],
          },
        ],
      },
      {
        floorNumber: 3,
        label: 'Tầng 3',
        elevation: '7,6 – 11,4 m',
        architecturalNote: 'Mở thông tầng xuống Hội trường 200.B3 cùng các giảng đường tầng trên.',
        groups: [
          {
            rooms: [
              { code: 'Thông tầng', name: 'Khoảng thông tầng Hội trường 200.B3 & Phòng Kỹ thuật' },
              { code: '301.B3', name: 'Giảng đường 5' },
              { code: '302.B3', name: 'Giảng đường 6' },
              { code: '303.B3', name: 'Văn phòng Khoa QTKD (tầng 3)' },
            ],
          },
        ],
      },
    ],
  },
  b4: {
    subtitle: 'Thư viện & Trung tâm Tri thức EIU',
    facts: [
      'Khối 3 tầng cao 11,4 m đặt dọc trục Bắc–Nam ở trung tâm khu vực 1, cạnh cụm hồ nước.',
      'Tầng trệt mở thông thoáng kiểu hành lang cột giữa Block 4 và Block 5; phía Tây Bắc nối cầu đi bộ mái che sang Block 11.',
      'Trên mái phẳng bố trí 24 tấm pin năng lượng mặt trời và ô giếng trời lấy sáng.',
    ],
    floors: [
      {
        floorNumber: 1,
        label: 'Tầng 1 (Trệt)',
        elevation: '0,0 – 3,8 m',
        architecturalNote: 'Sảnh chính Thư viện, quầy thủ thư và lối đi thông thoáng sang Block 5.',
        groups: [
          {
            rooms: [
              { code: '100.B4', name: 'Thư viện EIU — sảnh đón, tra cứu và khu đọc tầng 1' },
            ],
          },
        ],
      },
      {
        floorNumber: 2,
        label: 'Tầng 2',
        elevation: '3,8 – 7,6 m',
        architecturalNote: 'Khu học tập, đọc tài liệu chuyên ngành và phòng thảo luận nhóm.',
        groups: [
          {
            rooms: [
              { name: 'Không gian Thư viện tầng 2 — kệ sách học thuật, máy tính tra cứu & bàn tự học' },
            ],
          },
        ],
      },
      {
        floorNumber: 3,
        label: 'Tầng 3',
        elevation: '7,6 – 11,4 m',
        architecturalNote: 'Tầng trên cùng dưới mái pin mặt trời, phục vụ học tập yên tĩnh & nghiên cứu.',
        groups: [
          {
            rooms: [
              { name: 'Không gian Thư viện tầng 3 & sảnh trên' },
            ],
          },
        ],
      },
    ],
  },
  b5: {
    subtitle: 'Khối Hành chính, CTSV & Khoa Giáo dục Đại cương',
    facts: [
      'Khối nhà 3 tầng cao 11,4 m song song phía Đông Block 4, có hành lang cột tầng trệt nối liền mạch.',
      'Tầng trệt tập trung các phòng dịch vụ sinh viên, hành chính và tài chính của trường.',
    ],
    floors: [
      {
        floorNumber: 1,
        label: 'Tầng 1 (Trệt)',
        elevation: '0,0 – 3,8 m',
        architecturalNote: 'Cụm phòng ban chức năng phục vụ sinh viên & điều hành.',
        groups: [
          {
            rooms: [
              { code: '101.B5', name: 'Phòng Công tác Sinh viên (CTSV) — hỗ trợ Đào tạo & Tài chính (Sổ tay SV)' },
              { code: '102.B5', name: 'Phòng Quản Trị' },
              { code: '104.B5', name: 'Kho Phòng Tổ chức Hành chính (TCHC)' },
              { code: '106.B5', name: 'Phòng Tổ chức Hành chính (P. TCHC)' },
              { code: '112.B5', name: 'Phòng Kế Toán (P. KT)' },
            ],
          },
        ],
      },
      {
        floorNumber: 2,
        label: 'Tầng 2',
        elevation: '3,8 – 7,6 m',
        architecturalNote: 'Khu văn phòng khoa và phòng học tầng 2.',
        groups: [
          {
            rooms: [
              { code: '205.B5', name: 'Văn phòng Khoa Giáo dục Đại cương (GDĐC)' },
              { name: 'Các phòng học & khu làm việc tầng 2' },
            ],
          },
        ],
      },
      {
        floorNumber: 3,
        label: 'Tầng 3',
        elevation: '7,6 – 11,4 m',
        architecturalNote: 'Khu giảng dạy và văn phòng chuyên môn tầng trên.',
        groups: [
          {
            rooms: [
              { name: 'Khu phòng học lý thuyết & phòng chức năng tầng 3' },
            ],
          },
        ],
      },
    ],
  },
  b6: {
    subtitle: 'Vườn ươm Doanh nghiệp Becamex (BBI) & Đổi mới Sáng tạo',
    facts: [
      'Khối 2 tầng cao 7,6 m ở phía Đông Bắc khu 1; mặt ngoài gắn cửa sổ vách kính và mái che lấy sáng sảnh.',
      'Trung tâm là sảnh kính thông với hành lang B3–B6, nổi bật mảng tường xanh dương và đường dốc kết nối.',
    ],
    floors: [
      {
        floorNumber: 1,
        label: 'Tầng 1 (Trệt)',
        elevation: '0,0 – 3,8 m',
        architecturalNote: 'Bố cục đặc trưng với sảnh dốc BBI ở giữa, hội trường phía Tây và dãy gian khởi nghiệp.',
        groups: [
          {
            rooms: [
              { code: '100.B6', name: 'Trung tâm An ninh mạng (Sổ tay SV) & cụm Văn phòng Vườn ươm BBI' },
              { code: 'P.100–P.109', name: 'Các gian làm việc khởi nghiệp BBI (100, 101, 103, 105, 107, 109)' },
              { code: 'P.102', name: 'Hội trường / Không gian sự kiện lớn phía Tây' },
              { code: 'PKT / WC', name: 'Phòng kỹ thuật & khu vệ sinh' },
            ],
          },
        ],
      },
      {
        floorNumber: 2,
        label: 'Tầng 2',
        elevation: '3,8 – 7,6 m',
        architecturalNote: 'Tầng 2 dành cho hoạt động sinh viên và không gian mở tầng trên sảnh BBI.',
        groups: [
          {
            rooms: [
              { code: '206.B6', name: 'Văn phòng Đoàn Thanh niên – Hội Sinh viên EIU (Sổ tay SV)' },
              { name: 'Không gian ươm tạo & sinh hoạt CLB sinh viên tầng 2' },
            ],
          },
        ],
      },
    ],
  },
  b8: {
    subtitle: 'Khối Giảng đường 4 tầng — Khu Tây Bắc',
    facts: [
      'Cụm nhà đôi 4 tầng cao 15,2 m (~120 m × 44,4 m) với 2 giếng trời sân trong ở giữa.',
      'Tầng trệt mở 3 hành lang thông gió cụm Tây – Giữa – Đông; tầng 2–4 có hành lang lan can bao quanh giếng trời.',
      'Lõi thang máy đặt ở nhịp giữa và tháp cầu thang kính nằm tại vạt góc phía Đông.',
    ],
    floors: [
      {
        floorNumber: 1,
        label: 'Tầng 1 (Trệt)',
        elevation: '0,0 – 3,8 m',
        architecturalNote: 'Hai dãy phòng học đối xứng qua 2 sân trong và lối đi mái che thông thoáng.',
        groups: [
          {
            title: 'Cánh Bắc (hướng đường Lê Duẩn)',
            rooms: [
              { code: '102.B8', name: 'Phòng Kỹ thuật điện' },
              { code: '104–120.B8', name: 'Dãy phòng học số chẵn (quy mô 25 SV/phòng) & khu WC' },
            ],
          },
          {
            title: 'Cánh Nam (hướng sân trong nội khu)',
            rooms: [
              { code: '101–121.B8', name: 'Dãy phòng học số lẻ (quy mô 25 SV/phòng) & WC góc Tây Nam' },
            ],
          },
        ],
      },
      {
        floorNumber: 2,
        label: 'Tầng 2',
        elevation: '3,8 – 7,6 m',
        architecturalNote: 'Hành lang lan can quanh 2 giếng trời liên thông 3 cầu nối Bắc–Nam.',
        groups: [
          {
            title: 'Cánh Bắc',
            rooms: [
              { code: '202–220.B8', name: 'Dãy phòng học số chẵn (25 SV/phòng) & khu WC' },
            ],
          },
          {
            title: 'Cánh Nam',
            rooms: [
              { code: '201–221.B8', name: 'Dãy phòng học số lẻ (25 SV/phòng) & WC' },
            ],
          },
        ],
      },
      {
        floorNumber: 3,
        label: 'Tầng 3',
        elevation: '7,6 – 11,4 m',
        architecturalNote: 'Cánh Bắc giữ module phòng 25 chỗ; cánh Nam mở rộng các phòng 40 chỗ và phòng lớn 60 chỗ.',
        groups: [
          {
            title: 'Cánh Bắc',
            rooms: [
              { code: '302–320.B8', name: 'Dãy phòng học số chẵn (25 SV/phòng) & khu WC' },
            ],
          },
          {
            title: 'Cánh Nam',
            rooms: [
              { code: '301–309, 313–319', name: 'Cụm phòng học cỡ vừa (40 SV/phòng)' },
              { code: 'Phòng 311.B8', name: 'Phòng học / Giảng đường lớn (60 SV)' },
            ],
          },
        ],
      },
      {
        floorNumber: 4,
        label: 'Tầng 4',
        elevation: '11,4 – 15,2 m',
        architecturalNote: 'Tầng cao nhất dưới hệ mái che vươn rộng và lam chắn nắng mặt đứng.',
        groups: [
          {
            title: 'Cánh Bắc',
            rooms: [
              { code: '402–418.B8', name: 'Dãy phòng học số chẵn (25 SV/phòng) & WC' },
            ],
          },
          {
            title: 'Cánh Nam',
            rooms: [
              { code: '401, 403.B8', name: 'Phòng học (25 SV/phòng)' },
              { code: '405–409, 413–419', name: 'Cụm phòng học cỡ vừa (40 SV/phòng)' },
              { code: 'Phòng 411.B8', name: 'Phòng học lớn (60 SV)' },
            ],
          },
        ],
      },
    ],
  },
  b9: {
    subtitle: 'Khối Học thuật 4 tầng — Đối xứng Block 8',
    facts: [
      'Thiết kế cặp song sinh đối xứng với Block 8 qua trục đường nội bộ trung tâm (~120 m × 44,4 m, 4 tầng cao 15,2 m).',
      'Gồm 2 dãy phòng Bắc–Nam bao quanh 2 giếng trời lấy sáng, có hành lang mái che nối thẳng sang Block 10.',
    ],
    floors: [
      {
        floorNumber: 1,
        label: 'Tầng 1 (Trệt)',
        elevation: '0,0 – 3,8 m',
        architecturalNote: 'Tầng trệt có lối đi thông gió xuyên 2 sân trong và nối mái che sang Block 10.',
        groups: [
          {
            rooms: [{ name: 'Cụm phòng học, sảnh tầng trệt & lối thông sân trong' }],
          },
        ],
      },
      {
        floorNumber: 2,
        label: 'Tầng 2',
        elevation: '3,8 – 7,6 m',
        architecturalNote: 'Hành lang lan can quanh giếng trời kết nối 3 cầu nối ngang Bắc–Nam.',
        groups: [
          {
            rooms: [{ name: 'Khu giảng đường & phòng học lý thuyết tầng 2' }],
          },
        ],
      },
      {
        floorNumber: 3,
        label: 'Tầng 3',
        elevation: '7,6 – 11,4 m',
        architecturalNote: 'Bố cục hai cánh Bắc–Nam lấy sáng tự nhiên từ sân trong.',
        groups: [
          {
            rooms: [{ name: 'Khu phòng học & không gian đào tạo tầng 3' }],
          },
        ],
      },
      {
        floorNumber: 4,
        label: 'Tầng 4',
        elevation: '11,4 – 15,2 m',
        architecturalNote: 'Tầng 4 dưới mái che rộng và hệ lam chắn nắng mặt đứng.',
        groups: [
          {
            rooms: [{ name: 'Khu giảng đường tầng 4' }],
          },
        ],
      },
    ],
  },
  b10: {
    subtitle: 'Khối Học thuật 4 tầng — Đối xứng Block 11',
    facts: [
      'Cụm nhà đôi 4 tầng cao 15,2 m (~147 m × 44,6 m) đối xứng với Block 11 qua quảng trường trung tâm.',
      'Bên trong có 2 giếng trời sân trong và 3 lõi kết nối Bắc–Nam; nối hành lang mái che với Block 9 và trục đi bộ sang Block 11.',
    ],
    floors: [
      {
        floorNumber: 1,
        label: 'Tầng 1 (Trệt)',
        elevation: '0,0 – 3,8 m',
        architecturalNote: 'Nền trệt kết hợp các lõi thông thoáng vào 2 giếng trời và lối nối mái che sang Block 9.',
        groups: [
          {
            rooms: [{ name: 'Sảnh tầng 1 & dãy phòng chức năng quanh 2 sân trong' }],
          },
        ],
      },
      {
        floorNumber: 2,
        label: 'Tầng 2',
        elevation: '3,8 – 7,6 m',
        architecturalNote: 'Hành lang lan can mở quanh 2 sân trong.',
        groups: [
          {
            rooms: [{ name: 'Khu phòng học & đào tạo tầng 2' }],
          },
        ],
      },
      {
        floorNumber: 3,
        label: 'Tầng 3',
        elevation: '7,6 – 11,4 m',
        architecturalNote: 'Cấu trúc 2 cánh song song Bắc–Nam kết nối qua lõi thang máy giữa và cầu thang kính phía Đông.',
        groups: [
          {
            rooms: [{ name: 'Khu phòng học & thực hành tầng 3' }],
          },
        ],
      },
      {
        floorNumber: 4,
        label: 'Tầng 4',
        elevation: '11,4 – 15,2 m',
        architecturalNote: 'Tầng cao nhất dưới hệ mái vươn và lam chắn nắng.',
        groups: [
          {
            rooms: [{ name: 'Khu giảng đường & không gian học thuật tầng 4' }],
          },
        ],
      },
    ],
  },
  b11: {
    subtitle: 'Khoa Kỹ thuật, CNTT & Điều dưỡng (FabLab / IIC / Skill Lab)',
    facts: [
      '2 dãy nhà song song Bắc–Nam (~147 m × 44,7 m), gồm 4 tầng cao 15,2 m.',
      '2 giếng trời / sân trong ở giữa giúp lấy sáng tự nhiên, bao quanh bởi hành lang mở và lan can ở tầng 2–4.',
      '3 lõi kết nối Bắc–Nam: cụm Tây thông tầng trệt, lõi Giữa có thang máy, tháp cầu thang kính phía Đông.',
    ],
    floors: [
      {
        floorNumber: 1,
        label: 'Tầng 1 (Trệt)',
        elevation: '0,0 – 3,8 m',
        architecturalNote:
          'Nền trệt kết hợp lối thông thoáng vào 2 sân trong; kết nối lối đi mái che phía Nam hướng sang Block 4.',
        groups: [
          {
            title: 'Cánh Bắc (hướng đường Lê Duẩn)',
            rooms: [
              { code: '104.B11', name: 'Phòng thí nghiệm Công nghệ 4.0 (IIC · Sổ tay SV: 103–104.B11)' },
              { code: 'SHOP FABLAB', name: 'Xưởng chế tạo mẫu thực hành' },
              { code: '108.B11', name: 'Phòng thí nghiệm Thủy lực' },
              { code: '112A.B11', name: 'Phòng thí nghiệm 3.0 & Phòng Kỹ thuật, khu WC' },
            ],
          },
          {
            title: 'Cánh Nam (hướng sân trong Block 4)',
            rooms: [
              { code: 'Phòng 102', name: 'Phòng thực hành Cơ điện / Công nghệ 4.0' },
              { code: 'Phòng 101', name: 'Trung tâm Hỗ trợ Sinh viên (SSC) & khu sinh hoạt' },
            ],
          },
        ],
      },
      {
        floorNumber: 2,
        label: 'Tầng 2',
        elevation: '3,8 – 7,6 m',
        architecturalNote:
          'Hành lang mở có lan can bao quanh 2 giếng trời; 3 cầu nối ngang liên thông cánh Bắc và cánh Nam.',
        groups: [
          {
            title: 'Cánh Bắc (hướng đường Lê Duẩn)',
            rooms: [
              { code: 'STEM Lab', name: 'Không gian giáo dục STEM (212.B11 · Sổ tay SV: 204.B11)' },
              { code: 'FABLAB', name: 'Phòng thí nghiệm chế tạo số EIU FabLab (210.B11 · Sổ tay SV: 204.B11) & WC' },
            ],
          },
          {
            title: 'Cánh Nam (hướng sân trong Block 4)',
            rooms: [
              { name: 'Phòng Thực Hành PLC' },
              { name: 'Phòng Thực Hành Lắp Đặt Điện' },
              { name: 'Phòng Thực Hành Kỹ Thuật Điện Tử' },
              { code: '217.B11', name: 'Phòng Thực Hành Chiếu Sáng' },
              { name: 'Phòng Thực Hành Mạch Điện & Điện Tử Công Suất' },
            ],
          },
        ],
      },
      {
        floorNumber: 3,
        label: 'Tầng 3',
        elevation: '7,6 – 11,4 m',
        architecturalNote:
          'Kết cấu 2 dãy phòng chức năng quanh giếng trời; hành lang cột & lan can dọc sân trong.',
        groups: [
          {
            title: 'Cánh Bắc (hướng đường Lê Duẩn)',
            rooms: [
              { code: '310.B11', name: 'Văn phòng & cụm phòng nghiên cứu / làm việc phía Tây' },
              { code: '308.B11', name: 'Phòng thí nghiệm Năng lượng / Vật lý đại cương' },
              { code: '306.B11', name: 'Văn phòng Khoa Điều dưỡng / Khoa học Sức khỏe (Sổ tay SV)' },
              { code: '304.B11', name: 'PERE Lab & khu WC' },
            ],
          },
          {
            title: 'Cánh Nam (hướng sân trong Block 4)',
            rooms: [
              { code: 'P.307', name: 'Skill Lab — Phòng thực hành kỹ năng ngành Điều dưỡng' },
              { code: 'Phía Đông', name: 'Khu giảng đường / phòng thi quy mô lớn (120 bộ bàn ghế)' },
            ],
          },
        ],
      },
      {
        floorNumber: 4,
        label: 'Tầng 4',
        elevation: '11,4 – 15,2 m',
        architecturalNote:
          'Tầng cao nhất dưới hệ mái che vươn rộng và lam chắn nắng; tập trung Văn phòng Khoa và các phòng máy tính.',
        groups: [
          {
            title: 'Cánh Bắc (hướng đường Lê Duẩn)',
            rooms: [
              { code: '416.B11', name: 'Văn phòng Khoa Kỹ thuật (VP KKT · Sổ tay SV)' },
              { code: '414.B11', name: 'Văn phòng Khoa Công nghệ Thông tin (VP KCNTT · Sổ tay SV)' },
              { code: '410.B11', name: 'Phòng máy AI (PM AI)' },
              { code: '402–408.B11', name: 'Cụm Phòng Thực Hành Khoa CNTT (Lab CNTT / PM CNTT) & WC' },
            ],
          },
          {
            title: 'Cánh Nam (hướng sân trong Block 4)',
            rooms: [{ name: '2 khu không gian lớn dự phòng mở rộng' }],
          },
        ],
      },
    ],
  },
  'can-tin': {
    subtitle: 'Căn tin & Không gian Ẩm thực Sinh viên',
    facts: [
      'Nằm tại góc Đông Bắc khuôn viên cạnh Nhà xe 15 khoang (vị trí số 1 trên bản đồ Sổ tay Sinh viên EIU).',
      'Sảnh ăn trong nhà 1 tầng vách kính rộng kết hợp mái nâng lấy sáng tự nhiên.',
      'Phục vụ các quầy Giải khát, Món cơm, Món nước cùng khu bàn ăn mái pergola ngoài trời ở phía Nam.',
    ],
  },
  highlands: {
    subtitle: 'Quán cà phê Highlands Coffee (Xe buýt Đỏ)',
    facts: [
      'Ki-ốt phong cách xe buýt cổ màu đỏ viền băng chữ trắng đặt cạnh hồ nước và quảng trường trung tâm.',
      'Có dãy ô che bàn ngồi ngoài trời phục vụ sinh viên nghỉ ngơi, học nhóm.',
    ],
  },
  'fami-pizza': {
    subtitle: 'Fami Pizza & Khu Ẩm thực Ngoài trời',
    facts: [
      'Ki-ốt nhỏ trên sàn gỗ kết hợp giàn pergola mái che và cụm bàn ghế ngoài trời gần khu vực Block 5.',
    ],
  },
  'hanh-lang-b3-b6': {
    subtitle: 'Hành lang Mái che Block 3 – Block 6',
    facts: [
      'Tuyến đi bộ có mái che và hàng cột mở kết nối trực tiếp Block 3 với sảnh trung tâm Block 6 (BBI).',
    ],
  },
  'nha-xe-b5': {
    subtitle: 'Nhà xe Khu vực 1 (Cạnh Block 5)',
    facts: [
      'Nhà xe sinh viên mái tôn răng cưa dốc nhiều khoang phục vụ khu vực các Block 3–6.',
    ],
  },
  'nha-xe-can-tin': {
    subtitle: 'Nhà xe Cạnh Căn tin (Khu vực 2)',
    facts: [
      'Dãy nhà xe dài mái tôn răng cưa 15 khoang nằm phía Đông Bắc, sát bên Căn tin EIU.',
    ],
  },
  'nha-xe-2-tang': {
    subtitle: 'Nhà xe 2 Tầng',
    facts: [
      'Công trình đỗ xe 2 tầng gồm sàn hầm thấp có đường dốc lên xuống phía Tây, sàn tầng trên cao ~2,7 m và mái tôn răng cưa 7 khoang.',
    ],
  },
  'cong-chinh': {
    subtitle: 'Cổng Chính Đại học Quốc tế Miền Đông',
    facts: [
      'Cổng vào từ đường Nam Kỳ Khởi Nghĩa phía Đông khuôn viên, hướng thẳng về quảng trường vòng xoay trung tâm.',
    ],
  },
  'cong-phu': {
    subtitle: 'Cổng Phụ (Lối ra đường Lê Duẩn)',
    facts: [
      'Cổng phụ phía Bắc bắc ngang trục đường nội bộ giữa cụm Block 8–9 và Block 10–11, gồm trụ cổng, mái cổng thông xe, chốt bảo vệ và barie.',
    ],
  },
  'tram-dien': {
    subtitle: 'Trạm Biến Áp / Hạ tầng Kỹ thuật',
    facts: [
      'Công trình kỹ thuật 1 tầng có nền cao, cửa chớp thông gió và viền mái bảo vệ thiết bị điện toàn khuôn viên.',
    ],
  },
};

export const BUILDING_PANEL_TEXT = {
  close: 'Đóng',
  backToOverview: 'Về tổng quan',
  zonePrefix: 'Khu vực',
  floorsUnit: 'tầng',
  heightPrefix: 'Cao',
  structureTitle: 'Cấu trúc kiến trúc',
  floorsTitle: 'Phân chia tầng & bố trí phòng',
  genericHint: 'Chọn một tòa nhà hoặc dùng nút Về tổng quan để tiếp tục tham quan khuôn viên.',
} as const;
