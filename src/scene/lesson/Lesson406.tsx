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
      {/* Chiếu sáng tự nhiên phòng máy 406: sáng sủa, trắng tự nhiên như ảnh thật EIU */}
      <ambientLight intensity={1.5} color="#ffffff" />
      <directionalLight position={[92.0, 3.7, -142.0]} intensity={0.9} color="#fffcf5" />
      <Classroom406 />
      <ProjectorScreen />
      <Teacher />
    </>
  );
}
