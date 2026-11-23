import http from 'http';

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
  const appTab = tabs.find((t) => t.url.includes(':5180'));
  if (!appTab) {
    console.error('Port 5180 tab not found');
    process.exit(1);
  }
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

  const evalRes = await send('Runtime.evaluate', {
    expression: `(async () => {
      const { getInteriorLayout } = await import('/src/scene/interior/layouts/index.ts');
      const b3 = getInteriorLayout('b3');
      const b8 = getInteriorLayout('b8');
      const b11 = getInteriorLayout('b11');
      return {
        b3: { stairStart: b3.toWorld(21, 20), stairTarget: b3.toWorld(27, 20) },
        b8: { mnStart: b8.toWorld(53, -196), mnTarget: b8.toWorld(53, -204) },
        b11: { nwStart: b11.toWorld(6.25, -149), nwTarget: b11.toWorld(6.25, -141) },
      };
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });

  console.log('Layout test result:', evalRes.result?.value);
  ws.close();
}

main().catch(console.error);
