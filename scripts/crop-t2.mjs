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

  const b64Before = fs.readFileSync(path.resolve('docs/tasks/FIX-NT-anh/before-24483be/b8-thang-giua-bac-t2.png')).toString('base64');
  const b64After = fs.readFileSync(path.resolve('docs/tasks/FIX-NT-anh/after-b90da88/b8-thang-giua-bac-t2.png')).toString('base64');

  const cropRes = await send('Runtime.evaluate', {
    expression: `(async () => {
      const loadImg = (b64) => new Promise((res) => {
        const img = new Image();
        img.onload = () => res(img);
        img.src = 'data:image/png;base64,' + b64;
      });
      const [img1, img2] = await Promise.all([loadImg('${b64Before}'), loadImg('${b64After}')]);
      
      const c1 = document.createElement('canvas');
      c1.width = 600; c1.height = 500;
      const ctx1 = c1.getContext('2d');
      ctx1.drawImage(img1, 550, 100, 600, 500, 0, 0, 600, 500);

      const c2 = document.createElement('canvas');
      c2.width = 600; c2.height = 500;
      const ctx2 = c2.getContext('2d');
      ctx2.drawImage(img2, 550, 100, 600, 500, 0, 0, 600, 500);

      return {
        crop1: c1.toDataURL('image/png'),
        crop2: c2.toDataURL('image/png')
      };
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });

  const res = cropRes.result?.value;
  fs.writeFileSync('docs/tasks/FIX-NT-anh/crop-t2-before.png', Buffer.from(res.crop1.replace(/^data:image\/png;base64,/, ''), 'base64'));
  fs.writeFileSync('docs/tasks/FIX-NT-anh/crop-t2-after.png', Buffer.from(res.crop2.replace(/^data:image\/png;base64,/, ''), 'base64'));
  console.log('Saved t2 crops!');
  ws.close();
}

main().catch(console.error);
