import http from 'http';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('docs/tasks/PHONG-MAY-anh');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const tabs = await getJson('http://localhost:9222/json/list');
  const appTab = tabs.find((t) => t.url.includes(':5178'));
  if (!appTab) {
    console.error('Không tìm thấy tab chạy cổng 5178');
    process.exit(1);
  }

  console.log('Kết nối CDP:', appTab.webSocketDebuggerUrl);
  const ws = new WebSocket(appTab.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((res) => (ws.onopen = res));
  console.log('CDP WebSocket đã mở.');

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function evaluate(expr) {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  async function capture(filename) {
    await sleep(600);
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const filePath = path.join(OUT_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    console.log(`Đã chụp ảnh: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  console.log('Khởi động buổi học...');
  await evaluate(`
    if (window.__lesson) {
      window.__lesson.getState().startLesson('nmlt-01');
    }
  `);
  await sleep(2500);

  // 1. Tổng quan phòng 406 nhìn từ lối đi trung tâm về phía tường Đông (TV + 2 bảng)
  console.log('1. Chuyển sang góc nhìn thứ nhất, đứng tại lối đi u=88.5, v=-142.0 nhìn về tường Đông...');
  await evaluate(`
    (() => {
      // Đổi sang góc nhìn thứ nhất (bấm C)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));

      const u = 88.5;
      const v = -142.0;
      const ex = [0.985642036, -0.168848383];
      const ev = [0.168848383, 0.985642036];
      const wx = u * ex[0] + v * ev[0];
      const wz = u * ex[1] + v * ev[1];
      const yaw = Math.atan2(ex[1], ex[0]);
      window.dispatchEvent(new CustomEvent('campussim:set-player-pose', { detail: { x: wx, z: wz, yaw, pitch: 0.05, y: 0 } }));
    })()
  `);
  await sleep(1500);
  await capture('01-tong-quan-phong-406.png');

  // 2. Cận cảnh tường trước: TV slide, 2 bảng trắng, thầy Nam
  console.log('2. Cận cảnh tường trước: TV slide, 2 bảng trắng, thầy Nam...');
  await evaluate(`
    (() => {
      const u = 93.0;
      const v = -142.0;
      const ex = [0.985642036, -0.168848383];
      const ev = [0.168848383, 0.985642036];
      const wx = u * ex[0] + v * ev[0];
      const wz = u * ex[1] + v * ev[1];
      const yaw = Math.atan2(ex[1], ex[0]);
      window.dispatchEvent(new CustomEvent('campussim:set-player-pose', { detail: { x: wx, z: wz, yaw, pitch: 0.02, y: 0 } }));
    })()
  `);
  await sleep(1200);
  await capture('02-tuong-truoc-tv-bang-thay.png');

  // 3. Đứng giữa phòng quay nhìn sang tường cửa sổ phía Bắc (-v) với 7 poster EIU
  console.log('3. Nhìn sang tường cửa sổ phía Bắc với chuỗi poster EIU...');
  await evaluate(`
    (() => {
      const u = 91.8;
      const v = -143.2;
      const ex = [0.985642036, -0.168848383];
      const ev = [0.168848383, 0.985642036];
      const wx = u * ex[0] + v * ev[0];
      const wz = u * ex[1] + v * ev[1];
      // nhìn hướng -v (tường Bắc)
      const yaw = Math.atan2(-ev[1], -ev[0]);
      window.dispatchEvent(new CustomEvent('campussim:set-player-pose', { detail: { x: wx, z: wz, yaw, pitch: 0.22, y: 0 } }));
    })()
  `);
  await sleep(1200);
  await capture('03-day-cua-so-poster-eiu.png');

  // 4. Ngước nhìn trần dầm đen & đèn LED treo thả, điều hòa cassette
  console.log('4. Nhìn trần hở dầm đen, đèn treo thả, điều hòa cassette...');
  await evaluate(`
    (() => {
      const u = 91.8;
      const v = -142.0;
      const ex = [0.985642036, -0.168848383];
      const ev = [0.168848383, 0.985642036];
      const wx = u * ex[0] + v * ev[0];
      const wz = u * ex[1] + v * ev[1];
      const yaw = Math.atan2(ex[1], ex[0]);
      window.dispatchEvent(new CustomEvent('campussim:set-player-pose', { detail: { x: wx, z: wz, yaw, pitch: 0.58, y: 0 } }));
    })()
  `);
  await sleep(1200);
  await capture('04-tran-dam-den-den-tha.png');

  // 5. Ngồi vào ghế 406-r2-s6 (chế độ sau vai)
  console.log('5. Ngồi vào ghế người chơi 406-r2-s6...');
  await evaluate(`
    if (window.__lesson) {
      window.__lesson.getState().sitDown('406-r2-s6');
    }
  `);
  await sleep(1500);
  await capture('05-ngoi-sau-vai-hoc.png');

  // 6. Bài giảng slide trên TV
  console.log('6. Chuyển sang bài giảng...');
  await evaluate(`
    if (window.__lesson) {
      const s = window.__lesson.getState();
      s.goToStep(1);
    }
  `);
  await sleep(1200);
  await capture('06-bai-giang-slide-tv.png');

  // 7. Mở máy ảo desktop
  console.log('7. Mở máy ảo desktop...');
  await evaluate(`
    if (window.__lesson) {
      window.__lesson.getState().openDesktop();
    }
  `);
  await sleep(1200);
  await capture('07-may-ao-desktop.png');

  // 8. Thoát máy ảo & đứng dậy ra lối đi
  console.log('8. Thoát máy ảo & đứng dậy ra lối đi...');
  await evaluate(`
    if (window.__lesson) {
      window.__lesson.getState().closeDesktop();
      window.__lesson.getState().standUp();
      // Nhấn C 2 lần để trở về góc nhìn sau vai (viewMode = 0)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));

      // Đặt camera nhìn ngang
      const ex = [0.985642036, -0.168848383];
      const yaw = Math.atan2(ex[1], ex[0]);
      const [standX, standZ] = [
        91.8 * ex[0] + (-142.0) * 0.168848383,
        91.8 * ex[1] + (-142.0) * 0.985642036
      ];
      window.dispatchEvent(new CustomEvent('campussim:set-player-pose', { detail: { x: standX, z: standZ, yaw, pitch: 0.05, y: 0 } }));
    }
  `);
  await sleep(1500);
  await capture('08-dung-day-khong-ket.png');

  console.log('Hoàn thành chụp bộ 8 ảnh nghiệm thu!');
  ws.close();
}

main().catch((err) => {
  console.error('Lỗi kiểm tra:', err);
  process.exit(1);
});
