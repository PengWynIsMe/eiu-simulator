import { forwardRef, type ButtonHTMLAttributes } from 'react';

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** Nút hành động chính (vàng EIU). */
const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(function PrimaryButton(
  { className = '', disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`min-h-[44px] rounded-xl bg-[#f5b700] px-6 text-sm font-bold text-slate-900 transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
        disabled ? 'cursor-not-allowed opacity-50 hover:brightness-100' : ''
      } ${className}`}
      {...rest}
    />
  );
});

export default PrimaryButton;
