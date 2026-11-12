import { create } from 'zustand';
import type { ReviewCategory, ReviewNote, Vec3 } from '../types';
import { getBuilding } from '../data';
import { canWriteRepoFile, issueUrlFor, loadAuthor, loadGithubNotes, loadNotes, mergeNoteSources, newNoteId, saveAuthor, saveNotes } from '../data/reviewNotes';

/** Góc camera: vị trí + điểm nhìn (mét). */
export interface CameraPose {
  position: Vec3;
  target: Vec3;
}

/** Chỗ người dùng vừa bấm trong chế độ góp ý, chờ nhập nội dung. */
export interface ReviewDraft {
  targetId: string | null;
  point: Vec3;
  camera: CameraPose;
}

interface ReviewState {
  reviewMode: boolean;
  notes: ReviewNote[];
  loaded: boolean;
  /** Lỗi lưu/đọc gần nhất (hiện cho người dùng), null nếu ổn. */
  error: string | null;
  draft: ReviewDraft | null;
  selectedNoteId: string | null;
  author: string;
  toggleReviewMode: () => void;
  /** Gọi khi app mở và khi bấm "Tải lại": đọc ghi chú cục bộ + Issue góp ý trên GitHub. */
  load: () => Promise<void>;
  setDraft: (draft: ReviewDraft | null) => void;
  /** Lưu draft thành ghi chú. Trên bản GitHub Pages còn mở trang tạo Issue điền sẵn để cả nhóm cùng thấy. */
  submitDraft: (category: ReviewCategory, text: string) => void;
  /** Ghi chú từ GitHub (`source: 'github'`) không đổi/xóa được trong app — làm trên trang Issue. */
  setNoteStatus: (id: string, status: ReviewNote['status']) => void;
  deleteNote: (id: string) => void;
  /** Thay toàn bộ danh sách (vd sau khi gộp file của đồng nghiệp). */
  replaceNotes: (notes: ReviewNote[]) => void;
  selectNote: (id: string | null) => void;
  setAuthor: (name: string) => void;
  /**
   * "Hộp thư" cho camera: UI (ngoài Canvas) gửi yêu cầu bay tới một góc nhìn,
   * scene/CameraRig nhận, gọi controls.setLookAt(..., true) rồi clearCameraRequest().
   */
  cameraRequest: CameraPose | null;
  requestCamera: (pose: CameraPose) => void;
  clearCameraRequest: () => void;
}

export const useReviewStore = create<ReviewState>()((set, get) => {
  // Chỉ lưu ghi chú cục bộ; ghi chú GitHub luôn đọc lại từ GitHub.
  const persist = (notes: ReviewNote[]) => {
    set({ notes });
    saveNotes(notes.filter((n) => n.source !== 'github')).then(
      () => set({ error: null }),
      (err: unknown) => set({ error: String(err) }),
    );
  };

  return {
    reviewMode: false,
    notes: [],
    loaded: false,
    error: null,
    draft: null,
    selectedNoteId: null,
    author: loadAuthor(),
    toggleReviewMode: () => set((s) => ({ reviewMode: !s.reviewMode, draft: null })),
    load: async () => {
      const [local, github] = await Promise.allSettled([loadNotes(), loadGithubNotes()]);
      const errors = [local, github].flatMap((r) => (r.status === 'rejected' ? [String(r.reason)] : []));
      set({
        notes: mergeNoteSources(local.status === 'fulfilled' ? local.value : [], github.status === 'fulfilled' ? github.value : []),
        loaded: true,
        error: errors.length ? errors.join(' · ') : null,
      });
    },
    setDraft: (draft) => set({ draft, selectedNoteId: null }),
    submitDraft: (category, text) => {
      const { draft, author, notes } = get();
      if (!draft || text.trim() === '') return;
      const note: ReviewNote = {
        id: newNoteId(),
        createdAt: new Date().toISOString(),
        author: author.trim() || 'Ẩn danh',
        targetId: draft.targetId,
        point: draft.point,
        camera: draft.camera,
        category,
        text: text.trim(),
        status: 'mo',
      };
      set({ draft: null });
      persist([...notes, note]);
      if (!canWriteRepoFile) {
        const name = draft.targetId ? (getBuilding(draft.targetId)?.name ?? draft.targetId) : 'Ghim trên mặt đất';
        window.open(issueUrlFor(note, name), '_blank', 'noopener');
      }
    },
    setNoteStatus: (id, status) =>
      persist(get().notes.map((n) => (n.id === id && n.source !== 'github' ? { ...n, status } : n))),
    deleteNote: (id) => persist(get().notes.filter((n) => n.id !== id || n.source === 'github')),
    replaceNotes: (notes) => persist(notes),
    selectNote: (id) => set({ selectedNoteId: id, draft: null }),
    setAuthor: (name) => {
      saveAuthor(name);
      set({ author: name });
    },
    cameraRequest: null,
    requestCamera: (pose) => set({ cameraRequest: pose }),
    clearCameraRequest: () => set({ cameraRequest: null }),
  };
});
