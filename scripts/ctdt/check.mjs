import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const config = JSON.parse(await readFile(path.join(root, 'scripts/ctdt/majors.config.json'), 'utf8'));
let errors = 0;
console.log('id    extracted / PDF total    Y1/Y2/Y3/Y4    groups    specializations');
for (const major of config) {
  try {
    const data = JSON.parse(await readFile(path.join(root, `src/data/majors/${major.id}.curriculum.json`), 'utf8'));
    const courses = data.years.flatMap(year => year.courses);
    const counts = [1,2,3,4].map(year => data.years.find(item => item.year === year)?.courses.length ?? 0);
    const extracted = courses.reduce((sum, course) => sum + course.credits, 0)
      + data.years.reduce((sum, year) => sum + year.electiveSlots.reduce((subtotal, slot) => subtotal + slot.credits, 0), 0)
      + data.electiveGroups.reduce((sum, group) => sum + (group.minCredits ?? 0), 0);
    console.log(`${major.id.padEnd(5)} ${String(extracted).padStart(4)} / ${String(data.totalCredits ?? '?').padEnd(5)} ${counts.join('/').padEnd(12)} ${String(data.electiveGroups.length).padEnd(9)} ${data.specializations.length}`);
    if (data.majorId !== major.id || data.years.length !== 4 || data.years.some((item,index)=>item.year!==index+1)) throw new Error('years/majorId invalid');
    for (const course of courses) {
      if (!(course.credits > 0) || !course.name.vi || !course.name.en) throw new Error(`invalid course ${course.code}`);
    }
    if (data.totalCredits === null && major.id !== 'dtvt') throw new Error('PDF total missing despite a stated total');
    if (data.electiveGroups.length === 0) throw new Error('no elective groups found');
    if (data.totalCredits !== null && extracted !== data.totalCredits) throw new Error(`credit mismatch: extracted ${extracted}, PDF ${data.totalCredits} (${extracted - data.totalCredits >= 0 ? '+' : ''}${extracted - data.totalCredits})`);
    for (const group of data.electiveGroups) {
      if (!group.minCredits && !group.minCourses) throw new Error(`elective group ${group.id} lacks a selection minimum`);
      if (!group.title.vi || !group.title.en) throw new Error(`elective group ${group.id} lacks bilingual title`);
    }
  } catch (error) { errors++; console.error(`${major.id}: ${error.message}`); }
}
if (errors) process.exitCode = 1;
