import { CAMPUS_QUIZ } from '../../data/explore';
import { useExploreStore } from '../../store/useExploreStore';
import { useLangStore } from '../../store/useLangStore';
import { sfx } from '../audio/sfx';
import { UI_TEXT, useT } from '../text';

export default function CampusQuizModal() {
  const tr = useT();
  const lang = useLangStore((s) => s.lang);
  const quizOpen = useExploreStore((s) => s.quizOpen);
  const quizAnswers = useExploreStore((s) => s.quizAnswers);
  const setQuizOpen = useExploreStore((s) => s.setQuizOpen);
  const answerQuiz = useExploreStore((s) => s.answerQuiz);
  const resetQuiz = useExploreStore((s) => s.resetQuiz);

  if (!quizOpen) return null;

  const score = CAMPUS_QUIZ.reduce((acc, q) => (quizAnswers[q.id] === q.correctIndex ? acc + 1 : acc), 0);

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tr(UI_TEXT.exploreQuizTitle)}
        className="flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-slate-900 text-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-base font-bold sm:text-lg">🧩 {tr(UI_TEXT.exploreQuizTitle)}</h2>
            <p className="text-xs font-semibold text-amber-300">
              {tr(UI_TEXT.exploreQuizScore, { score, total: CAMPUS_QUIZ.length })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setQuizOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm hover:bg-white/20"
            aria-label={tr(UI_TEXT.close)}
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          {CAMPUS_QUIZ.map((q, qIdx) => {
            const picked = quizAnswers[q.id];
            const answered = picked !== undefined;
            return (
              <div key={q.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">
                  {qIdx + 1}. {q.question[lang]}
                </p>
                <div className="mt-2.5 grid gap-2">
                  {q.options.map((opt, optIdx) => {
                    const isPicked = picked === optIdx;
                    const isCorrect = optIdx === q.correctIndex;
                    let cls = 'border-white/15 bg-slate-950/50 text-slate-200 hover:bg-white/10';
                    if (answered) {
                      if (isCorrect) cls = 'border-emerald-400 bg-emerald-500/20 text-emerald-200';
                      else if (isPicked) cls = 'border-rose-400 bg-rose-500/20 text-rose-200';
                      else cls = 'border-white/10 bg-slate-950/30 text-slate-400';
                    }
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        disabled={answered}
                        onClick={() => {
                          answerQuiz(q.id, optIdx);
                          if (optIdx === q.correctIndex) sfx.correct();
                          else sfx.wrong();
                        }}
                        className={`rounded-xl border px-3 py-2 text-left text-xs font-medium transition sm:text-sm ${cls}`}
                      >
                        {opt[lang]}
                      </button>
                    );
                  })}
                </div>
                {answered && (
                  <p className="mt-2 text-xs text-sky-200">{q.explanation[lang]}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-3">
          <button
            type="button"
            onClick={resetQuiz}
            className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20"
          >
            {tr(UI_TEXT.exploreQuizReplay)}
          </button>
          <button
            type="button"
            onClick={() => setQuizOpen(false)}
            className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300"
          >
            {tr(UI_TEXT.close)}
          </button>
        </div>
      </div>
    </div>
  );
}
