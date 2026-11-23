import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const config = JSON.parse(await readFile(path.join(root, 'scripts/ctdt/majors.config.json'), 'utf8'));
let failures = 0;
const sum = courses => courses.reduce((total, course) => total + course.credits, 0);
function electiveMinimum(group) {
  if (group.minCredits) return group.minCredits;
  if (group.minCourses && group.courses.length >= group.minCourses) {
    return group.courses.map(course => course.credits).sort((a,b)=>a-b).slice(0, group.minCourses).reduce((total, value) => total + value, 0);
  }
  return 0;
}

for (const major of config) {
  try {
    const data = JSON.parse(await readFile(path.join(root, `src/data/majors/${major.id}.curriculum.json`), 'utf8'));
    const yearCourses = data.years.flatMap(year => year.courses);
    const counts = [1,2,3,4].map(year => data.years.find(item => item.year === year)?.courses.length ?? 0);
    const graduation = sum(yearCourses.filter(course => course.block === 'tot-nghiep'));
    const commonRequired = sum(yearCourses.filter(course => course.block !== 'tot-nghiep'));
    const commonGroups = data.electiveGroups.filter(group => !group.specializationId);
    const commonElectives = commonGroups.reduce((total, group) => total + electiveMinimum(group), 0);
    const slotReferenceErrors = data.years.flatMap(year => year.electiveSlots).filter(slot => !data.electiveGroups.some(group => group.id === slot.groupId));
    const groupReferenceErrors = data.specializations.flatMap(spec => spec.electiveGroupIds).filter(id => !data.electiveGroups.some(group => group.id === id));
    const allCourses = yearCourses.concat(data.specializations.flatMap(spec => spec.requiredCourses), data.electiveGroups.flatMap(group => group.courses));
    const invalidCourses = allCourses.filter(course => !(course.credits > 0) || !course.name.vi || !course.name.en || !course.block);
    let majorFailed = false;
    if (data.majorId !== major.id || data.years.length !== 4 || data.years.some((item,index)=>item.year!==index+1)) throw new Error('years/majorId invalid');
    if (invalidCourses.length) throw new Error(`invalid course ${invalidCourses[0].code}`);
    if (slotReferenceErrors.length || groupReferenceErrors.length) throw new Error('elective group reference missing');
    for (const group of data.electiveGroups) {
      if (!group.minCredits && !group.minCourses) throw new Error(`elective group ${group.id} lacks a selection minimum`);
      if (!group.title.vi || !group.title.en) throw new Error(`elective group ${group.id} lacks bilingual title`);
    }

    console.log(`\n${major.id} — PDF total ${data.totalCredits ?? 'not stated'}`);
    console.log('Component                         Credits');
    console.log(`Common required in years          ${commonRequired}`);
    console.log(`Common elective minimum           ${commonElectives}`);
    console.log(`Graduation courses                ${graduation}`);
    console.log(`Courses in year plans             ${sum(yearCourses)}`);
    console.log(`Elective slots in year plans      ${data.years.reduce((total, year) => total + year.electiveSlots.reduce((subtotal, slot) => subtotal + slot.credits, 0), 0)} (reference only; not added twice)`);
    let expectedTotals = [];
    if (data.specializations.length) {
      for (const spec of data.specializations) {
        const specRequired = sum(spec.requiredCourses);
        const specGroups = data.electiveGroups.filter(group => group.specializationId === spec.id || spec.electiveGroupIds.includes(group.id));
        const specElectives = specGroups.reduce((total, group) => total + electiveMinimum(group), 0);
        const calculated = commonRequired + commonElectives + graduation + specRequired + specElectives;
        expectedTotals.push(calculated);
        console.log(`  ${spec.id}: required ${specRequired} + elective min ${specElectives} → total ${calculated}`);
      }
    } else {
      const calculated = commonRequired + commonElectives + graduation;
      expectedTotals.push(calculated);
      console.log(`Calculated total                   ${calculated}`);
    }
    console.log(`Year course counts                ${counts.join('/')}`);

    // Known source exceptions: BSE IV says 180 while the semester plan totals 183;
    // DTVT's short framework PDF has no overall credit total.
    const allowedTotals = major.id === 'ktpm' ? [180, 183] : major.id === 'qtkd' ? [191, 195] : [major.totalCredits];
    if (!allowedTotals.length) throw new Error('expected total missing');
    if (allowedTotals.length && expectedTotals.some(total => !allowedTotals.includes(total))) {
      majorFailed = true;
      console.error(`  mismatch by component: expected ${allowedTotals.join(' or ')}, got ${expectedTotals.join(', ')}`);
    }
    if (majorFailed) failures++;
  } catch (error) {
    failures++;
    console.error(`${major.id}: ${error.message}`);
  }
}
if (failures) process.exitCode = 1;
