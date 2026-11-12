import { create } from 'zustand';
import { getBuilding } from '../data';

interface CampusState {
  hoveredBuildingId: string | null;
  selectedBuildingId: string | null;
  /** Một tòa nhà có thể có nhiều ngành → panel hiện ngành đang chọn. */
  selectedMajorId: string | null;
  setHovered: (id: string | null) => void;
  /** Chọn tòa nhà, đồng thời chọn ngành đầu tiên của tòa (nếu có). */
  selectBuilding: (id: string) => void;
  selectMajor: (id: string) => void;
  /** Bỏ chọn, quay về góc nhìn tổng quan. */
  clearSelection: () => void;
}

export const useCampusStore = create<CampusState>()((set) => ({
  hoveredBuildingId: null,
  selectedBuildingId: null,
  selectedMajorId: null,
  setHovered: (id) => set({ hoveredBuildingId: id }),
  selectBuilding: (id) => set({ selectedBuildingId: id, selectedMajorId: getBuilding(id)?.majorIds[0] ?? null }),
  selectMajor: (id) => set({ selectedMajorId: id }),
  clearSelection: () => set({ selectedBuildingId: null, selectedMajorId: null }),
}));
