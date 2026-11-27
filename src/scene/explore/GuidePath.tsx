import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ExtrudeGeometry, InstancedMesh, Matrix4, MeshStandardMaterial, Object3D, Shape } from 'three';
import { useExploreStore } from '../../store/useExploreStore';
import { useWalkStore } from '../../store/useWalkStore';
import { getGroundHeight } from '../walk/groundHeight';

const MAX_DASHES = 120;
const DASH_STEP = 3.4;
const ARRIVE_RADIUS = 4.5;
const NO_RAYCAST = () => undefined;

/** Tạo mũi tên chữ V (chevron) 3D mỏng, mũi nhọn hướng theo trục +Z sau khi xoay nằm ngang. */
function createChevronGeometry(): ExtrudeGeometry {
  const shape = new Shape();
  shape.moveTo(0, 0.44);
  shape.lineTo(0.56, -0.14);
  shape.lineTo(0.36, -0.32);
  shape.lineTo(0, 0.06);
  shape.lineTo(-0.36, -0.32);
  shape.lineTo(-0.56, -0.14);
  shape.closePath();

  const geo = new ExtrudeGeometry(shape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 1,
  });
  geo.rotateX(Math.PI / 2);
  geo.translate(0, 0.055, 0);
  geo.computeVertexNormals();
  return geo;
}

export default function GuidePath() {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const mat4 = useMemo(() => new Matrix4(), []);

  const geo = useMemo(() => createChevronGeometry(), []);

  const mat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#fde047',
        emissive: '#f59e0b',
        emissiveIntensity: 0.85,
        roughness: 0.3,
        transparent: true,
        opacity: 0.94,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      geo.dispose();
      mat.dispose();
    };
  }, [geo, mat]);

  useFrame((state) => {
    const inst = meshRef.current;
    if (!inst) return;

    const es = useExploreStore.getState();
    const navTarget = es.navTarget;
    if (!navTarget) {
      if (inst.count !== 0) {
        inst.count = 0;
        inst.visible = false;
      }
      return;
    }

    const ws = useWalkStore.getState();
    const sx = ws.walkMode ? ws.playerPos.x : 244;
    const sz = ws.walkMode ? ws.playerPos.z : -28;
    const tx = navTarget.pos[0];
    const tz = navTarget.pos[1];

    const dx = tx - sx;
    const dz = tz - sz;
    const dist = Math.hypot(dx, dz);

    if (ws.walkMode && !es.shuttleActive && dist <= ARRIVE_RADIUS) {
      es.clearNavTarget();
      es.showToast({
        vi: `Đã tới nơi: ${navTarget.label.vi}`,
        en: `Arrived at: ${navTarget.label.en}`,
      });
      inst.count = 0;
      inst.visible = false;
      return;
    }

    if (dist < 1.5) {
      inst.count = 0;
      inst.visible = false;
      return;
    }

    inst.visible = true;
    const ux = dx / dist;
    const uz = dz / dist;
    const yaw = Math.atan2(ux, uz);
    const elapsed = state.clock.elapsedTime;
    const phase = (elapsed * 3.0) % DASH_STEP;

    let count = 0;
    for (let d = 1.6 + phase; d < dist - 1.8 && count < MAX_DASHES; d += DASH_STEP) {
      const px = sx + ux * d;
      const pz = sz + uz * d;
      // Nâng nhẹ +0.16m so với mặt đất để nằm cao hẳn trên đầu ngọn cỏ
      const py = getGroundHeight(px, pz) + 0.16;
      const pulse = 0.92 + 0.14 * Math.sin(elapsed * 5.2 - count * 0.7);
      dummy.position.set(px, py, pz);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.set(pulse, 1, pulse);
      dummy.updateMatrix();
      mat4.copy(dummy.matrix);
      inst.setMatrixAt(count, mat4);
      count++;
    }

    inst.count = count;
    inst.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geo, mat, MAX_DASHES]} visible={false} raycast={NO_RAYCAST} frustumCulled={false} />;
}
