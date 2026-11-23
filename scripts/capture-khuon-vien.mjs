import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

const OUT_DIR = 'docs/tasks/KHUON-VIEN-anh';
if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR, { recursive: true });
}

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:5174';

const SHOTS = [
  {
    name: '01-highlands-kiosk.png',
    // Cận cảnh mặt tiền ki-ốt toa tàu đỏ, chữ 3D HIGHLANDS trắng trên fascia đỏ, sàn gỗ đỏ, rèm dây leo, bàn ghế cafe (t041s, t045s)
    cam: '138.5,2.2,-64.0,146.0,2.4,-64.0',
  },
  {
    name: '02-highlands-goc-rong.png',
    // Góc rộng Highlands cạnh hồ nước và Block 4
    cam: '126.0,6.0,-52.0,146.0,2.0,-64.0',
  },
  {
    name: '03-canteen-mat-tien.png',
    // Mặt tiền Căn tin: chữ EIU CANTEEN, tường cây xanh đứng, lam caro teal, ghế đá, xích đu (t073s, t061s)
    cam: '129.5,3.2,-210.0,127.5,2.8,-227.5',
  },
  {
    name: '04-canteen-ben-trong.png',
    // Bên trong sảnh ăn: quầy GIẢI KHÁT, MÓN CƠM, MÓN NƯỚC, CASHIER, bàn ghế ăn gỗ (t065s, t069s)
    cam: '119.0,1.9,-233.0,120.0,2.5,-244.0',
  },
  {
    name: '05-hanh-lang-day-leo.png',
    // Dọc hành lang mái che nối B11-B4: rèm dây leo rủ 2 bên, đèn thả trần (t017s)
    cam: '61.0,1.4,-118.2,75.0,1.5,-108.3',
  },
  {
    name: '06-duong-noi-bo-gian-leo.png',
    // Giàn vòm dây leo vắt ngang đường nội bộ, vạch qua đường ngựa vằn (t037s)
    cam: '-36.4,2.2,-118.0,-36.4,2.5,-98.0',
  },
  {
    name: '07-vuon-cay-an-trai-buoi.png',
    // Vườn cây ăn trái: cây bưởi trĩu quả tròn xanh, cọc chống tre 3 chân, lối đi gạch đỏ (t021s, t029s, t033s)
    cam: '41.5,1.6,-78.5,45.0,2.4,-75.0',
  },
  {
    name: '08-nha-xe-mai-rang-cua.png',
    // Nhà xe máy B5: mái răng cưa zigzag trắng sáng, hàng rào song sắt trắng, hàng xe máy, hàng cây cao (t093s, t097s)
    cam: '156.0,2.4,-106.0,168.0,2.8,-130.0',
  },
  {
    name: '09-ho-nuoc-bac-thang-hoa-giay.png',
    // Bờ hồ nước: bậc thang bê tông giật cấp, mép sơn vàng an toàn, chậu hoa giấy hồng/cam (t001s, t005s, t009s)
    cam: '92.5,2.2,5.0,85.0,1.2,2.0',
  },
  {
    name: '10-overview-khuon-vien.png',
    // Toàn cảnh khuôn viên EIU
    cam: '',
  },
];

console.log('Bắt đầu chụp ảnh nghiệm thu ngoại cảnh EIU...');

for (const s of SHOTS) {
  const url = s.cam ? `${BASE_URL}/?cam=${s.cam}` : BASE_URL;
  const outPath = `${OUT_DIR}/${s.name}`;
  console.log(`Chụp ${s.name} ...`);

  try {
    const cmd = `"${CHROME}" --headless --use-gl=angle --virtual-time-budget=3000 --screenshot="${outPath}" --window-size=1280,720 "${url}"`;
    execSync(cmd, { stdio: 'pipe' });
    console.log(`  -> Xong: ${outPath}`);
  } catch (err) {
    console.error(`  -> Lỗi chụp ${s.name}:`, err.message);
  }
}

console.log('Hoàn thành chụp toàn bộ ảnh kiểm chứng!');
