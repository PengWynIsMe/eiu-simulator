import { useT } from '../../text';
import { ST } from '../text';

interface StepperProps {
  index: number;
  count: number;
}

/** Chỉ báo tiến độ bước: chấm khi ≤ 8 bước, thanh mảnh khi > 8 bước. */
export default function Stepper({ index, count }: StepperProps) {
  const tr = useT();
  if (count <= 0) return null;

  if (count > 8) {
    const pct = Math.min(100, Math.round(((index + 1) / count) * 100));
    return (
      <div
        role="progressbar"
        aria-label={tr(ST.progressStep)}
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={count}
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
      >
        <div
          className="h-full rounded-full bg-[#0b3d91] transition-all duration-150 motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5" aria-label={tr(ST.progressStep)}>
      {Array.from({ length: count }, (_, i) => {
        const current = i === index;
        const done = i < index;
        return (
          <span
            key={i}
            className={`h-2 rounded-full transition-all duration-150 motion-reduce:transition-none ${
              current
                ? 'w-5 bg-[#f5b700]'
                : done
                  ? 'w-2 bg-[#0b3d91]'
                  : 'w-2 bg-slate-300'
            }`}
          />
        );
      })}
    </div>
  );
}
