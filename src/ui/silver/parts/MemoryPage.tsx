import { useId } from 'react';
import type { MemoryView } from '../../../types/silver';
import { useLangStore } from '../../../store/useLangStore';
import { useT } from '../../text';
import { fmt, ST } from '../text';

interface MemoryPageProps {
  page: MemoryView;
  onPickPhoto?: (photoId: string) => void;
}

function formatSavedDate(iso: string, lang: 'vi' | 'en'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'vi-VN').format(date);
}

/** Một trang kỷ niệm dạng giấy lưu bút + ảnh polaroid + con dấu. */
export default function MemoryPage({ page, onPickPhoto }: MemoryPageProps) {
  const tr = useT();
  const lang = useLangStore((s) => s.lang);
  const groupName = useId();
  const canPickPhoto = Boolean(onPickPhoto && page.photoChoices.length > 1);

  return (
    <article className="relative overflow-hidden rounded-2xl border-2 border-[#e7d9b5] bg-[#fffbeb] p-4 text-slate-800 shadow-md sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Khung ảnh polaroid 4:3 + chọn ảnh nếu ở màn Memory */}
        <div className="w-full shrink-0 space-y-2.5 sm:w-52">
          <div className="rounded-xl border border-[#e7d9b5] bg-white p-2 shadow-sm">
            <div
              className="flex aspect-[4/3] items-center justify-center rounded-lg"
              style={{ background: 'linear-gradient(135deg, #bae6fd 0%, #0b3d91 100%)' }}
            >
              <span aria-hidden="true" className="text-4xl drop-shadow">
                📷
              </span>
            </div>
            <p className="mt-2 break-words text-center text-xs font-medium text-slate-700">
              {tr(page.photo.caption)}
            </p>
          </div>

          {canPickPhoto && (
            <fieldset className="space-y-1.5 rounded-xl border border-[#e7d9b5] bg-white/70 p-2.5">
              <legend className="px-1 text-xs font-bold text-[#0b3d91]">
                {tr(ST.pickPhoto)}
              </legend>
              <div className="space-y-1">
                {page.photoChoices.map((choice) => {
                  const checked = page.photo.id === choice.id;
                  return (
                    <label
                      key={choice.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-xs transition ${
                        checked ? 'bg-[#0b3d91]/10 font-semibold text-[#0b3d91]' : 'text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name={groupName}
                        checked={checked}
                        onChange={() => onPickPhoto?.(choice.id)}
                        className="h-3.5 w-3.5 accent-[#0b3d91] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                      />
                      <span className="break-words">{tr(choice.caption)}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}
        </div>

        {/* Nội dung lưu bút, môn học, hoạt động, ngày lưu & con dấu */}
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
          <div className="space-y-2.5">
            <h3 className="break-words text-base font-bold text-[#0b3d91] sm:text-lg">
              {tr(page.title)}
            </h3>
            <p className="whitespace-pre-line break-words text-[15px] italic leading-6 text-slate-700">
              {tr(page.line.text)}
            </p>

            {page.courses.length > 0 && (
              <p className="break-words text-[13px] leading-5 text-slate-700">
                <span className="font-bold text-slate-800">{tr(ST.memCourses)}: </span>
                {page.courses.map((c) => `${c.code} (${tr(c.name)})`).join(', ')}
              </p>
            )}

            {page.activities.length > 0 && (
              <p className="break-words text-[13px] leading-5 text-slate-700">
                <span className="font-bold text-slate-800">{tr(ST.memActs)}: </span>
                {page.activities.map((a) => tr(a)).join(', ')}
              </p>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-3 pt-2">
            <div>
              {page.savedAt && (
                <p className="text-xs font-medium text-slate-500">
                  {fmt(tr(ST.savedOn), { d: formatSavedDate(page.savedAt, lang) })}
                </p>
              )}
            </div>

            {/* Con dấu tròn viền đôi đỏ xoay -8° */}
            <div
              aria-label={tr(page.stamp)}
              style={{ transform: 'rotate(-8deg)' }}
              className="inline-flex shrink-0 items-center justify-center rounded-full border-2 border-[#dc2626] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#dc2626] ring-2 ring-[#dc2626]/75 ring-offset-2 ring-offset-[#fffbeb]"
            >
              {tr(page.stamp)}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
