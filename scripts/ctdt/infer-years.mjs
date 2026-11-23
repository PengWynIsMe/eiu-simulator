// Gán lại `year` cho 3 ngành khung ngắn (qtkd, cokhi, dtvt) — chạy SAU extract.mjs, idempotent.
// Quy tắc (PLAN-NGANH-SONG-NGU mục 5.1): số đầu của mã môn: 1xx→1, 2xx→2, 3xx→3, 4xx→4, 0xx→1, ≥5xx→4, không có số → 1.
// Tinh chỉnh duy nhất: môn đại cương có cùng mã trong kế hoạch học của 5 ngành BM08 (ktpm, mmt, tdh, dien, cdt)
// thì lấy năm trung vị ở đó (vd POLS 132/136, MATH 122 là năm 2) để năm 1 không dồn quá nhiều môn.
// Mọi năm vẫn ghi yearSource = 'ma-mon' và yearsInferred = true (UI hiện ghi chú "suy từ mã môn").
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dir = path.join(root, 'src/data/majors');
const TARGETS = ['qtkd', 'cokhi', 'dtvt'];
const REFERENCES = ['ktpm', 'mmt', 'tdh', 'dien', 'cdt'];

const read = async id => JSON.parse(await readFile(path.join(dir, `${id}.curriculum.json`), 'utf8'));

function yearFromCode(code) {
  const m = /(\d+)/.exec(code);
  if (!m) return 1;
  const n = Number.parseInt(m[1], 10);
  if (n >= 500) return 4;
  const lead = Math.floor(n / 100);
  return Math.min(4, Math.max(1, lead === 0 ? 1 : lead));
}

const refYears = new Map();
for (const id of REFERENCES) {
  const data = await read(id);
  for (const plan of data.years) for (const c of plan.courses) {
    if (!refYears.has(c.code)) refYears.set(c.code, []);
    refYears.get(c.code).push(plan.year);
  }
}
const median = list => [...list].sort((a, b) => a - b)[Math.floor((list.length - 1) / 2)];

function yearFor(course) {
  const ref = refYears.get(course.code);
  if (course.block === 'dai-cuong' && ref?.length) return median(ref);
  return yearFromCode(course.code);
}

for (const id of TARGETS) {
  const data = await read(id);
  const all = data.years.flatMap(p => p.courses);
  const tag = c => { c.year = yearFor(c); c.yearSource = 'ma-mon'; };
  all.forEach(tag);
  for (const plan of data.years) plan.courses = [];
  for (const c of all) data.years.find(p => p.year === c.year).courses.push(c);
  data.specializations.forEach(s => s.requiredCourses.forEach(tag));
  data.electiveGroups.forEach(g => g.courses.forEach(tag));
  data.yearsInferred = true;
  await writeFile(path.join(dir, `${id}.curriculum.json`), `${JSON.stringify(data, null, 2)}\n`);
  console.log(id, data.years.map(p => p.courses.length).join('/'));
}
