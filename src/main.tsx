import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { b11ToWorld } from './scene/interior/layouts/b11';
import { toWorld } from './scene/silver/frame';
import { startLessonBridge } from './silverWorld/lessonBridge';
import { startDirector } from './silverWorld/director';
import { useSilverStore } from './store/useSilverStore';
import { useActivityStore } from './store/useActivityStore';
import { useWalkStore } from './store/useWalkStore';
import { isSubscribableSilver, isWorldActive } from './ui/silverWorld/directorBridge';
import './index.css';

startLessonBridge(b11ToWorld);

const silverCandidate: unknown = useSilverStore;
if (!isSubscribableSilver(silverCandidate)) {
  throw new Error('useSilverStore does not implement SubscribableSilverStore');
}
const silverStore = silverCandidate;

let stopDirector: (() => void) | null = null;
const syncDirector = () => {
  const s = silverStore.getState();
  const sceneId = s.screen === 'play' ? s.play?.item.scene?.id ?? s.play?.item.id ?? null : null;
  const worldActive = isWorldActive(s.screen, sceneId);

  if (worldActive && !stopDirector) {
    stopDirector = startDirector({
      silver: silverStore,
      activity: useActivityStore,
      walk: useWalkStore,
      toWorld,
    });
  } else if (!worldActive && stopDirector) {
    stopDirector();
    stopDirector = null;
    const act = useActivityStore.getState().activity;
    if (act?.source === 'silver') {
      useActivityStore.getState().end();
    }
  }
};

silverStore.subscribe(syncDirector);
syncDirector();

// Chỉ chạy ở `npm run dev`: lộ store + renderer để kiểm tay / đo draw call bằng eval trong trình duyệt (build thật không có).
if (import.meta.env.DEV) {
  void Promise.all([
    import('./store/useCampusStore'),
    import('./store/useWalkStore'),
    import('./store/useLessonStore'),
    import('./store/useSnowStore'),
    import('./store/useLangStore'),
  ]).then(([campus, walk, lesson, snow, lang]) => {
    (window as unknown as Record<string, unknown>).__stores = {
      campus: campus.useCampusStore,
      walk: walk.useWalkStore,
      lesson: lesson.useLessonStore,
      snow: snow.useSnowStore,
      lang: lang.useLangStore,
    };
  });
}

const root = document.getElementById('root');
if (!root) throw new Error('Không tìm thấy #root');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
