import { useT } from '../../text';
import { ST } from '../text';

interface WarningBarProps {
  warning: 'blocked' | 'corrupt';
  onDismiss: () => void;
}

/** Dải cảnh báo bộ nhớ trên cùng của lớp IT Silver, cho phép đóng tạm thời. */
export default function WarningBar({ warning, onDismiss }: WarningBarProps) {
  const tr = useT();
  const message = warning === 'blocked' ? tr(ST.warnBlocked) : tr(ST.warnCorrupt);

  return (
    <div
      role="status"
      className="border-b border-amber-300 bg-amber-50 px-3 py-2 text-[13px] leading-5 text-amber-950 sm:px-6"
    >
      <div className="mx-auto flex max-w-4xl items-start justify-between gap-3">
        <p className="flex items-start gap-2">
          <span aria-hidden="true" className="shrink-0 font-bold">
            ⚠
          </span>
          <span>{message}</span>
        </p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={tr(ST.close)}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-amber-900 hover:bg-amber-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
