// Nạp + kiểm tra + ghép dữ liệu ngành: mỗi ngành 2 file trong ./majors/
//   <id>.json            → MajorProfile (viết tay)
//   <id>.curriculum.json → MajorCurriculum (sinh bằng script)
// Thêm ngành = thêm 2 file JSON, không sửa code.
import type {
  Course,
  CourseBlock,
  DayMoment,
  ElectiveGroup,
  ElectiveSlot,
  FacultyId,
  Highlight,
  Major,
  MajorCurriculum,
  MajorProfile,
  Specialization,
  StudyYear,
  YearPlan,
} from '../types';
import { arr, fail, loc, num, obj, oneOf, optStr, str } from './validate';

const FACULTIES: readonly FacultyId[] = ['cntt', 'ky-thuat', 'kinh-te'];
const BLOCKS: readonly CourseBlock[] = ['dai-cuong', 'co-so-nganh', 'nganh', 'chuyen-nganh', 'bo-tro', 'tot-nghiep'];
const YEAR_SOURCES = ['ke-hoach', 'ma-mon'] as const;

function optNum(v: unknown, path: string): number | undefined {
  return v === undefined ? undefined : num(v, path);
}

function studyYear(v: unknown, path: string): StudyYear {
  if (v !== 1 && v !== 2 && v !== 3 && v !== 4) fail(path, '1 | 2 | 3 | 4');
  return v;
}

function course(v: unknown, path: string): Course {
  const o = obj(v, path);
  const credits = num(o.credits, `${path}.credits`);
  if (credits <= 0) fail(`${path}.credits`, 'số > 0');
  const c: Course = {
    code: str(o.code, `${path}.code`),
    name: loc(o.name, `${path}.name`),
    credits,
    block: oneOf(o.block, BLOCKS, `${path}.block`),
  };
  const lt = optNum(o.lt, `${path}.lt`);
  const th = optNum(o.th, `${path}.th`);
  const semester = optNum(o.semester, `${path}.semester`);
  if (lt !== undefined) c.lt = lt;
  if (th !== undefined) c.th = th;
  if (o.year !== undefined) c.year = studyYear(o.year, `${path}.year`);
  if (semester !== undefined) c.semester = semester;
  if (o.yearSource !== undefined) c.yearSource = oneOf(o.yearSource, YEAR_SOURCES, `${path}.yearSource`);
  if (o.prerequisites !== undefined) {
    c.prerequisites = arr(o.prerequisites, `${path}.prerequisites`).map((p, i) => str(p, `${path}.prerequisites[${i}]`));
  }
  return c;
}

/** Mảng môn, không trùng `code` trong cùng một danh sách (điều kiện 7). */
function courseList(v: unknown, path: string): Course[] {
  const seen = new Set<string>();
  return arr(v, path).map((c, i) => {
    const co = course(c, `${path}[${i}]`);
    if (seen.has(co.code)) fail(`${path}[${i}].code`, `mã không trùng trong danh sách (đã có "${co.code}")`);
    seen.add(co.code);
    return co;
  });
}

function electiveGroup(v: unknown, path: string): ElectiveGroup {
  const o = obj(v, path);
  const g: ElectiveGroup = {
    id: str(o.id, `${path}.id`),
    title: loc(o.title, `${path}.title`),
    courses: courseList(o.courses, `${path}.courses`),
  };
  const minCredits = optNum(o.minCredits, `${path}.minCredits`);
  const minCourses = optNum(o.minCourses, `${path}.minCourses`);
  if (minCredits === undefined && minCourses === undefined) fail(path, 'minCredits hoặc minCourses');
  if (minCredits !== undefined) g.minCredits = minCredits;
  if (minCourses !== undefined) g.minCourses = minCourses;
  const spec = optStr(o.specializationId, `${path}.specializationId`);
  if (spec !== undefined) g.specializationId = spec;
  if (o.note !== undefined) g.note = loc(o.note, `${path}.note`);
  return g;
}

function slot(v: unknown, path: string): ElectiveSlot {
  const o = obj(v, path);
  const s: ElectiveSlot = { groupId: str(o.groupId, `${path}.groupId`), credits: num(o.credits, `${path}.credits`) };
  const semester = optNum(o.semester, `${path}.semester`);
  if (semester !== undefined) s.semester = semester;
  return s;
}

function curriculum(v: unknown, path: string, id: string): MajorCurriculum {
  const o = obj(v, path);
  if (str(o.majorId, `${path}.majorId`) !== id) fail(`${path}.majorId`, `"${id}" (bằng tên file)`);

  const years: YearPlan[] = arr(o.years, `${path}.years`).map((y, i) => {
    const yp = `${path}.years[${i}]`;
    const yo = obj(y, yp);
    const year = studyYear(yo.year, `${yp}.year`);
    if (year !== i + 1) fail(`${yp}.year`, String(i + 1));
    return {
      year,
      courses: courseList(yo.courses, `${yp}.courses`),
      electiveSlots: arr(yo.electiveSlots, `${yp}.electiveSlots`).map((s, j) => slot(s, `${yp}.electiveSlots[${j}]`)),
    };
  });
  if (years.length !== 4) fail(`${path}.years`, 'đúng 4 phần tử (năm 1–4)');

  const electiveGroups = arr(o.electiveGroups, `${path}.electiveGroups`).map((g, i) => electiveGroup(g, `${path}.electiveGroups[${i}]`));
  const groupIds = new Set<string>();
  electiveGroups.forEach((g, i) => {
    if (groupIds.has(g.id)) fail(`${path}.electiveGroups[${i}].id`, `id không trùng (đã có "${g.id}")`);
    groupIds.add(g.id);
  });

  const specializations: Specialization[] = arr(o.specializations, `${path}.specializations`).map((s, i) => {
    const sp = `${path}.specializations[${i}]`;
    const so = obj(s, sp);
    return {
      id: str(so.id, `${sp}.id`),
      name: loc(so.name, `${sp}.name`),
      requiredCourses: courseList(so.requiredCourses, `${sp}.requiredCourses`),
      electiveGroupIds: arr(so.electiveGroupIds, `${sp}.electiveGroupIds`).map((g, j) => str(g, `${sp}.electiveGroupIds[${j}]`)),
    };
  });
  const specIds = new Set<string>();
  specializations.forEach((s, i) => {
    if (specIds.has(s.id)) fail(`${path}.specializations[${i}].id`, `id không trùng (đã có "${s.id}")`);
    specIds.add(s.id);
  });

  // Điều kiện 4: tham chiếu chéo phải trỏ tới thứ có thật.
  years.forEach((y, i) =>
    y.electiveSlots.forEach((s, j) => {
      if (!groupIds.has(s.groupId)) fail(`${path}.years[${i}].electiveSlots[${j}].groupId`, `nhóm tự chọn có thật (không có "${s.groupId}")`);
    }),
  );
  specializations.forEach((s, i) =>
    s.electiveGroupIds.forEach((g, j) => {
      if (!groupIds.has(g)) fail(`${path}.specializations[${i}].electiveGroupIds[${j}]`, `nhóm tự chọn có thật (không có "${g}")`);
    }),
  );
  electiveGroups.forEach((g, i) => {
    if (g.specializationId !== undefined && !specIds.has(g.specializationId)) {
      fail(`${path}.electiveGroups[${i}].specializationId`, `chuyên ngành có thật (không có "${g.specializationId}")`);
    }
  });

  const so = obj(o.source, `${path}.source`);
  const source: MajorCurriculum['source'] = {
    file: str(so.file, `${path}.source.file`),
    kind: oneOf(so.kind, ['bm08', 'khung'] as const, `${path}.source.kind`),
    year: so.year === null ? null : num(so.year, `${path}.source.year`),
  };
  const pages = optStr(so.pages, `${path}.source.pages`);
  if (pages !== undefined) source.pages = pages;

  return {
    majorId: id,
    programCode: o.programCode === null ? null : str(o.programCode, `${path}.programCode`),
    totalCredits: o.totalCredits === null ? null : num(o.totalCredits, `${path}.totalCredits`),
    yearsInferred: typeof o.yearsInferred === 'boolean' ? o.yearsInferred : fail(`${path}.yearsInferred`, 'true | false'),
    years,
    electiveGroups,
    specializations,
    source,
    generatedAt: str(o.generatedAt, `${path}.generatedAt`),
  };
}

function profile(v: unknown, path: string, id: string): MajorProfile {
  const o = obj(v, path);
  if (str(o.id, `${path}.id`) !== id) fail(`${path}.id`, `"${id}" (bằng tên file)`);
  const highlights: Highlight[] = arr(o.highlights, `${path}.highlights`).map((h, i) => {
    const ho = obj(h, `${path}.highlights[${i}]`);
    return { code: str(ho.code, `${path}.highlights[${i}].code`), why: loc(ho.why, `${path}.highlights[${i}].why`) };
  });
  if (highlights.length < 3 || highlights.length > 5) fail(`${path}.highlights`, '3–5 phần tử');
  const dayInLife: DayMoment[] = arr(o.dayInLife, `${path}.dayInLife`).map((d, i) => {
    const dopath = `${path}.dayInLife[${i}]`;
    const dobj = obj(d, dopath);
    return { time: str(dobj.time, `${dopath}.time`), text: loc(dobj.text, `${dopath}.text`) };
  });
  return {
    id,
    facultyId: oneOf(o.facultyId, FACULTIES, `${path}.facultyId`),
    name: loc(o.name, `${path}.name`),
    degree: loc(o.degree, `${path}.degree`),
    summary: loc(o.summary, `${path}.summary`),
    highlights,
    skills: arr(o.skills, `${path}.skills`).map((s, i) => loc(s, `${path}.skills[${i}]`)),
    careers: arr(o.careers, `${path}.careers`).map((s, i) => loc(s, `${path}.careers[${i}]`)),
    dayInLife,
    contentBasis: oneOf(o.contentBasis, ['bm08', 'bang-mon'] as const, `${path}.contentBasis`),
    contentStatus: oneOf(o.contentStatus, ['chua-duyet', 'da-duyet'] as const, `${path}.contentStatus`),
    updatedAt: str(o.updatedAt, `${path}.updatedAt`),
  };
}

/** Mọi mã môn có trong curriculum (năm, chuyên ngành, nhóm tự chọn). */
function allCodes(c: MajorCurriculum): Set<string> {
  const codes = new Set<string>();
  c.years.forEach((y) => y.courses.forEach((x) => codes.add(x.code)));
  c.specializations.forEach((s) => s.requiredCourses.forEach((x) => codes.add(x.code)));
  c.electiveGroups.forEach((g) => g.courses.forEach((x) => codes.add(x.code)));
  return codes;
}

const files = import.meta.glob<unknown>('./majors/*.json', { eager: true, import: 'default' });

function load(): Major[] {
  const profiles = new Map<string, unknown>();
  const curricula = new Map<string, unknown>();
  for (const [key, raw] of Object.entries(files)) {
    const name = key.replace('./majors/', '').replace(/\.json$/, '');
    if (name.endsWith('.curriculum')) curricula.set(name.slice(0, -'.curriculum'.length), raw);
    else profiles.set(name, raw);
  }

  const ids = new Set([...profiles.keys(), ...curricula.keys()]);
  const result: Major[] = [];
  for (const id of ids) {
    const rawProfile = profiles.get(id);
    const rawCurriculum = curricula.get(id);
    if (rawProfile === undefined) fail(`majors/${id}.json`, 'file profile (thiếu)');
    if (rawCurriculum === undefined) fail(`majors/${id}.curriculum.json`, 'file curriculum (thiếu)');
    const p = profile(rawProfile, `majors/${id}`, id);
    const c = curriculum(rawCurriculum, `majors/${id}.curriculum`, id);
    const codes = allCodes(c);
    p.highlights.forEach((h, i) => {
      if (!codes.has(h.code)) fail(`majors/${id}.highlights[${i}].code`, `mã môn có trong curriculum (không có "${h.code}")`);
    });
    result.push({ ...p, curriculum: c });
  }

  const order = (f: FacultyId) => FACULTIES.indexOf(f);
  return result.sort((a, b) => order(a.facultyId) - order(b.facultyId) || a.name.vi.localeCompare(b.name.vi, 'vi'));
}

export const majors: Major[] = load();
