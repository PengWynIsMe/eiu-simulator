import http from 'http';
import fs from 'fs';
import path from 'path';

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  const tabs = await getJson('http://localhost:9222/json/list');
  const appTab = tabs.find((t) => t.type === 'page');
  const ws = new WebSocket(appTab.webSocketDebuggerUrl);
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

  const names = [
    'b8-thang-giua-bac-t1.png',
    'b8-thang-giua-bac-t2.png',
    'b8-thang-loi-dong-t1.png',
  ];

  const diffDir = path.resolve('docs/tasks/FIX-NT-anh/diff');
  fs.mkdirSync(diffDir, { recursive: true });

  for (const name of names) {
    const b64Before = fs.readFileSync(path.resolve('docs/tasks/FIX-NT-anh/before-24483be', name)).toString('base64');
    const b64After = fs.readFileSync(path.resolve('docs/tasks/FIX-NT-anh/after-b90da88', name)).toString('base64');

    const evalRes = await send('Runtime.evaluate', {
      expression: `(async () => {
        const loadImg = (b64) => new Promise((res) => {
          const img = new Image();
          img.onload = () => res(img);
          img.src = 'data:image/png;base64,' + b64;
        });
        const [img1, img2] = await Promise.all([loadImg('${b64Before}'), loadImg('${b64After}')]);
        const w = img1.width, h = img1.height;
        const c1 = document.createElement('canvas');
        c1.width = w; c1.height = h;
        const ctx1 = c1.getContext('2d');
        ctx1.drawImage(img1, 0, 0);
        const data1 = ctx1.getImageData(0, 0, w, h).data;

        const c2 = document.createElement('canvas');
        c2.width = w; c2.height = h;
        const ctx2 = c2.getContext('2d');
        ctx2.drawImage(img2, 0, 0);
        const data2 = ctx2.getImageData(0, 0, w, h).data;

        const out = ctx1.createImageData(w, h);
        let diffCount = 0;
        let sceneDiffCount = 0;
        for (let i = 0; i < data1.length; i += 4) {
          const y = Math.floor((i / 4) / w);
          // Bỏ qua TopBar (y < 60) và Hud dưới (y > 640)
          const isHud = y < 70 || y > 640;
          const dr = Math.abs(data1[i] - data2[i]);
          const dg = Math.abs(data1[i+1] - data2[i+1]);
          const db = Math.abs(data1[i+2] - data2[i+2]);
          const diff = dr + dg + db;
          if (diff > 15) {
            diffCount++;
            if (!isHud) sceneDiffCount++;
            out.data[i] = 255;
            out.data[i+1] = 0;
            out.data[i+2] = 0;
            out.data[i+3] = 255;
          } else {
            out.data[i] = data1[i];
            out.data[i+1] = data1[i+1];
            out.data[i+2] = data1[i+2];
            out.data[i+3] = 100;
          }
        }
        ctx1.putImageData(out, 0, 0);
        return {
          diffCount,
          sceneDiffCount,
          diffDataUrl: c1.toDataURL('image/png')
        };
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });

    const res = evalRes.result?.value;
    console.log(`${name}: scene diff pixels = ${res?.sceneDiffCount}`);
    if (res?.diffDataUrl) {
      const b64 = res.diffDataUrl.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(path.join(diffDir, name), Buffer.from(b64, 'base64'));
    }
  }

  ws.close();
}

main().catch(console.error);
