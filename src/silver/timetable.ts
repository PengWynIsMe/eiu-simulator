import type { Meeting, SessionKind, SilverCourse } from '../types/silver';

export interface TimetableCourse {
  code: string;
  core: boolean;
  lab: 'lab' | 'project' | null;
  theory: 0 | 2;
}

export function toTimetableCourse(course: SilverCourse, core: boolean): TimetableCourse {
  if (course.lt === 0) {
    return { code: course.code, core, lab: 'project', theory: 0 };
  }
  return { code: course.code, core, lab: course.th > 0 ? 'lab' : null, theory: 2 };
}

export function buildTimetable(courses: TimetableCourse[]): Meeting[] {
  if (courses.filter(course => course.lab !== null).length > 6) {
    throw new Error('Không còn ca trống cho lab/project');
  }
  const ordered = courses
    .map((course, index) => ({ course, index }))
    .sort((a, b) => Number(b.course.core) - Number(a.course.core) || a.index - b.index)
    .map(({ course }) => course);
  const grid: (string | null)[][] = Array.from({ length: 6 }, () => Array(4).fill(null) as (string | null)[]);
  const meetings: Meeting[] = [];
  const days = [0, 2, 4, 1, 3, 5];

  const reserve = (course: TimetableCourse, day: number, slot: number, kind: SessionKind, length: 1 | 2): void => {
    for (let offset = 0; offset < length; offset += 1) {
      const row = grid[day];
      if (row) row[slot + offset] = course.code;
    }
    meetings.push({ code: course.code, kind, day: day as Meeting['day'], slot: slot as Meeting['slot'], length });
  };

  for (const course of ordered.filter(item => item.lab !== null)) {
    let placed = false;
    for (const slot of [0, 2]) {
      for (const day of days) {
        const row = grid[day];
        if (!placed && row?.[slot] === null && row[slot + 1] === null) {
          reserve(course, day, slot, course.lab ?? 'lab', 2);
          placed = true;
        }
      }
    }
    if (!placed) throw new Error('Không còn ca trống cho lab/project');
  }

  for (const course of ordered) {
    for (let session = 0; session < course.theory; session += 1) {
      let best: { day: number; slot: number; score: number } | undefined;
      for (let day = 0; day < 6; day += 1) {
        const row = grid[day];
        if (!row) continue;
        for (let slot = 0; slot < 4; slot += 1) {
          if (row[slot] !== null) continue;
          const sameDay = meetings.some(item => item.code === course.code && item.day === day);
          const adjacentDay = meetings.some(item => item.code === course.code && Math.abs(item.day - day) === 1);
          const load = row.filter(value => value !== null).length;
          const score = (sameDay ? 1000 : 0)
            + (adjacentDay ? 100 : 0)
            + (day === 5 ? 50 : 0)
            + load * 10 + day + slot / 10;
          if (!best || score < best.score) best = { day, slot, score };
        }
      }
      if (!best) throw new Error('Không còn ca trống cho lý thuyết');
      reserve(course, best.day, best.slot, 'theoryA', 1);
    }
  }
  meetings.sort((a, b) => a.day - b.day || a.slot - b.slot);
  for (const course of ordered) {
    const theory = meetings.filter(item => item.code === course.code && item.kind === 'theoryA');
    if (theory[0]) theory[0].kind = 'theoryA';
    if (theory[1]) theory[1].kind = 'theoryB';
  }
  return meetings;
}
