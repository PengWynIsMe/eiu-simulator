import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import type { SayStep } from '../../../types/silver';
import { useLangStore } from '../../../store/useLangStore';
import { useT } from '../../text';
import { useTypewriter } from '../../desktop/useTypewriter';
import { useDialogueAdvance } from '../../dialogueAdvance';
import Avatar, { LABEL_BY_SPEAKER } from '../parts/Avatar';

interface SayProps {
  step: SayStep;
  fullyShownRef: MutableRefObject<boolean>;
  revealRef: MutableRefObject<(() => void) | null>;
  onNext?: () => void;
}

/** Bước hội thoại: hiện chữ dần 30 ký tự/giây, bấm thẻ hoặc bấm Tiếp lần đầu để hiện hết; bấm lần sau để sang câu tiếp. */
export default function Say({ step, fullyShownRef, revealRef, onNext }: SayProps) {
  const tr = useT();
  const lang = useLangStore((s) => s.lang);
  const fullText = tr(step.text);

  const initialLangRef = useRef(lang);
  const [langSwitched, setLangSwitched] = useState(false);
  const [reducedMotion] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
  );

  useEffect(() => {
    if (lang !== initialLangRef.current) {
      setLangSwitched(true);
    }
  }, [lang]);

  const { shown, done, skip } = useTypewriter(fullText, 30, true);
  const isImmediate = reducedMotion || langSwitched;
  const displayText = isImmediate ? fullText : shown;
  const isDone = isImmediate || done;

  const { hintText } = useDialogueAdvance({
    isTyping: !isDone,
    onSkip: skip,
    onNext,
    hasOptions: false,
    canContinue: Boolean(onNext),
  });

  useEffect(() => {
    fullyShownRef.current = isDone;
    revealRef.current = skip;
    return () => {
      revealRef.current = null;
    };
  }, [isDone, skip, fullyShownRef, revealRef]);

  if (step.speaker === 'narrator') {
    return (
      <div
        role="button"
        tabIndex={0}
        data-dialogue-advance="true"
        aria-label={displayText}
        className="w-full max-h-[48dvh] cursor-pointer select-text overflow-y-auto px-2 py-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        <p className="whitespace-pre-line text-[15px] italic leading-6 text-slate-700">
          {displayText}
        </p>
        {hintText && (
          <p className="mt-2 text-xs font-medium text-slate-400 select-none">{hintText}</p>
        )}
      </div>
    );
  }

  const speakerLabel = tr(LABEL_BY_SPEAKER[step.speaker]);

  return (
    <div
      role="button"
      tabIndex={0}
      data-dialogue-advance="true"
      aria-label={speakerLabel}
      className="w-full max-h-[48dvh] cursor-pointer overflow-y-auto rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
    >
      <div className="flex items-start gap-3">
        <Avatar speaker={step.speaker} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#0b3d91]">{speakerLabel}</p>
          <p className="mt-1 whitespace-pre-line text-[15px] leading-6 text-slate-800">
            {displayText}
          </p>
          {hintText && (
            <p className="mt-2 text-xs font-medium text-slate-400 select-none">{hintText}</p>
          )}
        </div>
      </div>
    </div>
  );
}
