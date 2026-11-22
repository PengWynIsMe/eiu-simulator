import { useEffect, useState, type ReactNode } from 'react';
import { getLesson } from '../../data';
import { getCurrentStep, useLessonStore } from '../../store/useLessonStore';
import { TEXT } from '../text';
import CodeBlock from './CodeBlock';
import CodeLab from './CodeLab';

type AppId = 'code' | 'slides' | 'trash';

const APP_LABEL: Record<AppId, string> = {
  code: TEXT.desktopCodeLab,
  slides: TEXT.desktopSlides,
  trash: TEXT.desktopTrash,
};
const APP_ICON: Record<AppId, string> = { code: '🖥', slides: '📑', trash: '🗑' };
const APPS: AppId[] = ['code', 'slides', 'trash'];

const clock = () => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });

function LoginScreen({ onDone }: { onDone: () => void }) {
  const [studentId] = useState(() => `EIU2026${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!busy) return;
    const id = window.setTimeout(onDone, 600);
    return () => window.clearTimeout(id);
  }, [busy, onDone]);

  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#0b3d91] via-blue-600 to-sky-400 p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
        }}
        className="w-full max-w-xs space-y-3 rounded-2xl bg-white/15 p-5 text-white shadow-xl backdrop-blur-md"
      >
        <div className="text-center text-2xl font-bold tracking-wide">EIU</div>
        <label className="block text-xs">
          {TEXT.desktopLoginStudentId}
          <input
            readOnly
            value={studentId}
            className="mt-1 w-full rounded-lg bg-white/90 px-3 py-2 text-sm text-slate-800 outline-none"
          />
        </label>
        <label className="block text-xs">
          {TEXT.desktopLoginPassword}
          <input
            readOnly
            type="password"
            value="123456"
            className="mt-1 w-full rounded-lg bg-white/90 px-3 py-2 text-sm text-slate-800 outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="min-h-[44px] w-full rounded-lg bg-[#f5b700] text-sm font-semibold text-slate-900 hover:brightness-105 disabled:opacity-70"
        >
          {busy ? TEXT.desktopLoggingIn : TEXT.desktopLoginBtn}
        </button>
      </form>
    </div>
  );
}

/** Cửa sổ "Bài giảng": xem lại slide, chỉ đọc. */
function SlidesApp() {
  const lessonId = useLessonStore((s) => s.lessonId);
  const [index, setIndex] = useState(0);
  const lecture = (lessonId ? getLesson(lessonId) : undefined)?.steps.find((s) => s.type === 'lecture');
  if (lecture?.type !== 'lecture' || lecture.slides.length === 0) {
    return <p className="p-4 text-sm text-slate-400">{TEXT.desktopNoLecture}</p>;
  }
  const slide = lecture.slides[Math.min(index, lecture.slides.length - 1)];
  if (!slide) return null;
  return (
    <div className="h-full space-y-3 overflow-y-auto bg-white p-4">
      <h3 className="text-lg font-bold text-[#0b3d91]">{slide.title}</h3>
      {slide.code && <CodeBlock code={slide.code} />}
      <p className="text-sm leading-6 text-slate-700">{slide.body}</p>
      <div className="flex items-center gap-2">
        {lecture.slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${TEXT.lessonSlideLabel} ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-3 w-3 rounded-full ${i === index ? 'bg-[#0b3d91]' : 'bg-slate-300'}`}
          />
        ))}
      </div>
    </div>
  );
}

function Window({ title, onMinimize, onClose, children }: { title: string; onMinimize: () => void; onClose: () => void; children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-900">
      <div className="flex items-center justify-between bg-slate-700 px-3 py-1.5 text-xs text-slate-100">
        <span className="font-medium">{title}</span>
        <span className="flex gap-1">
          <button type="button" onClick={onMinimize} title={TEXT.desktopMinimize} className="h-6 w-7 rounded hover:bg-slate-600">
            –
          </button>
          <button type="button" onClick={onClose} title={TEXT.desktopClose} className="h-6 w-7 rounded hover:bg-red-600">
            ×
          </button>
        </span>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

/**
 * Máy tính ảo toàn màn hình. Luôn mount suốt pha bài tập (ẩn bằng `open`) để giữ trạng thái
 * đăng nhập + code đang gõ khi người chơi bấm Esc rồi mở lại.
 */
export default function EiuDesktop({ open, exitSlot }: { open: boolean; exitSlot: ReactNode }) {
  const step = useLessonStore(getCurrentStep);
  const [loggedIn, setLoggedIn] = useState(false);
  const [opened, setOpened] = useState<AppId[]>(['code']);
  const [active, setActive] = useState<AppId | null>('code');
  const [time, setTime] = useState(clock);

  useEffect(() => {
    const id = window.setInterval(() => setTime(clock()), 15000);
    return () => window.clearInterval(id);
  }, []);

  const openApp = (app: AppId) => {
    setOpened((list) => (list.includes(app) ? list : [...list, app]));
    setActive(app);
  };
  const closeApp = (app: AppId) => {
    setOpened((list) => list.filter((a) => a !== app));
    setActive((a) => (a === app ? null : a));
  };

  let body: ReactNode;
  if (!loggedIn) {
    body = <LoginScreen onDone={() => setLoggedIn(true)} />;
  } else if (active) {
    body = (
      <Window title={APP_LABEL[active]} onMinimize={() => setActive(null)} onClose={() => closeApp(active)}>
        {active === 'code' && (step?.type === 'exercise' ? <CodeLab key={step.id} step={step} /> : null)}
        {active === 'slides' && <SlidesApp />}
        {active === 'trash' && <p className="p-4 text-sm text-slate-400">{TEXT.desktopTrashEmpty}</p>}
      </Window>
    );
  } else {
    body = (
      <div className="flex h-full flex-wrap content-start gap-4 bg-gradient-to-br from-[#0b3d91] via-blue-600 to-sky-400 p-5">
        {APPS.map((app) => (
          <button
            key={app}
            type="button"
            onClick={() => openApp(app)}
            className="flex w-20 flex-col items-center gap-1 rounded-lg p-2 text-white hover:bg-white/15"
          >
            <span className="text-3xl">{APP_ICON[app]}</span>
            <span className="text-center text-xs">{APP_LABEL[app]}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 items-center justify-center bg-black/65 sm:p-[4%] ${open ? 'flex' : 'hidden'}`}>
      <div className="flex h-full w-full flex-col overflow-hidden bg-black shadow-2xl sm:rounded-2xl sm:border-[10px] sm:border-black">
        <div className="min-h-0 flex-1 sm:rounded-lg sm:overflow-hidden">{body}</div>
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 text-xs text-slate-200">
          <button type="button" onClick={() => setActive(null)} className="rounded bg-[#0b3d91] px-2 py-1 font-bold text-white">
            EIU
          </button>
          {loggedIn &&
            opened.map((app) => (
              <button
                key={app}
                type="button"
                onClick={() => setActive(app)}
                className={`rounded px-2 py-1 ${active === app ? 'bg-slate-700' : 'hover:bg-slate-800'}`}
              >
                {APP_ICON[app]} <span className="hidden sm:inline">{APP_LABEL[app]}</span>
              </button>
            ))}
          <span className="ml-auto hidden text-slate-500 md:inline">{TEXT.desktopHideTip}</span>
          {exitSlot}
          <span className="hidden sm:inline">{TEXT.desktopStudentName}</span>
          <span className="tabular-nums">{time}</span>
        </div>
      </div>
    </div>
  );
}
