import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEBUG_PORT = 9225;
const APP_PORT = process.env.PORT || 5184;
const BASE_URL = `http://localhost:${APP_PORT}`;
const OUT_DIR = 'docs/tasks/FIX-NC-anh';

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

export async function runBenchmark(modeLabel = 'unnamed', takeScreenshots = false) {
  console.log(`\n=== CHẠY BENCHMARK & KIỂM TRA [${modeLabel}] ===`);

  // Khởi động Chrome headless với mobile simulation
  const chromeProc = spawn(CHROME, [
    '--headless',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--use-gl=angle',
    '--window-size=390,844',
    `${BASE_URL}/?snow=1`,
  ], { stdio: 'ignore' });

  await new Promise((r) => setTimeout(r, 2000));

  let results = null;

  try {
    const tabs = await getJson(`http://localhost:${DEBUG_PORT}/json/list`);
    const appTab = tabs.find((t) => t.url.includes(`:${APP_PORT}`));
    if (!appTab) {
      throw new Error(`Không tìm thấy tab ${APP_PORT}`);
    }

    const ws = new WebSocket(appTab.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let id = 1;
    const send = (method, params = {}) =>
      new Promise((resolve) => {
        const curId = id++;
        const handler = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.id === curId) {
            ws.removeEventListener('message', handler);
            resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });

    // Cấu hình mobile viewport mô phỏng
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });

    // Chờ 3 giây để ổn định scene
    await new Promise((r) => setTimeout(r, 3000));

    // Đo GL info và Frame time qua requestAnimationFrame
    const evalRes = await send('Runtime.evaluate', {
      expression: `
        new Promise((resolve) => {
          const gl = window.__gl;
          const calls = gl ? gl.info.render.calls : 0;
          const triangles = gl ? gl.info.render.triangles : 0;
          const points = gl ? gl.info.render.points : 0;

          const times = [];
          let frames = 0;
          let lastTime = performance.now();

          function step(now) {
            const dt = now - lastTime;
            lastTime = now;
            if (frames > 0) times.push(dt); // bỏ frame đầu tiên
            frames++;
            if (frames <= 60) {
              requestAnimationFrame(step);
            } else {
              times.sort((a, b) => a - b);
              const sum = times.reduce((a, b) => a + b, 0);
              const avg = sum / times.length;
              const p95 = times[Math.floor(times.length * 0.95)];
              resolve({
                calls,
                triangles,
                points,
                avgFrameTimeMs: avg,
                p95FrameTimeMs: p95,
                estimatedFps: 1000 / avg,
              });
            }
          }
          requestAnimationFrame(step);
        })
      `,
      awaitPromise: true,
      returnByValue: true,
    });

    results = evalRes.result?.value;
    console.log(`Kết quả đo [${modeLabel}]:`, JSON.stringify(results, null, 2));

    // Chụp các ảnh kiểm tra nếu được yêu cầu
    if (takeScreenshots) {
      console.log('\n--- Bắt đầu chụp ảnh kiểm tra ---');

      const shots = [
        {
          name: '09-tuyet-roi-toa-nha.png',
          url: `${BASE_URL}/?cam=140.0,6.0,20.0,180.0,10.0,20.0&snow=1`,
          desc: 'Tuyết rơi trước Block 3',
        },
        {
          name: '10-tuyet-roi-mat-dat.png',
          url: `${BASE_URL}/?cam=50.0,1.6,-70.0,80.0,1.4,-60.0&snow=1`,
          desc: 'Tuyết rơi trên mặt đất và bãi cỏ',
        },
        {
          name: '11-la-roi.png',
          url: `${BASE_URL}/?cam=67.0,2.0,-114.2,84.0,2.5,-101.8&snow=0`,
          desc: 'Lá rơi quanh hành lang và cây',
        },
      ];

      for (const shot of shots) {
        console.log(`Chụp: ${shot.desc} (${shot.name})...`);
        await send('Page.navigate', { url: shot.url });
        // Chờ 3.5s để lá/tuyết rơi và animation ổn định
        await new Promise((r) => setTimeout(r, 3500));

        const capture = await send('Page.captureScreenshot', {
          format: 'png',
          clip: { x: 0, y: 0, width: 390, height: 844, scale: 2 },
        });

        if (capture.data) {
          const buffer = Buffer.from(capture.data, 'base64');
          fs.writeFileSync(`${OUT_DIR}/${shot.name}`, buffer);
          console.log(`  -> Đã lưu ${OUT_DIR}/${shot.name} (${(buffer.length / 1024).toFixed(1)} KB)`);
        }
      }
    }

    ws.close();
  } catch (err) {
    console.error(`Lỗi trong benchmark [${modeLabel}]:`, err);
  } finally {
    chromeProc.kill();
  }

  return results;
}

if (process.argv[1]?.endsWith('benchmark-and-capture.mjs')) {
  const label = process.argv[2] || 'test';
  const takeShots = process.argv.includes('--shots');
  runBenchmark(label, takeShots).then(() => {
    process.exit(0);
  });
}
