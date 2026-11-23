import { useEffect, useMemo } from 'react';
import { CanvasTexture, PlaneGeometry, SRGBColorSpace } from 'three';
import type { Classroom } from '../../types';
import type { ClassSignal } from '../../types/silverWorld';
import { rotationYOf } from '../silver/frame';
import { drawSlide, SLIDE_H, SLIDE_W } from './slideCanvas';

export interface ProjectorScreenProps {
  room: Classroom;
  getSignal: () => ClassSignal;
  subscribe: (listener: () => void) => () => void;
  crowd?: number;
}

/**
 * Màn TV / màn chiếu lớp học: mặt phẳng áp tường, texture canvas 1024 × 768.
 * Kích thước và hướng quay lấy theo room.projectorScreen.
 * Nhận tín hiệu ClassSignal từ getSignal/subscribe (không import useLessonStore).
 */
export default function ProjectorScreen({ room, getSignal, subscribe }: ProjectorScreenProps) {
  const built = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = SLIDE_W;
    canvas.height = SLIDE_H;
    const ctx = canvas.getContext('2d');
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;

    const sc = room.projectorScreen;
    const plane = new PlaneGeometry(sc.width, sc.height);

    // Xoay mặt phẳng theo facing của projectorScreen
    // Mặc định mặt phẳng PlaneGeometry có normal +Z trong local space.
    // Góc xoay quanh Y để normal trỏ theo [sc.facing[0], sc.facing[1]] (với facing[0] ↔ u ↔ X, facing[1] ↔ v ↔ Z):
    const facingAngle = Math.atan2(sc.facing[0], sc.facing[1]);
    plane.rotateY(facingAngle);

    const frameRotationY = rotationYOf(room.frame);
    const screenPos: [number, number, number] = [
      sc.u + sc.facing[0] * 0.015,
      sc.bottom + sc.height / 2,
      sc.v + sc.facing[1] * 0.015,
    ];

    return {
      ctx,
      texture,
      plane,
      frameRotationY,
      screenPos,
    };
  }, [room]);

  useEffect(() => {
    if (!built?.ctx) return;
    const { ctx, texture } = built;
    let lastKey = '';
    const refresh = () => {
      const sig = getSignal();
      const slide = sig.slide;
      const cover = sig.cover;
      const key = `${sig.stepKey}:${cover.title}:${cover.subtitle}:${slide?.title ?? ''}:${slide?.body ?? ''}:${slide?.code ?? ''}`;
      if (key === lastKey) return;
      lastKey = key;
      drawSlide(ctx, { slide, cover });
      texture.needsUpdate = true;
    };
    refresh();
    const unsub = subscribe(refresh);
    return () => {
      unsub();
      texture.dispose();
      built.plane.dispose();
    };
  }, [built, getSignal, subscribe]);

  if (!built) return null;
  return (
    <group rotation-y={built.frameRotationY}>
      <mesh geometry={built.plane} position={built.screenPos}>
        <meshBasicMaterial map={built.texture} toneMapped={false} />
      </mesh>
    </group>
  );
}
