import { useState } from 'react';
import type { ChapterCard, ChapterId } from '../../../types/silver';
import { useT } from '../../text';
import { useSilver } from '../adapter';
import { fmt, ST } from '../text';
import ConfirmDialog from '../parts/ConfirmDialog';
import EmptyView from '../parts/EmptyView';
import Panel from '../parts/Panel';
import PrimaryButton from '../parts/PrimaryButton';
import SecondaryButton from '../parts/SecondaryButton';

interface ChapterGroup {
  key: string;
  label: string;
  cards: ChapterCard[];
}

function groupChapters(chapters: ChapterCard[], tr: (t: { vi: string; en: string }) => string): ChapterGroup[] {
  const groups = new Map<string, ChapterGroup>();
  for (const card of chapters) {
    const key = card.id === 'entrance' ? 'entrance' : `year-${card.id.split('.')[0]}`;
    const existing = groups.get(key);
    if (existing) {
      existing.cards.push(card);
    } else {
      const yearNum = card.id.split('.')[0] ?? '1';
      const label = key === 'entrance' ? tr(ST.beforeYear) : fmt(tr(ST.yearN), { n: yearNum });
      groups.set(key, { key, label, cards: [card] });
    }
  }
  return Array.from(groups.values());
}

/** Màn hình danh sách chương và lối vào sổ kỷ niệm. */
export default function Home() {
  const tr = useT();
  const chapters = useSilver((s) => s.chapters);
  const resumeId = useSilver((s) => s.resumeId);
  const startChapter = useSilver((s) => s.startChapter);
  const openNotebook = useSilver((s) => s.openNotebook);
  const clearAll = useSilver((s) => s.clearAll);

  const [pendingStartId, setPendingStartId] = useState<ChapterId | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  if (chapters.length === 0) {
    return <EmptyView showHomeButton={false} />;
  }

  const resumeCard = resumeId ? chapters.find((c) => c.id === resumeId && c.status !== 'coming-soon') : undefined;
  const groups = groupChapters(chapters, tr);

  const handleRestartOrStart = (id: ChapterId) => {
    if (resumeId !== null) {
      setPendingStartId(id);
      return;
    }
    startChapter(id, 'restart');
  };

  return (
    <Panel className="mb-4 space-y-5 sm:mb-6">
      {/* Đầu trang: tiêu đề, mô tả mô phỏng, nút Sổ kỷ niệm */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-[#0b3d91] sm:text-xl">{tr(ST.title)}</h2>
          <p className="mt-1 text-[13px] leading-5 text-slate-600">{tr(ST.sim)}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div data-silver-slot="home-extra" className="empty:hidden" />
          <SecondaryButton onClick={openNotebook} className="shrink-0">
            <span aria-hidden="true" className="mr-1.5">
              📖
            </span>
            {tr(ST.notebook)}
          </SecondaryButton>
        </div>
      </div>

      {/* Dải Tiếp tục khi có chương đang dở */}
      {resumeCard && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3.5 sm:p-4">
          <p className="min-w-0 flex-1 text-[15px] font-semibold text-slate-800">
            {fmt(tr(ST.continueLabel), { title: tr(resumeCard.title) })}
          </p>
          <PrimaryButton onClick={() => startChapter(resumeCard.id, 'resume')}>
            {tr(ST.continue)}
          </PrimaryButton>
        </div>
      )}

      {/* Danh sách chương theo nhóm */}
      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.key} aria-label={group.label}>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
              {group.label}
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {group.cards.map((card) => {
                const isComingSoon = card.status === 'coming-soon';
                return (
                  <article
                    key={card.id}
                    aria-disabled={isComingSoon ? 'true' : undefined}
                    className={`flex flex-col justify-between rounded-xl border p-4 transition ${
                      isComingSoon
                        ? 'border-slate-200 bg-slate-100/80 opacity-60'
                        : 'border-slate-200 bg-slate-50/60 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        {card.status === 'done' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                            <span aria-hidden="true">✓</span>
                            {tr(ST.done)}
                          </span>
                        )}
                        {card.status === 'in-progress' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                            <span aria-hidden="true">◐</span>
                            {tr(ST.inProgress)}
                          </span>
                        )}
                        {card.status === 'coming-soon' && (
                          <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                            {tr(ST.comingSoon)}
                          </span>
                        )}
                        {card.status === 'new' && <span />}
                        <span className="text-[13px] font-medium text-slate-500">
                          {fmt(tr(ST.minutes), { n: card.minutes })}
                        </span>
                      </div>
                      <h4 className="break-words text-base font-bold text-[#0b3d91]">{tr(card.title)}</h4>
                      <p className="mt-1 break-words text-[13px] leading-5 text-slate-600">{tr(card.subtitle)}</p>
                    </div>

                    {!isComingSoon && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {card.status === 'new' && (
                          <PrimaryButton className="w-full" onClick={() => handleRestartOrStart(card.id)}>
                            {tr(ST.start)}
                          </PrimaryButton>
                        )}
                        {card.status === 'in-progress' && (
                          <>
                            <PrimaryButton
                              className="flex-1"
                              onClick={() => startChapter(card.id, 'resume')}
                            >
                              {tr(ST.continue)}
                            </PrimaryButton>
                            <SecondaryButton
                              className="flex-1"
                              onClick={() => handleRestartOrStart(card.id)}
                            >
                              {tr(ST.replay)}
                            </SecondaryButton>
                          </>
                        )}
                        {card.status === 'done' && (
                          <SecondaryButton className="w-full" onClick={() => handleRestartOrStart(card.id)}>
                            {tr(ST.replay)}
                          </SecondaryButton>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Xóa toàn bộ tiến độ */}
      <div className="border-t border-slate-200 pt-4 text-center sm:text-right">
        <button
          type="button"
          onClick={() => setConfirmClearOpen(true)}
          className="text-[13px] font-medium text-slate-600 underline underline-offset-2 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          {tr(ST.clear)}
        </button>
      </div>

      <ConfirmDialog
        open={pendingStartId !== null}
        title={tr(ST.start)}
        body={tr(ST.confirmReplace)}
        onCancel={() => setPendingStartId(null)}
        onConfirm={() => {
          if (pendingStartId) {
            startChapter(pendingStartId, 'restart');
          }
          setPendingStartId(null);
        }}
      />

      <ConfirmDialog
        open={confirmClearOpen}
        title={tr(ST.clear)}
        body={tr(ST.confirmClear)}
        danger
        onCancel={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          clearAll();
          setConfirmClearOpen(false);
        }}
      />
    </Panel>
  );
}
