import type { Grade, Transcript } from '../types/silver';

const SKILLS = ['listening', 'reading', 'writing', 'speaking'] as const;
const GRADE_SEQUENCE = 'DCCCCBBBBA';

export function fnv1a(value: string): number {
  let hash = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(value)) {
    hash = Math.imul(hash ^ byte, 0x01000193) >>> 0;
  }
  return hash;
}

export function englishGrades(seed: string, level: 1 | 2 | 3 | 4 | 5): Transcript {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const grades = SKILLS.map(skill => GRADE_SEQUENCE[fnv1a(`${seed}|${level}|${skill}|${attempt}`) % 10] as Grade);
    if (grades.filter(grade => grade === 'D').length <= 2) {
      const [listening = 'C', reading = 'C', writing = 'B', speaking = 'B'] = grades;
      return { level, listening, reading, writing, speaking };
    }
  }
  return { level, listening: 'C', reading: 'C', writing: 'B', speaking: 'B' };
}

export function isPassing(transcript: Transcript): boolean {
  return SKILLS.filter(skill => transcript[skill] === 'D').length <= 2;
}
