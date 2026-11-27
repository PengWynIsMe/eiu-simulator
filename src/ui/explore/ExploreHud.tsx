import { useEffect } from 'react';
import { useExploreStore } from '../../store/useExploreStore';
import { useActivityStore } from '../../store/useActivityStore';
import { useLessonStore } from '../../store/useLessonStore';
import { useReviewStore } from '../../store/useReviewStore';
import { useSilver } from '../silver/adapter';
import { setAmbientMusicEnabled } from '../audio/ambientMusic';
import Minimap from './Minimap';
import CompassBar from './CompassBar';
import ControlStack from './ControlStack';
import ContextActionPill from './ContextActionPill';
import ShuttleHud from './ShuttleHud';
import CampusMapModal from './CampusMapModal';
import PoiDetailCard from './PoiDetailCard';
import CampusQuizModal from './CampusQuizModal';
import BikePickerModal from './BikePickerModal';
import NoticeBoardModal from './NoticeBoardModal';
import PhotoModal from './PhotoModal';

export default function ExploreHud() {
  const reviewMode = useReviewStore((s) => s.reviewMode);
  const silverScreen = useSilver((s) => s.screen);
  const activity = useActivityStore((s) => s.activity);
  const phase = useActivityStore((s) => s.phase);
  const screenOpen = useActivityStore((s) => s.screenOpen);
  const lessonPhase = useLessonStore((s) => s.phase);
  const musicEnabled = useExploreStore((s) => s.musicEnabled);

  const isEngaged = Boolean(activity && (phase === 'engaged' || screenOpen));
  const isLessonEngaged = lessonPhase !== 'idle' && lessonPhase !== 'goToClass' && lessonPhase !== 'findSeat';
  const isStudying = isEngaged || isLessonEngaged;

  useEffect(() => {
    setAmbientMusicEnabled(musicEnabled);
  }, [musicEnabled]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]')) return;

      const key = e.key.toLowerCase();
      if (key === 'm' && !e.repeat) {
        if (silverScreen === 'closed' && !isStudying && !reviewMode) {
          useExploreStore.getState().toggleMapOpen();
        }
        return;
      }

      if (e.key !== 'Escape') return;
      const es = useExploreStore.getState();
      if (es.capturedPhotoUrl) {
        es.clearCapturedPhoto();
        e.stopImmediatePropagation();
      } else if (es.mapOpen) {
        es.setMapOpen(false);
        e.stopImmediatePropagation();
      } else if (es.activePoiId) {
        es.closePoi();
        e.stopImmediatePropagation();
      } else if (es.quizOpen) {
        es.setQuizOpen(false);
        e.stopImmediatePropagation();
      } else if (es.bikeModalOpen) {
        es.setBikeModalOpen(false);
        e.stopImmediatePropagation();
      } else if (es.noticeBoardOpen) {
        es.setNoticeBoardOpen(false);
        e.stopImmediatePropagation();
      } else if (es.shuttleActive) {
        es.exitShuttle();
        e.stopImmediatePropagation();
      } else if (es.seatedBenchIndex !== null) {
        es.standUpBench();
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [silverScreen, isStudying, reviewMode]);

  if (reviewMode || silverScreen !== 'closed' || isStudying) return null;

  return (
    <>
      <Minimap />
      <CompassBar />
      <ControlStack />
      <ContextActionPill />
      <ShuttleHud />
      <CampusMapModal />
      <PoiDetailCard />
      <CampusQuizModal />
      <BikePickerModal />
      <NoticeBoardModal />
      <PhotoModal />
    </>
  );
}
