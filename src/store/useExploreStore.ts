import { create } from 'zustand';
import { getPoi, type BikeStyleId } from '../data/explore';
import { useCampusStore } from './useCampusStore';
import { useWalkStore } from './useWalkStore';
import type { LocalizedText, Vec2 } from '../types';

const DISCOVERED_KEY = 'campussim.discoveredPois';

function loadDiscoveredPois(): string[] {
  try {
    const raw = localStorage.getItem(DISCOVERED_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && getPoi(id) !== undefined);
  } catch {
    return [];
  }
}

function saveDiscoveredPois(ids: string[]): void {
  try {
    localStorage.setItem(DISCOVERED_KEY, JSON.stringify(ids));
  } catch {
    // Bỏ qua khi storage bị chặn
  }
}

export type MoveMode = 'walk' | 'run' | 'bike';

export interface NavTarget {
  id: string;
  pos: Vec2;
  label: LocalizedText;
  buildingId?: string;
}

export interface TeleportRequest {
  id: number;
  pos: Vec2;
  yaw?: number;
  interior?: { buildingId: string; floor: number } | null;
}

export interface ToastNotice {
  id: number;
  text: LocalizedText;
}

interface ExploreState {
  navTarget: NavTarget | null;
  setNavTarget: (target: NavTarget) => void;
  clearNavTarget: () => void;

  teleportReq: TeleportRequest | null;
  requestTeleport: (pos: Vec2, yaw?: number, interior?: { buildingId: string; floor: number } | null) => void;

  playerYaw: number;
  setPlayerYaw: (yaw: number) => void;

  droneView: boolean;
  toggleDroneView: () => void;
  setDroneView: (v: boolean) => void;

  moveMode: MoveMode;
  setMoveMode: (mode: MoveMode) => void;

  bikeStyle: BikeStyleId;
  bikeColor: string;
  bikeModalOpen: boolean;
  setBikeStyle: (style: BikeStyleId) => void;
  setBikeColor: (color: string) => void;
  setBikeModalOpen: (open: boolean) => void;

  mapOpen: boolean;
  setMapOpen: (open: boolean) => void;
  toggleMapOpen: () => void;

  discoveredPoiIds: string[];
  nearbyPoiId: string | null;
  activePoiId: string | null;
  discoverPoi: (id: string) => boolean;
  openPoi: (id: string) => void;
  closePoi: () => void;
  setNearbyPoi: (id: string | null) => void;

  quizOpen: boolean;
  quizAnswers: Record<string, number>;
  setQuizOpen: (open: boolean) => void;
  answerQuiz: (questionId: string, optionIndex: number) => void;
  resetQuiz: () => void;

  nearbyBenchIndex: number | null;
  seatedBenchIndex: number | null;
  setNearbyBench: (index: number | null) => void;
  sitOnBench: (index: number) => void;
  standUpBench: () => void;

  nearbyNoticeBoard: boolean;
  noticeBoardOpen: boolean;
  setNearbyNoticeBoard: (near: boolean) => void;
  setNoticeBoardOpen: (open: boolean) => void;

  shuttleActive: boolean;
  shuttleSpeed: 1 | 4;
  shuttleCam: 'third' | 'first';
  shuttleT: number;
  shuttleSkipReq: number;
  shuttleNarration: { title: LocalizedText; text: LocalizedText } | null;
  nearbyShuttle: boolean;
  boardShuttle: () => void;
  exitShuttle: () => void;
  toggleShuttleSpeed: () => void;
  toggleShuttleCam: () => void;
  skipShuttleNextStop: () => void;
  setShuttleTelemetry: (t: number, narration: { title: LocalizedText; text: LocalizedText } | null) => void;
  setNearbyShuttle: (near: boolean) => void;

  photoRequestId: number;
  capturedPhotoUrl: string | null;
  requestPhoto: () => void;
  setCapturedPhoto: (url: string) => void;
  clearCapturedPhoto: () => void;

  musicEnabled: boolean;
  toggleMusic: () => void;
  setMusicEnabled: (enabled: boolean) => void;

  toast: ToastNotice | null;
  showToast: (text: LocalizedText) => void;
  clearToast: () => void;
}

let nextTeleportSeq = 1;
let nextToastSeq = 1;

export const useExploreStore = create<ExploreState>()((set, get) => ({
  navTarget: null,
  setNavTarget: (navTarget) => set({ navTarget }),
  clearNavTarget: () => set({ navTarget: null }),

  teleportReq: null,
  requestTeleport: (pos, yaw, interior = null) => {
    useCampusStore.getState().clearSelection();
    useWalkStore.setState({ walkMode: true, interior, moveInput: { x: 0, y: 0 } });
    set({
      teleportReq: { id: nextTeleportSeq++, pos: [pos[0], pos[1]], yaw, interior },
      shuttleActive: false,
      seatedBenchIndex: null,
      droneView: false,
      mapOpen: false,
    });
  },

  playerYaw: Math.PI,
  setPlayerYaw: (playerYaw) => set({ playerYaw }),

  droneView: false,
  toggleDroneView: () => set((s) => ({ droneView: !s.droneView })),
  setDroneView: (droneView) => set({ droneView }),

  moveMode: 'walk',
  setMoveMode: (moveMode) => set({ moveMode }),

  bikeStyle: 'city',
  bikeColor: '#0ea5e9',
  bikeModalOpen: false,
  setBikeStyle: (bikeStyle) => set({ bikeStyle }),
  setBikeColor: (bikeColor) => set({ bikeColor }),
  setBikeModalOpen: (bikeModalOpen) => set({ bikeModalOpen }),

  mapOpen: false,
  setMapOpen: (mapOpen) => set({ mapOpen }),
  toggleMapOpen: () => set((s) => ({ mapOpen: !s.mapOpen })),

  discoveredPoiIds: loadDiscoveredPois(),
  nearbyPoiId: null,
  activePoiId: null,
  discoverPoi: (id) => {
    const cur = get().discoveredPoiIds;
    if (cur.includes(id)) return false;
    const next = [...cur, id];
    saveDiscoveredPois(next);
    set({ discoveredPoiIds: next });
    return true;
  },
  openPoi: (id) => {
    get().discoverPoi(id);
    set({ activePoiId: id });
  },
  closePoi: () => set({ activePoiId: null }),
  setNearbyPoi: (nearbyPoiId) => {
    if (get().nearbyPoiId !== nearbyPoiId) set({ nearbyPoiId });
  },

  quizOpen: false,
  quizAnswers: {},
  setQuizOpen: (quizOpen) => set({ quizOpen }),
  answerQuiz: (questionId, optionIndex) =>
    set((s) => ({
      quizAnswers: questionId in s.quizAnswers ? s.quizAnswers : { ...s.quizAnswers, [questionId]: optionIndex },
    })),
  resetQuiz: () => set({ quizAnswers: {} }),

  nearbyBenchIndex: null,
  seatedBenchIndex: null,
  setNearbyBench: (nearbyBenchIndex) => {
    if (get().nearbyBenchIndex !== nearbyBenchIndex) set({ nearbyBenchIndex });
  },
  sitOnBench: (seatedBenchIndex) => set({ seatedBenchIndex, moveMode: 'walk', droneView: false }),
  standUpBench: () => set({ seatedBenchIndex: null }),

  nearbyNoticeBoard: false,
  noticeBoardOpen: false,
  setNearbyNoticeBoard: (nearbyNoticeBoard) => {
    if (get().nearbyNoticeBoard !== nearbyNoticeBoard) set({ nearbyNoticeBoard });
  },
  setNoticeBoardOpen: (noticeBoardOpen) => set({ noticeBoardOpen }),

  shuttleActive: false,
  shuttleSpeed: 1,
  shuttleCam: 'third',
  shuttleT: 0.02,
  shuttleSkipReq: 0,
  shuttleNarration: null,
  nearbyShuttle: false,
  boardShuttle: () => {
    useCampusStore.getState().clearSelection();
    useWalkStore.setState({ walkMode: true, interior: null, moveInput: { x: 0, y: 0 } });
    set({
      shuttleActive: true,
      seatedBenchIndex: null,
      droneView: false,
      mapOpen: false,
      noticeBoardOpen: false,
    });
  },
  exitShuttle: () => set({ shuttleActive: false }),
  toggleShuttleSpeed: () => set((s) => ({ shuttleSpeed: s.shuttleSpeed === 1 ? 4 : 1 })),
  toggleShuttleCam: () => set((s) => ({ shuttleCam: s.shuttleCam === 'third' ? 'first' : 'third' })),
  skipShuttleNextStop: () => set((s) => ({ shuttleSkipReq: s.shuttleSkipReq + 1 })),
  setShuttleTelemetry: (shuttleT, shuttleNarration) => set({ shuttleT, shuttleNarration }),
  setNearbyShuttle: (nearbyShuttle) => {
    if (get().nearbyShuttle !== nearbyShuttle) set({ nearbyShuttle });
  },

  photoRequestId: 0,
  capturedPhotoUrl: null,
  requestPhoto: () => set((s) => ({ photoRequestId: s.photoRequestId + 1 })),
  setCapturedPhoto: (capturedPhotoUrl) => set({ capturedPhotoUrl }),
  clearCapturedPhoto: () => set({ capturedPhotoUrl: null }),

  musicEnabled: false,
  toggleMusic: () => set((s) => ({ musicEnabled: !s.musicEnabled })),
  setMusicEnabled: (musicEnabled) => set({ musicEnabled }),

  toast: null,
  showToast: (text) => set({ toast: { id: nextToastSeq++, text } }),
  clearToast: () => set({ toast: null }),
}));
