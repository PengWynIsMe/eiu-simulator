import http from 'http';
import fs from 'fs';
import path from 'path';

const OUT_DIR_BEFORE = path.resolve('docs/tasks/FIX-NT-anh/before-24483be');
const OUT_DIR_AFTER = path.resolve('docs/tasks/FIX-NT-anh/after-b90da88');

fs.mkdirSync(OUT_DIR_BEFORE, { recursive: true });
fs.mkdirSync(OUT_DIR_AFTER, { recursive: true });


function putJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: 'PUT' }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function capturePort(port, outDir) {
  console.log(`\n=== Chụp ảnh từ server cổng ${port} vào ${outDir} ===`);
  const targetUrl = `http://localhost:${port}/?snow=0`;
  const newTab = await putJson(`http://localhost:9222/json/new?${targetUrl}`);
  console.log('Opened tab:', newTab.id);

  const ws = new WebSocket(newTab.webSocketDebuggerUrl);
  await new Promise((res) => (ws.onopen = res));

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

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
    mobile: false,
  });

  async function evaluate(expr) {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  // Đợi app load
  console.log('Đợi app khởi tạo...');
  for (let i = 0; i < 20; i++) {
    const ready = await evaluate(`Boolean(window.__stores?.walk)`);
    if (ready) break;
    await sleep(500);
  }
  await sleep(1500);

  const SHOTS = [
    {
      name: 'b3-thang-t1.png',
      building: 'b3',
      floor: 1,
      fromU: 20.5,
      fromV: 20.0,
      lookU: 26.0,
      lookV: 20.0,
      pitch: 0.1,
    },
    {
      name: 'b3-thang-t2.png',
      building: 'b3',
      floor: 2,
      fromU: 32.0,
      fromV: 20.0,
      lookU: 27.0,
      lookV: 20.0,
      pitch: -0.1,
    },
    {
      name: 'b8-thang-giua-bac-t1.png',
      building: 'b8',
      floor: 1,
      fromU: 53.0,
      fromV: -196.5,
      lookU: 53.0,
      lookV: -203.0,
      pitch: 0.15,
    },
    {
      name: 'b8-thang-giua-bac-t2.png',
      building: 'b8',
      floor: 2,
      fromU: 50.8,
      fromV: -196.5,
      lookU: 50.8,
      lookV: -203.0,
      pitch: -0.15,
    },
    {
      name: 'b8-thang-loi-dong-t1.png',
      building: 'b8',
      floor: 1,
      fromU: 117.5,
      fromV: -186.175,
      lookU: 111.0,
      lookV: -186.175,
      pitch: 0.1,
    },
    {
      name: 'b11-thang-tay-bac-t1.png',
      building: 'b11',
      floor: 1,
      fromU: 6.25,
      fromV: -148.5,
      lookU: 6.25,
      lookV: -141.65,
      pitch: 0.15,
    },
    {
      name: 'b11-thang-tay-bac-t2.png',
      building: 'b11',
      floor: 2,
      fromU: 3.95,
      fromV: -148.5,
      lookU: 3.95,
      lookV: -142.0,
      pitch: -0.15,
    },
  ];

  for (const shot of SHOTS) {
    console.log(`Chụp ${shot.name} (${shot.building} F${shot.floor})...`);
    await evaluate(`(async () => {
      const { getInteriorLayout } = await import('/src/scene/interior/layouts/index.ts');
      const layout = getInteriorLayout('${shot.building}');
      window.__stores.walk.setState({
        walkMode: true,
        interior: { buildingId: '${shot.building}', floor: ${shot.floor} },
        moveInput: { x: 0, y: 0 }
      });
      const [fromX, fromZ] = layout.toWorld(${shot.fromU}, ${shot.fromV});
      const [lookX, lookZ] = layout.toWorld(${shot.lookU}, ${shot.lookV});
      const yaw = Math.atan2(lookZ - fromZ, lookX - fromX);

      window.dispatchEvent(new CustomEvent('campussim:set-player-pose', {
        detail: {
          x: fromX,
          z: fromZ,
          y: 0.0,
          yaw: yaw,
          pitch: ${shot.pitch}
        }
      }));
    })()`);

    await sleep(800);

    const scr = await send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(scr.data, 'base64');
    const outPath = path.join(outDir, shot.name);
    fs.writeFileSync(outPath, buf);
    console.log(`  -> Đã lưu: ${outPath} (${(buf.length / 1024).toFixed(1)} KB)`);
  }

  ws.close();
  await putJson(`http://localhost:9222/json/close/${newTab.id}`).catch(() => {});
}

async function main() {
  await capturePort(5178, OUT_DIR_BEFORE);
  await capturePort(5180, OUT_DIR_AFTER);
  console.log('\nChụp ảnh so sánh hoàn tất!');
}

main().catch(console.error);
