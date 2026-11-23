import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEBUG_PORT = 9224;
const APP_PORT = 5196;
const BASE_URL = `http://localhost:${APP_PORT}`;
const OUT_DIR = '/tmp/campussim-3d-04';

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log('--- KHỞI ĐỘNG VITE DEV SERVER TRÊN CỔNG 5196 ---');
  const viteProc = spawn('npx', ['vite', '--port', String(APP_PORT)], {
    stdio: 'ignore',
    detached: false,
  });

  // Chờ dev server khởi động
  let viteReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(BASE_URL, (res) => {
          if (res.statusCode === 200) resolve();
          else reject();
        });
        req.on('error', reject);
      });
      viteReady = true;
      break;
    } catch {
      await sleep(500);
    }
  }

  if (!viteReady) {
    console.error('Không thể khởi động Vite dev server trên cổng 5196');
    viteProc.kill();
    process.exit(1);
  }
  console.log('Vite server đã sẵn sàng tại', BASE_URL);

  console.log('--- KHỞI ĐỘNG CHROME HEADLESS DEBUGGING TRÊN CỔNG', DEBUG_PORT, '---');
  const chromeProc = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--use-gl=angle',
    '--window-size=1440,900',
    BASE_URL,
  ], { stdio: 'ignore' });

  let ws = null;
  const measurements = {};

  try {
    let tabs = null;
    for (let i = 0; i < 20; i++) {
      try {
        tabs = await getJson(`http://localhost:${DEBUG_PORT}/json/list`);
        if (tabs && tabs.length > 0) break;
      } catch {
        await sleep(500);
      }
    }

    const appTab = tabs?.find((t) => t.url.includes(`:${APP_PORT}`));
    if (!appTab) {
      throw new Error(`Không tìm thấy tab ${APP_PORT} trong Chrome debug`);
    }

    ws = new WebSocket(appTab.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let idCounter = 1;
    const pending = new Map();
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const curId = idCounter++;
        pending.set(curId, { resolve, reject });
        ws.send(JSON.stringify({ id: curId, method, params }));
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

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // Chờ 3.5 giây để WebGL và Three.js khởi tạo hoàn tất
    await sleep(3500);

    // Cài đặt helper script trong browser
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Ẩn HUD để ảnh chụp 3D rõ nét
          const style = document.createElement('style');
          style.innerHTML = \`
            .pointer-events-auto, [class*="fixed"], [class*="absolute"] {
              opacity: 0.05 !important;
              pointer-events: none !important;
            }
            canvas {
              opacity: 1 !important;
            }
          \`;
          document.head.appendChild(style);

          // Biến theo dõi viewMode
          window.__currentViewMode = 0;
          window.addEventListener('campussim:view-mode', (e) => {
            window.__currentViewMode = e.detail.mode;
          });

          window.__ensureViewMode = (targetMode) => {
            for (let i = 0; i < 3; i++) {
              if (window.__currentViewMode === targetMode) break;
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', code: 'KeyC' }));
            }
          };
        })()
      `,
    });

    async function evaluate(expr) {
      const res = await send('Runtime.evaluate', {
        expression: expr,
        returnByValue: true,
        awaitPromise: true,
      });
      return res.result?.value;
    }

    async function capture(filename) {
      await sleep(1000);
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(res.data, 'base64');
      const filePath = path.join(OUT_DIR, filename);
      fs.writeFileSync(filePath, buffer);
      console.log(`Đã lưu ảnh: ${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`);
    }

    // 1. Chụp phòng 406.B11 trước (baseline)
    console.log('--- 7b. ĐO ĐẠC VÀ CHỤP 406.B11 (BASELINE TRƯỚC/SAU) ---');
    await evaluate(`
      (async () => {
        const { useWalkStore } = await import('/src/store/useWalkStore.ts');
        const { useLessonStore } = await import('/src/store/useLessonStore.ts');
        const { toWorld } = await import('/src/scene/silver/frame.ts');

        useWalkStore.getState().enterInterior('b11');
        useWalkStore.getState().setInteriorFloor(4);
        useLessonStore.getState().startLesson('nmlt-01');
      })()
    `);
    await sleep(800);
    await evaluate(`
      (async () => {
        const { toWorld } = await import('/src/scene/silver/frame.ts');

        window.__ensureViewMode(1); // FPS mode

        // Đứng ở giữa phòng 406.B11 nhìn về phía bảng và thầy giảng
        const [wx, wz] = toWorld('b11', 91.8, -142.0);
        const [tx, tz] = toWorld('b11', 96.5, -142.0);
        const yaw = Math.atan2(tz - wz, tx - wx);

        window.dispatchEvent(new CustomEvent('campussim:set-player-pose', {
          detail: { x: wx, z: wz, yaw, pitch: 0.05, y: 0 }
        }));
      })()
    `);
    await sleep(2500);
    const b11Info = await evaluate(`
      (() => {
        const gl = window.__gl;
        return {
          calls: gl ? gl.info.render.calls : 0,
          triangles: gl ? gl.info.render.triangles : 0,
        };
      })()
    `);
    measurements.b11 = b11Info;
    console.log('406.B11 baseline:', b11Info);
    await capture('07b-phong-406-b11-nmlt01.png');

    // 2. Chuyển sang B8 tầng 4 (phòng trống trước khi bật Silver)
    console.log('--- ĐO ĐẠC PHÒNG TRỐNG TẠI B8 TẦNG 4 (406.B8) ---');
    await evaluate(`
      (async () => {
        const { useWalkStore } = await import('/src/store/useWalkStore.ts');
        const { useLessonStore } = await import('/src/store/useLessonStore.ts');
        const { useActivityStore } = await import('/src/store/useActivityStore.ts');

        useLessonStore.getState().endLesson();
        useActivityStore.getState().end();

        useWalkStore.getState().enterInterior('b8');
        useWalkStore.getState().setInteriorFloor(4);
      })()
    `);
    await sleep(800);
    await evaluate(`
      (async () => {
        const { toWorld } = await import('/src/scene/silver/frame.ts');

        window.__ensureViewMode(1); // FPS mode

        // Đứng giữa 406.B8 nhìn về phía TV Đông
        const [wx, wz] = toWorld('b8', 86.5, -205.1);
        const [tx, tz] = toWorld('b8', 91.2, -205.1);
        const yaw = Math.atan2(tz - wz, tx - wx);

        window.dispatchEvent(new CustomEvent('campussim:set-player-pose', {
          detail: { x: wx, z: wz, yaw, pitch: 0.02, y: 0 }
        }));
      })()
    `);
    await sleep(2500);
    const b8EmptyInfo = await evaluate(`
      (() => {
        const gl = window.__gl;
        return {
          calls: gl ? gl.info.render.calls : 0,
          triangles: gl ? gl.info.render.triangles : 0,
        };
      })()
    `);
    measurements.b8Empty = b8EmptyInfo;
    console.log('406.B8 phòng trống:', b8EmptyInfo);

    // 3. Chụp phòng máy khác (408.B8) để chứng minh các phòng khác giữ nguyên
    console.log('--- 7a. CHỤP PHÒNG MÁY KHÁC (408.B8) ---');
    await evaluate(`
      (async () => {
        const { toWorld } = await import('/src/scene/silver/frame.ts');

        window.__ensureViewMode(1); // FPS mode

        // Điểm giữa phòng 408.B8 (u=77.2, v=-205.1) nhìn về phía TV Đông (u=81.5)
        const [wx, wz] = toWorld('b8', 75.0, -205.1);
        const [tx, tz] = toWorld('b8', 81.5, -205.1);
        const yaw = Math.atan2(tz - wz, tx - wx);

        window.dispatchEvent(new CustomEvent('campussim:set-player-pose', {
          detail: { x: wx, z: wz, yaw, pitch: 0.02, y: 0 }
        }));
      })()
    `);
    await sleep(2000);
    await capture('07a-phong-may-khac-408-b8.png');

    // 4. Kích hoạt hoạt động Silver CSE 103/lab-1 trong 406.B8
    console.log('--- KÍCH HOẠT HOẠT ĐỘNG SILVER TRONG 406.B8 ---');
    await evaluate(`
      (async () => {
        const { useSilverStore } = await import('/src/store/useSilverStore.ts');
        const { useActivityStore } = await import('/src/store/useActivityStore.ts');
        const { useWalkStore } = await import('/src/store/useWalkStore.ts');
        const { getStage } = await import('/src/data/silver/stages.ts');
        const { createStageActivity } = await import('/src/silverWorld/stageContext.ts');
        const { toWorld } = await import('/src/scene/silver/frame.ts');
        const { getClassroom } = await import('/src/data/index.ts');

        const stage = getStage('CSE 103/lab-1');
        const activity = createStageActivity(stage, 'session:cse-103:lab:1', { toWorld, getClassroom });

        useWalkStore.getState().enterInterior('b8');
        useWalkStore.getState().setInteriorFloor(4);

        useSilverStore.setState({
          play: {
            item: stage,
            stepIndex: 0,
            stepCount: 5,
            step: {
              id: 's1',
              type: 'say',
              speaker: 'teacher',
              text: { vi: 'Thầy Nam: Chào các em đến với phòng máy 406.B8!', en: 'Teacher Nam: Welcome to lab 406.B8!' },
            },
            canContinue: true,
          },
        });

        useActivityStore.getState().begin(activity, { teleportTo: 'none', keepSeated: false });
      })()
    `);
    // Chờ 4 giây để load các model nhân vật GLB (Han, Teacher, Students)
    await sleep(4000);

    // 5. Ảnh 1: Từ cửa 406.B8 nhìn vào lớp
    console.log('--- 1. ẢNH TỪ CỬA 406.B8 ---');
    await evaluate(`
      (async () => {
        const { toWorld } = await import('/src/scene/silver/frame.ts');

        window.__ensureViewMode(1); // FPS mode

        // Cửa 406.B8 tại u=83.0, v=-200.0. Đứng ngay ngưỡng cửa u=83.4, v=-200.8 nhìn vào giữa phòng (+u và -v)
        const [wx, wz] = toWorld('b8', 83.4, -200.8);
        const [targetX, targetZ] = toWorld('b8', 87.5, -205.1);
        const yaw = Math.atan2(targetZ - wz, targetX - wx);

        window.dispatchEvent(new CustomEvent('campussim:set-player-pose', {
          detail: { x: wx, z: wz, yaw, pitch: -0.06, y: 0 }
        }));
      })()
    `);
    await sleep(2000);
    await capture('01-tu-cua-406-b8.png');

    // 6. Ảnh 2: Sau vai khi ngồi 406-r2-s5 thật bằng E
    console.log('--- 2. ẢNH SAU VAI KHI NGỒI 406-r2-s5 BẰNG E ---');
    await evaluate(`
      (async () => {
        const { toWorld } = await import('/src/scene/silver/frame.ts');
        const { useActivityStore } = await import('/src/store/useActivityStore.ts');
        const { getClassroom } = await import('/src/data/index.ts');

        window.__ensureViewMode(0); // TPS mode để thấy lưng/vai người chơi

        const room = getClassroom('406.B8');
        const stand = room.standPoint;
        const [sx, sz] = toWorld('b8', stand.u, stand.v);

        // Đứng ngay cạnh ghế ở cự ly kích hoạt (<= 1.2 m)
        window.dispatchEvent(new CustomEvent('campussim:set-player-pose', {
          detail: { x: sx, z: sz, yaw: 0, pitch: 0, y: 0 }
        }));

        useActivityStore.getState().setInRange(true);

        // Nhấn phím E thật để ngồi vào ghế (kích hoạt interact -> seated: true)
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', code: 'KeyE' }));
      })()
    `);
    await sleep(3500);
    const b8SeatedInfo = await evaluate(`
      (() => {
        const gl = window.__gl;
        return {
          calls: gl ? gl.info.render.calls : 0,
          triangles: gl ? gl.info.render.triangles : 0,
        };
      })()
    `);
    measurements.b8Seated = b8SeatedInfo;
    console.log('406.B8 khi ngồi thật bằng E:', b8SeatedInfo);
    await capture('02-sau-vai-khi-ngoi-e.png');

    // Giải phóng trạng thái ngồi để WalkMode cho phép di chuyển tự do các góc máy tiếp theo
    await evaluate(`
      (async () => {
        const { useActivityStore } = await import('/src/store/useActivityStore.ts');
        useActivityStore.setState({ seated: false });
        useActivityStore.getState().setInRange(false);
      })()
    `);
    await sleep(500);

    // 7. Ảnh 3: Cận cảnh sát Han (ngồi ở companionSeat 406-r2-s6)
    console.log('--- 3. ẢNH SÁT HAN ---');
    await evaluate(`
      (async () => {
        const { toWorld } = await import('/src/scene/silver/frame.ts');
        const { useSilverStore } = await import('/src/store/useSilverStore.ts');
        const { getStage } = await import('/src/data/silver/stages.ts');

        // Bật lời thoại của Han để Han quay sang nói chuyện và hiện nhãn tên
        const stage = getStage('CSE 103/lab-1');
        useSilverStore.setState({
          play: {
            item: stage,
            stepIndex: 1,
            stepCount: 5,
            step: {
              id: 's2',
              type: 'say',
              speaker: 'han',
              text: { vi: 'Han: Chào bạn, hôm nay chúng ta cùng thực hành CSE 103 nhé!', en: 'Han: Hi there, let us do CSE 103 together!' },
            },
            canContinue: true,
          },
        });

        window.__ensureViewMode(1); // FPS mode

        // Han ngồi ở u=86.48, v=-203.2 và quay mặt về phía người chơi (u=86.48, v=-204.2) khi nói.
        // Đặt camera ngay tại vị trí người chơi nhìn thẳng vào mặt Han
        const [cx, cz] = toWorld('b8', 86.48, -204.3);
        const [hx, hz] = toWorld('b8', 86.48, -203.2);
        const yaw = Math.atan2(hz - cz, hx - cx);

        window.dispatchEvent(new CustomEvent('campussim:set-player-pose', {
          detail: { x: cx, z: cz, yaw, pitch: -0.04, y: -0.3 }
        }));
      })()
    `);
    await sleep(2500);
    await capture('03-sat-han.png');

    // 8. Ảnh 4: Sát Thầy Nam
    console.log('--- 4. ẢNH SÁT THẦY ---');
    await evaluate(`
      (async () => {
        const { toWorld } = await import('/src/scene/silver/frame.ts');
        const { useSilverStore } = await import('/src/store/useSilverStore.ts');
        const { getStage } = await import('/src/data/silver/stages.ts');

        // Chuyển thoại sang Thầy Nam
        const stage = getStage('CSE 103/lab-1');
        useSilverStore.setState({
          play: {
            item: stage,
            stepIndex: 0,
            stepCount: 5,
            step: {
              id: 's1',
              type: 'say',
              speaker: 'teacher',
              text: { vi: 'Thầy Nam: Chào các em đến với phòng máy 406.B8.', en: 'Teacher Nam: Welcome to lab 406.B8.' },
            },
            canContinue: true,
          },
        });

        window.__ensureViewMode(1); // FPS mode

        // Thầy ở lecture: u=90.4, v=-206.6 nhìn -u. Đặt camera phía trước cách 2.6 m (u=87.8, v=-206.6) ngang tầm ngực (y=-0.25 -> cao 1.35 m)
        const [cx, cz] = toWorld('b8', 87.8, -206.6);
        const [tx, tz] = toWorld('b8', 90.4, -206.6);
        const yaw = Math.atan2(tz - cz, tx - cx);

        window.dispatchEvent(new CustomEvent('campussim:set-player-pose', {
          detail: { x: cx, z: cz, yaw, pitch: -0.06, y: -0.25 }
        }));
      })()
    `);
    await sleep(2500);
    await capture('04-sat-thay.png');

    // 9. Ảnh 5: Toàn phòng từ trên cao / góc để thấy cả 12 bạn học nền + Han + Thầy
    console.log('--- 5. ẢNH TOÀN PHÒNG TỪ GÓC CAO ---');
    await evaluate(`
      (async () => {
        const { toWorld } = await import('/src/scene/silver/frame.ts');

        window.__ensureViewMode(1); // FPS mode

        // Đặt camera ở góc Tây-Bắc trên cao sát trần (u=82.5, v=-209.8, y=1.5 -> cao 3.1 m) nhìn chéo xuống
        const [cx, cz] = toWorld('b8', 82.5, -209.8);
        const [tx, tz] = toWorld('b8', 88.0, -204.5);
        const yaw = Math.atan2(tz - cz, tx - cx);

        window.dispatchEvent(new CustomEvent('campussim:set-player-pose', {
          detail: { x: cx, z: cz, yaw, pitch: -0.32, y: 1.5 }
        }));
      })()
    `);
    await sleep(2500);
    await capture('05-toan-phong-12-ban.png');

    // 10. Ảnh 6: Cận cảnh bàn, ghế, TV, kiểm tra chạm mặt ghế, không xuyên bàn, không z-fighting
    console.log('--- 6. ẢNH BÀN / GHẾ / TV CẬN CẢNH ---');
    await evaluate(`
      (async () => {
        const { toWorld } = await import('/src/scene/silver/frame.ts');

        window.__ensureViewMode(1); // FPS mode

        // Đứng tại lối đi cạnh hàng 2 nhìn ngang qua ghế 406-r2-s5 (chỗ người chơi) và r2-s6 (Han):
        // u=86.5, v=-205.3, nhìn ngang về v=-203.8 tầm ngang mặt bàn (y=-0.5 -> cao 1.1 m)
        const [cx, cz] = toWorld('b8', 86.5, -205.3);
        const [tx, tz] = toWorld('b8', 86.5, -203.8);
        const yaw = Math.atan2(tz - cz, tx - cx);

        window.dispatchEvent(new CustomEvent('campussim:set-player-pose', {
          detail: { x: cx, z: cz, yaw, pitch: -0.14, y: -0.5 }
        }));
      })()
    `);
    await sleep(2500);
    await capture('06-can-canh-ban-ghe-tv.png');

    // 11. Kiểm tra unmount khi đổi tầng và rời tòa nhà
    console.log('--- KIỂM TRA UNMOUNT KHI ĐỔI TẦNG VÀ RỜI TÒA ---');
    await evaluate(`
      (async () => {
        const { useWalkStore } = await import('/src/store/useWalkStore.ts');
        useWalkStore.getState().setInteriorFloor(3); // Đổi sang tầng 3
      })()
    `);
    await sleep(1500);
    const floor3Info = await evaluate(`
      (() => {
        const gl = window.__gl;
        const scene = window.__scene;
        let silverMeshCount = 0;
        if (scene) {
          scene.traverse((o) => {
            if (o.name && (o.name.includes('han') || o.name.includes('teacher') || o.name.includes('npc'))) {
              silverMeshCount++;
            }
          });
        }
        return {
          calls: gl ? gl.info.render.calls : 0,
          triangles: gl ? gl.info.render.triangles : 0,
          silverMeshCount,
        };
      })()
    `);
    console.log('Đổi sang tầng 3 - diễn viên Silver unmount hoàn toàn:', floor3Info);

    await evaluate(`
      (async () => {
        const { useWalkStore } = await import('/src/store/useWalkStore.ts');
        useWalkStore.getState().exitInterior(); // Rời tòa ra ngoài trời
      })()
    `);
    await sleep(1500);
    const outdoorInfo = await evaluate(`
      (() => {
        const gl = window.__gl;
        return {
          calls: gl ? gl.info.render.calls : 0,
          triangles: gl ? gl.info.render.triangles : 0,
        };
      })()
    `);
    console.log('Rời tòa nhà ra ngoài trời - unmount thành công:', outdoorInfo);

    console.log('\n=== TỔNG KẾT ĐO ĐẠC HIỆU NĂNG ===');
    console.log(JSON.stringify(measurements, null, 2));
    fs.writeFileSync(path.join(OUT_DIR, 'measurements.json'), JSON.stringify(measurements, null, 2));

  } finally {
    if (ws) ws.close();
    chromeProc.kill();
    viteProc.kill();
    console.log('Đã dọn dẹp và tắt tiến trình Chrome & Vite.');
  }
}

main().catch((err) => {
  console.error('Lỗi chụp ảnh:', err);
  process.exit(1);
});
