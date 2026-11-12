// File GẮN KẾT do Claude giữ — các luồng song song KHÔNG sửa file này (đề xuất trong báo cáo nếu cần).
import Environment from './Environment';
import Ground from './Ground';
import Trees from './Trees';
import Building from './Building';
import Zone1 from './zone1/Zone1';
import CameraRig from './CameraRig';
import ReviewPins from './ReviewPins';
import WalkMode from './walk/WalkMode';
import { campus } from '../data';
import { useWalkStore } from '../store/useWalkStore';

export default function Campus() {
  const { buildings } = campus;
  const walkMode = useWalkStore((s) => s.walkMode);

  return (
    <>
      <Environment />
      <Ground />
      <Trees />
      {buildings.map((b) => (
        <Building key={b.id} building={b} />
      ))}
      <Zone1 />
      <ReviewPins />
      {walkMode ? <WalkMode /> : <CameraRig />}
    </>
  );
}
