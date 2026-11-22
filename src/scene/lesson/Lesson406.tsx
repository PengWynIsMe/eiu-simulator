import { useWalkStore } from '../../store/useWalkStore';
import Classroom406 from './Classroom406';
import ProjectorScreen from './ProjectorScreen';
import Teacher from './Teacher';

/** Gom phòng 406 + màn chiếu + thầy. Chỉ render khi người chơi ở B11 tầng 4 (Teacher tự kiểm riêng cho mixer). */
export default function Lesson406() {
  const active = useWalkStore((s) => s.interior?.buildingId.toLowerCase() === 'b11' && s.interior.floor === 4);
  if (!active) return null;
  return (
    <>
      <Classroom406 />
      <ProjectorScreen />
      <Teacher />
    </>
  );
}
