import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

const OUT_DIR = 'docs/tasks/FIX-NC-anh';
if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR, { recursive: true });
}

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:5182';

const SHOTS = [
  {
    name: '01-duong-sat-dat-bo-via.png',
    // Đường nội bộ, bó vỉa sát đất, lối đi bộ
    cam: '-20.0,1.5,-100.0,-36.4,1.0,-102.0',
    snow: 0,
  },
  {
    name: '02-hanh-lang-day-leo.png',
    // Rèm dây leo rủ mềm dọc hành lang mái che (t017s)
    cam: '61.0,1.4,-118.2,75.0,1.5,-108.3',
    snow: 0,
  },
  {
    name: '03-gian-leo-duong-noi-bo.png',
    // Giàn vòm dây leo rủ mềm vắt ngang đường (t037s)
    cam: '-36.4,2.2,-118.0,-36.4,2.5,-98.0',
    snow: 0,
  },
  {
    name: '04-highlands-vines.png',
    // Highlands ki-ốt xe buýt đỏ với rèm dây leo rủ mềm (t041s, t045s)
    cam: '138.5,2.2,-64.0,146.0,2.4,-64.0',
    snow: 0,
  },
  {
    name: '05-cau-ho-day-leo.png',
    // Cầu đi bộ và giàn pergola rủ bên hồ nước
    cam: '112.0,2.2,-68.0,123.0,1.8,-72.6',
    snow: 0,
  },
  {
    name: '06-he-cay-tong-quan.png',
    // Toàn cảnh hệ cây 3 loại phân bố đều khắp khuôn viên
    cam: '',
    snow: 0,
  },
  {
    name: '07-duong-khi-tuyet.png',
    // Kiểm tra mặt đường và bó vỉa khi có tuyết rơi
    cam: '-20.0,1.5,-100.0,-36.4,1.0,-102.0',
    snow: 1,
  },
];

console.log('Bắt đầu chụp ảnh kiểm tra FIX-NC...');

for (const s of SHOTS) {
  const params = [];
  if (s.cam) params.push(`cam=${s.cam}`);
  params.push(`snow=${s.snow}`);
  const url = `${BASE_URL}/?${params.join('&')}`;
  const outPath = `${OUT_DIR}/${s.name}`;
  console.log(`Chụp ${s.name} ...`);

  try {
    const cmd = `"${CHROME}" --headless --use-gl=angle --virtual-time-budget=3500 --screenshot="${outPath}" --window-size=1280,720 "${url}"`;
    execSync(cmd, { stdio: 'pipe', timeout: 15000 });
    console.log(`  -> Xong: ${outPath}`);
  } catch (err) {
    console.error(`  -> Lỗi chụp ${s.name}:`, err.message);
  }
}

console.log('Hoàn thành chụp ảnh!');
