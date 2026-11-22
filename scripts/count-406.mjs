// Đếm đồ phòng 406.B11 + ước tính draw call + kiểm tra khe lối đi. Chạy: node scripts/count-406.mjs
// Bó classroom406Plan.ts + classrooms.json bằng esbuild (đi kèm vite), chạy trong Node, không cần trình duyệt.
import { build } from 'esbuild';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const out = join(mkdtempSync(join(tmpdir(), 'count406-')), 'run.mjs');

await build({
  stdin: {
    contents: `
      import { buildClassroom406Plan, countDrawCalls } from './src/scene/lesson/classroom406Plan.ts';
      import data from './src/data/classrooms.json';
      const room = data.classrooms.find((c) => c.code === '406.B11');
      const plan = buildClassroom406Plan(room);
      const rows = new Set(room.seats.map((s) => s.deskU));
      const perRow = [...rows].map((u) => room.seats.filter((s) => s.deskU === u).length);
      console.log(JSON.stringify({
        ban: plan.desks.length, ghe: plan.chairs.length, manHinh: plan.monitors.length, matSang: plan.faces.length,
        banPhimChuot: plan.keyboards.length, case: plan.cases.length, denTam: plan.lights.length,
        miscHop: plan.misc.length, dayBan: rows.size, soGheMoiDay: perRow,
        playerSeatBrightFaces: plan.faceBrightness.filter((b) => b === 1).length,
        drawCallUocTinh: countDrawCalls(plan),
      }, null, 2));
    `,
    resolveDir: root,
    sourcefile: 'entry.ts',
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: out,
  logLevel: 'error',
});

await import(pathToFileURL(out).href);
