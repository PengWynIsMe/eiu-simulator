import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { b11ToWorld } from './scene/interior/layouts/b11';
import { startLessonBridge } from './silverWorld/lessonBridge';
import './index.css';

startLessonBridge(b11ToWorld);

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
