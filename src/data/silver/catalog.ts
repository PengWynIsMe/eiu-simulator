import raw from './courses.ktpm.json';
import type { SilverCatalog, SilverCourse, SilverElectiveGroup } from '../../types/silver';
import { arr, fail, loc, num, obj, oneOf, str } from '../validate';

export function parseCatalog(v: unknown): SilverCatalog {
  const root = obj(v, 'catalog');
  const courses = arr(root.courses, 'catalog.courses').map((value, i): SilverCourse => {
    const p = `catalog.courses[${i}]`; const c = obj(value, p); const prereq = obj(c.prereq, `${p}.prereq`); const pdf = obj(c.pdf, `${p}.pdf`);
    const list = (x: unknown, path: string) => arr(x, path).map((y, j) => str(y, `${path}[${j}]`));
    const mode = oneOf(prereq.mode, ['none', 'all', 'unclear', 'unresolved'] as const, `${p}.prereq.mode`);
    const course: SilverCourse = { code: str(c.code, `${p}.code`), name: loc(c.name, `${p}.name`), credits: num(c.credits, `${p}.credits`), lt: num(c.lt, `${p}.lt`), th: num(c.th, `${p}.th`), kind: oneOf(c.kind, ['required', 'elective'] as const, `${p}.kind`), block: oneOf(c.block, ['dai-cuong', 'co-so-nganh', 'nganh', 'tot-nghiep'] as const, `${p}.block`), pdfTerm: c.pdfTerm === null ? null : str(c.pdfTerm, `${p}.pdfTerm`), aliases: list(c.aliases, `${p}.aliases`), prereq: { mode, codes: list(prereq.codes, `${p}.prereq.codes`), raw: typeof prereq.raw === 'string' ? prereq.raw : '' }, prestudy: list(c.prestudy, `${p}.prestudy`), coreq: list(c.coreq, `${p}.coreq`), english: c.english === null ? null : str(c.english, `${p}.english`), opens: list(c.opens, `${p}.opens`), pdf: { table: pdf.table === null ? null : num(pdf.table, `${p}.pdf.table`), desc: num(pdf.desc, `${p}.pdf.desc`) } };
    if (c.group !== undefined) course.group = str(c.group, `${p}.group`);
    if (c.ltThUnclear === true) course.ltThUnclear = true;
    if (course.lt + course.th !== course.credits) fail(p, 'LT + TH = tín chỉ'); return course;
  });
  const groups = arr(root.groups, 'catalog.groups').map((v, i): SilverElectiveGroup => { const p = `catalog.groups[${i}]`; const g = obj(v, p); return { id: str(g.id, `${p}.id`), title: loc(g.title, `${p}.title`), minCredits: num(g.minCredits, `${p}.minCredits`), pdfSlots: arr(g.pdfSlots, `${p}.pdfSlots`).map((x,j)=>str(x,`${p}.pdfSlots[${j}]`)), courses: arr(g.courses, `${p}.courses`).map((x,j)=>str(x,`${p}.courses[${j}]`)) }; });
  const catalog: SilverCatalog = { version: 1, majorId: str(root.majorId, 'catalog.majorId'), source: str(root.source, 'catalog.source'), courses, groups, specializationRule: { minCredits: num(obj(root.specializationRule, 'catalog.specializationRule').minCredits, 'catalog.specializationRule.minCredits'), completeOneOf: arr(obj(root.specializationRule, 'catalog.specializationRule').completeOneOf, 'catalog.specializationRule.completeOneOf').map((x,i)=>str(x,`catalog.specializationRule.completeOneOf[${i}]`)) } };
  const ids = new Map<string, SilverCourse>(); for (const c of courses) for (const id of [c.code, ...c.aliases]) { if (ids.has(id)) fail('catalog.courses', `mã trùng ${id}`); ids.set(id,c); }
  for (const c of courses) { if ((c.prereq.mode === 'none') !== (c.prereq.codes.length === 0) && c.prereq.mode !== 'unclear') fail(c.code, 'prerequisite hợp lệ'); if(c.prereq.mode !== 'unresolved') for(const code of c.prereq.codes) if(!ids.has(code)) fail(c.code, `mã tiên quyết ${code} tồn tại`); }
  return catalog;
}
export const catalog = parseCatalog(raw);
export function getCourse(codeOrAlias: string): SilverCourse | undefined { return catalog.courses.find(c => c.code === codeOrAlias || c.aliases.includes(codeOrAlias)); }
export function getGroup(id: string): SilverElectiveGroup | undefined { return catalog.groups.find(g => g.id === id); }
