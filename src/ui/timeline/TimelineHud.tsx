import { useEffect } from 'react';
import { useTimelineStore } from '../../store/useTimelineStore';
import { useActivityStore } from '../../store/useActivityStore';
import { useLessonStore } from '../../store/useLessonStore';
import { useReviewStore } from '../../store/useReviewStore';
import { useSilver } from '../silver/adapter';
import TimelineMenuModal from './TimelineMenuModal';
import StudentPhone from './StudentPhone';
import MissionTrackerCard from './MissionTrackerCard';
import EnglishActivityModal from './EnglishActivityModal';
import MajorActivityModal from './MajorActivityModal';

export default function TimelineHud() {
  const reviewMode = useReviewStore((s) => s.reviewMode);
  const silverScreen = useSilver((s) => s.screen);
  const activity = useActivityStore((s) => s.activity);
  const phase = useActivityStore((s) => s.phase);
  const screenOpen = useActivityStore((s) => s.screenOpen);
  const lessonPhase = useLessonStore((s) => s.phase);

  const isEngaged = Boolean(activity && (phase === 'engaged' || screenOpen));
  const isLessonEngaged = lessonPhase !== 'idle' && lessonPhase !== 'goToClass' && lessonPhase !== 'findSeat';
  const isStudying = isEngaged || isLessonEngaged;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const ts = useTimelineStore.getState();
      if (ts.modalOpen) {
        if (ts.stage === 'major-lab' && !ts.desktopMinimized) {
          ts.setDesktopMinimized(true);
        } else {
          ts.setModalOpen(false);
        }
        e.stopImmediatePropagation();
      } else if (ts.timelineOpen) {
        ts.setTimelineOpen(false);
        e.stopImmediatePropagation();
      } else if (ts.phoneOpen) {
        ts.setPhoneOpen(false);
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

  if (reviewMode || silverScreen !== 'closed' || isStudying) return null;

  return (
    <>
      <StudentPhone />
      <MissionTrackerCard />
      <TimelineMenuModal />
      <EnglishActivityModal />
      <MajorActivityModal />
    </>
  );
}
