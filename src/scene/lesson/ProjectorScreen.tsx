import { useEffect, useMemo } from 'react';
import { AdditiveBlending, CanvasTexture, DoubleSide, PlaneGeometry, Quaternion, SRGBColorSpace, Vector3, ConeGeometry } from 'three';
import { getClassroom } from '../../data';
import { getCurrentStep, useLessonStore } from '../../store/useLessonStore';
import type { Slide } from '../../types';
import { B11_ROTATION_Y } from '../interior/layouts/b11';
import { drawSlide, SLIDE_H, SLIDE_W } from './slideCanvas';

/** Slide cần hiện: slide hiện tại ở pha lecture, ngoài ra null (bìa). */
function currentSlide(): Slide | null {
  const s = useLessonStore.getState();
  if (s.phase !== 'lecture') return null;
  const step = getCurrentStep(s);
  return step?.type === 'lecture' ? (step.slides[s.slideIndex] ?? null) : null;
}

/** Khoá đổi khi slide đổi → mới vẽ lại texture. */
function slideKey(): string {
  const s = useLessonStore.getState();
  return s.phase === 'lecture' ? `${s.lessonId}:${s.stepIndex}:${s.slideIndex}` : 'cover';
}

/**
 * Màn chiếu 406.B11: mặt phẳng 2.0 × 1.5 áp tường Tây (mặt +u), texture canvas 1024 × 768,
 * cộng vệt sáng mờ (cone cộng sáng) từ máy chiếu. needsUpdate chỉ khi slide đổi (subscribe store, không useFrame).
 */
export default function ProjectorScreen() {
  const room = getClassroom('406.B11');

  const built = useMemo(() => {
    if (!room) return null;
    const canvas = document.createElement('canvas');
    canvas.width = SLIDE_W;
    canvas.height = SLIDE_H;
    const ctx = canvas.getContext('2d');
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;

    const sc = room.projectorScreen;
    const plane = new PlaneGeometry(sc.width, sc.height);
    plane.rotateY(Math.PI / 2); // mặt +z → +x (= +u)

    // Cone: đỉnh ở máy chiếu, đáy phủ màn. Trục cone mặc định đỉnh +y → xoay (0,−1,0) về hướng chiếu.
    const pj = room.projector;
    const apex = new Vector3(pj.u - pj.size[0] / 2, pj.y, pj.v);
    const target = new Vector3(sc.u + 0.03, sc.bottom + sc.height / 2, sc.v);
    const dir = target.clone().sub(apex);
    const len = dir.length();
    dir.divideScalar(len);
    const cone = new ConeGeometry(1.1, len, 24, 1, true);
    const quat = new Quaternion().setFromUnitVectors(new Vector3(0, -1, 0), dir);
    const conePos = apex.clone().addScaledVector(dir, len / 2);

    return {
      ctx,
      texture,
      plane,
      cone,
      quat: quat.toArray() as [number, number, number, number],
      conePos: conePos.toArray() as [number, number, number],
      screenPos: [sc.u + 0.012, sc.bottom + sc.height / 2, sc.v] as [number, number, number],
    };
  }, [room]);

  useEffect(() => {
    if (!built?.ctx) return;
    const { ctx, texture } = built;
    let lastKey = '';
    const refresh = () => {
      const key = slideKey();
      if (key === lastKey) return;
      lastKey = key;
      drawSlide(ctx, currentSlide());
      texture.needsUpdate = true;
    };
    refresh();
    const unsub = useLessonStore.subscribe(refresh);
    return () => {
      unsub();
      texture.dispose();
      built.plane.dispose();
      built.cone.dispose();
    };
  }, [built]);

  if (!built) return null;
  return (
    <group rotation-y={B11_ROTATION_Y}>
      <mesh geometry={built.plane} position={built.screenPos}>
        <meshBasicMaterial map={built.texture} toneMapped={false} />
      </mesh>
      <mesh geometry={built.cone} position={built.conePos} quaternion={built.quat} renderOrder={2}>
        <meshBasicMaterial
          color="#bcd8ff"
          transparent
          opacity={0.05}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
