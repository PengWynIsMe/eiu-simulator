import { useEffect, useRef, useState } from 'react';
import { useT } from '../text';
import LangToggle from '../major/LangToggle';
import MuteButton from '../lesson/MuteButton';
import { useSilver } from './adapter';
import { SCREEN_TITLES, ST } from './text';
import Panel from './parts/Panel';
import PrimaryButton from './parts/PrimaryButton';
import SecondaryButton from './parts/SecondaryButton';
import WarningBar from './parts/WarningBar';
import Home from './screens/Home';
import Recap from './screens/Recap';
import Registration from './screens/Registration';
import Week from './screens/Week';
import Play from './screens/Play';
import Transcript from './screens/Transcript';
import Memory from './screens/Memory';
import Notebook from './screens/Notebook';

function SilverOverlay() {
  const tr = useT();
  const screen = useSilver((s) => s.screen);
  const status = useSilver((s) => s.status);
  const saveWarning = useSilver((s) => s.saveWarning);
  const load = useSilver((s) => s.load);
  const close = useSilver((s) => s.close);
  const exitRun = useSilver((s) => s.exitRun);
  const playSceneTitle = useSilver((s) => (s.screen === 'play' ? s.play?.item.scene?.title ?? null : null));

  const [warnDismissed, setWarnDismissed] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const exitHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  // Chặn phím rơi vào cảnh 3D nếu focus vô tình nằm ngoài lớp Silver.
  useEffect(() => {
    const stopOutsideKeys = (e: KeyboardEvent) => {
      const el = overlayRef.current;
      if (!el) return;
      if (!(e.target instanceof Node) || !el.contains(e.target)) {
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', stopOutsideKeys, true);
    window.addEventListener('keyup', stopOutsideKeys, true);
    return () => {
      window.removeEventListener('keydown', stopOutsideKeys, true);
      window.removeEventListener('keyup', stopOutsideKeys, true);
    };
  }, []);

  // Đưa focus vào tiêu đề mỗi khi đổi màn hình.
  useEffect(() => {
    if (screen === 'closed') return;
    headingRef.current?.focus();
  }, [screen, status]);

  if (screen === 'closed') return null;

  const isTopLevel = screen === 'home' || screen === 'notebook';

  const handleExitClick = () => {
    if (isTopLevel) {
      close();
    } else if (exitHandlerRef.current) {
      exitHandlerRef.current();
    } else {
      exitRun();
    }
  };

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="silver-screen-title"
      className="fixed inset-0 z-[60] flex h-[100dvh] flex-col bg-slate-900/70 backdrop-blur-sm"
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Escape' && !e.defaultPrevented) {
          e.preventDefault();
          handleExitClick();
        }
      }}
      onKeyUp={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Thanh trên cố định cao 56px */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/15 bg-[#0b3d91]/95 px-3 text-white shadow-sm sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleExitClick}
            className="inline-flex min-h-[38px] shrink-0 items-center gap-1 rounded-lg bg-white/15 px-2.5 text-sm font-medium text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:px-3"
          >
            <span aria-hidden="true">‹</span>
            <span>{tr(ST.exit)}</span>
          </button>
          <h1
            id="silver-screen-title"
            ref={headingRef}
            tabIndex={-1}
            className="truncate text-base font-bold text-white focus:outline-none sm:text-lg"
          >
            {playSceneTitle ? tr(playSceneTitle) : tr(SCREEN_TITLES[screen])}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LangToggle />
          <MuteButton />
        </div>
      </header>

      {saveWarning && !warnDismissed && (
        <WarningBar warning={saveWarning} onDismiss={() => setWarnDismissed(true)} />
      )}

      <main className="flex-1 overflow-y-auto px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-6">
        <div key={screen} className="mx-auto w-full max-w-4xl transition-opacity duration-150 motion-reduce:transition-none">
          {status === 'loading' && (
            <Panel className="mx-auto max-w-md text-center">
              <div
                aria-hidden="true"
                className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#0b3d91] motion-reduce:animate-none"
              />
              <p className="mt-3 text-[15px] font-medium text-slate-700">{tr(ST.loading)}</p>
            </Panel>
          )}

          {status === 'error' && (
            <Panel className="mx-auto max-w-md text-center">
              <p className="text-[15px] leading-6 text-red-700">{tr(ST.error)}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                <SecondaryButton onClick={close}>{tr(ST.close)}</SecondaryButton>
                <PrimaryButton onClick={() => void load()}>{tr(ST.retryLoad)}</PrimaryButton>
              </div>
            </Panel>
          )}

          {status === 'ready' && (
            <>
              {screen === 'home' && <Home />}
              {screen === 'recap' && <Recap />}
              {screen === 'registration' && <Registration exitHandlerRef={exitHandlerRef} />}
              {screen === 'week' && <Week exitHandlerRef={exitHandlerRef} />}
              {screen === 'play' && <Play exitHandlerRef={exitHandlerRef} />}
              {screen === 'transcript' && <Transcript exitHandlerRef={exitHandlerRef} />}
              {screen === 'memory' && <Memory exitHandlerRef={exitHandlerRef} />}
              {screen === 'notebook' && <Notebook />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/** Lớp phủ toàn màn hình cho chế độ kể chuyện IT Silver. */
export default function SilverLayer() {
  const screen = useSilver((s) => s.screen);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const isOpen = screen !== 'closed';
    if (wasOpenRef.current && !isOpen) {
      const trigger = document.querySelector<HTMLElement>('[data-silver-trigger="true"]');
      trigger?.focus();
    }
    wasOpenRef.current = isOpen;
  }, [screen]);

  if (screen === 'closed') return null;
  return <SilverOverlay />;
}
