import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const config = JSON.parse(await readFile(path.join(here, 'majors.config.json'), 'utf8'));
const overrides = JSON.parse(await readFile(path.join(here, 'overrides.json'), 'utf8'));
const args = process.argv.slice(2);
const dateIndex = args.indexOf('--date');
const generatedAt = dateIndex < 0 ? new Date().toISOString().slice(0, 10) : args[dateIndex + 1];
if (!/^\d{4}-\d{2}-\d{2}$/.test(generatedAt ?? '')) throw new Error('Dùng --date YYYY-MM-DD');
const codePattern = /\b[A-Z]{2,5}(?:\s+\d{3}[A-Z]?|-[A-Z]?\d{3})\b|\bPED\b/g;
const creditPattern = /\b(\d+)\s*\(\s*(\d+)\s*[,|/]\s*(\d+)\s*\)/;
const diacritics = /[À-ỹ]/;
const tidy = value => value.replace(/\s+/g, ' ').replace(/\s+([,.;:)])/g, '$1').replace(/\(\s+/g, '(').trim();
const slug = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 36) || 'tu-chon';
const pad = n => String(n).padStart(2, '0');
async function pageText(major, pageNo) {
  return readFile(path.join(root, 'references/ctdt/text', major.id, `p${pad(pageNo)}.txt`), 'utf8');
}
async function pageList(major, first, last) {
  const out = [];
  for (let n = first; n <= last; n++) out.push({ page: n, lines: (await pageText(major, n)).split(/\r?\n/).map(tidy).filter(Boolean) });
  return out;
}
function classifyPair(lines) {
  const vi = []; const en = [];
  for (const raw of lines) {
    const line = tidy(raw.replace(/\b\d+\s*\(\s*\d+\s*[,|/]\s*\d+\s*\).*/, '')
      .replace(/\b[A-Z]{2,5}(?:\s+\d{3}[A-Z]?|-[A-Z]?\d{3})\b/g, '').replace(/^\d+\s+/, ''));
    if (!line || /^(?:\d+|\d+\.\d+|Bắt buộc|Tự chọn|Tổng|HK|Mã MH|Số tín chỉ)$/i.test(line)) continue;
    if (diacritics.test(line)) vi.push(line.replace(/[|]/g, ' ')); else if (/[A-Za-z]/.test(line)) en.push(line.replace(/[|]/g, ' '));
  }
  return { vi: tidy(vi.join(' ')), en: tidy(en.join(' ')) };
}
function normalizeCode(code) {
  const value = tidy(code).replace(/\s+/g, ' ');
  return value.replace(/^([A-Z]{2,5})\s*[- ]\s*([A-Z]?\d{3}[A-Z]?)$/, (whole, prefix, suffix) => suffix.startsWith('-') ? `${prefix}-${suffix.slice(1)}` : `${prefix} ${suffix}`);
}
function courseRecord(code, lines, block, year, semester, yearSource) {
  const joined = lines.join(' ');
  const credit = joined.match(creditPattern);
  if (!credit) return undefined;
  const codeAt = joined.lastIndexOf(code);
  const coursePart = joined.slice(codeAt >= 0 ? codeAt + code.length : 0, credit.index);
  const parens = [...coursePart.matchAll(/\(([^()]*)\)/g)];
  const viParen = [...parens].reverse().find(match => diacritics.test(match[1]));
  let pair;
  if (viParen) pair = { vi: tidy(viParen[1]), en: tidy(coursePart.slice(0, viParen.index)) };
  else {
    const enParen = [...parens].reverse().find(match => !diacritics.test(match[1]) && diacritics.test(coursePart.slice(0, match.index)));
    if (enParen) pair = { vi: tidy(coursePart.slice(0, enParen.index)), en: tidy(enParen[1]) };
    else pair = classifyPair(lines);
  }
  pair.en = pair.en.replace(/^(?:\d+\s+)?[A-Z]{2,5}(?:\s+\d{3}[A-Z]?|-[A-Z]?\d{3})\s*/, '').replace(/^\d+\s+/, '').trim();
  if (!pair.vi || !pair.en) return undefined;
  const normalized = normalizeCode(code);
  const course = { code: normalized, name: pair, credits: Number(credit[1]), block };
  if (Number(credit[2]) + Number(credit[3]) === Number(credit[1])) { course.lt = Number(credit[2]); course.th = Number(credit[3]); }
  if (year) course.year = year;
  if (semester) course.semester = semester;
  if (yearSource) course.yearSource = yearSource;
  return course;
}
function inferredYear(code) {
  const digits = code.match(/\d+/)?.[0];
  const lead = digits ? Number(digits[0]) : 0;
  return lead <= 1 ? 1 : lead === 2 ? 2 : lead === 3 ? 3 : 4;
}
const blocks = [
  [/đại cương/i, 'dai-cuong'], [/cơ sở ngành/i, 'co-so-nganh'], [/kiến thức ngành/i, 'nganh'],
  [/chuyên ngành/i, 'chuyen-nganh'], [/bổ trợ/i, 'bo-tro'], [/tốt nghiệp|khóa luận/i, 'tot-nghiep'],
];
function detectBlock(text, current = 'dai-cuong') { return blocks.find(([pattern]) => pattern.test(text))?.[1] ?? current; }

async function parseKhung(major, configRow) {
  const nPages = Number(configRow.pages.match(/1[–-](\d+)/)?.[1] ?? 1);
  const pages = await pageList(major, 1, nPages);
  const flat = pages.flatMap(({ page, lines }) => lines.map(line => ({ page, line })));
  let block = 'dai-cuong';
  const courses = []; const seen = new Set(); const groups = [];
  let activeGroup;
  let sectionText = '';
  for (let i = 0; i < flat.length; i++) {
    const { line } = flat[i];
    if (/^\d+(?:\.\d+)+\.?\s/.test(line)) {
      activeGroup = undefined;
      block = detectBlock(line, block);
      if (/tự chọn/i.test(line)) {
        sectionText = line.replace(/^\d+(?:\.\d+)*\.?\s*/, '').replace(/\s+\d+\s*$/, '').trim();
        const nearby = [line, ...flat.slice(i + 1, i + 3).map(item => item.line)].join(' ');
        const minCredits = Number(nearby.match(/tối thiểu\s+(\d+)\s*tín\s*chỉ/i)?.[1]);
        const minCourses = Number(nearby.match(/tối thiểu\s+(\d+)\s*môn/i)?.[1]);
        const id = slug(sectionText);
        if ((minCredits || minCourses) && !groups.some(group => group.id === id)) groups.push({ id, title: { vi: sectionText, en: sectionText }, ...(minCredits ? { minCredits } : {}), ...(minCourses ? { minCourses } : {}), courses: [] });
        activeGroup = groups.find(group => group.id === id);
      }
      continue;
    }
    const codes = [...line.matchAll(codePattern)];
    if (codes.length !== 1) continue;
    const code = codes[0][0];
    if (seen.has(code)) continue;
    const near = [line];
    for (let j = i + 1; j < Math.min(flat.length, i + 5); j++) {
      if (/^\d+(?:\.\d+)+\.?\s/.test(flat[j].line) || [...flat[j].line.matchAll(codePattern)].length) break;
      near.push(flat[j].line);
      if (creditPattern.test(near.join(' '))) break;
    }
    const rec = courseRecord(code, near, block, inferredYear(code), undefined, 'ma-mon');
    if (rec) { (activeGroup ?? { courses }).courses.push(rec); seen.add(code); }
  }
  return { courses, groups };
}

async function parseBm08(major, configRow) {
  const required = []; const groups = []; const slots = [1,2,3,4].map(year => ({ year, courses: [], electiveSlots: [] }));
  const seen = new Set();
  for (const pageNo of configRow.planPages) {
    const { lines } = (await pageList(major, pageNo, pageNo))[0];
    let semester = 0; let year = 1; let requiredMode = false; let activeGroup;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const hk = line.match(/^([1-4])\.([1-4])(?:\s|$)/);
      if (hk) { year = Number(hk[1]); semester = Number(hk[2]); requiredMode = !/tự chọn/i.test(line.slice(hk[0].length)); activeGroup = undefined; continue; }
      if (/^Bắt buộc/i.test(line)) { requiredMode = true; activeGroup = undefined; continue; }
      const elective = line.match(/^Tự chọn.*?(?:Tối thiểu\s*)?(\d+)\s*(tín chỉ|môn)/i);
      if (elective) {
        requiredMode = false;
        const titleVi = tidy(lines.slice(i + 1, i + 4).find(value => diacritics.test(value)) ?? 'Tự chọn');
        const titleEn = tidy(lines.slice(i + 1, i + 5).find(value => !diacritics.test(value) && /[A-Za-z]/.test(value)) ?? titleVi);
        const id = slug(titleVi);
        activeGroup = groups.find(item => item.id === id);
        if (!activeGroup) { activeGroup = { id, title: { vi: titleVi, en: titleEn }, ...(elective[2] === 'môn' ? { minCourses: Number(elective[1]) } : { minCredits: Number(elective[1]) }), courses: [] }; groups.push(activeGroup); }
        const slot = { groupId: id, credits: activeGroup.minCredits ?? 0, semester };
        if (!slots[year - 1].electiveSlots.some(item => item.groupId === id && item.semester === semester)) slots[year - 1].electiveSlots.push(slot);
        continue;
      }
      let match = line.match(/^(?:\d+\s+)?([A-Z]{2,5}(?:\s+\d{3}[A-Z]?|-[A-Z]?\d{3})|PED)\b(.*)$/);
      let codeText = match?.[1];
      let firstContent = match?.[2] ?? '';
      if (!match) {
        const prefix = line.match(/^(?:\d+\s+)?([A-Z]{2,5})$/);
        const suffix = lines[i + 1]?.match(/^(\d{3}[A-Z]?)$/);
        if (!prefix || !suffix) continue;
        codeText = `${prefix[1]} ${suffix[1]}`;
        i++;
      }
      if (!codeText) continue;
      const code = normalizeCode(codeText);
      const collected = [firstContent];
      let end = i + 1;
      while (end < lines.length && !creditPattern.test(collected.join(' ')) && !/^([1-4])\.[1-4]$/.test(lines[end]) && !/^(?:Bắt buộc|Tự chọn)/i.test(lines[end]) && !/^(?:\d+\s+)?[A-Z]{2,5}(?:\s+\d{3}[A-Z]?|-[A-Z]?\d{3})\b/.test(lines[end])) collected.push(lines[end++]);
      i = end - 1;
      if (seen.has(code)) continue;
      const item = courseRecord(code, collected, 'nganh', year, semester, 'ke-hoach');
      if (!item) continue;
      seen.add(code);
      if (requiredMode) slots[year - 1].courses.push(item);
      else if (activeGroup) activeGroup.courses.push(item);
    }
  }
  return { years: slots, groups, required };
}

function applyManualOverrides(majorId, parsed) {
  const patch = overrides[majorId] ?? {};
  const dropped = new Set(patch.drop ?? []);
  const patchCourse = course => {
    const correction = { ...(patch.courses?.[course.code] ?? {}) };
    delete correction.why;
    return { ...course, ...correction };
  };
  parsed.courses = (parsed.courses ?? []).filter(course => !dropped.has(course.code)).map(patchCourse);
  parsed.years = (parsed.years ?? []).map(plan => ({ ...plan, courses: plan.courses.filter(course => !dropped.has(course.code)).map(patchCourse) }));
  parsed.groups = (parsed.groups ?? []).map(group => ({ ...group, courses: (group.courses ?? []).filter(course => !dropped.has(course.code)).map(patchCourse) }));
  for (const course of patch.add ?? []) {
    const item = { block: 'nganh', yearSource: 'ma-mon', ...course };
    const group = parsed.groups.find(candidate => candidate.id === course.groupId);
    if (group) group.courses.push(item);
    else if (course.year && parsed.years.length) parsed.years[course.year - 1].courses.push(item);
    else parsed.courses.push(item);
  }
  return parsed;
}

for (const major of config) {
  const parsed = applyManualOverrides(major.id, major.kind === 'bm08' ? await parseBm08(major, major) : await parseKhung(major, major));
  const years = major.kind === 'bm08' ? parsed.years : [1,2,3,4].map(year => ({ year, courses: parsed.courses.filter(course => course.year === year), electiveSlots: [] }));
  let electiveGroups = parsed.groups;
  for (const spec of major.specializations) {
    const group = (overrides[major.id]?.groups ?? []).find(item => item.specializationId === spec.id);
    if (group && !electiveGroups.some(item => item.id === group.id)) electiveGroups.push(group);
  }
  if (!electiveGroups.length) {
    const fallback = overrides[major.id]?.groups ?? [];
    electiveGroups = fallback.map(group => ({ ...group, courses: group.courses ?? [] }));
  }
  const curriculum = {
    majorId: major.id,
    programCode: major.programCode,
    totalCredits: major.totalCredits,
    yearsInferred: major.kind === 'khung',
    years,
    electiveGroups,
    specializations: major.specializations.map(spec => ({ id: spec.id, name: { vi: spec.vi, en: spec.en }, requiredCourses: [], electiveGroupIds: electiveGroups.filter(group => group.specializationId === spec.id).map(group => group.id) })),
    source: { file: major.file, kind: major.kind, year: major.year, pages: major.pages },
    generatedAt,
  };
  const out = path.join(root, 'src/data/majors', `${major.id}.curriculum.json`);
  await writeFile(out, `${JSON.stringify(curriculum, null, 2)}\n`);
  const total = years.reduce((sum, plan) => sum + plan.courses.reduce((value, course) => value + course.credits, 0) + plan.electiveSlots.reduce((value, slot) => value + slot.credits, 0), 0);
  console.log(`${major.id}: ${years.reduce((sum, plan) => sum + plan.courses.length, 0)} plan courses; ${electiveGroups.length} elective groups; ${total}/${major.totalCredits ?? 'unknown'} credits`);
}
