import { TEXT } from './text';

export default function TopBar() {
  return (
    <>
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-3 p-4">
        <h1 className="rounded-lg bg-white/85 px-3 py-1.5 text-lg font-semibold text-slate-800 shadow">
          {TEXT.appTitle}
        </h1>
      </header>
      <p className="pointer-events-none absolute bottom-1 right-2 text-[10px] text-slate-600">
        {TEXT.osmCredit}
      </p>
    </>
  );
}
