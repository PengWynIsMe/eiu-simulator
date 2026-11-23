import { useT } from '../../text';
import { ST } from '../text';
import { useSilver } from '../adapter';
import Panel from './Panel';
import SecondaryButton from './SecondaryButton';

interface EmptyViewProps {
  message?: string;
  showHomeButton?: boolean;
}

/** Thẻ thông báo khi màn hình không có dữ liệu để hiển thị. */
export default function EmptyView({ message, showHomeButton = true }: EmptyViewProps) {
  const tr = useT();
  const openHome = useSilver((s) => s.openHome);

  return (
    <Panel className="mx-auto max-w-md text-center">
      <p className="text-[15px] leading-6 text-slate-600">{message ?? tr(ST.nothing)}</p>
      {showHomeButton && (
        <div className="mt-4 flex justify-center">
          <SecondaryButton onClick={openHome}>{tr(ST.home)}</SecondaryButton>
        </div>
      )}
    </Panel>
  );
}
