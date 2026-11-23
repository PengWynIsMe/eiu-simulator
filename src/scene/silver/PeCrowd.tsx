import { Suspense, useMemo } from 'react';
import { characterConfig } from '../../data';
import CharacterModel from '../characters/CharacterModel';
import { filterBackgroundModels } from './stageFiltering';
import type { WorldSpot } from '../../types/silverWorld';

export interface PeCrowdProps {
  crowd: number;
  target: WorldSpot;
}

interface PeStudentSpec {
  pos: readonly [number, number, number];
  yaw: number;
  clip: 'idle' | 'interact';
  modelUrl: string;
}

/**
 * 4 bạn sinh viên đứng tập thể dục ở sân cỏ (cảnh 1.1/pe theo PLAN-3D & spec 3D-12):
 * - Đứng thành nhóm khởi động trên bãi cỏ gần Han
 * - Clip khởi động có sẵn: interact (khởi động / tập động tác), idle (đứng nghỉ)
 * - Model lấy từ characterConfig.roles.students (đã lọc bỏ các nhân vật cốt truyện)
 */
export default function PeCrowd({ crowd, target }: PeCrowdProps) {
  const count = Math.min(crowd, 4);

  const students = useMemo<PeStudentSpec[]>(() => {
    const models = filterBackgroundModels(characterConfig.roles.students, characterConfig.story);
    if (models.length === 0) return [];

    // 4 vị trí trên bãi cỏ xung quanh đích đến (Han)
    const baseOffsets: readonly [number, number, 'idle' | 'interact'][] = [
      [1.6, 1.6, 'interact'],
      [1.2, -2.2, 'idle'],
      [-1.6, 1.3, 'interact'],
      [-1.8, -1.4, 'idle'],
    ];

    const fallbackModel = models[0] ?? '';
    return baseOffsets.slice(0, count).map(([ox, oz, clip], idx) => {
      const sx = target.x + ox;
      const sz = target.z + oz;
      // Quay mặt về phía trung tâm nhóm (target)
      const yaw = Math.atan2(target.x - sx, target.z - sz);
      const modelUrl = models[idx % models.length] ?? fallbackModel;

      return {
        pos: [sx, 0, sz] as const,
        yaw,
        clip,
        modelUrl,
      };
    });
  }, [count, target]);

  return (
    <>
      {students.map((student, idx) => (
        <group key={`pe-student-${idx}`} position={student.pos} rotation={[0, student.yaw, 0]}>
          <Suspense fallback={null}>
            <CharacterModel url={student.modelUrl} clip={student.clip} />
          </Suspense>
        </group>
      ))}
    </>
  );
}
