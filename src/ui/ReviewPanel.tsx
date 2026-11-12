import { useState, useRef, useEffect } from 'react';
import type { ReviewCategory } from '../types';
import { getBuilding } from '../data';
import {
  REVIEW_CATEGORIES,
  canWriteRepoFile,
  downloadNotesFile,
  mergeNotesFile,
} from '../data/reviewNotes';
import { useReviewStore } from '../store/useReviewStore';
import { TEXT } from './text';

type FilterType = 'mo' | 'da-sua' | 'tat-ca';

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function ReviewPanel() {
  const notes = useReviewStore((s) => s.notes);
  const error = useReviewStore((s) => s.error);
  const draft = useReviewStore((s) => s.draft);
  const selectedNoteId = useReviewStore((s) => s.selectedNoteId);
  const author = useReviewStore((s) => s.author);

  const toggleReviewMode = useReviewStore((s) => s.toggleReviewMode);
  const load = useReviewStore((s) => s.load);
  const setDraft = useReviewStore((s) => s.setDraft);
  const submitDraft = useReviewStore((s) => s.submitDraft);
  const setNoteStatus = useReviewStore((s) => s.setNoteStatus);
  const deleteNote = useReviewStore((s) => s.deleteNote);
  const replaceNotes = useReviewStore((s) => s.replaceNotes);
  const selectNote = useReviewStore((s) => s.selectNote);
  const setAuthor = useReviewStore((s) => s.setAuthor);
  const requestCamera = useReviewStore((s) => s.requestCamera);

  const [filter, setFilter] = useState<FilterType>('mo');
  const [draftCategory, setDraftCategory] = useState<ReviewCategory>('vi-tri');
  const [draftText, setDraftText] = useState('');
  const [isReloading, setIsReloading] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Khi có draft mới, reset form nhập liệu
  useEffect(() => {
    if (draft) {
      setDraftText('');
      setDraftCategory('vi-tri');
    }
  }, [draft]);

  const handleReload = async () => {
    setIsReloading(true);
    try {
      await load();
    } finally {
      setIsReloading(false);
    }
  };

  const handleDownload = () => {
    downloadNotesFile(notes, author);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const merged = await mergeNotesFile(file, notes);
      replaceNotes(merged);
      setImportNotice(TEXT.importSuccess);
      setTimeout(() => setImportNotice(null), 3500);
    } catch {
      setImportNotice(TEXT.importError);
      setTimeout(() => setImportNotice(null), 3500);
    }
    e.target.value = '';
  };

  const handleSubmitDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftText.trim()) return;
    submitDraft(draftCategory, draftText.trim());
    setDraftText('');
  };

  const openCount = notes.filter((n) => n.status === 'mo').length;
  const resolvedCount = notes.filter((n) => n.status === 'da-sua').length;
  const totalCount = notes.length;

  const filteredNotes = notes.filter((n) => {
    if (filter === 'mo') return n.status === 'mo';
    if (filter === 'da-sua') return n.status === 'da-sua';
    return true;
  });

  const getTargetName = (targetId: string | null) => {
    if (!targetId) return TEXT.groundPin;
    return getBuilding(targetId)?.name ?? targetId;
  };

  const getCategoryLabel = (id: ReviewCategory) => {
    return REVIEW_CATEGORIES.find((c) => c.id === id)?.label ?? id;
  };

  return (
    <aside className="fixed inset-x-0 bottom-0 z-30 flex max-h-[72vh] flex-col rounded-t-2xl border-t border-slate-200 bg-white/95 shadow-2xl backdrop-blur-md pointer-events-auto sm:bottom-4 sm:right-4 sm:top-16 sm:left-auto sm:w-[410px] sm:max-h-[calc(100vh-5rem)] sm:rounded-2xl sm:border sm:border-slate-200">
      {/* Chỉ báo kéo trên điện thoại */}
      <div className="mx-auto my-1.5 h-1.5 w-12 rounded-full bg-slate-300 sm:hidden" />

      {/* Header panel */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
            <span>{TEXT.reviewTitle}</span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              {totalCount}
            </span>
          </h2>
          <p className="text-xs text-slate-500">{TEXT.reviewSubtitle}</p>
        </div>
        <button
          type="button"
          onClick={toggleReviewMode}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          title={TEXT.closeReview}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Thanh công cụ: Tải lại, Tải file, Nhập file */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100 bg-slate-50/80 px-4 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleReload}
            disabled={isReloading}
            className="flex items-center gap-1 rounded bg-white px-2 py-1 font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            title={TEXT.reload}
          >
            <svg
              className={`h-3.5 w-3.5 text-slate-500 ${isReloading ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            <span>{TEXT.reload}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1 rounded bg-white px-2 py-1 font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
            title={TEXT.downloadFile}
          >
            <svg
              className="h-3.5 w-3.5 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{TEXT.downloadFile}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 rounded bg-white px-2 py-1 font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
            title={TEXT.importFile}
          >
            <svg
              className="h-3.5 w-3.5 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>{TEXT.importFile}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
      </div>

      {/* Thông báo nhập file thành công / lỗi */}
      {importNotice && (
        <div className="border-b border-blue-200 bg-blue-50 px-4 py-1.5 text-xs text-blue-700">
          {importNotice}
        </div>
      )}

      {/* Báo lỗi nếu có */}
      {error && (
        <div className="flex items-start gap-1.5 border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <strong>{TEXT.errorPrefix}:</strong> {error}
          </div>
        </div>
      )}

      {/* Dòng trạng thái lưu trữ */}
      <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-1.5 text-[11px] text-slate-500">
        {canWriteRepoFile ? (
          <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            {TEXT.statusDev}
          </span>
        ) : (
          <span className="text-slate-600">
            {TEXT.statusProd}
          </span>
        )}
      </div>

      {/* Thân panel cuộn được */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 min-h-0">
        {/* Form nhập Draft khi đang có ghim chờ lưu */}
        {draft && (
          <form
            onSubmit={handleSubmitDraft}
            className="rounded-xl border-2 border-amber-400 bg-amber-50/70 p-3.5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-900">
                {TEXT.draftTitle}
              </h3>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="text-xs text-amber-700 hover:text-amber-900 font-medium"
              >
                {TEXT.cancelDraftBtn}
              </button>
            </div>

            {/* Thông tin vật thể & tọa độ */}
            <div className="rounded-lg bg-white/80 p-2.5 text-xs text-slate-700 space-y-1 border border-amber-200">
              <div>
                <span className="font-semibold text-slate-600">{TEXT.targetLabel} </span>
                <span className="font-bold text-slate-900">{getTargetName(draft.targetId)}</span>
                {draft.targetId && (
                  <span className="ml-1 text-[11px] text-slate-400">({draft.targetId})</span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                <span>{TEXT.coordsLabel} </span>
                [{draft.point.map((p) => p.toFixed(1)).join(', ')}]
              </div>
            </div>

            {/* Chọn loại góp ý */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {TEXT.categoryLabel}
              </label>
              <select
                value={draftCategory}
                onChange={(e) => setDraftCategory(e.target.value as ReviewCategory)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {REVIEW_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Ô nội dung góp ý */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {TEXT.contentLabel}
              </label>
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder={TEXT.contentPlaceholder}
                rows={3}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
              />
            </div>

            {/* Ô tên người góp ý */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {TEXT.authorLabel}
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder={TEXT.authorPlaceholder}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Nút hành động */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                {TEXT.cancelDraftBtn}
              </button>
              <button
                type="submit"
                disabled={!draftText.trim()}
                className="rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {TEXT.saveDraftBtn}
              </button>
            </div>
          </form>
        )}

        {/* Hướng dẫn khi chưa có draft */}
        {!draft && (
          <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-2.5 text-xs text-amber-800">
            <p className="flex items-start gap-1.5">
              <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>{TEXT.reviewPrompt}</span>
            </p>
          </div>
        )}

        {/* Bộ lọc ghi chú (Đang mở / Đã sửa / Tất cả) */}
        <div>
          <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setFilter('mo')}
              className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
                filter === 'mo'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {TEXT.filterOpen} ({openCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('da-sua')}
              className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
                filter === 'da-sua'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {TEXT.filterResolved} ({resolvedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('tat-ca')}
              className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
                filter === 'tat-ca'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {TEXT.filterAll} ({totalCount})
            </button>
          </div>
        </div>

        {/* Danh sách ghi chú */}
        <div className="space-y-2.5">
          {filteredNotes.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              {totalCount === 0 ? TEXT.noNotes : TEXT.noFilteredNotes}
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = selectedNoteId === note.id;
              const isGithub = note.source === 'github';

              return (
                <div
                  key={note.id}
                  onClick={() => {
                    selectNote(note.id);
                    requestCamera(note.camera);
                  }}
                  className={`cursor-pointer rounded-xl border p-3 text-xs transition-all shadow-sm ${
                    isSelected
                      ? 'border-amber-400 bg-amber-50/80 ring-2 ring-amber-300'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                  }`}
                >
                  {/* Dòng đầu: loại + vật thể + trạng thái */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700">
                        {getCategoryLabel(note.category)}
                      </span>
                      <span className="font-bold text-slate-800">
                        {getTargetName(note.targetId)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isGithub && (
                        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">
                          {TEXT.githubBadge}
                        </span>
                      )}
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          note.status === 'mo'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {note.status === 'mo' ? TEXT.statusOpen : TEXT.statusResolved}
                      </span>
                    </div>
                  </div>

                  {/* Nội dung ghi chú */}
                  <p className="mt-2 text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {note.text}
                  </p>

                  {/* Đã sửa / resolution nếu có */}
                  {note.resolution && (
                    <div className="mt-2 rounded bg-emerald-50 p-2 text-xs text-emerald-800 border border-emerald-200">
                      <span className="font-semibold">{TEXT.resolutionPrefix} </span>
                      {note.resolution}
                    </div>
                  )}

                  {/* Link GitHub nếu là nguồn github */}
                  {isGithub && note.issueUrl && (
                    <div className="mt-2 pt-1">
                      <a
                        href={note.issueUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 underline"
                      >
                        <span>{TEXT.openOnGithub}</span>
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </div>
                  )}

                  {/* Thông tin người tạo & thời gian */}
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                    <div>
                      <span>{TEXT.authorPrefix} </span>
                      <span className="font-medium text-slate-700">{note.author || 'Ẩn danh'}</span>
                      <span className="mx-1">·</span>
                      <span>{formatDate(note.createdAt)}</span>
                    </div>

                    {/* Nút thao tác (ẩn nếu là ghi chú GitHub) */}
                    {!isGithub && (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setNoteStatus(note.id, note.status === 'mo' ? 'da-sua' : 'mo')}
                          className="rounded px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                        >
                          {note.status === 'mo' ? TEXT.markResolved : TEXT.reopen}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(TEXT.confirmDelete)) {
                              deleteNote(note.id);
                            }
                          }}
                          className="rounded px-1.5 py-0.5 text-[11px] font-medium text-red-600 hover:bg-red-50 hover:text-red-800 transition-colors"
                        >
                          {TEXT.delete}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
