import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { Color, Object3D, type InstancedMesh } from 'three';

type Triple = [number, number, number];

export interface StaticInstance {
  position: Triple;
  scale: Triple;
  rotation?: Triple;
  color?: string;
}

interface Props {
  items: readonly StaticInstance[];
  children: ReactNode;
  pickable?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

const noRaycast = () => {};

/** Chỉ cập nhật ma trận khi bố cục đổi. Geometry và material do caller gắn vào batch. */
export default function StaticInstances({ items, children, pickable, castShadow, receiveShadow }: Props) {
  const ref = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const transform = new Object3D();
    const color = new Color();
    items.forEach((item, i) => {
      transform.position.set(...item.position);
      transform.scale.set(...item.scale);
      transform.rotation.set(...(item.rotation ?? [0, 0, 0]));
      transform.updateMatrix();
      mesh.setMatrixAt(i, transform.matrix);
      if (item.color) mesh.setColorAt(i, color.set(item.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, items.length]}
      raycast={pickable ? undefined : noRaycast}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      {children}
    </instancedMesh>
  );
}
