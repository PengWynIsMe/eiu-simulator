import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useExploreStore } from '../../store/useExploreStore';

export default function PhotoCaptureBridge() {
  const { gl, scene, camera } = useThree();
  const photoRequestId = useExploreStore((s) => s.photoRequestId);
  const lastHandledRef = useRef(0);

  useEffect(() => {
    if (photoRequestId === 0 || photoRequestId === lastHandledRef.current) return;
    lastHandledRef.current = photoRequestId;
    gl.render(scene, camera);
    try {
      const dataUrl = gl.domElement.toDataURL('image/png');
      useExploreStore.getState().setCapturedPhoto(dataUrl);
    } catch {
      useExploreStore.getState().showToast({
        vi: 'Không thể chụp ảnh trên trình duyệt này.',
        en: 'Unable to capture snapshot in this browser.',
      });
    }
  }, [photoRequestId, gl, scene, camera]);

  return null;
}
