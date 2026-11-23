import { execSync } from 'child_process';
import { existsSync, mkdirSync, unlinkSync } from 'fs';

const OUT_DIR = 'docs/tasks/FIX-NC-anh';
if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR, { recursive: true });
}

// Xóa file test tạm nếu có
for (const temp of ['test-02.png', 'test-02-newcam.png']) {
  const p = `${OUT_DIR}/${temp}`;
  if (existsSync(p)) {
    try { unlinkSync(p); } catch { /* ignore */ }
  }
}

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = process.env.PORT || '5184';
const BASE_URL = `http://localhost:${PORT}`;

const SHOTS = [
  {
    name: '02-hanh-lang-day-leo.png',
    // Rèm dây leo rủ mềm xanh tươi dọc hành lang mái che thoáng sáng (t017s, walk-eiu/00)
    cam: '67.0,1.4,-114.2,84.0,1.5,-101.8',
    snow: 0,
  },
  {
    name: '03-gian-leo-duong-noi-bo.png',
    // Giàn vòm dây leo rủ mềm vắt ngang đường (t037s)
    cam: '-36.4,2.2,-118.0,-36.4,2.5,-98.0',
    snow: 0,
  },
  {
    name: '08-tam-mat-bai-co.png',
    // Tầm mắt ngang người đi bộ (y = 1.4m) trên bãi cỏ kiểm tra chân đất và near clipping plane
    cam: '20.0,1.4,-80.0,45.0,1.4,-65.0',
    snow: 0,
  },
];

console.log(`Bắt đầu chụp ảnh kiểm tra FIX-NC trên ${BASE_URL}...`);

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
