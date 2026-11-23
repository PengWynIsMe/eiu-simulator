import { createServer } from 'vite';
import { readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir = new URL('./tests/', import.meta.url);
const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom', optimizeDeps: { noDiscovery: true }, logLevel: 'error' });
let failed = 0;
try {
  for (const file of (await readdir(dir)).filter((f) => f.endsWith('.test.mjs')).sort()) {
    const tests = (await import(new URL(file, dir).href)).default;
    for (const [name, fn] of Object.entries(tests)) {
      try { await fn({ assert, load: (p) => server.ssrLoadModule(p) }); console.log(`ok   ${file} ${name}`); }
      catch (e) { failed++; console.error(`FAIL ${file} ${name}\n${e.stack}`); }
    }
  }
} finally { await server.close(); }
process.exitCode = failed ? 1 : 0;
