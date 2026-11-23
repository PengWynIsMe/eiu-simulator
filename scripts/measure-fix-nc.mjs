import { spawn } from 'child_process';
import http from 'http';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9223;

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

const chromeProc = spawn(CHROME, [
  '--headless',
  `--remote-debugging-port=${PORT}`,
  '--use-gl=angle',
  '--window-size=1280,720',
  'http://localhost:5182/?snow=0',
], { stdio: 'ignore' });

// Chờ Chrome sẵn sàng
await new Promise((r) => setTimeout(r, 2000));

try {
  const tabs = await getJson(`http://localhost:${PORT}/json/list`);
  const appTab = tabs.find((t) => t.url.includes(':5182'));
  if (!appTab) {
    console.error('Không tìm thấy tab 5182');
    process.exit(1);
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

  // Chờ scene render vài frame
  await new Promise((r) => setTimeout(r, 3000));

  const evalRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const gl = window.__gl;
        if (!gl) return { error: 'No __gl' };
        return {
          calls: gl.info.render.calls,
          triangles: gl.info.render.triangles,
          points: gl.info.render.points,
          lines: gl.info.render.lines,
          geometries: gl.info.memory.geometries,
          textures: gl.info.memory.textures,
        };
      })()
    `,
    returnByValue: true,
  });

  console.log('KẾT QUẢ ĐO GL INFO (TỔNG QUAN NGOẠI CẢNH):');
  console.log(JSON.stringify(evalRes.result?.value, null, 2));

  ws.close();
} catch (err) {
  console.error('Lỗi đo:', err);
} finally {
  chromeProc.kill();
}
