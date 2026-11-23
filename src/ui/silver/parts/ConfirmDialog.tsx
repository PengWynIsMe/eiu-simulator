import { useEffect, useId, useRef } from 'react';
import { useT } from '../../text';
import { ST } from '../text';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Hộp thoại xác nhận: giữ focus bên trong, Esc = hủy, trả focus về nút mở khi đóng. */
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const tr = useT();
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancelRef.current?.focus();
    return () => {
      openerRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
          return;
        }
        if (e.key === 'Tab') {
          const first = cancelRef.current;
          const last = confirmRef.current;
          if (!first || !last) return;
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5 text-slate-800 shadow-2xl sm:p-6">
        <h2 id={titleId} className="text-base font-bold text-[#0b3d91] sm:text-lg">
          {title}
        </h2>
        <p className="mt-2 text-[15px] leading-6 text-slate-600">{body}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2.5">
          <SecondaryButton ref={cancelRef} onClick={onCancel}>
            {cancelLabel ?? tr(ST.cancel)}
          </SecondaryButton>
          <PrimaryButton
            ref={confirmRef}
            onClick={onConfirm}
            className={danger ? 'bg-red-600 text-white hover:bg-red-700' : ''}
          >
            {confirmLabel ?? tr(ST.ok)}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
