// File GẮN KẾT do Claude giữ — các luồng song song KHÔNG sửa file này (đề xuất trong báo cáo nếu cần).
import Environment from './Environment';
import Ground from './Ground';
import Trees from './Trees';
import WindClock from './nature/WindClock';
import Grass from './nature/Grass';
import FallingLeaves from './nature/FallingLeaves';
import StreetProps from './street/StreetProps';
import Building from './Building';
import Zone1 from './zone1/Zone1';
import Zone2Walkways from './zone2/Zone2Walkways';
import Block8Details from './details/Block8Details';
import CameraRig from './CameraRig';
import ReviewPins from './ReviewPins';
import WalkMode from './walk/WalkMode';
import InteriorScene from './interior/InteriorScene';
import CampusNpcs from './npc/CampusNpcs';
import SilverStage from './silver/SilverStage';
import SnowParticles from './snow/SnowParticles';
import SnowCinematicCamera from './snow/SnowCinematicCamera';
import ExploreLayer from './explore/ExploreLayer';
import PhotoCaptureBridge from './explore/PhotoCaptureBridge';
import TimelineMissionBeacon from './timeline/TimelineMissionBeacon';
import { campus } from '../data';
import { useWalkStore } from '../store/useWalkStore';

export default function Campus() {
  const { buildings } = campus;
  const walkMode = useWalkStore((s) => s.walkMode);
  const inInterior = useWalkStore((s) => s.interior !== null);

  // Bên trong tòa nhà (T12): chỉ render nội thất + nhân vật, ẩn toàn bộ khuôn viên cho nhẹ.
  if (inInterior) {
    return (
      <>
        <PhotoCaptureBridge />
        <InteriorScene />
        <TimelineMissionBeacon />
        <WalkMode />
      </>
    );
  }

  return (
    <>
      <PhotoCaptureBridge />
      <Environment />
      <Ground />
      <Trees />
      <WindClock />
      <Grass />
      <FallingLeaves />
      <StreetProps />
      {buildings.map((b) => (
        <Building key={b.id} building={b} />
      ))}
      <Zone1 />
      <Zone2Walkways />
      <Block8Details />
      <ExploreLayer />
      <ReviewPins />
      <CampusNpcs />
      <SilverStage />
      {walkMode ? <WalkMode /> : <CameraRig />}
      <SnowParticles />
      <SnowCinematicCamera />
    </>
  );
}
