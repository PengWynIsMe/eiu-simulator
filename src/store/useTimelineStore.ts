import { create } from 'zustand';
import {
  b8UvToWorld,
  B8_OUTSIDE_ENTRANCE,
  getNextMajorTermId,
  getRoomSpecForStage,
  getTimelinePlan,
  type TimelineStage,
} from '../data/timeline/curriculumPlans';
import type { TermId } from '../types/silver';
import { useExploreStore } from './useExploreStore';
import { useWalkStore } from './useWalkStore';

export type LetterGrade = 'A' | 'B' | 'C' | 'D';

export interface PlacementWrittenScore {
  reading: number;
  listening: number;
  writingPassed: boolean;
}

interface PersistedTimeline {
  selectedMajorId: string;
  active: boolean;
  stage: TimelineStage;
  activeTermId: TermId;
  englishLevel: 1 | 2 | 3 | 4 | 5;
  englishSession: 1 | 2;
  placementWrittenScore: PlacementWrittenScore | null;
  ieltsStatus: 'none' | 'certified-exam' | 'certified-lv5';
  ieltsBand: number | null;
  weekInTerm: number;
  courseGrades: Record<string, LetterGrade>;
  completedMoodleIds: string[];
}

const STORAGE_KEY = 'campussim.timeline.v1';

const DEFAULT_STATE: PersistedTimeline = {
  selectedMajorId: 'ktpm',
  active: false,
  stage: 'placement-written',
  activeTermId: '1.1',
  englishLevel: 1,
  englishSession: 1,
  placementWrittenScore: null,
  ieltsStatus: 'none',
  ieltsBand: null,
  weekInTerm: 1,
  courseGrades: {},
  completedMoodleIds: [],
};

function loadState(): PersistedTimeline {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<PersistedTimeline>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      courseGrades: parsed.courseGrades && typeof parsed.courseGrades === 'object' ? parsed.courseGrades : {},
      completedMoodleIds: Array.isArray(parsed.completedMoodleIds) ? parsed.completedMoodleIds : [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(s: PersistedTimeline): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Bỏ qua nếu trình duyệt chặn storage
  }
}

function extractPersist(s: TimelineState): PersistedTimeline {
  return {
    selectedMajorId: s.selectedMajorId,
    active: s.active,
    stage: s.stage,
    activeTermId: s.activeTermId,
    englishLevel: s.englishLevel,
    englishSession: s.englishSession,
    placementWrittenScore: s.placementWrittenScore,
    ieltsStatus: s.ieltsStatus,
    ieltsBand: s.ieltsBand,
    weekInTerm: s.weekInTerm,
    courseGrades: s.courseGrades,
    completedMoodleIds: s.completedMoodleIds,
  };
}

function guideToB8Outside(): void {
  if (!useWalkStore.getState().walkMode) {
    useWalkStore.setState({ walkMode: true, interior: null, moveInput: { x: 0, y: 0 } });
  }
  useExploreStore.getState().setNavTarget({
    id: 'timeline-b8',
    pos: B8_OUTSIDE_ENTRANCE,
    label: { vi: 'Block 8 (Học Tiếng Anh & Chuyên ngành)', en: 'Block 8 (English & IT Classes)' },
    buildingId: 'b8',
  });
}

interface TimelineState extends PersistedTimeline {
  timelineOpen: boolean;
  phoneOpen: boolean;
  phoneApp: 'home' | 'aao' | 'moodle';
  modalOpen: boolean;
  nearbyMissionTarget: boolean;
  returnStageFromIelts: TimelineStage | null;
  liveSlide: { title: string; body: string; code?: string } | null;
  liveCover: { title: string; subtitle: string };
  desktopMinimized: boolean;

  setTimelineOpen: (open: boolean) => void;
  setPhoneOpen: (open: boolean) => void;
  setPhoneApp: (app: 'home' | 'aao' | 'moodle') => void;
  setModalOpen: (open: boolean) => void;
  setSelectedMajorId: (id: string) => void;
  setNearbyMissionTarget: (near: boolean) => void;
  setLiveSlide: (slide: { title: string; body: string; code?: string } | null, cover?: { title: string; subtitle: string }) => void;
  setDesktopMinimized: (minimized: boolean) => void;
  pauseMission: () => void;

  startFreshman: () => void;
  jumpToMilestone: (opts: { stage: TimelineStage; termId?: TermId; englishLevel?: 1 | 2 | 3 | 4 | 5 }) => void;
  teleportToMissionRoom: () => void;
  triggerCurrentActivity: () => void;

  completePlacementWritten: (score: PlacementWrittenScore) => void;
  completePlacementSpeaking: (assignedLevel: 1 | 2) => void;
  completeEnglishSession: () => void;
  completeEnglishExam: (passed: boolean) => void;
  openIeltsChallenge: () => void;
  completeIeltsExam: (band: number) => void;

  completeMajorTheory: () => void;
  completeMajorLab: () => void;
  completeMajorExam: (termGrades: Record<string, LetterGrade>) => void;
  submitMoodleTask: (taskId: string) => void;
}

const initial = loadState();

export const useTimelineStore = create<TimelineState>()((set, get) => ({
  ...initial,
  timelineOpen: false,
  phoneOpen: false,
  phoneApp: 'home',
  modalOpen: false,
  nearbyMissionTarget: false,
  returnStageFromIelts: null,
  liveSlide: null,
  liveCover: { title: 'EIU · Block 8', subtitle: 'CampusSim Smart Classroom' },
  desktopMinimized: false,

  setTimelineOpen: (timelineOpen) => set({ timelineOpen }),
  setPhoneOpen: (phoneOpen) => set({ phoneOpen }),
  setPhoneApp: (phoneApp) => set({ phoneApp }),
  setModalOpen: (modalOpen) => {
    const cur = get();
    if (!modalOpen && cur.stage === 'ielts-exam' && cur.returnStageFromIelts) {
      set({ modalOpen: false, stage: cur.returnStageFromIelts, returnStageFromIelts: null, liveSlide: null, desktopMinimized: false });
    } else {
      set({ modalOpen, ...(modalOpen ? {} : { liveSlide: null, desktopMinimized: false }) });
    }
  },
  setSelectedMajorId: (selectedMajorId) => {
    set({ selectedMajorId });
    saveState(extractPersist(get()));
  },
  setNearbyMissionTarget: (nearbyMissionTarget) => {
    if (get().nearbyMissionTarget !== nearbyMissionTarget) set({ nearbyMissionTarget });
  },
  setLiveSlide: (liveSlide, cover) =>
    set((s) => ({
      liveSlide,
      liveCover: cover ?? s.liveCover,
    })),
  setDesktopMinimized: (desktopMinimized) => set({ desktopMinimized }),
  pauseMission: () => {
    set({ active: false, modalOpen: false, liveSlide: null, desktopMinimized: false });
    saveState(extractPersist(get()));
  },

  startFreshman: () => {
    set({
      active: true,
      stage: 'placement-written',
      activeTermId: '1.1',
      englishLevel: 1,
      englishSession: 1,
      placementWrittenScore: null,
      weekInTerm: 1,
      timelineOpen: false,
      modalOpen: false,
    });
    saveState(extractPersist(get()));
    guideToB8Outside();
    useExploreStore.getState().showToast({
      vi: 'Nhiệm vụ Tân sinh viên: Đến phòng 206.B8 làm bài Test Tiếng Anh đầu vào!',
      en: 'Fresher Mission: Go to room 206.B8 for your English Placement Test!',
    });
  },

  jumpToMilestone: ({ stage, termId, englishLevel }) => {
    const cur = get();
    const nextLevel = englishLevel ?? cur.englishLevel;
    const nextTerm: TermId =
      termId ??
      (stage === 'graduation'
        ? '5.4'
        : stage === 'major-theory' || stage === 'major-lab' || stage === 'major-exam'
          ? '2.2'
          : stage === 'english-class' || stage === 'english-exam'
            ? (nextLevel === 1 ? '1.1' : nextLevel === 2 ? '1.2' : nextLevel === 3 ? '1.3' : nextLevel === 4 ? '1.4' : '2.1')
            : '1.1');

    const isGrad = stage === 'graduation';
    const isMajor = stage === 'major-theory' || stage === 'major-lab' || stage === 'major-exam';
    set({
      active: true,
      stage,
      activeTermId: nextTerm,
      englishLevel: nextLevel,
      englishSession: 1,
      weekInTerm: stage === 'major-lab' ? 5 : stage === 'major-exam' ? 10 : 1,
      ieltsStatus: isMajor || isGrad ? (cur.ieltsStatus === 'none' ? 'certified-exam' : cur.ieltsStatus) : cur.ieltsStatus,
      ieltsBand: isMajor || isGrad ? (cur.ieltsBand ?? 6.5) : cur.ieltsBand,
      timelineOpen: false,
      modalOpen: isGrad || stage === 'ielts-exam',
    });
    saveState(extractPersist(get()));
    if (!isGrad && stage !== 'ielts-exam') {
      guideToB8Outside();
      const spec = getRoomSpecForStage(stage);
      useExploreStore.getState().showToast({
        vi: `Đã chuyển mốc: ${spec.label.vi}`,
        en: `Jumped to milestone: ${spec.label.en}`,
      });
    }
  },

  teleportToMissionRoom: () => {
    const spec = getRoomSpecForStage(get().stage);
    const [wx, wz] = b8UvToWorld(spec.spawnUv[0], spec.spawnUv[1]);
    // Mặt hướng vào phòng (-V của B8)
    const [bx, bz] = b8UvToWorld(spec.beaconUv[0], spec.beaconUv[1]);
    const yaw = Math.atan2(bz - wz, bx - wx);
    useExploreStore.getState().requestTeleport([wx, wz], yaw, {
      buildingId: spec.buildingId,
      floor: spec.floor,
    });
    useExploreStore.getState().clearNavTarget();
    useExploreStore.getState().showToast({
      vi: `Đã tới ${spec.roomCode} (Tầng ${spec.floor} Block 8)`,
      en: `Arrived at ${spec.roomCode} (Block 8 Floor ${spec.floor})`,
    });
  },

  triggerCurrentActivity: () => {
    const cur = get();
    const spec = getRoomSpecForStage(cur.stage);
    const walkState = useWalkStore.getState();
    const interior = walkState.interior;
    const [bx, bz] = b8UvToWorld(spec.beaconUv[0], spec.beaconUv[1]);
    const distToRoom = Math.hypot(walkState.playerPos.x - bx, walkState.playerPos.z - bz);
    if (
      cur.stage !== 'graduation' &&
      cur.stage !== 'ielts-exam' &&
      (interior?.buildingId !== 'b8' || interior.floor !== spec.floor || distToRoom > 5.0)
    ) {
      cur.teleportToMissionRoom();
    }
    set({ modalOpen: true, desktopMinimized: false });
  },

  completePlacementWritten: (score) => {
    set({
      placementWrittenScore: score,
      stage: 'placement-speaking',
      modalOpen: false,
    });
    saveState(extractPersist(get()));
    useExploreStore.getState().showToast({
      vi: 'Xong 3 kỹ năng! Hãy đi tới mốc sáng phòng 210.B8 nói chuyện 1:1 với Giáo viên (Speaking).',
      en: '3 skills done! Follow the bright beacon to room 210.B8 for your 1-on-1 Speaking interview.',
    });
  },

  completePlacementSpeaking: (assignedLevel) => {
    set({
      englishLevel: assignedLevel,
      activeTermId: assignedLevel === 1 ? '1.1' : '1.2',
      englishSession: 1,
      stage: 'english-class',
      modalOpen: false,
    });
    saveState(extractPersist(get()));
    useExploreStore.getState().showToast({
      vi: `Đã xếp lớp Tiếng Anh Level ${assignedLevel}! Xem thời khóa biểu trên Điện thoại (aao.eiu).`,
      en: `Placed into English Level ${assignedLevel}! Check your timetable on the Phone (aao.eiu).`,
    });
  },

  completeEnglishSession: () => {
    const cur = get();
    if (cur.englishSession === 1) {
      set({ englishSession: 2, modalOpen: false });
      saveState(extractPersist(get()));
      useExploreStore.getState().showToast({
        vi: 'Hoàn thành Buổi 1! Bấm lại để học Buổi 2 chuẩn bị thi cuối kỳ Level.',
        en: 'Session 1 complete! Start Session 2 next before your Level final exam.',
      });
    } else {
      set({ stage: 'english-exam', modalOpen: true });
      saveState(extractPersist(get()));
    }
  },

  completeEnglishExam: (passed) => {
    const cur = get();
    if (!passed) {
      set({ stage: 'english-class', englishSession: 1, modalOpen: false });
      saveState(extractPersist(get()));
      useExploreStore.getState().showToast({
        vi: `Chưa đạt (≥ 2 điểm D). Bạn cần học lại Level ${cur.englishLevel}!`,
        en: `Did not pass (≥ 2 D grades). Retaking Level ${cur.englishLevel}.`,
      });
      return;
    }

    if (cur.englishLevel >= 5) {
      set({
        ieltsStatus: 'certified-lv5',
        ieltsBand: 6.0,
        stage: 'major-theory',
        activeTermId: '2.2',
        weekInTerm: 1,
        modalOpen: false,
      });
      saveState(extractPersist(get()));
      useExploreStore.getState().showToast({
        vi: 'Chúc mừng tốt nghiệp Level 5! Đã được cấp chứng chỉ IELTS 6.0 và vào học chuyên ngành IT!',
        en: 'Completed Level 5! IELTS 6.0 awarded — IT Major courses unlocked!',
      });
    } else {
      const nextLv = (cur.englishLevel + 1) as 1 | 2 | 3 | 4 | 5;
      const nextTerm: TermId = nextLv === 2 ? '1.2' : nextLv === 3 ? '1.3' : nextLv === 4 ? '1.4' : '2.1';
      set({
        englishLevel: nextLv,
        activeTermId: nextTerm,
        englishSession: 1,
        stage: 'english-class',
        modalOpen: false,
      });
      saveState(extractPersist(get()));
      useExploreStore.getState().showToast({
        vi: `Đạt kỳ thi! Đã lên Tiếng Anh Level ${nextLv}.`,
        en: `Passed! Promoted to English Level ${nextLv}.`,
      });
    }
  },

  openIeltsChallenge: () => {
    const cur = get();
    set({
      active: true,
      returnStageFromIelts: cur.stage === 'ielts-exam' ? cur.returnStageFromIelts : cur.stage,
      stage: 'ielts-exam',
      modalOpen: true,
      timelineOpen: false,
    });
  },

  completeIeltsExam: (band) => {
    const cur = get();
    if (band >= 6.0) {
      set({
        ieltsStatus: 'certified-exam',
        ieltsBand: band,
        stage: 'major-theory',
        activeTermId: '2.2',
        weekInTerm: 1,
        modalOpen: false,
      });
      saveState(extractPersist(get()));
      useExploreStore.getState().showToast({
        vi: `Tuyệt vời! Bạn đạt IELTS ${band.toFixed(1)} và chính thức bước vào chuyên ngành IT!`,
        en: `Awesome! IELTS ${band.toFixed(1)} certified — entering IT Major courses!`,
      });
    } else {
      const fallbackTerm: TermId =
        cur.englishLevel === 1 ? '1.1' : cur.englishLevel === 2 ? '1.2' : cur.englishLevel === 3 ? '1.3' : cur.englishLevel === 4 ? '1.4' : '2.1';
      set({
        stage: 'english-class',
        activeTermId: fallbackTerm,
        modalOpen: false,
      });
      saveState(extractPersist(get()));
      useExploreStore.getState().showToast({
        vi: `IELTS đạt ${band.toFixed(1)} (cần ≥ 6.0). Tiếp tục học thêm để thi lại hoặc hoàn tất Level 5.`,
        en: `IELTS ${band.toFixed(1)} (requires ≥ 6.0). Keep studying or retry anytime.`,
      });
    }
  },

  completeMajorTheory: () => {
    set({ stage: 'major-lab', weekInTerm: 5, modalOpen: false });
    saveState(extractPersist(get()));
    useExploreStore.getState().showToast({
      vi: 'Đã xong phần Lý thuyết ở B8! Hãy lên phòng Lab 406.B8 tầng 4 làm thực hành.',
      en: 'Theory done! Head up to Floor 4 Computer Lab (406.B8) for practice.',
    });
  },

  completeMajorLab: () => {
    set({ stage: 'major-exam', weekInTerm: 10, modalOpen: false });
    saveState(extractPersist(get()));
    useExploreStore.getState().showToast({
      vi: 'Hoàn thành Lab Tuần 10! Đã mở bài thi cuối kỳ học phần.',
      en: 'Week 10 Lab completed! Term Final Exam is now ready.',
    });
  },

  completeMajorExam: (termGrades) => {
    const cur = get();
    const mergedGrades = { ...cur.courseGrades, ...termGrades };
    const nextTerm = getNextMajorTermId(cur.activeTermId);
    const planObj = getTimelinePlan(cur.selectedMajorId);
    const nextTermObj = planObj.terms.find((t) => t.termId === nextTerm);
    if (!nextTermObj || nextTermObj.phase === 'graduation') {
      set({
        courseGrades: mergedGrades,
        activeTermId: '5.4',
        stage: 'graduation',
        modalOpen: true,
      });
    } else {
      set({
        courseGrades: mergedGrades,
        activeTermId: nextTerm,
        weekInTerm: 1,
        stage: 'major-theory',
        modalOpen: false,
      });
      useExploreStore.getState().showToast({
        vi: `Đã hoàn tất học kỳ ${cur.activeTermId}! Chuyển sang học kỳ ${nextTerm}.`,
        en: `Term ${cur.activeTermId} complete! Moving to Term ${nextTerm}.`,
      });
    }
    saveState(extractPersist(get()));
  },

  submitMoodleTask: (taskId) => {
    const cur = get();
    if (cur.completedMoodleIds.includes(taskId)) return;
    set({ completedMoodleIds: [...cur.completedMoodleIds, taskId] });
    saveState(extractPersist(get()));
    useExploreStore.getState().showToast({
      vi: 'Đã nộp bài tập lên Moodle thành công!',
      en: 'Moodle assignment submitted!',
    });
  },
}));
