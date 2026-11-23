import type { ReactNode } from 'react';
import { getLesson } from '../../data';
import { getCurrentStep, useLessonStore } from '../../store/useLessonStore';
import { TEXT } from '../text';
import CodeLab from './CodeLab';
import DesktopView, { type DesktopLabels } from './DesktopView';

const LABELS: DesktopLabels = {
  loginStudentId: TEXT.desktopLoginStudentId,
  loginPassword: TEXT.desktopLoginPassword,
  loginBtn: TEXT.desktopLoginBtn,
  loggingIn: TEXT.desktopLoggingIn,
  studentName: TEXT.desktopStudentName,
  codeLabApp: TEXT.desktopCodeLab,
  slidesApp: TEXT.desktopSlides,
  trashApp: TEXT.desktopTrash,
  trashEmpty: TEXT.desktopTrashEmpty,
  noLecture: TEXT.desktopNoLecture,
  slideLabel: TEXT.lessonSlideLabel,
  minimize: TEXT.desktopMinimize,
  close: TEXT.desktopClose,
  hideTip: TEXT.desktopHideTip,
};

/**
 * Máy tính ảo toàn màn hình. Luôn mount suốt pha bài tập (ẩn bằng `open`) để giữ trạng thái
 * đăng nhập + code đang gõ khi người chơi bấm Esc rồi mở lại.
 */
export default function EiuDesktop({ open, exitSlot }: { open: boolean; exitSlot: ReactNode }) {
  const lessonId = useLessonStore((s) => s.lessonId);
  const step = useLessonStore(getCurrentStep);
  const lecture = (lessonId ? getLesson(lessonId) : undefined)?.steps.find((s) => s.type === 'lecture');
  const slides = lecture?.type === 'lecture' ? lecture.slides : undefined;

  return (
    <div className={`fixed inset-0 z-50 items-center justify-center bg-black/65 sm:p-[4%] ${open ? 'flex' : 'hidden'}`}>
      <DesktopView
        labels={LABELS}
        exitSlot={exitSlot}
        slides={slides}
        codeContent={step?.type === 'exercise' ? <CodeLab key={step.id} step={step} /> : null}
      />
    </div>
  );
}
