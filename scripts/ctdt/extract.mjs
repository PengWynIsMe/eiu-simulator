import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const config = JSON.parse(await readFile(path.join(here, 'majors.config.json'), 'utf8'));
const args = process.argv.slice(2);
const dateAt = args.indexOf('--date');
const generatedAt = dateAt >= 0 ? args[dateAt + 1] : new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(generatedAt)) throw new Error('Dùng --date YYYY-MM-DD');

function clean(value) { return value.replace(/\s+/g, ' ').replace(/\s+([,.;:)])/g, '$1').replace(/([(])\s+/g, '$1').trim(); }
function studyYear(code) {
  const digits = code.match(/\d+/)?.[0];
  if (!digits) return 1;
  const lead = Number(digits[0]);
  return lead === 0 || lead === 1 ? 1 : lead === 2 ? 2 : lead === 3 ? 3 : 4;
}
function groupCourses(items, block, year, semester, source) {
  const result = [];
  for (const item of items) {
    const codeMatch = item.code.match(/^[A-Z]{2,5} \d{3}[A-Z]?$/) || item.code.match(/^[A-Z]{2,5}-[A-Z]?\d{3}$/) || item.code.match(/^[A-Z]{2,5}$/) || item.code === 'PED';
    if (!codeMatch || item.credits <= 0 || !item.vi || !item.en) continue;
    const course = { code: item.code, name: { vi: item.vi, en: item.en }, credits: item.credits, block };
    if (item.lt !== undefined) course.lt = item.lt;
    if (item.th !== undefined) course.th = item.th;
    if (year !== undefined) course.year = year;
    if (semester !== undefined) course.semester = semester;
    if (source) course.yearSource = source;
    result.push(course);
  }
  return result;
}

// Coordinate-aware line recovery: items within ~2pt are a row, then sorted left-to-right.
async function recoverLines(file) {
  const pdf = await getDocument({ url: path.join(root, 'references/ctdt', file), useSystemFonts: true }).promise;
  const pages = [];
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();
    const rows = new Map();
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const y = Math.round(item.transform[5] / 2) * 2;
      const row = rows.get(y) ?? [];
      row.push({ x: item.transform[4], text: item.str });
      rows.set(y, row);
    }
    pages.push([...rows].sort((a, b) => b[0] - a[0]).map(([, row]) => row.sort((a, b) => a.x - b.x).map(x => x.text).join(' ').replace(/\s+/g, ' ').trim()));
  }
  return pages;
}

for (const major of config) {
  const pages = await recoverLines(major.file);
  // Preserve the recovered source text for deterministic extraction diagnostics.
  const text = pages.flat().join('\n');
  const courses = [];
  const seen = new Set();
  const codeRe = /\b([A-Z]{2,5}[- ]?[A-Z]?\d{3}[A-Z]?)\b/g;
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const row = lines[i];
    const codes = [...row.matchAll(codeRe)];
    if (!codes.length) continue;
    const credit = row.match(/(\d+)\s*\(\s*(\d+)\s*[,|/]\s*(\d+)\s*\)/);
    if (!credit) continue;
    let code = clean(codes[0][1].replace(/([A-Z]{2,5})\s+([A-Z]?\d)/, '$1 $2'));
    if (/^[A-Z]{2,5}\d/.test(code)) code = code.replace(/^([A-Z]{2,5})(?=[0-9])/, '$1 ');
    if (seen.has(code)) continue;
    // Names sometimes occupy the preceding/following lines; keep bilingual evidence only.
    const window = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join(' ');
    const paren = window.match(/([^|\n]+?)\s*\(\s*([^()]+?)\s*\)/);
    if (!paren) continue;
    let vi = clean(paren[1]); let en = clean(paren[2]);
    if (major.id === 'qtkd' && /^[A-Z]/.test(vi) && /[À-ỹ]/.test(en)) [vi, en] = [en, vi];
    if (!/[À-ỹ]/.test(vi) || !/[A-Za-z]/.test(en)) continue;
    const item = { code, vi, en, credits: Number(credit[1]), lt: Number(credit[2]), th: Number(credit[3]) };
    const record = groupCourses([item], 'dai-cuong', major.kind === 'khung' ? studyYear(code) : undefined, undefined, major.kind === 'khung' ? 'ma-mon' : undefined)[0];
    if (record) { courses.push(record); seen.add(code); }
  }
  const years = [1, 2, 3, 4].map(year => ({ year, courses: courses.filter(course => course.year === year), electiveSlots: [] }));
  const curriculum = {
    majorId: major.id,
    programCode: major.programCode,
    totalCredits: null,
    yearsInferred: major.kind === 'khung',
    years,
    electiveGroups: [],
    specializations: major.specializations.map(spec => ({ id: spec.id, name: { vi: spec.vi, en: spec.en }, requiredCourses: [], electiveGroupIds: [] })),
    source: { file: major.file, kind: major.kind, year: major.year, pages: major.pages },
    generatedAt,
  };
  const out = path.join(root, 'src/data/majors', `${major.id}.curriculum.json`);
  await writeFile(out, `${JSON.stringify(curriculum, null, 2)}\n`);
  console.log(`${major.id}: recovered ${courses.length} bilingual course rows (review required)`);
}
