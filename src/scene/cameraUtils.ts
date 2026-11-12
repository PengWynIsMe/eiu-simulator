import { Vector3, Camera } from 'three';
import type { CameraPose } from '../store/useReviewStore';

const _target = new Vector3();

interface ControlsWithTarget {
  getTarget: (out: Vector3) => Vector3;
}

/** Lấy góc camera hiện tại (vị trí + điểm nhìn target của CameraControls) */
export function getCameraPose(controls: unknown, camera: Camera): CameraPose {
  const position: [number, number, number] = [
    camera.position.x,
    camera.position.y,
    camera.position.z,
  ];

  let target: [number, number, number] = [0, 0, 0];
  if (controls && typeof (controls as ControlsWithTarget).getTarget === 'function') {
    (controls as ControlsWithTarget).getTarget(_target);
    target = [_target.x, _target.y, _target.z];
  }

  return { position, target };
}
