import { forwardRef, type ButtonHTMLAttributes } from 'react';

type SecondaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** Nút hành động phụ (viền xanh EIU). */
const SecondaryButton = forwardRef<HTMLButtonElement, SecondaryButtonProps>(function SecondaryButton(
  { className = '', disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`min-h-[44px] rounded-xl border-2 border-[#0b3d91] bg-white px-4 text-sm font-medium text-[#0b3d91] transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
        disabled ? 'cursor-not-allowed opacity-50 hover:bg-white' : ''
      } ${className}`}
      {...rest}
    />
  );
});

export default SecondaryButton;
