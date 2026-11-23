import http from 'http';


function putJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: 'PUT' }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function testWalkStairs(port) {
  console.log(`\n================ Testing port ${port} ================`);
  const targetUrl = `http://localhost:${port}/?snow=0`;
  const tab = await putJson(`http://localhost:9222/json/new?${targetUrl}`);

  const ws = new WebSocket(tab.webSocketDebuggerUrl);
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

  async function evaluate(expr) {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  for (let i = 0; i < 20; i++) {
    const ready = await evaluate(`Boolean(window.__stores?.walk)`);
    if (ready) break;
    await sleep(500);
  }
  await sleep(1000);

  // 1. Test B8 stair climbing (mn stair)
  console.log('--- Test B8 Mn Stair Climbing ---');
  await evaluate(`(async () => {
    const { getInteriorLayout } = await import('/src/scene/interior/layouts/index.ts');
    const b8 = getInteriorLayout('b8');
    window.__stores.walk.setState({
      walkMode: true,
      interior: { buildingId: 'b8', floor: 1 },
      moveInput: { x: 0, y: 0 }
    });
    const [p1x, p1z] = b8.toWorld(53.0, -199.5);
    const [p2x, p2z] = b8.toWorld(53.0, -204.0);
    const yaw = Math.atan2(p2z - p1z, p2x - p1x);
    window.dispatchEvent(new CustomEvent('campussim:set-player-pose', {
      detail: { x: p1x, z: p1z, y: 0.0, yaw, pitch: 0 }
    }));
  })()`);
  await sleep(500);

  // Walk forward into stair
  await evaluate(`window.__stores.walk.setState({ moveInput: { x: 0, y: 1 } })`);
  for (let step = 0; step < 12; step++) {
    await sleep(250);
    const status = await evaluate(`(async () => {
      const { getInteriorLayout } = await import('/src/scene/interior/layouts/index.ts');
      const b8 = getInteriorLayout('b8');
      const cur = window.__stores.walk.getState().interior;
      const playerPos = window.__stores.walk.getState().playerPos;
      const posLocal = b8.toLocal(playerPos.x, playerPos.z);
      return { floor: cur.floor, y: playerPos.y, u: posLocal[0].toFixed(2), v: posLocal[1].toFixed(2) };
    })()`);
    console.log(`Step ${step}: floor=${status.floor}, y=${status.y?.toFixed(2)}, u=${status.u}, v=${status.v}`);
  }

  // Stop moving
  await evaluate(`window.__stores.walk.setState({ moveInput: { x: 0, y: 0 } })`);

  ws.close();
  await putJson(`http://localhost:9222/json/close/${tab.id}`).catch(() => {});
}

async function main() {
  await testWalkStairs(5178);
  await testWalkStairs(5180);
}

main().catch(console.error);
