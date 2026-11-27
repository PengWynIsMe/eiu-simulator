import PoiBeacons from './PoiBeacons';
import GuidePath from './GuidePath';
import CampusShuttle from './CampusShuttle';
import CampusFlora from './CampusFlora';
import OutdoorInteractables from './OutdoorInteractables';

export default function ExploreLayer() {
  return (
    <group>
      <PoiBeacons />
      <GuidePath />
      <CampusShuttle />
      <CampusFlora />
      <OutdoorInteractables />
    </group>
  );
}
