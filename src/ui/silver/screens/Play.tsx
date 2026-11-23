import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useT } from '../../text';
import { useSilver } from '../adapter';
import { fmt, ST } from '../text';
import ConfirmDialog from '../parts/ConfirmDialog';
import EmptyView from '../parts/EmptyView';
import Panel from '../parts/Panel';
import PrimaryButton from '../parts/PrimaryButton';
import SecondaryButton from '../parts/SecondaryButton';
import Stepper from '../parts/Stepper';
import Say from '../steps/Say';
import Choice from '../steps/Choice';
import Slide from '../steps/Slide';

interface PlayProps {
  exitHandlerRef: MutableRefObject<(() => void) | null>;
}

/** Màn hình chơi cảnh: hiển thị vị trí, tiến độ, bước hiện tại và nút điều hướng. */
export default function Play({ exitHandlerRef }: PlayProps) {
  const tr = useT();
  const play = useSilver((s) => s.play);
  const nextStep = useSilver((s) => s.nextStep);
  const skipItem = useSilver((s) => s.skipItem);
  const exitRun = useSilver((s) => s.exitRun);

  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

  const sceneTitleRef = useRef<HTMLHeadingElement | null>(null);
  const stepRegionRef = useRef<HTMLDivElement | null>(null);
  const prevItemIdRef = useRef<string | null>(null);
  const prevStepKeyRef = useRef<string | null>(null);
  const lockedStepKeyRef = useRef<string | null>(null);
  const sayFullyShownRef = useRef<boolean>(true);
  const revealSayRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    exitHandlerRef.current = () => setExitConfirmOpen(true);
    return () => {
      exitHandlerRef.current = null;
    };
  }, [exitHandlerRef]);

  const itemId = play?.item.id ?? null;
  const stepId = play?.step.id ?? null;
  const stepKey = itemId && stepId ? `${itemId}:${stepId}` : null;

  useEffect(() => {
    if (!itemId) return;
    if (prevItemIdRef.current !== null && prevItemIdRef.current !== itemId) {
      sceneTitleRef.current?.focus();
    }
    prevItemIdRef.current = itemId;
  }, [itemId]);

  useEffect(() => {
    if (!stepKey) return;
    if (prevStepKeyRef.current !== stepKey) {
      lockedStepKeyRef.current = null;
      if (prevStepKeyRef.current !== null) {
        stepRegionRef.current?.focus();
      }
      prevStepKeyRef.current = stepKey;
    }
  }, [stepKey]);

  if (!play) {
    return <EmptyView />;
  }

  const sceneTitle = play.item.scene ? tr(play.item.scene.title) : '';
  const place = play.item.scene?.place ?? '';
  const isLastStep = play.stepIndex + 1 >= play.stepCount;
  const isLocked = lockedStepKeyRef.current === stepKey;

  const handleNextClick = () => {
    if (!play.canContinue || !stepKey) return;
    if (play.step.type === 'say' && !sayFullyShownRef.current && revealSayRef.current) {
      revealSayRef.current();
      return;
    }
    if (lockedStepKeyRef.current === stepKey) return;
    lockedStepKeyRef.current = stepKey;
    nextStep();
  };

  return (
    <div key={play.item.id} className="space-y-4 transition-opacity duration-150 motion-reduce:transition-none">
      {/* Đầu cảnh: tên cảnh, địa điểm, môn, tiến độ */}
      <Panel className="space-y-2.5 !p-3.5 sm:!p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            ref={sceneTitleRef}
            tabIndex={-1}
            className="text-base font-bold text-[#0b3d91] focus:outline-none sm:text-lg"
          >
            {sceneTitle}
          </h2>
          <span className="text-xs font-medium text-slate-600">
            {fmt(tr(ST.sceneN), { i: play.itemIndex + 1, n: play.itemCount })}
          </span>
        </div>

        <div className="flex flex-col gap-2 text-[13px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5 font-medium">
            {place && (
              <span>
                <span aria-hidden="true">📍 </span>
                {place}
              </span>
            )}
            {play.item.courseCode && (
              <span>
                {place ? '· ' : ''}
                {play.item.courseCode}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="min-w-[80px] flex-1 sm:flex-initial">
              <Stepper index={play.stepIndex} count={play.stepCount} />
            </div>
            <span className="shrink-0 font-medium">
              {fmt(tr(ST.stepN), { i: play.stepIndex + 1, n: play.stepCount })}
            </span>
          </div>
        </div>
      </Panel>

      {/* Vùng bước: dùng key = item.id + step.id để xóa trạng thái cục bộ */}
      <div
        key={`${play.item.id}:${play.step.id}`}
        ref={stepRegionRef}
        tabIndex={-1}
        className="focus:outline-none"
      >
        {play.step.type === 'say' && (
          <Say step={play.step} fullyShownRef={sayFullyShownRef} revealRef={revealSayRef} />
        )}
        {play.step.type === 'choice' && <Choice step={play.step} feedback={play.feedback} />}
        {play.step.type === 'slide' && <Slide step={play.step} />}
        {play.step.type !== 'say' && play.step.type !== 'choice' && play.step.type !== 'slide' && (
          <Panel className="mx-auto max-w-2xl text-center">
            <p className="text-[15px] text-slate-600">{play.step.type}</p>
          </Panel>
        )}
      </div>

      {/* Chân màn dính đáy ở điện thoại */}
      <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-lg backdrop-blur-sm sm:px-5 sm:py-3.5">
        <SecondaryButton onClick={() => setSkipConfirmOpen(true)}>
          {tr(ST.skipScene)}
        </SecondaryButton>

        <PrimaryButton
          disabled={!play.canContinue || isLocked}
          onClick={handleNextClick}
        >
          <span>{isLastStep ? tr(ST.finish) : tr(ST.next)}</span>
          <span aria-hidden="true" className="ml-1">
            ›
          </span>
        </PrimaryButton>
      </div>

      <ConfirmDialog
        open={skipConfirmOpen}
        title={tr(ST.skipScene)}
        body={tr(ST.confirmSkip)}
        onCancel={() => setSkipConfirmOpen(false)}
        onConfirm={() => {
          setSkipConfirmOpen(false);
          skipItem();
        }}
      />

      <ConfirmDialog
        open={exitConfirmOpen}
        title={tr(ST.exit)}
        body={tr(ST.confirmExit)}
        onCancel={() => setExitConfirmOpen(false)}
        onConfirm={() => {
          setExitConfirmOpen(false);
          exitRun();
        }}
      />
    </div>
  );
}
