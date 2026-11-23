import { termCodes } from '../data/silver/plan';
import type { PlanTerm, RegistrationRow, RegistrationView, SilverCatalog } from '../types/silver';
import { courseStatus, type PrereqContext } from './prereq';
import { buildTimetable, toTimetableCourse, type TimetableCourse } from './timetable';

export interface RegistrationInput {
  term: PlanTerm;
  catalog: SilverCatalog;
  plannedBefore: string[];
  earlier: { term: PlanTerm; registered: string[] }[];
  content: ReadonlyMap<string, { tier: 'core' | 'summary'; minutes: number }>;
  selected: string[];
}

export const MAX_COURSES = 6;
export const QUICK_MINUTES = 2;
export const FRAME_MINUTES = 5.5;
const SUMMARY_LIMIT = 3;

export function defaultSelection(term: PlanTerm): string[] {
  return termCodes(term);
}

function prerequisiteContext(input: RegistrationInput): PrereqContext {
  const done = new Set(input.plannedBefore);
  const taken = new Set(input.plannedBefore);
  const registered = new Set<string>();
  for (const earlier of input.earlier) {
    const actual = new Set(earlier.registered);
    for (const code of termCodes(earlier.term)) {
      if (!actual.has(code)) taken.delete(code);
    }
    for (const code of actual) registered.add(code);
  }
  for (const code of registered) {
    done.add(code);
    taken.add(code);
  }
  return { done, taken, hasContent: new Set(input.content.keys()) };
}

function registrationState(input: RegistrationInput) {
  const core = new Set(input.term.core);
  const courses = new Map(input.catalog.courses.map(course => [course.code, course]));
  const selected = new Set(input.selected.filter(code => courses.has(code) && (core.has(code) || input.content.has(code))));
  return { core, courses, selected };
}

export function toggleSelection(input: RegistrationInput, code: string): string[] {
  const { core, courses, selected } = registrationState(input);
  if (selected.has(code)) {
    if (!core.has(code)) selected.delete(code);
  } else {
    const course = courses.get(code);
    if (course && courseStatus(course, prerequisiteContext(input)).code === 'available') {
      selected.add(code);
    }
  }
  return [...selected];
}

export function buildRegistration(input: RegistrationInput): RegistrationView {
  const { term, content } = input;
  const { core, courses, selected } = registrationState(input);
  const ctx = prerequisiteContext(input);
  const planned = termCodes(term);
  const suggested = new Set(planned);
  const groups = new Set(term.electives.map(elective => elective.group));
  const codes = new Set(suggested);
  for (const course of courses.values()) {
    if (course.group && groups.has(course.group)) codes.add(course.code);
  }
  for (const code of courses.keys()) {
    if (content.has(code)) codes.add(code);
  }

  const selectedNonCore = [...selected].filter(code => !core.has(code)).length;
  const rows: RegistrationRow[] = [];
  const timetableCourses: TimetableCourse[] = [];
  let summaries = 0;
  let credits = 0;
  let minutes = FRAME_MINUTES;
  for (const code of codes) {
    const course = courses.get(code);
    if (!course) continue;
    const isSelected = selected.has(code);
    const locked = core.has(code);
    const isSuggested = suggested.has(code);
    const status = courseStatus(course, ctx);
    if (status.code === 'done' && !isSelected) continue;

    let tier: RegistrationRow['tier'] = 'core';
    if (!locked) {
      const preceding = isSelected ? summaries : selectedNonCore;
      tier = preceding < SUMMARY_LIMIT ? 'summary' : 'quick';
      if (isSelected && tier === 'summary') summaries++;
    }
    const courseContent = content.get(code);
    rows.push({
      code,
      name: course.name,
      credits: course.credits,
      lab: course.th > 0,
      tier,
      selected: isSelected,
      locked,
      suggested: isSuggested,
      status: isSuggested && !courseContent
        ? { code: 'no-content', missing: [] }
        : status,
    });

    if (!isSelected) continue;
    credits += course.credits;
    minutes += tier === 'quick' ? QUICK_MINUTES : (courseContent?.minutes ?? 0);
    timetableCourses.push(toTimetableCourse(course, locked));
  }

  const count = timetableCourses.length;
  const tooMany = count > MAX_COURSES;
  const tooFew = count < Math.min(3, planned.length);
  return {
    chapterId: term.term,
    rows,
    credits,
    minutes: Math.round(minutes),
    maxCourses: MAX_COURSES,
    problem: tooMany ? 'too-many' : tooFew ? 'too-few' : null,
    meetings: tooMany ? [] : buildTimetable(timetableCourses),
  };
}
