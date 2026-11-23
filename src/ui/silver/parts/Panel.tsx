import type { ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
  className?: string;
}

/** Thẻ trắng bo góc chung cho các màn hình IT Silver. */
export default function Panel({ children, className = '' }: PanelProps) {
  return (
    <div className={`rounded-2xl bg-white p-4 text-slate-800 shadow-2xl sm:p-6 ${className}`}>
      {children}
    </div>
  );
}
