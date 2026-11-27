import { majors } from '../index';
import { plan } from '../silver/plan';
import { getCourse } from '../silver/catalog';
import type { Course, LocalizedText, Major, Vec2 } from '../../types';
import type { TermId } from '../../types/silver';

export type TimelineStage =
  | 'placement-written'
  | 'placement-speaking'
  | 'english-class'
  | 'english-exam'
  | 'ielts-exam'
  | 'major-theory'
  | 'major-lab'
  | 'major-exam'
  | 'graduation';

export interface TimelineCourseItem {
  code: string;
  name: LocalizedText;
  credits: number;
  lt: number;
  th: number;
  block: string;
  prereqs: string[];
  isCore: boolean;
}

export interface TimelineTerm {
  termId: TermId;
  year: 1 | 2 | 3 | 4 | 5;
  semesterInYear: 1 | 2 | 3 | 4;
  isSummer: boolean;
  phase: 'english' | 'major' | 'graduation';
  englishLevel?: 1 | 2 | 3 | 4 | 5;
  durationMonths: 3;
  courses: TimelineCourseItem[];
  totalCredits: number;
}

export interface MajorTimelinePlan {
  majorId: string;
  name: LocalizedText;
  programCode: string | null;
  playable3D: boolean;
  totalCredits: number;
  terms: TimelineTerm[];
}

export const ALL_TERM_IDS: readonly TermId[] = [
  '1.1', '1.2', '1.3', '1.4',
  '2.1', '2.2', '2.3', '2.4',
  '3.1', '3.2', '3.3', '3.4',
  '4.1', '4.2', '4.3', '4.4',
  '5.1', '5.2', '5.3', '5.4',
];

export interface EnglishShiftSchedule {
  level: 1 | 2 | 3 | 4 | 5;
  shiftLabel: LocalizedText;
  timeText: string;
  breakText: string;
}

export const ENGLISH_SCHEDULES: Record<1 | 2 | 3 | 4 | 5, EnglishShiftSchedule> = {
  1: {
    level: 1,
    shiftLabel: { vi: 'Buổi sáng', en: 'Morning shift' },
    timeText: '07:30 – 11:30',
    breakText: '09:15 – 09:45 (30p)',
  },
  2: {
    level: 2,
    shiftLabel: { vi: 'Buổi chiều', en: 'Afternoon shift' },
    timeText: '12:30 – 16:30',
    breakText: '14:15 – 14:45 (30p)',
  },
  3: {
    level: 3,
    shiftLabel: { vi: 'Buổi sáng', en: 'Morning shift' },
    timeText: '07:30 – 11:30',
    breakText: '09:15 – 09:45 (30p)',
  },
  4: {
    level: 4,
    shiftLabel: { vi: 'Buổi chiều', en: 'Afternoon shift' },
    timeText: '12:30 – 16:30',
    breakText: '14:15 – 14:45 (30p)',
  },
  5: {
    level: 5,
    shiftLabel: { vi: '2 buổi (Sáng & Chiều)', en: 'Two sessions (AM & PM)' },
    timeText: '08:00 – 11:00 · 12:30 – 14:30',
    breakText: '09:15 – 09:45 (30p)',
  },
};

const B8_EX: readonly [number, number] = [0.97398, -0.22663];
const B8_EV: readonly [number, number] = [0.22663, 0.97398];

export function b8UvToWorld(u: number, v: number): Vec2 {
  return [
    u * B8_EX[0] + v * B8_EV[0],
    u * B8_EX[1] + v * B8_EV[1],
  ];
}

export interface TimelineRoomSpec {
  buildingId: 'b8';
  floor: 2 | 4;
  roomCode: string;
  label: LocalizedText;
  maxU: number;
  /** Vị trí đứng an toàn ngay trong cửa phòng (không vướng bàn ghế) */
  spawnUv: Vec2;
  /** Vị trí tâm phòng để đặt NPC/Beacon */
  beaconUv: Vec2;
}

export const TIMELINE_ROOMS: Record<'written' | 'speaking' | 'english' | 'theory' | 'lab', TimelineRoomSpec> = {
  written: {
    buildingId: 'b8',
    floor: 2,
    roomCode: '206.B8',
    label: { vi: 'Phòng 206.B8 — Kiểm tra đầu vào & Thi', en: 'Room 206.B8 — Placement & Exams' },
    maxU: 91.3,
    spawnUv: [86.2, -205.15],
    beaconUv: [87.4, -205.15],
  },
  speaking: {
    buildingId: 'b8',
    floor: 2,
    roomCode: '210.B8',
    label: { vi: 'Phòng 210.B8 — Phỏng vấn Speaking 1:1', en: 'Room 210.B8 — 1-on-1 Speaking Interview' },
    maxU: 72.5,
    spawnUv: [67.4, -205.15],
    beaconUv: [68.6, -205.15],
  },
  english: {
    buildingId: 'b8',
    floor: 2,
    roomCode: '204.B8',
    label: { vi: 'Phòng 204.B8 — Lớp Tiếng Anh EIU', en: 'Room 204.B8 — EIU English Class' },
    maxU: 100.5,
    spawnUv: [95.4, -205.15],
    beaconUv: [96.6, -205.15],
  },
  theory: {
    buildingId: 'b8',
    floor: 2,
    roomCode: '208.B8',
    label: { vi: 'Phòng 208.B8 — Giảng đường Lý thuyết IT', en: 'Room 208.B8 — IT Theory Lecture Hall' },
    maxU: 81.9,
    spawnUv: [76.8, -205.15],
    beaconUv: [78.0, -205.15],
  },
  lab: {
    buildingId: 'b8',
    floor: 4,
    roomCode: '406.B8',
    label: { vi: 'Phòng Lab 406.B8 (Tầng 4) — Thực hành máy tính', en: 'Lab 406.B8 (Floor 4) — Computer Practice' },
    maxU: 91.3,
    spawnUv: [86.2, -205.15],
    beaconUv: [87.4, -205.15],
  },
};

export const B8_OUTSIDE_ENTRANCE: Vec2 = b8UvToWorld(52.8, -163.0);

export function getRoomSpecForStage(stage: TimelineStage): TimelineRoomSpec {
  if (stage === 'placement-speaking') return TIMELINE_ROOMS.speaking;
  if (stage === 'english-class') return TIMELINE_ROOMS.english;
  if (stage === 'major-theory') return TIMELINE_ROOMS.theory;
  if (stage === 'major-lab') return TIMELINE_ROOMS.lab;
  return TIMELINE_ROOMS.written;
}

function englishLevelForTerm(termId: TermId): 1 | 2 | 3 | 4 | 5 | undefined {
  if (termId === '1.1') return 1;
  if (termId === '1.2') return 2;
  if (termId === '1.3') return 3;
  if (termId === '1.4') return 4;
  if (termId === '2.1') return 5;
  return undefined;
}

function buildKtpmTimelinePlan(major: Major): MajorTimelinePlan {
  const terms: TimelineTerm[] = plan.terms.map((pt) => {
    const [yStr, sStr] = pt.term.split('.');
    const year = Number(yStr) as 1 | 2 | 3 | 4 | 5;
    const semesterInYear = Number(sStr) as 1 | 2 | 3 | 4;
    const isSummer = semesterInYear === 4;
    const phase = pt.kind === 'graduation' ? 'graduation' : pt.kind === 'english' ? 'english' : 'major';
    const codes = [...pt.courses, ...pt.electives.map((e) => e.default)];
    const courses: TimelineCourseItem[] = codes.map((code) => {
      const sc = getCourse(code);
      return {
        code,
        name: sc?.name ?? { vi: code, en: code },
        credits: sc?.credits ?? 4,
        lt: sc?.lt ?? 3,
        th: sc?.th ?? 1,
        block: sc?.block ?? 'nganh',
        prereqs: sc?.prereq.codes ?? [],
        isCore: pt.core.includes(code),
      };
    });
    return {
      termId: pt.term,
      year,
      semesterInYear,
      isSummer,
      phase,
      englishLevel: englishLevelForTerm(pt.term),
      durationMonths: 3,
      courses,
      totalCredits: pt.credits,
    };
  });

  return {
    majorId: major.id,
    name: major.name,
    programCode: major.curriculum.programCode,
    playable3D: true,
    totalCredits: major.curriculum.totalCredits ?? 180,
    terms,
  };
}

function buildGenericTimelinePlan(major: Major): MajorTimelinePlan {
  // Gom môn đại cương lên các kỳ tiếng Anh (1.1..2.1), môn chuyên ngành trải đều qua 2.2..5.3
  const allCourses: Course[] = [];
  major.curriculum.years.forEach((y) => {
    y.courses.forEach((c) => allCourses.push(c));
    y.electiveSlots.forEach((slot, idx) => {
      const grp = major.curriculum.electiveGroups.find((g) => g.id === slot.groupId);
      const sample = grp?.courses[0];
      if (sample) {
        allCourses.push(sample);
      } else {
        allCourses.push({
          code: `EL-${y.year}.${idx + 1}`,
          name: grp?.title ?? { vi: 'Môn tự chọn', en: 'Elective' },
          credits: slot.credits,
          block: 'chuyen-nganh',
        });
      }
    });
  });

  const isGenEd = (c: Course) =>
    c.block === 'dai-cuong' ||
    /^(POLS|LAWS|MATH|PHYS|CHEM|STAT|UNIV)/.test(c.code);

  const genEd = allCourses.filter(isGenEd);
  const specCourses = allCourses.filter((c) => !isGenEd(c));

  const englishTerms: TermId[] = ['1.1', '1.2', '1.3', '1.4', '2.1'];
  const majorTerms: TermId[] = ['2.2', '2.3', '2.4', '3.1', '3.2', '3.3', '3.4', '4.1', '4.2', '4.3', '4.4', '5.1', '5.2', '5.3'];

  const buckets = new Map<TermId, Course[]>();
  ALL_TERM_IDS.forEach((id) => buckets.set(id, []));

  // Phân bố đại cương vào 1.1, 1.2, 1.3, 2.1 (chừa 1.4 hè nhẹ nhàng)
  const engActive: TermId[] = ['1.1', '1.2', '1.3', '2.1'];
  genEd.forEach((c, i) => {
    const tid = engActive[Math.min(engActive.length - 1, Math.floor((i * engActive.length) / Math.max(1, genEd.length)))] ?? '1.1';
    buckets.get(tid)?.push(c);
  });

  // Phân bố môn chuyên ngành vào 2.2..5.3 (ưu tiên kỳ chính nhiều hơn kỳ hè)
  const weightedMajorSlots: TermId[] = [];
  for (const t of majorTerms) {
    weightedMajorSlots.push(t);
    if (!t.endsWith('.4')) weightedMajorSlots.push(t);
  }
  specCourses.forEach((c, i) => {
    const tid = weightedMajorSlots[Math.min(weightedMajorSlots.length - 1, Math.floor((i * weightedMajorSlots.length) / Math.max(1, specCourses.length)))] ?? '2.2';
    buckets.get(tid)?.push(c);
  });

  const terms: TimelineTerm[] = ALL_TERM_IDS.map((termId) => {
    const [yStr, sStr] = termId.split('.');
    const year = Number(yStr) as 1 | 2 | 3 | 4 | 5;
    const semesterInYear = Number(sStr) as 1 | 2 | 3 | 4;
    const isSummer = semesterInYear === 4;
    const phase = termId === '5.4' ? 'graduation' : englishTerms.includes(termId) ? 'english' : 'major';
    const items: TimelineCourseItem[] = (buckets.get(termId) ?? []).map((c, idx) => ({
      code: c.code,
      name: c.name,
      credits: c.credits,
      lt: c.lt ?? Math.max(1, c.credits - 1),
      th: c.th ?? (c.credits > 1 ? 1 : 0),
      block: c.block,
      prereqs: c.prerequisites ?? [],
      isCore: idx === 0,
    }));
    const totalCredits = items.reduce((s, c) => s + c.credits, 0);
    return {
      termId,
      year,
      semesterInYear,
      isSummer,
      phase,
      englishLevel: englishLevelForTerm(termId),
      durationMonths: 3,
      courses: items,
      totalCredits,
    };
  });

  return {
    majorId: major.id,
    name: major.name,
    programCode: major.curriculum.programCode,
    playable3D: major.facultyId === 'cntt',
    totalCredits: major.curriculum.totalCredits ?? terms.reduce((s, t) => s + t.totalCredits, 0),
    terms,
  };
}

export const ALL_TIMELINE_PLANS: readonly MajorTimelinePlan[] = majors.map((m) =>
  m.id === 'ktpm' ? buildKtpmTimelinePlan(m) : buildGenericTimelinePlan(m),
);

export function getTimelinePlan(majorId: string): MajorTimelinePlan {
  const found = ALL_TIMELINE_PLANS.find((p) => p.majorId === majorId) ?? ALL_TIMELINE_PLANS[0];
  if (!found) throw new Error('Không có dữ liệu lộ trình ngành học');
  return found;
}

export function getTermIndex(termId: TermId): number {
  return ALL_TERM_IDS.indexOf(termId);
}

export function getNextMajorTermId(current: TermId): TermId {
  const idx = ALL_TERM_IDS.indexOf(current);
  if (idx < 0 || idx >= ALL_TERM_IDS.length - 1) return '5.4';
  return ALL_TERM_IDS[idx + 1] ?? '5.4';
}
