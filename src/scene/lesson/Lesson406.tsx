import { useMemo } from 'react';
import { getClassroom } from '../../data';
import { useWalkStore } from '../../store/useWalkStore';
import { getLessonSignal, subscribeLessonSignal } from '../../silverWorld/lessonSignal';
import Classroom406 from './Classroom406';
import ProjectorScreen from './ProjectorScreen';
import Teacher from './Teacher';
import ClassroomNpcs from '../npc/ClassroomNpcs';

export interface Lesson406Props {
  sitYOffset?: number;
}

/** Gom phòng 406 + màn chiếu + thầy + bạn học. Chỉ render khi người chơi ở B11 tầng 4. */
export default function Lesson406({ sitYOffset = 0.4 }: Lesson406Props) {
  const active = useWalkStore((s) => s.interior?.buildingId.toLowerCase() === 'b11' && s.interior.floor === 4);
  const room = useMemo(() => getClassroom('406.B11'), []);

  if (!active || !room) return null;

  return (
    <>
      {/* Chiếu sáng tự nhiên phòng máy 406: sáng sủa, trắng tự nhiên như ảnh thật EIU */}
      <ambientLight intensity={1.5} color="#ffffff" />
      <directionalLight position={[92.0, 3.7, -142.0]} intensity={0.9} color="#fffcf5" />
      <Classroom406 />
      <ProjectorScreen room={room} getSignal={getLessonSignal} subscribe={subscribeLessonSignal} />
      <Teacher room={room} getSignal={getLessonSignal} subscribe={subscribeLessonSignal} />
      <ClassroomNpcs room={room} getSignal={getLessonSignal} subscribe={subscribeLessonSignal} sitYOffset={sitYOffset} />
    </>
  );
}
