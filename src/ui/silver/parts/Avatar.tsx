import type { SpeakerId } from '../../../types/silver';
import { useT } from '../../text';
import { ST } from '../text';

interface AvatarProps {
  speaker: SpeakerId;
  className?: string;
}

const STYLE_BY_SPEAKER: Record<Exclude<SpeakerId, 'narrator'>, { bg: string; text: string; initial: string }> = {
  thanh: { bg: '#0b3d91', text: '#ffffff', initial: 'T' },
  quyen: { bg: '#0f766e', text: '#ffffff', initial: 'Q' },
  han: { bg: '#b45309', text: '#ffffff', initial: 'H' },
  teacher: { bg: '#475569', text: '#ffffff', initial: 'GV' },
  examiner: { bg: '#334155', text: '#ffffff', initial: 'GK' },
  guide: { bg: '#0369a1', text: '#ffffff', initial: 'HD' },
  player: { bg: '#f5b700', text: '#0f172a', initial: 'B' },
};

const LABEL_BY_SPEAKER = {
  thanh: ST.speakerThanh,
  quyen: ST.speakerQuyen,
  han: ST.speakerHan,
  teacher: ST.speakerTeacher,
  examiner: ST.speakerExaminer,
  guide: ST.speakerGuide,
  player: ST.speakerPlayer,
} as const;

/** Vòng tròn đại diện nhân vật theo quy ước màu mặc định. */
export default function Avatar({ speaker, className = '' }: AvatarProps) {
  const tr = useT();
  if (speaker === 'narrator') return null;

  const style = STYLE_BY_SPEAKER[speaker];
  const label = tr(LABEL_BY_SPEAKER[speaker]);

  return (
    <span
      aria-label={label}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm ${className}`}
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.initial}
    </span>
  );
}

export { LABEL_BY_SPEAKER };
