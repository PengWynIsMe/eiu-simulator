import type { SilverCourse, CourseStatus } from '../types/silver';
export interface PrereqContext { done: ReadonlySet<string>; taken: ReadonlySet<string>; hasContent: ReadonlySet<string>; }
export function courseStatus(course: SilverCourse, ctx: PrereqContext): CourseStatus {
  if (ctx.taken.has(course.code)) return { code: 'done', missing: [] };
  if (course.prereq.mode === 'unresolved' || (course.prereq.mode === 'unclear' && course.prereq.codes.length === 0)) return { code: 'needs-confirmation', missing: course.prereq.codes };
  const missing = course.prereq.codes.filter(code => !ctx.done.has(code));
  if (missing.length) return { code: 'missing-prereq', missing };
  if (!ctx.hasContent.has(course.code)) return { code: 'no-content', missing: [] };
  // prestudy/coreq/english không chặn trong bản thử: dữ liệu PDF không đủ để kiểm.
  return { code: 'available', missing: [] };
}
